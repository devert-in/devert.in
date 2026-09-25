// A single-rule ESLint config used only by scripts/check-undef.
//
// It exists because `next build` does NOT catch an identifier that is
// referenced at RENDER time but never defined - the module compiles, and the
// page throws only when the component mounts. That is exactly how a deleted
// helper (withJoinCta) shipped past a clean production build.
import globals from "globals";

export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node, React: "readonly" },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { "no-undef": "error" },
  },
];
