import type { Section } from "@/lib/config-schema";

// The feature (services) card grid. Additive treatments per FeatureItem: an optional mono BADGE
// (e.g. "SOON"), a FLAGSHIP variant (full-row span + accent left edge), and a site-supplied
// MINI-VISUAL slot (raw HTML/SVG the engine frames, aria-hidden, with a reduced-motion-safe
// reveal). A card that sets only title/body/icon renders byte-for-byte as before: the badge is
// null, the class is plain "card", and no viz wrapper is emitted.
export default function Services({ section }: { section: Section }) {
  return (
    <section className="section section--surface" id="services">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? <p className="lead">{section.body}</p> : null}
        <div className="grid" style={{ marginTop: "2rem" }}>
          {(section.items ?? []).map((it, i) => {
            const flagship = Boolean(it.flagship);
            const hasViz = Boolean(it.viz);
            const cls = `card${flagship ? " card--flagship" : ""}${hasViz ? " card--hasviz" : ""}`;
            const inner = (
              <>
                {it.badge ? <span className="card__badge">{it.badge}</span> : null}
                {it.icon ? <div className="icon" aria-hidden="true">{it.icon}</div> : null}
                <h3>{it.title}</h3>
                <p>{it.body}</p>
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
