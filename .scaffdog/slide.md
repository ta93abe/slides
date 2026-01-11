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
    "@slidev/theme-default": "latest",
    "@slidev/theme-seriph": "latest",
    "vue": "^3.5.14"
  }
}
```

# `{{ inputs.name }}/slides.md`

```markdown
---
theme: seriph
background: https://cover.sli.dev
title: {{ inputs.title }}
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# {{ inputs.title }}

{{ inputs.description }}

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
