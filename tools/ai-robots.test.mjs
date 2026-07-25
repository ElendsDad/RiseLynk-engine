// =============================================================================
// site-engine - AI-scraping robots policy (trust pack)
//
//   node tools/ai-robots.test.mjs
//
// Proves lib/ai-robots.mjs:
//   - default / "split": block training/bulk-scrape UAs, leave citation/search UAs
//     under the generic allow (so llms.txt discovery still works)
//   - "block": also disallow the citation/search UAs (opt-in, costs discoverability)
//   - draft / not-indexable path still returns the single disallow-all rule
//   - absent field is identical to "split" (safe default), never throws
// =============================================================================

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const {
  TRAINING_BOTS,
  CITATION_BOTS,
  resolveAiCrawlerPolicy,
  buildRobotsRules,
  aiMetaTags,
} = await import("file://" + resolve(here, "../lib/ai-robots.mjs"));

let passed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.log("FAIL  " + name); process.exitCode = 1; }
};
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

console.log("\n# crawler lists: known training vs citation peers");
ok("GPTBot is a training bot", TRAINING_BOTS.includes("GPTBot"));
ok("Google-Extended is a training opt-out token", TRAINING_BOTS.includes("Google-Extended"));
ok("CCBot is a training bot", TRAINING_BOTS.includes("CCBot"));
ok("Bytespider is a training bot", TRAINING_BOTS.includes("Bytespider"));
ok("ClaudeBot is a training bot", TRAINING_BOTS.includes("ClaudeBot"));
ok("Applebot-Extended is a training opt-out token", TRAINING_BOTS.includes("Applebot-Extended"));
ok("OAI-SearchBot is a citation bot", CITATION_BOTS.includes("OAI-SearchBot"));
ok("PerplexityBot is a citation bot", CITATION_BOTS.includes("PerplexityBot"));
ok("ChatGPT-User is a citation/user-fetch bot", CITATION_BOTS.includes("ChatGPT-User"));
ok("Claude-SearchBot is a citation bot", CITATION_BOTS.includes("Claude-SearchBot"));
ok("training and citation lists do not overlap", TRAINING_BOTS.every((b) => !CITATION_BOTS.includes(b)));

console.log("\n# resolveAiCrawlerPolicy");
eq("absent -> split (safe default)", resolveAiCrawlerPolicy({}), "split");
eq("explicit split", resolveAiCrawlerPolicy({ aiCrawlers: "split" }), "split");
eq("explicit block", resolveAiCrawlerPolicy({ aiCrawlers: "block" }), "block");
eq("unknown value fails closed to split", resolveAiCrawlerPolicy({ aiCrawlers: "nope" }), "split");

console.log("\n# buildRobotsRules: not-indexable (draft) ignores AI policy");
{
  const rules = buildRobotsRules({ indexable: false, policy: "split" });
  eq("draft is a single disallow-all rule", JSON.stringify(rules), JSON.stringify([{ userAgent: "*", disallow: "/" }]));
}

console.log("\n# buildRobotsRules: split default");
{
  const rules = buildRobotsRules({ indexable: true, policy: "split" });
  const star = rules[0];
  ok("first rule is the generic allow", star.userAgent === "*" && star.allow === "/" && Array.isArray(star.disallow));
  ok("generic still disallows /api/", star.disallow.includes("/api/"));
  for (const bot of TRAINING_BOTS) {
    ok(`split disallows ${bot}`, rules.some((r) => r.userAgent === bot && r.disallow === "/"));
  }
  for (const bot of CITATION_BOTS) {
    ok(`split does NOT disallow ${bot}`, !rules.some((r) => r.userAgent === bot && r.disallow === "/"));
  }
}

console.log("\n# buildRobotsRules: full block");
{
  const rules = buildRobotsRules({ indexable: true, policy: "block" });
  for (const bot of [...TRAINING_BOTS, ...CITATION_BOTS]) {
    ok(`block disallows ${bot}`, rules.some((r) => r.userAgent === bot && r.disallow === "/"));
  }
}

console.log("\n# aiMetaTags: TDM reservation belt-and-braces (conventional, not legal)");
{
  const tags = aiMetaTags({ indexable: true, policy: "split", enabled: true });
  ok("emits tdm-reservation=1 when enabled", tags.some((t) => t.name === "tdm-reservation" && t.content === "1"));
  ok("emits robots noai,noimageai when enabled", tags.some((t) => t.name === "robots" && t.content === "noai, noimageai"));
}
ok("draft emits no AI meta", aiMetaTags({ indexable: false, policy: "split", enabled: true }).length === 0);
ok("enabled:false emits none", aiMetaTags({ indexable: true, policy: "split", enabled: false }).length === 0);

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
