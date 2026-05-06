# Cloudflare Workflows

Cloudflare Workflows はステップを連鎖させ、失敗時に再試行し、長期間実行されるプロセス全体で状態を保持できる耐久性のある実行エンジン。Workers Bindings を step に組み込める。

<div class="flex justify-center mt-3">
<div class="agent-example">

```typescript {all|3-6|8-15|17-20|22-24|all}
export class ImageProcessingWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent, step: WorkflowStep) {
    const imageData = await step.do('fetch image', async () => {
      const object = await this.env.BUCKET.get(event.params.imageKey);
      return await object.arrayBuffer();
    });

    const description = await step.do('generate description', async () => {
      const imageArray = Array.from(new Uint8Array(imageData));
      return await this.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
        image: imageArray,
        prompt: 'Describe this image in one sentence',
        max_tokens: 50,
      });
    });

    await step.waitForEvent('await approval', {
      event: 'approved',
      timeout: '24 hours',
    });

    await step.do('publish', async () => {
      await this.env.BUCKET.put(`public/${event.params.imageKey}`, imageData);
    });
  }
}
```

</div>
</div>

<div class="text-sm text-center mt-3 min-h-[1.6em]">
  <span v-click.hide="1">▸ <strong>Step 1</strong>: R2 から画像を取得 (`arrayBuffer`)</span>
  <span v-click="1" v-click.hide="2">▸ <strong>Step 2</strong>: LLaVA で 1 文の説明を生成</span>
  <span v-click="2" v-click.hide="3">▸ <strong>Step 3</strong>: 24h durable に人間承認を待つ</span>
  <span v-click="3" v-click.hide="4">▸ <strong>Step 4</strong>: R2 へ publish (公開ディレクトリ)</span>
  <span v-click="4">▸ 全 step を可視化、durable に再開可能</span>
</div>

<style>
.agent-example pre,
.agent-example code,
.agent-example .shiki {
  font-size: 0.6rem !important;
  line-height: 1.35 !important;
}
</style>

<!--
R2 アップロードを起点とする AI Agent パターン。R2 Event Notifications で
オブジェクト作成イベントが発火 → Cloudflare Queues に通知 → Queue Consumer
Worker が env.AGENT.create({ key }) で Workflow を起動、という経路。

コード例の ImageAgent は 4 step の DAG:
(1) fetch from R2: 対象オブジェクトを arrayBuffer で取得
(2) describe: Workers AI の vision モデル LLaVA で画像の説明文を生成
(3) embed: BGE で説明文を embedding ベクトル化
(4) upsert to Vectorize: key + ベクトル + メタデータを Vectorize に保存

これによって「画像にテキストで検索できるインデックス」が自動構築される。
"赤いスニーカーの画像を探して" のような自然言語クエリで類似画像を引ける。

LLM 呼び出しの第 3 引数 gateway: { id: "image-agent" } で AI Gateway を
経由するので、DLP / Cache / Fallback / Metadata が自動で効く (前章 ai-sprawl
の AI Gateway スライドと連動)。

各 step は失敗時に自動リトライ (デフォルト exponential backoff)。LLaVA や
BGE の推論タイムアウト、Vectorize の一時的なエラーがあっても、進行状況は
永続化されているので途中の step から再開する。Worker 自体が再起動しても
同じ instance ID で続きが走る。

応用: step.waitForEvent を describe と embed の間に挟めば「説明文を人間が
承認してから index 化する」フローになる、step.sleep で「N 時間後にもう一度
別モデルで再分析」のような時間制御もできる、と組合せが効く。

位置付けとしては Airflow / Temporal / AWS Step Functions と同じ durable
workflow engine カテゴリだが、Worker の Binding (R2 / AI / D1 / Vectorize /
Pipelines / Hyperdrive) を step 内でそのまま叩けるのが Cloudflare ならではの
強み。AI Agents SDK との統合も進んでいて、Agent が長時間タスクを Workflow に
委譲するパターンが推奨される (Agent は WebSocket でリアルタイム応答、重い処理は
Workflow に渡してリトライ + durable 実行)。
-->

---

## ビジュアライザ

Cloudflare ダッシュボードが Workflow コードを parse し、**step / 並列 / 条件分岐 / ループの DAG 図** を自動生成する。

<div class="grid grid-cols-[3fr_2fr] gap-6 mt-3 text-sm">

<div>

