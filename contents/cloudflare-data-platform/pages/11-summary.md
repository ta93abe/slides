---
layout: section
---

# まとめ

<!--
ここまでで Cloudflare Data Platform の全体像を、基礎 (Workers / DO / R2)、
ツール (Wrangler / Honeycomb / dbt)、solution (Ambient Agent / Durability /
AI sprawl) で流した。最後に持ち帰り 3 点と、最初の一歩を 3 枚で締めて、
聴衆が翌日から手を動かせる形にする。
-->

---

# 持ち帰ってほしい 3 つ

<div class="grid grid-cols-1 gap-4 mt-6 text-sm">

<div class="border border-orange-500/30 rounded p-4">

### ① ingest / store / query が **1 プラットフォーム**で揃った

Pipelines (取り込み) → R2 + R2 Data Catalog (Iceberg 標準で蓄積) → R2 SQL (分散クエリ)。**外部 DWH 抜きで** データレイクが完結する選択肢が現実になった

</div>

<div class="border border-orange-500/30 rounded p-4">

### ② Worker は **Capability-based な接着剤**

Binding は「権限 + API」のペア。`wrangler.jsonc` に宣言した時点でアクセス経路が確定し、**触れない手段が静的に保証される**。データ基盤の取り込み・変換・配信が 1 ファイルに収まる

</div>

<div class="border border-orange-500/30 rounded p-4">

### ③ DO の 5 点セットは **Ambient Agent のための primitive** だった

単一インスタンス / SQLite / Alarm / WebSocket Hibernation / RPC が、そのまま Agents SDK の基底クラスに対応。**常駐費を払わない常駐エージェント**で、商用 Ambient が現実解になった

</div>

</div>

<!--
今日の話をスライドから離れた時に思い出してもらいたいのはこの 3 点。
1 つめ、Cloudflare で ingest / store / query が 1 つのプラットフォームに
揃ったので、データレイクを外部 DWH 抜きで完結させる選択肢が現実になった。
2 つめ、Worker の binding は capability-based で、宣言した時点で
触れる手段が確定する。最小権限が運用ではなく構造で担保される設計。
3 つめ、DO の 5 点セットが Ambient Agent のための primitive だった、
という伏線回収。2020 年の stateful serverless 宣言が 6 年かけて
完成形に到達した。3 つに共通するのは、運用や規約ではなく
構造で性質を担保するというデザイン哲学。
-->

---

# 最初の一歩 — 個人で始められる入口

<div class="grid grid-cols-2 gap-4 mt-6 text-sm">

<div class="border border-orange-500/30 rounded p-4">

### 🌐 個人サイト / ブログ

静的サイトを **Workers Static Assets** でホスティング。Markdown ベースのフレームワーク (Astro 等) で書いて `wrangler deploy` 一発

</div>

<div class="border border-orange-500/30 rounded p-4">

### ⚙️ 日常の小さな自動化

Webhook 受信 → Slack 通知、cron で天気を毎朝、家計簿の R2 保存 ... など **Worker 1 ファイル**で書ける

</div>

<div class="border border-orange-500/30 rounded p-4">

### 🧊 Iceberg を **R2 Data Catalog** で

Iceberg は触ってみたいけど Hive Metastore のセットアップが重い ... という人は **R2 Data Catalog でバケット指定 1 行**

</div>

<div class="border border-orange-500/30 rounded p-4">

### 🤖 ダッシュボードで Agent Lee に会う

`cloudflare.com` から管理画面に入ると、画面右下に **Agent Lee** が常駐している。ダッシュボードでの操作を AI に委ねるのが Cloudflare 流

</div>

</div>

<!--
理論を聞いただけで終わらせない仕掛けとして、個人で始められる入口を 4 つ。
個人ブログを Workers Static Assets で配信するのが一番低コスト。
Astro のような Markdown ベースのフレームワークと相性が良い。
日常の小さな自動化、たとえば毎朝天気を Slack に流すだけでも Worker 1 ファイル。
Iceberg を試したい場合、これまで Hive Metastore のセットアップが重くて
諦めていた人にこそ R2 Data Catalog がいい。バケット指定だけで Iceberg が始まる。
最後に、Cloudflare のダッシュボードを開いたことが無い人は、ぜひ
Agent Lee に会ってみてほしい。ダッシュボード操作自体を AI に委ねるという、
Cloudflare の世界観が一番分かりやすく出ているプロダクト。
-->

---

# 次回への期待

<div class="text-center mt-12 text-2xl">

商用環境での **ユースケース**を聞かせてください

</div>

<div class="mt-12 grid grid-cols-3 gap-3 text-sm op-80">

<div class="border border-orange-500/30 rounded p-3">

### 運用知見

スケール / 障害対応 / コストコントロール

</div>

<div class="border border-orange-500/30 rounded p-3">

### 移行ストーリー

外部 DWH / 既存基盤との共存・段階移行

</div>

<div class="border border-orange-500/30 rounded p-3">

### Ambient の事例

商用に乗った Ambient Agent の実話

</div>

</div>

<div class="mt-12 text-center text-sm op-60">

ご清聴ありがとうございました 🔥

</div>

<!--
最後の 1 枚は登壇の余韻として、聴衆へのリクエスト。
今日は Cloudflare がここまで揃った、という話を中心にしたが、
次回はぜひ商用環境での実話を聞きたい。スケールさせた時の運用知見、
外部 DWH や既存基盤との共存・段階移行のストーリー、商用に乗った
Ambient Agent の事例、どれも自分が一番興味があるテーマ。
炎舞テーマの炎で締めくくる。
-->
