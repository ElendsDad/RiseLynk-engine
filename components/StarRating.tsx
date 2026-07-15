import type { CSSProperties } from "react";
import { starModel, starAriaLabel } from "@/lib/stars.mjs";

// The visible star row (local-trades conversion batch, deliverable 2). Server
// component, no client JS: inline SVG drawn from the lib/stars.mjs starModel plan,
// colored by the accent brand token (two-color contract, no baked color). Claims
// wall: when starModel returns null (no real positive rating) this renders NOTHING;
// there is no default star value. The row is one role="img" with the accessible
// label; the individual glyphs are hidden from assistive tech.

// A five-point star in a 24 box; HALF is its left half, overlaid on the outline to
// draw a half star without per-instance defs/clipPath ids.
const STAR = "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26";
const HALF = "12 2 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26";

export default function StarRating({
  value,
  best = 5,
  style,
}: {
  value: number;
  best?: number;
  style?: CSSProperties;
}) {
  const model = starModel(value, best);
  if (!model) return null;
  const kinds = Array.from({ length: model.best }, (_, i) =>
    i < model.full ? "full" : i < model.full + model.half ? "half" : "empty",
  );
  return (
    <span
      role="img"
      aria-label={starAriaLabel(value, best) ?? undefined}
      style={{ display: "inline-flex", gap: "0.125rem", color: "var(--color-accent)", ...style }}
    >
      {kinds.map((kind, i) => (
        <svg key={i} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          {kind === "full" ? (
            <polygon points={STAR} fill="currentColor" />
          ) : (
            <>
              {/* Optical stroke tweak: a mitered join on the star's sharp inner (concave)
                  vertices reads as pinched/spiky at 18px next to the solid "full" star,
                  which has no stroke at all to fight. A round join softens those inner
                  points so the outline star reads as the same weight, matching the round
                  joins components/Icon.tsx's built-in icon set already uses. */}
              <polygon points={STAR} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              {kind === "half" ? <polygon points={HALF} fill="currentColor" /> : null}
            </>
          )}
        </svg>
      ))}
    </span>
  );
}
