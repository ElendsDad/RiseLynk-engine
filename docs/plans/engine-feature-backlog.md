# site-engine feature-gap backlog (opportunity analysis)

A grounded, ranked list of engine capabilities that local service businesses
(plumbers, contractors, repair shops, trades: the Kitsap customer base) would
value but the engine does not have yet. This is **opportunity analysis**, not a
commitment. The status of record stays `roadmap.md`; an item here becomes real
only when it lands there as an additive release under the versioning contract.

- Written 2026-07-12 against tag context **v0.6.1** (`package.json` `0.6.1`).
- Every claim below traces to the code cited on the line. Nothing invented: where
  a capability already exists it is listed under "Already covered" so the founder
  does not pay to rebuild it.
- Ranked by value-to-local-business over effort. "Fits additive" means a config
  field plus, where relevant, one section type and one renderer line (the pattern
  in `CLAUDE.md` and `lib/config-schema.ts`), so the change is back-compatible and
  needs no major bump.

## Build status (first cut: staged 2026-07-12)

The suggested first cut landed as one additive engine release, staged on a worktree
branch and held for the founder's push authorization (the integrator assigns the
version at merge):

- **#1 Favicon / app-icon field: BUILT (staged).** `brand.faviconUrl` +
  `brand.appleTouchIconUrl`, wired into the document head (`app/layout.tsx`).
- **#2 Review + rating structured data: BUILT (staged).** `AggregateRating` /
  `Review` JSON-LD on the business (Organization/LocalBusiness) node and on Product
  nodes, config-driven and claims-walled (`lib/rating-ld.mjs`, `lib/seo.ts`).
- **#4 Contact-form spam shield: BUILT (staged).** Always-on honeypot on the
  contact and lead forms plus an off-by-default Cloudflare Turnstile option
  (`lib/contact-intake.mjs`, `components/Turnstile.tsx`).

Next up, the top of the not-yet-built list is **#7 Live Google Reviews (build-time
snapshot)**: with #2's `Review` / `AggregateRating` schema now in place, feeding it
from real Google reviews is the natural follow-on. See the reordered ranking below.

## How the ranking reads

- **Value**: how much a Kitsap-style trade or the founder gains (lead capture,
  local search, trust, time saved).
- **Effort / risk**: rough build size and how much it strains the static,
  never-read-a-DB-live contract.
- **Fit**: "additive" (config + section, back-compatible) or "bigger" (new route
  generation, a build-time fetch, or a schema shape beyond one field).

---

## Ranked NEW opportunities

Original rank in the `#` column; `Status` reflects the first cut. The not-yet-built
items are ordered by current priority, so **#7 leads** now that #2 landed.

| # | Opportunity | Value | Effort/risk | Fit | Status |
|---|---|---|---|---|---|
| 1 | Favicon / app-icon field | High (every site) | Very low | Additive | BUILT (staged) |
| 2 | Review + rating structured data | High | Low | Additive | BUILT (staged) |
| 4 | Contact-form bot/spam shield | Medium-high | Low-medium | Additive | BUILT (staged) |
| 7 | Live Google Reviews (build-time snapshot) | High | Medium-high | Bigger | Not built (top of next) |
| 3 | Service-area section + multi-town `areaServed` | High (local SEO) | Medium | Additive | Not built |
| 5 | Captioned / categorized project gallery for trades | Medium | Low-medium | Additive | Not built |
| 6 | Per-service detail pages | High (programmatic SEO) | Medium-high | Bigger | Not built |
| 8 | Multi-location | Low for this base | High | Bigger | Not built |
| 9 | Native booking/scheduling backend | Low (embed already covers it) | High | Bigger | Not built |

### 1. Favicon / app-icon field (`brand.faviconUrl`)

> **BUILT (staged) 2026-07-12.** Added `brand.faviconUrl` + `brand.appleTouchIconUrl`,
> wired into `app/layout.tsx` (`Metadata.icons`). Additive: a config without them keeps
> Next's default favicon. Both demos opt in via a shared `public/favicon.svg`.

