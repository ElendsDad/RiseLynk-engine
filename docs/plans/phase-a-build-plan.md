# Phase-A build plan: riselynk.com on site-engine

Status: FOR FOUNDER APPROVAL. Owner: integrator. Date: 2026-07-12.

> **FIDELITY GATE (founder, 2026-07-13, after reviewing the first engine preview at
> riselynk-engine.vercel.app):** the preview is operational and verified correct, but a
> visible step DOWN from the live page - the glass effects/hovers and the rich contact
> flow are missing (they are the deferred G5-G10 + glass/shadow token groups). **The
> domain does NOT move until the engine version is judged BETTER than the live site,
> not merely correct.** Cutover order is therefore: build the fidelity pack (G5-G10 +
> glassHover signature + glass/shadow tokens + modal lead form), re-enable via config,
> redeploy the same preview alias, founder re-judges side by side. The live site keeps
> serving riselynk.com throughout.

> **FIDELITY PACK DELIVERED (overnight 2026-07-13).** Waves 1-3 shipped as engine releases,
> each built GREEN + independently verified: **v0.15.0** craft+motion (glass/shadow/status
> tokens, glassHover, gradient hot-price, scrollNarrative pinned:false, aurora/magnetic/hero),
> **v0.15.1** vendored confetti, **v0.16.0** modal request-access form + multi-CTA hero +
> hero-viz slot, **v0.17.0** dusk band + feature-card treatments + nav condense/progress +
> footer legal/links + blog nav. All brand-neutral, default-off, back-compat (proven on a
> non-green demo brand). riselynk.com re-authored on v0.17.0 with everything enabled + its
> bespoke hero-viz art (held on `website/riselynk-on-engine` @ 9f0f2e5), rebuilt, and the
> preview REDEPLOYED to riselynk-engine.vercel.app. DECISION (founder 2026-07-13):
> riselynk.com rides the engine (not a bundle island). **CUTOVER COMPLETE (2026-07-13):** founder
> judged the full-fidelity preview "looks great" and authorized the flip; riselynk.com is LIVE on
> the engine - apex serving, indexable, full craft, `@graph` clean, verified via curl. Cutover
> landed on RiseLynk main (merges f4b45bb/6bd8dc7 + the https:// domain fix 083f049/84be07f;
> seo.domain=https://riselynk.com, engine.pin v0.17.0). Remaining tidy-ups (both at the
> RiseLynk-engine Git-deploy connect): RESEND_API_KEY for server-side lead delivery + apex-primary
> (www currently serves, apex 308s - flip in the same step). Known residual (cosmetic): the
> bundle's page-JS 3D hero tilt + scene micro-animations and the bento feature layout are not
> engine capabilities; the art renders flat-but-themed.

> Supersedes the SEQUENCING in `phase-a-riselynk-adoption-prep.md` (written against engine
> baseline v0.10.0 + R5-on-branch). At the v0.12.0 target R5 is shipped, G1-G4 are the remaining
> blockers, and this doc is the actionable plan of record. The prep doc's G1-G12 gap analysis stays
> the detailed reference. Forks resolved by the founder 2026-07-12: G2 = hybrid/extend, confetti = vendor.

## Goal

Rebuild the riselynk.com marketing apex **on site-engine** instead of the hand-maintained static `apps/landing/` tree. The redesign's spine is a **dual theme**: the site ships **light-first** (the new default surface) with a user toggle to **dark**, and the **dark theme IS the R5 machine-room craft** dialed to the design bundle's exact dark tokens. Everything else the bundle changed (SoftwareApplication SEO, a SaaS pricing page, the killed newsletter, the confetti CDN tag) rides in on the same cutover.

This document consolidates the Phase-A convergence run: two theming specs (G1 toggle, G2 palette) plus their adversarial critique, the staged G3/G4 product build plus its adversarial verdict, the zero-network dependency scan, the cutover inventory, the Kitsap rollout check, and the copy audit. It carries every worker's flagged risk forward; it invents no result a worker did not report.

Design source of truth: `RiseLynk/design-bundle/design_session_2026-7-12/docs/design.config.json` (settled tokens). Where the bundle HTML and the config diverge, the shipped HTML wins.

## Status of the Phase-A units

