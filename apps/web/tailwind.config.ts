import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sauce Labs Style Reference Tokens
        'obsidian-shell': '#132322',
        'pure-white': '#ffffff',
        'mint-frost': '#edf7f5',
        'deep-abyss': '#0e1a19',
        'charcoal': '#070f0f',
        'fog-border': '#d0d3d3',
        'stone-border': '#b2b6b4',
        'slate-text': '#828786',
        'graphite-fill': '#424f4f',
        'pure-black': '#000000',
        'neon-pulse': '#3ddc91',
        'mint-whisper': '#97ddbc',
        'signal-yellow': '#ffcd48',

        // Brand Aliases & Compatibility
        'forest-night': '#132322',
        'bridge-green': '#1a3331',
        'fresh-mint': '#3ddc91',
        'warm-ivory': '#132322',
        'harvest-gold': '#ffcd48',
        'soft-coral': '#e9705a',
        'primary-text': '#ffffff',
        'muted-text': '#828786',
        'glass-border': 'rgba(255, 255, 255, 0.12)',
        'glass-bg': 'rgba(14, 26, 25, 0.75)',
        'glass-bg-light': '#edf7f5',
        'glass-shadow': 'rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'pill': '56px',
        'button': '56px',
        'card': '20px',
        'large-card': '60px',
        'glass': '20px',
      },
      boxShadow: {
        'md': 'rgba(0, 0, 0, 0.04) 1px 0px 9px 2px',
        'neon': '0 0 20px rgba(61, 220, 145, 0.35)',
        'glass': '0 12px 36px rgba(0, 0, 0, 0.24)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.35)',
        'glow-mint': '0 0 30px rgba(61, 220, 145, 0.25)',
      },
      letterSpacing: {
        'eyebrow': '0.05em',
        'tight-body': '-0.08px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
