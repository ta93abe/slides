# デッキの書き方

1 デッキ = Markdown 1 ファイル。見た目は書かない。

契約の決定: [ADR-0010](https://linear.app/ta93abe/document/adr-0010-スライド型は-html-コメントで指定する-e347dd843d49) / [ADR-0012](https://linear.app/ta93abe/document/adr-0012-アクセントは紫theme-は-light-dark-だけ-0b32786e9ca9)

## 置き場

```
decks/<slug>.md
decks/<slug>/図.png   # 任意。画像などの実体
```

`slug` は frontmatter とファイル名で一致させる。英小文字・数字・ハイフン。

## frontmatter

ファイル先頭のみ。見た目のキーは `theme` だけ。値は `dark` か `light`。省略時は `dark`。色コードは置かない。

```yaml
---
title: 発表タイトル
date: 2026-09-06
description: 一覧に出す一行
slug: event-name-2026-09-06
theme: dark
---
```

## スライド

区切りは行頭の `---`。フェンスコードの中では区切らない。

型は各スライドの先頭コメント。無ければ `body`。

```markdown
<!-- type: cover -->

# タイトル
サブタイトル
```

使える型: `cover` / `section` / `body` / `split` / `quote` / `code` / `figure`

### split

左右は `<!-- column -->` を 1 つ。

```markdown
<!-- type: split -->

## 左

本文

<!-- column -->

## 右

本文
```

### ノート

```markdown
<!-- notes
ここで話すこと。
-->
```

### 画像

```markdown
![16:9 の枠](./frame.svg)
```

パスは `decks/<slug>/` 配下からの相対。`./frame.svg` は `decks/<slug>/frame.svg` を指す。

## 禁止（ビルドが失敗する）

- デッキ内の CSS、`style` 属性、`script`
- JSX コンポーネント、MDX の `import` / `export`
- 未知の型、未知の frontmatter キー
- 型コメントをスライド先頭以外に置くこと

## 見る

```bash
pnpm test
pnpm dev
```

`/` が一覧。`/<slug>` が発表面。`/<slug>.pdf` が PDF。`#3` が 3 枚目。紙面の決め方は [docs/PDF.md](PDF.md)。

操作: ← → / Home / End / スペース / スワイプ / `f` フルスクリーン / `o` 概要グリッド
