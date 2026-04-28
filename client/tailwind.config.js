/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#111318',
        panel: '#181c22',
        line: '#2b313b',
        ember: '#ff5a36',
        mint: '#44d6a8',
        aqua: '#46b4ff'
      },
      boxShadow: {
        glow: '0 18px 70px rgba(0, 0, 0, 0.35)'
      }
    }
  },
  plugins: []
};
