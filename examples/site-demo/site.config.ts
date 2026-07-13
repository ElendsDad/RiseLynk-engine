import type { SiteConfig } from "@/lib/config-schema";

// =============================================================================
// NEUTRAL DEMO SITE (fictional business).
// Proves the config-drives-everything contract: this one file, plus its two brand
// colors, produces the whole site the engine builds. It exercises all three
// cumulative archetypes (brochure + lead-gen + simple-commerce) so a build covers
// nearly every section type. No real business, no invented compliance claims.
//
// The two brand colors below (primary + accent) are the entire palette. Swap them
// and every surface, button, eyebrow, and banner reskins with no other change.
// =============================================================================

export const site: SiteConfig = {
  business: {
    name: "Northgate Home Services",
    tagline: "Handyman, seasonal, and small-repair work for busy households.",
    phone: "(555) 012-3400",
    email: "hello@northgate.example",
    address: "Riverton, Demo State",
    serviceArea: "Serving Riverton and the surrounding county",
    hours: "Mon to Fri 8am to 5pm",
    socials: [{ label: "Facebook", href: "#" }],
    location: {
      locality: "Riverton",
      region: "CO",
      country: "US",
    },
    // Illustrative demo ratings for a FICTIONAL business, to exercise the review/rating
    // JSON-LD (feature-backlog #2). A real site emits ONLY ratings it actually holds; the
    // engine never synthesizes a star value (claims wall, see lib/rating-ld.mjs).
    rating: { ratingValue: 4.8, reviewCount: 63 },
    reviews: [
      { author: "Dana R.", rating: 5, body: "Showed up on time and worked through my whole list in one afternoon.", date: "2026-05-14" },
      { author: "Marcus T.", rating: 5, body: "Fair quote, tidy work, and friendly the whole way through.", date: "2026-04-02" },
    ],
    autoReply: {
      subject: "Thanks for reaching out to Northgate Home Services",
      body: "Thanks for your request. We received it and will call or email you shortly.\n\nNorthgate Home Services",
    },
  },

  brand: {
    // Two colors reskin the whole site. These are the demo's own palette,
    // distinct from the engine default, so the reskin is visible at a glance.
    colors: { primary: "#0f4c5c", accent: "#e36414" },
    font: "sans",
    // Browser-tab icon (feature-backlog #1). Points at a shared demo asset in public/.
    faviconUrl: "/favicon.svg",
  },

  seo: {
    domain: "https://northgate.example",
    titleSuffix: " | Northgate Home Services",
  },

  commerce: {
    currency: "usd",
  },

  // Persistent tap-to-call bar (the highest-converting contact channel for local trades).
  // Brand-neutral: no label override, so it uses the engine's neutral default call-to-action
  // and the real business.phone as a tel: link. Additive: enabling it adds the bar only.
  callBar: {
    enabled: true,
  },

  pages: [
    {
      slug: "",
      title: "Home",
      description: "Handyman and small-repair services for households in Riverton and nearby.",
      nav: "Home",
      sections: [
        {
          type: "hero",
          subheading: "Riverton and nearby",
          heading: "The help your to-do list has been waiting for.",
          body: "Friendly, reliable help for the repairs and small projects around your home. Clear quotes, tidy work, and no surprises.",
          ctaLabel: "Get a free quote",
          ctaHref: "/quote",
        },
        {
          // Trust strip above the fold, just under the hero (the research's #1 lead-gen move:
          // leading with trust signals lifts quote requests). Brand-neutral and fully config-
          // driven. ILLUSTRATIVE demo facts for a FICTIONAL business (same framing as the demo
          // ratings above); a real site supplies only trust facts it can prove (claims wall).
          type: "trustBar",
          trust: {
            licenseNumber: "DEMO-HS-0000",
            licenseLabel: "State contractor license",
            registryUrl: "https://www.example.com/verify-license",
            bonded: true,
            insured: true,
            yearsInBusiness: 12,
            items: [
              { label: "Ownership", value: "Family owned and operated" },
              { label: "Estimates", value: "Free, no obligation" },
              { label: "Workmanship", value: "One-year warranty" },
            ],
          },
        },
        {
          type: "services",
          subheading: "What we do",
          heading: "Handyman and seasonal work",
          items: [
            { icon: "*", title: "Repairs", body: "Doors, drywall, fixtures, and the small fixes that pile up." },
            { icon: "*", title: "Assembly and mounting", body: "Furniture, shelving, and TVs mounted safely." },
            { icon: "*", title: "Seasonal", body: "Gutter clearing, weather sealing, and yard cleanup." },
            { icon: "*", title: "Small projects", body: "A short punch list handled in one visit." },
          ],
        },
        {
          type: "testimonials",
          heading: "What neighbors say",
          quotes: [
            { quote: "Showed up on time and worked through my whole list in one afternoon.", author: "Dana R.", role: "Riverton" },
            { quote: "Fair quote, tidy work, and friendly the whole way through.", author: "Marcus T.", role: "Riverton" },
          ],
        },
        {
          type: "cta",
          heading: "Have a list building up?",
          body: "Send it over and we will get right back to you with a quote.",
          ctaLabel: "Request a quote",
          ctaHref: "/quote",
        },
      ],
    },
    {
      slug: "services",
      title: "Services",
      description: "Handyman repairs, assembly, seasonal work, and small projects in Riverton.",
      nav: "Services",
      sections: [
        {
          type: "services",
          heading: "Our services",
          body: "Honest quotes and tidy work. If we cannot help, we will tell you up front.",
          items: [
            { icon: "*", title: "Repairs", body: "Doors, drywall, fixtures, and general fixes." },
            { icon: "*", title: "Assembly and mounting", body: "Flat-pack furniture, shelving, and TV mounts." },
            { icon: "*", title: "Seasonal", body: "Gutters, weather sealing, and cleanup." },
            { icon: "*", title: "Small projects", body: "A batch of small tasks in a single visit." },
            { icon: "*", title: "Odd jobs", body: "The one-off task nobody else wants to book." },
            { icon: "*", title: "Maintenance visits", body: "A regular check to catch small problems early." },
          ],
        },
        {
          type: "cta",
          heading: "Not sure if we cover it?",
          body: "Ask us. We will point you the right way even if it is not our job.",
          ctaLabel: "Contact us",
          ctaHref: "/contact",
        },
      ],
    },
    {
      slug: "about",
      title: "About",
      description: "A local, owner-run home-services business serving Riverton and the surrounding county.",
      nav: "About",
      sections: [
        {
          type: "about",
          subheading: "About us",
          heading: "Local and owner-run",
          body: "Northgate Home Services is a small, owner-run shop built to give neighbors a reliable person to call for the work that does not need a specialist.\n\nEvery visit is quoted up front, and we treat your home like our own. No mess left behind, no surprise charges.",
        },
        {
          type: "testimonials",
          heading: "Trusted around town",
          quotes: [
            { quote: "The only person we call now. Reliable every single time.", author: "Priya N.", role: "Riverton" },
            { quote: "Fast, friendly, and fair. Highly recommend.", author: "Glen W.", role: "Riverton" },
          ],
        },
      ],
    },
    {
      slug: "shop",
      title: "Shop",
      description: "Prepaid visits and maintenance plans you can buy online.",
      nav: "Shop",
      sections: [
        {
          type: "products",
          subheading: "Buy online",
          heading: "Prepaid visits and plans",
          body: "Pay securely online and we will follow up to schedule.",
          products: [
            {
              id: "single-visit",
              name: "Single visit",
              description: "A one-hour visit for small repairs and quick tasks.",
              priceCents: 9900,
              cta: "Book a visit",
            },
            {
              id: "half-day",
              name: "Half-day block",
              description: "Four hours for a batch of tasks or a small project.",
              priceCents: 34900,
            },
            {
              id: "maintenance-plan",
              name: "Maintenance plan (annual)",
              description: "Two seasonal visits a year plus priority scheduling.",
              priceCents: 24900,
              cta: "Get the plan",
              // Illustrative demo rating for a FICTIONAL product, to exercise product-level
              // Review / AggregateRating JSON-LD (feature-backlog #2). Claims-walled: a real
              // site emits only ratings it actually holds.
              rating: { ratingValue: 4.7, reviewCount: 18 },
              reviews: [
                { author: "Priya N.", rating: 5, body: "Two visits a year keeps the little things from piling up.", date: "2026-03-10" },
              ],
            },
            {
              // Quote-only catalog item (v0.6.0): unpriced with a ctaHref, so its card CTA
              // links to the quote page instead of Stripe checkout. Its Product JSON-LD
              // (v0.6.1 auto-injection) carries no Offer, since there is no price to honor.
              id: "custom-project",
              name: "Custom project",
              description: "A larger or multi-day job. Tell us the scope and we will send a written quote.",
              cta: "Request a quote",
              ctaHref: "/quote",
            },
          ],
        },
      ],
    },
    {
      slug: "quote",
      title: "Get a Quote",
      description: "Request a free quote or book a visit in Riverton.",
      nav: "Get a Quote",
      sections: [
        {
          type: "leadform",
          subheading: "Free quote",
          heading: "Tell us what you need",
          body: "Share your list and we will get right back to you.",
          fields: ["phone", "service", "preferredTime", "message"],
          services: [
            "Repair",
            "Assembly or mounting",
            "Seasonal work",
            "Small project",
            "Odd job",
            "Not sure yet",
          ],
          submitLabel: "Request my quote",
          successMessage: "Thanks. We got your request and will reach out shortly.",
        },
        {
          type: "booking",
          heading: "Or book a visit now",
          body: "Pick a time that works for you.",
          bookingUrl: "https://cal.com/example/home-visit",
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      description: "Call or send a message to Northgate Home Services in Riverton.",
      nav: "Contact",
      sections: [
        {
          type: "contact",
          heading: "Get in touch",
          body: "Call during business hours, or send a message and we will reply quickly.",
        },
      ],
    },
  ],
};
