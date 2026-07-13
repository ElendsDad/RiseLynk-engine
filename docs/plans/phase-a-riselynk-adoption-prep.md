# Phase A preparation: mapping riselynk.com onto the engine as config

Status: PREPARATION (analysis only). Written 2026-07-12. This doc changes nothing:
it does not build the cutover, does not touch riselynk.com's hosting, and does not
edit the engine. It is the ahead-of-time map for Phase A of the unification program
(`docs/plans/riselynk-engine-unification.md` section 2.10), so the eventual cutover is
fast and free of surprises.

The concrete input is the founder's design bundle at
`RiseLynk/design-bundle/design_session_2026-7-12/website/` (the 2026-07-12 redesign of
riselynk.com) plus its `docs/` (`design.config.json`, `design-language.md`,
`website-spec.md`, `favicon.svg`). The engine baseline is origin `main` at v0.10.0
(`lib/config-schema.ts`, the section set, `lib/seo.ts`, `lib/theme.ts`) plus R5's craft
staged on branch `agent/r5-design-craft`.

## 0. The one fact that reframes everything

The live public site (`RiseLynk/apps/landing/index.html`) that R5 harvested from is the
**old dark-only machine-room design**: no theme toggle, `:root --bg:#0f1412` (dark), spec
`RiseLynk/docs/specs/landing-machine-room-craft.md`. R5's craft (`craft.oneLight`, a static
dark surface derived from the two brand colors) is a faithful port of exactly that site.

The design bundle is a **newer redesign that is light-first with a dark toggle**:
`<html data-theme="light">`, a pre-paint boot script reading `rl_theme` / `prefers-color-scheme`,
a full `[data-theme="dark"]` palette override throughout, a `<meta name="theme-color">` swap,
and a closing "dusk" band. `design.config.json` states it plainly: "dark mode IS the old
machine-room identity, light mode is the enterprise daylight version," default "light on
marketing site."

So the target moved. R5 delivers the machine-room look as the site's *only* surface; the
bundle wants that same look as the site's *dark theme*, with a new light theme as the default.
Everything downstream in this doc follows from that gap.

---

## 1. Section-by-section map (riselynk.com + design bundle -> engine `site.config.ts`)

Source structure is the bundle homepage section map and page map in `docs/website-spec.md`.
"Maps to" names the engine `SectionType` / config field that covers it today (`lib/config-schema.ts`).

### 1a. Homepage sections (in order, from `website-spec.md`)

| # | Bundle section | Maps to (engine today) | Clean? |
|---|---|---|---|
| 1 | `.progress` top scroll bar | R5 `ScrollNarrative` has an internal progress rail; no standalone global bar | Cosmetic gap (G10) |
| 2 | `nav` sticky blur, condense at 12px | `components/Header.tsx` renders nav from `navPages()`; no condense/blur-on-scroll | Mostly (G10) |
| 3 | `.hero` kicker + H1 accent + 3 CTAs + schematic hero-viz | `hero` section: `heading`/`subheading`/`ctaLabel`/`ctaHref` + `backgroundUrl` | Partial. Hero supports ONE CTA; bundle has three. Hero-viz art is bespoke (G5) |
| 4 | `#see-it` pinned scroll story, 5 scenes, scene 5 = `media/portal-ad.mp4` | R5 `scrollNarrative` section (`scenes[]`, image + video per scene, degrades to stacked timeline) | Clean once scenes are authored as config |
| 5 | `#features` grid + animated minis + flagship + SOON cards | `services` (card grid) or `summary` (points) | Partial. Cards map; animated minis + SOON/flagship treatments are bespoke (G9) |
| 6 | `#edges` four differentiators | `summary` (answer-first `points[]`) or `services` | Clean |
| 7 | `#faq` native accordion, JSON-LD verbatim | `faq` section (FAQPage JSON-LD mirrors `faqs[]` by construction, `lib/seo.ts faqPageLd`) | Clean |
| 8 | `#contact .final` closing CTA row | `cta` section (`CTABanner`) | Clean, minus the dusk treatment (G8) |
| 9 | `#newsletter` double opt-in field | Nothing. Newsletter is DROPPED from the harvest (founder decision, plan amendment 2026-07-12) | Remove on cutover (G11) |
| 10 | `footer` legal name + app links | `components/Footer.tsx` (business name, socials, nav) | Clean |
| 11 | `#suScrim` request-access modal lead form | `leadform` / `contact` are inline only; no modal, fixed field enum | Gap (G6) |

### 1b. Pages (from the `website-spec.md` page map)

