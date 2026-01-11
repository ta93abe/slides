# コマンド一覧

## ビルド
```bash
# 全スライドをビルド（dist/に出力）
deno task build
```

## 開発
```bash
# 新しいスライドプロジェクトを作成
pnpm new

# 特定のスライドの開発サーバー起動
pnpm --filter <slide-id> dev
# 例: pnpm --filter pug-at-fukuoka-2025-06-06 dev
```

## 依存関係
```bash
# 依存関係のインストール
pnpm install
```

## Cloudflare デプロイ
```bash
# ビルド + デプロイ（CI/CD）
pnpm install && deno task build
npx wrangler deploy
```

## ローカル確認
```bash
# ビルド後の成果物を確認
npx serve dist
```
