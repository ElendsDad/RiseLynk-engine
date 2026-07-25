// Gate: mobile nav overflow fold (teardown P2 7c).
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

console.log("# mobile nav overflow");

const header = readFileSync(join(ROOT, "components", "Header.tsx"), "utf8");
ok("checkbox toggle present", header.includes('id="nav-menu"') && header.includes("nav-menu__check"));
ok("checkbox has accessible name (aria-label)", header.includes('aria-label="Open menu"'));
ok("checkbox aria-controls primary nav", header.includes('aria-controls="primary-nav"'));
ok("label toggle present", header.includes("nav-menu__toggle"));
ok("sr-only Menu label", header.includes("Menu"));
ok("primary nav id for aria-controls pairing", header.includes('id="primary-nav"'));
ok("no-JS (no menu script required)", !header.includes("navMenuJs"));

const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
ok("toggle hidden on wide viewports by default", css.includes(".nav-menu__toggle") && css.includes("display: none"));
ok("toggle shown under 720px", /@media \(max-width: 720px\)[\s\S]*\.nav-menu__toggle[\s\S]*display:\s*inline-flex/.test(css));
ok("nav hidden until checked on mobile", css.includes(".nav-menu__check:checked ~ .nav"));
ok("condense rules still present", css.includes(".site-header--condense"));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
