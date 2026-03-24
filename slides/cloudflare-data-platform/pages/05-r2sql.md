---
layout: section
---

# Part 5

## R2 SQL — Athena になれるか？

---

# R2 SQL とは

Apache DataFusion（Rust 製）ベースの分散クエリエンジン

```bash
wrangler r2 sql execute --warehouse my-warehouse \
  "SELECT event_type, COUNT(*) as cnt
   FROM default.events
   GROUP BY event_type
   ORDER BY cnt DESC
   LIMIT 10"
```

- R2 上の Iceberg テーブルに直接 SQL
- 3段階のメタデータプルーニングで高速
- **Beta 中は無料**

---

# 2026年3月の大型アップデート

1ヶ月前まで SELECT + WHERE くらいしかできなかった

<v-click>

**2026年3月23日に一気に追加されたもの:**

- CTE（WITH ... AS）
- CASE / CAST
- スカラー関数 **163種**
- 集約関数 **33種**（variance, stddev, correlation...）
- 近似集約（approx_distinct, approx_percentile...）
- 複合型（struct / array / map）
- EXPLAIN

</v-click>

<v-click>

> DataFusion のほぼ全機能を解放した、と公式が明言

</v-click>

---

# でも、JOIN がない

これが **すべて** を変える

```sql
-- これが書けない
SELECT
  o.order_id,
  c.customer_name,
  p.product_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
```

<v-click>

**つまり:**
- dbt のモデルが動かない（ほぼ全部 JOIN してる）
- スタースキーマが作れない
- ファクトとディメンションを結合できない
- **データエンジニアの仕事の 80% ができない**

</v-click>

---

# R2 SQL vs Athena — 正直な比較

| 機能 | Athena | R2 SQL |
|---|:---:|:---:|
| SELECT / WHERE / GROUP BY | ✅ | ✅ |
| CTE（WITH） | ✅ | ✅（同一テーブル制約） |
| 関数 200種 | ✅ | ✅（196種） |
| **JOIN** | ✅ | **❌** |
| **WINDOW 関数** | ✅ | **❌** |
| **サブクエリ** | ✅ | **❌** |
| **UNION** | ✅ | **❌** |
| **INSERT / CTAS** | ✅ | **❌ 読取専用** |
| UDF | ✅ Lambda | **❌**（H1 2026予定） |
| テーブル数/クエリ | 制限なし | **1テーブル** |

---

# R2 SQL の現実的な使い方

**できること**: 単一テーブルのフィルタ + 集計

```sql
-- これは快適に動く
SELECT
  date_trunc('day', timestamp) as day,
  event_type,
  COUNT(*) as count,
  AVG(duration) as avg_duration
FROM default.events
WHERE timestamp > '2026-03-01'
GROUP BY 1, 2
ORDER BY 1, 2
```

**JOIN が必要なら → DuckDB を使う**

```sql
-- 手元の DuckDB で R2 の Parquet を JOIN
SELECT o.*, c.name
FROM read_parquet('s3://my-bucket/orders/*.parquet') o
JOIN read_parquet('s3://my-bucket/customers/*.parquet') c
  ON o.customer_id = c.id
```

---

# R2 SQL の正直な評価

> 現時点での正直な評価:
> **Snowflake / BigQuery / Athena の代替にはならない。**
>
> ただし「R2にデータを貯めて、クエリは好きなエンジンで」
> という使い方なら **今すぐ実用的**。

<v-click>

### R2 SQL が「使い物になる」条件

1. **JOIN の実装**（H1 2026 開発中）
2. WINDOW 関数
3. 書き込み対応（CTAS）
4. GA リリース

JOIN さえ来れば世界が変わる。来なければ DuckDB で十分。

</v-click>
