# site-engine - project guide for Claude Code

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

## Release gates (all green before a tag)

- `npm run build` - the active demo builds clean.
- `npm run test:hydrate` - claims trace, banned-phrase lint, asset and article
  seams.
- `npm run test:contact` - the save-first contact/lead intake harness (R1).
- `npm run test:blog` - the blog governance check (R2): the banned-phrase lint
  and a claims trace run over article bodies, failing on a banned phrase or an
  unattested claim. See the blog runbook below.
- `npm run test:seo` - the review/rating JSON-LD builders (`lib/rating-ld.mjs`):
  the claims-wall guard (emit an AggregateRating only for a real, config-supplied
  rating) and the AggregateRating / Review node shapes.
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
