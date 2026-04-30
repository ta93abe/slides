---
layout: section
---

# Cloudflare とは

## CDN 企業？エッジコンピューティング企業？

---

# Cloudflare Data Platform

2025年9月に Cloudflare が [Announcing the Cloudflare Data Platform: ingest, store, and query your data directly on Cloudflare](https://blog.cloudflare.com/cloudflare-data-platform/) で発表されました。

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
2025年12月に Cloudflare for Government が ISMAP（政府情報システムのためのセキュリティ評価制度）に登録された。

参考: https://www.ismap.go.jp/csm?id=cloud_service_list_detail&sys_id=e0773ab5837f3610aa68c6a8beaad39e

話す内容:
- これまで「Cloudflare はエンタープライズ・公共系で使えない」と言われがちだった状況が変わる転換点
- 政府クラウド調達基準（ISMAP）に通った Cloudflare 製品が日本で正式に存在する
- 登録されたのは「Cloudflare for Government」という米国政府向け製品ライン
-->
