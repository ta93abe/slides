---
layout: section
---

# Part 12

## まとめ

---

# 3行まとめ

<v-clicks>

1. **R2（エグレス $0）は今すぐ使える。** S3 の代わりにデータレイクとして採用する価値がある

2. **R2 SQL は JOIN が来るまで DuckDB で代替。** 来たら Athena キラーになる可能性

3. **個人〜30人なら $5〜50/月。** 30人超はまだ Snowflake が必要

</v-clicks>

---

# 明日やること

<v-clicks>

### 今すぐ
- `wrangler r2 bucket create` でデータレイクを作る
- 手元の DuckDB から R2 の Parquet をクエリしてみる

### 1週間で
- Pipelines でイベントログの取り込みを試す
- dlt で SaaS API のデータを R2 に入れる
- Evidence でダッシュボードを作る

### 待つ
- R2 SQL の JOIN 対応（H1 2026）
- Containers の GA
- R2 のバージョニング

</v-clicks>
