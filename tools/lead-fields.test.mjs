// ============================================================
// site-engine - LeadField vocabulary end-to-end harness (feedback item #24)
//
//   node tools/lead-fields.test.mjs
//
// Feedback item #24 asked for a leadform field vocabulary rich enough to
// express property address, an urgency select, a budget range plus a
// timeframe, and vehicle year/make/model. The "address" piece shipped as
// Section.fields gaining "building" (a fixed enum entry mapped straight to
// the existing canonical `building` column). The REST of that vocabulary
// (an arbitrary select, arbitrary text fields, a multi-select) was never a
// gap: Section.formFields (LeadField[]) already lets a site declare any of
// those, and lib/contact-intake.mjs's foldExtras() already carries every
// non-canonical field into the saved lead's message body. That seam had no
// dedicated gate proving it end to end for this exact vocabulary - this file
// is that gate, driving the REAL lib/contact-intake.mjs exports (no mock of
// the module under test), mirroring tools/contact-intake.test.mjs's harness
// style (fake save/send, ordered event log, plain assert-style ok/eq).
//
// What this proves, concretely:
//   1. Every canonical intake column (name, company, email, phone, units,
//      service, preferredTime, building, message) maps straight onto the
//      saved lead, never into the folded message text.
//   2. A custom select (e.g. "Urgency: Emergency Callout") and custom free
//      text fields (vehicle year/make/model) fold into the saved message
//      body verbatim, byte for byte, and are never dropped.
//   3. A checkbox-group's multiple checked values survive as one joined
//      line (both the raw-array shape a direct caller might pass, and the
//      pre-joined comma string shape app/api/lead/route.ts's readBody()
//      hands to submit() for a real no-JS multi-value post).
//   3b. A radio-group's single chosen value folds the same way as a select
//      (one string under the field name; intake contract unchanged).
//   4. A classic submission with NO formFields/LeadField at all (the fixed
//      Section.fields enum path: phone/service/preferredTime/building/
//      message) maps to the exact same canonical lead shape it always has -
//      the vocabulary work touches nothing about that path.
//   5. required is a CLIENT-side (HTML5 constraint validation) contract
//      only; lib/contact-intake.mjs enforces no server-side requiredness for
//      a declared LeadField beyond the pre-existing core checks (a contact
//      method, and at least one of name/company/message/service). A
//      submission missing a value for a field the config marked required
//      still saves, because the server has no schema to check it against -
//      this is the honest current contract, not a bug this gate is trying
//      to hide.
//   6. The honeypot and the email/contact-method validation are UNCHANGED
//      by the presence of rich extras: a bot trips the trap regardless of
//      how many extra fields it fills, and extras never rescue an otherwise
//      invalid or empty submission.
//   7. A malicious value inside a folded extra is HTML-escaped in the email
//      notification exactly like every other field (the fold happens before
//      escaping, so it rides the same esc() pass as the core fields).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "contact-intake.mjs");

const mod = await import("file://" + MODULE_PATH);
const { submit, foldExtras } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

function makeSpies() {
  const events = [];
  const saved = [];
  const sent = [];
  const save = async (lead) => { events.push("save"); saved.push(lead); return { saved: true }; };
  const send = async (msg) => { events.push("send"); sent.push(msg); return true; };
  return { events, saved, sent, save, send };
}

const TO = "owner@example.com";
const FROM = "Example Site <hello@example.com>";

