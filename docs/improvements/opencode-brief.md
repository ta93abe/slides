# OpenCode 実装ブリーフ — slides 改善バッチ

このドキュメントは OpenCode に実装を依頼するための指示書。Claude Code が現状把握のうえ作成。
実装後は `docs/improvements/codex-review.md` の観点で Codex がレビューする前提。

## 対象リポジトリの前提（実装前に必ず守ること）

- スタック: HonoX + MDX、SSG (`@hono/vite-ssg`) で静的 HTML 生成、Cloudflare Workers (Static Assets) 配信。
- パッケージマネージャは **pnpm**。Node は **20**（`.node-version`）。
- コードスタイルは `.prettierrc` に従う: **printWidth 70 / semi なし / singleQuote / jsxSingleQuote / tabWidth 2 / trailingComma es5 / LF**。新規ファイルもこれに準拠。
- スライドの仕様: frontmatter `slide: true` でスライドモード、`---` で分割、`::right::` で 2 カラム。`theme` は `dark`(既定)/`cloudflare`/`light`。
- 既存の主要ファイル:
  - `app/routes/_renderer.tsx` — `slide.css`/`slide.js` を `?raw` でインライン注入、highlight.js を CDN ロード。
  - `app/slide.js` — ランタイムで DOM を分割しナビゲーション付与（プレーン JS、ビルド変換なし）。
  - `app/slide.css` — スライド CSS。
  - `vite.config.ts` — honox / ssg / mdx プラグイン。mdx は `remarkFrontmatter`,`remarkMdxFrontmatter`,`rehypeSlug`。
  - `app/routes/index.mdx` — デッキ一覧トップ（手書き）。
  - `app/routes/cloudflare-data-platform.mdx` — 既存デッキ（353 行、ノートは `{/* */}` が 12 箇所）。
  - `app/global.d.ts` — frontmatter 型 `Meta`。
- **作業は PR を 4 本に分ける**。下記 PR1→PR4 の順で、各 PR 完了ごとに `pnpm build` が通ることを確認してから次へ進む。
- 各 PR ごとに、変更点・確認したコマンド・残課題を簡潔にまとめて報告すること。

---

## PR1: CI / 品質基盤（最初に実装、後続 PR のゲートになる）

**目的**: typecheck / format / build を npm scripts と GitHub Actions で自動化する。

**作業**
1. `package.json` の `scripts` に追加:
   - `"typecheck": "tsc --noEmit"`
   - `"format": "prettier --write ."`
   - `"format:check": "prettier --check ."`
   - `"check": "pnpm typecheck && pnpm format:check && pnpm build"`
2. `package.json` の `devDependencies` に `typescript` を**明示的に**追加（現状 transitive 依存のみで CI で不安定。`pnpm add -D typescript` で最新安定版をピン）。
3. `tsconfig.json` に typecheck 対象を明示: `"include": ["app", "vite.config.ts"]` を追加（`compilerOptions` はそのまま）。
4. `.prettierignore` を新規作成し `dist`、`pnpm-lock.yaml`、`public/**/*.svg`、`*.png` を除外（バイナリ/生成物の誤検知防止。既存コードに対し `prettier --check .` がパスする状態にする。差分が出る既存ファイルがあれば `prettier --write` で整形してコミット）。
5. `.github/workflows/ci.yml` を新規作成（既存の `claude.yml` には触れない）:
   - トリガー: `push`（全ブランチ）と `pull_request`。
   - ジョブ: ubuntu-latest、`pnpm/action-setup`→`actions/setup-node@v4`（`node-version-file: .node-version`, `cache: pnpm`）→`pnpm install --frozen-lockfile`→`pnpm typecheck`→`pnpm format:check`→`pnpm build`。

**受け入れ基準**
- ローカルで `pnpm check` が成功する。
- `ci.yml` の構文が妥当（`actionlint` 相当の明らかな誤りがない）。
- 既存の挙動・出力 HTML は不変。

---

## PR2: ビルド時シンタックスハイライト（highlight.js CDN を廃止）

