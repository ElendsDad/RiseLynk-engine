import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Prose from "@/components/Prose";
import { resolveReviewCta } from "@/lib/gbp.mjs";
import { resolveCtaBannerMode } from "@/lib/cta-banner.mjs";

// The closing call-to-action band. Additive DUSK option (Section.dusk): the band descends onto a
// dark-in-both-themes surface derived from the two brand colors (globals.css .dusk + .section--dusk),
// for the page's final CTA. Absent renders the standard band byte-for-byte unchanged.
//
// Section.reviewAsk: when true, also renders the equal public GBP review CTA from
// business.gbp.reviewUrl (fail-closed if unset). Same URL for every visitor — no filter.
//
// Multi-CTA (Section.cta[]): when present and non-empty, replaces the single ctaLabel/ctaHref
// button with up to 6 buttons (lib/cta-banner.mjs). Absent/empty keeps the legacy branch below
// byte-identical — do not fold the legacy single button through the multi mapper.
export default function CTABanner({ section }: { section: Section }) {
  const review = section.reviewAsk ? resolveReviewCta(site.business?.gbp) : null;
  const ctaMode = resolveCtaBannerMode(section);
  return (
    <section className={`section${section.dusk ? " dusk section--dusk" : ""}`}>
      <div className="container">
        <div className="cta-banner">
          <h2>{section.heading}</h2>
          {section.body ? (
            <p className="lead" style={{ color: "rgba(255,255,255,0.9)", marginInline: "auto" }}>
              <Prose text={section.body} />
            </p>
          ) : null}
          {ctaMode.mode === "multi" ? (
            <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
              {ctaMode.items.map((c, i) => (
                <a key={i} className={`btn btn--${c.variant}`} href={c.href}>
                  {c.label}
                </a>
              ))}
              {review ? (
                <a className="btn" href={review.href} target="_blank" rel="noopener noreferrer">
                  {review.label}
                </a>
              ) : null}
            </div>
          ) : section.ctaLabel || review ? (
            <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
              {section.ctaLabel ? (
                <a className="btn btn--accent" href={section.ctaHref ?? "/contact"}>
                  {section.ctaLabel}
                </a>
              ) : null}
              {review ? (
                <a className="btn" href={review.href} target="_blank" rel="noopener noreferrer">
                  {review.label}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
