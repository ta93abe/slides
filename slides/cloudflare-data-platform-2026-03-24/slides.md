---
theme: seriph
background: https://cover.sli.dev
title: Cloudflare Data Platform
class: text-center
drawings:
  persist: false
transition: slide-left
comark: true
---

# Cloudflare Data Platform

Cloudflare Data Platformの紹介

---

# 目次

- Cloudflare Data Platformとは
- 主要サービス
- D1 - SQLiteベースのデータベース
- KV - Key-Valueストア
- R2 - オブジェクトストレージ
- Hyperdrive - データベースアクセラレータ
- まとめ

---

# Cloudflare Data Platformとは

Cloudflareが提供するデータストレージ・管理サービス群

- エッジで動作する**グローバル分散**データストア
- Workers との**ネイティブ統合**
- 用途に応じた複数のストレージオプション

---

# 主要サービス

| サービス | 種類 | ユースケース |
|---|---|---|
| **D1** | リレーショナルDB (SQLite) | 構造化データ、トランザクション |
| **KV** | Key-Valueストア | 設定値、キャッシュ、セッション |
| **R2** | オブジェクトストレージ | ファイル、画像、動画 |
| **Hyperdrive** | DBアクセラレータ | 既存DB接続の高速化 |
| **Vectorize** | ベクトルDB | AI/ML、セマンティック検索 |
| **Queues** | メッセージキュー | 非同期処理、イベント駆動 |

---

# D1 - SQLiteベースのデータベース

エッジで動作するサーバーレスSQLデータベース

```ts
export default {
  async fetch(request, env) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(1).all()

    return Response.json(results)
  }
}
```

- SQLiteの軽量さとCloudflareのグローバルネットワークを組み合わせ
- **Time Travel**: 過去の任意の時点にデータを復元可能

---

# KV - Key-Valueストア

グローバルに分散された低レイテンシのKey-Valueストア

```ts
// 書き込み
await env.MY_KV.put('user:123', JSON.stringify({ name: 'Alice' }))

// 読み取り
const user = await env.MY_KV.get('user:123', { type: 'json' })
```

- **結果整合性**モデル（書き込みから読み取りまで最大60秒）
- 読み取りが多いワークロードに最適
- TTL（有効期限）サポート

---

# R2 - オブジェクトストレージ

S3互換のオブジェクトストレージ（エグレス料金なし）

```ts
// アップロード
await env.MY_BUCKET.put('images/photo.jpg', imageData)

// ダウンロード
const object = await env.MY_BUCKET.get('images/photo.jpg')
```

- **エグレス料金ゼロ** — データ転送コストを気にせず利用可能
- S3互換API — 既存ツール・SDKがそのまま使える
- Workers からのバインディングで直接アクセス

---

# Hyperdrive - データベースアクセラレータ

既存のPostgreSQLへの接続を高速化

```ts
export default {
  async fetch(request, env) {
    const sql = postgres(env.HYPERDRIVE.connectionString)
    const results = await sql`SELECT * FROM products LIMIT 10`

    return Response.json(results)
  }
}
```

- コネクションプーリングで接続オーバーヘッドを削減
- クエリ結果のキャッシュ
- 既存DBをそのまま活用しつつエッジの恩恵を受けられる

---

# まとめ

- Cloudflare Data Platformは**用途に応じた多様なストレージ**を提供
- すべてが**Workersとネイティブ統合**されエッジで動作
- **エグレス料金なし**（R2）や**グローバル分散**（KV）など独自の強み
- 既存インフラとの共存も可能（Hyperdrive）

---
layout: center
class: text-center
---

# ありがとうございました
