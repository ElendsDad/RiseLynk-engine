# site-engine roadmap and status of record

The single source of truth for engine status: what is shipped, what is planned, and
the discipline that governs releases. Honest by rule: shipped is shipped, backlog is
backlog. Every entry traces to the repo (a tag, `README.md`, `CLAUDE.md`, `package.json`,
or `.gitignore`) or to the consumer feedback doc named under Backlog. Invent nothing.

- Current tag: **v0.20.0**, **released 2026-07-14** (HSTS baseline header + the hero
  ghost-CTA light-mode contrast fix), live estate-wide 2026-07-15 (apex, ARK, harborview
  demo - consumers pinned and verified). On top of v0.19.0 (Wave-2 pack) and v0.18.1
  (sec-hardening complete: FIX 2 shared atomic rate limiter, FIX 6 hydration /
  build-boundary hardening + baseline CSP, over v0.18.0's JSON-LD escape, autoresponder
  gate, markdown XSS, nosniff, Turnstile fail-closed + XOR guard). Every push
  founder-authorized, one CHANGELOG section per tag.
- **v0.21.0 staged, not yet tagged** (2026-07-18, branch `claude/engine-polish`): baseline
  hover/glow micro-interactions (button lift + glow, pricing-tier card elevation, nav
  underline sweep, link color transition, all reduced-motion-guarded) plus rendering
  `business.socials[]` (Footer icon row + Organization `sameAs`), closing the founder's
  "no hover, no glow" pricing-page feedback. All gates green (including the new
  `npm run test:social`), package.json bumped to 0.21.0, CHANGELOG entry written; the
  annotated tag itself is a founder step (this session stayed on a feature branch, never
  pushed main) - cut `git tag -a v0.21.0` after this branch merges to main.
- Last updated: 2026-07-18.
- In flight: nothing else staged or held. Phase A is engine-side COMPLETE and riselynk.com
  is LIVE on the engine at v0.17.0 (cutover done 2026-07-13); the sec-hardening pack
  (v0.18.0-v0.18.1) landed on top and is default-on hardening, not a Phase-A dependency.
  Next up: the Kitsap engine-feedback-v0.12.0 asks (items 16-36), including #36, the
  engine-baked checkout-success "Thank you!" exclamation (a real engine copy-discipline
  bug to fix), and rolling the v0.17.0+ craft to the Kitsap fleet (optional, per-site;
  the gutter-services template already shipped fleet-side on v0.17.0, see
  `maxlynk-services/docs/plans/roadmap.md`).
- Full tour: `README.md`. Working map: `CLAUDE.md`. Per-tag ledger: `../../CHANGELOG.md`.

## Recently shipped: the fidelity pack, v0.15.0 through v0.17.0 (all released 2026-07-13)

Four additive releases that closed the craft gap the founder flagged on the first riselynk.com
engine preview - the engine had to beat the live page, not merely match it. Each all-gates-green,
annotated-tagged, and pushed with founder authorization; per-tag detail lives in
`../../CHANGELOG.md`. All brand-neutral, default OFF, and back-compat (proven on a non-green demo
brand). The one-line ledger:

- **v0.15.0** - craft + motion layer (fidelity wave 1): glass/shadow/status tokens and
  `glassHover`, the gradient hot-price, `scrollNarrative` `pinned:false`, and the
  aurora/magnetic/hero motion primitives, all reduced-motion-guarded.
- **v0.15.1** - vendored confetti: the ~7 KB MIT `canvas-confetti` self-hosted as a
  first-party asset (the founder-approved fork), config-gated behind the celebrate flag.
- **v0.16.0** - fidelity wave 2: the modal request-access form + multi-CTA hero + a
  hero-viz slot (harvested, config-gated, back-compat).
- **v0.17.0** - fidelity wave 3 (chrome + polish, pack complete): the dusk band,
  feature-card treatments, nav condense + progress, footer legal/links, and blog nav.

## Recently shipped: v0.18.0 through v0.18.1 - sec-hardening pack (all released 2026-07-13)

