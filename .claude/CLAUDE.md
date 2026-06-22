# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

HonoX + MDX で作るスライドサイト。`app/routes/*.mdx` を 1 枚置けば 1 スライドデッキになる。MDX は `@mdx-js/rollup` で JSX にコンパイルされ Hono が SSR、`@hono/vite-ssg` がビルド時に静的 HTML を生成し、Cloudflare Workers (Static Assets) で配信する。

## コマンド

```bash
pnpm dev       # Vite dev サーバ
pnpm build     # 静的 HTML を dist/ に生成
pnpm preview   # wrangler dev でローカル配信
pnpm deploy    # build して wrangler deploy
```

## アーキテクチャ

```
/
├── app/
│   ├── routes/
│   │   ├── _renderer.tsx                  # slide.css / slide.js を inline 注入する renderer
│   │   ├── index.mdx                      # スライド一覧トップ (/)
│   │   └── <deck-name>.mdx                # 1 ファイル = 1 デッキ
│   ├── slide.css                          # スライドスタイル
│   ├── slide.js                           # ---分割 / カラム / ページ送り / コピーボタン
│   ├── server.ts                          # HonoX サーバエントリ
│   ├── client.tsx                         # HonoX クライアントエントリ
│   └── global.d.ts                        # frontmatter 型
├── public/                                # 画像・favicon・図 (svg/png)
├── vite.config.ts
├── wrangler.jsonc                          # Cloudflare Workers (Static Assets)
└── package.json
```

### スライドの書き方

- frontmatter に `slide: true` を付けるとスライドモードになる。`theme` は `dark` (既定) / `cloudflare` / `light`。
- `---` (水平線) でスライドを分割する。
- `::right::` で 2 カラムにする (先頭見出しは全幅、`::right::` の前が左・後が右カラム)。
- コードハイライトは highlight.js を CDN ロード。
- スピーカーノートは `{/* ... */}` (MDX コメント) で本文に残せる (実行時 DOM には出ない)。
- 図 (Excalidraw 等) は事前に SVG/PNG 化して `public/` に置き、`![alt](/path)` で埋め込む。

### ルーティング / トップ

`app/routes/index.mdx` がトップ (`/`)。デッキ一覧を置く。

### デプロイ

`pnpm deploy` で `vite build` → `wrangler deploy`。`wrangler.jsonc` の `assets.directory` は `./dist`。

## ナレッジソース

- **Obsidian Vault**: `~/zettelkasten` — スライド作成時にノートを参照し、内容の素材として活用する

## 技術スタック

- **HonoX / Hono**: ファイルベースルーティング + SSR
- **MDX**: `@mdx-js/rollup`
- **Vite + @hono/vite-ssg**: 静的 HTML 生成
- **Cloudflare Workers**: Static Assets
- **pnpm** / **Node.js 20+**
