/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        arabic: ['"Cairo"', '"Noto Sans Arabic"', 'sans-serif']
      }
    }
  },
  plugins: []
};