- **What**: a `brand.faviconUrl` field (or a documented `public/icon.png` +
  `public/favicon.ico` convention wired to `app/icon`) so a client's mark shows in
  the browser tab.
- **Why it matters**: today `brand` carries only `colors`, `font`, and `logoUrl`
  (`lib/config-schema.ts` lines 238 to 247), and no favicon convention is wired
  (grep for `favicon`/`app/icon` finds nothing). Every client site ships Next's
  default favicon regardless of brand. This is open consumer feedback (ARK build,
  `maxlynk-services/docs/engine-feedback-v0.5.0.md` item 14) that never made
  it onto `roadmap.md`, and the picture-to-icon intake already produces an icon set
  the engine then cannot render.
- **Effort/risk**: very low, additive, no schema break.
- **Fit**: additive. Highest value over effort in the list: it is small, already
  asked for, and every single site needs it.

### 2. Review and rating structured data on existing testimonials

> **BUILT (staged) 2026-07-12.** Added `RatingFacts` / `ReviewItem` types with `rating` +
> `reviews` on both `business` and `Product`. `AggregateRating` / `Review` JSON-LD now
> emits on the Organization/LocalBusiness node and per Product, config-driven and
> claims-walled in `lib/rating-ld.mjs` (`withRatingLd` emits only a valid, real rating;
> never a synthesized star). Scope note: the schema attaches to the business and product
> nodes (per the founder's cut), not to the visible testimonials markup.

- **What**: optional `rating` (and reviewer/date) fields on the existing
  `testimonials` quotes, plus a `Review` / `AggregateRating` builder in `lib/seo.ts`
  folded into the `@graph`.
- **Why it matters**: `components/sections/Testimonials.tsx` renders static quotes
  from config, and `lib/seo.ts` has no `Review` or `AggregateRating` node (grep
  confirms none). So a trade with real testimonials emits zero rating structured
  data, and search and AI answer engines have no star signal to show. Stars in the
  result are one of the strongest local-business click drivers, and the engine
  already leans hard into JSON-LD everywhere else.
- **Effort/risk**: low, pure-additive. Keep the claims wall: only emit ratings the
  config supplies, never synthesize a number.
- **Fit**: additive. Pairs naturally with #7 (live reviews feed the same nodes
  later).

### 3. Service-area section + multi-town `areaServed`

- **What**: a `serviceArea` section that lists the towns/neighborhoods a business
  covers, feeding `areaServed` as one `Place` per town (or a `GeoCircle`) and
  listing them in `/llms.txt`.
- **Why it matters**: today `business.serviceArea` is a single free-form string and
  `lib/seo.ts` (lines 80, 96) emits exactly one flat `areaServed` `Place` on the org
  and each Service. A map iframe exists but only inside the Contact section
  (`components/sections/Contact.tsx` line 66). Trades win local search on "plumber
  in <town>" phrasing; a named town list, visible and in structured data, is
  directly that. It also enriches `/llms.txt` so AI answers name the coverage.
- **Effort/risk**: medium. Additive (a section + a small `seo.ts` change to accept
  a town list). Watch honesty: list only towns the business gave.
- **Fit**: additive.

### 4. Contact-form bot/spam shield

> **BUILT (staged) 2026-07-12.** Always-on honeypot (`website` trap) on the contact and
> lead forms, dropped server-side in `lib/contact-intake.mjs` before any save or notify.
> Optional, off-by-default Cloudflare Turnstile (`security.turnstile.siteKey` + a
> server-env `TURNSTILE_SECRET`), verified in `verifyTurnstile` and rendered by
> `components/Turnstile.tsx`. Fails open on any inability to verify, so the R1 never-drop
> guarantee holds; a clean submit still saves.

- **What**: an always-on honeypot field on the lead/contact forms, with optional
  Cloudflare Turnstile (privacy-friendly, no-cookie) when a site wants it.
