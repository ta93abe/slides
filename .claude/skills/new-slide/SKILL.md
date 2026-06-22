---
name: new-slide
description: This skill should be used when the user asks to "create a new slide", "make a presentation", "新しいスライドを作って", "スライドを追加", "プレゼンを作成", or mentions creating a slide deck. Scaffolds a new MDX slide deck under app/routes/.
---

# New Slide Deck

新しい MDX スライドデッキを `app/routes/<deck-name>.mdx` にスキャフォールドするスキル。

## 必要な情報

| パラメータ | 必須 | 例 | 説明 |
|---|---|---|---|
| タイトル | Yes | `Cloudflare で始める Data Platform` | スライドのタイトル |
| デッキ名 | No | `cloudflare-data-platform` | ファイル名 (未指定ならタイトルから生成) |
| テーマ | No | `dark` | `dark` (既定) / `cloudflare` / `light` |

## デッキ名の生成ルール

タイトルを英語化 → 小文字化 → スペースをハイフンに → `app/routes/<deck-name>.mdx`。

## ナレッジソース

`~/zettelkasten` (Obsidian Vault) から関連ノートを検索し、内容の素材にする。

## 作成手順

1. `~/zettelkasten` で関連ノートを Glob/Grep で探す。
2. `app/routes/<deck-name>.mdx` を作成し、以下の雛形を書く:

   ```mdx
   ---
   title: '<タイトル>'
   slide: true
   theme: dark
   ---

   # <タイトル>

   ## <発表者>

   {/* スピーカーノート */}

   ---

   ## 次のスライド

   - 箇条書き

   ::right::

   ![図](/diagrams/xxx.svg)
   ```

3. 図は事前に SVG/PNG 化して `public/` に置き `![alt](/path)` で埋め込む。
4. `app/routes/index.mdx` のデッキ一覧にリンクを追加する。
5. `pnpm dev` で確認する。

## ルール

- `---` でスライド分割、`::right::` で 2 カラム (先頭見出しは全幅)。
- スピーカーノートは `{/* ... */}` で本文に残す。
- 本文に他社プロダクト名・機能リリース日付・擬人化比喩は入れない (詳細・出典はノートへ)。
