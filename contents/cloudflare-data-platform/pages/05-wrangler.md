---
layout: section
---

# 開発者体験

---

# Wrangler & ローカルエミュレート

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### Wrangler — 統合 CLI
<v-clicks>

- R2 / D1 / KV / DO / Workers / Pipelines ... を **1 コマンド**で
- `wrangler types` で Binding → TypeScript 型を自動生成
- `wrangler dev` 中に `e` キーで **Local Explorer** 起動（KV / R2 / D1 / DO / Workflows の中身を検査）
- Bash / Zsh / Fish のシェル補完

</v-clicks>

</div>
<div>

### Miniflare — 本番同一ランタイム
<v-clicks>

- `wrangler dev` は **workerd**（本番と同じランタイム）でローカル実行
- R2 / D1 / KV / DO / Queues / Vectorize が **全部ローカルで動く**
- Vitest 統合で Binding 付きの E2E テスト

</v-clicks>

</div>
</div>

<v-click>

<div class="mt-6 border border-yellow-500/30 rounded p-3 text-sm">

**vs LocalStack / DynamoDB Local**: LocalStack は AWS API の再実装でエミュレーション差異が出やすい。Miniflare は **workerd 同一バイナリ** なので「ローカルで動いて本番で動かない」がほぼ発生しない。

</div>

</v-click>

---

# cf CLI — プラットフォーム全体の統合 CLI

2026-04-13 technology preview。Wrangler と並行して Cloudflare が公開した新 CLI。

<v-clicks>

- **約 3,000 API 操作**を 1 CLI に（Cloudflare REST API のほぼ全域をカバー）
- TypeScript スキーマから **CLI / バインディング / ドキュメント / AI エージェント用 Skill を同時生成**
- AI エージェントを主要ターゲットに据えた設計

</v-clicks>

<v-click>

### Wrangler との住み分け

| | Wrangler | cf CLI |
|---|---|---|
| **立ち位置** | 開発者の相棒（成熟） | プラットフォーム API 窓口 |
| **強み** | ローカル開発・デプロイ | API 全カバレッジ・AI 連携 |
| **主なユーザー** | Workers 開発者 | 運用・AI エージェント |

</v-click>

<v-click>

<div class="mt-4 text-sm op-70">
<strong>Data Platform 的な効き</strong>: Cloudflare MCP + cf Skill の組み合わせで、AI エージェントが「Pipeline スキーマ更新 → R2 権限変更 → D1 デプロイ」のような複合操作を人間介在なしで回せる未来の布石。
</div>

</v-click>

---

# エコシステム — MCP / llms.txt / IaC

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### MCP サーバー
<v-clicks>

- **17 の公式 MCP サーバー**（API + プロダクト別）
- Claude / Cursor から直接操作
- データカタログを MCP で公開できる

</v-clicks>

### ドキュメント
<v-clicks>

- **llms.txt** 提供（LLM フレンドリー）
- Changelog 週次更新
- Discord で開発者が直接回答

</v-clicks>

</div>
<div>

### IaC / API
<v-clicks>

- **REST API 2,500+ エンドポイント**
- **Terraform v5** プロバイダ
- **Pulumi** 公式サポート
- 全リソースをコードで定義可能

</v-clicks>

</div>
</div>

<v-click>

<div class="mt-4 text-sm op-70">
<strong>vs AWS</strong>: AWS は CLI・SAM・CDK・CloudFormation と選択肢が多いが分散。Cloudflare は Wrangler + cf + IaC が一貫して同じ API スキーマから生成される。
</div>

</v-click>
