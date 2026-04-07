# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Slidevプレゼンテーションのモノレポ。各スライドがpnpmワークスペースの独立パッケージとして管理され、Cloudflare Workers（Static Assets）でホスティングされる。

## コマンド

```bash
# 新しいスライドプロジェクトの作成
# /new-slide コマンドまたは「新しいスライドを作って」で実行（.claude/skills/new-slide 参照）
cd contents && pnpm create slidev <project-name>

# 特定スライドの開発サーバー起動
pnpm --filter <slide-name> dev

# 全スライドのビルド（dist/に出力）
pnpm build

# 特定スライドのみビルド
pnpm --filter <slide-name> build

# スライドのPDFエクスポート
pnpm --filter <slide-name> export
```

## アーキテクチャ

```
/
├── contents/                      # 全スライドの格納ディレクトリ
│   └── <event-name-YYYY-MM-DD>/   # 各スライドプロジェクト（pnpmワークスペースパッケージ）
│       ├── package.json           # slidevメタデータ（title, date, description）
│       ├── slides.md              # スライド本体（Slidev Markdown）
│       ├── components/            # Vueカスタムコンポーネント（任意）
│       ├── snippets/              # コードスニペット（任意）
│       └── pages/                 # 追加ページ（任意）
├── themes/                        # Slidevカスタムテーマ
│   └── enbu/                      # 炎舞テーマ（slidev-theme-enbu）
├── build.js                       # 全スライド一括ビルドスクリプト
├── .claude/skills/new-slide/       # スライド作成スキル
├── wrangler.toml                  # Cloudflare Workers設定（dist/を静的配信）
└── dist/                          # ビルド成果物（gitignore対象）
    ├── <slide-name>/              # 各スライドのSPA
    ├── slides.json                # スライド一覧メタデータ
    └── _redirects                 # / → ta93abe.com/slides へリダイレクト
```

### テーマの利用

`themes/` 配下のテーマは `slidev-theme-*` として pnpm workspace で管理。スライドから利用するには:

1. スライドの `package.json` に `"slidev-theme-enbu": "workspace:*"` を追加
2. `slides.md` の frontmatter で `theme: enbu` を指定

npm 公開する場合は `themes/enbu/` ディレクトリから `npm publish` するだけで移行可能。

### ビルドの仕組み（build.js）

- `contents/`配下のディレクトリを走査し、`package.json`に`slidev`フィールドがあるものをスライドとして自動検出
- 各スライドを`slidev build --base /<slide-id>/`でビルドし`dist/<slide-id>/`に出力
- `slides.json`（日付降順のスライド一覧）と`_redirects`を生成

### スライドの命名規則

`<イベント名>-<YYYY-MM-DD>` 形式（例: `pug-at-fukuoka-2025-06-06`）

### スライドの識別

各スライドの`package.json`内の`slidev`フィールドがビルド対象の識別子。このフィールドがないディレクトリはスキップされる。

## ナレッジソース

- **Obsidian Vault**: `~/zettelkasten` — スライド作成時にノートを参照し、内容の素材として活用する

## 技術スタック

- **Slidev** (v52+): Markdownベースのプレゼンテーションフレームワーク（Vue 3）
- **pnpm**: パッケージマネージャ（ワークスペース管理）
- **Cloudflare Workers**: Static Assetsによるホスティング
- **Node.js 20**
