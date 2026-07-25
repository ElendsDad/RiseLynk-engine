import type { SiteConfig } from "@/lib/config-schema";

// =============================================================================
// ELEVATOR-CONTRACTOR DEMO SITE (fictional company: Summit Vertical Services).
//
// Proves the v0.2.0 elevator-contractor archetype end to end from one config file:
//   - the archetype sections (contractor services, trust bar, request service wired to
//     an intake path, customer-portal door) cumulative on the brochure set
//   - the GEO/AI-answer pack (an answer-first summary block, an FAQ whose FAQPage
//     JSON-LD mirrors the visible copy verbatim, and /llms.txt from this config)
//   - the persistent emergency call bar (plain branch-line number, dispatchRouted off)
//   - a LocalBusiness + Service @graph, emitted because archetype is elevator-contractor
//   - a hosted blog (one published article, one draft that carries noindex)
//   - the optional sections toggled to prove BOTH directions:
//       careers ON, records ON  ->  they render
//       modGallery present but enabled:false  ->  it emits no HTML (no real photos)
//
// Everything below is fictional. The registry link points at a real public lookup tool
// (how a real tenant site would work), with an obviously fictional license number.
// Copy discipline: no em/en dashes; no "compliant/certified/inspection-ready"; code
// requirements hedged to the authority having jurisdiction; entrapment language plain.
// =============================================================================

