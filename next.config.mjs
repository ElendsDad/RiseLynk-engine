import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  //     Cloudflare Turnstile host is allowed so an opted-in site's widget still loads.
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
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "connect-src 'self' https://challenges.cloudflare.com",
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
    const external = process.env.SITE_CONFIG_PATH;
    if (external) {
      const target = path.resolve(process.cwd(), external);
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^@\/site\.config$/, (resource) => {
          resource.request = target;
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
