---
layout: section
---

# オーケストレーション

---

# Workflows — サーバーレス耐久実行エンジン

Temporal / Step Functions に相当。TypeScript でコードとして定義。

```
Cron Trigger → Worker → Workflow
  Step 1: dlt で SaaS → R2 取込（リトライ: 3回 exponential backoff）
  Step 2: dbt run で変換（10分タイムアウト）
  Step 3: Soda でデータ品質チェック（失敗時: Slack アラート）
  Step 4: Evidence ビルドトリガー
  Step 5: 完了通知
```

<v-clicks>

- **`step.do()`** — 処理ステップ定義。戻り値は自動永続化
- **`step.sleep()`** — 待機（最大365日）
- **`step.waitForEvent()`** — 外部イベント待機（人間の承認フロー）
- **クラッシュ耐性** — 途中から再開（Durable Objects が状態保持）

</v-clicks>
