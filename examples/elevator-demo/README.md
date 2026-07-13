# elevator-demo

A fictional elevator and escalator service company (Summit Vertical Services) that proves
the v0.2.0 elevator-contractor archetype from one config file. This is the site the engine
builds by default at v0.2.0: the root `site.config.ts` seam re-exports this config.

## What it demonstrates

- **The elevator-contractor archetype, cumulative on brochure.** Contractor service lines
  (maintenance, repair, modernization, periodic testing), a trust-artifact bar (license,
  bonded, insured, years, brands, and a link to the state registry lookup), a request-service
  form wired to an intake path, and a customer-portal door, alongside the brochure sections.
- **The GEO / AI-answer pack.** An answer-first `summary` block, an `faq` section whose
  FAQPage JSON-LD mirrors the visible copy verbatim (single source in config), a
  LocalBusiness + Service `@graph` (emitted because `archetype` is `elevator-contractor`),
  and `/llms.txt` generated from this config and claims-walled.
- **The persistent emergency call bar.** Plain, entrapment-first copy; a plain branch-line
  number (`callBar.dispatchRouted: false`). Fixed to the bottom of every page.
- **The hosted blog.** One published article (answer-first summary + markdown body + FAQ)
  and one draft (carries `noindex`, kept out of the index and sitemap, reachable by URL).
- **The optional-section toggles, both directions.** `careers` and `records` are enabled and
  render; `modGallery` is present but `enabled: false`, so it emits no HTML. That off case
  is honest here because a fictional company has no real project photos to show.

## Claims discipline

Everything is fictional. Copy carries no em or en dashes, never says compliant, certified, or
inspection-ready, and hedges code-requirement wording to the authority having jurisdiction.
The registry link points at a real public lookup tool with an obviously fictional license
number, which is exactly how a real tenant site would wire it (their real registry, their
real license). These are engine defaults a tenant inherits, so they are claims-safe out of
the box.

## Notes

- Assets: the hand-written `site.config.ts` here references no photo files, so it builds with
  an empty `public/`. A real site drops logos and photos into `public/` and references them
  by path. For a hydrated site, the modernization images arrive as an artifact **bundle** and
  are resolved into `public/mods/` by the hydrator (see `v0.4.0-bundle/` below).
- **Hydration fixtures (two shapes).** `publish-profile.snapshot.json` is the v0.3.0 **bare**
  snapshot, retained as the backward-compat proof (gallery absent, empty blog). `v0.4.0-bundle/`
  is the v0.4.0 **bundle** fixture: a `snapshot.json` with a sibling `assets/` of paired
  before/after PNGs plus seeded articles. `npm run hydrate:bundle` and
  `npm run build:hydrated:bundle` drive it; `v0.4.0-bundle/README.md` has the details.
- Forms render and post, but only reach a real destination when the site sets its intake
  path and mail keys. Without them they degrade safely (the request form falls back to a
  mailto when `intakeUrl` is unset; the careers apply form uses that mailto fallback here).

## Start a new site from this

1. Copy this folder to your site's location.
2. Edit `site.config.ts` (business, brand colors, archetype, sections, blog) and drop assets
   into `public/`.
3. Point the root `@/site.config` seam at your config.
4. `npm run build` must pass before the site is done.
