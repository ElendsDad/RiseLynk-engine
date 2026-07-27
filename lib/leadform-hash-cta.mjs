// =============================================================================
// Leadform hash-CTA progressive enhancement.
//
// PROBLEM THIS CLOSES: hero / pricing / CTA-banner anchors like
// `href="/#request-access"` always navigate/scroll. The modal request-access
// form only opens from its section-local trigger. Live CTAs on riselynk.com
// therefore miss the pop-up and land on the inline section instead.
//
// MECHANISM (hash convention, no new schema field): after the modal form
// enhances, bind a scoped listener that:
//   1. intercepts same-page clicks whose href hash matches this section's DOM
//      id, preventDefault(), and calls the SAME openModal() the local trigger
//      uses;
//   2. on bind (load) and on hashchange, opens when location.hash matches.
//
// HASH CLEARING: after a successful open we history.replaceState the hash away.
// Leaving `#request-access` in the URL re-opens the modal on every back /
// forward navigation and on refresh - a second bug. replaceState (not
// pushState) keeps history clean and does not invent a new history entry.
//
// FALLBACK: the href stays a real same-page link. Without this binder (no-JS,
// JS error, pre-hydration) the browser scrolls to the SSR form. The binder is
// only mounted from RequestAccessForm after enhance; a page with no modal
// leadform never calls bindLeadformHashCta, so there is no stray global handler.
//
// Plain .mjs so tools/leadform-hash-cta.test.mjs imports the exact client code,
// same shared-module pattern as lib/celebrate.mjs.
// =============================================================================

/**
 * True when `hash` is exactly `#${sectionId}` (leading '#' required).
 * @param {string | null | undefined} hash
 * @param {string} sectionId
 */
export function hashMatchesSection(hash, sectionId) {
  if (!sectionId || typeof hash !== "string" || !hash) return false;
  return hash === `#${sectionId}`;
}

/**
 * True when `href` is a same-page link whose hash targets `sectionId`.
 * Same-page means: hash-only, or same origin + same pathname as the current
 * page. Cross-origin and other-path links are left alone (real navigation).
 *
 * @param {string | null | undefined} href
 * @param {string} sectionId
 * @param {string} origin - window.location.origin
 * @param {string} pathname - window.location.pathname
 */
export function hrefTargetsSection(href, sectionId, origin, pathname) {
  if (!href || typeof href !== "string" || !sectionId) return false;
  const trimmed = href.trim();
  if (!trimmed || /^\s*javascript:/i.test(trimmed)) return false;
  try {
    const base = `${origin || "http://localhost"}${pathname || "/"}`;
    const u = new URL(trimmed, base);
    if (!hashMatchesSection(u.hash, sectionId)) return false;
    // Same-page only: other paths keep real navigation (e.g. /help → /#id
    // lands on home, where the load binder opens the modal).
    if (origin && u.origin !== origin) return false;
    return u.pathname === (pathname || "/");
  } catch {
    return false;
  }
}

function clearSectionHash(win, sectionId) {
  try {
    if (!hashMatchesSection(win.location && win.location.hash, sectionId)) return;
    const path = (win.location.pathname || "/") + (win.location.search || "");
    if (win.history && typeof win.history.replaceState === "function") {
      win.history.replaceState(win.history.state ?? null, "", path);
    } else {
      win.location.hash = "";
    }
  } catch {
    // A hostile history stub must never break the open path.
  }
}

/**
 * Bind hash-CTA enhancement for one modal leadform section.
 * Returns a teardown that removes every listener this bind attached.
 *
 * @param {{ sectionId: string, openModal: () => void, win?: any }} opts
 * @returns {() => void}
 */
export function bindLeadformHashCta({ sectionId, openModal, win = typeof window === "undefined" ? null : window }) {
  if (!win || !win.document || !sectionId || typeof openModal !== "function") {
    return () => {};
  }

  function openFromHash() {
    if (!hashMatchesSection(win.location && win.location.hash, sectionId)) return;
    openModal();
    clearSectionHash(win, sectionId);
  }

  function onClick(e) {
    if (!e || e.defaultPrevented) return;
    const raw = e.target;
    if (!raw) return;
    // Element.closest when present; the test stub puts closest on the anchor.
    const anchor =
      typeof raw.closest === "function"
        ? raw.closest("a[href]")
        : raw.tagName === "A"
          ? raw
          : null;
    if (!anchor) return;
    const href = typeof anchor.getAttribute === "function" ? anchor.getAttribute("href") : null;
    const origin = win.location && win.location.origin;
    const pathname = win.location && win.location.pathname;
    if (!hrefTargetsSection(href, sectionId, origin, pathname)) return;
    e.preventDefault();
    openModal();
    clearSectionHash(win, sectionId);
  }

  function onHashChange() {
    openFromHash();
  }

  win.document.addEventListener("click", onClick);
  win.addEventListener("hashchange", onHashChange);

  // Load path: open if we arrived with the hash already set.
  openFromHash();

  return function teardown() {
    try {
      win.document.removeEventListener("click", onClick);
      win.removeEventListener("hashchange", onHashChange);
    } catch {
      // ignore
    }
  };
}
