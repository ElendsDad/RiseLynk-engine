# Changelog

Engine changes by tag. Sites pin a tag, so this is the ledger a consumer consults before
rolling a site forward (see the versioning contract in `docs/plans/roadmap.md`). Releases
are additive: a config valid at an older tag stays valid at a newer one. Each entry traces
to that tag's annotated message, `README.md`, and the repo.

## v0.17.0 - 2026-07-13 - chrome + polish: dusk band, feature-card treatments, nav condense, footer

Fidelity-pack wave 3 (final wave): the remaining bundle chrome, harvested as brand-neutral,
back-compatible, default-off engine capabilities. Additive - a config opting into nothing renders
byte-identical. This completes the fidelity pack (waves 1-3, v0.15.0 through v0.17.0).

- **Dusk closing band** (`section.dusk` + `footer.dusk`): a dark-in-BOTH-themes surface derived
  from the two brand colors (the one-light token remap scoped to `.dusk`, no green literal) for a
  closing CTA + footer.
- **Feature-card treatments** (`FeatureItem.badge` / `flagship` / `viz`): an optional SOON-style
  badge, a flagship variant (accent edge + full-row span), and a site-supplied mini-visual slot
  with a reduced-motion-safe reveal; plain cards render byte-identical.
- **Nav condense + scroll progress** (`nav.condense` / `nav.progress`): the header condenses on
  scroll (passive listener; no-JS keeps full height) and an optional top scroll-progress hairline
  (pure CSS `animation-timeline: scroll(root)`, hidden under reduced motion).
- **Footer legal line + links** (`footer.legalName` / `footer.links[]`): the legal-entity line +
  utility links; the existing footer is unchanged when absent.
- **Blog nav link** (`nav.blogLabel`): `/blog` in the header, rendered only when the blog actually
  publishes an article (never a dead link).

## v0.16.0 - 2026-07-13 - modal request-access form + multi-CTA hero

Fidelity-pack wave 2: the design bundle's modal lead form and richer hero, harvested as
brand-neutral, back-compatible engine capabilities. Additive - existing single-CTA heroes and
the inline leadform render byte-identical.

- **Modal request-access form** (`leadform.modal` + declarative `formFields`): a
  progressive-enhancement modal. SSR renders the same form INLINE (`method=post`,
  `action=/api/lead`) so a lead submits with JS OFF; on hydration it becomes a focus-trapped
  dialog (focus trap, Escape, focus return to trigger, scroll lock, aria-modal/labelledby).
  Rich declarative fields (text/email/tel/number/select/checkbox-group/textarea); extras fold
  into the save-first message body via `foldExtras()`; confetti on success when opted in. The
  lead is saved FIRST and never dropped (proven by test, including a no-JS native post).
- **Multi-CTA hero** (`hero.cta[]` + `proof` + `heroViz`): 1-3 CTAs, an optional mono
  proof-chip row, and a per-site raw hero-viz slot (the engine renders the slot; the site
  supplies the art). Back-compat: the single `ctaLabel`/`ctaHref` still renders unchanged.
- **`/api/lead`** also accepts native form-encoded posts (Post/Redirect/Get to
  `/success?lead=1`) for the no-JS path; the JSON path is unchanged. `/success` became a
  dynamic route to read that flag; payment-success copy is unchanged when the flag is absent.
- **New coverage:** `test:contact` 79 (modal fold + no-JS save cases).

## v0.15.1 - 2026-07-13 - vendored confetti (self-hosted, config-gated)

The founder-approved resolution of the confetti fork: self-host the MIT canvas-confetti as a
first-party engine asset instead of the design bundle's CDN script, preserving the engine's
zero-third-party-network contract. Additive - a config without the flag builds unchanged and
loads nothing.

- **`celebrate` flag** on the lead/contact success path: lazy-loads the vendored
  `public/vendor/canvas-confetti-1.9.3.min.js` (its MIT LICENSE shipped beside it),
  feature-detected, prefers-reduced-motion guarded, offline-graceful. No new npm dependency;
  nothing loads for a site that does not opt in. Shared, dependency-free `lib/celebrate.mjs`.
