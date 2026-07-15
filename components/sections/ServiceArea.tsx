import type { Section } from "@/lib/config-schema";

// Visible service-area list (local-trades conversion batch). Brand-neutral: heading,
// subheading, body, and every area name/note come verbatim from config (claims wall: no
// invented coverage). The same areas feed the areaServed JSON-LD and the llms.txt line
// through lib/area-ld.mjs collectServiceAreas, so the surfaces cannot drift. Renders
// nothing when areas is empty or absent (mirrors the modGallery discipline). Server
// component, no client JS.
export default function ServiceArea({ section }: { section: Section }) {
  const areas = section.areas ?? [];
  if (!areas.length) return null;
  return (
    <section className="section section--surface" id="service-area">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? <p className="lead">{section.body}</p> : null}
        {/* role="list"/"listitem": list-style: none strips the implicit list semantics in
            some browser/AT combinations (a known Safari/VoiceOver behavior), so the areas
            served would announce as plain text rather than a list. The explicit roles
            restore it without changing the visual (still bare, no bullets). */}
        <ul className="grid" role="list" style={{ marginTop: "2rem", listStyle: "none", padding: 0 }}>
          {areas.map((a, i) => (
            <li className="card" role="listitem" key={i}>
              <h3 style={{ marginTop: 0 }}>{a.name}</h3>
              {a.note ? <p>{a.note}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
