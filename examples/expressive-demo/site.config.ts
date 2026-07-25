import type { SiteConfig } from "@/lib/config-schema";

// =============================================================================
// EXPRESSIVE PACK DEMO.
// A small, generic brochure whose home page carries the storyGraph section, the
// pack's centerpiece: a config-driven node-graph narrative rendered as a
// server-built SVG with an animated current (pure CSS, reduced-motion safe).
// The flow here is the neutral three-stage story, customer to business to
// outcomes, with a middle split to show multi-node layers and the automatic
// layered layout. One node opts into a per-node color to prove config
// pass-through; everything else derives from the two brand colors.
// The home page also exercises both Section.style variants: the hero opts into
// "editorial" (system-serif display typography) and a services grid opts into
// "ribbon" (stacked-depth cards whose badges render as edge ribbons).
// Fictional business, neutral copy, no real-business claims.
// Copy discipline: no em or en dashes, no exclamation marks, nothing invented.
// =============================================================================

export const site: SiteConfig = {
  business: {
    name: "Fieldstone Studio",
    tagline: "A small studio for design and build work, done in the open.",
    email: "hello@fieldstone.example",
    phone: "(555) 010-0142",
  },

  // The two brand colors. Deep teal primary, warm ochre accent; every graph
  // ink and surface derives from these plus the engine's surface tokens.
  brand: {
    colors: { primary: "#1f4d4a", accent: "#b98230" },
    font: "sans",
  },

  seo: {
    domain: "https://fieldstone.example",
    titleSuffix: " | Fieldstone Studio",
  },

  pages: [
    {
      slug: "",
      title: "Home",
      description: "A small studio for design and build work, done in the open.",
      nav: "Home",
      sections: [
        {
          type: "hero",
          // Section.style "editorial": the text-led serif opening. Copy is
          // unchanged from the plain hero; only type and space differ.
          style: "editorial",
          subheading: "Design and build",
          heading: "Good work moves in the open.",
          body: "We keep every project on one visible thread, from the first conversation to the finished piece, so you always know where things stand.",
          ctaLabel: "Start a conversation",
          ctaHref: "/contact",
        },
        {
          type: "services",
          // Section.style "ribbon": stacked-depth cards; each badge below
          // renders as the card's edge ribbon. The third card carries no badge
          // to show the depth-only fallback.
          style: "ribbon",
          subheading: "What we do",
          heading: "Three ways to work with us",
          body: "Every engagement starts small and grows only when the work earns it.",
          items: [
            {
              iconName: "calendar",
              badge: "Phase one",
              title: "Design",
              body: "We sketch, model, and price the idea with you before anything is built.",
            },
            {
              iconName: "wrench",
              badge: "Phase two",
              title: "Build",
              body: "The scoped plan becomes finished work, on the schedule we agreed to.",
            },
            {
              iconName: "clock",
              title: "Care",
              body: "After handoff we stay reachable for adjustments and seasonal upkeep.",
            },
          ],
        },
        {
          type: "storyGraph",
          subheading: "How it works",
          heading: "From first call to finished work",
          body: "Every project moves through the same simple flow. The middle steps run side by side, and both feed the finished result.",
          storyGraph: {
            title: "How a project flows from customer to outcome",
            description:
              "A customer shares a goal, which leads to an intake conversation. The intake feeds a working plan and a written estimate in parallel, and both come together in the reviewed outcome.",
            // ltr on wide screens; the engine relays the same graph top to
            // bottom on narrow screens automatically.
            direction: "ltr",
            nodes: [
              { id: "customer", label: "Customer", sublabel: "Shares the goal" },
              { id: "intake", label: "Intake call", sublabel: "We listen first" },
              { id: "plan", label: "Working plan", sublabel: "Scoped together" },
              { id: "estimate", label: "Estimate", sublabel: "Priced in writing" },
              // Per-node color pass-through: a soft accent wash on the payoff
              // node. A "--token" value would track the theme instead.
              { id: "outcome", label: "Outcome", sublabel: "Reviewed with you", color: "#f2e4cb" },
            ],
            edges: [
              { from: "customer", to: "intake", label: "reach out" },
              { from: "intake", to: "plan" },
              { from: "intake", to: "estimate" },
              { from: "plan", to: "outcome", label: "the work" },
              { from: "estimate", to: "outcome" },
            ],
          },
        },
        {
          type: "about",
          heading: "About the studio",
          body: "Fieldstone Studio is a small team that plans, prices, and builds in plain view. We would rather show you the flow of a project than promise you an outcome we have not scoped.\n\nIf the way we work suits the way you think, send a note and we will set up an intake call.",
        },
        {
          // Feedback item 7: a second priced-menu surface, distinct from the
          // software-archetype `pricing` section (this demo does not use
          // `pricing` at all). Display prices only; no structured Offer
          // JSON-LD is emitted for this section (see AddonItem's doc comment
          // in lib/config-schema.ts).
          type: "addons",
          subheading: "Optional add-ons",
          heading: "Extras you can add to any project",
          body: "Add any of these to a scoped project when the timeline or scope calls for it.",
          addonItems: [
            {
              name: "Rush scheduling",
              price: "$150",
              description: "Move your project ahead in the active queue.",
            },
            {
              name: "Extended walkthrough",
              price: "$75",
              description: "A second on-site walkthrough beyond the standard visit.",
            },
            {
              name: "Weekend site visit",
              price: "Included",
              description: "A site visit scheduled outside the standard work week.",
              note: "Active projects only",
            },
          ],
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      description: "Start a conversation with Fieldstone Studio.",
      nav: "Contact",
      sections: [
        {
          type: "contact",
          heading: "Start a conversation",
          body: "Tell us what you have in mind and a real person will reply.",
        },
      ],
    },
  ],
};
