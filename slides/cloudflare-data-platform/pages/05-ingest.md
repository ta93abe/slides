---
layout: section
---

# インジェスト

---

# Pipelines — サーバーレスストリーミングインジェスト

**Stream → Pipeline（SQL変換）→ Sink** の3コンポーネント構成

内部エンジン: Cloudflare が買収した **Arroyo**（Rust製ストリーム処理）

<v-clicks>

- **2つの入力**: HTTP エンドポイント / Workers Binding
- **SQL 変換**: フィルタ・正規化・PII マスキングを適用
- **Exactly-once 配信**: 重複・欠損なし
- **Iceberg 自動管理**: JSON → Parquet 変換・パーティショニング自動処理

</v-clicks>

<div v-click>

```bash
# エンドツーエンド構築（3コマンド）
wrangler pipelines streams create raw_events --schema-file schema.json --http-enabled true
wrangler pipelines sinks create events_sink --type r2-data-catalog --bucket my-bucket \
  --namespace analytics --table events
wrangler pipelines create events_pipeline \
  --sql "INSERT INTO events_sink SELECT * FROM raw_events"
```

</div>

---

# Pipelines — SQL 変換の例

```sql
-- PII マスキング + bot 除外 + ドメイン抽出
INSERT INTO events_sink
SELECT
  user_id,
  REGEXP_REPLACE(email, '(.{2}).*@', '$1***@') as email,
  lower(event_type) AS event_type,
  regexp_match(url, '^https?://([^/]+)')[1] AS domain,
  to_timestamp_micros(ts_us) AS event_time
FROM raw_events
WHERE event_type != 'debug'
  AND NOT regexp_like(user_agent, '(?i)bot|spider')
```

<v-click>

### インジェスト手段の使い分け

| 方法 | ユースケース |
|------|------------|
| **Pipelines** | リアルタイムイベント → Iceberg 継続ストリーミング |
| **Workers** | Webhook 受信・Cron ポーリング・軽量変換 |
| **Queues** | 高スループットバッファ・Worker間の非同期処理 |
| **dlt on Sandbox** | SaaS API → R2 Iceberg バッチ取り込み |

</v-click>
