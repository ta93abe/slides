# Slidev → HonoX + MDX 移行 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slidev モノレポを「`app/routes/*.mdx` 1枚 = 1スライドデッキ」の HonoX + MDX 基盤へ全面移行し、`cloudflare-data-platform` を 1 枚の MDX に移植する。

**Architecture:** リポジトリ root を単一の HonoX アプリにする。MDX は `@mdx-js/rollup` で JSX にコンパイルされ Hono が SSR、`@hono/vite-ssg` がビルド時に静的 HTML を生成、Cloudflare Workers (Static Assets) で配信する。スライド表示はバニラ JS (`slide.js`) が描画済み HTML を `---` で分割しキーボード/スワイプ/カラム/コピーボタンを付与する。コードハイライトは highlight.js を CDN ロード。図は事前に SVG/PNG 化して画像として埋め込む。

**Tech Stack:** HonoX, Hono, MDX, Vite, `@hono/vite-ssg`, Cloudflare Workers (wrangler), pnpm (ワークスペース無し), highlight.js (CDN), Playwright + `@excalidraw/excalidraw` (図の事前描画にのみ使用、移行後に破棄)。

## Global Constraints

- パッケージマネージャは pnpm。**ワークスペース定義 (`pnpm-workspace.yaml`) は廃止**し単一 `package.json` にする。
- Node.js 20+ (ローカルは v24)。
- 依存バージョン (verbatim、参照: yusukebe/cloudflare-workshop):
  - dependencies: `hono ^4.12.25`, `honox ^0.1.56`
  - devDependencies: `@hono/vite-ssg ^0.3.3`, `@mdx-js/rollup ^3.1.1`, `prettier ^3.8.4`, `rehype-slug ^6.0.0`, `remark-frontmatter ^5.0.0`, `remark-mdx-frontmatter ^5.2.0`, `vite ^8.0.16`, `wrangler ^4.100.0`
  - 図描画用 (devDependencies、Task 5 で削除): `playwright ^1.49.0`
- 静的アセットは **リポジトリ root の `public/`** に置く (Vite/HonoX の既定。`/favicon.png` のように `/` 直下で配信される)。
- **コンテンツは忠実移行**: 本文の意味を変えない。memo 既知ルール (本文に他社プロダクト名/機能リリース日付/擬人化比喩を入れない) は元の `slides.md` 本文が既に遵守済みなので、そのまま保持する。日付・他社名・比喩は元々スピーカーノート側にあるため触らない。
- スピーカーノート (Slidev の `<!-- ... -->`) は MDX では使えないため **`{/* ... */}` (MDX/JSX コメント) に変換して各スライド末尾に保持**する。実行時 DOM には出ない (プレゼンターモードは非スコープ)。
- MDX では生 HTML タグは JSX 扱い: `<br>` は `<br />`、`class=` は使わず markdown 記法か CSS に寄せる。Tailwind ユーティリティクラス (`scale-80` 等) は存在しないので削除する。
- 移行対象は **アクティブな 4 ページのみ**: `slides.md` (cover) + `pages/data-platform.md` + `pages/workflows.md` + `pages/containers.md` + `pages/summary.md`。`workers.md` / `observability.md` / `wrangler.md` / `ambient-agent.md` / `durability.md` は元 `slides.md` でコメントアウト済み = 除外。**期待スライド数 = 12**。

---

## File Structure

新規作成 (root):
- `package.json` — HonoX 用に全面書き換え (Slidev scripts/deps を除去)
- `vite.config.ts` — honox + ssg + mdx プラグイン
- `tsconfig.json` — hono/jsx 設定
- `wrangler.jsonc` — Static Assets (`./dist`) のみ、redirect Worker は廃止
- `.prettierrc` — フォーマット設定
- `app/server.ts` — HonoX サーバエントリ
- `app/client.tsx` — クライアントエントリ (空)
- `app/global.d.ts` — frontmatter 型 (`Meta`)
- `app/routes/_renderer.tsx` — `slide.css`/`slide.js` を inline 注入する jsxRenderer
- `app/routes/index.mdx` — スライド一覧トップ (`/`)
- `app/routes/cloudflare-data-platform.mdx` — 移行後の CFDP (1ファイル=1デッキ)
- `app/slide.css` — スライドスタイル (参照リポジトリから流用 + 微調整)
- `app/slide.js` — スライドエンジン (参照リポジトリから流用)
- `public/` — favicon.png / png / 描画済み svg / tweet png
- `scripts/render-excalidraw.mjs` — 図の事前描画スクリプト (一時的、Task 5 で削除)

削除 (Task 5):
- `contents/` (`cloudflare-data-platform` と `pug-at-fukuoka-2025-06-06`)
- `slidev-theme-enbu/`
- `scripts/build.js` / `build-all.js` / `picker.js`
- `src/index.js`
- `pnpm-workspace.yaml`
- `scripts/render-excalidraw.mjs` (役目終了)
- `dist/` / `dist-stale/` (再生成物)

更新 (Task 5):
- `.claude/CLAUDE.md` — アーキテクチャ記述を HonoX+MDX に
- `README.md`
- `.claude/skills/new-slide/SKILL.md` — MDX スキャフォールドに書き換え
- `.gitignore` — `dist-stale` 行削除

---

## Task 1: 図の事前描画 (Excalidraw → SVG, Tweet → PNG)

**なぜ最初か:** `contents/cloudflare-data-platform/public/*.excalidraw` のソースは Task 5 で削除する。描画はソースが存在する今のうちに行う。

**Files:**
- Create: `scripts/render-excalidraw.mjs`
- Create (出力): `public/diagrams/data-platform-main-components.svg`, `public/diagrams/cloudflare-pipelines.svg`, `public/diagrams/dbt-docs-hosting.svg`, `public/diagrams/r2-tweet.png`
- Read (入力): `contents/cloudflare-data-platform/public/data-platform-main-components.excalidraw`, `.../cloudflare-pipelines.excalidraw`, `.../dbt-docs-hosting.excalidraw`

**Interfaces:**
- Produces: 後続 Task 3 の MDX が参照する画像パス `/diagrams/data-platform-main-components.svg`, `/diagrams/cloudflare-pipelines.svg`, `/diagrams/dbt-docs-hosting.svg`, `/diagrams/r2-tweet.png`

- [ ] **Step 1: Playwright を一時 devDependency として追加**

```bash
pnpm add -D playwright@^1.49.0
pnpm exec playwright install chromium
```

- [ ] **Step 2: 描画スクリプトを作成**

`scripts/render-excalidraw.mjs`:

