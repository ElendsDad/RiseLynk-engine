import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";

// Dense resource / link-directory section (teardown 2026-07-24). Compact cards for
// scanning many entries (state programs, codes, associations). Display-only: no
// JSON-LD. Absent / empty directoryItems renders nothing so a config without this
// section is unchanged.
export default function Directory({ section }: { section: Section }) {
  const items = section.directoryItems ?? [];
  if (!items.length) return null;
  return (
    <section className="section" id="directory">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        <div className="directory">
          {items.map((it, i) => (
            <article className="directory__item" key={i}>
              {it.meta ? <span className="directory__meta">{it.meta}</span> : null}
              <h3 className="directory__title">{it.title}</h3>
              {it.body ? <p className="directory__body">{it.body}</p> : null}
              {it.href ? (
                <a className="directory__link" href={it.href} rel="noopener noreferrer">
                  {it.ctaLabel ?? "Open"}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