- **New gate:** `npm run test:celebrate`.

## v0.15.0 - 2026-07-13 - craft + motion layer: glass, gradient price, calm scroll, motion primitives

The first fidelity-pack release: the design bundle's craft, harvested into brand-neutral,
config-gated, reduced-motion-guarded engine capabilities. Additive - a config not opting in
builds byte-for-byte unchanged (proven on site-demo + elevator-demo); all derived from the two
brand colors + the per-theme palette (a non-green `examples/craft-demo` proves neutrality).

- **Glass / shadow / status token groups.** A per-theme palette can carry `glass`
  {fill,edge,lineTop,glow}, `shadows` {sm,md,lg}, and 4 `status` pairs, emitted as
  `--rl-glass-*` / `--rl-shadow-*` / `--rl-status-*` with brand-derived defaults, so a craft
  site gets glass free from its two colors.
- **glassHover** (`craft.glass`): translucent card + backdrop-blur(12px) saturate(1.4) + a
  pointer-tracked radial glow, fine-pointer only (degrades to a static card on coarse/no-hover).
- **Gradient hot-plan price** (`Section.gradientPrice`): a gradient-clipped price on the
  highlighted pricing tier only (the one sanctioned gradient-text exception); solid elsewhere.
- **scrollNarrative `pinned?: boolean`** (default true, back-compat): `pinned: false` renders
  the calm stacked step timeline (all scenes + video) with NO scroll pinning - a
  flow-preserving option for sites that do not want the pinned scroll.
- **Motion primitives** (`craft.aurora` / `magneticCta` / `heroMotion`): CSS aurora hero blobs,
  magnetic CTAs (<=3px toward a fine pointer), hero stagger + underline-draw - all opt-in, all
  under a master reduced-motion guard that settles them instantly, all no-JS safe.
- **New coverage:** `test:theme` extended to 109 checks (group-token derive/emission, palette
  merge, globals parity, no-brand-literal guard).

## v0.14.0 - 2026-07-12 - light/dark theming: per-theme palette + toggle

The Phase-A theming spine (the reserved v0.7 slot): a user-selectable light/dark theme with a
per-theme palette. LIGHT is the default; DARK reuses the R5 machine-room craft, retokenized to
an explicit palette. Additive and opt-in: a config with no `theme` block renders identically
(the theme sheet, boot script, and toggle emit nothing; the elevator-demo machine-room surface
is unchanged), though the disabled-path inline-style property order shifts harmlessly.

- **`theme` config block** (`theme: { enabled, default: light|dark|system, palette.{light,dark},
  metaColor? }`). The HYBRID palette: an explicit per-theme token set is used verbatim when
  supplied (byte-match), else tokens derive from the two brand colors. Rich tokens are namespaced
  `--rl-*` and bridged onto the engine aliases, so nothing collides (no `--line` self-alias).
- **The toggle + boot.** A pre-paint inline boot script sets `data-theme` from `localStorage`
  (`rl_theme`) then `prefers-color-scheme`; a 44px nav moon/sun button persists the choice and
  swaps `<meta name="theme-color">`. A server-rendered token sheet (first-child-of-body, no
  React-19 `precedence`) owns the per-theme aliases under `[data-theme]`, so dark actually flips
  and there is no FOUC.
- **Dark = R5 craft, rescoped.** The `one-light` rules move from unconditional to
  `[data-craft~="one-light"]:not([data-theme])`, so existing craft-only demos (elevator-demo)
  render their dark surface unchanged, while a themed site drives dark through `data-theme`.
- **WCAG-AA on the derived path.** `deriveTokens` clamps derived ink to a 4.5:1 minimum or fails
  the build; a `default: "system"` site emits no SSR `data-theme` so the media-query fallback fires.
- **New release gate:** `npm run test:theme` (`tools/theme-tokens.test.mjs`, 62 assertions:
  token-parity + back-compat + the P0 sheet invariants) joins the battery.
- **Known follow-up:** on a stored-dark reload the browser-chrome `theme-color` shows the light
  value until the toggle script corrects it (the page itself paints dark, no FOUC); a later patch
  will set the meta in the pre-paint boot script.