```js
// 一時スクリプト: .excalidraw を headless Chromium 上の
// @excalidraw/excalidraw exportToSvg でレンダリングして SVG 保存する。
// 元の <Excalidraw :darkMode="true" :background="false" /> に合わせ
// ダークモード + 透過背景で書き出す。移行後 (Task 5) に削除する。
import { chromium } from 'playwright'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const SRC = 'contents/cloudflare-data-platform/public'
const OUT = 'public/diagrams'
const jobs = [
  ['data-platform-main-components.excalidraw', 'data-platform-main-components.svg'],
  ['cloudflare-pipelines.excalidraw', 'cloudflare-pipelines.svg'],
  ['dbt-docs-hosting.excalidraw', 'dbt-docs-hosting.svg'],
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent('<!doctype html><html><body></body></html>')

for (const [inFile, outFile] of jobs) {
  const data = await readFile(`${SRC}/${inFile}`, 'utf8')
  const svg = await page.evaluate(async (raw) => {
    const mod = await import('https://esm.sh/@excalidraw/excalidraw@0.17.6')
    const scene = JSON.parse(raw)
    const el = await mod.exportToSvg({
      elements: scene.elements ?? [],
      appState: {
        ...(scene.appState ?? {}),
        exportBackground: false,
        exportWithDarkMode: true,
        exportEmbedScene: false,
      },
      files: scene.files ?? {},
    })
    return el.outerHTML
  }, data)
  await writeFile(`${OUT}/${outFile}`, svg, 'utf8')
  console.log(`wrote ${OUT}/${outFile} (${svg.length} bytes)`)
}

await browser.close()
```

- [ ] **Step 3: スクリプトを実行して 3 つの SVG を生成**

Run: `node scripts/render-excalidraw.mjs`
Expected: 標準出力に `wrote public/diagrams/data-platform-main-components.svg (...)` など 3 行。3 ファイルが生成される。

検証: `ls -la public/diagrams/*.svg` で 3 ファイルがそれぞれ 0 バイト超で存在すること。

**フォールバック (headless 描画が失敗した場合):** 各 `.excalidraw` を https://excalidraw.com で開き (左上メニュー → Open)、メニュー → Export image → SVG、Background OFF / Dark mode ON で書き出し、上記 3 つの出力パスへ手動保存する。

- [ ] **Step 4: Tweet をスクリーンショットして PNG 保存**

元スライドの `<Tweet id="1442879872154566658" />` (R2 の "4 つの R" を紹介する Cloudflare の Tweet) を画像化する。

手動手順 (確実な方法):
1. ブラウザで `https://twitter.com/i/status/1442879872154566658` を開く。
2. ツイートカード部分を切り取ってスクリーンショットを撮る。
3. `public/diagrams/r2-tweet.png` として保存する。

検証: `ls -la public/diagrams/r2-tweet.png` でファイルが 0 バイト超で存在すること。

- [ ] **Step 5: コミット**

```bash
git add scripts/render-excalidraw.mjs public/diagrams
git commit -m "feat: 移行用に Excalidraw 図を SVG・Tweet を PNG へ事前描画

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PHWiMVEovLVs483rYfSoCQ"
```

---

## Task 2: HonoX 基盤のスキャフォールド + 静的アセット移設

**なぜこの順か:** Slidev 一式はまだ削除しない (Task 5 まで `contents/` を残してアセット移設元にする)。ここで root を HonoX 化し、トップページが描画できる状態にする。

**Files:**
- Modify: `package.json` (全面書き換え)
- Create: `vite.config.ts`, `tsconfig.json`, `wrangler.jsonc` (上書き), `.prettierrc`
- Create: `app/server.ts`, `app/client.tsx`, `app/global.d.ts`, `app/routes/_renderer.tsx`, `app/routes/index.mdx`, `app/slide.css`, `app/slide.js`
- Create (アセット移設): `public/favicon.png`, `public/check-iceberg-version.png`, `public/image-processing-diagram.png`
- Modify: `.gitignore` (dist-stale 行は Task 5 で扱う、ここは変更不要)

**Interfaces:**
- Consumes: なし
- Produces:
  - `c.setRenderer((content, { frontmatter }) => Response)` — frontmatter 型は `Meta` (`{ title: string; url?: string; imageUrl?: string; slide?: boolean; theme?: 'cloudflare'|'dark'|'light' }`)
  - スライド MDX が満たすべき frontmatter キー: `title`, `slide: true`, `theme`
  - `#slides` 内に MDX 本文が入り、`slide.js` が `---`(hr) と `::right::` で分割・カラム化する規約

- [ ] **Step 1: ルート package.json を HonoX 用に書き換え**

`package.json` を以下で上書き (既存の Slidev scripts/deps を破棄):

```json
{
  "name": "slides",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "wrangler dev",
    "deploy": "$npm_execpath run build && wrangler deploy"
  },
  "dependencies": {
    "hono": "^4.12.25",
    "honox": "^0.1.56"
  },
  "devDependencies": {
    "@hono/vite-ssg": "^0.3.3",
    "@mdx-js/rollup": "^3.1.1",
    "playwright": "^1.49.0",
    "prettier": "^3.8.4",
    "rehype-slug": "^6.0.0",
    "remark-frontmatter": "^5.0.0",
    "remark-mdx-frontmatter": "^5.2.0",
    "vite": "^8.0.16",
    "wrangler": "^4.100.0"
  }
}
```

- [ ] **Step 2: pnpm-workspace.yaml を空にして単一プロジェクト化**

`pnpm-workspace.yaml` を**この時点では削除しない** (まだ `contents/*` がワークスペースに属していると `pnpm install` が古い lock と整合しないため)。代わりに中身を最小化して `contents` をワークスペースから外す:

`pnpm-workspace.yaml` を以下で上書き:

```yaml
packages: []
```

(ファイル自体の削除は Task 5。ここでは中身を空パッケージリストにして、root のみが対象になるようにする。)

- [ ] **Step 3: 依存をインストール**

Run: `pnpm install`
Expected: hono / honox / vite 等が入る。エラーなく完了。

- [ ] **Step 4: vite.config.ts を作成**

```ts
import ssg from '@hono/vite-ssg'
import mdx from '@mdx-js/rollup'
import honox from 'honox/vite'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeSlug from 'rehype-slug'
import { defineConfig } from 'vite'

const entry = './app/server.ts'

export default defineConfig(() => {
  return {
    plugins: [
      honox({
        devServer: {
          handleHotUpdate: ({ server }) => {
            server.hot.send({ type: 'full-reload' })
            return []
          }
        }
      }),
      ssg({ entry }),
      mdx({
        jsxImportSource: 'hono/jsx',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        rehypePlugins: [rehypeSlug]
      })
    ]
  }
})
```

- [ ] **Step 5: tsconfig.json を作成**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  }
}
```

- [ ] **Step 6: .prettierrc を作成**

```json
{
  "printWidth": 70,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "endOfLine": "lf"
}
```

- [ ] **Step 7: wrangler.jsonc を上書き (redirect Worker を廃止)**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "slides",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "assets": {
    "directory": "./dist"
  }
}
```

- [ ] **Step 8: app/server.ts を作成**

```ts
import { createApp } from 'honox/server'
import { showRoutes } from 'hono/dev'

const app = createApp()

showRoutes(app)

export default app
```

- [ ] **Step 9: app/client.tsx を作成 (空ファイル)**

```tsx
```

(空ファイル。HonoX のクライアントエントリとして存在させる。)

- [ ] **Step 10: app/global.d.ts を作成**

```ts
/// <reference types="vite/client" />
import {} from 'hono'

type Meta = {
  title: string
  url?: string
  imageUrl?: string
  slide?: boolean
  theme?: 'cloudflare' | 'dark' | 'light'
}

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string,
      props: { frontmatter: Meta }
    ): Response | Promise<Response>
  }
}
```

- [ ] **Step 11: app/slide.js を作成 (参照リポジトリから流用、無改変)**

