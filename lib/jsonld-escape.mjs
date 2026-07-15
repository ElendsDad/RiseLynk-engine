// Serialize a JSON-LD object for safe embedding inside a
// <script type="application/ld+json"> element (components/JsonLd.tsx).
//
// JSON.stringify alone leaves '<' literal, so a config-supplied string containing
// "</script>" would close the script element early and let markup or script inject
// into the page. This is an HTML-context break, not a JSON problem, so it is fixed
// at the serialization boundary rather than by per-field sanitization. Every
// lib/seo.ts builder funnels through JsonLd.tsx, which calls this one function, so a
// single escape closes the shared sink for every present and future JSON-LD node.
//
// The load-bearing '<' is rewritten to the six-character JSON escape <, which a
// JSON.parse reads back as '<', so the emitted @graph is equivalent for any consumer
// but can never terminate the script element. U+2028 and U+2029 are also escaped:
// both are valid inside a JSON string but are line terminators in a <script> parsing
// context, so leaving them raw can break the inline block. They are matched via
// String.fromCharCode so this source stays ASCII-only.
//
// Plain ESM with JSDoc (the lib/contact-intake.mjs pattern) so it is imported both by
// the .tsx component and by the Node test harness with no TypeScript toolchain.
const LINE_SEP = new RegExp(String.fromCharCode(0x2028), "g");
const PARA_SEP = new RegExp(String.fromCharCode(0x2029), "g");

/** @param {unknown} data @returns {string} */
export function serializeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEP, "\\u2028")
    .replace(PARA_SEP, "\\u2029");
}
