// =============================================================================
// site-engine - JSON-LD serialization-sink harness (SEC hardening v0.18.0, FIX 1)
//
//   node tools/jsonld-escape.test.mjs
//
// Every lib/seo.ts builder funnels through components/JsonLd.tsx, which serializes
// with serializeJsonLd (lib/jsonld-escape.mjs). This proves that a config-supplied
// string containing "</script>" cannot terminate the inline
// <script type="application/ld+json"> element: '<' is escaped to the JSON escape
// that a consumer parses back to '<', so the emitted @graph is equivalent but inert.
// One escape closes all six present JSON-LD entry points and every future builder.
// =============================================================================
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const mod = await import("file://" + join(ROOT, "lib", "jsonld-escape.mjs"));
const { serializeJsonLd } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

console.log("");
console.log("# serializeJsonLd: a config string cannot terminate the <script type=ld+json> block");

// A config value carrying </script> plus a payload. It must NOT survive raw in the output, or it
// would close the inline script element and inject markup. The '<' is escaped so it is inert.
const raw = "ACME </script><script>alert(1)</script>";
const out = serializeJsonLd({ name: raw });
ok("no raw '<' survives (so </script> can never close the block)", !out.includes("<"));
ok("the </script> breakout does not appear raw", !out.includes("</" + "script>"));
eq("round-trips back to the exact original value for a JSON consumer", JSON.parse(out).name, raw);

// U+2028 / U+2029 are valid inside JSON strings but are line terminators in a <script> parsing
// context, so they must not be emitted raw.
const ls = String.fromCharCode(0x2028), ps = String.fromCharCode(0x2029);
ok("U+2028 is not emitted raw", !serializeJsonLd({ s: ls }).includes(ls));
ok("U+2029 is not emitted raw", !serializeJsonLd({ s: ps }).includes(ps));
eq("U+2028 round-trips to the original character", JSON.parse(serializeJsonLd({ s: ls })).s, ls);

// Benign content serializes to ordinary JSON (no over-escaping of safe values).
eq("benign content serializes unchanged", serializeJsonLd({ a: 1, b: "ok" }), '{"a":1,"b":"ok"}');

console.log("");
console.log(passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