```js
// Lightweight slide engine. Injected inline (see _renderer.tsx) on pages with
// `slide: true` in frontmatter. Splits the rendered body into slides and adds
// keyboard / click navigation. Plain browser JS (no build transform).
;(function () {
  var root = document.getElementById('slides')
  if (!root) return
  var nodes = Array.prototype.slice.call(root.childNodes)

  function isMeaningful(node) {
    return node.nodeType !== 3 || node.textContent.trim().length > 0
  }
  function isHr(n) {
    return n.tagName === 'HR'
  }
  function beforeHeading(n) {
    return n.tagName === 'H1' || n.tagName === 'H2'
  }
  function splitOn(test) {
    var groups = []
    var current = document.createElement('section')
    current.className = 'slide'
    function flush() {
      for (var i = 0; i < current.childNodes.length; i++) {
        if (isMeaningful(current.childNodes[i])) {
          groups.push(current)
          return
        }
      }
    }
    nodes.forEach(function (node) {
      if (node.nodeType === 1 && test(node)) {
        flush()
        current = document.createElement('section')
        current.className = 'slide'
        if (test === beforeHeading) current.appendChild(node)
      } else {
        current.appendChild(node.cloneNode(true))
      }
    })
    flush()
    return groups
  }

  var slides = splitOn(isHr)
  // Fallback: no '---' separators -> split before each H1/H2 heading
  if (slides.length < 2) slides = splitOn(beforeHeading)

  // Slidev-style columns: a `::right::` marker splits a slide into two columns.
  // A leading heading stays full-width on top (like slidev's two-cols-header).
  function isColumnMarker(n) {
    if (n.nodeType !== 1 || n.tagName !== 'P') return false
    var t = n.textContent.trim()
    return t === '::right::' || t === ':::'
  }
  function applyColumns(slide) {
    var kids = Array.prototype.slice.call(slide.childNodes)
    var markerIdx = -1
    for (var i = 0; i < kids.length; i++) {
      if (isColumnMarker(kids[i])) {
        markerIdx = i
        break
      }
    }
    if (markerIdx === -1) return
    var cols = document.createElement('div')
    cols.className = 'cols'
    var left = document.createElement('div')
    var right = document.createElement('div')
    cols.appendChild(left)
    cols.appendChild(right)
    kids.forEach(function (n, i) {
      if (i === markerIdx) return // drop the marker itself
      ;(i < markerIdx ? left : right).appendChild(n)
    })
    slide.innerHTML = ''
    // Lift a leading heading out of the left column to span the full width.
    var first = left.firstElementChild
    if (first && /^H[1-3]$/.test(first.tagName)) slide.appendChild(first)
    slide.appendChild(cols)
  }
  slides.forEach(applyColumns)

  root.innerHTML = ''
  slides.forEach(function (s) {
    root.appendChild(s)
  })

  // Add a copy button to every code block.
  Array.prototype.forEach.call(root.querySelectorAll('pre'), function (pre) {
    var code = pre.querySelector('code') || pre
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'copy-btn'
    btn.textContent = 'Copy'
    btn.addEventListener('click', function () {
      var text = code.innerText
      var done = function () {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(function () {
          btn.textContent = 'Copy'
          btn.classList.remove('copied')
        }, 1200)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done)
      } else {
        var ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
        } catch (e) {}
        document.body.removeChild(ta)
        done()
      }
    })
    pre.appendChild(btn)
  })

  var idx = 0
  var counter = document.getElementById('counter')
  var progress = document.getElementById('progress')

  function render() {
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === idx)
    })
    counter.textContent = idx + 1 + ' / ' + slides.length
    progress.style.width = ((idx + 1) / slides.length) * 100 + '%'
    var active = slides[idx]
    if (active) active.scrollTop = 0
  }
  function clamp(n) {
    return Math.max(0, Math.min(slides.length - 1, n))
  }
  // Push a history entry so the browser back/forward buttons move between slides.
  function go(n) {
    var next = clamp(n)
    if (next === idx) return
    idx = next
    render()
    history.pushState(null, '', '#' + (idx + 1))
  }
  window.addEventListener('popstate', function () {
    var h = parseInt((location.hash || '').replace('#', ''), 10)
    idx = h ? clamp(h - 1) : 0
    render()
  })

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (
      ['ArrowRight', 'ArrowDown', ' ', 'PageDown'].indexOf(e.key) > -1
    ) {
      go(idx + 1)
      e.preventDefault()
    } else if (
      ['ArrowLeft', 'ArrowUp', 'PageUp'].indexOf(e.key) > -1
    ) {
      go(idx - 1)
      e.preventDefault()
    } else if (e.key === 'Home') {
      go(0)
    } else if (e.key === 'End') {
      go(slides.length - 1)
    } else if (e.key === 'f') {
      if (!document.fullscreenElement)
        document.documentElement.requestFullscreen()
      else document.exitFullscreen()
    }
  })

  // Touch swipe navigation for mobile (horizontal flick only, so vertical
  // scrolling of tall slides is unaffected).
  var touchX = null
  var touchY = null
  root.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches.length !== 1) {
        touchX = null
        return
      }
      touchX = e.touches[0].clientX
      touchY = e.touches[0].clientY
    },
    { passive: true }
  )
  root.addEventListener(
    'touchend',
    function (e) {
      if (touchX === null) return
      var t = e.changedTouches[0]
      var dx = t.clientX - touchX
      var dy = t.clientY - touchY
      touchX = null
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(dx < 0 ? idx + 1 : idx - 1)
      }
    },
    { passive: true }
  )

  var h = parseInt((location.hash || '').replace('#', ''), 10)
  if (h) idx = clamp(h - 1)
  render()
  history.replaceState(null, '', '#' + (idx + 1))
  if (window.hljs) window.hljs.highlightAll()
})()
```

- [ ] **Step 12: app/slide.css を作成 (参照リポジトリ流用 + `.agent-example` 追記)**

参照リポジトリの `slide.css` をそのまま使い、末尾にコード密度の高いスライド用の小さめフォント規則だけ追記する。

