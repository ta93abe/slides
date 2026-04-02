---
layout: section
---

# ストレージ

---

# Cloudflare R2 — エグレス無料のオブジェクトストレージ

<div class="grid grid-cols-2 gap-8">
<div>

<v-clicks>

- **S3 互換 API** — 既存ツール・SDK がそのまま使える
- **エグレス永久無料** — データ読み出しに転送料金ゼロ
- **Workers Binding** — `env.BUCKET.put()` で直接アクセス
- **Data Catalog 統合** — Iceberg カタログをワンコマンド有効化
- **イベント通知** — 書き込みをトリガーにワークフロー起動

</v-clicks>

</div>
<div v-click>

### 料金

| 項目 | 料金 |
|------|------|
| ストレージ | $0.015/GB/月 |
| 書き込み (Class A) | $4.50/百万 |
| 読み取り (Class B) | $0.36/百万 |
| **エグレス** | **$0（永久無料）** |

<div class="mt-4 text-sm op-70">

Snowflake/DuckDB/Spark が何度読んでもコスト $0

</div>

</div>
</div>

---

# R2 Data Catalog — Iceberg カタログ

R2 上の Apache Iceberg テーブルのメタデータを管理するカタログサービス。

<v-clicks>

- 標準の **Iceberg REST Catalog API** を公開
- Spark・Snowflake・Trino・DuckDB・PyIceberg から接続可能

</v-clicks>

<div v-click class="mt-4">

```
my-bucket/
└── warehouse/
    └── analytics/              ← namespace
        └── page_views/         ← table
            ├── metadata/       ← スキーマ・スナップショット
            └── data/           ← Parquet ファイル群
```

</div>

<v-clicks>

- **ACID トランザクション** / **スキーマ進化** / **タイムトラベル**
- セットアップは1コマンド: `wrangler r2 bucket catalog enable my-bucket`
- 2025年12月に**自動コンパクション**追加

</v-clicks>

---

# R2 SQL — エッジで分析が完結する分散クエリエンジン

基盤技術: **Apache DataFusion**（Rust） + **Arrow**（列指向インメモリ）

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### 対応済み
<v-clicks>

- SELECT / WHERE / ORDER BY / LIMIT
- GROUP BY / 集約関数（33種）
- CTE（WITH ... AS）
- スカラー関数 163種
- 複合型（struct / array / map）
- EXPLAIN

</v-clicks>

</div>
<div>

### 未対応（2026 H1 予定）
<v-clicks>

- **JOIN（全種類）**
- WINDOW 関数
- UNION / サブクエリ

</v-clicks>

<div v-click class="mt-6 border border-yellow-500/30 rounded p-3 text-sm">

**正直な評価**: JOIN 未対応のため Snowflake/BigQuery の代替にはならない。<br>
「R2 に貯めて手軽に探索する」用途なら今すぐ実用的。Beta 中は無料。

</div>

</div>
</div>
