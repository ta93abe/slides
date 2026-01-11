---
theme: seriph
background: https://cover.sli.dev
title: React Server Components実践ガイド
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# React Server Components実践ガイド

RSCを使ったパフォーマンス最適化とアーキテクチャ設計

---

# 目次

- Server Components とは
- Client Components との使い分け
- データフェッチパターン
- パフォーマンス最適化

---

# Server Components とは

- サーバーサイドでのみレンダリング
- バンドルサイズゼロ
- データベースに直接アクセス可能

```tsx
async function UserList() {
  const users = await db.query('SELECT * FROM users');
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

---

# 使い分けの基準

| Server Components | Client Components |
|------------------|-------------------|
| データフェッチ | インタラクティブUI |
| 静的コンテンツ | useState/useEffect |
| 機密情報へのアクセス | ブラウザAPI |

---
layout: center
class: text-center
---

# ありがとうございました