- **Why it matters**: the R1 hardening (staged, see CHANGELOG "Unreleased - R1")
  makes intake save-first and adds fail-open rate limiting, but there is no bot
  filter anywhere (grep for honeypot/turnstile/captcha finds nothing). A public
  trade lead form attracts form spam fast; a fail-open rate limit does not stop a
  bot, it only caps volume. A honeypot is near-free and catches most of it.
- **Effort/risk**: low-medium. Honeypot is trivial and additive; Turnstile adds a
  key and a verify step, optional per site.
- **Fit**: additive. Sequence it after R1 lands so it builds on the hardened
  receiver rather than the old path.

### 5. Captioned / categorized project gallery for trades

- **What**: captions and optional category tags on the general `gallery` section (or
  a light `portfolio` variant), so a fabricator or contractor can show "Driveway
  lantern, powder-coated steel" style work.
- **Why it matters**: `gallery` today is images plus alt text only
  (`config-schema.ts` line 129), and `modGallery` is framed for elevator work
  (before/after pairs keyed by `equipmentClass`, `Project` in `config-schema.ts`
  lines 90 to 97). A metal-fab shop like ARK, or a remodeler, wants a captioned
  portfolio grid, which neither section cleanly gives. This is the "show my work"
  surface most visual trades ask for.
- **Effort/risk**: low-medium, additive.
- **Fit**: additive.

### 6. Per-service detail pages

- **What**: generate one page per service line (from `contractorServices`
  `serviceLines[]` or `services` `items[]`) with its own `Service` JSON-LD,
  breadcrumb, and optional FAQ, instead of only rendering services as cards inside a
  section.
- **Why it matters**: `ServiceLine.href` exists (`config-schema.ts` line 65) but the
  target page must be hand-authored today; there is no generator. A page per service
  is a standard programmatic-SEO lever for trades (one indexable, linkable page for
  "drain cleaning", "water-heater replacement"), and the engine already has the
  Service node and breadcrumb builders to feed it.
- **Effort/risk**: medium-high. Bigger than a section: it is route generation
  (`app/[slug]` or a new segment) plus dedupe with the existing service collection
  in `lib/services.ts`.
- **Fit**: bigger. Worth it, but not a one-file additive.

### 7. Live Google Reviews (build-time snapshot)

> **Top of the not-yet-built list (2026-07-12).** Promoted now that #2 shipped: the
> `Review` / `AggregateRating` schema and the `business.rating` / `Product.rating` config
> surface are in place, so this becomes "feed those existing nodes from a real Google
> snapshot" rather than net-new schema. Still a dedicated release (needs a Places API key,
> a build-time fetch, a refresh cadence, and a Google-terms review before building).

