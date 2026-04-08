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
          black:       '#030303',
          dark:        '#0A0A0A',
          surface:     '#111111',
          surface2:    '#1A1A1A',
          surface3:    '#222222',
          border:      '#272727',
          'border-2':  '#333333',
          silver:      '#C4C4C4',
          chrome:      '#E8E8E8',
          muted:       '#636363',
          'muted-2':   '#4A4A4A',
          gold:        '#C4A050',
          'gold-light':'#D4B870',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'silver-gradient': 'linear-gradient(135deg, #555 0%, #C8C8C8 50%, #555 100%)',
        'gold-gradient':   'linear-gradient(135deg, #7A5F1E 0%, #D4B870 50%, #7A5F1E 100%)',
        'hero-glow':       'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(200,200,200,0.07) 0%, transparent 65%)',
        'card-highlight':  'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 60%)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        'bar-wave': {
          '0%, 100%': { transform: 'scaleY(0.25)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',    opacity: '0.7' },
          '60%':  { transform: 'scale(1.14)', opacity: '0.25' },
          '100%': { transform: 'scale(1)',    opacity: '0.7' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(200,200,200,0.12)' },
          '50%':      { borderColor: 'rgba(200,200,200,0.40)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in-fast':   'fade-in-fast 0.25s ease-out forwards',
        'fade-in-delay':  'fade-in 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-delay2': 'fade-in 0.5s 0.30s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-delay3': 'fade-in 0.5s 0.45s cubic-bezier(0.16,1,0.3,1) both',
        shimmer:          'shimmer 2.5s linear infinite',
        'bar-1':          'bar-wave 1.1s 0.00s ease-in-out infinite',
        'bar-2':          'bar-wave 1.1s 0.12s ease-in-out infinite',
        'bar-3':          'bar-wave 1.1s 0.24s ease-in-out infinite',
        'bar-4':          'bar-wave 1.1s 0.36s ease-in-out infinite',
        'bar-5':          'bar-wave 1.1s 0.48s ease-in-out infinite',
        'pulse-ring':     'pulse-ring 2.2s ease-in-out infinite',
        'slide-up':       'slide-up 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'border-glow':    'border-glow 2.5s ease-in-out infinite',
        float:            'float 4s ease-in-out infinite',
        'spin-slow':      'spin-slow 8s linear infinite',
      },
      boxShadow: {
        /* Layered depth shadows — use sparingly */
        'card':        '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 2px 12px rgba(0,0,0,0.5)',
        'card-hover':  '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 6px 24px rgba(0,0,0,0.7)',
        'glow-silver': '0 0 16px rgba(196,196,196,0.12)',
        'glow-gold':   '0 0 16px rgba(196,160,80,0.16)',
        'focus':       '0 0 0 2px rgba(196,196,196,0.25)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
