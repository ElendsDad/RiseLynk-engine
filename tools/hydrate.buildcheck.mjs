// =============================================================================
// DoD item 2: prove the hydrated config compiles green under `npm run build`.
//
//   node tools/hydrate.buildcheck.mjs [snapshot.json]
//
// Hydrates the snapshot (default: the demo fixture), writes dist/hydrated/site.config.ts,
// then temporarily repoints the active-site seam (site.config.ts) at that hydrated config
// and runs a real `next build`. The seam is ALWAYS restored (finally), so the tree is left
// exactly as found: the committed seam keeps pointing at the curated demo. Generated output
// lives under dist/ (gitignored).
// =============================================================================

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { hydrate, lintConfig, serializeConfig, writeAssets } from "./hydrate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const snapshotPath = resolve(process.argv[2] || join(root, "examples/elevator-demo/publish-profile.snapshot.json"));
const seamPath = join(root, "site.config.ts");
const outdir = join(root, "dist/hydrated");

const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
// Bundle-aware: the snapshot's own dir is the bundle root; its sibling assets/ holds images.
const bundleDir = dirname(snapshotPath);
const { config, assets } = hydrate(snapshot, { bundleDir });

// Fail before touching the seam if the lint is not clean.
const { count, violations } = lintConfig(config);
if (violations.length) {
  console.error(`lint failed (${violations.length} across ${count} strings); aborting build check`);
  for (const v of violations) console.error(`  - [${v.rule}] "${v.match}" at ${v.path}`);
  process.exit(1);
}

mkdirSync(outdir, { recursive: true });
writeFileSync(
  join(outdir, "site.config.ts"),
  serializeConfig(config, { snapshotPath, schemaVersion: snapshot.schemaVersion, tenantSlug: snapshot.tenantSlug, approvedAt: snapshot.approvedAt }),
  "utf8",
);
// Resolve the bundle's mod-gallery images into public/mods so the emitted /mods/<file>
// paths render during the build. A v0.3.0 bare snapshot plans no assets (no-op).
const nAssets = writeAssets(assets, join(root, "public", "mods"));
console.log(`hydrated -> dist/hydrated/site.config.ts (${count} strings, 0 lint violations, ${nAssets} image(s) -> public/mods)`);

const originalSeam = readFileSync(seamPath, "utf8");
let ok = false;
try {
  writeFileSync(
    seamPath,
    '// TEMPORARY (hydrate.buildcheck.mjs): points the seam at the hydrated demo config for a\n' +
      '// build-green proof. Restored automatically when the check finishes.\n' +
      'export { site } from "@/dist/hydrated/site.config";\n',
    "utf8",
  );
  console.log("seam repointed at hydrated config; running `npm run build`...\n");
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  ok = true;
} finally {
  writeFileSync(seamPath, originalSeam, "utf8");
  console.log("\nseam restored to the committed demo.");
}
console.log(ok ? "BUILD GREEN: hydrated config compiled." : "BUILD FAILED.");
process.exit(ok ? 0 : 1);
