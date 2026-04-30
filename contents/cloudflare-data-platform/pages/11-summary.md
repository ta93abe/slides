---
layout: section
---

# まとめ

<!--
ここまでで Cloudflare Data Platform の全体像 — 基礎 (Workers / DO / R2) → ツール (Wrangler / Honeycomb) → solution (dbt / Ambient Agent / Durability / AI sprawl) を流した。
最後に、聴衆が何を持ち帰って、何から手を動かせばいいかを 3 枚で締める。
-->

---

# まずは cloudflare.com にたどり着く

<v-clicks>

- Claude とアドレスバーに typo し続けるとたどり着けない
- たどり着けば **Agent Lee** が出迎えてくれる
- 質問しながら最初の Worker までいける

</v-clicks>

<!--
ここで笑いを取る (Claude と typo するエピソード)。
Cloudflare の入り口は cloudflare.com にある AI チャット案内人「Agent Lee」。
製品ラインナップが多すぎて迷うが、Agent Lee に聞けば「何をしたい?」から「最初に触る製品」まで案内してくれる。
登壇者が言いたいことを Agent Lee が自然に補ってくれるイメージ。
-->

---

# まずは何から始める？

<v-clicks>

- **個人サイト / ブログをホスティング** — `EmDash` のような OSS CMS もある
- **日常のちょっとしたこと** を Workers で解決
- 「重いデータ基盤」じゃなく、まず手を動かす

</v-clicks>

<!--
Data Platform は重い話に聞こえるが、入り口はこの辺り。
個人サイト / ブログのホスティングは無料枠で完結する。EmDash は Cloudflare 上で動く OSS の Headless CMS で、入門に丁度いい。
日常のちょっとしたタスク — 例えば cron で何か叩く、Webhook を受けて Slack に投げる — を Worker 1 つで書ける。
こういう小さな成功体験から積み重ねれば、自然と Data Platform 側の世界にも来られる。
-->

---
layout: end
---

# 次回は、もっと具体的なデータ基盤での<br />Cloudflare の躍動を

Cloudflare で始める Data Platform

<!--
今回は全体俯瞰型で 10 分にまとめた。
次回機会があれば、特定のユースケース (例: 自社のログ集約 → R2 Iceberg → dbt → Honeycomb の一連) を実装デモ付きで深く話したい。
聴衆に「自分の現場でも試したい」と感じてもらえれば成功。
-->