Two additive releases closing the second-vendor security review triage
(`docs/plans/sec-hardening-v0.18.0.md`), on top of the fidelity pack. Each all-gates-green,
annotated-tagged, and pushed with founder authorization; a config opting into nothing renders
byte-identical and no public claim or marketing copy changes. Per-tag detail in
`../../CHANGELOG.md`.

- **v0.18.0** - JSON-LD shared-sink escape (FIX 1), lead-autoresponder recipient + spam gate
  (FIX 3), Turnstile fail-closed-when-configured + a config XOR guard (FIX 4), a markdown-link
  attribute-injection fix (FIX 5), and a baseline `X-Content-Type-Options: nosniff` response
  header. New gates: `npm run test:jsonld`, `npm run test:markdown`.
- **v0.18.1** - a shared atomic rate limiter, trusted-IP + tenant keyed (FIX 2: closes the
  per-isolate-Map multiplication and cross-tenant bucket collision), plus hydration /
  build-boundary hardening (FIX 6: snapshot-comment code-exec escape, fail-closed content
  sniffing on public assets, https-only portal-link binding, checkout return URLs bound to the
  configured domain, and a baseline Content-Security-Policy on every route). New gate:
  `npm run test:headers`.

## Recently shipped: v0.8.0 through v0.14.0 (all released 2026-07-12)

Seven additive releases in one day, each all-gates-green, annotated-tagged, and pushed with
founder authorization. Per-tag detail lives in `../../CHANGELOG.md`; the one-line ledger:

- **v0.8.0** - unification R1 harvest: save-first contact/lead intake
  (`lib/contact-intake.mjs`; a mail failure never loses a lead) + the informational
  cookie notice. New gate `npm run test:contact`.
- **v0.9.0** - unification R2 harvest: blog authoring governance (the blog runbook +
  `tools/blog-check.mjs` running the banned-phrase lint and claims trace over article
  bodies). New gate `npm run test:blog`.
- **v0.10.0** - feature-backlog first cut: `brand.faviconUrl` / apple-touch icon,
  claims-walled review/rating JSON-LD (`lib/rating-ld.mjs`), and the contact-form spam
  shield (honeypot + optional Turnstile, fail-open). New gate `npm run test:seo`.
- **v0.11.0** - unification R5 harvest: design-system structural craft (the `craft`
  block: one-light dark surface, grain dither, self-hosted OFL fonts; plus the
  `scrollNarrative` section with its no-JS / reduced-motion fallback). Brand-neutral,
  default OFF.
- **v0.12.0** - brand-neutral trust strip + click-to-call bar, config-driven with the
  claims wall in `lib/trust.mjs`; elevator copy moved to config. New gate
  `npm run test:trust`.
- **v0.13.0** - Phase-A product layer (G3 + G4): the `software` archetype
  (SoftwareApplication JSON-LD, never LocalBusiness) + the claims-walled `pricing`
  section with shared Offer/AggregateOffer builders (`lib/offer-ld.mjs`).
- **v0.14.0** - Phase-A theming spine (G1 + G2, the reserved v0.7 slot): light/dark
  toggle with a pre-paint boot script, the HYBRID per-theme palette (explicit tokens
  used verbatim, else derived from the two brand colors with a WCAG-AA clamp), and
  dark = the R5 craft rescoped to `data-theme`. New gate `npm run test:theme`.

Consumer proof (Kitsap, founder-confirmed 2026-07-12): 14 sites - 11 new claims-walled
trade templates plus 3 existing - all no-fork-green on v0.12.0; the two LIVE sites
(ryan-dehart ARK, kitsap-component brochure) bumped v0.6.0 to v0.12.0 and their
v0.6.0-authored configs build green on v0.12.0, proving the additive contract on real
configs.

## Recently shipped: v0.6.1 (released 2026-07-11)

A consumer-experience patch that worked the parked engine-feedback backlog. Additive on
v0.6.0, no new dependencies, no schema break (a v0.6.0 config is valid unchanged). Closed
Kitsap feedback-v0.5.0 items 3, 5, 6, and 7 plus the trailing-slash URL-identity mismatch.
Tagged and pushed to `origin/main`.

