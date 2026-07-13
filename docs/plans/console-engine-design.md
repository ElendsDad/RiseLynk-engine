# Console-engine (tenant console) - design direction

Status: DESIGN DIRECTION (captured 2026-07-12, not yet built; founder-raised). Companion to
`riselynk-engine-unification.md`. This does NOT authorize a build - it captures the architecture
so it is ready when we get there. Sequencing is in section 8.

FOUNDER DECISIONS 2026-07-12 (evening; supersede the corresponding open language below):
1. **Kitsap console data: TIERED BY SENSITIVITY.** Site content, change requests, and
   contact/lead history ride the SHARED control-plane tables keyed by tenant (RLS-separated) -
   that is website data, not business ops, and it keeps a low-price web client from carrying a
   dedicated project. Any client whose console touches OPERATIONAL business data (work orders,
   money, customer PII at business scale - the RiseLynk-tenant class) gets a physically separate
   per-tenant Supabase project. The no-cross-tenant-business-data hard rule holds where it
   matters; margins hold where it does not.
2. **RiseLynk's control plane STAYS BESPOKE - donor only, never scheduled for a rewrite.** Its
   generic frame (auth, tenant-scoping, shell, permission-gating, RLS idioms) is harvested into
   the first Kitsap console build; the live tool, its data, and its crons are never touched.
   Revisit only if a concrete payoff appears after the console-engine is proven elsewhere.
   Standing reliability bar for any future data move: harvest-first, dual-run shadow reads with
   a parity gate, and the old surface never turns off until the replacement proves parity.

## 1. The idea
The site-engine gives every client a consistent, centrally-maintained public WEBSITE from config
+ a pinned tag. The same leverage applies to the ADMIN side: every tenant/client that gets a site
will eventually want a CONSOLE (to manage their content, their business, their site). A
**console-engine** is the sibling to the site-engine - one console codebase that serves every
tenant's console, the way one site-engine serves every public site. The most-built example to
generalize from is **RiseLynk's control plane** (`apps/control-plane`) - but only its GENERIC
frame, not its domain-specific tools (section 5).

## 2. The one principle: share the CODE, isolate the DATA per-tenant
This is the whole architecture. The console-engine shares the application CODE; each tenant's
console binds to ONLY that tenant's own database.

HARD RULE (founder, non-negotiable): **no cross-tenant business data.** If a console touches a
customer database with business info, that data lives in that tenant's OWN store - never
co-located with another tenant's, and never on RiseLynk's control plane.

## 3. Data-isolation model: per-tenant Supabase projects
- Each tenant gets their **own Supabase project** (physical isolation, the strongest boundary),
  exactly as RiseLynk already does for its customers ("one Supabase project per tenant, routed by
  subdomain").
- On top of the physical boundary: server-side **RLS + server-derived roles** (never client-set;
  per the security-doctor rules - no authorization from `user_metadata`, service-role key
  server-only, RLS on every table, a normal user cannot self-promote or reach admin paths).
- Each deployed console instance is **pinned to one tenant's project** at config time. There is
  no shared cross-tenant connection and no code path that can read across tenants.
- RiseLynk's control plane (`fhcttzraqlgarlehgcug`) holds RiseLynk's OWN business data and is
  off-limits to any client console.

This mirrors the engine split: the public SITE stays static (no live DB read); the CONSOLE is the
dynamic, DB-backed sibling, each on its own tenant project.

## 4. Reconciliation with the existing Kitsap console plan
The existing plans (`RiseLynk/docs/specs/kitsap-console-and-wizard.md`,
`kitsap-website-creation/docs/management-layer-phase1-plan.md`) describe one shared console app,
per-tenant HOSTS resolving to it (host-based resolution), with the client console riding the
SHARED control-plane tables "keyed by tenant" (RLS-separated but co-located).

This spec REFINES the data half:
- KEEP: one shared console CODE, host-based per-tenant resolution, server-derived roles.
- CHANGE: for any console that touches business info, data lives in a **per-tenant project**, NOT
  co-located in shared control-plane tables. The founder's no-cross-tenant-data rule supersedes
  the earlier "shared tables keyed by tenant" for business-info consoles. Genuinely
  low-sensitivity, non-business data MAY still be shared-with-RLS, but the default for a tenant
  console is its own project.
- STILL TRUE: the earlier "Kitsap client SITES get no per-client DB" decision stands - it was
  about the static SITE. A CONSOLE is a different, dynamic surface and does need per-tenant data.

## 5. What to harvest from RiseLynk's control plane (generic frame only)
- HARVEST: auth + session, tenant-scoping + host-based resolution, the app shell/nav,
  permission-gating (`Perm.can(...)` style), the RLS/role patterns + server-derived roles, generic
  CRUD/list/detail scaffolding, and the claims-wall/copy discipline where public strings appear.
- DO NOT generalize: RiseLynk's elevator-specific modules (marketing autopilot, finance workbench,
  ad maker, IUEC pay, compliance/SOC2) - those are RiseLynk content, not engine.
Same discipline as the site-engine (it took the rendering, not the landing copy).

## 6. Separate engine, not folded into the site-engine
The site-engine's tenet is static, no live DB reads on public sites. A console is dynamic and
DB-backed - the opposite. Folding a console into the static engine would break its contract. So
the console-engine is a SEPARATE, sibling engine:
- site-engine -> public SITE (static; config + assets + pinned tag)
- console-engine -> tenant CONSOLE (dynamic; per-tenant project + pinned engine version)
Both share the "one engine, many tenants, versioned, zero forks" discipline, and the no-fork guard
pattern applies to the console-engine too.

## 7. Cost / tradeoff (honest)
Per-tenant projects cost more than shared-with-RLS: a Supabase project + provisioning per client
that gets a console. That is the price of physical isolation, and it is the founder's chosen
posture for business data. The provisioning rail (source-agnostic hydrator + provision consumer,
the `tools/provision-tenant.ps1` idiom) makes per-tenant provisioning a one-command step. A tiered
model is possible: a console (and its project) only for clients who want one; static-site-only
clients need no project.

## 8. Sequencing - extract the engine FROM the first instance
You do NOT build the console-engine first. You build the FIRST console (the Kitsap
management-layer/console already spec'd), prove it on a real client, THEN generalize the
console-engine out of it - exactly how the site-engine was extracted after real sites existed.
This sits AFTER the current site-engine flywheel (R2 -> R5 -> Phase A). It is a later program.

## 9. Security requirements (must hold)
- Per-tenant physical project isolation; a console instance can reach only its tenant's project.
- Server-side RLS + server-derived roles on every table; never authorize from `user_metadata`;
  service-role key server-only; a normal user cannot self-promote or reach admin paths.
- Auth cookies host-scoped per tenant (never on an apex shared with other tenants); passkeys bind
  to the tenant's RP ID (one login home per tenant).
- The no-fork guard applies: a tenant's console is pinned config + a pinned engine version, not a
  patched fork.

## 10. Open questions (decide when the program starts)
- Which clients get a console (all, or a paid tier)?
- Per-tenant project cost model and who pays.
- What a client-editable console does at v1 (content edits, business info, both).
- How the console-engine and site-engine share the tenant identity + provisioning rail.

## Provenance
Founder-raised 2026-07-12. Grounded in RiseLynk's per-tenant model + control plane
(`apps/control-plane`, the security-doctor rules in `RiseLynk/CLAUDE.md`), the existing Kitsap
console plans, and this engine's zero-forks consumption contract.
