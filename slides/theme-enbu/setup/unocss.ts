import { defineUnoSetup } from '@slidev/types'

export default defineUnoSetup(() => ({
  theme: {
    colors: {
      // Cloudflare orange
      primary: {
        DEFAULT: '#F6821F',
        light: '#FFA94D',
        dark: '#D4690A',
      },
      // Flame red accent
      accent: {
        DEFAULT: '#E03E1A',
        light: '#F25C3A',
        dark: '#991F05',
      },
      // Flame core gold
      gold: {
        DEFAULT: '#FFCC66',
        light: '#FFEBB3',
        dark: '#E6A830',
      },
      // Background
      surface: {
        DEFAULT: '#1A120E',
        light: '#2A1E18',
        dark: '#0D0907',
      },
      // Text
      text: {
        DEFAULT: '#F5F0EB',
        muted: '#8B7B6E',
        dim: '#5C4F44',
      },
    },
  },
}))
