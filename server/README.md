# Mindeck の通知サーバー

アプリを閉じている間に通知を届けるための中継です。ブラウザだけでは決めた時刻に
自分で鳴ることができないので、外から Web Push を送る役がいります。

Cloudflare Workers の無料枠で動きます。使うのは Workers 本体と KV だけです。

## 仕組み

1. アプリが購読情報と「いつ・何を出すか」の予定をここに預けます。
2. Worker が 1 分ごとに起きて、時刻が来た分だけ端末へ Push を送ります。
3. アプリを開くたびに予定を送り直すので、サーバー側に日付の計算はありません。
   くり返しの予定はアプリ側で 60 日分に展開してから渡します。

本文は RFC 8291 の方式で暗号化して送ります。Cloudflare も、通信を覗いた誰かも、
中身は読めません。`npm test` が RFC の試験値と突き合わせて確かめます。

## 立てかた

```bash
cd server
npm install

# 1. 鍵を作る（公開鍵と秘密鍵が出ます）
npm run keys

# 2. 予定の置き場を作る。出てきた id を wrangler.toml に書く
npx wrangler kv namespace create SUBS

# 3. wrangler.toml の id・VAPID_SUBJECT・ALLOWED_ORIGIN を埋める
#    ALLOWED_ORIGIN は https://<あなたの名前>.github.io

# 4. 鍵を登録する
npx wrangler secret put VAPID_PRIVATE_KEY   # 1 で出た秘密鍵
npx wrangler secret put VAPID_PUBLIC_KEY    # 1 で出た公開鍵

# 5. 公開する
npm run deploy
```

最後に出てくる `https://mindeck-push.<なにか>.workers.dev` と、1 で出た公開鍵を
アプリの「設定 → 閉じている間の通知」に貼り、「この端末で受け取る」を押します。

## 確かめかた

```bash
npm test            # 暗号化が RFC 8291 どおりか
curl https://<あなたの Worker>/health
```

## 受け口

| 道 | すること |
| --- | --- |
| `POST /subscribe` | 購読と予定をまとめて預ける |
| `POST /schedule` | 予定だけ入れ替える |
| `POST /unsubscribe` | 購読を消す |
| `GET /health` | 生きているか見る |

端末が購読を捨てていた場合（404 か 410 が返る）、その記録は自動で消えます。

## お金

1 分ごとの cron は 1 か月およそ 43,200 回です。Workers の無料枠は 1 日 10 万
リクエストなので、ひとりで使うぶんには収まります。
