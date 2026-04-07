# Cloudflare で始める Data Platform

2025年9月25日、Cloudflare は「[Cloudflare Data Platform](https://blog.cloudflare.com/cloudflare-data-platform/)」を発表した。Pipelines + R2 Data Catalog + R2 SQL という3コンポーネントで構成される、エンドツーエンドのサーバーレス分析基盤。エグレス料金ゼロ + Apache Iceberg 標準でベンダーロックインなし、というコンセプトで、従来の DWH/Lakehouse の常識を覆す存在として登場した。

---

## Cloudflare とは

2010年創業。CDN・DDoS防御・WAF からスタートし、現在は **330+ 都市のエッジネットワーク**を持つグローバルなクラウドプラットフォームに成長した。2025年通期の年間収益は $2.17B（前年比 +30%）、Fortune 500 の 38% が顧客。日本では [ISMAP](https://ismap.go.jp/) を取得しており、官公庁・金融機関での採用障壁が低い。

最大の特徴は「**リージョンを Earth と謳っている**」こと。AWS/GCP/Azure がリージョンを選ばせるアーキテクチャであるのに対し、Cloudflare はデプロイした瞬間に全 330+ 拠点で動く。ユーザーに最も近い場所で実行されるため、リージョン設計・レイテンシ最適化・マルチリージョン冗長を考える必要がない。

## Cloudflare の世代

Cloudflare はどのような進化を経て、Data Platform を名乗るに至ったか。3つの世代で理解できる。

### CDN

2010年創業。最初のプロダクトは CDN（コンテンツデリバリネットワーク）とセキュリティ（DDoS 防御・WAF）。世界中にエッジサーバーを展開し、ユーザーに最も近い拠点からコンテンツを配信する。この「グローバルエッジネットワーク（現在 330+ 都市）」こそが Cloudflare の最大の資産であり、後のすべてのサービスの基盤となる。

### Edge Computing

2017年、**[Cloudflare Workers](https://developers.cloudflare.com/workers/)** を発表。CDN のエッジサーバー上で JavaScript を実行できるようにした。これが Cloudflare を「CDN 企業」から「開発者プラットフォーム」へ変える転換点だった。

コンテナや VM を使わず、[V8 Isolate](https://blog.cloudflare.com/cloud-computing-without-containers/) という軽量な実行単位でコードを分離する。コールドスタート 0ms、128MB という制約の中で、ユーザーに最も近い場所でコードが動く。

その後、ストレージプリミティブが次々と追加された：
- **[KV](https://developers.cloudflare.com/kv/)**（2019 GA）: グローバル分散 Key-Value ストア
- **[Durable Objects](https://developers.cloudflare.com/durable-objects/)**（2021 GA）: ステートフルなシングルトン
- **[R2](https://developers.cloudflare.com/r2/)**（2022 GA）: エグレス無料のオブジェクトストレージ
- **[D1](https://developers.cloudflare.com/d1/)**（2024 GA）: サーバーレス SQLite データベース

「コンピュート → ストレージ → フルスタック」という段階を踏んで、エッジで完結するアプリケーション開発基盤が整っていった。

### クラウドインフラ、Data Platform、AI

2023〜2025年にかけて、3つの柱が揃った。

**AI**（2023〜）: [Workers AI](https://developers.cloudflare.com/workers-ai/)（100+ モデルのサーバーレス推論）、[Vectorize](https://developers.cloudflare.com/vectorize/)（ベクトル DB）、[AI Gateway](https://developers.cloudflare.com/ai-gateway/)（LLM プロキシ）が 2023年に登場。2025年には [Cloudflare Agents](https://developers.cloudflare.com/agents/)（ステートフルエージェント）が加わり、データ基盤の上に AI ワークロードをそのまま乗せられる。

**クラウドインフラ**（2025〜）: [Containers](https://developers.cloudflare.com/containers/)（Docker コンテナ実行）、[Sandbox](https://developers.cloudflare.com/sandbox/)（Python/Node 実行環境）が加わり、Workers の制約を超えた任意のワークロードをエッジで動かせるようになった。CDN・セキュリティ・エッジコンピューティング・ストレージ・コンテナが揃い、AWS/GCP と同じ土俵で語れるクラウドインフラとして完成しつつある。

**Data Platform**（2025〜）: Pipelines（ストリーミングインジェスト）、R2 Data Catalog（Iceberg カタログ）、R2 SQL（分散クエリ）が揃い、Cloudflare だけでデータの取り込み → 保存 → 変換 → 分析 → 活用のフルサイクルが完結できるようになった。エグレス料金ゼロ + Apache Iceberg 標準で、マルチクラウドのデータハブとして機能する。

**キーメッセージ**: Cloudflare は「CDN 企業」でも「エッジコンピューティング企業」でもない。クラウドインフラ・Data Platform・AI を一体で提供するグローバルなサーバーレスプラットフォームだ。

---

## コンピューティング

Cloudflare のコンピュートは、抽象度の異なる 3 つの層で構成される。Workers（軽量・高速）→ Sandbox（Python/シェル実行）→ Containers（任意の Docker）という階層であり、データパイプラインの各フェーズで使い分ける。

### Cloudflare Workers

Workers は Cloudflare エッジネットワーク上で動作するサーバーレス実行環境（[docs](https://developers.cloudflare.com/workers/)）。JavaScript/TypeScript/Python/Rust/C/C++（WASM 経由）をサポートし、**コールドスタート 0ms** で起動する。

V8 Isolate モデルにより、コンテナや VM を使わず軽量な分離を実現。1 プロセス内で数千の Isolate を同時実行でき、Lambda のコンテナモデルとは根本的に設計が異なる。

データ基盤における Workers は**「接着剤（glue）」レイヤー**として機能する。Webhook 受信・データルーティング・軽量変換・スケジュール実行・他サービスのオーケストレーションを担う。

制限値（Paid プラン）:
- CPU 時間: 30 秒（最大 5 分）
- メモリ: 128 MB
- リクエスト: 無制限

#### Workers Static Assets と Pages の関係

Workers には **[Static Assets](https://developers.cloudflare.com/workers/static-assets/)** 機能があり、静的ファイル（HTML/CSS/JS/画像）を Workers と同じデプロイで配信できる。Evidence・dbt docs・Astro などの静的サイトは Workers Static Assets でホスティングするのが現在の推奨。

以前は **[Cloudflare Pages](https://developers.cloudflare.com/pages/)** が静的サイトホスティングの専用プロダクトだったが、Workers Static Assets の登場により **Pages への新規機能追加は行わない**ことが Cloudflare から明言されている（[Workers Static Assets GA ブログ](https://blog.cloudflare.com/workers-static-assets-ga/)）。既存の Pages プロジェクトは引き続き動作するが、新規プロジェクトは Workers Static Assets を使うべき。[Pages → Workers 移行ガイド](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)が公式に提供されている。

以下は Workers でのみ利用可能で、Pages ではサポートされない機能:
- Cron Triggers（定期実行）
- Durable Objects
- Workers Logs / Logpush / Tail Workers
- Gradual Deployments（段階的デプロイ）
- Queue Consumers
- Email Workers
- Cloudflare Vite プラグイン

移行時の注意点として、Pages では SPA ルーティングや 404 ページの自動検出が暗黙的に行われていたが、Workers Static Assets では `not_found_handling` パラメータで明示的に設定する必要がある。

#### Binding

Binding は **Workers から Cloudflare のリソースにアクセスするための仕組み**。`env` オブジェクトを通じて、ストレージ・データベース・AI・他の Worker などに**ゼロレイテンシ**で接続する。

AWS Lambda が「SDK をインポート → IAM で認証 → HTTP 経由で API コール」するのに対し、Workers の Binding は**リソースへの接続済みハンドルを直接注入**する。SDK 不要・認証不要・ネットワークホップなし。

```typescript
// Lambda: SDK + IAM + HTTP
const s3 = new S3Client({ region: "us-east-1" });
await s3.send(new PutObjectCommand({ Bucket: "my-bucket", Key: "file.json", Body: data }));

// Workers: Binding で直接アクセス
await env.BUCKET.put("file.json", data);
```

セキュリティモデルも異なる。Lambda は「IAM ポリシーで誰が何をできるか定義する」Policy-based。Workers は「Binding を持つ Worker だけがアクセスできる」Capability-based。宣言されていないリソースへのアクセスは、コンパイル時にも実行時にも不可能。

主な Binding 一覧:
| Binding | サービス | 用途 |
|---------|---------|------|
| R2 Bucket | R2 | Parquet/Iceberg のストレージ |
| D1 Database | D1 | SQLite RDB |
| KV Namespace | KV | キャッシュ・設定 |
| Queue Producer | Queues | 非同期メッセージ送信 |
| Pipeline | Pipelines | イベントストリーミング |
| Workflows | Workflows | 長時間ワークフロー |
| Sandbox | Sandboxes | Python/Node 実行 |
| Containers | Containers | Docker コンテナ |
| Workers AI | Workers AI | LLM・埋め込み推論 |
| Vectorize | Vectorize | ベクトル検索 |
| Hyperdrive | Hyperdrive | PostgreSQL への高速接続 |

### Cloudflare Container

Containers は Cloudflare ネットワーク上で Docker コンテナを実行するサービス（[docs](https://developers.cloudflare.com/containers/) / Beta）。Workers の制約（CPU 30 秒、メモリ 128 MB、JS/TS/WASM のみ）を超えるワークロードに対応する。

Workers で「できなかったこと」を Containers が解放する:
| 制約 | Workers | Containers |
|------|---------|------------|
| 実行時間 | CPU 最大 30 秒 | 制限なし |
| メモリ | 128 MB | 最大 12 GiB |
| 言語・ランタイム | JS/TS/WASM | Docker image なら何でも |
| 常駐プロセス | 不可 | デーモン・常駐サービス |

**重要な設計原則**: Containers はエッジではなく**リージョナル実行**。レイテンシは Workers より高い。全部 Containers にするのではなく「Workers が重い処理を委譲する」という使い方が正しい。

データ基盤での主なユースケース:
- **dbt on Containers**: Dockerfile で dbt 環境を固定し再現性を確保。定期バッチの推奨構成
- **Cube on Containers**: セマンティックレイヤー API サーバーの常駐
- **Metabase / Lightdash**: BI ツールをコンテナで自前ホスティング
- **カスタム ML 推論**: scikit-learn / XGBoost / LightGBM モデルのサービング

基盤技術は **[Firecracker microVM](https://firecracker-microvm.github.io/)**（[出典: Containers public beta ブログ](https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/)）。Firecracker 公式サイトに「used in production for AWS Lambda and AWS Fargate」と明記されており、AWS Lambda も同じ技術を使っている。軽量で高セキュリティな仮想化を提供する。

### Cloudflare Sandbox

Sandbox は **Containers の上に構築されたマネージドコード実行環境**（[docs](https://developers.cloudflare.com/sandbox/)）。Workers の API（`sandbox.run()`）から Python・Node.js・シェルコマンドを直接実行できる。Containers と違い、Docker を自分でビルド・管理する必要がない。

3 層の使い分け:
```
Workers（128MB・最も軽量）→ 重い処理 → Sandbox（Python/Node/Shell、Docker 不要）→ さらに低レベル → Containers（任意の Docker image）
```

Python イメージ（`sandbox:x.x.x-python`）には **Python 3.11 + pip + venv** と、pandas・NumPy・Matplotlib・IPython がプリインストールされている。Default イメージは Node.js + Bun のみで Python は含まれない。

uv を使いたい場合はカスタム Dockerfile で追加する:
```dockerfile
FROM docker.io/cloudflare/sandbox:0.7.0-python
RUN pip install uv
```

```bash
# pip（プリインストール済み）で直接実行
pip install dbt-core dbt-duckdb && dbt run --profiles-dir .

# uv を追加済みなら uvx で 1 コマンド実行も可能
uvx --with dbt-duckdb dbt run --profiles-dir .
```

データ基盤での役割:
- **dbt 実行環境**: Docker ビルド不要で dbt を Workers Cron から呼び出せる（シンプルな用途向け。再現性重視なら Containers を推奨）
- **SaaS バッチ EL**: dlt を `pip install` で実行し、SaaS API → R2 Iceberg に取り込む
- **データ品質チェック**: Great Expectations や Soda をオンデマンド実行
- **AI コード実行**: Workers AI が生成したコードを安全に隔離実行

料金は Containers ベースの従量課金（dbt 日次実行 30 分/日 ≈ $1〜3/月）。

---

## ストレージ

### Cloudflare R2

R2 は Cloudflare の **S3 互換オブジェクトストレージ**（[docs](https://developers.cloudflare.com/r2/)）。最大の特徴は**エグレス（データ取り出し）料金ゼロ**。AWS S3 はリージョン間転送（$0.02/GB〜）やインターネット向け転送（$0.09/GB〜）に料金が発生するが、R2 ではこれらが永久に $0。

https://r2-calculator.cloudflare.com/jp/

データ基盤における R2 は**データレイクのストレージ層**。Parquet ファイルや Apache Iceberg テーブルのデータファイルを格納し、R2 Data Catalog や R2 SQL、外部の Snowflake/DuckDB/Spark からクエリされる基盤となる。

主な特徴:
| 特徴 | 詳細 |
|------|------|
| S3 互換 API | 既存の S3 ツール・SDK がそのまま使える |
| エグレス無料 | データ読み出しに転送料金がかからない（永久無料を明言） |
| ストレージクラス | Standard / InfrequentAccess |
| ロケーションヒント | `apac`, `eeur`, `enam`, `weur`, `wnam`, `oc` から選択 |
| Workers Binding | `env.BUCKET.put()` / `env.BUCKET.get()` で直接アクセス |
| Data Catalog 統合 | バケット単位で Iceberg カタログを有効化 |
| イベント通知 | 書き込みをトリガーにワークフローを起動 |

料金（参考）:
- ストレージ: $0.015/GB/月（Standard）
- Class A ops（書き込み系）: $4.50/百万
- Class B ops（読み取り系）: $0.36/百万
- エグレス: **$0（永久無料）**

ゼロエグレスの意味するところは大きい。Snowflake/DuckDB/Spark などの外部エンジンが R2 のデータを何度読んでもコスト $0。マルチクラウドのデータハブとして、データを一度 R2 に集めれば好きなエンジンで分析できる。

#### データロケーション

R2 は「リージョンを Earth」と謳う Cloudflare の中でも、データの物理的な保存場所を制御する仕組みがある。3 つのレベルで指定できる:

**1. Automatic（デフォルト・推奨）**: バケット作成リクエストの発信元に最も近いリージョンに自動配置。何も指定しなければこれ。

**2. Location Hints（ベストエフォート）**: バケット作成時に「主にどの地域からアクセスされるか」をヒントとして指定する。**ベストエフォートであり保証ではない**。パフォーマンス最適化のためのもの。

| ヒント | 地域 |
|--------|------|
| `wnam` | 北米西部（US West） |
| `enam` | 北米東部（US East） |
| `weur` | 西ヨーロッパ |
| `eeur` | 東ヨーロッパ |
| `apac` | アジア太平洋 |
| `oc` | オセアニア |

```bash
# Wrangler でヒント付きバケット作成
wrangler r2 bucket create my-bucket --location apac
```

注意点:
- ヒントはバケット作成時のみ有効。削除して同名で再作成しても元のロケーションが使われる
- 日本から利用するなら `apac` を指定するとよい（東京/大阪リージョン付近に配置される可能性が高い）

**3. Jurisdictional Restrictions（法的保証）**: データの保存**と処理**が特定の法域内に限定されることを**保証**する。Location Hints と違い、法的なデータレジデンシー要件を満たす。

| Jurisdiction | 説明 | ユースケース |
|-------------|------|------------|
| `eu` | EU | GDPR 準拠が必要なデータ |
| `fedramp` | FedRAMP | 米国政府向け（Enterprise のみ） |

```typescript
// EU Jurisdiction 付きバケットへの接続（S3 API）
const S3 = new S3Client({
  endpoint: "https://<account_id>.eu.r2.cloudflarestorage.com",
  // ...
});
```

Jurisdiction を指定すると、S3 エンドポイントが `<account_id>.<jurisdiction>.r2.cloudflarestorage.com` に変わる。一度設定した Jurisdiction は変更不可。

**Location Hints vs Jurisdictions の使い分け**:
- パフォーマンス最適化 → **Location Hints**（ベストエフォート、制約なし）
- 法的データレジデンシー要件 → **Jurisdictions**（保証あり、ただし Logpush 非対応などの制約あり）

#### Local Uploads

グローバルに分散したユーザーからの書き込みパフォーマンスを最適化する機能。有効にすると、アップロードされたデータはまずクライアントに近い場所に一時保存され、その後バケットの本来のリージョンにレプリケーションされる。

読み取りのレイテンシに影響がある（レプリケーション完了前の読み取りはクロスリージョンレイテンシが発生）ため、Write-heavy で Read が遅延許容できるワークロード向け。Jurisdiction 付きバケットでは使用不可。

### Cloudflare Data Catalog

R2 Data Catalog は、R2 上に格納された **[Apache Iceberg](https://iceberg.apache.org/) テーブルのメタデータを管理するカタログサービス**（[docs](https://developers.cloudflare.com/r2/data-catalog/)）。標準の **Iceberg REST Catalog API** を公開しているため、Spark・Snowflake・Trino・DuckDB・PyIceberg など既存のデータエンジンからそのまま接続できる。

Iceberg テーブルとして書き込むと、R2 バケット内に以下の構造が自動的に作られる:
```
my-bucket/
└── warehouse/
    └── analytics/              ← namespace
        └── page_views/         ← table
            ├── metadata/
            │   ├── v1.metadata.json     ← テーブル定義（スキーマ・パーティション等）
            │   ├── snap-xxxx.avro       ← マニフェストリスト
            │   └── yyyy-manifest.avro   ← マニフェスト（ファイル一覧）
            └── data/
                ├── 00000-0-xxxx.parquet
                └── ...
```

なぜ Iceberg なのか:
- **ACID トランザクション**: 読み書きの一貫性を保証
- **スキーマ進化**: カラムの追加・削除・名前変更が安全
- **タイムトラベル**: 過去の任意のスナップショットを参照
- **ベンダー非依存**: どのエンジンからでもアクセス可能（ベンダーロックインなし）

データの書き込み経路は主に 3 つ:
1. **Pipelines**（推奨）: HTTP でイベントを送るだけで Iceberg に自動書き込み
2. **PyIceberg**（Python バッチ）: SaaS API からのバッチ取り込みに最適
3. **Spark**（大規模）: 既存 DWH からの移行・TB 規模データ

セットアップは Wrangler 1 コマンド：
```bash
wrangler r2 bucket catalog enable my-bucket
```

2025 年 12 月には**自動コンパクション**が追加。小さな Parquet ファイルが自動的にまとめられ、クエリパフォーマンスが向上する（$0.005/GB の予定）。

### Cloudflare R2 SQL

R2 SQL は、R2 Data Catalog 上の Iceberg テーブルに対して**標準 SQL でクエリを実行**できる Cloudflare ネイティブの分散クエリエンジン（[docs](https://developers.cloudflare.com/r2-sql/)）。外部の Snowflake や BigQuery を使わず、**Cloudflare のエッジネットワーク上でデータ分析が完結する**のが最大の特徴。

基盤技術は **[Apache DataFusion](https://datafusion.apache.org/)**（Rust 製 SQL クエリエンジン）+ **[datafusion-distributed](https://github.com/datafusion-contrib/datafusion-distributed)**（分散実行）+ **[Apache Arrow](https://arrow.apache.org/)**（列指向インメモリフォーマット）。

アーキテクチャは「Coordinator + 複数の Worker」による分散実行。クエリを受け取った Coordinator が、Iceberg のメタデータ（マニフェストファイル）を活用して**3 段階のプルーニング**を行い、必要なファイルだけを Worker に割り振る：
1. テーブルメタデータ（スキーマ・スナップショット）
2. マニフェストリスト（パーティションレベルの統計で除外）
3. マニフェスト（カラムレベルの min/max 統計で除外）

2026 年 3 月時点の SQL 対応状況（[changelog](https://developers.cloudflare.com/changelog/post/2026-03-23-expanded-sql-functions-expressions-complex-types/)）:
| 機能 | 状況 |
|------|------|
| SELECT / WHERE / ORDER BY / LIMIT | ✅ |
| GROUP BY / 集約関数 | ✅ |
| 近似集約（percentile, median, top-k） | ✅ |
| CASE 式 / カラムエイリアス | ✅ |
| スカラー関数 163 種（math/string/datetime/regex 等） | ✅ |
| 集約関数 33 種（統計・ビット・論理） | ✅ |
| CTE（WITH ... AS、同一テーブル制約あり） | ✅ |
| 複合型（struct / array / map） | ✅ |
| EXPLAIN | ✅ |
| **JOIN（全種類）** | **❌（H1 2026 予定）** |
| WINDOW 関数 | ❌ |
| UNION / サブクエリ | ❌ |

JOIN が未対応な理由：現在のアーキテクチャは「1テーブル、複数 Worker の並列スキャン」に最適化されており、Worker 間の通信（シャッフル）が不要。JOIN を入れると「Worker 間のデータ交換（シャッフル）」が必要になり、エッジ間の分散シャッフルという技術課題がある。

**正直な評価**: JOIN 未対応のため Snowflake/Databricks/BigQuery の代替にはならない。ただし「データレイクとして R2 に貯めて、クエリは R2 SQL で手軽に探索する」という用途なら今すぐ実用的。Beta 中は無料。

### Cloudflare D1

D1 は Cloudflare のサーバーレスな **SQLite ベースのリレーショナルデータベース**（[docs](https://developers.cloudflare.com/d1/) / 2024 年 4 月 GA）。

データ基盤における D1 の役割は、大規模分析（R2 SQL の守備範囲）ではなく、**オペレーショナルワークロード**：
- **集計済みデータの配信**: R2 Iceberg で集計した結果を D1 に書き込み、Workers API から高速返答
- **パイプラインのメタデータ管理**: ETL ジョブの実行状態・設定・ウォーターマーク
- **サービングレイヤー**: 事前計算した分析結果をエッジに近い場所からサブミリ秒で返す

主な制約（Paid プラン）:
- 最大 DB サイズ: 10 GB
- タイムトラベル: 30 日間のポイントインタイムリカバリ
- 読み書きコスト非対称性に注意: 書き込みは読み取りの **1,000 倍**の単価

D1 は水平スケール前提の設計。1 つの巨大 DB ではなく、ユーザー/テナント/エンティティごとに複数の小さな DB を作成するのが推奨パターン。Workers Paid プランで DB 数 50,000 まで作成可能。

---

## インジェスチョン

データを「どうやって入れるか」。Cloudflare の Ingest 層は目的別に 4 つの選択肢がある。

### Cloudflare Workers

最もシンプルなインジェクションパターン。Workers を **Webhook エンドポイント**として使い、外部からの HTTP POST を受け取ってストレージに書き込む。

- **Cron Triggers** で定期的に外部 API を呼び出してポーリング取得
- 受け取ったデータを Pipelines に流す（リアルタイム要件あり）か R2 に直接保存する（シンプルなケース）
- 軽量な変換（フィルタリング・フィールド抽出・型変換）をインジェスト時に実施

Workers は「インジェストの入り口」として最も柔軟。ただし CPU 制限（30 秒）があるため、重い変換は Sandbox/Containers に委譲する。

### Cloudflare Pipelines

Pipelines は Cloudflare のサーバーレス**ストリーミングインジェストサービス**（[docs](https://developers.cloudflare.com/pipelines/)）。HTTP エンドポイントまたは Workers Binding 経由でイベントデータを受け取り、自動的に R2 上の Apache Iceberg テーブルに書き込む。Kafka/Flink の運用が不要。

内部エンジンは Cloudflare が 2025 年に買収した **[Arroyo](https://www.arroyo.dev/)**（Rust 製ストリーム処理エンジン、Apache Arrow + DataFusion ベース）。

アーキテクチャ: **Stream**（データ入力）→ **Pipeline**（SQL 変換）→ **Sink**（データ出力先）の 3 コンポーネント構成。

特徴:
- **2 つの入力方式**: HTTP エンドポイント / Workers Binding（`env.STREAM.send()`）
- **SQL 変換**: 取り込み時にフィルタ・正規化・JSON 抽出・正規表現マスキングを適用（エンジンは Apache DataFusion ベース）
- **Exactly-once 配信**: 重複・欠損なし
- **Iceberg 自動管理**: JSON → Parquet 変換・バッファリング・メタデータ更新・パーティショニングを自動処理
- **制約**: Stream・Sink・Pipeline いずれも作成後の設定変更は不可（変更するには削除して再作成）

#### エンドツーエンドの構築フロー

```bash
# 1. Stream 作成（入力）
wrangler pipelines streams create raw_events \
  --schema-file schema.json \
  --http-enabled true --http-auth false

# 2. Sink 作成（出力: R2 Iceberg）
wrangler pipelines sinks create events_sink \
  --type r2-data-catalog \
  --bucket my-data-bucket \
  --namespace analytics \
  --table events \
  --catalog-token $TOKEN \
  --roll-interval 30

# 3. Pipeline 作成（SQL 変換で Stream → Sink を接続）
wrangler pipelines create events_pipeline \
  --sql "INSERT INTO events_sink SELECT * FROM raw_events"
```

対話的セットアップも可能:
```bash
wrangler pipelines setup  # stream + sink + pipeline を対話的に一括作成
```

#### Stream（データ入力）

Stream はデータの受け口。HTTP エンドポイントまたは Workers Binding からイベントを受け取る。

```bash
wrangler pipelines streams create my-stream \
  --schema-file schema.json \
  --http-enabled true \
  --http-auth true \
  --cors-origin "https://example.com"
```

スキーマ定義（schema.json）:
```json
{
  "fields": [
    { "name": "user_id", "type": "string", "required": true },
    { "name": "event_type", "type": "string", "required": true },
    { "name": "amount", "type": "float64", "required": false }
  ]
}
```

対応型: `string`, `int32`, `int64`, `float32`, `float64`, `bool`, `timestamp`, `json`, `binary`, `list`, `struct`

HTTP エンドポイントからの送信:
```bash
curl -X POST https://{stream-id}.ingest.cloudflare.com \
  -H "Content-Type: application/json" \
  -d '[{"user_id":"u1","event_type":"purchase","amount":29.99}]'
```

Workers Binding からの送信:
```typescript
// wrangler.jsonc に binding 設定が必要
// { "pipelines": [{ "pipeline": "<STREAM_ID>", "binding": "STREAM" }] }
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const events = await request.json<Record<string, unknown>[]>();
    await env.STREAM.send(events);
    return new Response("Events sent");
  },
} satisfies ExportedHandler<Env>;
```

#### Sink（データ出力先）

Sink は 2 種類。

**(A) R2 Sink** — Raw Parquet/JSON ファイルを R2 バケットに直接書き込む:
```bash
wrangler pipelines sinks create my-sink \
  --type r2 \
  --bucket my-bucket \
  --format parquet \
  --compression zstd \
  --path analytics/events \
  --partitioning "year=%Y/month=%m/day=%d/hour=%H" \
  --roll-interval 60 \
  --roll-size 100
```

**(B) R2 Data Catalog Sink** — Apache Iceberg テーブルに書き込む（推奨）:
```bash
wrangler pipelines sinks create my-iceberg-sink \
  --type r2-data-catalog \
  --bucket my-bucket \
  --namespace my_namespace \
  --table my_table \
  --catalog-token $TOKEN \
  --compression zstd \
  --roll-interval 30
```

主な Sink オプション:

| オプション | デフォルト | 説明 |
|---|---|---|
| `--type` | （必須） | `r2` または `r2-data-catalog` |
| `--bucket` | （必須） | R2 バケット名 |
| `--format` | `parquet` | `parquet` / `json`（R2 Sink のみ） |
| `--compression` | `zstd` | `zstd`, `snappy`, `gzip`, `lz4`, `uncompressed` |
| `--partitioning` | `year=%Y/month=%m/day=%d` | Hive 形式の時間パーティション（R2 Sink のみ） |
| `--roll-interval` | 300（秒） | ファイル書き出し間隔 |
| `--roll-size` | — | ファイルサイズ上限（MB） |
| `--namespace` | （必須） | Data Catalog の namespace（Iceberg Sink のみ） |
| `--table` | （必須） | テーブル名（Iceberg Sink のみ） |

Iceberg Sink の特徴:
- Parquet のみ（JSON 不可）
- namespace/table が存在しなければ自動作成
- `__ingest_ts` カラムが自動追加され DAY パーティション

#### Pipeline（SQL 変換）

Pipeline は `INSERT INTO <sink> SELECT ... FROM <stream>` 形式の SQL で Stream と Sink を接続する。

```bash
wrangler pipelines create my-pipeline \
  --sql "INSERT INTO events_sink SELECT * FROM raw_events"

# ファイルから読み込みも可能
wrangler pipelines create my-pipeline --sql-file pipeline.sql
```

SQL 変換例:
```sql
-- PII マスキング + bot 除外 + ドメイン抽出
INSERT INTO events_sink
SELECT
  user_id,
  REGEXP_REPLACE(email, '(.{2}).*@', '$1***@') as email,
  lower(event_type) AS event_type,
  regexp_match(url, '^https?://([^/]+)')[1] AS domain,
  to_timestamp_micros(ts_us) AS event_time
FROM raw_events
WHERE event_type != 'debug'
  AND NOT regexp_like(user_agent, '(?i)bot|spider')
```

SQL サポート: `WITH`（CTE）、`WHERE`、`UNNEST`（配列展開）、サブクエリ、スカラー関数（Math / String / Regex / JSON / Date / Hashing）。集約（GROUP BY）やウィンドウ関数は未サポート（ステートレス変換のみ）。

料金: Open Beta 中は無料（R2 の操作料金のみ課金）。

#### 設定変更（マイグレーション）

Stream・Sink・Pipeline は作成後に設定変更できないため、変更が必要な場合は「新規作成 → 切り替え → 旧リソース削除」のブルーグリーン方式で対応する。

**例: SQL 変換ロジックを変更したい場合**
```bash
# 1. 新しい Pipeline を作成（同じ Stream・Sink を参照可能）
wrangler pipelines create events_pipeline_v2 \
  --sql "INSERT INTO events_sink SELECT *, lower(country) AS country_normalized FROM raw_events"

# 2. 旧 Pipeline を削除（Stream への書き込みは新 Pipeline に自動的に流れる）
wrangler pipelines delete events_pipeline
```

**例: Sink のスキーマやテーブルを変更したい場合**
```bash
# 1. 新しい Sink を作成（新テーブル or 新 namespace）
wrangler pipelines sinks create events_sink_v2 \
  --type r2-data-catalog \
  --bucket my-data-bucket \
  --namespace analytics \
  --table events_v2 \
  --catalog-token $TOKEN

# 2. 新しい Pipeline を作成して新 Sink に接続
wrangler pipelines create events_pipeline_v2 \
  --sql "INSERT INTO events_sink_v2 SELECT *, now() AS processed_at FROM raw_events"

# 3. 旧 Pipeline → 旧 Sink を削除
wrangler pipelines delete events_pipeline
wrangler pipelines sinks delete events_sink
```

**例: Stream のスキーマを変更したい場合**（最も影響範囲が大きい）
```bash
# 1. 新しい Stream を作成
wrangler pipelines streams create raw_events_v2 \
  --schema-file schema_v2.json --http-enabled true

# 2. 新しい Pipeline を作成（新 Stream → 既存 Sink）
wrangler pipelines create events_pipeline_v2 \
  --sql "INSERT INTO events_sink SELECT * FROM raw_events_v2"

# 3. クライアント側の送信先を新 Stream の endpoint に切り替え
#    Workers Binding の場合は wrangler.jsonc の pipeline ID を更新

# 4. 旧 Pipeline → 旧 Stream を削除
wrangler pipelines delete events_pipeline
wrangler pipelines streams delete raw_events
```

ポイント:
- **切り替え時のトレードオフ**: 旧 Pipeline を先に削除すると切り替え中のイベントがロスする。新旧を並行稼働させるとロスしないが、同じ Stream に 2 つの Pipeline が接続される間はイベントが重複書き込みされる。短時間の重複を許容し、後から Iceberg の `__ingest_ts` で重複排除するのが現実的
- **Iceberg テーブルのデータは残る**: Sink を削除しても R2 上の Parquet ファイルと Iceberg メタデータは消えない
- **命名規則の工夫**: `_v2` サフィックスや日付サフィックスで世代管理すると追跡しやすい

将来ロードマップ（H1 2026）: Logpush 統合（Cloudflare のログを直接 R2 Data Catalog へ）、ステートフルストリーム処理（ウィンドウ集約・インクリメンタルビュー・JOIN）。

### Cloudflare Queues

Queues は Cloudflare のサーバーレスなメッセージキュー（[docs](https://developers.cloudflare.com/queues/)）。プロデューサー（データ送信側）とコンシューマー（Workers）を非同期に分離する。

データ基盤における役割:
- **高スループットの入口バッファ**: 突発的な大量イベントを吸収し、バックプレッシャーなしで受け取る
- **プロデューサーとコンシューマーの疎結合**: データ生成と処理を独立してスケール
- **リトライ保証**: At-least-once 配信 + デッドレターキュー（DLQ）で処理失敗メッセージを退避
- **ファンアウト**: 1 つのメッセージを複数の Workers コンシューマーで並列処理

Pipelines との使い分け:
- **Pipelines**: リアルタイムイベントを Iceberg に継続的にストリーミングしたい → Pipelines
- **Queues**: Worker 間の非同期処理・バッファリング・複雑なルーティングが必要 → Queues

料金: 100 万 ops/月まで無料、以降 $0.40/100 万 ops。

### dlt on Cloudflare Sandbox

dlt（[data load tool](https://dlthub.com/)）は **Python 製の軽量 EL ライブラリ**。SaaS API からデータを抽出し、スキーマ推論・正規化・増分ロードを自動処理しながら R2 Iceberg テーブルに書き込む。

200 以上の公式コネクタ（Stripe, Google Analytics, Slack, PostgreSQL, REST API 等）があり、カスタムソースも `@dlt.resource` デコレータで数行で追加できる。

なぜ Cloudflare で dlt なのか:
- Airbyte は Docker コンテナ群が必要 → Cloudflare Sandbox では動かない
- Fivetran は外部 SaaS → Cloudflare 上で実行不可
- dlt は `pip install` だけで動作 → Sandbox の `uv run` と相性抜群

```bash
# Sandbox 上で dlt を実行（インストール不要）
uv run --with "dlt[filesystem]" extract_stripe.py
```

Sandbox の S3 互換マウントを使えば、R2 バケットをファイルシステムとして直接マウントでき、dlt が Parquet を直接 R2 に書き出せる。

---

## オーケストレーション

複数のインジェスト・変換・品質チェック・通知ステップを「どう繋いで信頼性高く実行するか」。

## Cloudflare Workflow

Workflows は Cloudflare のサーバーレスな**耐久実行エンジン**（Durable Execution）（[docs](https://developers.cloudflare.com/workflows/)）。コードとしてワークフローを定義し、自動リトライ・エラーハンドリング・状態永続化を備える。Temporal / AWS Step Functions に相当するが、TypeScript でコードとして書け、Cloudflare Binding と直接統合できる。

データ基盤では **ETL パイプラインのオーケストレーション**として機能する：

```
Cron Trigger → Worker → Workflow
  Step 1: dlt で SaaS → R2 取込（失敗時: 最大 3 回 exponential backoff でリトライ）
  Step 2: dbt run で変換（10 分タイムアウト）
  Step 3: Soda でデータ品質チェック（失敗時: Slack アラートして停止）
  Step 4: Evidence ビルドトリガー（GitHub Actions dispatch）
  Step 5: 完了通知
```

主な機能:
- **`step.do()`**: 処理ステップの定義。戻り値は自動永続化。リトライ・タイムアウトを設定可能
- **`step.sleep()`**: 指定時間の待機（最大 365 日）。レート制限対応に有用
- **`step.waitForEvent()`**: 外部からのイベント待機。人間の承認フローを挟める
- **クラッシュ耐性**: 実行中にクラッシュしても途中から再開（Durable Objects が状態を保持）

Step Functions との設計思想の違い: Step Functions は JSON で状態マシンを定義（GUI → コード）。Workflows は TypeScript でコードとして書く（コード → ビジュアル）。Cloudflare ダッシュボードに「Workflow Diagrams」機能（2026 年 2 月 Beta）があり、TypeScript コードを自動パースしてビジュアルダイアグラムを生成する。

Workflows vs 外部オーケストレーター:
- **Airflow/Dagster**: UI が豊富、大規模 DAG に強い。ただしインフラ管理が必要
- **GitHub Actions**: 無料で使いやすいが、耐久実行・イベント待ちが弱い
- **Workflows**: Cloudflare のみで完結する小〜中規模パイプラインなら最適

---

## AI

### Workers AI

Workers AI は Cloudflare のサーバーレス AI 推論プラットフォーム（[docs](https://developers.cloudflare.com/workers-ai/)）。GPU 搭載のエッジネットワーク上で、100 以上のオープンソース AI モデル（LLM・画像生成・埋め込み・音声認識）を実行できる。GPU の管理は一切不要。

データパイプラインにおける Workers AI の役割:
- **埋め込みベクトル生成**: Vectorize と組み合わせた RAG パイプラインの入力
- **テキスト分類・感情分析**: ストリーミングデータへのリアルタイム分類（Pipelines + Workers AI）
- **NER・要約**: 非構造化テキストからの情報抽出・データエンリッチメント
- **Text-to-SQL**: 自然言語でデータに質問できるエージェントの構築

```typescript
// Binding 1 行で LLM を呼び出し
const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
  messages: [{ role: "user", content: "このログから異常なパターンを要約してください: ..." }]
});

// 埋め込みベクトル生成
const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: ["検索クエリ"] });
const results = await env.VECTOR_INDEX.query(embedding.data[0], { topK: 5 });
```

料金: 10,000 Neurons/日まで無料、以降 $0.011/1K Neurons。

### Cloudflare Agents

### AI Search

### AI Gateway

AI Gateway は AI API コールのためのプロキシ/ゲートウェイ（[docs](https://developers.cloudflare.com/ai-gateway/)）。アプリケーションと AI プロバイダー（OpenAI・Anthropic・Workers AI 等）の間に位置し、キャッシュ・レート制限・ロギング・アナリティクスを提供する。

データ基盤での活用:
- **AIコールの一元ログ管理**: プロンプト・レスポンス・トークン数・レイテンシの集中ログ。データパイプラインの AI コストを可視化
- **重複リクエストのキャッシュ**: 同一テキストの埋め込みを再計算しない
- **フォールバックルーティング**: Workers AI がダウンした場合に OpenAI へ自動切り替え
- **A/B テスト**: 異なるモデル間の比較検証（Text-to-SQL の精度比較等）

### Vectorize

Vectorize は Cloudflare のベクトルデータベース（[docs](https://developers.cloudflare.com/vectorize/)）。Workers AI で生成した埋め込みを格納し、類似度検索（ANN）を実行する。RAG（検索拡張生成）パイプラインの「ベクトルストア」として機能する。

データ基盤での活用パターン:
- **データカタログ AI 検索**: dbt のモデル説明文・カラム定義を Vectorize に格納し、「売上に関連するテーブルは？」のような自然言語クエリで検索
- **ドキュメント Q&A**: R2 に格納したドキュメントを RAG で検索
- **異常検知**: 過去のパターンをベクトル化して類似パターンを近傍探索

料金: Workers Paid プランの従量課金に含む。

### Cloudflare Agents

[Cloudflare Agents](https://developers.cloudflare.com/agents/) は、ステートフルで長時間実行可能な AI エージェントを構築するためのフレームワーク。**Durable Objects** をベースとし、エージェントはインタラクション間で状態を保持しながら、ツール呼び出し・API 連携・複雑なマルチステップタスクのオーケストレーションができる。

Workers AI や Vectorize などの Binding と組み合わせることで、「データに自然言語で質問する」「パイプラインを自律的に監視・修復する」といったエージェント型ワークロードを Cloudflare 上で完結させられる。

データ基盤での主なユースケース:
- **自律型データ品質モニター**: 受信データを継続的に監視し、異常値をフラグ付けして自動修正アクションを実行。ルールベースではなくパターン学習による適応的な品質管理
- **対話型 BI エージェント**: 自然言語の質問 → SQL 生成 → D1/R2 SQL クエリ → 回答、という一連のフローをエージェントが自律実行。Slack bot として「今月の売上は？」と聞くだけでデータを取得できる
- **パイプライン障害対応**: Workflows や Pipelines の健全性を監視し、失敗ジョブを自動リスタートしてアラートを送信

**Sandbox との連携が強力**。エージェント本体（LLM 呼び出し・状態管理）は Workers + DO で動かし、コード実行が必要なツールだけ Sandbox に委譲する。ChatGPT の Code Interpreter と同じ発想で、「データを分析して」と言われたときに Python スクリプトを生成・実行し結果を返せる。

```typescript
// Sandbox をコード実行ツールとして Agent に組み込む
this.server.tool(
  "execute_python",
  "Python コードを実行して結果を返す",
  { code: z.string() },
  async ({ code }) => {
    const sandbox = await Sandbox.create(this.env.SANDBOX);
    await sandbox.writeFile("/tmp/script.py", code);
    const result = await sandbox.run("python3 /tmp/script.py");
    return { content: [{ type: "text", text: result.stdout }] };
  }
);
```

エージェントの状態（会話履歴・実行ログ・中間結果）は Durable Objects の SQLite に永続化されるため、クラッシュや再起動後も処理を継続できる。

### AI Search

[AI Search](https://developers.cloudflare.com/ai-search/)（AutoRAG）は、キーワード検索と AI セマンティック検索を組み合わせた**マネージド検索サービス**。Vectorize + Workers AI の構成を自前で組まなくても、ドキュメントを投入するだけで自然言語検索が動く。

データ基盤における AI Search の立ち位置は「**データカタログの検索エンジン**」。dbt のモデル説明・カラム定義・用語集を AI Search に格納しておけば、「売上に関連するテーブルは？」「`user_id` と `customer_id` の違いは？」といった曖昧なクエリにも的確に答えられる。

主な特徴:
- **ハイブリッド検索**: キーワード一致 + ベクトル類似度の併用で精度が高い
- **自動インデキシング**: ドキュメント投入時に埋め込み生成とインデックス構築を自動処理
- **マネージド**: Vectorize のインデックス管理・埋め込みモデル選定・RAG プロンプトの調整を自前でやる必要がない

Vectorize を直接使うとの使い分け:
| | AI Search（AutoRAG） | Vectorize 直接 |
|---|---|---|
| セットアップ | ドキュメント投入だけ | 埋め込み生成・インデックス設計・検索 API を自前実装 |
| カスタマイズ性 | 低（マネージドのため） | 高（モデル・プロンプト・ランキングを自由に調整） |
| 向いている用途 | 素早くセマンティック検索を始めたいとき | 高度にチューニングされた検索・RAG パイプライン |

データカタログのユースケースでは、R2 に格納した dbt artifacts（`manifest.json` / `catalog.json`）をトリガーに Worker がカタログドキュメントを生成し、AI Search に自動インデクシングする構成が実用的。Astro（SSG）をフロントエンドにすれば、全て Cloudflare スタックで完結する軽量データカタログが $5〜10/月で構築できる。

### LLM-as-a-Judge

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

**Preference Leakage に注意**: Judge LLM と生成モデルが同じファミリー（例: 両方 GPT-4）だと、Judge が自分の「癖」を高評価しやすくなる。本番生成モデルと Judge は異なるモデルファミリーを選ぶ（例: 生成に Workers AI の Llama、評価に Workers AI の Gemma）。

コスト効率: 1 万評価/月で約 $0.50（Workers AI のトークン料金）。人間評価と比較して約 20,000 倍のコスト効率。「完全に置き換える」のではなく、**人間レビューをハイスコア案件に集中させる**のが実践的な使い方。

---

## データアクティベーション

データを「使う」フェーズ。Cloudflare スタックの特徴は、エッジで動く Workers が**リクエスト時にリアルタイム判定**できること。パーソナライズ・A/B テスト・フィーチャーフラグを < 10ms で実行できる。

### Cloudflare Zaraz

[Zaraz](https://developers.cloudflare.com/zaraz/) は Cloudflare の**サーバーサイドタグマネージャー**。Google Tag Manager（GTM）の代替であり、サードパーティタグ（GA4・Meta Pixel・Google Ads 等）をブラウザではなく **Cloudflare のエッジで実行**する。マーケッターがデータを「集める」「活用する」両面で関わるプロダクト。

#### GTM との根本的な違い

GTM はクライアントサイドで動く。ブラウザにタグの JavaScript を読み込み、ブラウザ上でルールを評価してイベントを送信する。タグが増えるほどページが重くなり、ユーザーのブラウザがサードパーティスクリプトにさらされるセキュリティリスクもある。

Zaraz はサーバーサイドで動く。Cloudflare のエッジがイベントを受け取り、サーバー側で各ツールの API にデータを送信する。ブラウザには追加の JavaScript がほぼ読み込まれない。

| | GTM（クライアントサイド） | GTM サーバーサイド | Zaraz |
|---|---|---|---|
| **実行場所** | ユーザーのブラウザ | 自前の GCP/Cloud Run | Cloudflare エッジ（330+ 都市） |
| **JavaScript 負荷** | タグごとに増加（数百 KB〜） | Container タグ 1 つ | **ほぼゼロ**（Zaraz ランタイムのみ） |
| **ページ速度への影響** | 大きい（タグ増加に比例） | 小さい | **ほぼなし** |
| **サードパーティ JS 実行** | ブラウザ上で直接実行 | サーバーで処理 | **エッジでサンドボックス実行** |
| **セキュリティリスク** | XSS・データ漏洩の経路になりうる | 低い | **低い**（ブラウザに JS を注入しない） |
| **インフラ管理** | 不要 | GCP プロジェクト・Cloud Run の管理が必要 | **不要**（Cloudflare が管理） |
| **料金** | 無料（GTM 360 は有料） | Cloud Run の従量課金 | **100 万イベント/月まで無料**、以降 $5/100 万イベント |
| **同意管理（CMP）** | 外部 CMP が必要 | 外部 CMP が必要 | **組み込み CMP**（GDPR 対応） |
| **セットアップ** | サイトに GTM スニペットを追加 | GTM + Cloud Run の設定 | **Cloudflare DNS を通すだけ**（コード変更不要） |

#### サポートツール（主要なもの）

| カテゴリ | ツール |
|---------|--------|
| **アナリティクス** | Google Analytics 4, Amplitude, Mixpanel, Snowplow |
| **広告** | Google Ads, Meta Pixel (Facebook), TikTok, LinkedIn Insight, Pinterest, Bing, Snapchat, Reddit, Taboola, Outbrain |
| **マーケティング** | HubSpot, Branch, Impact Radius, Segment |
| **カスタム** | Custom HTML, Custom Image, HTTP Request（任意のツールに対応可） |

40 以上のネイティブ統合があり、Custom HTML / HTTP Request を使えば未対応ツールも組み込める。

#### データ基盤との接点

Zaraz はマーケティングツールだが、データ基盤の文脈では**イベントデータの収集レイヤー**として重要:

**1. イベントの二重送信（Zaraz → GA4 + R2）**: Zaraz で収集したイベントを GA4 に送りつつ、同じイベントを Pipelines 経由で R2 Iceberg にも書き込む。GA4 のサンプリングや保持期間の制約に縛られず、生データをデータレイクに蓄積できる。

```
ユーザー → Zaraz（エッジ）→ GA4（マーケ用）
                          → Pipelines → R2 Iceberg（分析用）
```

**2. サーバーサイドコンバージョン API**: Meta CAPI や Google Ads のオフラインコンバージョンを、Zaraz がサーバーサイドで直接送信する。ブラウザの Cookie 制限（ITP / ETP）やアドブロッカーの影響を受けないため、コンバージョン計測の精度が向上する。

**3. Consent Management（同意管理）**: Zaraz に組み込みの CMP（Consent Management Platform）があり、GDPR / ePrivacy 指令に準拠した同意モーダルをコードなしで設置できる。ツールごとに「ユーザーが同意するまで読み込まない」制御が可能。外部 CMP（OneTrust 等）との連携も Consent API で対応。Google Consent Mode v2 にもネイティブ対応。

**4. Logpush（Zaraz Events）**: Zaraz が処理したイベントを Logpush で R2 に蓄積できる（Enterprise プラン）。マーケティングイベントの生ログをデータレイクに集約し、R2 SQL や DuckDB で分析する。

#### マーケッターへの訴求ポイント

- **ページ速度の改善**: タグをエッジに移すだけで Core Web Vitals が改善する。LCP / TBT への悪影響がほぼゼロ
- **コード変更不要**: Cloudflare を DNS に設定済みなら、ダッシュボードからタグを追加するだけ。開発チームへの依頼が不要
- **Cookie 制限への対応**: サーバーサイドでイベントを送信するため、ITP / ETP / アドブロッカーの影響を受けにくい
- **コスト**: GTM サーバーサイドは Cloud Run の料金がかかるが、Zaraz は 100 万イベント/月まで無料

### Cloudflare Access

[Zero Trust Access](https://developers.cloudflare.com/cloudflare-one/) は、BI ツール・データアプリ・API などを認証・認可で保護する仕組み。データ基盤のデータアクティベーション層では「誰がどのデータにアクセスできるか」を制御する。

- **ダッシュボード保護**: Evidence や Marimo のページを Google/GitHub/Okta 認証で保護
- **Service Token**: Worker → Worker、Worker → 外部 API の認証
- **OIDC / JWT 連携**: 既存の IdP（Okta, Azure AD, Google Workspace 等）と統合

Workers Static Assets + Access の構成は **Worker のコードを書かずに**認証を実現できる。

```toml
# wrangler.toml（Workers 側の設定）
name = "evidence-dashboard"
compatibility_date = "2025-01-01"

[assets]
directory = "./build"   # Evidence のビルド成果物
```

Access ポリシー自体は `wrangler.toml` では定義できない。Cloudflare ダッシュボード（または Terraform）で設定する:

```hcl
# Terraform での例
resource "cloudflare_access_application" "evidence" {
  zone_id          = var.zone_id
  name             = "Evidence Dashboard"
  domain           = "evidence.example.com"
  session_duration = "24h"
}

resource "cloudflare_access_policy" "allow_team" {
  application_id = cloudflare_access_application.evidence.id
  name           = "Allow company members"
  decision       = "allow"

  include {
    email_domain = ["company.com"]
  }
}
```

JWT 検証は Access が自動処理するため、Worker 側にトークン検証コードは不要。

料金: 50 ユーザーまで無料。

### marimo

[marimo](https://marimo.io/) は Python の**リアクティブノートブック**。セルが依存関係グラフを形成し、あるセルの出力が変わると依存するセルが自動で再実行される。Jupyter と違い、セルの実行順序の問題が起きない。

Cloudflare 上では Workers Static Assets として WASM 版をデプロイし、ブラウザ完結で Python 分析環境を提供できる（サーバー不要）。

データ基盤での活用:
- **アドホック分析**: データチームが R2 の Parquet を DuckDB でクエリしながら探索的分析
- **プリセットノートブック**: パラメータ（期間・セグメント等）を変えるだけで集計し直せるノートブックを営業・CS に提供
- **インタラクティブダッシュボード**: Evidence が静的レポートなのに対し、Marimo は動的なインタラクション

### BI as Code

BI as Code は、BI レポート・ダッシュボードをコード（SQL + Markdown）で管理するアプローチ。GUI でドラッグ&ドロップする代わりに、Git 管理・CI/CD・コードレビューでダッシュボードを管理する。

**[Evidence](https://evidence.dev/)** が代表的なツール。SQL + Markdown でレポートを書き、静的サイトとしてビルドし Cloudflare Workers Static Assets でホスティングする。データ取得は DuckDB でビルド時に実行。

```markdown
# 月次売上レポート

```sql monthly_sales
SELECT month, sum(revenue) as revenue
FROM orders
WHERE month >= '${params.start_month}'
GROUP BY month
ORDER BY month
```

<LineChart data={monthly_sales} x=month y=revenue />
```

Workers Static Assets に Evidence をホスティングすれば追加コスト $0。Cloudflare Access で認証をかけて社内のみに公開できる。

#### Browser Rendering で Evidence のスクリーンショットを撮る

Browser Rendering は Cloudflare のヘッドレスブラウザサービス（Puppeteer/Playwright/Stagehand 対応）。Evidence でホスティングしたダッシュボードのスクリーンショットを定期的に撮影し、Slack に自動投稿するパターン。

```typescript
// 毎朝 Evidence の KPI ダッシュボードをスクリーンショット → Slack
const browser = await puppeteer.launch(env.BROWSER);
const page = await browser.newPage();
await page.goto("https://dashboard.example.com/kpi");
const screenshot = await page.screenshot({ type: "png" });
await sendToSlack(screenshot);
```

### Lightdash をホスティングしてみる。

[Lightdash](https://lightdash.com/) は dbt と連携するオープンソース BI ツール。dbt モデルを自動的にディメンション・メジャーとして認識し、ノーコードでチャートを作れる。

Cloudflare Containers で Lightdash をセルフホスティングすることで：
- SaaS 料金を払わずに全機能を使える
- Zero Trust Access でアクセス制御
- R2/D1 とのデータ接続

注意: Lightdash は PostgreSQL が必要。Hyperdrive を使って外部 PostgreSQL に高速接続するか、Containers 内で PostgreSQL も一緒に動かす構成になる。

### Reverse ETL

Reverse ETL は、データウェアハウス/データレイクで集計・加工したデータを **業務 SaaS に書き戻す**パターン。従来の ETL が「SaaS → DWH」なら、Reverse ETL は「DWH → SaaS」。分析結果をマーケティング・営業・CS の現場ツールに直接フィードバックする。

典型的なユースケース:
- **CRM 同期**: R2 Iceberg で計算したリードスコアを HubSpot / Salesforce のコンタクトに書き戻す
- **広告オーディエンス**: 購買予測モデルのセグメントを Meta / Google Ads のカスタムオーディエンスに送信
- **Slack / メール通知**: KPI のしきい値を超えたら自動アラート
- **SaaS の属性更新**: 解約予測スコアを Intercom / Zendesk のユーザー属性に反映

#### Cloudflare スタックでの実現

専用の Reverse ETL ツール（Census, Hightouch）は SaaS 料金がかかる。Cloudflare スタックだけで同等のことが実現できる:

```
Cron Trigger → Worker → R2 SQL / D1 でクエリ → SaaS API に書き戻し
```

```typescript
// 例: リードスコアを HubSpot に書き戻す Worker
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // 1. R2 SQL で最新のリードスコアをクエリ
    const scores = await env.R2_SQL.query(
      "SELECT user_id, email, lead_score FROM analytics.lead_scores WHERE updated_at > NOW() - INTERVAL '1' DAY"
    );

    // 2. HubSpot API にバッチ更新
    const batches = chunk(scores.rows, 100);
    for (const batch of batches) {
      await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/update", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: batch.map(row => ({
            id: row.user_id,
            properties: { lead_score: row.lead_score },
          })),
        }),
      });
    }
  },
};
```

より複雑なケース（エラーハンドリング・リトライ・進捗管理）は Workflows で組む:

```
Cron Trigger → Worker → Workflow
  Step 1: R2 SQL でセグメント抽出
  Step 2: SaaS API にバッチ書き戻し（リトライ付き）
  Step 3: 結果を D1 に記録（同期済み件数・エラー件数）
  Step 4: Slack に完了通知
```

#### Census / Hightouch との比較

| | Census / Hightouch | Cloudflare Workers |
|---|---|---|
| **セットアップ** | GUI でソース・宛先・マッピングを設定 | コードで書く |
| **SaaS コネクタ** | 200+ のネイティブ統合 | 自前で API を叩く |
| **差分同期** | 自動（CDC ベース） | 自前で実装（ウォーターマーク等） |
| **スケジュール** | GUI で設定 | Cron Trigger |
| **モニタリング** | ダッシュボード付き | Workers Observability / D1 で自前管理 |
| **料金** | $300〜/月 | **ほぼ $0**（Workers + R2 SQL の従量課金のみ） |
| **向いている規模** | 大量の宛先・複雑なマッピング | 宛先が少数で API が明確なケース |

**判断基準**: 書き戻し先が 2〜3 個で API が明確なら Workers で十分。10+ の SaaS に複雑なフィールドマッピングで同期するなら Census / Hightouch のほうが運用コストが低い。

---

## Observability

### Workers Observability

[Workers Observability](https://developers.cloudflare.com/workers/observability/) は、Workers のログ・トレース・メトリクスを統合的に提供するオブザーバビリティ基盤。[2025 年 11 月に自動トレーシング](https://developers.cloudflare.com/changelog/post/2025-11-07-automatic-tracing/)（OpenTelemetry 互換）がオープンベータ入りし、Datadog・Grafana・Honeycomb・Sentry 等への OTLP エクスポートが可能になった。

**自動計装**が最大の特徴。Worker が行う全ての操作に自動でスパンが生成される：
- R2 読み書き（`r2.get`, `r2.put`, `r2.list`）
- D1 クエリ
- KV 操作
- 外部 fetch
- Queue 送信
- Workflows ステップ

コードに手を加えずにトレーシングが始まる。データパイプラインのどのステップで時間がかかっているかを可視化できる。

`wrangler tail` でリアルタイムのログをストリーミング確認できるのも開発体験として優秀：
```bash
wrangler tail my-data-worker --format=pretty
```

#### OTLP エクスポート先

Workers Observability は OpenTelemetry（OTel）標準に準拠しており、OTLP エンドポイントを持つ任意のプロバイダーにトレースとログをエクスポートできる。現時点でエクスポート可能なテレメトリは**トレース**と**ログ**（カスタムメトリクスのエクスポートは未対応）。

| プロバイダー | Traces | Logs | 備考 |
|-------------|--------|------|------|
| **Grafana Cloud** | ✅ | ✅ | Tempo（トレース）+ Loki（ログ）。無料枠あり |
| **Honeycomb** | ✅ | ✅ | 高カーディナリティデータに強い。無料枠あり |
| **Axiom** | ✅ | ✅ | |
| **Sentry** | ✅ | ✅ | エラートラッキングとの統合 |
| **Firetiger** | ✅ | ✅ | |
| **Datadog** | **未対応（対応予定）** | ✅ | Traces は Datadog 側のリリース待ち。Logs のみ先行対応 |
| **Observe（Snowflake）** | ✅ | ✅ | Snowflake が買収。Iceberg + OTel ネイティブ。OTLP HTTP 対応 |

#### Grafana Cloud へのエクスポート

Grafana Cloud は無料枠があり、データ基盤のオブザーバビリティに最も手軽な選択肢。Tempo でトレースを可視化し、Loki でログを検索できる。

**セットアップ手順**:

1. Grafana Cloud で **Connections → Add new connection → OpenTelemetry (OTLP)** からトークンを作成
2. Cloudflare ダッシュボードの **Workers Observability → Add destination** でエンドポイントを登録

```
Destination Name: grafana-traces
Destination Type: Traces
OTLP Endpoint:   https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/traces
Custom Headers:   Authorization: Basic MTMx...（Grafana で発行されたトークン）
```

ログも同様に別の Destination として追加（エンドポイントの末尾が `/v1/logs`）。

3. `wrangler.jsonc` でエクスポート先を指定してデプロイ

```jsonc
// wrangler.jsonc
{
  "observability": {
    "traces": {
      "enabled": true,
      "destinations": ["grafana-traces"]
    },
    "logs": {
      "enabled": true,
      "destinations": ["grafana-logs"]
    }
  }
}
```

これだけで、Worker の全操作（R2 読み書き・D1 クエリ・外部 fetch・Queue 送信等）のトレースが Grafana Tempo に流れ始める。データパイプラインのどのステップにボトルネックがあるかを Grafana のトレースビューで一目で把握できる。

**サンプリング**: 高トラフィックの Worker ではサンプリングレートを設定してコストを抑える:
```jsonc
{
  "observability": {
    "traces": {
      "enabled": true,
      "head_sampling_rate": 0.05,  // 5% のリクエストのみトレース
      "destinations": ["grafana-traces"]
    }
  }
}
```

#### Datadog へのエクスポート

Datadog は多くの企業で利用されている APM / モニタリング基盤。Workers Observability からの OTLP エクスポートについて、現時点では **Logs のみ対応**。**Traces は Datadog 側の OTLP Ingest 対応のリリースを待っている状態**で、Cloudflare のドキュメントにも「Coming soon, pending release from Datadog」と明記されている。

**Logs のエクスポート（現在対応済み）**:

1. Datadog の API キーを取得
2. Cloudflare ダッシュボードで Destination を作成

```
Destination Name: datadog-logs
Destination Type: Logs
OTLP Endpoint:   https://otlp.datadoghq.com/v1/logs  （US1 の場合）
Custom Headers:   DD-API-KEY: <your-datadog-api-key>
```

サイトによってエンドポイントが異なる（`otlp.us3.datadoghq.com`, `otlp.us5.datadoghq.com`, `otlp.datadoghq.eu` 等）。

3. `wrangler.jsonc` で設定

```jsonc
{
  "observability": {
    "logs": {
      "enabled": true,
      "destinations": ["datadog-logs"]
    }
  }
}
```

**Traces が対応するまでの暫定構成**: Traces は Grafana Cloud（無料枠）や Honeycomb に送り、Logs は Datadog に送る、という複数 Destination の併用が現実的。`destinations` は配列なので複数指定可能:

```jsonc
{
  "observability": {
    "traces": {
      "enabled": true,
      "destinations": ["grafana-traces"]  // Traces は Grafana へ
    },
    "logs": {
      "enabled": true,
      "destinations": ["datadog-logs", "grafana-logs"]  // Logs は両方へ
    }
  }
}
```

Datadog の Traces 対応が完了次第、`traces.destinations` に `"datadog-traces"` を追加するだけで移行できる。

#### Observe（Snowflake）へのエクスポート

[Observe](https://www.observeinc.com/) は 2026 年 1 月に Snowflake が約 $1B で買収したオブザーバビリティプラットフォーム。最大の特徴は**テレメトリデータを Apache Iceberg テーブルとして保存**する O11y Data Lake アーキテクチャ。OpenTelemetry ネイティブで、ログ・メトリクス・トレースを統合的に扱う。

Snowflake をデータ基盤として使っている組織にとっては、**オブザーバビリティデータと業務データが同じ Snowflake プラットフォーム上に統合される**という大きなメリットがある。パイプラインの実行ログを Snowflake の SQL で直接分析したり、業務データと突き合わせてインシデントの影響を定量化できる。

**Observe の主要コンポーネント**:
- **O11y Data Lake**: テレメトリを Iceberg + OTel 標準で保存。ベンダーロックインなし
- **O11y Context Graph**: ログ・メトリクス・トレースのセマンティック関係を自動構築。「このエラーに関連するインフラは？」を自動で紐付け
- **AI SRE**: 自然言語で異常検知・根因分析を自動化。「なぜレイテンシが上がったか」を聞くだけで回答

**Cloudflare Workers → Observe のセットアップ**:

1. Observe ダッシュボードで **Datastream** を作成し、Ingest Token を取得

2. Cloudflare ダッシュボードの **Workers Observability → Add destination** で Observe のエンドポイントを登録

Traces の場合:
```
Destination Name: observe-traces
Destination Type: Traces
OTLP Endpoint:   https://<CUSTOMER_ID>.collect.observeinc.com/v2/otel/v1/traces
Custom Headers:   Authorization: Bearer <OBSERVE_INGEST_TOKEN>
```

Logs の場合:
```
Destination Name: observe-logs
Destination Type: Logs
OTLP Endpoint:   https://<CUSTOMER_ID>.collect.observeinc.com/v2/otel/v1/logs
Custom Headers:   Authorization: Bearer <OBSERVE_INGEST_TOKEN>
```

`<CUSTOMER_ID>` は Observe のアカウント固有の数値 ID。Ingest Token は Datastream 作成時に発行される `a1b2c3d4...:x1y2z3...` 形式のトークン。

3. `wrangler.jsonc` で Observe を宛先に指定

```jsonc
// wrangler.jsonc
{
  "observability": {
    "traces": {
      "enabled": true,
      "head_sampling_rate": 0.1,
      "destinations": ["observe-traces"]
    },
    "logs": {
      "enabled": true,
      "destinations": ["observe-logs"]
    }
  }
}
```

4. デプロイすれば、Worker の全操作のトレースとログが Observe に流れ始める

**Observe ダッシュボードでの確認**:
- **Trace Explorer**: Workers のリクエストフローを可視化。R2 読み書き・D1 クエリ・外部 fetch の各スパンがウォーターフォールで表示される
- **Log Explorer**: `console.log()` 出力やシステムログをフルテキスト検索。フィルタ・集約・可視化が可能
- **AI SRE に質問**: 「過去 1 時間でレイテンシが最も高かった Worker は？」「このエラーの根因は？」のような自然言語クエリで調査

**Snowflake との統合パターン**:

Observe に蓄積されたテレメトリデータは Iceberg テーブルとして保存されるため、Snowflake から直接 SQL でクエリできる。これにより:

```sql
-- Snowflake: Workers のエラー率と業務 KPI の相関を分析
SELECT
  o.worker_name,
  o.error_count,
  o.p99_latency_ms,
  b.revenue_impact
FROM observe.traces.worker_summary o
JOIN business_db.public.hourly_revenue b
  ON o.hour = b.hour
WHERE o.error_count > 100
ORDER BY b.revenue_impact DESC
```

- パイプライン障害の影響を売上データと突き合わせて定量化
- SLO（サービスレベル目標）のバーンレートを業務メトリクスと一緒にダッシュボード化
- テレメトリデータの長期保存コストを Snowflake のストレージ料金に統合

**注意点**:
- Observe は Cloudflare 公式ドキュメントのエクスポート先ガイドにはまだ掲載されていない（Grafana / Honeycomb / Axiom / Sentry が公式ガイドあり）
- ただし Observe は標準 OTLP HTTP エンドポイントを提供しているため、汎用の OTLP 設定で接続可能
- gRPC は非対応（HTTP のみ）。Cloudflare の OTLP エクスポートも HTTP なので問題なし
- リクエストサイズ上限: 圧縮 10MB / 非圧縮 50MB

### Logpush

[Logpush](https://developers.cloudflare.com/logs/logpush/) は Cloudflare の全プロダクトから生成されるログを、外部ストレージや SIEM に**リアルタイムでプッシュ配信**するサービス。

データ基盤での活用: WAF ログ・Zero Trust ログ・HTTP リクエストログ・Workers Trace・DNS ログを R2 に集約し、DuckDB や R2 SQL で分析する。

対応データセット:

**Zone スコープ（ゾーン単位）**:
| データセット | 内容 | プラン |
|-------------|------|--------|
| HTTP Requests | アクセスログ・レイテンシ・キャッシュヒット率 | Enterprise |
| Firewall Events | WAF ルールマッチ・ブロック・チャレンジ | Enterprise |
| DNS Logs | DNS クエリ・レスポンスの記録 | Enterprise |
| NEL Reports | Network Error Logging（ブラウザのネットワークエラー） | Enterprise |
| Page Shield Events | サードパーティスクリプトの変更検知 | Enterprise |
| Spectrum Events | Spectrum（L4 プロキシ）のイベント | Enterprise |
| Zaraz Events | Zaraz（サーバーサイドタグマネージャー）のイベント | Enterprise |

**Account スコープ（アカウント単位）**:
| データセット | 内容 | プラン |
|-------------|------|--------|
| **Workers Trace Events** | **Workers の実行トレース** | **Workers Paid** |
| **AI Gateway Events** | **AI API コールのログ（プロンプト・レスポンス・トークン数）** | **Workers Paid** |
| Access Requests | Zero Trust Access の認証ログ | Enterprise |
| Audit Logs | Cloudflare ダッシュボード操作の監査ログ | Enterprise |
| Audit Logs V2 | 監査ログ v2（Beta） | Enterprise |
| Gateway DNS | Zero Trust Gateway の DNS フィルタリングログ | Enterprise |
| Gateway HTTP | Zero Trust Gateway の HTTP フィルタリングログ | Enterprise |
| Gateway Network | Zero Trust Gateway のネットワークセッションログ | Enterprise |
| Browser Isolation User Actions | Remote Browser Isolation のユーザー操作ログ | Enterprise |
| CASB Findings | CASB（SaaS セキュリティ）の検出結果 | Enterprise |
| Device Posture Results | デバイスポスチャーチェックの結果 | Enterprise |
| DEX Application Tests | Digital Experience（DEX）のアプリテスト結果 | Enterprise |
| DEX Device State Events | DEX のデバイス状態変更イベント | Enterprise |
| DLP Forensic Copies | DLP（情報漏洩防止）のフォレンジックコピー | Enterprise |
| DNS Firewall Logs | DNS Firewall のクエリログ | Enterprise |
| Email Security Alerts | Email Security のアラート | Enterprise |
| IPSec Logs | Magic WAN の IPSec トンネルログ | Enterprise |
| Magic IDS Detections | Magic Transit の IDS 検知イベント | Enterprise |
| MCP Portal Logs | MCP ポータルのリクエストログ | Enterprise |
| Network Analytics Logs | L3/4 DDoS・Magic Transit のフローログ | Enterprise |
| Sinkhole HTTP Logs | Sinkhole の HTTP リクエストログ | Enterprise |
| SSH Logs | Zero Trust SSH コマンドログ | Enterprise |
| WARP Config Changes | WARP クライアント設定変更ログ | Enterprise |
| WARP Toggle Changes | WARP の ON/OFF 切り替えログ | Enterprise |
| Zero Trust Network Sessions | Zero Trust ネットワークセッションログ | Enterprise |

Workers Trace Events と AI Gateway Events の 2 つだけが **Workers Paid**（$5/月〜）で利用可能。それ以外はすべて Enterprise 限定。ゾーンあたり最大 4 Logpush ジョブ。

H1 2026 ロードマップ: **Logpush → R2 Data Catalog（Iceberg）統合**が予定。これにより、Cloudflare のログが直接 Iceberg テーブルとして R2 に格納され、R2 SQL で即座にクエリできるようになる。

**注意**: Logpush は **Enterprise プラン限定**（Workers Trace Events のみ Workers Paid で利用可）。Free/Pro/Business プランではダッシュボードの Analytics や `wrangler tail` が代替手段となる。

### Analytics Engine

[Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) は Cloudflare のサーバーレスな**時系列分析データベース**。Workers から直接イベントやメトリクスを書き込み、SQL API でクエリできる。ClickHouse ベースの列指向ストレージで、大量の時系列データを高速に集計する。

書き込みは Workers Binding 経由で 1 行:
```typescript
// イベント書き込み（Binding 経由）
env.ANALYTICS.writeDataPoint({
  blobs: ["user_signup", "organic"],   // 文字列フィールド（最大 20 個）
  doubles: [1, 29.99],                 // 数値フィールド（最大 20 個）
  indexes: ["user-123"],               // インデックスキー（最大 1 個）
});
```

クエリは SQL API（HTTP）で実行:
```sql
SELECT
  blob1 AS event_type,
  SUM(double2) AS total_revenue,
  COUNT() AS event_count,
  toStartOfDay(timestamp) AS day
FROM my_dataset
WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY event_type, day
ORDER BY day
```

データ基盤における Analytics Engine の役割:
- **カスタムメトリクス収集**: パイプラインの処理件数・レイテンシ・エラー率をリアルタイムに記録
- **LLM-as-a-Judge のスコア蓄積**: AI 評価スコアを時系列で保存し、品質の推移を追跡
- **ユーザー行動トラッキング**: ページビュー・クリック・コンバージョンを Workers で直接記録（GA4 の代替）
- **A/B テスト結果の集計**: 実験ごとのメトリクスを蓄積・比較

Logpush との使い分け:
| | Analytics Engine | Logpush |
|---|---|---|
| データの性質 | カスタムメトリクス・イベント（自分で定義） | Cloudflare プロダクトの生ログ（HTTP/WAF/DNS 等） |
| 書き込み | Workers Binding（コードで明示的に書く） | 自動（Cloudflare が生成） |
| クエリ | SQL API（HTTP） | 外部エンジン（R2 SQL/DuckDB 等） |
| プラン | **Workers Paid**（$5/月〜）で利用可 | **Enterprise 限定** |

料金: Workers Paid プランに含まれる（10M データポイント/日まで無料、超過分は $0.25/100 万）。Enterprise 不要でメトリクス基盤を持てるのが最大の利点。

---

## データカタログ

https://dagster.io/blog/dbt-docs-on-react

ここで言う「データカタログ」は、Cloudflare のプロダクト名（R2 Data Catalog / Iceberg カタログ）ではなく、**dbt docs・OpenMetadata・Alation・Atlan のようなビジネスメタデータ管理の話**。

データが増えると「どんなテーブルがあるか」「このカラムは何を意味するか」「誰が管理しているか」「最後にいつ更新されたか」がわからなくなる。データカタログはこの問題を解く。

現状の選択肢:
| ツール | 特徴 | Cloudflare 上での実現 |
|--------|------|---------------------|
| **[dbt docs](https://docs.getdbt.com/docs/collaborate/documentation)** | dbt プロジェクトのモデル・カラム説明を自動生成 | `dbt docs generate` → Workers Static Assets でホスティング |
| **[OpenMetadata](https://open-metadata.org/)** | OSS フル機能カタログ（リネージ・品質・コラボ） | Containers でセルフホスティング |
| **[Atlan](https://atlan.com/) / [Alation](https://www.alation.com/)** | エンタープライズ向け SaaS カタログ | 外部 SaaS として R2 に接続 |

**Cloudflare ネイティブな構築案**: Astro（Workers SSG）+ AI Search（AutoRAG）で**自然言語で検索できるデータカタログ**を構築する。

dbt の `manifest.json` と `catalog.json` を R2 に保存 → Workers が R2 イベントをトリガーにカタログドキュメントを生成 → AI Search（Vectorize + Workers AI + AI Gateway）に格納 → Astro フロントエンドから「売上に関連するテーブルは？」のような自然言語クエリで検索する、というアーキテクチャ。

DataHub/Amundsen は Java/Python の重いインフラが必要。このアプローチなら全て Cloudflare スタックで完結し、$5〜10/月程度で動く。

---

## 開発者体験

### ドキュメント

Cloudflare のドキュメントは [`developers.cloudflare.com`](https://developers.cloudflare.com/) に集約されており、品質は高い。特にコード例が豊富で、各プロダクトのガイドが充実している。

AI 向けの工夫として **llms.txt** を提供。LLM フレンドリーなフォーマットでドキュメントを提供しており、Claude・GPT などから Cloudflare のドキュメントを参照してコードを生成しやすい。

**Changelog** が頻繁に更新される。[`developers.cloudflare.com/changelog`](https://developers.cloudflare.com/changelog) で週次の機能追加を追える。R2 SQL は 2026 年 3 月だけで 190 以上の関数追加、という速度感。

### MCP

Cloudflare は公式の **[MCP（Model Context Protocol）サーバー](https://developers.cloudflare.com/agents/model-context-protocol/)**を提供。Claude Desktop や Cursor などの AI ツールから、直接 Cloudflare のリソースを操作できる。

16 のプロダクト別 MCP サーバーがあり、各サービスを自然言語で操作できる：
- R2 バケットの作成・ファイルアップロード
- D1 データベースへの SQL クエリ
- Workers のデプロイ
- Pipelines の設定

```bash
# Claude Desktop の設定例
# claude_desktop_config.json に追加するだけで使える
{
  "cloudflare": {
    "command": "npx",
    "args": ["-y", "@cloudflare/mcp-server-cloudflare"]
  }
}
```

Workers 上で MCP サーバーを自前で立てることもできる。データカタログや社内 API を MCP で公開し、AI エージェントからアクセスさせるパターン。

### API

Cloudflare は REST API で全プロダクトを操作できる（2,500+ エンドポイント）。TypeScript SDK・Python SDK・Go SDK が公式提供されており、IaC やカスタムツールから使える。

```bash
# R2 SQL をクエリする API 呼び出し例
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/sql/query" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -d '{"warehouse": "my-warehouse", "query": "SELECT * FROM analytics.events LIMIT 10"}'
```

**Terraform v5** プロバイダーは自動生成（OpenAPI スペックから生成）されており、新プロダクトへの対応が早い。**Pulumi** も 6 言語対応。IaC 成熟度は AWS/GCP には及ばないが、急速に整備されている。

### Wrangler

Wrangler は Cloudflare の全プロダクトを操作する統合 CLI（[docs](https://developers.cloudflare.com/workers/wrangler/)）。**v4.75.0**（2026 年 3 月時点）。

データ基盤関連の主なコマンド:
```bash
# R2
wrangler r2 bucket create/list/delete
wrangler r2 bucket catalog enable <bucket>  # Iceberg カタログ有効化
wrangler r2 sql query <warehouse> "SELECT ..."  # SQL クエリ実行

# D1
wrangler d1 create/execute/export/import
wrangler d1 migrations create/apply
wrangler d1 time-travel restore --timestamp ...

# Pipelines
wrangler pipelines create/setup/list
wrangler pipelines streams create/sinks create

# Queues
wrangler queues create/list/consumer add

# Workflows
wrangler workflows list/trigger/instances

# Workers AI
wrangler ai models  # 利用可能なモデル一覧
```

2026 年 1 月に**シェルタブ補完**（Bash/Zsh/Fish/PowerShell）が追加。`wrangler <TAB>` でコマンドを補完できる。

`wrangler types` コマンドで `wrangler.jsonc` の Binding から TypeScript の型定義（`Env` インターフェース）を自動生成できる。型安全な Worker コードのために必須。

### ローカルエミュレーション

`wrangler dev` コマンドでローカル開発サーバーを起動できる。内部で **[Miniflare](https://developers.cloudflare.com/workers/testing/)**（workerd ベースのローカルシミュレーター）が動き、本番と同一の Runtime で Workers を動かす。

- **全 Binding をエミュレート**: R2・D1・KV・Queues・Workflows・AI 等をローカルで動かせる
- **ホットリロード**: ファイル変更で自動再読み込み
- **本番同一ランタイム**: workerd（本番の Workers ランタイム）のオープンソース版なので、ローカルと本番の動作差が極めて少ない

AWS の LocalStack や GCP のエミュレーターと比べて、Miniflare は本番との乖離がほぼなく開発体験が優秀。

Vitest + Miniflare でユニットテストも書ける：
```typescript
import { env } from "cloudflare:test";
// env.BUCKET（R2）、env.DB（D1）等がそのまま使えるテスト環境
```

### コミュニティー

- **[Discord](https://discord.cloudflare.com/)**: Cloudflare Developers（公式 Discord）が最も活発。プロダクト担当者が直接回答することも多い
- **[Cloudflare Community フォーラム](https://community.cloudflare.com/)**
- **Twitter/X**: [`@CloudflareDev`](https://x.com/CloudflareDev) で新機能情報が流れる
- **[Blog](https://blog.cloudflare.com/)** — Birthday Week（9月）と Developer Week に大量の新機能が発表される
- **[GitHub](https://github.com/cloudflare)** — Workers テンプレート・サンプルコードが豊富

日本語コミュニティは小さいが、JAWS-UG（AWS コミュニティ）や CloudNative Days 等で Cloudflare のセッションが増えてきている。ISMAP 取得により国内での認知が高まりつつある。