```css
:root {
  --slide-bg: #1a1a1a;
  --slide-fg: #f2f2f2;
  --slide-accent: #f6821f;
  --slide-muted: #8a8a8a;
  --slide-code-bg: #0d0d0d;
  --slide-border: rgba(255, 255, 255, 0.12);
  --slide-font: 'Inter', system-ui, -apple-system, sans-serif;
}
body[data-theme='cloudflare'] {
  --slide-bg: #ffffff;
  --slide-fg: #313131;
  --slide-accent: #f6821f;
  --slide-muted: #7a7a7a;
  --slide-code-bg: #1d1f21;
  --slide-border: rgba(246, 130, 31, 0.35);
}
body[data-theme='light'] {
  --slide-bg: #fafafa;
  --slide-fg: #1f1f1f;
  --slide-accent: #f6821f;
  --slide-muted: #777;
  --slide-code-bg: #f0f0f0;
  --slide-border: rgba(0, 0, 0, 0.12);
}
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}
body {
  background: var(--slide-bg);
  color: var(--slide-fg);
  font-family: var(--slide-font);
  overflow: hidden;
}
body[data-theme='cloudflare'] {
  background:
    radial-gradient(
      120% 120% at 100% 0%,
      rgba(246, 130, 31, 0.12) 0%,
      transparent 42%
    ),
    var(--slide-bg);
}
#deck {
  position: fixed;
  inset: 0;
}
.slide {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  justify-content: center;
  padding: 6vh 9vw;
  box-sizing: border-box;
  overflow: auto;
}
.slide.active {
  display: flex;
  animation: slide-in 0.25s ease;
}
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.slide > :first-child {
  margin-top: 0;
}
.slide h1 {
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  color: var(--slide-accent);
  line-height: 1.15;
  margin: 0 0 1.5rem;
  border: none;
}
.slide h2 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  color: var(--slide-accent);
  line-height: 1.2;
  margin: 0 0 1.2rem;
  border: none;
}
.slide h3 {
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  margin: 0 0 1rem;
}
.slide p,
.slide li {
  font-size: clamp(1.1rem, 2.2vw, 1.5rem);
  line-height: 1.6;
}
.slide ul,
.slide ol {
  padding-left: 1.4em;
}
.slide li {
  margin: 0.35em 0;
}
.slide a {
  color: var(--slide-accent);
}
.slide img {
  max-height: 58vh;
  max-width: 100%;
  object-fit: contain;
  display: block;
  margin: 1rem auto;
  border-radius: 6px;
}
/* Two-column layout: <div class="cols"> ... </div> */
.slide .cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4vw;
  align-items: center;
  width: 100%;
}
.slide .cols.left-wide {
  grid-template-columns: 1.4fr 1fr;
}
.slide .cols.right-wide {
  grid-template-columns: 1fr 1.4fr;
}
.slide .cols > * > :first-child {
  margin-top: 0;
}
.slide .cols img {
  margin: 0 auto;
  max-height: 70vh;
}
@media (max-width: 768px) {
  .slide .cols {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
.slide blockquote {
  border-left: 4px solid var(--slide-accent);
  margin: 0 0 1rem;
  padding: 0.2rem 0 0.2rem 1.2rem;
  color: var(--slide-muted);
}
.slide pre {
  position: relative;
  font-size: clamp(0.7rem, 1.2vw, 0.9rem);
  background: var(--slide-code-bg);
  border: 1px solid var(--slide-border);
  padding: 1.2rem 1.5rem;
  border-radius: 10px;
  overflow: auto;
  max-height: 64vh;
  line-height: 1.5;
}
.slide :not(pre) > code {
  background: rgba(127, 127, 127, 0.18);
  color: var(--slide-fg);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}
/* Dense code slides: shrink code so left/right columns fit without scroll. */
.slide .cols pre {
  font-size: clamp(0.6rem, 1vw, 0.78rem);
  line-height: 1.4;
}
.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0.25em 0.7em;
  font: inherit;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #ddd;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    background 0.15s ease;
}
.slide pre:hover .copy-btn,
.copy-btn:focus-visible {
  opacity: 1;
}
.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.copy-btn.copied {
  color: #fff;
  background: var(--slide-accent);
  border-color: var(--slide-accent);
  opacity: 1;
}
#progress {
  position: fixed;
  bottom: 0;
  left: 0;
  height: 4px;
  width: 0;
  background: var(--slide-accent);
  transition: width 0.2s ease;
  z-index: 10;
}
#counter {
  position: fixed;
  bottom: 12px;
  right: 18px;
  font-size: 0.9rem;
  color: var(--slide-muted);
  font-variant-numeric: tabular-nums;
  z-index: 10;
}
#hint {
  position: fixed;
  bottom: 12px;
  left: 18px;
  font-size: 0.8rem;
  color: var(--slide-muted);
  opacity: 0.6;
  z-index: 10;
}
```

- [ ] **Step 13: app/routes/_renderer.tsx を作成**

参照実装ベース。favicon を `/favicon.png` に、twitter:creator を `@ta93abe` に、非スライド (index) のフッターを汎用化、デフォルトテーマを `dark` にする。

```tsx
import { createMiddleware } from 'hono/factory'
import { html, raw } from 'hono/html'
import slideStyle from '../slide.css?raw'
import slideScript from '../slide.js?raw'

export const rendererMiddleware = createMiddleware(async (c, next) => {
  c.setRenderer((content, { frontmatter }) => {
    const head = frontmatter ?? ({ title: '' } as typeof frontmatter)
    const isSlide = !!head.slide
    const theme = head.theme ?? 'dark'

    const meta = (
      <>
        <meta charset='utf-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0'
        />
        <link rel='shortcut icon' href='/favicon.png' />
        <link rel='stylesheet' href='https://fonts.xz.style/serve/inter.css' />
        <link
          rel='stylesheet'
          href='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css'
        />
        <title>{head.title}</title>
        <meta property='og:title' content={head.title} />
        {head.url ? <meta property='og:url' content={head.url} /> : <></>}
        {head.imageUrl ? (
          <meta property='og:image' content={head.imageUrl} />
        ) : (
          <></>
        )}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:creator' content='@ta93abe' />
        {head.imageUrl ? (
          <meta name='twitter:image:src' content={head.imageUrl} />
        ) : (
          <></>
        )}
      </>
    )

    if (isSlide) {
      return c.html(
        <html color-mode='dark'>
          <head>
            {meta}
            {html`<style>${raw(slideStyle)}</style>`}
          </head>
          <body data-theme={theme}>
            <div id='deck'>
              <div id='slides'>{content}</div>
            </div>
            <div id='progress'></div>
            <div id='counter'></div>
            <div id='hint'>← → / space ・ f: fullscreen</div>
            <script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js'></script>
            <script>{raw(slideScript)}</script>
          </body>
        </html>
      )
    }

    return c.html(
      <html color-mode='dark'>
        <head>
          {meta}
          <link
            rel='stylesheet'
            href='https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css'
          />
          <link rel='stylesheet' href='https://newcss.net/theme/night.css' />
        </head>
        <body>
          <main>
            <div>{content}</div>
          </main>
          <br />
          <hr />
          <footer>
            <address>
              &copy; ta93abe{' '}
              <a href='https://github.com/ta93abe'>
                https://github.com/ta93abe
              </a>
            </address>
          </footer>
        </body>
        <script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js'></script>
        <script>{raw('hljs.highlightAll()')}</script>
      </html>
    )
  })
  await next()
})

export default rendererMiddleware
```

- [ ] **Step 14: app/routes/index.mdx を作成 (スライド一覧トップ)**

```mdx
---
title: 'ta93abe slides'
---

# ta93abe slides

## Decks

- [Cloudflare で始める Data Platform](/cloudflare-data-platform)
```

- [ ] **Step 15: 静的アセットを public/ へ移設**

```bash
mkdir -p public
cp contents/cloudflare-data-platform/public/favicon.png public/favicon.png
cp contents/cloudflare-data-platform/public/check-iceberg-version.png public/check-iceberg-version.png
cp contents/cloudflare-data-platform/public/image-processing-diagram.png public/image-processing-diagram.png
```

検証: `ls public/` に `favicon.png check-iceberg-version.png image-processing-diagram.png diagrams/` が並ぶ (diagrams は Task 1 で作成済み)。

- [ ] **Step 16: dev サーバ起動でトップが描画されることを確認**

Run: `pnpm dev`
Expected: Vite が起動。ブラウザ (または Playwright) で `http://localhost:5173/` を開くと「ta93abe slides」見出しと Data Platform へのリンクが表示される。確認後サーバを停止。

