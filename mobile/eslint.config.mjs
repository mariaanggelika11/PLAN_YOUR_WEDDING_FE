import parser from "@typescript-eslint/parser";
import typescript from "@typescript-eslint/eslint-plugin";
import hooks from "eslint-plugin-react-hooks";
export default [
  {
    ignores: ["node_modules/**", "android/**", "ios/**", "dist*/**", "artifacts/**", "coverage/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}", "App.tsx", "index.ts"],
    languageOptions: {
      parser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "@typescript-eslint": typescript, "react-hooks": hooks },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^React$" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
