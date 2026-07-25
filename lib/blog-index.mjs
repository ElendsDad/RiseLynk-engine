// ============================================================
// site-engine - blog index layout helpers (teardown P2 item 6a)
//
// Pure grouping for featured + category organization. When no article carries
// `featured` or `category`, callers should keep the flat list layout
// (byte-identical absent-field contract). Read-time stays in lib/read-time.mjs.
// ============================================================

/**
 * @param {{ date?: string }} a
 * @param {{ date?: string }} b
 */
function byDateDesc(a, b) {
  const da = a.date ? Date.parse(a.date) || 0 : 0;
  const db = b.date ? Date.parse(b.date) || 0 : 0;
  return db - da;
}

/**
 * @param {readonly { featured?: boolean, category?: string, date?: string }[]} articles
 * @param {readonly string[] | undefined} categoryOrder
 * @returns {{
 *   organized: boolean,
 *   featured: typeof articles,
 *   groups: { [category: string]: typeof articles },
 *   categoryNames: string[],
 *   uncategorized: typeof articles,
 * }}
 */
export function organizeBlogIndex(articles, categoryOrder) {
  const list = Array.isArray(articles) ? [...articles] : [];
  list.sort(byDateDesc);

  const hasFeatured = list.some((a) => a && a.featured === true);
  const hasCategory = list.some((a) => a && typeof a.category === "string" && a.category.trim());
  const organized = hasFeatured || hasCategory;

  const featured = hasFeatured ? list.filter((a) => a.featured === true) : [];
  // Featured articles still appear in their category groups (blog.google-style:
  // lead slot + still listed under the topic). Callers may choose to skip
  // re-listing; the blog index skips re-listing featured in the flat remainder.
  const remainder = hasFeatured ? list.filter((a) => a.featured !== true) : list;

  /** @type {{ [category: string]: typeof articles }} */
  const groups = Object.create(null);
  /** @type {typeof articles} */
  const uncategorized = [];

  for (const a of remainder) {
    const cat = typeof a.category === "string" ? a.category.trim() : "";
    if (!cat) {
      uncategorized.push(a);
      continue;
    }
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(a);
  }

  const seen = Object.keys(groups);
  const order = Array.isArray(categoryOrder)
    ? categoryOrder.filter((c) => typeof c === "string" && c.trim() && groups[c.trim()])
        .map((c) => c.trim())
    : [];
  const rest = seen.filter((c) => !order.includes(c));
  const categoryNames = [...order, ...rest];

  return { organized, featured, groups, categoryNames, uncategorized };
}
