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
dbt は Python の CLI ツールなので、Workers / Python Workers では動かない。
subprocess が呼べない、DuckDB のような native binary が Pyodide にない、
メモリ 128 MB の壁。これらを全部解決するのが Containers。任意の Docker image
を持ち込めて、Linux microVM 上で実行される。instance class に応じてメモリ /
vCPU が割り当てられ (dev / basic / standard 等で異なる、最新は公式 docs 参照)、
sleepAfter で idle なら課金ゼロ。

【Dockerfile の補足】
ベースは ghcr.io/dbt-labs/dbt-core (アクティブメンテ中、1.11 系が現行)。dbt-snowflake
adapter は v1.8 から dbt-core と decoupled された (dbt-snowflake repo は
dbt-labs/dbt-adapters モノレポに移動)。なので RUN pip install --no-cache-dir
dbt-snowflake==1.11.* で adapter を上乗せする構成。pip install dbt-snowflake
だけだと dbt-core が暗黙で入るが、将来的にこの implicit dependency は外れる
予定なので、明示的に core イメージ + adapter が望ましい。

なお dbt-snowflake 専用イメージ (ghcr.io/dbt-labs/dbt-snowflake) も以前は
配布されていたが、2025-09-02 にアーカイブされて 1.9 で止まっている。今は
dbt-core image + 必要な adapter pip install、が公式推奨パターン。

Cloudflare 完結のメリットは大きく 4 点:
1. アーティファクトを R2 に Binding 経由で送れる (Outbound Workers)。manifest.json
   や dbt docs の出力を API キー無しで R2 に着地。
2. Workers Static Assets で R2 をプロキシ配信、Cloudflare Access (Zero Trust の
   SSO ゲート) を前段に挟むと社内限定の dbt docs サイトが組める。Free プランの
   小規模枠で個人 / チーム用途は十分。
3. secrets / 設定が wrangler.jsonc 1 つに集約される。GitHub Actions だと
   secrets と artifacts と Pages が別管理になりがち。
4. Correlated Logs は Worker / Workflow / DO / Container のログを traceID で
   横断表示する機能 (2026 年 4 月リリース)。エージェント駆動 dbt の監査基盤
   として強い。

外部 DWH を完全に捨てる必要はなく、重い集約は Snowflake、軽い下流マートは
Containers + dbt-duckdb のハイブリッド構成も現実解。R2 を共通基盤に dbt を
2 系統並走できる。
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
Sandbox は Containers と同じ microVM 基盤を使うが、用途と寿命が異なる。
Containers が長期サービス向け、Sandbox は短命・per-request の隔離実行向け。

コード上の sandbox.exec は Cloudflare Sandbox SDK のメソッド呼び出し
(microVM 内で隔離実行)。Node の child_process.exec とは無関係。
package 名 @cloudflare/sandbox、getSandbox / writeFile / exec は公式 docs と整合済み。
登壇前に developers.cloudflare.com/sandbox/ で API シグネチャの最新を再確認。

典型 use case:
- AI Agent が生成したコードの実行 (code interpreter パターン)
- ユーザーが投稿したスクリプトの安全な実行
- ad-hoc なデータ加工 (DuckDB / pandas など)

データ基盤との接続: R2 SQL では JOIN / WINDOW が未対応なので、複雑なクエリを
Sandbox 上の DuckDB に逃がすハイブリッド構成も組める。
-->
