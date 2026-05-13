---
layout: section
---

# Cloudflare Data Platform <br/>以外の重要なサービス

<!--
ここまでが Data Platform の中核 3 つ。
続いて、組み合わせて使う重要なサービスを見ていきます。
-->

---

# [Cloudflare Workers](https://developers.cloudflare.com/workers/)

全世界 330+ 都市のエッジで動くサーバーレス実行基盤です。

特徴:
- **V8 Isolate**: 1 プロセス内で多数の isolate を切り替える実行モデル。VM / コンテナの起動オーバーヘッドが無く、isolate のコールドスタートは ms オーダー
- **Global 配置 + anycast network**: 1 deploy で 330+ 都市のエッジに同一バイナリを自動展開、リクエストは最寄り POP で実行（リージョン指定不要）
- [**Binding**](https://developers.cloudflare.com/workers/runtime-apis/bindings/): `wrangler.jsonc` で宣言したリソースを `env` から呼ぶ。SDK / 認証情報不要、Capability-based セキュリティ（宣言されていないリソースには触れない）
- **多彩なトリガー**: [HTTP](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/) / [Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/) / [Queues](https://developers.cloudflare.com/queues/) / [Workflows](https://developers.cloudflare.com/workflows/) / [Email](https://developers.cloudflare.com/email-routing/email-workers/) / [WebSocket](https://developers.cloudflare.com/workers/runtime-apis/websockets/) / [RPC](https://developers.cloudflare.com/workers/runtime-apis/rpc/) / [Tail](https://developers.cloudflare.com/workers/observability/logs/tail-workers/)
- **Observability**: [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) で invocation / custom / 例外を構造化保存（7 日保管）、OpenTelemetry 対応で外部ツールにエクスポート可能

<!--
Cloudflare Workers は、全世界 330 以上の都市のエッジで動くサーバーレス実行基盤です。

特徴は 4 つあります。
V8 Isolate で起動は ms オーダー、コールドスタートが構造的に発生しない。
Global 配置 + anycast network で、1 deploy で全エッジに自動展開されます。
Binding で他の Cloudflare サービスを呼び出せて、
HTTP / Cron / Queues / Workflows / Email / WebSocket / RPC / Tail と多彩なトリガーに対応します。
-->

---

## Binding

`wrangler.jsonc` (設定ファイル) に宣言するだけで、Worker の `env` オブジェクトから Cloudflare サービスを直接呼べます。SDK / 認証情報設定はいりません。

```jsonc
// wrangler.jsonc — 使うサービスを宣言
"r2_buckets":   [{ "binding": "BUCKET", "bucket_name": "data-lake" }],
"d1_databases": [{ "binding": "DB",     "database_name": "events", "database_id": "..." }],
"ai":            { "binding": "AI" }
```

```typescript
// src/index.ts — env からそのまま呼ぶ
await env.BUCKET.put("raw.json", body);
await env.DB.prepare("INSERT INTO events VALUES (?)").bind(id).run();
await env.AI.run("@cf/meta/llama-3.3-70b-instruct", { messages });
```

Cloudflare ドキュメントでは Capability-based という表現が使われています。

<!--
Worker の特徴で一番効くのが Binding です。

wrangler.jsonc に binding 名と対象サービスを宣言すると、
コード側からは env.BUCKET.put のように 1 行で呼べる。
SDK のインストールも、認証情報の取り回しも、region 指定も不要です。

Cloudflare のドキュメントでは「Capability-based」という表現が使われています。
宣言されていないリソースには触る手段が無い、という最小権限のセキュリティモデルですね。
ただ宣言された以上 Worker でどうにでもできるという危うさもあるといえばあります。
-->

---

## [Static Assets](https://developers.cloudflare.com/workers/static-assets/)

HTML / CSS / JavaScript / 画像などの静的アセットを Cloudflare Workers から配信できます。dbt docs のような静的サイトをそのままホストできます。

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

[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) を組み合わせれば認証付きの限定配信にもできます。

<v-click>
<img
    v-motion
    :initial="{ opacity: 0, y: 80 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
    src="/cloudflare-access.png" alt="Cloudflare Access" class="my-8 w-80 ml-auto" />
</v-click>

<!--
Static Assets は、HTML / CSS / JS / 画像を Workers から配信する仕組みです。
dbt docs のような静的サイトをそのままホストできます。Elementary のレポートや Evidence のダッシュボードも。

GitHub Actions の wrangler-action で deploy が 1 行。GitHub 連携をすればゼロコンフィグで CI/CD が組まれます。
Cloudflare Access を組み合わせれば、社内限定の認証付き配信もできます。
-->
