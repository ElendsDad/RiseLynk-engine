// ============================================================
// site-engine - contact/lead intake core harness
//
//   node tools/contact-intake.test.mjs
//
// Proves the hardened receiver logic in lib/contact-intake.mjs, harvested from
// RiseLynk's contact-submit (supabase/functions/contact-submit). Mirrors that
// function's getSender() / __test pattern: the mailer AND the lead store are
// isolated behind injectable functions so this Node harness drives the pure
// logic with fakes, no network, no database.
//
// Covers:
//   - save-first: the lead is saved BEFORE the team is notified.
//   - never-drop: a failing mailer still saves the lead and returns
//     { ok:true, notified:false } (never an error).
//   - a save hiccup never blocks the notify (best-effort on both paths).
//   - validation: email optional when a phone is given (call-back), bad email
//     format rejected, at least one contact method required.
//   - HTML escaping on every field in the notification body.
//   - reply_to is set to the lead so a reply reaches them.
//   - config seams: getSaver()/getSender() read target/from from config/env,
//     with NO RiseLynk literals anywhere in the module source.
//   - fail-open rate limiting.
// ============================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "contact-intake.mjs");

const mod = await import("file://" + MODULE_PATH);
const { esc, submit, getSaver, getSender, rateOk, clientIp, verifyTurnstile, turnstileConfig, foldExtras, autoReplyRecipient } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ---- a fake saver + sender that record what they were handed, in order ----
function makeSpies({ sendThrows = false, saveThrows = false } = {}) {
  const events = [];       // ordered log of "save" / "send" to prove save-first
  const saved = [];        // leads handed to the saver
  const sent = [];         // messages handed to the sender
  const save = async (lead) => {
    events.push("save");
    if (saveThrows) throw new Error("store down");
    saved.push(lead);
    return { saved: true };
  };
  const send = async (msg) => {
    events.push("send");
    if (sendThrows) throw Object.assign(new Error("mailer down"), { statusCode: 500 });
    sent.push(msg);
    return true;
  };
  return { events, saved, sent, save, send };
}

const TO = "owner@example.com";
const FROM = "Example Site <hello@example.com>";

// ================= 1. esc =================
function testEsc() {
  console.log("\n# esc (HTML escaping)");
  eq("escapes <", esc("<b>"), "&lt;b&gt;");
  eq("escapes &", esc("a & b"), "a &amp; b");
  eq("escapes quotes", esc(`"x" 'y'`), "&quot;x&quot; &#39;y&#39;");
  eq("null -> empty", esc(null), "");
  eq("number coerced", esc(12), "12");
}

