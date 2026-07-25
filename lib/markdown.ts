// A deliberately tiny, zero-dependency markdown renderer for blog article bodies.
// Supports only what a claims-walled trade article needs: h2/h3 headings, paragraphs,
// unordered lists, bold, and links. No raw HTML pass-through (input is HTML-escaped
// first), so a config-authored body cannot inject markup. No external CMS, no heavy
// parser, no copyleft dependency (decision 6: hosted-only).
//
// The escape + link-safety machinery (the attribute-injection guard, SEC hardening
// v0.18.0 FIX 5, proven by tools/markdown.test.mjs) now lives in lib/inline-links.mjs,
// shared with every OTHER prose surface that supports the same [label](href) syntax
// (Section.body, Section.points[], FaqItem.a - see components/Prose.tsx and
// tools/inline-links.test.mjs). This file adds only the bold pass and the block-level
// (heading/list/paragraph) structure on top of that shared inline renderer.
import { escapeHtml, linkify } from "./inline-links.mjs";

// Inline: run on already-escaped text. Links first (lib/inline-links.mjs linkify), then bold.
function inline(s: string): string {
  return linkify(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderMarkdown(md: string): string {
  const blocks = md.trim().split(/\n{2,}/);
  const html: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    if (block.startsWith("### ")) {
      html.push(`<h3>${inline(escapeHtml(block.slice(4).trim()))}</h3>`);
      continue;
    }
    if (block.startsWith("## ")) {
      html.push(`<h2>${inline(escapeHtml(block.slice(3).trim()))}</h2>`);
      continue;
    }

    const lines = block.split("\n");
    if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
      const items = lines
        .map((l) => `<li>${inline(escapeHtml(l.trim().replace(/^[-*]\s+/, "")))}</li>`)
        .join("");
      html.push(`<ul>${items}</ul>`);
      continue;
    }

    // Paragraph: join wrapped lines with a space.
    html.push(`<p>${inline(escapeHtml(lines.join(" ")))}</p>`);
  }

  return html.join("\n");
}
