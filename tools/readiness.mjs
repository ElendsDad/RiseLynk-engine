// =============================================================================
// GO-LIVE READINESS LINTER - completeness, not validity.
//
//   node tools/readiness.mjs <config.json|.mjs|.js> [<more...>]
//   node tools/readiness.mjs --clients-root <maxlynk-services/clients>
//
// preflight.mjs checks validity (claims, asset paths, section types). lint-config.mjs
// checks banned phrases. Neither answers "what high-value shipped field did I leave
// unset on this client?" This report does.
//
// Severities:
//   WARN  - high-value, config-only, free to turn on (schemaType, openingHours,
//           serviceArea section, ogImage, location, emergency247 when the site already
//           claims any-hour service, callBar.emergencyContext on elevator archetype)
//   INFO  - needs a live key/secret, a paid product, or a founder decision
//           (turnstile, analytics). Reported, never auto-filled by a sweep.
//
// Exit 0 by default (report). Pass --strict to exit 1 when any WARN is present.
// =============================================================================

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { resolve, dirname, join, extname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { gbpConfigured } from "../lib/gbp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = resolve(HERE, "..");

/**
 * @typedef {{ id: string, severity: "WARN" | "INFO", message: string }} Finding
 * @typedef {{ slug: string, path: string, findings: Finding[] }} Report
 */

function hasServiceAreaSection(site) {
  for (const page of site.pages ?? []) {
    if (page?.draft) continue;
    for (const s of page.sections ?? []) {
      if (s?.type === "serviceArea" && Array.isArray(s.areas) && s.areas.some((a) => a?.name)) {
        return true;
      }
    }
  }
  return false;
}

function claimsAnyHour(site) {
  if (site.business?.emergency247 === true) return true;
  if (site.callBar?.dispatchRouted === true) return true;
  const hours = typeof site.business?.hours === "string" ? site.business.hours : "";
  return /any hour|24\/7|around the clock|answered any hour/i.test(hours);
}

/**
 * Score one loaded site config object.
 * @param {Record<string, unknown>} site
 * @param {{ slug?: string, path?: string }} [meta]
 * @returns {Report}
 */
export function assessReadiness(site, meta = {}) {
  /** @type {Finding[]} */
  const findings = [];
  const b = site.business ?? {};
  const seo = site.seo ?? {};
  const brand = site.brand ?? {};
  const security = site.security ?? {};
  const callBar = site.callBar ?? {};

  if (!b.schemaType) {
    findings.push({
      id: "schemaType",
      severity: "WARN",
      message: "business.schemaType unset (emits plain LocalBusiness instead of Plumber/HVACBusiness/...)",
    });
  }
  if (!Array.isArray(b.openingHours) || !b.openingHours.length) {
    findings.push({
      id: "openingHours",
      severity: "WARN",
      message: "business.openingHours unset (no openingHoursSpecification JSON-LD; free-form hours string alone)",
    });
  }
  if (!hasServiceAreaSection(site)) {
    findings.push({
      id: "serviceArea",
      severity: "WARN",
      message: "no serviceArea section (structured areaServed Places + llms.txt areas line unused)",
    });
  }
  if (!seo.ogImage) {
    findings.push({
      id: "ogImage",
      severity: "WARN",
      message: "seo.ogImage unset (share/text-message previews are blank)",
    });
  }
  if (!b.location || !b.location.locality || !b.location.region) {
    findings.push({
      id: "location",
      severity: "WARN",
      message: "business.location incomplete (LocalBusiness JSON-LD needs locality + region)",
    });
  }
  if (claimsAnyHour(site) && b.emergency247 !== true) {
    findings.push({
      id: "emergency247",
      severity: "WARN",
      message: "site claims any-hour service but business.emergency247 is not true (no emergency ContactPoint)",
    });
  }
  if (site.archetype === "elevator-contractor" && callBar.enabled && !callBar.emergencyContext) {
    findings.push({
      id: "emergencyContext",
      severity: "WARN",
      message: "elevator archetype callBar enabled without callBar.emergencyContext (llms.txt emergency tip silent)",
    });
  }
  if (!brand.faviconUrl) {
    findings.push({
      id: "faviconUrl",
      severity: "INFO",
      message: "brand.faviconUrl unset",
    });
  }
  if (!security.turnstile?.siteKey) {
    findings.push({
      id: "turnstile",
      severity: "INFO",
      message: "security.turnstile unset (needs a live Cloudflare siteKey + TURNSTILE_SECRET; founder-wired)",
    });
  }
  const analytics = site.analytics;
  if (!analytics || (!analytics.plausibleDomain && !analytics.gaMeasurementId && !analytics.cloudflareToken)) {
    findings.push({
      id: "analytics",
      severity: "INFO",
      message:
        "analytics unset (Plausible is a paid product; prefer Cloudflare Web Analytics or another free option before enabling)",
    });
  }
  // GBP drives the Local Pack; leave templates unset (never a placeholder URL) and
  // surface the gap here. Software / SaaS storefronts skip — no Local Pack surface.
  if (site.archetype !== "software" && !gbpConfigured(b.gbp)) {
    findings.push({
      id: "gbp",
      severity: "WARN",
      message:
        "business.gbp unset (no Google Business Profile placeId/profileUrl/reviewUrl; Local Pack alignment and review CTA idle). Paste real values after Josh claims the profile — never a template placeholder",
    });
  }

  return {
    slug: meta.slug ?? "config",
    path: meta.path ?? "",
    findings,
  };
}

/** Offline .ts loader mirroring maxlynk-services preflight strip (import type only). */
export function stripTypesToJs(source) {
  let js = source
    .replace(/^\s*import\s+type\s+[\s\S]*?;\s*$/gm, "")
    .replace(/^\s*import\s+\{[^}]*\}\s+from\s+["'][^"']+["'];\s*$/gm, (line) =>
      /\btype\b/.test(line) || /import\s+type/.test(line) ? "" : line,
    );
  // Drop remaining `import type` and pure type-only named imports.
  js = js.replace(/^\s*import\s+type\s+[\s\S]*?;\s*$/gm, "");
  js = js.replace(/^\s*import\s+\{[^}]*\}\s+from\s+["']@\/lib\/config-schema["'];\s*$/gm, "");
  // If anything module-shaped remains besides export const site, fail loudly.
  const residue = js.match(/^\s*import\s+/m);
  if (residue) {
    throw new Error(
      `config has TypeScript/module surface this offline loader does not handle: "${residue[0].trim()}"`,
    );
  }
  return js;
}

export async function loadConfigFile(file) {
  const abs = resolve(file);
  const ext = extname(abs).toLowerCase();
  if (ext === ".json") {
    return JSON.parse(readFileSync(abs, "utf8"));
  }
  if (ext === ".mjs" || ext === ".js") {
    const mod = await import(pathToFileURL(abs).href + `?t=${Date.now()}`);
    const config = mod.site ?? mod.default;
    if (!config) throw new Error(`no "site" or default export in ${file}`);
    return config;
  }
  if (ext === ".ts") {
    // Prefer TypeScript transpile when available (repo devDependency).
    const require = createRequire(import.meta.url);
    let js;
    try {
      const ts = require(join(ENGINE_ROOT, "node_modules/typescript/lib/typescript.js"));
      js = ts.transpileModule(readFileSync(abs, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
    } catch {
      js = stripTypesToJs(readFileSync(abs, "utf8"));
    }
    const tmp = mkdtempSync(join(tmpdir(), "readiness-"));
    const out = join(tmp, "config.mjs");
    writeFileSync(out, js, "utf8");
    try {
      const mod = await import(pathToFileURL(out).href);
      if (!mod.site) throw new Error(`no "site" export in ${file}`);
      return mod.site;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  throw new Error(`unsupported config extension "${ext}"`);
}

export async function assessConfigPath(file) {
  const site = await loadConfigFile(file);
  // clients/<slug>/site/site.config.ts → slug; otherwise the file stem.
  const parent = basename(dirname(file));
  const grand = basename(dirname(dirname(file)));
  const slug = parent === "site" ? grand : basename(file, extname(file));
  return assessReadiness(site, { slug, path: file });
}

export async function assessClientsRoot(clientsRoot) {
  const root = resolve(clientsRoot);
  const reports = [];
  for (const entry of readdirSync(root)) {
    if (entry.startsWith("_")) continue;
    const configPath = join(root, entry, "site", "site.config.ts");
    if (!existsSync(configPath)) continue;
    const st = statSync(join(root, entry));
    if (!st.isDirectory()) continue;
    reports.push(await assessConfigPath(configPath));
  }
  reports.sort((a, b) => a.slug.localeCompare(b.slug));
  return reports;
}

export function formatReport(reports) {
  const lines = [];
  let warns = 0;
  let infos = 0;
  for (const r of reports) {
    const w = r.findings.filter((f) => f.severity === "WARN");
    const i = r.findings.filter((f) => f.severity === "INFO");
    warns += w.length;
    infos += i.length;
    lines.push(`## ${r.slug}`);
    if (!r.findings.length) {
      lines.push("  (clean)");
      continue;
    }
    for (const f of r.findings) {
      lines.push(`  [${f.severity}] ${f.id}: ${f.message}`);
    }
  }
  lines.push("");
  lines.push(`Summary: ${reports.length} config(s), ${warns} WARN, ${infos} INFO`);
  return lines.join("\n");
}

async function runCli(argv) {
  let strict = false;
  let clientsRoot = null;
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") strict = true;
    else if (a === "--clients-root") clientsRoot = argv[++i];
    else if (a.startsWith("-")) {
      console.error(`unknown flag ${a}`);
      process.exit(2);
    } else files.push(a);
  }
  if (!clientsRoot && !files.length) {
    console.error(
      "Usage: node tools/readiness.mjs <config.(json|mjs|js|ts)>...\n" +
        "       node tools/readiness.mjs --clients-root <clientsDir>\n" +
        "       (add --strict to exit 1 on WARN)",
    );
    process.exit(2);
  }
  /** @type {Report[]} */
  let reports = [];
  try {
    if (clientsRoot) reports = await assessClientsRoot(clientsRoot);
    for (const f of files) reports.push(await assessConfigPath(f));
  } catch (err) {
    console.error(`readiness: ${err.message}`);
    process.exit(2);
  }
  const text = formatReport(reports);
  console.log(text);
  if (strict && reports.some((r) => r.findings.some((f) => f.severity === "WARN"))) {
    process.exit(1);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) runCli(process.argv.slice(2));
