// ============================================================
// site-engine - story-graph layout harness
//
//   node tools/story-graph.test.mjs
//
// Proves the pure layout math in lib/story-graph.mjs, the geometry engine
// behind the storyGraph section (components/sections/StoryGraph.tsx). Same
// shared-.mjs pattern as tools/area-ld / theme-tokens: the logic is unit
// tested in plain Node with no TypeScript toolchain, and the rendered markup
// is additionally proven by the build.
//
// Covers:
//   - layerGraph: longest-path topological layering (chain, diamond, and the
//     shortcut-edge case), declaration-order determinism within a layer.
//   - normalizeGraph: duplicate node ids (first wins), unknown-endpoint and
//     self edges dropped.
//   - Cycle safety: a pure cycle, a mixed graph with a trapped subset, and a
//     self edge (NOT a cycle) all layer without throwing; hasCycle only when
//     a real cycle exists; trapped nodes share one overflow layer.
//   - layoutGraph: dimension formulas, coordinate assignment and centering,
//     ltr/ttb transposition, edge anchor points and path strings, label
//     midpoints, and full-output determinism (byte-identical repeat runs).
//   - nodeFillValue: hex/named pass-through verbatim, "--token" wrapped in
//     var(), garbage rejected to null; layoutGraph carries node.color through.
//   - graphUid: deterministic, direction-sensitive, stable shape.
//   - storyGraphOf: the absent/empty-case guard components/sections/StoryGraph.tsx
//     leans on (no storyGraph, an empty/absent nodes array) resolves to null so the
//     section renders nothing; a present, non-empty config resolves to the identical
//     object, unchanged, so the component's downstream reads stay byte-identical.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "story-graph.mjs");

const mod = await import("file://" + MODULE_PATH);
const {
  normalizeGraph,
  layerGraph,
  layoutGraph,
  edgePath,
  nodeFillValue,
  graphUid,
  storyGraphOf,
  NODE_W,
  NODE_H,
  LAYER_GAP,
  NODE_GAP,
  MARGIN,
} = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

const n = (id, extra = {}) => ({ id, label: id, ...extra });

// ================= 1. layering correctness =================
function testLayering() {
  console.log("\n# layerGraph: longest-path layering");
  const chain = layerGraph(
    [n("a"), n("b"), n("c")],
    [{ from: "a", to: "b" }, { from: "b", to: "c" }],
  );
  eq("chain layers", JSON.stringify(chain.layers), '[["a"],["b"],["c"]]');
  ok("chain has no cycle", chain.hasCycle === false);

  const diamond = layerGraph(
    [n("s"), n("l"), n("r"), n("t")],
    [
      { from: "s", to: "l" },
      { from: "s", to: "r" },
      { from: "l", to: "t" },
      { from: "r", to: "t" },
    ],
  );
  eq("diamond layers", JSON.stringify(diamond.layers), '[["s"],["l","r"],["t"]]');

  // Longest path wins: a->c directly AND a->b->c must put c in layer 2, not 1.
  const shortcut = layerGraph(
    [n("a"), n("b"), n("c")],
    [{ from: "a", to: "c" }, { from: "a", to: "b" }, { from: "b", to: "c" }],
  );
  eq("shortcut edge keeps c at depth 2", JSON.stringify(shortcut.layers), '[["a"],["b"],["c"]]');

  // Two independent sources: both sit in layer 0, declaration order preserved.
  const twoRoots = layerGraph(
    [n("x"), n("y"), n("z")],
    [{ from: "x", to: "z" }, { from: "y", to: "z" }],
  );
  eq("two sources share layer 0 in declaration order", JSON.stringify(twoRoots.layers), '[["x","y"],["z"]]');

  const lone = layerGraph([n("only")], []);
  eq("edgeless graph is one layer", JSON.stringify(lone.layers), '[["only"]]');
  const empty = layerGraph([], []);
  eq("empty graph layers", JSON.stringify(empty.layers), "[]");
  ok("empty graph has no cycle", empty.hasCycle === false);
}

// ================= 2. normalization =================
function testNormalize() {
  console.log("\n# normalizeGraph: duplicates, unknown endpoints, self edges");
  const g = normalizeGraph(
    [n("a", { sublabel: "first" }), n("a", { sublabel: "second" }), n("b")],
    [
      { from: "a", to: "b" },
      { from: "a", to: "ghost" },
      { from: "ghost", to: "b" },
      { from: "b", to: "b" },
    ],
  );
  eq("duplicate id keeps first declaration", g.nodes.length, 2);
  eq("first declaration's fields win", g.nodes[0].sublabel, "first");
  eq("unknown-endpoint and self edges dropped", g.edges.length, 1);
  eq("the surviving edge is the real one", g.edges[0].to, "b");
  const blank = normalizeGraph([{ label: "no id" }, n("ok"), { id: "", label: "empty id" }], []);
  eq("nodes without a usable id are dropped", blank.nodes.length, 1);
}

