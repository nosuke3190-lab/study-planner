/* VAPID の鍵を作る。公開鍵はアプリの設定画面に、秘密鍵は wrangler secret に入れる */
const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
  'sign',
  'verify',
])
const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))
const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey)

const b64url = (b) => Buffer.from(b).toString('base64url')

console.log('公開鍵（アプリの設定画面に貼る）')
console.log(b64url(pub))
console.log()
console.log('秘密鍵（誰にも見せない。次のコマンドで登録する）')
console.log(jwk.d)
console.log()
console.log('  npx wrangler secret put VAPID_PRIVATE_KEY')
console.log('  npx wrangler secret put VAPID_PUBLIC_KEY')
