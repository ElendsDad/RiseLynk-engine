import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";

// Elevator-contractor service lines: maintenance, repair, modernization, periodic testing.
// Every word is config. Each line can carry a short list of points and a link.
export default function ContractorServices({ section }: { section: Section }) {
  const lines = section.serviceLines ?? [];
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
        <div className="grid grid--services" style={{ marginTop: "2rem" }}>
          {lines.map((line, i) => (
            <article className="card svc-card" key={i}>
              <h3>{line.title}</h3>
              <p>{line.body}</p>
              {line.points?.length ? (
                <ul className="svc-card__points">
                  {line.points.map((pt, j) => (
                    <li key={j}>{pt}</li>
                  ))}
                </ul>
              ) : null}
              {line.href ? (
                <a className="svc-card__link" href={line.href}>
                  Learn more
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
