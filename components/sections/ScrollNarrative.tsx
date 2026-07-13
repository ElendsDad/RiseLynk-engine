"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { Section } from "@/lib/config-schema";

// Pinned scroll-narrative, harvested from riselynk.com's #see-it story (spec
// RiseLynk/docs/specs/landing-machine-room-craft.md) as a brand-neutral engine capability.
//
// STRUCTURE, not brand: the engine supplies the sticky-stage track, the threshold-scene
// motion, and the progress rail; every scene's plate, caption, image, and video are per-site
// config. Zero runtime libraries: motion is a passive scroll listener plus requestAnimationFrame
// with class swaps; native scroll always drives, nothing intercepts wheel or touch.
//
// Progressive enhancement (this is a "use client" component, so its markup is server-rendered
// to static HTML on build and only enhanced after hydration):
//   - No JS: the server HTML is the stacked step timeline, fully readable. The .story-js class
//     that gates the pinned CSS is only ever ADDED by the effect below.
//   - prefers-reduced-motion or narrow (< 900px): the pinned CSS is behind a media query that
//     excludes both, and the effect bails, so the stacked timeline stands.
//   - The caption is the SAME DOM node in both the animated stage and the fallback, so the two
//     can never disagree (captions match the animated content verbatim, by construction).
export default function ScrollNarrative({ section }: { section: Section }) {
  const scenes = section.scenes ?? [];
  // pinned defaults TRUE (back-compat). When explicitly false the effect never runs, so .story-js
  // is never added and the base stacked step timeline stands: every scene caption and video is in
  // the server HTML already, so nothing is lost, and no scroll pinning or hijack happens.
  const pinned = section.pinned !== false;
  const rootRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!pinned) return;
    const root = rootRef.current;
    const rail = railRef.current;
    const track = root?.querySelector<HTMLElement>(".narrative__track");
    if (!root || !rail || !track) return;

    // Gate the pinned CSS. Nothing is hidden before this: the stacked timeline is the base.
    root.classList.add("story-js");
    const sceneEls = Array.from(root.querySelectorAll<HTMLElement>(".scene"));
    const wide = window.matchMedia("(min-width: 900px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ticking = false;

    function frame() {
      ticking = false;
      // Only drive the pinned stage on wide screens with motion allowed; otherwise the stacked
      // timeline is showing and there is nothing to animate.
      if (!track || !rail || !wide.matches || reduce.matches) return;
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      if (span <= 0) return;
      const p = Math.min(1, Math.max(0, -r.top / span));
      rail.style.transform = "scaleY(" + p.toFixed(4) + ")";
      const idx = Math.min(sceneEls.length - 1, Math.floor(p * sceneEls.length));
      sceneEls.forEach((s, i) => {
        s.classList.toggle("is-on", i === idx);
        s.classList.toggle("is-past", i < idx);
      });
    }
    function queue() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    queue();
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      root.classList.remove("story-js");
    };
  }, [scenes.length, pinned]);

  if (scenes.length === 0) return null;

  // The fixed per-scene track height is reserved in the SSR markup (inline --scene-count), so
  // the pinned layout claims its space from first paint: no layout shift when JS enhances it.
  const trackStyle = { "--scene-count": scenes.length } as CSSProperties;

  return (
    <section className="section narrative" ref={rootRef}>
      <div className="narrative__track" style={trackStyle}>
        <div className="narrative__stage">
          <div className="container narrative__head">
            {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
            {section.heading ? <h2>{section.heading}</h2> : null}
          </div>
          <div className="container narrative__body">
            <div className="narrative__rail" aria-hidden="true">
              <i ref={railRef} />
            </div>
            <ol className="narrative__scenes">
              {scenes.map((sc, i) => (
                // The first scene starts lit, so the pinned stage shows content on first paint
                // (before the first rAF frame). In the stacked timeline this class is inert.
                <li className={i === 0 ? "scene is-on" : "scene"} key={i}>
                  {sc.label ? <span className="scene__plate">{sc.label}</span> : null}
                  {sc.image ? (
                    <div className="scene__visual">
                      <img src={sc.image.src} alt={sc.image.alt} loading="lazy" />
                    </div>
                  ) : sc.video ? (
                    <div className="scene__visual">
                      <video
                        src={sc.video.src}
                        poster={sc.video.poster}
                        controls
                        muted
                        playsInline
                        preload="none"
                        aria-label={sc.video.label}
                      />
                    </div>
                  ) : null}
                  <p className="scene__cap">{sc.caption}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
