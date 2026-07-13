// ============================================================
// site-engine - hardened contact / lead intake core
//
// Harvested from RiseLynk's contact-submit Edge Function
// (RiseLynk/supabase/functions/contact-submit/index.ts) and generalized for the
// engine: no brand, no project ref, no RiseLynk URL. Every target (notify-to,
// from-address, optional durable lead sink) is read from config / env by the
// caller or by getSaver()/getSender() - never a literal.
//
// The hardening this brings over a plain "send an email" receiver:
//   - SAVE FIRST, then notify. The lead is handed to a saver before the mailer
//     runs, so a mail hiccup never loses it.
//   - NEVER an error on a mail failure: submit() returns { ok:true,
//     notified:false } so the browser shows success and the lead is not retried
//     into oblivion.
//   - Best-effort on BOTH paths: a save hiccup does not block the notify either.
//   - reply_to = the lead, so a reply reaches them directly.
//   - Every field is HTML-escaped into the notification body.
//   - Fail-open rate limiting: a limiter error never blocks a real submit.
//
// The mailer and the lead store are isolated behind getSender()/getSaver() (the
// RiseLynk getSender() + __test pattern) so tools/contact-intake.test.mjs drives
// the pure logic with injected fakes.
//
// R1 scope note (brochure-level, no durable schema): the DEFAULT saver is a
// benign no-op until a site configures LEADS_ENDPOINT (a generic sink that owns
// its own schema; the engine defines none). Where durable lead state ultimately
// lives is the unification plan's open decision #1, settled at R3. Until then the
// never-drop guarantee at the edge is carried by the notification email plus the
// client-side mailto fallback in the form components.
//
// Plain ESM (no TypeScript annotations) so the same module is imported directly
// by the Node test harness AND by the app's route handlers; JSDoc gives the TS
// routes a real signature without a separate declaration file.
// ============================================================

/** @typedef {(m: any) => Promise<any>} MailSender */
/** @typedef {(lead: any) => Promise<any>} LeadSaver */

// Read a value from the runtime env (Node route handler or the test harness).
/** @param {string} k @returns {string} */
function env(k) {
  const p = globalThis.process;
  return (p && p.env && p.env[k]) || "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// HTML-escape a value for safe inclusion in the notification email body.
/** @param {unknown} s @returns {string} */
export function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&"']/g, (c) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// The mailer seam. An injected global wins (the test harness / a custom sender);
// otherwise a Resend sender is built from RESEND_API_KEY. No key and no injected
// sender returns null, and the caller treats that as "accepted, not sent" (dev).
/** @returns {MailSender | null} */
export function getSender() {
  if (globalThis.__ENGINE_MAIL_SENDER) return globalThis.__ENGINE_MAIL_SENDER;
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) return null;
  return async (m) => {
    const payload = { from: m.from, to: [m.to], subject: m.subject, html: m.html, text: m.text };
    if (m.reply_to) payload.reply_to = m.reply_to;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("resend " + r.status);
    return true;
  };
}

// The lead-store seam. An injected global wins (the test harness / a custom
// sink); otherwise, if LEADS_ENDPOINT is configured, POST the lead as JSON to
// that generic endpoint (it owns its own schema; the engine defines none). With
// nothing configured the saver is a benign no-op that reports saved:false, so a
// brochure site drops in no store and relies on the email + mailto fallback.
/** @returns {LeadSaver} */
export function getSaver() {
  if (globalThis.__ENGINE_LEAD_SAVER) return globalThis.__ENGINE_LEAD_SAVER;
  const endpoint = env("LEADS_ENDPOINT");
  if (!endpoint) {
    return async () => ({ saved: false, reason: "no_store" });
  }
  const key = env("LEADS_ENDPOINT_KEY");
  return async (lead) => {
    const headers = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = "Bearer " + key;
    const r = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(lead) });
    if (!r.ok) throw new Error("lead-store " + r.status);
    return { saved: true };
  };
}

