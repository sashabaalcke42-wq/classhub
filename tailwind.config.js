/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg0: "#0a0b10",
        bg1: "#12141d",
        bg2: "#1a1d29",
        bg3: "#232635",
        line: "#2a2e40",
        txt0: "#eef0f7",
        txt1: "#aab0c4",
        txt2: "#6f7590",
        violet: "#7c5cfc",
        teal: "#00d9c0",
        danger: "#ff5470",
        gold: "#ffb454",
      },
    },
  },
  plugins: [],
};
