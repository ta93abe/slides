---
layout: two-cols-header
---

# [Cloudflare Containers](https://developers.cloudflare.com/containers/)

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
- [**Workers Secrets**](https://developers.cloudflare.com/workers/configuration/secrets/) または [**Secrets Store**](https://developers.cloudflare.com/secrets-store/) が `wrangler.jsonc` に集約
- [Workers Observability](https://developers.cloudflare.com/workers/observability/) でログを一元管理

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
