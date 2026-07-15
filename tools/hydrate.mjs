// =============================================================================
// PUBLISH-PROFILE HYDRATOR (site-engine v0.4.0)
//
// Usage: node tools/hydrate.mjs <snapshot.json | bundle .../snapshot.json> [outdir]
//
// Maps an approved publish-profile snapshot (the section-5.4 hand-off artifact, produced
// tenant-side by the `publish-profile` export function) to a complete site.config.ts for
// the elevator-contractor archetype, per the mapping tables in
// RiseLynk docs/specs/site-engine-hydration.md (v0.3.0 section 2, v0.4.0 addendum 8, 9).
//
// v0.4.0 adds, on top of the v0.3.0 config mapping:
//   - the ASSET RESOLVER (addendum 8): assets.modProjects[] project objects resolve into
//     public/mods/ before/after images, emitted as a modGallery section with linted alt
//     text. Each side resolves from the STORED form ({ src: "assets/<file>" }, bytes read
//     from the sibling bundle assets/ dir) or the TRANSPORT form ({ b64, mime }, decoded
//     inline). An unpaired / missing / oversized / malformed project drops with a trace
//     record; the run never fails on a bad project.
//   - the ARTICLE MAPPER (addendum 9): top-level articles[] map to blog.articles[] (engine
//     Article fields verbatim, draft default false), empty when absent (decision 4 stands).
//   - BUNDLE-AWARE input: a pointer/path ending in <approvedAt>/snapshot.json (v0.4.0 bundle)
//     or <approvedAt>.json (v0.3.0 flat) both hydrate. The asset directory is the sibling
//     assets/ of the snapshot; a flat v0.3.0 snapshot has none, so the gallery is absent.
//
// Three gates run, in order, on the way out (spec section 2):
//   1. The CLAIMS WALL. A fact is emitted only when the snapshot proves it. Credentials
//      emit only when operator-attested AND (for the license) checkable on a registry.
//      Service lines are data-gated: maintenance and repair always; modernization only
//      when the fleet proves it; periodic testing only when the fleet proves it. Years in
//      business is never inferred from equipment age. Brands are the real fleet values.
//      Mod-gallery images are emitted only when a project resolves BOTH before and after.
//   2. The BANNED-PHRASE LINT over every emitted string (alt text, captions, and article
//      prose included): no em or en dashes, no exclamation marks, none of the four banned
//      compliance phrases as affirmative claims, no hype, no guarantees, and code-requirement
//      wording hedged to the authority having jurisdiction. A violation FAILS the run
//      (non-zero exit).
//   3. The CLAIMS TRACE: every emitted credential, named capability, and RESOLVED asset
//      records the named snapshot field / source ref it came from, written to
//      claims-trace.json alongside the config. Dropped projects are recorded too.
//
// Deterministic and dependency-free: same snapshot in, byte-identical config out. This is
// the offline side of the one-click thesis. It never reads a tenant database.
// =============================================================================

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = resolve(HERE, "..");
const PUBLIC_MODS_DIR = join(ENGINE_ROOT, "public", "mods");

// Bind an import-supplied portal URL to a safe shape (SEC hardening FIX 6). The snapshot's
// wiring.portalUrl lands in a public "Open the customer portal" CTA, so a hostile snapshot could
// point it at javascript: or an attacker origin. Parse with the URL constructor, require https, and
// - when the operator supplies an origin allowlist - require the origin to be on it. Returns the
// normalized href, or null to drop the link. With no allowlist configured the https parse is the
// gate (the brand-neutral engine bakes in no origin); production hydration passes the tenant's
// approved portal origin(s) via PORTAL_ORIGIN_ALLOWLIST so a swapped link is rejected.
/** @param {unknown} raw @param {string[]} [allowlist] @returns {string|null} */
export function sanitizePortalUrl(raw, allowlist = []) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const list = Array.isArray(allowlist) ? allowlist.map((o) => String(o).trim()).filter(Boolean) : [];
  if (list.length && !list.includes(u.origin)) return null;
  return u.href;
}

// -----------------------------------------------------------------------------
// The banned-phrase lint (gate 2). Runs over every string the config carries.
// -----------------------------------------------------------------------------

// Em / en / figure / horizontal-bar dashes and the Unicode minus. House rule: hyphen only.
const DASH_RE = /[‒–—―−]/;

// House voice is a flat statement, never punctuated with excitement (feedback item #36: the
// engine-baked checkout-success page shipped "Thank you!" outside every lint's reach). One
// exclamation mark anywhere in a string is enough to trip it.
const EXCLAIM_RE = /!/;

// The four banned compliance phrases (affirmative claims a service company must not make).
const COMPLIANCE_RES = [
  { rule: "banned-claim:compliant", re: /\bcompliant\b/i },
  { rule: "banned-claim:certified", re: /\bcertified\b/i },
  { rule: "banned-claim:inspection-ready", re: /inspection[- ]ready/i },
  { rule: "banned-claim:meets-the-standard", re: /meets the standard/i },
];

// Guarantees, in any inflection.
const GUARANTEE_RE = { rule: "banned-claim:guarantee", re: /\bguarantee(?:s|d)?\b/i };

// Marketing hype. Curated from the house voice-guide banned list; every emitted string,
// including operator-supplied copy (tagline), passes through here so bad copy fails the run.
const HYPE_RES = [
  /world[- ]class/i,
  /cutting[- ]edge/i,
  /bleeding[- ]edge/i,
  /best[- ]in[- ]class/i,
  /state[- ]of[- ]the[- ]art/i,
  /industry[- ]leading/i,
  /world[- ]renowned/i,
  /\brevolutionary\b/i,
  /\bseamless(?:ly)?\b/i,
  /\beffortless(?:ly)?\b/i,
  /\bunparalleled\b/i,
  /\bunmatched\b/i,
  /\bunbeatable\b/i,
  /game[- ]chang/i,
  /one[- ]stop/i,
  /\bturnkey\b/i,
  /\bpremier\b/i,
  /top[- ]notch/i,
  /second to none/i,
  /hassle[- ]free/i,
  /next[- ]gen(?:eration)?\b/i,
  /\btrusted\b/i,
].map((re, i) => ({ rule: `hype:${re.source}`, re }));

