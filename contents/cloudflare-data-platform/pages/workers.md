---
layout: section
---

# Cloudflare Data Platform <br/>以外の重要なサービス

---

# Cloudflare Workers

全世界 330+ 都市のエッジで動くサーバーレス実行基盤。

特徴:
- **V8 Isolate**: VM コンテナの起動コストが不要、コールドスタートが構造的に発生しない
- **anycast 配置**: ユーザー最寄りのエッジで処理、リージョン設計不要
- **Binding**: SDK / 認証情報なしで env から Cloudflare サービスを直接呼べる (Capability-based)
- **多様な実行起点**: HTTP / Cron Triggers / Queues / Workflows / Service Binding

<!--
Cloudflare Workers の特徴を 4 つに整理:

1. V8 Isolate 実行モデル: コンテナ + VM を毎回起動するのではなく、1 プロセス内で数百〜数千の isolate を切り替える方式。isolate の起動は数 ms 以下、メモリ消費もコンテナ型より 1 桁小さい (公式 docs より)。リクエストごとに VM 起動が要らない設計なので「コンテナ型のコールドスタート」が構造的に発生しない。

2. anycast 配置: 全世界 330+ 都市のエッジに同じコードが展開され、リクエストはユーザー最寄りのノードで処理される。「どのリージョンに置くか」を選ぶ必要がない。

3. Binding: 他のサーバーレス系で典型的な「SDK + 認証情報でクライアントを生成して呼び出す」フローが要らない。wrangler.jsonc に Binding を宣言すると env.X.method() で呼べる。Capability-based セキュリティモデルで、宣言されていないリソースには触る手段が無い (構造的に最小権限)。

4. 多様な実行起点: HTTP リクエストが基本だが、Cron Triggers (スケジュール実行)、Queues (非同期メッセージング)、Workflows (durable な長時間処理)、Service Binding (別 Worker からの直接呼び出し)、Email Workers なども使える。

本セクションでは Data Platform の orchestrator として位置付ける: Pipelines への ingest、R2 Data Catalog の操作、R2 SQL の呼び出しを 1 つの Worker に集約できる、というのを次の Binding スライドで具体的に見せる。
-->

---

## Binding

`wrangler.jsonc` (設定ファイル) に宣言するだけで、Worker の `env` から Cloudflare サービスを JavaScript オブジェクトとして直接呼べる。SDK / 認証情報設定はいらない。

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

Cloudflare ドキュメントでは Capability-based という表現が使われている。

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

具体的にどのサービスが Binding 対応かは公式 docs を案内する方針 (一覧は登壇本筋から
外れる)。話す時にカテゴリ感だけ持っておく: ストレージ系 (R2 / D1 / KV / Analytics
Engine)、コンピュート系 (Durable Objects / Service Binding / Queues / Workflows /
Sandbox / Containers)、データ・AI 系 (Pipelines / Workers AI / Vectorize / Hyperdrive)。

実例として: Webhook を受ける Worker 1 ファイルで env.BUCKET.put (R2) → env.DB.prepare
(D1) → env.PIPELINE.send (Pipelines) を直列に呼べば、データ取り込みパイプラインの
ミニマル形が完成する。LLM 推論 Worker でも env.AI.run の第 3 引数に gateway オプションを
渡すだけで AI Gateway を経由でき、DLP / セマンティックキャッシュ / メタデータが自動で
効く。データ系も AI 系も同じ Worker 1 ファイルに同居できる = orchestrator として機能する
根拠、と説明できる。
-->

---

## Static Assets

HTML / CSS / JavaScript / 画像などの静的アセットを Cloudflare Workers から配信できる。dbt docs のような静的サイトをそのままホストできる。

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

Cloudflare Access を組み合わせれば認証付きの限定配信にもできる。

<img
    v-motion
    :initial="{ opacity: 0, y: 80 }"
    :click-1="{ opacity: 1, y: 0 }"
     src="/cloudflare-access.png" alt="Cloudflare Access" class="my-8 w-80 ml-auto" />

<!--
Static Assets は HTML / CSS / JS / 画像などをそのまま Workers から配信する仕組み。
dbt docs / Storybook / Astro 等で生成した静的サイトのホスト先として向いている。
GitHub Actions の wrangler-action@v3 を使えば deploy が 1 行で済む。
Cloudflare Access (Zero Trust 製品) を前段に挟むと認証ゲートを掛けられ、社内
ドキュメントの限定配信に使える。Free プランは小規模 (現時点では 50 ユーザー
まで無料) で個人 / チーム用途に向く。料金は変動するので Cloudflare の料金ページ
を案内する。
-->
