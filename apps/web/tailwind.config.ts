import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  // Theme mode (light/dark) is toggled by adding/removing the `dark` class on
  // <html>, driven by the time-of-day hook (or the manual override).
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Injected by next/font in the root layout.
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        // Space Grotesk — clearer, more technical display face.
        display: ['var(--font-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#0099FF', // logo primary
          cyan: '#33B5FF', // logo lighter blue (accent on dark)
          green: '#00A651', // logo secondary
          red: '#FF3333', // logo tertiary
          navy: '#0A1626', // deep night base
        },
      },
      keyframes: {
        'signal-flow': {
          to: { strokeDashoffset: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