// Unhedged code-requirement claims. Good copy hedges "what applies" to the AHJ; these are
// the assertive forms that state a code requirement as settled fact.
const CODE_CLAIM_RES = [
  /\brequired by code\b/i,
  /\bcode requires\b/i,
  /\bmeets? code\b/i,
  /\bup to code\b/i,
  /\bbrought? to code\b/i,
  /\bcode[- ]compliant\b/i,
  /\bmandated by (?:the )?code\b/i,
  /\bwe certify\b/i,
].map((re) => ({ rule: `code-claim:${re.source}`, re }));

// Lint one string; return an array of { rule, match } violations (empty when clean).
export function lintString(s) {
  if (typeof s !== "string" || s.length === 0) return [];
  const out = [];
  if (DASH_RE.test(s)) out.push({ rule: "dash", match: s.match(DASH_RE)[0] });
  if (EXCLAIM_RE.test(s)) out.push({ rule: "exclamation", match: "!" });
  for (const { rule, re } of COMPLIANCE_RES) if (re.test(s)) out.push({ rule, match: s.match(re)[0] });
  if (GUARANTEE_RE.re.test(s)) out.push({ rule: GUARANTEE_RE.rule, match: s.match(GUARANTEE_RE.re)[0] });
  for (const { rule, re } of HYPE_RES) if (re.test(s)) out.push({ rule, match: s.match(re)[0] });
  for (const { rule, re } of CODE_CLAIM_RES) if (re.test(s)) out.push({ rule, match: s.match(re)[0] });
  return out;
}

// Walk any value, collecting { path, value } for every string leaf. The path is a dotted
// trail (e.g. pages[0].sections[1].trust.licenseLabel) so a violation is locatable.
export function collectStrings(node, path = "", acc = []) {
  if (typeof node === "string") {
    acc.push({ path: path || "(root)", value: node });
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, `${path}[${i}]`, acc));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) collectStrings(v, path ? `${path}.${k}` : k, acc);
  }
  return acc;
}

// Lint an entire config object. Returns { strings, violations } where violations is a flat
// list of { path, rule, match }.
export function lintConfig(config) {
  const strings = collectStrings(config);
  const violations = [];
  for (const { path, value } of strings) {
    for (const v of lintString(value)) violations.push({ path, rule: v.rule, match: v.match });
  }
  return { count: strings.length, violations };
}

// -----------------------------------------------------------------------------
// Small deterministic helpers.
// -----------------------------------------------------------------------------