| Unit | What it is | State | Verify verdict |
|---|---|---|---|
| **G1 - theme toggle** | `data-theme` palette mechanism, pre-paint boot script, 44px nav moon/sun toggle, `<meta theme-color>` swap, `one-light` rescope to dark | **SPEC'D - revision required before build** | Critique: NEEDS REVISION (targeted). Architecture approved; 2 P0 cascade blockers + P1/P2 fixes must land in the spec before a builder starts. |
| **G2 - per-theme palette (the fork)** | `theme.palette.{light,dark}` explicit block used verbatim, two-color derivation as the fallback, server-rendered token sheet + alias bridge, byte-match dark reconciliation | **SPEC'D - revision required; founder fork = HYBRID/extend** | Critique: architecture + hybrid fork sound; same P0/P1 fixes (inline-style collision, `--line` self-alias, `<style>` hoisting model, derived-AA clamp, system/no-JS reconcile). |
| **G3 - `software` archetype** | `software` archetype + `softwareApplicationLd(site)` emitting a schema.org SoftwareApplication `@graph` node, claims-walled | **BUILT - staged/held** | GREEN. 8 gates PASS (build, hydrate, contact, blog, seo, trust, 2x hydrated builds). Adversarial: PASS_WITH_NOTES (one non-defect nit on `offerCount`). |
| **G4 - pricing section** | `pricing` SectionType + `PricingTier` + display-only `Pricing.tsx` + shared `offer-ld.mjs` Offer/AggregateOffer builders, claims-walled | **BUILT - staged/held** | GREEN (same gate battery; seo tests extended +~40 assertions). Adversarial: PASS_WITH_NOTES. |
| **Deps / confetti** | Zero-third-party-network contract vs bundle's canvas-confetti 1.9.3 jsdelivr `<script>` | **SCANNED - fork = VENDOR** | Exactly one true violation found. Vendor/self-host (~15-30 min). All named effects (aurora/glass/magnetic/grain) are already self-contained. |
| **Copy fixes** | No-go and voice audit of the bundle's three product pages + spec strings | **AUDITED - fixes queued** | One true no-go (exclamation A-1, dies with the newsletter), one precision fix (B-2), two continuity reconciliations (C), one entity bug (D). No dashes, no stray gradient text, no emoji/stock copy. |

G3 and G4 are committed on branch `agent/phase-a-product` (commit `48c33209`), additive, **HELD for founder push approval** per integrator-owns-push. No version bump, no tag, never pushed.

## Build sequence (dependency order)

1. **Revise the G1 + G2 spec first (no code).** Fold the critique's blockers into the spec so the builder inherits a correct design. Required edits, all "make it render," none change the architecture:
   - **(P0) Make the `<html>` inline `themeVars` conditional on `!theme.enabled`.** An inline custom-property on `<html>` beats the non-`!important` generated dark sheet, so the alias bridge (`--color-bg/-text/-primary/-accent`) would stay pinned to light and dark would render half-applied. For theme-enabled sites the token sheet must own those aliases; drop them from the inline spread.
   - **(P0) Fix the `--line` self-alias.** The rich token `--line` and the engine alias `--line` collide; `--line:var(--line)` is an invalid self-reference that kills every border. Namespace the rich tokens (e.g. `--rl-line`) or emit `--line` directly and drop it from the alias bridge. Audit every rich-token name against existing engine aliases (`--grain-opacity` has the same inline-vs-palette collision - resolve it the same way).
   - **(P1) Correct the `<style>` placement model.** React 19 does **not** hoist a plain `<style>` into `<head>` without `precedence`; pin it as first-child-of-body, before the boot script, no `precedence` (adding `precedence` to "fix" the hoist can reintroduce FOUC).
   - **(P1) Add a WCAG-AA clamp to `deriveTokens()`.** The derived (zero-config) dark path has no contrast guarantee for an arbitrary Kitsap hue; clamp lightness to a min ratio or fail the build, and label derived dark as approximate.
   - **(P2) Reconcile `system` default with the no-JS fallback.** A `default:"system"` site must emit **no** SSR `data-theme` so `:root:not([data-theme])` and the media query can fire; today the spec always emits an attribute, making that fallback dead code.
   - **(P2) Resolve `--hero-glow` vs `--key-x/--key-y`** (byte-exact full radial string vs interpolated position - pick one; for byte-match, mark `--key-x/y` inert in dark), and **enumerate the `--color-accent` -> `--eyebrow` blast radius** (focus ring, `.btn--accent`, `.callbar`, `.quote`, `.summary`, hero overlay) with a 3:1 focus-outline contrast check on dark surfaces.
   - Default `metaColor` to the contract values (`#fafaf7` light / `#0f1412` dark), not `#ffffff`.
