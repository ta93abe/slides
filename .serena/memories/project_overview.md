# Slides - プロジェクト概要

## 目的
HonoX + MDX で作るスライドサイト。`app/routes/*.mdx` を 1 枚置けば 1 スライドデッキになる。

## 技術スタック
- **フレームワーク**: HonoX / Hono (ファイルベースルーティング + SSR)
- **MDX**: `@mdx-js/rollup`
- **ビルド**: Vite + `@hono/vite-ssg` (静的 HTML 生成)
- **パッケージマネージャ**: pnpm
- **デプロイ先**: Cloudflare Workers (Static Assets)

## ディレクトリ構成
```
/
├── app/
│   ├── routes/
│   │   ├── _renderer.tsx   # slide.css / slide.js を inline 注入する renderer
│   │   ├── index.mdx       # スライド一覧トップ (/)
│   │   └── <deck-name>.mdx # 1 ファイル = 1 デッキ
│   ├── slide.css
│   ├── slide.js
│   ├── server.ts
│   └── client.tsx
├── public/                 # 画像・favicon・図 (svg/png)
├── vite.config.ts
├── wrangler.jsonc
└── package.json
```

## デプロイ
- `pnpm build` → `dist/` に静的 HTML 生成
- `pnpm deploy` → `wrangler deploy` で Cloudflare Workers へデプロイ