function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const raw of arr || []) {
    if (raw === null || raw === undefined) continue;
    const v = typeof raw === "string" ? raw.trim() : raw;
    if (v === "" ) continue;
    const key = typeof v === "string" ? v.toLowerCase() : v;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

// Oxford-joined phrase from a list of already-clean strings: [a] -> "a", [a,b] -> "a and b",
// [a,b,c] -> "a, b, and c".
function oxford(list) {
  const a = list.filter(Boolean);
  if (a.length === 0) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`;
}

function capitalizeFirst(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// Spell small counts for prose; fall back to the digit past the table.
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
function numberWord(n) {
  return NUMBER_WORDS[n] || String(n);
}

// Display label for a structured equip_type class. Only known classes are labelled; an
// unknown class is title-cased from its code so nothing is dropped silently.
const EQUIP_LABELS = {
  traction: "Traction",
  hydraulic: "Hydraulic",
  roped_hydraulic: "Roped hydraulic",
  escalator: "Escalator",
  moving_walk: "Moving walk",
  dumbwaiter: "Dumbwaiter",
  cart_conveyor: "Cart conveyor",
};
function equipLabel(code) {
  if (EQUIP_LABELS[code]) return EQUIP_LABELS[code];
  return String(code)
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// A credential value wrapped as { value, attested } is emitted only when attested is true.
function attestedValue(cred) {
  if (!cred || typeof cred !== "object") return { ok: false, value: undefined };
  return { ok: cred.attested === true, value: cred.value };
}

// -----------------------------------------------------------------------------
// Asset resolver (v0.4.0, addendum section 8). Turns approved-snapshot assets.modProjects[]
// project objects into engine Project shapes with public /mods/ src paths. Each before/after
// side resolves from the STORED form ({ src: "assets/<file>" }, bytes read from the sibling
// bundle assets/ dir) or the TRANSPORT form ({ b64, mime }, bytes decoded inline). A project
// that cannot resolve BOTH images (unpaired, missing file, oversized, or malformed) is
// dropped with a trace record; the run never fails on a bad project.
// -----------------------------------------------------------------------------

// Per-image cap: 5,000,000 base64 chars (~3.7 MB decoded), the relay's per-image bound
// (spec 10.4). A b64 image over this is dropped defensively (pairing enforces it office-side).
export const PER_IMAGE_B64_CAP = 5_000_000;

// Fail-closed image sniff (SEC hardening FIX 6). The extension is derived from the DECODED bytes,
// never from an import-supplied MIME or filename, so a text/html or image/svg+xml payload (an
// active, same-origin document) can never land in public/mods. Recognizes the raster formats the
// gallery serves by magic bytes; anything else returns null and the caller drops the side. SVG and
// HTML are text and match nothing here, so they are rejected by construction.
/** @param {Buffer} b @returns {"jpg"|"png"|"webp"|"gif"|"avif"|null} */
export function sniffImageExt(b) {
  if (!b || b.length < 12) return null;
  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  // GIF: "GIF87a" / "GIF89a"
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return "gif";
  // WebP: "RIFF" .... "WEBP"
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  // AVIF: an ISO-BMFF "ftyp" box with an "avif" / "avis" brand at bytes 8..12.
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = b.slice(8, 12).toString("latin1");
    if (brand === "avif" || brand === "avis") return "avif";
  }
  return null;
}

// Read a bundle asset by its stored relative src ("assets/<file>"), guarded to the bundle
// directory. Returns a Buffer or null (missing / unreadable / traversal / no bundleDir).
function readBundleAsset(bundleDir, relSrc) {
  if (!bundleDir || typeof relSrc !== "string" || !relSrc.trim()) return null;
  const base = resolve(bundleDir);
  const target = resolve(base, relSrc);
  if (target !== base && !target.startsWith(base + sep)) return null; // no traversal out of the bundle
  try {
    return readFileSync(target);
  } catch {
    return null;
  }
}

// A short provenance string for the claims trace: prefer the stored src, else the assetId,
// else "inline b64". Never the raw bytes.
function sideRef(side) {
  if (side && typeof side.src === "string" && side.src) return `assets.modProjects (src ${side.src})`;
  if (side && typeof side.assetId === "string" && side.assetId) return `assets.modProjects (attachment ${side.assetId})`;
  return "assets.modProjects (inline b64)";
}

// Resolve one before/after side to { bytes, file, engineSrc } or { error }.
function resolveSide(side, bundleDir) {
  if (!side || typeof side !== "object") return { error: "side missing" };
  const hasB64 = typeof side.b64 === "string" && side.b64.length > 0;
  const hasSrc = typeof side.src === "string" && side.src.length > 0;
  if (hasB64 === hasSrc) return { error: hasB64 ? "both b64 and src present" : "neither b64 nor src present" };

  if (hasSrc) {
    // STORED form: bytes live in the sibling bundle assets/ dir.
    const bytes = readBundleAsset(bundleDir, side.src);
    if (!bytes) return { error: `asset file not found: ${side.src}` };
    const base = basename(side.src);
    if (!base) return { error: `bad asset src: ${side.src}` };
    // Fail-closed content sniff (FIX 6): the extension comes from the decoded bytes, not the
    // supplied filename, so an active-content file (.svg / .html) named like an image is dropped.
    const ext = sniffImageExt(bytes);
    if (!ext) return { error: `not a decodable raster image: ${side.src}` };
    const stem = base.replace(/\.[^.]*$/, "") || base;
    const file = `${stem}.${ext}`;
    return { bytes, file, engineSrc: `/mods/${file}` };
  }

  // TRANSPORT form: bytes are inline base64. Enforce the per-image cap defensively.
  if (side.b64.length > PER_IMAGE_B64_CAP) {
    return { error: `image over per-image cap (${side.b64.length} > ${PER_IMAGE_B64_CAP} b64 chars)` };
  }
  let bytes;
  try {
    bytes = Buffer.from(side.b64, "base64");
  } catch {
    return { error: "base64 decode failed" };
  }
  if (!bytes || bytes.length === 0) return { error: "empty image bytes" };
  // Fail-closed content sniff (FIX 6): derive the extension from the decoded bytes, not the
  // import-supplied MIME, so a text/html or image/svg+xml transport payload is rejected here.
  const ext = sniffImageExt(bytes);
  if (!ext) return { error: "not a decodable raster image" };
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const file = `${hash}.${ext}`;
  return { bytes, file, engineSrc: `/mods/${file}` };
}

// Claims-safe alt fallback when the operator supplied none (office derives it per 8.1.4; this
// is the last-resort default). role is "Before" / "After".
function altFor(side, project, role) {
  const given = side && typeof side.alt === "string" ? side.alt.trim() : "";
  if (given) return given;
  const cap = typeof project.caption === "string" ? project.caption.trim() : "";
  const cls = typeof project.equipmentClass === "string" ? project.equipmentClass.trim() : "";
  const subject = cap || cls || "modernization work";
  return `${role}: ${subject}`;
}

// Resolve the whole project list. Returns { projects, assets, resolved, dropped }:
//   projects  - engine Project[] (id/assetId/mime/b64 stripped; only engine fields kept)
//   assets    - [{ file, bytes, engineSrc, from }] to write into public/mods
//   resolved  - claims-trace entries (kind "asset") marking each image RESOLVED with a source
//   dropped   - drop records for unresolved projects (evidence the gate fired)
export function resolveModProjects(modProjects, opts = {}) {
  const { bundleDir } = opts;
  const projects = [];
  const assets = [];
  const resolved = [];
  const dropped = [];
  const list = Array.isArray(modProjects) ? modProjects : [];

  list.forEach((proj, i) => {
    const id = (proj && typeof proj.id === "string" && proj.id.trim()) || `proj-${i + 1}`;
    if (!proj || typeof proj !== "object" || !proj.before || !proj.after) {
      dropped.push({ field: `modGallery.projects[${id}]`, kind: "project", reason: "unpaired (missing before or after)" });
      return;
    }
    const before = resolveSide(proj.before, bundleDir);
    const after = resolveSide(proj.after, bundleDir);
    if (before.error || after.error) {
      const reason = [before.error && `before: ${before.error}`, after.error && `after: ${after.error}`]
        .filter(Boolean)
        .join("; ");
      dropped.push({ field: `modGallery.projects[${id}]`, kind: "project", reason });
      return;
    }

    // Both sides resolved: emit the engine Project shape (id/assetId/mime/b64 dropped).
    const project = {
      before: { src: before.engineSrc, alt: altFor(proj.before, proj, "Before") },
      after: { src: after.engineSrc, alt: altFor(proj.after, proj, "After") },
    };
    if (typeof proj.equipmentClass === "string" && proj.equipmentClass.trim()) project.equipmentClass = proj.equipmentClass.trim();
    if (typeof proj.scope === "string" && proj.scope.trim()) project.scope = proj.scope.trim();
    if (typeof proj.timeline === "string" && proj.timeline.trim()) project.timeline = proj.timeline.trim();
    if (typeof proj.caption === "string" && proj.caption.trim()) project.caption = proj.caption.trim();
    projects.push(project);

    for (const [role, side, res] of [["before", proj.before, before], ["after", proj.after, after]]) {
      assets.push({ file: res.file, bytes: res.bytes, engineSrc: res.engineSrc, from: sideRef(side) });
      resolved.push({ configPath: `modGallery.projects[${id}].${role}`, kind: "asset", value: res.engineSrc, source: sideRef(side) });
    }
  });

  return { projects, assets, resolved, dropped };
}

// Write resolved image bytes into a public/mods dir so `next build` serves them at the
// emitted /mods/<file> paths. Idempotent (same bytes, same path). Returns the count.
export function writeAssets(assets, modsDir = PUBLIC_MODS_DIR) {
  if (!assets || !assets.length) return 0;
  mkdirSync(modsDir, { recursive: true });
  for (const a of assets) writeFileSync(join(modsDir, a.file), a.bytes);
  return assets.length;
}

// -----------------------------------------------------------------------------
// Article mapper (v0.4.0, addendum section 9). Maps snapshot.articles[] to the engine
// Article shape one-to-one. isValidArticle requires the engine's required Article fields
// (slug, title, description) and skips anything malformed rather than failing the run.
// -----------------------------------------------------------------------------

export function isValidArticle(a) {
  return !!(
    a &&
    typeof a === "object" &&
    typeof a.slug === "string" &&
    a.slug.trim() &&
    typeof a.title === "string" &&
    a.title.trim() &&
    typeof a.description === "string" &&
    a.description.trim()
  );
}

// Map one snapshot article to the engine Article shape (verbatim fields; draft default
// false). Only known Article fields pass through, so the emitted config stays typed and lean.
function mapArticle(a) {
  const out = {
    slug: a.slug.trim(),
    title: a.title,
    description: a.description,
    draft: a.draft === true,
  };
  for (const k of ["eyebrow", "date", "author", "lede", "body"]) {
    if (typeof a[k] === "string" && a[k].length) out[k] = a[k];
  }
  if (a.summary && typeof a.summary === "object") {
    const s = {};
    if (typeof a.summary.label === "string") s.label = a.summary.label;
    if (typeof a.summary.intro === "string") s.intro = a.summary.intro;
    if (Array.isArray(a.summary.points)) s.points = a.summary.points.filter((p) => typeof p === "string");
    if (typeof a.summary.ordered === "boolean") s.ordered = a.summary.ordered;
    out.summary = s;
  }
  if (Array.isArray(a.faqs)) {
    out.faqs = a.faqs.filter((f) => f && typeof f.q === "string" && typeof f.a === "string").map((f) => ({ q: f.q, a: f.a }));
  }
  return out;
}

// -----------------------------------------------------------------------------
// The hydrator (gate 1 claims wall + gate 3 trace, section-3 mapping table).
// Returns { config, trace, dropped } where trace is the claims manifest and dropped lists
// credentials/capabilities the claims wall omitted (evidence that the gate fired).
// -----------------------------------------------------------------------------

export function hydrate(snapshot, opts = {}) {
  const { bundleDir, portalOriginAllowlist = [] } = opts; // dir of snapshot.json; sibling assets/ holds bundle images
  const trace = []; // { configPath, kind, value, source }
  const dropped = []; // { field, kind, reason }
  const T = (configPath, kind, value, source) => trace.push({ configPath, kind, value, source });

  const identity = snapshot.identity || {};
  const credentials = snapshot.credentials || {};
  const fleet = snapshot.fleet || {};
  const services = snapshot.services || {};
  const wiring = snapshot.wiring || {};
  const brand = snapshot.brand || {};
  const assets = snapshot.assets || {};

  // --- required-fact guard (mapping: block export if name/email empty) ---
  const name = (identity.name || "").trim();
  const email = (identity.email || "").trim();
  if (!name) throw new Error("hydrate: identity.name is required (mapping: business.name)");
  if (!email) throw new Error("hydrate: identity.email is required (mapping: business.email)");

  const region = (identity.region || "").trim();
  const locality = (identity.locality || "").trim();
  const manufacturers = dedupe(fleet.manufacturers);
  const equipClasses = dedupe(fleet.equipClasses);
  const statesServed = dedupe(fleet.statesServed);
  const multiMfr = manufacturers.length > 1;

  // A claims-walled phrase for "who/what we work on": only say mixed-manufacturer when the
  // fleet actually carries more than one make.
  const routePhrase = multiMfr ? "mixed-manufacturer routes" : "your equipment";

  // --- service lines (data-gated). maintenance + repair always; the rest when proven. ---
  const serviceLines = [];
  const serviceOptions = [];

  // maintenance (baseline for the archetype; services.fullMaintenance is its proving key).
  serviceLines.push({
    key: "maintenance",
    title: "Maintenance",
    body: "Scheduled maintenance that keeps each unit on its plan, with the work logged against the unit so its history stays in one place.",
    points: ["Per-unit maintenance plan", "Callbacks answered by a mechanic who knows your building"],
  });
  serviceOptions.push("Maintenance");
  T("serviceLines[maintenance]", "capability", "maintenance",
    services.fullMaintenance === true ? "services.fullMaintenance" : "archetype baseline (maintenance always)");

  // repair (baseline for the archetype).
  serviceLines.push({
    key: "repair",
    title: "Repair",
    body: "Diagnosis and repair when something is down, with parts sourced across manufacturers so a single-brand route is not a bottleneck.",
    points: ["Open items tracked until closed", "Clear before-and-after on what was found"],
  });
  serviceOptions.push("Repair or callback");
  T("serviceLines[repair]", "capability", "repair", "archetype baseline (repair always)");

  // modernization: only when the fleet proves it (a unit with a mod date or under mod).
  if (fleet.hasModernization === true) {
    serviceLines.push({
      key: "modernization",
      title: "Modernization",
      body: "Planned replacement of aging controllers, drives, and fixtures to extend the life of the equipment you already have.",
      points: ["Scoped as a project with a schedule", "Downtime planned around the building"],
    });
    serviceOptions.push("Modernization");
    T("serviceLines[modernization]", "capability", "modernization", "fleet.hasModernization");
  } else {
    dropped.push({ field: "serviceLines[modernization]", kind: "capability", reason: "fleet.hasModernization not true" });
  }

  // periodic testing: only when the fleet proves it (a Cat-5 inclusion or test rows).
  if (fleet.hasPeriodicTesting === true) {
    serviceLines.push({
      key: "periodicTesting",
      title: "Periodic testing",
      body: "We schedule and run the periodic safety tests your equipment is due for and keep the records with each unit. Which tests apply and when depends on your jurisdiction; your authority having jurisdiction confirms what is required.",
      points: ["Category 1 and Category 5 tests scheduled ahead", "Records kept per unit"],
    });
    serviceOptions.push("Periodic testing");
    T("serviceLines[periodicTesting]", "capability", "periodicTesting", "fleet.hasPeriodicTesting");
  } else {
    dropped.push({ field: "serviceLines[periodicTesting]", kind: "capability", reason: "fleet.hasPeriodicTesting not true" });
  }
  serviceOptions.push("Not sure yet");

  const activeLineTitles = serviceLines.map((l) => l.title.toLowerCase());

  // --- trust facts (credentials: attested-only; brands: real fleet values only) ---
  const trust = {};

  const lic = attestedValue(credentials.licenseNumber);
  if (lic.ok && String(lic.value || "").trim()) {
    trust.licenseNumber = String(lic.value).trim();
    T("trust.licenseNumber", "credential", trust.licenseNumber, "credentials.licenseNumber (attested)");
    if (region) {
      trust.licenseLabel = `${region} contractor license`;
      T("trust.licenseLabel", "derived", trust.licenseLabel, "identity.region");
    }
    // The registry link is only meaningful next to a license to verify, so it rides the
    // license: emitted only when we emitted a license AND the snapshot carries the URL.
    const registryUrl = typeof credentials.registryUrl === "string" ? credentials.registryUrl.trim() : "";
    if (registryUrl) {
      trust.registryUrl = registryUrl;
      trust.registryLabel = region ? `Verify on the ${region} state registry` : "Verify on the state registry";
      T("trust.registryUrl", "credential", registryUrl, "credentials.registryUrl (jurisdictions.lookup_url)");
    }
  } else {
    dropped.push({ field: "trust.licenseNumber", kind: "credential", reason: lic.ok ? "empty value" : "not attested" });
  }

  const bonded = attestedValue(credentials.bonded);
  if (bonded.ok && bonded.value === true) {
    trust.bonded = true;
    T("trust.bonded", "credential", true, "credentials.bonded (attested)");
  } else if (credentials.bonded) {
    dropped.push({ field: "trust.bonded", kind: "credential", reason: bonded.ok ? "value not true" : "not attested" });
  }

  const insured = attestedValue(credentials.insured);
  if (insured.ok && insured.value === true) {
    trust.insured = true;
    T("trust.insured", "credential", true, "credentials.insured (attested)");
  } else if (credentials.insured) {
    dropped.push({ field: "trust.insured", kind: "credential", reason: insured.ok ? "value not true" : "not attested" });
  }

  const years = attestedValue(credentials.yearsInBusiness);
  if (years.ok && Number.isFinite(Number(years.value))) {
    trust.yearsInBusiness = Number(years.value);
    // Never inferred from units.install_date: that is equipment age, not company age.
    T("trust.yearsInBusiness", "credential", trust.yearsInBusiness, "credentials.yearsInBusiness (attested)");
  } else if (credentials.yearsInBusiness) {
    dropped.push({ field: "trust.yearsInBusiness", kind: "credential", reason: years.ok ? "non-numeric" : "not attested" });
  }

  // brands = DISTINCT fleet manufacturers + equip-class labels (real values only, nothing added).
  const brands = dedupe([...manufacturers, ...equipClasses.map(equipLabel)]);
  if (brands.length) {
    trust.brands = brands;
    T("trust.brands", "capability", brands, "fleet.manufacturers + fleet.equipClasses");
  }

  const hasAnyTrust = Object.keys(trust).length > 0;

  // --- identity / business block ---
  const business = { name, email };
  T("business.name", "capability", name, "identity.name");
  const tagline = typeof identity.tagline === "string" ? identity.tagline.trim() : "";
  if (tagline) business.tagline = tagline; // operator-supplied (brand step); linted like all copy.
  const phone = typeof identity.phone === "string" ? identity.phone.trim() : "";
  if (phone) business.phone = phone; // branch line, NOT the routed dispatch number.
  if (locality && region) business.address = `${locality}, ${region}`;
  else if (locality) business.address = locality;
  const serviceArea = typeof identity.serviceArea === "string" ? identity.serviceArea.trim() : "";
  if (serviceArea) business.serviceArea = serviceArea;
  else if (statesServed.length) business.serviceArea = `Serving ${oxford(statesServed)}`;
  const hours = typeof identity.hours === "string" ? identity.hours.trim() : "";
  if (hours) business.hours = hours;
  if (locality || region) {
    business.location = {};
    if (locality) business.location.locality = locality;
    if (region) business.location.region = region;
    business.location.country = "US"; // country defaults to US (mapping)
  }

  // --- brand block ---
  const colors = {};
  if (typeof brand.primary === "string" && brand.primary.trim()) colors.primary = brand.primary.trim();
  if (typeof brand.accent === "string" && brand.accent.trim()) colors.accent = brand.accent.trim();
  // bg/text fall through to engine token defaults (theme.ts) when the snapshot omits them.
  const brandOut = { colors };
  if (brand.font === "sans" || brand.font === "serif") brandOut.font = brand.font;
  const logo = typeof brand.logoRef === "string" ? brand.logoRef.trim() : "";
  if (logo) brandOut.logoUrl = logo;

  // --- seo block ---
  const seo = {};
  const domain = typeof brand.domain === "string" ? brand.domain.trim() : "";
  if (domain) seo.domain = domain; // operator-chosen domain (else the host serves a staging domain)
  seo.titleSuffix = ` | ${name}`;

  // --- emergency call bar (reads business.phone; wording only from dispatchRouted) ---
  let callBar;
  if (phone) {
    callBar = {
      enabled: true,
      dispatchRouted: wiring.dispatchRouted === true,
      // The engine's default call-to-action is brand-neutral (lib/trust.mjs). RiseLynk
      // tenants are elevator contractors, so the hydrator sets the entrapment-first line
      // explicitly here (parallel to the elevator-demo config) to preserve it.
      label:
        wiring.dispatchRouted === true
          ? "Someone stuck in an elevator? Call now. Answered by our dispatch, any hour."
          : "Someone stuck in an elevator? Call now during business hours.",
      regionLabel: "Emergency service line",
      note: "For a stuck elevator with someone inside, call first. Do not try to force the doors.",
    };
    T("callBar.dispatchRouted", "capability", callBar.dispatchRouted, "wiring.dispatchRouted");
  }

  // --- blog: seed articles from the snapshot (v0.4.0 seam, addendum 9). Empty when absent
  //     (decision 4: empty blog, no stub post). isValidArticle skips malformed rail entries
  //     without failing the run; every kept article's strings still pass the lint (gate 2). ---
  const rawArticles = Array.isArray(snapshot.articles) ? snapshot.articles : [];
  const articles = [];
  rawArticles.forEach((a, i) => {
    if (isValidArticle(a)) {
      articles.push(mapArticle(a));
      T(`blog.articles[${a.slug}]`, "article", a.slug, "snapshot.articles[]");
    } else {
      dropped.push({ field: `blog.articles[${i}]`, kind: "article", reason: "malformed (missing slug/title/description)" });
    }
  });
  const blog = {
    title: "Field notes",
    description: "Plain-English notes on elevator service for building owners and property managers.",
    articles, // [] when the snapshot carries none (decision 4 stands)
  };

  // --- modernization gallery (v0.4.0 asset resolution, addendum 8). Resolve chosen
  //     before/after pairs into public /mods/ images; unresolved projects drop with a trace
  //     record. The section is emitted (below, on HOME) only when >= 1 project resolves. ---
  const modResult = resolveModProjects(assets.modProjects, { bundleDir });
  for (const r of modResult.resolved) trace.push(r);
  for (const d of modResult.dropped) dropped.push(d);
  const modProjects = modResult.projects;
  const assetPlan = modResult.assets;
  if (modProjects.length) {
    T("modGallery", "section", modProjects.length, "assets.modProjects (resolved)");
  } else if (Array.isArray(assets.modProjects) && assets.modProjects.length) {
    dropped.push({ field: "modGallery", kind: "section", reason: "no project resolved with both images" });
  } else {
    dropped.push({ field: "modGallery", kind: "section", reason: "assets.modProjects empty (opt-in)" });
  }

  // -----------------------------------------------------------------------------
  // Assemble the archetype page set from the gated sections above.
  // -----------------------------------------------------------------------------

  // HOME
  const homeSections = [];
  homeSections.push({
    type: "hero",
    ...(serviceArea ? { subheading: serviceArea } : region ? { subheading: region } : {}),
    heading: "Elevator and escalator service that keeps its records straight.",
    body: `${capitalizeFirst(oxford(activeLineTitles))} for ${routePhrase}. Clear communication, and a service history you can actually see.`,
    ctaLabel: "Request service",
    ctaHref: "/request",
  });
  if (hasAnyTrust) homeSections.push({ type: "trustBar", trust });
  homeSections.push({
    type: "contractorServices",
    subheading: "What we do",
    heading: serviceLines.length > 1 ? `${capitalizeFirst(numberWord(serviceLines.length))} lines of work, one team` : "What we do",
    body: `We work on ${routePhrase}, so one call covers the whole building.`,
    serviceLines,
  });
  // Modernization gallery: emitted only when at least one project resolved BOTH images
  // (addendum 8). The images are RESOLVED into public/mods and traced above.
  if (modProjects.length) {
    homeSections.push({
      type: "modGallery",
      subheading: "Recent work",
      heading: "Before and after",
      body: "A few modernization projects on equipment we service, before and after.",
      enabled: true,
      projects: modProjects,
    });
  }
  homeSections.push({
    type: "summary",
    heading: "Choosing a service company, in short",
    summaryLabel: "The short version",
    body: "If you are deciding who maintains your elevators, a few things separate a company that keeps you informed from one that does not:",
    ordered: true,
    points: [
      "They cover your equipment across manufacturers, not just one brand.",
      "They keep a maintenance log, test records, and the written program together per unit.",
      "You can see your equipment's status and history without chasing anyone.",
      "The records travel with your building if you ever change companies.",
    ],
  });
  // Bind the portal link to https (and an operator origin allowlist when supplied) before it lands
  // in the public "Open the customer portal" CTA (SEC hardening FIX 6). A hostile snapshot pointing
  // it at javascript: or an attacker origin is dropped here rather than rendered.
  const portalUrl = sanitizePortalUrl(wiring.portalUrl, portalOriginAllowlist);
  if (portalUrl) {
    homeSections.push({
      type: "portalDoor",
      subheading: "Already a customer?",
      heading: "See your equipment any time",
      body: "Building managers can check equipment status and service history from the portal link at the front desk, no login required.",
      portalUrl,
      ctaLabel: "Open the customer portal",
    });
    T("portalDoor.portalUrl", "capability", portalUrl, "wiring.portalUrl");
  }
  // FAQ, fully data-gated so every answer is backed by an emitted fact.
  const faqs = [];
  if (multiMfr) {
    faqs.push({
      q: "Do you work on elevators from any manufacturer?",
      a: "Yes. We service mixed-manufacturer routes, so a building with elevators from different makers is handled by one team, and parts are sourced across manufacturers rather than through a single brand.",
    });
  }
  if (callBar) {
    faqs.push({
      q: "How fast can you respond to a callback?",
      a: "During business hours a mechanic is dispatched to callbacks in your service area. After hours, calls reach our on-call line. For an elevator stopped with someone inside, call the number on the bar at the bottom of this page first.",
    });
  }
  if (hasAnyTrust) {
    const creds = [];
    if (trust.licenseNumber) creds.push(region ? `${region} contractor license` : "contractor license");
    if (trust.bonded) creds.push("bond");
    if (trust.insured) creds.push("insurance");
    if (creds.length) {
      const list = oxford(creds);
      const registryClause = trust.registryUrl
        ? ", and the registry link there opens the state lookup so you can check them yourself"
        : "";
      faqs.push({
        q: "Are you licensed and insured?",
        a: `Yes. Our ${list} ${creds.length > 1 ? "are" : "is"} listed in the bar near the top of this page${registryClause}.`,
      });
    }
  }
  if (fleet.hasPeriodicTesting === true) {
    faqs.push({
      q: "Do you handle the periodic safety tests?",
      a: "We schedule and run the periodic tests your equipment is due for and keep the records with each unit. Which tests apply, and how often, depends on what your jurisdiction has adopted. Your authority having jurisdiction and our team confirm what applies to your building.",
    });
  }
  if (faqs.length) homeSections.push({ type: "faq", heading: "Common questions", faqs });
  homeSections.push({
    type: "cta",
    heading: "Need service, or a second opinion?",
    body: "Tell us about your building and we will get back to you.",
    ctaLabel: "Request service",
    ctaHref: "/request",
  });

  const pages = [
    {
      slug: "",
      title: "Elevator and escalator service",
      description: `${name} provides elevator and escalator ${oxford(activeLineTitles)}${serviceArea ? ` across ${serviceArea.replace(/^serving\s+/i, "")}` : ""}.`,
      nav: "Home",
      sections: homeSections,
    },
  ];

  // REQUEST SERVICE
  const intakeUrl = typeof wiring.intakeUrl === "string" ? wiring.intakeUrl.trim() : "";
  const requestSection = {
    type: "requestService",
    subheading: "Request service",
    heading: "Tell us what is going on",
    body: "Send us the building and what you are seeing. During business hours we route it to a mechanic.",
    intakeEmail: email,
    fields: ["phone", "service", "message"],
    services: serviceOptions,
    submitLabel: "Send request",
  };
  if (intakeUrl) {
    requestSection.intakeUrl = intakeUrl;
    requestSection.referenceNote =
      "Your request is logged and routed to our dispatch. We will follow up with a reference number.";
    T("requestService.intakeUrl", "capability", intakeUrl, "wiring.intakeUrl");
  }
  pages.push({
    slug: "request",
    title: "Request service",
    description: `Request elevator or escalator service from ${name}.`,
    nav: "Request service",
    sections: [requestSection],
  });

  // ABOUT
  pages.push({
    slug: "about",
    title: "About",
    description: `About ${name}, an elevator and escalator service company${serviceArea ? ` ${serviceArea.replace(/^serving\s+/i, "serving ")}` : ""}.`,
    nav: "About",
    sections: [
      {
        type: "about",
        subheading: "About us",
        heading: "One team for the whole building",
        body: `${name} works on ${routePhrase}${serviceArea ? ` ${serviceArea.replace(/^serving\s+/i, "across ")}` : ""}.\n\nWe answer the phone and keep your records straight.`,
      },
    ],
  });

  // CONTACT
  pages.push({
    slug: "contact",
    title: "Contact",
    description: `Call or message ${name}.`,
    nav: "Contact",
    sections: [
      {
        type: "contact",
        heading: "Get in touch",
        body: "Call during business hours, or send a message and we will reply quickly. For a stuck elevator with someone inside, use the call bar at the bottom of the page.",
      },
    ],
  });

  // careers / records: default OFF (decision 4). The snapshot carries no careers or records
  // content, so nothing is emitted. (modGallery resolution and its drop record are above.)
  dropped.push({ field: "careers", kind: "section", reason: "no careers content in snapshot (opt-in)" });
  dropped.push({ field: "records", kind: "section", reason: "no records content in snapshot (opt-in)" });

  // -----------------------------------------------------------------------------
  // Final config, keys ordered to match the schema for a readable diff.
  // -----------------------------------------------------------------------------
  const config = {
    archetype: "elevator-contractor",
    business,
    brand: brandOut,
    seo,
    ...(callBar ? { callBar } : {}),
    blog,
    pages,
  };

  return { config, trace, dropped, assets: assetPlan };
}

// -----------------------------------------------------------------------------
// Serializer: emit a typed, self-contained site.config.ts. JSON is valid TS for an object
// literal, and the SiteConfig annotation makes tsc (via `next build`) type-check the map.
// -----------------------------------------------------------------------------

// Neutralize a value interpolated into a single-line // comment (SEC hardening FIX 6). Only a line
// terminator breaks out of a // comment, so \u-escape CR, LF, and the Unicode line separators
// (U+2028 / U+2029); the value then cannot inject code into the generated site.config.ts that
// `next build` would execute.
function oneLineCommentValue(v) {
  return String(v == null ? "" : v).replace(/[\r\n\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

export function serializeConfig(config, meta = {}) {
  const header = [
    "// GENERATED by tools/hydrate.mjs from an approved publish-profile snapshot.",
    "// Do not edit by hand. Regenerate with: node tools/hydrate.mjs <snapshot> <outdir>",
    `// Snapshot: ${oneLineCommentValue(meta.snapshotPath) || "(inline)"}`,
    `// schemaVersion ${oneLineCommentValue(meta.schemaVersion) || "?"} | tenant ${oneLineCommentValue(meta.tenantSlug) || "?"} | approvedAt ${oneLineCommentValue(meta.approvedAt) || "null"}`,
    "//",
    "// This config was reviewed by three gates on emit: the claims wall (facts only when",
    "// proven), the banned-phrase lint (100 percent of strings), and the claims trace",
    "// (claims-trace.json alongside this file). It is a preview candidate for operator review.",
  ].join("\n");
  const body = JSON.stringify(config, null, 2);
  return `${header}\nimport type { SiteConfig } from "@/lib/config-schema";\n\nexport const site: SiteConfig = ${body};\n`;
}