- [ ] **Step 17: ビルドが通ることを確認**

Run: `pnpm build`
Expected: `dist/` が生成され、`dist/index.html` が存在する。エラーなく完了。

検証: `test -f dist/index.html && echo OK`

- [ ] **Step 18: コミット**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml vite.config.ts tsconfig.json wrangler.jsonc .prettierrc app public
git commit -m "feat: HonoX + MDX スライド基盤をスキャフォールド

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PHWiMVEovLVs483rYfSoCQ"
```

---

## Task 3: cloudflare-data-platform を 1 枚の MDX に移植

**Files:**
- Create: `app/routes/cloudflare-data-platform.mdx`
- Read (参照のみ): `contents/cloudflare-data-platform/slides.md` と `pages/{data-platform,workflows,containers,summary}.md`

**Interfaces:**
- Consumes: Task 2 の renderer 規約 (`slide: true` / `theme` / `---` 区切り / `::right::` カラム)、Task 1 の画像 (`/diagrams/*.svg`, `/diagrams/r2-tweet.png`)、Task 2 の画像 (`/check-iceberg-version.png`, `/image-processing-diagram.png`)
- Produces: `/cloudflare-data-platform` で配信される 12 スライドのデッキ

**移植ルール (元 Slidev 機能 → MDX):**
- 各 `pages/*.md` の `layout:` フロントマターは破棄 (cover/section/center/two-cols-header はすべて既定スライドにフォールバック。`slide.css` が縦中央寄せするので体裁は保たれる)。
- `::left::` 行は**削除**する (エンジンは `::right::` のみ認識。見出しは全幅に持ち上がり、`::right::` 前が左カラム・後が右カラムになる)。`::right::` は残す。
- `<Excalidraw drawFilePath="./X.excalidraw" .../>` → `![alt](/diagrams/X.svg)`。
- `<Tweet id="1442879872154566658" />` → `![R2 — the 4 R's (tweet)](/diagrams/r2-tweet.png)`。
- `<img src="/X.png" class="...(tailwind)..." />` → `![alt](/X.png)` (Tailwind クラスは破棄、`slide.css` の `.slide img` に委譲)。
- ラッパ `<div class="p-4|scale-80|text-xs|my-16|agent-example">` は削除 (Tailwind 無し)。
- コードフェンスの click 注釈 ` ```ts {all|3-6|...} ` → ` ```ts ` (highlight.js は行フォーカス非対応)。
- `$clicks` を使う `<ol class="ml-4"><li><span :class=...>` の Vue バインディングは**静的な番号付きリスト**に変換 (opacity 段階表示は破棄)。
- Slidev `<style>` ブロックは破棄 (必要分は `slide.css` の `.slide .cols pre` に集約済み)。
- スピーカーノート `<!-- ... -->` → `{/* ... */}` に変換して各スライド末尾に保持。

- [ ] **Step 1: cloudflare-data-platform.mdx を作成**

`app/routes/cloudflare-data-platform.mdx` を以下の全文で作成する:

````mdx
---
title: 'Cloudflare で始める Data Platform'
slide: true
theme: dark
---

# Cloudflare で始める<br />Data Platform

## 阿部拓海

{/*
はじめまして、阿部拓海です。
今日は「Cloudflare で始める Data Platform」というタイトルで、10 分お時間いただきます。
Cloudflare のサービスを組み合わせて、データ基盤を実際にどう作るか。
基礎から観測・統制までを駆け足で通します。
*/}

---

# Cloudflare とは

## CDN？エッジコンピューティング？

{/*
Cloudflare と聞くと、CDNの会社でしょという認識がまずあります。
近年ではエッジコンピューティングを始め開発者のためのプラットフォームになってきています。
*/}

---

# Cloudflare Data Platform

Cloudflare の **Cloudflare Data Platform** は、入れる/貯める/使うを 1 つのプラットフォームで提供します。<br />([Announcing the Cloudflare Data Platform: ingest, store, and query your data directly on Cloudflare](https://blog.cloudflare.com/cloudflare-data-platform/))

![Cloudflare Data Platform main components](/diagrams/data-platform-main-components.svg)

{/*
そんな中で Cloudflare Data Platform は、2025 年 9 月の Birthday Week で発表された比較的新しいプラットフォームです。

構成は Pipelines・R2 Data Catalog・R2 SQL の 3 つ。
データレイクの「入れる・貯める・使う」を、Cloudflare 1 社で完結させる、という宣言ですね。
データ層への本格進出の転換点と捉えています。

補足として、2025 年 12 月に Cloudflare for Government が ISMAP に登録されました。
「Cloudflare はエンプラ・公共系で使いにくい」と言われがちな状況も、ここで変わり始めています。
組織アカウントが最近出たりして、ようやくというところもあります。https://blog.cloudflare.com/ja-jp/organizations-beta/
*/}

---

# [Pipelines](https://developers.cloudflare.com/pipelines/)

```bash
wrangler pipelines setup
```

- 2025年4月に買収した [Arroyo](https://www.arroyo.dev/) をベースとしたストリーミングインジェストサービスです。
- [**Streams**](https://developers.cloudflare.com/pipelines/streams/) で HTTP / Workers Binding / Logpush からデータを受けます。
- [**Pipelines**](https://developers.cloudflare.com/pipelines/pipelines/) で SQL 変換を行えます。
- [**Sinks**](https://developers.cloudflare.com/pipelines/sinks/) で `--roll-size` or `--roll-interval` で設定した粒度で自動バッチ化し、R2 / R2 Data Catalog に書き出せます。

![Cloudflare Pipelines](/diagrams/cloudflare-pipelines.svg)

{/*
Pipelines はストリーミングインジェストサービスです。

構成は 3 段です。
Streams が HTTP / Workers Binding / Logpush などのソースから受け取り、
Pipelines で SQL 変換、
Sinks でロールサイズかインターバルでバッチ化して R2 / R2 Data Catalog に書き出す。

ベースは 2025 年 4 月に買収した Arroyo です。
スペイン語で「小川」「細い水路」という意味の、Apache Flink 相当のストリーム処理エンジンですね。
SQL は Apache DataFusion ベースです。
*/}

---

# [R2](https://developers.cloudflare.com/r2/)

```bash
wrangler r2 bucket create <bucket-name>
```

- **Really Requestable**: エグレスコストがゼロ。Standard tier 同士で比較するとストレージ・Class A (write)・Class B (read) も他のプロバイダーより安価。
- **Repositioning Records**: S3 互換 API を提供していて、既存のツールや SDK がそのまま使える。
- **Ridiculously Reliable**: 99.999999999% (イレブンナイン) の耐久性、99.9% の可用性。
- **Radically Reprogrammable**: Workers Binding 統合。

::right::

![R2 — the 4 R's (tweet)](/diagrams/r2-tweet.png)

{/*
R2 はデータ基盤の置き場所です。Parquet も Iceberg も全部ここに入ります。

ポイントは 4 つ。
エグレスコストがゼロ、S3 互換 API、イレブンナインの耐久性、そして Workers Binding 統合。

一番大きいのはやはりエグレス無料です。
マルチクラウドのデータ集約ハブとして R2 を使うのが現実解になります。
*/}

---

# [R2 Data Catalog](https://developers.cloudflare.com/r2/data-catalog/)

データを **構造化する** レイヤーです。R2 上の Apache Iceberg テーブルをマネージドで管理します。

```bash
wrangler r2 bucket catalog enable <bucket-name>
```

- Trino / DuckDB / PyIceberg / Snowflake / Spark / StarRocks などのクライアントから直接クエリ可能
- ACID / Schema evolution / Time travel などの Iceberg らしい機能はもちろん対応している。
- テーブルメンテナンス
  - **Compaction**: `--target-size` で指定したサイズに合わせて Parquet ファイルを集約
  - **Snapshot expiration**: `--older-than-days` で古いスナップショットを削除、`--retain-last` で最低限残す数を指定

::right::

![iceberg_table_format_version=2](/check-iceberg-version.png)

{/*
R2 上の Apache Iceberg テーブルをマネージドで管理してくれるレイヤーです。

Iceberg REST Catalog API 準拠なので、
Trino / DuckDB / PyIceberg / Snowflake / Spark / StarRocks など、好きなクライアントから直接クエリできます。
ベンダーロックインなし。

ACID / Schema evolution / Time travel といった Iceberg v2 の機能はそのまま使えて、
Compaction や Snapshot expiration といったテーブルメンテナンスもマネージドで提供されます。
*/}

---

# [R2 SQL](https://developers.cloudflare.com/r2-sql/)

R2 Data Catalog の Iceberg テーブルに標準 SQL を実行できる、Cloudflare ネイティブの分散クエリエンジンです。[Apache DataFusion](https://github.com/apache/datafusion) をベースにしています。

基本的な演算はできますが、JOIN や WINDOW 関数はまだ対応していません。ベータ版で開発真っ只中。

実行方法は [**Wrangler**](https://developers.cloudflare.com/workers/wrangler/) と [**HTTP API**](https://developers.cloudflare.com/r2-sql/query-data/#query-via-api) の 2 つがあります。管理画面などに Web SQL エディターはありません。

```bash
wrangler r2 sql query "$WAREHOUSE" \
  "SELECT user_id, COUNT(*) AS n FROM default.events
   WHERE __ingest_ts > '2026-05-01' GROUP BY user_id LIMIT 10"
