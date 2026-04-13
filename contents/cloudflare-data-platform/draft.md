# Cloudflare で始める Data Platform
## Cloudflare Data Platform

ブログで発表された。

- Cloudflare Pipelines
- Cloudflare R2 Data Catalog
- Cloudflare R2 SQL

が構成要素。
https://workers.cloudflare.com/product/data-platform

ISMAPにも登録された。

## Cloudflare Workers

Cloudflare の重要サービスの一つ。

#### Binding

従来のSDK＋IAMとは一線を画す。

## Durable Objects

裏で支える意外と重要なサービス。

## Ingestion

- Linear
- GitHub
- Spotify
- Moneyfoward (CSV)
- Workers Observability
- PostgreSQL → Debezium
- PostgreSQL → DuckDB
- Obsidian
これらを　Excalidraw でデータソースからいろんなツールを使ってR2に保存するまでを書きたい。

### Cloudflare Pipelines

ストリーミングデータを取り込むのは Cloudflare Workers

#### Stream
#### Sink
#### Pipeline
#### 設定変更
### dlt on Cloudflare Sandbox

バッチ処理は dlt でやる。

## ストレージ

## Cloudflare R2

#### データロケーション

### Cloudflare Data Catalog

Icebreg 対応できる。

### Cloudflare R2 SQL

Athena のようなもの。
まだまだ発展途上。

## dbt on Cloudflare Containers

dbt を Cloudflare Containers 上でビルドできる。
R2 にバインディングができるのでアーティファクトをR2に置くみたいなことも簡単。


## Orchestration
### Cloudflare Workflow

Workers を Cron Trigger で動かしまくるのは限度があるので、Workflowを使う。

コードで書いて、Cloudflareダッシュボードから依存関係含めグラフが見られる。

https://blog.cloudflare.com/ja-jp/workflow-diagrams/

## AI
### Cloudflare Agents

- Sandbox との連携
- Agent to Agent
のサンプルみたいのを書きたい。

### Workers AI
### AI Gateway

これを使うと何が嬉しいかを書く。
キャッシュ、レート制限、ロギング、アナリティクス

### Vectorize

RAGをつくるとか。

### AI Search

R2にファイルを配置する、ドメインを接続するだけですごく簡単にできるよ。

ObsidianのファイルをR2においてRAGを実装するとかやりたい。

### 例えば、LLM-as-a-Judge

LLM が別の LLM の出力を評価する手法。AI パイプラインに「評価者」を組み込むことで、人間がすべてのアウトプットをレビューせずとも継続的な品質管理が可能になる。

評価パターンは3種類:
- **Point-wise（絶対評価）**: 1件の出力を 0〜5 などのスコアで評価。最もシンプルで実装が容易
- **Pairwise（比較評価）**: 2つの出力を比較して優劣を判定。モデル切り替え時の A/B 比較に有効
- **Reference-based（参照評価）**: 正解例と比較して類似度を評価。ベンチマーク的な使い方

**Cloudflare スタックでの実装**:

Workers AI で生成したコンテンツを Queues に流し込み、評価専用 Worker が Judge LLM（Workers AI）を呼び出して評点を付ける。評価ログは Analytics Engine に保存し、集計結果を R2 に蓄積する。しきい値を下回った出力は Workflows でエスカレーション（人間レビューキューへの送信）。

```
生成 Worker → Queues → 評価 Worker（Judge LLM） → Analytics Engine → R2（エビデンス）
                                                  ↓（低スコア時）
                                               Workflows → アラート / 人間レビュー
```
↑ TODO: この図をExcalidrawで書く。

**RAG パイプラインの評価指標**:
- **Context Relevance**: 検索されたコンテキストが質問に関連しているか
- **Context Sufficiency**: 回答に必要な情報がコンテキストに含まれているか
- **Faithfulness**: 回答がコンテキストの内容に忠実か（幻覚の検出）
- **Answer Relevance**: 回答が質問に直接答えているか

AI Search（AutoRAG）と組み合わせるとき、この 4 指標で定期的に品質を評価し、スコアが低下したらインデックスの再構築や Retrieval 設定のチューニングをトリガーできる。

**Multi-Agent Panel アーキテクチャ**:

単一 Judge のバイアスを避けるために複数の Judge を並列実行し、多数決または重み付き平均でスコアを確定する手法。Cloudflare Agents + Workflows でオーケストレーションする。

```
Critic Agent（問題点を列挙）
Defender Agent（良い点を列挙）  →  Judge Agent（最終スコア決定）
Reference Agent（正解例と比較）
```
↑ TODO: この図をExcalidrawで書く。


**Preference Leakage に注意**: Judge LLM と生成モデルが同じファミリー（例: 両方 GPT-4）だと、Judge が自分の「癖」を高評価しやすくなる。本番生成モデルと Judge は異なるモデルファミリーを選ぶ（例: 生成に Workers AI の Llama、評価に Workers AI の Gemma）。

