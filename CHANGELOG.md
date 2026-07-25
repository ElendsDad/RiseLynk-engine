# Changelog

Engine changes by tag. Sites pin a tag, so this is the ledger a consumer consults before
rolling a site forward (see the versioning contract in `docs/plans/roadmap.md`). Releases
are additive: a config valid at an older tag stays valid at a newer one. Each entry traces
to that tag's annotated message, `README.md`, and the repo.

## Unreleased - Lead-source attribution (UTM + referrer + landing path) - STAGED, NOT TAGGED

First-party, session-scoped form attribution so Josh can tell a client which page and
campaign produced each lead. No schema change, no migration: hidden fields fold through
existing `foldExtras()`. No cookies, no third-party calls, no fingerprinting. Gate:
`npm run test:lead-attribution`.

- **Capture** (`components/LeadAttribution.tsx` on every email intake form): `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`, `landing_path`
  from `location.search` / `document.referrer` / `location.pathname`.
- **Sanitize** (`lib/lead-attribution.mjs`, applied in `submit()`): length cap 200, strip
  control chars and angle brackets, reject non-scalars; referrer keeps origin+path only
  (query/hash dropped); landing_path is a same-origin path. Absent stays absent.
- **Privacy notice**: default `cookieNotice` copy mentions the form capture (override via
  `cookieNotice.message`).

## Unreleased - Cloudflare trust pack (analytics + Turnstile readiness + AI robots) - STAGED, NOT TAGGED

Three founder asks that share config/layout/form surfaces. No client `engine.pin` bumps.
**Rendered-output note:** every indexable site's `robots.txt` gains per-UA disallow rules
for AI training crawlers under the default `seo.aiCrawlers: "split"` policy (plus optional
TDM/`noai` meta). A config that sets none of the new fields is otherwise unchanged
(analytics off, Turnstile still opt-in, CSP byte-identical without a CF analytics token).

- **Cloudflare Web Analytics** (`analytics.cloudflareToken`, `lib/analytics.mjs`,
  `components/Analytics.tsx`, CSP wiring in `next.config.ts`): free cookieless beacon as
  the recommended analytics default; Plausible/GA remain available. When the token is set,
  CSP gains `script-src https://static.cloudflareinsights.com` and
  `connect-src https://cloudflareinsights.com`. Does not require Cloudflare DNS.
  `cookieNotice` stays OFF for analytics-only (CF sets no cookies). Gate:
  `npm run test:analytics`; `npm run test:headers` extended.
- **Turnstile on every email form** (`RequestService.tsx`, `Careers.tsx`, schema posture,
  `turnstileMissingIssue` build WARN): Contact, LeadForm, RequestAccessForm, and
  ContentGate already wired; request-service and careers now match. Fail-closed XOR
  unchanged (misconfig -> 503, never silent accept). Gate: `npm run test:turnstile-forms`.
- **AI crawler robots policy** (`seo.aiCrawlers` `split`|`block`, `lib/ai-robots.mjs`,
  `app/robots.ts`, optional `seo.aiMetaSignals`): default split blocks training bots,
  keeps citation agents for `/llms.txt` discovery; `block` disallows citation agents too.
  robots.txt is advisory; Cloudflare zone AI-scraper toggle is real enforcement (needs
  Cloudflare DNS). Gate: `npm run test:ai-robots`.

## v0.26.0 - 2026-07-24 - Teardown P2: mobile nav, matrices, blog organize, FAQ collapse, video embed - STAGED, NOT TAGGED

RiseLynk marketing teardown P2 engine slices so every pinned consumer can inherit them at
the next per-site upgrade. Triage: `~/.maxwell/engine-teardown-triage.md`. No client
`engine.pin` bumps in this change. New gates: `test:mobile-nav`, `test:feature-matrix`,
`test:pricing-matrix`, `test:blog-index`, `test:faq-collapse`, `test:video-embed`.

- **7c Mobile nav overflow fold** (`components/Header.tsx`, CSS): checkbox + label hamburger
  under 720px; wide viewports keep the horizontal row. No-JS. **Rendered-output change on
  upgrade for every site** (toggle chrome lands in the header HTML; narrow viewports hide
  the flat wrapping link row behind the menu). `nav.condense` is unchanged.
- **7g `featureMatrix` section** (`FeatureMatrixRow`, `matrixColumns` / `matrixRows`): neutral
  capability grid (rows = capability, columns = config labels). No competitor/CRM copy.
  Additive: unused configs are byte-identical.
- **2a Pricing comparison matrix** (`PricingComparisonRow` / `comparisonRows` on `pricing`):
  feature-by-feature table under existing plan cards. Absent `comparisonRows` keeps
  cards-only markup byte-identical. Does not rebuild `tiers[]` or `addons`.
- **6a Blog categories + featured** (`Article.category` / `featured`, `BlogConfig.categoryOrder`,
  `lib/blog-index.mjs`): featured lead + category groups when opted in; flat index otherwise
  (byte-identical). Reuses `lib/read-time.mjs`.
