// ============================================================
// site-engine - blog read-time estimate
//
// Pure helper: counts words in an article's visible text surface and returns
// a whole-minute reading estimate (minimum 1 when there is any text). Used by
// the blog index card banner. Dependency-free plain ESM so tools/read-time.test.mjs
// can exercise it with plain Node.
//
// Claims wall: never invents copy. Returns null when there is nothing to measure
// so a card with no body/summary/faqs emits no banner (byte-identity for empty).
// ============================================================

const WORDS_PER_MINUTE = 220;

// Strip tags / markdown link wrappers / punctuation noise into plain words.
function plainText(input) {
  if (typeof input !== "string" || !input) return "";
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_\-~]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text) {
  const t = plainText(text);
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

// Collect the same surfaces a reader sees on the article page: lede, summary
// intro/points, markdown body, and FAQ q/a. Description alone is marketing
// blurb for the card and is NOT counted (it is already shown on the card).
export function articleWordCount(article) {
  if (!article || typeof article !== "object") return 0;
  let n = 0;
  n += wordCount(article.lede);
  n += wordCount(article.body);
  const summary = article.summary;
  if (summary && typeof summary === "object") {
    n += wordCount(summary.intro);
    if (Array.isArray(summary.points)) {
      for (const p of summary.points) n += wordCount(p);
    }
  }
  if (Array.isArray(article.faqs)) {
    for (const f of article.faqs) {
      if (!f || typeof f !== "object") continue;
      n += wordCount(f.q);
      n += wordCount(f.a);
    }
  }
  return n;
}

// Returns { minutes, label } or null when there is no measurable text.
export function readTimeForArticle(article, wordsPerMinute = WORDS_PER_MINUTE) {
  const words = articleWordCount(article);
  if (words <= 0) return null;
  const wpm =
    typeof wordsPerMinute === "number" && Number.isFinite(wordsPerMinute) && wordsPerMinute > 0
      ? wordsPerMinute
      : WORDS_PER_MINUTE;
  const minutes = Math.max(1, Math.round(words / wpm));
  return {
    minutes,
    label: minutes === 1 ? "1 min read" : minutes + " min read",
    words,
  };
}

export { WORDS_PER_MINUTE };
