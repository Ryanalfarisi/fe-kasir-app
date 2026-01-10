/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007aff',
          hover: '#0056b3',
        },
        danger: {
          DEFAULT: '#ff3b30',
        },
        bg: {
          page: '#f5f5f7',
          card: '#ffffff',
        },
        text: {
          main: '#1d1d1f',
          muted: '#86868b',
        },
        border: '#d2d2d7',
      }
    },
  },
  plugins: [],
}
