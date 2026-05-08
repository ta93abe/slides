---
layout: section
---

# AI スプロールをどうにかする

組織内で **AI モデル / エージェント / ツール / プロンプト** が無秩序に増殖し、統制不能になる状態

<!--
LLM 呼び出しとツール呼び出しが社内に散らばる sprawl 問題に対し、Cloudflare は
LLM 層を AI Gateway、ツール層を MCP Server Portal で集約・統制する 2 つの portal を
提供する。前章の observability で AI Gateway の OTel エクスポート (LLM span 化) は
扱ったので、本章では governance 側 (DLP / Cache / Fallback / Metadata) に焦点を当てる。
-->

---

# AI Gateway — LLM 呼び出しを統制する

**Universal Endpoint** で全 LLM プロバイダーを 1 経路に集約します。**Fallback / Retry** で信頼性を担保しつつ、以下 3 カテゴリ・11 機能で観測 / 制御 / 最適化を一括導入できます。

<div class="grid grid-cols-3 gap-3 mt-3 text-xs">

<div class="border border-orange-500/30 rounded p-3">

### Performance & Cost

- **Caching** — 同一リクエストをキャッシュ (latency 最大 90% 減)
- **Rate Limiting** — 時間枠ごとのリクエスト数上限
- **Dynamic Routing** — segment / geo / content で振り分け
- **Custom Costs** — 交渉済みレートでコスト計算を上書き

</div>

<div class="border border-orange-500/30 rounded p-3">

### Security & Safety

- **Guardrails** — 有害コンテンツの検出 / ブロック
- **DLP** — PII / 財務情報をパターン検出 (`FLAG` / `BLOCK`)
- **Authentication** — Gateway へのトークンベースアクセス制御
- **BYOK** — provider API キーを集中暗号化管理 (20+ providers)

</div>

<div class="border border-orange-500/30 rounded p-3">

### Observability & Analytics

- **Analytics** — トークン / コスト / エラーを集計
- **Logging** — 全 request / response の詳細ログ
- **Custom Metadata** — `cf-aig-metadata` で user / team タグ

</div>

</div>

<div class="mt-3 text-sm op-80">

→ 「LLM SDK を直接叩く」をやめて Gateway 経由を強制すれば、観測 / 統制 / コスト管理を後付けで実装する必要がなくなります。

</div>

<!--
AI Gateway は LLM 呼び出しの reverse proxy。Universal Endpoint で全プロバイダー
(OpenAI / Anthropic / Workers AI / Google Vertex / DeepSeek / Azure OpenAI /
Perplexity 等 20+) を 1 URL に集約する。本文には他社名を出さず「全 LLM
プロバイダー」の表現に留める。

基盤メカニズム (intro 行に集約):
- Universal Endpoint: 全 provider を 1 URL でルーティング
- Fallback: provider / model 障害時の自動切替 (cf-aig-step で経路追跡)
- Retry: タイムアウト / 失敗時の再試行ポリシー

公式 Features ページに従って 3 カテゴリ・11 機能:

(1) Performance & Cost Optimization
- Caching: 意味的に同じリクエストをキャッシュしてレイテンシ最大 90% 削減 + コスト削減
- Rate Limiting: 時間枠ごとのリクエスト上限。API クォータ枯渇を構造で防止
- Dynamic Routing: ユーザーセグメント / 地理 / コンテンツ分析でリクエストを
  ルーティング。A/B テストやリージョナル振り分けが宣言的に書ける
- Custom Costs: 交渉済みレートやカスタムコストモデルで集計上の料金を上書き、
  正確な部署別 / 顧客別の課金ロジックが組める

(2) Security & Safety
- Guardrails: プロンプトと応答の有害コンテンツをリアルタイム検出 / ブロック。
  Hallucination / プロンプトインジェクション / 不適切発言の対策
- DLP: PII / 財務データなどの機密情報をパターンマッチで FLAG / BLOCK。
  GDPR / HIPAA 等のコンプライアンス文脈で使う
- Authentication: Gateway 自体へのトークンベースアクセス制御
- BYOK: provider API キーを Cloudflare の暗号化インフラで集中管理。アプリ側の
  secrets に API キーを置かなくて済む (Workers Secrets と二重で守れる)