// Best-effort per-IP rate limit. Fail-OPEN by construction: saving/notifying a
// real lead matters more than perfect throttling, so ANY inability to evaluate
// the limit (no ip, no store, an error) returns true (allowed). This is an
// in-memory sliding window - per serverless instance, not global - and is the
// brochure-level stand-in until a durable limiter lands with the R3 store.
const _rlBuckets = new Map();
/**
 * @param {{ ip?: string, bucket?: string, max?: number, windowSecs?: number }} [opts]
 * @returns {Promise<boolean>}
 */
export async function rateOk(opts = {}) {
  try {
    const { ip = "", bucket = "contact", max = 10, windowSecs = 3600 } = opts;
    const key = String(ip || "").trim();
    if (!key) return true; // cannot identify the caller -> do not block
    const now = Date.now();
    const windowMs = windowSecs * 1000;
    const id = bucket + ":" + key;
    const hits = (_rlBuckets.get(id) || []).filter((t) => now - t < windowMs);
    hits.push(now);
    _rlBuckets.set(id, hits);
    return hits.length <= max;
  } catch (_) {
    return true; // fail open
  }
}

// Cloudflare Turnstile server-side verification (feature-backlog #4). The optional,
// privacy-friendly (no-cookie) second layer behind the always-on honeypot. OFF unless a
// secret is configured, so a site that has not turned it on is never blocked. Consistent
// with the never-drop-a-lead principle, this fails OPEN on any inability to verify (no
// secret, or Cloudflare unreachable); it fails CLOSED only on a real negative signal (the
// challenge was enabled but no token came, or Cloudflare says the token is invalid). The
// verify fetch is injectable (globalThis.__ENGINE_FETCH / an explicit fetchImpl) so the
// test harness drives it with no network.
/**
 * @param {{ token?: string, secret?: string, remoteip?: string, fetchImpl?: (url: string, init: any) => Promise<any> }} [opts]
 * @returns {Promise<{ ok: boolean, skipped?: boolean, reason?: string }>}
 */
export async function verifyTurnstile(opts = {}) {
  const { token = "", secret = "", remoteip = "", fetchImpl } = opts;
  // No secret configured -> the feature is off; do not block (fail open).
  if (!secret) return { ok: true, skipped: true, reason: "no_secret" };
  // Secret configured but no token from the client -> the challenge did not pass.
  if (!String(token).trim()) return { ok: false, reason: "missing_token" };
  const doFetch = fetchImpl || globalThis.__ENGINE_FETCH || globalThis.fetch;
  if (typeof doFetch !== "function") return { ok: true, skipped: true, reason: "no_fetch" };
  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", String(token));
    if (remoteip) form.set("remoteip", remoteip);
    const r = await doFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = await r.json().catch(() => ({}));
    return data && data.success ? { ok: true } : { ok: false, reason: "verification_failed" };
  } catch (_) {
    // Cloudflare unreachable: fail OPEN so a verify outage never silently eats real leads.
    return { ok: true, skipped: true, reason: "verify_error" };
  }
}

// The intake columns submit() reads directly, plus the reserved honeypot / turnstile keys.
// Any OTHER key on a submission is a rich declarative field (the modal request-access variant,
// or a no-JS native form post): its value folds into the message body so nothing is dropped.
const KNOWN_INTAKE_FIELDS = new Set([
  "name", "company", "email", "phone", "service", "preferredtime", "building",
  "message", "units", "source", "website", "cf-turnstile-response",
]);

// Fold every non-empty field that is NOT a known intake column into "key: value" lines, so a
// site can declare arbitrary rich fields (state, seats, equipment, notes, ...) and have them
// carried into the same save-first intake message body. Array values (a no-JS checkbox-group
// posts repeats of one name) are joined. Order follows the submitted body. Pure and exported so
// the harness can drive it directly.
/** @param {Record<string, any>} [body] @returns {string[]} */
export function foldExtras(body = {}) {
  const lines = [];
  for (const [k, v] of Object.entries(body)) {
    if (v == null) continue;
    if (KNOWN_INTAKE_FIELDS.has(String(k).toLowerCase())) continue;
    const val = String(Array.isArray(v) ? v.join(", ") : v).trim();
    if (!val) continue;
    lines.push(String(k) + ": " + val.slice(0, 500));
  }
  return lines;
}

