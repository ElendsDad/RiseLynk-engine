// =============================================================================
// Gate: /llms.txt emergency tip is config-driven and trade-neutral in the engine.
//
//   node tools/llms-emergency.test.mjs
//
// Proves:
//   - the engine source never hardcodes elevator (or other vertical) emergency copy
//     in lib/llms.ts (the leak that put "stopped elevator" on every trade site);
//   - buildLlmsTxt emits the tip only when callBar.enabled + phone + emergencyContext
//     are all present;
//   - missing emergencyContext is silence (no invented vertical claim);
//   - elevator-demo still gets its tip via config.emergencyContext.
// =============================================================================

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// Transpile lib/llms.ts (and its local .ts imports) just enough to exercise
// buildLlmsTxt in plain Node. TypeScript is already a repo dep.
const require = createRequire(import.meta.url);
const ts = require("typescript");

async function loadBuildLlmsTxt() {
  const tmp = mkdtempSync(join(tmpdir(), "llms-emergency-"));
  try {
    // Stub the local modules llms.ts imports so we do not need the full app graph.
    writeFileSync(
      join(tmp, "services.mjs"),
      "export function allServiceLines() { return []; }\n",
    );
    writeFileSync(
      join(tmp, "area-ld.mjs"),
      "export function collectServiceAreas() { return []; }\n" +
        "export function areasLine() { return null; }\n",
    );
    writeFileSync(
      join(tmp, "hours-ld.mjs"),
      "export function hoursLine() { return null; }\n",
    );
    writeFileSync(join(tmp, "config-schema.ts"), "export {};\n");

    const src = readFileSync(join(ROOT, "lib", "llms.ts"), "utf8")
      .replace(/from "\.\/config-schema"/g, 'from "./config-schema.ts"')
      .replace(/from "\.\/services"/g, 'from "./services.mjs"')
      .replace(/from "\.\/area-ld\.mjs"/g, 'from "./area-ld.mjs"')
      .replace(/from "\.\/hours-ld\.mjs"/g, 'from "./hours-ld.mjs"');

    const js = ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      },
    }).outputText;
    writeFileSync(join(tmp, "llms.mjs"), js, "utf8");
    const mod = await import(pathToFileURL(join(tmp, "llms.mjs")).href + `?t=${Date.now()}`);
    return { buildLlmsTxt: mod.buildLlmsTxt, tmp };
  } catch (err) {
    rmSync(tmp, { recursive: true, force: true });
    throw err;
  }
}

const baseSite = {
  business: {
    name: "Acme Trade Co",
    email: "office@acme.example",
    phone: "(360) 555-0100",
    hours: "Mon to Fri 8am to 5pm",
  },
  seo: { domain: "https://acme.example" },
  pages: [{ sections: [] }],
  callBar: { enabled: true },
};

let failed = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failed++;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const llmsSrc = readFileSync(join(ROOT, "lib", "llms.ts"), "utf8");
check(
  "lib/llms.ts has no hardcoded elevator emergency copy",
  !/stopped elevator/i.test(llmsSrc) && !/stuck in (a |an )?elevator/i.test(llmsSrc),
);
check(
  "lib/llms.ts keys the tip on emergencyContext",
  /emergencyContext/.test(llmsSrc) && /needs help with/.test(llmsSrc),
);

const { buildLlmsTxt, tmp } = await loadBuildLlmsTxt();
try {
  const silent = buildLlmsTxt(baseSite);
  check(
    "callBar + phone without emergencyContext emits silence (no tip)",
    !/number to call is/i.test(silent),
    silent,
  );
  check("silent path still has the AI notes header", /## Notes for AI assistants/.test(silent));

  const withCtx = buildLlmsTxt({
    ...baseSite,
    callBar: { enabled: true, emergencyContext: "a burst pipe or a water emergency" },
  });
  check(
    "configured emergencyContext emits the trade-neutral frame",
    withCtx.includes(
      "- If someone needs help with a burst pipe or a water emergency, the number to call is (360) 555-0100.",
    ),
  );
  check("configured tip never says elevator", !/elevator/i.test(withCtx));

  const noBar = buildLlmsTxt({
    ...baseSite,
    callBar: { enabled: false, emergencyContext: "a burst pipe" },
  });
  check("disabled callBar emits no tip even with context", !/number to call is/i.test(noBar));

  const blankCtx = buildLlmsTxt({
    ...baseSite,
    callBar: { enabled: true, emergencyContext: "   " },
  });
  check("whitespace-only emergencyContext is silence", !/number to call is/i.test(blankCtx));

  // Elevator-demo config: the tip comes from config, not the engine.
  const demoSrc = readFileSync(join(ROOT, "examples", "elevator-demo", "site.config.ts"), "utf8");
  check(
    "elevator-demo sets callBar.emergencyContext in config",
    /emergencyContext:\s*"a stopped elevator with someone inside"/.test(demoSrc),
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${failed ? "FAILED" : "PASSED"} (${failed} failure(s))`);
process.exit(failed ? 1 : 0);
