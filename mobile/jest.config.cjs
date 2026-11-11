module.exports = {
  preset: "jest-expo/android",
  testMatch: ["<rootDir>/tests/**/*.native.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/android/"],
  moduleNameMapper: { "^lucide-react-native$": require.resolve("lucide-react-native") },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|expo|@expo|lucide-react-native))",
  ],
};
