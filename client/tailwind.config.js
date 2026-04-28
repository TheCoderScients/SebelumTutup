/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#0d1016',
        panel: '#171b23',
        line: '#293241',
        ember: '#ff5a36',
        mint: '#44d6a8',
        aqua: '#46b4ff',
        violet: '#a78bfa',
        honey: '#fbbf24'
      },
      boxShadow: {
        glow: '0 18px 70px rgba(0, 0, 0, 0.35)',
        lift: '0 18px 55px rgba(0, 0, 0, 0.28)'
      }
    }
  },
  plugins: []
};
