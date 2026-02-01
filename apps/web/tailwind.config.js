/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Static fallback colors - actual theming done via CSS variables directly
        background: '#0C1222',
        surface: '#1A2744',
        'surface-light': '#2D3F5F',
        primary: '#0EA5E9',
        'primary-light': '#38BDF8',
        secondary: '#7DD3FC',
        accent: '#F97316',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};
