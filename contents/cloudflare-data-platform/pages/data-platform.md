---
layout: section
---

# Cloudflare とは

## CDN？エッジコンピューティング？

<!--
Cloudflare と聞くと、CDNの会社でしょという認識がまずあります。
近年ではエッジコンピューティングを始め開発者のためのプラットフォームになってきています。
-->

---

# Cloudflare Data Platform

Cloudflare の **Cloudflare Data Platform** は、入れる/貯める/使うを 1 つのプラットフォームで提供します。<br>([Announcing the Cloudflare Data Platform: ingest, store, and query your data directly on Cloudflare](https://blog.cloudflare.com/cloudflare-data-platform/))

<v-click>
<Excalidraw
  drawFilePath="./data-platform-main-components.excalidraw"
  :darkMode="true"
  :background="false"
  class="my-16"
/>
</v-click>

<!--
そんな中で Cloudflare Data Platform は、2025 年 9 月の Birthday Week で発表された比較的新しいプラットフォームです。

構成は Pipelines・R2 Data Catalog・R2 SQL の 3 つ。
データレイクの「入れる・貯める・使う」を、Cloudflare 1 社で完結させる、という宣言ですね。
データ層への本格進出の転換点と捉えています。

補足として、2025 年 12 月に Cloudflare for Government が ISMAP に登録されました。
「Cloudflare はエンプラ・公共系で使いにくい」と言われがちな状況も、ここで変わり始めています。
組織アカウントが最近出たりして、ようやくというところもあります。https://blog.cloudflare.com/ja-jp/organizations-beta/
-->

---

# [Pipelines](https://developers.cloudflare.com/pipelines/)

```bash
wrangler pipelines setup
```

- 2025年4月に買収した [Arroyo](https://www.arroyo.dev/) をベースとしています。
- [**Streams**](https://developers.cloudflare.com/pipelines/streams/) で HTTP / Workers Binding / Logpush からデータを受けます。
- [**Pipelines**](https://developers.cloudflare.com/pipelines/pipelines/) で SQL 変換を行えます。
- [**Sinks**](https://developers.cloudflare.com/pipelines/sinks/) で `--roll-size` or `--roll-interval` で設定した粒度で自動バッチ化し、R2 / R2 Data Catalog に書き出せます。

<div class="p-4">
    <Excalidraw
      drawFilePath="./cloudflare-pipelines.excalidraw"
      :darkMode="true"
      :background="false"
    />
</div>

<!--
Pipelines はストリーミングインジェストサービスです。

構成は 3 段です。
Streams が HTTP / Workers Binding / Logpush などのソースから受け取り、
Pipelines で SQL 変換、
Sinks でロールサイズかインターバルでバッチ化して R2 / R2 Data Catalog に書き出す。

ベースは 2025 年 4 月に買収した Arroyo です。
スペイン語で「小川」「細い水路」という意味の、Apache Flink 相当のストリーム処理エンジンですね。
SQL は Apache DataFusion ベースです。
-->

---
layout: two-cols-header
---

# [R2](https://developers.cloudflare.com/r2/)

```bash
wrangler r2 bucket create < bucket-name >
```

::left::

- **Really Requestable**: エグレスコストがゼロ。Standard tier 同士で比較するとストレージ・Class A (write)・Class B (read) も他のプロバイダーより安価。
- **Repositioning Records**: S3 互換 API を提供していて、既存のツールや SDK がそのまま使える。
- **Ridiculously Reliable**: 99.999999999% (イレブンナイン) の耐久性、99.9% の可用性。
- **Radically Reprogrammable**: Workers Binding 統合。

::right::

<div
  v-click
  v-motion
  :initial="{ y: 60, opacity: 0 }"
  :enter="{ y: 0, opacity: 1, transition: { duration: 600, ease: [0.16, 1, 0.3, 1] } }"
>
  <Tweet id="1442879872154566658" />
</div>

<!--
R2 はデータ基盤の置き場所です。Parquet も Iceberg も全部ここに入ります。

ポイントは 4 つ。
エグレスコストがゼロ、S3 互換 API、イレブンナインの耐久性、そして Workers Binding 統合。

一番大きいのはやはりエグレス無料です。
マルチクラウドのデータ集約ハブとして R2 を使うのが現実解になります。
-->

---
layout: two-cols-header
---

# [R2 Data Catalog](https://developers.cloudflare.com/r2/data-catalog/)

データを **構造化する** レイヤーです。R2 上の Apache Iceberg テーブルをマネージドで管理します。

```bash
wrangler r2 bucket catalog enable < bucket-name >
```

::left::

- Trino / DuckDB / PyIceberg / Snowflake / Spark / StarRocks などのクライアントから直接クエリ可能
- **Iceberg v2 の機能**はそのまま使える（ACID / Schema evolution / Time travel 等）
- テーブルメンテナンス
  - **Compaction**: `--target-size` で指定したサイズに合わせて Parquet ファイルを集約
  - **Snapshot expiration**: `--older-than-days` で古いスナップショットを削除、`--retain-last` で最低限残す数を指定

::right::

<img src="/check-iceberg-version.png" alt="iceberg_table_format_version=2" class="w-full max-w-full h-auto rounded border border-zinc-700/60 shadow-lg m-4" />

<!--
R2 上の Apache Iceberg テーブルをマネージドで管理してくれるレイヤーです。

Iceberg REST Catalog API 準拠なので、
Trino / DuckDB / PyIceberg / Snowflake / Spark / StarRocks など、好きなクライアントから直接クエリできます。
ベンダーロックインなし。

ACID / Schema evolution / Time travel といった Iceberg v2 の機能はそのまま使えて、
Compaction や Snapshot expiration といったテーブルメンテナンスもマネージドで提供されます。
-->

---

# [R2 SQL](https://developers.cloudflare.com/r2-sql/)

R2 Data Catalog の Iceberg テーブルに標準 SQL を実行できる、Cloudflare ネイティブの分散クエリエンジンです。[Apache DataFusion](https://github.com/apache/datafusion) をベースにしています。

基本的な演算はできますが、JOIN や WINDOW 関数はまだ対応していません。ベータ版で開発真っ只中。

実行方法は [**Wrangler**](https://developers.cloudflare.com/workers/wrangler/) と [**HTTP API**](https://developers.cloudflare.com/r2-sql/query-data/#query-via-api) の 2 つがあります。Web SQL エディターはありません。

```bash
wrangler r2 sql query "$WAREHOUSE" \
  "SELECT user_id, COUNT(*) AS n FROM default.events
   WHERE __ingest_ts > '2026-05-01' GROUP BY user_id LIMIT 10"
```

```bash
curl -X POST \
  "https://api.sql.cloudflarestorage.com/api/v1/accounts/{ACCOUNT_ID}/r2-sql/query/{BUCKET_NAME}" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{
  "query": "SELECT user_id, COUNT(*) AS n FROM default.events
            WHERE __ingest_ts > '2026-05-01'
            GROUP BY user_id LIMIT 10"
}
JSON
```

<!--
R2 Data Catalog の Iceberg テーブルに標準 SQL を投げられる、Cloudflare ネイティブの分散クエリエンジンです。Athenaみたいなもの。
Apache DataFusion ベースで、R2 オブジェクトストレージと同じ Cloudflare のインフラ層の分散コンピュート上で実行されます。

Wrangler か HTTP API から実行できます。

今は JOIN や WINDOW 関数はまだですが、
基本的なフィルタ・集約・GROUP BY は通ります。
ベータでアクティブに機能追加中、というステータスです。
MySQL が 8.0 になって Window関数が使えるようになったあのときの気持ちをもう一度リアルタイムで味わいましょう。
-->
