# site-engine — repo index

Config-driven static-site engine: one codebase renders many local-business sites via
`site.config.ts` + assets + a pinned engine tag. Proprietary (UNLICENSED).
Orientation: `CLAUDE.md`. Roadmap: `docs/plans/roadmap.md`. Company map: `../INDEX.md`.

**Live?** Yes — as an engine consumed by client sites and pins (e.g. `riselynk-engine`
snapshot). Not a single customer product; MaxLynk brand machinery.

Last updated: 2026-07-25. Checker: `bash ~/.maxwell/check-company-index.sh`.
<!-- structure: app|components|docs|examples|lib|public|tools -->

---

## Map (top-level)

| Path | Holds |
|---|---|
| `lib/` | Config schema, SEO/JSON-LD, theme, CSP, delivery-guard, trust, hydrate helpers |
| `components/` | Sections + `SectionRenderer`, JsonLd, UI primitives |
| `app/` | Next.js App Router shell for the active site |
| `tools/` | `hydrate.mjs` and gate tests (`*.test.mjs`) |
| `examples/` | `site-demo`, `elevator-demo` (+ hydration fixtures) |
| `docs/` | Plans, roadmap, unification notes |
| `public/` | Fonts (OFL), static assets |
| `site.config.ts` | Active-site seam (re-export switches the live demo site) |

---

## Documents of record

| Document | Status | Location |
|---|---|---|
| Roadmap / release discipline | status of record | `docs/plans/roadmap.md` |
| Changelog | version history | `CHANGELOG.md` |
| Claim-safety design (brand) | brand-owned | `../Business/Brand/safety-gates/` — engine must not drop these when RiseLynk site migrates |

No executed LLC instruments live here. Do not park company legal/HR in this repo.

---

## Tests / gates

CI (`.github/workflows/suites.yml`) runs **every** `package.json` script whose name starts
with `test:` (hermetic; no secrets). Locally: same — `npm run test:<name>` for each suite
(`test:hydrate`, `test:contact`, `test:blog`, `test:seo`, `test:trust`, `test:csp`, …).
Also `npm run build` and `npm run lint` / `lint:config` before a release tag.

---

## Deploy

- Engine releases are **git tags**; client sites pin a tag and rebuild.
- Active demo deploys only if this repo is wired to Vercel — treat tag + consumer rebuild as
  the real ship path.
- No Supabase migrations in this repo.

---

## Deliberately NOT here

- Per-client configs/assets (→ `maxlynk-services/clients/<slug>/` or site pin repos).
- RiseLynk product apps / Supabase schema.
- Company Legal / HR (`Business/`).
- A full husky battery equivalent to RiseLynk — claim-safety must be preserved explicitly
  when the RiseLynk marketing site moves onto this engine.
