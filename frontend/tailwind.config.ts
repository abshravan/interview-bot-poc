import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        benz: {
          black:    '#030303',
          dark:     '#0D0D0D',
          surface:  '#141414',
          surface2: '#1E1E1E',
          border:   '#2A2A2A',
          silver:   '#C8C8C8',
          chrome:   '#E8E8E8',
          muted:    '#6B6B6B',
          gold:     '#C4A050',
          'gold-light': '#D4B870',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'silver-gradient': 'linear-gradient(135deg, #666 0%, #D4D4D4 50%, #666 100%)',
        'gold-gradient':   'linear-gradient(135deg, #8A6E2A 0%, #D4B870 50%, #8A6E2A 100%)',
        'benz-surface':    'linear-gradient(145deg, #0D0D0D 0%, #161616 100%)',
        'hero-glow':       'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(200,200,200,0.08) 0%, transparent 70%)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'bar-wave': {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',   opacity: '0.8' },
          '50%':  { transform: 'scale(1.15)', opacity: '0.4' },
          '100%': { transform: 'scale(1)',   opacity: '0.8' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(200,200,200,0.15)' },
          '50%':      { borderColor: 'rgba(200,200,200,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.6s ease-out forwards',
        'fade-in-fast':   'fade-in-fast 0.3s ease-out forwards',
        'fade-in-delay':  'fade-in 0.6s 0.2s ease-out both',
        'fade-in-delay2': 'fade-in 0.6s 0.4s ease-out both',
        'fade-in-delay3': 'fade-in 0.6s 0.6s ease-out both',
        shimmer:          'shimmer 2s linear infinite',
        'bar-1':          'bar-wave 1.0s 0.0s ease-in-out infinite',
        'bar-2':          'bar-wave 1.0s 0.15s ease-in-out infinite',
        'bar-3':          'bar-wave 1.0s 0.30s ease-in-out infinite',
        'bar-4':          'bar-wave 1.0s 0.45s ease-in-out infinite',
        'bar-5':          'bar-wave 1.0s 0.60s ease-in-out infinite',
        'pulse-ring':     'pulse-ring 2s ease-in-out infinite',
        'count-up':       'count-up 0.5s ease-out forwards',
        'slide-in-left':  'slide-in-left 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'border-glow':    'border-glow 2s ease-in-out infinite',
        float:            'float 4s ease-in-out infinite',
      },
      boxShadow: {
        'benz-card':   '0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.6)',
        'benz-hover':  '0 0 0 1px rgba(200,200,200,0.2), 0 8px 32px rgba(0,0,0,0.8)',
        'silver-glow': '0 0 20px rgba(200,200,200,0.15)',
        'gold-glow':   '0 0 20px rgba(196,160,80,0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
