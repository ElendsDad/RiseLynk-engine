// Gate: pricing comparisonRows matrix (teardown P2 2a) - additive under existing cards.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;
function ok(name, cond) {
  if (cond) {
    passed++;
    console.log("  ok  " + name);
  } else {
    failed++;
    console.log("  FAIL  " + name);
  }
}

console.log("# pricing comparison matrix");

const schema = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
ok("PricingComparisonRow interface", schema.includes("export interface PricingComparisonRow"));
ok("comparisonRows on Section", schema.includes("comparisonRows?: PricingComparisonRow[]"));
ok("PricingTier still has features[]", /export interface PricingTier[\s\S]*?features: string\[]/.test(schema));

const cmp = readFileSync(join(ROOT, "components", "sections", "Pricing.tsx"), "utf8");
ok("cards still render from tiers", cmp.includes('className="plans"'));
ok("matrix gated on comparisonRows", cmp.includes("comparisonRows") && cmp.includes("showMatrix"));
ok("absent matrix emits no table branch when empty", cmp.includes("showMatrix ?"));
ok("uses shared normalizeMatrixCells", cmp.includes("normalizeMatrixCells"));
ok("matrix--pricing class", cmp.includes("matrix--pricing"));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
