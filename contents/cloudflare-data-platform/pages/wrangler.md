---
layout: section
---

# 開発者体験

---

# Wrangler


Cloudflare には `wrangler` という優れた CLI があります。

Cloudflare のさまざまなサービスを 1 コマンドで操作できます。

`wrangler types` コマンドで Binding の TypeScript 型を自動生成できます。

**LocalStack**、**Floci** などのサードパーティのローカルエミュレーターサービスは、どこまで行っても API レベルのエミュレートしかできません。一方で `wrangler` は Cloudflare のエッジ環境で動いている workerd ランタイムが Miniflare を介してローカルで動きます。

<div class="mt-3 text-xs op-60 line-height-tight">

これらは個人的に気に入って使っています。

- https://github.com/sivchari/kumo
- https://github.com/sivchari/snowflake-emulator

Cloudflare の文脈で kumo というと [Kumo UI](https://kumo-ui.com/) という UI ライブラリを指します。

</div>

<!--
cf CLI 補足:
Wrangler と並行して Cloudflare が公開した新 CLI。約 3,000 API 操作を 1 CLI に
まとめ、Cloudflare REST API のほぼ全域をカバーする。TypeScript スキーマから
CLI / バインディング / ドキュメント / AI エージェント用 Skill を同時生成し、
AI エージェントを主要ターゲットに据えた設計。

Wrangler との住み分け:
- Wrangler: 開発者の相棒。成熟していて、ローカル開発・デプロイが強い。
- cf CLI: プラットフォーム API 統合 CLI。API 全カバレッジ・AI 連携が強い。
- 主なユーザーは、Wrangler が Workers 開発者、cf CLI が運用・AI エージェント。

Data Platform 的な効き:
Cloudflare MCP + cf Skill の組み合わせで、AI エージェントが
「Pipeline スキーマ更新 → R2 権限変更 → D1 デプロイ」のような複合操作を
人間介在なしで回せる未来の布石。

cf CLI は 2026 年 4 月 13 日 に technology preview として公開された新しい統合 CLI。
Wrangler が「開発者の相棒」として成熟しているのに対し、cf CLI は 3,000 近い
Cloudflare REST API 操作を全カバーする「プラットフォーム API 統合 CLI」。
TypeScript スキーマから CLI / バインディング型 / ドキュメント / AI エージェント用
Skill を同時生成する点が新しく、AI エージェント駆動運用を前提に設計されている。
Wrangler を置き換えるのではなく住み分け。
-->

---

## Local Explorer

<div class="flex justify-center mt-4">
  <video
    src="/cloudflare-local-explorer.mp4"
    class="aspect-video w-[860px] max-w-full rounded border border-zinc-700/60 shadow-lg"
    autoplay
    loop
    muted
    playsinline
  ></video>
</div>

---

# MCP / Agent Skills

**17 種類の公式 MCP サーバー**があります。（API + プロダクト特化）

https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/

https://github.com/cloudflare/skills

<!--
17 種類も登録するのは大変だから MCP Server Portal を使うといいのでは
-->

---

# Documentation / llms.txt

ドキュメントも LLM が読める形で整備されています。

- **llms.txt** を提供しています。（LLM フレンドリー）
- https://isitagentready.com/developers.cloudflare.com
- Changelog を週次更新しています。（RSSで購読できて嬉しい。）
- ブログもプロダクトの裏側が書かれていたりして参考になります。

---

# IaC

宣言的にリソースを管理する選択肢が用意されています。

- **Terraform** プロバイダーで多くのサービスを宣言的に定義できます。
  - https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs
- **Alchemy** は TypeScript ネイティブな IaC で、Workers と同じ言語で完結します。Binding がすごく書きやすい。
  - https://v2.alchemy.run (v2 ドキュメント)

`wrangler` コマンドで簡単に作成・編集・削除できますが、IaC で管理したい場面もあります。

<!--
binding 先が削除されたとしてもデプロイときにエラーが起きるようになっている。
Terraform は HCL で多クラウドを横断的に管理する定番、Alchemy は TypeScript で
書ける Cloudflare 寄りの新興 IaC。Workers 開発者なら言語を揃えられて、
Wrangler と地続きで扱える点が魅力。
-->

---

# SDK

- TypeScript
- Python
- Go

の 3 つがサポートされています。

SDK があることで、外部サービスや自社アプリから Cloudflare サービスを型安全に操作しやすくなります。
