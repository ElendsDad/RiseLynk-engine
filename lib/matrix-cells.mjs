// ============================================================
// site-engine - shared matrix cell normalization for featureMatrix
// and pricing comparisonRows (teardown P2 items 7g + 2a)
//
// Fail-safe: never throws. A short/long cell array is padded/truncated to the
// column count so a bad config cannot break the grid. Boolean cells stay
// boolean; everything else stringifies (empty string = blank cell).
// ============================================================

/**
 * @param {unknown} cells
 * @param {number} columnCount
 * @returns {(boolean | string)[]}
 */
export function normalizeMatrixCells(cells, columnCount) {
  const n = Number.isFinite(columnCount) && columnCount > 0 ? Math.floor(columnCount) : 0;
  const src = Array.isArray(cells) ? cells : [];
  /** @type {(boolean | string)[]} */
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = src[i];
    if (typeof v === "boolean") {
      out.push(v);
    } else if (typeof v === "string") {
      out.push(v);
    } else if (v == null) {
      out.push("");
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out.push(String(v));
    } else {
      out.push("");
    }
  }
  return out;
}

/**
 * Display label / mark for a cell. Booleans become "Yes" / "" (empty = not
 * included); strings pass through. Used by both matrix sections for a11y text.
 * @param {boolean | string} cell
 * @returns {{ kind: "yes" | "no" | "text", text: string }}
 */
export function matrixCellDisplay(cell) {
  if (cell === true) return { kind: "yes", text: "Yes" };
  if (cell === false) return { kind: "no", text: "" };
  if (typeof cell === "string") return { kind: "text", text: cell };
  return { kind: "text", text: "" };
}
