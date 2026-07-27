// Flat ESLint config so `npm run lint` runs non-interactively (no `next lint`
// setup prompt). Wraps Next 15's stock `next/core-web-vitals` (the classic
// Strict preset the interactive prompt offered) via FlatCompat — that package
// still ships eslintrc shape on this Next line.
//
// Deliberately NOT enabling `next/typescript` here: a one-shot enablement
// surfaces errors/warnings across next.config.ts and tools/ that this gate-
// repair job must not mass-fix. Follow-up can add it and clear findings.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "out/**",
      "public/**",
      ".a11y-results/**",
      ".a11y-baselines/**",
      ".git-worktrees/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
