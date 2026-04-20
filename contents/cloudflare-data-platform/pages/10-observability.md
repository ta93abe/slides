---
layout: section
---

# Observability

---

# Workers Observability

全ての操作に**自動でスパンが生成**（OpenTelemetry 互換）。

<v-clicks>

- R2 読み書き・D1 クエリ・外部 fetch・Queue 送信を自動計装
- コードに手を加えず、パイプラインのボトルネックを可視化
- OTLP エクスポート: **Grafana Cloud** / Honeycomb / Axiom / Sentry

</v-clicks>

<div v-click>

```jsonc
// wrangler.jsonc
{
  "observability": {
    "traces": {
      "enabled": true,
      "head_sampling_rate": 0.05,
      "destinations": ["grafana-traces"]
    },
    "logs": {
      "enabled": true,
      "destinations": ["grafana-logs", "datadog-logs"]
    }
  }
}
```

</div>

<div v-click class="mt-4 text-sm op-70">

**vs CloudWatch + X-Ray**: X-Ray はSDK導入 + コード計装が必要。Workers Observability は `enabled: true` だけで全操作が自動トレース。ただし CloudWatch はメトリクス・アラーム・ダッシュボードが統合されており、Workers 側はトレース/ログのエクスポートに留まる。

</div>