| Bundle page | Maps to (engine today) | Clean? |
|---|---|---|
| `pricing/` public price book (plan cards) | `PageConfig` + sections; `products` is commerce, not a SaaS plan table | Gap: no plan-comparison section (G4) |
| `contact/` lead intake -> `contact-submit` | `PageConfig` + `contact`/`leadform` + R1 save-first hardening | Clean, minus the rich RiseLynk field set (folds into G6) |
| `blog/` + 3 articles | `blog.articles[]` (markdown or GEO blocks) + R2 authoring governance runbook | Clean |
| `resources/` guides index | `PageConfig` with `about`/`services`/`gallery` sections | Mostly clean |
| `privacy/`, `portal-privacy/`, `cookies/` legal | `PageConfig` with an `about` section `body` (markdown via `lib/markdown.ts`) | Mostly clean (prose pages) |
| `pitch/` slide deck (11 JPGs + PDF) | Out of scope; stays a linked static artifact (already excluded from the bundle) | Not an engine surface |
| `llms.txt`, `robots.txt`, `sitemap.xml` | `lib/llms.ts`, `app/robots.ts`, `app/sitemap.ts` | Clean |

### 1c. Brand tokens, craft, and head assets (`design.config.json` -> engine)

| Bundle input | Maps to (engine today) | Clean? |
|---|---|---|
| `brand.colors.green` (`#0c6b52` light / `#5dcaa5` dark) | `brand.colors.primary` / `accent` (two-color contract, `lib/theme.ts themeVars`) | Two colors map; the full palette does not (G2) |
| `themes.light` + `themes.dark` (~20 tokens each) + toggle | Nothing. The two-color contract derives one surface; v0.7 theme toggle is locked but NOT built | Gap (G1, G2) |
| `themes.dusk` closing band | Nothing (section variant) | Gap (G8) |
| `fonts.display` Barlow 600/800 + `fonts.mono` Plex Mono 500 (self-hosted OFL woff2) | R5 `craft.fonts` (same faces already in `public/fonts/`, preloaded, zero third-party) | Clean |
| `grainOpacity` 0.03 light / 0.05 dark | R5 `craft.grain` (inline SVG data URI dither) | Clean (tuning per theme is part of G1) |
| One-light machine-room backdrop | R5 `craft.oneLight` (static dark surface) | Maps as the DARK theme only (G1) |
| `favicon.svg` | `brand.faviconUrl` (v0.10.0, wired in `app/layout.tsx`) | Clean |
| `apple-touch-icon.png` | `brand.appleTouchIconUrl` (v0.10.0) | Clean |
| `theme-color` meta swap (`#fafaf7` / `#0f1412`) | Nothing (tied to the toggle) | Gap (rides G1) |
| Cookie notice (`cookie-notice.js`) | `site.cookieNotice` (R1, palette reads the two-color contract) | Clean |
| Motion signatures: aurora, hero tilt, magnetic CTA, hero parallax, underline draw | R5 harvested only scroll-narrative/one-light/grain/fonts | Gap (G7) |
| `canvas-confetti@1.9.3` via jsdelivr CDN | Engine discipline is zero third-party requests | Decision (G12) |

### 1d. SEO `@graph`

The bundle emits Organization + WebSite + **SoftwareApplication** (featureList mirrors the
feature grid) + FAQPage. The engine (`lib/seo.ts`) emits Organization/LocalBusiness + WebSite +
Service-per-line + FAQPage + BlogPosting + Product + BreadcrumbList. There is **no
SoftwareApplication builder**, and RiseLynk is a software vendor, not a `brochure` or
`elevator-contractor` archetype. Gap (G3).

---

## 2. Gap list (bundle items the engine cannot yet express -> proposed backlog)

Ranked by whether the cutover is blocked. Effort is rough (Low = a config field + a bit of CSS;
Medium = a section type + renderer + schema; Medium-High = a release-sized capability). Each is
an additive engine release under the versioning contract, proven on Kitsap surfaces first
(harvest-first discipline), before riselynk.com depends on it.

