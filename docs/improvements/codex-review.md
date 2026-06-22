# Codex レビュー指示書 — slides 改善バッチ

OpenCode が `docs/improvements/opencode-brief.md` に沿って実装した変更をレビューする。
対象は PR1〜PR4。各 PR の差分（`git diff`）を見て、下記観点で**実害のある問題のみ**を指摘する（好みの指摘は最小限に）。

## レビューの進め方
- 各 PR を独立にレビューし、最後に横断観点をチェック。
- 指摘は「ファイル:行 / 重大度(blocker|major|minor) / 何が壊れるか / 修正案」の形式で。
- 「動く」だけでなく「ビルド成果物 (`dist`) とランタイム挙動」まで検証すること。可能なら `pnpm build` を実行し `dist` の HTML を確認。

## 共通の前提（守られているか確認）
- コードスタイルが `.prettierrc` 準拠（printWidth 70 / semi なし / singleQuote / jsxSingleQuote）。`pnpm format:check` がパスするか。
- pnpm / Node 20 前提。`pnpm-lock.yaml` が更新され `--frozen-lockfile` で通るか。
- 既存デッキ `cloudflare-data-platform` の表示・ナビ・2 カラム・コピーボタンが回帰していないか。

---

## PR1: CI / 品質基盤
- `package.json` scripts (`typecheck`/`format`/`format:check`/`check`) が正しく、`pnpm check` がローカルで成功するか。
- `typescript` が devDependencies に**明示**追加されているか（transitive 依存頼みになっていないか）。
- `tsconfig.json` の `include` が `app`,`vite.config.ts` を網羅し、`tsc --noEmit` が型エラーゼロか。
- `.prettierignore` が生成物/バイナリを適切に除外し、かつソースを過剰に除外していないか。
- `.github/workflows/ci.yml`: トリガー、`node-version-file: .node-version`、pnpm キャッシュ、`--frozen-lockfile`、ステップ順序（typecheck→format:check→build）。既存 `claude.yml` を壊していないか。YAML 構文の妥当性。

## PR2: ビルド時シンタックスハイライト
- **blocker 候補**: `dist` の HTML に highlight.js の CDN 参照（CSS/JS）が 1 つでも残っていないか。`hljs.highlightAll()` 呼び出しが `_renderer.tsx`・`slide.js` から完全に消えているか。
- `vite.config.ts` の `rehypePrettyCode` 設定（`keepBackground: false`、単一ダークテーマ）が意図通りで、`rehypeSlug` と共存して見出し ID 生成も維持されているか。
- コードがビルド時に色付けされ、トークンが span として HTML に存在するか。
- **コピーボタン回帰**: `figure` ラップ等で `.copy-btn` の絶対配置基準（`position: relative` な親）がずれていないか。クリックでコード**全文**がコピーされるか（行番号やプロンプト記号が混入しないか）。
- 3 テーマ（dark/cloudflare/light）でコードと背景のコントラストが確保されているか。`--slide-code-bg` とトークン色の組み合わせ。

## PR3: プレゼンターモード
- **blocker 候補**: `cloudflare-data-platform.mdx` の `{/* */}` 12 箇所が `<aside class="note">` に移行され、**文言が改変されていない**こと。ノートが通常表示に漏れていない（`.note { display:none }` が効いている）こと。各ノートが正しいスライドに属しているか（移行で別スライドに混入していないか）。
- MDX 内の素 HTML `<aside>` が段落崩れ・パースエラーを起こしていないか（`pnpm build` がエラーなく通るか）。
- `slide.js`: `p` でプレゼンターウィンドウが開き、`BroadcastChannel` でメインのページ送りに追従するか。次スライドプレビューに `.note` が混入していないか。タイマーが動くか。
- BroadcastChannel 未対応ブラウザや `window.open` ブロック時に、メイン表示が壊れず劣化フォールバックするか（例外で全体が止まらないこと）。
- ドキュメント整合: `.claude/CLAUDE.md`（および README）のノート記法が新形式に更新されているか。

## PR4: 印刷エクスポート + 一覧自動生成
- 印刷: `@media print` で全 `.slide` が 1 ページ 1 枚（`page-break-after`）に展開され、`#progress`/`#counter`/`#hint`/`.copy-btn`/`.note` が非表示か。コードブロックが `max-height` 制限で途中切れしないか。`e` キーで `window.print()` が呼ばれるか。
- 一覧自動生成:
  - **blocker 候補**: `index.mdx`→`index.tsx` 化で `/` が SSG ビルドに含まれ、レンダラ（`_renderer.tsx`）に `frontmatter` が正しく渡るか（型 `ContextRenderer` 整合）。
  - `import.meta.glob('./*.mdx', { eager: true })` が各 MDX の `frontmatter` を取得でき、`slide === true` のみ抽出・`index`/非スライド除外できているか。
  - 新規 `slide: true` MDX を 1 枚追加したら一覧に自動で増えることを実際に試す（ダミーを足してビルド→確認→削除）。
  - リンク先パス（`/<deck-name>`）と `title` 表示が正しいか。

---

## 横断チェック（最後に）
- `pnpm check` 全パス。`pnpm build` 後の `dist` を開いて主要ページが実表示できるか。
- 不要な依存追加・未使用 import・デッドコードがないか。
- セキュリティ: `raw()` でのインライン注入や `window.open` 周りで XSS/インジェクションの新たな経路が増えていないか（コンテンツは自前 MDX のみだが、念のため）。
- 旧 `index.mdx`、旧 highlight.js 参照、旧ノート記法など**移行残り**がないか。
- コミットが PR 単位で分かれ、各 PR 単体でビルドが通る粒度か。