- **7b FAQ collapse variant** (`Section.style: "collapse"` honored by `faq`): native
  `<details>`/`<summary>`. Absent style keeps the flat list byte-identical.
- **7j `videoEmbed` section** (`VideoEmbedConfig`, `lib/video-embed.mjs`) + **`security.frameSrc`**:
  privacy-first allowlisted embeds (YouTube → youtube-nocookie, Vimeo + dnt, no autoplay,
  lazy). Fail-closed on bad src. Consuming sites must add the iframe origin to
  `security.frameSrc` (same origin-shape rules as `connectSrc`). Absent `frameSrc` keeps
  today's exact CSP `frame-src` (Turnstile host only).

## v0.26.0 - 2026-07-24 - P1 value pass: llms.txt emergency tip, readiness lint, LCP hero - STAGED, NOT TAGGED

Engine value-research P1 (see `~/.maxwell/engine-value-research.md` and the
delivery report `~/.maxwell/engine-p1-value.md`). No client `engine.pin` bumps
in this change; consumers inherit at the next per-site upgrade.

- **llms.txt emergency tip is config-driven** (`lib/llms.ts`, `callBar.emergencyContext`):
  the engine no longer hardcodes *"If someone is stuck in a stopped elevator…"*.
  That line was gated only on `callBar.enabled && phone`, so every trade template
  with a call bar told AI assistants to talk about stopped elevators. New contract:
  emit the trade-neutral frame *only* when `callBar.emergencyContext` is a non-empty
  string; otherwise silence. Elevator-demo and the RiseLynk hydrator set the context
  in config. Gate: `npm run test:llms-emergency`.
- **Scaffold-copy lint covers lib/ emitters** (`tools/scaffold-copy.mjs`): the previous
  `app/` + `components/` only scan (comment: "lib/ has no JSX") missed customer-facing
  string emitters. Now lints `lib/llms.ts`, `lib/trust.mjs`, and `lib/announcement.mjs`,
  plus a vertical-term ban on those generic emitters so elevator/plumber/… copy cannot
  reappear as hardcoded engine prose. Gate extended in `npm run test:scaffold-copy`.
- **Go-live readiness linter** (`tools/readiness.mjs`, `npm run readiness`,
  `npm run test:readiness`): completeness report (WARN for unset `schemaType`,
  `openingHours`, `serviceArea` section, `ogImage`, `location`, `emergency247` when
  the site already claims any-hour service; INFO for turnstile/analytics that need
  live keys or a paid product). Not a validity gate — pairs with preflight/lint-config.
- **Hero LCP + About CLS** (`components/sections/Hero.tsx`, `About.tsx`,
  `lib/image-size.mjs`): hero photo is a real `<img>` with `fetchPriority="high"` and
  optional AVIF/WebP `<source>` siblings when those files already exist under `public/`
  (no `next/image`, no `sharp`). About stamps real `width`/`height` from PNG/JPEG/WebP/AVIF
  headers parsed in plain Node. Gate: `npm run test:image-size`.
- **Rendered-output changes** (once a site upgrades past this tag): `/llms.txt` drops the
  elevator emergency tip unless `callBar.emergencyContext` is set; hero markup changes
  from CSS `background-image` to `<picture>/<img>` when `backgroundUrl` is set; About
  images gain width/height + `.about__img`.

## v0.25.0 - 2026-07-24 - Teardown P1: glass compositor fix, blog read-time, dense directory - STAGED, NOT TAGGED

RiseLynk marketing teardown (2026-07-24) routed three P1 engine fixes here so every
pinned consumer inherits them at the next per-site upgrade. Full triage lives in
`~/.maxwell/engine-teardown-triage.md`. No client `engine.pin` bumps in this change.

- **Glass-over-card drop (P1 bug)** (`app/globals.css`, `tools/theme-tokens.test.mjs`):
  Chromium fails `backdrop-filter` (and can corrupt compositor state until a full
  reload) when the same element carries `overflow: hidden` and `backdrop-filter`. The
  glass hover path previously set both on card surfaces, compounded by `.product` /
  `.mod` base `overflow: hidden` and the sticky header's always-on blur. Fix: glass
  cards force `overflow: visible`; the blur moves to `::after` (leaf pseudo); the
  pointer glow stays on `::before`. Sites without `craft.glass` are unchanged. Gate:
  the theme suite now asserts the overflow / `::after` invariants.
- **Blog read-time banner** (`lib/read-time.mjs`, `app/blog/page.tsx`, CSS): each blog
  index card shows a bottom banner (`N min read`) estimated at 220 wpm from the
  article's lede/summary/body/faqs. No measurable text => no banner (fail-closed).
  **Rendered-output change** for any site that publishes a blog once it upgrades past
  this tag. New gate: `npm run test:read-time`.
