// A deliberately tiny, zero-dependency markdown renderer for blog article bodies.
// Supports only what a claims-walled trade article needs: h2/h3 headings, paragraphs,
// unordered lists, bold, and links. No raw HTML pass-through (input is HTML-escaped
// first), so a config-authored body cannot inject markup. No external CMS, no heavy
// parser, no copyleft dependency (decision 6: hosted-only).

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Inline: run on already-escaped text. Links first, then bold.
function inline(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
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
