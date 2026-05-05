---
layout: section
---

# もう一つ重要なサービス

---

# Cloudflare Workers

エッジコンピューティングプラットフォーム。Cloudflare の全世界 250+ ロケーションでコードを実行可能。

---

# Binding — env に注入される「接続済みハンドル」

Worker が Cloudflare のサービスを使う仕組み。`wrangler.jsonc` に **宣言するだけ**で、`env` に「**API + アクセス権**」がペアで注入される。

<div class="grid grid-cols-2 gap-4 mt-4">

<div class="border border-zinc-500/30 rounded p-3 text-sm">

### 一般的な「SDK + 認証」パターン

1. SDK パッケージを install
2. 認証情報を IAM / 環境変数で設定
3. クライアント生成 (region 指定)
4. コマンドを組み立てて送信

```typescript
const client = new Client({ region, creds });
await client.send(new PutCommand({ ... }));
```

</div>

<div class="border border-orange-500/30 rounded p-3 text-sm">

### Workers の Binding

```jsonc
// wrangler.jsonc
"r2_buckets": [
  { "binding": "BUCKET", "bucket_name": "data-lake" }
]
```

```typescript
// src/index.ts
await env.BUCKET.put("file.json", data);
```

SDK 不要 / 認証不要 / region 指定不要

</div>

</div>

<div class="mt-4 grid grid-cols-3 gap-3 text-sm">

<div class="border border-orange-500/30 rounded p-3">

**Capability-based**

Binding が無いリソースには **触る手段がない**。最小権限が構造で担保される

</div>

<div class="border border-orange-500/30 rounded p-3">

**同一ノード参照**

DNS / TLS / HTTP 不要。エッジの **同じノード内**でリソースに到達

</div>

<div class="border border-orange-500/30 rounded p-3">

**宣言的 / 型安全**

`wrangler.jsonc` 1 ファイル。`wrangler types` で `Env` の型を自動生成

</div>

</div>

<!--
Binding は Workers と Cloudflare サービスの接着剤。一般的なクラウド関数では、
SDK をインポートして、認証情報を IAM や環境変数で渡し、クライアントを生成して
コマンドを送る、という 4 ステップが必要。Workers では wrangler.jsonc に宣言した
時点で env オブジェクトに「接続済みハンドル」が直接注入されるので、コード側は
env.BUCKET.put 1 行で済む。違いの根本はセキュリティモデルで、Binding が宣言
されていないリソースには触る手段自体がない、いわゆる Capability-based 設計。
さらに同一ノードからの参照になるので、DNS / TLS のオーバーヘッドもなく
ゼロレイテンシ。これがあるから Worker はデータ基盤の接着剤として機能する。
-->

---

# Binding でつながる主要サービス

<div class="grid grid-cols-3 gap-3 mt-4 text-sm">

<div class="border border-orange-500/30 rounded p-3">

### ストレージ

- **R2** — オブジェクト
- **D1** — SQLite RDB
- **KV** — グローバル KV
- **Analytics Engine** — メトリクス

</div>

<div class="border border-orange-500/30 rounded p-3">

### コンピュート

- **Durable Objects** — ステートフル
- **Service Binding** — Worker 間呼び出し
- **Queues / Workflows**
- **Sandbox / Containers**

</div>

<div class="border border-orange-500/30 rounded p-3">

### データ / AI

- **Pipelines** — ストリーム ingest
- **Workers AI** — LLM / 埋め込み
- **Vectorize** — ベクトル検索
- **Hyperdrive** — Postgres / MySQL 接続プール

</div>

</div>

```typescript
// 取り込み Worker — Webhook → R2 / D1 / Pipelines を 1 ファイルで
export default {
  async fetch(req: Request, env: Env) {
    const data = await req.json();
    await env.BUCKET.put(`raw/${data.id}.json`, JSON.stringify(data));
    await env.DB.prepare("INSERT INTO events VALUES (?, ?)").bind(data.id, data.type).run();
    await env.PIPELINE.send([{ ts: Date.now(), ...data }]);
    return Response.json({ ok: true });
  }
};
```

<!--
Cloudflare の主要サービスはほぼ全て Binding 経由で Worker から呼べる。
データ基盤の文脈では R2 / D1 / Pipelines / Hyperdrive が中核。特に
Hyperdrive を使えば、外部の Postgres / MySQL にも同じパターンで
接続プールごと組み込める。コード例は Webhook 受信から R2 保存・D1 への
構造化挿入・Pipelines への送信までを 5 行で書ける典型で、これが
データ取り込み Worker のミニマル形。Cloudflare Data Platform の
「接着剤」と呼ばれる所以で、ETL の ingest レイヤーが Worker 1 つに収まる。
-->

---

## Static Assets

HTML, CSS, JavaScript 画像などの静的アセットを Cloudflare Workers を使って配信することができます。(dbt docs とか持っていませんか？)

```yml
      - name: Generate dbt docs
        run: dbt docs generate
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

さらに Cloudflare Access を使えば認証を挟むこともできます。(50人まで無料！)

<img
    v-motion
    :initial="{ opacity: 0, y: 80 }"
    :click-1="{ opacity: 1, y: 0 }"
     src="/cloudflare-access.png" alt="Cloudflare Access" class="my-8 w-80 ml-auto" />