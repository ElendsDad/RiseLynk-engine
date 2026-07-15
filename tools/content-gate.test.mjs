// ============================================================
// site-engine - lead-capture content gate harness (Phases 0-1)
//
//   node tools/content-gate.test.mjs
//
// Proves the pure gate core in lib/content-gate.mjs and its ride on the REAL
// save-first intake (lib/contact-intake.mjs submit(), driven with injected
// fakes; no network, no database). Spec: docs/plans/lead-capture-content-gate.md.
//
// Covers:
//   - gateSource: default, id-derived, explicit override, the 40-char cap the
//     intake applies to `source`.
//   - gateLeadBody: name/email only; opted-in phone/message; unknown submitted
//     keys are NOT emitted; the `website` honeypot (and the Turnstile token)
//     pass through untouched; source lands in the body.
//   - end to end through submit(): an accepted gate lead saves FIRST with the
//     gate source; a honeypot-tripped body is dropped exactly as the other
//     forms drop it; a save failure still notifies (save-first semantics
//     unchanged).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const { gateSource, gateLeadBody, sanitizeGateAssetHref } = await import(
  "file://" + join(ROOT, "lib", "content-gate.mjs")
);
const { submit } = await import("file://" + join(ROOT, "lib", "contact-intake.mjs"));

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ---- the same spy pattern tools/contact-intake.test.mjs uses ----
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
    if (sendThrows) throw new Error("mailer down");
    sent.push(msg);
    return true;
  };
  return { events, saved, sent, save, send };
}

const TO = "owner@example.com";
const FROM = "Example Site <hello@example.com>";
const GATE = { id: "roof-checklist", asset: { href: "/downloads/roof-checklist.pdf" } };

// ================= 1. gateSource =================
function testGateSource() {
  console.log("\n# gateSource: default, id-derived, override, 40-char cap");
  eq("no gate -> bare default", gateSource(undefined), "content-gate");
  eq("no id, no override -> bare default", gateSource({ asset: { href: "/x.pdf" } }), "content-gate");
  eq("id-derived tag", gateSource(GATE), "content-gate:roof-checklist");
  eq("explicit override wins over the id", gateSource({ ...GATE, source: "spring-promo" }), "spring-promo");
  eq("whitespace override falls back to the id", gateSource({ ...GATE, source: "   " }), "content-gate:roof-checklist");
  // The intake trims `source` to 40 chars; the tag is capped HERE so what the
  // client sends is exactly what the operator sees on the lead.
  const long = gateSource({ id: "a-very-long-gate-slug-that-keeps-on-going-and-going" });
  eq("tag is capped at 40 chars", long.length, 40);
  eq("capped tag keeps the prefix", long.slice(0, 13), "content-gate:");
}

// ================= 2. gateLeadBody =================
function testGateLeadBody() {
  console.log("\n# gateLeadBody: known intake columns only, honeypot untouched");
  // Base case: no opted-in extras -> name, email, honeypot, source and nothing else.
  const base = gateLeadBody({ name: "Dana Lee", email: "dana@lead.com", website: "" }, GATE);
  eq("name emitted", base.name, "Dana Lee");
  eq("email emitted", base.email, "dana@lead.com");
  eq("source lands in the body", base.source, "content-gate:roof-checklist");
  eq("empty honeypot passes through", base.website, "");
  ok("phone not emitted when not opted in", !("phone" in base));
  ok("message not emitted when not opted in", !("message" in base));

  // Opted-in extras are emitted; a field the visitor left blank is still an
  // empty known column, never an invented value.
  const opted = gateLeadBody(
    { name: "Dana", email: "d@x.com", phone: "(360) 555-0100", message: "Two chimneys", website: "" },
    { ...GATE, fields: ["phone", "message"] },
  );
  eq("opted-in phone emitted", opted.phone, "(360) 555-0100");
  eq("opted-in message emitted", opted.message, "Two chimneys");

  // Unknown submitted keys are NOT emitted (nothing rides along to be folded).
  const noisy = gateLeadBody(
    { name: "Dana", email: "d@x.com", website: "", rogue: "injected", company: "Acme" },
    GATE,
  );
  ok("unknown key is not emitted", !("rogue" in noisy));
  ok("non-gate intake column is not emitted", !("company" in noisy));

  // The honeypot value passes through UNTOUCHED (the server-side trap must see
  // exactly what the browser sent), as does the Turnstile token.
  const tripped = gateLeadBody(
    { name: "Bot", email: "b@x.com", website: "  http://spam.example  ", "cf-turnstile-response": "tok-123" },
    GATE,
  );
  eq("filled honeypot passes through untouched", tripped.website, "  http://spam.example  ");
  eq("turnstile token passes through", tripped["cf-turnstile-response"], "tok-123");
}

