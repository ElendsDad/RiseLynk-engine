# RiseLynk and site-engine unification (design decision + phased plan)

Status: PLAN (approved approach; R1 building). Written 2026-07-12.
**AMENDMENT 2026-07-12 (founder decision): the NEWSLETTER is DROPPED.** RiseLynk's own newsletter is being removed (the founder was the only subscriber), and it is NOT harvested into the engine - no self-hosted subscriber DB for a newsletter; the blog + changelog + socials cover the channels. **Phases R3 and R4 are struck.** Revised sequence: **R1 (contact-intake + cookie notice) -> R2 (blog governance) -> R5 (design-system craft) -> A (riselynk.com adoption).** Section-2.11 open decision #1 (newsletter/lead data store) is MOOT - no Supabase project needed. Harvest item #1 (newsletter) is removed; items #2-#5 stand. The R3/R4 sections below are retained for provenance but are NOT to be built.
Owner: founder authorizes every phase; each release rolls under the engine's
existing release discipline (`roadmap.md`). This doc is planning only: no harvest
has been done, no engine or app code has been changed by it.

This is a companion to [`roadmap.md`](roadmap.md) (the status of record). The
roadmap stays the ledger of what is shipped; this doc is the design rationale and
the ordered release sequence for one specific program: folding the good parts of
RiseLynk's own marketing site into the engine, then eventually rebuilding
riselynk.com on that engine. When a phase below ships, its capability graduates
into the roadmap's "Shipped" section and this doc points there.

---

## Part 1 - Design decision

### 1.1 The two sites today (the drift problem)

- **riselynk.com** is bespoke, hand-authored static HTML in `RiseLynk/apps/landing`
  (about 14 self-contained files; the design system is copy-pasted into each). It is
  a high-craft site: it ships at Lighthouse performance 99 with CLS 0 (validated in
  `RiseLynk/docs/archive/roadmap-shipped-log.md`, spec
  `RiseLynk/docs/specs/landing-machine-room-craft.md`). It owns a real
  double-opt-in newsletter, a save-first contact intake, a claims-walled blog, and
  an informational cookie notice.
- **site-engine** (this repo, currently tag `v0.6.1`) is a config-driven Next.js 15 /
  React 19 / TypeScript engine: one codebase renders many local-business sites from a
  `site.config.ts` plus assets plus a pinned tag. It powers the Kitsap client sites and
  is consumed by `maxlynk-services` (formerly kitsap-website-creation) through ephemeral clone-at-tag
  (`tools/engine-build.mjs`).
- **They are disjoint: zero shared code.** The engine has already re-implemented much
  of RiseLynk's GEO/SEO idiom as parallel code (the `@graph`, `/llms.txt`, sitemap,
  canonicals, the claims-walled copy discipline). Two implementations of the same idea
  drift: a fix on one side does not reach the other.

### 1.2 Founder goal (approved): the bidirectional flywheel

One engine that upgrades both storefronts at once:

1. **Harvest** the good, portable parts of RiseLynk's own site INTO the engine, as
   additive engine releases.
2. **Eventually rebuild riselynk.com ON the engine**, so from then on every engine
   improvement upgrades BOTH the Kitsap client-site pipeline AND riselynk.com.

The engine is also the delivery vehicle for a new revenue line: Kitsap Component
website development plus maintenance. Every capability harvested here (a newsletter a
client can sell, a hardened contact intake, a managed blog runbook) becomes something
the Kitsap service can offer, not just RiseLynk plumbing.

### 1.3 Decision: Approach B (harvest-into-engine-FIRST, incremental)

**We harvest into the engine first, and move riselynk.com onto the engine last, only
after the engine clears RiseLynk's current craft bar.**

Rationale:

- **No capability loss on cutover.** RiseLynk's site already does things the engine
  does not (newsletter, save-first intake, the scroll narrative). Rebuilding first
  would move riselynk.com onto an engine that is missing those, a downgrade on day one.
- **Every harvest is proven on paying-customer surfaces before RiseLynk depends on it.**
  Each release is validated on the Kitsap demos and client builds (harborview-demo,
  ryan-dehart / ARK, kitsap-component) first. RiseLynk adopts a capability only after
  it has already earned its keep elsewhere.
