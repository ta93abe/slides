---
layout: two-cols-header
---

# Cloudflare Containers

::left::

Workers では **128 MB** の実行メモリ制限があります。

そこで Containers を使えば、この制約を突破できます。
例えば dbt の実行環境を定義できます。


<v-clicks>

Cloudflare で完結させるメリットは次のとおりです。

<div class="text-xs">

- アーティファクトを **R2 に Binding 経由**で永続化
- Workers を R2 のリバースプロキシとして dbt docs を配信
- Cloudflare Access で社内限定配信
- **Workers Secrets** または **Secrets Store** が `wrangler.jsonc` に集約
- Workers Observability でログを一元管理

</div>
</v-clicks>

::right::

```dockerfile
# syntax=docker/dockerfile:1
FROM ghcr.io/dbt-labs/dbt-core:1.11.latest

# v1.8+ で dbt-core と adapter は decoupled、adapter を追加
RUN pip install --no-cache-dir dbt-snowflake==1.11.*

WORKDIR /app

# dbt packages: manifest 変更時のみ再解決 (layer cache)
COPY packages.yml dbt_project.yml ./
RUN dbt deps

# project 一式 (models / macros / seeds / profiles.yml 等)
COPY . .

ENV DBT_PROFILES_DIR=/app
CMD ["dbt", "build", "--target", "prod"]
```

<!--
Workers には 128 MB のメモリ制限があります。
これを超える処理を走らせたい時に Containers です。

例えば dbt の実行環境を Dockerfile で定義して、Linux microVM 上で動かす。
idle 時は sleepAfter で課金ゼロです。

Cloudflare 完結のメリットは、
アーティファクトを R2 に Binding で永続化、
Workers をリバースプロキシに dbt docs を配信、
secrets が wrangler.jsonc に集約、
Workers Observability でログを横断、といったあたりです。
-->

---
layout: two-cols-header
---

# Cloudflare Sandbox

::left::

Containers と同じ microVM 基盤の上で動く、**ephemeral・per-request** な隔離実行環境です。

Containers との対比:

<div class="text-xs">

- Containers = **常駐サービス**（dbt / バッチ / 長時間処理）
- Sandbox = **per-request の隔離環境**（LLM 生成コードの実行 / ユーザースクリプト）

</div>

典型用途は **AI が書いたコードを安全に走らせる場**です。

<div class="text-xs">

- LLM が出した Python / JS / Bash を一時環境で実行
- ファイル書き込み / プロセス起動 / ネットワーク制御を SDK で操作
- 実行が終われば破棄、state を持たない

</div>

::right::

```typescript
import { getSandbox } from "@cloudflare/sandbox";

export default {
  async fetch(req, env) {
    const { prompt } = await req.json();

    // 1. LLM にコード生成を依頼
    const { response: code } = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct",
      { messages: [{ role: "user", content: prompt }] }
    );

    // 2. ephemeral Sandbox を取得
    const sandbox = getSandbox(env.SANDBOX, crypto.randomUUID());

    // 3. 生成コードを書き込んで隔離 microVM 内で実行
    await sandbox.writeFile("/tmp/main.py", code);
    const { stdout } = await sandbox.exec("python /tmp/main.py");

    return Response.json({ stdout });
  }
};
```

<!--
Sandbox も同じ microVM 基盤ですが、用途と寿命が違います。
Containers が常駐サービス向け、Sandbox は per-request の隔離実行です。

典型用途は AI が書いたコードを安全に走らせる場。
LLM が生成した Python や JS を一時環境で実行、終わったら破棄。
state を持ちません。

R2 SQL で JOIN が必要になったときに、
DuckDB を Sandbox で走らせるハイブリッド構成も組めます。
-->