| ID | Gap | Why the bundle needs it | Effort | Blocks cutover? |
|---|---|---|---|---|
| G1 | **Light/dark theme toggle + dual per-theme palette** (the v0.7 reserved slot, design locked 2026-07-11 but not built) | The bundle is light-first with a dark toggle, a `theme-color` swap, and a pre-paint boot script. R5 gives a single static dark surface, the opposite. This is the spine of the redesign | Medium-High | YES |
| G2 | **Extended brand token surface** | `design.config.json` specifies ~20 tokens per theme (bg2, card, card2, line, line2, ink, dim, faint, greenHover, greenWash, danger, status pairs, glass, shadows). The two-color contract (`themeVars`) cannot reproduce these by derivation without visible loss | Medium | YES (for parity) |
| G3 | **Software-product archetype + SoftwareApplication JSON-LD** | RiseLynk sells software; it is neither `brochure` nor `elevator-contractor`. Bundle emits a SoftwareApplication node with featureList; engine has no such builder or archetype | Medium | YES (SEO parity) |
| G4 | **Pricing / plan-comparison section type** | The `pricing/` page is a SaaS price book with plan cards and a "hot plan" price flourish; `products` is e-commerce, not plan tiers | Medium | YES (page parity) |
| G5 | **Multi-CTA hero + schematic hero-viz slot** | Bundle hero has three CTAs (demo, request-access modal, open app) and a bespoke dispatch-board/phone/proof-chip composition with a hoistway-rail motif. Hero schema is one CTA + a background image | Medium (multi-CTA Low; the viz is a per-site illustration slot or raw SVG) | YES (hero parity) |
| G6 | **Modal lead form + configurable rich fields** | Request-access is a focus-trapped modal with company/units/state/seats/equipment fields and staged validation. Engine `leadform` is inline with a fixed field enum (`phone`/`service`/`preferredTime`/`message`) | Medium | Partial (a non-modal inline form is a graceful downgrade) |
| G7 | **Motion signature pack** (aurora, hero tilt, magnetic CTA, hero parallax, underline draw) | Bundle micro-interactions beyond what R5 harvested. All reduced-motion guarded | Medium (CLS/LCP risk) | No (polish; site works without them) |
| G8 | **Dusk closing-band section variant** | The final CTA/footer descends into the machine-room dark in both themes. A deliberate brand callback | Low-Medium | No (a plain closing section works) |
| G9 | **Feature-card animated minis + SOON/flagship treatments** | The `span2` cards with sync-line and Lynk-bubble minis, the flagship MCP card, and the SOON tags | Low-Medium | No (static cards work) |
| G10 | **Global scroll-progress bar + nav condense-on-scroll** | Top progress bar and 64->56px nav condense | Low | No (cosmetic) |
| G11 | **Newsletter section + confirm/unsubscribe pages** | Present in the bundle but DROPPED from the harvest (founder decision). NOT an engine feature | N/A (remove) | Action, not a build |
| G12 | **`canvas-confetti` CDN dependency** | A jsdelivr third-party request on request-access success; violates the engine's zero-third-party-request discipline | Low (drop) or founder decision | Decision |

G1 through G4 are the load-bearing ones: without them the redesign cannot render as config
without a visible downgrade. G5 and G6 are hero/lead parity. G7 through G10 are polish that can
land after cutover as later engine minors. G11 and G12 are decisions, not builds.

---

## 3. Phase-A entry gate + cutover sequence

### 3a. Entry-gate checklist (from plan sections 1.8, 1.7, 2.10)

1. **Craft parity (Lighthouse performance 99, CLS 0).** The plan's documented baseline is
   performance 99 / CLS 0 (`RiseLynk/docs/archive/roadmap-shipped-log.md`). R5's acceptance
   criterion holds the same bar, **but R5 proved it against the superseded dark-only design.**
   Craft parity must be **re-verified against the 2026-07-12 bundle** (light-first + toggle),
   which R5 does not yet cover. Status: NOT satisfied against the bundle until G1 lands and the
   engine build of the new design is measured. This is the key correction the prep test surfaced:
   craft parity is not "done", it is "done for the wrong (previous) design."
2. **Capability parity (R1, R2, R5 + features).** R1 (contact-intake hardening + cookie notice)
   BUILT and staged; R2 (blog governance runbook + `blog-check.mjs`) BUILT and staged; R5 (design
   craft) staged on `agent/r5-design-craft`; favicon + review/rating + honeypot shipped at v0.10.0.
   Newsletter (R3/R4) DROPPED, so capability parity explicitly excludes it. Status: partial. The
   R-phases are staged/held, not released, and the bundle needs G1 through G6 on top of R1-R5
   before "capability parity" means parity with *this* design.
3. **CI-enforced host separation.** NOT built. The public apex must stay its own Vercel project
   bound to `riselynk.com` by exact host, with the engine's Next.js / `@supabase/ssr` cookie
   surface provably kept off `.riselynk.com` and off any host shared with control / app / tenant,
   and a CI check that fails the build on a violation. Status: to build; demonstrate it failing on
   a deliberate violation before it counts.

### 3b. Cutover sequence (preview-first, reversible, host-separated per section 1.7)

1. **Close the blocking backlog (G1-G6) as additive engine releases**, each proven on Kitsap
   consumer builds via `tools/engine-build.mjs` (harborview-demo and, where the capability applies,
   ryan-dehart / ARK and kitsap-component) BEFORE riselynk.com depends on it. G7-G10 can follow
   after cutover.