2. **Build G2 (palette) with, or just ahead of, G1 (toggle) - one additive minor release.** They are co-dependent: G1's `data-theme` has nothing to switch between until G2 supplies the second palette, and G2's dark reconciliation depends on G1 rescoping `one-light` from unconditional-`!important` to `[data-theme="dark"]`. Ship the `[data-craft~="one-light"]:not([data-theme])` back-compat rule as a **release gate** so pre-fork craft demos (elevator-demo, ARK) still render dark; pin both the back-compat CSS and `deriveTokens` against a token-parity test so they cannot drift. This is the v0.7 reserved slot. Prove it on a Kitsap surface first (harvest-first discipline) before riselynk.com depends on it.
3. **G3 (archetype) + G4 (pricing) are already built and staged** - they gate only on founder push approval, not on more building. They are archetype-gated and additive (elevator-demo `@graph` byte-identical). Release them in the same or an adjacent minor.
4. **Confetti + newsletter + copy cleanups** (removals/vendoring, small) - fold into the cutover config authoring; none block the engine releases.
5. **Author `riselynk.com/site.config.ts` + assets** against the released engine, preview on a `*.vercel.app` (auto-noindex), re-measure Lighthouse 99 / CLS 0 against the bundle, then cut over (checklist below).

## The two founder forks (both RESOLVED 2026-07-12)

### Fork 1 - G2: explicit per-theme palette vs pure two-color derivation -> HYBRID (approved: "extend")

**Accept an additive `theme.palette.{light,dark}` block used verbatim when present, derive from the two brand colors when absent.** This is the v0.7 lock widened from two colors to the full ~20-token set. RiseLynk supplies the exact bundle tokens (byte-match is a hard acceptance criterion and impossible under derivation - the AA margins were hand-tuned); Kitsap brochure sites keep the zero-config "change two colors and the site reskins" default. Both promises kept, additive, no forced migration. Caveat carried forward: the derived fallback needs the AA clamp (build step 1) before it can be called production dark mode.

### Fork 2 - confetti: vendor vs drop vs config-gate -> VENDOR (approved)

**Vendor / self-host the ~7 KB MIT `canvas-confetti@1.9.3`** as a first-party engine asset (`/vendor/canvas-confetti-1.9.3.min.js`), swap the one `src`, and ship the upstream MIT LICENSE text for the license sniffer. The existing guards are already correct (feature-detected `window.confetti`, reduced-motion gated, offline-graceful by construction). Also update `design.config.json` `dependencies[0].cdn` and the `motion.signatures.confetti` note ("jsdelivr" -> "self-hosted").

## Cutover checklist (from the migration inventory)

