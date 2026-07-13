# Self-hosted font subsets (SIL Open Font License 1.1)

These woff2 files are the display + mono pairing the R5 design-system craft enables when a
site sets `craft.fonts: true`. They are self-hosted so the engine issues ZERO third-party font
requests (no Google Fonts, no Typekit); a site that leaves `craft.fonts` off makes no font
request at all and stays on the system stack.

| File | Family | Weight | License |
|---|---|---|---|
| `barlow-600.woff2` | Barlow | 600 | SIL Open Font License 1.1 |
| `barlow-800.woff2` | Barlow | 800 | SIL Open Font License 1.1 |
| `plex-mono-500.woff2` | IBM Plex Mono | 500 | SIL Open Font License 1.1 |

Latin subsets. Provenance: harvested 2026-07-12 from `RiseLynk/apps/landing/fonts/`, which
sourced them from Google Fonts (fonts.google.com) on 2026-07-08. Barlow is by Jeremy Tribby;
IBM Plex Mono is by IBM / Bold Monday. Both are published under the SIL OFL 1.1.

The SIL OFL is a permissive, non-copyleft font license (it is NOT GPL/AGPL/LGPL/SSPL), so it
is safe to ship in this proprietary engine. The OFL's only real constraints are that the fonts
are not sold on their own and that a reserved font name is not reused; embedding subsets in a
site's assets is exactly the intended use. Keep this note with the files.