export const site: SiteConfig = {
  archetype: "elevator-contractor",

  business: {
    name: "Summit Vertical Services",
    tagline: "Elevator and escalator service for mixed-manufacturer routes across the Puget Sound region.",
    phone: "(555) 018-7700",
    email: "service@summit-vertical.example",
    address: "Demo City, WA",
    serviceArea: "Serving King, Pierce, and Kitsap counties",
    hours: "Mon to Fri 7am to 4pm, on-call after hours",
    // Structured weekly hours (engine feedback #27): the same schedule the free-form line
    // above states, now feeding openingHoursSpecification on the LocalBusiness node, the
    // llms.txt "Hours" line, and the visible Contact hours line from ONE source
    // (lib/hours-ld.mjs). Structured wins on those surfaces; the string stays as the
    // fallback for configs (or malformed schedules) without it.
    openingHours: [
      { days: ["monday", "tuesday", "wednesday", "thursday", "friday"], opens: "07:00", closes: "16:00" },
    ],
    // The feedback's emergency flag: this demo's on-call line is answered any hour (the
    // same fact its FAQ and call bar already state), so the LocalBusiness node gains an
    // emergency ContactPoint and llms.txt an emergency line. Claims-walled: a real site
    // sets this only when the business attests it.
    emergency247: true,
    location: {
      locality: "Demo City",
      region: "WA",
      country: "US",
    },
    // Illustrative demo ratings for a FICTIONAL company, to exercise the review/rating
    // JSON-LD on the LocalBusiness node (feature-backlog #2). Claims-walled: a real site
    // emits only ratings it actually holds; the engine never invents a star value.
    rating: { ratingValue: 4.9, reviewCount: 27 },
    reviews: [
      { author: "Property manager, Demo City", rating: 5, body: "Clear notes after every visit and quick to answer when we call.", date: "2026-06-01" },
    ],
  },

  brand: {
    // Two colors reskin the whole site. Deep vertical blue plus a safety amber.
    colors: { primary: "#12324a", accent: "#f2a541", bg: "#ffffff", text: "#16181d" },
    font: "sans",
    // Browser-tab and iOS home-screen icons (feature-backlog #1), a shared demo asset.
    faviconUrl: "/favicon.svg",
    appleTouchIconUrl: "/favicon.svg",
  },

  seo: {
    domain: "https://summit-vertical.example",
    titleSuffix: " | Summit Vertical Services",
  },

  // R5 design-system structural craft, ON for this demo (the closest archetype to riselynk.com).
  // The machine-room one-light surface, the grain dither, and the self-hosted OFL type pairing
  // are all DERIVED from the two brand colors above; flip these off (or drop the block) and the
  // site reverts to the light brochure surface unchanged. The scrollNarrative section on the home
  // page exercises the pinned-story-that-degrades. NOT harvested: RiseLynk's green, SVGs, or copy.
  craft: {
    oneLight: true,
    grain: true,
    fonts: true,
  },

  // Persistent emergency call bar. Plain branch-line number at first click; the same field
  // swaps to a dispatch-routed number (dispatchRouted: true) once the voice line's gates clear.
  callBar: {
    enabled: true,
    dispatchRouted: false,
    // The engine default call-to-action is brand-neutral now (v0.12 trust/call
    // generalization); this elevator site keeps its own entrapment-first line via label.
    label: "Someone stuck in an elevator? Call now during business hours.",
    regionLabel: "Emergency service line",
    note: "For a stuck elevator with someone inside, call first. Do not try to force the doors.",
    // Feeds the /llms.txt AI-assistant emergency tip (lib/llms.ts). Trade wording
    // stays in config; the engine never hardcodes an elevator line.
    emergencyContext: "a stopped elevator with someone inside",
  },

  blog: {
    title: "Field notes",
    description: "Plain-English notes on elevator service for building owners and property managers.",
    articles: [
      {
        slug: "what-to-expect-from-elevator-maintenance",
        title: "What to expect from a maintenance visit",
        description:
          "A plain-English look at what an elevator maintenance visit covers, what gets recorded, and what a building owner should be able to see afterward.",
        eyebrow: "For building owners",
        date: "2026-07-08",
        author: "Summit Vertical Services",
        lede: "If a mechanic visits your building on a schedule, here is what that visit is for and what you should be able to see when it is done.",
        summary: {
          label: "The short version",
          intro: "A maintenance visit keeps your equipment on its plan and leaves a record. Here is what to expect:",
          ordered: true,
          points: [
            "A mechanic works through the tasks the unit is due for and notes what was done.",
            "Anything found that needs a repair is written down and tracked until it is closed.",
            "The visit is logged against the unit, so its history stays in one place.",
            "You can ask for that history any time, and it should travel with the building.",
          ],
        },
        body: [
          "## Maintenance is a plan, not a repair call",
          "An elevator has parts that wear and safety devices that have to keep working for years. Keeping it running takes maintenance on a schedule, set by the unit's age, use, and environment, not just a call when something breaks.",
          "## What the mechanic actually does",
          "On a visit, the mechanic works through the tasks the unit is due for, checks the safety functions, and notes what was done. If they find something that needs attention, it gets written up as an open item and tracked until it is closed.",
          "## What you should be able to see",
          "A well-kept program keeps three things together per unit: a dated maintenance log, the records for the periodic safety tests, and the written maintenance program itself. When those are in order, questions like when a unit last had a test get easy to answer.",
          "Whether a specific code or edition applies to your building depends on what your jurisdiction has adopted, and that varies. Your authority having jurisdiction and your contractor confirm what applies.",
        ].join("\n\n"),
        faqs: [
          {
            q: "How often should an elevator be maintained?",
            a: "It depends on the unit. A maintenance program is set by the elevator's age, condition, use, environment, and the manufacturer's recommendations, so a busy passenger elevator and a rarely used freight lift do not get the same schedule. Your contractor sets the interval for each unit and keeps the records that show it was followed.",
          },
          {
            q: "What records should I be able to see after a visit?",
            a: "A dated maintenance log of what was done on the unit, the records for its periodic safety tests, and the written maintenance program document itself. A well-run program keeps those together per unit so everything on one elevator can be pulled in one step.",
          },
          {
            q: "Do the maintenance records stay with my building?",
            a: "They should. The program and records describe your equipment, so they should travel with the building rather than disappear when a service contract ends. It is worth confirming that with your contractor before you need it.",
          },
        ],
      },
      {
        slug: "planning-an-elevator-modernization",
        title: "Planning an elevator modernization",
        description: "A short guide to what a modernization involves and how to plan for the downtime.",
        eyebrow: "For building owners",
        date: "2026-07-09",
        author: "Summit Vertical Services",
        draft: true,
        lede: "Modernization replaces aging elevator components with current ones. Here is how to think about the scope and the schedule.",
        body: [
          "## What modernization means",
          "Modernization replaces aging parts of an elevator, often the controller, the drive, and the fixtures, with current equipment, while keeping the hoistway and structure. It is a planned project, not an emergency repair.",
          "This article is a draft and is not published yet.",
        ].join("\n\n"),
      },
    ],
  },

  pages: [
    {
      slug: "",
      title: "Elevator and escalator service",
      description:
        "Summit Vertical Services provides elevator and escalator maintenance, repair, modernization, and periodic testing across King, Pierce, and Kitsap counties.",
      nav: "Home",
      sections: [
        {
          type: "hero",
          subheading: "Puget Sound region",
          heading: "Elevator and escalator service that keeps its records straight.",
          body: "Maintenance, repair, modernization, and periodic testing for mixed-manufacturer routes. Clear communication, and a service history you can actually see.",
          ctaLabel: "Request service",
          ctaHref: "/request",
        },
        {
          type: "trustBar",
          trust: {
            licenseNumber: "SUMMITVS-000-DEMO",
            licenseLabel: "WA contractor license",
            registryUrl: "https://secure.lni.wa.gov/verify/",
            registryLabel: "Verify on the WA L&I registry",
            bonded: true,
            insured: true,
            yearsInBusiness: 18,
            brands: ["Otis", "KONE", "Schindler", "TK Elevator", "Hydraulic and traction"],
          },
        },
        {
          type: "contractorServices",
          subheading: "What we do",
          heading: "Four lines of work, one team",
          body: "We work on mixed-manufacturer routes, so one call covers the whole building.",
          serviceLines: [
            {
              key: "maintenance",
              title: "Maintenance",
              body: "Scheduled maintenance that keeps each unit on its plan, with the work logged against the unit so its history stays in one place.",
              points: ["Per-unit maintenance plan", "Callbacks answered by a mechanic who knows your building"],
            },
            {
              key: "repair",
              title: "Repair",
              body: "Diagnosis and repair when something is down, with parts sourced across manufacturers so a single-brand route is not a bottleneck.",
              points: ["Open items tracked until closed", "Clear before-and-after on what was found"],
            },
            {
              key: "modernization",
              title: "Modernization",
              body: "Planned replacement of aging controllers, drives, and fixtures to extend the life of the equipment you already have.",
              points: ["Scoped as a project with a schedule", "Downtime planned around the building"],
            },
            {
              key: "periodicTesting",
              title: "Periodic testing",
              body: "We schedule and run the periodic safety tests your equipment is due for and keep the records with each unit. Which tests apply and when depends on your jurisdiction; your authority having jurisdiction confirms what is required.",
              points: ["Category 1 and Category 5 tests scheduled ahead", "Records kept per unit"],
            },
          ],
        },
        {
          // R5 scroll-narrative: a pinned story of threshold scenes that degrades to a static,
          // readable step timeline under no-JS, reduced motion, and narrow screens. Caption-only
          // scenes here (the engine supplies the structure; a real site adds its own visuals), so
          // the same caption reads as one sentence across the scenes in both the animated stage
          // and the fallback. Claims-safe copy: nothing invented, no dashes, no affirmative claim.
          type: "scrollNarrative",
          subheading: "See it in action",
          heading: "From a request to a record, on one thread",
          scenes: [
            { label: "Step 01 / Request", caption: "A building manager reports a problem from the portal link at the front desk," },
            { label: "Step 02 / Logged", caption: "the request is logged against the exact unit," },
            { label: "Step 03 / Dispatch", caption: "dispatch routes it to a mechanic who knows the building," },
            { label: "Step 04 / On site", caption: "the mechanic works the callback and notes what was found," },
            { label: "Step 05 / On record", caption: "and it lands in the unit history you can see any time." },
          ],
        },
        {
          type: "summary",
          heading: "Choosing a service company, in short",
          summaryLabel: "The short version",
          body: "If you are deciding who maintains your elevators, a few things separate a company that keeps you informed from one that does not:",
          ordered: true,
          points: [
            "They cover your equipment across manufacturers, not just one brand.",
            "They keep a maintenance log, test records, and the written program together per unit.",
            "You can see your equipment's status and history without chasing anyone.",
            "The records travel with your building if you ever change companies.",
          ],
        },
        {
          type: "portalDoor",
          subheading: "Already a customer?",
          heading: "See your equipment any time",
          body: "Building managers can check equipment status and service history from the portal link at the front desk, no login required.",
          portalUrl: "https://portal.summit-vertical.example/",
          ctaLabel: "Open the customer portal",
        },
        {
          type: "testimonials",
          heading: "What building managers say",
          quotes: [
            {
              quote: "They pulled the full history on one elevator in about a minute when our inspector asked. That told me everything.",
              author: "Renee A.",
              role: "Property manager, Demo City",
            },
            {
              quote: "One company for a building with three different elevator brands. That alone made them worth the switch.",
              author: "Marcus D.",
              role: "Facilities director",
            },
          ],
        },
        {
          type: "faq",
          heading: "Common questions",
          faqs: [
            {
              q: "Do you work on elevators from any manufacturer?",
              a: "Yes. We service mixed-manufacturer routes, so a building with elevators from different makers is handled by one team, and parts are sourced across manufacturers rather than through a single brand.",
            },
            {
              q: "How fast can you respond to a callback?",
              a: "During business hours a mechanic is dispatched to callbacks in your service area. After hours, calls reach our on-call line. For an elevator stopped with someone inside, call the number on the bar at the bottom of this page first.",
            },
            {
              q: "Are you licensed, bonded, and insured?",
              a: "Yes. Our Washington contractor license, bond, and insurance are listed in the bar near the top of this page, and the registry link there opens the state lookup so you can check them yourself.",
            },
            {
              q: "Do you handle the periodic safety tests?",
              a: "We schedule and run the periodic tests your equipment is due for and keep the records with each unit. Which tests apply, and how often, depends on what your jurisdiction has adopted. Your authority having jurisdiction and our team confirm what applies to your building.",
            },
          ],
        },
        {
          type: "cta",
          heading: "Need service, or a second opinion?",
          body: "Tell us about your building and we will get back to you.",
          ctaLabel: "Request service",
          ctaHref: "/request",
        },
      ],
    },

    {
      slug: "request",
      title: "Request service",
      description: "Request elevator or escalator service from Summit Vertical Services.",
      nav: "Request service",
      sections: [
        {
          type: "requestService",
          subheading: "Request service",
          heading: "Tell us what is going on",
          body: "Send us the building and what you are seeing. During business hours we route it to a mechanic.",
          // Wired to the tenant's portal-intake path: the confirmation can honestly speak of
          // a logged request and a reference number. Unset would degrade to a mailto with no
          // reference promise (see the careers apply form, which uses the mailto fallback).
          intakeUrl: "https://portal.summit-vertical.example/api/intake",
          intakeEmail: "service@summit-vertical.example",
          referenceNote: "Your request is logged and routed to our dispatch. We will follow up with a reference number.",
          fields: ["phone", "service", "message"],
          services: ["Maintenance", "Repair or callback", "Modernization", "Periodic testing", "Not sure yet"],
          submitLabel: "Send request",
        },
      ],
    },

    {
      slug: "careers",
      title: "Careers",
      description: "Elevator mechanic and helper roles at Summit Vertical Services in the Puget Sound region.",
      nav: "Careers",
      sections: [
        {
          type: "careers",
          subheading: "Work with us",
          heading: "Mechanics and helpers, this one is for you",
          careers: {
            enabled: true,
            intro: "We run mixed-manufacturer routes across three counties. If you know the trade, you will not be bored.",
            roles: [
              { title: "Service mechanic", body: "Route maintenance, callbacks, and periodic tests. IUEC card and mixed-fleet experience welcome." },
              { title: "Repair and mod mechanic", body: "Controller, drive, and fixture work on planned modernization projects." },
              { title: "Helper and apprentice", body: "Learn the trade on real equipment alongside mechanics who will actually teach." },
            ],
            onCall:
              "On call is real and it is shared. You take a week in the rotation, you get paid for it, and the office backs you up. We do not dump the phone on one person and disappear.",
            apprenticeship:
              "If you are trying to get into the trade, we hire helpers and support the apprenticeship path through the local program. Show up, learn, and there is a mechanic's card at the end of it.",
            // Mailto fallback: no intake endpoint wired, so applications open the email client.
            applyEmail: "jobs@summit-vertical.example",
            submitLabel: "Apply",
          },
        },
      ],
    },

    {
      slug: "about",
      title: "About",
      description: "About Summit Vertical Services, an elevator and escalator service company in the Puget Sound region.",
      nav: "About",
      sections: [
        {
          type: "about",
          subheading: "About us",
          heading: "One team for the whole building",
          body: "Summit Vertical Services works on mixed-manufacturer routes across King, Pierce, and Kitsap counties.\n\nWe are not the biggest company in the region. We are the one that answers the phone and keeps your records straight.",
        },
        {
          type: "records",
          subheading: "Transparency",
          heading: "The records you get",
          records: {
            enabled: true,
            intro: "You should not have to take our word for the work. Here is what you can see.",
            items: [
              { title: "Per-unit history", body: "A dated log of maintenance and repairs on each elevator and escalator, kept with the unit." },
              { title: "After a callback", body: "What was found, what was done, and anything left open, written down and tracked until it is closed." },
              { title: "Periodic tests", body: "The records for the periodic safety tests your equipment is due for, kept per unit. What applies depends on your jurisdiction." },
              { title: "The written program", body: "The maintenance program document for each unit, available to you and printable to post in the machine room." },
            ],
          },
        },
        {
          // Present but disabled: this fictional company has no real project photos, so the
          // before/after gallery ships OFF. It emits no HTML, which is the proof that an
          // optional section toggled off produces nothing (verification: absent when disabled).
          type: "modGallery",
          enabled: false,
          heading: "Modernization projects",
          projects: [],
        },
      ],
    },

    {
      slug: "contact",
      title: "Contact",
      description: "Call or message Summit Vertical Services in the Puget Sound region.",
      nav: "Contact",
      sections: [
        {
          type: "contact",
          heading: "Get in touch",
          body: "Call during business hours, or send a message and we will reply quickly. For a stuck elevator with someone inside, use the call bar at the bottom of the page.",
        },
      ],
    },
  ],
};
