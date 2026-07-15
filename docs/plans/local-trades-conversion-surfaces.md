# Local-trades conversion surfaces (README correction, visible reviews with stars, service-area section)

Status: session spec, 2026-07-14. Covers deliverables 1-3 of the local-trades
conversion batch. Deliverable 4 (the lead-capture content gate) has its own spec,
`lead-capture-content-gate.md`. Each deliverable ships on its own feature branch,
additive and default OFF, off site-engine main at a3f7c5a (v0.18.1).

## Shared ground rules (apply to every deliverable)

- Additive only, default OFF. A config that does not opt in renders byte-identical
  output. This is the engine versioning contract and it is proven, not assumed
  (see "Byte-identical proof" below).
- No demo or fixture config is edited in these branches. The five examples/ configs
  and the two hydration fixtures stay byte-for-byte as they are, so the regression
  proof compares like with like. Showcasing the new sections in a demo is an
  integration follow-up for the Architect.
- Copy discipline: no em or en dashes anywhere (docs included); no "compliant",
  "certified", "inspection-ready", or "meets the standard" as affirmative claims;
  nothing invented. The claims wall applies to stars exactly as it applies to the
  rating JSON-LD: the engine never synthesizes a star value, a review, or an area.
- New pure logic follows the lib/rating-ld.mjs pattern: a dependency-free .mjs the
  TypeScript app imports AND a plain-Node tools/*.test.mjs gate drives directly.
- Commit with `git commit --only <paths>`. No commit trailer. Never push main.

## Byte-identical proof (run per deliverable, as it finishes)

Baseline is captured at a3f7c5a and the proof re-runs after the change:

1. Pure surface: dump `siteGraphLd()` JSON and `buildLlmsTxt()` text for all seven
   existing configs (site-demo, elevator-demo, craft-demo, software-demo,
   theme-demo, hydrated snapshot, hydrated bundle; the hydrated pair generated
   fresh by tools/hydrate.mjs). Raw byte diff against baseline MUST be empty.
2. Rendered surface: `npm run build` for elevator-demo (the committed seam) and
   site-demo (via SITE_CONFIG_PATH), then diff every prerendered .html and .body
   file under .next/server/app against baseline after normalizing only the
   legitimate build churn: content-hash asset names, the build id (dash and
   underscore forms), and the sitemap's build-time lastmod stamps (config-supplied
   midnight-precision dates stay exact). The normalized diff MUST be empty; if a
   code addition churns bundler module ids inside script payloads, the fallback
   check strips script element bodies and the remaining rendered DOM MUST be
   byte-identical, with the script-payload delta explained in the PR.
3. Gates: the full existing battery stays green: `npm run build`, `test:hydrate`,
   `test:contact`, `test:blog`, `test:seo`, `test:trust`, `test:theme`,
   `test:celebrate`, `test:jsonld`, `test:markdown`, `test:headers`,
   `build:hydrated`, `build:hydrated:bundle`, plus the deliverable's new gate.

## Deliverable 1: README correction (docs only)

Problem: README.md still frames the trust strip and the call bar as
elevator-archetype features. The archetype list ("Elevator-Contractor (v0.2.0,
adds) ... trustBar ... plus the persistent emergency callBar") and the feature
matrix rows read as if a plain trade cannot use them. Since v0.12.0 both are
brand-neutral and config-driven for any trade: the claims wall lives in
lib/trust.mjs, the elevator-specific copy moved into per-site config, and the
`test:trust` gate covers the defaults.

Change (README.md only):

- In the archetype list, keep the historical fact (both shipped with the
  elevator archetype at v0.2.0) and add the current fact (generalized
  brand-neutral for any trade at v0.12.0; the engine default ships zero trade
  claims; any site may enable `trustBar` and `site.callBar`).
- Update the feature-matrix rows for the trust bar and the call bar to say they
  are brand-neutral for any trade since v0.12.0.
- Cite examples/site-demo as the plain-trade reference: it already exercises
  trustBar, callBar, testimonials, and business rating data on a general
  local-trade brochure.

Acceptance criteria:

- [ ] Diff touches README.md and nothing else.
- [ ] States the v0.12.0 generalization and names lib/trust.mjs and the
      `test:trust` gate.
- [ ] Cites examples/site-demo as the plain-trade reference.
- [ ] Every statement is true of the code as it exists (no invented capability).
- [ ] No em or en dashes introduced; no banned phrases.

## Deliverable 2: visible reviews with stars

Today the engine emits claims-walled AggregateRating / Review JSON-LD from
`business.rating` and `business.reviews` (lib/rating-ld.mjs), but nothing renders
those facts to a human. Testimonials renders config quotes with no rating surface.

New surfaces (all opt-in):

- `lib/stars.mjs` (pure, dependency-free, JSDoc-typed):
  - `starModel(value, best = 5)`: clamps to [0, best], quantizes to half-star
    steps, returns `{ value, best, full, half, empty }`; returns `null` for a
    non-finite value, a non-positive best, or value <= 0 (claims wall: no stars
    for data the config did not supply).
  - `starAriaLabel(value, best = 5)`: the accessible text, "Rated 4.8 out of 5".
  - `ratingSummaryLine(rating)`: "4.8 out of 5 from 63 reviews" from a RatingFacts
    object; returns `null` unless `ratingIsValid(rating)` (imported from
    ./rating-ld.mjs so the claims-wall gate stays in one place).
- `components/StarRating.tsx`: server component (no client JS). Renders the star
  row as inline SVG from `starModel`; `role="img"` with `aria-label` from
  `starAriaLabel`; stars take the accent brand color via the existing CSS token
  system (two-color contract, no baked color). Renders nothing when `starModel`
  returns null.
- Testimonials wiring, two independent opt-ins in `components/sections/Testimonials.tsx`:
  1. Per-quote stars: `quotes[]` items gain optional `rating?: number`. A quote
     that carries a rating renders a StarRating with it; a quote without one
     renders exactly as today.
  2. Live business-reviews block: a testimonials section may set
     `showBusinessReviews?: boolean`. When true it renders, after any configured
     quotes: (a) a rating summary line with stars, only when
     `ratingIsValid(business.rating)`; (b) the `business.reviews` items as quote
     cards (author, per-review stars, body when present, date when present).
     Optional `maxBusinessReviews?: number` caps the listed reviews (default all).
     With no valid rating and no reviews the flag renders nothing extra.
- Schema (lib/config-schema.ts): `rating?: number` on the testimonials quote
  shape; `showBusinessReviews?: boolean` and `maxBusinessReviews?: number` on
  Section. All optional, additive, commented with the claims wall.

New gate `npm run test:stars` (tools/stars.test.mjs, plain Node):

- Clamp and quantize: 4.24 -> 4 full 0 half, 4.25 -> 4 full 1 half, 4.75 -> 5
  full (round half up at the .75 boundary to the next full), 6 with best 5 -> 5
  full, negative and 0 -> null.
- Invalid input: undefined, NaN, Infinity, best <= 0 -> null.
- `starAriaLabel` exact strings, including a non-default best.
- `ratingSummaryLine`: valid rating -> exact string; missing rating, zero count,
  non-finite value -> null (claims wall).
- Total star count is always `best` (full + half + empty).

Acceptance criteria:

- [ ] `npm run test:stars` exists and passes; every case above covered.
- [ ] StarRating renders no markup when the model is null; never a default value.
- [ ] Both demo configs (which already carry business.rating, business.reviews,
      and testimonials sections WITHOUT the new flags) build byte-identical per
      the proof protocol: the stars surface is reachable only through the new
      opt-in config.
- [ ] JSON-LD output unchanged for all seven configs (the stars read the same
      claims-walled fields; they change nothing in the graph).
- [ ] Full existing gate battery green.
- [ ] No em or en dashes in any copy or comment; star strings carry no claims.

## Deliverable 3: service-area section

Today the service area is one free-form string, `business.serviceArea`, emitted
as a single Place on the Organization/LocalBusiness node and on every Service
node, and printed in llms.txt. There is no visible service-area surface and no
structured multi-area support.

New surfaces (all opt-in):

- `lib/area-ld.mjs` (pure, dependency-free, JSDoc-typed):
  - `collectServiceAreas(site)`: walks every page's sections; for each section of
    type "serviceArea", collects its `areas[]` entries; dedupes by normalized
    (trim, lowercase) name, first occurrence wins; preserves order. Returns
    `{ name, note? }[]`.
  - `areaServedLd(serviceArea, areas)`: the back-compat seam. When `areas` is
    empty or absent: returns exactly `{ "@type": "Place", name: serviceArea }`
    when the string is set, else `null` (this is the CURRENT inline logic in
    lib/seo.ts, preserved byte-for-byte including key order). When `areas` is
    non-empty: returns an array of `{ "@type": "Place", name }` nodes, one per
    collected area (structured wins over the string; no merge).
  - `areasLine(areas)`: "Riverton, Fairview, Cedar Falls" for llms.txt; null when
    empty.
- lib/seo.ts: `organizationLd` and `serviceLd` replace their inline
  `if (b.serviceArea)` blocks with the `areaServedLd(b.serviceArea,
  collectServiceAreas(site))` result when non-null. For every existing config
  (no serviceArea sections) the emitted JSON is byte-identical.
- lib/llms.ts: when `collectServiceAreas` is non-empty, ONE added line in the
  Contact block, after the existing lines and before the closing blank:
  `- Areas served: <areasLine>`. Nothing else in the file moves. Existing
  configs (no sections) produce byte-identical llms.txt.
- Schema (lib/config-schema.ts): SectionType gains "serviceArea"; Section gains
  `areas?: { name: string; note?: string }[]`. Section heading/subheading/body
  are reused for the visible copy.
- `components/sections/ServiceArea.tsx` + one line in SectionRenderer: renders
  heading/subheading/body plus the areas as a brand-neutral list (name, with the
  note as supporting text when present). Renders nothing when `areas` is empty
  or absent (mirrors the modGallery discipline). Server component, no client JS.

New gate `npm run test:service-area` (tools/service-area.test.mjs, plain Node):

- Legacy passthrough: `areaServedLd("Serving King County", [])` stringifies to
  exactly `{"@type":"Place","name":"Serving King County"}` (key order asserted
  via JSON.stringify equality).
- Null when neither the string nor areas exist.
- Structured mode: areas produce the array of Place nodes in collected order;
  structured wins when both exist.
- Collector: walks multiple pages and multiple serviceArea sections; dedupes by
  normalized name (first wins); preserves order; ignores sections of other types
  and serviceArea sections with no areas.
- `areasLine` joins names with ", " and is null for empty.
- A fixture config with NO serviceArea sections run through the real
  `siteGraphLd` and `buildLlmsTxt` (via the same import path the app uses, or an
  equivalent plain-object fixture through areaServedLd) matches the pre-change
  shape.

Acceptance criteria:

- [ ] `npm run test:service-area` exists and passes; every case above covered.
- [ ] @graph and llms.txt BYTE-IDENTICAL for all seven existing configs (raw
      diff, no normalization), per the proof protocol. This is the headline
      requirement.
- [ ] Rendered HTML for both demo seams byte-identical per the proof protocol.
- [ ] A scratch config (not committed) with a serviceArea section builds and
      renders the section, emits the Place array on the org node and every
      Service node, and adds the llms.txt line; evidenced in the PR body.
- [ ] Full existing gate battery green.
- [ ] No em or en dashes; the section invents no coverage claim (areas are
      config-supplied copy, rendered verbatim).

## Out of scope (recorded as follow-ups, not built here)

- Showcasing stars / serviceArea in a demo config (Architect integration).
- README feature-matrix rows for the new sections (ride the release notes).
- Programmatic per-city pages (roadmap decision 5 folded them into a future
  release; the serviceArea section is deliberately just the visible + structured
  surface).
- CLAUDE.md release-gates list gains test:stars / test:service-area at
  integration time (avoids three branches editing the same lines).
