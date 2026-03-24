---
name: new-slide
description: This skill should be used when the user asks to "create a new slide", "make a presentation", "新しいスライドを作って", "スライドを追加", "プレゼンを作成", or mentions creating a Slidev project. Scaffolds a new Slidev slide project under the slides/ directory.
---

# New Slide Project

新しいSlidevスライドプロジェクトを `slides/` 配下にスキャフォールドするスキル。

## 必要な情報

以下をユーザーから取得する（引数またはヒアリング）：

| パラメータ | 必須 | 例 | 説明 |
|---|---|---|---|
| タイトル | Yes | `PUG at Fukuoka` | スライドのタイトル |
| 概要 | Yes | `Cloudflare Workersの紹介` | スライドの説明 |
| 発表日 | No | `2025-06-06` | YYYY-MM-DD形式。未指定なら今日の日付 |
| プロジェクト名 | No | `pug-at-fukuoka-2025-06-06` | 未指定ならタイトル+日付から自動生成 |

## プロジェクト名の生成ルール

`<イベント名>-<YYYY-MM-DD>` 形式。タイトルから以下のように変換する：

1. 英語に変換（日本語タイトルの場合は意訳）
2. 小文字化
3. スペースをハイフンに置換
4. 末尾に `-YYYY-MM-DD` を付与

例: `PUG at Fukuoka` + `2025-06-06` → `pug-at-fukuoka-2025-06-06`

## 作成手順

### 1. pnpm create slidev でプロジェクト作成

```bash
cd slides && pnpm create slidev <project-name>
```

第1引数にプロジェクト名を渡すと対話式プロンプトをスキップできる。
依存関係のインストールを聞かれたら `yes` を選択。

### 2. package.json に slidev メタデータを追加

`create-slidev` が生成する `package.json` には `slidev` フィールドがない。
`build.js` がスライドを検出するために必要なので、以下を追加する：

```json
{
  "slidev": {
    "title": "<タイトル>",
    "date": "<YYYY-MM-DD>",
    "description": "<概要>"
  }
}
```

### 3. slides.md の frontmatter を更新

生成された `slides.md` の frontmatter 内の `title` と `info` をユーザー指定の値に置換する。
最初のスライドの見出しとサブタイトルも更新する。

### 4. 不要ファイルの削除

以下のファイルはこのリポジトリでは不要なので削除する：

- `netlify.toml` — Netlify用設定
- `vercel.json` — Vercel用設定（Cloudflare Workersでデプロイするため）
- `README.md` — 個別スライドにREADMEは不要

### 5. 確認

完了後、以下を案内する：

```bash
# 開発サーバー起動
pnpm --filter <project-name> dev
```
