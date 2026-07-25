// ============================================================
// site-engine - lead-capture delivery preflight (engine feedback items #30a, #30c)
//
// Incident (maxlynk-services, ryan-dehart / ARK Fabrication, live client site,
// 2026-07-20): the Vercel project had no delivery env wired (no
// RESEND_API_KEY, no LEADS_ENDPOINT), so /api/lead answered
// { ok:true, saved:false, notified:false } by design (the engine's correct
// dev-mode "accepted, not sent" semantics) - but this was production. The
// client-side mailto fallback then pointed at business.email, which was still
// the hello@arkfabrication.example PLACEHOLDER. Every lead since go-live was
// undeliverable either way, silently.
//
// This module is the shared, pure detection logic behind two build-time
// signals (wired by next.config.ts, the one place the active site config and
// the build's process.env are both visible before any page renders):
//
//   - #30a placeholderEmailIssue(): a leadform/contact section is live but
//     business.email still looks like a placeholder. FAILs the build only on
//     genuine production intent (a real domain, not draft - see
//     isRealProductionIntent below); WARNs otherwise, so an in-progress or
//     demo build stays green.
//   - #30c deliveryWiringIssue(): a leadform/contact section is live but
//     NEITHER RESEND_API_KEY nor LEADS_ENDPOINT is set, so every submission
//     is heading into lib/contact-intake.mjs's benign "accepted, not sent" /
//     no-store defaults. Always a loud log line (this is visibility, not a
//     hard gate - deploy-time enforcement of this is engine-feedback #30b,
//     explicitly OUT of scope here; it lives in the consumer's own
//     engine-build tool, which can see the target Vercel project's real env
//     names).
//
// #30b (a deploy-time `vercel env ls` check) is deliberately NOT built here:
// the engine has no visibility into a consumer's Vercel project during a
// `next build`, only into its OWN build-time process.env.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS caller (next.config.ts)
// a real signature. Zero dependencies, unit-tested in plain Node
// (tools/delivery-guard.test.mjs).
// ============================================================

// Reserved/placeholder host shapes (feedback #30a's literal list): the RFC 2606
// reserved TLDs ".example" and ".invalid" (used throughout this engine's OWN
// example/ and dist/hydrated/ fixtures - see isRealProductionIntent below for
// why that does not make the engine's own demo builds FAIL), the literal
// "yourdomain." placeholder brand, and the "example.com" domain hardcoded into
// countless docs/templates as a stand-in address.
/**
 * @param {unknown} rawHost
 * @returns {boolean}
 */
export function isPlaceholderHost(rawHost) {
  const host = String(rawHost || "").trim().toLowerCase();
  if (!host) return false;
  if (host.endsWith(".example")) return true;
  if (host.endsWith(".invalid")) return true;
  if (host.includes("yourdomain.")) return true;
  if (host === "example.com" || host.endsWith(".example.com")) return true;
  return false;
}

// business.email's placeholder check: the shape lives in the domain half
// (after the last "@" - conservatively the LAST, since a local-part cannot
// itself contain an unescaped "@" in practice here, and this only needs to
// catch the reserved-TLD / well-known-placeholder shapes above, not be a full
// RFC 5322 parser).
/**
 * @param {unknown} rawEmail
 * @returns {boolean}
 */
export function isPlaceholderEmail(rawEmail) {
  const email = String(rawEmail || "").trim();
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  return isPlaceholderHost(email.slice(at + 1));
}

/** @param {unknown} rawUrl @returns {string} */
function hostnameOf(rawUrl) {
  const s = String(rawUrl || "").trim();
  if (!s) return "";
  try {
    return new URL(s).hostname;
  } catch {
    // Not a well-formed absolute URL. Fall back to a bare host/domain string
    // (config authors sometimes write "example.com" without a scheme).
    return s.replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0];
  }
}

// Production intent, in the sense feedback #30a asks for ("key off
// seo.draft/domain the way the noindex logic does" - lib/seo.ts isIndexable):
// a real domain is configured AND the build is not explicitly marked draft.
// isIndexable() itself is untouched (it is the SEO/robots contract and stays
// exactly as it is); this is a DELIBERATELY narrower sibling for the
// placeholder-email wall specifically, because isIndexable's plain
// "domain is set" check is true for every one of the engine's OWN example/
// and dist/hydrated/ fixtures too (they all set a real-looking
// https://*.example seo.domain so they render/link correctly) - the exact
// same reserved-TLD shape as a placeholder EMAIL. A build whose own site
// domain is ITSELF placeholder-shaped is a demo/fixture, not a live rollout,
// so it stays in WARN territory; a real domain (e.g.
// https://arkfabricating.com, the ryan-dehart production site) is what turns
// this into a hard FAIL. This is what keeps `npm run build` and both hydrated
// fixture builds green with zero config changes (the additive-versioning
// contract) while still catching the real incident shape: a real domain paired
// with a still-placeholder business.email.
/**
 * @param {{ seo?: { domain?: string, draft?: boolean } }} site
 * @returns {boolean}
 */
export function isRealProductionIntent(site) {
  const domain = site?.seo?.domain;
  if (!domain) return false;
  if (site?.seo?.draft === true) return false;
  return !isPlaceholderHost(hostnameOf(domain));
}

