/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#EEF1F6",
          100: "#DCE2ED",
          300: "#8C9AB8",
          500: "#3D4C6B",
          700: "#232F47",
          900: "#16233D",
          950: "#0D1526",
        },
        paper: "#F7F5EF",
        marigold: {
          50: "#FDF3E2",
          200: "#F3CE8F",
          400: "#E8A33D",
          600: "#C77F1F",
        },
        signal: {
          400: "#D45F53",
          600: "#C1443A",
        },
        moss: {
          400: "#6D9A7F",
          600: "#4C7A5E",
        },
        slate2: "#5B6472",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono2: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
