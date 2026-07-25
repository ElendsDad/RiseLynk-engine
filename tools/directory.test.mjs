// Gate: dense directory section (lib absent-field / schema surface + CSS).
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

console.log("# directory section");

const schema = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
ok("SectionType includes directory", /\|\s*"directory"/.test(schema));
ok("DirectoryItem interface present", schema.includes("export interface DirectoryItem"));
ok("directoryItems field on Section", schema.includes("directoryItems?: DirectoryItem[]"));

const renderer = readFileSync(join(ROOT, "components", "SectionRenderer.tsx"), "utf8");
ok("SectionRenderer maps directory", renderer.includes("directory: Directory"));
ok("Directory component imported", renderer.includes('sections/Directory'));

const cmp = readFileSync(join(ROOT, "components", "sections", "Directory.tsx"), "utf8");
ok("Directory component exists", cmp.includes("export default function Directory"));
ok("renders directory__item", cmp.includes("directory__item"));
ok("skips when no items", cmp.includes("if (!items.length) return null"));

const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
ok("dense grid class present", css.includes(".directory"));
ok("dense minmax tighter than records", css.includes("minmax(200px, 1fr)") || css.includes("minmax(180px, 1fr)"));
ok("compact padding class", css.includes(".directory__item"));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
