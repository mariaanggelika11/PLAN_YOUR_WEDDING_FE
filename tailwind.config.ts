import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d2939",
        blush: "#b86b77",
        cream: "#fbf7f2",
        sage: "#718276",
        champagne: "#c9a46c",
      },
      boxShadow: { soft: "0 18px 50px rgba(73, 52, 59, .10)" },
    },
  },
  plugins: [],
} satisfies Config;
