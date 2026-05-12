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
  - AIエージェントを実装してみる。(Agent, Workers AI, AI Gateway, Dynamic Workers, Sandbox, AI Search, Browser Run, Artifacts, Durable Objects)
- 次回は商用環境でのユースケースを聞けたらうれしいです。

<!--
今日の内容で、まず手を動かすなら。

最初の一歩は cloudflare.com にたどり着くことです。
管理画面に入ると Agent Lee が出迎えてくれます。

Workers Paid は $5/month です。個人開発のおもちゃとしては十分すぎる。

こんな始め方もあります。
ドメインを購入する、
個人サイトやブログを Astro と Workers でホスティングする、
R2 Data Catalog で Iceberg を始めてみる、など。

AI エージェントを実装してみる。

- Agent: Cloudflare のエージェント開発プラットフォーム。Agents SDK で会話 / state / tool calling が一貫した API で書ける。
  - 使い方: `Agent` クラスを継承して `onMessage` / `onConnect` を実装するだけ。
  - 嬉しいところ: 「Worker + DO + WebSocket + State」を毎回手で組まずに済む。Voice Agent (preview) なら STT → LLM → TTS が SDK 一本で繋がる。

- Workers AI: エッジで LLM / 画像 / 音声モデルを推論できる。
  - 使い方: `env.AI.run("@cf/meta/llama-3.3-70b-instruct", ...)` の 1 行で叩ける。
  - 嬉しいところ: モデル選定 / GPU / インフラ管理ゼロ。推論レイテンシが近い POP で完結。Workers Paid 込みで無料枠あり、PoC 段階の費用が読みやすい。

- AI Gateway: 全 LLM プロバイダーを Universal Endpoint に集約する reverse proxy。
  - 使い方: 既存の LLM client の base URL を `https://gateway.ai.cloudflare.com/...` に向け替えるだけ。
  - 嬉しいところ: Caching でコスト最大 90% 削減、DLP / Guardrails で機密データ流出を構造で防止、Analytics で部署 / モデル別の使用量を可視化、Fallback で provider 障害時の自動切替。AI Sprawl 対策の中核。

- Dynamic Workers: 事前デプロイ無しでランタイムに isolate にコードを流し込んで実行する primitive。
  - 使い方: `env.LOADER.load(code)` から `fetch(req)` で AI が生成した JS をその場で走らせる。
  - 嬉しいところ: コンテナ起動 (数百 ms) に対して isolate は数 ms。AI Code Mode やマルチテナント SaaS が実用レイテンシで動く。鍵管理は Egress Worker で Binding-style に集約できる。

- Sandbox: per-request の microVM。任意の Linux バイナリ + Python / Node / Bash が動く。
  - 使い方: `env.SANDBOX.get(id)` から `exec("python /tmp/script.py")` で AI が書いた重い処理 (DuckDB / pandas / git) を破棄前提で実行。
  - 嬉しいところ: 言語自由度が高い (Dynamic Workers が JS 限定なのに対して)。state を持たない設計なので AI が事故っても影響が局所化。

- AI Search: ベクトル検索 + 全文検索 + リランキングを 1 API に束ねたマネージド RAG。
  - 使い方: ドキュメントを R2 にアップロードしてインデックス作成 → クエリで関連チャンクが返る。
  - 嬉しいところ: embedding モデル選定 / chunk 分割 / リランカーの組み合わせを Cloudflare 側で最適化済み。Vectorize を自分で組むより圧倒的に立ち上げが速い。

- Browser Run: Workers から呼べるヘッドレスブラウザ (旧 Browser Rendering)。
  - 使い方: Quick Actions (screenshot / PDF / Markdown 抽出) で 1 行、または Playwright / Puppeteer / Stagehand / Chrome DevTools Protocol で精密制御。
  - 嬉しいところ: 動的サイトのスクレイピングや PDF 化が Worker から 1 関数。エージェントの「目と手」として使え、AI Search と組み合わせると「Web を読んで答える」エージェントが組める。

- Artifacts: エージェントが生成した成果物 (コード / ファイル / ドキュメント) の保存・配信レイヤー。
  - 使い方: エージェントが書いた HTML / コード断片を `env.ARTIFACTS` 経由で保存、共有 URL が即発行される。
  - 嬉しいところ: R2 + Workers + バージョン管理を毎回組まずに済む。Claude / ChatGPT の Artifacts UX を自分のエージェントに即移植できる。

- Durable Objects: ステートフルなオブジェクト。1 conversation = 1 DO instance で state + WebSocket + Alarm が同居する。
  - 使い方: `class Conversation extends DurableObject` で会話履歴 / メモリ / セッションを保持。
  - 嬉しいところ: セッションごとの「小さなデータベース + コンピュート」が ¢ レベルで持てる。Agents SDK の裏側はほぼこれ。WebSocket Hibernation でアイドル中の課金もゼロ。

次回登壇する機会があれば、商用環境でのユースケースが聞けると嬉しいです。
ご清聴ありがとうございました。
-->
