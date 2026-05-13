---
layout: two-cols-header
---

# [Cloudflare Containers](https://developers.cloudflare.com/containers/)

::left::

Cloudflare Workers では **128 MB** の実行メモリ制限や CPU時間制限があります。

そこで Cloudflare Containers を使えば、この制約を突破できます。
例えば dbt の実行を行えます。バッチデータインジェストがしたいなら dlt を使うと良いでしょう。


Cloudflare で完結させるメリットは次のとおりです。

<div class="text-xs">

- dbt artifacts を **R2 に Binding 経由**で永続化 
  - (`env.BUCKET.put('*.json', body)`)
- Workers が R2 Binding 経由で dbt docs を配信
- Cloudflare Access で社内限定配信
- [Workers Observability](https://developers.cloudflare.com/workers/observability/) でログを一元管理

</div>

::right::

<Excalidraw
  drawFilePath="./dbt-docs-hosting.excalidraw"
  :darkMode="true"
  :background="false"
/>

<!--
Workers には 128 MB のメモリ制限があります。
これを超える処理を走らせたい時に Containers です。

例えば dbt の実行環境を Dockerfile で定義して、Linux microVM 上で動かす。
idle 時は sleepAfter で課金ゼロです。

Cloudflare 完結のメリットは、
アーティファクトを R2 に Binding で永続化、
Workers が R2 Binding 経由で dbt docs を配信、
secrets が wrangler.jsonc に集約、
Workers Observability でログを横断、といったあたりです。
-->
