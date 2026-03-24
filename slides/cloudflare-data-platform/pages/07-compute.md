---
layout: section
---

# Part 7

## コンピュートの使い分け

---

# 3層コンピュート

| 層 | 何者か | メモリ | いつ使う |
|---|---|---|---|
| **Workers** | Lambda（0ms起動） | 128MB | API、接着剤 |
| **Sandbox** | Python 実行環境 | — | dlt、DuckDB |
| **Containers** | Fargate（Beta） | 最大12GiB | dbt、重い処理 |

<v-click>

### データエンジニアへの翻訳

```
Workers  = 「軽い API を書くところ」
Sandbox  = 「Python スクリプトを動かすところ」
Container = 「dbt とか重いバッチを動かすところ」
```

> Workers の 128MB は構造的制約（V8 Isolate）。
> pandas すら動かない。重い処理は Containers へ。

</v-click>

---

# Workers — 0ms コールドスタートの価値

| | Workers | Lambda |
|---|---|---|
| コールドスタート | **0ms** | 100ms〜数秒 |
| 拠点数 | **330+** | 30+ リージョン |
| CPU課金 | 実行時間のみ | I/O待ちも課金 |
| メモリ | 128MB 固定 | 最大 10GB |

データ配信 API を書いてみる（編集して試せます）:

```ts {monaco}
// Workers でデータ配信 API
export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url)
    const table = url.searchParams.get('table') ?? 'events'
    const limit = url.searchParams.get('limit') ?? '100'

    const result = await env.R2_SQL.execute(
      `SELECT * FROM default.${table} LIMIT ${limit}`
    )
    return Response.json(result)
  }
}
```

> データ配信 API には最適。データ処理には不向き。

---

# Containers — sleepAfter が全て

**sleepAfter を設定しないと破産する:**

| | 常時起動（720h） | sleepAfter 設定 |
|---|---|---|
| basic | **$20/月** | $1〜3/月 |
| standard-1 | **$50/月** | $2〜5/月 |
| standard-4 | **$290/月** | $65/月 |

コスト計算してみよう（数字を変えて試せます）:

```ts {monaco-run}
const vcpu_per_sec = 0.000020
const mem_per_gib_sec = 0.0000025

// basic: 1/4 vCPU, 1 GiB
const hours_per_day = 0.5  // ← 変えてみて！
const days = 30

const total_sec = hours_per_day * 3600 * days
const cost = (0.25 * vcpu_per_sec + 1 * mem_per_gib_sec) * total_sec
console.log(`${hours_per_day}h/日 × ${days}日 = $${cost.toFixed(2)}/月`)
```

> 常時起動 vs sleepAfter で **10〜50倍** のコスト差

---

# Workflows — JSON ASL から解放される

Step Functions の JSON ASL → Cloudflare Workflows の TypeScript

````md magic-move {lines: true}
```json
// Step Functions: JSON ASL（これ読めますか？）
{
  "StartAt": "Extract",
  "States": {
    "Extract": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123:function:extract",
      "Next": "Transform"
    },
    "Transform": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123:function:transform",
      "Next": "Notify"
    },
    "Notify": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123:function:notify",
      "End": true
    }
  }
}
```

```ts
// Workflows: TypeScript（こっちのほうがよくない？）
export class DataPipeline extends WorkflowEntrypoint {
  async run(event, step) {
    const data = await step.do('extract', async () => {
      return await fetchFromAPI()
    })
    await step.do('transform', async () => {
      return await runDbt(data)
    })
    await step.do('notify', async () => {
      await sendSlack('Pipeline complete')
    })
  }
}
```
````
