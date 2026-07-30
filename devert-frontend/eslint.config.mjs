import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // DeVert's own terminal/hacker design language deliberately renders
      // "// {label}" as real, visible UI text (welcome-banner.jsx's
      // "// {greeting()}, @{handle}", admin section headers like
      // "// add mission", etc. - see CLAUDE.md's Design System section on
      // font-mono terminal chrome) - these are never accidentally-unwrapped
      // code comments, so this rule is a blanket false positive here rather
      // than something to fix call-site by call-site (confirmed by sampling
      // across every affected file before disabling).
      "react/jsx-no-comment-textnodes": "off",
    },
  },
]);

export default eslintConfig;
