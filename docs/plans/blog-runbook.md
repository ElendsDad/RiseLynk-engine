# The engine blog runbook (authoring governance)

How an article gets written, checked, and published on an engine site's hosted blog.
This is the governance harvested from RiseLynk's "prove it on ourselves" blog rail
(unification program Phase R2, `riselynk-engine-unification.md` section 2.6). It applies
to every engine blog: the elevator-demo, the Kitsap client sites, and eventually
riselynk.com. The point is simple: a blog article is client-facing copy that makes
factual claims, so it clears the same bars as everything else the engine ships, and the
claims are walled to what the business can actually attest.

This runbook is the process. The automated half of it is the blog governance check
(`tools/blog-check.mjs`), a named release gate (`npm run test:blog`). The two are meant
to be used together: the runbook is what a human does, the gate is what proves they did
it.

## What a blog article is (and is not)

An engine article lives in `blog.articles[]` (schema: `Article` in `lib/config-schema.ts`).
It is hosted-only, no external CMS. Its fields carry client-facing copy: `title`,
`description`, `eyebrow`, `lede`, `author`, the answer-first `summary`, the markdown
`body`, and `faqs`. Every one of those is prose a reader (and an AI answer engine, through
the `BlogPosting` and `FAQPage` JSON-LD) will treat as a factual statement from the
business. A `draft: true` article carries noindex and drops out of the index, but it stays
reachable at its direct URL for review, so a draft is governed exactly like a published one.

An article is not a place to introduce a new claim about the business. If a fact is not
already attested somewhere the business stands behind (its services, its credentials, its
publish profile), it does not get asserted in an article.

## The four rules

### 1. The claims wall: articles are walled to attested facts

Every factual assertion in an article must trace to something the business has attested.
Concretely, an article must not:

- Claim compliance or certification as settled fact ("compliant", "certified",
  "inspection-ready", "meets the standard"). These are the four banned compliance phrases;
  the engine treats them as unattested claims wherever they appear.
- Make a guarantee.
- State a code requirement as settled fact ("required by code", "up to code", "code
  requires", "brought to code"). Code wording is hedged to the authority having
  jurisdiction: say what depends on the jurisdiction and that the AHJ confirms what
  applies, never that the work "meets code".
- Invent a service, credential, hour, coverage, or capability the business did not provide.

When an article needs to touch a compliance or code topic, it hedges. The pattern the
demo articles use, verbatim: "Which tests apply, and how often, depends on what your
jurisdiction has adopted. Your authority having jurisdiction and your contractor confirm
what applies to your building." That sentence passes the wall; "our work meets the
standard" does not.

### 2. Every client-facing string finishes through the copy-editor

All article prose is routed through the shared `copy-editor` subagent before it is
committed, the same hand-off every public engine string takes. The copy-editor enforces
brand voice and the house rule that bans em and en dashes and marketing hype. The
copy-editor improves wording only; it never invents a claim or a capability. An author
drafts, the copy-editor polishes, and the result still has to clear the claims wall (the
copy-editor does not own the wall, the author and the founder gate do).

### 3. The banned-phrase lint and claims trace run over the article body

The copy discipline and the claims wall are enforced mechanically over article content by
the blog governance check, not left to a reviewer's eye. The check applies the engine's
one banned-phrase lint (the same regex set the hydrator runs, imported through the blessed
`tools/lint-config.mjs` surface) to every string leaf of every article: `title`,
`description`, `eyebrow`, `lede`, `author`, `summary.*`, `body`, and `faqs.*`. A banned
phrase or an unattested claim anywhere in an article body fails the run. It also writes a
per-article claims trace (byline, date, draft status, strings scanned, wall result) as
evidence the article cleared the wall. See "Running the check" below.

### 4. The per-article founder gate

No article publishes unnamed. The founder authorizes each article the same way he
authorizes every push and every production-facing action. "Publish" here means the article
moves from `draft: true` to published in the site config and the site is rolled forward at
its pinned tag with a preview. Staging an article for that gate is the author's job; taking
the gate is the founder's.

## The authoring gate, step by step

1. **Draft against attested facts.** Write the article from what the business has already
   attested. If a claim needs a fact the business has not provided, stop and get it
   attested first, or cut the claim.
2. **Hedge every code or compliance touch** to the AHJ, per rule 1.
3. **Run it through the `copy-editor` subagent** for brand voice and the dash/hype rules
   (rule 2).
4. **Run the blog governance check** (`npm run test:blog` for the fixtures, or the CLI
   against the site's own config, below). Fix every violation. The claims trace it writes
   is the evidence for the gate.
5. **Stage for the founder gate** (rule 4). Keep the article `draft: true` until he
   authorizes it.
6. **Publish on a per-site roll-forward:** flip `draft` off, rebuild the site against its
   pinned engine tag, preview, and promote. No fleet-wide change; one site at a time.

## Running the check

The gate is `tools/blog-check.mjs`. It reuses the one shared lint, so the blog gate can
never drift from the scaffold gate.

- **The release gate (fixtures + negative/positive proof):**

  ```
  npm run test:blog
  ```

  This is part of the engine's gate battery. It proves the lint and the claims trace run
  over real article prose (the hydrated v0.4.0 bundle), that the check fails on a seeded
  bad article (a banned phrase and an unattested claim), and passes on a clean one.

- **Checking a specific site's articles (the authoring flow):** point the CLI at a config
  or an articles JSON. It writes `blog-claims-trace.json` next to the input and exits
  non-zero on any violation.

  ```
  node tools/blog-check.mjs <config.json | articles.json> [--trace out.json]
  ```

  A hand-authored `.ts` site config (the Kitsap client path) is loaded by the consumer's
  own TypeScript pipeline; import `{ checkBlog }` from `tools/blog-check.mjs` and call it on
  the config object the pipeline already loaded, the same way `tools/lint-config.mjs` is
  used for whole-config lint.

## Cadence

The blog is a low-volume, high-trust rail, not a content mill. The cadence that fits the
harvest-first thesis:

- **Publish only when there is a real, attested thing to say.** One genuinely useful,
  claims-clean article beats a schedule filled with thin posts. A monthly-ish rhythm is a
  healthy target for a service business; an empty month is better than an unattested one.
- **Evergreen over timely.** The demo articles ("what to expect from a maintenance visit",
  "reading your service history") are evergreen explainers a building owner searches for.
  Those age well and keep earning; they are the model.
- **Every article carries a byline and a date** so the claims trace has an attestation
  surface, and the `BlogPosting` JSON-LD has an author and a published date.

## Out of scope for this runbook

The **managed article-rail producer** (the tooling that would generate article entries
automatically) is tracked separately on the roadmap backlog and is NOT part of this
governance. This runbook governs how an article, however it is authored, clears the gate.
When the rail lands, it produces drafts that then go through exactly this runbook; it does
not bypass it.

## Provenance

Harvested from RiseLynk's blog governance (the "prove it on ourselves" rail) per the
unification plan `docs/plans/riselynk-engine-unification.md` section 2.6. The copy
discipline it enforces is the engine default documented in `CLAUDE.md` and `roadmap.md`;
the lint it runs is the one implementation in `tools/hydrate.mjs`, exposed through
`tools/lint-config.mjs`. The automated gate is `tools/blog-check.mjs` with its proof
`tools/blog-check.test.mjs` (`npm run test:blog`).
