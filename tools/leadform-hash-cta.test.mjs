// ============================================================
// site-engine - leadform hash-CTA progressive enhancement gate.
//
//   node tools/leadform-hash-cta.test.mjs   (npm run test:leadform-hash-cta)
//
// Proves lib/leadform-hash-cta.mjs (the module RequestAccessForm mounts after
// enhance): same-page anchors whose hash matches the section id open the modal
// via the shared openModal path; load + hashchange do the same; teardown drops
// every listener; a page with no binder mounted has no stray handler. Plus the
// source-level progressive-enhancement contract on RequestAccessForm: the href
// fallback, the SSR form action/fields, and the <noscript> chrome flip stay put.
// ============================================================

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const m = await import("file://" + join(ROOT, "lib", "leadform-hash-cta.mjs"));
const { bindLeadformHashCta, hashMatchesSection, hrefTargetsSection } = m;

let passed = 0;
let failed = 0;
const ok = (name, cond) => {
  if (cond) {
    passed++;
    console.log("  ok  " + name);
  } else {
    failed++;
    console.log("FAIL  " + name);
  }
};

// Minimal DOM stub: EventTarget-like document + location + history.
function fakeWin({ hash = "", path = "/", origin = "https://example.com" } = {}) {
  const listeners = new Map();
  const location = {
    hash,
    pathname: path,
    href: origin + path + hash,
    origin,
  };
  const history = {
    replaceStateCalls: [],
    replaceState(state, title, url) {
      this.replaceStateCalls.push({ state, title, url });
      if (typeof url === "string") {
        const u = new URL(url, origin);
        location.hash = u.hash;
        location.pathname = u.pathname;
        location.href = u.origin + u.pathname + u.search + u.hash;
      }
    },
  };
  const document = {
    listeners,
    addEventListener(type, fn, opts) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ fn, opts });
    },
    removeEventListener(type, fn) {
      const list = listeners.get(type) || [];
      listeners.set(
        type,
        list.filter((e) => e.fn !== fn),
      );
    },
    dispatch(type, event) {
      for (const { fn } of listeners.get(type) || []) fn(event);
    },
  };
  return {
    location,
    history,
    document,
    addEventListener(type, fn, opts) {
      document.addEventListener(type, fn, opts);
    },
    removeEventListener(type, fn) {
      document.removeEventListener(type, fn);
    },
    dispatch(type, event) {
      document.dispatch(type, event);
    },
  };
}

function clickEvent(anchorAttrs, { defaultPrevented = false } = {}) {
  const state = { defaultPrevented, prevented: false };
  const anchor = {
    tagName: "A",
    getAttribute(name) {
      return anchorAttrs[name] ?? null;
    },
    closest(sel) {
      if (sel === "a[href]") return this;
      return null;
    },
  };
  return {
    target: anchor,
    preventDefault() {
      state.prevented = true;
      state.defaultPrevented = true;
    },
    get defaultPrevented() {
      return state.defaultPrevented;
    },
    _state: state,
    _anchor: anchor,
  };
}

console.log("# hash / href helpers");
{
  ok("hashMatchesSection: #request-access", hashMatchesSection("#request-access", "request-access") === true);
  ok("hashMatchesSection: bare id rejected", hashMatchesSection("request-access", "request-access") === false);
  ok("hashMatchesSection: other id rejected", hashMatchesSection("#quote", "request-access") === false);
  ok("hashMatchesSection: empty / null safe", hashMatchesSection("", "request-access") === false && hashMatchesSection(null, "request-access") === false);

  ok("hrefTargetsSection: hash-only", hrefTargetsSection("#request-access", "request-access", "https://example.com", "/") === true);
  ok("hrefTargetsSection: root-relative with hash", hrefTargetsSection("/#request-access", "request-access", "https://example.com", "/") === true);
  ok("hrefTargetsSection: same-origin absolute", hrefTargetsSection("https://example.com/#request-access", "request-access", "https://example.com", "/") === true);
  ok("hrefTargetsSection: same-page path + hash", hrefTargetsSection("/help#request-access", "request-access", "https://example.com", "/help") === true);
  ok("hrefTargetsSection: other path on same origin is not same-page", hrefTargetsSection("/other#request-access", "request-access", "https://example.com", "/") === false);
  ok("hrefTargetsSection: other origin rejected", hrefTargetsSection("https://evil.test/#request-access", "request-access", "https://example.com", "/") === false);
  ok("hrefTargetsSection: javascript: rejected", hrefTargetsSection("javascript:void(0)", "request-access", "https://example.com", "/") === false);
  ok("hrefTargetsSection: wrong hash rejected", hrefTargetsSection("/#quote", "request-access", "https://example.com", "/") === false);
}

console.log("\n# click intercept opens modal via openModal");
{
  const win = fakeWin();
  let opens = 0;
  const teardown = bindLeadformHashCta({
    sectionId: "request-access",
    openModal: () => {
      opens++;
    },
    win,
  });
  const ev = clickEvent({ href: "/#request-access" });
  win.dispatch("click", ev);
  ok("click on a[href$=#request-access] calls openModal", opens === 1);
  ok("click preventDefault so the page does not scroll", ev._state.prevented === true);
  // preventDefault stops the browser from writing the hash; location stays clean.
  ok("click path leaves location.hash empty (no scroll target written)", win.location.hash === "");

  // If the hash was already present (deep link + later click), open still clears it.
  win.location.hash = "#request-access";
  opens = 0;
  const ev2 = clickEvent({ href: "#request-access" });
  win.dispatch("click", ev2);
  ok("click with pre-existing hash still opens", opens === 1);
  ok("pre-existing hash cleared via replaceState after click-open", win.history.replaceStateCalls.length >= 1 && win.location.hash === "");

  opens = 0;
  const other = clickEvent({ href: "/#pricing" });
  win.dispatch("click", other);
  ok("unrelated hash click does not open", opens === 0 && other._state.prevented === false);

  teardown();
  opens = 0;
  const after = clickEvent({ href: "/#request-access" });
  win.dispatch("click", after);
  ok("teardown removes click listener (no open after unmount)", opens === 0 && after._state.prevented === false);
}

