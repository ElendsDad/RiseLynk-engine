import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
