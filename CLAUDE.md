# site-engine - project guide for Claude Code

> **Tree index:** [`INDEX.md`](INDEX.md) — map, docs of record, gates, deploy, what is not here.

Config-driven static-site engine: one codebase renders many local-business
websites. A site is a `site.config.ts` plus assets plus a pinned engine tag,
nothing else; change the two brand colors and the whole site reskins. Public
sites are static and never read a database live (a hydrated site is built from
one approved, immutable snapshot artifact). No brand is baked into the engine;
brand lives in per-site config by design. Proprietary (license UNLICENSED).
`README.md` is the full tour; this file is the working map;
[`docs/plans/roadmap.md`](docs/plans/roadmap.md) is the status of record (what
is shipped, what is planned, and the release discipline).

## Where things live

- `lib/config-schema.ts` - the typed per-site surface. Every capability a site
  can turn on starts as a type here.
- `components/sections/` + `components/SectionRenderer.tsx` - the section set.
  Adding a section: a type in the schema, a component in `sections/`, one line
  in the renderer.
- `lib/seo.ts` + `components/JsonLd.tsx` - the JSON-LD `@graph` machinery
  (Organization/LocalBusiness, WebSite, Service, BreadcrumbList, plus FAQPage,
  BlogPosting, and Product builders). `lib/services.ts` collects the one
  service list that feeds both the `@graph` and `lib/llms.ts` (`/llms.txt`).
- `tools/hydrate.mjs` - approved publish-profile snapshot (or bundle) to
  `site.config.ts`, behind the claims wall, the banned-phrase lint, and the
  claims trace. Its gates are `tools/hydrate.test.mjs` and
  `tools/hydrate.buildcheck.mjs`.
- `examples/` - `site-demo` (brochure + simple-commerce) and `elevator-demo`
  (elevator-contractor archetype, plus the hydration fixtures).
- `site.config.ts` at the repo root - the active-site seam. Engine code only
  ever imports `@/site.config`; repointing that one re-export switches the
  live site.
