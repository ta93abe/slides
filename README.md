# slides

HonoX + MDX で作るスライドサイト。`app/routes/*.mdx` を 1 枚置けば 1 スライドデッキになる。

## 開発

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # dist/ に静的 HTML を生成
pnpm deploy    # Cloudflare Workers へデプロイ
```

## 新しいスライドを作る

`app/routes/<deck-name>.mdx` を作成し、frontmatter に `slide: true` を付ける。`---` で分割、`::right::` で 2 カラム。詳細は `.claude/CLAUDE.md` を参照。
