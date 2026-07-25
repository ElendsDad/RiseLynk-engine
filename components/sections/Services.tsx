import type { Section } from "@/lib/config-schema";
import Icon from "@/components/Icon";
import Prose from "@/components/Prose";
import { styleSuffix } from "@/lib/style-variant.mjs";

// The feature (services) card grid. Additive treatments per FeatureItem: an optional mono BADGE
// (e.g. "SOON"), a FLAGSHIP variant (full-row span + accent left edge), a one-line WHO/audience
// note (engine feedback #5, mirrors PricingTier.who), and a site-supplied MINI-VISUAL slot (raw
// HTML/SVG the engine frames, aria-hidden, with a reduced-motion-safe reveal). A card that sets
// only title/body/icon renders byte-for-byte as before: the badge is null, no who line, the
// class is plain "card", and no viz wrapper is emitted.
//
// Section.style "ribbon" (expressive pack): the grid gains .grid--ribbon and the CSS layer
// does the rest (stacked-depth cards; each card's existing badge re-renders as a folded edge
// ribbon). Resolution lives in lib/style-variant.mjs; absent (or any style this section does
// not honor) the suffix is "" and the markup is byte-identical.
export default function Services({ section }: { section: Section }) {
  return (
    <section className="section section--surface" id="services">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        <div className={`grid${styleSuffix("services", section.style, "grid")}`} style={{ marginTop: "2rem" }}>
          {(section.items ?? []).map((it, i) => {
            const flagship = Boolean(it.flagship);
            const hasViz = Boolean(it.viz);
            const cls = `card${flagship ? " card--flagship" : ""}${hasViz ? " card--hasviz" : ""}`;
            const inner = (
              <>
                {it.badge ? <span className="card__badge">{it.badge}</span> : null}
                {it.iconName ? (
                  <div className="icon icon--builtin" aria-hidden="true">
                    <Icon name={it.iconName} />
                  </div>
                ) : it.icon ? (
                  <div className="icon" aria-hidden="true">{it.icon}</div>
                ) : null}
                <h3>{it.title}</h3>
                {it.who ? <p className="card__who">{it.who}</p> : null}
                <p>{it.body}</p>
                {it.href ? (
                  <a className="svc-card__link" href={it.href}>
                    Learn more
                  </a>
                ) : null}
              </>
            );
            return (
              <article className={cls} key={i}>
                {hasViz ? <div className="card__body">{inner}</div> : inner}
                {hasViz ? (
                  <div
                    className="card__viz"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: it.viz as string }}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
