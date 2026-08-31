/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f1e2",
        panel: "#fffdf8",
        ink: "#3a2c1e",
        "ink-soft": "#7c6c53",
        gold: "#c9974f",
        "gold-deep": "#8a5f2e",
        "green-1": "#7ba869",
        "green-2": "#4c7a3f",
        "green-deep": "#3a5c30",
        maroon: "#8a3232",
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        ruqaa: ["Aref Ruqaa", "serif"],
      },
      keyframes: {
        fadeSlide: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-slide": "fadeSlide .28s ease",
      },
    },
  },
  plugins: [],
  corePlugins: { preflight: false }, // keep legacy.css authoritative, see apps/public for rationale
};