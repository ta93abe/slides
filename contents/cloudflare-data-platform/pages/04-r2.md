---
layout: section
---

# Storage

---

# Cloudflare R2

```bash
wrangler r2 bucket create < bucket-name >
```

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

- **Really Requestable**: エグレスコストがゼロ。ストレージ、Class A(write), Class B(read) も他のプロバイダーより安価。
- **Repositioning Records**: S3 互換 API を提供していて、既存のツールや SDK がそのまま使える。[マイグレーション機能](https://developers.cloudflare.com/r2/data-migration/)もある。
- **Ridiculously Reliable**: 99.999999999%(イレブンナイン)の耐久性。99.9%の可用性。
- **Radically Reprogrammable**: Workers Binding 統合。
- 「R」と「2」は「S」と「3」の一個前？ https://object-storage-name-generator.com/

</div>
<v-click v-motion
    :initial="{ opacity: 0, y: 80 }"
    :click-1="{ opacity: 1, y: 0 }">

<Tweet id="1442879872154566658" />

</v-click>
</div>

---

# R2 Data Catalog

```bash
wrangler r2 bucket catalog enable < bucket-name >
```

R2 上の Apache Iceberg テーブルのメタデータを管理するカタログサービス。(他の Open Table Format は未対応)

<v-clicks>

- 標準の **Iceberg REST Catalog API** を公開
- Trino / DuckDB / PyIceberg / Spark / StarRocks などのクライアントから直接クエリ可能 (https://developers.cloudflare.com/r2/data-catalog/config-examples/)

</v-clicks>

<v-clicks>

- **ACID トランザクション** / **スキーマ進化** / **タイムトラベル**
- 2025年9月に**自動コンパクション**追加

</v-clicks>

---

## Snowflake からクエリしてみる。

準備: External Volume と Catalog Integration と Catalog-linked Database を作成。



---

# R2 SQL

基盤技術: **Apache DataFusion**（Rust） + **Arrow**（列指向インメモリ）

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### 対応済み
<v-clicks>

- SELECT / WHERE / ORDER BY / LIMIT
- GROUP BY / 集約関数
- CTE（WITH ... AS）
- スカラー関数 190+種
- 複合型（struct / array / map）
- EXPLAIN

</v-clicks>

</div>
<div>

### 未対応（2026 H1 予定）
<v-clicks>

- **JOIN（全種類）**
- WINDOW 関数
- UNION / サブクエリ / SELECT DISTINCT

</v-clicks>

<div v-click class="mt-6 border border-yellow-500/30 rounded p-3 text-sm">

**vs Athena**: Athena は JOIN/WINDOW/サブクエリ全対応の完成されたエンジン。R2 SQL は Beta で JOIN すら未対応。<br>
ただし Athena はスキャン量課金（$5/TB）+ S3 エグレス。R2 SQL は Beta 中無料。

</div>

</div>
</div>
