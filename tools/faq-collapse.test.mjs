// Gate: FAQ collapsible details variant (teardown P2 7b).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { styleVariantFor } = await import("file://" + join(ROOT, "lib", "style-variant.mjs"));

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

console.log("# faq collapse variant");

ok("faq honors collapse", styleVariantFor("faq", "collapse") === "collapse");
ok("absent style is null (flat path)", styleVariantFor("faq", undefined) === null);

const cmp = readFileSync(join(ROOT, "components", "sections", "Faq.tsx"), "utf8");
ok("uses styleVariantFor", cmp.includes("styleVariantFor"));
ok("details path present", cmp.includes("<details") && cmp.includes("<summary"));
ok("flat path still present", cmp.includes('className="faq__qa"') && cmp.includes("<div className=\"faq__qa\""));
ok("JSON-LD still emitted", cmp.includes("faqPageLd"));

const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
ok("faq--collapse CSS present", css.includes(".faq--collapse"));

const schema = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
ok("style union includes collapse", schema.includes('"collapse"'));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
