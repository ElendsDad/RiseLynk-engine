// Gate: blog read-time estimate (lib/read-time.mjs).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { articleWordCount, readTimeForArticle, WORDS_PER_MINUTE } from "../lib/read-time.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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
function eq(name, a, b) {
  ok(name, a === b);
}

console.log("# read-time");

eq("empty article -> 0 words", articleWordCount({}), 0);
eq("null-safe", articleWordCount(null), 0);
eq("no banner when empty", readTimeForArticle({ title: "x", description: "y" }), null);

const short = { body: "one two three four five" };
eq("five words counted", articleWordCount(short), 5);
eq("short article floors to 1 min", readTimeForArticle(short).minutes, 1);
eq("short label", readTimeForArticle(short).label, "1 min read");

// ~440 words -> 2 minutes at 220 wpm
const words = Array.from({ length: 440 }, (_, i) => "w" + i).join(" ");
const mid = readTimeForArticle({ body: words });
eq("440 words -> 2 min", mid.minutes, 2);
eq("plural label", mid.label, "2 min read");

const md = {
  lede: "Hello world",
  body: "See [this link](https://example.com) and `code` plus ## Heading",
  summary: { intro: "Intro here", points: ["Point one", "Point two"] },
  faqs: [{ q: "Why?", a: "Because reasons exist." }],
};
ok("strips markdown link syntax to label text", articleWordCount(md) >= 12);
ok("description is NOT counted", articleWordCount({ description: "a b c d e", body: "only" }) === 1);

eq("default WPM constant", WORDS_PER_MINUTE, 220);

// CSS banner surface exists for the blog card.
const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
ok("blogcard read-time banner class present", css.includes(".blogcard__readtime"));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
