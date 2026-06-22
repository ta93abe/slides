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
    const { exportToSvg } = mod.default
    const scene = JSON.parse(raw)
    const el = await exportToSvg({
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
