---
layout: section
---

# 開発者体験

<!--
最後に、開発者体験まわりです。
-->

---

# [Wrangler](https://developers.cloudflare.com/workers/wrangler/)


Cloudflare には `wrangler` という優れた CLI があります。

Cloudflare のさまざまなサービスを 1 コマンドで操作できます。

`wrangler types` コマンドで Binding の TypeScript 型を自動生成できます。

**LocalStack**、**Floci** などのサードパーティのローカルエミュレーターサービスは、どこまで行っても API レベルのエミュレートしかできません。一方で `wrangler` は Cloudflare のエッジ環境で動いている [workerd](https://github.com/cloudflare/workerd) ランタイムが [Miniflare](https://developers.cloudflare.com/workers/testing/miniflare/) を介してローカルで動きます。

<div class="mt-3 text-xs op-60 line-height-tight">

↓これらは個人的に気に入って使っています。

- https://github.com/sivchari/kumo
- https://github.com/sivchari/snowflake-emulator

Cloudflare の文脈で kumo というと [Kumo UI](https://kumo-ui.com/) という UI ライブラリを指します。

</div>

<!--
Cloudflare には wrangler という優れた CLI があります。
さまざまなサービスを 1 コマンドで操作できて、
wrangler types で Binding の TypeScript 型を自動生成してくれます。

サードパーティのローカルエミュレーターは結局 API レベルの再実装ですが、
wrangler は本番と同じ workerd ランタイムが Miniflare 経由でローカルで動きます。
挙動乖離が起きにくい設計です。
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

<!--
Local Explorer は、wrangler dev で立ち上げたローカル環境を、
ブラウザ拡張のような UI で覗ける機能です。
R2 や D1 のデータをそのまま見られるので、開発中のデバッグがとても楽になります。
-->

---

# SDK

- TypeScript
- Python
- Go

の 3 つがサポートされています。

SDK があることで、外部サービスや自社アプリから Cloudflare サービスを型安全に操作しやすくなります。

<!--
SDK は TypeScript / Python / Go の 3 つがサポートされています。
外部サービスや自社アプリから Cloudflare サービスを型安全に操作できます。
-->

---

# IaC

宣言的にリソースを管理する選択肢が用意されています。

- **Terraform** プロバイダーで多くのサービスを宣言的に定義できます。
  - https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs
- **Alchemy** は TypeScript ネイティブな IaC で、Workers と同じ言語で完結します。Binding がすごく書きやすい。
  - https://v2.alchemy.run

`wrangler` コマンドで簡単に作成・編集・削除できますが、IaC で管理したい場面もあります。

<!--
宣言的なリソース管理は、
Terraform プロバイダーで多くのサービスをカバー、
もしくは Alchemy という TypeScript ネイティブな IaC があります。
Alchemy は Workers と同じ言語で完結するので Binding が書きやすいです。
-->

---

# MCP / Agent Skills

**17 種類の公式 MCP サーバー**があります。（API + プロダクト特化）

([**MCP Server Portal**](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/) を使うと複数 MCP サーバーを 1 URL に集約 + Cloudflare Access で認証・認可・監査ができます。)

https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/

https://github.com/cloudflare/skills

<!--
Cloudflare は API + プロダクト特化の MCP サーバーを 17 種類公式提供しています。
Agent Skills も GitHub の cloudflare/skills リポジトリにまとまっています。

17 種類を全部登録するのは大変なので、MCP Server Portal を使うのがおすすめです。
組織内で乱立する MCP server を中央集約して、Cloudflare Access で認証 / 認可 / 監査を担当させる構成。
Shadow MCP の防止、部署別 tool アクセス制御、IDE エージェントの破壊操作の構造的封じ込めに使えます。
-->

---

# Documentation

ドキュメントも LLM が読める形で整備されています。developers.cloudflare.com

- **llms.txt** を提供しています。
- https://isitagentready.com/developers.cloudflare.com
- Changelog を頻繁に更新しています。（RSSで購読できて嬉しい。）
- [ブログ](https://blog.cloudflare.com/)もプロダクトの裏側が書かれていたりして参考になります。

<!--
ドキュメントが LLM フレンドリーに整備されています。
llms.txt を提供していて、
Changelog も RSS で購読できる頻度で更新されています。
ブログもプロダクトの裏側まで書かれていて読み応えがあります。
-->
