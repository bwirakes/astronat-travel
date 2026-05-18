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
    "archive/**",
    "node_modules/**",
    // Project-specific ignores:
    // Sub-worktrees each contain a full copy of the app — linting them
    // multiplies issue counts by ~10×. Lint the canonical checkout only.
    ".claude/worktrees/**",
    ".worktrees/**",
    // Generated geodetic ephemeris data.
    "app/lib/geodetic/generated/**",
    // Coverage / test artifact outputs.
    "**/coverage/**",
    "**/__tests__/**/*-report.md",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
