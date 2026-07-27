"use client";

import { useEffect, useState } from "react";
import { site } from "@/site.config";
import { resolveAnnouncement, announcementActive } from "../lib/announcement.mjs";

// Sitewide announcement bar (engine feature-backlog #26): a config-driven,
// time-bounded, dismissible notice surface. Dependency-free, palette read from
// the two-color contract (the .announcement-bar CSS in globals.css themes off the
// same --color-* vars as everything else), config-gated (site.announcement).
//
// Like CookieNotice, the decision is made on the CLIENT after mount: the server
// render and the first client paint are both null, so there is no hydration
// mismatch and no flash for a visitor who already dismissed it OR who arrives
// after the window has closed. Deciding client-side is also what makes the time
// bound honest for a STATIC build: a site built inside the window auto-hides once
// the window closes, against the viewer's real clock, with no rebuild.
//
// The announcement text and link label are held to the same banned-phrase claims
// wall as every other copy surface at BUILD time (next.config.ts imports
// announcementLintTargets + the shared lintString and FAILs the build on a
// violation), so nothing unattested or off-voice can reach this component.
export default function Announcement() {
  const resolved = resolveAnnouncement(site.announcement);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!resolved) return;
    // Outside the time window? Never show (auto-hide at view time).
    if (!announcementActive(site.announcement, Date.now())) return;
    // Already dismissed this specific announcement? Stay hidden.
    if (resolved.dismissible) {
      try {
        if (localStorage.getItem(resolved.storageKey) === "1") return;
      } catch {
        /* storage blocked: still show; the dismissal is in-session only */
      }
    }
    setShow(true);
    // storageKey is the stable identity of this announcement; re-run if the site
    // swaps to a different one (SPA nav keeps the layout mounted).
  }, [resolved?.storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!resolved || !show) return null;

  const dismiss = () => {
    if (resolved.dismissible) {
      try {
        localStorage.setItem(resolved.storageKey, "1");
      } catch {
        /* storage blocked: hide for this session anyway */
      }
    }
    setShow(false);
  };

  return (
    <div className="announcement-bar" role="status" aria-live="polite">
      <p className="announcement-bar__msg">
        <span>{resolved.text}</span>{" "}
        {resolved.href ? (
          <a className="announcement-bar__link" href={resolved.href}>
            {resolved.linkLabel}
          </a>
        ) : null}
      </p>
      {resolved.dismissible ? (
        <button
          type="button"
          className="announcement-bar__close"
          onClick={dismiss}
          aria-label={resolved.dismissLabel}
        >
          <span aria-hidden="true">{"\u00D7"}</span>
        </button>
      ) : null}
    </div>
  );
}
