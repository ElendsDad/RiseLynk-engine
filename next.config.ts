import path from "node:path";
import { createRequire } from "node:module";
import type { NextConfig } from "next";
// Plain relative imports on purpose, not the `@/` alias: these are dependency-free .mjs (no
// TypeScript, no alias resolution needed), and this file already has enough alias-resolution
// surface area riding on Next's own SWC pipeline (the active site config below) without adding
// more of it where it is not required. Also lets a plain-Node consumer of this file's OTHER
// exports (none today) or a test harness resolve these two without needing alias support.
import { buildConnectSrcDirective } from "./lib/csp.mjs";
import { analyticsConnectSrcExtras, analyticsScriptSrcExtras } from "./lib/analytics.mjs";
import {
  deliveryWiringIssue,
  placeholderEmailIssue,
  turnstileMissingIssue,
} from "./lib/delivery-guard.mjs";
import { announcementLintTargets } from "./lib/announcement.mjs";
import { gbpNapIssues } from "./lib/gbp.mjs";
// The engine's canonical banned-phrase lint, reused verbatim so the announcement bar's copy
// is held to the IDENTICAL claims wall as every other config surface (feature-backlog #26).
// Importing lintString is safe here: tools/hydrate.mjs's CLI is guarded behind an
// import.meta / process.argv check and imports only node stdlib at the top level.
import { lintString } from "./tools/hydrate.mjs";

// =============================================================================
// v0.24.1 note (was next.config.mjs through v0.24.0; renamed .ts here on purpose):
//
// Three build-time preflight checks live below, all fed by the SAME active site
// config this file resolves once at the top (respecting SITE_CONFIG_PATH, same as
// the webpack seam further down) - engine feedback items #31a, #30a, and #30c, all
// filed against the same 2026-07-20 ryan-dehart/ARK-Fabrication incident class
// (maxlynk-services docs/engine-feedback-v0.20.0.md).
//
// Why .ts and not .mjs: these checks need the ACTIVE SITE CONFIG's real values
// (security.connectSrc, business.email, the live section list) at build time, and
// site.config.ts is TypeScript. Plain Node cannot import a .ts file without either
// (a) a bundler, unavailable at this stage, or (b) Node's own experimental type
// stripping, which is NOT guaranteed at this repo's declared floor
// (package.json "engines": ">=18.18.0" - stripping only shipped, unflagged, much
// later). Next.js 15.1+ ships first-class next.config.ts support instead: when the
// config file itself is literally named next.config.ts, Next's OWN bundled SWC
// compiler (next/dist/build/next-config-ts/{transpile-config,require-hook}.js)
// transpiles it - and, for the duration of that one synchronous require() chain,
// ANY further .ts file it requires too, respecting this repo's own tsconfig.json
// paths/baseUrl. That is a real, version-independent capability of Next itself
// (proven in this release: `require("@/site.config")` from here resolves all the
// way through the active example config), confined to config LOADING only - it is
// not a general "the engine can now import TS from anywhere" change, and
// tools/lint-config.mjs's plain-Node lint path is deliberately untouched.
//
// Every check below is defensive: a failure to even LOAD the config for these
// NEW checks (a resolution hiccup in a consumer's external config, for example)
// logs loudly and falls back to the base CSP with no extension and no preflight
// enforcement, rather than turning a hiccup in an ADDITIVE feature into a new way
// to break a build that worked before this release.
// =============================================================================

// process.cwd(), not __dirname: `next build` always runs from the repo root (same assumption
// the existing SITE_CONFIG_PATH webpack seam below already makes), and __dirname's availability
// depends on which module system happens to be executing this file (see createRequire's own
// comment above) - process.cwd() sidesteps that ambiguity entirely.
const configPath = process.env.SITE_CONFIG_PATH
  ? path.resolve(process.cwd(), process.env.SITE_CONFIG_PATH)
  : path.resolve(process.cwd(), "site.config.ts");

let activeSite: any = null;
try {
  // createRequire (real Node stdlib, imported at the top of this file) rather than a bare
  // `require(...)`: Next's own next.config.ts pipeline transpiles this whole module to
  // CommonJS, where a bare `require` would also work, but tools/security-headers.test.mjs
  // drives headers() directly via a plain Node ESM `import()` of this SAME file (true ESM has
  // no ambient `require`), so the bare identifier would only work on one of the two paths.
  // The base path handed to createRequire only matters for resolving BARE specifiers relative
  // to it (node_modules lookups) - irrelevant here since configPath is already fully resolved
  // - so package.json (always present at the repo root) is a stable, __dirname/import.meta-free
  // anchor that needs no assumption about which module system is currently executing this file.
  const nodeRequire = createRequire(path.resolve(process.cwd(), "package.json"));
  activeSite = (nodeRequire(configPath) as { site: unknown }).site;
} catch (err) {
  console.error(
    `[site-engine] could not load the active site config for build-time preflight checks ` +
      `(${configPath}): ${(err as Error).message}. The connect-src extension and the ` +
      `leadform delivery preflight (#31a/#30a/#30c) are skipped this build; the baseline ` +
      `CSP and every other build behavior are unaffected.`,
  );
}