**目的**: ランタイムの highlight.js CDN 実行をやめ、ビルド時に Shiki でハイライトする。CDN 依存と FOUC を解消。

**作業**
1. 依存追加: `pnpm add -D rehype-pretty-code shiki`。
2. `vite.config.ts` の mdx `rehypePlugins` に `rehypePrettyCode` を追加（`rehypeSlug` と併用）。設定方針:
   - `keepBackground: false`（コード背景は `slide.css` の `--slide-code-bg` に委ねる。テーマ dark/cloudflare/light で背景が変わるため）。
   - `theme` は全テーマで読める単一ダークテーマ（例 `github-dark` か `one-dark-pro`）。
3. `app/routes/_renderer.tsx` から以下を削除:
   - highlight.js の CSS link（atom-one-dark）と JS `<script src=...highlight.min.js>`。
   - スライド版・非スライド版それぞれの `hljs.highlightAll()` 呼び出し（非スライド版の末尾 `<script>{raw('hljs.highlightAll()')}</script>` も削除）。
4. `app/slide.js` 末尾の `if (window.hljs) window.hljs.highlightAll()` を削除。
5. `app/slide.css` を調整:
   - rehype-pretty-code が出力する構造（`pre > code`、行 `span[data-line]`、`figure[data-rehype-pretty-code-figure]` 等）に合わせ、既存の `.slide pre` / `.slide :not(pre) > code` のスタイルが崩れないよう調整。
   - コピーボタン（`.copy-btn`）は `pre` 内 `code.innerText` を読むため、構造変更後も機能することを確認。`figure` でラップされる場合、`.copy-btn` の絶対配置基準（`position: relative` の親）が `pre` のままになるよう CSS を保つ。

**受け入れ基準**
- `pnpm build` 後の `dist` の HTML に highlight.js CDN への参照が**残っていない**。
- `cloudflare-data-platform.mdx` のコードブロックがビルド時点で色付けされている（HTML に span ベースのトークンが含まれる）。
- コピーボタンが従来どおり全コードブロックに付き、クリックでコード全文がコピーされる。
- dark / cloudflare / light の 3 テーマでコードが判読可能（背景とのコントラスト）。

**リスク（Codex に重点レビューさせる箇所）**: CSS 構造変更でコピーボタンの位置やコード折り返しが壊れやすい。テーマ別の背景とトークン色のコントラスト。

---

## PR3: プレゼンターモード

**目的**: 発表者用ウィンドウにスピーカーノート・次スライド・経過タイマーを表示する。

**前提となる仕様変更（重要）**: 現在ノートは MDX コメント `{/* */}` で書かれており、**コンパイル時に消えて DOM に残らない**。プレゼンターモードはノートが DOM に必要なので、ノート記法を DOM に残る形へ変更する。

**作業**
1. ノート記法を `<aside class="note">…</aside>` に統一（MDX 内に素の HTML として書ける）。
   - `app/routes/cloudflare-data-platform.mdx` の `{/* … */}` 12 箇所をすべて `<aside class="note">…</aside>` に移行（中身の文言は変えない。各ノートは該当スライド内に置く）。
   - `.claude/CLAUDE.md` の「スピーカーノートは `{/* */}`」の記述を新記法 `<aside class="note">` に更新。`README` に該当記述があれば併せて更新。
2. `app/slide.css`: `.slide .note { display: none }` で通常表示時は隠す（DOM には残す）。
3. `app/slide.js`:
   - スライド構築時に各スライドの `.note` テキストを配列に収集。
   - キー `p` でプレゼンターウィンドウを `window.open` で開く。プレゼンターウィンドウには (a) 現在スライドのノート (b) 次スライドのプレビュー（`slides[idx+1]` の `outerHTML` を縮小表示、`.note` は除外) (c) 開始からの経過タイマー、を表示。
   - メインとプレゼンター間のスライド同期は `BroadcastChannel`（フォールバック不要、対応ブラウザ前提でよいが未対応時は `p` を無効化）。メインで `go()` 実行時に現在 idx をブロードキャストし、プレゼンター側で追従。
   - `#hint` の文言に `p: presenter` を追記。
