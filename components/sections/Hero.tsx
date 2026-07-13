import type { HeroCta, Section } from "@/lib/config-schema";
import { site } from "@/site.config";

// Normalize the hero's call(s) to action. Back-compat: when `cta[]` is absent the hero renders
// the single legacy ctaLabel/ctaHref exactly as before (variant "accent", href fallback /contact).
// When `cta[]` is present (1-3 items) it replaces the single CTA; each item's variant defaults to
// "primary" and its href falls back to /contact, matching the legacy fallback.
function heroCtas(section: Section): HeroCta[] {
  if (section.cta && section.cta.length) {
    return section.cta.slice(0, 3).map((c) => ({ label: c.label, href: c.href, variant: c.variant ?? "primary" }));
  }
  if (section.ctaLabel) {
    return [{ label: section.ctaLabel, href: section.ctaHref, variant: "accent" }];
  }
  return [];
}

export default function Hero({ section }: { section: Section }) {
  const hasImg = Boolean(section.backgroundUrl);
  // R5.1 aurora: brand-tinted drifting blobs behind the hero, only on the plain (non-image) hero
  // and only when the site opts in (craft.aurora). Pure CSS; the drift is settled by the master
  // reduced-motion guard, and the blobs are aria-hidden decoration.
  const auroraOn = Boolean(site.craft?.aurora) && !hasImg;
  const ctas = heroCtas(section);
  const proof = section.proof ?? [];
  // Per-site hero-viz slot: the SITE supplies the markup, the engine only frames it. When present
  // the hero becomes a two-column split on wide screens (hero--split); absent leaves it unchanged.
  const vizOn = Boolean(section.heroViz);
  return (
    <section
      className={`hero${hasImg ? " hero--image" : ""}${vizOn ? " hero--split" : ""}`}
      style={hasImg ? { backgroundImage: `url(${section.backgroundUrl})` } : undefined}
    >
      {auroraOn ? (
        <div className="hero__aurora" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      ) : null}
      <div className={hasImg ? "hero__overlay" : ""}>
        <div className="container hero__inner">
          {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
          <h1>{section.heading}</h1>
          {section.body ? <p className="lead">{section.body}</p> : null}
          {ctas.length ? (
            <div className="hero__cta">
              {ctas.map((c, i) => (
                <a key={i} className={`btn btn--${c.variant ?? "primary"}`} href={c.href ?? "/contact"}>
                  {c.label}
                </a>
              ))}
            </div>
          ) : null}
          {proof.length ? (
            <ul className="hero__proof" role="list">
              {proof.map((p, i) => (
                <li key={i}>
                  <i aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
          {vizOn ? (
            <div
              className="hero__viz"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: section.heroViz as string }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
