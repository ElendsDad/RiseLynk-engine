// Gate: allowlisted privacy-first video embed (lib/video-embed.mjs + section + CSP frameSrc).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { resolveVideoEmbed } = await import("file://" + join(ROOT, "lib", "video-embed.mjs"));

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

console.log("# resolveVideoEmbed");

ok("null on missing video", resolveVideoEmbed(undefined) === null);
ok("null on missing title", resolveVideoEmbed({ src: "dQw4w9WgXcQ" }) === null);
ok("null on empty title", resolveVideoEmbed({ src: "dQw4w9WgXcQ", title: "  " }) === null);
ok("null on unknown host", resolveVideoEmbed({ src: "https://evil.example/watch?v=dQw4w9WgXcQ", title: "x" }) === null);

const bare = resolveVideoEmbed({ src: "dQw4w9WgXcQ", title: "Demo" });
ok("bare youtube id resolves", bare && bare.provider === "youtube");
ok("youtube uses nocookie host", bare && bare.embedUrl.startsWith("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"));
ok("youtube frameOrigin is nocookie", bare && bare.frameOrigin === "https://www.youtube-nocookie.com");
ok("no autoplay in youtube url", bare && !/autoplay=1/.test(bare.embedUrl));

const watch = resolveVideoEmbed({
  src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "Demo",
});
ok("watch URL rewrites to nocookie", watch && watch.embedUrl.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"));

const short = resolveVideoEmbed({ src: "https://youtu.be/dQw4w9WgXcQ", title: "Demo" });
ok("youtu.be rewrites to nocookie", short && short.provider === "youtube");

const already = resolveVideoEmbed({
  src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  title: "Demo",
});
ok("nocookie embed URL accepted", already && already.provider === "youtube");

const vimeo = resolveVideoEmbed({ src: "https://vimeo.com/123456789", title: "Clip" });
ok("vimeo URL resolves", vimeo && vimeo.provider === "vimeo");
ok("vimeo uses player host", vimeo && vimeo.embedUrl.startsWith("https://player.vimeo.com/video/123456789"));
ok("vimeo sets dnt", vimeo && /dnt=1/.test(vimeo.embedUrl));

ok(
  "provider youtube rejects vimeo-looking id that is not yt",
  resolveVideoEmbed({ src: "123456789", title: "x", provider: "youtube" }) === null,
);

console.log("\n# schema + renderer + CSP wiring surface");
const schema = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
ok("SectionType includes videoEmbed", /\|\s*"videoEmbed"/.test(schema));
ok("VideoEmbedConfig interface present", schema.includes("export interface VideoEmbedConfig"));
ok("security.frameSrc field present", schema.includes("frameSrc?: string[]"));

const renderer = readFileSync(join(ROOT, "components", "SectionRenderer.tsx"), "utf8");
ok("SectionRenderer maps videoEmbed", renderer.includes("videoEmbed: VideoEmbed"));

const cmp = readFileSync(join(ROOT, "components", "sections", "VideoEmbed.tsx"), "utf8");
ok("loading=lazy", cmp.includes('loading="lazy"'));
ok("uses resolveVideoEmbed", cmp.includes("resolveVideoEmbed"));

const nextCfg = readFileSync(join(ROOT, "next.config.ts"), "utf8");
ok("next.config wires security.frameSrc", nextCfg.includes("security?.frameSrc"));
ok("frame-src uses frameSrcResult", nextCfg.includes("frame-src ${frameSrcResult.value}") || nextCfg.includes("`frame-src ${frameSrcResult.value}`"));

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
