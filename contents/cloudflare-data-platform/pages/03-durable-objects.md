---
layout: section
---

# Durable Objects

エッジで動く、状態を持ったアクター

---

# Durable Objects とは

Workers が「ステートレスな関数」なら、Durable Objects は「グローバルに一意な ID を持つ、ステートフルなアクター」。

<v-clicks>

- **1 object = 1 実行コンテキスト**: 同じ ID への並行リクエストはシリアライズされる（シングルライターが保証される）
- **グローバル一意な ID**: `idFromName("user:42")` で決定的に生成。世界中のどの Worker から呼んでも同じインスタンスに到達
- **ストレージ内蔵**: Key-Value API と SQL API を object 単位で持てる
- **Workers から Binding 経由で呼ぶ**: `env.ROOM.get(id).fetch(request)` のように RPC できる

</v-clicks>

<v-click>

```ts {scale: 0.85}
// wrangler.jsonc で binding
const id = env.ROOM.idFromName("room:lobby");
const stub = env.ROOM.get(id);
await stub.fetch("/join", { method: "POST", body: userId });
```

</v-click>

---

# SQLite-backed Durable Objects

2024 年 GA。各 object が **埋め込み SQLite DB** を持つ。

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### スペック
<v-clicks>

- **ストレージ**: object あたり最大 **10 GB** / **~1B rows**
- **レイテンシ**: ストレージが同一プロセス内 → クエリはマイクロ秒オーダー
- **Point-in-time recovery**: 過去 **30 日** の任意時点に復元可能
- **トランザクション**: object 内でシリアライザブル
- **API**: `ctx.storage.sql` から SQL を発行

</v-clicks>

</div>
<div>

### Data Platform での用途
<v-clicks>

- **テナント別メタデータ**: 1 tenant = 1 object で分離
- **カタログキャッシュ**: R2 Data Catalog のメタデータを手前でキャッシュ
- **セッション集計**: Ingest 前段で小規模な window 集計
- **イベントソーシング**: 1 entity の state + event log を同居

</v-clicks>

</div>
</div>

<v-click>

<div class="mt-4 text-sm opacity-80">
D1（リージョン固定の共有 DB）と違い、DO は <strong>エンティティごとに独立した DB</strong> を持つイメージ。tenant isolation が必要なワークロードに向く。
</div>

</v-click>

---

# Alarms と WebSocket Hibernation

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### Alarms — スケジュール実行
<v-clicks>

- `ctx.storage.setAlarm(ts)` で未来の時刻に wake up
- 失敗時は自動再試行（at-least-once）
- **用途**: 遅延バッチ集計 / ingest バッファのフラッシュ / 定期ポーリング

</v-clicks>

```ts {scale: 0.8}
await this.ctx.storage.setAlarm(
  Date.now() + 60_000,
);
async alarm() {
  await this.flushBufferToR2();
}
```

</div>
<div>

### WebSocket Hibernation
<v-clicks>

- 接続を維持したまま object を **ハイバネート** できる
- アイドル中は **課金されない**、メッセージ着信で自動 wake up
- **用途**: リアルタイム ingest の受付口 / ライブダッシュボードの配信

</v-clicks>

<v-click>

<div class="text-sm mt-4 opacity-80">
常時接続クライアント 1 万本 × アイドル時間 が、従来の WebSocket サーバーと桁違いの差になる。
</div>

</v-click>

</div>
</div>

---

# D1 / KV / R2 / Durable Objects の使い分け

| | D1 | KV | R2 | Durable Objects |
|---|---|---|---|---|
| **形** | SQLite（リージョン固定） | Key-Value（最終的整合） | オブジェクトストア | object 単位の State + Logic |
| **整合性** | 強整合（単一 writer） | 最終的（書き込み反映に数秒） | 強整合 | 強整合（object 内シリアライズ） |
| **レイテンシ** | 数十 ms | 読み取り ~10ms（エッジキャッシュ） | 数十 ms | **object が active なら μs** |
| **容量** | 10 GB / DB | 値 25 MB / キー無制限 | 無制限 | 10 GB / object |
| **向いているもの** | 小規模トランザクション DB | 設定値 / FF / セッション | データレイク / アセット | **per-entity の state + 調停** |

<v-click>

**設計のコツ**: 「粒度」で選ぶ。グローバル共有の真実は D1/R2、エンティティ単位で隔離したい state は Durable Objects、キャッシュ的な値は KV。

</v-click>
