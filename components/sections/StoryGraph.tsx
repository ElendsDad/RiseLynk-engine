import type { CSSProperties } from "react";
import type { Section, StoryGraphConfig } from "@/lib/config-schema";
import Prose from "@/components/Prose";
import { layoutGraph, graphUid, nodeFillValue, storyGraphOf, NODE_W, NODE_H } from "@/lib/story-graph.mjs";

// Story-graph section (expressive pack): a config-driven node-graph narrative rendered
// as a server-built inline SVG. All layout math lives in lib/story-graph.mjs
// (deterministic topological layering, unit tested); this component only turns the
// computed geometry into markup. Zero dependencies and ZERO client JavaScript: the
// complete graph (every node, edge, and label) is in the static HTML, and the animated
// "current" pulse is pure CSS (a stroke-dash animation on a pathLength-normalized
// overlay path), aria-hidden and shown only under prefers-reduced-motion: no-preference
// (see the .sgraph rules in app/globals.css). Reduced motion and no-JS both get the
// same complete static diagram.
//
// Responsive direction: an "ltr" graph prerenders BOTH the left-to-right layout and a
// top-to-bottom relayout of the same graph, and a CSS media query shows exactly one
// (wide screens get ltr, narrow screens get ttb); a "ttb" graph renders one SVG for
// every width. Each SVG hashes its own uid (lib/story-graph.mjs graphUid) so the
// in-document ids (arrow marker, title, desc) never collide across instances.
//
// Cycle safety: a cyclic edge set still renders every node and edge (the layout places
// cycle members in an overflow layer), but the current is withheld for the diagram,
// since a loop has no start or end for a pulse to travel from.

// The layout shapes lib/story-graph.mjs returns (typed here because the shared
// module is plain untyped ESM, same as the engine's other lib/*.mjs consumers).
interface LaidNode {
  id: string;
  label: string;
  sublabel?: string;
  color?: string;
  x: number;
  y: number;
  layer: number;
  row: number;
}
interface LaidEdge {
  from: string;
  to: string;
  label?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  path: string;
  labelX: number;
  labelY: number;
}
interface GraphLayout {
  direction: "ltr" | "ttb";
  width: number;
  height: number;
  hasCycle: boolean;
  nodes: LaidNode[];
  edges: LaidEdge[];
}

function GraphSvg({
  layout,
  variant,
  title,
  description,
  current,
}: {
  layout: GraphLayout;
  variant?: "wide" | "narrow";
  title: string;
  description?: string;
  current: boolean;
}) {
  const uid = graphUid(layout.nodes, layout.edges, layout.direction);
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const arrowId = `${uid}-arrow`;
  const cls = `sgraph__svg${variant ? ` sgraph__svg--${variant}` : ""}`;
  return (
    <svg
      className={cls}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-labelledby={description ? `${titleId} ${descId}` : titleId}
      style={{ maxWidth: `${layout.width}px` }}
    >
      <title id={titleId}>{title}</title>
      {description ? <desc id={descId}>{description}</desc> : null}
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L8 4 L0 8 Z" className="sgraph__arrow" />
        </marker>
      </defs>
      {layout.edges.map((e, i) => (
        <g key={`${e.from}-${e.to}-${i}`} className="sgraph__edge">
          <path d={e.path} className="sgraph__wire" markerEnd={`url(#${arrowId})`} />
          {current ? (
            <path
              d={e.path}
              className="sgraph__current"
              pathLength={100}
              aria-hidden="true"
              style={{ animationDelay: `${((i % 5) * 0.45).toFixed(2)}s` } as CSSProperties}
            />
          ) : null}
          {e.label ? (
            <text x={e.labelX} y={e.labelY} textAnchor="middle" className="sgraph__edgelabel">
              {e.label}
            </text>
          ) : null}
        </g>
      ))}
      {layout.nodes.map((n) => {
        const fill = nodeFillValue(n.color);
        const midX = n.x + NODE_W / 2;
        return (
          <g key={n.id} className="sgraph__node">
            <rect
              x={n.x}
              y={n.y}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              style={fill ? ({ fill } as CSSProperties) : undefined}
            />
            <text x={midX} y={n.y + (n.sublabel ? 26 : NODE_H / 2 + 5)} textAnchor="middle" className="sgraph__label">
              {n.label}
            </text>
            {n.sublabel ? (
              <text x={midX} y={n.y + 44} textAnchor="middle" className="sgraph__sublabel">
                {n.sublabel}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export default function StoryGraph({ section }: { section: Section }) {
  const g = storyGraphOf(section) as StoryGraphConfig | null;
  if (!g) return null;
  const direction = g.direction === "ttb" ? "ttb" : "ltr";
  const ttb = layoutGraph(g.nodes, g.edges ?? [], "ttb") as GraphLayout;
  const ltr = direction === "ltr" ? (layoutGraph(g.nodes, g.edges ?? [], "ltr") as GraphLayout) : null;
  // Default ON, withheld for a cyclic graph (hasCycle is direction-independent, so
  // checking the always-built ttb layout covers both rendered variants).
  const current = g.current !== false && !ttb.hasCycle;
  const title = g.title ?? section.heading ?? "Flow diagram";
  return (
    <section className="section" id="story-graph">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        <div className={`sgraph${ltr ? " sgraph--responsive" : ""}`}>
          {ltr ? (
            <>
              <GraphSvg layout={ltr} variant="wide" title={title} description={g.description} current={current} />
              <GraphSvg layout={ttb} variant="narrow" title={title} description={g.description} current={current} />
            </>
          ) : (
            <GraphSvg layout={ttb} title={title} description={g.description} current={current} />
          )}
        </div>
      </div>
    </section>
  );
}