4. プレゼンターウィンドウの HTML/CSS は `slide.js` 内で生成（外部ファイルを増やさない）。スライド本体の CSS を流用したい場合は最小限のスタイルをインラインで書く。

**受け入れ基準**
- 通常表示でノートが見えない。
- `p` 押下でプレゼンターウィンドウが開き、メインのページ送りに連動してノートと次スライドが更新される。
- タイマーが動作する。
- 既存デッキ `cloudflare-data-platform` で 12 個のノートが正しいスライドに紐づいて表示される。

**リスク（Codex 重点）**: `{/* */}`→`<aside>` 移行でノートが本文に漏れて表示されないか。MDX 内の素 HTML が段落崩れを起こさないか。BroadcastChannel 未対応時のフォールバック。`window.open` がポップアップブロックされる挙動。

---

## PR4: PDF / 印刷エクスポート + デッキ一覧の自動生成

**目的**: (a) 配布用に全スライドを 1 ページ 1 枚で印刷/PDF 化できる。(b) トップのデッキ一覧を frontmatter から自動生成する。

**作業 (a) 印刷**
1. `app/slide.css` に `@media print` を追加:
   - `.slide { display: block !important; position: static; inset: auto; height: auto; page-break-after: always; overflow: visible; }`
   - チラ見え防止に `#deck { position: static; }`、`#progress`,`#counter`,`#hint`,`.copy-btn`,`.note` を `display: none`。
   - コードブロックは `max-height: none; overflow: visible;` で全文表示。
2. `app/slide.js`: キー `e` で `window.print()` を呼ぶ。`#hint` に `e: export` を追記。

**作業 (b) 一覧自動生成**
1. `app/routes/index.mdx` を `app/routes/index.tsx` に置き換える（旧 `.mdx` は削除）。
2. `import.meta.glob('./*.mdx', { eager: true })` で全デッキ MDX を読み込み、各モジュールの `frontmatter`（`remark-mdx-frontmatter` が export する）から `slide === true` のものだけを一覧化。`index` 自身と非スライドは除外。
3. ルートは `frontmatter` を持つ必要があるため、`c.render(<JSX/>, { frontmatter: { title: 'ta93abe slides' } })` で既存レンダラに渡す（HonoX のルート default export で `createRoute`/`c.render` を使う。`_renderer.tsx` の `ContextRenderer` 型に合わせる）。
4. 一覧の各項目: パス（`/<deck-name>`）と `frontmatter.title` をリンク表示。デッキが増えたら自動で出る状態にする。
5. `app/global.d.ts` の `Meta` 型で不足があれば補う（glob 読み込み時の型）。

**受け入れ基準**
- ブラウザの印刷プレビューで全スライドが 1 枚ずつページ分割され、ナビ系 UI が出ない。`e` キーで印刷ダイアログが開く。
- トップ `/` に既存デッキ `Cloudflare で始める Data Platform` がリンク表示され、新規 `slide: true` の MDX を追加すると自動で一覧に増える。
- `pnpm build` の SSG 出力にトップと各デッキが含まれる。

**リスク（Codex 重点）**: `index.mdx`→`.tsx` 化で HonoX のルーティング/レンダラ統合が壊れやすい（frontmatter の渡し方、`c.render` の型）。`import.meta.glob` が SSG ビルドで期待通り frontmatter を取れるか。印刷 CSS の `page-break` がコード/画像を途中で切らないか。

---

## 全体の最終チェック（全 PR 後）
- `pnpm check`（typecheck + format:check + build）が成功。
- 既存デッキ `cloudflare-data-platform` が dev / build / preview で表示崩れなく動く。
- CDN 依存の削減状況を報告（highlight.js は撤去済みであること。フォント等の残存 CDN は今回スコープ外）。
- 余力があれば未追跡の残骸 `slidev-theme-enbu/`・`contents/`（gitignore 済み・物理残存）の扱いを提案のみ（削除は勝手に実行しない）。
