/**
 * 暗号まわりの確かめ。ここが違っていると通知は黙って届かなくなるので、
 * RFC 8291 の試験値そのものと照らし合わせる。
 *   node test/push.test.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const out = mkdtempSync(join(tmpdir(), 'mindeck-push-'))
execFileSync(
  'npx',
  ['tsc', 'src/push.ts', '--ignoreConfig', '--outDir', out, '--module', 'esnext',
   '--target', 'es2022', '--moduleResolution', 'bundler', '--lib', 'es2022,dom', '--skipLibCheck'],
  { stdio: 'inherit' },
)
const { encryptPayload, b64urlToBytes, bytesToB64url } = await import(join(out, 'push.js'))

const V = {
  plaintext: 'When I grow up, I want to be a watermelon',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  authSecret: 'BTBZMqHH6r4Tts7J_aSIgg',
  asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  expected: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
}

const asPubRaw = b64urlToBytes(V.asPublic)
const body = await encryptPayload(
  { endpoint: 'https://example.com/x', keys: { p256dh: V.uaPublic, auth: V.authSecret } },
  V.plaintext,
  {
    serverPrivateJwk: {
      kty: 'EC', crv: 'P-256',
      x: bytesToB64url(asPubRaw.slice(1, 33)),
      y: bytesToB64url(asPubRaw.slice(33, 65)),
      d: V.asPrivate, ext: true, key_ops: ['deriveBits'],
    },
    serverPublicRaw: asPubRaw,
    salt: b64urlToBytes(V.salt),
  },
)

if (bytesToB64url(body) !== V.expected) {
  console.error('RFC 8291 の試験値と一致しません')
  console.error('  expected:', V.expected)
  console.error('  got     :', bytesToB64url(body))
  process.exit(1)
}
console.log('RFC 8291 の試験値と一致しました')
