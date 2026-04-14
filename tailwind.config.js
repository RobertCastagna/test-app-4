/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F17",
        card: "#141A24",
        cardAlt: "#1B2231",
        accent: "#16B3A6",
        accentDim: "#0F7A71",
        win: "#4ADE80",
        loss: "#F87171",
        muted: "#6B7280",
        fg: "#E5E7EB",
        fgDim: "#9CA3AF",
      },
      fontFamily: {
        mono: ["Menlo"],
      },
    },
  },
  plugins: [],
};
