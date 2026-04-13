# Cloudflare で始める Data Platform

## Cloudflare Data Platform

2025年9月25日、Cloudflare が「[Cloudflare Data Platform](https://blog.cloudflare.com/cloudflare-data-platform/)」を発表した。

- **Cloudflare Pipelines**（ストリーミング ETL）
- **Cloudflare R2 Data Catalog**（Iceberg REST Catalog）
- **Cloudflare R2 SQL**（分散クエリエンジン）

の3コンポーネントを軸にした、エンドツーエンドのサーバーレス分析基盤。

- https://workers.cloudflare.com/product/data-platform

コンセプトは **「エグレス料金ゼロ + Apache Iceberg 標準」**。従来の DWH/Lakehouse が抱えていた「データを取り出すたびに課金される」「ベンダー固有のフォーマットに縛られる」という2大摩擦を同時に外しに来た。

ISMAP にも登録されている。官公庁・金融機関で Cloudflare を採用する障壁が下がった。

↑ TODO: データプラットフォーム全体像（Sources → Extract → R2+Catalog → Transform → Query → Activation）のExcalidraw俯瞰図を書く。

## Cloudflare Workers

Cloudflare の中核。2017年の発表以来、Cloudflare を「CDN 企業」から「開発者プラットフォーム」に変えた転換点のサービス。

V8 Isolate という軽量な実行単位でコードを分離する方式のため、**コールドスタート 0ms・128MB** という制約の中でエッジで動く。コンテナや VM を使わないことで、AWS Lambda とは別のスケーリング特性を持つ。

「リージョンを選ぶ」必要がなく、デプロイした瞬間に 330+ 拠点で動く。これが Data Platform のすべての前提になっている。

### Binding

従来の SDK + IAM とは一線を画すアプローチ。

- AWS の場合: `import { S3Client } from "@aws-sdk/client-s3"` → IAM Role → 認証情報ローテーション → ...
- Cloudflare の場合: `wrangler.toml` に `[[r2_buckets]]` を書く → Worker 内で `env.BUCKET.put(...)` で直接呼べる

Binding は**認証情報を持たない**。Cloudflare のネットワーク内で、リソース間の参照を名前空間で解決する仕組み。つまり「鍵を発行する」概念自体がない。漏洩する鍵がない、ローテーションもいらない、IAM ポリシーも書かない。

R2, D1, KV, Durable Objects, Queues, Vectorize, Workers AI, Analytics Engine ... すべて Binding で繋ぐ。Data Platform はこの「Binding で接着するコンピュート」を前提に組み立てられている。

↑ TODO: 「AWS SDK+IAM vs Cloudflare Binding」の対比図をExcalidrawで書く。

## Durable Objects

Data Platform の文脈では「ステートフルなエッジ集約ポイント」として働く。

### 何が特殊か

- **シングルスレッド実行**: 同一オブジェクトへのリクエストは直列化される。分散システムで難しい「強い一貫性」が自然に得られる
- **プライベートストレージ**: 各 DO に SQLite（2025年4月 GA、1 DO あたり 10GB）または KV ストレージが付属
- **コンピュートとストレージが同じ場所**: Redis のように別サービスに接続しない。ラウンドトリップがない

### データ基盤での使いどころ

- **リアルタイム集計**: カウンタ、セッションウィンドウ集計を DO で保持して、閾値超えで R2 にフラッシュ
- **Exactly-once**: 重複排除カーソルの管理
- **分散ワーカー間の協調**: ロック、リーダー選出
- **ステートフルカーソル**: ストリーミングの読み取り位置

```typescript
// 例: イベントをバッファして 1000件溜まったら R2 にフラッシュ
export class EventAggregator extends DurableObject {
  private buffer: any[] = [];
  async fetch(request: Request) {
    this.buffer.push(await request.json());
    if (this.buffer.length >= 1000) await this.flush();
    return new Response("ok");
  }
  private async flush() {
    await this.env.BUCKET.put(`agg/${Date.now()}.json`, JSON.stringify(this.buffer));
    this.buffer = [];
  }
}
```

### Jurisdiction（法的保証）

`.jurisdiction("eu")` を付けた名前空間で作った DO は、**EU 内でしか実行・保存されない**ことが保証される。GDPR 対応で「PII を扱う処理だけ EU 内で走らせたい」というパターンに効く。エッジ Worker は認証・ルーティングだけをやり、PII を含む処理は EU の DO に委譲する、という構成が取れる。

R2 / D1 と違って `wrangler.toml` ではなく**コードで動的に指定**するのがポイント。

### Facets + Dynamic Workers（2026年4月13日ベータ）

AI が生成した JS/TS コードを、スーパーバイザー DO が**子 Facet** として動的ロードできる仕組み。各 Facet は独立した SQLite を持つ。AI がユーザーごとに生成する「パーソナルアプリ」をセキュアに走らせつつ、課金・ログ・アクセス制御は親 DO で一元管理するユースケース向け。

→ ブログ: https://blog.cloudflare.com/durable-object-facets-dynamic-workers/

## Ingestion

取り込み先として扱いたいデータソース:

- **Linear** — Issue / Project のスナップショット
- **GitHub** — commits, PRs, issues, Actions の履歴
- **Spotify** — 聴取履歴（プライベート分析用）
- **Oura ring** — 健康情報を集める。
- **Moneyforward** — CSV エクスポートの家計簿
- **Workers Observability** — 自分自身のログ・メトリクス
- **PostgreSQL → Debezium** — CDC でのニアリアルタイム同期
- **PostgreSQL → DuckDB** — 差分スナップショットのバッチ取り込み
- **Obsidian** — ~/zettelkasten をそのまま R2 に同期
- **Morgen** — カレンダーAPIがあるので

これらを **Excalidraw で「データソースから R2 に到達するまで」の流れ**を書きたい。Pipelines / dlt / Queues / Workers のどれをどう使い分けるかを可視化する。

↑ TODO: データソース × 取り込み経路のマトリクスをExcalidrawで書く。

### Cloudflare Pipelines

ストリーミング取り込みの主役。内部エンジンは Cloudflare が買収した [**Arroyo**](https://www.arroyo.dev/)（Rust 製ストリーム処理）。

3コンポーネント構成:

- **Stream** — 耐久バッファ。HTTP エンドポイントまたは Worker Binding から書き込める
- **Pipeline** — Stream から読んで SQL で変換する（フィルタ・PII マスキング・正規化）
- **Sink** — 書き出し先。現在は R2 Data Catalog（Iceberg テーブル）

ユニークポイント:

- **SQL 宣言的変換**: Firehose の Lambda 変換（命令的）と対照的
- **At-least-once 配信**（重複は発生しうるが欠損しない）
- **Iceberg 自動管理**: JSON → Parquet 変換、パーティショニング、コンパクションまで自動

#### Stream

耐久バッファの層。スキーマを与えると型付きで受け取ってくれる。入力経路は2つ:

- **HTTP**: `--http-enabled true` で公開 HTTP エンドポイントを生やす。認証は HMAC
- **Worker Binding**: `env.RAW_EVENTS.send(event)` みたいに Worker からバインディング経由で送れる

#### Sink

書き出し先。R2 Data Catalog を指すと、指定したテーブルに Iceberg として継続的に追記される。

```bash
wrangler pipelines sinks create events_sink \
  --type r2-data-catalog \
  --bucket my-bucket \
  --namespace analytics \
  --table events
```

#### Pipeline

Stream と Sink をつなぐ SQL。マスキング・フィルタ・派生カラム生成などを宣言的に書ける。

```sql
INSERT INTO events_sink
SELECT
  user_id,
  REGEXP_REPLACE(email, '(.{2}).*@', '$1***@') AS email,
  lower(event_type) AS event_type,
  to_timestamp_micros(ts_us) AS event_time
FROM raw_events
WHERE event_type != 'debug'
  AND NOT regexp_like(user_agent, '(?i)bot|spider')
```

#### 設定変更（マイグレーション）

スキーマを変えたいとき、Stream や Sink を作り直すのではなく Wrangler CLI で定義を更新できる。Iceberg 側のスキーマエボリューションとも連動する。

### dlt on Cloudflare Sandbox

バッチ処理は dlt（data load tool）でやる。dlt は Python の OSS で、SaaS API のスキーマを自動推論してターゲット（R2/Iceberg）に書き出してくれる。

Sandbox SDK は **2026年4月13日に GA**（Containers も同日 GA）。Workers から簡単な API でコマンド実行・ファイル管理ができる「Containers の上のマネージド実行環境」で、Docker を自分でビルド・管理する必要がない。

```
Cron Trigger → Worker → Sandbox
                          ↓ pip install dlt[filesystem]
                          ↓ python pipeline.py
                          ↓ （R2 に書き込み）
                        → Iceberg テーブル更新
```

Sandbox の嬉しさ:

- `pip install` でオンデマンド実行できるので、dbt / dlt / soda などを Dockerfile を書かずに動かせる
- **R2 を S3 互換マウントとしてファイルシステム経由で触れる**
- PTY（WebSocket 経由の xterm.js 互換ターミナル）も使える
- スナップショットが R2 に保存される（Figma Make で採用）

Sandbox は Workers の延長として使うのが良い。常駐プロセスや重たいコンテナ前提のサービスは Containers に寄せる。

↑ TODO: Workers → Sandbox → Containers の抽象度グラデーション図をExcalidrawで書く。

## ストレージ

### Cloudflare R2

オブジェクトストレージ。**エグレス料金ゼロ**が一番の売り。S3 互換 API を持つので既存ツールチェーンがそのまま動く。

Data Platform の文脈では「全データが集まるハブ」。Pipelines の Sink、dlt の書き出し先、dbt の中間・成果物、BI の静的アセット、AI Search のドキュメント置き場、すべて R2 に集まる。

#### データロケーション

R2 のバケットは作成時に **Location Hint**（地域優先順位）を指定できる。`APAC` / `EEUR` / `ENAM` / `WEUR` / `WNAM` の5つ。ただし**法的保証ではなくベストエフォート**。

Data Residency（法的に特定リージョンに留めたい）が必要なら、**Jurisdictional Buckets**（EU / FedRAMP）を使う。こちらは保証付き。R2 と Durable Objects で同じ設計思想（hint vs jurisdiction の分離）。

### Cloudflare R2 Data Catalog

**Apache Iceberg 対応**の REST Catalog。R2 バケットに書かれた Parquet ファイル群を Iceberg テーブルとして管理する。

何が嬉しいか:

- **スキーマエボリューション**: カラム追加・リネーム・型変更をメタデータで管理
- **タイムトラベル**: 特定時点のスナップショットを読み返せる
- **パーティションエボリューション**: パーティショニング戦略を後から変えられる
- **ACID トランザクション**: 複数ファイルへの同時書き込みでも一貫性が保たれる
- **自動コンパクション**: 小さなファイルがたまらないように裏で束ねてくれる

Iceberg は **Snowflake / Databricks / DuckDB / Spark / Trino / PyIceberg** など主要エンジンが全部読める。R2 Data Catalog は「Iceberg の仕様通りに喋る REST Catalog」なので、**Snowflake から外部テーブルとして R2 を読む**、みたいなこともできる。ベンダーロックインが構造的に起きにくい。

### Cloudflare R2 SQL

Athena のようなもの。R2 + Data Catalog に対して SQL を投げられる分散クエリエンジン（**DataFusion ベース**）。

- サーバーレス（クラスタ起動なし、クエリ単位課金）
- Iceberg ネイティブ
- Workers バインディングで呼べる

まだまだ発展途上。Snowflake / BigQuery のようなフル機能の DWH エンジンと比べると、関数ライブラリやオプティマイザの成熟度で差がある。ただ「エッジから SQL を直接打てる」「クエリ結果を Workers の中で加工して API で返せる」という**エッジ統合**が独自。

使い分け:

- **軽いクエリ・API の裏**: R2 SQL
- **ブラウザ内分析・軽量集計**: DuckDB WASM
- **インプロセス分析（Sandbox/Container 内）**: DuckDB + httpfs で R2 を読む
- **フル機能 DWH**: Snowflake から Iceberg を外部テーブル参照

## dbt on Cloudflare Containers

dbt を Cloudflare Containers 上でビルドできる。Containers は 2026年4月13日 GA。

R2 に Binding ができるので、アーティファクト（`manifest.json`, `catalog.json`, コンパイル済み SQL, ドキュメント）を R2 に置くみたいなことも簡単。結果として:

- dbt docs を Workers Static Assets で配信
- manifest を AI Search に食わせて「自然言語でデータカタログ検索」
- Elementary の異常検知レポートを Workers に置いて Slack 通知

という連鎖が Cloudflare だけで完結する。

Sandbox 上でも dbt は動く（`pip install dbt-duckdb`）。軽い検証や PR ごとの dbt run は Sandbox、本番の常駐ビルドは Containers、という使い分け。

## Orchestration

### Cloudflare Workflows

Workers を Cron Trigger で動かしまくるのは限度があるので、Workflows を使う。

Temporal / AWS Step Functions 相当の **耐久実行エンジン**。コードでワークフローを定義し、各ステップの状態が自動永続化される。クラッシュしても途中から再開する。

コードで書いて、**Cloudflare ダッシュボードから依存関係含めグラフが見られる**（2026年発表）:

→ https://blog.cloudflare.com/ja-jp/workflow-diagrams/

基本単位は `step.do()`:

```typescript
export class DataPipelineWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event, step) {
    const raw = await step.do("extract", {
      retries: { limit: 3, delay: "10 seconds", backoff: "exponential" },
      timeout: "2 minutes",
    }, async () => fetchData(event.payload.sourceUrl));

    const transformed = await step.do("transform", async () => transform(raw));

    await step.do("load-r2", async () => {
      await this.env.BUCKET.put(`data/${Date.now()}.json`, JSON.stringify(transformed));
    });

    await step.sleep("wait-downstream", "5 minutes");

    await step.do("notify", async () => notifySlack(this.env.WEBHOOK_URL));
  }
}
```

嬉しさ:

- **各ステップでリトライポリシーが独立**: Extract は3回、Load は5回、みたいに
- **`step.sleep()` / `step.waitForEvent()`**: 長時間待機や外部イベント待ちが自然に書ける
- **状態永続化**: Worker のプロセスが落ちても次のインスタンスが続きから実行
- **Cron Trigger と統合**: `triggers.crons` で定期起動

Reverse ETL、dbt ビルド → テスト → ドキュメント配信、データ品質スキャン → 失敗時 Slack、みたいな処理は全部 Workflows で組むのが自然。

↑ TODO: Cron → Workflow → step.do の連鎖図をExcalidrawで書く。

## AI

### Cloudflare Agents

Cloudflare の **Agents SDK** は Durable Object ベース。各エージェントが DO のインスタンスとして動くので、**ステートフル・シングルスレッド・エッジ実行**という特性がそのまま乗る。

書きたいサンプル:

- **Sandbox との連携**: エージェントが Sandbox 上で Python を実行して結果を解釈する
- **Agent to Agent**: 複数のエージェントが MCP 経由で協調する

2026年4月13日の Sandbox GA ブログで「Agents have their own computers」と言っていたように、**エージェントが自分専用の sandbox を持つ**というモデルが Cloudflare のスタンス。

### Workers AI

Cloudflare のサーバーレス LLM/Embedding 推論サービス。`env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt })` で呼べる。

- Llama、Mistral、Gemma 系が一通り使える
- **Embedding モデル**（`@cf/baai/bge-base-en-v1.5` など）が Vectorize とセットで使える
- トークン課金（AWS Bedrock と似た課金モデル）

Data Platform の文脈では「**Workers の横で LLM を走らせる**」のがポイント。Binding 1つで呼べるので、データ処理パイプラインの中に LLM 推論を挟みやすい（PII マスキングの判定、ログの分類、カテゴリ自動付与 etc）。

### AI Gateway

LLM API コールに**プロキシを噛ます**と何が嬉しいか、というサービス。

- **キャッシュ**: 同一プロンプトの結果をキャッシュして重複コストを削減
- **レート制限**: プロバイダー別 / ユーザー別に制限
- **ロギング**: プロンプト・レスポンス・トークン数・レイテンシを全部記録
- **アナリティクス**: コスト・エラー率・レイテンシのダッシュボード
- **フォールバック**: 一次プロバイダー障害時に二次に自動切り替え（OpenAI → Anthropic → Workers AI）
- **マルチプロバイダー統一エンドポイント**: OpenAI / Anthropic / Google / Cerebras / Groq 等を同じ API 形で呼べる

Workers AI も AI Gateway 経由で呼べる（`env.AI.run(..., { gateway: { id: "my-gw" } })`）。

**データ基盤で嬉しいのは「AI コールの一元ログ」**。埋め込み生成や LLM 分類の全コールを AI Gateway で計測することで、コスト可視化と A/B テストが同じダッシュボードでできる。

↑ TODO: AI Gateway の「Fallback ルーティング」図をExcalidrawで書く。

### Vectorize

Cloudflare ネイティブのベクトルDB。Workers AI の Embedding モデルとのシームレスな連携が前提。

- `wrangler vectorize create my-index --dimensions=768 --metric=cosine` でインデックス作成
- Binding 経由で upsert / query
- **メタデータフィルタ**、**名前空間**、**複数距離メトリクス**（cosine / euclidean / dot）

RAG パイプラインでの典型例:

```
ドキュメント → Workers AI で埋め込み生成 → Vectorize に upsert
ユーザークエリ → Workers AI で埋め込み → Vectorize で類似検索 → LLM に渡して回答生成
```

後述の AI Search（マネージド RAG）を使う場合は Vectorize を直接触らなくてよくなる。「自分でパイプラインを組みたい」「既存のインデックスを使い回したい」みたいなときは Vectorize を直接使う。

### AI Search（旧 AutoRAG）

R2 にファイルを配置する、またはドメインを接続するだけですごく簡単に RAG ができる。**2025年9月に AutoRAG から AI Search にリネーム**。

やってくれること:

1. **データ取得**（R2 バケット or ドメインクロール）
2. **Markdown 変換**（PDF/Office/画像を Markdown に統一、Workers AI の Markdown Conversion 機能）
3. **チャンク分割**（再帰的、サイズ・オーバーラップ設定可）
4. **Embedding 生成**（Workers AI）
5. **Vectorize へ格納**
6. **継続的インデキシング**（6時間ごとに差分検知）

提供されるエンドポイント:

- `/search` — 類似検索のみ
- `/chat/completions` — OpenAI 互換の RAG レスポンス生成
- `/mcp` — MCP サーバーとして AI エージェントから呼べる

**ファイルサイズ上限 4MB** の制約はあるが、対応ファイルタイプが広い: `.md`, `.html`, `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.png`, `.jpg`, コード各種。

**Obsidian のファイルを R2 に置いて RAG を実装する**とかやりたい。~/zettelkasten を R2 に同期する Workflow を組めば、**「自分の知識ベース」で動く自前 ChatGPT** が作れる。インデキシングは自動、検索 API も OpenAI 互換なので、Raycast / Claude / Cursor のどれからも叩ける。

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

認証をかけられる。**Zero Trust Access** の一部で、任意の URL の前段に「Google/GitHub/OIDC で認証通った人だけ通す」という関門を立てられる。

Data Platform の文脈では:

- **社内 BI（Evidence, Lightdash）の前段に置く**: VPN や IP 制限を書かずに SSO で社内限定配信
- **API エンドポイントの保護**: Reverse ETL の宛先 API、管理画面、ドキュメントサイト
- **AI Search の保護**: カスタムヘッダー経由で認証済みコンテンツのクロールも可能

### data analysis on Cloudflare Sandbox

Sandbox の上で Python を動かして、その場でデータ分析できる。

→ https://developers.cloudflare.com/sandbox/#data-analysis--notebooks

Polars / Pandas / DuckDB / Matplotlib を `pip install` して、R2 の Parquet を直接読んで集計、という流れが Dockerfile なしで動く。アドホック分析の置き場として嬉しい。

### marimo on Cloudflare Workers

ノートブックが簡単に扱える。データソースの連携も楽。Iceberg も。

→ https://blog.cloudflare.com/ja-jp/marimo-cloudflare-notebooks/

marimo は「リアクティブな Python ノートブック」。Jupyter と違って DAG ベースでセル間の依存が追跡されるので、**ノートブックがそのまま本番のデータアプリになる**のが特徴。Cloudflare Workers 上でホストできるようになったので、Sandbox で書いた分析をそのまま共有 URL で配信できる。

### Evidence on Cloudflare Workers

Evidence は SQL + Markdown で書く BI ツール。**Static Assets を吐き出す**ので、それを Workers Static Assets でホスティングできる。

ビルドフローは:

```
dbt run → R2 に成果物 → Evidence が R2 を読む → Static Assets としてビルド → Workers で配信
```

#### Browser Rendering で Evidence のスクリーンショットを撮る

Cloudflare の **Browser Rendering API** は Puppeteer / Playwright をサポートしているので、スクリーンショットを取って Slack にスナップショットを送るなど、**定期的なレポート配信**ができる。

```
Cron → Workflow → Browser Rendering で Evidence ダッシュボードを撮影 → R2 に保存 → Slack に投稿
```

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

OSS の Reverse ETL ツール。YAML で同期定義を書いて、DWH から SaaS にインクリメンタル反映する。

https://github.com/drt-hub/drt

Cloudflare Containers に乗せると、「dbt run が終わったら drt が走って結果を Salesforce/HubSpot に反映」みたいなループが Workflows で組める。

## Observability

### Workers Observability

Workers 自身の実行ログ・メトリクス・トレースを取る仕組み。Workers Logs、Tail Workers、Logpush、Analytics Engine が組み合わさっている。

#### OTLP エクスポート先

OpenTelemetry に対応していて、**Trace と Span を OTLP でエクスポート**できる。Datadog / Honeycomb / Grafana Tempo など OTLP 受け取れるバックエンドならどこにでも送れる。

自前のデータ基盤を作るなら、「Workers の OTLP → Pipelines → R2 Iceberg」という流れで**自分のログを自分のデータプラットフォームに食わせる**のが筋が良い。eat your own dog food。

#### Observe（Snowflake）へのエクスポート

Cloudflare と Observe / Snowflake の統合エクスポート。大規模な分析が必要な場合の逃げ道。

### Logpush

Cloudflare 全体のログ（WAF / DNS / Workers / Zero Trust / R2 アクセスログ等）を**定期的に外部ストレージにプッシュ**する仕組み。宛先に R2 を指定すれば、**全 Cloudflare ログが自分の R2 に流れてくる**。

そこから Pipelines で Iceberg テーブルにしてしまえば、「Cloudflare のログを自分の Data Platform で分析する」が完結する。

### Analytics Engine

ClickHouse ベースの時系列データストア。Workers Binding で直接 write できるので、カスタムメトリクスを積むのが一瞬。

```typescript
env.ANALYTICS.writeDataPoint({
  blobs: [event.type, event.userId],
  doubles: [event.duration, event.tokenCount],
  indexes: [event.model],
});
```

SQL API でクエリできるので、ダッシュボードや異常検知の裏側にそのまま使える。Data Platform 内では「ホット層の集計置き場」「R2 Iceberg に落とす前のバッファ」として働く。

## Data Catalog

dbt docs を Cloudflare Workers でホスティングする。OpenMetadata を Cloudflare Containers でホスティングする。

**Cloudflare ネイティブな構築案（自前実装をしてみる）**: Astro（Workers SSG）+ AI Search（AutoRAG）で**自然言語で検索できるデータカタログ**を構築する。

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

Node.js (TypeScript) 製。Cloudflare の**全プロダクトが wrangler 1本で操作可能**なのが最大の強み。

```
wrangler d1          — SQLite DB
wrangler r2          — オブジェクトストレージ
wrangler kv          — Key-Value
wrangler queues      — メッセージキュー
wrangler pipelines   — ストリーミング
wrangler hyperdrive  — DB 接続プール
wrangler vectorize   — ベクトル DB
wrangler ai          — AI モデル
wrangler workflows   — ワークフロー
wrangler containers  — コンテナ
wrangler dev         — ローカル開発
（35+ サブコマンド）
```

Snow CLI（Snowflake）、bq（BigQuery）、Databricks CLI と比べても、**ローカル開発エミュレーション**（`wrangler dev` + Miniflare）は唯一無二。D1 / KV / R2 / Queues 等を全てローカルでエミュレートし、インターネット接続なしで開発できる。Snow/bq/Databricks はリモートサービスへの接続が必須。

弱点はプロファイル切り替え（複数アカウント使い分け）が環境変数頼みなこと、SQL 実行のコマンドが冗長なこと、stdin パイプ未対応なこと。

↑ TODO: Wrangler vs Snow vs bq vs Databricks CLI の成熟度比較表（カバー範囲・ローカル開発・CI/CD）をExcalidrawで書く。

### cf CLI（2026-04-13 technology preview）

Wrangler に加えて、Cloudflare は**全プロダクト横断の新統一 CLI `cf`** を technology preview で公開した。

→ https://blog.cloudflare.com/cf-cli-local-explorer/

特徴:

- **約 3,000 API 操作**を1つの CLI でカバー。Cloudflare の公式 REST API にあるものはほぼ全部触れる
- **TypeScript の新スキーマから自動生成**。CLI・バインディング・ドキュメント・**AI エージェント用 Skill** まで同じソースから吐き出す
- **AI エージェントを主要ターゲット**に据えた設計。Claude / Cursor などから Cloudflare リソースを安全に操作させる前提で作られている
- **Local Explorer**: `wrangler dev` 実行中にキー `e` を押すと起動。KV / R2 / D1 / Durable Objects / Workflows をローカルから検査できる

Wrangler との住み分け（現時点の理解）:

- **Wrangler**: 開発者向けの成熟 CLI。ローカル開発・デプロイ・プロジェクト管理の主戦場
- **cf**: プラットフォーム全体の API 窓口。運用・管理・AI エージェント経由の操作向け

Wrangler が「Workers 開発者の相棒」として尖っているのに対し、`cf` は「Cloudflare プラットフォームそのものの CLI ラッパー」という立ち位置。**Databricks CLI の API 完全カバレッジ型**（REST API の自動生成ラッパー）に近い思想を、Cloudflare 側が取り込んできたと読める。

Data Platform の文脈では、`cf` が面白いのは **「AI エージェント向け Skill が同じソースから生成される」**こと。Cloudflare MCP サーバー + `cf` skill の組み合わせで、エージェントが「Pipelines のスキーマを更新して R2 の権限を変えて D1 にスキーマをデプロイする」みたいな複合操作を人間の介在なしにやれるようになる。

↑ TODO: Wrangler と cf の住み分け（開発者向け vs プラットフォーム API 窓口）をExcalidrawで書く。

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
