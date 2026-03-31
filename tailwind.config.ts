import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#F6D44E',
          'yellow-light': '#FFE16A',
          'yellow-hover': '#E4C037',
          black: '#050816',
          white: '#F7F9FF',
          gray: '#111827',
          'gray-dark': '#D7DDF7',
          'gray-medium': '#93A0CA',
          'gray-light': '#6E7BA5',
        },
        night: {
          bg: '#050816',
          surface: '#0D1426',
          'surface-soft': '#121B31',
          border: '#27314C',
          ink: '#F7F9FF',
        },
        dark: {
          bg: '#050816',
          card: '#0D1426',
          border: '#27314C',
        },
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Inter', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'comic': '0 18px 44px rgba(0, 0, 0, 0.32)',
        'comic-sm': '0 12px 28px rgba(0, 0, 0, 0.22)',
        'comic-hover': '0 22px 52px rgba(0, 0, 0, 0.4)',
        'comic-active': '0 8px 18px rgba(0, 0, 0, 0.22)',
      },
    },
  },
  plugins: [],
}
export default config
