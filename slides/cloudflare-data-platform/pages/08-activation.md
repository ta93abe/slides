---
layout: section
---

# データアクティベーション

---

# Zaraz — サーバーサイドタグマネージャー

GTM の代替。タグをブラウザではなく **Cloudflare エッジで実行**。

| | GTM（クライアント） | GTM サーバーサイド | Zaraz |
|---|---|---|---|
| **JS 負荷** | タグごとに増加 | Container タグ1つ | **ほぼゼロ** |
| **インフラ管理** | 不要 | GCP 管理が必要 | **不要** |
| **料金** | 無料 | Cloud Run 課金 | **100万イベント/月無料** |
| **セットアップ** | スニペット追加 | GTM+Cloud Run設定 | **DNS設定だけ** |

<v-click>

### データ基盤との接点

```
ユーザー → Zaraz（エッジ）→ GA4（マーケ用）
                          → Pipelines → R2 Iceberg（分析用）
```

GA4 のサンプリング・保持期間制約に縛られず、生データをデータレイクに蓄積。

</v-click>

---

# BI as Code — Evidence

SQL + Markdown でレポートを書き、静的サイトとしてビルド。

````md
# 月次売上レポート

```sql monthly_sales
SELECT month, sum(revenue) as revenue
FROM orders GROUP BY month ORDER BY month
```

<LineChart data={monthly_sales} x=month y=revenue />
````

<v-clicks>

- Workers Static Assets でホスティング → **追加コスト $0**
- Cloudflare Access で認証 → 社内のみ公開
- Browser Rendering でスクリーンショット → **Slack に自動投稿**

</v-clicks>

---

# Reverse ETL — データを業務SaaSに書き戻す

```
Cron Trigger → Worker → R2 SQL / D1 でクエリ → SaaS API に書き戻し
```

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### ユースケース
<v-clicks>

- CRM 同期（リードスコア → HubSpot）
- 広告オーディエンス → Meta / Google Ads
- 解約予測スコア → Zendesk
- KPI アラート → Slack

</v-clicks>

</div>
<div v-click>

### Census/Hightouch との比較

| | Census等 | Workers |
|---|---|---|
| コネクタ | 200+ | 自前でAPI |
| セットアップ | GUI | コード |
| 料金 | $300〜/月 | **ほぼ $0** |

<div class="text-sm mt-2 op-70">

宛先 2〜3個で API 明確なら Workers で十分

</div>

</div>
</div>
