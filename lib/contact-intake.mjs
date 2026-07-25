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
//   - deliveryStatus (v0.24.1, feedback #30c): a machine-readable "ok" | "black_hole" that
//     names the one saved:false + notified:false combination for a consumer that wants to
//     probe for it directly instead of separately checking two booleans. Naming/visibility
//     only - saved and notified themselves, and every other field, are unchanged.
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

import { applyLeadAttribution } from "./lead-attribution.mjs";

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

// Trusted client IP for rate-limit keying (SEC hardening FIX 2). The limit is only as good as the
// IP it keys on, so we do NOT trust the client-controllable leftmost x-forwarded-for entry (a caller
// can prepend a spoofed hop). Prefer x-real-ip - the single client IP the platform edge (Vercel)
// sets, which a request cannot forge behind it - and fall back to the leftmost x-forwarded-for only
// when x-real-ip is absent (a non-edge deployment). Accepts a Headers-like object (.get) so both
// route handlers derive the key one identical way. Returns "" when no IP is resolvable.
/** @param {{ get: (k: string) => (string|null) }} headers @returns {string} */
export function clientIp(headers) {
  const get = headers && typeof headers.get === "function" ? (k) => headers.get(k) : () => null;
  const real = String(get("x-real-ip") || "").trim();
  if (real) return real;
  const xff = String(get("x-forwarded-for") || "");
  return (xff.split(",")[0] || "").trim();
}

// The rate-limit store seam (SEC hardening FIX 2). A store is
// { hit(key, windowSecs) => Promise<number> } returning the count in the window AFTER recording
// this hit. An injected global wins (the test harness / a custom store); otherwise, when a shared
// REST store is configured (RATE_LIMIT_REST_URL + RATE_LIMIT_REST_TOKEN, the Vercel-KV / Upstash
// REST shape), the count is atomic and fleet-global; with nothing configured it falls back to a
// per-isolate in-memory sliding window (the brochure stand-in - exact for a single instance,
// best-effort across a serverless fleet). One store backs both the contact and lead buckets.
const _rlBuckets = new Map();
const _memRateStore = {
  async hit(id, windowSecs) {
    const now = Date.now();
    const windowMs = windowSecs * 1000;
    const hits = (_rlBuckets.get(id) || []).filter((t) => now - t < windowMs);
    hits.push(now);
    _rlBuckets.set(id, hits);
    return hits.length;
  },
};

// A shared atomic store over the Vercel-KV / Upstash REST protocol: one pipelined INCR + EXPIRE
// (EXPIRE ... NX so the window is set once, on the first hit in it). The count is the INCR result,
// so every isolate that shares the store reads one global counter. Throws on any transport / shape
// error; rateOk() maps that to fail-open (a limiter outage must never drop a real lead). The fetch
// is injectable (globalThis.__ENGINE_FETCH) so a harness can drive it with no network.
function makeRestRateStore(baseUrl, token) {
  const root = String(baseUrl).replace(/\/+$/, "");
  return {
    async hit(id, windowSecs) {
      const doFetch = globalThis.__ENGINE_FETCH || globalThis.fetch;
      if (typeof doFetch !== "function") throw new Error("no fetch for rate store");
      const r = await doFetch(root + "/pipeline", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", id], ["EXPIRE", id, String(windowSecs), "NX"]]),
      });
      if (!r.ok) throw new Error("rate-store " + r.status);
      const data = await r.json();
      const first = Array.isArray(data) ? data[0] : data;
      const raw = first && typeof first === "object" && "result" in first ? first.result : first;
      const count = parseInt(raw, 10);
      if (!Number.isFinite(count)) throw new Error("rate-store bad response");
      return count;
    },
  };
}

/** @returns {{ hit: (key: string, windowSecs: number) => Promise<number> }} */
export function getRateStore() {
  if (globalThis.__ENGINE_RATE_STORE) return globalThis.__ENGINE_RATE_STORE;
  const url = env("RATE_LIMIT_REST_URL");
  const token = env("RATE_LIMIT_REST_TOKEN");
  if (url && token) return makeRestRateStore(url, token);
  return _memRateStore;
}

// Best-effort rate limit, keyed by tenant + bucket + trusted-IP and backed by the store seam above
// (SEC hardening FIX 2). Fail-OPEN by construction: saving / notifying a real lead matters more than
// perfect throttling, so an unresolvable IP or any store error returns true (allowed). Adding the
// tenant to the key stops two sites at one shared IP from colliding in one bucket; the shared store
// makes the count fleet-global instead of per-serverless-isolate. A caller may inject `store` (the
// harness); production reads getRateStore().
/**
 * @param {{ ip?: string, tenant?: string, bucket?: string, max?: number, windowSecs?: number,
 *   store?: { hit: (key: string, windowSecs: number) => Promise<number> } }} [opts]
 * @returns {Promise<boolean>}
 */