- **Auto Product JSON-LD** (feedback item 3): every product in a `products` section emits a
  `Product` node when `seo.domain` is set (priced -> `Offer`; quote-only -> no price;
  domain-less build -> none), via `productLdsForSections()` wired into the home and subpage
  routes. `productLd()` stays exported for hand use.
- **External-config entry point** (feedback item 5): `SITE_CONFIG_PATH` resolves the
  active-site seam to a config outside the engine checkout, so a consumer never rewrites the
  tracked `site.config.ts` around a build. A webpack exact-match alias in `next.config.mjs`.
- **Config-lint entry point** (feedback item 7): `tools/lint-config.mjs` (+ `npm run
  lint:config`) is the blessed, stable lint surface, re-exporting `lintConfig` from the
  hydrator so a consumer depends on a contract, not an internal.
- **Blog URL-identity fix**: `articleLd()` and `/llms.txt` now emit slashless `/blog/<slug>`,
  matching the sitemap, canonicals, and served URLs.
- **Windows deploy note** (feedback item 6): the README records the `vercel build --prebuilt`
  symlink `EPERM` on Windows and the local-`next build` workaround.

## Prior release: v0.6.0

Quote-only catalog mode and draft/domain-less noindex. Additive on v0.5.0, no new
dependencies, no schema break. An unpriced `products` item with a quote target (`ctaHref`,
or the section's `quoteHref`) renders its CTA as a link to that page instead of a Stripe
button, so a brochure business can show a real catalog now and add payments later; priced
products keep the checkout path. A draft build (`seo.draft`, or automatic when `seo.domain`
is unset) is public-but-not-indexed: `robots.txt` disallows all and every page carries
`robots: noindex, nofollow`, so a client-review deploy on a `*.vercel.app` alias stays out
of search. This closed Kitsap feedback-v0.5.0 items 10 and 13.

The v0.5.0 release added brochure Service JSON-LD nodes, per-page canonical URLs,
and the `.vercel` gitignore (feedback items 1, 2, 4); see `../../CHANGELOG.md`.

## Shipped (DONE)

The engine renders four cumulative archetypes, a full SEO/GEO machinery, and the
publish-profile hydration path, all from one codebase. Capability-level status; the
per-tag detail lives in `../../CHANGELOG.md`, the capability-to-config matrix in
`README.md`.

- **Archetypes** (cumulative section sets, a site enables only what it needs):
  Brochure (`hero`, `services`, `about`, `gallery`, `testimonials`, `contact`, `cta`
  with a Resend contact form), Lead-Gen (`leadform`, autoresponder, `booking`,
  analytics), Simple-Commerce (`products` with Stripe Checkout priced server-side,
  success/cancel), and Elevator-Contractor (`contractorServices`, `trustBar`,
  `requestService`, `portalDoor`, persistent `callBar`) added at v0.2.0.
- **The active-site seam and two-color contract.** Engine code imports only
  `@/site.config`; repointing that one re-export switches the live site. Changing the
  two brand colors reskins the whole site.
- **SEO / GEO machinery** (`lib/seo.ts`, `lib/services.ts`, `lib/llms.ts`,
  `components/JsonLd.tsx`): a JSON-LD `@graph` (Organization or LocalBusiness, WebSite,
  a Service node per configured service, BreadcrumbList, plus FAQPage, BlogPosting, and
  an exported Product builder), FAQPage parity from the `faq` array, an answer-first
  `summary` block, a claims-walled `/llms.txt`, generated `sitemap.ts` and `robots.ts`,
  and per-page metadata and canonical URLs.
- **Hosted blog** (`/blog` + `/blog/[slug]`) and the optional careers, records, and
  modernization-gallery sections (default OFF; render only when present and enabled).
- **Publish-profile hydration** (`tools/hydrate.mjs`): an approved, immutable snapshot
  (v0.3.0) or artifact bundle (v0.4.0) hydrates to `site.config.ts` behind the claims
  wall, the banned-phrase lint, and the claims trace. v0.4.0 resolves before/after
  gallery images into `public/mods/` and seeds `blog.articles[]` from a snapshot
  `articles[]` field. The hydrated config is a preview candidate, not a publish.
- **Copy discipline as an engine default.** Every scaffold string a tenant inherits is
  claims-safe: no em or en dashes; no "compliant" / "certified" / "inspection-ready" /
  "meets the standard" as affirmative claims; code wording hedged to the AHJ.
- **Hardened intake + notice layer** (v0.8.0, v0.10.0): save-first contact/lead intake,
  the informational cookie notice, the honeypot + optional Turnstile spam shield,
  favicon fields, and claims-walled review/rating JSON-LD.
- **Blog governance gate** (v0.9.0): `tools/blog-check.mjs` lints and claims-traces
  article bodies; the blog runbook (`docs/plans/blog-runbook.md`) is the documented
  authoring workflow.
- **Design-system structural craft** (v0.11.0): the `craft` block (one-light, grain,
  self-hosted OFL fonts) and the `scrollNarrative` section, brand-neutral, default OFF.
- **Trust strip + call bar** (v0.12.0): config-driven and claims-walled
  (`lib/trust.mjs`); the engine default ships zero trade claims.
- **Software archetype + pricing** (v0.13.0): SoftwareApplication JSON-LD and the
  claims-walled `pricing` section with shared Offer builders (`lib/offer-ld.mjs`).
- **Light/dark theming** (v0.14.0): the `theme` block, pre-paint boot, per-theme
  palette (explicit or derived with a WCAG-AA clamp), dark = the R5 craft rescoped.
- **Craft + motion fidelity layer** (v0.15.0, v0.15.1): glass/shadow/status tokens and
  `glassHover`, the gradient hot-price, `scrollNarrative` `pinned:false`, the
  aurora/magnetic/hero motion primitives (all reduced-motion-guarded), and vendored
  self-hosted confetti. Brand-neutral, default OFF.
- **Lead form + hero + chrome polish** (v0.16.0, v0.17.0): the modal request-access form,
  multi-CTA hero + hero-viz slot, the dusk band, feature-card treatments, nav
  condense/progress, footer legal/links, and blog nav. Config-gated, default OFF.
- **Sec-hardening pack** (v0.18.0, v0.18.1): JSON-LD shared-sink escape, lead-autoresponder
  recipient + spam gate, Turnstile fail-closed-when-configured + a config XOR guard, a
  markdown-link attribute-injection fix, `X-Content-Type-Options: nosniff` on every route
  (v0.18.0); a shared atomic rate limiter (trusted-IP + tenant keyed) and hydration /
  build-boundary hardening plus a baseline Content-Security-Policy (v0.18.1). Back-compatible,
  no public-copy change.

## Planned / backlog

Open engine asks, not yet built. Summarized from the Kitsap consumption feedback docs,
`maxlynk-services/docs/engine-feedback-v0.3.0.md`, `...-v0.5.0.md`, and the new
`...-v0.12.0.md` (that repo is read-only from here; this is the summary, do not edit it
there). Each lands as an additive engine release and rolls out at the next per-site
upgrade, per the release discipline below.

- **Kitsap engine feedback v0.12.0, items 16-36** (landed 2026-07-12 in
  `maxlynk-services/docs/engine-feedback-v0.12.0.md`). Triaged in the
  `polish/feedback-batch` pass (staged, not yet tagged/pushed): every S-sized,
  unambiguous item is built and gated; everything else is a real feature sized for its
  own dedicated additive release (the engine's own pattern: v0.10.0 for review schema,
  v0.12.0 for the trust strip, v0.19.0 for service area / stars / content gate all
  shipped as one feature per tag with its own test gate - bundling five more JSON-LD /
  claims-wall surfaces into one polish pass would skip that rigor). Per-item
  disposition:
  - **#16 service area, #17 visible review stars** - SHIPPED as v0.19.0
    (`serviceArea` section + `lib/area-ld.mjs`; `lib/stars.mjs` + `StarRating.tsx`).
    Already closed before this triage; listed for completeness.
  - **#18 captioned/before-after gallery** - DEFER. A real schema + vocabulary design
    (captions on `gallery`, a brand-neutral before/after variant distinct from the
    elevator-only `modGallery` idiom); sized as its own release.
  - **#19 per-service detail pages** - DEFER. Templating an indexable per-service page
    is a real feature (SEO payoff is the point); #25 below is the additive seam it
    needs, now shipped.
  - **#20 sitemap ignores draft state, #21 domain-less sitemap emits relative `<loc>`**
    - FIXED. `app/sitemap.ts` now returns `[]` on `isIndexable(site) === false` (the
      same guard `app/robots.ts` already used), so a not-indexable build emits an empty,
      spec-valid sitemap instead of a domain-relative one; closes both items at once
      (verified: a `seo.draft: true` build renders `<urlset></urlset>`, no `<url>`
      entries).
  - **#22 `canonicalUrl()` comment overstates the served trailing slash** - FIXED (docs
    only). The function still returns `base + "/"` for the root; the comment now says so
    correctly and explains Next's metadata resolver strips it at render, matching every
    served canonical and `app/sitemap.ts`'s home entry.
  - **#23 claims lint collides with proper-noun credentials** ("ISA Certified
    Arborist") - DEFER. A real, security-adjacent policy change (an exemption
    mechanism for the compliance regex needs its own design and its own tests, not a
    quick carve-out); a client-visible copy-discipline change besides.
  - **#24 leadform field set: property address** - FIXED (the piece the feedback itself
    called "trivially additive"). `Section.fields` gained `"building"`, reusing the
    SAME canonical field `RequestService.tsx` and `lib/contact-intake.mjs` already
    validate, label, and email - zero intake changes, just a leadform opt-in. The
    photo/attachment seam and the generic custom-field seam stay deferred (real design
    work).
  - **#25 brochure `services` items have no `href`** - FIXED. `FeatureItem.href`
    renders the same "Learn more" link `ServiceLine.href` already does (`.svc-card__link`
    reused verbatim); the natural additive seam for #19.
  - **#26 sitewide announcement/notice bar** - DEFER. A new claims-walled,
    time-bounded, dismissible surface; sized as its own release.
  - **#27 structured hours (`openingHoursSpecification`)** - DEFER. A real JSON-LD
    surface (days/opens/closes + an emergency flag) touching `lib/seo.ts`; sized as its
    own release.
  - **#28 rating/review provenance fields** (`source`/`profileUrl`/`url`) - DEFER.
    Plausibly small, but it is a claims-wall surface (provenance is exactly what the
    wall exists to strengthen) and deserves its own gate, not a quick field add.
  - **#29 LocalBusiness subtype control** (`business.schemaType` allowlist) - DEFER.
    Touches the `@graph` node builder directly; an allowlist mistake ships wrong
    structured data silently, so it gets its own test pass rather than riding this batch.
  - **#30 honest price-framing surfaces** (`priceRange`/`paymentAccepted`, `priceNote`,
    a typed fee disclosure) - DEFER. Explicitly three separate shapes in the feedback
    itself; not one small change.
  - **#31 recurring billing for maintenance plans** - DEFER. The feedback's own text:
    "sized as its own release" (a Stripe subscription-mode change).
  - **#32 claims-walled financing/incentives surface** - DEFER. A new claims-wall
    surface (financing/rebate copy is exactly the kind of unattributed-savings-claim
    risk the wall exists to prevent); needs its own design.
  - **#33 street address for storefront trades** (`streetAddress` on
    `business.location`) - DEFER. Plausibly small, but it feeds the LocalBusiness
    `PostalAddress` JSON-LD directly; grouped with #29 for one dedicated schema pass
    rather than two ad hoc field adds in one polish batch.
  - **#34 hero second CTA** (`ctaLabel2`/`ctaHref2`) - DEFER. A client-visible above-
    the-fold layout and copy change (two CTAs competing for attention); the kind of
    call the founder makes, not a quiet default-off field add.
  - **#35 article image field** - DEFER. Threads through `Article`, `articleLd()`
    (BlogPosting `image`), and per-article OG image; grouped with the other JSON-LD
    surfaces above for one dedicated pass.
  - **#36 checkout-success "Thank you!" exclamation** - FIXED. The literal copy is
    "Thank you." now; the banned-phrase lint gained an exclamation-mark rule
    (`tools/hydrate.mjs`, so `npm run test:blog` inherits it too), and a NEW gate,
    `npm run test:scaffold-copy` (`tools/scaffold-copy.mjs`), closes the actual
    coverage gap: every prior lint only ever reached strings that flow through a
    config object, and this page's copy is hardcoded engine-side, never a config
    string. The new gate scans `app/` + `components/` JSX text/attribute copy with the
    same `lintString` the config and blog gates run, so this exact regression class
    cannot recur silently.