## v0.13.0 - 2026-07-12 - software-product archetype + SaaS pricing section

The Phase-A product-marketing layer: a software-product archetype so a SaaS site is an
Organization plus SoftwareApplication (never LocalBusiness), and a claims-walled pricing
section. Additive, archetype-gated, NO new dependencies, NO schema break: a v0.12.0 config
builds byte-for-byte unchanged (the elevator-demo `@graph` is byte-identical) and the
LocalBusiness / Service archetype path is untouched.

- **`software` archetype + SoftwareApplication JSON-LD.** `archetype: "software"` makes
  `lib/seo.ts` emit a schema.org `SoftwareApplication` node (name, `applicationCategory`
  default `BusinessApplication`, `operatingSystem` default `Web`, description, `provider`
  @id, `offers`) instead of the LocalBusiness path; an optional `software` config block
  tunes it. AggregateRating is emitted only from a real `business.rating` (the shared
  `lib/rating-ld.mjs` claims wall); the engine never synthesizes a star value.
- **Pricing section + claims-walled Offer builders.** A new `pricing` section type
  (`PricingTier`: name, price, period, priceValue, priceCurrency, meta, who, features[],
  ctaLabel, ctaHref, highlighted, badge) rendered by a display-only
  `components/sections/Pricing.tsx`. The shared, dependency-free `lib/offer-ld.mjs` builds
  `Offer` / `AggregateOffer` from the same tiers, so cards and structured data cannot drift.
  An unpriced ("Custom") tier emits no Offer it cannot honor; nothing is invented.
- **New coverage:** `tools/seo-jsonld.test.mjs` extended (+~40 assertions, `npm run test:seo`
  now 75 passing) over the SoftwareApplication + Offer shapes and the claims wall.

## v0.12.0 - 2026-07-12 - brand-neutral trust strip + click-to-call generalization

The local-trades research's top lead-gen surface, generalized into the engine. Additive, NO
new dependencies, NO schema break: a v0.11.0 config builds unchanged and the elevator
archetype renders identically (its trust facts and emergency call-bar copy now live in
config, not in engine code).

- **Config-driven trust strip + click-to-call bar.** The trust strip (`TrustFacts`, now with
  an open-ended `items: TrustItem[]` beside the typed shortcuts) and the click-to-call
  `CallBar` are brand-neutral and fully site-provided. A shared, dependency-free
  `lib/trust.mjs` carries the CLAIMS WALL in one place (only real, site-supplied trust facts
  and a real phone number; the engine invents nothing) plus a `tel:` sanitizer. The engine
  DEFAULT ships zero trade claims; a site opts in.
- **Accessible region name is config-driven** (`callBar.regionLabel`, neutral default
  "Call us"), so a site can name its call landmark (the elevator archetype restores
  "Emergency service line") without a fork.
- **Elevator copy moved to config.** `examples/elevator-demo` and the RiseLynk elevator
  hydrator path (`tools/hydrate.mjs`) set the entrapment-first call label + region name
  explicitly, so the engine default stays neutral while the elevator render is preserved
  verbatim.
- **New release gate:** `npm run test:trust` (`tools/trust.test.mjs`, 35 assertions) joins
  the battery. Proven by both hydrated fixtures and the both-demo render proof.

## v0.11.0 - 2026-07-12 - R5 harvest: design-system structural craft

Released 2026-07-12 (annotated tag `v0.11.0` pushed to `origin/main`). Fifth phase of the
RiseLynk / site-engine unification program (`docs/plans/riselynk-engine-unification.md`
section 2.9) and the last engine phase before riselynk.com adoption (Phase A). Additive, NO
new dependencies, NO runtime library, NO schema break: a config without the new `craft` block
or a `scrollNarrative` section builds byte-for-byte unchanged.

Harvests the STRUCTURAL craft from riselynk.com's machine-room landing (spec
`RiseLynk/docs/specs/landing-machine-room-craft.md`) as brand-neutral, config-gated engine
capabilities. STRUCTURE only: NOT RiseLynk's green palette, brand SVGs, or copy (those stay
per-site config). Every pattern defaults OFF and derives its surface from the two brand colors,
so the two-color contract stays the single source of the palette.

