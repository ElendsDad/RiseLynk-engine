import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/site.config";
import {
  themeVars,
  craftDataAttr,
  craftVars,
  craftFontPreloads,
  craftMotionJs,
  themeEnabled,
  ssrThemeAttr,
  themeSheetCss,
  themeBootJs,
  themeMetaColor,
} from "@/lib/theme";
import { siteGraphLd, isIndexable } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import JsonLd from "@/components/JsonLd";
import CallBar from "@/components/CallBar";
import CookieNotice from "@/components/CookieNotice";

export const metadata: Metadata = {
  title: {
    default: site.business.name,
    template: `%s${site.seo.titleSuffix ?? ` | ${site.business.name}`}`,
  },
  description: site.business.tagline,
  metadataBase: site.seo.domain ? new URL(site.seo.domain) : undefined,
  openGraph: {
    title: site.business.name,
    description: site.business.tagline,
    type: "website",
    images: site.seo.ogImage ? [site.seo.ogImage] : undefined,
  },
  // Favicon / app-icon (feature-backlog #1). Emitted only when the brand supplies a mark,
  // so a config without it keeps Next's default favicon (fully additive).
  ...(site.brand.faviconUrl || site.brand.appleTouchIconUrl
    ? {
        icons: {
          ...(site.brand.faviconUrl
            ? { icon: site.brand.faviconUrl, shortcut: site.brand.faviconUrl }
            : {}),
          ...(site.brand.appleTouchIconUrl ? { apple: site.brand.appleTouchIconUrl } : {}),
        },
      }
    : {}),
  // Draft / domain-less builds carry robots:noindex on every page (no page overrides it).
  ...(isIndexable(site) ? {} : { robots: { index: false, follow: false } }),
};

// The browser-chrome color. Only emitted for a theme-enabled site, defaulted to the contract
// colors (#fafaf7 light / #0f1412 dark); the nav toggle keeps it in step at runtime. A site
// with no theme block exports no viewport theme-color (unchanged).
export const viewport: Viewport = themeEnabled(site.theme)
  ? { themeColor: themeMetaColor(site.theme) }
  : {};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // R5 design-system craft: data-craft gates the CSS patterns, craftVars tunes the light,
  // and the font preloads are emitted only when the self-hosted pairing is enabled. All are
  // no-ops when the site declares no `craft` block, so the default output is unchanged.
  const craftAttr = craftDataAttr(site.craft);
  const fontPreloads = craftFontPreloads(site.craft);
  // The shared craft-motion runtime (glass pointer-glow + magnetic CTA). Empty string when the
  // site opts into neither, so the <script> below is not emitted (unchanged output).
  const craftMotion = craftMotionJs(site.craft);
  // Dual-theme layer (G1 + G2). All no-ops when the site declares no `theme` block, so the
  // default output is byte-for-byte unchanged. When enabled: a "system" default emits NO SSR
  // data-theme (P2) so the boot script and media query resolve it; light/dark defaults emit it
  // for a flash-free first paint. themeVars drops the alias bridge from the inline style (P0)
  // so the generated sheet OWNS --color-* under [data-theme].
  const themeOn = themeEnabled(site.theme);
  const ssrTheme = ssrThemeAttr(site.theme);
  const themeSheet = themeSheetCss(site.brand, site.theme);
  const themeBoot = themeBootJs(site.theme);
  return (
    <html
      lang="en"
      style={{ ...themeVars(site.brand, site.theme), ...craftVars(site.craft) }}
      data-craft={craftAttr}
      {...(ssrTheme ? { "data-theme": ssrTheme } : {})}
    >
      <body>
        {/* P1: the generated token sheet is pinned as the first child of <body>, BEFORE the
            boot script, with NO precedence prop. React 19 hoists a <style> to <head> only when
            given `precedence`, and that async hoist can reintroduce FOUC; a plain in-place
            <style> renders deterministically at the top of the body, so the boot script that
            follows sets data-theme against tokens that are already parsed. */}
        {themeOn ? <style dangerouslySetInnerHTML={{ __html: themeSheet }} /> : null}
        {themeOn ? <script dangerouslySetInnerHTML={{ __html: themeBoot }} /> : null}
        {fontPreloads.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <JsonLd data={siteGraphLd(site)} />
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CallBar />
        {site.cookieNotice?.enabled ? <CookieNotice /> : null}
        <Analytics />
        {craftMotion ? <script dangerouslySetInnerHTML={{ __html: craftMotion }} /> : null}
      </body>
    </html>
  );
}