- **Phase A (riselynk.com adoption)** - DONE (2026-07-13). Engine side complete (G1-G4 in
  v0.13.0/v0.14.0); the fidelity pack (v0.15.0 through v0.17.0) closed the craft gap the
  adoption gate measured. riselynk.com is now LIVE on the engine at v0.17.0 (cutover done
  2026-07-13); a self-contained RiseLynk-engine deploy repo (a v0.17.0 snapshot + the
  riselynk config) carries the live build for a Git-connected Vercel deploy. Plan of
  record: `docs/plans/phase-a-build-plan.md`.

- **Roll the fidelity-pack craft to the Kitsap fleet** (optional, per-site). v0.15.0
  through v0.17.0 are additive and default OFF; a Kitsap site opts into the
  glass/motion/chrome layer at its next pinned-tag bump (`engine.pin` to `v0.17.0`,
  rebuild, preview, promote on founder go). No fleet-wide forced upgrade.

- **Unification program R1 (contact-intake hardening + cookie notice)** - SHIPPED as v0.8.0
  (released 2026-07-12); see the release ledger above. Plan of record:
  `docs/plans/riselynk-engine-unification.md` section 2.5.

- **Unification program R2 (blog authoring governance)** - SHIPPED as v0.9.0 (released
  2026-07-12); see the release ledger above. Plan of record:
  `docs/plans/riselynk-engine-unification.md` section 2.6. The managed article-rail
  producer stays out of scope (tracked separately below).

