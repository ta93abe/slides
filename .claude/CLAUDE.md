# CLAUDE.md

Markdown スライド。見た目はグローバルなデザインシステム。ランタイムは Cloudflare Workers + Hono。プレイヤーはバニラ JS。Node 22 以上。

## コマンド

```bash
pnpm test
pnpm build
pnpm dev          # build のあと wrangler dev
pnpm typecheck
```

新しいデッキは `decks/<slug>.md`。契約は `docs/AUTHORING.md`。

## アーキテクチャ

```
decks/<slug>.md            1 デッキ 1 ファイル
decks/<slug>/              画像などの実体（任意）
src/parser/                unified + remark。MDX は失敗
src/design-system/         トークン / タイポ / 型
src/player/                キーボード・スワイプ・ハッシュ
src/render/                一覧とデッキ HTML
src/worker.ts              Hono。export default app
dist/                      Workers Static Assets
```

型の指定はスライド先頭の `<!-- type: cover -->`。未指定は `body`。split は `<!-- column -->`。

frontmatter の見た目キーは任意の `theme: dark | light` だけ（省略時 dark）。禁止: デッキ内 CSS、JSX、MDX import、未知の frontmatter キー。

PDF（Browser Run → R2）はまだ後続。印刷 CSS はプレイヤーに入っている。
