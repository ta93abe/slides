# Slides

Markdown に本文だけ書く。見た目はグローバルなデザインシステムが担う。アクセントは紫。紙面は frontmatter の `theme: dark` か `theme: light` だけ切り替える。Web と PDF は同一ソース。実装は Cloudflare Workers。Workers Builds は Node 22 以上（`.node-version`）。

方針と ADR は Linear の [Slides](https://linear.app/ta93abe/project/slides-5f2513034e0a) プロジェクトにある。

## 書く

1 デッキ = `decks/<slug>.md`。ルールは [docs/AUTHORING.md](docs/AUTHORING.md)。

```bash
pnpm test
pnpm dev
```

- `/` デッキ一覧
- `/<slug>` 発表プレイヤー
- `/health` プロセス確認

操作: 矢印、Home / End、スペース、スワイプ、`f` フルスクリーン、`o` 概要。URL ハッシュが枚数。

## 構成

```
decks/                 正のソース（Markdown）
src/parser/            remark で型付きスライドへ
src/design-system/     トークン・タイポ・型の見た目
src/player/            バニラ JS の操作
src/render/            HTML 組み立て（著者が触らない）
src/worker.ts          Hono（Workers + Static Assets）
```

既存の `contents/` と `slidev-theme-enbu/` は以前の Slidev 資産。新しいビルドは使わない。