- **Unification program R5 (design-system structural craft)** - SHIPPED as v0.11.0
  (released 2026-07-12); see the release ledger above. Plan of record:
  `docs/plans/riselynk-engine-unification.md` section 2.9. It closed the craft gap the
  Phase A adoption gate measures.

- **Light / dark / system theme toggle** (the reserved v0.7 slot) - SHIPPED as v0.14.0
  (released 2026-07-12); see the release ledger above. The founder-approved HYBRID
  palette superseded the 2026-07-11 derive-only design: an explicit
  `theme.palette.{light,dark}` block is used verbatim when supplied, else tokens derive
  from the two brand colors with a WCAG-AA clamp; dark is the R5 machine-room craft
  rescoped to `data-theme`. Known follow-up (CHANGELOG v0.14.0): on a stored-dark reload
  the browser-chrome `theme-color` corrects post-paint; a later patch moves it into the
  pre-paint boot script.
- **Eyebrow contrast token** (feedback-v0.5.0 item 11) - FIXED in the `polish/feedback-batch`
  pass (staged, not yet tagged/pushed). `--color-accent` filled CTA buttons (needs light) AND
  colored `.eyebrow` text on the page bg (needs dark); no single value passed AA for both. A
  separate `--color-eyebrow` token now derives from the same accent via the derived-dark
  theme path's existing WCAG-AA clamp (`eyebrowColorFor()`, `lib/theme-tokens.mjs`), wired for
  both the base (non-themed) path (`lib/theme.ts`) and the theme-enabled derive/alias-bridge
  path; `--color-accent` itself is untouched, so the CTA fill is unaffected. The hero keeps the
  raw accent (it sits on the dark `--color-primary` fill, a different contrast context, matching
  every other on-hero accent use). Verified with real contrast-ratio math against the engine's
  default demo colors: eyebrow-on-white went from 2.19:1 (the raw `#e8a13a` accent, fails AA) to
  5.77:1 (the clamped `#865e22`, passes); proven across four example brand palettes in
  `tools/theme-tokens.test.mjs`.
