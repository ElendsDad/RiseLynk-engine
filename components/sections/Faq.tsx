import type { Section } from "@/lib/config-schema";
import { faqPageLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Prose from "@/components/Prose";
import { styleVariantFor } from "@/lib/style-variant.mjs";

// FAQ section. The visible questions/answers AND the FAQPage JSON-LD are built from the
// SAME `section.faqs` array, so the structured data is verbatim-identical to the on-page
// copy by construction: parity is structural, not a thing anyone has to keep in sync. An
// answer (f.a) may carry inline [label](href) link syntax (Prose / lib/inline-links.mjs);
// faqPageLd strips that syntax back to its visible plain text (label kept, brackets/URL
// dropped) so the JSON-LD stays a mirror of what a reader actually sees.
//
// Teardown P2 7b: style: "collapse" renders each Q/A as a native <details>/<summary>
// disclosure. Absent / unhonored style keeps the flat list byte-identical.
export default function Faq({ section }: { section: Section }) {
  const faqs = section.faqs ?? [];
  if (!faqs.length) return null;
  const collapse = styleVariantFor("faq", section.style) === "collapse";

  return (
    <section className="section" id="faq">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        <div className={`faq${collapse ? " faq--collapse" : ""}`} style={{ marginTop: "1rem" }}>
          {faqs.map((f, i) =>
            collapse ? (
              <details className="faq__qa faq__qa--details" key={i}>
                <summary className="faq__q">{f.q}</summary>
                <p className="faq__a">
                  <Prose text={f.a} />
                </p>
              </details>
            ) : (
              <div className="faq__qa" key={i}>
                <p className="faq__q">{f.q}</p>
                <p className="faq__a">
                  <Prose text={f.a} />
                </p>
              </div>
            ),
          )}
        </div>
      </div>
      <JsonLd data={faqPageLd(faqs)} />
    </section>
  );
}
