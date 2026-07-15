// =============================================================================
// site-engine - markdown link-safety harness (SEC hardening v0.18.0, FIX 5)
//
//   node tools/markdown.test.mjs
//
// lib/markdown.ts renders blog article bodies and its output is fed to
// dangerouslySetInnerHTML (app/blog/[slug]/page.tsx). This proves the link
// renderer cannot be used to inject an HTML attribute or event handler: a link
// destination may not carry a quote that breaks out of href="...". The REAL
// renderer is imported straight from the .ts via Node's native type stripping, so
// there is no second copy of the regex to drift.
// =============================================================================
import { renderMarkdown } from "../lib/markdown.ts";

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };

console.log("# markdown link renderer: attribute-injection is neutralized");

// A destination carrying a quote + event handler. Before the fix the regex admitted the quote
// into the destination and produced <a href="...a"onmouseover=...">, a broken-out attribute with
// a live handler. After the fix no such anchor is emitted (the destination class excludes the
// quote, and any residual quote is entity-encoded).
const evil = renderMarkdown('[click](http://evil.com/a"onmouseover=alert;x=")');
ok("no anchor carries an event handler in its attributes", !/<a [^>]*onmouseover/i.test(evil));
ok("no broken-out href attribute is produced", !evil.includes('href="http://evil.com/a"'));

// The root-relative branch is guarded the same way.
const evilRel = renderMarkdown('[x](/p"onmouseover=alert;a=")');
ok("root-relative destination cannot break out either", !/<a [^>]*onmouseover/i.test(evilRel));

// A quote reaching the destination through the encoded path is neutralized as &quot;, never raw.
const anchors = evil.match(/<a [^>]*>/gi) || [];
ok("any emitted anchor has no raw quote inside its attributes", anchors.every((a) => !a.slice(3, -1).includes('"')));

// Benign links still render (the fix does not break normal markdown links).
const good = renderMarkdown("[Home](/about) and [Site](https://example.com/x) and **bold**");
ok("root-relative link still renders", good.includes('<a href="/about">Home</a>'));
ok("absolute https link still renders", good.includes('<a href="https://example.com/x">Site</a>'));
ok("bold still renders", good.includes("<strong>bold</strong>"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
