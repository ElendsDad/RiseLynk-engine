import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";
import { matrixCellDisplay, normalizeMatrixCells } from "@/lib/matrix-cells.mjs";

// Pricing section (Phase-A product-marketing layer, G4). Renders the plan set from config as a
// row of cards. Display-only: the Offer / AggregateOffer JSON-LD is emitted once on the
// SoftwareApplication node in the site @graph (lib/seo.ts), built from these SAME tiers, so the
// structured offers can never drift from the cards. Brand-neutral: the `highlighted` flag only
// adds a class a site can style (for example the gradient hot-plan price), and the badge text is
// config-supplied. The engine bakes no color and no marketing copy; every value here is config.
//
// Teardown P2 2a: optional `comparisonRows` renders a feature-by-feature matrix under the
// cards. Absent comparisonRows keeps the cards-only markup byte-identical.
export default function Pricing({ section }: { section: Section }) {
  const tiers = section.tiers ?? [];
  if (!tiers.length) return null;
  const rows = section.comparisonRows ?? [];
  const showMatrix = rows.length > 0;

  return (
    <section className="section" id="pricing">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}

        <div className="plans" style={{ marginTop: "1.5rem" }}>
          {tiers.map((t, i) => (
            <article
              className={`plan${t.highlighted ? " plan--highlighted" : ""}${
                section.gradientPrice && t.highlighted ? " plan--hot-gradient" : ""
              }`}
              key={i}
            >
              {t.badge ? <span className="plan__badge">{t.badge}</span> : null}
              <h3 className="plan__name">{t.name}</h3>
              <p className="plan__price">
                {t.price}
                {t.period ? <span className="plan__period"> {t.period}</span> : null}
              </p>
              {t.meta ? <p className="plan__meta">{t.meta}</p> : null}
              {t.who ? <p className="plan__who">{t.who}</p> : null}
              {t.features.length ? (
                <ul className="plan__features">
                  {t.features.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
              ) : null}
              {t.ctaHref ? (
                <a
                  className={`btn ${t.highlighted ? "btn--primary" : "btn--ghost"} plan__cta`}
                  href={t.ctaHref}
                >
                  {t.ctaLabel ?? "Learn more"}
                </a>
              ) : null}
            </article>
          ))}
        </div>

        {showMatrix ? (
          <div className="matrix-wrap" style={{ marginTop: "2rem" }}>
            <table className="matrix matrix--pricing">
              <thead>
                <tr>
                  <th scope="col" className="matrix__corner">
                    <span className="sr-only">Feature</span>
                  </th>
                  {tiers.map((t, i) => (
                    <th scope="col" key={i}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const cells = normalizeMatrixCells(row.cells, tiers.length);
                  return (
                    <tr key={i}>
                      <th scope="row">{row.feature}</th>
                      {cells.map((cell, j) => {
                        const d = matrixCellDisplay(cell);
                        return (
                          <td
                            key={j}
                            className={
                              d.kind === "yes"
                                ? "matrix__cell matrix__cell--yes"
                                : d.kind === "no"
                                  ? "matrix__cell matrix__cell--no"
                                  : "matrix__cell"
                            }
                          >
                            {d.kind === "yes" ? (
                              <span aria-label="Yes">Yes</span>
                            ) : d.kind === "no" ? (
                              <span className="sr-only">No</span>
                            ) : (
                              d.text
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
