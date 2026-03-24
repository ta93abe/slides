---
layout: section
---

# Part 10

## 誰が使うべきか

---

# 規模別の推奨

| 規模 | 推奨 | 月額 |
|---|---|---|
| **個人〜5人** | **Cloudflare のみ** | **$5** |
| **5〜30人（エンジニア）** | **Cloudflare + DuckDB** | **$5〜50** |
| **30〜100人（非エンジニア含む）** | Snowflake + CF 周辺 | $500〜 |
| **100人〜** | Snowflake 必須 | $1,000〜 |

<v-click>

### なぜ 30人で線を引くのか

- 30人超 → 部署間の権限管理が必要 → **RBAC がない**
- 30人超 → 非エンジニアが BI を使う → **Tableau 接続がない**
- 30人超 → 監査ログが必要 → **CloudTrail 相当がない**

</v-click>

---

# 個人データ基盤: $5/月の内訳

| コンポーネント | 月額 |
|---|---|
| Workers Paid（必須） | **$5** |
| R2（10GB 無料枠内） | $0 |
| Pipelines | $0（Beta） |
| R2 SQL | $0（Beta） |
| R2 Data Catalog | $0（Beta） |
| Sandbox | $0（Beta） |
| Zero Trust（50ユーザー） | $0 |
| Workers AI（10K Neurons/日） | $0 |
| **合計** | **$5** |

> ⚠️ Beta 中の無料サービスに依存。GA 後の料金は未定。
