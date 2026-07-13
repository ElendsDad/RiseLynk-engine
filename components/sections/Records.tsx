import type { Section } from "@/lib/config-schema";

// Records-transparency section (optional, default OFF: renders only when config.records is
// present and not disabled). Owner language on the documentation a customer gets: per-unit
// history, what happens after a callback, what a periodic test involves. Describes real
// product behavior, never a compliance claim. Code requirements stay hedged to the AHJ.
export default function Records({ section }: { section: Section }) {
  const r = section.records;
  if (!r || r.enabled === false) return null;
  return (
    <section className="section" id="records">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {r.intro ? <p className="lead">{r.intro}</p> : null}
        {r.items?.length ? (
          <div className="records">
            {r.items.map((it, i) => (
              <article className="records__item" key={i}>
                <h3>{it.title}</h3>
                <p>{it.body}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
