"use client";

import { useEffect, useState } from "react";
import { site } from "@/site.config";

// Informational cookie notice, harvested from RiseLynk's apps/landing/cookie-notice.js
// and generalized for the engine. Dependency-free (no libraries), palette read
// from the two-color contract (the .cookie-bar CSS in globals.css themes off the
// same --color-* vars as everything else), config-gated (site.cookieNotice), a
// localStorage ack so a dismissal persists, strictly-necessary framing. This is
// an informational banner, not a consent wall.
const ACK_KEY = "cookie-notice-ack";

export default function CookieNotice() {
  const cfg = site.cookieNotice;
  const [show, setShow] = useState(false);

  // Decide on the client only, after mount: server render is null and so is the
  // first client paint, so there is no hydration mismatch and no flash for a
  // visitor who already dismissed it.
  useEffect(() => {
    try {
      if (localStorage.getItem(ACK_KEY) === "1") return;
    } catch {
      /* storage blocked: still show; the dismissal is in-session only */
    }
    setShow(true);
  }, []);

  if (!cfg?.enabled || !show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(ACK_KEY, "1");
    } catch {
      /* storage blocked: hide for this session anyway */
    }
    setShow(false);
  };

  // Default mentions lead-source capture on form submit (UTM / landing page /
  // referring site without its query string). Not a cookie, but collection, so
  // the banner says it. Sites override via cookieNotice.message when needed.
  const message =
    cfg.message ??
    "This site uses only the cookies it needs to work. No advertising or tracking. When you send a form, we keep the page you were on, campaign tags from the link, and the referring site (without its query string) so we know how you found us.";
  const buttonLabel = cfg.buttonLabel ?? "Got it";
  const policyLabel = cfg.policyLabel ?? "Cookie notice";

  return (
    <div className="cookie-bar" role="region" aria-label="Cookie notice">
      <p className="cookie-bar__msg">
        {message}{" "}
        {cfg.policyHref ? <a href={cfg.policyHref}>{policyLabel}</a> : null}
      </p>
      <button type="button" className="btn btn--primary cookie-bar__btn" onClick={dismiss}>
        {buttonLabel}
      </button>
    </div>
  );
}
