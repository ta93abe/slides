import { defineUnoSetup } from '@slidev/types'

export default defineUnoSetup(() => ({
  theme: {
    colors: {
      // 朱色 — 炎の中心
      primary: {
        DEFAULT: '#D4690A',
        light: '#E8913A',
        dark: '#A34D00',
      },
      // 深紅 — 炎の根元
      accent: {
        DEFAULT: '#8B2500',
        light: '#B23817',
        dark: '#5C1800',
      },
      // 琥珀 — 炎の芯
      gold: {
        DEFAULT: '#D4A04A',
        light: '#E8C888',
        dark: '#B8862E',
      },
      // 焦茶の闇
      surface: {
        DEFAULT: '#1E150F',
        light: '#2E2118',
        dark: '#110C08',
      },
      // 和紙のような文字色
      text: {
        DEFAULT: '#E8DDD0',
        muted: '#8B7B6E',
        dim: '#5C4F44',
      },
    },
  },
}))
