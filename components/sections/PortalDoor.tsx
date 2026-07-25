import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";

// Customer-portal door: an existing-customers entry point that deep-links into the
// tenant's live tokenized customer portal, with an optional screenshot. Pure surfacing of
// a link config provided; the site never reads the portal or the tenant DB itself.
export default function PortalDoor({ section }: { section: Section }) {
  if (!section.portalUrl) return null;
  return (
    <section className="section" id="portal">
      <div className="container portal-door">
        <div className="portal-door__copy">
          {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
          {section.heading ? <h2>{section.heading}</h2> : null}
          {section.body ? (
            <p className="lead">
              <Prose text={section.body} />
            </p>
          ) : null}
          <a className="btn btn--primary" href={section.portalUrl} target="_blank" rel="noopener noreferrer">
            {section.ctaLabel ?? "Open the customer portal"}
          </a>
        </div>
        {section.screenshotUrl ? (
          <div className="portal-door__shot">
            <img src={section.screenshotUrl} alt="Customer portal preview" loading="lazy" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
