// ============================================================
// site-engine - lead-capture content gate core (Phases 0-1)
//
// Spec: docs/plans/lead-capture-content-gate.md. The gate trades one config-
// supplied content asset (a checklist, a pricing guide, a spec sheet) for a
// lead through the engine's existing save-first intake (/api/lead +
// lib/contact-intake.mjs). This module is the pure, testable half: the source
// tag rule and the POST-body assembly components/ContentGate.tsx submits.
// Mirrors the lib/rating-ld.mjs shared-core pattern: one dependency-free .mjs
// the app imports through TypeScript AND tools/content-gate.test.mjs drives in
// plain Node.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS caller a signature.
// ============================================================

/**
 * @typedef {{
 *   id?: string,
 *   asset: { href: string, label?: string },
 *   bullets?: string[],
 *   fields?: ("phone" | "message")[],
 *   submitLabel?: string,
 *   successMessage?: string,
 *   source?: string,
 * }} ContentGateConfig
 */

// gate.asset.href scheme guard (SEC hardening, consistent with the wiring.portalUrl
// hardening in tools/hydrate.mjs sanitizePortalUrl, v0.18.1 FIX 6). Unlike a portal link
// (always an absolute tenant URL), the config docs say the gated asset is normally "an
// asset in public/ (or an absolute URL)" - a relative path is the common case, not the
// exception - so this accepts EITHER:
//   - a same-origin relative path: exactly one leading "/", never "//" (protocol-relative,
//     a browser resolves it against whatever scheme served the page and can redirect
//     off-site) and no backslash (some browsers normalize "\" to "/", opening the same
//     off-origin trick through a path that LOOKS same-origin at a glance); or
//   - an absolute https URL (parsed with the URL constructor, so a malformed string never
//     reaches the render).
// Anything else (javascript:, data:, a bare http:// URL, vbscript:, mailto:, ...) returns
// null. The caller (components/ContentGate.tsx) treats null exactly like a missing asset:
// render nothing, never a hostile href - fail-closed at render (Next's static build), the
// same posture sanitizePortalUrl takes at hydrate time.
/** @param {unknown} raw @returns {string|null} */
export function sanitizeGateAssetHref(raw) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//") && !s.includes("\\")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? s : null;
  } catch {
    return null;
  }
}

// The lead source tag for a gate submission, so the operator can see which gate
// produced a lead. An explicit config `source` wins; otherwise "content-gate:<id>"
// when the gate has an id, else the bare "content-gate". Trimmed to the 40-char
// cap lib/contact-intake.mjs applies to `source`, so what we send is what the
// intake keeps (no silent server-side truncation surprise).
/** @param {ContentGateConfig | undefined | null} gate @returns {string} */
export function gateSource(gate) {
  const g = gate || {};
  const explicit = String(g.source || "").trim();
  const id = String(g.id || "").trim();
  const tag = explicit || (id ? "content-gate:" + id : "content-gate");
  return tag.slice(0, 40);
}

// Assemble the /api/lead POST body from the submitted form data. Only KNOWN
// intake columns are emitted (name, email, opted-in phone/message, source, and
// the reserved honeypot / Turnstile keys), so nothing the gate sends is silently
// folded or dropped by the intake mapper. The honeypot `website` value and the
// Turnstile token pass through UNTOUCHED: the server-side trap and verifier must
// see exactly what the browser sent.
/**
 * @param {Record<string, string> | undefined | null} data submitted form fields
 * @param {ContentGateConfig | undefined | null} gate
 * @returns {Record<string, string>}
 */
export function gateLeadBody(data, gate) {
  const d = data || {};
  const g = gate || {};
  const opted = Array.isArray(g.fields) ? g.fields : [];
  /** @type {Record<string, string>} */
  const body = {
    name: String(d.name || ""),
    email: String(d.email || ""),
  };
  if (opted.includes("phone")) body.phone = String(d.phone || "");
  if (opted.includes("message")) body.message = String(d.message || "");
  if ("website" in d) body.website = d.website;
  if ("cf-turnstile-response" in d) body["cf-turnstile-response"] = d["cf-turnstile-response"];
  body.source = gateSource(g);
  return body;
}