- ループ / nested logic を **折りたたみ ↔ 展開** で切替
- 並列ステップ / 条件分岐も自動レイアウト
- TypeScript / JavaScript Workflows で利用可能 (Python は未対応)

実例: 右図は **dbt build を Workflows で実行** した際のビジュアライザ。`loop` / `try-catch` / `retry-backoff` を含むパイプラインが一画面で構造把握できる。

[Workflows Visualizer Doc](https://developers.cloudflare.com/workflows/build/visualizer/)

</div>

<div class="flex items-center justify-center">

<img src="/dbt-build-diagram.png" alt="dbt-build Workflow visualizer" class="max-h-[420px] w-auto rounded border border-zinc-700/60 shadow-lg" />

</div>

</div>

<!--
2026 年 2 月にリリースされた機能。dashboard で対象 Workflow を開くと、コードから
パースされた DAG が自動で描画される。手動でフロー図を書く必要がない。
Airflow の DAG view に相当する機能で、複雑な並列・分岐・ループを目視で確認
できるのは運用上強い。SLO / インシデント対応で「この workflow が今どこまで
進んでいるか」を見るときの第一歩になる。
ループやネスト構造は collapse / expand できるので、ハイレベル概要 → 詳細を
切り替えて見られる。1000 step を超えるような大規模 workflow でも navigate
しやすい。
ただし現時点では JS/TS Workflows のみで、Python Workflows は未対応 (Python の
decorator-based DAG を解析する実装がまだ追いついていない、というのが推測)。
非デフォルト bundler を使った Workflows は予期しない挙動の場合あり、と公式に
注意書きがある。
-->

---
layout: two-cols-header
---

## Python SDK

`WorkflowEntrypoint` を Python で継承。**関数パラメータ名で依存を暗黙解決** する DAG 表現が特徴。

<div class="agent-example">

```python {all|5-7|9-11|13-15|17|all}
from workers import WorkflowEntrypoint

class IngestWorkflow(WorkflowEntrypoint):
    async def run(self, event, step):
        @step.do()
        async def fetch_a():
            return await get_a()

        @step.do()
        async def fetch_b():
            return await get_b()

        @step.do(concurrent=True)
        async def merge(fetch_a, fetch_b):   # 引数名で依存
            return combine(fetch_a, fetch_b)

        await merge()
```

</div>

::right::

- <span v-click.hide="1">▸ <strong>Step 1</strong>: `fetch_a` を `@step.do()` で定義</span>
- <span v-click="1" v-click.hide="2">▸ <strong>Step 2</strong>: `fetch_b` を独立した step として定義</span>
- <span v-click="2" v-click.hide="3">▸ <strong>Step 3</strong>: `merge` を `concurrent=True` + 引数名 `fetch_a` / `fetch_b` で依存宣言</span>
- <span v-click="3" v-click.hide="4">▸ <strong>Step 4</strong>: `await merge()` 実行 — 依存先が並列起動 (diamond DAG)</span>
- <span v-click="4">▸ 引数名による暗黙的依存解決で DAG が宣言的に書ける</span>

<style>
.agent-example pre,
.agent-example code,
.agent-example .shiki {
  font-size: 0.6rem !important;
  line-height: 1.35 !important;
}
</style>

<!--
2025 年 8 月から Beta。同じ Cloudflare Workflows を Python で書ける。
特徴的なのは「DAG を関数パラメータ名で表現」する設計: 例えば merge 関数の
引数 fetch_a が定義済 step と同名なら、その step が完了してから merge が
実行される、という依存関係に解釈される。明示的な depends=[...] も書けるが、
新規コードはパラメータ名解決を推奨。
concurrent=True で diamond shaped DAG (2 つの step が並列で動いて、3 つ目で
合流する) が自然に書ける。`@step.do(concurrent=True)` を付けた step は
依存先がまだ完了していなければ並列で起動を試みる。
Workers AI Python ランタイムや LangChain との組み合わせで AI Workflow を
書く想定。pyproject.toml に依存パッケージを書くと、Python Worker 同様に
deploy 時に Pyodide snapshot に展開される。
ビジュアライザ未対応なので、今のところダッシュボードではコード視点 + instance
履歴でしか確認できない。
TypeScript と Python のどちらを選ぶかは: 既存資産が JS/TS なら前者、Python
ML / data 系の処理を多く挟むなら後者、というのが現実的な切り分け。
-->
