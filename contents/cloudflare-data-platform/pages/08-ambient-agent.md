---
layout: section
---

# Ambient Agent を Cloudflare で動かす

<!--
ここまで前半で見せた DO の 5 点セット (単一インスタンス / SQLite / alarm /
WebSocket Hibernation / RPC) が、実は全部 Ambient Agent のための部品だった、
という伏線回収を 2 枚で見せる。対話型ではなく、常駐して自律的に動く
エージェントが商用に乗る条件が揃ってきている、という流れを作る。
-->

---

# Ambient Agent — 呼ばなくても動く・呼ばれた時だけ動く

ユーザーが叩くたびに動く **対話型 Agent** に対し、**Ambient Agent** はメール / Webhook / cron / ファイル変更などのイベントで **背景で常時稼働**する。

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">

<div class="border border-zinc-500/30 rounded p-3">

### 対話型 Agent (chatbot)

- ユーザープロンプトで起動
- セッション内の状態
- 数秒〜数分で完結
- 「ユーザーが満足」が成功

</div>

<div class="border border-orange-500/30 rounded p-3">

### Ambient Agent

- イベント / 時刻で起動
- 長期記憶 + 前回の判断を引き継ぐ
- 待機 + バーストで秒〜数日
- 「**見逃さない / 誤らない**」が成功

</div>

</div>

<div class="mt-6 border border-orange-500/30 rounded p-4">

### 経済性の核 — **99% idle, 1% burst**

10,000 ユーザー × 常駐 Agent でも、**実際に動くのは 100 程度**。**待機コストを払わずに常駐**できなければ Ambient は商用に乗らない。

→ Cloudflare は **Durable Objects + Alarms + WebSocket Hibernation + SQLite** で、この経済性を **プリミティブとして** 提供する。

</div>

<!--
Ambient Agent は対話型のチャットボットとは別の UX で、ユーザーが呼ばなくても
背景で常時稼働してメールや Webhook、定期トリガーに反応する。
本質は 99 パーセント idle、1 パーセント burst。
1 万ユーザー分の常駐 Agent を立てても、同時に動いているのは大体 100 ぐらいで、
待機コストを払えるかどうかが商用化の成立条件になる。
Cloudflare は前半で説明した DO + Alarm + WebSocket Hibernation + SQLite で、
この経済性をプリミティブとして提供している。常駐費を払わない常駐エージェント、
というのが Cloudflare で Ambient を組む最大のメリット。
-->

---

# DO 5 点セットがそのまま Agents SDK のプリミティブ

前半で見せた Durable Objects の機能群が、`agents` パッケージの基底クラスに **一対一で対応**する。

<div class="text-sm mt-4">

| Durable Objects | Agents SDK | 役割 |
|---|---|---|
| 単一インスタンス + SQLite | `this.state` / `this.setState()` | ユーザー単位の長期記憶 |
| Alarms API | `this.schedule(cron, method)` | 「常駐」を成立させる定期実行 |
| WebSocket Hibernation | `onConnect` / `onMessage` | **接続維持中も idle 課金ゼロ** |
| RPC メソッド | `@callable()` デコレータ | 型安全な Human-in-the-Loop |
| Jurisdiction (`eu` / `fedramp`) | 同 API そのまま | EU ユーザーの ambient を EU 内に閉じる |

</div>

```typescript
// Ambient: 15 分おきに受信箱を巡回 → AI で分類 → Inbox に積む
import { Agent, callable } from "agents";

export class InboxWatcher extends Agent<Env, { lastAt: number; pending: Item[] }> {
  initialState = { lastAt: 0, pending: [] };

  async onStart() { await this.schedule("*/15 * * * *", "poll", {}); }

  async poll() {
    const items = await this.fetchSince(this.state.lastAt);
    const triaged = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct", { items });
    this.setState({ lastAt: Date.now(), pending: [...this.state.pending, ...triaged.review] });
  }

  @callable() async approve(id: string) { /* 人間レビュー後の実行 */ }
}
```

<!--
Agents SDK は Durable Objects のラッパー、と言い切って良い構造になっている。
state は SQLite に裏打ちされた長期記憶、schedule は Alarm の糖衣、
onConnect / onMessage は WebSocket Hibernation そのもの、
callable は DO の RPC を型安全に公開する仕組み。
このコードは 15 分おきに受信箱を巡回し、LLM で分類して、要レビューだけを
state に積む典型形。承認を待っている間、DO は hibernation で寝て、
課金はストレージとリクエストだけ。10 行ちょっとで Ambient の骨格が書ける、
というのが「DO は最初から Ambient のための primitive だった」の意味。
2020 年の DO ベータの stateful serverless 宣言から 6 年、必要な要素が揃った形。
-->

---
