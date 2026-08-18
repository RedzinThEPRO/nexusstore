/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0a0a12',
          800: '#0f0f1a',
          700: '#161624',
          600: '#1d1d2e',
          500: '#262638',
          400: '#3a3a52',
          300: '#5a5a78',
        },
        neon: {
          cyan: '#00e5ff',
          blue: '#3b82f6',
          green: '#22c55e',
          purple: '#a855f7',
          pink: '#ec4899',
          amber: '#f59e0b',
          red: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 255, 0.35)',
        'glow-sm': '0 0 10px rgba(0, 229, 255, 0.25)',
        card: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.35)' },
          '50%': { boxShadow: '0 0 32px rgba(0, 229, 255, 0.55)' },
        },
      },
    },
  },
  plugins: [],
}
