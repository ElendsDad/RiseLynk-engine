// Gate: neutral featureMatrix section + shared matrix cell helpers.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { normalizeMatrixCells, matrixCellDisplay } = await import(
  "file://" + join(ROOT, "lib", "matrix-cells.mjs")
);

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

console.log("# matrix-cells");
ok(
  "pads short arrays",
  JSON.stringify(normalizeMatrixCells([true], 3)) === JSON.stringify([true, "", ""]),
);
ok(
  "truncates long arrays",
  JSON.stringify(normalizeMatrixCells([true, false, "x", "y"], 2)) === JSON.stringify([true, false]),
);
ok("never throws on null cells", JSON.stringify(normalizeMatrixCells(null, 2)) === JSON.stringify(["", ""]));
ok("yes display", matrixCellDisplay(true).kind === "yes");
ok("no display empty text", matrixCellDisplay(false).text === "");
ok("string display verbatim", matrixCellDisplay("Custom").text === "Custom");

console.log("\n# schema + component");
const schema = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
ok("SectionType includes featureMatrix", /\|\s*"featureMatrix"/.test(schema));
ok("FeatureMatrixRow interface", schema.includes("export interface FeatureMatrixRow"));
ok("matrixColumns field", schema.includes("matrixColumns?: string[]"));
ok("matrixRows field", schema.includes("matrixRows?: FeatureMatrixRow[]"));
const fmCmp = readFileSync(join(ROOT, "components", "sections", "FeatureMatrix.tsx"), "utf8");
ok("no FieldBoss hardcode in component", !/FieldBoss/i.test(fmCmp));

const renderer = readFileSync(join(ROOT, "components", "SectionRenderer.tsx"), "utf8");
ok("SectionRenderer maps featureMatrix", renderer.includes("featureMatrix: FeatureMatrix"));

const cmp = readFileSync(join(ROOT, "components", "sections", "FeatureMatrix.tsx"), "utf8");
ok("skips when no columns/rows", cmp.includes("if (!columns.length || !rows.length) return null"));
ok("renders table.matrix", cmp.includes('className="matrix"'));

const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
ok("matrix CSS present", css.includes(".matrix"));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
