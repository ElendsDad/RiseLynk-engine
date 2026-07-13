import type { Section } from "@/lib/config-schema";

export default function Testimonials({ section }: { section: Section }) {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        <div className="quotes" style={{ marginTop: "1.5rem" }}>
          {(section.quotes ?? []).map((q, i) => (
            <figure className="quote" key={i}>
              <blockquote>{q.quote}</blockquote>
              <figcaption>
                <cite>{q.author}</cite>
                {q.role ? <span>, {q.role}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
