import type { SiteConfig } from "@/lib/config-schema";

// =============================================================================
// DUAL-THEME DEMO (G1 toggle + G2 per-theme palette).
// Exercises the theme layer end to end: a LIGHT default marketing surface with a
// user toggle to a DARK machine-room surface. The `theme` block below carries the
// design bundle's EXACT light and dark token sets (RiseLynk design.config.json
// themes.light / themes.dark), copied VERBATIM, so the emitted --rl-* custom
// properties byte-match the bundle. The two brand colors stay the single-hue green
// contract; the alias bridge maps --color-accent AND --color-primary onto the green.
//
// A config with NO `theme` block builds byte-for-byte as before: this demo is the
// opt-in proof, and examples/elevator-demo (craft, no theme) is the back-compat proof.
// Copy discipline is honored: no em or en dashes, no invented claims.
// =============================================================================

export const site: SiteConfig = {
  business: {
    name: "RiseLynk",
    tagline: "Offline-first maintenance software for elevator and escalator service companies.",
    email: "hello@riselynk.com",
    phone: "(360) 555-0142",
  },

  brand: {
    // The single-hue green contract. --color-accent (and --color-primary) map to the
    // per-theme green token; these two values seed the derive fallback if a palette side
    // were ever omitted (here both sides are supplied, so nothing derives).
    colors: { primary: "#0c6b52", accent: "#0c6b52" },
    font: "sans",
  },

  // The dual-theme block. LIGHT is the default surface; the nav toggle switches to DARK.
  theme: {
    enabled: true,
    default: "light",
    palette: {
      // themes.light, verbatim from the design bundle.
      light: {
        bg: "#fafaf7",
        bg2: "#f3f5f0",
        card: "#ffffff",
        card2: "#f0f3ee",
        line: "#e4e7e1",
        line2: "#d3d9d1",
        ink: "#0e1f19",
        dim: "#46554e",
        faint: "#5f6d66",
        green: "#0c6b52",
        greenHover: "#0a5d47",
        onGreen: "#ffffff",
        greenWash: "#e8f3ee",
        danger: "#a03d3d",
        pageBleed: "linear-gradient(180deg,#fbfbf8 0%,#f8faf5 34%,#f0f5ef 68%,#e7efe8 100%)",
        heroGlow: "radial-gradient(1100px 520px at 68% -20%, rgba(12,107,82,.07), transparent 62%)",
        grainOpacity: "0.03",
      },
      // themes.dark, verbatim: the machine-room recipe byte-matched to the pre-redesign site.
      dark: {
        bg: "#0f1412",
        bg2: "#131b18",
        card: "#1a2420",
        card2: "#21302a",
        line: "#2c3d35",
        line2: "#3a5044",
        ink: "#e7efea",
        dim: "#a9b8b1",
        faint: "#8a9c93",
        green: "#5dcaa5",
        greenHover: "#6fd6b2",
        onGreen: "#062018",
        greenWash: "#15332a",
        danger: "#e08b8b",
        pageBleed: "linear-gradient(180deg,#121814 0%,#0f1412 24%,#0d1210 60%,#0b0f0d 100%)",
        heroGlow: "radial-gradient(1200px 640px at 62% -18%, rgba(120,210,178,.14), transparent 62%)",
        grainOpacity: "0.05",
      },
    },
  },

  seo: {
    domain: "https://riselynk.com",
    titleSuffix: " | RiseLynk",
  },

  callBar: {
    enabled: true,
    label: "Call the RiseLynk team",
  },

  pages: [
    {
      slug: "",
      title: "Home",
      description: "Offline-first maintenance software for elevator and escalator service companies.",
      nav: "Home",
      sections: [
        {
          type: "hero",
          subheading: "Connected elevator maintenance",
          heading: "One shared system for the field, the office, and the customer.",
          body: "RiseLynk keeps dispatch, tickets, and portal reporting in sync, and keeps the field app working when the signal drops in a machine room or a hoistway.",
          ctaLabel: "See a live demo",
          ctaHref: "https://demo.app.riselynk.com",
        },
        {
          type: "services",
          subheading: "One platform, end to end",
          heading: "What RiseLynk covers",
          items: [
            { icon: "*", title: "Field app", body: "Dispatch, routes, tickets, time, and materials, offline-first for the machine room." },
            { icon: "*", title: "Office console", body: "Proposals, contracts, invoicing, payroll, inventory, and account margin in one place." },
            { icon: "*", title: "Customer portal", body: "A tokenized portal where a customer scans a QR code and files a report in one step." },
          ],
        },
        {
          type: "summary",
          heading: "The short version",
          summaryLabel: "The short version",
          body: "RiseLynk is built for elevator and escalator service shops that want one system instead of several.",
          points: [
            "Offline-first, so the field app keeps working with no signal.",
            "OEM-agnostic, so mixed routes live in one place.",
            "One shared system across the field, the office, and the customer.",
          ],
        },
        {
          type: "testimonials",
          heading: "What operators say",
          quotes: [
            { quote: "One system replaced three, and the field app just works underground.", author: "Service manager", role: "Regional contractor" },
          ],
        },
        {
          type: "faq",
          heading: "Common questions",
          faqs: [
            { q: "Does the field app work with no signal?", a: "Yes. The field app is offline-first and syncs when a connection returns." },
            { q: "Can it handle mixed OEM equipment?", a: "Yes. RiseLynk is OEM-agnostic, so a mixed route lives in one system." },
          ],
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      description: "Reach the RiseLynk team.",
      nav: "Contact",
      sections: [
        {
          type: "contact",
          heading: "Talk to us",
          body: "Send a message and a real person will reply.",
        },
      ],
    },
  ],
};
