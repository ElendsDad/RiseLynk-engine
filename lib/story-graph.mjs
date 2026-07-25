// ============================================================
// site-engine - story-graph layout math (expressive pack)
//
// The dependency-free geometry engine behind the storyGraph section
// (components/sections/StoryGraph.tsx): topological layering, deterministic
// coordinate assignment, and edge path generation for a config-supplied
// node-and-edge narrative diagram. Plain ESM, zero npm dependencies, unit
// tested in plain Node (tools/story-graph.test.mjs), same shared-.mjs pattern
// as lib/area-ld.mjs and lib/theme-tokens.mjs.
//
// CONTRACT (what the component leans on):
//   - Deterministic: the same config always produces byte-identical layout
//     output (stable ordering, fixed constants, fixed rounding), so a static
//     build is reproducible.
//   - Never crashes on ANY input graph. Duplicate node ids keep the first
//     declaration. Edges whose endpoints do not exist, and self edges
//     (from === to), are silently dropped. A CYCLE cannot be layered by
//     topological depth, so every node the cycle traps is placed together in
//     one overflow layer after the layered part, in declaration order, and
//     `hasCycle` is set true so the component can withhold the animated
//     current (a loop has no start or end to travel from); the nodes, edges,
//     and labels still all render.
//   - Layering is LONGEST-PATH depth (Kahn peel): a node sits one layer past
//     its deepest predecessor, so a shortcut edge across layers stays a long
//     curve rather than compressing the chain.
// ============================================================

// Fixed geometry constants (SVG user units; the component scales the whole
// viewBox responsively, so these are proportions, not screen pixels).
export const NODE_W = 168; // node box width
export const NODE_H = 60; // node box height
export const LAYER_GAP = 96; // gap between layers (the edge run)
export const NODE_GAP = 24; // gap between sibling nodes within a layer
export const MARGIN = 8; // outer margin around the whole graph

// Round to 2 decimals so centering math never leaks float noise into the
// emitted path strings (determinism is part of the contract).
function r2(n) {
  return Math.round(n * 100) / 100;
}

// Drop duplicate node ids (first declaration wins) and keep only usable
// edges: both endpoints must exist and differ (a self edge has no run to
// draw). Returns the cleaned pair every other function works from.
export function normalizeGraph(nodes, edges) {
  const seen = new Set();
  const keptNodes = [];
  for (const n of nodes ?? []) {
    if (!n || typeof n.id !== "string" || n.id === "" || seen.has(n.id)) continue;
    seen.add(n.id);
    keptNodes.push(n);
  }
  const keptEdges = (edges ?? []).filter(
    (e) => e && seen.has(e.from) && seen.has(e.to) && e.from !== e.to,
  );
  return { nodes: keptNodes, edges: keptEdges };
}

// Longest-path topological layering via a Kahn peel. Returns
// { layers, depth, hasCycle } where `layers` is an array of node-id arrays
// (layer 0 = sources), `depth` maps id -> layer index, and `hasCycle` is true
// when at least one node could not be peeled (it sits in a cycle). Cycle
// members all land together in ONE overflow layer after the layered part, in
// declaration order, so they still get coordinates and still render.
export function layerGraph(nodes, edges) {
  const { nodes: ns, edges: es } = normalizeGraph(nodes, edges);
  const ids = ns.map((n) => n.id);
  const indegree = new Map(ids.map((id) => [id, 0]));
  const out = new Map(ids.map((id) => [id, []]));
  for (const e of es) {
    indegree.set(e.to, indegree.get(e.to) + 1);
    out.get(e.from).push(e.to);
  }
  const depth = new Map();
  // Seed with the sources in declaration order; the queue is FIFO, so ties
  // resolve by declaration order all the way down (determinism).
  const queue = ids.filter((id) => indegree.get(id) === 0);
  for (const id of queue) depth.set(id, 0);
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    for (const v of out.get(u)) {
      const relaxed = Math.max(depth.get(v) ?? 0, depth.get(u) + 1);
      depth.set(v, relaxed);
      indegree.set(v, indegree.get(v) - 1);
      if (indegree.get(v) === 0) queue.push(v);
    }
  }
  const peeled = new Set(queue);
  const trapped = ids.filter((id) => !peeled.has(id));
  const hasCycle = trapped.length > 0;
  if (hasCycle) {
    // depth.get may hold a tentative value for a trapped node (an acyclic
    // in-edge relaxed it before the peel stalled); the overflow layer
    // overrides it so the whole cycle sits together, past everything layered.
    let maxPeeled = -1;
    for (const id of peeled) maxPeeled = Math.max(maxPeeled, depth.get(id));
    const overflow = maxPeeled + 1;
    for (const id of trapped) depth.set(id, overflow);
  }
  let maxDepth = -1;
  for (const id of ids) maxDepth = Math.max(maxDepth, depth.get(id));
  const layers = [];
  for (let d = 0; d <= maxDepth; d++) layers.push([]);
  for (const id of ids) layers[depth.get(id)].push(id); // declaration order within a layer
  return { layers, depth, hasCycle };
}

// One edge's cubic bezier path between two anchor points. The control points
// pull straight out along the flow axis by half the layer gap, so a same-row
// edge is a straight line and an offset edge is a gentle S curve. `direction`
// is "ltr" (anchors on the node sides) or "ttb" (anchors on top and bottom).
export function edgePath(x1, y1, x2, y2, direction) {
  const b = LAYER_GAP / 2;
  if (direction === "ttb") {
    return `M ${r2(x1)} ${r2(y1)} C ${r2(x1)} ${r2(y1 + b)}, ${r2(x2)} ${r2(y2 - b)}, ${r2(x2)} ${r2(y2)}`;
  }
  return `M ${r2(x1)} ${r2(y1)} C ${r2(x1 + b)} ${r2(y1)}, ${r2(x2 - b)} ${r2(y2)}, ${r2(x2)} ${r2(y2)}`;
}

