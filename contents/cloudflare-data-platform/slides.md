---
theme: enbu
favicon: /favicon.png
title: Cloudflare で始める Data Platform
titleTemplate: "%s"
info: |
  ## Cloudflare Data Platform

  Cloudflare のサービスを使ってデータ基盤を作るならこんな風に
author: 阿部拓海
keywords: Cloudflare,Data Platform,Pipelines,R2,R2 Data Catalog,R2 SQL,Workers,wrangler
exportFilename: cloudflare-data-platform
drawings:
  persist: false
htmlAttrs:
  lang: ja
transition: fade-out
comark: true
layout: cover
---

# Cloudflare で始める<br>Data Platform

## 阿部拓海

<!--
はじめまして、阿部拓海です。
今日は「Cloudflare で始める Data Platform」というタイトルで、10 分お時間いただきます。
Cloudflare のサービスを組み合わせて、データ基盤を実際にどう作るか。
基礎から観測・統制までを駆け足で通します。
-->

---
src: ./pages/data-platform.md
---

---
src: ./pages/workers.md
---

---
src: ./pages/workflows.md
---

---
src: ./pages/containers.md
---

<!--
ambient-agent.md は本登壇から一時的に除外中 (pages/ambient-agent.md は保持)。
復活させたい場合は以下のブロックをこの直下に追加 (インデントを外す):
  ---
  src: ./pages/ambient-agent.md
  ---
-->

<!--
durability.md は本登壇から一時的に除外中 (pages/durability.md は保持)。
復活させたい場合は以下のブロックをこの直下に追加 (インデントを外す):
  ---
  src: ./pages/durability.md
  ---
-->

<!--
observability.md は 10 分尺に収めるため本登壇から一時的に除外中 (pages/observability.md は保持)。
復活させたい場合は以下のブロックをこの直下に追加 (インデントを外す):
  ---
  src: ./pages/observability.md
  ---
-->

---
src: ./pages/wrangler.md
---

---
src: ./pages/summary.md
---
