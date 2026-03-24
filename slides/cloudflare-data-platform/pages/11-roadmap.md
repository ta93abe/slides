---
layout: section
---

# Part 11

## ロードマップ — JOIN が来たら世界が変わる

---

# H1 2026 ロードマップ（公式）

| 機能 | 影響度 | 状態 |
|---|:---:|---|
| **R2 SQL JOIN** | 🔴 最高 | 開発中 |
| **Pipelines ステートフル処理** | 🔴 最高 | 開発中 |
| Logpush → R2 Data Catalog | 🟠 高 | 開発中 |
| Workers UDF | 🟡 中 | 開発中 |
| Containers GA | 🟠 高 | 予定 |

---

# JOIN が来たら何が変わるか

<v-clicks>

1. **dbt が動く** → R2 SQL をアダプターにしたモデリング
2. **スタースキーマが作れる** → ファクト + ディメンションの結合
3. **「Athena の代替」と言える** → 実用的なクエリエンジンに昇格
4. **Snowflake が要らないケースが増える** → 小〜中規模なら完結

</v-clicks>

<v-click>

### JOIN が来なかったら？

→ DuckDB で十分。R2 SQL の存在意義は薄い。

</v-click>
