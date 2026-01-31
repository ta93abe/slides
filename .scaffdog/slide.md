---
name: 'slide'
root: '.'
output: '**/*'
questions:
  name:
    message: 'プロジェクト名（例: event-name-2025-01-01）'
  title:
    message: 'スライドのタイトル'
  date:
    message: '発表日（YYYY-MM-DD）'
  description:
    message: 'スライドの説明'
---

# `{{ inputs.name }}/package.json`

```json
{
  "name": "{{ inputs.name }}",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "slidev build",
    "dev": "slidev --open",
    "export": "slidev export"
  },
  "slidev": {
    "title": "{{ inputs.title }}",
    "date": "{{ inputs.date }}",
    "description": "{{ inputs.description }}"
  },
  "dependencies": {
    "@slidev/cli": "^51.8.0",
    "slidev-theme-ta93abe": "workspace:*",
    "vue": "^3.5.14"
  }
}
```

# `{{ inputs.name }}/slides.md`

```markdown
---
theme: ta93abe
title: {{ inputs.title }}
drawings:
  persist: false
transition: slide-left
mdc: true
layout: cover
---

# {{ inputs.title }}

{{ inputs.description }}

<template v-slot:footer>
{{ inputs.date }}
</template>

---

# 目次

- トピック1
- トピック2
- トピック3

---

# トピック1

内容をここに記述

---

# トピック2

内容をここに記述

---

# まとめ

- ポイント1
- ポイント2
- ポイント3

---
layout: center
class: text-center
---

# ありがとうございました

```

# `{{ inputs.name }}/.gitignore`

```
node_modules
.DS_Store
dist
*.local
.vite-inspect
.remote-assets
components.d.ts
```

# `{{ inputs.name }}/.npmrc`

```
# for pnpm
shamefully-hoist=true
auto-install-peers=true
```
