// =============================================================================
// THE ACTIVE-SITE SEAM (repointed for the riselynk.com snapshot).
//
// Engine code only ever imports `site` from here (@/site.config); this one line
// selects which site config is live. In this snapshot repo it points at the
// riselynk.com config overlaid at dist/site/riselynk/site.config.ts, so a plain
// `next build` (the default Vercel build) renders riselynk.com with no extra env.
//
// This is the ONLY engine source file changed from the pristine site-engine
// v0.17.0 tree (alongside README.md and .gitignore, which are repo scaffolding).
// The SITE_CONFIG_PATH override in next.config.mjs still works and is unused here.
//
// To re-snapshot onto a newer engine tag, see README.md: replace the engine
// files from the new tag, re-overlay the riselynk config, and keep this one line.
// =============================================================================

export { site } from "@/dist/site/riselynk/site.config";