- **The one-light model** (`craft.oneLight`). A single overhead key-light radial plus a
  multi-stop dark gradient behind all content, switching the page onto a dark machine-room
  surface DERIVED from `brand.colors`. The surface tokens (`--color-bg/-text/--muted/--line/
  --surface`) remap in ONE place under `[data-craft~="one-light"]` (with `!important`, so the
  remap beats the per-site brand tokens themeVars writes inline on `<html>`), so every existing
  section reskins to the dark surface with no per-section work, and `--color-primary/--color-accent`
  stay exactly what the site set (the brand stays the brand). The key-light position is tunable
  (`craft.oneLight.keyX/keyY`).
- **The grain dither** (`craft.grain`). A stitched-tile `feTurbulence` layer at ~5% opacity that
  dithers the dark gradient so it does not band. Inline SVG data URI: ZERO network requests.
- **Self-hosted display + mono type** (`craft.fonts`). Barlow + IBM Plex Mono, SIL OFL 1.1 subset
  woff2 in `public/fonts/` (provenance: `public/fonts/OFL.md`), preloaded, `font-display: swap`,
  wired to `--font-display`/`--font-mono`. ZERO third-party font requests; default OFF keeps the
  engine on its (already zero-third-party) system stack, so a site that does not opt in issues no
  font request at all.
- **The scroll narrative** (a `scrollNarrative` section, `scenes: NarrativeScene[]`). A pinned
  sticky-stage track of threshold scenes driven by a passive scroll listener plus rAF (no wheel or
  touch interception, no `IntersectionObserver` needed), with a progress rail. It DEGRADES to a
  stacked, readable step timeline under no-JS, `prefers-reduced-motion`, and narrow screens; the
  `.story-js` class that gates the pinned CSS is only ever ADDED by the effect, and the caption is
  the SAME DOM node in both the animated stage and the fallback, so captions match the animated
  content verbatim by construction. Ported from riselynk.com's `#see-it` story, the exact
  zero-library approach it ships at Lighthouse 99 / CLS 0.
- **Demo:** `examples/elevator-demo` (the closest archetype to riselynk.com) turns the craft ON
  (`craft: { oneLight, grain, fonts }`) and adds a home-page `scrollNarrative`; the other demo
  (`site-demo`) sets no `craft` and is unchanged.
- **No new gate.** The existing battery (`build`, `test:hydrate`, `test:contact`, `test:blog`,
  `build:hydrated`, `:bundle`) plus the both-demo render proof covers it; the craft has no server
  logic to unit-test beyond the config-to-attribute mapping the build already exercises.

## v0.10.0 - 2026-07-12 - feature-backlog first cut: favicon, review schema, spam shield

