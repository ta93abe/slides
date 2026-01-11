# コードスタイル・規約

## TypeScript (Deno)
- ESモジュール形式 (`import` / `export`)
- 型定義は `interface` を使用
- Deno標準ライブラリは `jsr:@std/*` からインポート

## 命名規則
- スライドプロジェクト名: `<event-name>-YYYY-MM-DD` 形式
  - 例: `pug-at-fukuoka-2025-06-06`
- 変数・関数: camelCase
- インターフェース: PascalCase

## package.json メタデータ
各スライドの `package.json` には `slidev` フィールドを含める:
```json
{
  "slidev": {
    "title": "タイトル",
    "date": "YYYY-MM-DD",
    "description": "説明"
  }
}
```

## Slidev スライド
- テーマ: `seriph` (デフォルト)
- トランジション: `slide-left`
- MDC構文有効