// Full deterministic layout for one direction. Returns
//   { direction, width, height, hasCycle, nodes, edges }
// where each node carries { id, label, sublabel, color, x, y, layer, row }
// (x/y is the box's top-left corner) and each edge carries
// { from, to, label, x1, y1, x2, y2, path, labelX, labelY }. In "ltr" the
// layers run left to right as columns; in "ttb" they run top to bottom as
// rows. Layers with fewer nodes are centered against the widest layer.
export function layoutGraph(nodes, edges, direction = "ltr") {
  const dir = direction === "ttb" ? "ttb" : "ltr";
  const { nodes: ns, edges: es } = normalizeGraph(nodes, edges);
  const { layers, depth, hasCycle } = layerGraph(ns, es);
  const numLayers = layers.length;
  const maxRows = layers.reduce((m, l) => Math.max(m, l.length), 0);
  if (numLayers === 0) {
    return { direction: dir, width: 2 * MARGIN, height: 2 * MARGIN, hasCycle: false, nodes: [], edges: [] };
  }
  // The cross axis (stacking siblings) and the flow axis (marching layers).
  const crossSpan = maxRows * (dir === "ltr" ? NODE_H : NODE_W) + (maxRows - 1) * NODE_GAP;
  const flowSpan = numLayers * (dir === "ltr" ? NODE_W : NODE_H) + (numLayers - 1) * LAYER_GAP;
  const width = 2 * MARGIN + (dir === "ltr" ? flowSpan : crossSpan);
  const height = 2 * MARGIN + (dir === "ltr" ? crossSpan : flowSpan);

  const placed = new Map();
  const outNodes = ns.map((n) => {
    const layer = depth.get(n.id);
    const row = layers[layer].indexOf(n.id);
    const rows = layers[layer].length;
    const crossSize = dir === "ltr" ? NODE_H : NODE_W;
    const layerSpan = rows * crossSize + (rows - 1) * NODE_GAP;
    const crossStart = MARGIN + (crossSpan - layerSpan) / 2 + row * (crossSize + NODE_GAP);
    const flowStart = MARGIN + layer * ((dir === "ltr" ? NODE_W : NODE_H) + LAYER_GAP);
    const x = r2(dir === "ltr" ? flowStart : crossStart);
    const y = r2(dir === "ltr" ? crossStart : flowStart);
    const out = { id: n.id, label: n.label, sublabel: n.sublabel, color: n.color, x, y, layer, row };
    placed.set(n.id, out);
    return out;
  });

  const outEdges = es.map((e) => {
    const a = placed.get(e.from);
    const b = placed.get(e.to);
    let x1, y1, x2, y2;
    if (dir === "ttb") {
      x1 = a.x + NODE_W / 2;
      y1 = a.y + NODE_H;
      x2 = b.x + NODE_W / 2;
      y2 = b.y;
    } else {
      x1 = a.x + NODE_W;
      y1 = a.y + NODE_H / 2;
      x2 = b.x;
      y2 = b.y + NODE_H / 2;
    }
    return {
      from: e.from,
      to: e.to,
      label: e.label,
      x1: r2(x1),
      y1: r2(y1),
      x2: r2(x2),
      y2: r2(y2),
      path: edgePath(x1, y1, x2, y2, dir),
      labelX: r2((x1 + x2) / 2),
      labelY: r2((y1 + y2) / 2 - 6),
    };
  });

  return { direction: dir, width, height, hasCycle, nodes: outNodes, edges: outEdges };
}

// Per-node fill from config: a value starting with "--" is treated as a CSS
// custom-property token and wrapped in var(); anything else (a hex, an rgb(),
// a named color) passes through verbatim. A value with characters outside the
// plain CSS-color alphabet is rejected (null), so config can never smuggle
// arbitrary style text into the inline fill. Null means "use the themed
// default" (the .sgraph__node rect rule in app/globals.css).
export function nodeFillValue(color) {
  if (typeof color !== "string") return null;
  const c = color.trim();
  if (c === "") return null;
  if (!/^[a-zA-Z0-9#%(),.\s-]+$/.test(c)) return null;
  if (c.startsWith("--")) return `var(${c})`;
  return c;
}

// Absent/empty-case guard for the storyGraph section (components/sections/StoryGraph.tsx):
// a section with no storyGraph config at all, or one whose nodes array is missing or
// empty, renders nothing (byte-identical to a page that never opted into the section).
// Extracted as a pure, dependency-free predicate so the guard the component leans on is
// unit-testable in plain Node (tools/story-graph.test.mjs) without a React renderer; the
// component calls this instead of duplicating the null-check inline. Returns the
// StoryGraphConfig unchanged when present, so a present-path caller reads the identical
// object it would have read straight off `section.storyGraph`.
export function storyGraphOf(section) {
  const g = section?.storyGraph;
  if (!g || !(g.nodes ?? []).length) return null;
  return g;
}

// Deterministic short id for one rendered SVG instance, hashed from the graph
// content plus direction. Used to suffix the in-document SVG ids (the arrow
// marker, the title and desc) so two graph SVGs on one page never collide;
// two IDENTICAL graphs hash the same, which is harmless because their marker
// and title content is identical too.
export function graphUid(nodes, edges, direction = "ltr") {
  const s = JSON.stringify([nodes ?? [], edges ?? [], direction]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return "sg" + h.toString(36);
}
