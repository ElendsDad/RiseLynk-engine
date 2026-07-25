import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";
import { matrixCellDisplay, normalizeMatrixCells } from "@/lib/matrix-cells.mjs";

// Neutral capability / feature matrix (teardown P2 7g). Columns and rows are
// entirely config-supplied - no competitor names, no product-category brand
// vocabulary, no baked plans. Absent / empty columns or rows renders nothing
// (additive).
export default function FeatureMatrix({ section }: { section: Section }) {
  const columns = (section.matrixColumns ?? []).filter((c) => typeof c === "string" && c.trim());
  const rows = section.matrixRows ?? [];
  if (!columns.length || !rows.length) return null;

  return (
    <section className="section" id="feature-matrix">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}

        <div className="matrix-wrap" style={{ marginTop: "1.5rem" }}>
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col" className="matrix__corner">
                  <span className="sr-only">Capability</span>
                </th>
                {columns.map((col, i) => (
                  <th scope="col" key={i}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const cells = normalizeMatrixCells(row.cells, columns.length);
                return (
                  <tr key={i}>
                    <th scope="row">{row.capability}</th>
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
      </div>
    </section>
  );
}