2. **Build the CI host-separation gate** and demonstrate it failing on a deliberate violation.
3. **Author `riselynk.com` `site.config.ts`**: brand tokens from `design.config.json` (two-color
   contract + G2 extended tokens + G1 dual theme), sections mapped per section 1 above, craft
   enabled (`oneLight` as the dark theme, `grain`, `fonts`, `scrollNarrative` with the five scenes
   and `portal-ad.mp4`), favicon/apple-touch icons, cookie notice on. **Remove the newsletter
   section and its confirm/unsubscribe pages (G11).** Resolve G12 (drop confetti or self-host).
   All copy authored / finished through the `copy-editor` subagent (no em/en dashes, MCP-compliance
   language left exactly as written).
4. **Preview build on a `*.vercel.app` alias.** A domain-less build is auto-`noindex` draft
   (`lib/seo.ts isIndexable`), so the preview never lands in search. Verify against the bundle:
   Lighthouse performance 99 / CLS 0, every page, the contact round trip, and the reduced-motion +
   no-JS fallbacks (the scroll story degrades to a stacked timeline; captions match verbatim).
5. **Founder sign-off.** The bespoke `apps/landing` site stays live and reversible until sign-off.
6. **Repoint the `riselynk.com` apex** to the engine build (its own Vercel project, exact host,
   host separation CI green), with instant rollback to the bespoke site if anything regresses.

---

## 4. Verdict: does the design bundle express cleanly as config?

**Not yet, and the reason is specific and bounded.**

The *content skeleton* maps cleanly onto existing engine section types. Hero copy, the feature
grid, the differentiators, the FAQ (with verbatim JSON-LD), the closing CTA, the blog and its
three articles, the contact intake, the legal pages, the favicon and apple-touch icons, the cookie
notice, the self-hosted font pairing, the film-grain dither, the pinned scroll story with its five
scenes and its video, and the whole SEO surface (`@graph`, `/llms.txt`, sitemap, robots, canonicals)
all express as `site.config.ts` plus assets, using capabilities the engine already has (v0.10.0),
has staged (R1, R2, R5), or covers by construction.

What does **not** express cleanly is the thing the 2026-07-12 redesign is actually about: it is a
**light-first, dual-theme, product-marketing** site, and the engine was built for **single-surface,
two-color, local-trade brochure** sites. That mismatch is real bespoke work that must become engine
features first, not a config author's problem to hack around:

- The light/dark toggle with a full per-theme palette (G1, G2) is the spine of the design and does
  not exist in the engine; R5 built the opposite (a static dark surface). This is the single biggest
  finding, and it means the "craft parity = done via R5" line in the gate is optimistic: R5 hit the
  bar for the *previous* design.
- RiseLynk is a software vendor, so it needs a software archetype, a SoftwareApplication `@graph`
  node (G3), and a SaaS plan-comparison pricing surface (G4), none of which the trade-focused engine
  carries.
- The hero (multi-CTA + schematic viz, G5) and the modal request-access form with rich fields (G6)
  exceed the current hero and lead-form shapes.
- The newsletter section (G11) must be removed on cutover, and the confetti CDN dependency (G12)
  must be resolved against the zero-third-party discipline.

Net: the harvest-first strategy is working exactly as intended for the brochure-shaped parts, and
this prep pass turned the cutover from "unknown" into a bounded backlog of ten features and two
decisions, with G1-G4 as the true blockers. The honest recommendation is to treat G1 (the theme
toggle, already the locked-but-unbuilt v0.7) and G2-G4 as named engine releases proven on the Kitsap
surfaces, re-measure craft parity against the bundle rather than the superseded design, then run the
preview-first, reversible, host-separated cutover in section 3b. No surprises remain; the work is
scoped.

---

## Provenance

Grounded in: `docs/plans/riselynk-engine-unification.md` (sections 1.7, 1.8, 2.10 and the 2026-07-12
newsletter-drop amendment), `lib/config-schema.ts`, `lib/seo.ts`, `lib/theme.ts`,
`components/SectionRenderer.tsx` and `components/sections/` (engine main v0.10.0), the
`agent/r5-design-craft` branch (`lib/theme.ts` craft helpers, `components/sections/ScrollNarrative.tsx`,
`app/globals.css` `[data-craft]` rules, `public/fonts/`, the `CraftConfig` schema),
`docs/plans/engine-feature-backlog.md`, `RiseLynk/apps/landing/index.html` (the live dark-only site),
and the founder's design bundle
`RiseLynk/design-bundle/design_session_2026-7-12/` (`website/index.html`, `website/favicon.svg`,
`docs/design.config.json`, `docs/design-language.md`, `docs/website-spec.md`, `README.md`).
Preparation only; no engine or riselynk.com code changed.