- **Dense `directory` section type** (`DirectoryItem`, `components/sections/Directory.tsx`,
  SectionRenderer, CSS): compact auto-fill card grid (`minmax(200px, 1fr)`) for
  industry-resource / link-directory pages where `records` cards are too large.
  Additive and default unused: configs that never declare `type: "directory"` are
  byte-identical. New gate: `npm run test:directory`.

## v0.24.1 - 2026-07-20 - Form-outage hardening: config-extendable CSP, placeholder-email build wall, delivery-wiring signal - STAGED, NOT TAGGED

The engine-side fixes for maxlynk-services `docs/engine-feedback-v0.20.0.md` items #30
and #31, both traced to the SAME 2026-07-20 ryan-dehart/ARK Fabrication incident (a live
client site whose quote form was silently undeliverable from go-live): a hardcoded CSP
`connect-src` that killed a site-local intake page's cross-origin fetch, and a production
deploy with no delivery env wired PLUS a still-placeholder `business.email`, so every
lead vanished into a benign-by-design "accepted, not sent" black hole. All three features
are additive and build-time only; no rendered output, JSON-LD, or `/llms.txt` changes
(proven below). New gates: `npm run test:csp`, `npm run test:delivery-guard`; `npm run
test:headers` extended with the connect-src wiring proof; `npm run test:contact` extended
with the new `deliveryStatus` field.

- **31a - config-extendable CSP `connect-src`** (`lib/csp.mjs`, wired by `next.config.ts`):
  an optional `security.connectSrc: string[]` per-site field, validated (bare https
  origins only - no path/query/hash, no wildcard, no non-https scheme) and appended to
  the CSP's `connect-src` directive at build time, deduped against the base list
  (`'self'` plus the existing Turnstile-host allowance). A rejected entry is dropped, not
  a build failure, and logged loudly so a config typo cannot become a new way to break a
  build. Absent `security.connectSrc` reproduces today's exact `connect-src` byte for
  byte - proven by `npm run test:headers` against the REAL active site config (no
  synthetic fixture) and by the manual `npm run build` proof below.
  - **Implementation note (why `next.config.mjs` became `next.config.ts`):** this check
    needs the active site config's real values at build time, and `site.config.ts` is
    TypeScript; plain Node cannot import a `.ts` file without either a bundler or Node's
    own experimental type stripping, which is NOT guaranteed at this repo's declared
    floor (`package.json` "engines" `>=18.18.0`). Next.js 15.1+ ships first-class
    `next.config.ts` support instead: Next's own bundled SWC compiler transpiles it (and,
    for the duration of that one synchronous load, anything it requires too, respecting
    this repo's tsconfig `paths`/`baseUrl`) - a real, version-independent capability of
    Next itself, confined to config loading. See `next.config.ts`'s own doc comment for
    the full reasoning and the fallback behavior if that load ever fails.
- **30a - placeholder-email build wall** (`lib/delivery-guard.mjs`): FAILs the build when
  `business.email` matches a placeholder shape (`.example`, `.invalid`, `yourdomain.`,
  `example.com`) while a `leadform`/`contact` section is live, on genuine production
  intent - a real (non-placeholder) `seo.domain` and not `seo.draft` (mirrors, but is
  deliberately narrower than, `lib/seo.ts`'s `isIndexable`: this engine's OWN example/
  and hydrated-fixture configs all use a `.example` seo.domain too, the same reserved-TLD
  shape as a placeholder email, so a build whose own domain is itself placeholder-shaped
  stays a WARN, keeping `npm run build` and both hydrated builds green with zero config
  changes). Preview, draft, domain-less, and the engine's own demo/fixture builds WARN
  loudly instead and stay green. This is the exact ryan-dehart incident shape, caught
  before deploy.
