// Gate: blog featured + category organization (lib/blog-index.mjs).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { organizeBlogIndex } = await import("file://" + join(ROOT, "lib", "blog-index.mjs"));

let passed = 0;
let failed = 0;
function ok(name, cond) {
  if (cond) {
    passed++;
    console.log("  ok  " + name);
  } else {
    failed++;
    console.log("  FAIL  " + name);
  }
}

console.log("# organizeBlogIndex: absent fields stay flat");
{
  const arts = [
    { slug: "a", date: "2026-01-02" },
    { slug: "b", date: "2026-01-03" },
  ];
  const r = organizeBlogIndex(arts);
  ok("not organized without featured/category", r.organized === false);
  ok("featured empty", r.featured.length === 0);
  ok("no category groups", r.categoryNames.length === 0);
  ok("uncategorized keeps all", r.uncategorized.length === 2);
  ok("sorted by date desc", r.uncategorized[0].slug === "b");
}

console.log("\n# organizeBlogIndex: featured + categories");
{
  const arts = [
    { slug: "feat", featured: true, category: "Ops", date: "2026-02-01" },
    { slug: "ops1", category: "Ops", date: "2026-01-15" },
    { slug: "prod1", category: "Product", date: "2026-01-20" },
    { slug: "loose", date: "2026-01-10" },
  ];
  const r = organizeBlogIndex(arts, ["Product", "Ops"]);
  ok("organized when featured/category present", r.organized === true);
  ok("featured collected", r.featured.length === 1 && r.featured[0].slug === "feat");
  ok("featured removed from remainder groups", !r.groups.Ops?.some((a) => a.slug === "feat"));
  ok("categoryOrder honored", r.categoryNames[0] === "Product" && r.categoryNames[1] === "Ops");
  ok("uncategorized holds loose", r.uncategorized.length === 1 && r.uncategorized[0].slug === "loose");
}

console.log("\n# schema + page surface");
const schema = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
ok("Article.category optional", schema.includes("category?: string"));
ok("Article.featured optional", schema.includes("featured?: boolean"));
ok("BlogConfig.categoryOrder optional", schema.includes("categoryOrder?: string[]"));

const page = readFileSync(join(ROOT, "app", "blog", "page.tsx"), "utf8");
ok("blog index uses organizeBlogIndex", page.includes("organizeBlogIndex"));
ok("featured class present", page.includes("blogcard--featured"));
ok("reuses readTimeForArticle", page.includes("readTimeForArticle"));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