```

```bash
curl -X POST \
  "https://api.sql.cloudflarestorage.com/api/v1/accounts/{ACCOUNT_ID}/r2-sql/query/{BUCKET_NAME}" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT user_id, COUNT(*) AS n FROM default.events WHERE __ingest_ts > '"'"'2026-05-01'"'"' GROUP BY user_id LIMIT 10"}'
```

{/*
R2 Data Catalog の Iceberg テーブルに標準 SQL を投げられる、Cloudflare ネイティブの分散クエリエンジンです。Athenaみたいなもの。
Apache DataFusion ベースで、R2 オブジェクトストレージと同じ Cloudflare のインフラ層の分散コンピュート上で実行されます。

Wrangler か HTTP API から実行できます。

今は JOIN や WINDOW 関数はまだですが、
基本的なフィルタ・集約・GROUP BY は通ります。
ベータでアクティブに機能追加中、というステータスです。
MySQL が 8.0 になって Window関数が使えるようになったあのときの気持ちをもう一度リアルタイムで味わいましょう。
*/}

---

# [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)

Cloudflare Workflows は耐久性のある実行エンジンです。ステップを連鎖させ、失敗時には自動で再試行し、長期間実行されるプロセス全体で状態を保持します。各 step には Workers Bindings を組み込めます。

```typescript
export class ImageProcessingWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent, step: WorkflowStep) {
    const imageData = await step.do('fetch image', async () => {
      const object = await this.env.BUCKET.get(event.params.imageKey);
      return await object.arrayBuffer();
    });

    const description = await step.do('generate description', async () => {
      const imageArray = Array.from(new Uint8Array(imageData));
      return await this.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
        image: imageArray,
        prompt: 'Describe this image in one sentence',
        max_tokens: 50,
      });
    });

    await step.waitForEvent('await approval', {
      type: 'approved',
      timeout: '24 hours',
    });

    await step.do('publish', async () => {
      await this.env.BUCKET.put(`public/${event.params.imageKey}`, imageData);
    });
  }
}
```

::right::

1. R2 から画像を取得
2. LLaVA で 1 文の説明を生成
3. `approved` イベントを最大 24h 待機
4. R2 へ publish (公開ディレクトリ)

{/*
Cloudflare Workflows は耐久性のある実行エンジンです。
ステップを連鎖させて、失敗時は自動でリトライ、長時間プロセスの状態を永続化します。
Temporal.io が類似サービス。

右のコードは画像処理ワークフローの例です。
R2 から画像を取得、
Workers AI の LLaVA (ラーバ)で説明文を生成、
approved イベントを最大 24h 待機 (durable に pause)、
承認されたら公開ディレクトリに publish。

各ステップで Workers Binding がそのまま使えるのが Cloudflare ならではの強みです。
*/}

---

## Python SDK

`WorkflowEntrypoint` を Python で継承します。**関数パラメータ名で依存を暗黙解決** する DAG 表現が特徴です。引数名による暗黙的依存解決で DAG が宣言的に書けます。

```python
from workers import WorkflowEntrypoint

class IngestWorkflow(WorkflowEntrypoint):
    async def run(self, event, step):
        @step.do()
        async def fetch_a():
            return await get_a()

        @step.do()
        async def fetch_b():
            return await get_b()

        @step.do(concurrent=True)
        async def merge(fetch_a, fetch_b):   # 引数名で依存
            return combine(fetch_a, fetch_b)

        await merge()
