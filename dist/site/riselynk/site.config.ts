import type { SiteConfig } from "@/lib/config-schema";

// =============================================================================
// riselynk.com on site-engine v0.17.0 - the marketing apex as a PURE ENGINE
// CONSUMER: this config + public/ assets + the pinned tag in engine.pin, zero
// engine forks (Phase-A plan of record: site-engine/docs/plans/phase-a-build-plan.md).
//
// v0.17.0 fidelity pack ON (2026-07-12, overnight finale): the config now turns
// on the harvested craft + motion layer (glass hover, aurora, magnetic CTAs, hero
// motion, on top of the one-light / grain / fonts already carried), the multi-CTA
// hero with its mono proof row and RiseLynk's own dispatch-board hero-viz art, the
// modal request-access lead intake (rich declarative fields from the bundle #suScrim,
// confetti on success), the feature-card badge / flagship / mini-viz treatments, the
// gradient hot-plan price, the calm (unpinned) scroll story, nav condense + progress
// + a blog link, and the dusk closing band on the final CTA and the footer. The three
// accepted v0.14.0 downgrades (single-CTA hero, inline leadform, no hero-viz) are
// retired: the bundle's full intent now rides the engine slots verbatim.
//
// Copy source of truth: the founder's design bundle
// RiseLynk/design-bundle/design_session_2026-7-12 (docs/design.config.json for
// the theme tokens, website/*.html for every string). Where the bundle HTML and
// a spec doc diverge, the shipped HTML wins (C-4: the hero kicker is the SHIPPED
// "Elevator service platform", not the spec's stale one). Claims wall: every
// claim, price, and feature below is transcribed from that bundle; nothing is
// invented. Copy fixes applied per the Phase-A audit: B-2 "real sample data" ->
// "live sample data" (resources closing CTA); A-1 dies with the newsletter (the
// newsletter section and its confirm/unsubscribe pages are NOT ported, killed);
// D-5 &checkmark; entity bug does not carry (the engine renders real glyphs).
// No em or en dashes, no exclamation marks, gradient text only on the pricing
// hot-plan price (the engine's `highlighted` hook).
//
// The theme palettes below are VERBATIM from design.config.json themes.light /
// themes.dark (byte-match is the acceptance criterion; the hand-tuned AA margins
// are impossible under derivation).
//
// seo.domain is deliberately UNSET: the build is draft/noindex until the founder
// attaches riselynk.com at cutover (the go-live flip is adding the domain line).
// =============================================================================

