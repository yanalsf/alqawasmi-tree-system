/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // toggled by adding/removing "dark" on <html> — see Header.tsx
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
        // dark-mode equivalents (used via dark: variant)
        "paper-dark": "#161411",
        "panel-dark": "#221f1a",
        "ink-dark": "#f7f1e2",
        "ink-soft-dark": "#b0a187",
        "gold-dark": "#d6a863",
        "gold-deep-dark": "#b38545",
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        ruqaa: ["Aref Ruqaa", "serif"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(58,44,30,0.14)",
        "card-dark": "0 8px 24px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};