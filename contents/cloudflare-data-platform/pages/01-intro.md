---
layout: section
---

# Cloudflare とは

## CDN？エッジコンピューティング？

---

# Cloudflare Data Platform

Cloudflare の **Cloudflare Data Platform** は、入れる/貯める/使うを 1 つのプラットフォームで提供する。<br>([Announcing the Cloudflare Data Platform: ingest, store, and query your data directly on Cloudflare](https://blog.cloudflare.com/cloudflare-data-platform/))

<v-click>

Cloudflare Data Platform を構成するサービス

- **Pipelines**: ストリーミングイベントインジェストサービス
- **R2 Data Catalog**: Iceberg カタログサービス
- **R2 SQL**: 分散クエリエンジン

</v-click>

<v-click>
<Excalidraw
  drawFilePath="./data-platform-main-components.excalidraw"
  :darkMode="true"
  :background="false"
  class="my-16"
/>
</v-click>

<!--
2025 年 9 月の Birthday Week で発表された Cloudflare Data Platform は、
Pipelines (Ingest)、R2 Data Catalog (Iceberg メタデータ)、R2 SQL (分散クエリ) の
3 コンポーネントから成る。データレイクの ingest / store / query を 1 社で完結
させる宣言で、Cloudflare がデータ層に本格進出した転換点。

加えて 2025 年 12 月に Cloudflare for Government (米国政府向け製品ライン) が
ISMAP に登録され、日本でもエンタープライズ・公共系で使える状況になった。
これまで「Cloudflare はエンプラで使えない」と言われがちだった状況の転換点。

参考: https://www.ismap.go.jp/csm?id=cloud_service_list_detail&sys_id=e0773ab5837f3610aa68c6a8beaad39e
-->
