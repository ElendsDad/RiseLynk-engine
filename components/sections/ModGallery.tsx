import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";

// Modernization before/after gallery (optional, default OFF: renders only when the section
// is enabled AND has projects). Photo pairs with equipment class, scope, and timeline, all
// from config/assets. Ships disabled on a site with no real project photos, which is also
// the proof that the optional toggle produces no HTML when off.
export default function ModGallery({ section }: { section: Section }) {
  if (section.enabled === false) return null;
  const projects = section.projects ?? [];
  if (!projects.length) return null;
  return (
    <section className="section section--surface" id="modernization">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        <div className="mods" style={{ marginTop: "2rem" }}>
          {projects.map((p, i) => (
            <article className="mod" key={i}>
              <div className="mod__pair">
                <figure>
                  <img src={p.before.src} alt={p.before.alt} loading="lazy" />
                  <figcaption>Before</figcaption>
                </figure>
                <figure>
                  <img src={p.after.src} alt={p.after.alt} loading="lazy" />
                  <figcaption>After</figcaption>
                </figure>
              </div>
              <div className="mod__meta">
                {p.equipmentClass ? (
                  <span>
                    <strong>Equipment</strong> {p.equipmentClass}
                  </span>
                ) : null}
                {p.scope ? (
                  <span>
                    <strong>Scope</strong> {p.scope}
                  </span>
                ) : null}
                {p.timeline ? (
                  <span>
                    <strong>Timeline</strong> {p.timeline}
                  </span>
                ) : null}
              </div>
              {p.caption ? <p className="mod__caption">{p.caption}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
