/**
 * Web Push の送信まわり。
 * 鍵の署名は RFC 8292（VAPID）、本文の暗号化は RFC 8291（aes128gcm）に沿う。
 * WebCrypto だけで書いてあるので Cloudflare Workers でもそのまま動く。
 */

const enc = new TextEncoder()

export function b64urlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function bytesToB64url(b: Uint8Array): string {
  let s = ''
  for (const byte of b) s += String.fromCharCode(byte)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

function u16(n: number): Uint8Array {
  return new Uint8Array([(n >> 8) & 0xff, n & 0xff])
}

function u32(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm as BufferSource, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt as BufferSource, info: info as BufferSource },
    key,
    length * 8,
  )
  return new Uint8Array(bits)
}

/** 圧縮されていない P-256 公開鍵（0x04 + X + Y）を JWK に直す */
function rawPublicToJwk(raw: Uint8Array): JsonWebKey {
  if (raw.length !== 65 || raw[0] !== 0x04) throw new Error('P-256 の公開鍵として読めません')
  return {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToB64url(raw.slice(1, 33)),
    y: bytesToB64url(raw.slice(33, 65)),
    ext: true,
  }
}

export interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/**
 * 本文を aes128gcm で暗号化する。戻り値がそのままリクエストボディになる。
 * testKeys はテスト用。普段は毎回その場で鍵を作る。
 */
export async function encryptPayload(
  sub: PushSubscription,
  payload: string,
  testKeys?: { serverPrivateJwk: JsonWebKey; serverPublicRaw: Uint8Array; salt: Uint8Array },
): Promise<Uint8Array> {
  const uaPublicRaw = b64urlToBytes(sub.keys.p256dh)
  const authSecret = b64urlToBytes(sub.keys.auth)

  let serverPrivate: CryptoKey
  let serverPublicRaw: Uint8Array
  let salt: Uint8Array

  if (testKeys) {
    serverPrivate = await crypto.subtle.importKey(
      'jwk',
      testKeys.serverPrivateJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits'],
    )
    serverPublicRaw = testKeys.serverPublicRaw
    salt = testKeys.salt
  } else {
    const pair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
      'deriveBits',
    ])) as CryptoKeyPair
    serverPrivate = pair.privateKey
    serverPublicRaw = new Uint8Array(
      (await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer,
    )
    salt = crypto.getRandomValues(new Uint8Array(16))
  }

  const uaPublic = await crypto.subtle.importKey(
    'jwk',
    rawPublicToJwk(uaPublicRaw),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  // 型の名前が DOM と Workers で違うだけなので、実行時の形に合わせて渡す
  const ecdh = { name: 'ECDH', public: uaPublic } as unknown as Parameters<
    typeof crypto.subtle.deriveBits
  >[0]
  const shared = new Uint8Array(await crypto.subtle.deriveBits(ecdh, serverPrivate, 256))

  // RFC 8291 3.4: IKM は auth secret を salt にした HKDF から作る
  const keyInfo = concat(
    enc.encode('WebPush: info\0'),
    uaPublicRaw,
    serverPublicRaw,
  )
  const ikm = await hkdf(authSecret, shared, keyInfo, 32)

  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  const aesKey = await crypto.subtle.importKey('raw', cek as BufferSource, 'AES-GCM', false, ['encrypt'])
  // 末尾の 0x02 が「最後のレコード」の印
  const plain = concat(enc.encode(payload), new Uint8Array([0x02]))
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, aesKey, plain as BufferSource),
  )

  // ヘッダ: salt(16) + recordSize(4) + keyIdLength(1) + keyId
  return concat(salt, u32(4096), new Uint8Array([serverPublicRaw.length]), serverPublicRaw, cipher)
}

/** VAPID の Authorization ヘッダを作る */
export async function vapidHeader(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string,
): Promise<string> {
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = bytesToB64url(
    enc.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  )
  const signingInput = `${header}.${claims}`

  const pubRaw = b64urlToBytes(publicKey)
  const jwk = rawPublicToJwk(pubRaw)
  jwk.d = privateKey
  jwk.key_ops = ['sign']

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput)),
  )
  return `vapid t=${signingInput}.${bytesToB64url(sig)}, k=${publicKey}`
}

export interface SendResult {
  ok: boolean
  status: number
  /** 購読が死んでいるので消してよい */
  gone: boolean
}

export async function sendPush(
  sub: PushSubscription,
  payload: { title: string; body: string; tag: string },
  vapid: { publicKey: string; privateKey: string; subject: string },
): Promise<SendResult> {
  const url = new URL(sub.endpoint)
  const body = await encryptPayload(sub, JSON.stringify(payload))
  const auth = await vapidHeader(url.origin, vapid.subject, vapid.publicKey, vapid.privateKey)

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'normal',
    },
    body: body as BodyInit,
  })

  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 }
}

export { concat, u16 }