```

::right::

1. `fetch_a` を `@step.do()` で定義
2. `fetch_b` を独立した step として定義
3. `merge` を `concurrent=True` + 引数名 `fetch_a` / `fetch_b` で依存宣言
4. `await merge()` 実行 — 依存先が並列起動

{/*
2025 年 8 月から Beta で、同じ Workflows を Python で書けます。

特徴的なのは DAG の表現方法です。
merge 関数の引数名が fetch_a で、定義済みステップと同名なら、
それが完了してから merge が実行される、という風に
引数名で依存を暗黙解決します。

concurrent=True を付ければ、diamond shaped DAG が宣言的に書けます。
Python の ML / data 系処理と相性がいい設計です。
*/}

---

# [ビジュアライザ](https://developers.cloudflare.com/workflows/build/visualizer/)

Cloudflare ダッシュボードが Workflow コードを parse し、**step / 並列 / 条件分岐 / ループのフロー図** を自動生成します。

- ループ / nested logic を **折りたたみ ↔ 展開** で切替
- 並列ステップ / 条件分岐も自動レイアウト
- TypeScript Workflows で利用可能 (Python は未対応)

実例: 右図は一つ前のスライドの画像に説明文を付与するコード例をちょっと複雑にしたものです。

[How we use Abstract Syntax Trees (ASTs) to turn Workflows code into visual diagrams](https://blog.cloudflare.com/ja-jp/workflow-diagrams/)

::right::

![Image Processing Workflow visualizer](/image-processing-diagram.png)

{/*
2026 年 2 月にリリースされた機能です。
Workflow コードをダッシュボードがパースして、
step・並列・条件分岐・ループのフロー図を自動描画してくれます。

右図は前スライドの画像処理ワークフローをちょっと複雑にした例で、
画像取得 → AI による説明生成 → 承認 → 公開のフローが可視化されています。
Airflow の DAG View に相当します。
*/}

---

# [Cloudflare Containers](https://developers.cloudflare.com/containers/)

Cloudflare Workers では **128 MB** の実行メモリ制限や CPU時間制限があります。

そこで Cloudflare Containers を使えば、この制約を突破できます。例えば dbt の実行を行えます。バッチデータインジェストがしたいなら dlt を使うと良いでしょう。

Cloudflare で完結させるメリットは次のとおりです。

- dbt artifacts を **R2 に Binding 経由**で永続化 (`env.BUCKET.put('*.json', body)`)
- Workers が R2 Binding 経由で dbt docs を配信
- Cloudflare Access で社内限定配信
- [Workers Observability](https://developers.cloudflare.com/workers/observability/) でログを一元管理

::right::

![dbt docs hosting on Cloudflare](/diagrams/dbt-docs-hosting.svg)

{/*
Workers には 128 MB のメモリ制限があります。
これを超える処理を走らせたい時に Containers です。

例えば dbt の実行環境を Dockerfile で定義して、Linux microVM 上で動かす。
idle 時は sleepAfter で課金ゼロです。

Cloudflare 完結のメリットは、
アーティファクトを R2 に Binding で永続化、
Workers が R2 Binding 経由で dbt docs を配信、
secrets が wrangler.jsonc に集約、
Workers Observability でログを横断、といったあたりです。
*/}

---

# まとめ

- まずは [cloudflare.com](https://cloudflare.com) にたどり着きましょう。
- 無事たどり着いて管理画面に入ったら **Agent Lee** が迎えてくれます。
- こんな Cloudflare の始め方もあります。
  - ドメインを購入する or 移管してくる。
  - 個人のサイト/ブログを Workers Static Assets でホスティングしてみる。
  - [R2 Data Catalog は Iceberg を始めるには結構お手軽です。](https://developers.cloudflare.com/r2/data-catalog/get-started/)
  - AI エージェントを実装してみる。 [Agent](https://developers.cloudflare.com/agents/) / [Workers AI](https://developers.cloudflare.com/workers-ai/) / [AI Gateway](https://developers.cloudflare.com/ai-gateway/) / [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/) / [Sandbox](https://developers.cloudflare.com/sandbox/) / [AI Search](https://developers.cloudflare.com/ai-search/) / [Browser Run](https://developers.cloudflare.com/browser-rendering/) / [Durable Objects](https://developers.cloudflare.com/durable-objects/)

{/*
まとめに入ります。今日の内容で、まず手を動かすなら。
最初の一歩は cloudflare.com にたどり着くことです。管理画面に入ると Agent Lee が出迎えてくれます。
Workers Paid は 5 USD/month です。個人開発のおもちゃとしては十分すぎる。
こんな始め方もあります。ドメインを購入する、個人サイトやブログを Workers Static Assets でホスティングする、R2 Data Catalog で Iceberg を始めてみる、など。AI エージェントを実装してみる。
各 primitive は Cloudflare 公式 blog で明示された課題を解くために生まれている。
次回登壇する機会があれば、商用環境でのユースケースが聞けると嬉しいです。
ご清聴ありがとうございました。
*/}
````

> **注記 (R2 SQL の curl コード):** 元 `slides.md` の `-d {"query": ...}` は引用符が壊れていたため、シェルとして正しい single-quote ヒアストリングに直してある (意味は同一)。

- [ ] **Step 2: dev サーバでスライドが描画されることを確認**

Run: `pnpm dev`
Expected: `http://localhost:5173/cloudflare-data-platform` を開くとダークテーマのスライド (タイトル「Cloudflare で始める Data Platform」) が表示され、`→` キーで送れる。

- [ ] **Step 3: スライド数が 12 であることを Playwright で検証**

dev サーバを起動したまま、以下を実行 (一時スクリプト `/tmp/count-slides.mjs`):

```js
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('http://localhost:5173/cloudflare-data-platform', { waitUntil: 'networkidle' })
const n = await page.$$eval('#slides .slide', (els) => els.length)
console.log('slide count =', n)
await browser.close()
```

Run: `node /tmp/count-slides.mjs`
Expected: `slide count = 12`

12 でなければ MDX の `---` 区切り位置を見直す (frontmatter の `---` ペアはスライド分割に含まれない)。

- [ ] **Step 4: 2 カラム・画像・コードを目視確認**

Playwright で各カラムスライド (R2 / R2 Data Catalog / Workflows / Python SDK / ビジュアライザ / Containers) のスクリーンショットを撮り、左右カラムが崩れず画像 (svg/png) が表示され、コードがハイライトされていること、リンク切れ画像が無いことを確認する。

