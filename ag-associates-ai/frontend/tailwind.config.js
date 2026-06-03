/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0A0A0A',
        'dark-card': '#121212',
        'dark-border': '#1F1F1F',
        'accent-blue': '#3b82f6',
        'accent-purple': '#8b5cf6',
        'accent-green': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-orange': '#f97316',
        'gold': {
          50: '#FFF9E6',
          100: '#FFF0C2',
          200: '#FFE099',
          300: '#FFD070',
          400: '#D4AF37', // Primary gold
          500: '#B8860B', // Dark gold
          600: '#996515',
          700: '#7A4F10',
          800: '#5C3A0B',
          900: '#3D2606',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37, #B8860B)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 3s',
        'ping': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      boxShadow: {
        'gold': '0 4px 16px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 8px 24px rgba(212, 175, 55, 0.4)',
      },
    },
  },
  plugins: [],
}
