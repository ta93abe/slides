---
layout: section
---

# Part 8

## コストの罠

---

# 黄金ルール

> **書き込みは高い、読み取りは安い、エグレスは無料**

| プロダクト | 読取 | 書込 | 倍率 |
|---|---|---|---|
| D1 | $0.001/百万行 | $1.00/百万行 | **1,000倍** |
| KV | $0.50/百万 | $5.00/百万 | **10倍** |
| R2 | $0.36/百万ops | $4.50/百万ops | **12倍** |

<v-click>

### 最も危険なアンチパターン

イベントログを D1 に 1 行ずつ INSERT
→ 100万件/日 × 30日 = 3,000万行書込
→ **$30/月**（ログ書くだけで）

**対策**: 大量データは R2 へ。D1 は集計済みデータのみ。

</v-click>

---

# 良い設計 vs 悪い設計

悪い設計から良い設計へリファクタするとどうなるか:

````md magic-move {lines: true}
```ts
// 🔴 悪い設計: $835+/月
// イベントを1件ずつ書き込み
for (const event of events) {
  await env.BUCKET.put(`events/${event.id}.json`, JSON.stringify(event))  // R2 PUT 3000万回 = $135
  await env.DB.prepare('INSERT INTO events VALUES (?)').bind(event).run()  // D1 3000万行 = $30
  await env.KV.put(`cache:${event.id}`, JSON.stringify(event))            // KV Write 3000万 = $150
  await env.AI.run('@cf/meta/llama-3.1-70b', { messages: [/*...*/] })     // 大型LLM全件 = $200+
}
// + Containers standard-4 常時起動 = $290
// 合計: $835+/月
```

```ts
// 🟢 良い設計: $10〜17/月
// イベントは Pipelines でバッチ書き込み
await fetch('https://pipeline.pipelines.cloudflare.com/', {
  method: 'POST',
  body: JSON.stringify(events),  // Pipelines → R2 Parquet（自動バッチ）= $0
})

// D1 は集計済みデータのみ
await env.DB.prepare('UPDATE daily_stats SET count = count + ?').bind(events.length).run()

// KV は読取のみ（書込は Cron でまとめて）
const cached = await env.KV.get('daily-summary', { type: 'json' })

// AI は小型モデル + AI Gateway キャッシュ
await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [/*...*/] })
// + Containers basic sleepAfter = $1〜3
// 合計: $10〜17/月
```
````

> 設計で **50倍** のコスト差が出る
