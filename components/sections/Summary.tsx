import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";

// Answer-first summary block (the GEO idiom ported from riselynk.com articles): a labelled
// card that states the answer up front as a short ordered list, so an AI answer engine can
// lift a clean, self-contained response. Renders the label, an intro, and the points.
export default function Summary({ section }: { section: Section }) {
  const points = section.points ?? [];
  const ordered = section.ordered !== false; // default ordered
  const List = ordered ? "ol" : "ul";
  return (
    <section className="section" id="summary">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        <div className="summary" role="note">
          <span className="summary__label">{section.summaryLabel ?? "The short version"}</span>
          {section.body ? (
            <p>
              <Prose text={section.body} />
            </p>
          ) : null}
          {points.length ? (
            <List className="summary__points">
              {points.map((pt, i) => (
                <li key={i}>
                  <Prose text={pt} />
                </li>
              ))}
            </List>
          ) : null}
        </div>
      </div>
    </section>
  );
}