```js
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
for (let i = 1; i <= 12; i++) {
  await page.goto(`http://localhost:5173/cloudflare-data-platform#${i}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `/tmp/cfdp-${String(i).padStart(2, '0')}.png` })
}
await browser.close()
```

Run: `node /tmp/screenshot-slides.mjs` し、`/tmp/cfdp-*.png` を確認。確認後 dev サーバ停止。

- [ ] **Step 5: 本番ビルドが通ることを確認**

Run: `pnpm build`
Expected: エラーなく `dist/cloudflare-data-platform/index.html` が生成される。

検証: `test -f dist/cloudflare-data-platform/index.html && echo OK`

- [ ] **Step 6: コミット**

```bash
git add app/routes/cloudflare-data-platform.mdx
git commit -m "feat: cloudflare-data-platform を 1 枚の MDX に移植

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PHWiMVEovLVs483rYfSoCQ"
```

---

## Task 4: Slidev 基盤の全廃

**なぜこの順か:** Task 1〜3 で必要なアセット・図・コンテンツを `contents/` から取り出し終えている。ここで安全に削除できる。

**Files:**
- Delete: `contents/` (配下の `cloudflare-data-platform/` と `pug-at-fukuoka-2025-06-06/`)
- Delete: `slidev-theme-enbu/`
- Delete: `scripts/build.js`, `scripts/build-all.js`, `scripts/picker.js`
- Delete: `src/index.js` (および空になる `src/`)
- Delete: `pnpm-workspace.yaml`
- Delete: `dist/`, `dist-stale/` (再生成物)

- [ ] **Step 1: 削除対象を確認 (移行に使ったものが public/ にコピー済みか)**

```bash
ls public/favicon.png public/check-iceberg-version.png public/image-processing-diagram.png public/diagrams/data-platform-main-components.svg public/diagrams/cloudflare-pipelines.svg public/diagrams/dbt-docs-hosting.svg public/diagrams/r2-tweet.png
```

Expected: 7 ファイルすべて存在 (存在しなければ Task 1/2 へ戻る)。

- [ ] **Step 2: Slidev 一式を削除**

```bash
git rm -r contents slidev-theme-enbu scripts/build.js scripts/build-all.js scripts/picker.js src/index.js pnpm-workspace.yaml
rm -rf dist dist-stale
```

(`scripts/render-excalidraw.mjs` は Task 5 で削除。`src/` が空なら `rmdir src`。`scripts/` には render スクリプトが残るので残置。)

- [ ] **Step 3: 再インストールでワークスペース参照が消えることを確認**

Run: `pnpm install`
Expected: `slidev-theme-enbu` / `contents/*` への workspace 参照が無くなり、エラーなく完了。

- [ ] **Step 4: ビルドが通ることを確認**

Run: `pnpm build`
Expected: `dist/index.html` と `dist/cloudflare-data-platform/index.html` が生成される。エラー無し。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "chore: Slidev 基盤 (workspace / theme / scripts / redirect Worker) を全廃

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PHWiMVEovLVs483rYfSoCQ"
```

---

## Task 5: ドキュメント・スキル・一時ファイルの整理

**Files:**
- Modify: `.claude/CLAUDE.md`
- Modify: `README.md`
- Modify: `.claude/skills/new-slide/SKILL.md`
- Modify: `.gitignore`
- Delete: `scripts/render-excalidraw.mjs` (+ 空になる `scripts/`)
- Delete: 一時 devDependency `playwright`

- [ ] **Step 1: 一時的な図描画スクリプトと playwright 依存を削除**

```bash
git rm scripts/render-excalidraw.mjs
rmdir scripts 2>/dev/null || true
pnpm remove playwright
```

(`pnpm remove` が `package.json` から playwright を外し lock を更新する。)

- [ ] **Step 2: .gitignore を更新 (dist-stale 行を削除)**

`.gitignore` の `dist-stale` 行を削除する。最終形:

```
node_modules
.DS_Store
dist
.wrangler
*.local
.agents
.cortex
```

- [ ] **Step 3: .claude/CLAUDE.md を HonoX+MDX 構成に書き換え**

`.claude/CLAUDE.md` を以下で上書き:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

HonoX + MDX で作るスライドサイト。`app/routes/*.mdx` を 1 枚置けば 1 スライドデッキになる。MDX は `@mdx-js/rollup` で JSX にコンパイルされ Hono が SSR、`@hono/vite-ssg` がビルド時に静的 HTML を生成し、Cloudflare Workers (Static Assets) で配信する。

## コマンド

```bash
pnpm dev       # Vite dev サーバ
pnpm build     # 静的 HTML を dist/ に生成
pnpm preview   # wrangler dev でローカル配信
pnpm deploy    # build して wrangler deploy
```

## アーキテクチャ

```
/
├── app/
│   ├── routes/
│   │   ├── _renderer.tsx                  # slide.css / slide.js を inline 注入する renderer
│   │   ├── index.mdx                      # スライド一覧トップ (/)
│   │   └── <deck-name>.mdx                # 1 ファイル = 1 デッキ
│   ├── slide.css                          # スライドスタイル
│   ├── slide.js                           # ---分割 / カラム / ページ送り / コピーボタン
│   ├── server.ts                          # HonoX サーバエントリ
│   ├── client.tsx                         # HonoX クライアントエントリ
│   └── global.d.ts                        # frontmatter 型
├── public/                                # 画像・favicon・図 (svg/png)
├── vite.config.ts
├── wrangler.jsonc                          # Cloudflare Workers (Static Assets)
└── package.json
```

### スライドの書き方

- frontmatter に `slide: true` を付けるとスライドモードになる。`theme` は `dark` (既定) / `cloudflare` / `light`。
- `---` (水平線) でスライドを分割する。
- `::right::` で 2 カラムにする (先頭見出しは全幅、`::right::` の前が左・後が右カラム)。
- コードハイライトは highlight.js を CDN ロード。
- スピーカーノートは `{/* ... */}` (MDX コメント) で本文に残せる (実行時 DOM には出ない)。
- 図 (Excalidraw 等) は事前に SVG/PNG 化して `public/` に置き、`![alt](/path)` で埋め込む。

### ルーティング / トップ

`app/routes/index.mdx` がトップ (`/`)。デッキ一覧を置く。

### デプロイ

`pnpm deploy` で `vite build` → `wrangler deploy`。`wrangler.jsonc` の `assets.directory` は `./dist`。

## ナレッジソース

- **Obsidian Vault**: `~/zettelkasten` — スライド作成時にノートを参照し、内容の素材として活用する

## 技術スタック

- **HonoX / Hono**: ファイルベースルーティング + SSR
- **MDX**: `@mdx-js/rollup`
- **Vite + @hono/vite-ssg**: 静的 HTML 生成
- **Cloudflare Workers**: Static Assets
- **pnpm** / **Node.js 20+**
```

- [ ] **Step 4: README.md を更新**

`README.md` を以下で上書き:

```markdown
# slides

HonoX + MDX で作るスライドサイト。`app/routes/*.mdx` を 1 枚置けば 1 スライドデッキになる。

## 開発

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # dist/ に静的 HTML を生成
pnpm deploy    # Cloudflare Workers へデプロイ
```

## 新しいスライドを作る

`app/routes/<deck-name>.mdx` を作成し、frontmatter に `slide: true` を付ける。`---` で分割、`::right::` で 2 カラム。詳細は `.claude/CLAUDE.md` を参照。
```

- [ ] **Step 5: new-slide スキルを MDX スキャフォールドに書き換え**

`.claude/skills/new-slide/SKILL.md` を以下で上書き:

```markdown
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
```

- [ ] **Step 6: 残存する Slidev 参照が無いか確認**

Run: `grep -ri "slidev" . --include='*.md' --include='*.json' --include='*.jsonc' --include='*.yaml' -l 2>/dev/null | grep -v node_modules | grep -v docs/superpowers`
Expected: 何も出力されない (docs/superpowers の設計・計画は履歴として残してよい)。

`.claude/skills/slidev` と `.claude/skills/xrepo` に Slidev 固有の内容があれば、用途を確認して必要なら更新/削除する (xrepo がリポジトリ横断ツールなら温存)。

- [ ] **Step 7: 最終ビルド確認**

Run: `pnpm build`
Expected: `dist/index.html` と `dist/cloudflare-data-platform/index.html` が生成される。エラー無し。

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "docs: CLAUDE.md / README / new-slide スキルを HonoX+MDX 構成へ更新

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PHWiMVEovLVs483rYfSoCQ"
```

---

## 全体検証 (全タスク完了後)

- [ ] `pnpm build` がクリーンに通り、`dist/index.html` と `dist/cloudflare-data-platform/index.html` が生成される。
- [ ] `pnpm dev` で `/` がデッキ一覧、`/cloudflare-data-platform` が 12 スライドのデッキとして表示される。
- [ ] 2 カラム (R2 / R2 Data Catalog / Workflows / Python SDK / ビジュアライザ / Containers の 6 枚) が崩れない。
- [ ] 画像・図 (svg 3 / png 3 = check-iceberg, image-processing, r2-tweet) がすべて表示されリンク切れゼロ。
- [ ] コードブロックがハイライトされコピーボタンが出る。矢印/Space/スワイプ/`f` 全画面/ハッシュ URL が動く。
- [ ] スピーカーノートが MDX ソースに `{/* */}` で保持されている。
- [ ] リポジトリに Slidev 関連ファイル (contents/ slidev-theme-enbu/ pnpm-workspace.yaml src/index.js scripts/build*.js scripts/picker.js) が残っていない。
- [ ] 一時ファイル (scripts/render-excalidraw.mjs, playwright 依存) が削除されている。
````