// Run the two loud, non-CSP preflight checks (#30a, #30c) exactly once per `next
// build` invocation, even though Next loads this config file more than once per
// run (once per compiler target). A global flag, not a module-level `let`, because
// Next re-transpiles and re-executes this whole file fresh each time (a plain
// module-level flag would reset), so the guard has to live somewhere that
// survives that.
const PREFLIGHT_RAN = "__ENGINE_DELIVERY_PREFLIGHT_RAN__";
if (activeSite && !(globalThis as any)[PREFLIGHT_RAN]) {
  (globalThis as any)[PREFLIGHT_RAN] = true;

  const bar = "=".repeat(78);

  // #30a - placeholder-email build wall.
  const emailIssue = placeholderEmailIssue(activeSite);
  if (emailIssue) {
    const lines = [
      bar,
      `[site-engine] ${emailIssue.severity} - placeholder delivery address (feedback #30a)`,
      `  ${emailIssue.message}`,
      bar,
    ].join("\n");
    if (emailIssue.severity === "FAIL") {
      // A production build (a real, non-placeholder domain, not draft) with a
      // placeholder business.email while a leadform/contact section is live: FAIL
      // the build. This is the exact ryan-dehart incident shape, caught before
      // deploy instead of after the first silently-lost lead.
      throw new Error(lines);
    }
    // Preview / draft / domain-less / the engine's own placeholder-domained
    // demo and hydrated-fixture builds: loud warn, build stays green.
    console.warn(lines);
  }

  // #26 - announcement-bar claims wall. The bar's text and (when present) its link label
  // pass through the engine's canonical banned-phrase lint, the SAME wall every other copy
  // surface faces. A violation (a dash, an exclamation mark, a banned compliance claim, a
  // guarantee, hype, or an unhedged code claim) FAILs the build unconditionally - unlike the
  // placeholder-email wall above, copy discipline is not softened for preview/draft builds,
  // exactly as the hydrator's own banned-phrase gate fails a run outright. A config without
  // an `announcement` block yields no targets, so this is a no-op there.
  const announcementViolations = [];
  for (const { path: fieldPath, value } of announcementLintTargets(activeSite.announcement)) {
    for (const v of lintString(value)) {
      announcementViolations.push({ path: fieldPath, rule: v.rule, match: v.match });
    }
  }
  if (announcementViolations.length) {
    const detail = announcementViolations
      .map((v) => `  - ${v.path}: ${v.rule} (matched "${v.match}")`)
      .join("\n");
    throw new Error(
      [
        bar,
        `[site-engine] FAIL - announcement copy violates the claims wall (feedback #26)`,
        detail,
        `  Fix the announcement text/link label in the site config; the same banned-phrase`,
        `  rules apply as to every other copy surface (no dashes, no exclamation marks, no`,
        `  compliance claims, no guarantees, no hype, hedge code-requirement wording).`,
        bar,
      ].join("\n"),
    );
  }

  // #30c - operator-facing delivery-wiring signal (visibility only; #30b's
  // deploy-time `vercel env ls` enforcement is explicitly out of scope here).
  const wiringIssue = deliveryWiringIssue(activeSite, process.env);
  if (wiringIssue) {
    console.warn(
      [bar, "[site-engine] WARN - no lead delivery wiring (feedback #30c)", `  ${wiringIssue.message}`, bar].join(
        "\n",
      ),
    );
  }

  // Trust pack - Turnstile readiness: email intake without a siteKey. WARN only
  // (never FAIL); the founder must create per-site Cloudflare keys.
  const turnstileIssue = turnstileMissingIssue(activeSite);
  if (turnstileIssue) {
    console.warn(
      [bar, "[site-engine] WARN - Turnstile not configured on email forms", `  ${turnstileIssue.message}`, bar].join(
        "\n",
      ),
    );
  }

  // GBP NAP consistency (engine-value research item 6): when business.gbp declares
  // name/phone/address mirrors pasted from the listing, WARN if business.* drifts.
  // Never FAIL — Josh reconciles by hand; there is no GBP API pull.
  const napIssues = gbpNapIssues(activeSite.business, activeSite.business?.gbp);
  if (napIssues.length) {
    console.warn(
      [
        bar,
        "[site-engine] WARN - Google Business Profile NAP drift",
        ...napIssues.map((i) => `  - ${i.message}`),
        "  Reconcile business.* with the GBP listing (or update business.gbp.* mirrors).",
        bar,
      ].join("\n"),
    );
  }
}