// ========= 3. end to end through the REAL intake core (save-first) =========
async function testAcceptedLeadSavesFirst() {
  console.log("\n# an accepted gate lead saves FIRST with the gate source");
  const spy = makeSpies();
  const body = gateLeadBody({ name: "Dana Lee", email: "dana@lead.com", website: "" }, GATE);
  const r = await submit({ body, save: spy.save, send: spy.send, to: TO, from: FROM, sourceDefault: "website-lead" });
  eq("gate submit is ok", r.ok, true);
  eq("gate lead saved", r.saved, true);
  eq("gate lead reached the saver", spy.saved.length, 1);
  ok("SAVE happened before SEND", spy.events[0] === "save" && spy.events[1] === "send");
  eq("saved lead carries the gate source", spy.saved[0].source, "content-gate:roof-checklist");
  ok("the notification names the gate source", spy.sent[0].text.includes("content-gate:roof-checklist"));
}

async function testHoneypotDropped() {
  console.log("\n# a honeypot-tripped gate body is dropped exactly as the other forms drop it");
  const trap = makeSpies();
  const body = gateLeadBody(
    { name: "Spammy Bot", email: "bot@spam.com", website: "http://spam.example" },
    GATE,
  );
  const r = await submit({ body, save: trap.save, send: trap.send, to: TO, from: FROM });
  eq("honeypot returns benign ok", r.ok, true);
  eq("honeypot flags spam", r.spam, true);
  eq("honeypot did NOT save", trap.saved.length, 0);
  eq("honeypot did NOT notify", trap.sent.length, 0);
  ok("neither save nor send was called", trap.events.length === 0);
}

async function testSaveFailureStillNotifies() {
  console.log("\n# a save failure still notifies (save-first semantics unchanged)");
  const spy = makeSpies({ saveThrows: true });
  const body = gateLeadBody({ name: "Sam", email: "sam@lead.com", website: "" }, GATE);
  const r = await submit({ body, save: spy.save, send: spy.send, to: TO, from: FROM });
  eq("still ok when the store is down", r.ok, true);
  eq("saved reported false", r.saved, false);
  eq("notified still happened", r.notified, true);
  eq("the team was still emailed", spy.sent.length, 1);
}

// ================= sanitizeGateAssetHref: the scheme guard (SEC hardening) =================
// Consistent with the wiring.portalUrl hardening (tools/hydrate.mjs sanitizePortalUrl, v0.18.1
// FIX 6): https-only for an absolute URL, or a same-origin relative path (the common case for a
// public/ asset per the config docs). A javascript: href is refused here, at render/validate
// time - components/ContentGate.tsx treats a null return exactly like a missing asset (renders
// nothing), so a hostile href can never reach the served markup.
function testSanitizeGateAssetHref() {
  console.log("\n# sanitizeGateAssetHref: https-only / same-origin-path scheme guard");
  eq("a public/ relative path passes through unchanged", sanitizeGateAssetHref("/downloads/roof-checklist.pdf"), "/downloads/roof-checklist.pdf");
  eq("an absolute https URL passes through unchanged", sanitizeGateAssetHref("https://cdn.example.com/checklist.pdf"), "https://cdn.example.com/checklist.pdf");
  eq("a javascript: href is refused (the exact attack this guard exists for)", sanitizeGateAssetHref("javascript:alert(1)"), null);
  eq("a data: href is refused", sanitizeGateAssetHref("data:text/html,<script>alert(1)</script>"), null);
  eq("a bare http:// URL is refused (https-only, matching sanitizePortalUrl)", sanitizeGateAssetHref("http://example.com/x.pdf"), null);
  eq("a protocol-relative //host href is refused (off-origin redirect trick)", sanitizeGateAssetHref("//evil.example/x.pdf"), null);
  eq("a backslash-prefixed path is refused (browser \\ -> / normalization trick)", sanitizeGateAssetHref("/\\evil.example/x.pdf"), null);
  eq("empty string is refused", sanitizeGateAssetHref(""), null);
  eq("whitespace-only is refused", sanitizeGateAssetHref("   "), null);
  eq("undefined is refused", sanitizeGateAssetHref(undefined), null);
  eq("a non-string value is refused", sanitizeGateAssetHref(42), null);
  eq("a malformed absolute-looking URL is refused, never throws", sanitizeGateAssetHref("https://"), null);
}

// ---- run ----
testGateSource();
testGateLeadBody();
testSanitizeGateAssetHref();
await testAcceptedLeadSavesFirst();
await testHoneypotDropped();
await testSaveFailureStillNotifies();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