- **30c - operator-facing delivery-wiring signal**: a loud build-log line
  (`lib/delivery-guard.mjs`, wired by `next.config.ts`) when a `leadform`/`contact`
  section is live and neither `RESEND_API_KEY` nor `LEADS_ENDPOINT` is set - visibility
  only, always a WARN, not a gate (deploy-time enforcement of this is item #30b,
  deliberately OUT of scope here; see below). Paired with a machine-readable status field
  on the routes' existing JSON response: `lib/contact-intake.mjs`'s `submit()` now
  returns `deliveryStatus: "black_hole" | "ok"` alongside the existing `saved`/`notified`
  booleans (unchanged) - `"black_hole"` names the exact `saved:false` + `notified:false`
  combination the incident hit, so a consumer can probe for it directly instead of
  remembering what the conjunction means. Naming/visibility only: no behavior change,
  `app/api/lead/route.ts` and `app/api/contact/route.ts` needed no edits (they already
  return `submit()`'s result verbatim).
- **30b explicitly NOT built here.** A deploy-time check of the TARGET Vercel project's
  real env names (`vercel env ls`) needs visibility this engine does not have during a
  `next build` - it belongs in the consumer's own build tooling. Tracked as a
  maxlynk-services follow-up: `tools/engine-build.mjs --deploy` should fail the deploy
  (with an override flag for a genuinely mailto-only site) when a leadform/contact
  section is live and the target project has neither env var set.
- **Additive-contract proof:** `npm run build`, `npm run build:hydrated`, and `npm run
  build:hydrated:bundle` all green with ZERO config changes to any example or fixture
  (all three WARN on both #30a and #31a's absence-of-issue paths where applicable, never
  FAIL - their domains are placeholder-shaped, same as their emails). A normalized
  rendered-output comparison against `main` (16da34e): JSON-LD `@graph` and visible text
  content byte-identical across every static page on the active demo, and `/llms.txt`
  byte-identical; the only raw-HTML differences are Next's own per-build-random React
  flight-protocol markers, proven to differ even between two consecutive builds of
  UNCHANGED `main` (a non-determinism control, not a regression).

## v0.24.0 - 2026-07-20 - Kitsap feedback pack: gallery captions and pairs, service pages, schema subtype, lead-field gate - STAGED, NOT TAGGED

The remaining high-leverage asks from Kitsap `engine-feedback-v0.12.0.md`: items #18, #19,
and #29 built, plus item #24's generic custom-field seam proven end to end and truthfully
documented (the seam itself already existed via `Section.formFields`; investigation found no
lead-losing bug, so it gained a dedicated gate and corrected doc comments, zero logic
change). Additive: a config that uses none of the new fields renders byte-for-byte as
before, proven by rebuilding all six example demos and both hydrated fixtures against
normalized rendered-output snapshots taken at v0.23.0, PLUS a dedicated plain-gallery
probe config: no example demo uses a `type: "gallery"` section, so the demo snapshots
alone could not prove this section's byte-identity, and an adversarial verification pass
caught exactly that gap (the first cut of the pairs block serialized a null child into a
plain gallery page's RSC flight payload; fixed in the follow-up verify commits, and the
probe now locks it). New gates: `npm run test:gallery`, `npm run test:schema-type`,
`npm run test:service-page`, `npm run test:lead-fields`.

- **Gallery captions + before/after pairs** (#18, `lib/gallery.mjs`): `Section.images`
  items gain an optional `caption` rendered verbatim as `figure`/`figcaption` (a
  caption-less item keeps its exact bare `img` markup), and `Section.pairs` is a
  brand-neutral before/after array (`before`/`after` image refs, optional `caption`/`note`,
  `beforeLabel`/`afterLabel` tag overrides defaulting to "Before"/"After"), distinct from
  the elevator-only `modGallery` vocabulary. Fail-safe by choice (documented against
  `hours-ld`'s fail-closed rule): a malformed pair is dropped individually, since a missing
  image is a broken render, not a wrong claim.
- **LocalBusiness subtype** (#29, `lib/business-type.mjs`): optional `business.schemaType`
  resolved against a frozen allowlist of fourteen real schema.org LocalBusiness subtypes
  (the HomeAndConstructionBusiness family, the automotive family, and a ProfessionalService
  umbrella). Fail-closed by construction: only an exact, case-sensitive match on a site
  that already qualifies as a LocalBusiness resolves, the resolver returns the list's own
  entry rather than the caller's string, and every other input keeps today's
  LocalBusiness/Organization expression byte for byte. The field never flips a plain
  Organization site local, so the hours and JSON-LD gating that keys off
  LocalBusiness-ness is untouched.
- **Per-service detail-page Service node** (#19, `lib/service-page-ld.mjs`):
  `PageConfig.service` (`{ name?, key?, rating?, reviews? }`) marks a page as THE detail
  page for one service (item #25's `href` seam already links into it) and emits a
  page-level Service JSON-LD identified by the page's own URL, with rating/reviews folded
  through the EXISTING `withRatingLd` claims wall. A draft page or a domain-less build
  emits nothing; the sitewide per-ServiceLine Service nodes are unchanged and coexist
  (they carry no `@id`; the page node's `@id` is the page URL).
- **Lead-field vocabulary gate** (#24): `npm run test:lead-fields` drives the real
  `lib/contact-intake.mjs` end to end for the feedback's wanted vocabulary (urgency
  select, budget range, timeframe, vehicle year/make/model, plus the already-shipped
  `building` address field): canonical-column mapping, verbatim folding of custom fields
  into the saved message, checkbox-group multi-value survival on both the enhanced and
  no-JS paths, and the classic `Section.fields` path proven untouched. Schema doc comments
  on `LeadField`/`Section.fields`/`Section.formFields` corrected to the verified contract
  (including the label-vs-name fold asymmetry on the no-JS path, client-only `required`
  enforcement, and the `website`/`source` reserved-name caution).

## v0.23.0 - 2026-07-19 - Structured hours (Kitsap feedback #27) - TAGGED (tag verified on origin 2026-07-20)

The dedicated release the roadmap sized for Kitsap engine-feedback-v0.12.0 item #27:
structured weekly hours plus the emergency flag, as one shared claims-walled seam.
Additive: a config that does not set the new fields renders byte-for-byte as before
(every builder returns null and no JSON-LD key, llms.txt line, or visible line changes).
New gate: `npm run test:hours`.

- **`business.openingHours`** (new `lib/hours-ld.mjs`, the `area-ld.mjs` shared-.mjs
  pattern): an array of `{ days, opens, closes }` windows ("HH:MM" 24-hour; a day may
  repeat across entries for a split schedule; `closes` before `opens` is an overnight
  window; `allDay: true` replaces the pair). ONE builder feeds three surfaces so they
  cannot drift: `openingHoursSpecification` on the JSON-LD org node, the llms.txt
  "Hours" line, and the visible Contact-section hours line. Structured wins over the
  legacy free-form `business.hours` string on all three; the string remains the
  fallback. JSON-LD scope: `openingHoursSpecification` is a LocalBusiness/Place
  property, so it is emitted only when the org node is a LocalBusiness (the
  elevator-contractor archetype or a config with `business.location`); a
  plain-Organization graph is unchanged while the text surfaces still render.
- **Fail-closed validation** (`normalizeOpeningHours`): one malformed entry (unknown
  day, bad time, missing or conflicting fields, zero-length window) withholds the
  ENTIRE schedule from every surface rather than publishing a partial week that reads
  as a wrong claim; the legacy string takes over.
- **`business.emergency247`** (the feedback's emergency flag): the config's own
  attestation that the line is answered around the clock (the statement
  `callBar.dispatchRouted` has always worded as "any hour"). With a `business.phone`
  supplied, the org node gains an emergency `ContactPoint` with around-the-clock
  `hoursAvailable`, and llms.txt an emergency line; without a phone, or absent, nothing
  is emitted.
- **elevator-demo** opts in: the structured mirror of its existing free-form hours line
  plus the emergency flag its FAQ and call bar already attest.

## v0.22.0 - 2026-07-19 - Founder feedback closures + the expressive pack (storyGraph, style variants)

Seven additive closures from the founder's outstanding feedback list, plus the first two
pieces of the expressive pack (a config-driven node-graph narrative section and a generic
presentation-variant field). Every change is additive: a config that opts into none of
this renders byte-for-byte as before, no config schema field became required, and no
public claim or marketing copy changed. Each slice proved byte-identity by diffing the
tracked demo's build output before and after. New gates: `npm run test:brand-logo`,
`npm run test:inline-links`, `npm run test:page-draft`, `npm run test:story-graph`,
`npm run test:style-variant`, `npm run test:addons`.

- **Logo replaces name, footer logo slot, per-theme logo variant** (`lib/brand-logo.mjs`,
  `components/Header.tsx`, `components/Footer.tsx`): `brand.logoReplacesName` swaps the
  visible business-name text for the logo image in the header (`alt` becomes
  `business.name`); the same flag also blanks the footer's name text, but only once the
  footer has its own `footer.logoUrl` asset, so a footer with no logo image never loses
  its name text. `brand.logoUrlDark` / `footer.logoUrlDark` render a dark-theme
  counterpart, chosen by pure `[data-theme]` CSS with no added JavaScript and no flash.
  `lib/seo.ts`'s Organization JSON-LD keeps reading the canonical light `brand.logoUrl`
  unchanged.
- **Per-page draft flag** (`PageConfig.draft`): mirrors the existing blog-article draft
  idiom for a config page. A draft page stays reachable at its direct URL, carries
  `robots: noindex`, and drops out of nav, the sitemap, `/llms.txt`, and the sitewide
  `@graph`, including its own `services`/`contractorServices`/`serviceArea` content, so a
  page marked draft never leaks into structured data even while noindexed.
- **`FeatureItem.who`**: a service-card line mirroring the existing `PricingTier.who`,
  rendered between the card title and its body.
- **Inline prose links** (new `lib/inline-links.mjs`, `components/Prose.tsx`):
  `Section.body`, `Section.points`, and `FaqItem.a` now accept markdown-style
  `[label](href)` links (http, https, mailto, tel, or a same-document relative path only;
  `javascript:` and protocol-relative `//` destinations are rejected). The FAQPage
  JSON-LD strips the same answers to plain visible text, so the structured data and the
  page never disagree. `lib/markdown.ts`'s blog-article link handling now shares the same
  guard.
- **Disclosed blog-markdown behavior change** (`lib/markdown.ts` onto the shared
  `lib/inline-links.mjs` allow-list): a blog article body's `mailto:` and `tel:` link
  destinations, previously left as literal bracketed text, now render as links. A
  protocol-relative `//host` link destination, previously rendered as a link, is now
  rejected and left as literal text, a security tightening: the shared allow-list is
  http, https, mailto, tel, and root-relative only.
- **`storyGraph` section** (new `lib/story-graph.mjs`, `components/sections/StoryGraph.tsx`):
  a config-driven node-graph narrative rendered as a server-built SVG, zero client
  JavaScript. Layout is a deterministic longest-path auto-layout that never crashes on a
  cyclic graph (trapped nodes still place, in an overflow layer, with the animated
  current withheld); the current itself is a pathLength-normalized dashed overlay shown
  only under `prefers-reduced-motion: no-preference`, so reduced motion and no-JS both
  render the complete static graph. Node and edge ink ride the existing theme tokens,
  with an optional per-node color pass-through. Left-to-right graphs also prerender an
  automatic top-to-bottom relayout for narrow screens, pure CSS, no JavaScript
  resize logic.
- **`Section.style` presentation variants** (new `lib/style-variant.mjs`): one generic
  opt-in field, `"ribbon"` or `"editorial"`, resolved through a shared honor map so a
  section type that does not honor a variant ignores it safely. `"ribbon"` (services
  feature cards) layers stacked-sheet depth from the existing shadow tokens and
  re-renders the card's existing badge as a folded edge ribbon; `"editorial"` (hero) is
  an oversized system-serif display treatment (`ui-serif`/Georgia, no font downloads),
  type and space only, composing with the existing `craft.heroMotion` rather than baking
  in new motion.
- **`addons` section** (new `lib/section-id.mjs`, `components/sections/Addons.tsx`): a
  second priced-menu surface, deliberately decoupled from `pricing`. Its own `AddonItem`
  shape (`name`, a display-only `price` string, optional `description`/`note`/`ctaLabel`/
  `ctaHref`) carries no structured `priceValue`, so an add-on can never be fed into an
  Offer even by a future wiring mistake; the section emits no JSON-LD of any kind, a
  priced menu is presentation copy, not a commercial-offer claim. `lib/offer-ld.mjs`'s
  `collectPricingTiers` (moved out of `lib/seo.ts`, same dependency-free-`.mjs` pattern as
  every other collector) stays type-gated on `pricing` only, so `addonItems` never reach
  the SoftwareApplication Offer / AggregateOffer JSON-LD, proven directly against an
  adversarial config that smuggles a `tiers` array under `type: "addons"`. Each section
  gets its own DOM id, never the pricing section's hardcoded `"pricing"`: an optional
  `Section.id` wins verbatim, and an omitted id resolves through the new
  `lib/section-id.mjs` `resolveSectionId` to a deterministic auto-suffix (`"addons"`,
  `"addons-2"`, `"addons-3"`, ...) counted by position in the page's own section list, so
  a page with two or more `addons` sections gets unique ids automatically with zero
  config. Renders on new `.addons-grid`/`.addon` markup that matches the existing `.plan`
  hover-lift baseline byte-for-byte, fine-pointer gated and locally neutralized under
  `prefers-reduced-motion` (no new motion). It does not honor `Section.style`
  (`"ribbon"`/`"editorial"`): both variants' CSS targets markup this section does not
  share, so `addons` was left out of the `STYLE_HONORS` map rather than forced in;
  unhonored types ignore the field safely by design.
- **New example**: `examples/expressive-demo`, a neutral brochure site exercising
  `storyGraph`, both style variants, and the new `addons` section.

## v0.21.0 - 2026-07-18 - Baseline hover/glow micro-interactions + social links

Founder feedback on the live riselynk.com pricing page: no glow, no button effects, no hover
feedback at all. Two additive, back-compatible changes: neither touches the config schema's
back-compat contract (no site's config becomes invalid), and no public claim or marketing copy
changes. Every color derives from the two brand tokens (`--color-primary` / `--color-accent`
via `color-mix()`); nothing is baked in and the craft/theme/dusk remaps keep working unchanged,
since a custom-property read always resolves the live value in that context.

- **Baseline hover/focus micro-interactions** (`app/globals.css`, no new config surface): every
  `.btn` variant gets a lift plus a soft brand-color glow on hover (fine-pointer gated,
  `@media (hover: hover) and (pointer: fine)`, so a touch tap never sticks mid-hover) and a
  crisper press on `:active`; pricing-tier cards (`.plan`, `.plan--highlighted`) get the same
  lift-plus-glow elevation on hover, so the pricing page now visibly responds to a pointer; nav
  links get an accent-colored underline sweep on hover/focus; a plain content link gets a
  color-shift transition. `:focus-visible` states are unchanged. Every new hover transform is
  neutralized under `prefers-reduced-motion: reduce` (mirrors the existing R5.1 glass/magnetic
  convention: the master guard kills transition duration, a local reduce block additionally
  zeroes the transform so nothing moves).
- **Social links** (`business.socials[]`, pre-existing on `lib/config-schema.ts` since v0.2.0 but
  never rendered): `components/Footer.tsx` now renders each entry as an accessible inline-SVG
  icon link (`rel="me noopener"`, `target="_blank"`, an `aria-label` from the config label), and
  `lib/seo.ts`'s `organizationLd` folds the same hrefs into the Organization/LocalBusiness
  `sameAs` array. New `lib/social-icons.mjs` (data) + `components/SocialIcon.tsx` (draw),
  mirroring the `lib/icons.mjs` / `components/Icon.tsx` split: a small, brand-neutral,
  dependency-free, hand-drawn icon set (linkedin/instagram/facebook/x/youtube plus a generic
  "link" fallback), with platform detection that checks the label first, then the href hostname,
  and never throws on a malformed or relative href (a `"#"` placeholder degrades to the generic
  glyph). Omitted entirely when `business.socials` is unset or empty, same posture as every other
  optional footer block. New gate: `npm run test:social`.

## v0.19.0 - 2026-07-14 - Local-trades conversion surfaces: service area, visible reviews, lead-capture content gate

Three additive conversion sections for local-trades sites, built to
`docs/plans/local-trades-conversion-surfaces.md` (service area, visible reviews) and
`docs/plans/lead-capture-content-gate.md` (content gate, Phases 0-1). Fully back-compatible: a
config that opts into none of them renders byte-for-byte as before, the JSON-LD `@graph` and
`/llms.txt` are unchanged for every existing config, and no public claim or marketing copy shifts.
Every visible value is config-supplied and claims-walled; the engine invents no coverage, rating,
or asset. Proven on the full gate battery plus a combined fixture exercising all three at once.

- **Structured service area** (`serviceArea` section, new `lib/area-ld.mjs`,
  `components/sections/ServiceArea.tsx`, `lib/seo.ts`, `lib/llms.ts`): a visible list of
  config-supplied place names (each an optional supporting note), rendered verbatim. One collector
  (`collectServiceAreas`) feeds the visible section, the `areaServed` JSON-LD on the Organization
  and every Service node, and one `/llms.txt` "Areas served" line, so the human and machine surfaces
  cannot drift. Back-compat seam: with no `serviceArea` section the legacy single
  `business.serviceArea` string reproduces the prior inline Place object byte-for-byte (key order
  included); structured areas win over the string and become one Place per area. New gate:
  `npm run test:service-area`.
- **Visible reviews with claims-walled stars** (new `lib/stars.mjs`, `components/StarRating.tsx`,
  `components/sections/Testimonials.tsx`): two independent opt-ins on the existing quote grid. A
  quote may carry the real star value its reviewer gave (`quotes[].rating`), which renders a star
  row; `showBusinessReviews` renders, after any quotes, the `business.rating` summary line and the
  `business.reviews` items as review cards (`maxBusinessReviews` caps the list). The star row is a
  server-rendered inline SVG colored by the accent brand token, with an accessible `role="img"`
  label. One claims wall covers the visible surface and the JSON-LD: `StarRating` renders nothing
  and `ratingSummaryLine` returns null without a real supplied rating (`ratingIsValid` from
  `lib/rating-ld.mjs`). New gate: `npm run test:stars`.
- **Lead-capture content gate, Phases 0-1** (`contentGate` section, new `lib/content-gate.mjs`,
  `components/ContentGate.tsx`): trades one config-supplied content asset (a checklist, a pricing
  guide) for a lead through the same save-first intake every other form uses (`/api/lead` +
  `lib/contact-intake.mjs`): same hidden honeypot, same optional Turnstile, and a gate-specific
  `source` tag so the operator sees which gate produced a lead. The form carries native
  action/method attributes, so with JavaScript off a submit still saves the lead through the route's
  existing form-post path and native browser validation still runs (a lead is never dropped). On an
  accepted lead the form swaps for a reveal panel with the asset link. Phase 1 is a stated soft gate
  (the asset href is in the served markup); signed, expiring links are the specified Phase 3. New
  gate: `npm run test:content-gate`.

## v0.18.1 - 2026-07-13 - SEC hardening (cont.): shared rate limiter + hydration/build-boundary

Closes the two remaining items from the second-vendor review triage
(`docs/plans/sec-hardening-v0.18.0.md`), FIX 2 and FIX 6. Additive and back-compatible: a config
opting into nothing renders byte-identical, no public claim or marketing copy changes, and the
hydrated demo fixtures build unchanged. Every new operator env var is optional (unset preserves the
prior behavior).

- **Shared atomic rate limiter, trusted-IP + tenant keyed** (FIX 2, `lib/contact-intake.mjs`,
  `app/api/contact/route.ts`, `app/api/lead/route.ts`): the brochure limiter was a
  per-serverless-isolate Map keyed by bucket + IP only, so 10/hr/IP multiplied by the isolate count
  and two sites at one shared IP collided in one bucket. The limit is now keyed by tenant (site
  domain) + bucket + a trusted IP (`clientIp()` prefers the platform-set x-real-ip over the spoofable
  leftmost x-forwarded-for) and backed by an injectable store seam. Set `RATE_LIMIT_REST_URL` +
  `RATE_LIMIT_REST_TOKEN` (the Vercel-KV / Upstash REST shape) to make the count fleet-global; unset,
  it falls back to the per-isolate window. Fail-open on an unresolvable IP or a store outage is
  preserved, since a limiter hiccup must never drop a real lead. Proven in `npm run test:contact`.
- **Hydration / build-boundary hardening** (FIX 6, `tools/hydrate.mjs`, `app/api/checkout/route.ts`,
  `next.config.mjs`, new `tools/security-headers.test.mjs`):
  - *Snapshot-comment code-exec (CWE-94):* the generated `site.config.ts` comment-header values are
    now line-terminator escaped, so a snapshot field carrying a newline can no longer break out of the
    `//` comment into code that `next build` would execute on the build host.
  - *Active-content public assets:* both the stored and inline-transport asset branches now derive the
    file extension from a fail-closed content sniff of the DECODED bytes, not the supplied MIME or
    filename, so a `text/html` or `image/svg+xml` payload can no longer land in `public/mods` as a
    same-origin active document; a non-raster side drops the project with a trace record.
  - *Portal-link binding:* `wiring.portalUrl` is parsed with the URL constructor and required to be
    https (and on `PORTAL_ORIGIN_ALLOWLIST` when the operator supplies one) before it renders in the
    public portal CTA; a `javascript:` or off-origin link is dropped.
  - *Checkout return URLs:* the Stripe success / cancel URLs bind to the configured `site.seo.domain`
    only, never the caller-supplied Origin header.
  - *Baseline Content-Security-Policy* on every route (alongside the v0.18.0 nosniff): default-src
    'self' with object-src 'none' and base-uri / frame-ancestors / form-action 'self'. The inline
    JSON-LD, the theme boot script, and self-hosted fonts keep 'unsafe-inline' because this static
    output cannot mint per-request nonces; the Cloudflare Turnstile host is allowed for opted-in
    sites. New gate: `npm run test:headers`.
  Proven in `npm run test:hydrate` (comment escape, content sniff, portal-link) and
  `npm run test:headers` (CSP + nosniff).

## v0.18.0 - 2026-07-13 - SEC hardening: JSON-LD sink, lead autoresponder, Turnstile fail-closed, markdown link, nosniff

Security-hardening batch from the second-vendor review triage
(`docs/plans/sec-hardening-v0.18.0.md`). Additive and back-compatible: a config opting into
nothing renders byte-identical, and no public claim or marketing copy changes. Four precise code
fixes plus a response-header default. The review's remaining items (a shared atomic rate limiter
and the hydration / build-boundary hardening) are tracked in that plan as FIX 2 and FIX 6.

- **JSON-LD shared-sink escape** (FIX 1, `components/JsonLd.tsx` + new `lib/jsonld-escape.mjs`):
  every `lib/seo.ts` builder funnels through one component, whose serialization now escapes the
  load-bearing `<` to its JSON escape (and U+2028 / U+2029), so a config string containing
  `</script>` can never terminate the inline `<script type="application/ld+json">` block. The
  emitted @graph is byte-equivalent for any JSON consumer. New gate: `npm run test:jsonld`.
- **Lead autoresponder recipient + spam gate** (FIX 3, `app/api/lead/route.ts` +
  `lib/contact-intake.mjs`): the optional autoresponder now fires only on a genuinely accepted
  (non-spam) submission and only to the recipient `submit()` validated and normalized
  (`r.autoReplyTo`), never a raw request-body value, so a honeypot submission can no longer be
  reflected to an arbitrary address. Proven in `npm run test:contact`.
- **Turnstile fail-closed-when-configured + config XOR guard** (FIX 4, `app/api/contact/route.ts`,
  `app/api/lead/route.ts` + `lib/contact-intake.mjs`): once a site configures the CAPTCHA, server
  verification now fails CLOSED on every negative or unverifiable signal (a missing token, an invalid
  token, no fetch path to Cloudflare, or a verify outage), so a rendered challenge always implies real
  enforcement; an unconfigured (no-secret) brochure site still fails open and is unchanged. A new
  shared `turnstileConfig` guard rejects a one-sided deploy (a widget siteKey with no server secret, or
  a secret with no widget) with a 503, so the CAPTCHA is never silently unenforced. Both routes read the
  one `verifyTurnstile` / `turnstileConfig` helper as the single source of truth. Proven in
  `npm run test:contact`.
- **Markdown link attribute-injection fix** (FIX 5, `lib/markdown.ts`): the blog link renderer now
  excludes the quote from both destination character classes and entity-encodes the destination,
  so a link destination can no longer break out of `href="..."` into an event handler. This is the
  one XSS that touches the trusted-input blog renderer. New gate: `npm run test:markdown`.
- **`X-Content-Type-Options: nosniff`** (`next.config.mjs`): a response-layer default across all
  routes, blunting the content-sniffing and markdown-XSS classes. A baseline Content-Security-Policy
  is deferred to FIX 6: the engine's inline JSON-LD, inline theme boot script, and self-hosted fonts
  need a non-trivial nonce / 'unsafe-inline' strategy that must not break the live-powering config.

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
