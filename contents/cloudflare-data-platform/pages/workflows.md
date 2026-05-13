---
layout: two-cols-header
---

# [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)

Cloudflare Workflows は耐久性のある実行エンジンです。ステップを連鎖させ、失敗時には自動で再試行し、長期間実行されるプロセス全体で状態を保持します。各 step には Workers Bindings を組み込めます。

::left::

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

::right::

<ol class="ml-4">
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 1 || $clicks > 4 ? '' : 'opacity-30']">R2 から画像を取得</span></li>
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 2 || $clicks > 4 ? '' : 'opacity-30']">LLaVA で 1 文の説明を生成</span></li>
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 3 || $clicks > 4 ? '' : 'opacity-30']">24h durable に人間承認を待つ</span></li>
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 4 || $clicks > 4 ? '' : 'opacity-30']">R2 へ publish (公開ディレクトリ)</span></li>
</ol>

<style>
.agent-example pre,
.agent-example code,
.agent-example .shiki {
  font-size: 0.6rem !important;
  line-height: 1.35 !important;
}
</style>

<!--
Cloudflare Workflows は耐久性のある実行エンジンです。
ステップを連鎖させて、失敗時は自動でリトライ、長時間プロセスの状態を永続化します。
Temporal.io が類似サービス。

右のコードは画像処理ワークフローの例です。
R2 から画像を取得、
Workers AI の LLaVA (ラーバ)で説明文を生成、
人間の承認を 24 時間 durable に待つ、
承認されたら公開ディレクトリに publish。

各ステップで Workers Binding がそのまま使えるのが Cloudflare ならではの強みです。
-->

---
layout: two-cols-header
---

## Python SDK

`WorkflowEntrypoint` を Python で継承します。**関数パラメータ名で依存を暗黙解決** する DAG 表現が特徴です。引数名による暗黙的依存解決で DAG が宣言的に書けます。

::left::

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

<ol class="ml-4">
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 1 || $clicks > 4 ? '' : 'opacity-30']">`fetch_a` を `@step.do()` で定義</span></li>
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 2 || $clicks > 4 ? '' : 'opacity-30']">`fetch_b` を独立した step として定義</span></li>
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 3 || $clicks > 4 ? '' : 'opacity-30']">`merge` を `concurrent=True` + 引数名 `fetch_a` / `fetch_b` で依存宣言</span></li>
  <li><span :class="['transition-opacity duration-300', $clicks === 0 || $clicks === 4 || $clicks > 4 ? '' : 'opacity-30']">`await merge()` 実行 — 依存先が並列起動</span></li>
</ol>

<style>
.agent-example pre,
.agent-example code,
.agent-example .shiki {
  font-size: 0.6rem !important;
  line-height: 1.35 !important;
}
</style>

<!--
2025 年 8 月から Beta で、同じ Workflows を Python で書けます。

特徴的なのは DAG の表現方法です。
merge 関数の引数名が fetch_a で、定義済みステップと同名なら、
それが完了してから merge が実行される、という風に
引数名で依存を暗黙解決します。

concurrent=True を付ければ、diamond shaped DAG が宣言的に書けます。
Python の ML / data 系処理と相性がいい設計です。
-->

---
layout: two-cols-header
---

## ビジュアライザ

Cloudflare ダッシュボードが Workflow コードを parse し、**step / 並列 / 条件分岐 / ループのフロー図** を自動生成します。

::left::

- ループ / nested logic を **折りたたみ ↔ 展開** で切替
- 並列ステップ / 条件分岐も自動レイアウト
- TypeScript Workflows で利用可能 (Python は未対応)

実例: 右図は一つ前のスライドの画像に説明文を付与するコード例をちょっと複雑にしたものです。

[Workflows Visualizer Doc](https://developers.cloudflare.com/workflows/build/visualizer/)

::right::

<img src="/image-processing-diagram.png" alt="Image Processing Workflow visualizer" class="scale-75 mt-[-80px] rounded border border-zinc-700/60 shadow-lg" />

<!--
2026 年 2 月にリリースされた機能です。
Workflow コードをダッシュボードがパースして、
step・並列・条件分岐・ループのフロー図を自動描画してくれます。

右図は前スライドの画像処理ワークフローをちょっと複雑にした例で、
画像取得 → AI による説明生成 → 承認 → 公開のフローが可視化されています。
Airflow の DAG View に相当します。
-->
