import type { Section } from "@/lib/config-schema";

// The closing call-to-action band. Additive DUSK option (Section.dusk): the band descends onto a
// dark-in-both-themes surface derived from the two brand colors (globals.css .dusk + .section--dusk),
// for the page's final CTA. Absent renders the standard band byte-for-byte unchanged.
export default function CTABanner({ section }: { section: Section }) {
  return (
    <section className={`section${section.dusk ? " dusk section--dusk" : ""}`}>
      <div className="container">
        <div className="cta-banner">
          <h2>{section.heading}</h2>
          {section.body ? (
            <p className="lead" style={{ color: "rgba(255,255,255,0.9)", marginInline: "auto" }}>
              {section.body}
            </p>
          ) : null}
          {section.ctaLabel ? (
            <div style={{ marginTop: "1.5rem" }}>
              <a className="btn btn--accent" href={section.ctaHref ?? "/contact"}>
                {section.ctaLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
