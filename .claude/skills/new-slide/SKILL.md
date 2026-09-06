---
name: new-slide
description: This skill should be used when the user asks to "create a new slide", "make a presentation", "新しいスライドを作って", "スライドを追加", or mentions creating a deck. Scaffolds a Markdown deck under decks/.
---

# New Slide

新しいデッキを `decks/` に 1 ファイルで作る。見た目は書かない。

## 必要な情報

| パラメータ | 必須 | 例 |
|---|---|---|
| タイトル | Yes | `PUG at Fukuoka` |
| 概要 | Yes | `Cloudflare Workersの紹介` |
| 発表日 | No | `2025-06-06`（省略時は今日） |
| slug | No | 省略時はタイトルを英小文字ハイフン化して日付を付ける |

## 手順

1. 必要なら `~/zettelkasten` から関連ノートを探す
2. `decks/<slug>.md` を作る。frontmatter は `title` / `date` / `description` / `slug`。任意で `theme: dark` か `theme: light`（省略時 dark）
3. スライドは `---` で区切る。型は `<!-- type: cover -->` など。未指定は `body`
4. CSS・コンポーネント・JSX は書かない
5. 画像が要るときだけ `decks/<slug>/` に置き、`![alt](./file.svg)` で参照する

契約の詳細は `docs/AUTHORING.md`。