export async function rateOk(opts = {}) {
  try {
    const { ip = "", tenant = "", bucket = "contact", max = 10, windowSecs = 3600, store } = opts;
    const key = String(ip || "").trim();
    if (!key) return true; // cannot identify the caller -> do not block (fail open)
    const id = [bucket, String(tenant || "").trim(), key].filter(Boolean).join(":");
    const s = store || getRateStore();
    const count = await s.hit(id, windowSecs);
    return count <= max;
  } catch (_) {
    return true; // fail open
  }
}

// Turnstile config XOR guard (SEC hardening FIX 4). A rendered widget and server
// enforcement must be all-or-nothing. The client renders the CAPTCHA on `siteKey` alone,
// while the server can only enforce when the matching `TURNSTILE_SECRET` is also present;
// a one-sided deployment (a siteKey with no secret, or a secret with no siteKey) means a
// visible challenge the server never checks, or a held secret no widget feeds. Either way
// enforcement silently does not happen, so this is a misconfiguration, not a valid state.
// Returns { ok:false, reason:"turnstile_misconfig" } on the XOR so the route fails CLOSED
// (503) instead of accepting unenforced traffic; { ok:true, enforced } tells the caller
// whether to run verifyTurnstile (both present) or skip it (neither present, the
// unconfigured brochure default). Single source of truth for both routes.
/**
 * @param {{ siteKey?: string, secret?: string }} [opts]
 * @returns {{ ok: boolean, enforced: boolean, reason?: string }}
 */
export function turnstileConfig(opts = {}) {
  const hasKey = Boolean(String(opts.siteKey || "").trim());
  const hasSecret = Boolean(String(opts.secret || "").trim());
  if (hasKey !== hasSecret) return { ok: false, enforced: false, reason: "turnstile_misconfig" };
  return { ok: true, enforced: hasKey && hasSecret };
}

// Cloudflare Turnstile server-side verification (feature-backlog #4). The optional,
// privacy-friendly (no-cookie) second layer behind the always-on honeypot. OFF unless a
// secret is configured, so a site that has not turned it on is never blocked (no secret ->
// skipped, allowed). Once the feature IS configured, though, it fails CLOSED on every
// negative or unverifiable signal (SEC hardening FIX 4): no token, an invalid token, no
// fetch impl to reach Cloudflare, or a verify outage all return ok:false. A rendered
// challenge must imply real enforcement, so a configured site never silently accepts an
// unverified submission. Only the unconfigured (no secret) case fails open. The verify
// fetch is injectable (globalThis.__ENGINE_FETCH / an explicit fetchImpl) so the test
// harness drives it with no network.
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
  // Configured but no way to reach Cloudflare -> cannot verify, so fail CLOSED.
  if (typeof doFetch !== "function") return { ok: false, reason: "no_fetch" };
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
    // Configured but Cloudflare unreachable: fail CLOSED. A rendered challenge must imply
    // enforcement, so a verify outage rejects rather than silently letting traffic through.
    return { ok: false, reason: "verify_error" };
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
 * @returns {Promise<{ ok: boolean, error?: string, status?: string, saved?: boolean, notified?: boolean,
 *   deliveryStatus?: "ok" | "black_hole" }>}
 */
export async function submit(args) {
  const { save, send, to, from, sourceDefault = "website" } = args || {};
  // Lead-source attribution (UTM / referrer / landing path): sanitize BEFORE any
  // honeypot or fold. Client-supplied; treat as hostile. Absent stays absent.
  const body = applyLeadAttribution(args?.body || {});

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

  // Machine-readable delivery-status field (feedback #30c, naming/visibility only - no
  // behavior change: saved and notified themselves are unchanged, this just names the
  // one combination that means "the API accepted this and it landed NOWHERE" so a
  // consumer can probe for the black hole instead of separately checking two booleans
  // and hoping to remember what their conjunction means). Mirrors the exact vocabulary
  // of the incident report: saved:false + notified:false is deliveryStatus "black_hole";
  // anything else (saved, notified, or both) is "ok".
  const deliveryStatus = !saved && !notified ? "black_hole" : "ok";

  return { ok: true, status: "received", saved, notified, deliveryStatus, autoReplyTo: email || null };
}

// Decide the lead-autoresponder recipient (lead-gen only). Strictly gated so the autoresponder
// can never be turned into an open relay or reflection: it fires ONLY on a genuinely accepted
// submission (ok and NOT spam), ONLY when the site configured an autoReply, and ONLY to the
// recipient submit() already validated and normalized (result.autoReplyTo) - never a raw,
// unchecked request-body value. Returns the validated recipient to send to, or null to send
// nothing. The route uses this in place of the old ok-only gate on raw body.email.
/**
 * @param {{ ok?: boolean, spam?: boolean, autoReplyTo?: string|null }|null|undefined} result
 * @param {unknown} autoReply
 * @returns {string|null}
 */
export function autoReplyRecipient(result, autoReply) {
  if (!result || result.ok !== true || result.spam) return null;
  if (!autoReply) return null;
  const to = String(result.autoReplyTo || "").trim();
  if (!to || !EMAIL_RE.test(to)) return null;
  return to;
}

export const __test = { submit, esc, getSaver, getSender, rateOk, clientIp, getRateStore, verifyTurnstile, turnstileConfig, foldExtras, autoReplyRecipient };