// Does the active config publish a leadform or contact section anywhere, on a
// non-draft page? Mirrors the existing "collect across all pages, skip draft"
// idiom (lib/services.ts, lib/area-ld.mjs, lib/llms.ts): a draft page is not
// yet approved to go live, so a form on it is not a live delivery surface.
/**
 * @param {{ pages?: { draft?: boolean, sections?: { type?: string }[] }[] }} site
 * @returns {boolean}
 */
export function hasLeadCapture(site) {
  for (const page of site?.pages ?? []) {
    if (page?.draft) continue;
    for (const section of page?.sections ?? []) {
      if (section?.type === "leadform" || section?.type === "contact") return true;
    }
  }
  return false;
}

// Broader email-intake surface for the Turnstile readiness WARN (trust pack):
// every section type that renders an email field for lead/intake. hasLeadCapture
// stays narrower (delivery wiring / placeholder-email only care about the
// engine's own /api/contact + /api/lead path); this one also covers contentGate,
// requestService, and careers so the "forms SHOULD have Turnstile on" posture
// reaches every email entry form.
const EMAIL_INTAKE_TYPES = new Set([
  "leadform",
  "contact",
  "contentGate",
  "requestService",
  "careers",
]);

/**
 * @param {{ pages?: { draft?: boolean, sections?: { type?: string }[] }[] }} site
 * @returns {boolean}
 */
export function hasEmailIntake(site) {
  for (const page of site?.pages ?? []) {
    if (page?.draft) continue;
    for (const section of page?.sections ?? []) {
      if (EMAIL_INTAKE_TYPES.has(section?.type)) return true;
    }
  }
  return false;
}

// Trust-pack readiness: a live email form without security.turnstile.siteKey.
// Always WARN (never FAIL) - Turnstile needs a per-site Cloudflare key the
// founder must create; the engine cannot invent one. Loud so go-live configs
// do not ship the human check off by accident.
/**
 * @param {{ pages?: { draft?: boolean, sections?: { type?: string }[] }[],
 *   security?: { turnstile?: { siteKey?: string } } }} site
 * @returns {{ message: string } | null}
 */
export function turnstileMissingIssue(site) {
  if (!hasEmailIntake(site)) return null;
  if (String(site?.security?.turnstile?.siteKey || "").trim()) return null;
  return {
    message:
      "an email intake form is live but security.turnstile.siteKey is unset. Forms SHOULD " +
      "carry the Cloudflare Turnstile human check (set the public siteKey in config and " +
      "TURNSTILE_SECRET in server env). Unconfigured sites still accept leads (honeypot " +
      "only); a one-sided key/secret deploy fails CLOSED with turnstile_misconfig.",
  };
}

// #30a. null when there is nothing to say (no live leadform/contact section,
// or a real-looking business.email). Otherwise a severity ("FAIL" on genuine
// production intent, "WARN" everywhere else - preview, domain-less, draft, or
// the engine's own placeholder-domained demo/fixture builds) plus a message
// naming the exact field and value at fault, for a loud, actionable build log
// line either way.
/**
 * @param {{ business?: { email?: string }, seo?: { domain?: string, draft?: boolean },
 *   pages?: { draft?: boolean, sections?: { type?: string }[] }[] }} site
 * @returns {{ severity: "FAIL" | "WARN", message: string } | null}
 */
export function placeholderEmailIssue(site) {
  if (!hasLeadCapture(site)) return null;
  const email = site?.business?.email;
  if (!isPlaceholderEmail(email)) return null;
  const severity = isRealProductionIntent(site) ? "FAIL" : "WARN";
  const message =
    `business.email "${email}" looks like a placeholder address while a leadform/contact ` +
    `section is enabled. Every submission's mailto fallback (and any notify email that IS ` +
    `configured) would target an address nobody reads. Set business.email to a real inbox ` +
    `before this ships live.`;
  return { severity, message };
}

// #30c. null when there is nothing to say (no live leadform/contact section,
// or at least one delivery path is actually wired). Otherwise a message: a
// leadform/contact section is live and lib/contact-intake.mjs's getSender()/
// getSaver() are both about to resolve to their benign dev-mode defaults (null
// sender = "accepted, not sent"; no-op saver = saved:false) - the exact
// black-hole shape from the incident, now visible in the build log BEFORE a
// visitor ever finds it. `env` is injected (process.env in production, a
// fake in the harness) so this stays pure and dependency-free.
/**
 * @param {{ pages?: { draft?: boolean, sections?: { type?: string }[] }[] }} site
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ message: string } | null}
 */
export function deliveryWiringIssue(site, env = {}) {
  if (!hasLeadCapture(site)) return null;
  const hasResend = Boolean(String(env.RESEND_API_KEY || "").trim());
  const hasLeadsEndpoint = Boolean(String(env.LEADS_ENDPOINT || "").trim());
  if (hasResend || hasLeadsEndpoint) return null;
  const message =
    "a leadform/contact section is enabled but neither RESEND_API_KEY nor LEADS_ENDPOINT is " +
    "set. Every submission will report saved:false, notified:false (deliveryStatus: " +
    '"black_hole") - accepted by the API, delivered nowhere. Wire one of them before this ' +
    "goes live, or pass an explicit override if the site is genuinely mailto-only.";
  return { message };
}
