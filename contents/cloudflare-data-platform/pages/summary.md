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
  - ドメインを購入する or 移管してくる。
  - 個人のサイト/ブログをホスティングする。 (Astro というフレームワークを使えばフロントエンドも簡単に作れます。Markdown でコンテンツを書いて Content Collections でいい感じに表示できます)
  - [R2 Data Catalog は Iceberg を始めるには結構お手軽です。](https://developers.cloudflare.com/r2/data-catalog/get-started/)
  - AI エージェントを実装してみる。 [Agent](https://developers.cloudflare.com/agents/) / [Workers AI](https://developers.cloudflare.com/workers-ai/) / [AI Gateway](https://developers.cloudflare.com/ai-gateway/) / [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/) / [Sandbox](https://developers.cloudflare.com/sandbox/) / [AI Search](https://developers.cloudflare.com/ai-search/) / [Browser Run](https://developers.cloudflare.com/browser-rendering/) / [Artifacts](https://developers.cloudflare.com/artifacts/) / [Durable Objects](https://developers.cloudflare.com/durable-objects/)

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

Ramp の Inspect、WorkerOS の Horizon でも Cloudflare のサービスが使われています。（Inspect: Durable Objects、Horizon: Sandbox）

各 primitive は Cloudflare 公式 blog で明示された "課題" を解くために生まれている。

- [Agent](https://developers.cloudflare.com/agents/): Cloudflare のエージェント開発プラットフォーム。Agents SDK で会話 / state / tool calling が一貫した API で書ける。
  - 使い方: `Agent` クラスを継承して `onMessage` / `onConnect` を実装するだけ。
  - 解決する課題: AI エージェントはステートフルかつ長時間動作する処理が連続する。従来のステートレスサーバーレスは state が、常時起動サーバーは「待ち時間の wall-clock 課金」が破綻する。Durable Objects ベースで「状態を持つマイクロサーバー」を一級プリミティブにする。([blog: build-ai-agents-on-cloudflare](https://blog.cloudflare.com/build-ai-agents-on-cloudflare/))
  - 嬉しいところ: CPU 時間だけ課金 / scale to zero。「Worker + DO + WebSocket + State」を毎回手で組まずに済む。Voice Agent (preview) なら STT → LLM → TTS が SDK 一本で繋がる。

- [Workers AI](https://developers.cloudflare.com/workers-ai/): エッジで LLM / 画像 / 音声モデルを推論できる。
  - 使い方: `env.AI.run("@cf/meta/llama-3.3-70b-instruct", ...)` の 1 行で叩ける。
  - 解決する課題: OSS AI モデルは強力だが GPU 調達 + 運用 + ML 専門知識の壁が高く、大半の開発者に届かない。プロプライエタリ API はロックインやデータプライバシーの懸念を生む。Cloudflare のグローバルネットワーク上にサーバーレス GPU を分散配備し、"making inference just work" を実現。([blog: workers-ai](https://blog.cloudflare.com/workers-ai/))
  - 嬉しいところ: モデル選定 / GPU / インフラ管理ゼロ。推論レイテンシが近い POP で完結。Workers Paid 込みで無料枠あり、PoC 段階の費用が読みやすい。

- [AI Gateway](https://developers.cloudflare.com/ai-gateway/): 全 LLM プロバイダーを Universal Endpoint に集約する reverse proxy。
  - 使い方: 既存の LLM client の base URL を `https://gateway.ai.cloudflare.com/...` に向け替えるだけ。
  - 解決する課題: 複数モデルプロバイダにまたがる AI アプリは、リクエスト数 / コスト / レイテンシの基本メトリクスすら可視化が難しい。コストは予測不能に膨らみ、プロバイダ障害・レート制限・キャッシュ・リトライ・フォールバックを各チームが毎回手作りしている。"nearly all AI applications need" を 1 行で差し込めるレイヤとして提供。([blog: announcing-ai-gateway](https://blog.cloudflare.com/announcing-ai-gateway/))
  - 嬉しいところ: Caching でコスト最大 90% 削減、DLP / Guardrails で機密データ流出を構造で防止、Analytics で部署 / モデル別の使用量を可視化、Fallback で provider 障害時の自動切替。AI Sprawl 対策の中核。

- [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/): 事前デプロイ無しでランタイムに isolate にコードを流し込んで実行する primitive。
  - 使い方: `env.LOADER.load(code)` から `fetch(req)` で AI が生成した JS をその場で走らせる。
  - 解決する課題: AI エージェントが生成した未信頼コードを安全に実行する必要があるが、コンテナベース sandbox は数百 ms 起動 + 数百 MB メモリ。各エンドユーザーが並列で複数エージェントを走らせる「消費者規模」では破綻する。Workers と同じ V8 isolate を使い捨て sandbox に転用し "100x faster" 起動を実現。([blog: dynamic-workers](https://blog.cloudflare.com/dynamic-workers/))
  - 嬉しいところ: 起動が ms オーダー。AI Code Mode やマルチテナント SaaS が実用レイテンシで動く。鍵管理は Egress Worker で Binding-style に集約できる。

- [Sandbox](https://developers.cloudflare.com/sandbox/): per-request の microVM。任意の Linux バイナリ + Python / Node / Bash が動く。
  - 使い方: `env.SANDBOX.get(id)` 経由でファイル書き込み + コマンド実行で AI が書いた重い処理 (DuckDB / pandas / git) を破棄前提で実行。
  - 解決する課題: エージェントが「開発者」として動くには git clone / 多言語ビルド / dev server 起動など実コンピューティング環境が必要で、軽量 eval では足りない。各チームが瞬時プロビジョニング / 状態スナップショット / クレデンシャル注入 / ライフサイクル制御を独自に組み立てていた。"a full development environment" を Workers から 1 API で提供。([blog: sandbox-ga](https://blog.cloudflare.com/sandbox-ga/))
  - 嬉しいところ: 言語自由度が高い (Dynamic Workers が JS 限定なのに対して)。ターミナル接続 / コードインタプリタ / バックグラウンドプロセス / live preview URL が全部入り。

- [AI Search](https://developers.cloudflare.com/ai-search/): ベクトル検索 + 全文検索 + リランキングを 1 API に束ねたマネージド RAG。
  - 使い方: ドキュメントを R2 にアップロードしてインデックス作成 → クエリで関連チャンクが返る。
  - 解決する課題: RAG 自前構築はベクトルインデックス / 解析 + チャンク化パイプライン / 更新メンテ / キーワード検索とのフュージョンを縫合する必要がある。コーディングエージェントは repo、サポートエージェントはチケット、と独立した検索コンテキストが必要なケースで複雑性が増殖。検索を compute / storage と並ぶ "plug-and-play primitive" として提供。([blog: ai-search-agent-primitive](https://blog.cloudflare.com/ai-search-agent-primitive/))
  - 嬉しいところ: embedding モデル選定 / chunk 分割 / リランカーの組み合わせを Cloudflare 側で最適化済み。Vectorize を自分で組むより圧倒的に立ち上げが速い。

- [Browser Run](https://developers.cloudflare.com/browser-rendering/): Workers から呼べるヘッドレスブラウザ (旧 Browser Rendering)。
  - 使い方: Quick Actions (screenshot / PDF / Markdown 抽出) で 1 行、または Playwright / Puppeteer / Stagehand / Chrome DevTools Protocol で精密制御。
  - 解決する課題: エージェントが Web とやり取りする (ナビゲート / フォーム入力 / データ抽出) には本物のブラウザが必須。しかし Web は人間向け設計でエージェントは頻繁に詰まり、なぜ落ちたか分からない観測性欠如、ログイン画面のような edge case での人間介在、スケール時の自前ホスティングの脆さが課題。"Rendering" 改め "Run" で録画・Live View・Human in the Loop を含む全体像を明示。([blog: browser-run-for-ai-agents](https://blog.cloudflare.com/browser-run-for-ai-agents/))
  - 嬉しいところ: 動的サイトのスクレイピングや PDF 化が Worker から 1 関数。エージェントの「目と手」+「困ったら人間に渡す」が組み込み。AI Search と組み合わせると「Web を読んで答える」エージェントが組める。

- [Artifacts](https://developers.cloudflare.com/artifacts/): エージェントが生成した成果物 (コード / ファイル / ドキュメント) の保存・配信レイヤー。Git 互換でバージョン管理付き。
  - 使い方: エージェントが書いた HTML / コード断片を `env.ARTIFACTS` 経由で保存、共有 URL が即発行される。Git クライアントからも触れる。
  - 解決する課題: GitHub などの既存ソース管理は人間開発者向けで、休まず並列に複数 issue をこなすエージェントの "10x 流量" には容量も同時実行も足りない。大規模 repo の clone に数分かかり sandbox 起動のボトルネックになる。"built for agents first and foremost" な分散バージョン管理 + "git clone but async" (blobless 非同期 clone) を提供。([blog: artifacts-git-for-agents-beta](https://blog.cloudflare.com/artifacts-git-for-agents-beta/))
  - 嬉しいところ: R2 + Workers + バージョン管理を毎回組まずに済む。Claude / ChatGPT の Artifacts UX を自分のエージェントに即移植できる。エージェント間・人間との成果物引き渡しが落ちない。

- [Durable Objects](https://developers.cloudflare.com/durable-objects/): ステートフルなオブジェクト。1 conversation = 1 DO instance で state + WebSocket + Alarm が同居する。
  - 使い方: `class Conversation extends DurableObject` で会話履歴 / メモリ / セッションを保持。
  - 解決する課題: 従来のクラウドはアプリサーバーと DB をネットワーク越しに分離するため、ローカル接続でも ms 単位のレイテンシが乗り、N+1 を避けるため複雑な JOIN を書く羽目になる。リアルタイム共同編集や座席選択のような stateful な系では分散同期プロトコルが必要。SQLite を DO 内に同居させ "your code runs where the data is stored" / "storage latency is essentially zero" を実現。([blog: sqlite-in-durable-objects](https://blog.cloudflare.com/sqlite-in-durable-objects/))
  - 嬉しいところ: セッションごとの「小さなデータベース + コンピュート」が ¢ レベルで持てる。Agents SDK の裏側はほぼこれ。WebSocket Hibernation でアイドル中の課金もゼロ。AI エージェントの actor model 基盤として再評価が進んでいる。

次回登壇する機会があれば、商用環境でのユースケースが聞けると嬉しいです。
ご清聴ありがとうございました。
-->