- **What**: pull a business's Google reviews and rating at build/hydrate time via
  the Places API, snapshot them into config, and render them statically (feeding the
  #2 rating nodes). No live client-side fetch, so the static, never-read-a-DB-live
  contract holds.
- **Why it matters**: live, recognizable Google reviews are one of the top things a
  local business asks for, and the engine has only static testimonials today. Doing
  it at build time (not a runtime widget) keeps the public site static and keeps the
  reviews under the claims wall as an approved snapshot.
- **Effort/risk**: medium-high. Needs a Places API key, a fetch step (natural home
  is the hydrate/publish path, `tools/hydrate.mjs`), a refresh cadence, and a
  governance decision on displaying third-party review text. Risk: third-party
  content quality and Google terms for storing/displaying reviews; check before
  building.
- **Fit**: bigger. Sequence after #2 so the schema is already in place.

### 8. Multi-location

- **What**: an array of locations, a `LocalBusiness` node per location, and
  optional per-location pages.
- **Why it matters**: `business.location` is a single locality/region block today
  (`config-schema.ts` lines 231 to 236) and `isLocalBusiness` emits one org node.
  Real value for a chain, but the Kitsap base is overwhelmingly single-shop trades
  (harborview, ARK, kitsap-component are all single-location), so this is low value
  for the current customers and a meaningful build.
- **Effort/risk**: high. Bigger (schema shape, multiple org nodes, routing).
- **Fit**: bigger. Park until a real multi-location client appears.

### 9. Native booking/scheduling backend

- **What**: engine-owned appointment scheduling with availability and a datastore.
- **Why it matters / why it ranks low**: the `booking` section already renders a
  Cal.com/Calendly iframe from `bookingUrl` (`components/sections/Booking.tsx`),
  which covers the real need for nearly every local trade with zero backend. A
  native scheduler would directly contradict the "public sites are static and never
  read a database live" contract in `CLAUDE.md`, needs auth and a DB, and duplicates
  a solved third-party surface. Recommend keeping the embed as the answer and not
  building this unless a specific client truly needs owned scheduling.
- **Effort/risk**: high, and off-pattern.
- **Fit**: bigger, and against the static contract.

---

## Already covered (do NOT rebuild)

Grounded in the code; these were on the evaluation list but exist today.

- **Quote-request forms**: `leadform`, `requestService` (posts to `intakeUrl`, mailto
  fallback), the `contact` Resend form, and quote-only catalog mode (an unpriced
  `products` item with `ctaHref`/`quoteHref`) all ship. See `config-schema.ts` and
  the v0.6.0 entry in `roadmap.md`.
- **Booking/appointment scheduling**: covered by the Cal.com/Calendly embed
  (`components/sections/Booking.tsx`, `bookingUrl`). Only a native backend is
  missing, and that is deliberately out of pattern (item 9 above).
- **Privacy-friendly analytics**: `analytics.plausibleDomain` (privacy default) plus
  optional `gaId`, wired in `components/Analytics.tsx`.
- **Gallery/portfolio**: `gallery` (images) and `modGallery` (before/after projects)
  ship. The only gap is captions/categories for non-elevator trades (item 5).
- **Service-area map**: a Google Maps embed renders in the Contact section
  (`mapEmbedUrl`). The gap is a dedicated multi-town service-area surface and
  structured data (item 3), not the map itself.
- **Cookie notice**: informational banner ships (`site.cookieNotice`).

## Already planned (tracked in roadmap.md, not new)

Listed so this doc does not double-count them as opportunities.

- **Light/dark/system theme toggle** (v0.7 candidate, dark palette auto-derived from
  the two brand colors with a per-site override).
- **Eyebrow contrast token** (feedback item 11; rides with the theme work).
- **Built-in icon set for `services` items** (feedback item 12, cosmetic).
- **R1 contact-intake hardening + cookie notice** (built, staged, held for release).
- **R2 blog authoring governance runbook** and **R5 design-system structural
  capabilities** (`docs/plans/riselynk-engine-unification.md` phases).
- **Managed article-rail producer** (seeds `blog.articles[]`).
- **Client console / management layer** (permission-gated client editing), proposed
  at the portfolio level, not yet built.

## Decided against (do not build)

- **Hosted newsletter embed / stack**: explicitly dropped (commit `768cd83`,
  2026-07-12). The founder was the only subscriber; blog, changelog, and socials
  cover the channels, and there is to be no self-hosted subscriber DB. Phases R3/R4
  are retained in the plan for provenance only.

---

## Suggested first cut

**Done (staged 2026-07-12).** The recommended first batch shipped as one additive
release: **#1 favicon**, **#2 review/rating schema**, and **#4 honeypot** (see "Build
status" above) - all low effort, all pure-additive, each closing a real trust or hygiene
gap every trade site hits.

Next: **#7 live Google Reviews** now leads the not-yet-built list (it feeds the #2 schema
that just landed). **#3 service-area** is the next additive step up for local search. The
bigger bets (#6 per-service pages, #7 live reviews) are each worth a dedicated release and
should be sized in `roadmap.md` before starting.
