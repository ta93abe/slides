---
theme: seriph
background: https://cover.sli.dev
title: Cloudflare Workers入門
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Cloudflare Workers入門

エッジコンピューティングで実現する高速Webアプリケーション

---

# 目次

- Cloudflare Workers とは
- V8 Isolates の仕組み
- Workers KV / D1 / R2
- デプロイと運用

---

# Cloudflare Workers とは

- 世界300以上のエッジロケーション
- コールドスタートなし（0ms）
- JavaScriptランタイム

```ts
export default {
  async fetch(request: Request) {
    return new Response('Hello from the Edge!');
  },
};
```

---

# ストレージオプション

| サービス | 用途 |
|---------|------|
| KV | キーバリューストア |
| D1 | SQLiteデータベース |
| R2 | オブジェクトストレージ |
| Durable Objects | ステートフル処理 |

---
layout: center
class: text-center
---

# ありがとうございました