// #31a - config-extendable CSP connect-src. The base list is today's exact,
// unchanged connect-src sources; buildConnectSrcDirective (lib/csp.mjs) appends
// only validated https-origin extras from `security.connectSrc`, deduped against
// this base, and reports anything it rejected so the loop below can log it. Absent
// `security.connectSrc` (activeSite null, or the field unset) reproduces
// BASE_CONNECT_SRC.join(" ") byte-for-byte - the additive-contract proof
// tools/csp.test.mjs and tools/security-headers.test.mjs both exercise.
//
// Trust pack: when analytics.cloudflareToken is set, the Cloudflare Web Analytics
// beacon host is folded into the connect-src extras (https://cloudflareinsights.com)
// alongside any site-declared security.connectSrc entries. Absent the token, the
// base directive is unchanged.
const BASE_CONNECT_SRC = ["'self'", "https://challenges.cloudflare.com"] as const;
const analyticsConnectExtras = analyticsConnectSrcExtras(activeSite?.analytics);
const connectSrcExtras = [
  ...analyticsConnectExtras,
  ...(Array.isArray(activeSite?.security?.connectSrc) ? activeSite.security.connectSrc : []),
];
const connectSrcResult = buildConnectSrcDirective(BASE_CONNECT_SRC, connectSrcExtras);
if (connectSrcResult.rejected.length) {
  for (const r of connectSrcResult.rejected) {
    console.warn(
      `[site-engine] WARN - security.connectSrc entry "${r.value}" rejected (${r.reason}); dropped from the ` +
        `CSP connect-src directive. See lib/csp.mjs for the validation rules (https origins only, no path, no ` +
        `wildcard).`,
    );
  }
}

// Teardown P2 7j: config-extendable CSP frame-src (same origin-shape validator as
// connect-src). Baseline keeps only the Turnstile host; a site that embeds
// youtube-nocookie / Vimeo / Cal.com must list those origins in security.frameSrc.
const BASE_FRAME_SRC = ["https://challenges.cloudflare.com"] as const;
const frameSrcResult = buildConnectSrcDirective(BASE_FRAME_SRC, activeSite?.security?.frameSrc);
if (frameSrcResult.rejected.length) {
  for (const r of frameSrcResult.rejected) {
    console.warn(
      `[site-engine] WARN - security.frameSrc entry "${r.value}" rejected (${r.reason}); dropped from the ` +
        `CSP frame-src directive. See lib/csp.mjs for the validation rules (https origins only, no path, no ` +
        `wildcard).`,
    );
  }
}

// Trust pack: script-src extras for the CF Web Analytics beacon (only when a
// cloudflareToken is set). Turnstile's challenges host stays in the base list.
const BASE_SCRIPT_SRC = ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"] as const;
const scriptSrcExtras = analyticsScriptSrcExtras(activeSite?.analytics);
const scriptSrcValue = [...BASE_SCRIPT_SRC, ...scriptSrcExtras].join(" ");

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Response-layer defense-in-depth (SEC hardening v0.18.0 + FIX 6; HSTS added 2026-07-14 for the
  // riselynk.com apex, now served by this engine build). Three headers on every route:
  //   - X-Content-Type-Options: nosniff - stops MIME content-type sniffing.
  //   - Strict-Transport-Security - forces HTTPS for two years including subdomains, so a
  //     downgrade or SSL-strip attempt cannot reach the origin. No `preload` on purpose: a
  //     preload-list submission is hard to reverse, so the header runs clean first (see the
  //     RiseLynk trust-signals founder runbook). Brand-neutral and safe for the HTTPS-only Vercel
  //     sites the engine serves; sites pin tags, so a consumer gets it only when it bumps its pin.
  //   - A baseline Content-Security-Policy - object-src 'none' plus base-uri / form-action /
  //     frame-ancestors 'self' cut the base-tag, form-hijack, clickjacking and same-origin
  //     active-content classes at the response layer. The engine ships inline JSON-LD
  //     (components/JsonLd.tsx), an inline theme boot script, and self-hosted fonts, and this static
  //     output cannot mint per-request nonces, so script-src / style-src keep 'unsafe-inline'; the
  //     Cloudflare Turnstile host is allowed so an opted-in site's widget still loads. connect-src is
  //     the same base plus whatever `security.connectSrc` validated above (v0.24.1, feedback #31a).
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      `script-src ${scriptSrcValue}`,
      `frame-src ${frameSrcResult.value}`,
      `connect-src ${connectSrcResult.value}`,
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
  webpack: (config, { webpack }) => {
    // First-class external-config entry point (v0.6.1, feedback item 5). Set SITE_CONFIG_PATH
    // to a config file OUTSIDE the engine checkout (absolute, or relative to the build cwd)
    // and the active-site seam resolves to it, so a consumer never rewrites and restores the
    // tracked site.config.ts around a build. Unset -> the committed seam resolves normally, so
    // this is fully additive.
    //
    // Implemented with NormalModuleReplacementPlugin (not resolve.alias): Next resolves the
    // `@/` prefix through its own tsconfig-paths plugin, which wins over a plain alias, so we
    // rewrite the `@/site.config` request itself to the external absolute path before
    // resolution. Only that one request is rewritten; every other `@/` import is untouched.
    // (This is the APP's webpack compilation graph; it is separate from - and does not affect
    // - this file's own top-level `require(configPath)` above, which reads SITE_CONFIG_PATH
    // directly for the same reason.)
    const external = process.env.SITE_CONFIG_PATH;
    if (external) {
      const target = path.resolve(process.cwd(), external);
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^@\/site\.config$/, (resource: { request: string }) => {
          resource.request = target;
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
