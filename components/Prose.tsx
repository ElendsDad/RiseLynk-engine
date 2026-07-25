import { hasInlineLink, renderInline } from "@/lib/inline-links.mjs";

// Renders one piece of PROSE copy (Section.body, one Section.points[] item, one
// FaqItem.a) that MAY contain a markdown-style [label](href) link. Reuses the same
// escape + scheme guard lib/markdown.ts uses for the full blog-article renderer
// (lib/inline-links.mjs; SEC hardening v0.18.0 FIX 5), so a link here is exactly as
// safe as a link in a blog article body.
//
// BYTE-IDENTICAL CONTRACT: text with no link syntax takes the plain branch below and
// renders as a bare text child - the EXACT SAME output React would produce for
// `{text}` directly - so an existing config with no link syntax anywhere in its copy
// is completely unaffected by this component existing. Only text that actually
// contains a well-formed link switches to the HTML branch, and even then this never
// changes the CALLER's own wrapping element (<p>, <li>, and so on); it only changes
// what renders inside it.
export default function Prose({ text }: { text: string }) {
  if (!hasInlineLink(text)) return <>{text}</>;
  return <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />;
}
