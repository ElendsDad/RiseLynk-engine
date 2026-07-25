# RiseLynk-engine

A **self-contained, Git-connectable Vercel deploy of riselynk.com**. Vercel imports
this repo and, on every push to `main`, runs `next build` and deploys the marketing
site. No CLI clone-at-tag step and no `SITE_CONFIG_PATH` are needed.

Proprietary and internal (license UNLICENSED).

## What this repo is

This is a **pinned snapshot**, not a fork:

- Every file under `app/`, `lib/`, `components/`, `public/`, `examples/`, `tools/`,
  `docs/`, plus `next.config.ts`, `package.json`, `package-lock.json`, and
  `tsconfig.json`, is the **pristine site-engine tree at tag `v0.26.0`**. Nothing in
  the engine was edited or forked.
- The riselynk.com site is a single config file plus assets overlaid on top:
  - `dist/site/riselynk/site.config.ts` is the riselynk.com `site.config` (the copy,
    theme, blog, pricing, and craft/motion toggles).
  - `public/` carries the riselynk.com assets (favicon, OG image, fonts, portal video,
    pitch deck).

The engine is meant to be consumed this way: a site is a `site.config.ts` plus assets
plus a pinned engine tag, with zero engine forks. To move to a newer engine, you
re-snapshot (see below), you do not patch engine files here.

### The one seam change

The active-site seam, `site.config.ts` at the repo root, is the **only engine source
file changed** from the pristine v0.26.0 tree. Upstream it re-exports the elevator
demo; here it re-exports the riselynk config:

```ts
export { site } from "@/dist/site/riselynk/site.config";
```

Every engine consumer imports `from "@/site.config"`, so this one line makes a plain
`next build` render riselynk.com. The `SITE_CONFIG_PATH` env override in
`next.config.ts` still exists and works, but is unused here by design.

The only other non-engine files are this `README.md` and `.gitignore` (repo
scaffolding), and `vercel.json` (`{"framework":"nextjs"}`).

> Note: `.gitignore` here intentionally does **not** ignore `dist/`. In the upstream
> site-engine repo `dist/` is throwaway hydrator output; here `dist/site/riselynk/
> site.config.ts` is the committed, load-bearing site config and must ship.

## Build

```bash
npm ci
npm run build
```

That is exactly what Vercel runs. No `SITE_CONFIG_PATH` is required. The build
prerenders the riselynk.com pages (home, blog, resources, legal pages, `sitemap.xml`,
`robots.txt`, `llms.txt`) as static output.

## Required Vercel environment variables

The build is green without any env vars. These are needed at **runtime** so the
contact and request-access forms can deliver email through Resend:

| Variable | Value |
|---|---|
| `CONTACT_TO` | `hello@riselynk.com` |
| `CONTACT_FROM` | `noreply@riselynk.com` |
| `RESEND_API_KEY` | the founder's Resend API key (set in Vercel, never committed) |

Without `RESEND_API_KEY` the site still builds and serves; the form endpoints just
have no sender configured. `CONTACT_TO` / `CONTACT_FROM` fall back to the config email
and `onboarding@resend.dev` if unset, so set them for correct delivery.

`RESEND_API_KEY` is a secret: set it in Vercel Project Settings, not in this repo, and
rotate any key that was ever pasted into chat.

## Re-snapshot procedure (upgrade the engine to a future tag)

When site-engine ships a newer tag (say `v0.18.0`) and you want riselynk.com on it:

1. Get the clean engine tree at the new tag (from the site-engine repo):
   `git -C <site-engine> archive vX.Y.Z | tar -x -C <tmp>`, or check out the tag and
   copy the working tree.
2. In this repo, **replace the engine files** with that tree: `app/`, `lib/`,
   `components/`, `examples/`, `tools/`, `docs/`, `next.config.ts`, `package.json`,
   `package-lock.json`, `tsconfig.json`, and the engine `public/` files. Do **not**
   overwrite `dist/site/riselynk/site.config.ts`, the riselynk.com `public/` assets,
   this `README.md`, or `.gitignore`.
3. Re-overlay the riselynk config for the new tag. The site-engine versioning contract
   is additive (a config valid at an older tag stays valid at a newer one), so the
   existing `dist/site/riselynk/site.config.ts` usually carries forward unchanged. If
   the new tag adds capabilities you want, edit that one config file. Regenerate it
   from the founder's design bundle only if the copy or design changed.
4. Re-point the seam if needed. `site.config.ts` at the root should still read
   `export { site } from "@/dist/site/riselynk/site.config";`. Keep that line.
5. Verify from a clean state before pushing:
   ```bash
   rm -rf node_modules .next
   npm ci
   npm run build
   ```
   Confirm the build is green and the prerendered home page carries the riselynk hero,
   `https://riselynk.com` canonical, and `data-craft` markup.
6. Commit with a message that records the new engine tag, and push (founder authorizes
   the push).

## Provenance

- Engine: site-engine at tag `v0.26.0` (pristine; commit `37f22aa`).
- Site config source of truth: `RiseLynk/website/site/site.config.ts` on RiseLynk
  `main` at `2446b9d`, overlaid at `dist/site/riselynk/site.config.ts`.
- This repo is a deploy artifact. Engine changes are made in the site-engine repo and
  reach riselynk.com through a re-snapshot, never by editing engine files here.