- **Built-in icon set for `services` items** (feedback-v0.5.0 item 12, minor/cosmetic) - FIXED
  in the `polish/feedback-batch` pass. `FeatureItem.iconName` (additive, default OFF) renders a
  small brand-neutral inline SVG from the new `lib/icons.mjs` set (wrench, shield, clock, phone,
  mapPin, check, calendar, truck) via `components/Icon.tsx`, in place of the literal `icon` glyph
  string; an unknown name renders nothing (fail-safe). `icon` is untouched and still renders
  verbatim when `iconName` is absent. The `site-demo` and `craft-demo` examples now use it in
  place of their placeholder `"*"` glyphs (the exact case the feedback described); `software-demo`
  and `theme-demo`'s SaaS-feature cards were left alone since the trade-oriented icon set does not
  fit a software product.

- **Managed article-rail producer.** v0.4.0 wired the snapshot `articles[]` field and
  its mapping to `blog.articles[]`, but the rail that produces those entries is out of
  scope; the blog seeds the day the rail lands with no schema churn. (README hydration
  section; engine feedback context)

- **Engine-wide href scheme guard.** `FeatureItem.href` (item #25) and roughly nine other
  trusted-config href sinks (`ServiceLine.href`, `TrustItem.href`, `HeroCta.ctaHref`,
  `nav`/`footer.links[]`, `products` CTA targets, and so on) render the config value raw.
  This is consistent with the trust model today (these are hand-authored or
  hydrator-emitted config, not attacker-reachable input, and the hydrator already sanitizes
  `wiring.portalUrl`), so it is deferred by design, not a live vulnerability. A future pass
  should apply the `sanitizeGateAssetHref` discipline (https-only or a same-origin path)
  engine-wide, ideally as one shared helper every href sink funnels through, so the whole
  class is closed at once rather than sink by sink.

Feedback items 3, 5, 6, and 7 shipped in the v0.6.1 release above (Product LD
auto-injection, the `SITE_CONFIG_PATH` external-config hook, the Windows `--prebuilt` note,
and the blessed `tools/lint-config.mjs` surface). Items 8 and 9 are consumer-side runbook
observations, not engine changes, and are tracked in the consumer repo, not here.

## Release discipline (the versioning contract)

- **Sites pin a tag.** A live site records the engine tag it was built against; its build
  is reproducible from that tag plus its config and assets.
- **Releases are additive.** Archetypes and sections accumulate; a config valid at an
  older tag stays valid at a newer one. A breaking change is a major version bump plus a
  migration note.
- **Upgrades roll per-site, with a preview.** A site moves forward one at a time: rebuild
  its config against the new tag, produce a preview build, and promote only after review.
  No fleet-wide forced upgrade; a new engine version does not touch a live site until that
  site is rolled forward.
- Docs-only changes ride `main` untagged; sites pin tags, so consumers see only releases.

## Release gates (all green before a tag)

- `npm run build` (the active demo builds clean).
- `npm run test:hydrate` (claims trace, banned-phrase lint, asset and article seams).
- `npm run test:contact` (the save-first contact/lead intake harness, R1).
- `npm run test:blog` (the blog governance check, R2: banned-phrase lint + claims trace over
  article bodies, failing on a banned phrase or an unattested claim).
- `npm run test:seo` (the review/rating + SoftwareApplication/Offer JSON-LD builders and
  their claims walls).
- `npm run test:trust` (the trust strip / call bar claims wall and the `tel:` sanitizer).
- `npm run test:theme` (theme token parity, back-compat, and the sheet invariants).
- `npm run test:jsonld` (the JSON-LD shared-sink escape, v0.18.0).
- `npm run test:markdown` (the blog markdown-link attribute-injection fix, v0.18.0).
- `npm run test:headers` (CSP + nosniff response-header gate, v0.18.1).
- `npm run build:hydrated` and `npm run build:hydrated:bundle` (both hydrated fixture
  configs build end to end).
- A rendered-output proof on both demos: swap the seam, build, and inspect the rendered
  pages, the `@graph`, and `/llms.txt`.

A release is all gates green, an annotated tag, and an authorized push (the founder
authorizes every push).