console.log("\n# load + hashchange open the modal");
{
  const win = fakeWin({ hash: "#request-access" });
  let opens = 0;
  const teardown = bindLeadformHashCta({
    sectionId: "request-access",
    openModal: () => {
      opens++;
    },
    win,
  });
  ok("location.hash on bind/load opens modal", opens === 1);
  ok("hash cleared after load-open", win.location.hash === "");

  opens = 0;
  win.location.hash = "#request-access";
  win.dispatch("hashchange", {});
  ok("hashchange opens modal", opens === 1);
  ok("hash cleared after hashchange-open", win.location.hash === "");

  teardown();
  opens = 0;
  win.location.hash = "#request-access";
  win.dispatch("hashchange", {});
  ok("teardown removes hashchange listener", opens === 0);
}

console.log("\n# no binder mounted = no stray handler (absence proof)");
{
  const win = fakeWin({ hash: "#request-access" });
  ok("fresh window has zero document listeners before bind", (win.document.listeners.get("click") || []).length === 0);
  ok("fresh window has zero hashchange listeners before bind", (win.document.listeners.get("hashchange") || []).length === 0);
  // A page with no modal leadform never calls bindLeadformHashCta; prove that
  // merely importing the module installs nothing on a window.
  ok("import alone does not attach listeners", (win.document.listeners.get("click") || []).length === 0);
}

console.log("\n# RequestAccessForm progressive-enhancement contract (source)");
{
  const src = readFileSync(join(ROOT, "components", "RequestAccessForm.tsx"), "utf8");
  ok(
    "mounts bindLeadformHashCta only after enhance (pre-hydration href still navigates)",
    /bindLeadformHashCta/.test(src) &&
      /setEnhanced\(true\)/.test(src) &&
      /if\s*\(\s*!enhanced\s*\)\s*return/.test(src),
  );
  ok(
    "uses shared openModal path (no second open routine)",
    /const openModal = useCallback/.test(src) &&
      /bindLeadformHashCta\(\{\s*sectionId,\s*openModal\s*\}\)/.test(src) &&
      /onClick=\{openModal\}/.test(src),
  );
  ok("SSR form action stays /api/lead", /action="\/api\/lead"/.test(src));
  ok("noscript chrome flip preserved", /<noscript>/.test(src) && /leadmodal__trigger\{display:none/.test(src));
  // useEffect returns the binder's teardown directly so React unmount removes listeners.
  ok("teardown on unmount (return from useEffect)", /return bindLeadformHashCta\(/.test(src));
  ok("leadmodal is-open class still driven by open state", /is-open/.test(src) && /setOpen\(true\)/.test(src));

  // Named HTML entities in JSX text are a latent render bug: invalid ones (e.g. &checkmark;)
  // survive as literal source text, and even valid ones are not a reliable contract across
  // transforms. The success tick and close glyph must be real Unicode.
  ok(
    "RequestAccessForm has no raw named HTML entities (&foo;)",
    !/&[a-zA-Z]+;/.test(src),
  );
  ok(
    "success tick is a real checkmark glyph (U+2713), not a named entity",
    /leadmodal__tick[^>]*>\{\\?"\\u2713\\?"\}/.test(src) ||
      /leadmodal__tick[^>]*>✓/.test(src) ||
      src.includes('leadmodal__tick" aria-hidden="true">{"\\u2713"}'),
  );
  ok(
    "success tick stays aria-hidden (heading carries the meaning)",
    /leadmodal__tick" aria-hidden="true"/.test(src),
  );

  // Sibling scan: the same JSX-entity footgun anywhere under components/ or app/
  // (&times;, &copy;, &rarr;, &mdash;, &check;, …) would render as literal markup
  // the same way &checkmark; did on the request-access success screen.
  const namedEntityRe = /&[a-zA-Z]+;/g;
  const jsxRoots = [join(ROOT, "components"), join(ROOT, "app")];
  const offenders = [];
  function walkTsx(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walkTsx(p);
      else if (/\.tsx$/.test(ent.name)) {
        const body = readFileSync(p, "utf8");
        const found = body.match(namedEntityRe);
        if (found) offenders.push(p.replace(ROOT + "\\", "").replace(ROOT + "/", "") + ": " + [...new Set(found)].join(" "));
      }
    }
  }
  for (const root of jsxRoots) walkTsx(root);
  ok(
    "no raw named HTML entities (&foo;) in components/ or app/ JSX",
    offenders.length === 0,
  );
  if (offenders.length) {
    for (const line of offenders) console.log("      " + line);
  }

  const classic = readFileSync(join(ROOT, "components", "sections", "LeadForm.tsx"), "utf8");
  ok("classic LeadForm path does not bind hash CTA", !/bindLeadformHashCta/.test(classic));
  ok("classic form still present for non-modal configs", /function ClassicLeadForm/.test(classic));
}

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
