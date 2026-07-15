// =============================================================================
// DoD proof for the publish-profile hydrator (spec Definition of Done items 3 and 4).
//
//   node tools/hydrate.test.mjs
//
// Covers:
//   - the banned-phrase lint at 100 percent on the demo fixture (item 4), AND negative
//     cases proving the lint actually fires (a gate that never fails is not a gate);
//   - the claims trace (item 3): every emitted credential and named capability traces to a
//     named snapshot field, and an un-attested credential does NOT appear in the output;
//   - the claims wall firing across a fully-unproven synthetic snapshot;
//   - determinism and the required-fact guard.
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, statSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  hydrate,
  lintConfig,
  lintString,
  collectStrings,
  serializeConfig,
  resolveModProjects,
  writeAssets,
  isValidArticle,
  sniffImageExt,
  sanitizePortalUrl,
  PER_IMAGE_B64_CAP,
} from "./hydrate.mjs";
// v0.6.1 (feedback item 7): the blessed, stable config-lint surface. A consumer imports the
// lint from here, not from hydrate.mjs internals; this proves the re-export behaves identically.
import {
  lintConfig as lintConfigEntry,
  lintString as lintStringEntry,
  collectStrings as collectStringsEntry,
} from "./lint-config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// v0.3.0 BARE snapshot: retained as the backward-compat fixture (no bundle, no assets).
const fixturePath = resolve(here, "../examples/elevator-demo/publish-profile.snapshot.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
// v0.4.0 BUNDLE fixture: snapshot.json plus a sibling assets/ of paired images.
const bundleDir = resolve(here, "../examples/elevator-demo/v0.4.0-bundle/summit-vertical/2026-07-10T183000Z");
const bundlePath = join(bundleDir, "snapshot.json");
const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// -----------------------------------------------------------------------------
// Item 4: banned-phrase lint at 100 percent on the demo fixture.
// -----------------------------------------------------------------------------

test("demo fixture: lint clean on 100 percent of emitted strings", () => {
  const { config } = hydrate(fixture);
  const { count, violations } = lintConfig(config);
  assert.ok(count > 50, `expected many strings linted, got ${count}`);
  assert.deepEqual(violations, [], `lint must be clean; got ${JSON.stringify(violations)}`);
});

// The lint must actually fire. If these pass without catching, the gate is decorative.
test("lint fires on every banned family (negative proof)", () => {
  const cases = [
    ["em dash", "we do it — always", "dash"],
    ["en dash", "9–10 units", "dash"],
    ["exclamation", "Thank you!", "exclamation"],
    ["exclamation mid-sentence", "Call now! We answer 24/7.", "exclamation"],
    ["compliant", "we keep you compliant", "banned-claim:compliant"],
    ["certified", "certified technicians", "banned-claim:certified"],
    ["inspection-ready", "inspection-ready every time", "banned-claim:inspection-ready"],
    ["inspection ready (space)", "inspection ready every time", "banned-claim:inspection-ready"],
    ["meets the standard", "our work meets the standard", "banned-claim:meets-the-standard"],
    ["guarantee", "we guarantee results", "banned-claim:guarantee"],
    ["guaranteed", "guaranteed uptime", "banned-claim:guarantee"],
    ["hype (world-class)", "world-class service", null],
    ["hype (seamless)", "a seamless experience", null],
    ["hype (trusted)", "the trusted name", null],
    ["code claim (required by code)", "repairs required by code", null],
    ["code claim (up to code)", "we bring it up to code", null],
    ["code claim (code requires)", "the code requires this", null],
  ];
  for (const [label, str, expectRule] of cases) {
    const v = lintString(str);
    assert.ok(v.length > 0, `expected "${label}" to trip the lint: "${str}"`);
    if (expectRule) {
      assert.ok(v.some((x) => x.rule === expectRule), `expected rule ${expectRule} for "${label}", got ${JSON.stringify(v)}`);
    }
  }
});

test("lint passes clean, AHJ-hedged copy (no false positives)", () => {
  const clean = [
    "Which tests apply and when depends on your jurisdiction; your authority having jurisdiction confirms what is required.",
    "Scheduled maintenance that keeps each unit on its plan.",
    "Parts are sourced across manufacturers rather than through a single brand.",
    "For a stuck elevator with someone inside, call first.",
    "We answer the phone and keep your records straight.",
    "Thank you.",
  ];
  for (const s of clean) assert.deepEqual(lintString(s), [], `false positive on: "${s}"`);
});

// -----------------------------------------------------------------------------
// Item 3: the claims trace. Every emitted credential / capability traces to a source, and
// the un-attested credential is absent from the output.
// -----------------------------------------------------------------------------

test("claims trace: every emitted credential/capability has a named snapshot source", () => {
  const { config, trace } = hydrate(fixture);
  const byPath = new Map(trace.map((t) => [t.configPath, t]));

  // Walk the emitted trustBar and require a trace entry (with a non-empty source) per fact.
  const trust = findSection(config, "trustBar").trust;
  const credFields = ["licenseNumber", "licenseLabel", "registryUrl", "bonded", "insured", "yearsInBusiness", "brands"];
  for (const f of credFields) {
    if (trust[f] === undefined) continue; // omitted by the claims wall; nothing to trace
    const entry = byPath.get(`trust.${f}`);
    assert.ok(entry, `emitted trust.${f} has no claims-trace entry`);
    assert.ok(entry.source && entry.source.length > 0, `trust.${f} trace has empty source`);
  }

  // Every emitted service line must trace to a proving key.
  const lines = findSection(config, "contractorServices").serviceLines;
  for (const line of lines) {
    const entry = byPath.get(`serviceLines[${line.key}]`);
    assert.ok(entry, `service line ${line.key} has no claims-trace entry`);
    assert.ok(entry.source && entry.source.length > 0, `service line ${line.key} trace has empty source`);
  }

  // Wiring-derived capabilities.
  assert.ok(byPath.get("callBar.dispatchRouted"), "callBar.dispatchRouted must trace");
  assert.equal(byPath.get("callBar.dispatchRouted").source, "wiring.dispatchRouted");
  assert.ok(byPath.get("requestService.intakeUrl"), "requestService.intakeUrl must trace");
  assert.ok(byPath.get("portalDoor.portalUrl"), "portalDoor.portalUrl must trace");
});

test("claims trace: emitted credentials are actually attested in the snapshot", () => {
  const { config } = hydrate(fixture);
  const trust = findSection(config, "trustBar").trust;
  if (trust.licenseNumber !== undefined) assert.equal(fixture.credentials.licenseNumber.attested, true);
  if (trust.insured !== undefined) assert.equal(fixture.credentials.insured.attested, true);
  if (trust.bonded !== undefined) assert.equal(fixture.credentials.bonded.attested, true);
  if (trust.yearsInBusiness !== undefined) assert.equal(fixture.credentials.yearsInBusiness.attested, true);
});

test("claims wall: an un-attested credential (bonded) is dropped from the output", () => {
  // The fixture marks bonded { value: true, attested: false }.
  assert.equal(fixture.credentials.bonded.attested, false, "fixture must keep bonded un-attested");
  const { config, dropped } = hydrate(fixture);
  const trust = findSection(config, "trustBar").trust;
  assert.equal(trust.bonded, undefined, "bonded must NOT appear (un-attested)");
  assert.ok(dropped.some((d) => d.field === "trust.bonded"), "drop must be recorded for evidence");

  // And it must not leak into any emitted string (e.g. the licensing FAQ).
  const strings = collectStrings(config).map((s) => s.value.toLowerCase());
  assert.ok(!strings.some((s) => /\bbond(?:ed)?\b/.test(s)), "no emitted string may claim a bond");
});

test("claims wall: periodic testing is data-gated (not proven -> dropped)", () => {
  assert.equal(fixture.fleet.hasPeriodicTesting, false, "fixture must leave periodic testing unproven");
  const { config, dropped } = hydrate(fixture);
  const lines = findSection(config, "contractorServices").serviceLines.map((l) => l.key);
  assert.ok(!lines.includes("periodicTesting"), "periodicTesting must be dropped");
  assert.ok(lines.includes("modernization"), "modernization is proven and must be present");
  assert.ok(dropped.some((d) => d.field === "serviceLines[periodicTesting]"));
});

test("optional sections default OFF (careers/records/modGallery absent from the fixture)", () => {
  const { config } = hydrate(fixture);
  for (const t of ["careers", "records", "modGallery"]) {
    assert.equal(hasSection(config, t), false, `${t} must not be emitted without snapshot content`);
  }
  assert.deepEqual(config.blog.articles, [], "blog is an empty surface at hydration (decision 4)");
});

// -----------------------------------------------------------------------------
// Claims wall across a fully-unproven synthetic snapshot: nothing survives that is not
// proven, and maintenance + repair remain the archetype baseline.
// -----------------------------------------------------------------------------

test("claims wall: a fully-unproven snapshot emits only proven facts", () => {
  const bare = {
    schemaVersion: "0.3.0",
    tenantSlug: "bare-co",
    identity: { name: "Bare Co", email: "hi@bare.example", region: "OR" },
    credentials: {
      licenseNumber: { value: "X-1", attested: false },
      bonded: { value: true, attested: false },
      insured: { value: true, attested: false },
      yearsInBusiness: { value: 5, attested: false },
    },
    fleet: { manufacturers: ["Otis"], equipClasses: [], statesServed: ["OR"], hasModernization: false, hasPeriodicTesting: false },
    services: { fullMaintenance: true, oilLube: false },
    wiring: {},
    assets: { modProjects: [] },
    brand: { primary: "#111111", accent: "#eeeeee" },
  };
  const { config } = hydrate(bare);
  const { violations } = lintConfig(config);
  assert.deepEqual(violations, [], "unproven snapshot must still lint clean");

  // No CREDENTIAL survives: with nothing attested, the trust bar carries only the real
  // fleet brands (a proven capability), never a license, bond, insurance, or years claim.
  if (hasSection(config, "trustBar")) {
    const trust = findSection(config, "trustBar").trust;
    for (const f of ["licenseNumber", "licenseLabel", "registryUrl", "bonded", "insured", "yearsInBusiness"]) {
      assert.equal(trust[f], undefined, `un-attested/unproven ${f} must not appear`);
    }
    assert.deepEqual(trust.brands, ["Otis"], "brands are the real fleet values only");
  }

  // Only maintenance + repair.
  const lines = findSection(config, "contractorServices").serviceLines.map((l) => l.key);
  assert.deepEqual(lines, ["maintenance", "repair"]);

  // Single manufacturer -> no "mixed-manufacturer" claim anywhere.
  const strings = collectStrings(config).map((s) => s.value.toLowerCase());
  assert.ok(!strings.some((s) => s.includes("mixed-manufacturer")), "single-mfr fleet must not claim mixed-manufacturer");

  // No portal / intake wiring -> those sections/fields degrade.
  const req = findSection(config, "requestService");
  assert.equal(req.intakeUrl, undefined, "no intake wiring -> mailto fallback only");
  assert.equal(req.intakeEmail, "hi@bare.example");
  assert.equal(hasSection(config, "portalDoor"), false, "no portalUrl -> no portal door");
});

// -----------------------------------------------------------------------------
// v0.4.0: asset resolution (addendum 8). The bundle fixture pairs two projects that resolve
// and one that degrades (missing files). Every emitted string, alt and caption included,
// still lints clean.
// -----------------------------------------------------------------------------

test("bundle fixture: lint clean on 100 percent of emitted strings (alt + caption + article prose)", () => {
  const { config } = hydrate(bundle, { bundleDir });
  const { count, violations } = lintConfig(config);
  assert.ok(count > 100, `expected many strings linted, got ${count}`);
  assert.deepEqual(violations, [], `lint must be clean; got ${JSON.stringify(violations)}`);
  // Prove the alt text and a caption actually made it into the linted string set.
  const strings = collectStrings(config).map((s) => s.value);
  assert.ok(strings.some((s) => /^Before: hydraulic passenger/.test(s)), "alt text must be present and linted");
  assert.ok(strings.some((s) => /relay logic replaced/.test(s)), "caption must be present and linted");
});

test("bundle asset resolver: paired projects RESOLVE into /mods with a trace (not dropped)", () => {
  const { config, trace, dropped } = hydrate(bundle, { bundleDir });
  const mod = findSection(config, "modGallery");
  assert.equal(mod.projects.length, 2, "proj-1 and proj-2 resolve; proj-3 degrades");

  // Every resolved image is traced as an asset with a source ref and points at /mods.
  const assetTrace = trace.filter((t) => t.kind === "asset");
  assert.equal(assetTrace.length, 4, "two projects x before+after = four resolved images");
  for (const t of assetTrace) {
    assert.match(t.value, /^\/mods\/.+\.(png|jpg|jpeg|webp|gif|avif)$/, `asset path must be a public /mods path: ${t.value}`);
    assert.ok(t.source && t.source.includes("assets.modProjects"), `asset trace needs a source ref: ${JSON.stringify(t)}`);
  }
  // The RESOLVED images must NOT appear in the dropped list (DoD item 6).
  assert.ok(!dropped.some((d) => d.field === "modGallery.projects[proj-1]"), "proj-1 must not be dropped");
  assert.ok(!dropped.some((d) => d.field === "modGallery.projects[proj-2]"), "proj-2 must not be dropped");
  // The modGallery section itself traces as resolved.
  assert.ok(trace.some((t) => t.configPath === "modGallery" && t.kind === "section"), "modGallery section must trace");
});

test("bundle asset resolver: engine Project shape only (id/assetId/mime/b64 stripped)", () => {
  const { config } = hydrate(bundle, { bundleDir });
  const mod = findSection(config, "modGallery");
  const p = mod.projects[0];
  assert.deepEqual(Object.keys(p.before).sort(), ["alt", "src"], "before carries only src + alt");
  assert.deepEqual(Object.keys(p.after).sort(), ["alt", "src"], "after carries only src + alt");
  for (const banned of ["id", "assetId", "mime", "b64"]) {
    assert.equal(p[banned], undefined, `provenance/transport field ${banned} must not survive to the engine shape`);
    assert.equal(p.before[banned], undefined, `before.${banned} must be stripped`);
  }
  assert.equal(p.equipmentClass, "Hydraulic passenger");
  assert.equal(p.scope, "Controller and fixture replacement");
});

test("bundle degradation: a project with missing files DROPS with a trace, run does not fail", () => {
  const { config, dropped } = hydrate(bundle, { bundleDir });
  const drop = dropped.find((d) => d.field === "modGallery.projects[proj-3]");
  assert.ok(drop, "proj-3 (missing files) must be recorded as dropped");
  assert.match(drop.reason, /asset file not found/, `drop reason must name the cause: ${drop.reason}`);
  // The whole run still produced a valid config with the two good projects.
  const mod = findSection(config, "modGallery");
  assert.equal(mod.projects.length, 2, "the good projects survive the bad one");
});

test("bundle asset resolver: writeAssets writes real bytes into public/mods", () => {
  const { assets } = hydrate(bundle, { bundleDir });
  assert.equal(assets.length, 4, "four images planned");
  const tmp = mkdtempSync(join(tmpdir(), "site-engine-mods-"));
  try {
    const n = writeAssets(assets, tmp);
    assert.equal(n, 4, "writeAssets reports the count");
    for (const a of assets) {
      const p = join(tmp, a.file);
      assert.ok(existsSync(p), `expected ${a.file} on disk`);
      assert.ok(statSync(p).size > 0, `expected ${a.file} to carry bytes`);
      // The bytes on disk are exactly the resolved buffer (PNG signature intact).
      const b = readFileSync(p);
      assert.equal(b.slice(0, 8).toString("hex"), "89504e470d0a1a0a", "PNG signature must survive resolution");
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("resolveModProjects: the inline b64 TRANSPORT form resolves to a content-hashed /mods path", () => {
  // A 1x1 red PNG, base64 (no bundleDir needed for the transport form).
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const { projects, assets, resolved, dropped } = resolveModProjects(
    [
      {
        id: "inline-1",
        caption: "Inline transport pair.",
        before: { assetId: "a", mime: "image/png", b64, alt: "Before: inline pair." },
        after: { assetId: "b", mime: "image/png", b64, alt: "After: inline pair." },
      },
    ],
    {}, // no bundleDir
  );
  assert.equal(dropped.length, 0, "inline pair must resolve");
  assert.equal(projects.length, 1);
  assert.equal(assets.length, 2);
  for (const a of assets) assert.match(a.engineSrc, /^\/mods\/[0-9a-f]{16}\.png$/, `content-hashed path: ${a.engineSrc}`);
  assert.equal(resolved.length, 2);
});

test("resolveModProjects: an oversized b64 image DROPS the project (defensive cap)", () => {
  const over = "A".repeat(PER_IMAGE_B64_CAP + 1);
  const { projects, dropped } = resolveModProjects(
    [{ id: "big", before: { mime: "image/jpeg", b64: over, alt: "x" }, after: { mime: "image/jpeg", b64: "AAAA", alt: "y" } }],
    {},
  );
  assert.equal(projects.length, 0, "oversized project must not resolve");
  assert.ok(dropped.some((d) => /over per-image cap/.test(d.reason)), `drop must name the cap: ${JSON.stringify(dropped)}`);
});

test("resolveModProjects: unpaired and malformed-side projects DROP, never throw", () => {
  const { projects, dropped } = resolveModProjects(
    [
      { id: "no-after", before: { src: "assets/x.png", alt: "x" } }, // missing after
      { id: "both-forms", before: { src: "a", b64: "b", alt: "x" }, after: { src: "c", alt: "y" } }, // both b64+src
    ],
    { bundleDir: "/nonexistent" },
  );
  assert.equal(projects.length, 0);
  assert.ok(dropped.some((d) => d.field === "modGallery.projects[no-after]" && /unpaired/.test(d.reason)));
  assert.ok(dropped.some((d) => d.field === "modGallery.projects[both-forms]" && /both b64 and src/.test(d.reason)));
});

// -----------------------------------------------------------------------------
// v0.4.0: article mapping (addendum 9). Top-level articles[] map to blog.articles[]; malformed
// entries skip without failing the run; draft flag maps through; empty when absent.
// -----------------------------------------------------------------------------

test("bundle article mapper: valid articles map to blog.articles; malformed is skipped", () => {
  const { config, trace, dropped } = hydrate(bundle, { bundleDir });
  const slugs = config.blog.articles.map((a) => a.slug);
  assert.deepEqual(slugs, ["choosing-an-elevator-service-company", "reading-your-service-history"], "two valid articles, in order");
  // The malformed third article (no description) is skipped with a drop record, not a throw.
  assert.ok(dropped.some((d) => d.kind === "article"), "malformed article must be recorded as dropped");
  assert.ok(trace.some((t) => t.kind === "article" && t.value === "choosing-an-elevator-service-company"), "kept article must trace");
});

test("bundle article mapper: draft flag maps through (published vs draft)", () => {
  const { config } = hydrate(bundle, { bundleDir });
  const bySlug = new Map(config.blog.articles.map((a) => [a.slug, a]));
  assert.equal(bySlug.get("choosing-an-elevator-service-company").draft, false, "published article: draft false");
  assert.equal(bySlug.get("reading-your-service-history").draft, true, "draft article: draft true");
});

test("isValidArticle: requires slug, title, and description", () => {
  assert.equal(isValidArticle({ slug: "s", title: "t", description: "d" }), true);
  assert.equal(isValidArticle({ slug: "s", title: "t" }), false, "no description");
  assert.equal(isValidArticle({ title: "t", description: "d" }), false, "no slug");
  assert.equal(isValidArticle({ slug: " ", title: "t", description: "d" }), false, "blank slug");
  assert.equal(isValidArticle(null), false);
});

// -----------------------------------------------------------------------------
// v0.4.0: backward compatibility. A v0.3.0 BARE snapshot still hydrates; the gallery is
// simply absent and no assets are planned (invariant 6.4).
// -----------------------------------------------------------------------------

test("backward-compat: the v0.3.0 bare fixture hydrates with the gallery absent and no assets", () => {
  const { config, assets, dropped } = hydrate(fixture); // no bundleDir, no assets/ sibling
  assert.equal(hasSection(config, "modGallery"), false, "bare snapshot: no gallery section");
  assert.equal(assets.length, 0, "bare snapshot: no images planned");
  assert.ok(
    dropped.some((d) => d.field === "modGallery" && /empty/.test(d.reason)),
    "the gallery drop is recorded as empty (opt-in), the v0.3.0 behavior",
  );
  assert.deepEqual(config.blog.articles, [], "bare snapshot: empty blog (decision 4)");
  // And it still lints clean.
  assert.deepEqual(lintConfig(config).violations, [], "bare snapshot must lint clean");
});

test("backward-compat: a bundle-form src with no bundleDir degrades (gallery absent), never throws", () => {
  // Same content as the bundle fixture, but hydrated WITHOUT bundleDir: the stored src form
  // cannot read its bytes, so every project drops and the gallery is absent.
  const { config, assets, dropped } = hydrate(bundle); // deliberately omit bundleDir
  assert.equal(hasSection(config, "modGallery"), false, "no readable assets -> no gallery");
  assert.equal(assets.length, 0);
  assert.ok(dropped.some((d) => /asset file not found/.test(d.reason)), "src-form projects drop without a bundleDir");
  // Articles still map (they need no bundle), proving the two seams are independent.
  assert.equal(config.blog.articles.length, 2, "article mapping is independent of asset resolution");
});

// -----------------------------------------------------------------------------
// Determinism + guards + serializer.
// -----------------------------------------------------------------------------

test("deterministic: same snapshot in, byte-identical config out", () => {
  const a = serializeConfig(hydrate(fixture).config);
  const b = serializeConfig(hydrate(fixture).config);
  assert.equal(a, b, "hydration must be deterministic");
});

test("serializer emits a typed, self-contained module", () => {
  const ts = serializeConfig(hydrate(fixture).config, { snapshotPath: "x", schemaVersion: "0.3.0", tenantSlug: "t" });
  assert.ok(ts.includes('import type { SiteConfig } from "@/lib/config-schema";'));
  assert.ok(ts.includes("export const site: SiteConfig = {"));
  assert.ok(!/[–—]/.test(ts), "the emitted module itself must carry no en/em dashes");
});

test("required-fact guard: hydrate throws without name or email", () => {
  assert.throws(() => hydrate({ identity: { email: "a@b.c" } }), /identity\.name is required/);
  assert.throws(() => hydrate({ identity: { name: "X" } }), /identity\.email is required/);
});

// -----------------------------------------------------------------------------
// v0.6.1: the config-lint entry point (feedback item 7). tools/lint-config.mjs is the
// blessed surface a consumer depends on; it must re-export the same lint the hydrator uses.
// -----------------------------------------------------------------------------

test("lint-config entry point: re-exports match hydrate.mjs and are identical functions", () => {
  // Same function identity (a true re-export, not a copy that can drift).
  assert.equal(lintConfigEntry, lintConfig, "lintConfig must be the same function");
  assert.equal(lintStringEntry, lintString, "lintString must be the same function");
  assert.equal(collectStringsEntry, collectStrings, "collectStrings must be the same function");
});

test("lint-config entry point: flags a banned config and passes a clean one", () => {
  const dirty = { pages: [{ sections: [{ body: "world-class, certified service" }] }] };
  const { violations } = lintConfigEntry(dirty);
  assert.ok(violations.some((v) => v.rule.startsWith("hype:")), "must flag hype via the entry point");
  assert.ok(violations.some((v) => v.rule === "banned-claim:certified"), "must flag the compliance claim");

  const clean = { pages: [{ sections: [{ body: "Scheduled maintenance, logged per unit." }] }] };
  assert.deepEqual(lintConfigEntry(clean).violations, [], "a clean config must pass");
});

// -----------------------------------------------------------------------------
// helpers + runner
// -----------------------------------------------------------------------------

function allSections(config) {
  return config.pages.flatMap((p) => p.sections);
}
function findSection(config, type) {
  const s = allSections(config).find((x) => x.type === type);
  assert.ok(s, `expected a ${type} section`);
  return s;
}
function hasSection(config, type) {
  return allSections(config).some((x) => x.type === type);
}

// -----------------------------------------------------------------------------
// SEC hardening FIX 6: hydration / build-boundary hardening. The hydrator trusts import-supplied
// strings and bytes at a syntactic / content-type boundary. These prove the boundary is closed:
// no snapshot value can break out of the generated site.config.ts comment header into build-host
// code, no non-image payload can land in public/mods as a same-origin active document, and a
// portal link is bound to https (and an operator origin allowlist when supplied).
// -----------------------------------------------------------------------------

// A 1x1 red PNG, base64 - a genuine raster payload for the "good" side of a pairing.
const REAL_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test("FIX 6: serializeConfig - a snapshot meta value cannot break out of the // comment header", () => {
  // An untrusted snapshot supplies a tenantSlug carrying a line terminator plus code. Interpolated
  // raw into a `//` header line it would break out into executable TS that `next build` then runs
  // (CWE-94 build-host code-exec). Every header line must stay a comment.
  const evil = 'acme";\nglobalThis.__pwned = 1;\n//';
  const out = serializeConfig({ archetype: "elevator-contractor" }, {
    tenantSlug: evil, snapshotPath: evil, schemaVersion: evil, approvedAt: evil,
  });
  const header = out.slice(0, out.indexOf("import type"));
  for (const line of header.split("\n")) {
    assert.ok(line === "" || line.startsWith("//"), `header line escaped the comment: ${JSON.stringify(line)}`);
  }
  assert.ok(!header.includes("\nglobalThis"), "the injected line terminator must be neutralized");
});

test("FIX 6: resolveModProjects - a non-image transport payload is dropped, never landed in /mods", () => {
  // A text/html payload (active, same-origin document) offered through the inline transport form.
  const htmlB64 = Buffer.from("<html><body><script>alert(document.domain)</script></body></html>").toString("base64");
  const { projects, assets, dropped } = resolveModProjects(
    [{ id: "evil-html", before: { mime: "text/html", b64: htmlB64, alt: "x" }, after: { mime: "text/html", b64: htmlB64, alt: "y" } }],
    {},
  );
  assert.equal(projects.length, 0, "an active-content payload must not resolve to a gallery project");
  assert.equal(assets.length, 0, "nothing may be written into public/mods");
  assert.ok(dropped.some((d) => d.field === "modGallery.projects[evil-html]"), "the drop is recorded in the trace");
});

test("FIX 6: resolveModProjects - a STORED .svg asset (active content) is dropped by content sniff", () => {
  const tmp = mkdtempSync(join(tmpdir(), "se-hydrate-svg-"));
  mkdirSync(join(tmp, "assets"), { recursive: true });
  writeFileSync(join(tmp, "assets", "evil.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  writeFileSync(join(tmp, "assets", "ok.png"), Buffer.from(REAL_PNG_B64, "base64"));
  const { projects, assets } = resolveModProjects(
    [{ id: "svg", before: { src: "assets/evil.svg", alt: "x" }, after: { src: "assets/ok.png", alt: "y" } }],
    { bundleDir: tmp },
  );
  rmSync(tmp, { recursive: true, force: true });
  assert.equal(projects.length, 0, "a project with a non-raster side must drop");
  assert.ok(!assets.some((a) => /\.svg(\?|$)/.test(a.engineSrc)), "no .svg may land in public/mods");
});

test("FIX 6: hydrate - a non-https wiring.portalUrl is dropped (no portalDoor section)", () => {
  const snap = JSON.parse(JSON.stringify(bundle));
  snap.wiring = { ...(snap.wiring || {}), portalUrl: "javascript:alert(document.domain)" };
  const { config } = hydrate(snap, { bundleDir });
  assert.equal(hasSection(config, "portalDoor"), false, "a non-https / non-parseable portalUrl must not render a portal door");
});

test("FIX 6: sniffImageExt recognizes raster formats and rejects non-images", () => {
  assert.equal(sniffImageExt(Buffer.from(REAL_PNG_B64, "base64")), "png");
  assert.equal(sniffImageExt(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 0])), "jpg");
  assert.equal(sniffImageExt(Buffer.from("GIF89a    ", "latin1")), "gif");
  assert.equal(sniffImageExt(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null, "svg is not a raster image");
  assert.equal(sniffImageExt(Buffer.from("<!doctype html><script>1</script>")), null, "html is not an image");
  assert.equal(sniffImageExt(Buffer.from("plain text payload padded out")), null);
  assert.equal(sniffImageExt(Buffer.from([0, 1, 2])), null, "too short to be any image");
});

test("FIX 6: sanitizePortalUrl - https-only, parseable, with an optional origin allowlist", () => {
  assert.equal(sanitizePortalUrl("https://portal.summit-vertical.example/"), "https://portal.summit-vertical.example/");
  assert.equal(sanitizePortalUrl("  https://ok.example/x  "), "https://ok.example/x", "trims surrounding whitespace");
  assert.equal(sanitizePortalUrl("http://evil.example/"), null, "http is rejected");
  assert.equal(sanitizePortalUrl("javascript:alert(1)"), null, "javascript: is rejected");
  assert.equal(sanitizePortalUrl("not a url"), null, "unparseable is rejected");
  assert.equal(sanitizePortalUrl(""), null);
  assert.equal(sanitizePortalUrl(42), null, "non-string is rejected");
  assert.equal(sanitizePortalUrl("https://good.example/portal", ["https://good.example"]), "https://good.example/portal");
  assert.equal(sanitizePortalUrl("https://evil.example/portal", ["https://good.example"]), null, "an off-allowlist origin is dropped");
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message.split("\n").join("\n        ")}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
