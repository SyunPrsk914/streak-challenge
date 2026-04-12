/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },
                   to:   { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' },
                   to:   { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
