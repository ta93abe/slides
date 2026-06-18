# Slidevモノレポ → HonoX + MDX スライド基盤 移行設計

- 日付: 2026-06-18
- ステータス: ドラフト(レビュー待ち)
- 参照: [yusukebe/cloudflare-workshop](https://github.com/yusukebe/cloudflare-workshop)

## 背景と目的

現状はSlidevをpnpmワークスペースで複数パッケージ化したモノレポ。各スライドが独立パッケージ
（`@slidev/cli` + Vue + カスタムテーマ `slidev-theme-enbu`）で、per-packageビルド・`dist-stale`
キャッシュ・catalog依存管理を伴い構成が重い。

これを yusukebe/cloudflare-workshop と同じ **「`app/routes/` にMDXを1枚置けば1スライドデッキ」**
という軽量構成へ全面移行する。新スライド追加コスト = MDXファイル1枚。

## スコープ(確定事項)

- root を単一の **HonoX + MDX** アプリ化する。
- `cloudflare-data-platform`（Slidev）を **1枚のMDXへ移行**する。
- `pug-at-fukuoka-2025-06-06` は **コンテンツごと削除**。
- Slidev基盤（pnpmワークスペース／`slidev-theme-enbu`／ビルドスクリプト／catalog／`dist-stale`）を **全廃**。
- テーマは **ミニマルに新規** の `slide.css`（enbu再現はしない）。
- Excalidraw／mermaid等の図は **事前にSVG/PNG化して画像埋め込み**（ビルド時の図描画依存を持たない）。

## 非スコープ / 割り切り

- Slidevの段階表示（`v-clicks`／`v-motion`）は再現しない。該当は除外中の `workers.md` の3箇所のみで影響小。
- プレゼンターモード・描画（drawings）は移行しない。
- highlight.jsベースのコードハイライトとし、Shiki相当の精緻なテーマ移植はしない。

## ターゲット構成

```
/
├── app/
│   ├── routes/
│   │   ├── _renderer.tsx                  # slide.css / slide.js を注入する jsxRenderer
│   │   ├── index.mdx                      # スライド一覧トップ（/）
│   │   └── cloudflare-data-platform.mdx   # 移行後のCFDP（1ファイル=1デッキ）
│   ├── slide.css                          # ミニマルな新規スタイル
│   ├── slide.js                           # ---分割・ページ送り・カラム・コピーボタン
│   ├── client.tsx                         # HonoX クライアントエントリ
│   ├── server.ts                          # HonoX サーバエントリ
│   └── global.d.ts
├── public/                                # 画像・mp4・フォント・favicon（CFDPの public/ から移設）
├── vite.config.ts
├── wrangler.jsonc
├── package.json
└── tsconfig.json
```

## 依存関係

- ランタイム: `hono`, `honox`
- ビルド: `@hono/vite-ssg`, `@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`, `rehype-slug`, `vite`, `wrangler`
- パッケージマネージャは pnpm を継続するが **ワークスペース定義は廃止**（単一 `package.json`）。

## ビルド & デプロイ

- `pnpm dev` … Vite devサーバ
- `pnpm build` … `@hono/vite-ssg` で各 `routes/*.mdx` を静的HTML生成
- `pnpm deploy` … `wrangler deploy`（Static Assets + Worker）
- コードハイライトは highlight.js を CDN ロード。

## ルーティング / トップページ

- `app/routes/index.mdx` を **スライド一覧のランディング**にする。
- 現状の `src/index.js`（`/` → `https://ta93abe.com/slides` への302）は廃止し、リポジトリ自体が
  スライドサイトとして自己完結する。
  - （レビュー時の確認ポイント: 外部リダイレクトを維持したい場合は server.ts に移植する。）

## スライドエンジン（slide.js / slide.css）

yusukebe の実装をベースに移植する。

- `---`（hr）で分割。区切りが2未満なら h1/h2 の手前で分割するフォールバック。
- `::right::` / `:::` で2カラム化（先頭見出しは全幅）。
- ナビゲーション: 矢印 / Space / PageUp-Down / Home-End / スワイプ / ハッシュURL / プログレスバー / `f` 全画面。
- コードブロックにコピーボタンを付与。
- frontmatter `slide: true` でスライドモードを有効化。`_renderer.tsx` が `head.slide` で分岐。
- `slide.css` はミニマル新規。最低限: タイポグラフィ、cover/center/section用クラス、2カラム、コードブロック、画像センタリング。

## CFDP 移行マッピング

7ページ（`pages/*.md`）+ `slides.md` の `src:` インクルード構成、計約1064行を、
**1枚の `app/routes/cloudflare-data-platform.mdx`** に統合する。

| Slidev機能 | 使用箇所 | MDXでの扱い |
|---|---|---|
| `---` スライド区切り | 全体 | そのまま流用 |
| `src:` インクルード | 9 | 各 `pages/*.md` の内容を順序通り1ファイルへ展開（ambient-agent.md / durability.md は欠落＝除外中なのでスキップ） |
| `layout: two-cols-header` + `::right::` | 9 | slide.js のカラム機能（`::right::`）へ |
| `layout: cover` | 1 | スライド先頭にクラス指定 + CSS |
| `layout: center` | 1 | 同上 |
| `layout: section` | 4 | 同上 |
| `<Excalidraw src>` | 3 | `.excalidraw` を SVG/PNG にエクスポートし `![](...)` で埋め込み |
| ` ```mermaid ` | 1 | mermaid を SVG にレンダリングして画像埋め込み |
| `<Tweet>` | 1 | 公式埋め込み or スクリーンショット画像 |
| `<HONEYCOMB>` 等の独自マーク | 1 | プレーンテキスト or `<span class>` へ |
| `v-clicks` | 3（除外中 workers.md） | 静的表示にフォールバック |
| スピーカーノート `<!-- -->` | 多数 | MDX上に保持（メモリの「ノート同時作成」方針を維持）。表示方法は要決定（DOMに残し非表示 or 別管理） |

### 画像 / アセット

- `contents/cloudflare-data-platform/public/` の png / mp4 / fonts / favicon / `.excalidraw` を `public/` へ移設。
- `.excalidraw`（3） は SVG/PNG にエクスポート（手動 or excalidraw CLI）。
- mermaid（observability.md 内1） は SVG に事前レンダリング。
- 既存 `dist/` 内に既にレンダ済みの図PNGがあれば流用可否を確認。

### 移行後の検証

- 全スライドが `---` で正しく分割され、ページ番号・ナビゲーションが機能する。
- 2カラム（9箇所）が崩れない。
- 画像・動画・図がすべて表示される（リンク切れゼロ）。
- スピーカーノートが保持されている。

## 削除対象

- `contents/`（`cloudflare-data-platform` は移行後に削除、`pug-at-fukuoka-2025-06-06` は即削除）
- `slidev-theme-enbu/`
- `scripts/`（build.js / build-all.js / picker.js）
- `pnpm-workspace.yaml` の workspace / catalog 定義
- `dist-stale/`
- `src/index.js`（リダイレクトWorker）
- ルート `package.json` の Slidev向け scripts / 依存

## リスク

- **図のエクスポート**: `.excalidraw` のSVG化は自動化しづらく、手作業が混じる可能性。
- **コンテンツ統合**: 9インクルードを1ファイル化する際の順序・区切りのミスでスライド数がずれる。移行後にスライド数を元デッキと突き合わせる。
- **見た目の差**: ミニマル新規テーマのため、enbuと比べ印象が変わる。登壇用途として許容できるか実機確認。
