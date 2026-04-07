# Slides - プロジェクト概要

## 目的
Slidevを使用したプレゼンテーションスライドをモノレポで管理するプロジェクト。
複数のスライドプロジェクトを一元管理し、Cloudflare Workersにデプロイする。

## 技術スタック
- **ビルドツール**: Node.js (build.js)
- **パッケージマネージャ**: pnpm (ワークスペース)
- **スライド作成**: Slidev
- **スキャフォールディング**: scaffdog
- **デプロイ先**: Cloudflare Workers (静的アセット)

## ディレクトリ構成
```
contents/
├── build.ts              # Denoビルドスクリプト
├── deno.json             # Denoタスク定義
├── package.json          # pnpmワークスペース設定
├── pnpm-workspace.yaml   # ワークスペース定義
├── wrangler.toml         # Cloudflare Workers設定
├── .scaffdog/            # scaffdogテンプレート
├── dist/                 # ビルド成果物
│   ├── slides.json       # スライド一覧API
│   ├── _redirects        # リダイレクト設定
│   └── <slide-id>/       # 各スライドのビルド
└── <slide-project>/      # 各スライドプロジェクト
    ├── package.json      # slidevメタデータ含む
    └── slides.md         # スライド本体
```

## スライドプロジェクトの構成
各スライドプロジェクトの`package.json`に`slidev`フィールドでメタデータを定義:
```json
{
  "slidev": {
    "title": "スライドタイトル",
    "date": "YYYY-MM-DD",
    "description": "説明"
  }
}
```

## デプロイ
- ホスト: `slides.ta93abe.com`
- トップページは `ta93abe.com/slides` にリダイレクト
- `slides.json` APIを提供し、ポートフォリオサイト(Astro)がビルド時にfetch
