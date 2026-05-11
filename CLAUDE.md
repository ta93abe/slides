# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Slidevプレゼンテーションのモノレポ。各スライドがpnpmワークスペースの独立パッケージとして管理され、Cloudflare Workers（Static Assets + Worker handler）でホスティングされる。

## コマンド

```bash
# 新しいスライドプロジェクトの作成
# /new-slide コマンドまたは「新しいスライドを作って」で実行（.claude/skills/new-slide 参照）
cd contents && pnpm create slidev <project-name>

# 対話 picker で dev / build / export を実行
pnpm dev              # = pnpm pick dev
pnpm pick build
pnpm export           # = pnpm pick export

# 特定スライドのみ
pnpm --filter <slide-name> dev
pnpm --filter <slide-name> build
pnpm --filter <slide-name> export

# 全スライド並列ビルド（dist/ に出力 + slides.json 生成）
pnpm build
```

## アーキテクチャ

```
/
├── contents/                      # 全スライドの格納ディレクトリ
│   └── <event-name-YYYY-MM-DD>/   # 各スライドプロジェクト（pnpmワークスペースパッケージ）
│       ├── package.json           # slidev フィールド (title, date, description, addons)
│       ├── slides.md              # スライド本体（Slidev Markdown）
│       ├── components/            # Vueカスタムコンポーネント（任意）
│       ├── snippets/              # コードスニペット（任意）
│       └── pages/                 # 追加ページ（任意）
├── slidev-theme-enbu/             # Slidevカスタムテーマ (workspace package)
├── scripts/
│   ├── build.js                   # 各スライドの build wrapper (favicon + dist-stale cache)
│   ├── build-all.js               # 全体オーケストレータ (clean + pnpm -r build + slides.json)
│   └── picker.js                  # 対話 CLI (dev/build/export)
├── src/
│   └── index.js                   # Cloudflare Worker handler (/ → ta93abe.com/slides 302)
├── pnpm-workspace.yaml            # workspaces + catalog (依存バージョン統一)
├── wrangler.toml                  # Cloudflare Workers (assets + main handler)
├── dist-stale/                    # 過去ビルドキャッシュ（gitignore、削除で再ビルド）
└── dist/                          # ビルド成果物（gitignore）
    ├── <slide-name>/              # 各スライドの SPA
    └── slides.json                # スライド一覧メタデータ
```

### 依存管理 (pnpm catalog)

`pnpm-workspace.yaml` の `catalog:` に Slidev 本体・テーマ・vue などの共通依存を集約。各スライドの `package.json` は `"@slidev/cli": "catalog:"` のように `catalog:` 参照を書く。バージョンを 1 箇所で管理できる。

### テーマの利用

`slidev-theme-enbu/` は pnpm workspace package。スライドから利用するには:

1. スライドの `package.json` に `"slidev-theme-enbu": "workspace:*"` を追加
2. `slides.md` の frontmatter で `theme: enbu` を指定

npm 公開する場合は `slidev-theme-enbu/` ディレクトリから `npm publish` するだけで移行可能。

### ビルドの仕組み

- `pnpm build` = `node scripts/build-all.js`
- `dist/` を clean → `pnpm -r --parallel --filter "./contents/*" run build` で全スライド並列ビルド → `slides.json` 生成
- 各スライドの `package.json` の `build` スクリプトは `node ../../scripts/build.js /<slide-id>/`
- `scripts/build.js`: `dist-stale/<slide-id>/` があれば cp してビルドスキップ。無ければ favicon を `public/` にコピーして `slidev build --base /<slide-id>/ --out ../../dist/<slide-id>/`

### dist-stale キャッシュ

過去スライドを毎回再ビルドすると CI 時間が伸びるので、`dist-stale/<slide-id>/` にビルド結果を残しておけば次回以降の `pnpm build` でそのまま採用される。再ビルドしたい場合は該当ディレクトリを削除。

### ルーティング (Worker handler)

`src/index.js` で `/` → `https://ta93abe.com/slides` (302) を返す。それ以外のパスは `env.ASSETS.fetch(request)` で静的配信。`_redirects` は使わない。

### スライドの命名規則

`<イベント名>-<YYYY-MM-DD>` 形式（例: `pug-at-fukuoka-2025-06-06`）

### スライドの識別

各スライドの `package.json` 内の `slidev` フィールドがビルド対象の識別子。このフィールドがないディレクトリはスキップされる。

## ナレッジソース

- **Obsidian Vault**: `~/zettelkasten` — スライド作成時にノートを参照し、内容の素材として活用する

## 技術スタック

- **Slidev** (v52+): Markdownベースのプレゼンテーションフレームワーク（Vue 3）
- **pnpm**: パッケージマネージャ（ワークスペース管理 + catalog）
- **Cloudflare Workers**: Static Assets + Worker handler
- **Node.js 20**
