import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#fafaf8",
        ink: "#292524",
        blush: "#945565",
        cream: "#f5f1eb",
        sage: "#647568",
        champagne: "#b49360",
        rose: {
          50: "#faf3f4",
          100: "#f3e5e8",
          200: "#e8ccd2",
          300: "#d5a7b2",
          400: "#be8493",
          500: "#a56678",
          600: "#945565",
          700: "#7b4352",
          800: "#663b47",
          900: "#57353e",
          950: "#301b23",
        },
      },
      boxShadow: {
        soft: "0 2px 8px rgb(41 37 36 / 4%)",
        overlay: "0 12px 40px rgb(41 37 36 / 12%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