- `next.config.ts` at the repo root (renamed from `.mjs` at v0.24.1) - response
  headers (the baseline CSP, config-extendable via `security.connectSrc`,
  `lib/csp.mjs`) and the leadform-delivery build preflight
  (`lib/delivery-guard.mjs`, feedback #30a/#30c). `.ts`, not `.mjs`, on purpose:
  these checks need the active site config's real values at build time, and only
  Next's own `next.config.ts` pipeline (not plain Node) can load that TypeScript
  reliably at this repo's declared Node floor - see the file's own doc comment
  before changing how it resolves the active config.
- Design-system structural craft (R5, `docs/plans/riselynk-engine-unification.md`
  section 2.9): the `craft` config block (`oneLight` machine-room dark surface,
  `grain` dither, `fonts` self-hosted OFL pairing) and the `scrollNarrative`
  section. All brand-neutral and default OFF, derived from the two brand colors.
  `lib/theme.ts` maps `craft` to the `<html data-craft>` attribute the
  `[data-craft~="..."]` rules in `app/globals.css` key off; the OFL woff2 subsets
  live in `public/fonts/` (provenance `public/fonts/OFL.md`). The scroll narrative
  degrades to a static step timeline under no-JS / reduced-motion / narrow screens.

## Versioning contract

- Sites pin a tag. A live site's build is reproducible from its tag plus its
  config plus its assets.
- Releases are additive: a config valid at an older tag stays valid at a newer
  one.
- A breaking change is a major version bump plus a migration note.
- Upgrades roll per-site, with a preview build reviewed before promotion. No
  fleet-wide forced upgrade.

## Release gates (all green before a tag; current through v0.26.0)

- `npm run build` - the active demo builds clean.
- `npm run test:hydrate` - claims trace, banned-phrase lint (including the
  no-exclamation-marks rule, item #36), asset and article seams.
- `npm run test:contact` - the save-first contact/lead intake harness (R1),
  including the shared atomic rate limiter (v0.18.1 FIX 2) and the no-JS modal
  fold path (v0.16.0).
- `npm run test:lead-attribution` - lead-source attribution sanitizer
  (`lib/lead-attribution.mjs`): hostile UTM neutralization, referrer query-string
  drop (origin+path only), landing_path path-only, absent-stays-absent, form wiring,
  cookie-notice mention.
- `npm run test:blog` - the blog governance check (R2): the banned-phrase lint
  and a claims trace run over article bodies, failing on a banned phrase or an
  unattested claim. See the blog runbook below.
- `npm run test:seo` - the review/rating JSON-LD builders (`lib/rating-ld.mjs`),
  the SoftwareApplication + claims-walled Offer/AggregateOffer builders
  (`lib/offer-ld.mjs`, v0.13.0): the claims-wall guard (emit an AggregateRating
  only for a real, config-supplied rating) and the node shapes.
- `npm run test:trust` (v0.12.0) - the trust-strip / call-bar claims wall
  (`lib/trust.mjs`) and the `tel:` sanitizer.
- `npm run test:theme` (v0.14.0) - light/dark theme token parity, the WCAG-AA
  derive clamp (including the eyebrow token, item #11), back-compat, and the
  sheet invariants.
- `npm run test:celebrate` (v0.15.1) - the vendored-confetti config gate
  (`lib/celebrate.mjs`): feature detection, reduced-motion guard, offline
  graceful, nothing loads unless a site opts in.
- `npm run test:jsonld` (v0.18.0) - the JSON-LD shared-sink escape
  (`lib/jsonld-escape.mjs`).
- `npm run test:markdown` (v0.18.0) - the blog markdown-link
  attribute-injection fix.
- `npm run test:headers` (v0.18.1; connect-src wiring proof added v0.24.1) - the CSP +
  nosniff response-header gate, plus (v0.24.1) the config-extendable `connect-src`
  wiring against the REAL active site config: default-unchanged, extension, rejection.
- `npm run test:service-area` (v0.19.0) - the `serviceArea` section: the
  `collectServiceAreas` collector that feeds the visible list, the
  `areaServed` JSON-LD, and the `/llms.txt` line from one source, plus the
  legacy `business.serviceArea` back-compat seam.
- `npm run test:stars` (v0.19.0) - the visible star row and business-reviews
  block (`lib/stars.mjs`): the claims wall (no star without a real supplied
  rating) and the quantize/label math.
- `npm run test:content-gate` (v0.19.0) - the lead-capture content gate
  (`lib/content-gate.mjs`): the save-first ride through the shared intake, the
  gate-specific `source` tag, and the `gate.asset.href` scheme guard
  (https-only or a same-origin path, consistent with `wiring.portalUrl`).
- `npm run test:scaffold-copy` - the banned-phrase lint over the engine's OWN
  hardcoded JSX copy in `app/` and `components/` (item #36's actual fix), plus
  (v0.26.0) customer-facing string emitters in `lib/` (`llms.ts`, `trust.mjs`,
  `announcement.mjs`) and a vertical-term ban on those generic emitters: every
  other copy gate only ever reaches strings that flow through a config object,
  so this is the one gate that would have caught the checkout-success page and
  the elevator-copy llms.txt leak.
- `npm run test:icons` - the built-in icon set (`lib/icons.mjs`, item #12):
  every entry is well-formed path data; an unknown name resolves to `null`
  (fail-safe), never a broken icon.
- `npm run test:social` (v0.21.0) - the built-in social icon set + platform detection
  (`lib/social-icons.mjs`): every entry is well-formed path data; `socialPlatform` resolves
  label-first then href-hostname with a generic fallback and never throws on a malformed
  href; `socialIconPaths` never resolves an inherited/unknown value.
- `npm run test:brand-logo` (v0.22.0) - `lib/brand-logo.mjs`: header/footer logo
  resolution for every flag combination, the footer-only-once-it-has-its-own-asset
  coherence rule, the dark-variant gate on `themeEnabled`, and absent-field byte-identity.
- `npm run test:inline-links` (v0.22.0) - `lib/inline-links.mjs`: the escape pass, the
  http/https/mailto/tel/relative scheme allow-list, the `javascript:` and
  protocol-relative `//` rejects, and the FAQPage JSON-LD plain-text stripping parity.
- `npm run test:page-draft` (v0.22.0) - `PageConfig.draft`: nav/sitemap/service/area
  exclusion for a draft page, and absent-field byte-identity.
- `npm run test:story-graph` (v0.22.0) - `lib/story-graph.mjs`: the longest-path
  auto-layout (chains, diamonds, shortcuts, multi-source order), cycle safety (a trapped
  subset never crashes and withholds the animated current), and layout determinism.
- `npm run test:style-variant` (v0.22.0) - `lib/style-variant.mjs`: the `ribbon`/
  `editorial` honor map, absent/unknown-value byte-identity, and fail-closed resolution
  on malformed input.
- `npm run test:addons` (v0.22.0) - the `addons` add-on/priced-menu section: `lib/section-id.mjs`'s
  `resolveSectionId` (explicit-id and deterministic auto-suffix paths, so two `addons`
  sections on one page never collide on a DOM id) and `lib/offer-ld.mjs`'s
  `collectPricingTiers` decoupling (an `addons` section's items never reach the
  SoftwareApplication Offer/AggregateOffer JSON-LD, proven against an adversarial
  config too).
- `npm run test:hours` (v0.23.0) - the structured-hours seam (`lib/hours-ld.mjs`,
  feedback #27): fail-closed validation (one malformed entry withholds the whole
  schedule), byte-exact `openingHoursSpecification` and emergency `ContactPoint`
  shapes (the claims wall: flag + phone or nothing), the display-line formatting, and
  absent-field byte-identity.
- `npm run test:gallery` (v0.24.0) - `lib/gallery.mjs`: the caption-less byte-identity
  precondition, verbatim captions, malformed before/after pairs dropped individually
  (fail-safe by documented choice, never a partial figure), label defaults/overrides,
  and never-throws on a malformed section.
- `npm run test:schema-type` (v0.24.0) - `lib/business-type.mjs`: every allowlist entry
  self-resolves reference-equal, the isLocal gate, fail-closed coverage (unknown, case,
  padding, lookalike, non-string), the frozen list, and byte-identity of the fallback
  `@type` expression when the field is absent or invalid.
- `npm run test:service-page` (v0.24.0) - `lib/service-page-ld.mjs`: byte-exact Service
  node shapes, the falsy-url gate (domain-less preview emits nothing), and the claims
  wall via the shared `withRatingLd` guard (no real rating, no `aggregateRating`).
- `npm run test:lead-fields` (v0.24.0) - the `LeadField`/`formFields` seam end to end
  through the real `lib/contact-intake.mjs`: canonical-column mapping, custom fields
  folding into the saved message, checkbox-group multi-value survival, and the classic
  `Section.fields` path proven untouched.
- `npm run test:csp` (v0.24.1, feedback #31a) - `lib/csp.mjs`: the connect-src
  origin-shape validator (https-only, no path/query/hash, no wildcard), the
  accept/reject/dedupe partition, and the additive-default directive builder.
- `npm run test:delivery-guard` (v0.24.1, feedback #30a/#30c) - `lib/delivery-guard.mjs`:
  the placeholder-shape matcher, the leadform/contact section walk (draft pages
  excluded), the WARN-vs-FAIL production-intent gate, and the delivery-wiring signal
  across the RESEND_API_KEY/LEADS_ENDPOINT presence matrix.
- `npm run test:announcement` (feedback #26) - `lib/announcement.mjs`: the sitewide
  announcement bar's fail-closed window math (parseBound, inclusive start/end,
  auto-hide outside the window), the configured gate, resolveAnnouncement's defaults
  and per-announcement dismissal key, and the claims-wall integration (the text and
  link label run through the engine's canonical `lintString` the way next.config.ts
  does at build time, so a claims-violating announcement FAILs the build).
- `npm run test:analytics` (trust pack) - `lib/analytics.mjs`: Cloudflare Web Analytics
  beacon resolution, cookieless cookieNotice posture, and CSP script-src/connect-src
  extras only when `analytics.cloudflareToken` is set.
- `npm run test:ai-robots` (trust pack) - `lib/ai-robots.mjs`: training vs citation
  crawler lists, `seo.aiCrawlers` split/block robots rules, and TDM/noai meta helpers.
- `npm run test:turnstile-forms` (trust pack) - every email intake form wires Turnstile;
  server-side fail-closed XOR; readiness WARN when siteKey is missing.

- `npm run test:read-time` (v0.25.0) - blog read-time banner math (`lib/read-time.mjs`).
- `npm run test:directory` (v0.25.0) - dense `directory` section wiring.
- `npm run test:llms-emergency` (v0.26.0) - `/llms.txt` emergency tip is config-driven
  (`callBar.emergencyContext`): silence without context, trade-neutral frame with it,
  and no hardcoded elevator copy in `lib/llms.ts`.
- `npm run test:readiness` (v0.26.0) - go-live readiness linter (`tools/readiness.mjs`):
  completeness WARNs for unset high-value free fields; INFO for turnstile/analytics
  that need live keys or a paid product.
- `npm run test:image-size` (v0.26.0) - plain-Node image header parser
  (`lib/image-size.mjs`) plus the hero `<img fetchpriority=high>` / About
  width-height wiring (no `sharp`).
- `npm run build:hydrated` and `npm run build:hydrated:bundle` - both hydrated
  fixture configs (the bare v0.3.0 snapshot and the v0.4.0 bundle) build end
  to end.
- A rendered-output proof on both demos: swap the seam, build, and inspect the
  rendered pages, the `@graph`, and `/llms.txt` (the v0.5.0 release practice).

A release is all gates green, an annotated tag, and an authorized push (see
Internal below). Docs-only changes ride `main` untagged; sites pin tags, so
consumers see only releases.

## Copy discipline (engine default; the hydrator lints it)

- No em or en dashes.
- Never "compliant", "certified", "inspection-ready", or "meets the standard"
  as affirmative claims. No guarantees.
- Code-requirement wording is hedged to the authority having jurisdiction.
- Nothing invented: no claim, service, credential, hour, or coverage a
  business did not provide.
- Blog articles are client-facing copy: author them through the blog runbook
  (`docs/plans/blog-runbook.md`) - walled to attested facts, finished through
  the `copy-editor` subagent, gated per article. `npm run test:blog`
  (`tools/blog-check.mjs`) lints and claims-traces article bodies.

## Consumption contract

Consumers never patch the engine site-side. A site is config + assets + a
pinned tag; anything the engine lacks is filed as feedback in the consumer
repo's engine-feedback doc, lands here as an engine release, and rolls out at
the next per-site upgrade. One engine, many sites, zero forks.

## Internal (Maxwell)

Everything below is Maxwell-internal; strip this section for any public
release and the rest of the file stands alone.

- Global conventions auto-load from `~/.claude/CLAUDE.md` plus the workspace
  and portfolio `CLAUDE.md`s; this file is site-engine specifics only. Route
  customer-facing copy through the shared `copy-editor` subagent.
- Two storefronts consume this one engine: **RiseLynk tenant sites** (hydrated
  from approved publish-profile snapshots; design of record: RiseLynk
  `docs/specs/site-engine-hydration.md` and
  `docs/plans/tenant-web-presence-and-seo.md` section 5.2) and **Kitsap
  Component client sites** (hand-authored configs). A feature built for one
  storefront reaches the other at a version bump.
- Founder gates: the founder authorizes every push. Commit with
  `git commit --only <paths>` (one writer per repo) and the standard trailer,
  per the workspace `CLAUDE.md`.