- **Trailing slashes.** Every live/indexed URL ends in `/` (`/pricing/`, `/contact/`, `/resources/`, `/blog/` + 3 articles, `/pitch/`, plus `/privacy/`, `/portal-privacy/`, `/cookies/`). Next.js App Router defaults to no trailing slash - set `trailingSlash: true` or add 301s, or inbound links, `sitemap.xml`, and `@graph` canonicals break.
- **Preserve `/pitch/`.** A live, indexed URL (sitemap priority 0.6) the engine will not build. Ship the 11 JPGs + `RiseLynk-pitch-deck.pdf` under the engine's `public/pitch/`, or redirect - else it 404s post-cutover.
- **Host separation gate (NOT built).** The engine adds `/api/*` serverless routes + an `@supabase/ssr` cookie surface where the apex is currently static HTML. The CI gate that provably keeps that cookie surface off `*.riselynk.com` (shared with app/control/tenant) must exist and fail on a deliberate violation before cutover.
- **Rewire contact intake.** Bundle posts client-side to the Supabase Edge Function `contact-submit`; the engine uses `/api/contact` (save-first, Resend). Set cutover env: `CONTACT_TO`, `CONTACT_FROM`, saver creds (or point `/api/contact` at the existing `contact-submit`). Confirm where leads land.
- **DNS / domain move.** Spin up a new Vercel project for the engine build bound to `riselynk.com` by exact host, then move the `riselynk.com` domain from `riselynk-website` to it in the dashboard (no registrar change if same Vercel account). Rollback = reassign the domain back; `riselynk-website` stays deployed and reversible until sign-off.
- **Vercel deploy quota.** The repo already runs 4 auto-deploying projects and busts the Free 100/day cap on heavy days; a 5th (engine) project raises per-push cost. Enable "skip deployments when no changes to root directory" on subfolder-rooted projects, or move to Pro.
- **Newsletter removal.** The live apex has NO newsletter - it exists only in the redesign bundle and is simply not ported (killed). Do not carry: `website/newsletter/confirm` + `unsubscribe` pages, the `#newsletter` homepage section (`index.html:795-810` markup + CSS + reveal + submit JS), or `NEWSLETTER_ENDPOINT`. The `newsletter-list` Edge Function + list table live in the marketing/control-plane Supabase project and are decommissioned separately, outside the website cutover. **Coordination:** an active `retire-newsletter` worktree/branch is already handling the backend side - one-writer-per-repo, coordinate through committed files, do not double-work.
- **Copy fixes at config-authoring time.** A-1 exclamation (`You're already subscribed, thanks!`) disappears with the killed newsletter - confirm it does not resurface in engine strings. Apply B-2 precision fix (`real sample data` -> `live sample data`, resources page). Reconcile C-4 doc drift (`website-spec.md` hero kicker `Connected elevator maintenance` vs shipped `Elevator service platform` + mismatched proof-chips) so the port does not reintroduce the old kicker. Fix D-5 `&checkmark;` -> `&check;`. All ported copy finishes through the `copy-editor` subagent.
- **Preview-first is safe.** A domain-less engine build auto-noindexes (`lib/seo.ts isIndexable`), so a `*.vercel.app` preview never lands in search. Re-measure Lighthouse 99 / CLS 0 against the bundle before promoting.

## Kitsap rollout note (the flywheel payoff)

The R1-R5 harvest reaches the Kitsap sites as a **pinned-tag bump only, zero forks, no code edits.** The whole v0.6.0 -> v0.12.0 schema delta is `+153/-14` in `config-schema.ts`, every added field optional; a config omitting the new sections builds byte-for-byte unchanged. Per site: bump `engine.pin` to `v0.12.0`, `node tools/engine-build.mjs <slug>` (green), preview, promote on founder go. The harborview demo should turn on the **trust strip + call bar via config** (research's #1 lead-gen moves, both pure config; `business.phone` already present) to realize the payoff - `DEMO-*` placeholders are fine on the fictional demo, real provable facts only on real clients. One behavior note (does not hit the current fleet, none enable `callBar` today): the v0.12.0 `callBar`/`trustBar` default copy went brand-neutral. Whether the G1/G2 theme release later flows to Kitsap dark mode is a separate, additive step. (A fresh-budget session is building the Kitsap templates + v0.12.0 bump in parallel; coordinate through committed branches.)

## Open questions for the founder

1. **Fork 1 - G2 palette:** approve the hybrid (explicit-verbatim for RiseLynk, derive-default for Kitsap)? RESOLVED = yes (extend).
2. **Fork 2 - confetti:** approve vendor/self-host? RESOLVED = yes (vendor).
3. **Push approval for the staged G3/G4 branch** `agent/phase-a-product` (`48c33209`) - committed and held; integrator pushes on your go.
4. **RiseLynk one-color brand:** confirm repurposing `--color-accent` to the `--eyebrow` contrast token (green, not a second hue). This recolors focus ring, `.btn--accent`, `.callbar`, `.quote`, `.summary`, hero overlay - bigger than "one eyebrow." A true second accent later is a token add, not a schema change.
5. **Dusk band:** `design.config.json themes.dusk` (the closing CTA + footer band that stays dark in both themes) is unaddressed in the specs. Explicitly defer to post-cutover, or scope into Phase-A? (Recommend defer.)
6. **Zero-third-party contract wording:** the only remaining cross-origin calls are the site's own Supabase `contact-submit` POSTs on submit. Ratify "first-party backend endpoints are an allowed exception," or require fronting them behind a same-origin `riselynk.com/api/*` route for literal zero cross-origin?
7. **Vercel plan:** stay on Free with skip-unaffected toggles, or move to Pro before adding the 5th auto-deploying project?
8. **Post-cutover polish (G5-G10):** bespoke hero-viz SVG, 3-CTA hero, animated feature minis, scroll progress bar, motion pack - confirm these stay out of Phase-A (graceful downgrade; site works without them).
