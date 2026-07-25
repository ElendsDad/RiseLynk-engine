// ============================================================
// site-engine - shared inline markdown-link renderer
//
// Factors the escape + link-safety machinery lib/markdown.ts already carries (the
// attribute-injection guard from SEC hardening v0.18.0 FIX 5, proven by
// tools/markdown.test.mjs) out into ONE dependency-free module, so every prose surface
// that now supports the same [label](href) syntax reuses the exact same regex and
// entity-encoding rather than a second, driftable copy. Consumers:
//   - lib/markdown.ts (full blog-article renderer: this module's link pass, plus its
//     own bold pass and block-level heading/list/paragraph structure)
//   - components/Prose.tsx (the plain-prose surfaces: Section.body, Section.points[],
//     FaqItem.a - About, Summary, CTABanner, Faq, and every other section that renders
//     section.body as a lead paragraph)
//   - lib/seo.ts faqPageLd (strips link syntax back to visible plain text for the
//     FAQPage JSON-LD parity rule)
//
// Plain ESM (no TypeScript annotations), zero npm dependencies; unit-tested in plain
// Node (tools/inline-links.test.mjs).
//
// SCHEME GUARD: only http(s), mailto, tel, and root-relative ("/...") destinations are
// ever linkified. Anything else - javascript:, data:, vbscript:, a bare protocol-
// relative "//evil.com", or malformed syntax - simply does not match the pattern below,
// so it is left as inert literal bracketed text: fail closed, nothing is EVER emitted
// that was not explicitly allow-listed.
// ============================================================

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// The destination character class excludes '"' in every branch so a quote can never
// break out of the href="..." attribute; any residual quote is entity-encoded to &quot;
// before the anchor is built (defense in depth, since this output feeds
// dangerouslySetInnerHTML). The root-relative branch requires the leading "/" NOT be
// followed by a second "/" - a bare "//host/path" is protocol-relative (the browser
// resolves it against the CURRENT scheme to an arbitrary external host), not a same-
// site path, so it is excluded from the allow-list the same as javascript:/data:. Built
// once, reused as both a global (replace) and a plain (test) RegExp so neither call site
// has to reason about shared `lastIndex` state.
const LINK_PATTERN = String.raw`\[([^\]]+)\]\((https?:\/\/[^\s)"]+|mailto:[^\s)"]+|tel:[^\s)"]+|\/(?!\/)[^\s)"]*)\)`;
const LINK_RE_GLOBAL = new RegExp(LINK_PATTERN, "g");
const LINK_RE_TEST = new RegExp(LINK_PATTERN);

// Runs on ALREADY-ESCAPED text: turns every well-formed [label](href) into an anchor. A
// destination that does not match one of the four allow-listed schemes above (for
// example javascript:, data:, or a bare "//host" protocol-relative URL) simply does not
// match, so it is left exactly as the original bracketed text - inert, never a link.
export function linkify(escapedText) {
  return escapedText.replace(
    LINK_RE_GLOBAL,
    (_m, text, dest) => `<a href="${dest.replace(/"/g, "&quot;")}">${text}</a>`,
  );
}

// Does raw (unescaped) text contain at least one well-formed link? Callers (Prose.tsx)
// use this to decide whether a prose node needs the HTML render path at all: a string
// with no link syntax takes the plain-text branch and renders byte-identical to before
// (no wrapper element, no dangerouslySetInnerHTML), so an existing config with no link
// syntax anywhere in its body/points/FAQ copy is completely unaffected by this feature.
export function hasInlineLink(raw) {
  return typeof raw === "string" && LINK_RE_TEST.test(raw);
}

// Escape + linkify: the HTML string a prose node renders (via dangerouslySetInnerHTML)
// once hasInlineLink has already confirmed a link is present.
export function renderInline(raw) {
  return linkify(escapeHtml(raw));
}

// The FAQPage JSON-LD "text" field (and any other machine-readable surface that mirrors
// visible prose verbatim) must match what a reader actually SEES, not the markup a
// reader never sees: when an answer contains link syntax, the structured-data text keeps
// the label and drops the brackets/URL. Plain text with no link syntax passes through
// unchanged. No HTML escaping here - this feeds a JSON string value, not markup.
export function toPlainText(raw) {
  if (typeof raw !== "string") return raw;
  return raw.replace(LINK_RE_GLOBAL, (_m, text) => text);
}

export { escapeHtml };