// ================= 2. save-first + never-drop =================
async function testSaveFirstNeverDrop() {
  console.log("\n# save-first + never-drop (failing mailer)");
  const spy = makeSpies({ sendThrows: true });
  const r = await submit({
    body: { name: "Dana Lee", email: "dana@lead.com", message: "Need a quote" },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("returns ok even though mail failed", r.ok, true);
  eq("notified is false on mail failure", r.notified, false);
  eq("saved is true (lead persisted)", r.saved, true);
  eq("the lead reached the saver", spy.saved.length, 1);
  eq("saver got the name", spy.saved[0].name, "Dana Lee");
  ok("SAVE happened before SEND", spy.events[0] === "save" && spy.events[1] === "send");
  // saved:true + notified:false is NOT the black hole (the lead survived); v0.24.1 #30c.
  eq("deliveryStatus is ok (saved, even though mail failed)", r.deliveryStatus, "ok");
}

// ================= 3. phone-only lead still saves =================
async function testPhoneOnly() {
  console.log("\n# phone-only lead (email optional for a call-back)");
  const spy = makeSpies();
  const r = await submit({
    body: { name: "Pat", phone: "(360) 555-0142", message: "Call me back" },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("phone-only submit is ok", r.ok, true);
  eq("phone-only lead was saved", spy.saved.length, 1);
  eq("saver got the phone", spy.saved[0].phone, "(360) 555-0142");
  eq("notified true (mailer fine)", r.notified, true);
}

// ================= 4. validation =================
async function testValidation() {
  console.log("\n# validation");
  const badEmail = makeSpies();
  const r1 = await submit({ body: { name: "X", email: "not-an-email", message: "hi" },
    save: badEmail.save, send: badEmail.send, to: TO, from: FROM });
  eq("bad email format rejected", r1.error, "bad_email");
  eq("bad email is not ok", r1.ok, false);
  eq("bad email did NOT save", badEmail.saved.length, 0);

  const noContact = makeSpies();
  const r2 = await submit({ body: { name: "X", message: "hi" },
    save: noContact.save, send: noContact.send, to: TO, from: FROM });
  eq("no email and no phone rejected", r2.error, "no_contact");
  eq("no-contact did NOT save", noContact.saved.length, 0);

  const empty = makeSpies();
  const r3 = await submit({ body: { email: "x@y.com" },
    save: empty.save, send: empty.send, to: TO, from: FROM });
  eq("empty (no name/company/message/service) rejected", r3.error, "empty");
}

// ================= 5. escaping in the notification body =================
async function testBodyEscaped() {
  console.log("\n# notification body is HTML-escaped");
  const spy = makeSpies();
  await submit({
    body: { name: "<script>alert(1)</script>", email: "x@y.com", message: "a & b <img>" },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  const msg = spy.sent[0];
  ok("raw script tag never reaches the html body", !msg.html.includes("<script>"));
  ok("name is escaped in html", msg.html.includes("&lt;script&gt;"));
  ok("ampersand escaped in html", msg.html.includes("a &amp; b"));
  ok("reply_to is the lead", msg.reply_to === "x@y.com");
  ok("to comes from config, not a literal", msg.to === TO);
  ok("from comes from config, not a literal", msg.from === FROM);
}

// ================= 6. a save hiccup never blocks notify =================
async function testSaveHiccup() {
  console.log("\n# a save hiccup never blocks the notify");
  const spy = makeSpies({ saveThrows: true });
  const r = await submit({
    body: { name: "Sam", email: "sam@lead.com", message: "hello" },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("still ok when the store is down", r.ok, true);
  eq("saved reported false", r.saved, false);
  eq("notified still happened", r.notified, true);
  eq("the team was still emailed", spy.sent.length, 1);
}

// ================= 7. config seams (getSaver / getSender) =================
async function testSeams() {
  console.log("\n# getSaver / getSender config seams");
  // getSender: no key, no injected global -> null (dev: accept, do not send)
  delete globalThis.__ENGINE_MAIL_SENDER;
  const priorKey = process.env.RESEND_API_KEY; delete process.env.RESEND_API_KEY;
  eq("getSender null with no key", getSender(), null);
  globalThis.__ENGINE_MAIL_SENDER = async () => true;
  ok("getSender returns the injected global", typeof getSender() === "function");
  delete globalThis.__ENGINE_MAIL_SENDER;
  if (priorKey) process.env.RESEND_API_KEY = priorKey;

  // getSaver: no endpoint configured -> a benign no-op that reports not-stored
  delete globalThis.__ENGINE_LEAD_SAVER;
  const priorEp = process.env.LEADS_ENDPOINT; delete process.env.LEADS_ENDPOINT;
  const noop = getSaver();
  const res = await noop({ name: "x" });
  eq("no-store saver reports saved:false", res.saved, false);
  ok("no-store saver gives a reason", typeof res.reason === "string");
  if (priorEp) process.env.LEADS_ENDPOINT = priorEp;
}

// ================= 8. fail-open rate limiting =================
async function testRateOpen() {
  console.log("\n# rate limiting fails open");
  // A limiter that cannot evaluate (bad input / no store) must never block a real submit.
  const allowed = await rateOk({ ip: "", bucket: "contact", max: 10, windowSecs: 3600 });
  ok("empty ip is allowed (fail-open)", allowed === true);
}

// ================= 9. no RiseLynk literals in the module =================
// The acceptance is "no kisbwugtvvdkltlixuic, no RiseLynk URLs / addresses"
// baked into shippable code. A provenance comment naming the harvest source is
// required by the workspace rules, so the bare word is allowed - what must never
// appear is the control-plane project ref, a riselynk host, or a riselynk inbox.
function testNoLiterals() {
  console.log("\n# no RiseLynk literals baked into the engine module");
  const src = readFileSync(MODULE_PATH, "utf8");
  ok("no Supabase control-plane ref", !src.includes("kisbwugtvvdkltlixuic"));
  ok("no riselynk host / url", !/riselynk\.(com|co|io|dev|app)/i.test(src));
  ok("no @riselynk inbox literal", !/@riselynk/i.test(src));
  ok("no riselynk subdomain literal", !/\briselynk\.[a-z]/i.test(src));
}

// ================= 10. honeypot spam shield (feature-backlog #4) =================
async function testHoneypot() {
  console.log("\n# honeypot drops a filled trap without saving or notifying");
  // A bot fills the hidden `website` field. The submission must be dropped BEFORE any
  // save or notify, and reported as spam with a benign ok:true (the bot learns nothing).
  const trap = makeSpies();
  const r = await submit({
    body: { name: "Spammy Bot", email: "bot@spam.com", message: "buy my thing", website: "http://spam.example" },
    save: trap.save, send: trap.send, to: TO, from: FROM,
  });
  eq("honeypot returns benign ok", r.ok, true);
  eq("honeypot flags spam", r.spam, true);
  eq("honeypot did NOT save", trap.saved.length, 0);
  eq("honeypot did NOT notify", trap.sent.length, 0);
  ok("neither save nor send was called", trap.events.length === 0);
  ok("no saved/notified flags leak (client mailto never fires)", r.saved === undefined && r.notified === undefined);
  // v0.24.1 #30c: the spam early-return is untouched (naming/visibility only applies to the
  // real submit path) - no deliveryStatus leaks here either.
  eq("no deliveryStatus on the spam early-return", r.deliveryStatus, undefined);

  // R1 behavior preserved: an EMPTY honeypot (a real human) still saves and notifies.
  const clean = makeSpies();
  const r2 = await submit({
    body: { name: "Real Person", email: "real@person.com", message: "quote please", website: "" },
    save: clean.save, send: clean.send, to: TO, from: FROM,
  });
  eq("clean submit (empty honeypot) is ok", r2.ok, true);
  eq("clean submit still saved", clean.saved.length, 1);
  eq("clean submit still notified", clean.sent.length, 1);
  eq("clean submit is not flagged spam", r2.spam, undefined);
}

// ================= 10b. deliveryStatus (v0.24.1, feedback #30c) =================
// Naming/visibility only: submit()'s existing saved/notified booleans are unchanged (proven
// throughout this file's other tests); this adds ONE new field so a consumer can probe for the
// exact black-hole combination directly instead of separately checking two booleans.
async function testDeliveryStatus() {
  console.log("\n# deliveryStatus (v0.24.1 #30c): black_hole only on saved:false + notified:false");

  // The true black hole: no saver configured (defaults to saved:false), mailer throws.
  const blackHole = makeSpies({ sendThrows: true });
  const rBlackHole = await submit({
    body: { name: "Nobody Hears", email: "nobody@lead.com", message: "hello?" },
    save: async () => ({ saved: false, reason: "no_store" }), send: blackHole.send, to: TO, from: FROM,
  });
  eq("black hole: saved is false", rBlackHole.saved, false);
  eq("black hole: notified is false", rBlackHole.notified, false);
  eq("black hole: deliveryStatus is black_hole", rBlackHole.deliveryStatus, "black_hole");

  // saved:false but notified:true (no store configured, mail worked) - NOT a black hole.
  const noStoreOnly = makeSpies();
  const rNoStore = await submit({
    body: { name: "Mailed Fine", email: "ok@lead.com", message: "hi" },
    save: async () => ({ saved: false, reason: "no_store" }), send: noStoreOnly.send, to: TO, from: FROM,
  });
  eq("no-store-only: saved is false", rNoStore.saved, false);
  eq("no-store-only: notified is true", rNoStore.notified, true);
  eq("no-store-only: deliveryStatus is ok (notified covers it)", rNoStore.deliveryStatus, "ok");

  // saved:true, notified:true - the fully-wired default.
  const bothOk = makeSpies();
  const rBoth = await submit({
    body: { name: "Fully Wired", email: "wired@lead.com", message: "hi" },
    save: bothOk.save, send: bothOk.send, to: TO, from: FROM,
  });
  eq("both ok: deliveryStatus is ok", rBoth.deliveryStatus, "ok");
}

// ================= 11. Turnstile verify (feature-backlog #4) =================
async function testTurnstile() {
  console.log("\n# Turnstile verify: off (no secret) fails open; configured fails closed on any negative or unverifiable signal");
  // No secret configured -> the feature is off; never block (fail open).
  const off = await verifyTurnstile({ token: "anything", secret: "" });
  eq("no secret -> allowed (feature off)", off.ok, true);
  eq("no secret -> marked skipped", off.skipped, true);

  // Secret set but no token from the client -> the challenge did not pass (fail closed).
  const noToken = await verifyTurnstile({ token: "", secret: "s3cret" });
  eq("secret + no token -> blocked", noToken.ok, false);
  eq("secret + no token -> missing_token", noToken.reason, "missing_token");

  // Secret + token + Cloudflare says success -> allowed. Fetch is injected (no network).
  const pass = await verifyTurnstile({
    token: "tok", secret: "s3cret",
    fetchImpl: async () => ({ json: async () => ({ success: true }) }),
  });
  eq("valid token -> allowed", pass.ok, true);

  // Secret + token + Cloudflare says failure -> blocked.
  const fail = await verifyTurnstile({
    token: "tok", secret: "s3cret",
    fetchImpl: async () => ({ json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }) }),
  });
  eq("invalid token -> blocked", fail.ok, false);
  eq("invalid token -> verification_failed", fail.reason, "verification_failed");

  // Configured (secret set) + Cloudflare unreachable -> fail CLOSED (SEC hardening FIX 4). A
  // rendered challenge must imply enforcement, so a verify outage rejects a submission rather
  // than letting unverified traffic through.
  const outage = await verifyTurnstile({
    token: "tok", secret: "s3cret",
    fetchImpl: async () => { throw new Error("network down"); },
  });
  eq("configured verify outage -> BLOCKED (fail closed)", outage.ok, false);
  eq("configured verify outage -> verify_error", outage.reason, "verify_error");
  ok("configured verify outage -> NOT marked skipped", outage.skipped === undefined);

  // Configured but no fetch impl at all to reach Cloudflare -> also fail CLOSED (cannot verify).
  const savedFetch = globalThis.fetch;
  const savedEngineFetch = globalThis.__ENGINE_FETCH;
  delete globalThis.__ENGINE_FETCH;
  globalThis.fetch = undefined;
  const noFetch = await verifyTurnstile({ token: "tok", secret: "s3cret" });
  globalThis.fetch = savedFetch;
  if (savedEngineFetch) globalThis.__ENGINE_FETCH = savedEngineFetch;
  eq("configured + no fetch impl -> BLOCKED (fail closed)", noFetch.ok, false);
  eq("configured + no fetch -> no_fetch", noFetch.reason, "no_fetch");
}

// ========= 11b. Turnstile config XOR guard (SEC hardening FIX 4) =========
// A rendered widget (siteKey) and server enforcement (secret) must be all-or-nothing. A
// one-sided deploy is a misconfiguration the route rejects with a 503, so a visible CAPTCHA
// always implies real server enforcement and a held secret always has a widget feeding it.
function testTurnstileConfigXor() {
  console.log("\n# turnstileConfig XOR: a one-sided widget/secret deploy is a misconfig");
  const both = turnstileConfig({ siteKey: "0xSITEKEY", secret: "s3cret" });
  eq("siteKey + secret -> ok", both.ok, true);
  eq("siteKey + secret -> enforced", both.enforced, true);

  const neither = turnstileConfig({ siteKey: "", secret: "" });
  eq("neither -> ok (unconfigured brochure default)", neither.ok, true);
  eq("neither -> not enforced", neither.enforced, false);

  const keyOnly = turnstileConfig({ siteKey: "0xSITEKEY", secret: "" });
  eq("siteKey without secret -> REJECTED", keyOnly.ok, false);
  eq("siteKey without secret -> not enforced", keyOnly.enforced, false);
  eq("siteKey without secret -> turnstile_misconfig", keyOnly.reason, "turnstile_misconfig");

  const secretOnly = turnstileConfig({ siteKey: "", secret: "s3cret" });
  eq("secret without siteKey -> REJECTED", secretOnly.ok, false);
  eq("secret without siteKey -> turnstile_misconfig", secretOnly.reason, "turnstile_misconfig");

  // Whitespace-only values are trimmed to absent, so blanks never fake half a config.
  const blankKey = turnstileConfig({ siteKey: "   ", secret: "s3cret" });
  eq("whitespace siteKey counts as absent -> REJECTED", blankKey.ok, false);
}

// ========= 11c. an unconfigured site is unaffected by FIX 4 =========
async function testUnconfiguredUnaffected() {
  console.log("\n# an unconfigured site (no secret) still fails OPEN, unchanged by FIX 4");
  const off = await verifyTurnstile({ token: "anything", secret: "" });
  eq("no secret -> allowed", off.ok, true);
  eq("no secret -> skipped", off.skipped, true);
  // turnstileConfig reports the unconfigured site as ok + not enforced, so the route never
  // reaches verifyTurnstile at all: FIX 4 changes nothing for a brochure site.
  const cfg = turnstileConfig({ siteKey: "", secret: "" });
  ok("unconfigured -> route does not enforce", cfg.ok === true && cfg.enforced === false);
}

// ========= 12. modal rich fields fold into the save-first intake =========
// The modal request-access variant declares fields beyond the fixed columns (state, seats,
// equipment, notes, ...). Known names map to lead columns; every other field folds into the
// message body of the SAME save-first intake, so no structured extra is dropped.
function testFoldExtras() {
  console.log("\n# foldExtras: unknown fields fold, known columns are left for the intake");
  const lines = foldExtras({
    name: "Dana", email: "dana@x.com", phone: "555", units: "12", // known columns -> skipped
    website: "", "cf-turnstile-response": "tok",                    // reserved -> skipped
    state: "WA", seats: "6", equipment: ["Traction", "Hydraulic"], notes: "weekday mornings",
  });
  ok("known columns are NOT folded", !lines.some((l) => /^name:|^email:|^phone:|^units:/.test(l)));
  ok("reserved keys are NOT folded", !lines.some((l) => /^website:|^cf-turnstile-response:/i.test(l)));
  ok("state folds", lines.includes("state: WA"));
  ok("seats folds", lines.includes("seats: 6"));
  ok("array (checkbox-group) joins", lines.includes("equipment: Traction, Hydraulic"));
  ok("notes folds", lines.includes("notes: weekday mornings"));
  ok("empty values are dropped", !lines.some((l) => l.startsWith("website")));
}

async function testModalFieldsFoldIntoIntake() {
  console.log("\n# modal rich fields reach the saved lead + notification (save-first)");
  const spy = makeSpies();
  const r = await submit({
    body: {
      name: "Dana Lee", company: "Acme Vertical", email: "dana@acme.com", phone: "(360) 555-0100",
      units: "24", message: "Routes and timeline questions.",
      state: "WA", seats: "8", equipment: "Traction, Escalator", notes: "Two branches",
    },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("rich submit is ok", r.ok, true);
  eq("rich lead saved", spy.saved.length, 1);
  ok("SAVE happened before SEND", spy.events[0] === "save" && spy.events[1] === "send");
  const saved = spy.saved[0];
  ok("core message preserved", saved.message.includes("Routes and timeline questions."));
  ok("extra state folded into the saved lead", saved.message.includes("state: WA"));
  ok("extra equipment folded into the saved lead", saved.message.includes("equipment: Traction, Escalator"));
  ok("units mapped to its own column (not folded)", saved.units === 24 && !/units:/i.test(saved.message));
  // The folded extras also reach the notification body, HTML-escaped through esc().
  ok("extras reach the notification body", spy.sent[0].text.includes("notes: Two branches"));
}

async function testNoJsSubmitSaves() {
  console.log("\n# a no-JS native form post still saves through the save-first intake");
  // A native (no-JS) form POST arrives as flat string fields (the route parses form-encoded into
  // this shape). It carries an empty honeypot and no JS-side folding; the intake must still save
  // the lead and fold the declared extras server-side.
  const spy = makeSpies();
  const r = await submit({
    body: {
      website: "", name: "Pat Rivera", company: "Summit Lifts", email: "pat@summit.com",
      phone: "3605551234", state: "OR", equipment: "Hydraulic", notes: "No JS submit",
    },
    save: spy.save, send: spy.send, to: TO, from: FROM, sourceDefault: "website-lead",
  });
  eq("no-JS submit is ok", r.ok, true);
  eq("no-JS lead saved", r.saved, true);
  eq("no-JS lead reached the saver", spy.saved.length, 1);
  ok("no-JS extras folded server-side", spy.saved[0].message.includes("state: OR") && spy.saved[0].message.includes("equipment: Hydraulic"));
  eq("no-JS source default applied", spy.saved[0].source, "website-lead");
}

// ===== 13. autoresponder recipient + spam gate (FIX 3, SEC hardening v0.18.0) =====
async function testAutoresponderGate() {
  console.log("");
  console.log("# lead autoresponder: gated on a non-spam accept, sent only to the validated recipient");
  const ar = { subject: "Thanks", body: "We got your message." };
  const fakes = { save: async () => ({ saved: true }), send: async () => true };

  // A honeypot/spam submission (submit returns spam:true) must NEVER be eligible for an
  // autoresponder, even though it returns ok:true. The old route sent to raw body.email on r.ok
  // alone, so a bot could make the site email an arbitrary address (reflection / open relay).
  const spam = await submit({
    body: { name: "Bot", email: "bot@spam.com", message: "buy", website: "http://trap" },
    save: fakes.save, send: fakes.send, to: TO, from: FROM,
  });
  eq("spam submit flags spam", spam.spam, true);
  ok("spam submit yields NO autoresponder recipient", autoReplyRecipient(spam, ar) === null);

  // A clean accepted lead: the recipient is the submit()-validated + normalized address
  // (r.autoReplyTo), NOT a raw body value. Surrounding whitespace is trimmed away.
  const clean = await submit({
    body: { name: "Real", email: "  real@person.com  ", message: "quote please" },
    save: fakes.save, send: fakes.send, to: TO, from: FROM,
  });
  eq("clean submit is accepted", clean.ok, true);
  eq("clean submit is not flagged spam", clean.spam, undefined);
  eq("submit returns the validated recipient", clean.autoReplyTo, "real@person.com");
  eq("autoresponder targets the validated recipient", autoReplyRecipient(clean, ar), "real@person.com");

  // No autoReply configured -> never send, even on a clean accept.
  ok("no autoReply configured -> no recipient", autoReplyRecipient(clean, undefined) === null);

  // A rejected submission (bad email) is not ok -> no autoresponder.
  const bad = await submit({
    body: { name: "X", email: "not-an-email", message: "hi" },
    save: fakes.save, send: fakes.send, to: TO, from: FROM,
  });
  eq("bad email rejected", bad.ok, false);
  ok("rejected submit -> no recipient", autoReplyRecipient(bad, ar) === null);
}

// ===== 14. shared atomic rate limiter (FIX 2, SEC hardening) =====
// The brochure limiter was a module-local Map keyed by bucket + ip only: per-serverless-isolate
// (so 10/hr/IP was really 10 times the isolate count) and tenant-blind (two sites at one shared
// IP collided in one bucket). FIX 2 keys by tenant + bucket + trusted-IP and backs the count with
// an injectable shared atomic store, so a fleet deployment enforces one global limit. clientIp()
// is the single trusted-IP derivation both routes adopt.

function testClientIp() {
  console.log("\n# clientIp: prefer the platform-trusted single IP over a spoofable XFF list");
  // An attacker prepends a fake leftmost entry to x-forwarded-for. The trusted derivation prefers
  // x-real-ip (set by the platform edge), so the spoof never becomes the rate-limit key.
  const h = new Map([
    ["x-forwarded-for", "9.9.9.9, 203.0.113.7"],
    ["x-real-ip", "203.0.113.7"],
  ]);
  const headers = { get: (k) => (h.has(k) ? h.get(k) : null) };
  eq("prefers x-real-ip over spoofed XFF leftmost", clientIp(headers), "203.0.113.7");
  // No x-real-ip -> fall back to the leftmost XFF entry, trimmed.
  const xffOnly = { get: (k) => (k === "x-forwarded-for" ? " 198.51.100.4 , 10.0.0.1 " : null) };
  eq("falls back to leftmost XFF, trimmed", clientIp(xffOnly), "198.51.100.4");
  eq("no headers -> empty string", clientIp({ get: () => null }), "");
}

async function testRateLimiterSharedStore() {
  console.log("\n# rateOk is backed by an injectable shared atomic store (not per-isolate memory)");
  // A fake shared atomic store: one counter map that every 'isolate' consults. The pre-FIX limiter
  // ignored any injected store (the count lived in a module-local Map), so this hit never landed
  // there. FIX 2 threads the store through, so the hit is recorded and the tenant-scoped key is
  // visible to the store.
  const seen = [];
  const counts = new Map();
  const store = {
    async hit(key, windowSecs) {
      seen.push({ key, windowSecs });
      const n = (counts.get(key) || 0) + 1;
      counts.set(key, n);
      return n;
    },
  };
  const base = { ip: "203.0.113.9", tenant: "alpha.example", bucket: "contact", max: 3, windowSecs: 3600, store };
  const r1 = await rateOk(base);
  ok("shared store received the hit (ignored by the pre-FIX limiter)", seen.length === 1);
  ok("the store key is tenant + bucket scoped", seen.length === 1 && seen[0].key.includes("alpha.example") && seen[0].key.includes("contact"));
  ok("the window is passed to the store", seen.length === 1 && seen[0].windowSecs === 3600);
  await rateOk(base); await rateOk(base); // counts now at 3 (== max) -> still allowed
  const r4 = await rateOk(base);          // 4th -> over max -> blocked by the shared count
  ok("within max is allowed", r1 === true);
  ok("over max is blocked by the shared count", r4 === false);
}

async function testRateLimiterTenantKeyed() {
  console.log("\n# rateOk keys by tenant: two sites at one shared IP do not share a bucket");
  // Uses the default in-process store. Tenant A exhausts its window; tenant B at the SAME IP must
  // still be allowed. The pre-FIX key was bucket + ip only, so B inherited A's exhausted bucket.
  const ip = "198.51.100.77";
  for (let i = 0; i < 10; i++) await rateOk({ ip, tenant: "site-a.example", bucket: "contact", max: 10, windowSecs: 3600 });
  const aBlocked = await rateOk({ ip, tenant: "site-a.example", bucket: "contact", max: 10, windowSecs: 3600 });
  const bAllowed = await rateOk({ ip, tenant: "site-b.example", bucket: "contact", max: 10, windowSecs: 3600 });
  ok("tenant A is blocked after exhausting its own window", aBlocked === false);
  ok("tenant B at the same IP is independent (allowed)", bAllowed === true);
}

// ---- run ----
testEsc();
await testSaveFirstNeverDrop();
await testPhoneOnly();
await testValidation();
await testBodyEscaped();
await testSaveHiccup();
await testSeams();
await testRateOpen();
await testHoneypot();
await testDeliveryStatus();
await testTurnstile();
testTurnstileConfigXor();
await testUnconfiguredUnaffected();
testNoLiterals();
testFoldExtras();
await testModalFieldsFoldIntoIntake();
await testNoJsSubmitSaves();
await testAutoresponderGate();
testClientIp();
await testRateLimiterSharedStore();
await testRateLimiterTenantKeyed();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