// ================= 3. cycle safety =================
function testCycles() {
  console.log("\n# cycle safety: never crash, everything still places");
  const loop = layerGraph(
    [n("a"), n("b")],
    [{ from: "a", to: "b" }, { from: "b", to: "a" }],
  );
  ok("pure cycle flags hasCycle", loop.hasCycle === true);
  eq("pure cycle still places every node", JSON.stringify(loop.layers), '[["a","b"]]');

  const mixed = layerGraph(
    [n("start"), n("c1"), n("c2"), n("after")],
    [
      { from: "start", to: "c1" },
      { from: "c1", to: "c2" },
      { from: "c2", to: "c1" },
      { from: "start", to: "after" },
    ],
  );
  ok("mixed graph flags hasCycle", mixed.hasCycle === true);
  eq("acyclic part layers normally, cycle members share one overflow layer",
    JSON.stringify(mixed.layers), '[["start"],["after"],["c1","c2"]]');

  const selfEdge = layerGraph([n("a"), n("b")], [{ from: "a", to: "a" }, { from: "a", to: "b" }]);
  ok("a self edge is dropped, not a cycle", selfEdge.hasCycle === false);
  eq("self-edge graph layers normally", JSON.stringify(selfEdge.layers), '[["a"],["b"]]');

  const laidOut = layoutGraph(
    [n("a"), n("b")],
    [{ from: "a", to: "b" }, { from: "b", to: "a" }],
    "ltr",
  );
  ok("cyclic layoutGraph does not throw and carries hasCycle", laidOut.hasCycle === true);
  ok("cyclic layout still gives every node numeric coordinates",
    laidOut.nodes.every((x) => Number.isFinite(x.x) && Number.isFinite(x.y)));
  eq("cyclic layout still draws both edges", laidOut.edges.length, 2);
}

// ================= 4. coordinates and dimensions =================
function testLayoutGeometry() {
  console.log("\n# layoutGraph: dimensions, centering, transposition");
  const nodes = [n("s"), n("l"), n("r"), n("t")];
  const edges = [
    { from: "s", to: "l" },
    { from: "s", to: "r" },
    { from: "l", to: "t" },
    { from: "r", to: "t" },
  ];
  const ltr = layoutGraph(nodes, edges, "ltr");
  // 3 layers across, max 2 rows tall.
  eq("ltr width", ltr.width, 2 * MARGIN + 3 * NODE_W + 2 * LAYER_GAP);
  eq("ltr height", ltr.height, 2 * MARGIN + 2 * NODE_H + NODE_GAP);
  const byId = Object.fromEntries(ltr.nodes.map((x) => [x.id, x]));
  eq("source column x", byId.s.x, MARGIN);
  eq("sink column x", byId.t.x, MARGIN + 2 * (NODE_W + LAYER_GAP));
  // Single-node layers center against the 2-row cross span.
  eq("source centers vertically", byId.s.y, MARGIN + (2 * NODE_H + NODE_GAP - NODE_H) / 2);
  eq("first middle row at the top", byId.l.y, MARGIN);
  eq("second middle row below it", byId.r.y, MARGIN + NODE_H + NODE_GAP);

  const ttb = layoutGraph(nodes, edges, "ttb");
  eq("ttb width transposes", ttb.width, 2 * MARGIN + 2 * NODE_W + NODE_GAP);
  eq("ttb height transposes", ttb.height, 2 * MARGIN + 3 * NODE_H + 2 * LAYER_GAP);
  const tById = Object.fromEntries(ttb.nodes.map((x) => [x.id, x]));
  eq("ttb source row y", tById.s.y, MARGIN);
  eq("ttb source centers horizontally", tById.s.x, MARGIN + (2 * NODE_W + NODE_GAP - NODE_W) / 2);
  eq("ttb siblings sit side by side", tById.r.x, MARGIN + NODE_W + NODE_GAP);

  const unknownDir = layoutGraph(nodes, edges, "sideways");
  eq("unknown direction falls back to ltr", unknownDir.direction, "ltr");
  const emptyLayout = layoutGraph([], [], "ltr");
  eq("empty layout is just the margins", JSON.stringify([emptyLayout.width, emptyLayout.height]), JSON.stringify([2 * MARGIN, 2 * MARGIN]));
}