export const site: SiteConfig = {
  archetype: "software",

  business: {
    name: "RiseLynk",
    tagline:
      "Offline-first maintenance software for elevator and escalator service companies.",
    email: "hello@riselynk.com",
    socials: [{ label: "Live demo", href: "https://demo.app.riselynk.com" }],
    // No business.location on purpose: a structured location would flip the
    // @graph org node to LocalBusiness. riselynk.com is a software product
    // site; the org node must stay Organization (Phase-A acceptance).
  },

  // The software product this site markets (G3). Emits the SoftwareApplication
  // node in the @graph, with Offers built from the pricing tiers below (G4).
  software: {
    name: "RiseLynk",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "One connected system for the field, the office, and the customer, built to keep working when the signal drops.",
  },

  brand: {
    // The single-hue green contract: primary and accent both map to the brand
    // green; the per-theme token sheet carries the light/dark values.
    colors: { primary: "#0c6b52", accent: "#0c6b52" },
    font: "sans",
    faviconUrl: "/favicon.svg",
    appleTouchIconUrl: "/apple-touch-icon.png",
  },

  // Dual-theme (G1 + G2): light-first with a nav toggle to the machine-room
  // dark. Both palettes VERBATIM from design.config.json (byte-match).
  theme: {
    enabled: true,
    default: "light",
    palette: {
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
    // The theme-color contract from the bundle boot script.
    metaColor: { light: "#fafaf7", dark: "#0f1412" },
  },

  // R5 + R5.1 structural craft and motion. one-light key light and grain dither
  // structure the dark theme; fonts turns on the self-hosted Barlow + IBM Plex Mono
  // pairing. The R5.1 motion layer (v0.17.0 fidelity pack): glass hover on the
  // card surfaces (fine-pointer only), the aurora drift behind the hero, magnetic
  // primary CTAs, and the hero rise-in with the h1 underline draw. Every one derives
  // from the two brand colors and is settled by the master reduced-motion guard.
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
    // GO-LIVE 2026-07-13 (founder authorized the cutover): domain set, so the site is
    // now indexable with canonical URLs on riselynk.com. (Was draft/noindex until now.)
    domain: "https://riselynk.com",
    titleSuffix: "",
    ogImage: "/og-image.png",
  },

  commerce: {
    currency: "usd",
  },

  // Header-nav chrome (harvested from the bundle nav): the header condenses past a
  // small scroll threshold, a scroll-progress hairline rides the top, and the /blog
  // route joins the nav (the blog publishes, so the link shows). All derive from the
  // two brand colors; nothing is baked.
  nav: {
    condense: true,
    progress: true,
    blogLabel: "Blog",
  },

  // Footer legal line + utility links, on the dusk band. legalName sets the copyright
  // entity to the operating company; the links mirror the bundle footer's utility row
  // (Privacy, Cookies, Pitch). dusk renders the footer on the dark-in-both-themes band
  // so the page ends in the machine room.
  footer: {
    legalName: "Maxwell Industries LLC",
    links: [
      { label: "Trust", href: "/trust" },
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Pitch", href: "/pitch" },
    ],
    dusk: true,
  },

  // Informational cookie notice (the bundle ships cookie-notice.js on every
  // page); links readers to the ported cookie notice page.
  cookieNotice: {
    enabled: true,
    policyHref: "/cookies",
    policyLabel: "Cookie notice",
  },

  blog: {
    title: "RiseLynk blog: notes from the elevator trade",
    description:
      "Field-credible writing on running an elevator and escalator service operation: offline-first field work, dispatch and routes, records, and the customer side. Straight talk, no sales spin.",
    articles: [
      // ----------------------------------------------------------------------
      // Article: What a maintenance control program is, for building owners.
      // Transcribed verbatim from the bundle (copy-editor approved).
      // ----------------------------------------------------------------------
      {
        slug: "what-is-a-maintenance-control-program",
        title: "What a maintenance control program is, for building owners",
        description:
          "A plain-English explainer of the elevator maintenance control program (the maintenance program ASME A17.1 Section 8.6 describes) for building owners and property managers: what it is, why your contractor keeps records against it, what to expect to see, and what happens at inspection time.",
        eyebrow: "For building owners",
        author: "RiseLynk",
        lede:
          "If your elevator contractor has mentioned a maintenance control program, or an inspector asked to see one, here is what that means in plain English. You do not have to become an elevator expert. You do need to know what the program is, why the records exist, and what to expect when someone asks for them.",
        summary: {
          label: "The short version",
          intro:
            "A maintenance control program, usually called an MCP, is the written maintenance plan for each elevator or escalator in your building. Here is what a building owner needs to know:",
          ordered: true,
          points: [
            "What it is. ASME A17.1 Section 8.6, the elevator safety standard, describes a written maintenance program for each unit, based on that unit's age, condition, wear, use, environment, and the manufacturer's recommendations.",
            "Who runs it. The company that maintains your equipment provides the program and keeps the records. You do not write it, and neither does the inspector.",
            "What to expect to see. A maintenance log, the test records for the annual and five-year category tests, and the written program document itself.",
            "What happens at inspection. The inspector may ask to see the program and its records, and many jurisdictions expect them to be available at the building.",
            "Whether it applies to you. Which code and which edition apply depends on what your jurisdiction has adopted, and that varies. Your authority having jurisdiction and your contractor confirm what applies.",
          ],
        },
        body: `An elevator is not a machine you install and forget. It has parts that wear, doors that cycle thousands of times a day, and safety devices that have to keep working for decades. Keeping it running safely takes maintenance on a plan, not just a repair when it breaks. That plan is the maintenance control program, and this guide explains it for the person who owns or manages the building rather than the mechanic who works on the equipment.

## What a maintenance control program actually is

In the elevator trade the maintenance control program is usually shortened to MCP. ASME A17.1, the Safety Code for Elevators and Escalators (published with CSA B44 in Canada), describes it in a part called Section 8.6. The idea is straightforward: for each elevator or escalator, there is a written program that lays out what maintenance gets done and how often, set by that unit's age, condition, wear, how much it is used, its environment, and what the manufacturer recommends.

A few things follow from that, and they matter to you as an owner:

- **It is per unit, not one size fits all.** A busy passenger elevator in a hospital and a rarely used freight lift in a warehouse do not get the same program. The point of Section 8.6 is that the program reflects the actual unit.
- **The maintaining company provides it.** Section 8.6 puts the program in the hands of the company that maintains your equipment, not the building owner and not the inspector. Your contractor builds it. You do not.
- **Qualified people do the work.** The maintenance itself is done by licensed or qualified elevator personnel, again per the standard.
- **The inspector checks it but does not write it.** The authority having jurisdiction and its inspector review the program and the records. They are not the authors.

One honest caveat up front. Whether ASME A17.1 applies to your building, and which edition, depends on the code your state, county, or city has adopted. That varies from place to place, and editions change over time. So treat Section 8.6 as the shape of the program, and let your authority having jurisdiction and your contractor confirm exactly what applies where your building sits.

## Why your contractor keeps records against it

A program on paper is only half of it. The other half is the record that the program was actually followed. So alongside the written MCP, your contractor keeps a running record of the work.

That is why, every time a mechanic visits, they log what they did. It is why the annual and five-year safety tests get written up and filed. It is why an open deficiency, meaning something found that needs a repair, gets tracked until it is closed. These records are the evidence that the unit is being maintained on its program, and they are what an inspector, an insurer, or a new contractor will want to see.

For you, this has a practical upside. When the records are kept well, questions get easy to answer. When did that elevator last have its five-year test. What was found at the last visit. Is anything still open on it. A contractor who keeps good records can answer those in a minute. One who keeps them in a truck box and a memory cannot.

## What you should expect to see

You do not need to read every line. You do need to know these exist and be able to get them. There are three pieces:

- **The maintenance log.** A dated record of maintenance visits on each unit and what was done. This is the running history of the equipment.
- **The test records.** Elevators get periodic safety tests. The common ones are the annual test, often called the Category 1, and the five-year test, the Category 5, plus firefighters' emergency operation checks. Each comes with a written record and, where required, a filed report.
- **The program document itself.** The written MCP for each unit. It is often printed and posted in the machine room so it is on hand for whoever is working on or inspecting the equipment.

A well-run program keeps those together per unit, so pulling everything on one elevator is one step, not a scavenger hunt.

### A simple way to check

Ask your contractor to pull everything on one elevator: its program document, its maintenance log, and its last annual and five-year test records. If that takes a minute, the records are in good shape. If it takes a week, that is worth knowing before an inspector asks.

## What happens at inspection time

Elevators are inspected on a schedule set by your jurisdiction, usually with a periodic inspection and the category tests as they come due. A certified inspector, often called a QEI, comes out, checks the equipment, and, importantly for this article, may ask to see the maintenance control program and the records that go with it.

Two things are worth knowing here:

- **The records may need to be at the building.** Many jurisdictions expect the maintenance program and its records to be available on-site at the time of inspection, not filed away in an office across town. This is a common reason the written program is posted in the machine room. Whether that applies to you, and in exactly what form, is something your authority having jurisdiction and your contractor can confirm.
- **A good record set makes the visit smoother.** When the program is current and the records are complete and on hand, the inspection is about the equipment. When they are missing or scattered, the paperwork becomes the problem, and that can hold things up.

None of this makes anyone pass. An inspection is the inspector's judgment about the equipment on that day. Keeping good records does not certify the elevator or guarantee an outcome. What it does is let you and your contractor show the work, which is the part you can control.

## What to ask your contractor

You do not have to audit the program yourself. A few plain questions tell you a lot about whether it is being run well.

### Questions to take to your service company

- Ask to see the written maintenance control program for each elevator and escalator in the building.
- Ask where the records are kept and how fast they can be produced if an inspector or insurer wants them.
- Ask when each unit's next annual test and next five-year test come due.
- Ask what is currently open or deferred on any unit, and what the plan is to close it.
- Confirm the maintenance and test records are available at the building the way your jurisdiction expects for the inspection.
- Confirm the program and the records come with you if you ever change service companies.

That last one matters more than it looks. The program and the records describe your equipment, and you want them to travel with the building, not disappear when a contract ends.

## Where RiseLynk fits

Now the honest part. RiseLynk is software, and building owners are not our customer. Elevator service companies are. We build the tools your contractor might use to keep all of this organized, so it is fair to say where it touches you and where it does not.

For a service company that uses RiseLynk, the software assembles a starting-point maintenance control program for each unit, structured around ASME A17.1 and CSA B44 Section 8.6, from the manufacturer materials the company supplies. That starting point is a draft the company's own qualified personnel review, complete, and adopt. It is not a code-compliance certification, and RiseLynk is not the inspector or the authority having jurisdiction. The program, the manufacturer materials, and the record of what was adopted stay together per unit, on the same system the company's field and office teams use, and a readable copy can be printed to post in the machine room.

If your contractor uses RiseLynk, you may also get a sign-in to a customer portal where you can see your buildings' equipment, service status, and history. That is the part a building owner touches directly. It does not change who is responsible for the program. That stays with your contractor's qualified people and your authority having jurisdiction.

RiseLynk is a web-based app your contractor reaches in a browser and can install to a phone's home screen. The behavior described here is how the product is built. Nothing on this page is legal or code-compliance advice; confirm what your jurisdiction requires with your authority having jurisdiction and your service company.

## For the service companies who keep these records

RiseLynk is the system some elevator service companies use to build a starting-point program for each unit and keep the records together per unit. If that is you, click through the field and office apps on synthetic data, no signup. [See a live demo](https://demo.app.riselynk.com) or browse the [industry resources](/resources).`,
        faqs: [
          {
            q: "What is a maintenance control program for an elevator?",
            a: "A maintenance control program, or MCP, is the written maintenance plan for each elevator or escalator in a building. ASME A17.1 Section 8.6, the elevator safety standard, describes it: a per-unit program that sets what maintenance is done and how often, based on the unit's age, condition, wear, use, environment, and the manufacturer's recommendations. The company that maintains the equipment provides it, and qualified elevator personnel do the work.",
          },
          {
            q: "Who is responsible for the maintenance control program, the owner or the contractor?",
            a: "Under ASME A17.1 Section 8.6, the company that maintains your equipment provides and maintains the program, and its qualified personnel do the work. As the building owner you do not write it. You should know it exists, be able to see it and its records, and make sure they travel with the building if you change service companies. The authority having jurisdiction inspects the program but does not author it.",
          },
          {
            q: "What records should a building owner expect to see?",
            a: "Three pieces: a maintenance log, meaning a dated record of visits and what was done on each unit; the test records for the annual Category 1 test, the five-year Category 5 test, and firefighters' emergency operation checks; and the written program document itself, which is often posted in the machine room. A well-run program keeps those together per unit so everything on one elevator can be pulled in one step.",
          },
          {
            q: "Does an inspector look at the maintenance control program?",
            a: "Often, yes. At inspection an inspector may ask to see the maintenance control program and the records that go with it, and many jurisdictions expect those records to be available at the building rather than filed elsewhere. Keeping the program current and the records on hand makes the visit smoother, but it does not certify the equipment or guarantee an outcome. The inspection is the inspector's judgment about the equipment that day.",
          },
          {
            q: "Is a maintenance control program legally required?",
            a: "It depends on where your building is. ASME A17.1 Section 8.6 describes the program, but whether that code applies, and which edition, depends on what your state, county, or city has adopted, and that varies from place to place and changes over time. Treat Section 8.6 as the shape of the program and let your authority having jurisdiction and your contractor confirm exactly what applies to your building.",
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Article: Why elevator field software has to work with no signal.
      // Transcribed verbatim from the bundle (copy-editor approved).
      // ----------------------------------------------------------------------
      {
        slug: "offline-first-in-the-machine-room",
        title: "Why elevator field software has to work with no signal",
        description:
          "A machine room is one of the hardest places on a job to hold a cell signal. Here is what offline-first field software means for elevator and escalator crews, and why cloud-only tools stall where the work actually happens.",
        eyebrow: "Field operations",
        author: "RiseLynk",
        lede:
          "A machine room is one of the hardest places on any job to hold a cell signal. That is a problem, because it is also where a lot of the work gets done. Software that only works online quits exactly where the crew needs it most.",
        body: `Walk the route of a typical elevator or escalator crew and you spend the day in the places phones like least. Machine rooms sit below grade or up in a roof penthouse, wrapped in concrete and steel. Pits and hoistways are worse. Even a building with good coverage in the lobby can drop to zero bars two floors down or forty floors up. The signal does not care that you have a ticket to close.

For a long time the answer was paper. A tech carried a clipboard, wrote down times and parts and readings, and re-keyed all of it at the truck or back at the branch that evening. It worked, but it was slow, it was easy to lose, and nothing the office saw was current until the paperwork caught up.

Field software was supposed to fix that. A lot of it made it worse. Move the clipboard into an app that needs a live connection and you have handed the crew a clipboard that stops writing in the one room where they need it.

## What "offline-first" actually means

Offline-first is not the same as "works a little bit offline." Plenty of apps cache the last screen you looked at and call it a day. The moment you try to save something, they reach for the network, spin, and fail.

**Offline-first means the app treats no signal as the normal case, not the error case.** Everything you need is already on the phone. Everything you enter is written to the phone first. When signal comes back, the app syncs on its own, in the background, without anyone thinking about it. The tech never has to know whether they were online. They just do the work.

### The test is simple

Put the phone in airplane mode, do a full day of work, then turn the radio back on. If nothing was lost and everything landed in the office cleanly, the app is offline-first. If a save spun forever, it was online software wearing a field-app costume.

## What that looks like on a real call

Here is the same day, on software built offline-first from the start. This is how RiseLynk's field app behaves in the machine room:

- **The route is already there.** A tech opens the assigned route and full ticket details on site and keeps working with no signal. Nothing has to load.
- **The work gets captured where it happens.** Time, materials and parts, photos, and notes go against each ticket offline, and reconcile cleanly when the phone is back online.
- **Photos and PDFs attach in place.** Attachments on tickets, parts, expenses, and units are captured offline and uploaded in the background once there is signal.
- **Test forms get filled on the unit.** A tech completes Category test forms on the unit and exports a filled PDF packet from the phone, offline.
- **Messages wait, then send.** A note to the branch, a person, a group, or a specific ticket thread is written offline-first and delivered the moment there is signal.

The pattern across all of it is the same. The tech is never blocked by the network, and nothing they did in the basement has to be re-typed at the truck.

## Why the office feels it too

Offline-first is usually described as a field convenience. It is really an office feature wearing work boots. When the crew's day syncs on its own, the office is working from what actually happened, not from a stack of notes waiting to be entered.

RiseLynk puts the field app, the office console, and the customer portal on one shared system, so there is no re-keying between tools. What the tech captured in the machine room is what dispatch, billing, and the building's own records draw from. One entry, one source.

## Built for real routes

Two more things matter once you accept that the job happens off the grid. RiseLynk is OEM-agnostic, built for mixed-manufacturer routes rather than locked to one equipment maker, because a real route rarely runs one brand. And when a tech does have a question about a building, a unit's service history, or what is still open on the route, they can ask Lynk in plain English and get an answer from the company's own records. That is a quiet assist on top of the work, not the point of the tool.

RiseLynk is a web-based app you reach in a browser and can install to a phone's home screen. The offline behavior described here is how the field app is built; a live version runs on sample data so you can see it for yourself.

## See the field app work offline

Click through the field app, dispatch board, and customer portal on synthetic data, no signup. Then try it the honest way: put it in airplane mode. [See a live demo](https://demo.app.riselynk.com) or browse the [industry resources](/resources).`,
      },

      // ----------------------------------------------------------------------
      // Article: How to choose maintenance software for an elevator service
      // company. Transcribed verbatim from the bundle (copy-editor approved).
      // ----------------------------------------------------------------------
      {
        slug: "how-to-choose-elevator-maintenance-software",
        title: "How to choose maintenance software for an elevator service company",
        description:
          "A practical buying guide for elevator and escalator service companies evaluating field and maintenance software: what to test, the cost traps to watch, data ownership, and why trade-specific beats generic field service management.",
        eyebrow: "Buying guide",
        author: "RiseLynk",
        lede:
          "Most field service software was built for a different trade and dressed up to look like yours. Here is how to evaluate maintenance software for an elevator and escalator service company against the way the work actually runs, so you buy the tool that fits the route instead of the one with the best demo.",
        summary: {
          label: "The short version",
          intro:
            "Choose elevator maintenance software by testing it against the work, not the sales deck. Six things decide it:",
          ordered: true,
          points: [
            "Offline in the machine room. Does it keep working with no signal, where a lot of the job happens.",
            "Elevator dispatch, on-call, and callbacks. Does it understand callbacks and entrapments, not just generic jobs.",
            "Records you can produce on request. Can it hold each unit's history and a maintenance program structured around ASME A17.1 Section 8.6.",
            "How the price scales. Watch per-seat math as you add the whole crew.",
            "Data you can get back out. Can you export your own accounts, units, and history, and who owns it.",
            "Trade-specific, not generic. Built for elevator work, or a general field service tool you have to bend.",
          ],
        },
        body: `An elevator service company does not run like an HVAC shop or a plumbing outfit, and most field service management software was written for those. The shape of the work is different. You maintain units, not appliances. You run Category tests on a schedule set by code, not one-off service calls. You carry an after-hours on-call rotation, and an entrapment is a life-safety event, not a normal ticket. When you shop for software, a generic feature checklist will miss the parts that matter and sell you on the parts that do not. This guide walks the criteria that actually separate a good fit from an expensive mistake.

## 1. Does it work where the work happens

Machine rooms sit below grade or up in a roof penthouse, wrapped in concrete and steel. Pits and hoistways are worse. A building with full bars in the lobby can drop to zero two floors down or forty floors up. That is not an edge case for your crew. It is a large share of the day.

**So the first question is whether the app keeps working with no signal.** Plenty of tools cache the last screen you looked at and call it offline. The moment a tech tries to save a reading, add a part, or attach a photo, they reach for the network, spin, and fail. Real offline-first software treats no signal as the normal case: everything is on the phone already, everything the tech enters is written to the phone first, and it syncs on its own when signal returns.

### Test it, do not take their word

Put a phone in airplane mode, run a full ticket start to finish with time, parts, notes, and a photo, then turn the radio back on. If everything lands cleanly and nothing was lost, it is offline-first. If a save spun forever, it was online software wearing a field-app costume.

## 2. Dispatch, on-call, and callbacks

Dispatch for an elevator company is not generic job scheduling. You are moving mechanics between routine maintenance, callbacks, and emergencies across a branch, and you need to know who is closest and free right now. A live board that shows every tech and open call, with one-tap assignment, is worth more than a calendar you have to babysit.

Two things separate trade-aware dispatch from a generic scheduler. First, entrapments. Getting a person out of a stuck car is a life-safety priority, and the tool should treat it that way rather than as another line on the list. Second, the after-hours on-call rotation. Someone carries the phone every week, that rotation has to be fair, and swaps happen. Software that has no concept of on-call leaves you running it on a whiteboard and a group text.

## 3. Records you can produce when someone asks

Every unit accumulates a history: maintenance visits, callbacks, parts, and the Category 1 and Category 5 tests that come due on a schedule. On top of that, ASME A17.1 Section 8.6 calls for a written Maintenance Control Program for each unit. When a building owner, an insurer, or the authority having jurisdiction asks you for records, you want to open the unit and produce them, not dig through a truck box of paper.

Be clear-eyed about what software can and cannot claim here. A good tool keeps a unit's service history and a maintenance program **structured around** Section 8.6 in one place, as a starting point your own qualified personnel review, complete, and adopt. No software makes you compliant, certifies anything, or guarantees a passing inspection. Your qualified people and the authority having jurisdiction remain responsible for that. What software can do is make the records easy to keep current and easy to hand over. Treat any vendor who tells you their product is "inspection-ready" or "code-compliant" as a vendor to slow down with.

## 4. Watch the per-seat math

This guide will not quote anyone's prices, and neither should you rely on a headline number, because the trap is usually in how the price scales rather than where it starts. Field service tools that charge per seat can quietly punish you for putting the whole operation on them. Add a dispatcher, an office admin, a few helpers, and a growing field crew, and a number that looked reasonable for a handful of users becomes a reason to leave people off the system, which defeats the point.

So ask the scaling questions before you sign, of every vendor including us. How does the price change when I add a helper, a dispatcher, and an office admin. Do read-only or occasional users cost the same as a full seat. Are core features gated behind add-on modules. Is there a term you are locked into. You are not looking for the cheapest tool. You are looking for a pricing shape that does not fight you as you grow.

## 5. Whose data is it

A service company builds up years of unit histories, test records, and account details inside whatever tool it uses. That data is one of your most valuable assets, and it is the thing that makes switching hard later. Before you commit, find out whether you can get it back out.

- **Export.** Can you export your accounts, buildings, units, and full service history yourself, in a standard format, without filing a support ticket and waiting.
- **Ownership.** Does the contract say the data is yours, and is your information kept separate from other companies rather than pooled into a shared library.
- **Attachments.** Do the photos, PDFs, and test packets come with the export, or only the rows in a table.

A vendor that makes export easy is telling you they expect to keep your business by being good, not by holding your records hostage. That is the answer you want.

## 6. Trade-specific or a generic tool you have to bend

This is the decision under all the others. General field service management software can be configured to almost fit an elevator company, and that word "almost" is where the pain lives. If the tool does not natively understand units and banks, Category tests, callbacks and entrapments, the maintenance control program, and mixed-manufacturer routes, then you spend your first year renaming "jobs" into something that sort of works and training every new hire around the gaps.

Trade-specific software starts from the shape of the work. It knows a route runs many brands of equipment, not one. It knows a Category 5 test is a different animal from a routine visit. It gives the office a dispatch board that speaks callbacks and entrapments, and it gives the field a way to complete test forms on the unit. You are not bending the trade to fit the tool. The tool already fits.

### A checklist to take into a demo

- Put a phone in airplane mode, complete a full ticket, and sync. Confirm nothing dropped.
- Assign a callback to the nearest available mechanic and watch it land on the field board live.
- Open one unit and pull its full service history, its Category test records, and its maintenance program in one place.
- Ask exactly how the price changes when you add a helper, a dispatcher, and an office admin.
- Ask how you export every account, unit, and service record if you leave, and in what format, and whether attachments come with it.
- Check whether the tool natively speaks units, banks, Category tests, callbacks, and entrapments, or whether you are renaming generic jobs.

## Where RiseLynk fits

We build RiseLynk against the criteria above, so it is fair to say where it lands on each one and where it does not try to be the whole answer.

The field app is **offline-first**. It keeps working in basements and machine rooms with no signal, then syncs when the phone is back online, so the airplane-mode test is one we ask you to run. The office side gives dispatch a live board by technician with real-time updates, entrapment alerting, and nearest-available-mechanic suggestion with one-tap assignment, plus an after-hours on-call pool and weekly rotation the field can vote on. RiseLynk is **OEM-agnostic**, built for mixed-manufacturer routes rather than locked to one equipment maker, because a real route rarely runs one brand.

For records, RiseLynk assembles a starting-point Maintenance Control Program for each unit from the manufacturer materials you supply, structured around ASME A17.1 and CSA B44 Section 8.6, and lets techs complete Category test forms on the unit and export a filled PDF packet from the phone. The starting point is a draft your licensed or qualified personnel review, complete, and adopt. It is not a code-compliance certification, and RiseLynk is not the inspector or the authority having jurisdiction. Your manufacturer documents stay in your own tenant, and RiseLynk never builds a shared, cross-customer library. On the data-ownership questions above, hold us to the same standard you hold everyone.

The field app, the office console, and the customer portal run on one shared system, so what a tech captures in the machine room is what dispatch, billing, and the building's own records draw from, with no re-keying between tools. And when someone has a question about a building, a unit's service history, or what is still open on the route, they can ask Lynk in plain English and get an answer from the company's own records. That is a quiet assist on top of the work, not the reason to buy the tool.

RiseLynk is not going to be the right fit for every shop, and pricing is a conversation rather than a number on a page. The honest test is the one at the top of this article: run your own day through it and see whether it holds up.

RiseLynk is a web-based app you reach in a browser and can install to a phone's home screen. The behavior described here is how the product is built; a live version runs on synthetic data so you can try each of these criteria yourself.

## Run your own day through it

Click through the field app, dispatch board, and customer portal on synthetic data, no signup. Then try the honest test: put it in airplane mode and see what holds up. [See a live demo](https://demo.app.riselynk.com) or browse the [industry resources](/resources).`,
        faqs: [
          {
            q: "What should an elevator service company look for in maintenance software?",
            a: "Test it against the work, not the sales deck. The things that matter most are whether it works offline in a machine room, whether it handles elevator dispatch, on-call, and callbacks, whether it can hold each unit's service history and a maintenance program structured around ASME A17.1 Section 8.6, how the price scales as you add the whole crew, whether you can export your own data, and whether it is built for the elevator trade rather than a generic field service tool you have to bend.",
          },
          {
            q: "Is generic field service software good enough for an elevator company?",
            a: "It can be configured to almost fit, and the pain lives in that word \"almost.\" If the tool does not natively understand units and banks, Category tests, callbacks and entrapments, the maintenance control program, and mixed-manufacturer routes, you spend a lot of time renaming generic jobs and training around the gaps. Trade-specific software starts from the shape of elevator work instead.",
          },
          {
            q: "Does elevator field software really need to work offline?",
            a: "Yes. Machine rooms, pits, and hoistways are some of the hardest places on a job to hold a cell signal, and a large share of the work happens there. Offline-first software keeps working with no signal and syncs when the phone is back online, so nothing captured in the basement has to be re-typed later. Cache-the-last-screen tools fail the moment a tech tries to save.",
          },
          {
            q: "Can maintenance software keep records for an elevator inspection?",
            a: "Software can keep a unit's service history and a maintenance program structured around ASME A17.1 Section 8.6 in one place, as a starting point your own qualified personnel review, complete, and adopt, and make those records easy to produce when someone asks. It does not make you compliant, certify anything, or guarantee a passing inspection. Your qualified personnel and the authority having jurisdiction remain responsible for that.",
          },
          {
            q: "What should I ask about data ownership before buying elevator software?",
            a: "Ask whether you can export your own accounts, buildings, units, and full service history yourself in a standard format, whether the contract says the data is yours, whether your information is kept separate from other companies rather than pooled, and whether photos, PDFs, and test packets come with the export. A vendor that makes export easy is not planning to hold your records hostage.",
          },
        ],
      },
    ],
  },

  pages: [
    // ==========================================================================
    // Home
    // ==========================================================================
    {
      slug: "",
      title: "RiseLynk: elevator service software, offline-first field app",
      description:
        "Run your whole elevator and escalator operation on one platform: an offline-first field app that works with no signal, an office console for dispatch, routes, and billing, and a no-login customer portal. One system for field and office, with nothing re-keyed between them.",
      nav: "Home",
      sections: [
        {
          type: "hero",
          // C-4: the SHIPPED hero kicker, not the spec's stale one.
          subheading: "Elevator service platform",
          heading: "Run every elevator on one system.",
          body: "The offline-first platform for elevator and escalator service companies. A field app that works with no signal, an office console for dispatch, routes, and billing, and a no-login customer portal, all on one shared record, for any OEM.",
          // Multi-CTA hero (v0.17.0): the bundle's three calls to action, mapped to the
          // real hrefs already in the config. Demo is primary; request-access (to the
          // contact page) and open-the-app are ghost, matching the bundle's button set.
          cta: [
            { label: "See a live demo", href: "https://demo.app.riselynk.com", variant: "primary" },
            { label: "Request access", href: "/contact", variant: "ghost" },
            { label: "Open the app", href: "https://app.riselynk.com", variant: "ghost" },
          ],
          // Mono proof-chip row under the CTAs (bundle .proofrow, verbatim copy).
          proof: ["Works with zero bars", "OEM-agnostic", "Live sample data, no signup"],
          // HERO-VIZ SLOT: RiseLynk's own dispatch-board + field-phone composition riding
          // the engine slot. The MARKUP is the bundle's .hero-viz inner (.viz-stage) verbatim.
          // The engine frames the slot (aria-hidden, two-column split) but by design does not
          // style a site's art, and the theme layer emits its tokens as --rl-*, so the leading
          // <style> is self-contained: it (a) shims the bundle token names the markup references
          // onto the emitted --rl-* tokens (with a literal light-theme fallback so it never leaks
          // an undefined var), and (b) carries the composition's own rules, all scoped under
          // .hero__viz. Because the shims resolve to --rl-* the board themes correctly in light
          // AND dark; the field phone stays a fixed dark surface in both, as in the bundle.
          heroViz: `<style>
.hero__viz{--card:var(--rl-card,#fff);--card2:var(--rl-card2,#f0f3ee);--line:var(--rl-line,#e4e7e1);--line2:var(--rl-line2,#d3d9d1);--ink:var(--rl-ink,#0e1f19);--dim:var(--rl-dim,#46554e);--faint:var(--rl-faint,#5f6d66);--green:var(--rl-green,#0c6b52);--bg2:var(--rl-bg2,#f3f5f0);--shadow-lg:var(--rl-shadow-lg,0 24px 56px -18px rgba(14,31,25,.20));--r-md:13px;--r-sm:9px;--st-amber-ink:var(--rl-status-amber-ink,#6b5a2c);--st-amber-bg:var(--rl-status-amber-bg,#f6ecd4);--st-blue-ink:var(--rl-status-blue-ink,#33486f);--st-blue-bg:var(--rl-status-blue-bg,#e5ebf7);--st-green-ink:var(--rl-status-green-ink,#2c5d49);--st-green-bg:var(--rl-status-green-bg,#dff0e7);--st-red-ink:var(--rl-status-red-ink,#6b3333);--st-red-bg:var(--rl-status-red-bg,#f7e3e3)}
.hero__viz .viz-stage{position:relative}
.hero__viz .board{background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);box-shadow:var(--shadow-lg);overflow:hidden}
.hero__viz .bd-top{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line)}
.hero__viz .bd-top .dot{width:8px;height:8px;border-radius:50%;background:var(--line2);flex:none}
.hero__viz .bd-top .ttl{font-family:var(--font-mono);font-size:11px;color:var(--faint);margin-left:4px}
.hero__viz .bd-top .live{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--st-green-ink);background:var(--st-green-bg);padding:3px 8px;border-radius:999px}
.hero__viz .bd-cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:14px;background:var(--bg2)}
.hero__viz .bd-col h4{font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--faint);margin:2px 0 8px}
.hero__viz .job{background:var(--card);border:1px solid var(--line);border-radius:var(--r-sm);padding:10px 11px}
.hero__viz .job+.job{margin-top:8px}
.hero__viz .job .un{display:flex;justify-content:space-between;align-items:center;font-family:var(--font-mono);font-size:11px;color:var(--green)}
.hero__viz .job .nm{font-size:12.5px;font-weight:600;color:var(--ink);margin:3px 0 5px}
.hero__viz .stc{display:inline-block;font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:999px;white-space:nowrap}
.hero__viz .stc.amber{color:var(--st-amber-ink);background:var(--st-amber-bg)}
.hero__viz .stc.blue{color:var(--st-blue-ink);background:var(--st-blue-bg)}
.hero__viz .stc.ok{color:var(--st-green-ink);background:var(--st-green-bg)}
.hero__viz .stc.red{color:var(--st-red-ink);background:var(--st-red-bg)}
.hero__viz .job .av{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:700;flex:none}
.hero__viz .fone{position:absolute;left:-26px;bottom:-26px;width:172px;border-radius:var(--r-md);padding:12px 13px;background:#10201a;border:1px solid #24443a;box-shadow:0 18px 36px -12px rgba(10,25,20,.45)}
.hero__viz .fone .fh{font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:#7fc9ab;margin-bottom:8px}
.hero__viz .fone .f1{font-size:12.5px;font-weight:600;color:#e9f2ed;margin-bottom:3px}
.hero__viz .fone .f2{font-size:11px;color:#93a89d;margin-bottom:9px}
.hero__viz .fone .fs{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:#06231c;background:#5dcaa5;padding:3px 8px;border-radius:999px}
.hero__viz .fone .fs i{width:5px;height:5px;border-radius:50%;background:#06231c;opacity:.7;animation:rlVizPulse 2.4s ease-out infinite}
@keyframes rlVizPulse{0%{box-shadow:0 0 0 0 rgba(6,35,28,.4)}70%,100%{box-shadow:0 0 0 6px rgba(6,35,28,0)}}
@media (prefers-reduced-motion:reduce){.hero__viz .fone .fs i{animation:none}}
</style>
<div class="viz-stage" id="vizStage">
  <div class="board">
    <div class="bd-top">
      <span class="dot"></span><span class="dot"></span>
      <span class="ttl">Dispatch, Tuesday Jul 14</span>
      <span class="live">LIVE</span>
    </div>
    <div class="bd-cols">
      <div class="bd-col">
        <h4>UNSCHEDULED</h4>
        <div class="job"><div class="un">MR-2041</div><div class="nm">Harborview Tower</div><span class="stc amber">Cat 1 due</span></div>
        <div class="job"><div class="un">ES-114</div><div class="nm">Pike St Garage</div><span class="stc" style="color:var(--faint);background:var(--card2)">Quarterly</span></div>
      </div>
      <div class="bd-col">
        <h4>EN ROUTE</h4>
        <div class="job"><div class="un">MR-0977<span class="av" style="color:var(--st-green-ink);background:var(--st-green-bg)">DK</span></div><div class="nm">Cascade Medical</div><span class="stc blue">ETA 22 min</span></div>
        <div class="job"><div class="un">MR-3302<span class="av" style="color:var(--st-blue-ink);background:var(--st-blue-bg)">JT</span></div><div class="nm">Meridian Lofts</div><span class="stc blue">ETA 40 min</span></div>
      </div>
      <div class="bd-col">
        <h4>ON SITE</h4>
        <div class="job"><div class="un">MR-1180<span class="av" style="color:var(--st-amber-ink);background:var(--st-amber-bg)">RM</span></div><div class="nm">Union Square 12</div><span class="stc ok">Checklist 6/9</span></div>
        <div class="job"><div class="un">MR-2210</div><div class="nm">Federal Center</div><span class="stc red">Trouble call</span></div>
      </div>
    </div>
  </div>
  <div class="fone">
    <div class="fh">RISELYNK FIELD</div>
    <div class="f1">3 visits queued</div>
    <div class="f2">Machine room, B3</div>
    <span class="fs"><i></i>Synced offline</span>
  </div>
</div>`,
        },
        {
          // The #see-it scroll story, including the portal-ad video payoff.
          // pinned:false (v0.17.0): the calm stacked step timeline, no scroll pin or
          // hijack. Every scene caption and the portal-ad video payoff are kept.
          type: "scrollNarrative",
          pinned: false,
          subheading: "See it in action",
          heading: "From the QR at the front desk to a dispatched tech, in one scan",
          scenes: [
            {
              label: "STEP 01 · SCAN",
              caption: "A building manager scans the code at the front desk,",
            },
            {
              label: "STEP 02 · REPORT",
              caption: "reports the problem,",
            },
            {
              label: "STEP 03 · DISPATCH",
              caption: "and messages the mechanic,",
            },
            {
              label: "STEP 04 · IN THE FIELD",
              caption: "with no login and no call center.",
            },
            {
              label: "THE REAL THING",
              caption: "RiseLynk customer portal: scan, report, message a tech.",
              video: {
                src: "/media/portal-ad.mp4",
                poster: "/media/portal-ad-poster.jpg",
                label: "RiseLynk customer portal: scan, report, message a tech",
              },
            },
          ],
        },
        {
          // The feature grid, ported as services (each item also becomes a
          // Service node in the @graph). The two SOON features keep their
          // planned / in-development hedges in title and body; never shipped-as.
          type: "services",
          heading: "One platform, end to end",
          body: "From the dispatch board to the customer's inbox: record keeping, scheduling, billing, and sales in a single system that your field and office share.",
          items: [
            {
              title: "Offline-first field app",
              body: "A mobile PWA for tickets, route work, time, materials, photos, and Category test forms, fully usable with no signal, syncing automatically when it returns.",
              // Mini-viz (bundle .mini-sync): the sync-line proof. Self-contained styles
              // scoped under the engine's .card__viz frame, tokens shimmed onto --rl-*.
              viz: `<style>
.card__viz{--line:var(--rl-line,#e4e7e1);--bg2:var(--rl-bg2,#f3f5f0);--green:var(--rl-green,#0c6b52)}
.card__viz .mini{border-radius:12px;border:1px solid var(--line);background:var(--bg2);padding:12px}
.card__viz .mini-sync{display:flex;flex-direction:column;gap:7px}
.card__viz .mini-sync .ln{display:block;height:7px;border-radius:5px;background:var(--line);position:relative;overflow:hidden}
.card__viz .mini-sync .ln:after{content:"";position:absolute;inset:0;border-radius:inherit;transform:translateX(-101%);background:linear-gradient(90deg,transparent,var(--green));opacity:.65;animation:rlSyncFill 3.4s cubic-bezier(.2,.8,.25,1) infinite}
.card__viz .mini-sync .ln:nth-of-type(2):after{animation-delay:.5s}
.card__viz .mini-sync .ln:nth-of-type(3):after{animation-delay:1s}
.card__viz .mini-sync .st{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.5px;color:var(--green)}
.card__viz .mini-sync .st i{width:6px;height:6px;border-radius:50%;background:var(--green);animation:rlSyncDot 2.4s ease-out infinite}
@keyframes rlSyncFill{0%{transform:translateX(-101%)}55%,100%{transform:translateX(0)}}
@keyframes rlSyncDot{0%{box-shadow:0 0 0 0 rgba(12,107,82,.4)}70%,100%{box-shadow:0 0 0 6px rgba(12,107,82,0)}}
@media (prefers-reduced-motion:reduce){.card__viz .mini-sync .ln:after,.card__viz .mini-sync .st i{animation:none}}
</style>
<div class="mini mini-sync"><span class="st"><i></i>SYNCING 3 CHANGES</span><span class="ln"></span><span class="ln"></span><span class="ln"></span></div>`,
            },
            {
              title: "Dispatch & routes",
              body: "Live dispatch board, entrapment alerts, and schedule-aware route building that re-optimizes a day by proximity in one tap.",
            },
            {
              title: "Proposals & sales CRM",
              body: "Turn a mechanic's on-site recommendation into a proposal, then through a pipeline to sent and accepted work, with no re-entry between field and office.",
            },
            {
              title: "Inventory & purchasing",
              body: "Warehouse and van stock with stock levels, vendors, and purchase orders. Field part requests flow straight to the office.",
            },
            {
              title: "Billing & payroll",
              body: "Contracts, invoicing, and an IUEC-aware payroll register, with per-account labor cost, tax rates, and account margin.",
            },
            {
              title: "Customer portal",
              body: "A no-login portal where building managers report a problem and see their service history, no call center, no phone tag.",
            },
            {
              title: "Lynk AI assistant",
              body: "Ask plain-English questions about your accounts, units, and open work, answered from your own data, across field and office.",
              // Mini-viz (bundle .mini-chat): the plain-English ask/answer proof. Self-
              // contained styles scoped under the engine's .card__viz frame.
              viz: `<style>
.card__viz{--line:var(--rl-line,#e4e7e1);--bg2:var(--rl-bg2,#f3f5f0);--card:var(--rl-card,#fff);--dim:var(--rl-dim,#46554e);--st-green-ink:var(--rl-status-green-ink,#2c5d49);--st-green-bg:var(--rl-status-green-bg,#dff0e7)}
.card__viz .mini{border-radius:12px;border:1px solid var(--line);background:var(--bg2);padding:12px}
.card__viz .mini-chat{display:flex;flex-direction:column;gap:6px;max-width:210px}
.card__viz .mini-chat .bub{max-width:92%;padding:6px 9px;border-radius:10px;font-size:9.5px;line-height:1.35;color:var(--dim);background:var(--card);border:1px solid var(--line);border-bottom-left-radius:4px}
.card__viz .mini-chat .bub.me{align-self:flex-end;color:var(--st-green-ink);background:var(--st-green-bg);border-color:transparent;border-bottom-left-radius:10px;border-bottom-right-radius:4px}
</style>
<div class="mini mini-chat"><span class="bub me">Which units are due for a Cat 1?</span><span class="bub">3 at Harborline Plaza. Want the list?</span></div>`,
            },
            {
              // Flagship: the MCP card spans the full grid row with an accent left edge.
              title: "Maintenance Control Programs",
              body: "RiseLynk assembles a starting-point MCP for each unit from the manufacturer materials you supply, structured around ASME A17.1 / CSA B44 Section 8.6 and the minimum-task floor for that equipment class. Your own qualified personnel review, complete, and adopt it. It is a starting point, not a code-compliance certification.",
              flagship: true,
            },
            {
              // Badge names a planned capability (never-as-shipped). The "(planned)"
              // suffix stays in the title, per the copy discipline already in the config.
              title: "State-record reconciliation (planned)",
              body: "Planned: compare your units against state inspection records and flag differences for your office to review.",
              badge: "Planned",
            },
            {
              title: "TachLynk telemetry (in development)",
              body: "In development: a sensor that feeds run-time data into Lynk.",
              badge: "In development",
            },
          ],
        },
        {
          // #edges, ported as the answer-first summary block.
          type: "summary",
          heading: "Where we're different",
          summaryLabel: "Why RiseLynk",
          body: "The things the big platforms can't or won't do.",
          ordered: false,
          points: [
            "Offline-first: the job doesn't stop when the signal does. The field app keeps working in basements and machine rooms with no signal, then syncs when the phone is back online.",
            "OEM-agnostic: built for mixed-OEM routes. Not locked to one manufacturer's equipment.",
            "One shared system: field, office, and customers in the same platform, no re-keying between tools.",
            "Customer portal: building managers report a trouble call and check service history from the QR code at the front desk. No login, no phone tag.",
          ],
        },
        {
          // FAQ, VERBATIM from the bundle; the FAQPage JSON-LD mirrors it by
          // construction (same array).
          type: "faq",
          heading: "Common questions",
          body: "Straight answers, no sales spin.",
          faqs: [
            {
              q: "Does RiseLynk work with no signal?",
              a: "Yes. The field app is offline-first, so it keeps working in basements and machine rooms with no signal, then syncs when the phone is back online.",
            },
            {
              q: "Is RiseLynk locked to one elevator manufacturer?",
              a: "No. RiseLynk is OEM-agnostic and built for mixed-manufacturer routes, not locked to one equipment maker.",
            },
            {
              q: "What is included in RiseLynk?",
              a: "Three environments on one shared system, the field app, the office console, and the customer portal, plus the Lynk AI assistant, with no re-keying between tools.",
            },
            {
              q: "How do building customers reach RiseLynk?",
              a: "Through a no-login QR code at the front desk. A building manager can report a trouble call and see their equipment's service status and history, with an entrapment fast-path to the branch phone.",
            },
            {
              q: "Does RiseLynk help with my Maintenance Control Program?",
              a: "Yes. For each unit, RiseLynk assembles a starting-point MCP from the manufacturer materials you supply, structured around ASME A17.1 / CSA B44 Section 8.6 and the minimum-task floor for that equipment class. Your own qualified personnel review, complete, and adopt it. The draft is a starting point, not a code-compliance certification. RiseLynk is not the inspector or the authority having jurisdiction.",
            },
            {
              q: "Can I try RiseLynk before buying?",
              a: "Yes. A live demo runs on synthetic data at demo.app.riselynk.com, no signup.",
            },
          ],
        },
        {
          // The final CTA, on the DUSK band (v0.17.0): the dark-in-both-themes closing
          // surface that carries the page down into the machine room, derived from the two
          // brand colors. The CTABanner is single-button; the bundle's extra links live in
          // the footer utility row now.
          type: "cta",
          dusk: true,
          heading: "Ready to run your branch on RiseLynk?",
          body: "Tell us about your operation and we'll get you set up, or take the live demo for a spin first.",
          ctaLabel: "Contact us",
          ctaHref: "/contact",
        },
        {
          // The request-access lead intake, MODAL variant (v0.17.0): a trigger button that
          // opens a focus-trapped modal once JS mounts, and the SAME rich form server-rendered
          // inline (method=post, /api/lead) so a no-JS visitor still POSTs a lead through the
          // save-first intake. Rich declarative fields harvested from the bundle #suScrim.
          // Field folding (lib/contact-intake.mjs): company/name/email/phone/units map straight
          // to intake columns; state/seats/equipment/notes fold into the message body with their
          // labels, so no structured extra is dropped. Confetti fires on success.
          type: "leadform",
          modal: true,
          modalTriggerLabel: "Request access",
          heading: "Request access",
          body: "Tell us about your operation and we'll get you set up.",
          formFields: [
            { name: "company", label: "Company name", type: "text", required: true, autoComplete: "organization" },
            { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
            { name: "email", label: "Work email", type: "email", required: true, autoComplete: "email" },
            { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
            { name: "state", label: "State", type: "text" },
            { name: "units", label: "Units (elevators / escalators)", type: "number" },
            { name: "seats", label: "Seats (office + field logins)", type: "number" },
            {
              name: "equipment",
              label: "Equipment types",
              type: "checkbox-group",
              full: true,
              options: ["Traction", "Hydraulic", "Roped hydraulic", "Escalator", "Moving walk", "Other"],
            },
            {
              name: "notes",
              label: "Anything else",
              type: "textarea",
              full: true,
              placeholder: "Routes, current software, timeline, questions.",
            },
          ],
          celebrate: "confetti",
          submitLabel: "Request access",
          successMessage:
            "Request received. We'll be in touch to get your account set up. A real person reads every request and replies.",
        },
      ],
    },

    // ==========================================================================
    // Pricing
    // ==========================================================================
    {
      slug: "pricing",
      title: "RiseLynk pricing: simple per-seat plans for elevator service companies",
      description:
        "Simple per-seat pricing for RiseLynk. Standard from $49 per seat, Pro from $79 per seat, and custom Enterprise, with a small monthly minimum and annual prepay that cuts setup in half. Introductory pricing, subject to change and confirmed in a signed agreement.",
      nav: "Pricing",
      sections: [
        {
          type: "pricing",
          subheading: "Pricing",
          heading: "Simple per-seat pricing, built for a service shop.",
          body: "One flat platform fee for each licensed employee, field and office. No per-app charges. Pay monthly, or save about two months with annual billing, which also cuts the one-time setup fee in half.",
          // The ONE sanctioned gradient-text flourish: the highlighted (Pro) tier's price
          // renders with a brand-derived gradient clip; every other price stays solid.
          gradientPrice: true,
          tiers: [
            {
              name: "Standard",
              price: "From $49",
              period: "/ seat / mo",
              priceValue: 49,
              meta: "$350 per month minimum, plus a one-time $2,500 setup fee, half off on annual prepay.",
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
              price: "From $79",
              period: "/ seat / mo",
              priceValue: 79,
              meta: "$600 per month minimum, plus a one-time $5,000 setup fee, half off on annual prepay.",
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
              // The hot plan: the gradient price is the one sanctioned gradient-
              // text flourish, keyed off this flag.
              highlighted: true,
              badge: "Recommended",
            },
            {
              name: "Enterprise",
              price: "Custom",
              meta: "Typically $10,000 to $25,000 for a scoped implementation, quoted for your operation.",
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
          type: "about",
          heading: "Please note",
          body: "These are current introductory rates, shown to help you plan, and they are subject to change. Your final pricing is set and locked in a signed service agreement, not on this page.",
        },
        {
          type: "about",
          heading: "Billed per licensed seat, field and office.",
          body: "A tenant pays the greater of its seat count times the per-seat rate, or the plan minimum, so a small crew still pays a fair flat rate. AI usage is billed separately, metered, and priced at cost.\n\nAnnual prepay: about two months free, and the one-time setup fee cut in half.",
        },
        {
          type: "about",
          heading: "Add-ons and early-adopter terms",
          body: "Optional add-ons, like a managed marketing website and an SEO article service, are available on top of any plan. If you're one of the first service companies to come on, ask about early-adopter terms. Talk to us through the contact page and we'll put together a quote for your operation.",
        },
        {
          type: "faq",
          heading: "Pricing questions",
          body: "Straight answers, no sales spin.",
          faqs: [
            {
              q: "How does per-seat pricing work?",
              a: "You pay one flat rate for each licensed employee who signs in, field and office. There are no separate charges per app. Each tenant pays the greater of its seat count times the per-seat rate, or the plan minimum, so a small crew pays a fair flat rate rather than almost nothing.",
            },
            {
              q: "What is the monthly minimum for?",
              a: "The minimum keeps very small shops on a fair flat rate. Standard starts at a $350 per month minimum and Pro at $600 per month. Once your seat count times the per-seat rate is above the minimum, you simply pay for seats.",
            },
            {
              q: "Can I pay annually?",
              a: "Yes. Annual prepay saves you about two months compared with paying monthly, and it cuts the one-time setup fee in half.",
            },
            {
              q: "Is this price final?",
              a: "No. The rates on this page are current introductory pricing, shown to help you plan, and they are subject to change. Your final pricing is set and locked in a signed service agreement, so you know the exact numbers before you commit.",
            },
            {
              q: "How do I get started?",
              a: "Try the live demo on synthetic data at demo.app.riselynk.com, no signup. When you're ready, request access and a real person will get you set up and confirm a quote for your operation.",
            },
          ],
        },
        {
          type: "cta",
          heading: "See it live, then talk to us",
          body: "Click through the field app, the dispatch board, and the customer portal yourself, then tell us about your operation and we'll put together a quote. Introductory pricing, subject to change. Final pricing is confirmed in a signed agreement.",
          ctaLabel: "See a live demo",
          ctaHref: "https://demo.app.riselynk.com",
        },
      ],
    },

    // ==========================================================================
    // Resources
    // ==========================================================================
    {
      slug: "resources",
      title: "US elevator industry resources: codes, authorities, training",
      description:
        "Curated links to the US elevator industry: state safety authorities, the ASME A17.1 code, QEI inspector certification, the IUEC and NEIEP, and the trade associations. Every link goes to the organization's own official site.",
      nav: "Resources",
      sections: [
        {
          type: "about",
          subheading: "Industry resources",
          heading: "The codes, authorities, and training behind every elevator job.",
          body: "Quick links to the people who write the codes, regulate the work, and train the trade, focused on the US. Every link goes to the organization's own official site. No logins, no middleman.\n\nFind your code and authority: US elevator safety is regulated state by state. Your state (or city) adopts an edition of ASME A17.1 and runs its own permits, licensing, and inspections. Start with your state's elevator program below. RiseLynk is built around Washington's L&I program as the worked example.",
        },
        {
          type: "records",
          heading: "Safety & regulatory authorities",
          records: {
            enabled: true,
            intro: "Permits, licensing, inspections, and the code your state has adopted. There are 50 different answers; these are some of the largest programs to get you started.",
            items: [
              {
                title: "Washington, L&I Elevator Program",
                body: "Permits, mechanic and company licensing, inspections, and Maintenance Control Program rules for 22,000+ conveyances. RiseLynk's home program. Program: lni.wa.gov/licensing-permits/elevators. Conveyance lookup: secure.lni.wa.gov/elevatorlookup.",
              },
              {
                title: "California, Cal/OSHA Elevator Unit",
                body: "DOSH inspects and enforces code compliance for conveyances statewide, with regional offices for permits and operating permits. Program: dir.ca.gov/dosh/Elevator.html.",
              },
              {
                title: "New York City, DOB Elevators",
                body: "NYC Department of Buildings: twice-yearly inspection/test filing through DOB NOW, device permits, and compliance rules. Program: nyc.gov/site/buildings/safety/elevator.page.",
              },
              {
                title: "Texas, TDLR Elevators & Escalators",
                body: "Department of Licensing & Regulation: contractor and inspector licensing, registration, forms, and the advisory board. Program: tdlr.texas.gov/elevator.",
              },
              {
                title: "Florida, DBPR Bureau of Elevator Safety",
                body: "Licensing, permitting, and inspection of conveyances statewide, under the Division of Hotels & Restaurants. Program: www2.myfloridalicense.com/elevator-safety.",
              },
              {
                title: "Don't see your state?",
                body: "Almost every state (and some cities) runs its own elevator program. Search \"your state elevator program\", or use the NAESA inspector side below at naesai.org. Know one we should add? Tell us at hello@riselynk.com.",
              },
            ],
          },
        },
        {
          type: "records",
          heading: "Inspectors & codes",
          records: {
            enabled: true,
            intro: "The safety code itself, and the body that certifies the inspectors who enforce it.",
            items: [
              {
                title: "ASME A17.1 / A17.3",
                body: "The Safety Code for Elevators and Escalators, the standard your state adopts (often a specific edition). Includes A17.2 inspectors' manual. On the web: asme.org/codes-standards.",
              },
              {
                title: "NAESA International",
                body: "The National Association of Elevator Safety Authorities, QEI inspector certification, training, and the regulator community. On the web: naesai.org.",
              },
              {
                title: "CSA Group, B44",
                body: "The Canadian counterpart to A17.1, harmonized with it, a useful reference for cross-border crews and shared design requirements. On the web: csagroup.org.",
              },
            ],
          },
        },
        {
          type: "records",
          heading: "Union & training",
          records: {
            enabled: true,
            intro: "The trade union and its apprenticeship and continuing-education program.",
            items: [
              {
                title: "IUEC",
                body: "International Union of Elevator Constructors, the trade union representing elevator mechanics across the US and Canada. On the web: iuec.org.",
              },
              {
                title: "IUEC Safety Alerts",
                body: "Field safety alerts organized by topic, incident-driven warnings worth a read before the job, not after. On the web: iuec.org/index.php/safety-alerts-by-topic.",
              },
              {
                title: "NEIEP",
                body: "National Elevator Industry Educational Program, the apprenticeship and continuing-education program for the trade. On the web: neiep.org.",
              },
            ],
          },
        },
        {
          type: "records",
          heading: "Industry associations & news",
          records: {
            enabled: true,
            intro: "Contractor and manufacturer associations, plus the trade press.",
            items: [
              {
                title: "NAEC",
                body: "National Association of Elevator Contractors, education (CET®/CAT®), the annual convention, and the contractor community. On the web: naec.org.",
              },
              {
                title: "NEII",
                body: "National Elevator Industry, Inc., the manufacturers and major service companies; codes advocacy and industry standards. On the web: nationalelevatorindustry.org.",
              },
              {
                title: "Elevator World",
                body: "The trade's magazine of record since 1953, with industry news, technical articles, and a searchable archive. On the web: elevatorworld.com.",
              },
            ],
          },
        },
        {
          type: "cta",
          heading: "Built for the trade, offline-first.",
          // B-2 precision fix applied: "live sample data" (was "real sample data").
          body: "RiseLynk keeps your tickets, tests, and routes working in the hoistway, then syncs the moment you have signal. See it on live sample data.",
          ctaLabel: "See a live demo",
          ctaHref: "https://demo.app.riselynk.com",
        },
      ],
    },

    // ==========================================================================
    // Contact
    // ==========================================================================
    {
      slug: "contact",
      title: "Contact RiseLynk: elevator maintenance software demo and access",
      description:
        "Tell us about your elevator service operation and we will set you up on RiseLynk, the offline-first platform for field, office, and customer portal. A real person reads every message. Prefer to look first? The live demo runs on sample data, no signup.",
      nav: "Contact",
      sections: [
        {
          type: "contact",
          heading: "Let's get your branch running on RiseLynk.",
          body: "Tell us about your operation, roughly how many units you maintain, the OEMs on your routes, and how your office runs today, and we'll set you up. Prefer to look first? The live demo runs on sample data, no signup.",
        },
        {
          type: "about",
          heading: "What happens next",
          body: "A real person reads it and replies personally. No call center, no drip sequence.\n\nWe reply by email by default. Prefer a call back or a text? Say so in your message and leave a number.\n\nPrefer email? Write to hello@riselynk.com.\n\nWant to see it first? Open the live demo at demo.app.riselynk.com.\n\nAlready a customer? Sign in at app.riselynk.com.",
        },
      ],
    },

    // ==========================================================================
    // Legal: Privacy Policy (ported verbatim as body copy)
    // ==========================================================================
    {
      slug: "privacy",
      title: "RiseLynk Privacy Policy",
      description: "RiseLynk Privacy Policy.",
      sections: [
        {
          type: "about",
          heading: "RiseLynk Privacy Policy",
          body: "Effective date: June 25, 2026. Last updated: June 25, 2026.\n\nJurisdiction: United States federal law and Washington State, with additional coverage written in for California (CCPA/CPRA) and for the EU and UK (GDPR and UK GDPR) because RiseLynk may serve data subjects in those regions. A data subject's own location may bring a different state or country law into play.",
        },
        {
          type: "summary",
          heading: "Your data in plain English",
          summaryLabel: "Your data in plain English",
          ordered: false,
          points: [
            "Your records are yours. We never sell your data, and we do not run advertising or analytics trackers.",
            "If you are a service company, everything in your workspace is yours. We only process it on your instructions, as your data processor.",
            "Lynk, our assistant, works only on your own records. We use paid, commercial AI provider tiers. Where a provider offers the setting, we configure it so your data is not used to train their models. Providers may retain limited data briefly for security and legal compliance.",
            "We use only the cookies needed to sign you in and run the site, plus Stripe at checkout.",
            "Questions, or want to exercise a privacy right? Email privacy@riselynk.com. The full detail is below.",
          ],
        },
        {
          type: "about",
          heading: "1. Who we are",
          body: "RiseLynk is a business-to-business software platform for elevator and escalator service companies. RiseLynk is operated by Maxwell Industries LLC (\"RiseLynk\", \"we\", \"us\", or \"our\"), a Washington limited liability company.\n\nPostal address: 2775 Southeast Berger Lane, Port Orchard, WA 98366, USA.\n\nGeneral contact: hello@riselynk.com.\n\nPrivacy contact: privacy@riselynk.com.\n\nThis policy explains what personal data we handle, why, on what legal basis, who we share it with, and the rights you have. It covers all of our surfaces:\n\nthe public marketing website at riselynk.com and the newsletter;\n\nthe offline-first field application used by technicians;\n\nthe office console used for dispatch, routes, billing, and payroll;\n\nthe no-login customer portal that building and property managers reach from a QR code at the front desk;\n\nLynk, our in-app AI assistant, which appears across these surfaces.",
        },
        {
          type: "about",
          heading: "1.1 The two roles we play: controller and processor",
          body: "How we handle your data, and who you contact about it, depends on which surface the data came from. This is the single most important thing to understand in this policy.\n\nWhen we act as a processor (the service company is the controller). For all data inside a customer's RiseLynk workspace, the elevator or escalator service company that subscribes to RiseLynk is the data controller, and we act as its data processor. This includes data about that company's own staff (technicians and office users) and data about that company's building and property-manager customers. The service company decides why and how that data is used. We process it on the service company's documented instructions, under a Data Processing Addendum (the \"DPA\"). If you are a technician, an office user, or a building or property manager and you want to exercise a privacy right over data inside a service company's workspace, your request normally goes to that service company as the controller. We will help the controller respond, and we will tell you who the controller is if you ask. See section 9.\n\nWhen we act as a controller. For the public marketing website, the newsletter, and general inquiries sent to us, RiseLynk (Maxwell Industries LLC) is the data controller. We decide why and how that data is used, and you can exercise your rights with us directly at privacy@riselynk.com.",
        },
        {
          type: "about",
          heading: "2. The data we collect, by who you are",
          body: "We collect different categories of personal data depending on how you interact with RiseLynk. The role next to each group tells you whether we hold that data as a processor (on behalf of a service company) or as a controller (on our own behalf).\n\n2.1 Service-company staff: technicians and office users (we are the processor). When a service company sets up accounts for its staff, the workspace may contain: account and identity data: name, work email, phone number, and address; routing addresses: the home and site addresses used to plan and follow routes while a technician is on duty (the app uses stored addresses, not live device GPS); employment and payroll data: pay rate, time entries, and payroll records; HR requests submitted through the app; work product: assigned tickets, photos, measurements, and field notes. The service company decides what staff data to enter and why. We process it to provide the platform to that company.\n\n2.2 Building and property managers using the no-login customer portal (we are the processor). A building or property manager reaches the portal by scanning a QR code or opening a link tied to a specific building. There is no login for this portal. The link scopes the user to their own building only. Through it we may handle: trouble reports they submit; their name and contact details (email and phone); service history they are allowed to view for their building; messages exchanged with the assigned technician. Account and billing tools, where they exist, sit behind a separate login and are not part of the no-login portal.\n\n2.3 Newsletter subscribers (we are the controller). If you subscribe to the RiseLynk newsletter, we collect your email address. The newsletter uses double opt-in, which means you confirm your subscription before we send you anything. Every newsletter includes an unsubscribe link.\n\n2.4 Website visitors (we are the controller). When you visit riselynk.com, our hosting and infrastructure providers process standard server and log data, such as IP address, browser type, pages requested, and timestamps. This is used to operate, secure, and troubleshoot the site. The site currently sets only strictly necessary authentication and session cookies, and there is no third-party advertising or analytics tracking. See the cookie section (section 12).\n\n2.5 Data you give Lynk, our AI assistant (role depends on the surface). Lynk is an assistive feature, not a person, and not a decision-maker. When you ask Lynk a question, your prompt and the relevant records from your workspace are sent to a third-party AI model so the model can answer, grounded in your own data. The role we play for that data follows the surface it came from: inside a service company's workspace we are the processor, and on our own surfaces we are the controller. See section 4 for how the AI providers handle this and section 6 for who they are.",
        },
        {
          type: "about",
          heading: "3. How and why we use personal data",
          body: "As a processor, we use the data in a customer workspace only to provide the platform to that customer and on that customer's instructions, including: running the field, office, and portal surfaces and keeping them in sync; planning and following service routes; creating and tracking tickets, callbacks, and service history; supporting dispatch, billing, and payroll for the service company; enabling messages between building managers and technicians; sending operational notifications, including after-hours on-call callouts; answering questions through Lynk, grounded in the workspace's own records; securing the platform, preventing abuse, and meeting legal obligations.\n\nAs a controller, we use data to: operate, secure, and improve the marketing website; send the newsletter to subscribers who opted in, and let them unsubscribe; respond to inquiries you send us; keep records we are required by law to keep.\n\nWe do not sell personal data, and we do not share personal data for cross-context behavioral advertising. See section 9 for how this maps to the \"do not sell or share\" right under California law.",
        },
        {
          type: "about",
          heading: "4. Lynk and the AI providers",
          body: "Lynk answers questions using your own records, not a generic public chatbot. To do this, your prompt and the relevant records are sent to a third-party AI model provider: the field surface uses Google (Gemini) as the AI model; the office and customer surfaces use Anthropic (Claude) as the AI model.\n\nThese providers process the data only to return an answer to Lynk. We use each provider's commercial tier. Where the provider offers the setting, we configure it so your data is not used to train their general models. Providers may retain limited data briefly for security and legal compliance. The training and retention terms for each provider are summarized in our subprocessor list, which we keep current.\n\nLynk is assistive only. The platform follows an \"agent proposes, office disposes\" rule: Lynk can suggest, draft, or surface information, but a human finalizes any action. Lynk is not for emergencies. In an emergency, contact emergency services and the responsible service company directly.\n\nA note on RAG embeddings: our platform lists an embeddings provider (Voyage AI) for an optional retrieval feature. That feature is currently dormant. No corpus is loaded and no data flows to that provider today. It is listed in the DPA for transparency in case it is activated later.",
        },
        {
          type: "about",
          heading: "5. Legal bases for processing (GDPR and UK GDPR)",
          body: "Where the GDPR or UK GDPR applies, we and our customer controllers rely on the following legal bases. Where RiseLynk is the processor, the customer controller is responsible for the legal basis for processing staff and building-manager data; we process on its instructions.\n\nContract (Art. 6(1)(b)). To provide the platform to the service company and to its authorized users, and to deliver a service you requested.\n\nLegitimate interests (Art. 6(1)(f)). To secure the platform, prevent abuse, troubleshoot, and operate and improve our marketing website. Where we rely on legitimate interests as a controller, we balance them against your rights, and you can object (see section 9).\n\nConsent (Art. 6(1)(a)). For the newsletter (double opt-in), and for any non-essential processing that asks for your consent. You can withdraw consent at any time without affecting processing done before you withdrew it.\n\nLegal obligation (Art. 6(1)(c)). To keep records and meet obligations the law places on us.\n\nEmployment, payroll, and any special-category data are handled by the service company as controller, under the legal bases that apply to that company.",
        },
        {
          type: "about",
          heading: "6. Sharing and subprocessors",
          body: "We share personal data only as needed to run the platform, and with service providers who process data on our behalf under contract. We use the following categories of subprocessors:\n\nSupabase for the primary database, authentication, and file storage.\n\nVercel for web application hosting and content delivery.\n\nStripe for payment processing (see section 7).\n\nGoogle (Gemini) as the Lynk AI model for the field surface.\n\nAnthropic (Claude) as the Lynk AI model for the office and customer surfaces.\n\nTwilio for after-hours on-call voice and SMS callouts.\n\nBrowser Web Push (VAPID) to deliver notifications.\n\nVoyage AI for AI embeddings. This is listed but currently dormant; no data flows to it today.\n\nThe full, current subprocessor list, including the purpose and location of each, is maintained in the RiseLynk Data Processing Addendum (the \"DPA\"). The DPA is the source of truth for subprocessors and is updated when the list changes. To request the current DPA and subprocessor list, contact hello@riselynk.com.\n\nWe may also disclose personal data when the law requires it, to respond to lawful requests by public authorities, to protect our rights and safety or those of others, or in connection with a business transfer such as a merger or sale, in which case we will require the recipient to honor this policy or notify affected users.",
        },
        {
          type: "about",
          heading: "7. Payments and Stripe",
          body: "Payments are processed by Stripe. RiseLynk does not store full card numbers. Card data is collected and processed by Stripe under its own terms and privacy policy. Our card-data scope is limited (it is in the range of a Stripe-hosted, SAQ-A style integration), which means cardholder data is handled by Stripe and not on our systems. Stripe may set cookies during checkout.",
        },
        {
          type: "about",
          heading: "8. International data transfers and data residency",
          body: "RiseLynk serves customers in the United States and may serve customers in the EU and UK. Personal data may be processed in, or transferred to, countries other than the one you live in, including the United States.\n\nPer-tenant data residency. RiseLynk runs one separate database project per customer (tenant). The region of each customer's database project can be set to match that customer, so a customer in the EU can have its project hosted in an EU region. The customer controller chooses its region.\n\nTransfer safeguards. Where personal data protected by the GDPR or UK GDPR is transferred to a country that has not been recognized as providing an adequate level of protection, the transfer is made under an approved safeguard, such as the European Commission's Standard Contractual Clauses and the UK International Data Transfer Addendum, or under another lawful transfer mechanism.",
        },
        {
          type: "about",
          heading: "9. Your privacy rights and how to exercise them",
          body: "Your rights depend on where you live and on whether RiseLynk holds your data as a controller or as a processor.\n\n9.1 If you are in the EU or UK (GDPR and UK GDPR). Subject to conditions and exceptions in the law, you have the right to: access the personal data we hold about you; correct inaccurate data; erase your data (\"right to be forgotten\"); restrict or object to processing; data portability; withdraw consent where processing is based on consent; not be subject to a decision based solely on automated processing that produces legal or similarly significant effects (Lynk is assistive only and a human finalizes actions, so RiseLynk does not make such solely automated decisions); lodge a complaint with your supervisory authority.\n\n9.2 If you are in California (CCPA/CPRA). Subject to conditions and exceptions in the law, you have the right to: know and access the categories and specific pieces of personal information we hold about you; delete your personal information; correct inaccurate personal information; opt out of the sale or sharing of personal information. We do not sell personal information and we do not share it for cross-context behavioral advertising, so there is nothing to opt out of today; limit the use of sensitive personal information; not be discriminated against for exercising your rights.\n\nWe will not deny you goods or services, charge you a different price, or provide a different quality of service because you exercised a privacy right.\n\n9.3 How to make a request. If your data sits inside a service company's workspace (we are the processor): the service company is the controller. Send your request to that service company. RiseLynk gives the service company's administrator built-in tools in the office console, under \"Data and privacy,\" to fulfill these requests: an export tool that produces one JSON file of all personal data held about a person (this supports the GDPR Article 15 right of access and the CCPA right to know); an erase tool that performs true erasure or anonymization of a person's data, with an erasure-log audit record (this supports the GDPR Article 17 right to erasure and the CCPA right to delete).\n\nThe service-company administrator runs these tools. If you are a staff member or a building manager and you are not sure who your controller is, contact us at privacy@riselynk.com and we will route you and help the controller respond.\n\nIf RiseLynk is the controller (the marketing website, the newsletter, or an inquiry you sent us): contact us directly at privacy@riselynk.com. You can also unsubscribe from the newsletter using the link in any newsletter email.\n\nWe will verify your identity before acting on a request, and we will respond within the timeframe the applicable law requires. You may use an authorized agent where the law allows.",
        },
        {
          type: "about",
          heading: "10. Data retention",
          body: "As a processor, we retain personal data in a customer workspace for as long as the customer controller keeps it and instructs us to keep it, and we delete or return it after the service ends, as set out in the DPA. The export and erase tools above let a controller act on individual records at any time.\n\nAs a controller, we keep: newsletter data until you unsubscribe or ask us to delete it. After you unsubscribe, we keep a minimal suppression record solely to honor your opt-out and avoid re-mailing you, for as long as needed for that purpose, then delete it; website log data for a limited period needed to operate and secure the site; inquiry and business records for as long as needed for the purpose collected and to meet legal and accounting obligations.\n\nThe specific retention periods need to be set and confirmed.",
        },
        {
          type: "about",
          heading: "11. Security",
          body: "We use a layered set of safeguards designed for a multi-tenant platform:\n\nPer-tenant isolation. Each customer has its own separate database project, which is the core data-isolation boundary between customers.\n\nRow-level security (RLS). Inside a workspace, access is scoped to the signed-in user's permissions.\n\nMulti-factor authentication (MFA) lifecycle for accounts.\n\nAudit logging of sensitive actions, including an erasure log.\n\nSecure device wipe for lost or decommissioned devices.\n\nA hardened offline store for the field app.\n\nColumn-level privacy controls for sensitive fields.\n\nEncryption of data in transit and at rest through our infrastructure providers.\n\nNo system can be guaranteed perfectly secure. We work to protect personal data but cannot promise absolute security. If a security incident affects your personal data, we will notify the affected parties as required by applicable law and our customer agreements.",
        },
        {
          type: "about",
          heading: "12. Cookies",
          body: "The RiseLynk website currently uses only strictly necessary cookies, including the authentication and session cookies set by our infrastructure provider (Supabase). Stripe may set cookies during checkout. We do not currently run third-party advertising or analytics tracking on the site.\n\nFull details are in the RiseLynk Cookie Notice, published at riselynk.com/cookies. If we add non-essential cookies in the future, we will update the Cookie Notice and obtain consent where the law requires it.",
        },
        {
          type: "about",
          heading: "13. Children",
          body: "RiseLynk is a business-to-business platform built for use by professional service companies. It is not directed to children, and we do not knowingly collect personal data from children. We treat \"child\" as under 16 for the EU and UK and under 13 for the United States. If you believe a child has provided us personal data, contact privacy@riselynk.com and we will take appropriate steps to delete it.",
        },
        {
          type: "about",
          heading: "14. Changes to this policy",
          body: "We may update this policy from time to time. When we do, we will change the \"Last updated\" date above and, where the change is material, take additional steps to notify affected users or controllers as appropriate. The current version always governs.",
        },
        {
          type: "about",
          heading: "15. Contact us",
          body: "Privacy contact: privacy@riselynk.com.\n\nGeneral contact: hello@riselynk.com.\n\nPostal: Maxwell Industries LLC, 2775 Southeast Berger Lane, Port Orchard, WA 98366, USA.\n\nIf you are in the EU or UK and we are the controller, you also have the right to complain to your data protection supervisory authority.",
        },
      ],
    },

    // ==========================================================================
    // Legal: Customer Portal Privacy Notice (ported verbatim as body copy)
    // ==========================================================================
    {
      slug: "portal-privacy",
      title: "RiseLynk Customer Portal Privacy Notice",
      description: "RiseLynk Customer Portal Privacy Notice.",
      sections: [
        {
          type: "about",
          heading: "RiseLynk Customer Portal Privacy Notice",
          body: "Effective date: June 25, 2026. Last updated: June 25, 2026.",
        },
        {
          type: "about",
          heading: "In plain terms",
          body: "You reached this portal by scanning a QR code or opening a link on an elevator or escalator. This portal lets you report a problem, see service updates for that one piece of equipment, and message the technician working on it. You do not need an account or a password to use it.\n\nThis notice explains, in short, what we collect when you use the portal and where that information goes.",
        },
        {
          type: "about",
          heading: "Who handles your information",
          body: "Your elevator or escalator service company runs this portal to serve you. That company decides what to do with your information, so it is the one in charge of your data (the \"data controller\").\n\nRiseLynk is the software the company uses. RiseLynk is operated by Maxwell Industries LLC, 2775 Southeast Berger Lane, Port Orchard, WA 98366, USA. We handle the information only on the service company's behalf and on its instructions (we are the \"data processor\"). We do not use your portal information for our own marketing.",
        },
        {
          type: "about",
          heading: "Emergency notice (please read first)",
          body: "Do not use this portal to report an emergency. If someone is trapped in the elevator, if there is a fire, or if anyone is hurt or in danger, call the emergency number shown on or near the equipment, and call your local emergency services (such as 911 in the United States) if needed.\n\nThis portal is not monitored around the clock and is not built for emergencies. A report you submit here may not be seen right away. Lynk, the in-app AI assistant, is assistive only and must never be relied on in an emergency.",
        },
        {
          type: "about",
          heading: "What we collect when you use the portal",
          body: "When you report an issue or message the technician, the portal collects:\n\nYour name and contact details (such as email or phone) if you provide them.\n\nThe details of the problem you report, including any photos or notes you add.\n\nMessages between you and the assigned technician.\n\nThe service history and updates for the specific equipment your link covers, which you can view.\n\nBasic technical information your browser sends automatically, such as device and connection data, used to run the portal securely.\n\nPlease share only what is needed to report the issue. You do not have to enter personal details beyond what helps the service company reach you about this equipment.",
        },
        {
          type: "about",
          heading: "What your link can and cannot see",
          body: "Your QR code or link is scoped to your building and equipment only. Through it, you can report issues, view that equipment's service updates, and message the assigned technician.\n\nAccount and billing tools sit behind a separate login and are not part of this no-login portal. Your link does not give access to billing, payroll, or other buildings.",
        },
        {
          type: "about",
          heading: "Who we share it with",
          body: "Your information goes to your elevator or escalator service company so it can respond to your report. To run the portal, RiseLynk uses a small set of trusted service providers that process data on our behalf, including:\n\nSupabase (database, sign-in, and file storage).\n\nVercel (web hosting and content delivery).\n\nGoogle (Gemini) and Anthropic (Claude), which power the Lynk AI assistant. When the assistant helps answer a question, the relevant prompt and records may be sent to the AI provider to generate a response.\n\nTwilio (after-hours voice and text callouts, where the service company has turned this on).\n\nBrowser web push, used to send notifications if you allow them.\n\nRiseLynk does not sell your personal information and does not show third-party advertising trackers on the portal.",
        },
        {
          type: "about",
          heading: "Where your information is kept",
          body: "Your information is stored in your service company's own dedicated database. The storage region can be set to match the service company's location. Ask your service company if you want to know where your data is held.\n\nYour information may also be processed in, or sent to, countries other than where you live, including the United States, for example when the Lynk assistant generates an answer or a service provider operates there. Where required, this is done under approved safeguards. See the RiseLynk Privacy Policy for more detail.",
        },
        {
          type: "about",
          heading: "How long we keep it",
          body: "Your service company decides how long reports, messages, and service records are kept. We keep the information for as long as the service company needs it to provide the service, then delete or anonymize it on the company's instructions or as required by law.",
        },
        {
          type: "about",
          heading: "Your privacy choices and rights",
          body: "Depending on where you live, you may have rights over your personal information, such as the right to access a copy of it or to ask for it to be deleted. Examples include the GDPR or UK GDPR (for people in the EU or UK) and the CCPA or CPRA (for California residents).\n\nBecause your service company is in charge of your data, please send privacy requests to that company first. They can access your information and act on your request.\n\nIf you cannot reach your service company, or you need to escalate, you can contact RiseLynk at privacy@riselynk.com and we will help route your request to the right service company. For more detail on these rights and how requests are verified and answered, see the RiseLynk Privacy Policy.",
        },
        {
          type: "about",
          heading: "Cookies",
          body: "The portal uses only the strictly necessary cookies needed to keep your session working. The portal does not use third-party advertising or analytics tracking cookies. Billing and payment tools are not part of this no-login portal; they sit behind a separate sign in.",
        },
        {
          type: "about",
          heading: "Children",
          body: "This portal is for reporting equipment problems and is not directed to children. Please do not submit a child's personal information through it. If you believe a child has provided personal information, contact your service company or RiseLynk at privacy@riselynk.com.",
        },
        {
          type: "about",
          heading: "Changes to this notice",
          body: "We may update this notice from time to time. The current version is always the one shown here, with the \"Last updated\" date above.",
        },
        {
          type: "about",
          heading: "Contact",
          body: "For general questions about RiseLynk: hello@riselynk.com. For privacy escalations: privacy@riselynk.com. Maxwell Industries LLC, 2775 Southeast Berger Lane, Port Orchard, WA 98366, USA.\n\nFor anything about your specific report, your account, or your data, please contact your elevator or escalator service company, which is the controller of your information.",
        },
      ],
    },

    // ==========================================================================
    // Legal: Cookie and Tracking Notice (ported verbatim as body copy)
    // ==========================================================================
    {
      slug: "cookies",
      title: "RiseLynk Cookie Notice",
      description: "RiseLynk Cookie Notice.",
      sections: [
        {
          type: "about",
          heading: "RiseLynk Cookie and Tracking Notice",
          body: "Effective date: June 25, 2026. Last updated: June 25, 2026.",
        },
        {
          type: "about",
          heading: "1. About this notice",
          body: "This Cookie and Tracking Notice explains how RiseLynk, a product of Maxwell Industries LLC (\"RiseLynk\", \"we\", \"us\", or \"our\"), uses cookies and similar technologies on our marketing website at riselynk.com and within the RiseLynk application.\n\nA cookie is a small text file that a website stores on your device (computer, phone, or tablet) when you visit. Cookies let a site remember information between pages and between visits, for example to keep you signed in. Some technologies that work like cookies, such as browser local storage and session storage, are also covered by this notice. Where we refer to \"cookies\" below, we mean cookies and these similar technologies together.\n\nThis notice should be read alongside our Privacy Policy at riselynk.com/privacy, which explains more fully how we handle personal data.",
        },
        {
          type: "summary",
          heading: "2. The short version",
          summaryLabel: "The short version",
          ordered: false,
          points: [
            "We use only strictly necessary cookies to make the website and application work. These keep you signed in and keep your session secure.",
            "Our payment provider, Stripe, sets cookies during checkout to process payments and to help prevent fraud.",
            "We do not use third party advertising cookies, and we do not run third party analytics or tracking on our marketing site at this time.",
            "Because we use only strictly necessary cookies and our own payment and fraud prevention cookies, we do not currently show a cookie consent banner. If that changes, we will update this notice and, where the law requires it, ask for your consent first.",
          ],
        },
        {
          type: "about",
          heading: "3. The cookies we use",
          body: "We group cookies by their purpose. The categories we currently use are described below.\n\n3.1 Strictly necessary cookies (always active). These cookies are required for the website and application to function. Without them, core features such as signing in and staying signed in would not work. Because they are essential, they do not require your consent under most cookie laws. You can still block them in your browser, but parts of the service may stop working.\n\nAuthentication and session (set by RiseLynk / Supabase): keeps you signed in to your account and keeps your session secure. Without it you would be signed out on every page. First party, session and short lived.\n\nSecurity and load handling (set by RiseLynk / Supabase): helps keep your session safe and the service available. First party, session and short lived.\n\nNote on the no login customer portal: building and property contacts who reach RiseLynk through a QR code at the front desk use a no login, link scoped portal. That portal still relies on strictly necessary session storage so the page can hold your place and keep the link scoped to the correct building. It does not set advertising or analytics cookies.\n\n3.2 Payment and fraud prevention cookies (Stripe). When you make a payment, our payment processor Stripe sets cookies in your browser. Stripe uses these to process the payment securely and to detect and prevent fraud. These cookies are set by Stripe, not by RiseLynk, and RiseLynk does not store your card number. Stripe acts as an independent controller of the data it collects through these cookies. For details, see Stripe's own privacy and cookie information at stripe.com/privacy and stripe.com/cookies-policy/legal.\n\n3.3 Advertising and analytics cookies (not used). We do not currently use any third party advertising cookies, and we do not run third party analytics or website tracking (for example, we do not use cross site ad networks, and we are not running a third party analytics tool on the marketing site).\n\nIf we add analytics or advertising technologies in the future, we will update this notice before or at the time they go live, identify the providers involved, and, where the law requires it, ask for your consent through a cookie banner or similar control before any non essential cookie is set.",
        },
        {
          type: "about",
          heading: "4. How long cookies last",
          body: "Cookies last for different lengths of time:\n\nSession cookies are deleted when you close your browser. Our authentication and session cookies are session based or short lived.\n\nPersistent cookies stay on your device until they expire or you delete them. Stripe may set cookies that persist for a period it defines for fraud prevention. The exact durations are set by Stripe and described in Stripe's documentation linked above.",
        },
        {
          type: "about",
          heading: "5. How you can control cookies",
          body: "You have several ways to control cookies:\n\nBrowser settings. Most browsers let you see the cookies stored on your device, delete them, and block some or all of them. Look in your browser's settings under \"Privacy\", \"Cookies\", or \"Site data\". Blocking strictly necessary cookies will prevent you from signing in and may stop parts of the service from working.\n\nClearing site data. You can clear cookies and local storage for riselynk.com at any time through your browser. You will be signed out when you do this.\n\nDo Not Track and Global Privacy Control. Some browsers can send a Do Not Track or Global Privacy Control signal. Because we do not run third party advertising or analytics tracking, there is no third party tracking for these signals to switch off on our site today. If we add tracking in the future, we will describe how we respond to these signals.\n\nFor help managing cookies in common browsers, see your browser maker's support pages (for example, Chrome, Safari, Firefox, and Edge each publish cookie management instructions).",
        },
        {
          type: "about",
          heading: "6. Your privacy rights",
          body: "Depending on where you live, you may have rights over the personal data associated with cookies, for example the right to access or delete it. Residents of California (under the CCPA and CPRA) and individuals in the EU, UK, and EEA (under the GDPR and UK GDPR) have specific rights. We describe those rights and how to exercise them in our Privacy Policy at riselynk.com/privacy. Note that because we do not sell or share personal data for cross context behavioral advertising, there is no advertising opt out to exercise on our site at this time.",
        },
        {
          type: "about",
          heading: "7. Changes to this notice",
          body: "We may update this notice from time to time, for example if we add new cookies or new technologies. When we do, we will change the \"Last updated\" date above. If we begin using analytics or advertising cookies, or any other non essential cookies, we will update this notice before or when those cookies go live and obtain consent where the law requires it.",
        },
        {
          type: "about",
          heading: "8. Contact us",
          body: "If you have questions about this notice or about how we use cookies, contact us at:\n\nMaxwell Industries LLC (RiseLynk), 2775 Southeast Berger Lane, Port Orchard, WA 98366, USA.\n\nPrivacy contact: privacy@riselynk.com. General contact: hello@riselynk.com.",
        },
      ],
    },

    // ==========================================================================
    // Trust and security (ported VERBATIM from apps/landing/trust/index.html at
    // the 2026-07-13 apex cutover; claims-locked, do not reword). Bulleted lists
    // flatten to prose paragraphs and the CIS table renders as `records` cards,
    // the same accepted-downgrade idiom the legal pages above use. The one banned
    // token in the copy ("certified", in the negation "CIS has not audited or
    // certified us", section index 6) is carried as the single documented
    // exception in website/tools/claims-lint-exceptions.json.
    // ==========================================================================
    {
      slug: "trust",
      title: "RiseLynk Trust and Security",
      description:
        "How RiseLynk protects customer data: per-customer database isolation, row-level security, encryption, access control, and our security program.",
      sections: [
        {
          type: "about",
          heading: "Trust and security",
          body: "RiseLynk is built on per-customer database isolation, row-level security, encryption in transit and at rest, and automated security checks on every code change. This page summarizes those controls in one place.\n\nLast updated: July 14, 2026\n\nThis page is a summary written for buyers and security reviewers. It is not a warranty or a certification. Our specific contractual commitments are set out in the order form and data processing terms.",
        },
        {
          type: "about",
          heading: "Where we host and how data is protected",
          body: "Per-customer database isolation. Every customer company runs in its own dedicated database project, never a shared database separated by software rules. Two customers are never in the same database, so separation is enforced by the architecture itself, not by a query filter. Each project has its own credentials, storage, and backups.\n\nEncryption. Data is encrypted in transit with TLS and at rest with AES-256 at the platform layer.\n\nHosting. RiseLynk runs on Supabase (managed Postgres, authentication, and storage) hosted on Amazon Web Services in United States regions, with the web applications served by Vercel. Our hosting provider (Supabase, on AWS) holds SOC 2 Type 2 and ISO 27001 certifications and supports HIPAA under a Business Associate Agreement. These are the hosting provider's certifications, not RiseLynk's own.",
        },
        {
          type: "about",
          heading: "Access control",
          body: "Row-level security everywhere. Inside a customer workspace, row-level security is enabled on every table, and access is scoped to the signed-in user's role and permissions. A field technician sees only their assigned work, and pay and cost data is readable only by owners, supervisors, project managers, sales, and the IT administrator.\n\nStrong sign-in. Sign-in supports phishing-resistant passkeys and WebAuthn (Face ID, Touch ID, Windows Hello, and hardware security keys). Multi-factor authentication is available and can be required per customer.\n\nLeast privilege. Roles are least-privilege by default, and financial data is gated to a named set of roles.",
        },
        {
          type: "about",
          heading: "Audit logging",
          body: "Changes to sensitive financial records (time, expenses, parts, proposals, invoices, and pay rates) are written to an append-only audit log that captures who made the change, what changed, and when. Platform-level logging and alerting cover infrastructure and authentication events.",
        },
        {
          type: "about",
          heading: "SOC 2 status",
          body: "RiseLynk does not hold a SOC 2 report today. We have adopted an internal SOC 2 Phase 0 policy pack (adopted July 11, 2026) that documents our security program, building on the technical controls already described on this page. A formal SOC 2 audit has not started. If and when a report exists, we will describe it as an attestation available under a non-disclosure agreement, never as a certification.",
        },
        {
          type: "about",
          heading: "Security program on every change",
          body: "Security is checked automatically as we build, not just reviewed after the fact.\n\nA pre-commit and continuous-integration security gate blocks two common mistakes: authorizing a user from client-settable metadata, and shipping a privileged server key in client code.\n\nAn automated database test suite asserts that row-level security holds and that a normal user cannot escalate their own privileges.\n\nWe run dated, written security reviews with tracked remediation.",
        },
        {
          // Section index 6: the ONE claims-lint exception lives here ("certified"
          // in "CIS has not audited or certified us"), path pages[7].sections[6].body.
          type: "about",
          heading: "CIS Controls IG1 self-attestation",
          body: "We assess ourselves against the CIS Controls version 8.1, Implementation Group 1 (IG1), the essential cyber-hygiene safeguards aimed at small organizations. This is a self-attestation: we assert it ourselves, and CIS has not audited or certified us. Where a control is provided by our platform rather than built by us, we say so.",
        },
        {
          type: "records",
          heading: "CIS Controls v8.1, IG1: what RiseLynk does today",
          records: {
            enabled: true,
            intro:
              "Each row maps a CIS Controls v8.1 area in Implementation Group 1 to what RiseLynk does today.",
            items: [
              {
                title: "1. Inventory and control of enterprise assets",
                body: "Each customer runs in its own dedicated database project, tracked in a per-tenant registry with its own storage and backups.",
              },
              {
                title: "3. Data protection",
                body: "Encryption in transit (TLS) and at rest (AES-256) at the platform layer, plus per-customer data isolation. Sensitive records such as invoices are never cached on field devices, and the offline cache is wiped when a device changes users.",
              },
              {
                title: "4. Secure configuration of assets and software",
                body: "A pre-commit and continuous-integration security gate blocks the two mistakes that most often reappear: authorization from client-settable metadata, and a privileged server key in client code.",
              },
              {
                title: "5. Account management and 6. Access control management",
                body: "A server-side, least-privilege role model with row-level security enabled on every table. Passkeys, WebAuthn, and multi-factor authentication are available.",
              },
              {
                title: "8. Audit log management",
                body: "An append-only audit log on sensitive financial record changes, plus platform-level logging of infrastructure and authentication events.",
              },
              {
                title: "11. Data recovery",
                body: "Nightly encrypted backups to off-platform storage, with a weekly automated restore-verification job.",
              },
              {
                title: "15. Service provider management",
                body: "A maintained vendor register tracks each subprocessor, its data flow, and its status.",
              },
              {
                title: "17. Incident response management",
                body: "A written incident-response plan defines how a security event is detected, contained, and reported. The plan is reviewed on an annual cadence.",
              },
            ],
          },
        },
        {
          type: "about",
          body: "Some of these controls are provided by our platform (for example, encryption at rest is provided by Supabase). We describe them here because they protect your data, and we are direct about which layer provides them.",
        },
        {
          type: "about",
          heading: "Report a vulnerability",
          body: "Found a security issue? Our vulnerability disclosure page at riselynk.com/security explains how to report it and the protections we extend to good-faith researchers. The security contact is also published in our machine-readable security.txt file at riselynk.com/.well-known/security.txt.",
        },
        {
          type: "about",
          heading: "Privacy and data handling",
          body: "How we handle personal data is covered in our public documents: the Privacy Policy at riselynk.com/privacy, the Customer Portal Privacy Notice at riselynk.com/portal-privacy, and the Cookie Notice at riselynk.com/cookies.",
        },
        {
          type: "about",
          heading: "For security reviewers",
          body: "For a signed security questionnaire (SIG or CAIQ) or our detailed security posture summary, contact hello@riselynk.com. We share detailed policy documents under a non-disclosure agreement.",
        },
        {
          type: "about",
          body: "RiseLynk is operated by Maxwell Industries LLC, a Washington limited liability company. This page summarizes controls and is not a warranty or a certification.",
        },
      ],
    },

    // ==========================================================================
    // Vulnerability disclosure (ported VERBATIM from apps/landing/security/
    // index.html at the 2026-07-13 apex cutover; claims-locked, do not reword).
    // Lists flatten to prose; the highlighted "Reporting in short" box maps to a
    // `summary` card. No banned tokens; no claims-lint exception needed.
    // ==========================================================================
    {
      slug: "security",
      title: "RiseLynk Vulnerability Disclosure",
      description:
        "How to report a security vulnerability in RiseLynk, and our commitment to good-faith researchers.",
      sections: [
        {
          type: "about",
          heading: "Report a security vulnerability",
          body: "Last updated: July 14, 2026\n\nRiseLynk is operated by Maxwell Industries LLC. We take the security of our platform and our customers' data seriously, and we welcome reports from security researchers. This page explains how to reach us, what to expect, and the protections we extend to anyone who reports in good faith.",
        },
        {
          type: "summary",
          heading: "Reporting in short",
          summaryLabel: "Reporting in short",
          ordered: false,
          points: [
            "Email hello@riselynk.com with the details of what you found and how to reproduce it.",
            "We aim to acknowledge your report within 3 business days.",
            "Test only against our own hosts. Never touch a live customer's data.",
            "Report in good faith and we will not pursue or support legal action against you.",
          ],
        },
        {
          type: "about",
          heading: "How to report",
          body: "Send your report to hello@riselynk.com. A helpful report includes: a clear description of the issue and its potential impact; the exact steps, request, or proof of concept needed to reproduce it; the host, page, or endpoint affected; and your name or handle if you would like credit once the issue is fixed.\n\nThis contact is also published in our machine-readable security.txt file, per RFC 9116, at riselynk.com/.well-known/security.txt.",
        },
        {
          type: "about",
          heading: "What to expect from us",
          body: "We aim to acknowledge your report within 3 business days. We will work to validate the issue and keep you informed of our progress. We will let you know when the issue is resolved. With your permission, we are glad to credit you once a fix is in place.\n\nWe are a small team, so we ask for your patience and, until an issue is fixed, your discretion.",
        },
        {
          type: "about",
          heading: "Safe harbor for good-faith research",
          body: "If you make a good-faith effort to follow this policy while researching and reporting a vulnerability, we will consider your work authorized. We will not pursue or support legal action against you, and if a third party brings action against you for activity that followed this policy, we will make it known that your actions were authorized. Good faith means you avoid privacy violations, data destruction, and any disruption to our service or our customers. It also means you give us a reasonable chance to fix the issue before disclosing it publicly.",
        },
        {
          type: "about",
          heading: "Scope",
          body: "In scope. Our public marketing site and our synthetic demo: riselynk.com, and demo.app.riselynk.com (a demo that runs on synthetic data only).\n\nOut of scope. To protect real people and real businesses, the following are not authorized targets: any live customer workspace or customer data on app.riselynk.com; denial-of-service or resource-exhaustion testing; social engineering of our staff, customers, or vendors; physical attacks against offices or devices; and spam, or automated scanning that degrades service for others.\n\nIf you are unsure whether something is in scope, email us first and ask.",
        },
        {
          type: "about",
          heading: "How our platform is built",
          body: "For a summary of how RiseLynk protects customer data, including per-customer database isolation, row-level security, encryption, access control, and our security program, see our Trust and security page at riselynk.com/trust.",
        },
        {
          type: "about",
          body: "Thank you for helping keep RiseLynk and our customers safe.",
        },
      ],
    },
  ],
};