- **No big-bang.** The engine's whole contract is additive, per-site, tag-pinned
  releases with a preview before promotion. A one-shot rewrite of riselynk.com would
  break that contract and front-run the harvest.
- **Control-plane safety stays intact during the harvest** (see 1.6). Approach B keeps
  the public site off shared hosts until the engine is ready, so the host-based tenant
  model is never put at risk by an in-progress migration.

### 1.4 Rejected alternative: rebuild riselynk.com on the engine first

Rejected. It front-runs the harvest, loses capability on cutover (newsletter, intake,
scroll narrative would all regress until re-added), and it drags the engine's
Next.js / `@supabase/ssr` surface onto a `*.riselynk.com` host before the CI host
separation exists (see 1.6). High risk, no early payoff. Not chosen.

### 1.5 Harvest ranking (RiseLynk to engine, by reuse value)

This is the value ranking from the research. It ranks what is worth harvesting; it is
NOT the release order (see 2.2 for why order differs from value).

| # | Capability | Source in RiseLynk | Engine gap today |
|---|---|---|---|
| 1 | **Double-opt-in newsletter stack** | `supabase/functions/newsletter-list` + `newsletter-send`; `tools/newsletter-publish.mjs`; the `newsletter_subscribers/issues/sends/config` schema | Nothing. The engine has no newsletter surface. |
| 2 | **Contact-intake serverless pattern** | `supabase/functions/contact-submit` | The engine has a Resend contact form (`components/sections/Contact.tsx`, `LeadForm.tsx`) but not the save-lead-first / never-drop-a-lead hardening. |
| 3 | **Claims-wall + copy-editor blog governance** | the "prove it on ourselves" blog rail governance (go-live-roadmap Marketing; `tenant-web-presence-and-seo.md`) | The engine has the copy-discipline lint and a hosted blog, but not the authoring runbook/governance around it. |
| 4 | **Cookie notice** | `apps/landing/cookie-notice.js` | Nothing. Small clean win. |
| 5 | **Design-system structural patterns** | `apps/landing/index.html`, spec `landing-machine-room-craft.md`: one-light machine-room model, film-grain dither to kill banding, reduced-motion handling, pinned scroll-narrative that degrades to a static timeline with no JS | The engine has none of these as capabilities. This is the craft gap that must close before riselynk.com can move without regressing. |

Detail on each source (grounds the acceptance criteria in Part 2):

- **Newsletter (#1).** `newsletter-list` is the public double-opt-in surface (subscribe,
  confirm, unsubscribe), `verify_jwt=false`, per-row UUID `confirm_token` /
  `unsubscribe_token` as the only credential, idempotent subscribe with concurrent-insert
  recovery, per-IP fail-open rate limiting, and GET links that 302 to branded pages on
  the site's OWN domain (Supabase serves function-returned HTML as `text/plain`, so the
  markup would show as raw source otherwise). `newsletter-send` is secret-gated
  (constant-time `x-newsletter-secret` compare), with `store_and_send` and `send_ready`
  modes, layered idempotency (atomic ready to sending claim, `UNIQUE(issue_id,
  subscriber_id)`, a done-set skip), chunked sends with a stale-reclaim window,
  pagination past PostgREST's 1000-row cap, and RFC 8058 `List-Unsubscribe` /
  `List-Unsubscribe-Post` one-click headers. `newsletter-publish.mjs` is the trusted
  bridge: **the agent writes only content** (`## INTRO` / `## UPDATE` / `## SIGNOFF`
  plus front-matter); **the script owns all email chrome** (branded HTML and text shell,
  footer, mailing address, and the `{{unsubscribe_url}}` placeholder the send function
  fills per recipient). The sender is isolated behind `getSender()` and `__test` exports
  so the logic runs under a Node harness with an injected fake mailer.