// ================= 5. edge paths =================
function testEdgePaths() {
  console.log("\n# edge anchors and path generation");
  const nodes = [n("a"), n("b")];
  const edges = [{ from: "a", to: "b", label: "goes" }];
  const ltr = layoutGraph(nodes, edges, "ltr");
  const e = ltr.edges[0];
  const a = ltr.nodes[0];
  const b = ltr.nodes[1];
  eq("ltr edge leaves the source's right mid x", e.x1, a.x + NODE_W);
  eq("ltr edge leaves at mid height", e.y1, a.y + NODE_H / 2);
  eq("ltr edge enters the target's left mid x", e.x2, b.x);
  ok("path starts with M x1 y1", e.path.startsWith(`M ${e.x1} ${e.y1} C `));
  ok("path ends at x2 y2", e.path.endsWith(`${e.x2} ${e.y2}`));
  eq("edge label carried through", e.label, "goes");
  eq("label x is the midpoint", e.labelX, (e.x1 + e.x2) / 2);
  eq("label y floats above the midpoint", e.labelY, (e.y1 + e.y2) / 2 - 6);

  const ttb = layoutGraph(nodes, edges, "ttb");
  const te = ttb.edges[0];
  const ta = ttb.nodes[0];
  const tb = ttb.nodes[1];
  eq("ttb edge leaves the source's bottom mid y", te.y1, ta.y + NODE_H);
  eq("ttb edge leaves at mid width", te.x1, ta.x + NODE_W / 2);
  eq("ttb edge enters the target's top", te.y2, tb.y);

  // The raw path builder: control points pull along the flow axis by half a gap.
  eq(
    "ltr path string is exact",
    edgePath(10, 20, 200, 80, "ltr"),
    `M 10 20 C ${10 + LAYER_GAP / 2} 20, ${200 - LAYER_GAP / 2} 80, 200 80`,
  );
  eq(
    "ttb path string is exact",
    edgePath(10, 20, 200, 80, "ttb"),
    `M 10 20 C 10 ${20 + LAYER_GAP / 2}, 200 ${80 - LAYER_GAP / 2}, 200 80`,
  );
}

// ================= 6. determinism =================
function testDeterminism() {
  console.log("\n# determinism: identical input, byte-identical output");
  const nodes = [n("a"), n("b"), n("c"), n("d")];
  const edges = [
    { from: "a", to: "b" },
    { from: "a", to: "c" },
    { from: "b", to: "d" },
    { from: "c", to: "d" },
  ];
  const one = JSON.stringify(layoutGraph(nodes, edges, "ltr"));
  const two = JSON.stringify(layoutGraph(nodes, edges, "ltr"));
  ok("repeat runs stringify identically", one === two);
  const uidOne = graphUid(nodes, edges, "ltr");
  eq("graphUid is stable across calls", graphUid(nodes, edges, "ltr"), uidOne);
  ok("graphUid differs by direction (the two responsive SVGs never collide)",
    graphUid(nodes, edges, "ttb") !== uidOne);
  ok("graphUid is a safe id shape", /^sg[a-z0-9]+$/.test(uidOne));
}

// ================= 7. color pass-through =================
function testColors() {
  console.log("\n# nodeFillValue: config color pass-through");
  eq("hex passes verbatim", nodeFillValue("#c2571a"), "#c2571a");
  eq("named color passes verbatim", nodeFillValue("tomato"), "tomato");
  eq("modern rgb passes verbatim", nodeFillValue("rgb(24 48 64)"), "rgb(24 48 64)");
  eq("custom-property token wraps in var()", nodeFillValue("--color-accent"), "var(--color-accent)");
  eq("rl token wraps in var()", nodeFillValue("--rl-green-wash"), "var(--rl-green-wash)");
  ok("style-smuggling text rejected", nodeFillValue("red; stroke: url(javascript:x)") === null);
  ok("undefined rejected", nodeFillValue(undefined) === null);
  ok("empty string rejected", nodeFillValue("") === null);
  ok("non-string rejected", nodeFillValue(7) === null);

  const laid = layoutGraph([n("a", { color: "#f2e4cb" }), n("b")], [{ from: "a", to: "b" }], "ltr");
  eq("layout carries node.color through untouched", laid.nodes[0].color, "#f2e4cb");
  ok("a colorless node carries no color", laid.nodes[1].color === undefined);
}

// ================= 8. storyGraphOf: the component's absent/empty guard =================
function testStoryGraphOfAbsentCase() {
  console.log("\n# storyGraphOf: absent / default: no story graph means no section, byte-identical to omitted");
  eq("a section with no storyGraph key resolves to null", storyGraphOf({}), null);
  eq("storyGraph explicitly undefined resolves to null", storyGraphOf({ storyGraph: undefined }), null);
  eq("storyGraph with no nodes key at all resolves to null", storyGraphOf({ storyGraph: {} }), null);
  eq("storyGraph with an empty nodes array resolves to null", storyGraphOf({ storyGraph: { nodes: [] } }), null);
  eq("a wholly undefined section resolves to null", storyGraphOf(undefined), null);
  eq("a wholly null section resolves to null", storyGraphOf(null), null);
}

function testStoryGraphOfPresentCase() {
  console.log("\n# storyGraphOf: present case resolves to the config unchanged (component reads carry through)");
  const minimal = { nodes: [n("a")] };
  ok("a single-node config resolves to the identical object, not a copy",
    storyGraphOf({ storyGraph: minimal }) === minimal);

  const full = {
    nodes: [n("start"), n("end")],
    edges: [{ from: "start", to: "end" }],
    direction: "ttb",
    title: "How a claim moves",
    description: "From intake to close.",
    current: false,
  };
  const resolved = storyGraphOf({ storyGraph: full });
  ok("a fully-populated config resolves to the identical object", resolved === full);
  eq("every field the component reads survives untouched", JSON.stringify(resolved), JSON.stringify(full));
}

testLayering();
testNormalize();
testCycles();
testLayoutGeometry();
testEdgePaths();
testDeterminism();
testColors();
testStoryGraphOfAbsentCase();
testStoryGraphOfPresentCase();

console.log(`\nstory-graph: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
