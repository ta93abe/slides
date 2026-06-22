# タスク完了時のチェックリスト

## コード変更後
1. `pnpm build` でビルドが成功することを確認
2. `dist/index.html` と `dist/<deck-name>/index.html` が生成されていることを確認

## 新しいスライド作成後
1. `app/routes/<deck-name>.mdx` を作成 (frontmatter に `slide: true`)
2. `app/routes/index.mdx` のデッキ一覧にリンクを追加
3. `pnpm dev` で開発サーバーで確認
4. `pnpm build` でビルド確認

## デプロイ前
1. `pnpm install` で依存関係が最新か確認
2. `pnpm build` でビルド成功
3. `dist/` の内容を確認
   - `index.html` が存在
   - 各デッキのディレクトリが存在
