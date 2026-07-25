// =============================================================================
// site-engine - draft-page (PageConfig.draft) harness (engine feedback #4)
//
//   node tools/page-draft.test.mjs
//
// Proves the pure page-enumeration logic a draft page must drop out of: navPages
// (lib/config-schema.ts, the header/footer nav index) and allServiceLines
// (lib/services.ts, the shared collector behind both the sitewide JSON-LD @graph and
// llms.txt's "Services" block - lib/llms.ts's own firstSection walk and
// lib/area-ld.mjs's collectServiceAreas carry the SAME "skip page.draft" line, and
// collectServiceAreas is covered directly in tools/service-area.test.mjs). The
// modules import cleanly under plain Node (native TypeScript type-stripping, same
// approach tools/markdown.test.mjs uses), so the real source is exercised here, not a
// second copy.
//
// Covers:
//   - navPages: a draft page drops out of the nav even when it carries a `nav`
//     label; a non-draft, nav-less page is still excluded (unchanged prior
//     behavior); absent `draft` is byte-identical to before the flag existed.
//   - allServiceLines: a draft page's contractorServices AND services sections are
//     both skipped; a mixed draft/non-draft site collects only the non-draft page's
//     lines; a site with no draft pages at all is unaffected.
// =============================================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const schemaMod = await import("file://" + join(ROOT, "lib", "config-schema.ts"));
const { navPages } = schemaMod;

const servicesMod = await import("file://" + join(ROOT, "lib", "services.ts"));
const { allServiceLines } = servicesMod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ================= 1. navPages =================
function testNavPagesSkipsDraft() {
  console.log("\n# navPages: a draft page never appears, even with a nav label");
  const site = {
    pages: [
      { slug: "", title: "Home", description: "d", nav: "Home", sections: [] },
      { slug: "services", title: "Services", description: "d", nav: "Services", sections: [] },
      // A draft page WITH a nav label: still excluded (drafted-but-not-yet-live).
      { slug: "new-branch", title: "New branch", description: "d", nav: "New branch", draft: true, sections: [] },
      // A non-draft page with NO nav label: excluded too, unchanged prior behavior.
      { slug: "hidden", title: "Hidden", description: "d", sections: [] },
    ],
  };
  const nav = navPages(site);
  eq("only the two live, navved pages are listed, in order", JSON.stringify(nav.map((p) => p.slug)), '["","services"]');
  ok("the draft page never appears despite its nav label", !nav.some((p) => p.slug === "new-branch"));
}

function testNavPagesAbsentDraftUnaffected() {
  console.log("\n# navPages: absent `draft` on every page is byte-identical to before this flag existed");
  const site = {
    pages: [
      { slug: "", title: "Home", description: "d", nav: "Home", sections: [] },
      { slug: "about", title: "About", description: "d", nav: "About", sections: [] },
      { slug: "hidden", title: "Hidden", description: "d", sections: [] },
    ],
  };
  eq("filters by nav alone, exactly as before", JSON.stringify(navPages(site).map((p) => p.slug)), '["","about"]');
}

// ================= 2. allServiceLines =================
function testAllServiceLinesSkipsDraft() {
  console.log("\n# allServiceLines: a draft page's contractorServices AND services sections are both skipped");
  const site = {
    pages: [
      {
        sections: [
          { type: "contractorServices", serviceLines: [{ title: "Maintenance", body: "Scheduled upkeep." }] },
        ],
      },
      {
        // Not yet approved to go live: neither section type here should surface.
        draft: true,
        sections: [
          { type: "contractorServices", serviceLines: [{ title: "Secret Service Line", body: "Not yet public." }] },
          { type: "services", items: [{ title: "Secret Brochure Item", body: "Not yet public." }] },
        ],
      },
      {
        sections: [{ type: "services", items: [{ title: "Consulting", body: "Advisory work." }] }],
      },
    ],
  };
  const lines = allServiceLines(site);
  const titles = lines.map((l) => l.title);
  eq("only the two non-draft pages' lines are collected, in order", JSON.stringify(titles), '["Maintenance","Consulting"]');
  ok("the draft page's contractorServices line never appears", !titles.includes("Secret Service Line"));
  ok("the draft page's brochure services item never appears", !titles.includes("Secret Brochure Item"));
}

function testAllServiceLinesAbsentDraftUnaffected() {
  console.log("\n# allServiceLines: a site with no draft pages at all is unaffected");
  const site = {
    pages: [
      { sections: [{ type: "contractorServices", serviceLines: [{ title: "Repair", body: "b" }] }] },
      { sections: [{ type: "services", items: [{ title: "Modernization", body: "b" }] }] },
    ],
  };
  eq(
    "collects from every page, exactly as before this flag existed",
    JSON.stringify(allServiceLines(site).map((l) => l.title)),
    '["Repair","Modernization"]',
  );
}

// ---- run ----
testNavPagesSkipsDraft();
testNavPagesAbsentDraftUnaffected();
testAllServiceLinesSkipsDraft();
testAllServiceLinesAbsentDraftUnaffected();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
