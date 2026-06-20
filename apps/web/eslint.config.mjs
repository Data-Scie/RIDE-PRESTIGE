import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This rule's static analysis flags any setState reachable through a
      // .then()/.catch()/.finally() callback inside an effect — including
      // React's own documented fetch-on-mount pattern (the load().catch()
      // .finally() shape used throughout this codebase's portals). Until
      // the rule distinguishes that case, treat it as a warning rather than
      // a build-blocking error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
