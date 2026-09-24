/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        exhale: {
          bg: '#050814',
          surface: '#0b1b3d',
          text: '#e6e6ff',
          muted: '#8e98b0',
          blue: '#6b7bff',
          lavender: '#a78bfa',
          violet: '#7c6e9f',
          glow: 'rgba(167, 139, 250, 0.2)',
          border: 'rgba(107, 123, 255, 0.25)',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        cosmic: '0.38em',
        spacious: '0.22em',
      },
    },
  },
  plugins: [],
}
