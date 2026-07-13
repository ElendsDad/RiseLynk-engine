# canvas-confetti 1.9.3 - vendored first-party asset (provenance and license)

The engine self-hosts this library because its zero-third-party-network contract
forbids any CDN script tag (jsdelivr included). A site page never requests a
third-party host for this capability; the only script URL is same-origin.

## Provenance

- Package: `canvas-confetti`
- Version: `1.9.3`
- Upstream project: https://github.com/catdad/canvas-confetti
- Source of bytes: the npm registry tarball (`npm pack canvas-confetti@1.9.3`),
  file `dist/confetti.browser.js`, sha256
  `e103ab02784339d56c93ca3debe2c5a299372cafc5215148d55283de046e86d1`.
  Obtained via npm, not fetched from any CDN.
- Local transform: minified with `terser 5.43.1`
  (`terser dist/confetti.browser.js --compress --mangle --format comments=false`),
  then a one-line provenance banner was prepended. The result is committed as
  `public/vendor/canvas-confetti-1.9.3.min.js` (sha256 of the LF bytes:
  `870b8530c5795d6e0f63d4af90dfba1628154957466e290d90be746f761f4839`).
- License: ISC, as declared by the upstream package (`"license": "ISC"` in its
  package.json) and its bundled LICENSE file, reproduced verbatim below. ISC is a
  permissive license with no copyleft; this notice and the file banner carry the
  required copyright and permission notice.

## How the engine uses it

Loaded ONLY by the config-gated `celebrate: "confetti"` form-success celebration
(`lib/celebrate.mjs`): the client lazy-injects this same-origin script on the
form-success path, feature-detects `window.confetti`, honors
`prefers-reduced-motion`, and fails silently when the file cannot load. A site
whose config does not set the flag never requests this file, and no runtime npm
dependency was added.

## Upstream LICENSE (verbatim)

ISC License

Copyright (c) 2020, Kiril Vatev

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
