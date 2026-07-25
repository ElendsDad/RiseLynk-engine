import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";

export default function Booking({ section }: { section: Section }) {
  if (!section.bookingUrl) return null;
  return (
    <section className="section" id="booking">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        <iframe
          className="booking-embed"
          src={section.bookingUrl}
          title="Book an appointment"
          loading="lazy"
          style={{ marginTop: "1.5rem" }}
        />
      </div>
    </section>
  );
}
