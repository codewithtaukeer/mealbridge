import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'forest-night': '#102D25',
        'bridge-green': '#1E5B43',
        'fresh-mint': '#B8F28B',
        'warm-ivory': '#F5F5EC',
        'harvest-gold': '#F4C978',
        'soft-coral': '#E9A28C',
        'primary-text': '#18372B',
        'muted-text': '#64756A',
        'glass-border': 'rgba(255, 255, 255, 0.28)',
        'glass-bg': 'rgba(255, 255, 255, 0.10)',
        'glass-bg-light': 'rgba(255, 255, 255, 0.65)',
        'glass-shadow': 'rgba(9, 35, 25, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'glass': '20px',
        'card': '16px',
        'button': '12px',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-heavy': '40px',
      },
      boxShadow: {
        'glass': '0 12px 36px rgba(9, 35, 25, 0.12)',
        'glass-sm': '0 4px 16px rgba(9, 35, 25, 0.08)',
        'glass-lg': '0 20px 60px rgba(9, 35, 25, 0.16)',
        'glass-inner': 'inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        'glow-mint': '0 0 40px rgba(184, 242, 139, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
