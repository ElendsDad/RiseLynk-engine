import Link from "next/link";
import { site } from "@/site.config";
import { navPages, hrefFor, publishedArticles } from "@/lib/config-schema";
import { themeEnabled, themeToggleJs, navChromeJs } from "@/lib/theme";
import { resolveHeaderLogo } from "@/lib/brand-logo.mjs";

const telHref = (p: string) => `tel:${p.replace(/[^0-9+]/g, "")}`;

export default function Header() {
  // The 44px nav moon/sun toggle renders only when the site enables the dual-theme block.
  // Its runtime script (persist + meta theme-color swap) rides alongside it, so a site with
  // no theme block emits neither the button nor the script (unchanged).
  const themeOn = themeEnabled(site.theme);
  // Header-nav chrome (NavConfig). All default OFF: a site with no `nav` block emits no condense
  // class, no progress hairline, no blog link, and no condense script, so the header is unchanged
  // aside from the mobile overflow fold (teardown P2 7c), which is ON for every site so phone
  // nav never stays a wrapping flat row.
  const nav = site.nav;
  const condenseOn = Boolean(nav?.condense);
  const progressOn = Boolean(nav?.progress);
  // The /blog nav link renders only when a label is set AND the blog actually publishes an article
  // (the index 404s otherwise), so the nav never links a dead route.
  const blogOn = Boolean(nav?.blogLabel) && publishedArticles(site).length > 0;
  const condenseJs = navChromeJs(nav);
  // Logo-surface feedback items 1 + 3 (logo-replaces-name, per-theme variant). Absent flags
  // resolve to the pre-existing shape: a single logo image, alt="", beside the name text.
  const logo = resolveHeaderLogo(site.brand, site.business.name, themeOn);
  return (
    <>
      {progressOn ? <div className="scroll-progress" aria-hidden="true" /> : null}
      <header className={`site-header${condenseOn ? " site-header--condense" : ""}`}>
        <div className="container site-header__row">
          <Link href="/" className="brand-mark">
            {logo.showImg ? (
              logo.showDarkVariant ? (
                <>
                  <img className="brand-mark__logo--light" src={logo.logoUrl} alt={logo.imgAlt} />
                  <img className="brand-mark__logo--dark" src={logo.logoUrlDark} alt={logo.imgAlt} />
                </>
              ) : (
                <img src={logo.logoUrl} alt={logo.imgAlt} />
              )
            ) : null}
            {logo.replacesName ? null : <span>{site.business.name}</span>}
          </Link>
          {/* Mobile overflow fold (teardown P2 7c): checkbox + label, no JS required. Wide
              viewports hide the toggle and keep the nav as a horizontal row. */}
          <input
            type="checkbox"
            id="nav-menu"
            className="nav-menu__check"
            aria-label="Open menu"
            aria-controls="primary-nav"
          />
          <label htmlFor="nav-menu" className="nav-menu__toggle">
            <span className="nav-menu__bars" aria-hidden="true" />
            <span className="sr-only">Menu</span>
          </label>
          <nav className="nav" id="primary-nav" aria-label="Primary">
            {navPages(site).map((p) => (
              <Link key={p.slug} href={hrefFor(p.slug)}>
                {p.nav}
              </Link>
            ))}
            {blogOn ? <Link href="/blog">{nav!.blogLabel}</Link> : null}
            {themeOn ? (
              <button type="button" className="theme-btn" id="themeBtn" aria-label="Switch to dark theme">
                <svg
                  className="moon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
                </svg>
                <svg
                  className="sun"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              </button>
            ) : null}
            {site.business.phone ? (
              <a className="btn btn--primary nav__cta" href={telHref(site.business.phone)}>
                Call now
              </a>
            ) : null}
          </nav>
        </div>
        {themeOn ? <script dangerouslySetInnerHTML={{ __html: themeToggleJs(site.theme) }} /> : null}
        {condenseJs ? <script dangerouslySetInnerHTML={{ __html: condenseJs }} /> : null}
      </header>
    </>
  );
}