// Validate, save the lead first, then notify the team. `save` and `send` are
// injected (getSaver()/getSender() in production, fakes in the harness). `to` and
// `from` are resolved by the caller from config/env. Returns a plain result
// object; the caller maps it to an HTTP status.
/**
 * @param {{
 *   body?: Record<string, any>,
 *   save?: LeadSaver,
 *   send?: MailSender | null,
 *   to?: string,
 *   from?: string,
 *   sourceDefault?: string,
 * }} args
 * @returns {Promise<{ ok: boolean, error?: string, status?: string, saved?: boolean, notified?: boolean }>}
 */
export async function submit(args) {
  const { body = {}, save, send, to, from, sourceDefault = "website" } = args || {};

  // HONEYPOT (feature-backlog #4). The forms render a hidden `website` field no human
  // ever sees or fills (Contact.tsx / LeadForm.tsx). A bot that auto-fills every field
  // trips it. We drop the submission BEFORE any save or notify and return a benign
  // { ok:true } with no saved/notified flags, so the bot learns nothing and (because
  // notified is undefined, not false) the client never runs its mailto fallback. `website`
  // is reserved for this trap; the engine has no real field of that name.
  if (String(body.website || "").trim()) {
    return { ok: true, status: "received", spam: true };
  }

  const name = String(body.name || "").trim().slice(0, 120);
  const company = String(body.company || "").trim().slice(0, 160);
  const email = String(body.email || "").trim().slice(0, 200);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const service = String(body.service || "").trim().slice(0, 120);
  const preferredTime = String(body.preferredTime || "").trim().slice(0, 120);
  const building = String(body.building || "").trim().slice(0, 200);
  const message = String(body.message || "").trim().slice(0, 4000);
  const source = String(body.source || sourceDefault || "website").trim().slice(0, 40);
  let units = parseInt(body.units, 10);
  if (!Number.isFinite(units) || units < 0) units = null;

  // Email is optional (the form allows a call-back with just a phone), so we
  // validate its FORMAT only when one is given, and require at least one way to
  // reach the person plus some actual content.
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "bad_email" };
  if (!email && !phone) return { ok: false, error: "no_contact" };
  if (!name && !company && !message && !service) return { ok: false, error: "empty" };

  // Fold any declared rich fields (modal request-access variant / no-JS native post) into the
  // message body. Validation above stays on the CORE message so extras never rescue an otherwise
  // empty submission; a real request-access lead always carries a required name + email.
  const extraLines = foldExtras(body);
  const fullMessage = [message, ...extraLines].filter(Boolean).join("\n").slice(0, 4000);

  const lead = { name: name || null, company: company || null, email: email || null,
    phone: phone || null, service: service || null, preferredTime: preferredTime || null,
    building: building || null, units, message: fullMessage || null, source };

  // SAVE FIRST - the lead must survive a mail failure. Best-effort: a store
  // hiccup is swallowed (saved:false) and we still try to notify.
  let saved = false;
  try {
    const r = save ? await save(lead) : { saved: false };
    saved = r ? r.saved !== false : true;
  } catch (_) {
    saved = false;
  }

  // NOTIFY the team. reply_to = the lead. Every field is HTML-escaped. A failure
  // is soft: the lead is already handled, so return ok with notified:false.
  const rows = [
    ["Name", name], ["Company", company], ["Email", email], ["Phone", phone],
    ["Service", service], ["Preferred time", preferredTime], ["Building", building],
    ["Units", units], ["Message", fullMessage], ["Source", source],
  ].filter(([, v]) => v != null && v !== "");
  const html = "<h2>New website lead</h2>" +
    rows.map(([k, v]) => "<p><b>" + esc(k) + ":</b> " + esc(v) + "</p>").join("");
  const text = rows.map(([k, v]) => k + ": " + v).join("\n");
  const subject = "New website lead: " + (name || company || email || phone);

  let notified = false;
  if (send) {
    try {
      await send({ from, to, reply_to: email || undefined, subject, html, text });
      notified = true;
    } catch (_) {
      notified = false;
    }
  }

  return { ok: true, status: "received", saved, notified };
}

export const __test = { submit, esc, getSaver, getSender, rateOk, verifyTurnstile, foldExtras };