// ============= 1. every canonical column maps straight to the lead =============
async function testCanonicalColumnsMapDirectly() {
  console.log("\n# canonical intake columns map straight to the saved lead (never folded)");
  const spy = makeSpies();
  const r = await submit({
    body: {
      name: "Dana Lee", company: "Acme Vertical", email: "dana@acme.com", phone: "(360) 555-0100",
      units: "24", service: "Maintenance", preferredTime: "weekday mornings",
      building: "500 Union St, Seattle, WA", message: "Please call back.",
    },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("submit is ok", r.ok, true);
  const lead = spy.saved[0];
  eq("name column", lead.name, "Dana Lee");
  eq("company column", lead.company, "Acme Vertical");
  eq("email column", lead.email, "dana@acme.com");
  eq("phone column", lead.phone, "(360) 555-0100");
  eq("units column (parsed int)", lead.units, 24);
  eq("service column", lead.service, "Maintenance");
  eq("preferredTime column", lead.preferredTime, "weekday mornings");
  eq("building column (address)", lead.building, "500 Union St, Seattle, WA");
  ok("core message preserved with no folded extras appended", lead.message === "Please call back.");
}

// ============= 2. custom select + custom texts fold verbatim =============
// The feedback's concrete wanted fields beyond "building": an urgency select, a budget range,
// a timeframe, and vehicle year/make/model. None of these names collide with a canonical column,
// so every one of them must survive as its own "name: value" line in the saved message, in the
// order submitted, byte for byte (no relabeling, no truncation below the 500-char per-line cap).
async function testCustomSelectAndTextsFoldVerbatim() {
  console.log("\n# a custom select and custom text fields fold into the saved message verbatim");
  const spy = makeSpies();
  const r = await submit({
    body: {
      name: "Jordan Vale", email: "jordan@example.com", message: "Need a callback estimate.",
      urgency: "Emergency Callout", // a select LeadField, options like ["Emergency Callout", "Routine"]
      budget: "$5,000 - $10,000",   // a select or text LeadField for a budget range
      timeframe: "Within 2 weeks",  // a text or select LeadField
      vehicleYear: "2019", vehicleMake: "Toyota", vehicleModel: "Camry",
    },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("submit is ok", r.ok, true);
  const lead = spy.saved[0];
  ok("core message preserved", lead.message.startsWith("Need a callback estimate."));
  ok("urgency select folds verbatim", lead.message.includes("urgency: Emergency Callout"));
  ok("budget range folds verbatim", lead.message.includes("budget: $5,000 - $10,000"));
  ok("timeframe folds verbatim", lead.message.includes("timeframe: Within 2 weeks"));
  ok("vehicle year folds", lead.message.includes("vehicleYear: 2019"));
  ok("vehicle make folds", lead.message.includes("vehicleMake: Toyota"));
  ok("vehicle model folds", lead.message.includes("vehicleModel: Camry"));
  // None of the extras leaked into a canonical column they do not belong to.
  ok("no extra column invented on the lead object", !("urgency" in lead) && !("budget" in lead) && !("vehicleYear" in lead));
  // The same folded lines reach the team notification (both html and text bodies), not just the
  // saved lead - a lead viewed only through the notification email still carries every extra.
  ok("extras reach the notification text body", spy.sent[0].text.includes("vehicleModel: Camry"));
  ok("extras reach the notification html body", spy.sent[0].html.includes("urgency: Emergency Callout"));
}

// ============= 3. checkbox-group multi-value survives =============
async function testCheckboxGroupMultiValueSurvives() {
  console.log("\n# a checkbox-group's multiple checked values survive as one joined line");
  // Shape A: a raw array value, as foldExtras documents accepting directly (a direct caller, or
  // a future non-HTML-form intake path) - proven at the foldExtras unit level.
  const linesFromArray = foldExtras({ equipmentNeeds: ["Emergency Callout", "Routine PM", "Modernization"] });
  eq("array value joins in order, comma-separated", linesFromArray[0], "equipmentNeeds: Emergency Callout, Routine PM, Modernization");

  // Shape B: the shape app/api/lead/route.ts's readBody() actually hands to submit() for a real
  // no-JS <form> post - it already joins repeated form-field names into one comma string BEFORE
  // calling submit(), so this is the true end-to-end shape a checkbox-group takes in production.
  const spy = makeSpies();
  const r = await submit({
    body: {
      name: "Casey Nguyen", email: "casey@example.com", message: "Multiple stops need service.",
      equipmentNeeds: "Emergency Callout, Routine PM, Modernization",
    },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("submit is ok", r.ok, true);
  ok("all checked values reach the saved message, none dropped",
    spy.saved[0].message.includes("equipmentNeeds: Emergency Callout, Routine PM, Modernization"));
}

// ============= 3b. radio-group single value folds like a select =============
async function testRadioGroupSingleValueFolds() {
  console.log("\n# a radio-group's single chosen value folds into the saved message (like a select)");
  // A native radio posts one value under the field name. Same shape as a select; the UI is
  // chips (RequestAccessForm), the intake path is unchanged.
  const spy = makeSpies();
  const r = await submit({
    body: {
      name: "Riley Chen", email: "riley@example.com", message: "Happy to talk.",
      preferredFollowUp: "Email",
    },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("submit is ok", r.ok, true);
  ok("radio choice folds verbatim", spy.saved[0].message.includes("preferredFollowUp: Email"));
  ok("core message preserved", spy.saved[0].message.startsWith("Happy to talk."));
  ok("no preferredFollowUp column on the lead", !("preferredFollowUp" in spy.saved[0]));
}

// ============= 4. the classic (no formFields) vocabulary path is unaffected =============
async function testClassicVocabularyUnaffected() {
  console.log("\n# the classic Section.fields enum path (no LeadField/formFields at all) is byte-identical");
  const spy = makeSpies();
  const r = await submit({
    body: {
      name: "Pat Rivera", email: "pat@example.com", phone: "3605551234", service: "Inspection",
      preferredTime: "afternoons", building: "12 Elm St", message: "Standard inline leadform submit.",
    },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("submit is ok", r.ok, true);
  const lead = spy.saved[0];
  eq("name", lead.name, "Pat Rivera");
  eq("phone", lead.phone, "3605551234");
  eq("service", lead.service, "Inspection");
  eq("preferredTime", lead.preferredTime, "afternoons");
  eq("building", lead.building, "12 Elm St");
  eq("message has no folded extras appended (there were none declared)", lead.message, "Standard inline leadform submit.");
  ok("no LeadField vocabulary machinery ran (foldExtras had nothing to fold)", foldExtras({
    name: "x", email: "y@z.com", phone: "1", service: "s", preferredTime: "t", building: "b", message: "m",
  }).length === 0);
}

// ============= 5. required is client-side only; the server enforces no per-field schema =============
async function testRequiredIsClientSideOnly() {
  console.log("\n# a config-declared `required` LeadField is a CLIENT constraint only - the server has no schema to enforce it");
  // A config might mark "urgency" required:true. The browser blocks an empty submit via native
  // HTML5 constraint validation (the <form> carries no `noValidate` in RequestAccessForm), but if
  // that constraint is bypassed (JS off with a hand-crafted post, or the browser's validation is
  // skipped), the server has no per-field requiredness model: it only enforces the pre-existing
  // core checks (a contact method, and at least one of name/company/message/service). A missing
  // "urgency" value therefore still saves - this is the honest current contract, not a defect this
  // gate is papering over. Documented in lib/config-schema.ts's LeadField comment.
  const spy = makeSpies();
  const r = await submit({
    body: { name: "Alex Kim", email: "alex@example.com", message: "Please advise.", urgency: "" },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  eq("submit still ok with an empty 'required' extra", r.ok, true);
  eq("lead still saved", spy.saved.length, 1);
  ok("the empty extra folds to nothing (empty values are dropped, not a blank line)",
    !spy.saved[0].message.includes("urgency:"));
}

// ============= 6. honeypot + validation are unchanged by rich extras =============
async function testHoneypotAndValidationUnaffectedByExtras() {
  console.log("\n# honeypot and core validation are unchanged by the presence of rich extra fields");
  const trap = makeSpies();
  const spamResult = await submit({
    body: {
      name: "Spammy Bot", email: "bot@spam.com", message: "buy my thing", website: "http://spam.example",
      urgency: "Emergency", budget: "$1", timeframe: "now", vehicleYear: "2019",
    },
    save: trap.save, send: trap.send, to: TO, from: FROM,
  });
  eq("a filled honeypot still drops the submission, extras or not", spamResult.spam, true);
  eq("nothing was saved", trap.saved.length, 0);
  eq("nothing was sent", trap.sent.length, 0);

  const badEmail = makeSpies();
  const badResult = await submit({
    body: { name: "X", email: "not-an-email", message: "hi", urgency: "Emergency", vehicleMake: "Toyota" },
    save: badEmail.save, send: badEmail.send, to: TO, from: FROM,
  });
  eq("bad email is still rejected regardless of extras present", badResult.error, "bad_email");
  eq("nothing saved on bad email", badEmail.saved.length, 0);

  const empty = makeSpies();
  const emptyResult = await submit({
    body: { email: "x@y.com", urgency: "Emergency Callout", budget: "$5,000", timeframe: "ASAP" },
    save: empty.save, send: empty.send, to: TO, from: FROM,
  });
  eq("extras never rescue an otherwise-empty core submission", emptyResult.error, "empty");
  eq("nothing saved when the core fields are empty", empty.saved.length, 0);
}

// ============= 7. a malicious extra is HTML-escaped in the notification, same as any field =============
async function testExtraValueEscapedInNotification() {
  console.log("\n# a folded extra is HTML-escaped in the notification exactly like a core field");
  const spy = makeSpies();
  await submit({
    body: { name: "Real Person", email: "real@person.com", message: "quote please",
      notes: "<img src=x onerror=alert(1)> and a & b" },
    save: spy.save, send: spy.send, to: TO, from: FROM,
  });
  const msg = spy.sent[0];
  ok("the raw tag never reaches the html notification body", !msg.html.includes("<img src=x"));
  ok("the extra's angle brackets are escaped", msg.html.includes("&lt;img"));
  ok("the extra's ampersand is escaped", msg.html.includes("a &amp; b"));
  ok("the folded line is still present (escaped, not dropped)", msg.text.includes("notes: <img src=x onerror=alert(1)> and a & b"));
}

// ---- run ----
await testCanonicalColumnsMapDirectly();
await testCustomSelectAndTextsFoldVerbatim();
await testCheckboxGroupMultiValueSurvives();
await testRadioGroupSingleValueFolds();
await testClassicVocabularyUnaffected();
await testRequiredIsClientSideOnly();
await testHoneypotAndValidationUnaffectedByExtras();
await testExtraValueEscapedInNotification();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
