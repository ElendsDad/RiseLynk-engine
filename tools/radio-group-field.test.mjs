// ============================================================
// site-engine - LeadField radio-group UI + fold harness
//
//   node tools/radio-group-field.test.mjs
//
// Gap 1 from the landing-engine parity audit: preferred follow-up as
// exclusive radio chips. Proves:
//   1. RequestAccessForm renders type "radio-group" as fieldset/legend +
//      native type="radio" chips (a11y + no-JS), not as a select or checkbox.
//   2. A radio-group value folds into the saved message like any other
//      non-canonical field (intake contract unchanged).
//   3. Schema documents radio-group on LeadField.type.
// ============================================================

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const { submit, foldExtras } = await import("file://" + join(ROOT, "lib", "contact-intake.mjs"));

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

function testSourceContract() {
  console.log("\n# RequestAccessForm radio-group: fieldset/legend + native radios");
  const src = readFileSync(join(ROOT, "components", "RequestAccessForm.tsx"), "utf8");
  ok("handles type === \"radio-group\"", /type\s*===\s*["']radio-group["']/.test(src));
  ok("renders <fieldset> for the group", /radio-group[\s\S]*?<fieldset[\s\S]*?<\/fieldset>/s.test(src) ||
    /if \(type === "radio-group"\)[\s\S]*?<fieldset/.test(src));
  ok("renders <legend>", /if \(type === "radio-group"\)[\s\S]*?<legend>/.test(src));
  ok("uses type=\"radio\" inputs", /if \(type === "radio-group"\)[\s\S]*?type="radio"/.test(src));
  ok("reuses ra-chip chip UI (not a plain select)", /if \(type === "radio-group"\)[\s\S]*?ra-chip/.test(src));
  ok("wires required onto the radios for HTML5 group validation",
    /if \(type === "radio-group"\)[\s\S]*?required=\{field\.required\}/.test(src));
  // Still posts through the same native form action (no-JS).
  ok("form still method=post action=/api/lead", /method="post"/.test(src) && /action="\/api\/lead"/.test(src));
}

function testSchemaDocumentsType() {
  console.log("\n# config-schema LeadField.type includes radio-group");
  const src = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
  ok("LeadField type union lists radio-group",
    /type\?:\s*"[^"]*"\s*\|\s*[^;]*"radio-group"/.test(src) || /"radio-group"/.test(src));
  ok("options comment mentions radio-group", /options\?:[^;]*radio-group|radio-group[\s\S]{0,200}options/.test(src));
}

async function testRadioFoldsLikeSelect() {
  console.log("\n# radio-group value folds into the message (intake unchanged)");
  // Shape the no-JS /api/lead path produces for a single checked radio: one string value.
  const lines = foldExtras({ preferredFollowUp: "Text message" });
  eq("foldExtras single value", lines[0], "preferredFollowUp: Text message");

  const events = [];
  const saved = [];
  const save = async (lead) => { events.push("save"); saved.push(lead); return { saved: true }; };
  const send = async () => { events.push("send"); return true; };
  const r = await submit({
    body: {
      name: "Sam Lee",
      email: "sam@example.com",
      message: "Please follow up.",
      preferredFollowUp: "Phone call",
    },
    save,
    send,
    to: "owner@example.com",
    from: "Site <hello@example.com>",
  });
  eq("submit ok", r.ok, true);
  ok("preferred follow-up reaches saved message",
    saved[0].message.includes("preferredFollowUp: Phone call"));
  ok("core message preserved", saved[0].message.startsWith("Please follow up."));
  ok("no new intake column invented", !("preferredFollowUp" in saved[0]));
}

testSourceContract();
testSchemaDocumentsType();
await testRadioFoldsLikeSelect();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
