---
layout: section
---

# まとめ

---

# AWS と比べて — 正直な評価

| 領域 | Cloudflare が勝つ | AWS が勝つ |
|------|-----------------|-----------|
| **コスト** | エグレス $0、Beta 中は多くが無料 | 従量課金が複雑だが予測可能 |
| **DX** | Wrangler 1つで統合、Binding でコード簡潔 | IaC エコシステム（CDK/CFn）が成熟 |
| **セキュリティ** | Capability-based で設定ミスしにくい | IAM で fine-grained に制御可能 |
| **クエリエンジン** | R2 SQL は Beta、JOIN 未対応 | Athena/Redshift は完成されたエンジン |
| **AI** | エッジ推論 + AI Gateway が独自 | Bedrock のモデル選択肢・fine-tuning |
| **オブザーバビリティ** | 自動トレース（コード変更ゼロ） | CloudWatch の統合ダッシュボード |
| **エコシステム** | まだ小さい | 圧倒的に広い |

<div v-click class="mt-4 border border-orange-500/30 rounded-lg p-4 text-center">

**結論**: AWS の代替ではなく**補完**。<br>
R2 をエグレス無料のデータハブにして、AWS/Snowflake から Iceberg 経由で読む。<br>
インジェストとエッジ配信は Cloudflare、重い分析は既存エンジンに任せる。

</div>

---
layout: end
---

# Thank you

Cloudflare で始める Data Platform