- **Contact intake (#2).** `contact-submit` saves the lead first, then emails the team
  via Resend with `reply_to` set to the lead; a mail failure returns
  `{ ok: true, notified: false }` so a lead is never dropped. `verify_jwt=false`, HTML
  escaping on every field, fail-open rate limiting, and the same `getSender()` / `__test`
  testability.
- **Blog governance (#3).** The engine already lints copy; RiseLynk adds the governance
  around authoring: claims walled to attested facts, every client-facing string finished
  through the `copy-editor` subagent, per-article founder gate, and a researched cadence.
- **Cookie notice (#4).** A self-contained, dependency-free vanilla-JS informational
  banner (strictly-necessary cookies only, `localStorage` ack). Its one coupling is that
  the palette is hardcoded; harvesting means tokenizing it to the engine's two-color
  contract.
- **Design-system structural (#5).** The one-light model (single key-light radial plus a
  multi-stop dark gradient), a stitched-tile plain-blend grain layer that dithers away
  banding, self-hosted fonts with zero third-party requests, thorough
  `prefers-reduced-motion` handling (11 guards in the source), and the `#see-it` scroll
  narrative: a sticky-stage track of threshold scenes on `IntersectionObserver` plus rAF,
  no wheel interception, that degrades to a stacked step-timeline for narrow screens,
  reduced motion, and no-JS. Zero runtime libraries (GSAP / AOS / Lenis / Tailwind were
  rejected in the spec).

### 1.6 What does NOT generalize (stays RiseLynk brand config)

Hard line. These are harvested as capabilities with brand-neutral defaults, never with
RiseLynk's identity baked in:

- RiseLynk's green palette, brand SVGs, logos, and motifs. (Brand lives in per-site
  config by the engine's two-color contract, by design.)
- All copy and claims: elevator / escalator / ASME / IUEC language, the RiseLynk voice,
  every product string. Copy is authored per-site through the `copy-editor` subagent.
- The hardcoded Supabase project ref `kisbwugtvvdkltlixuic` and RiseLynk function URLs.
  A harvested function reads its project, domain, from-address, and secret from config,
  never a literal.
- RiseLynk's tenant-routing apparatus (subdomain-per-tenant, the control plane). The
  engine's seam is compile-time (one build is one site); it does not inherit RiseLynk's
  host-routing.

### 1.7 Control-plane safety (hard constraint, non-negotiable)

Approach B keeps the public site off shared hosts during the harvest, which is what
keeps the `control.<domain>` host-based tenant model safe. The rules:

- **During the harvest (all engine-side phases):** riselynk.com stays exactly as it is
  today: its OWN Vercel project, bound to `riselynk.com` by exact host, holding no
  Supabase client, origin-scoped storage. Nothing in phases R1 through R5 touches
  riselynk.com's hosting.
- **The harvested newsletter and contact functions are stateless serverless** (they run
  `verify_jwt=false`, use the service role, and hold no cookie or SSR session). They do
  not, by themselves, bring the `@supabase/ssr` cookie surface anywhere. Their subscriber
  and lead state lives on a Supabase project that is NOT RiseLynk's control plane and NOT
  its per-tenant projects (see the open decision in 2.9): default to the shared Kitsap
  dynamic-sites project, keyed by site, with RLS.
- **The adoption phase (A) is where the real risk lives.** When riselynk.com eventually
  moves onto the engine, do NOT bring the engine's Next.js / `@supabase/ssr` cookie
  surface near `.riselynk.com` without CI-enforced host separation from the control, app,
  and tenant hosts. The public apex must remain its own Vercel project bound to
  `riselynk.com` by exact host. This is a gate on Phase A, not a hope (see 2.8).
- Design of record for the host model: `RiseLynk/docs/plans/tenant-web-presence-and-seo.md`
  and `RiseLynk/docs/specs/web-presence-phase0.md`.

### 1.8 The riselynk.com adoption gate

riselynk.com does not move onto the engine until ALL of these hold:

1. **Craft parity:** an engine build of riselynk.com matches its current baseline of
   **Lighthouse performance 99 and CLS 0** (the documented baseline in
   `RiseLynk/docs/archive/roadmap-shipped-log.md`). No regression on LCP or new failing
   audits.
2. **Capability parity:** the newsletter, the save-first contact intake, the blog
   governance, the cookie notice, and the scroll-narrative / one-light craft are all
   live engine capabilities (phases R1 through R5 shipped and proven on the Kitsap
   surfaces).
3. **Host separation is CI-enforced** (1.7 / 2.8).

Until then, riselynk.com stays bespoke and the engine keeps absorbing its best parts.

---

## Part 2 - Phased plan

### 2.1 Release discipline this plan inherits

Every phase below is a normal engine release and obeys the existing contract in
`roadmap.md` and `CLAUDE.md`:

- **Additive, tag-pinned, per-site.** A config valid at an older tag stays valid at a
  newer one. Sites pin a tag and roll forward one at a time with a preview before
  promotion. No fleet-wide forced upgrade. A breaking change would be a major bump plus a
  migration note; nothing here is planned to break.
- **Release gates (all green before a tag):** `npm run build`, `npm run test:hydrate`,
  `npm run build:hydrated` and `:bundle`, plus a rendered-output proof on both demos
  (`site-demo` and `elevator-demo`): swap the seam, build, inspect the rendered pages,
  the `@graph`, and `/llms.txt`.
- **Copy discipline:** no em or en dashes; no "compliant" / "certified" /
  "inspection-ready" / "meets the standard" as affirmative claims; nothing invented.
- **This program adds one gate on top:** every phase must be **proven on the Kitsap
  consumer builds (harborview-demo, and where the capability applies, ryan-dehart / ARK
  and kitsap-component) via `engine-build.mjs` BEFORE riselynk.com is allowed to depend
  on it.** That is the whole point of harvest-first.
- **Testability is harvested too.** RiseLynk's functions isolate their mailer behind
  `getSender()` and export a `__test` surface so the logic runs under a Node harness with
  injected fakes. The engine ports that pattern so each harvested function is proven in
  isolation, not only in a full build.

### 2.2 Sequencing principle: value ranking is not release order

The harvest ranking in 1.5 is by reuse VALUE (newsletter is #1). The release ORDER below
deliberately differs, because order is set by risk and dependency, not value:

- **Cheapest, highest-confidence wins first**, to prove the harvest flywheel on the
  Kitsap surfaces before spending risk budget. Contact-intake (#2) hardens something the
  engine already has; the cookie notice (#4) is trivial. They lead.
- **The newsletter (#1 by value) is the biggest lift** (it introduces durable subscriber
  state, a cron backstop, a shared secret, double-opt-in, and front-end confirm /
  unsubscribe pages). It lands after the flywheel is proven, and is itself split into two
  releases to avoid a big-bang.
- **The design-system craft (#5) lands last of the engine phases**, because it is the
  release that closes the gap the adoption gate measures (Lighthouse 99 / CLS 0). It is
  the natural predecessor to Phase A.

This is a deliberate correction to the illustrative numbering in the brief ("v0.7 =
newsletter, v0.8 = contact-intake"): the actual roadmap already reserves v0.7, and
risk-ordering puts contact-intake before newsletter. See 2.3.

### 2.3 Version slotting note (v0.7 is already reserved)

`roadmap.md` reserves the **v0.7** slot for the held light/dark/system theme release
(design locked 2026-07-11), which also carries the eyebrow-contrast token. That is not
part of this program. The harvest releases are independent additive minors that slot into
the next available tags AFTER v0.7. The tag numbers below (v0.8 through v0.12, then v1.0)
are indicative slots assuming this order; because releases are additive, the exact integer
floats with whatever else ships first. **What is load-bearing is the ORDER and the gates,
not the literal number.**

### 2.4 Phase overview

| Phase | Indicative tag | Harvest | Lift / risk | Named deliverable |
|---|---|---|---|---|
| R1 | v0.8 | Contact-intake hardening (#2) + cookie notice (#4) | Low | Save-first intake + tokenized cookie notice, engine capabilities |
| R2 | v0.9 | Blog authoring governance runbook (#3) | Low (mostly docs + lint wiring) | The engine blog runbook + claims-trace for articles |
| R3 | v0.10 | Newsletter opt-in half (#1a) | High | Double-opt-in subscribe/confirm/unsubscribe + subscriber schema + branded pages |
| R4 | v0.11 | Newsletter send + publish bridge (#1b) | High | Issue send + the content-only publish bridge |
| R5 | v0.12 | Design-system structural capabilities (#5) | Medium-high (design) | One-light model, grain dither, reduced-motion, scroll-narrative-that-degrades |
| A | v1.0 | riselynk.com adoption | High (cutover) | riselynk.com rebuilt on the engine, host-separated |

Each phase is independently shippable and independently useful to the Kitsap revenue
line. If the program pauses after any phase, the engine is strictly better and nothing is
half-built.

### 2.5 Phase R1 (v0.8) - Contact-intake hardening + cookie notice

**Status (2026-07-12): BUILT and staged locally.** All release gates and the both-demo
and Kitsap consumer-build proofs are green; the work is committed locally and HELD for the
founder's release authorization (push + version bump + annotated tag). See the CHANGELOG
"Unreleased - R1" entry. Nothing below is changed; this note records that R1 is built.

**Scope.** Fold RiseLynk's `contact-submit` behaviors into the engine's existing contact
surface (`components/sections/Contact.tsx`, `LeadForm.tsx`, and whatever serverless
receiver backs them): save the lead first, then notify; return `notified:false` (never an
error) on a mail hiccup so a lead is never lost; `reply_to` the lead; escape every field;
fail-open rate limiting; a client-side mailto fallback so the form still works if the
function is unreachable. Add an informational cookie-notice capability: the vanilla-JS
banner, dependency-free, but with its palette read from the two-color contract instead of
hardcoded, config-gated on (default off, or on when the site declares it uses cookies).
Both are brochure-level and add no durable schema.

**Why first.** Lowest risk, proves the harvest flywheel cheaply, hardens a real gap
(lead loss) on every current and future engine site.

**Acceptance criteria.**
- A contact submit with a failing mailer still persists the lead and returns
  `{ ok: true, notified: false }`; a submit with no email but a phone still saves.
- Field output is HTML-escaped; the receiver reads project / from / to from config, no
  RiseLynk literals.
- The cookie notice renders with the site's brand tokens, dismiss persists, and it is
  absent when not enabled. No em/en dashes in its copy.
- Config valid at v0.7 is valid unchanged at v0.8 (additive).

**Validation.**
- Node harness test of the receiver logic with an injected fake mailer (save-first,
  never-drop, escaping), mirroring RiseLynk's `__test` pattern.
- Engine release gates green (2.1).
- `engine-build.mjs` on harborview-demo AND kitsap-component: render the contact form,
  submit a test lead, confirm save-first behavior end to end and the cookie notice on a
  page.

**Risk.** Low. The main watch item is not regressing the engine's current contact form
behavior; covered by keeping the change additive and testing both demos.

### 2.6 Phase R2 (v0.9) - Blog authoring governance runbook

**Status (2026-07-12): BUILT and staged on a worktree branch.** All release gates and the
both-demo and Kitsap consumer-build proofs are green; the work is committed on the R2 worktree
branch and HELD for the founder's release authorization (push + version bump + annotated tag).
The runbook is `docs/plans/blog-runbook.md`; the named gate is `tools/blog-check.mjs`
(`npm run test:blog`), which runs the banned-phrase lint and a per-article claims trace over
article bodies. No schema change; additive on v0.8.0. See the CHANGELOG "Unreleased - R2"
entry. Nothing below is changed; this note records that R2 is built.

**Scope.** Turn RiseLynk's blog governance into the engine's blog runbook: a documented
authoring workflow that walls every article to attested facts, routes all client-facing
strings through the `copy-editor` subagent, applies the existing banned-phrase lint and a
claims-trace to article bodies (not just scaffold strings), and defines the per-article
gate and cadence. Mostly documentation plus wiring the existing lint into the blog path;
optionally begins the managed article-rail producer already on the roadmap backlog, but
that producer is tracked separately and is NOT a blocker for this phase.

**Why here.** Low code risk, high leverage for the Kitsap services revenue line (a client
can be sold a governed, claims-safe managed blog). It also formalizes the "prove it on
ourselves" discipline RiseLynk already runs.

**Acceptance criteria.**
- A blog runbook doc exists in the engine describing the authoring gate, the claims wall,
  the copy-editor hand-off, and the cadence.
- The banned-phrase lint and claims-trace run over article content in `test:hydrate` (or
  an equivalent blog check), failing on a banned phrase or an unattested claim in an
  article body.
- No schema change; a v0.8 config is valid at v0.9.

**Validation.**
- Engine release gates green, with the article-content lint demonstrated failing on a
  seeded bad article and passing on a clean one.
- Proven on the elevator-demo blog and at least one Kitsap client with a blog
  (harborview-demo or kitsap-component): author one article through the runbook end to
  end, claims-trace clean.

**Risk.** Low. Governance and lint wiring; the article-rail producer is explicitly out of
scope so this phase cannot balloon.

### 2.7 Phase R3 (v0.10) - Newsletter opt-in (half 1 of the big lift)

**Scope.** The public double-opt-in half of the newsletter, harvested from
`newsletter-list`: a config-gated `newsletter` capability (a signup section plus a
serverless list function), the `newsletter_subscribers` schema, per-row UUID
confirm/unsubscribe tokens, idempotent subscribe with concurrent-insert recovery, fail-open
rate limiting, and the branded confirm and unsubscribe PAGES served as engine routes on the
site's own domain (the 302-to-own-domain pattern, because Supabase serves function HTML as
`text/plain`). Brand, domain, and from-address come from config. NO issue sending yet.

**Why split here.** Sending is the higher-consequence half (it emails real people). Prove
collection, confirmation, and unsubscribe first, on a demo, before anything can send.

**Acceptance criteria.**
- Subscribe is idempotent and always double opt-in: a new email creates a pending row and
  sends a confirm link; an already-confirmed email leaks no state; a concurrent duplicate
  recovers instead of erroring.
- A valid confirm token moves pending to confirmed; a malformed token is treated as an
  invalid link, not a 500. Unsubscribe works from the branded page and is idempotent.
- The list function reads project/domain/from from config; no RiseLynk literals; the
  subscriber store is the non-control-plane project chosen in 2.9.
- Additive: a v0.9 config with no `newsletter` block builds unchanged.

**Validation.**
- Node harness tests of subscribe/confirm/unsubscribe with an injected fake mailer
  (idempotency, double-opt-in, malformed-token, concurrent-insert recovery), mirroring
  RiseLynk's `newsletter-list` `__test` surface.
- Engine release gates green.
- `engine-build.mjs` on harborview-demo: render the signup, run a full
  subscribe to confirm to unsubscribe round trip against a test project, verify the
  branded pages render on the site's own host.

**Risk.** Medium-high. Introduces the first durable subscriber state and the confirm/
unsubscribe page routes. De-risked by shipping without any send path and proving the round
trip on a demo project first.

### 2.8 Phase R4 (v0.11) - Newsletter send + publish bridge (half 2)

**Scope.** The sending half, harvested from `newsletter-send` and
`newsletter-publish.mjs`: the `newsletter_issues` / `newsletter_sends` / `newsletter_config`
schema, a secret-gated send function (constant-time secret compare, `store_and_send` and
`send_ready` modes, layered idempotency, chunked sends with stale-reclaim, pagination past
the 1000-row cap, RFC 8058 one-click headers), a cron backstop, and the content-only
publish bridge (**the author writes only `## INTRO` / `## UPDATE` / `## SIGNOFF`; the
engine script owns all email chrome and the `{{unsubscribe_url}}` placeholder**). All brand
chrome is brand-neutral and driven by config.

**Acceptance criteria.**
- An issue is claimed ready to sending atomically (one winner); re-runs skip
  already-sent recipients via the done-set and `UNIQUE(issue_id, subscriber_id)`; nothing
  double-sends. A partial send resumes exactly on the next poke.
- Recipient paging never truncates past 1000. Every send carries `List-Unsubscribe` and
  `List-Unsubscribe-Post` one-click headers pointing at the site's own machine endpoint.
- The publish bridge builds `{ slug, subject, preheader, html, text }` from a content-only
  markdown file; the author cannot inject chrome; a re-published slug does not resurrect a
  sent issue (the conflict-safe upsert).
- Secret is read from config/secret store, constant-time compared; the function rejects a
  bad secret with 401. Additive: a v0.10 config builds unchanged.

**Validation.**
- Node harness tests of `sendIssue` / `run` with an injected fake mailer and a mocked
  PostgREST: idempotent re-run, partial-then-resume, terminal honest status, malformed
  input, bad secret, mirroring RiseLynk's `newsletter-send` `__test` surface.
- Engine release gates green.
- `engine-build.mjs` on harborview-demo against a test project: compile a real issue
  through the bridge, dry-run it, then send to a seeded confirmed test subscriber, verify
  one-click unsubscribe removes them and a re-send skips them.

**Risk.** High (it emails real recipients). De-risked by the two-phase split (R3 proved
opt-in), the layered idempotency, a `--dry-run` in the bridge, and proving the full cycle
on a test project on a demo before any client or RiseLynk depends on it.

### 2.9 Phase R5 (v0.12) - Design-system structural capabilities

**Status (2026-07-12): BUILT and staged on a worktree branch.** All release gates plus the
both-demo render proof are green, and the demo Lighthouse proof met the bar: the elevator-demo
(craft ON) home page scores Lighthouse performance 100 / CLS 0 on desktop and 99 / CLS 0 on
mobile, and the ARK / ryan-dehart brochure config with the craft ON (built through the engine's
external-config path) scores 100 / CLS 0. The work is committed on the R5 worktree branch and
HELD for the founder's release authorization (push + version bump + annotated tag). Delivered as
a `craft` config block (`oneLight`, `grain`, `fonts`) plus a `scrollNarrative` section; additive,
no runtime library, no schema change (a prior-tag config builds unchanged). See the CHANGELOG
"Unreleased - R5" entry. Nothing below is changed; this note records that R5 is built.

**Scope.** Harvest the STRUCTURAL craft from `apps/landing` (spec
`landing-machine-room-craft.md`) as brand-neutral, config-gated engine capabilities: the
one-light model (single key-light radial plus a multi-stop dark gradient), a stitched-tile
plain-blend grain layer that dithers away banding, self-hosted-font discipline (zero
third-party requests), thorough `prefers-reduced-motion` handling, and the pinned
scroll-narrative: a sticky-stage track of threshold scenes on `IntersectionObserver` plus
rAF, no wheel interception, that degrades to a stacked step-timeline for narrow screens,
reduced motion, and no-JS. Zero runtime libraries. NOT the green palette, brand SVGs, or
copy (those stay RiseLynk config).

**Why last of the engine phases.** This is the release that closes the craft gap the
adoption gate measures. It is the direct predecessor to Phase A.

**Acceptance criteria.**
- Each pattern is a config option with a brand-neutral default and honors the two-color
  contract; a site that does not enable them is unchanged.
- The scroll narrative degrades to a static, readable step timeline with no-JS and under
  `prefers-reduced-motion`; captions match the animated content verbatim.
- No runtime library is added. A build with the craft enabled holds Lighthouse
  performance 99 and CLS 0 on a demo (the same bar riselynk.com meets).
- Additive: a v0.11 config builds unchanged.

**Validation.**
- Engine release gates green.
- `engine-build.mjs` on elevator-demo (closest archetype to RiseLynk) AND
  ryan-dehart / ARK: enable the craft, screenshot desktop + mobile + reduced-motion +
  no-JS fallback, and confirm Lighthouse 99 / CLS 0 on the built output.

**Risk.** Medium-high on the design/perf side (motion and grain are easy to regress CLS or
LCP with). De-risked by porting the exact zero-library approach RiseLynk already proved at
99/0, and by making Lighthouse 99 / CLS 0 a hard acceptance criterion, not an
afterthought.

### 2.10 Phase A (v1.0) - riselynk.com adoption

**Scope.** Rebuild riselynk.com as an engine site: a `site.config.ts` plus assets plus a
pinned tag, using the harvested newsletter, contact intake, blog governance, cookie notice,
and design-system craft, with RiseLynk's palette / SVGs / copy as its brand config. This is
the milestone that turns the flywheel: from here, every engine release can upgrade
riselynk.com too.

**Entry gate (all must hold before Phase A starts).** The full adoption gate in 1.8:
craft parity (Lighthouse 99 / CLS 0 on an engine build of riselynk.com), capability parity
(R1 through R5 shipped and proven on Kitsap surfaces), and CI-enforced host separation.

**Acceptance criteria.**
- An engine build of riselynk.com matches the current site's Lighthouse 99 / CLS 0 and
  loses no capability (newsletter, intake, blog, cookie notice, scroll narrative all
  present).
- **Host separation is CI-enforced:** the public apex is its own Vercel project bound to
  `riselynk.com` by exact host; the engine's Next.js / `@supabase/ssr` cookie surface is
  provably kept off `.riselynk.com` and off any host shared with control / app / tenant. A
  CI check fails the build if that separation is violated.
- Cutover is preview-first: an engine build of riselynk.com is reviewed on a preview host
  before the apex is repointed, and the bespoke site stays reversible until the engine
  build is signed off.

**Validation.**
- The CI host-separation check exists and is demonstrated failing on a deliberate
  violation.
- Full preview build of riselynk.com on the engine, Lighthouse 99 / CLS 0 verified,
  every page and the newsletter/contact round trips exercised on the preview, founder
  sign-off, THEN repoint.

**Risk.** High (production cutover of the flagship marketing site). De-risked by the
preview-first cutover, the reversible fallback to the bespoke site, and the hard entry
gate: Phase A cannot start until the engine has already matched the bar on the demos.

### 2.11 Cross-cutting open decisions (stage for founder)

These are real decisions the program needs; none block starting R1, but R3 cannot ship
without #1 answered:

1. **Where does engine newsletter/lead state live?** Recommended default: the shared
   Kitsap dynamic-sites Supabase project, keyed by site, with RLS, per
   `maxlynk-services/CLAUDE.md`. Explicitly NOT RiseLynk's control-plane project
   (`kisbwugtvvdkltlixuic`) and NOT its per-tenant projects. Confirm before R3. This is a
   provisioning decision (money / infrastructure); stage it, do not self-authorize.
2. **Does the Kitsap newsletter run one shared list across client sites, or one list per
   client site?** Affects the schema key and the per-client sales story. Recommended: one
   list per site (a client owns their subscribers), same project, `site_id`-scoped.
3. **Cron backstop mechanism for R4** (pg_cron on the shared project vs an external
   scheduler). Confirm at R4.
4. **Does riselynk.com's own newsletter migrate its existing subscribers on adoption, or
   start fresh?** A data-migration decision for Phase A; the existing RiseLynk newsletter
   keeps running on its current infra until then.

### 2.12 Pointer to add in RiseLynk's go-live-roadmap (for the RiseLynk-homed session)

RiseLynk's working tree currently has uncommitted changes from another session, so per the
one-writer-per-repo rule this plan does NOT edit RiseLynk. Instead, the RiseLynk-homed
session (or the integrator) should add this pointer to
`RiseLynk/docs/plans/go-live-roadmap.md`, in the `### Marketing` table, on the "Shared
site-engine" row's detail (or as a new adjacent row):

> Unification program (harvest-into-engine-first, then riselynk.com onto the engine):
> plan of record in `site-engine/docs/plans/riselynk-engine-unification.md`. riselynk.com
> stays bespoke until the engine matches its Lighthouse 99 / CLS 0 baseline and ships the
> harvested newsletter, intake, blog governance, cookie notice, and scroll-narrative craft.

---

## Provenance

Design decision and ranking approved by the founder (2026-07-12). Grounded in:
`RiseLynk/apps/landing`, `RiseLynk/supabase/functions/{newsletter-list,newsletter-send,
contact-submit}`, `RiseLynk/tools/newsletter-publish.mjs`, `apps/landing/cookie-notice.js`,
`RiseLynk/docs/specs/landing-machine-room-craft.md`,
`RiseLynk/docs/archive/roadmap-shipped-log.md` (the 99/0 baseline),
`RiseLynk/docs/plans/tenant-web-presence-and-seo.md` and `web-presence-phase0.md` (the host
model), this engine's `roadmap.md` and `CLAUDE.md` (the release discipline and the reserved
v0.7 slot), and `maxlynk-services/CLAUDE.md` (the consumer pipeline and the shared
dynamic-sites Supabase model).
