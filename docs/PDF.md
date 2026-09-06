# PDF（Browser Run）

Web と同じ DOM を Browser Run の `quickAction("pdf")` に渡し、Workflow が R2 へ置く。[ADR-0007](https://linear.app/ta93abe/document/adr-0007-実装のホームは-cloudflare-029c7b1ad39b) / TA-806 / TA-810 / TA-811。

## URL

| パス | 内容 |
| -- | -- |
| `/:slug` | 発表プレイヤー |
| `/:slug?print=1` | 全枚を並べた印刷用 HTML（`print.html`） |
| `/:slug.pdf` | R2 の PDF。無ければ Queue → Workflow で生成し `202` |

プレイヤー左下の「PDF」が `/:slug.pdf` を開く。クライアントの印刷ダイアログには頼らない。

## 紙面（TA-811）

1 スライド = 1 ページ、16:9。CSS `@page` を優先し、名前付き用紙（A4 など）は使わない。`landscape` キーワードは付けない（幅×高さですでに横長。付けると二重に回転する）。

| 項目 | 値 |
| -- | -- |
| `@page size` | `13.333in 7.5in`（余白 0） |
| `viewport` | `1920 × 1080` |
| `emulateMediaType` | `print` |
| `pdfOptions.printBackground` | `true` |
| `pdfOptions.preferCSSPageSize` | `true` |
| `pdfOptions.width` / `height` | `13.333in` / `7.5in`（CSS が効かないとき用） |
| `pdfOptions.format` | 未指定 |
| `pdfOptions.landscape` | 未指定 |
| `gotoOptions.waitUntil` | `networkidle0` |
| `waitForSelector` | `[data-print-ready]` |
| `cacheTTL` | `0` |

印刷 CSS は `.slide[hidden]` を `display: flex !important` で上書きする。プレイヤーは非表示スライドを `hidden` にしており、specificity を上げないと 1 枚目だけになる。

## パイプライン（TA-810）

```
GET /:slug.pdf
  ├─ R2 `pdf/<slug>.pdf` の version がデッキ HTML の SHA-256 先頭 16 字と一致 → 返す
  └─ 不一致 / 未生成 → Queue `slides-pdf`（max_concurrency: 1）
       └─ PdfWorkflow
            1. render-pdf  Browser Run が `/:slug?print=1` を描画し、staging に置く
            2. put-r2      本番キーへ移す
            3. purge-cache Cache API から `/:slug.pdf` を消す
```

生成中と完了は Analytics Engine（dataset `slides`）に `blobs: ["pdf", status]` を書く。Browser Run の失敗は Workflow の `step.do` が指数バックオフでリトライする。

ローカルで実描画する場合は `wrangler dev --remote`（`quickAction` は local 未対応）。プレビュー URL が Access の後ろだと Browser Run が HTML を取れない。
