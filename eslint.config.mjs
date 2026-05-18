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

  // Codebase invariants enforced at write-time via lint rather than test.
  // Both rules are "warn" because the codebase has pre-existing call sites
  // (69 var(--sage) sites, 5 process.env.X! sites). Promoting to "error"
  // is appropriate once those are migrated. New PRs see the warnings in
  // CI annotations.
  {
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          // Deprecated brand token. Use --lift-accent / --lift-accent-soft.
          // Pattern matches both var(--sage) and var(--sage-soft) inside
          // any string literal — JSX style props, sx={...}, template
          // literals (when used as plain literals).
          selector: "Literal[value=/var\\(--sage(?:-soft)?\\)/]",
          message:
            "var(--sage)/var(--sage-soft) is deprecated (not in the brand book). " +
            "Use var(--lift-accent) or var(--lift-accent-soft) — see globals.css line ~52.",
        },
        {
          // process.env.X! crashes any environment that doesn't set X (CI,
          // local dev without .env). Replace with an explicit guard:
          //   const x = process.env.X;
          //   if (!x) return; // or throw, with a clearer message
          selector:
            "TSNonNullExpression[expression.type='MemberExpression'][expression.object.type='MemberExpression'][expression.object.object.name='process'][expression.object.property.name='env']",
          message:
            "Don't non-null-assert on process.env.X — it crashes envs without the var set. " +
            "Read into a const, then guard with an explicit if-missing check.",
        },
      ],
    },
  },

  // The rule above references the literal "var(--sage)" inside its own
  // message string, which would otherwise trip the rule when linting this
  // file. Scope the self-reference out. (Override must come AFTER the rule
  // definition in flat config.)
  {
    files: ["eslint.config.mjs"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
]);

export default eslintConfig;
