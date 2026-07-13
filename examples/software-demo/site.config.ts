import type { SiteConfig } from "@/lib/config-schema";

// =============================================================================
// SOFTWARE-PRODUCT DEMO (Phase-A product-marketing layer).
// Exercises the software-product archetype (G3) and the pricing section (G4):
// `archetype: "software"` emits a schema.org SoftwareApplication node in the site
// @graph (alongside Organization + WebSite), and the pricing tiers below feed its
// Offer / AggregateOffer JSON-LD (claims-walled: only the tiers that carry a real
// numeric priceValue become Offers, so the Enterprise "Custom" plan emits none).
//
// Product framing and pricing are RiseLynk's own, real and attested (from the
// design bundle pricing page). No aggregate rating is set, because the product
// holds no public review average yet, so the SoftwareApplication node emits no
// AggregateRating: the claims wall by absence. Copy discipline is honored: no em
// or en dashes, no exclamation marks, and no invented claims.
// =============================================================================

export const site: SiteConfig = {
  archetype: "software",

  business: {
    name: "RiseLynk",
    tagline:
      "Offline-first maintenance software for elevator and escalator service companies.",
    email: "hello@riselynk.com",
    socials: [{ label: "Live demo", href: "https://demo.app.riselynk.com" }],
  },

  // The software product this site markets. Every field defaults sensibly, so
  // `archetype: "software"` alone would suffice; these make the node explicit.
  software: {
    name: "RiseLynk",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "One connected system for the field, the office, and the customer, built to keep working when the signal drops.",
  },

  brand: {
    colors: { primary: "#0c6b52", accent: "#5dcaa5" },
    font: "sans",
  },

  seo: {
    domain: "https://riselynk.com",
    titleSuffix: " | RiseLynk",
  },

  commerce: {
    currency: "usd",
  },

  pages: [
    {
      slug: "",
      title: "Home",
      description:
        "Offline-first maintenance software for elevator and escalator service companies.",
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
            { icon: "*", title: "Lynk AI assistant", body: "An in-app assistant that helps draft and organize work, with a person in the loop." },
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
          type: "faq",
          heading: "Common questions",
          faqs: [
            { q: "Does the field app work with no signal?", a: "Yes. The field app is offline-first and syncs when a connection returns." },
            { q: "Can it handle mixed OEM equipment?", a: "Yes. RiseLynk is OEM-agnostic, so a mixed route lives in one system." },
          ],
        },
        {
          type: "cta",
          heading: "See it live, then talk to us",
          body: "Walk through a live demo with sample data and no signup, then reach out when you are ready.",
          ctaLabel: "See a live demo",
          ctaHref: "https://demo.app.riselynk.com",
        },
      ],
    },
    {
      slug: "pricing",
      title: "Pricing",
      description:
        "Simple per-seat pricing for RiseLynk. Standard from $39 per seat, Pro from $59 per seat, and custom Enterprise.",
      nav: "Pricing",
      sections: [
        {
          type: "pricing",
          subheading: "Pricing",
          heading: "Simple per-seat pricing, built for a service shop.",
          body: "Introductory pricing, subject to change and confirmed in a signed agreement.",
          tiers: [
            {
              name: "Standard",
              price: "From $39",
              period: "per seat / mo",
              priceValue: 39,
              meta: "$300 per month minimum, plus a one-time $500 setup fee, waived on annual prepay.",
              who: "For a single branch getting organized.",
              features: [
                "Field app, dispatch and routes",
                "Tickets, time, materials, and Category tests",
                "Customer portal",
                "Lynk AI assistant",
              ],
              ctaLabel: "Request access",
              ctaHref: "/contact",
            },
            {
              name: "Pro",
              price: "From $59",
              period: "per seat / mo",
              priceValue: 59,
              meta: "$400 per month minimum, plus a one-time $1,500 setup fee, waived on annual prepay.",
              who: "For a full-service operation.",
              features: [
                "Everything in Standard",
                "Proposals and sales CRM",
                "Contracts, invoicing, and payroll",
                "Inventory and purchase orders",
                "Account margin and labor cost",
              ],
              ctaLabel: "Request access",
              ctaHref: "/contact",
              highlighted: true,
              badge: "Most popular",
            },
            {
              name: "Enterprise",
              price: "Custom",
              meta: "Custom quote with a scoped implementation fee.",
              who: "For multi-branch and custom needs.",
              features: [
                "Everything in Pro",
                "Dedicated tenant for your company",
                "Advanced security options",
                "Priority support",
              ],
              ctaLabel: "Talk to us",
              ctaHref: "/contact",
            },
          ],
        },
        {
          type: "cta",
          heading: "Questions about a plan?",
          body: "Tell us your seat count and route mix, and we will walk you through the options.",
          ctaLabel: "Contact us",
          ctaHref: "/contact",
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
