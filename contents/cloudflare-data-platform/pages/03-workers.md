---
layout: section
---

# もう一つ重要なサービス

---

# Cloudflare Workers

エッジコンピューティングプラットフォーム。Cloudflare の全世界 250+ ロケーションでコードを実行可能。

---

# Binding — 宣言するだけで env から呼べる

`wrangler.jsonc` に宣言するだけで、Worker の `env` から Cloudflare サービスを直接呼べる。SDK / 認証情報 / region 設定はいらない。

```jsonc
// wrangler.jsonc — 使うサービスを宣言
"r2_buckets":   [{ "binding": "BUCKET", "bucket_name": "data-lake" }],
"d1_databases": [{ "binding": "DB",     "database_name": "events" }],
"ai":            { "binding": "AI" }
```

```typescript
// src/index.ts — env からそのまま呼ぶ
await env.BUCKET.put("raw.json", body);
await env.DB.prepare("INSERT INTO events VALUES (?)").bind(id).run();
await env.AI.run("@cf/meta/llama-3.3-70b-instruct", { messages });
```

宣言 3 行 + 呼び出し 3 行で、ストレージ・DB・AI の連携が完成する。

<!--
Binding は Worker と Cloudflare サービスを直接つなぐ仕組みです。wrangler.jsonc に
binding 名と対象サービスを宣言した瞬間、コード側からは env.BUCKET.put のように
1 行で呼べるようになります。SDK のインストール、認証情報の取り回し、region 指定、
どれも不要。ここでは R2・D1・Workers AI の 3 種類を並べていますが、宣言を増やす
だけで連携が増える、という感覚を持ち帰ってもらえると嬉しいです。
補足として、宣言されていないリソースには触る手段自体が無い (Capability-based)、
同一ノード参照なので DNS / TLS のオーバーヘッドが無い、wrangler types で Env の
型が自動生成されるので IDE 補完が効く、といった性質があり、Worker をデータ基盤の
中核 orchestrator として運用しても破綻しない設計になっています。
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

<div class="grid grid-cols-2 gap-4 mt-4 text-xs">

<div>

**取り込み Worker** — Webhook → R2 / D1 / Pipelines

```typescript
async fetch(req: Request, env: Env) {
  const data = await req.json();
  await env.BUCKET.put(
    `raw/${data.id}.json`, JSON.stringify(data)
  );
  await env.DB.prepare(
    "INSERT INTO events VALUES (?, ?)"
  ).bind(data.id, data.type).run();
  await env.PIPELINE.send(
    [{ ts: Date.now(), ...data }]
  );
  return Response.json({ ok: true });
}
```

</div>

<div>

**LLM 推論 Worker** — Workers AI + AI Gateway

```typescript
async fetch(req: Request, env: Env) {
  const { prompt } = await req.json();
  // env.AI が Workers AI、gateway オプションが AI Gateway
  const ai = await env.AI.run(
    "@cf/meta/llama-3.3-70b-instruct",
    { messages: [{ role: "user", content: prompt }] },
    { gateway: { id: "my-gw", cacheTtl: 3600 } }
  );
  return Response.json(ai);
}
```

</div>

</div>

<!--
Cloudflare の主要サービスはほぼ全て Binding 経由で Worker から呼べる。
取り込み Worker は Webhook 受信から R2 保存・D1 への構造化挿入・Pipelines
送信までを数行で書ける典型で、データ取り込み Worker のミニマル形。
LLM 推論 Worker は env.AI が Workers AI の Binding で、env.AI.run の
第 3 引数の gateway オプションが AI Gateway を介する指示。これだけで全 LLM
呼び出しが Gateway を経由し、DLP / セマンティックキャッシュ / メタデータが
自動で効くようになる。データ系も AI 系も Worker 1 ファイルに収まる、
というのが Cloudflare Data Platform の中核 orchestrator としての位置づけ。
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