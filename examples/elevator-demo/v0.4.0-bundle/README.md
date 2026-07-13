# v0.4.0-bundle

The v0.4.0 **artifact bundle** fixture for the publish-profile hydrator: a `snapshot.json`
plus a sibling `assets/` directory of resolved image objects, keyed the way the control-plane
receiver writes it (`<client_id>/<approvedAt>/`). It proves the three v0.4.0 additions on the
site-engine side: asset resolution, article seeding, and bundle-aware input.

```
summit-vertical/                     # <client_id> (the tenant slug, for readability)
  2026-07-10T183000Z/                # <approvedAt> dir (colons stripped for a Windows-safe path)
    snapshot.json                    # the pointer target; its sibling assets/ holds the images
    assets/
      proj-1-before.png  proj-1-after.png
      proj-2-before.png  proj-2-after.png
make-placeholders.mjs                # regenerates the four PNGs, dependency-free
```

The hydrator derives the asset directory as the sibling `assets/` of the snapshot's own
directory, so the `<approvedAt>` dir name is opaque (the real ISO timestamp, colons and all,
lives inside the snapshot's `approvedAt` field; the on-disk dir name is only Windows-safe).

## What it exercises

- **Asset resolution (addendum 8).** `assets.modProjects[]` carries three projects. `proj-1`
  and `proj-2` reference real files under `assets/` (stored `src` form) and resolve into
  `public/mods/`, emitting a `modGallery` section on the home page. `proj-3` references files
  that do not exist, so it is **dropped with a claims-trace record** and the run still
  succeeds with the two good projects. This is the degrade-not-fail path.
- **Article seeding (addendum 9).** `articles[]` carries three entries: one published, one
  draft (`draft: true`, noindex, reachable by URL), and one malformed (no `description`) that
  `isValidArticle` **skips** without failing the run. The two valid ones map to `blog.articles[]`.
- **Backward compatibility.** Hydrating this same `snapshot.json` **without** a bundle
  directory (or hydrating the sibling bare `../publish-profile.snapshot.json`) degrades the
  gallery to absent, exactly as a v0.3.0 site behaves. Covered by `tools/hydrate.test.mjs`.

## Regenerating the images

The four PNGs are tiny checked-in placeholders (solid colors, ~157 bytes each). To rebuild
them byte-for-byte:

```
node examples/elevator-demo/v0.4.0-bundle/make-placeholders.mjs
```

`proj-3`'s files are intentionally never generated, which is what makes it drop.