// -----------------------------------------------------------------------------
// CLI.
// -----------------------------------------------------------------------------

function runCli(argv) {
  const snapshotPath = argv[0];
  if (!snapshotPath) {
    console.error("Usage: node tools/hydrate.mjs <snapshot.json | bundle .../snapshot.json> [outdir]");
    process.exit(2);
  }
  const outdir = argv[1] ? resolve(argv[1]) : resolve(dirname(resolve(snapshotPath)), "hydrated");

  const raw = readFileSync(resolve(snapshotPath), "utf8");
  const snapshot = JSON.parse(raw);

  // Bundle-aware input: the snapshot's own directory is the bundle root; its sibling assets/
  // dir holds the images. This is identical for a v0.4.0 bundle (<approvedAt>/snapshot.json)
  // and a flat v0.3.0 object (<approvedAt>.json) - the flat form simply has no assets/ sibling,
  // so the resolver finds no images and the gallery is absent (backward-compat).
  const bundleDir = dirname(resolve(snapshotPath));
  // Operator-supplied approved portal origin(s) for the portal-link allowlist (SEC hardening FIX 6),
  // comma-separated. Unset -> the https parse is the only gate (backward compatible).
  const portalOriginAllowlist = (process.env.PORTAL_ORIGIN_ALLOWLIST || "").split(",").map((s) => s.trim()).filter(Boolean);
  const { config, trace, dropped, assets } = hydrate(snapshot, { bundleDir, portalOriginAllowlist });

  // Gate 2: banned-phrase lint over every emitted string. Fail the run on any violation.
  const { count, violations } = lintConfig(config);
  if (violations.length) {
    console.error(`\nBANNED-PHRASE LINT FAILED (${violations.length} violation(s) across ${count} strings):`);
    for (const v of violations) console.error(`  - [${v.rule}] "${v.match}" at ${v.path}`);
    process.exit(1);
  }

  mkdirSync(outdir, { recursive: true });
  const meta = {
    snapshotPath: snapshotPath,
    schemaVersion: snapshot.schemaVersion,
    tenantSlug: snapshot.tenantSlug,
    approvedAt: snapshot.approvedAt,
  };
  const configPath = join(outdir, "site.config.ts");
  const tracePath = join(outdir, "claims-trace.json");
  writeFileSync(configPath, serializeConfig(config, meta), "utf8");
  writeFileSync(
    tracePath,
    JSON.stringify(
      {
        schemaVersion: snapshot.schemaVersion,
        tenantSlug: snapshot.tenantSlug,
        snapshotPath,
        hydratedAt: new Date().toISOString(),
        stringsLinted: count,
        lintViolations: 0,
        emitted: trace,
        dropped,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // Resolve chosen mod-gallery images into the engine's public/mods dir so `next build`
  // serves them at the emitted /mods/<file> paths. Absent on a v0.3.0 bare snapshot (no
  // assets), so this is a no-op there.
  const nAssets = writeAssets(assets, PUBLIC_MODS_DIR);

  // Summary tail for the DoD evidence capture.
  const creds = trace.filter((t) => t.kind === "credential");
  const caps = trace.filter((t) => t.kind === "capability");
  const assetTrace = trace.filter((t) => t.kind === "asset");
  const articleTrace = trace.filter((t) => t.kind === "article");
  console.log(`hydrate: ${meta.tenantSlug} (schema ${meta.schemaVersion})`);
  console.log(`  config      -> ${configPath}`);
  console.log(`  claims-trace-> ${tracePath}`);
  if (nAssets) console.log(`  assets      -> ${PUBLIC_MODS_DIR} (${nAssets} image file(s))`);
  console.log(`  strings linted: ${count}  violations: 0`);
  console.log(`  credentials emitted: ${creds.length}  capabilities emitted: ${caps.length}`);
  console.log(`  assets resolved: ${assetTrace.length}  articles seeded: ${articleTrace.length}`);
  console.log(`  dropped by claims wall: ${dropped.length}`);
  for (const d of dropped) console.log(`    - ${d.field} (${d.reason})`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) runCli(process.argv.slice(2));
