---
theme: seriph
background: https://cover.sli.dev
title: モダンTypeScript入門
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# モダンTypeScript入門

TypeScript 5.x の新機能と実践的な型活用術

---

# 目次

- TypeScript 5.x の新機能
- satisfies オペレータ
- const 型パラメータ
- デコレータの正式サポート

---

# satisfies オペレータ

```ts
const config = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>;
```

型推論を保持しながら型チェックが可能に

---

# const 型パラメータ

```ts
function createConfig<const T>(config: T) {
  return config;
}

const config = createConfig({
  routes: ['/', '/about'],
});
// routes: readonly ['/', '/about']
```

---
layout: center
class: text-center
---

# ありがとうございました
