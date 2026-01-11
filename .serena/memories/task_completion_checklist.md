# タスク完了時のチェックリスト

## コード変更後
1. `deno task build` でビルドが成功することを確認
2. `dist/slides.json` が正しく生成されていることを確認
3. 新しいスライドを追加した場合、`package.json` に `slidev` メタデータがあることを確認

## 新しいスライド作成後
1. `pnpm new` でスライドを生成
2. `slides.md` を編集
3. `pnpm --filter <slide-id> dev` で開発サーバーで確認
4. `deno task build` でビルド確認

## デプロイ前
1. `pnpm install` で依存関係が最新か確認
2. `deno task build` でビルド成功
3. `dist/` の内容を確認
   - `slides.json` が存在
   - `_redirects` が存在
   - 各スライドのディレクトリが存在
