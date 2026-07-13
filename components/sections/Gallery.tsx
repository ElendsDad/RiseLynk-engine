import type { Section } from "@/lib/config-schema";

export default function Gallery({ section }: { section: Section }) {
  return (
    <section className="section section--surface" id="gallery">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        <div className="gallery" style={{ marginTop: "1.5rem" }}>
          {(section.images ?? []).map((img, i) => (
            <img key={i} src={img.src} alt={img.alt} loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}
