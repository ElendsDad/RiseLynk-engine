import type { Section } from "@/lib/config-schema";

export default function About({ section }: { section: Section }) {
  return (
    <section className="section" id="about">
      <div className="container about">
        <div>
          {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
          {section.heading ? <h2>{section.heading}</h2> : null}
          {section.body
            ? section.body.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
            : null}
        </div>
        {section.backgroundUrl ? (
          <img src={section.backgroundUrl} alt="" style={{ borderRadius: "var(--radius)" }} />
        ) : null}
      </div>
    </section>
  );
}
