import type { SiteConfig } from "@/lib/config-schema";

// =============================================================================
// CRAFT + MOTION DEMO (R5.1).
// The opt-in proof for the harvested craft + motion layer. A deliberately NON-green
// brand (navy + rust) proves the layer is brand-neutral: glass, shadows, status chips,
// the aurora, the gradient hot-plan price, and the hero motion all DERIVE from the two
// brand colors, with no RiseLynk palette baked in. It turns on:
//   craft.glass        -> glassHover on the content cards (fine-pointer only)
//   craft.aurora       -> drifting hero blobs
//   craft.magneticCta  -> the primary CTA pulls toward a fine pointer
//   craft.heroMotion   -> the hero rises in and the h1 underline draws once
//   craft.oneLight/grain/fonts -> the machine-room surface it all sits on
//   pricing.gradientPrice -> the sanctioned gradient-clip price on the HOT plan only
//   scrollNarrative pinned:false -> the calm stacked step timeline (with a video), no pin
// No theme block: this is the "trade site gets glass for free from its two colors" path
// (the --rl-glass-* / --rl-shadow-* / --rl-status-* defaults derived in app/globals.css).
// Copy discipline: no em or en dashes, no invented claims, no guarantees.
// =============================================================================

export const site: SiteConfig = {
  business: {
    name: "Meridian Glass and Facade",
    tagline: "Commercial storefronts, curtain wall, and glass repair across the Puget Sound.",
    email: "hello@meridian-glass.example",
    phone: "(360) 555-0188",
  },

  // The two brand colors. Navy primary, rust accent. Everything craft derives from these.
  brand: {
    colors: { primary: "#17384f", accent: "#c2571a" },
    font: "sans",
  },

  // The full craft + motion opt-in. Drop any flag and that pattern turns off; drop the block
  // and the site reverts to the plain light brochure surface, unchanged.
  craft: {
    oneLight: true,
    grain: true,
    fonts: true,
    glass: true,
    aurora: true,
    magneticCta: true,
    heroMotion: true,
  },

  seo: {
    domain: "https://meridian-glass.example",
    titleSuffix: " | Meridian Glass and Facade",
  },

  pages: [
    {
      slug: "",
      title: "Home",
      description: "Commercial storefronts, curtain wall, and glass repair across the Puget Sound.",
      nav: "Home",
      sections: [
        {
          type: "hero",
          subheading: "Commercial glazing",
          heading: "Storefronts and curtain wall, built to the drawings.",
          body: "We measure, fabricate, and install commercial glass for general contractors and building owners, and we come back for the service calls after the ribbon is cut.",
          ctaLabel: "Request an estimate",
          ctaHref: "/contact",
        },
        {
          type: "services",
          subheading: "What we do",
          heading: "Our work",
          items: [
            { icon: "*", title: "Storefronts", body: "Aluminum storefront systems, entrances, and hardware for retail and office ground floors." },
            { icon: "*", title: "Curtain wall", body: "Unitized and stick-built curtain wall for mid-rise facades, glazed to the project drawings." },
            { icon: "*", title: "Service and repair", body: "Board-ups, reglazing, and hardware repair, with a standing account for property managers." },
          ],
        },
        {
          type: "pricing",
          subheading: "Service plans",
          heading: "Standing service plans",
          body: "For building owners who want a glazing contractor on call. The middle plan is the one most managers pick.",
          gradientPrice: true,
          tiers: [
            {
              name: "On call",
              price: "No monthly",
              period: "per visit",
              who: "For an owner who calls only when something breaks.",
              features: ["Time-and-materials service calls", "Next-business-day scheduling", "Board-up on request"],
              ctaLabel: "Ask about it",
              ctaHref: "/contact",
            },
            {
              name: "Managed",
              price: "From $240",
              period: "per site / mo",
              who: "For a manager who wants one glazing contractor on the account.",
              features: ["Priority scheduling", "Two included service visits a year", "One point of contact", "Photo record of every visit"],
              ctaLabel: "Start a plan",
              ctaHref: "/contact",
              highlighted: true,
              badge: "Most picked",
            },
            {
              name: "Portfolio",
              price: "Custom",
              period: "by portfolio",
              who: "For a group with several buildings under one manager.",
              features: ["Everything in Managed", "Portfolio-wide reporting", "Scheduled facade walk-downs"],
              ctaLabel: "Talk to us",
              ctaHref: "/contact",
            },
          ],
        },
        {
          // pinned:false -> Josh's ask. The stacked step timeline is the whole section: every
          // caption and the video payoff are kept, with NO scroll pinning or hijack.
          type: "scrollNarrative",
          pinned: false,
          subheading: "How a job runs",
          heading: "From measure to install, on one thread",
          scenes: [
            { label: "Step 01 / Measure", caption: "We field-measure the opening and confirm the glass makeup against the drawings," },
            { label: "Step 02 / Fabricate", caption: "the shop cuts and assembles the units to that measure," },
            { label: "Step 03 / Install", caption: "the crew sets and seals on site and cleans the glass," },
            {
              label: "Step 04 / Walk-through",
              caption: "and we walk the finished work with you before we call it done.",
              video: { src: "/demo/walkthrough.mp4", poster: "/demo/walkthrough-poster.jpg", label: "A short walk-through of a finished storefront" },
            },
          ],
        },
        {
          type: "testimonials",
          heading: "What clients say",
          quotes: [
            { quote: "They measured twice, installed once, and came back the week after to check the seals.", author: "Project manager", role: "General contractor" },
            { quote: "One call and a real person schedules the repair. That is rarer than it should be.", author: "Property manager", role: "Commercial portfolio" },
          ],
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      description: "Request an estimate from Meridian Glass and Facade.",
      nav: "Contact",
      sections: [
        {
          type: "contact",
          heading: "Request an estimate",
          body: "Send the address and a note about the work, and a real person will reply.",
        },
      ],
    },
  ],
};