(3) Observability & Analytics
- Analytics: リクエスト数 / トークン / コスト / エラーをダッシュボードで集計
- Logging: 全リクエスト / レスポンスの詳細ログ。デバッグ / 監査 / 分析に
- Custom Metadata: cf-aig-metadata ヘッダで user_id / team / version 等を付与、
  「どの部署のどのユーザーが何モデルをいくら使ったか」を後追いできる

前章 (observability) で扱った OTel エクスポートはこれらの監査ログ・Analytics を
Honeycomb 等に流す経路として組合せる。BYOK + Custom Costs + Guardrails の 3 つは
今回新たに追加で、特に Guardrails (有害コンテンツ検出) は DLP (機密情報) と並ぶ
統制の柱として強調できる。
-->

---

# MCP Server Portal — MCP サーバーを統制する

組織内で乱立する MCP server (= LLM が叩く外部ツール群) を **中央集約してアクセス制御** する portal です。**Cloudflare Access** が認証 / 認可 / 監査を担当します。

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">

<div class="border border-orange-500/30 rounded p-3">

### 集約 / 認証

- **1 つの portal URL に複数 MCP server を集約** (内部 + サードパーティ + SaaS 系)
- **OAuth 2.0** (managed OAuth) で MCP クライアントを認証
- **SSO / MFA** を前段に挟める (Access 経由)

</div>

<div class="border border-orange-500/30 rounded p-3">

### 統制 / 最適化

- **3 軸ポリシー**: Identity (誰が) / Conditions (どの条件で) / Scope (どの tool まで)
- **Code Mode**: 全 tool 定義を 1 つの `code` tool に圧縮 → context window 削減
- **監査ログ**: 全 tool 実行を Access logs に記録 → SIEM / Logpush 連携

</div>

</div>

<div class="mt-4 text-sm op-80">

→ "**Shadow MCP**" (社員が勝手にローカルで MCP server を立てて社内データに繋ぐ) を **構造で防ぎます**。観測対象を一元化することで、AI Gateway と合わせて 「LLM 層 + ツール層」の二重統制が成立します。

</div>

<!--
MCP server portal は Cloudflare Access の AI controls 配下に提供されている機能で、
組織内の MCP server を中央管理するための portal。Shadow MCP (社員が勝手にローカル
で MCP server を立てて社内 DB / Notion / GitHub 等に繋ぐ) を、Access 経由の
gateway を強制することで構造的に止める設計。

(1) 集約: 内部 (self-hosted)、SaaS (Access for SaaS 経由)、サードパーティ
(OAuth 連携) の 3 種類の MCP server を 1 つの portal URL に束ねられる。MCP
クライアント (LLM 側) は portal URL 1 つだけ知っていればよい。

(2) 認証: OAuth 2.0 の authorization code flow (managed OAuth) で MCP クライアントを
認証。非ブラウザクライアントには 401 + WWW-Authenticate ヘッダで Access の OAuth
discovery エンドポイントを案内する仕様。

(3) ポリシー: Access の標準ポリシーが効くので、Identity / Conditions / Scope の
3 軸で粒度の細かい制御が可能。「特定 tool だけ許可」「device posture が OK
なときのみ許可」など。

(4) Code Mode: portal の機能で、複数 MCP server の全 tool 定義を 1 つの code tool に
畳み込み、LLM の context window 使用量を抑える。tool 定義が肥大化したときの
解。code path を経由する以上、AI Gateway との二重ゲートが取れる。

(5) 監査: Access logs に「どのユーザーがどの tool をいつ実行したか」が記録される。
Logpush で R2 / Iceberg / Honeycomb に流せば、AI Gateway logs と組み合わせて
LLM 層 + ツール層の Correlated audit が成立する。

事故シナリオ (IDE エージェントが本番 DB を DROP) → 対処は MCP Portal で破壊的
tool を Scope から外す + AI Gateway で DLP に「DROP TABLE 等の SQL パターン」を
ブロックリストに追加 + Workflows の waitForEvent で人間承認を挟む、の組合せで
構造的に発生不能にできる。
-->
