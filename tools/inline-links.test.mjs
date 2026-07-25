// =============================================================================
// site-engine - shared inline markdown-link renderer harness (engine feedback #6)
//
//   node tools/inline-links.test.mjs
//
// Proves lib/inline-links.mjs, the escape + link-safety machinery factored out of
// lib/markdown.ts (SEC hardening v0.18.0 FIX 5, proven separately by
// tools/markdown.test.mjs) and shared by components/Prose.tsx (Section.body,
// Section.points[], FaqItem.a) and lib/seo.ts (FAQPage JSON-LD parity).
//
// Covers:
//   - escapeHtml / linkify: the same attribute-injection guard markdown.ts already
//     proved, now exercised through the shared module directly.
//   - The extended scheme allow-list (http, https, mailto, tel, root-relative) and
//     the fail-closed reject of everything else (javascript:, data:, a bare "//host").
//   - hasInlineLink: the byte-identity decision Prose.tsx relies on - false for any
//     plain text, true only for a well-formed link.
//   - toPlainText: the FAQPage JSON-LD parity rule (label kept, brackets/URL dropped;
//     plain text passes through unchanged).
// =============================================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "inline-links.mjs");

const mod = await import("file://" + MODULE_PATH);
const { escapeHtml, linkify, hasInlineLink, renderInline, toPlainText } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ================= 1. escapeHtml =================
function testEscapeHtml() {
  console.log("\n# escapeHtml: & < > only, in the right order");
  eq("escapes ampersand, less-than, greater-than", escapeHtml('A & B <tag> "quoted"'), 'A &amp; B &lt;tag&gt; "quoted"');
  eq("plain text is untouched", escapeHtml("plain text"), "plain text");
}

// ================= 2. linkify: the safe schemes =================
function testLinkifySafeSchemes() {
  console.log("\n# linkify: http(s), mailto, tel, and root-relative all become anchors");
  eq("https link", linkify(escapeHtml("[Home](https://example.com/x)")), '<a href="https://example.com/x">Home</a>');
  eq("http link", linkify(escapeHtml("[Home](http://example.com/x)")), '<a href="http://example.com/x">Home</a>');
  eq("root-relative link", linkify(escapeHtml("[About](/about)")), '<a href="/about">About</a>');
  eq("mailto link", linkify(escapeHtml("[Email us](mailto:crew@example.com)")), '<a href="mailto:crew@example.com">Email us</a>');
  eq("tel link", linkify(escapeHtml("[Call us](tel:+15551234567)")), '<a href="tel:+15551234567">Call us</a>');
  eq("plain text with no link syntax is untouched", linkify(escapeHtml("just words, no brackets")), "just words, no brackets");
}

// ================= 3. linkify: the scheme guard rejects everything else =================
function testLinkifyRejectsUnsafeSchemes() {
  console.log("\n# linkify: javascript:, data:, and a bare protocol-relative URL never become an anchor");
  const evilJs = "[click](javascript:alert(1))";
  ok("javascript: is left as inert literal text", linkify(escapeHtml(evilJs)) === escapeHtml(evilJs));
  ok("javascript: never produces an <a>", !linkify(escapeHtml(evilJs)).includes("<a "));
  const evilData = "[open](data:text/html,<script>alert(1)</script>)";
  ok("data: never produces an <a>", !linkify(escapeHtml(evilData)).includes("<a "));
  const evilProtoRel = "[go](//evil.example.com/x)";
  ok("bare protocol-relative // never produces an <a>", !linkify(escapeHtml(evilProtoRel)).includes("<a "));
}

// ================= 4. attribute-injection guard (mirrors tools/markdown.test.mjs) =================
function testAttributeInjectionGuard() {
  console.log("\n# linkify: a quote in the destination can never break out of href=\"...\"");
  const evil = linkify(escapeHtml('[click](http://evil.com/a"onmouseover=alert;x=")'));
  ok("no anchor carries an event handler in its attributes", !/<a [^>]*onmouseover/i.test(evil));
  ok("no broken-out href attribute is produced", !evil.includes('href="http://evil.com/a"'));
  const anchors = evil.match(/<a [^>]*>/gi) || [];
  ok("any emitted anchor has no raw quote inside its attributes", anchors.every((a) => !a.slice(3, -1).includes('"')));
}

// ================= 5. hasInlineLink: the byte-identity decision =================
function testHasInlineLink() {
  console.log("\n# hasInlineLink: false for plain text, true only for a well-formed link");
  ok("plain sentence: false", hasInlineLink("Call us any time, we are here to help.") === false);
  ok("a lone bracket with no parenthesized dest: false", hasInlineLink("See [note] below") === false);
  ok("an empty string: false", hasInlineLink("") === false);
  ok("undefined: false (defensive)", hasInlineLink(undefined) === false);
  ok("a well-formed relative link: true", hasInlineLink("See our [pricing](/pricing) page.") === true);
  ok("a well-formed mailto link: true", hasInlineLink("[Email](mailto:a@b.com) us.") === true);
  ok("a javascript: destination does NOT count as a link (fails the scheme guard)", hasInlineLink("[click](javascript:alert(1))") === false);
}

// ================= 6. renderInline =================
function testRenderInline() {
  console.log("\n# renderInline: escape + linkify together");
  eq(
    "renders a real anchor and escapes surrounding text",
    renderInline('Ask about our <b>free</b> quote: [get one](/quote)'),
    'Ask about our &lt;b&gt;free&lt;/b&gt; quote: <a href="/quote">get one</a>',
  );
}

// ================= 7. toPlainText: FAQPage JSON-LD parity =================
function testToPlainText() {
  console.log("\n# toPlainText: strips link syntax to the visible label, no HTML escaping");
  eq("keeps the label, drops the brackets and URL", toPlainText("See our [pricing](/pricing) page for details."), "See our pricing page for details.");
  eq("multiple links in one string", toPlainText("[Call](tel:5551234) or [email](mailto:a@b.com) us."), "Call or email us.");
  eq("plain text with no link syntax passes through unchanged", toPlainText("Plain answer, nothing fancy."), "Plain answer, nothing fancy.");
  eq("a rejected-scheme link is not a real link, so its brackets stay literal", toPlainText("[click](javascript:alert(1))"), "[click](javascript:alert(1))");
  ok("no HTML escaping happens here (JSON string value, not markup)", toPlainText("Ampersands & <tags> pass through raw") === "Ampersands & <tags> pass through raw");
  eq("non-string input passes through untouched (defensive)", toPlainText(undefined), undefined);
}

// ---- run ----
testEscapeHtml();
testLinkifySafeSchemes();
testLinkifyRejectsUnsafeSchemes();
testAttributeInjectionGuard();
testHasInlineLink();
testRenderInline();
testToPlainText();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