コスト効率: 1 万評価/月で約 $0.50（Workers AI のトークン料金）。人間評価と比較して約 20,000 倍のコスト効率。「完全に置き換える」のではなく、**人間レビューをハイスコア案件に集中させる**のが実践的な使い方。

---

## データアクティベーション
### Cloudflare Access

認証をかけられる。

### data analysis on Cloudflare Sandbox

https://developers.cloudflare.com/sandbox/#data-analysis--notebooks

### marimo on Cloudflare Workers

ノートブックが簡単に扱える。
データソースの連携も楽。Icebergも。

https://blog.cloudflare.com/ja-jp/marimo-cloudflare-notebooks/

### Evidence on Cloudflare Workers

Evidence は Static Assets を吐き出すのでそれをホスティングできる。

#### Browser Rendering で Evidence のスクリーンショットを撮る

Playwright API をサポートしているのでスクリーンショットをとってSlackにスナップショットを送るなどをできる。

### Reverse ETL

Workers で書くこともできる。

```
Cron Trigger → Worker → R2 SQL クエリ (Binding) → SaaS API に書き戻し
```
↑ TODO: この図をExcalidrawで書く。


Workflows で組めばエラーハンドリング・リトライ・進捗管理ができる:

```
Cron Trigger → Worker → Workflow
  Step 1: R2 SQL でセグメント抽出
  Step 2: SaaS API にバッチ書き戻し（リトライ付き）
  Step 3: 結果を D1 に記録（同期済み件数・エラー件数）
  Step 4: Slack に完了通知
```
↑ TODO: この図をExcalidrawで書く。

#### drt-hub/drt

https://github.com/drt-hub/drt

## Observability

### Workers Observability

いろんなデータを取れる。
#### OTLP エクスポート先

OpenTelemetry に対応していて、Trace、Span

#### Observe（Snowflake）へのエクスポート
### Logpush
### Analytics Engine
## Data Catalog

dbt docs をCloudflare Workersでホスティングする。
OpenMetaData を Cloudflare Containersでホスティングする。

**Cloudflare ネイティブな構築案(自前実装をしてみる)**: Astro（Workers SSG）+ AI Search（AutoRAG）で**自然言語で検索できるデータカタログ**を構築する。

dbt の `manifest.json` と `catalog.json` を R2 に保存 → Workers が R2 イベントをトリガーにカタログドキュメントを生成 → AI Search（Vectorize + Workers AI + AI Gateway）に格納 → Astro フロントエンドから「売上に関連するテーブルは？」のような自然言語クエリで検索する、というアーキテクチャ。

## Developer eXperince

### ドキュメント

Cloudflare のドキュメントは [`developers.cloudflare.com`](https://developers.cloudflare.com/) に集約されており、品質は高い。特にコード例が豊富で、各プロダクトのガイドが充実している。

AI 向けの工夫として **llms.txt** を提供。LLM フレンドリーなフォーマットでドキュメントを提供しており、Claude・GPT などから Cloudflare のドキュメントを参照してコードを生成しやすい。

**Changelog** が頻繁に更新される。[`developers.cloudflare.com/changelog`](https://developers.cloudflare.com/changelog) で週次の機能追加を追える。RSSにも対応している。

### MCP

Cloudflare は公式の **[MCP（Model Context Protocol）サーバー](https://developers.cloudflare.com/agents/model-context-protocol/)**を提供。Claude Desktop や Cursor などの AI ツールから、直接 Cloudflare のリソースを操作できる。

16 のプロダクト別 MCP サーバーがある。

Workers 上で MCP サーバーを自前で立てることもできる。データカタログや社内 API を MCP で公開し、AI エージェントからアクセスさせるパターン。
Skill も公開されているので簡単に作りやすいと思う。

### API

https://developers.cloudflare.com/api/

### Wrangler

https://developers.cloudflare.com/workers/wrangler/
https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler

### ローカルエミュレーション

ローカルエミュレートできると何が嬉しいの？
Wrangler は簡単にローカルエミュレートできる。できないサービスもあるけど。
LocalStack が AWS や Snowflake に対応している。
kumo みたいのもあるね。https://github.com/sivchari/kumo
Cloudflare の文脈では kumo はUIコンポーネントライブラリ kumo-ui.com

### コミュニティー

- **[Discord](https://discord.cloudflare.com/)**: Cloudflare Developers（公式 Discord）が最も活発。プロダクト担当者が直接回答することも多い
- **[Cloudflare Community フォーラム](https://community.cloudflare.com/)**
- **X**: [`@CloudflareDev`](https://x.com/CloudflareDev) で新機能情報が流れる
- **[Blog](https://blog.cloudflare.com/)** — サービスアーキテクチャやビジョン、新機能などドキュメントで読み取れないことを書いてくれている。
- **[GitHub](https://github.com/cloudflare)** — Workers テンプレート・サンプルコードが豊富
