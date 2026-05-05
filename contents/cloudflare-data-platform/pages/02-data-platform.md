---
layout: section
---

# Cloudflare Data Platform

<!--
Cloudflare Data Platform は、ingest / store / query を 1 つのプラットフォームで
提供する。R2 を基盤に、Pipelines (ingest)、R2 Data Catalog (Iceberg メタデータ)、
R2 SQL (分散クエリ) の 3 コンポーネントが乗る。この章では基盤の R2 と
3 コンポーネントを 1 枚ずつ見せる。
-->

---

# R2 — オブジェクトストレージ

データを **置く場所**。Parquet / Iceberg のデータファイルがすべてここに入る。

```bash
wrangler r2 bucket create <bucket-name>
```

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

- **Really Requestable**: エグレスコストがゼロ。ストレージ、Class A (write), Class B (read) も他のプロバイダーより安価。
- **Repositioning Records**: S3 互換 API を提供していて、既存のツールや SDK がそのまま使える。
- **Ridiculously Reliable**: 99.999999999% (イレブンナイン) の耐久性、99.9% の可用性。
- **Radically Reprogrammable**: Workers Binding 統合。

</div>

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

# Pipelines — ストリーミング ingest

データを **集める** レイヤー。R2 の Iceberg テーブルへ自動書き込みするサーバーレス取り込みサービス。

```bash
wrangler pipelines create my-pipeline --r2-bucket my-bucket
```

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### 入力 3 種

- **HTTP エンドポイント** — Webhook / アプリから POST
- **Workers Binding** — `env.STREAM.send([events])`
- **Logpush 連携** — Cloudflare 全プロダクトのログを直送

</div>
<div>

### 内部処理

- **SQL 変換** — 取り込み時に WHERE / マスキング
- **exactly-once** 配信保証
- **自動バッチ化** — 50–100 MB で R2 に書き出し
- 内部エンジン: Arroyo (Rust + DataFusion)

</div>
</div>

```sql
-- PII をマスクしながら Iceberg に書き出す
INSERT INTO events_sink
SELECT user_id, event_type,
  REGEXP_REPLACE(email, '(.).*@', '$1***@') AS masked_email,
  now() AS loaded_at
FROM events_stream
WHERE event_type != 'healthcheck'
```

<!--
Pipelines は ETL の E (extract) と L (load) を担当するサーバーレスサービス。
入力は HTTP / Workers Binding / Logpush の 3 つ。Workers Binding 経由なら
ctx.waitUntil(env.STREAM.send(events)) で fire-and-forget。
内部で SQL 変換ができるので、PII マスクや簡単なフィルタを ingest 段階で
適用できる。出力は R2 Data Catalog の Iceberg テーブルに自動書き込み、
exactly-once 配信保証付き。50-100 MB に自動バッチ化されてから R2 に
書き込まれるので、Class A 操作の課金が抑えられる。
Kafka + Flink を自前で組むのと比べて、インフラ運用がゼロ。
内部エンジンは Cloudflare が買収した Arroyo で、Rust の DataFusion ベース。
日次 100 万件規模で月 1 ドル程度。
-->

---

# R2 Data Catalog — Iceberg メタデータ

データを **構造化する** レイヤー。R2 上の Apache Iceberg テーブルをマネージドで管理。

```bash
wrangler r2 bucket catalog enable <bucket-name>
```

- 標準の **Iceberg REST Catalog API** を公開
- Trino / DuckDB / PyIceberg / Spark / StarRocks などのクライアントから直接クエリ可能
- **ACID トランザクション** / **スキーマ進化** / **タイムトラベル**
- **自動コンパクション** 内蔵 — 小さな Parquet ファイルを背景で集約してクエリ性能を維持

<!--
R2 Data Catalog は Apache Iceberg のメタデータマネージドサービス。
Iceberg REST Catalog API 標準準拠なので、Trino / DuckDB / PyIceberg /
Spark / StarRocks 等のクライアントから直接クエリできる = ベンダーロック
インなし。Snowflake から External Volume + Catalog Integration で
読み書きする構成も組める。
自動コンパクションは小さな Parquet ファイルをバックグラウンドで集約して
クエリ性能を維持する仕組み。手動でコンパクションを書かずに済む。
他の Open Table Format (Delta Lake / Hudi) は未対応。Iceberg 一択。
-->

---

# R2 SQL — 分散クエリエンジン

データに **問い合わせる** レイヤー。R2 Data Catalog の Iceberg テーブルに標準 SQL を実行。

基盤技術: **Apache DataFusion** (Rust) + **Arrow** (列指向インメモリ) + **datafusion-distributed** (分散実行)

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### 対応済み

- SELECT / WHERE / ORDER BY / LIMIT
- GROUP BY / 集約関数
- CTE (WITH ... AS)
- スカラー関数 190+ 種
- 複合型 (struct / array / map)
- EXPLAIN

</div>
<div>

### 未対応 (2026 H1 予定)

- **JOIN (全種類)**
- WINDOW 関数
- UNION / サブクエリ / SELECT DISTINCT

<div class="mt-6 border border-yellow-500/30 rounded p-3 text-sm">

**vs Athena**: Athena は JOIN / WINDOW / サブクエリ全対応の完成されたエンジン。R2 SQL は Beta で JOIN すら未対応。<br>
ただし Athena はスキャン量課金 (`$5/TB`) + S3 エグレス。R2 SQL は Beta 中無料。

</div>

</div>
</div>

<!--
R2 SQL は R2 Data Catalog の Iceberg テーブルに対して標準 SQL でクエリを
実行できる Cloudflare ネイティブのクエリエンジン。DataFusion + Arrow +
datafusion-distributed で、エッジで分散クエリが走る。
2026 年のアップデートで 190 種以上のスカラー関数、CTE、複合型対応。
ただし JOIN / WINDOW / サブクエリは未対応で、これらは 2026 年 H1 に予定。
Athena と比べると機能網羅性は低いが、Beta 中は無料、しかも R2 エグレス無料
なので、シンプルなフィルタや集約なら現実解になる。
JOIN が要る重いクエリは Snowflake or DuckDB on Containers にオフロード
するハイブリッド構成が現実的。
-->
