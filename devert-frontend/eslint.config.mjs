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

      // Catches `<Foo />` where Foo was never imported. NOT redundant with the
      // build: a missing component import is valid JavaScript, so `next build`
      // compiles and statically exports all 66 pages happily, and the failure
      // only surfaces as a runtime "Foo is not defined" ReferenceError the
      // moment a user reaches the branch that renders it - which can be a tab
      // nobody clicks during a smoke test. eslint core's own `no-undef` does
      // NOT cover this: it ignores JSX element names, which is exactly why
      // this separate rule exists. Verified clean across components/, app/ and
      // lib/ when enabled, so it starts as a guard, not a backlog.
      "react/jsx-no-undef": "error",

      // The broader half of the same guard, and the one that actually matters
      // more here: jsx-no-undef only inspects JSX ELEMENT names, so it misses
      // `icon={ShieldCheck}` (a component passed as a prop) and every plain
      // identifier - a renamed setState, a helper that moved file. Both of
      // those are valid JavaScript that compiles, exports statically, and then
      // throws a ReferenceError in front of a user.
      //
      // Enabling this found exactly one real latent crash on the way in
      // (campus-manage.jsx rendering <CampusEmptyState icon={ShieldCheck}> with
      // no such import) and zero false positives - eslint-config-next already
      // declares the browser/node globals, so window/document/process/console
      // resolve normally.
      "no-undef": "error",
    },
  },
]);

export default eslintConfig;
