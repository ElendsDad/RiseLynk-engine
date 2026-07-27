// =============================================================================
// CONFIG LINT - the supported, stable entry point for the copy-discipline lint over a site
// config (v0.6.1, engine feedback item 7).
//
//   node tools/lint-config.mjs [config.(json|mjs|js)]
//   npm run lint:config
//
// Bare `npm run lint:config` (no args) is self-contained for the release-gate battery:
// it lints the elevator-demo publish-profile snapshot shipped in-tree. Pass an explicit
// path to lint any other .json/.mjs/.js config (hand-authored Kitsap configs, etc.).
//
// Both storefronts share ONE deterministic copy gate. The hydrator (tools/hydrate.mjs) runs
// this lint on every hydrated config; a hand-authored config (the Kitsap client-site path)
// runs the SAME lint through this module. Depend on THIS file's exports - not on the
// internals of hydrate.mjs - so the internal layout of the hydrator can change without
// breaking a consumer. This module is the contract.
//
// The lint enforces the engine copy discipline over 100 percent of a config's string leaves:
// no em/en dashes; none of "compliant" / "certified" / "inspection-ready" / "meets the
// standard" as affirmative claims; no guarantees; no marketing hype; and code-requirement
// wording hedged to the authority having jurisdiction.
//
// Exports (stable):
//   lintConfig(config)   -> { count, violations: [{ path, rule, match }] }
//   lintString(s)        -> [{ rule, match }]
//   collectStrings(node) -> [{ path, value }]
//   lintConfigFile(path) -> lintConfig applied to a config loaded from a .json/.mjs/.js file
// =============================================================================

import { readFileSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

// Re-export the lint primitives as the stable public surface. The implementation lives in
// hydrate.mjs (one source of truth for the gate); this module is the blessed import path.
import { lintConfig, lintString, collectStrings } from "./hydrate.mjs";
export { lintConfig, lintString, collectStrings };

// Load a config OBJECT from a file, then lint it. Supported inputs:
//   - .json        parsed directly (the config object itself)
//   - .mjs / .js   dynamically imported; the config is the `site` export (or default)
// A .ts config is loaded by the consumer's own TypeScript pipeline (which the Kitsap
// engine-build already has) and passed straight to lintConfig(); this loader stays
// dependency-free and does not transpile TypeScript. Returns lintConfig's result.
export async function lintConfigFile(file) {
  const abs = resolve(file);
  const ext = extname(abs).toLowerCase();
  if (ext === ".json") {
    return lintConfig(JSON.parse(readFileSync(abs, "utf8")));
  }
  if (ext === ".mjs" || ext === ".js") {
    const mod = await import(pathToFileURL(abs).href);
    const config = mod.site ?? mod.default;
    if (!config) throw new Error(`no "site" or default export in ${file}`);
    return lintConfig(config);
  }
  throw new Error(
    `unsupported config extension "${ext}". Pass a .json/.mjs/.js file, or import ` +
      `{ lintConfig } from tools/lint-config.mjs and call it on a config object your own ` +
      `TypeScript pipeline already loaded (the .ts path).`,
  );
}

// In-tree fixture for the bare `npm run lint:config` release gate. Hand-authored
// .ts demos stay on the consumer TypeScript pipeline + lintConfig(); this CLI
// stays dependency-free and only loads .json/.mjs/.js.
const DEFAULT_CONFIG = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../examples/elevator-demo/publish-profile.snapshot.json",
);

async function runCli(argv) {
  const file = argv[0] || DEFAULT_CONFIG;
  if (!argv[0]) {
    console.log(`lint:config: no path given; using default ${file}`);
  }
  let result;
  try {
    result = await lintConfigFile(file);
  } catch (err) {
    console.error(`lint-config: ${err.message}`);
    console.error("Usage: node tools/lint-config.mjs [config.(json|mjs|js)]");
    process.exit(2);
  }
  const { count, violations } = result;
  if (violations.length) {
    console.error(`CONFIG LINT FAILED (${violations.length} violation(s) across ${count} strings):`);
    for (const v of violations) console.error(`  - [${v.rule}] "${v.match}" at ${v.path}`);
    process.exit(1);
  }
  console.log(`config lint clean: ${count} strings, 0 violations`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) runCli(process.argv.slice(2));
