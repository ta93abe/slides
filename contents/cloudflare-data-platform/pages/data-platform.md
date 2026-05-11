---
layout: section
---

# Cloudflare とは

## CDN？エッジコンピューティング？

---

# Cloudflare Data Platform

Cloudflare の **Cloudflare Data Platform** は、入れる/貯める/使うを 1 つのプラットフォームで提供します。<br>([Announcing the Cloudflare Data Platform: ingest, store, and query your data directly on Cloudflare](https://blog.cloudflare.com/cloudflare-data-platform/))

<v-click>

Cloudflare Data Platform を構成するサービス

- **Pipelines**: ストリーミングイベントインジェストサービス
- **R2 Data Catalog**: Iceberg カタログサービス
- **R2 SQL**: 分散クエリエンジン

</v-click>

<v-click>
<Excalidraw
  drawFilePath="./data-platform-main-components.excalidraw"
  :darkMode="true"
  :background="false"
  class="my-16"
/>
</v-click>

<!--
2025 年 9 月の Birthday Week で発表された Cloudflare Data Platform は、
Pipelines (Ingest)、R2 Data Catalog (Iceberg メタデータ)、R2 SQL (分散クエリ) の
3 コンポーネントから成る。データレイクの ingest / store / query を 1 社で完結
させる宣言で、Cloudflare がデータ層に本格進出した転換点。

加えて 2025 年 12 月に Cloudflare for Government (米国政府向け製品ライン) が
ISMAP に登録され、日本でもエンタープライズ・公共系で使える状況になった。
これまで「Cloudflare はエンプラで使えない」と言われがちだった状況の転換点。

参考: https://www.ismap.go.jp/csm?id=cloud_service_list_detail&sys_id=e0773ab5837f3610aa68c6a8beaad39e
-->

---

# Pipelines - ストリーミングデータインジェスチョン

```bash
wrangler pipelines setup
```

- **Streams** で HTTP / Workers Binding / Logpush からデータを受けます。
- **Pipelines** で SQL 変換を行えます。（変更はできません）
- **Sinks** で `--roll-size` or `--roll-interval` で設定した粒度で自動バッチ化し、R2 / R2 Data Catalog に書き出せます。
- 2025年4月に買収した [Arroyo](https://www.arroyo.dev/) をベースとしています。

<div class="p-4">
    <Excalidraw
      drawFilePath="./cloudflare-pipelines.excalidraw"
      :darkMode="true"
      :background="false"
    />
</div>

<!--
Cloudflare Pipelines より多くの Streams (Sources) に対応している。
Arroyo (アロヨ) はスペイン語で「小川 / 細い水路」を意味する。Apache Flink 相当のサービス。
Pipelines SQL は DataFusion をベースにしている。ドキュメントに使える SQL が書いてある。
-->

---
layout: two-cols-header
---

# R2 — オブジェクトストレージ

```bash
wrangler r2 bucket create < bucket-name >
```

::left::

- **Really Requestable**: エグレスコストがゼロ。ストレージ、Class A (write), Class B (read) も他のプロバイダーより安価。
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
R2 はデータ基盤の置き場所。Parquet / Iceberg のデータファイルが全部ここに入る。
エグレス無料が一番大きい — S3 だと外部に出すたびに 1 GB あたり数セント取られるが、
R2 はどこに出しても無料。マルチクラウドでデータを集約するハブとして機能する。
S3 互換 API があるので、既存の boto3 / dbt-duckdb / DuckDB / Spark から
そのまま触れる。Workers Binding を使えば API キーすら不要で、Worker から
env.BUCKET.put でキー無しに書き込める。
-->

---
layout: two-cols-header
---

# R2 Data Catalog

データを **構造化する** レイヤーです。R2 上の Apache Iceberg テーブルをマネージドで管理します。

```bash
wrangler r2 bucket catalog enable < bucket-name >
```

::left::

- Trino / DuckDB / PyIceberg / Snowflake / Spark / StarRocks などのクライアントから直接クエリ可能
- **Iceberg V2 の機能**はそのまま使える（ACID / Schema evolution / Time travel 等）
- テーブルメンテナンス
  - **Compaction**: `--target-size` で指定したサイズに合わせて Parquet ファイルを集約
  - **Snapshot expiration**: `--older-than-days` で古いスナップショットを削除、`--retain-last` で最低限残す数を指定

::right::

<img src="/check-iceberg-version.png" alt="iceberg_table_format_version=2" class="w-full max-w-full h-auto rounded border border-zinc-700/60 shadow-lg m-4" />

<!--
R2 Data Catalog は Apache Iceberg のメタデータマネージドサービス。
Iceberg REST Catalog API 標準準拠なので、Trino / DuckDB / PyIceberg /
Spark / StarRocks 等のクライアントから直接クエリできる = ベンダーロック
インなし。Snowflake から External Volume + Catalog Integration で
読み書きする構成も組める。
自動コンパクションは小さな Parquet ファイルをバックグラウンドで集約して
クエリ性能を維持する仕組み。手動でコンパクションを書かずに済む。

R2 Data Catalog は Iceberg format-version 2 (V2) ベース。public beta blog の
メタデータ例に "format-version": 2 と明示されている。

【未対応 / 制限事項 (Open Beta 時点で公式 docs に記載のあるもの)】
- Open Table Format は Iceberg 一択。Delta Lake / Hudi は未対応。
- Iceberg V3 機能はテーブル仕様自体が V2 のため対象外:
  - deletion vectors (V2 の position delete files より効率的な行削除)
  - row lineage (行レベルの来歴追跡)
  - column-level default values (データファイル書き換え不要のデフォルト値)
  - VARIANT 型 / Geometry 型などの新規型
- 非デフォルト jurisdiction の R2 バケット (EU / FedRAMP 等) は未対応。
- Pipelines Sink は新規テーブル作成のみ。既存 Iceberg テーブルへの書き込みは不可。
  Sink は作成後の設定変更不可 (削除 → 再作成が必要)。Sink 出力フォーマットは Parquet のみ。
- 自動 compaction の制約: Parquet のみ / 1 テーブル 1 時間あたり 2 GB まで /
  target file size は 64 MB-512 MB の範囲 / snapshot に一度も参照されなかった
  orphan files は対象外 (cleanup には別途エンジン経由の remove_orphan_files が必要)。

【V2 仕様内ではあるが、R2 Data Catalog 側のサポート言及がなく要確認なもの】
- Iceberg Views (CREATE VIEW via REST catalog): 公式に対応の言及なし。外部エンジン
  経由でも動くか保証なし。
- Branches / Tags (V2 の named snapshot refs / parallel branches): REST 仕様上は
  乗るはずだが Cloudflare 側の動作確認情報なし。
- Equality deletes (Flink CDC 系の row-level delete): Position deletes は Spark / Trino
  で動くが、Equality は engine 側依存。
- Materialized views: Iceberg 仕様外 (個別エンジン拡張)。R2 Data Catalog では概念自体が無い。
-->

---

# R2 SQL — 分散クエリエンジン

R2 Data Catalog の Iceberg テーブルに標準 SQL を実行できる、Cloudflare ネイティブの分散クエリエンジンです。[Apache DataFusion](https://github.com/apache/datafusion) をベースにしています。

実行方法
- **Wrangler**
- **HTTP API**

基本的な演算はできますが、JOIN や WINDOW 関数はまだ対応していません。ベータ版で開発真っ只中。

```bash
wrangler r2 sql query "$WAREHOUSE" \
  "SELECT user_id, COUNT(*) AS n FROM default.events
   WHERE __ingest_ts > '2026-05-01' GROUP BY user_id LIMIT 10"
```


<!--
AWS Athena みたいなサービス

MySQL が 8.0 になったとき window 関数が追加された。

R2 SQL は R2 Data Catalog の Iceberg テーブルに対して標準 SQL でクエリを
実行できる Cloudflare ネイティブのクエリエンジン。基盤技術は Apache DataFusion
(Rust) + Arrow (列指向インメモリ) + datafusion-distributed (分散実行) で、
エッジで分散クエリが走る。
スライドのコマンドは wrangler r2 sql query で、WRANGLER_R2_SQL_AUTH_TOKEN を
設定すれば warehouse 名と SQL 文字列を渡すだけで実行できる。Iceberg 側の
__ingest_ts は **Pipelines Sink** が書き込み時に自動付与する取り込みタイムスタンプ
カラム。Iceberg を Spark / Trino 等で直接書く場合は存在しないので、コード例の
WHERE 句が動くのは Pipelines Sink 経由で書かれたテーブルだけ、と前提を補足する。
対応済み: SELECT / WHERE / ORDER BY / LIMIT / GROUP BY / 集約関数 / CTE /
スカラー関数 190+ 種 / 複合型 (struct / array / map) / EXPLAIN。
未対応 (2026 H1 予定): JOIN 全種類 / WINDOW / UNION / サブクエリ / SELECT DISTINCT。
比較対象として Athena は JOIN / WINDOW / サブクエリ全対応の完成されたエンジンで
スキャン量課金 (USD 5/TB) + S3 エグレスがかかる。R2 SQL は Beta 中無料 + R2 エグレス
無料なので、シンプルなフィルタや集約なら現実解。JOIN が要る重いクエリは Snowflake
や DuckDB on Containers にオフロードするハイブリッド構成が現実的。
-->
