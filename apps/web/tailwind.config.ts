import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: 'var(--brand-blue)',
          cyan: 'var(--brand-cyan)',
          green: 'var(--brand-green)',
          red: 'var(--brand-red)',
          navy: 'var(--brand-navy)',
        },
        surface: {
          base: 'var(--surface-base)',
          card: 'var(--surface-card)',
          glass: 'var(--surface-glass)',
        },
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
      fontSize: {
        'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-2': ['3.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-3': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-1': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.625' }],
        'body': ['1rem', { lineHeight: '1.625' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'eyebrow': ['0.75rem', { lineHeight: '1', letterSpacing: '0.2em', fontWeight: '700' }],
        'label': ['0.75rem', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '600' }],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        button: 'var(--radius-button)',
        input: 'var(--radius-input)',
      },
      backdropBlur: {
        card: 'var(--backdrop-blur-card)',
        nav: 'var(--backdrop-blur-nav)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        premium: '0 8px 32px rgba(0,153,255,0.12), 0 2px 8px rgba(0,0,0,0.04)',
        glow: '0 0 40px rgba(0,153,255,0.15)',
      },
      backgroundImage: {
        'tech-grid': (
          'linear-gradient(rgba(0,153,255,0.04) 1px, transparent 1px),'
          + 'linear-gradient(90deg, rgba(0,153,255,0.04) 1px, transparent 1px)'
        ),
      },
      backgroundSize: {
        grid: '60px 60px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-16px) translateX(8px)' },
          '50%': { transform: 'translateY(-8px) translateX(-8px)' },
          '75%': { transform: 'translateY(-20px) translateX(4px)' },
        },
        'drift-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-12px) translateX(-12px)' },
          '66%': { transform: 'translateY(8px) translateX(8px)' },
        },
        'drift-reverse': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(18px) translateX(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        'float-3d': {
          '0%, 100%': { transform: 'translateY(0) translateZ(0) rotateX(0deg)' },
          '50%': { transform: 'translateY(-15px) translateZ(30px) rotateX(3deg)' },
        },
        'tilt-in': {
          '0%': { opacity: '0', transform: 'perspective(800px) rotateX(15deg) rotateY(-10deg) translateY(30px)' },
          '100%': { opacity: '1', transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)' },
        },
        'card-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,153,255,0.08)' },
          '50%': { boxShadow: '0 0 30px rgba(0,153,255,0.16)' },
        },
        'data-flow': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        drift: 'drift 8s ease-in-out infinite',
        'drift-slow': 'drift-slow 12s ease-in-out infinite',
        'drift-reverse': 'drift-reverse 10s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-3d': 'float-3d 5s ease-in-out infinite',
        'tilt-in': 'tilt-in 0.7s ease-out both',
        'card-glow': 'card-glow 4s ease-in-out infinite',
        'data-flow': 'data-flow 3s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
