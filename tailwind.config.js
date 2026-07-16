/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#141a22',
          900: '#1b232e',
          800: '#242f3d',
          700: '#314052',
          600: '#41556d',
        },
        parchment: {
          50: '#faf5e8',
          100: '#f3ead4',
          200: '#e9dbb9',
          300: '#dcc797',
        },
        brass: {
          400: '#c9a86a',
          500: '#b08d57',
          600: '#8f6f40',
        },
        rail: {
          500: '#c34a36',
          600: '#a63a28',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
