---
layout: section
---

# まとめ

<!--
まとめに入ります。
-->

---
layout: center
---

- まずは cloudflare.com にたどり着きましょう。
- 無事たどり着いて管理画面に入ったら **Agent Lee** が迎えてくれます。
- こんな Cloudflare の始め方もあります。
  - ドメインを購入する or 移管してくる
  - 個人のサイト/ブログをホスティング (Astro というフレームワークを使えばフロントエンドも簡単に作れます。Markdown でコンテンツを書いて Content Collections でいい感じに表示できます)
  - R2 Data Catalog は Iceberg を始めるには結構お手軽です
  - AIエージェントを実装してみる。(Workers AI, AI Gateway, Sandbox, AI Search, Browser Run, Dynamic Workers, Artifacts, Durable Objects)
- 次回は商用環境でのユースケースを聞けたらうれしいです。

<!--
今日の内容で、まず手を動かすなら。

最初の一歩は cloudflare.com にたどり着くことです。
管理画面に入ると Agent Lee が出迎えてくれます。

こんな始め方もあります。
ドメインを購入する、
個人サイトやブログを Astro と Workers でホスティングする、
R2 Data Catalog で Iceberg を始めてみる、など。
AI エージェントを実装してみる。
- Workers AI: 様々なモデルを簡単に使えるようにする。
- AI Gateway: AI エージェントを統合管理する。
- Sandbox: AI エージェントのための隔離された実行環境
- AI Search: ベクトル検索 + 全文検索 + リランキングを 1 API に束ねた、エージェントのための検索基盤。RAG の "Retrieval" 部分が即組める。マネージドRAG
- Browser Run: ヘッドレスブラウザを Worker から呼んで Web 操作・スクレイピング・スクリーンショット。エージェントの「目と手」になる。Playwright, Puppeteer, Stagehand, Chrome DevTools Protocolに対応。
- Dynamic Workers: ランタイムで isolate にコードを流し込んで実行。AI が書いたコードを ms オーダーで安全に走らせる primitive
- Artifacts: エージェントが生成した成果物 (コード / ファイル / ドキュメント) の保存と配信先。R2 + Workers の上に作られた高レベル API
- Durable Objects: エージェントの状態 + WebSocket セッション + Alarm を 1 つに束ねるステートフル primitive。会話履歴 / セッション / ジョブキューが全部これに乗る

次回登壇する機会があれば、商用環境でのユースケースが聞けると嬉しいです。
ご清聴ありがとうございました。
-->