Released 2026-07-12 (annotated tag `v0.10.0` pushed to `origin/main`). The recommended first
cut of `docs/plans/engine-feature-backlog.md` (items #1, #2, #4), built as one coherent
additive release. No new dependencies, NO breaking schema change: a config valid at the prior
tag builds unchanged (proven by both hydrated fixtures).

- **Favicon / app-icon field (backlog #1).** `brand.faviconUrl` (rel="icon") and
  `brand.appleTouchIconUrl` (rel="apple-touch-icon"), wired into the document head in
  `app/layout.tsx` (`Metadata.icons`). Emitted only when the brand supplies a mark, so a
  site without them keeps Next's default favicon. Both demos opt in via a shared
  `public/favicon.svg`.
- **Review + rating structured data (backlog #2).** New `RatingFacts` / `ReviewItem`
  types with optional `rating` + `reviews` on both `business` and `Product`. The JSON-LD
  now carries `AggregateRating` / `Review` on the Organization/LocalBusiness node
  (`lib/seo.ts` `organizationLd`) and per Product (`productLd`, auto-injected on product
  pages). The builders live in a shared, dependency-free `lib/rating-ld.mjs`
  (`withRatingLd`) that carries the CLAIMS WALL in one place: a node emits an aggregate
  ONLY when the config supplies a valid rating (a finite value plus at least one counted
  review), and Review nodes only from real review items. The engine never synthesizes a
  star value. Proven by `tools/seo-jsonld.test.mjs` (new gate `npm run test:seo`) and by
  the rendered `@graph` on both demos.
- **Contact-form spam shield (backlog #4).** An always-on honeypot (a hidden `website`
  trap) on the contact and lead forms (`Contact.tsx` / `LeadForm.tsx`), dropped
  server-side in `lib/contact-intake.mjs` BEFORE any save or notify, returning a benign
  `{ ok:true, spam:true }` so a bot learns nothing. Plus an optional, off-by-default
  Cloudflare Turnstile layer (privacy-friendly, no cookie): `security.turnstile.siteKey`
  renders the widget (`components/Turnstile.tsx`) and a server-env `TURNSTILE_SECRET`
  enforces it via `verifyTurnstile` in the `/api/contact` and `/api/lead` receivers.
  Enforcement is off unless BOTH are set, and verification fails OPEN on any inability to
  check, so R1's never-drop guarantee holds and a clean submit still saves. Builds on R1's
  hardened intake. Proof: `tools/contact-intake.test.mjs` extended with honeypot and
  Turnstile cases.
- **New release gate:** `npm run test:seo` joins the battery.
- **Out of scope (unchanged):** backlog #7 (live Google Reviews) feeds the new #2 schema
  from a real snapshot and stays a separate, dedicated release; it is now the top
  not-yet-built item.

## v0.9.0 - 2026-07-12 - R2 harvest: blog authoring governance runbook

Released 2026-07-12 (annotated tag `v0.9.0` pushed to `origin/main`). Second phase of the
RiseLynk / site-engine unification program (`docs/plans/riselynk-engine-unification.md`
section 2.6). Additive, no new dependencies, NO schema change: a v0.8.0 config builds unchanged.

- **The engine blog runbook** (`docs/plans/blog-runbook.md`). RiseLynk's "prove it on
  ourselves" blog governance, harvested as the engine's documented authoring workflow: every
  article walled to attested facts, every client-facing string finished through the
  `copy-editor` subagent, a per-article founder gate, and a researched cadence. It applies to
  every engine blog (the demos, the Kitsap client sites, and eventually riselynk.com).
- **The blog governance check** (`tools/blog-check.mjs`, gate `npm run test:blog`). The
  banned-phrase lint and a per-article claims trace now run over ARTICLE BODIES specifically
  (`title`, `description`, `eyebrow`, `lede`, `author`, `summary.*`, `body`, `faqs.*`), a
  first-class named gate rather than something that only reached article prose incidentally
  through the hydrator. A banned phrase or an unattested claim (a compliance claim, a
  guarantee, or a code requirement stated as settled fact) anywhere in an article fails the
  run; a clean, AHJ-hedged article passes. It reuses the ONE shared lint (imported through the
  blessed `tools/lint-config.mjs` surface, which re-exports `tools/hydrate.mjs`), so the blog
  gate can never drift from the scaffold gate. Drafts are scanned too (a draft is reachable at
  its direct URL, so it must be just as claims-safe). The run writes a `blog-claims-trace.json`
  (byline, date, draft status, strings scanned, wall result) as evidence per article.
- **Proof** (`tools/blog-check.test.mjs`): real elevator-demo article prose (the hydrated
  v0.4.0 bundle) passes; a seeded bad article fails on both a banned phrase and an unattested
  claim; a clean one passes; the trace shape is asserted.
- **New release gate:** `npm run test:blog` joins the battery.
- **Out of scope (unchanged):** the managed article-rail producer stays a separate backlog
  item; this phase governs how an article, however authored, clears the gate.

## v0.8.0 - R1 harvest: contact-intake hardening + cookie notice

Released 2026-07-12 (annotated tag `v0.8.0` pushed to `origin/main`). First phase of the
RiseLynk / site-engine unification program (`docs/plans/riselynk-engine-unification.md`
section 2.5). Additive, no new dependencies, no schema break, no durable schema: a config
valid at the prior tag builds unchanged. It took the next available minor after the reserved
v0.7 slot.

- **Save-first contact and lead intake** (harvested from RiseLynk's `contact-submit`).
  `lib/contact-intake.mjs` is the hardened receiver core behind `/api/contact` and
  `/api/lead`: it saves the lead FIRST, then notifies, and a mail failure returns
  `{ ok:true, notified:false }` so a lead is never lost. `reply_to` is set to the
  lead; every field is HTML-escaped into the notification body; a phone-only submit
  is accepted (email is optional for a call-back); rate limiting is fail-open. The
  mailer and the lead store are isolated behind `getSender()` / `getSaver()` (the
  RiseLynk `__test` pattern), so `tools/contact-intake.test.mjs` proves the logic
  with injected fakes. The notify target and from-address are read from config / env;
  the optional durable sink is `LEADS_ENDPOINT` (a generic endpoint that owns its own
  schema). No RiseLynk project ref or URL is baked in. Where durable lead state
  ultimately lives is the plan's open decision #1, settled at R3; until then the
  never-drop guarantee at the edge is carried by the notification email plus a
  client-side `mailto` fallback in `Contact.tsx` / `LeadForm.tsx`.
- **Informational cookie notice** (harvested from RiseLynk's `cookie-notice.js`).
  `components/CookieNotice.tsx` is a dependency-free banner, config-gated on
  `site.cookieNotice` (default OFF), with a `localStorage` ack so a dismissal
  persists and a strictly-necessary framing. Its palette reads the two-color contract
  (the `.cookie-bar` CSS themes off the same brand tokens as everything else), so it
  reskins with the brand and bakes in no color. It is an informational notice, not a
  consent wall.
- **New release gate:** `npm run test:contact` (the intake harness) joins the battery.

## v0.6.1

Consumer-experience release: auto Product structured data, a first-class external-config
entry point, a blessed config-lint surface, and a blog URL-identity fix. Additive on v0.6.0,
no new dependencies, no schema break (a v0.6.0 config is valid unchanged). Closes Kitsap
engine feedback items 3, 5, 6, and 7 (from the ARK Fabrication build) plus the trailing-slash
URL-identity mismatch.

- **Auto Product JSON-LD** (`products` sections, feedback item 3). Every product in a
  `products` section now emits `Product` structured data automatically when `seo.domain` is
  set, so commerce pages are rich-result eligible with no hand-wiring. A priced product
  carries an `Offer` (price, currency, availability, seller); a quote-only (unpriced)
  product emits a bare `Product` node with no price it cannot honor. Domain-less (noindex)
  builds emit none. `productLd()` stays exported for hand use; the new
  `productLdsForSections()` in `lib/seo.ts` does the per-page injection, wired into the home
  and subpage routes.
- **First-class external-config entry point** (feedback item 5). Set `SITE_CONFIG_PATH` to a
  config file outside the engine checkout (absolute, or relative to the build cwd) and the
  active-site seam resolves to it, so a consumer never rewrites and restores the tracked
  `site.config.ts` around a build. Unset, the committed seam resolves exactly as before. The
  hook is a webpack exact-match alias on `@/site.config` in `next.config.mjs`.
- **Blessed config-lint entry point** (feedback item 7). `tools/lint-config.mjs` is the
  supported, stable surface for the copy-discipline lint over any config: it re-exports
  `lintConfig`, `lintString`, and `collectStrings` (the implementation stays single-sourced
  in `tools/hydrate.mjs`) and adds `lintConfigFile()` plus a CLI (`npm run lint:config
  <config.json|mjs|js>`). Both storefronts now depend on this contract, not on hydrator
  internals.
- **Blog URL-identity fix.** `articleLd()` and `/llms.txt` emitted `/blog/<slug>/` (trailing
  slash) while the sitemap, canonical, and the URL Next serves are slashless. All four now
  agree on the slashless form, so an article has one URL identity across every surface.
- **Windows deploy note** (feedback item 6). The README records that `vercel build
  --prebuilt` hits a symlink `EPERM` on Windows without Developer Mode; validate locally with
  `next build` and let the remote build compile from sources.

## v0.6.0

Quote-only catalog mode and draft/domain-less noindex. Additive on v0.5.0, no new
dependencies, no schema break (a v0.5.0 config is valid unchanged). Closes Kitsap engine
feedback items 10 and 13.

- **Quote-only catalog** (`products` section). An UNPRICED product (no `priceCents` /
  `priceId`) with a quote target renders its card CTA as a link to that page instead of a
  Stripe checkout button; priced products keep the checkout path unchanged. The target is
  the product's `ctaHref`, falling back to the section's `quoteHref`. Lets a brochure
  business show a real product catalog (image + description + "Request a quote") now and
  add payments later by adding prices, with no re-layout. `productLd` stays
  export-only (not auto-injected), so a quote-only catalog emits no price structured data.
- **Draft / domain-less noindex** (`seo.draft`, and automatic when `seo.domain` is unset).
  A draft build is public but not indexed: `robots.txt` returns `Disallow: /` and every
  page carries `robots: noindex, nofollow`. A client-review deploy on a `*.vercel.app`
  alias (no domain yet) is therefore kept out of search by default, so a not-yet-live or
  not-yet-cleared brand never lands in an index. `isIndexable(site)` in `lib/seo.ts` is the
  single source of truth for `robots.ts` and the root metadata.

- Brochure `services` items emit a `Service` node each in the `@graph` and appear in
  `/llms.txt`, deduped by name (contractor lines win a collision).
- Per-page canonical URLs on home, subpages, blog index, and articles, built from
  `seo.domain` plus the slug; omitted when `seo.domain` is unset.
- `.vercel` added to `.gitignore` (exact line, no trailing slash) so `vercel link` no
  longer mutates a tracked file mid-build.
- Adds the `CLAUDE.md` orientation file and refreshes the README feature matrix.

## v0.4.0

Hydration asset resolver, blog-rail seeding seam, artifact-bundle input. Backward
compatible with v0.3.0 snapshots.

- The hydrator accepts an artifact bundle (a `.../<approvedAt>/snapshot.json` path with a
  sibling `assets/`) as well as the bare v0.3.0 snapshot; the input shape is auto-detected.
- `assets.modProjects[]` before/after images resolve into `public/mods/` and render as a
  `modGallery` section; a project that cannot resolve both images is dropped with a
  claims-trace record, never failing the run.
- Top-level `articles[]` seed `blog.articles[]` through `isValidArticle`; malformed
  entries are skipped. The rail that produces the articles stays out of scope.

## v0.3.0

Publish-profile hydration: an approved, immutable snapshot to `site.config.ts`.

- `tools/hydrate.mjs` hydrates a snapshot behind three deterministic gates: the claims
  wall (a fact is emitted only when the snapshot proves it), the banned-phrase lint over
  every emitted string, and the claims trace written to `claims-trace.json`.
- Gates added: `npm run test:hydrate`, `npm run build:hydrated`.

## v0.2.0

Elevator-Contractor archetype and the GEO pack; the seam moves to the elevator demo.

- Elevator-Contractor archetype: `contractorServices`, `trustBar`, `requestService`,
  `portalDoor`, and the persistent emergency `callBar`. `archetype: "elevator-contractor"`
  emits a LocalBusiness plus Service `@graph`.
- GEO pack ported from riselynk.com: the `summary` answer-first block, `faq` with FAQPage
  parity, `/llms.txt`, and the LocalBusiness/Service graph.
- Hosted blog (`/blog` and `/blog/[slug]`); optional careers, records, and
  modernization-gallery sections, default OFF.
- Bakes in founder decisions 1, 3, 4, 5, and 6 from the iteration-2 brainstorm.

## v0.1.0

First engine release: the brochure and simple-commerce demo.

- Brochure and Simple-Commerce archetypes shipped as the `examples/site-demo` demo, with a
  working Resend contact form and Stripe Checkout.
- The active-site seam (`@/site.config`) and the two-color reskin contract.
