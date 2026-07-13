import type { Section } from "@/lib/config-schema";
import { faqPageLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

// FAQ section. The visible questions/answers AND the FAQPage JSON-LD are built from the
// SAME `section.faqs` array, so the structured data is verbatim-identical to the on-page
// copy by construction: parity is structural, not a thing anyone has to keep in sync.
export default function Faq({ section }: { section: Section }) {
  const faqs = section.faqs ?? [];
  if (!faqs.length) return null;
  return (
    <section className="section" id="faq">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? <p className="lead">{section.body}</p> : null}
        <div className="faq" style={{ marginTop: "1rem" }}>
          {faqs.map((f, i) => (
            <div className="faq__qa" key={i}>
              <p className="faq__q">{f.q}</p>
              <p className="faq__a">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
      <JsonLd data={faqPageLd(faqs)} />
    </section>
  );
}
