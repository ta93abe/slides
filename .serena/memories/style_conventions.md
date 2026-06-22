# コードスタイル・規約

## TypeScript / TSX
- ESモジュール形式 (`import` / `export`)
- 型定義は `interface` / `type` を使用

## MDX スライド
- frontmatter に `slide: true` を付けるとスライドモードになる
- `theme`: `dark` (既定) / `cloudflare` / `light`
- `---` (水平線) でスライドを分割
- `::right::` で 2 カラムにする
- スピーカーノートは `{/* ... */}` (MDX コメント) で本文に残す
- 図は事前に SVG/PNG 化して `public/` に置き `![alt](/path)` で埋め込む

## 命名規則
- デッキ名: `<event-name>-YYYY-MM-DD` または短い英語キーワード
  - 例: `cloudflare-data-platform`
- 変数・関数: camelCase
- コンポーネント: PascalCase
