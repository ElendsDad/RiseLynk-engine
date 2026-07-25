// The contract every part of the engine reads from.
// Per site, you edit a site.config.ts (typed by SiteConfig) and nothing else.
//
// Provenance: extracted 2026-07-10 from
// maxlynk-services/templates/brochure/lib/config-schema.ts (formerly kitsap-website-creation). The `business.location`
// block was added in v0.1.0 so the SEO machinery (lib/seo.ts) reads a real address off
// config instead of the hardcoded Port Orchard values it carried in KitsapComponent.
//
// v0.2.0 adds the elevator-contractor archetype (cumulative on brochure), a GEO/AI-answer
// pack (summary + faq sections, llms.txt), a hosted blog, and three optional sections
// (careers, records, modGallery) that render only when their config is present and enabled.
// Additive only: a config valid at v0.1.0 stays valid here.

export type SectionType =
  | "hero"
  | "services"
  | "about"
  | "gallery"
  | "testimonials"
  | "contact"
  | "cta"
  | "leadform"
  | "booking"
  | "products"
  // --- Phase-A product-marketing layer (software-product archetype) ---
  | "pricing" // pricing tiers for a software product; feeds the SoftwareApplication Offer JSON-LD
  // --- v0.2.0 elevator-contractor archetype (cumulative on brochure) ---
  | "contractorServices" // maintenance / repair / modernization / periodic testing
  | "trustBar" // brand-neutral trust strip: license, insurance, years, brands, site facts + verify link
  | "requestService" // form posting to the tenant's portal-intake path (mailto fallback)
  | "portalDoor" // deep-link into the tenant's tokenized customer portal
  // --- v0.2.0 GEO / AI-answer pack ---
  | "summary" // answer-first summary block (feeds AI answer engines)
  | "faq" // FAQ whose FAQPage JSON-LD mirrors the visible copy verbatim
  // --- v0.2.0 optional sections (render only when present and enabled; default OFF) ---
  | "careers" // mechanic-voice recruiting surface
  | "records" // records-transparency, owner language
  | "modGallery" // modernization before/after gallery
  // --- R5 (v0.12) design-system structural craft ---
  | "scrollNarrative" // pinned scroll-narrative that degrades to a static step timeline
  // --- local-trades conversion batch ---
  | "serviceArea" // visible service-area list; its areas also feed the areaServed JSON-LD and llms.txt
  | "contentGate" // teaser + lead form that reveals a config-supplied asset on an accepted lead
  // --- expressive pack ---
  | "storyGraph" // config-driven node-graph narrative rendered as server-side SVG (see StoryGraphConfig)
  // --- feedback item 7: add-on / priced-menu section ---
  | "addons" // a SECOND priced-menu surface, distinct from `pricing` (see AddonItem); display copy only
  // --- dense resource / link directory (teardown 2026-07-24) ---
  | "directory" // compact link-directory cards for dense resource lists (see DirectoryItem)
  // --- teardown P2 (2026-07-24) ---
  | "featureMatrix" // neutral capability / plan comparison grid (see FeatureMatrixRow)
  | "videoEmbed"; // allowlisted privacy-first video embed (see VideoEmbedConfig)

export type Archetype = "brochure" | "elevator-contractor" | "software";

// --- Review / rating structured data (feature-backlog #2) ---
// CLAIMS WALL: these describe REAL ratings a business already holds from its own
// reviews. The engine NEVER synthesizes a star value or a review. A node emits an
// AggregateRating only when the config supplies a valid rating (a finite value plus
// at least one counted review), and Review nodes only from real review items. Feeds
// the AggregateRating / Review JSON-LD on the business (Organization/LocalBusiness)
// node and on Product nodes (see lib/rating-ld.mjs and lib/seo.ts).
export interface RatingFacts {
  ratingValue: number; // the average, e.g. 4.8
  reviewCount: number; // how many reviews it averages (must be > 0 to emit)
  bestRating?: number; // top of the scale, default 5
  worstRating?: number; // bottom of the scale, default 1
}

export interface ReviewItem {
  author: string; // the reviewer, as they gave it
  rating: number; // this review's star value
  body?: string; // the review text, verbatim
  date?: string; // ISO date the review was left
  bestRating?: number; // top of the scale for THIS review, default 5
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  priceCents?: number; // inline price in cents (4900 = $49.00)
  currency?: string; // defaults to commerce.currency or "usd"
  image?: string;
  priceId?: string; // optional pre-created Stripe Price id (overrides priceCents)
  cta?: string; // button label
  // Quote-only catalog: an UNPRICED product (no priceCents/priceId) with a ctaHref (or the
  // section's quoteHref) renders its button as a link to that href (the quote/contact page)
  // instead of a Stripe checkout button. Priced products always keep the checkout path.
  ctaHref?: string;
  // Optional REAL rating/reviews for this product (claims-walled, see RatingFacts). When
  // present, the product's JSON-LD carries AggregateRating / Review so a search result can
  // show stars. Never invent these.
  rating?: RatingFacts;
  reviews?: ReviewItem[];
}

// --- v0.2.0 shared shapes ---

// One service line in the elevator-contractor archetype. The four canonical lines are
// maintenance, repair, modernization, and periodic testing; `key` names the line so the
// SEO machinery can emit a Service node per line. Everything is copy from config.
export interface ServiceLine {
  key?: "maintenance" | "repair" | "modernization" | "periodicTesting" | (string & {});
  title: string;
  body: string;
  points?: string[];
  href?: string;
}

// One custom trust fact for the trust strip. Fully config-driven and brand-neutral: the site
// supplies the label and value for anything it can prove (family owned, free estimates, a
// workmanship warranty, a BBB rating, manufacturer certifications, and so on). An optional
// href turns the value into a verify/proof link. Claims wall: only real, site-provided facts.
export interface TrustItem {
  label: string;
  value: string;
  href?: string;
}

// Trust artifacts a business can prove, rendered brand-neutrally by the trustBar section for
// any trade. All fields optional; the bar renders only the facts config supplies (claims-
// walled: no field is invented, ever). The typed fields below are convenience shortcuts for
// the most common facts; `items` is the open-ended surface for any other trust fact.
// `registryUrl` links the reader out to a public verification page (for example a state
// license lookup) so a credential is checkable.
export interface TrustFacts {
  licenseNumber?: string;
  licenseLabel?: string; // e.g. "State contractor license"
  registryUrl?: string; // public verification / license-lookup URL
  registryLabel?: string; // link text (default "Verify")
  bonded?: boolean;
  insured?: boolean;
  yearsInBusiness?: number;
  since?: number; // year established (alternative to yearsInBusiness)
  brands?: string[]; // brands / product lines / equipment served
  items?: TrustItem[]; // any other site-provided trust facts (fully config-driven)
}

// Google Business Profile alignment (engine-value research item 6). Config-only:
// Josh claims/creates the profile by hand and pastes these values. There is NO
// GBP API integration. Unset on every template (readiness WARNs); never ship a
// placeholder profile/review URL (claims wall).
//
// Review CTA links the public reviewUrl for every visitor equally — no sentiment
// gating, filtering, or routing (Google policy + FTC review rule).
export interface GbpConfig {
  placeId?: string; // Google place id (operator reference; not rendered as a claim)
  profileUrl?: string; // https public profile URL → Organization sameAs
  reviewUrl?: string; // https public "write a review" URL → footer / trustBar / cta
  // Optional NAP as listed on the GBP profile (paste from the listing). When set,
  // next.config.ts WARNs if the matching business.name / phone / address drifts.
  name?: string;
  phone?: string;
  address?: string;
}

export interface FaqItem {
  q: string;
  // The visible answer. Supports the SAME inline [label](href) link syntax as
  // Section.body (see that field's doc comment, and components/Prose.tsx /
  // lib/inline-links.mjs); an answer with no link syntax renders byte-identical to
  // before. PARITY RULE: the FAQPage JSON-LD (lib/seo.ts faqPageLd) mirrors this
  // VISIBLE copy verbatim, so when an answer contains link syntax the structured-data
  // text keeps the label and drops the brackets/URL (lib/inline-links.mjs
  // toPlainText) - a reader never sees the markup, so neither does the JSON-LD.
  a: string;
}

// One modernization project (before/after pair). `before`/`after` reference assets in
// public/. Rendered only when the modGallery section is enabled AND has projects.
export interface Project {
  equipmentClass?: string; // e.g. "Hydraulic passenger"
  scope?: string;
  timeline?: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  caption?: string;
}

export interface CareersConfig {
  enabled?: boolean; // explicit off-switch; the block can exist but stay dark
  intro?: string;
  roles?: { title: string; body: string }[];
  onCall?: string; // the on-call reality, said plainly
  apprenticeship?: string; // the apprenticeship path
  applyIntakeUrl?: string; // reuse the intake pattern; posts here when set
  applyEmail?: string; // mailto fallback when applyIntakeUrl is unset
  submitLabel?: string;
  successMessage?: string;
}

export interface RecordsConfig {
  enabled?: boolean;
  intro?: string;
  items?: { title: string; body: string }[];
}

// --- R5 (v0.12) design-system structural craft ---
// One scene in a scrollNarrative section. The SAME caption node is shown in the animated
// pinned stage AND the static step-timeline fallback, so the two can never disagree (the
// "captions match the animated content verbatim" rule holds by construction). A scene may
// carry a still image, a video payoff, both, or neither (a caption-only step). All content
// is per-site config; the engine supplies only the structure and the motion.
export interface NarrativeScene {
  label?: string; // stamped plate tag, e.g. "STEP 01" (rendered in the mono face)
  caption: string; // the caption line, shown verbatim in the animated stage and the fallback
  image?: { src: string; alt: string };
  video?: { src: string; poster?: string; label?: string };
}

// --- Phase-A product-marketing layer: pricing (feeds the SoftwareApplication Offer JSON-LD) ---
// One pricing plan. `price` is the DISPLAY string exactly as shown ("From $39", "Custom"), with
// `period` the unit line under it ("per seat / mo"). `priceValue` is the OPTIONAL structured
// numeric price used only for the Offer JSON-LD: a tier supplies it to be emitted as an Offer, and
// a quote / "Custom" plan omits it so no price is invented (claims wall, see lib/offer-ld.mjs).
// `highlighted` marks the hot plan (a per-site style detail, for example the gradient price); the
// engine bakes no copy or color. Everything is config; nothing is invented.
export interface PricingTier {
  name: string; // plan name, e.g. "Standard"
  price: string; // display price exactly as shown, e.g. "From $39" or "Custom"
  period?: string; // unit line under the price, e.g. "per seat / mo"
  priceValue?: number; // structured numeric price for the Offer JSON-LD (omit for a quote / Custom plan)
  priceCurrency?: string; // ISO currency for the Offer (defaults to commerce.currency, then USD)
  meta?: string; // fine print under the price (minimums, setup, prepay terms)
  who?: string; // one-line audience note, e.g. "For a single branch getting organized"
  features: string[]; // included-feature bullets, verbatim from config
  ctaLabel?: string; // button label (defaults to a neutral "Learn more")
  ctaHref?: string; // button target; also becomes the Offer url when set
  highlighted?: boolean; // the hot plan (per-site style hook only, e.g. the gradient price)
  badge?: string; // optional small badge on the highlighted plan (config-supplied, e.g. "Most popular")
}

// --- Add-on / priced-menu section (feedback item 7) ---
// One line item in an `addons` section (components/sections/Addons.tsx). Deliberately
// a DIFFERENT shape from PricingTier above, not a reuse: no `features[]` comparison
// list, no `highlighted` hot plan, no `badge` - and critically no `priceValue`. `price`
// is DISPLAY COPY ONLY, exactly as shown ("$25", "Included", "Custom"), with no
// structured numeric counterpart at all.
//
// This is a deliberate claims-wall / decoupling choice, not an omission: `pricing` is
// the ONLY section type lib/seo.ts's `allPricingTiers` collects into the
// SoftwareApplication Offer / AggregateOffer JSON-LD (it filters on
// `section.type === "pricing"`; see that function's doc comment). An `addons` section
// is never that type, so its items can never reach the Offer collector by construction
// - and because AddonItem carries no `priceValue` field at all, even a future wiring
// mistake that fed one of these to lib/offer-ld.mjs's `tierHasPrice` would find nothing
// finite to offer (that guard fails closed on a missing/non-finite priceValue). A
// priced menu here is presentation copy, a claims wall against inventing a structured
// commercial offer the business did not configure; the `addons` section emits NO
// JSON-LD of any kind (see tools/addons.test.mjs).
export interface AddonItem {
  name: string; // add-on name, e.g. "Rush scheduling"
  price: string; // DISPLAY price string exactly as shown, e.g. "$25" or "Included" - never parsed, never structured
  description?: string; // one-line description of what the add-on covers
  note?: string; // optional fine print under the item (for example an eligibility note)
  ctaLabel?: string; // optional per-item link label (defaults to "Learn more" when ctaHref is set)
  ctaHref?: string; // optional per-item link target
}

// --- Dense resource / link directory (teardown 2026-07-24) ---
// One entry in a `directory` section. Built for industry-resource / link-directory pages
// where `records` cards are too large: compact title + short blurb + optional outbound
// href and a small meta/tag chip (for example a state code). Display copy only; the
// section emits no JSON-LD. Claims wall: every field is config-supplied; the engine
// invents no links and no coverage.
export interface DirectoryItem {
  title: string; // entry title, e.g. "Oregon, BCD Elevator Program"
  body?: string; // short blurb (keep tight; the dense layout is for scanning)
  href?: string; // optional outbound or same-origin link (http(s) or root-relative)
  meta?: string; // optional chip / tag, e.g. "OR" or "Codes"
  ctaLabel?: string; // link label when href is set (defaults to "Open")
}

// --- Feature / capability matrix (teardown P2 item 7g) ---
// One row in a `featureMatrix` section. Brand- and competitor-neutral: columns are
// whatever labels the site supplies (plans, tiers, "us vs them" headers, trade
// packages). Cells are either a boolean (renders as included / not) or a short
// string shown verbatim. The engine invents no capabilities and no competitor copy.
export interface FeatureMatrixRow {
  capability: string; // row label, e.g. "Offline field app"
  cells: (boolean | string)[]; // aligned to Section.matrixColumns by index
}

// --- Pricing cross-tier comparison row (teardown P2 item 2a) ---
// Optional matrix UNDER the existing pricing cards. Cells align to `tiers[]` by
// index. Absent `comparisonRows` keeps the cards-only render byte-identical.
export interface PricingComparisonRow {
  feature: string; // row label, e.g. "Portal access"
  cells: (boolean | string)[]; // aligned to Section.tiers by index
}

// --- Allowlisted video embed (teardown P2 item 7j) ---
// Privacy-first: YouTube resolves to youtube-nocookie; no autoplay; lazy iframe.
// The iframe host must ALSO be allowlisted in `security.frameSrc` (CSP), or the
// browser will refuse to load it. See lib/video-embed.mjs.
export interface VideoEmbedConfig {
  src: string; // video id, or a youtube/youtu.be/youtube-nocookie/vimeo URL
  title: string; // required iframe title (a11y); config-supplied, never invented
  provider?: "youtube" | "vimeo"; // inferred from src when omitted
}

// --- Multi-CTA hero (harvested from the 2026-07-12 design bundle hero) ---
// One hero call-to-action. Additive to the legacy single ctaLabel/ctaHref: a hero may declare
// a `cta[]` array of 1-3 buttons, each with its own label, href, and button variant. Brand-
// neutral: the variant maps to the engine's existing .btn--primary / .btn--accent / .btn--ghost
// classes (all derived from the two brand colors), never a baked color.
export interface HeroCta {
  label: string;
  href?: string; // defaults to /contact when omitted (same fallback as the legacy single CTA)
  variant?: "primary" | "accent" | "ghost"; // button style; defaults to "primary" for a cta[] item
}

// --- Rich, declarative lead-form field (harvested from the design bundle request-access modal) ---
// Extends the lead-form surface beyond the fixed enum: a site declares fields of any supported
// type, each with its own label and required flag. This IS the general custom-field vocabulary
// (feedback item #24's "urgency select, budget range plus timeframe, vehicle year/make/model" -
// none of the fixed Section.fields enum): every one of those is expressible today as a LeadField
// and is proven end to end (canonical mapping, verbatim message folding, checkbox-group multi-
// value survival) by npm run test:lead-fields, which drives the real lib/contact-intake.mjs.
//
// Field NAMES that match a known intake column, case-insensitively (name, company, email, phone,
// units, service, preferredTime, message, building) map straight onto the save-first lead. Every
// OTHER declared field folds into the message body of that SAME intake: the enhanced (JS) form
// folds it under its configured LABEL (components/RequestAccessForm.tsx buildPayload), while a
// no-JS native post falls back to lib/contact-intake.mjs's foldExtras(), which only has the raw
// field NAME to fold under (labels are not part of a posted form body) - so the folded line reads
// "name: value" rather than "Label: value" on that path. Either way nothing is ever dropped. A
// checkbox-group's multiple checked values arrive as repeats of one field name; the no-JS route
// (app/api/lead/route.ts readBody) and the enhanced client both join them into one comma-separated
// value before folding, and foldExtras itself joins a raw array the same way for any other caller.
//
// `required` is a CLIENT-side contract only (rendered as the native HTML `required` attribute,
// enforced by the browser's constraint validation before the enhanced form's submit handler even
// runs). lib/contact-intake.mjs's submit() has no per-field schema and enforces no server-side
// requiredness for a LeadField: it only ever enforces its own pre-existing core checks (a contact
// method - email or phone - and at least one of name/company/message/service). A required extra
// left empty by a bypassed client (JS off with a hand-crafted post, or a browser that skips
// validation) still saves; an empty value simply folds to nothing rather than a blank line.
//
// Reserved names: `website` (the honeypot) and `source` (the lead-source tag) are intake-reserved
// in lib/contact-intake.mjs's KNOWN_INTAKE_FIELDS. Naming a real LeadField `website` collides with
// the honeypot trap RequestAccessForm.tsx always renders, so a genuine value there gets treated as
// spam and silently dropped - pick a different name for a company-website-style field.
//
// Brand-neutral and fully config-driven: the engine bakes no field, label, or option.
export interface LeadField {
  name: string; // form field name; a known intake column maps directly, anything else folds into the message. Avoid "website"/"source" (reserved, see above)
  label: string; // visible label; used to fold an extra's message line on the JS-enhanced path only (the no-JS path folds under the raw name)
  type?: "text" | "email" | "tel" | "number" | "select" | "checkbox-group" | "textarea";
  required?: boolean; // CLIENT-side (HTML required attribute) only; the server enforces no per-field requiredness, see above
  options?: string[]; // choices for a select or checkbox-group
  placeholder?: string;
  autoComplete?: string; // maps to the input autocomplete attribute
  full?: boolean; // span both columns in the two-column grid
}

// --- Feature-card treatments (harvested from the 2026-07-12 design bundle #features grid) ---
// The card item the `services` (feature) section renders. Additive to the legacy
// { title; body; icon? } shape: an item may ALSO carry an optional badge, a flagship flag, and a
// site-supplied mini-visual slot. A card that sets only title/body/icon renders byte-for-byte as
// before. Brand-neutral: the badge is config copy, the flagship edge derives from the two brand
// colors, and the viz markup is the SITE's (the engine only frames the slot).
export interface FeatureItem {
  title: string;
  body: string;
  // One-line audience note (engine feedback #5, mirrors PricingTier.who), e.g. "For
  // mixed-manufacturer routes" or "For property managers with more than one building".
  // Rendered on the card between the title and the body when present. Absent renders
  // the card byte-for-byte as before.
  who?: string;
  icon?: string;
  // Built-in icon set (feedback-v0.5.0 item 12, cosmetic): a name from the small,
  // brand-neutral SVG set in lib/icons.mjs (ICON_NAMES), rendered instead of the literal
  // `icon` glyph. Additive and default OFF; an unknown name renders nothing (fail-safe),
  // never a broken icon. Takes precedence over `icon` when both are set.
  iconName?: string;
  // Optional small mono BADGE on the card (e.g. "SOON" / "Planned"). Reuses the never-as-shipped
  // discipline: it names a planned capability, never an affirmative claim. Absent renders no badge.
  badge?: string;
  // FLAGSHIP variant: the card spans the full grid row and gains an accent left edge (derived from
  // brand.colors.accent). Absent renders the standard card (unchanged).
  flagship?: boolean;
  // Per-card MINI-VISUAL slot: a raw HTML/SVG string the SITE supplies and the engine renders as-is
  // (dangerouslySetInnerHTML), aria-hidden, inside the card. This is how a site provides its own
  // small animated proof (a sync line, a chat bubble) without baking any art into the engine. The
  // engine frames the slot and gives it a reduced-motion-safe reveal; the animation content is the
  // site's. Absent renders nothing and leaves the card single-column (back-compat).
  viz?: string;
  // Per-service detail page link (feedback item #25). Only the elevator archetype's
  // ServiceLine could link out before this; a brochure `services` card renders the same
  // "Learn more" link ServiceLine already does when a site wires one up. Absent renders no
  // link (back-compat).
  href?: string;
}

// --- Lead-capture content gate, Phases 0-1 (docs/plans/lead-capture-content-gate.md) ---
// Trades one genuinely valuable content asset (a maintenance checklist, a pricing guide,
// a spec sheet) for a lead through the SAME save-first intake every other form uses
// (/api/lead + lib/contact-intake.mjs): the lead is saved before anything else happens,
// spam is dropped by the same honeypot and optional Turnstile, and `source` tells the
// operator which gate produced the lead.
// CLAIMS WALL: the teaser (the section's heading/subheading/body plus `bullets`) and the
// asset are config-supplied copy, rendered verbatim; the engine invents nothing.
// SOFT-GATE HONESTY NOTE (Phase 1): the asset href is present in the served markup, so a
// view-source visitor can take it without submitting. That is acceptable for a checklist,
// not for a secret; signed, expiring links minted on an accepted lead are Phase 3. Site
// copy must not promise exclusivity this gate does not enforce. The unlock is also
// component-local (no persistence, no cookie), so a reload re-gates.
export interface ContentGateConfig {
  id?: string; // short slug naming this gate; feeds the lead source tag ("content-gate:<id>")
  asset: {
    href: string; // the gated thing: an asset in public/ (or an absolute URL)
    label?: string; // unlock button text (default "Download")
  };
  bullets?: string[]; // teaser bullet list rendered before the form (what the asset covers), verbatim config copy
  fields?: ("phone" | "message")[]; // optional extra form fields; name and email are always on
  submitLabel?: string; // default "Get the download"
  successMessage?: string; // default "Thanks. Your download is ready below."
  source?: string; // explicit lead source override; default "content-gate:<id>" when id is set, else "content-gate"
}

// --- Expressive pack: storyGraph (config-driven node-graph narrative) ---
// One node in a storyGraph diagram. Everything is config copy; the engine bakes no node.
export interface StoryGraphNode {
  id: string; // unique handle the edges reference; a duplicate id keeps the FIRST declaration
  label: string; // the node's visible name (real SVG text, read by assistive tech)
  sublabel?: string; // optional second line under the label, in the muted ink
  // Optional per-node fill override, and it WINS over the themed default. Either a raw
  // CSS color ("#c2571a", "rgb(24 48 64)", "tomato") used verbatim, or a CSS custom-
  // property token written with its leading dashes ("--color-accent", "--rl-green-wash")
  // which is wrapped in var() so it tracks the active theme. A value outside the plain
  // CSS-color alphabet is rejected and the themed default stands (lib/story-graph.mjs
  // nodeFillValue), so config can never smuggle arbitrary style text into the SVG.
  color?: string;
}

// One directed edge between two node ids. An edge whose endpoints do not both exist, or
// whose endpoints are the same node, is silently dropped (never a crash, never a broken
// diagram). The optional label renders as small text at the edge midpoint.
export interface StoryGraphEdge {
  from: string;
  to: string;
  label?: string;
}

// The storyGraph section's diagram block (expressive pack). The engine lays the graph out
// automatically by topological depth (sources in the first layer, sinks in the last; the
// deterministic longest-path layering in lib/story-graph.mjs) and renders it as ONE
// server-built inline SVG: zero dependencies, zero client JavaScript. Like every section,
// it is opt-in by construction; it renders only where a page's sections declare it, and a
// config without it is byte-for-byte unchanged.
//
// THEMING: node fill, edge stroke, and label inks derive from the engine's existing
// tokens (--surface, --line, --muted, the two brand colors), so any palette applies with
// no per-site CSS; a node's own `color` (above) wins for that node only.
//
// MOTION, the "current": a small accent-colored pulse travels along every edge path
// (pure CSS stroke-dash animation, no JS). It is decoration (aria-hidden) and it is
// guarded twice: under prefers-reduced-motion the pulse never appears and the COMPLETE
// static graph stands (every node, edge, and label visible), and with JavaScript off the
// same complete graph renders because nothing here needs JS.
//
// LIMITS (graceful, documented): the layout expects a DAG. When the supplied edges form
// a cycle, every node the cycle traps is still placed (in one overflow layer after the
// layered part) and every edge still draws, but the animated current is withheld for the
// whole diagram, since a loop has no start or end for a pulse to travel from. Nothing
// ever crashes the build.
export interface StoryGraphConfig {
  nodes: StoryGraphNode[];
  edges: StoryGraphEdge[];
  // Flow direction. "ltr" (the default) marches layers left to right on wide screens and
  // AUTOMATICALLY re-lays the same graph top to bottom on narrow screens (both layouts
  // are prerendered; a CSS media query picks one, no JS). "ttb" lays top to bottom at
  // every width.
  direction?: "ltr" | "ttb";
  // The animated current pulse. Default ON where motion is allowed (see the MOTION note
  // above; reduced-motion and cyclic graphs never show it). Set false to render the
  // static diagram only, at every preference.
  current?: boolean;
  // Accessible name for the SVG (its <title>, wired via aria-labelledby). Defaults to
  // the section heading, then a neutral "Flow diagram". Supply a real one.
  title?: string;
  // Optional longer accessible description (the SVG <desc>): a sentence walking the flow
  // in words, for a reader who cannot see the diagram. Absent emits no desc.
  description?: string;
}

export interface Section {
  type: SectionType;
  // --- Generic per-section DOM id override (feedback item 7) ---
  // Most section types render on a fixed, conventional id (for example the pricing
  // section's `id="pricing"`) and never read this field. It exists for a section type
  // that has NO single conventional id of its own because a page may render MORE THAN
  // ONE of it - the `addons` section is the first such case. When set, this is used
  // VERBATIM as that section's DOM id. When absent, a type that opts into the
  // mechanism (currently only `addons`, via components/sections/Addons.tsx and
  // lib/section-id.mjs resolveSectionId) computes a DETERMINISTIC auto-suffixed id
  // from the page's own section list instead: the type's base slug (e.g. "addons")
  // for the first section of that type on the page, "<base>-2" for the second,
  // "<base>-3" for the third, and so on, counted by POSITION in document order (never
  // by content, never Math.random()/Date.now()) - so a page with two or more addons
  // sections gets unique ids automatically with zero config, and the SAME config
  // always resolves to the SAME ids. A future section type facing the same
  // more-than-one-per-page problem can reuse this identical field and mechanism
  // rather than inventing another one. Absent renders exactly as before.
  id?: string;
  heading?: string;
  subheading?: string;
  // The section's lead paragraph. Rendered as prose across every surface that shows it
  // (About, Hero, Summary, CTABanner, Faq's intro, and every card/form section's lead
  // line). Supports ONE inline markdown affordance: a well-formed [label](href) link
  // (lib/inline-links.mjs, rendered by components/Prose.tsx), with the destination
  // limited to http(s), mailto, tel, or a root-relative path - anything else (for
  // example javascript:) is left as inert literal text. Plain text with no link syntax
  // renders byte-for-byte as before (no wrapping element, no injected markup). No other
  // markdown here (no bold, no headings); lib/markdown.ts is the full renderer blog
  // article bodies use.
  body?: string;
  // --- Expressive pack: generic presentation VARIANT (one flat opt-in field, following the
  // dusk / gradientPrice / pinned precedent rather than a one-off section type per look).
  // Which variant means what, and which section types honor it (the single source of truth
  // is lib/style-variant.mjs STYLE_HONORS; a type not listed there IGNORES the field safely
  // and renders exactly as before, so a style on the wrong section is never an error):
  //   "ribbon"    - honored by the services feature-card section: a layered card treatment
  //                 where each card gains subtle stacked depth (the v0.21 --rl-shadow tokens)
  //                 and the item's EXISTING FeatureItem.badge text renders as a folded edge
  //                 ribbon on the card's top-right corner (no new content field; a card
  //                 without a badge gets the depth treatment only). All colors derive from
  //                 the theme tokens / two brand colors; hover polish is fine-pointer gated
  //                 and settled by the master reduced-motion guard.
  //   "editorial" - honored by the hero section: an editorial-typography opening. Oversized
  //                 system-serif display headline (ui-serif / Georgia stack, zero font
  //                 downloads), tight leading, the existing subheading styled as a ruled
  //                 eyebrow line, generous measure and whitespace. Changes type and space
  //                 ONLY, never colors, so the base hero's AA contrast holds on both themes;
  //                 entrance motion is not baked in here - compose with craft.heroMotion,
  //                 the existing reduced-motion-guarded, no-JS-safe stagger, if wanted.
  // Default OFF: a section without `style` renders byte-for-byte as before.
  //   "collapse"  - honored by the faq section: each Q/A renders as a native
  //                 <details>/<summary> disclosure (no-JS, progressive). Absent
  //                 style keeps the flat Q/A list byte-identical.
  style?: "ribbon" | "editorial" | "collapse";
  // --- Dusk closing band (harvested from the 2026-07-12 design bundle .dusk descent) ---
  // Opt a closing CTA section into the DUSK band: a dark-in-BOTH-themes surface derived from the
  // two brand colors (never a baked color), for the page's final call to action. Absent renders the
  // section unchanged. Honored by the cta (CTABanner) section.
  dusk?: boolean;
  // --- GBP review ask (honored by the cta section) ---
  // When true, CTABanner also renders the equal public "Leave us a review" link from
  // business.gbp.reviewUrl (fail-closed if reviewUrl is unset/invalid). Never a
  // sentiment-gated funnel — every visitor gets the same public URL.
  reviewAsk?: boolean;
  // hero
  ctaLabel?: string;
  ctaHref?: string;
  backgroundUrl?: string;
  // --- Multi-CTA hero (additive; the single ctaLabel/ctaHref above still works unchanged) ---
  // 1-3 hero CTAs. When present (and non-empty) this REPLACES the single-CTA render; when absent
  // the hero falls back to ctaLabel/ctaHref exactly as before (back-compat).
  cta?: HeroCta[];
  // Optional mono proof-chip row under the hero CTAs (brand-neutral micro-proof: short factual
  // chips, each with a small brand-accent dot). Absent renders nothing.
  proof?: string[];
  // Per-site HERO-VIZ slot: a raw HTML/SVG string the SITE supplies and the engine renders as-is
  // (dangerouslySetInnerHTML) beside the hero copy on wide screens. This is how a site provides its
  // own illustration (for example riselynk.com's dispatch-board composition) without baking any art
  // into the engine. Absent renders nothing and leaves the hero single-column (back-compat). The
  // site owns the markup; the engine only frames it and hides it from assistive tech (aria-hidden).
  heroViz?: string;
  // services (feature cards); see FeatureItem for the optional badge / flagship / mini-visual slot
  items?: FeatureItem[];
  // gallery
  // A caption is OPTIONAL and renders verbatim as visible copy (a <figcaption>, never
  // smuggled into the alt attribute, which stays pure accessibility text). Absent caption
  // on every item renders byte-identical to the pre-caption gallery (lib/gallery.mjs
  // resolveGalleryModel, feedback item #18). Nothing here is invented: a caption is only
  // ever what the config supplies.
  images?: { src: string; alt: string; caption?: string }[];
  // Before/after work pairs (feedback item #18): a brand-neutral alternative to the
  // elevator-only modGallery section (Project/equipmentClass etc, see that type's doc
  // comment) so a visual trade (roofing, tree work, pressure washing) can show a job's
  // before/after without borrowing elevator-modernization vocabulary. Lives on the SAME
  // `gallery` section as the plain image grid (renders after it, both optional and
  // independent) rather than as a new SectionType, since it is just another way to show
  // photos on the gallery block. Resolved by lib/gallery.mjs resolveGalleryModel, which
  // drops any pair missing a required src/alt (a missing image is a broken render, not a
  // wrong claim, so only that pair is withheld, never the whole gallery) and passes
  // caption/note through verbatim (claims wall: nothing here is invented). Absent renders
  // nothing extra; the plain `images` grid above is unaffected either way.
  pairs?: {
    before: { src: string; alt: string };
    after: { src: string; alt: string };
    caption?: string; // short line under the pair, e.g. the job name
    note?: string; // optional second line, e.g. a date or scope note
  }[];
  // Tag labels for each half of a `pairs` entry. Default "Before" / "After" when absent,
  // so an existing config (or one that never sets these) is unaffected; set to relabel for
  // a trade's own vocabulary (for example "Start" / "Finish") without changing the pair
  // shape. Brand-neutral: no wording is baked in beyond the plain English default.
  beforeLabel?: string;
  afterLabel?: string;
  // testimonials. A quote may carry the REAL star value its reviewer gave (claims wall,
  // same discipline as RatingFacts: config-supplied only, never synthesized); a quote
  // with a rating renders a star row, a quote without one renders exactly as before.
  quotes?: { quote: string; author: string; role?: string; rating?: number }[];
  // Live business-reviews block (local-trades conversion batch, deliverable 2). When true
  // the testimonials section renders, after any configured quotes, the business.rating
  // summary line with stars (only when the rating passes the ratingIsValid claims wall)
  // and the business.reviews items as quote cards. Default OFF: a section without the
  // flag renders byte-for-byte as before, and with no valid rating and no reviews the
  // flag renders nothing extra. Every star value comes from config; nothing is invented.
  showBusinessReviews?: boolean;
  maxBusinessReviews?: number; // cap the listed business reviews (default all)
  // leadform (lead-gen), classic FIXED enum. "building" (feedback item #24: property address)
  // reuses the SAME canonical field the elevator-contractor RequestService form already posts and
  // lib/contact-intake.mjs already validates, labels, and emails ("Building") - no intake
  // change needed, just exposing the existing field as a leadform opt-in. This enum is
  // intentionally small and fixed; a section that needs a field OUTSIDE it (an urgency select, a
  // budget range, vehicle year/make/model, or anything else) declares `formFields` (LeadField[])
  // instead, which is the general vocabulary seam, see LeadField's doc comment and
  // npm run test:lead-fields. The two are not combined: a section with `formFields` renders the
  // enhanced variant below and this fixed enum does not apply to it.
  fields?: ("phone" | "service" | "preferredTime" | "building" | "message")[];
  services?: string[]; // options for the "service needed" select
  submitLabel?: string;
  successMessage?: string;
  // --- Modal request-access variant (harvested from the 2026-07-12 design bundle) ---
  // Additive + progressive-enhancement. A leadform section stays the classic inline form unless
  // it opts in here; setting `modal: true` (or declaring `formFields`) renders the enhanced
  // variant - EITHER ALONE is enough (a section that declares `formFields` without `modal: true`
  // still renders the enhanced RequestAccessForm component, not the classic form below; there is
  // no third "inline enhanced, never a modal" variant). CRITICAL no-JS contract: the enhanced
  // variant SERVER-RENDERS the same form INLINE with a native action/method, so with JavaScript
  // OFF it is a normal inline form (a <noscript> style strips the modal chrome) that still POSTs a
  // lead through the save-first intake (never a dropped lead). Only once JS mounts does it become
  // a focus-trapped modal (scrim + blur, focus trap, Escape, focus return, body scroll lock,
  // aria-modal + aria-labelledby) opened by a trigger button. The classic leadform (no `modal`, no
  // `formFields`) is byte-for-byte unchanged.
  modal?: boolean; // opt into the modal-enhanced request-access variant
  modalTriggerLabel?: string; // trigger-button label (defaults to submitLabel, then "Request access")
  // Rich declarative field set for the request-access variant (see LeadField). When present it
  // REPLACES the fixed field enum for this section; known names map to intake columns, the rest
  // fold into the message body. Absent (with `modal: true`) falls back to a sensible default set.
  formFields?: LeadField[];
  // Optional success celebration for the lead/contact forms. Default OFF: the only
  // value is "confetti", and a config without the flag renders and builds exactly as
  // before. When set, the form-success path lazy-loads the engine's vendored
  // first-party canvas-confetti script (public/vendor/canvas-confetti-1.9.3.min.js,
  // ISC; provenance in public/vendor/canvas-confetti-LICENSE.md), feature-detects
  // window.confetti, honors prefers-reduced-motion, and fails silently offline.
  // Same-origin only (zero third-party network) and no new runtime npm dependency.
  celebrate?: "confetti";
  // booking (lead-gen) - a scheduler embed (Cal.com / Calendly)
  bookingUrl?: string;
  // products (simple-commerce)
  products?: Product[];
  // quote-only catalog fallback: unpriced products in this section link here (their per-
  // product ctaHref wins if set). Set this to the quote/contact page for a catalog-now,
  // pay-later site (the most common brochure-with-catalog intent).
  quoteHref?: string;

  // pricing (software archetype): the plan set; feeds the SoftwareApplication Offer JSON-LD
  tiers?: PricingTier[];
  // R5.1 sanctioned gradient-text exception: when true, the HIGHLIGHTED tier's price renders with
  // a gradient clip (background-clip: text) derived from the two brand colors; every other plan
  // stays solid. Default OFF, so a pricing section is unchanged unless it opts in.
  gradientPrice?: boolean;

  // addons (feedback item 7): the add-on / priced-menu item list; see AddonItem above. A
  // DIFFERENT field from `tiers` above, on purpose, so an addons section can never be
  // mistaken for a pricing section by any collector that (correctly) checks the field
  // instead of the type. Renders on its own id (see Section.id above); emits no JSON-LD.
  addonItems?: AddonItem[];

  // directory (teardown 2026-07-24): dense resource / link-directory entries. Named
  // `directoryItems` (not `items`) so it never collides with the services FeatureItem[]
  // field. Absent / empty renders nothing. Emits no JSON-LD.
  directoryItems?: DirectoryItem[];

  // featureMatrix (teardown P2 7g): column headers + capability rows. Absent /
  // empty columns or rows renders nothing. Emits no JSON-LD.
  matrixColumns?: string[];
  matrixRows?: FeatureMatrixRow[];

  // pricing (teardown P2 2a): optional cross-tier comparison matrix under the
  // plan cards. Cells align to `tiers[]` by index. Absent keeps cards-only output
  // byte-identical. Does not feed Offer JSON-LD (tiers still do).
  comparisonRows?: PricingComparisonRow[];

  // videoEmbed (teardown P2 7j): allowlisted privacy-first embed. Absent / a
  // rejected src renders nothing (fail-closed). Emits no JSON-LD. Requires a
  // matching `security.frameSrc` origin for the iframe host.
  video?: VideoEmbedConfig;

  // --- v0.2.0 elevator-contractor ---
  // contractorServices
  serviceLines?: ServiceLine[];
  // trustBar
  trust?: TrustFacts;
  // requestService: posts to intakeUrl (the tenant portal-intake path) when set; falls
  // back to a mailto to intakeEmail otherwise. Reference-number copy shows ONLY when
  // intakeUrl is set (nothing to reference when it is a mailto). Reuses fields/services.
  intakeUrl?: string;
  intakeEmail?: string; // mailto target when intakeUrl is unset (defaults to business.email)
  referenceNote?: string; // honest wording shown only when intakeUrl is wired
  // portalDoor
  portalUrl?: string; // deep-link to the tenant's tokenized customer portal
  screenshotUrl?: string; // screenshot slot

  // --- v0.2.0 GEO pack ---
  // summary (answer-first): label + intro (body) + ordered points
  summaryLabel?: string;
  // Each point supports the SAME inline [label](href) link syntax as `body` above (see
  // that field's doc comment, and components/Prose.tsx / lib/inline-links.mjs); a point
  // with no link syntax renders byte-for-byte as before.
  points?: string[];
  ordered?: boolean; // render points as an ordered list (default true for summary)
  // faq (visible copy AND FAQPage JSON-LD from this one array => structural parity)
  faqs?: FaqItem[];

  // --- v0.2.0 optional sections ---
  careers?: CareersConfig;
  records?: RecordsConfig;
  enabled?: boolean; // optional-section off-switch (modGallery/records/careers)
  projects?: Project[]; // modGallery

  // --- serviceArea (local-trades conversion batch) ---
  // The structured service-area list. Each entry is a config-supplied place name with an
  // optional supporting note, rendered verbatim (claims wall: the engine invents no coverage).
  // These areas ALSO feed the areaServed JSON-LD on the org and Service nodes and the llms.txt
  // "Areas served" line via ONE collector (lib/area-ld.mjs), so the visible and machine
  // surfaces cannot drift. Structured areas win over the legacy business.serviceArea string in
  // the JSON-LD; a config without a serviceArea section is byte-for-byte unchanged.
  areas?: { name: string; note?: string }[];

  // contentGate: the gated asset + form surface (see ContentGateConfig above; the section's
  // heading/subheading/body carry the visible teaser copy, as everywhere else in the engine)
  gate?: ContentGateConfig;

  // storyGraph: the node-graph diagram block (see StoryGraphConfig above; the section's
  // subheading/heading/body carry the surrounding copy, as everywhere else in the engine)
  storyGraph?: StoryGraphConfig;

  // --- R5 scrollNarrative ---
  // A pinned scroll-narrative (harvested structural craft, spec landing-machine-room-craft.md):
  // a sticky-stage track of threshold scenes driven by a passive scroll listener plus rAF, no
  // wheel or touch interception. It degrades to a stacked, readable step timeline under no-JS,
  // prefers-reduced-motion, and narrow screens. `scenes` is the ordered set; an empty/absent
  // array renders nothing. `subheading`/`heading` label the section.
  scenes?: NarrativeScene[];
  // R5.1: whether the scroll narrative uses the pinned scroll-driven stage. Default TRUE (back-
  // compat: an existing scrollNarrative keeps its pinned behavior). Set false to ALWAYS render the
  // calm stacked step-timeline fallback (every scene caption and video kept) with NO scroll
  // pinning or hijack, the flow that Josh's marketing site wants.
  pinned?: boolean;
}

export interface PageConfig {
  slug: string; // "" for the home page, e.g. "services", "about", "contact"
  title: string; // SEO <title>
  description: string; // SEO meta description
  nav?: string; // nav label; omit to hide the page from the nav
  // A draft page is public but NOT indexed and NOT listed, mirroring the existing
  // Article.draft idiom (see publishedArticles below). Mirroring the article's badge
  // too, [slug]/page.tsx (and app/page.tsx for a draft home page) render a small
  // "Draft preview" notice above the page's sections.
  //
  // Set true and the page:
  //   - carries robots:noindex on THAT page (app/[slug]/page.tsx / app/page.tsx),
  //     regardless of the site-level seo.draft/domain state;
  //   - is excluded from app/sitemap.ts;
  //   - is excluded from navPages (drops out of the header/footer nav, same as an
  //     un-navved page - nav is the page index, and a draft is not yet part of it);
  //   - is excluded from every site.pages walk that feeds a machine-readable, claims-
  //     walled surface: lib/llms.ts (llms.txt), lib/services.ts allServiceLines (also
  //     folded into the sitewide JSON-LD @graph, lib/seo.ts siteGraphLd), and
  //     lib/area-ld.mjs collectServiceAreas (also folded into areaServed JSON-LD) - a
  //     draft page's services/areas never leak into an AI-facing or structured-data
  //     surface before the page itself is approved.
  // The page still generates its own static route (generateStaticParams keeps every
  // page, draft or not) and stays fully reachable at its direct URL for review - this
  // closes the gap where the only "dark" page mechanism was dropping a static file into
  // public/ outside the config entirely. Absent (or false): byte-identical to today.
  draft?: boolean;
  // --- Per-service detail page (feedback item #19) ---
  // Marks this page as THE detail page for one service: "one quality indexable page per
  // service is the standard trades SEO lever and the only legitimate home for organic
  // review stars (Service/Product schema)". Item #25 (FeatureItem.href / ServiceLine.href)
  // already shipped the linking seam into a page like this; this block is the SEO layer
  // that makes the page a real Service node once it exists, keyed by the page's OWN URL
  // (a distinct @id from the sitewide per-ServiceLine Service nodes lib/seo.ts siteGraphLd
  // already emits without one - the two coexist by design, see lib/service-page-ld.mjs).
  // `name` defaults to the page title; `key` mirrors ServiceLine.key (feeds the node's
  // serviceType); `rating`/`reviews` are the SAME claims-walled shapes the business node
  // uses (RatingFacts/ReviewItem, see lib/rating-ld.mjs) and are the legitimate home for
  // per-service review stars the feedback names - never invent either. A page without
  // this block renders byte-identical to today (no Service node, no rating, nothing new).
  service?: {
    name?: string;
    key?: "maintenance" | "repair" | "modernization" | "periodicTesting" | (string & {});
    rating?: RatingFacts;
    reviews?: ReviewItem[];
  };
  sections: Section[];
}

export interface SocialLink {
  label: string;
  href: string;
}

// --- v0.2.0 hosted blog (decision 6: hosted-only, no external CMS) ---
// An article is either markdown (`body`) or structured GEO blocks (`summary` + `faqs`),
// or both. `draft: true` sets noindex and drops the article from the index, but it stays
// reachable at its direct URL for review (mirrors the riselynk.com blog draft idiom).
export interface Article {
  slug: string;
  title: string;
  description: string;
  eyebrow?: string;
  date?: string; // ISO date; used for sitemap lastmod and display
  author?: string;
  lede?: string;
  draft?: boolean;
  // Blog index organization (teardown P2 6a). Both optional and default OFF: a
  // blog whose articles omit them keeps the flat index layout. `category` groups
  // the index (and can drive a filter chip); `featured` promotes one (or more)
  // articles into a lead slot above the grouped list. Read-time still comes from
  // lib/read-time.mjs (P1) - nothing duplicated here.
  category?: string;
  featured?: boolean;
  // answer-first block (same shape the `summary` section renders)
  summary?: { label?: string; intro?: string; points?: string[]; ordered?: boolean };
  body?: string; // markdown main content (rendered by lib/markdown.ts, zero deps)
  faqs?: FaqItem[]; // FAQ block; the FAQPage JSON-LD mirrors these verbatim
}

export interface BlogConfig {
  title?: string;
  description?: string;
  articles: Article[];
  // Optional preferred category order for the index. Categories not listed still
  // appear after these, in first-seen order. Absent = first-seen order only.
  categoryOrder?: string[];
}

// --- R5 (v0.12) design-system structural craft (unification program section 2.9) ---
// Brand-neutral, config-gated STRUCTURAL patterns harvested from riselynk.com's machine-room
// landing (spec RiseLynk/docs/specs/landing-machine-room-craft.md). STRUCTURE only, never the
// green palette, brand SVGs, or copy (those stay per-site config). Every pattern defaults OFF,
// so a site that does not opt in is byte-for-byte unchanged. Each honors the two-color contract,
// deriving its surface from brand.colors.primary / accent, and adds ZERO runtime libraries
// (pure CSS, inline data URIs, and one small progressive-enhancement effect).
export interface CraftConfig {
  // The one-light machine-room backdrop: a single overhead key-light radial plus a multi-stop
  // dark gradient behind all content. Switches the page onto a dark surface DERIVED from the two
  // brand colors (the surface tokens remap in ONE place, so every existing section stays legible
  // without per-section work). `true` uses the defaults; the object tunes where the light sits.
  oneLight?:
    | boolean
    | {
        keyX?: string; // key-light horizontal center (default "62%")
        keyY?: string; // key-light vertical center (default "-12%")
      };
  // Film-grain dither: a stitched-tile fractalNoise layer at low opacity that dithers the dark
  // gradient so it does not band (the banding fix). Inline SVG data URI, zero network requests.
  // Meaningful on a dark surface (pairs with oneLight); on a light site it reads as faint paper
  // texture. `true` uses 0.05 opacity; the object tunes it.
  grain?: boolean | { opacity?: number };
  // Self-hosted display + mono type pairing (Barlow + IBM Plex Mono, SIL OFL 1.1, subset woff2
  // in public/fonts/, preloaded, font-display: swap). ZERO third-party requests. Default OFF
  // keeps the engine on its system-font stack (which is itself already zero-third-party), so a
  // site that does not opt in issues no font request at all.
  fonts?: boolean;
  // --- R5.1 craft + motion layer (harvested from the 2026-07-12 design bundle) ---
  // All default OFF. Each token below is added to the <html data-craft> attribute so the
  // [data-craft~="..."] rules in app/globals.css key off it; a site that omits craft (or a
  // given flag) emits no token and is byte-for-byte unchanged.
  //
  // glassHover card treatment: card-like surfaces go translucent + backdrop-blur(12px)
  // saturate(1.4) on hover with a pointer-tracked radial glow, FINE-POINTER ONLY (degrades to a
  // static card on coarse / no-hover) and reduced-motion safe. The glass/shadow tokens it reads
  // (--rl-glass-* / --rl-shadow-*) come from the theme layer when a `theme` block is present, and
  // otherwise from defaults derived from the two brand colors (app/globals.css :root), so a plain
  // trade site gets glass for free from its two colors. data-craft token "glass".
  glass?: boolean;
  // Aurora: slow-drifting brand-tinted hero blobs behind the hero content (GPU-cheap, transform
  // only, no JS). Derived from the two brand colors; settled to a static state by the master
  // reduced-motion guard. Rendered only on the plain (non-image) hero. data-craft token "aurora".
  aurora?: boolean;
  // Magnetic CTAs: primary buttons translate a maximum of 3px toward a FINE pointer, spring back
  // on leave. Skipped entirely under reduced motion and on coarse pointers. data-craft token
  // "magnetic".
  magneticCta?: boolean;
  // Hero motion: the hero children rise in with a staggered delay and the h1 gains an accent
  // underline that draws in once. Pure CSS, no-JS safe (the initial hidden state is scoped to
  // prefers-reduced-motion: no-preference, so reduced motion shows everything). data-craft token
  // "hero-motion".
  heroMotion?: boolean;
}

// --- Dual-theme layer (G1 toggle + G2 per-theme palette; founder-approved 2026-07-12) ---
// The full rich-token set for ONE theme (light or dark). Names and values mirror the design
// bundle (RiseLynk design.config.json themes.light / themes.dark) EXACTLY, so a palette copied
// from there is byte-matched into CSS custom properties (each emitted as `--rl-<kebab>`). Every
// field is optional: a partial palette is completed by the zero-config derive (deriveTokens in
// lib/theme-tokens.mjs) from the two brand colors, and an absent palette derives entirely.
// grainOpacity is a plain number-as-string ("0.05"); the rest are CSS colors / gradients.
export interface ThemeTokens {
  bg?: string;
  bg2?: string;
  card?: string;
  card2?: string;
  line?: string;
  line2?: string;
  ink?: string;
  dim?: string;
  faint?: string;
  green?: string;
  greenHover?: string;
  onGreen?: string;
  greenWash?: string;
  danger?: string;
  pageBleed?: string; // the page-bleed background gradient (a linear-gradient string)
  heroGlow?: string; // the overhead key-light radial (a radial-gradient string)
  grainOpacity?: string; // grain dither opacity for this theme, e.g. "0.03"
  // --- R5.1 grouped craft tokens (glass / shadows / status) ---
  // Each group is optional; an omitted group (or an omitted field within it) is completed by the
  // zero-config derive from the two brand colors (deriveGroupTokens in lib/theme-tokens.mjs), so a
  // site gets glass, depth, and status chips for free, and a brand that wants an exact surface
  // supplies them here. Emitted as --rl-glass-* / --rl-shadow-* / --rl-status-* per theme.
  glass?: {
    fill?: string; // the translucent card fill (backdrop-blur sits behind it)
    edge?: string; // the inset top-edge highlight
    lineTop?: string; // the lit top border color
    glow?: string; // the pointer-tracked radial glow color
  };
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
  // Each status is a [ink, bg] pair (foreground text, chip background), mirroring the design
  // bundle's themes.*.status. amber / blue / green / red are the four canonical semantic hues.
  status?: {
    amber?: [string, string];
    blue?: [string, string];
    green?: [string, string];
    red?: [string, string];
  };
}

// The optional theme block. ABSENT means the engine builds exactly as before (no data-theme,
// no token sheet, no toggle, no boot script): fully additive. When `enabled`, the engine
// server-renders a token sheet (per-theme --rl-* tokens plus the alias bridge onto the engine
// aliases), a pre-paint boot script, and a 44px nav moon/sun toggle. See lib/theme-tokens.mjs.
export interface ThemeConfig {
  enabled?: boolean;
  // The marketing default. "light" is the default marketing surface; "dark" opens on the
  // machine-room surface; "system" follows prefers-color-scheme and emits NO SSR data-theme
  // (the boot script sets it pre-paint) so the media query can fire. Defaults to "light".
  default?: "light" | "dark" | "system";
  // Explicit per-theme token sets, used VERBATIM when present (byte-match). Omit a side (or the
  // whole block) to derive it from the two brand colors; derived DARK is WCAG-AA clamped and
  // APPROXIMATE. A HYBRID is fine: supply the side you want exact, derive the other.
  palette?: {
    light?: ThemeTokens;
    dark?: ThemeTokens;
  };
  // Optional override of the <meta name="theme-color"> values. Defaults to the contract colors
  // (#fafaf7 light / #0f1412 dark); the toggle keeps this in step with the active theme.
  metaColor?: {
    light?: string;
    dark?: string;
  };
}

// --- Header-nav chrome (harvested from the 2026-07-12 design bundle nav condense + progress) ---
// All optional and default OFF: a config that omits `nav` (or a given flag) renders the header
// exactly as before. Brand-neutral: the condense geometry and the progress hairline derive from
// the two brand colors, nothing is baked.
export interface NavConfig {
  condense?: boolean; // header condenses (64->56px + a tighter shadow) past a small scroll threshold
  progress?: boolean; // top scroll-progress hairline (pure CSS scroll-driven; hidden where unsupported / reduced-motion)
  blogLabel?: string; // include the /blog route in the header nav with this label (only when the blog publishes)
}

// One utility link in the footer (Privacy / Cookies / Pitch, and the like). Fully config-driven.
export interface FooterLink {
  label: string;
  href: string;
}

// --- Footer legal line + utility links (feedback item) ---
// All optional and default OFF: a config that omits `footer` renders the existing footer (brand
// name + nav) byte-for-byte unchanged. Brand-neutral throughout.
export interface FooterConfig {
  legalName?: string; // legal entity line used in the footer copyright (e.g. "Maxwell Industries LLC"); defaults to business.name
  links?: FooterLink[]; // utility links rendered as a footer nav (e.g. Privacy / Cookies / Pitch)
  dusk?: boolean; // render the footer on the dusk (dark-in-both-themes) band derived from the brand colors
  // --- Footer logo slot (logo-surface feedback item #2) ---
  // The footer has no logo slot by default: it renders the plain <strong>{business.name}</strong>
  // text block, unchanged, when this is unset. Set `logoUrl` to render a logo image in the footer
  // brand block, ahead of the name. This is a SEPARATE asset from `brand.logoUrl` (a footer mark
  // is often a simpler single-color variant) rather than an automatic reuse of the header logo, so
  // a site can supply one without the other. When `brand.logoReplacesName` is also set, this image
  // replaces the footer name text too (see the coherence note on that flag); without a `logoUrl`
  // here, the footer name text is unaffected no matter how the header is configured.
  logoUrl?: string;
  // The dark-theme counterpart to `logoUrl`, same per-theme-variant mechanism as
  // `brand.logoUrlDark` (see that field's doc comment): inert without both a `theme` block and a
  // `logoUrl` here, otherwise both images render server-side and pure [data-theme] CSS picks one.
  logoUrlDark?: string;
}

// Structured weekly hours (engine feedback #27). One entry per opens/closes window,
// applied to every day it lists; a day may appear in more than one entry (a split
// schedule like Mon-Fri 08:00-12:00 plus Mon-Fri 13:00-17:00). Exactly one of
// `allDay: true` or an `opens` + `closes` pair ("HH:MM", 24-hour); `closes` earlier
// than `opens` is an overnight window per the schema.org convention. Validated
// fail-closed in lib/hours-ld.mjs: one malformed entry withholds the WHOLE schedule
// from every surface (a partial week reads as a wrong claim), and the legacy
// free-form `business.hours` string takes over as the fallback.
export interface OpeningHoursItem {
  days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
  opens?: string; // "HH:MM" 24-hour, e.g. "08:00"
  closes?: string; // "HH:MM" 24-hour, e.g. "17:00"
  allDay?: boolean; // open around the clock on these days (replaces opens/closes)
}

// Sitewide announcement bar (engine feature-backlog #26). Brand-neutral: no copy is baked
// in. `enabled` defaults true when the block is present, so a config that supplies the block
// with a text and a window turns it on. start/end are REQUIRED (a notice with no expiry is a
// permanent claim; the window is the point of the feature) and inclusive; a bare "YYYY-MM-DD"
// spans that whole UTC day. A malformed or inverted window fails closed (the bar never
// renders). `dismissible` defaults ON; a dismissal persists in localStorage keyed to `id`
// (or a hash of the text), so replacing the announcement re-shows it. See lib/announcement.mjs.
export interface AnnouncementConfig {
  enabled?: boolean; // default true when the block is present; set false to keep it off
  text: string; // the notice copy (claims-linted at build time)
  startDate: string; // ISO date/timestamp; the bar shows from here (required)
  endDate: string; // ISO date/timestamp; the bar auto-hides after here (required, inclusive)
  href?: string; // optional call-to-action link target
  linkLabel?: string; // link text when href is set (default "Learn more"; claims-linted)
  dismissible?: boolean; // default true; a dismiss button with a localStorage ack
  dismissLabel?: string; // accessible label for the dismiss button (default "Dismiss announcement")
  id?: string; // stable dismissal key; defaults to a hash of the text so new copy re-shows
}

export interface SiteConfig {
  // Which archetype this site is. Drives the JSON-LD graph: LocalBusiness for the
  // elevator-contractor, and an ADDED SoftwareApplication node for "software" (a SaaS
  // product; see the `software` block below). Informational elsewhere. Omit for a plain
  // brochure. Additive: a config that does not set "software" emits no SoftwareApplication.
  archetype?: Archetype;
  business: {
    name: string;
    tagline?: string;
    phone?: string;
    email: string; // contact form submissions go here
    address?: string; // free-form display address (footer, contact page)
    serviceArea?: string;
    hours?: string;
    // Structured weekly hours (engine feedback #27), additive and default OFF. When
    // supplied and valid, ONE source feeds three surfaces: openingHoursSpecification on
    // the LocalBusiness JSON-LD node, the llms.txt "Hours" line, and the visible Contact
    // hours line (all via lib/hours-ld.mjs, so they cannot drift); the legacy free-form
    // `hours` string above is then ignored on those surfaces. Absent, everything renders
    // byte-for-byte as before. JSON-LD note: openingHoursSpecification is a
    // LocalBusiness/Place property, so it surfaces in the @graph only when the org node
    // IS a LocalBusiness (the elevator-contractor archetype, or any site that supplies
    // `location` below); a plain Organization keeps its graph unchanged while llms.txt
    // and the Contact section still render the structured line.
    openingHours?: OpeningHoursItem[];
    // The feedback's emergency flag: the business ATTESTS its line is answered around
    // the clock (the same statement callBar.dispatchRouted words as "any hour"). With a
    // `phone` supplied, the org JSON-LD node gains an emergency ContactPoint with
    // around-the-clock hoursAvailable, and llms.txt gains an emergency line. Claims
    // wall: this is the config's own statement, never an engine inference; without a
    // phone, or absent, nothing is emitted.
    emergency247?: boolean;
    // Optional LocalBusiness subtype (engine feedback item #29), e.g. "Plumber" or
    // "Electrician", so a trade site's structured data names its actual trade instead
    // of the plain "LocalBusiness" the engine otherwise emits. Checked against the
    // allowlist in lib/business-type.mjs (BUSINESS_SCHEMA_TYPES): the match is exact,
    // case-sensitive, and untrimmed (resolveBusinessType), because "an allowlist
    // mistake ships wrong structured data silently" is exactly the risk this field
    // must not reintroduce. An unset, unknown, wrong-case, or padded value falls back
    // to today's LocalBusiness/Organization "@type" logic byte-for-byte; nothing about
    // this field can flip a plain Organization site into a LocalBusiness by itself, so
    // it applies only when the org node already qualifies as LocalBusiness (the
    // elevator-contractor archetype, or a site that supplies `location` above), and the
    // hours/JSON-LD gating that keys off that same LocalBusiness-ness is untouched.
    schemaType?: string;
    socials?: SocialLink[];
    mapEmbedUrl?: string; // Google Maps embed src
    autoReply?: { subject: string; body: string }; // lead-gen autoresponder to the lead
    // Structured address for JSON-LD (local-SEO signal). Expose only city/region/country
    // for a home-based business; never the exact residential street address.
    location?: {
      locality?: string;
      region?: string;
      country?: string;
      postalCode?: string;
    };
    // Optional REAL aggregate rating + reviews for the business itself (feature-backlog #2,
    // claims-walled, see RatingFacts). When present, the Organization/LocalBusiness JSON-LD
    // node carries AggregateRating / Review. Emit only ratings the business actually holds;
    // never synthesize a number.
    rating?: RatingFacts;
    reviews?: ReviewItem[];
    // Google Business Profile (Local Pack alignment). Default OFF / unset on templates;
    // readiness WARNs when unset on a local-SEO site. See GbpConfig.
    gbp?: GbpConfig;
  };
  brand: {
    colors: {
      primary: string;
      accent: string;
      bg?: string;
      text?: string;
    };
    font?: "sans" | "serif";
    logoUrl?: string;
    // --- Logo-surface feedback items (header logo-replaces-name, per-theme variant). All
    // optional and default OFF: a config that sets neither renders the header byte-for-byte
    // unchanged (logo image beside the business-name text, same as today). See lib/brand-logo.mjs
    // (resolveHeaderLogo / resolveFooterLogo) for the shared resolution logic these drive.
    //
    // When `logoUrl` IS the business's wordmark, showing it beside <span>{business.name}</span>
    // in the header duplicates the name. Set this true to have the header logo image REPLACE the
    // visible name text; the image is then no longer decorative, so its alt text becomes
    // business.name (accessibility is preserved, just moved from text to alt). Also governs the
    // footer name text (FooterConfig), but ONLY once the footer has its own `footer.logoUrl` to
    // replace it with - a footer with no logo asset keeps its name text regardless of this flag.
    logoReplacesName?: boolean;
    // A dark-theme counterpart to `logoUrl`, for a site that also enables the `theme` block. An
    // <img> (SVG or raster) always renders its own colors; it does not follow the site's
    // [data-theme] toggle the way CSS-driven surfaces do. When this is set AND the theme block
    // is enabled, both the light and dark images are server-rendered (no flash, works with the
    // pre-paint boot script) and pure CSS in app/globals.css keyed off [data-theme] on <html>
    // shows exactly one. Absent, or on a site with no `theme` block, this is fully inert: the
    // header renders the single `logoUrl` image exactly as before. This holds for any `theme.default`
    // including "system": the boot script resolves [data-theme] before first paint in every case
    // (an explicit default is server-rendered on <html>, "system" is resolved client-side pre-paint),
    // so the correct logo is already showing at first paint either way; only with JavaScript disabled
    // does the site fall back to the light image regardless of the OS color scheme. JSON-LD (lib/seo.ts
    // organizationLd) always uses `logoUrl` only, the canonical light asset - structured data has
    // no theme concept, so it never reads this field.
    logoUrlDark?: string;
    // Browser-tab / home-screen icons (feature-backlog #1). Point at an asset in public/
    // (e.g. "/favicon.ico", "/icon.png"), an absolute URL, or a data: URI. When unset the
    // site keeps Next's default favicon, so this is fully additive: a config without it is
    // unchanged. Wired into the document head by app/layout.tsx (Metadata.icons).
    faviconUrl?: string; // rel="icon" (the browser tab)
    appleTouchIconUrl?: string; // rel="apple-touch-icon" (iOS home screen)
  };
  seo: {
    domain?: string; // e.g. https://clientbusiness.com
    titleSuffix?: string;
    ogImage?: string;
    // A draft build is public but NOT indexed: robots.txt disallows all and every page
    // carries robots:noindex. A build with no `domain` is treated as draft automatically
    // (a client-review deploy on a *.vercel.app alias), so a not-yet-live brand stays out
    // of search; set `draft: true` to force noindex even when a domain is set.
    draft?: boolean;
    // AI crawler policy for robots.txt (trust pack). Default "split": disallow
    // training/bulk-scrape agents (GPTBot, ClaudeBot, Google-Extended, CCBot,
    // Bytespider, ...) while leaving citation/search agents (OAI-SearchBot,
    // PerplexityBot, ChatGPT-User, ...) under the generic Allow so /llms.txt
    // discovery still works. Set "block" to also disallow citation agents
    // (understand the discoverability cost). robots.txt is advisory; real
    // enforcement is Cloudflare's zone-level AI scraper toggle when the site
    // is on Cloudflare DNS. See lib/ai-robots.mjs.
    aiCrawlers?: "split" | "block";
    // Emit conventional TDM reservation + noai/noimageai meta tags on indexable
    // builds (default ON). These are voluntary machine-readable preferences, NOT
    // a legal shield. Set false to suppress. See lib/ai-robots.mjs.
    aiMetaSignals?: boolean;
  };
  analytics?: {
    // Recommended default: free, cookieless Cloudflare Web Analytics. Does NOT
    // require the site to be on Cloudflare DNS (manual JS beacon). Does NOT set
    // cookies, so cookieNotice can stay OFF for analytics-only sites. CSP:
    // next.config.ts adds script-src https://static.cloudflareinsights.com and
    // connect-src https://cloudflareinsights.com only when this token is set.
    cloudflareToken?: string;
    plausibleDomain?: string; // paid privacy analytics (optional alternative)
    gaId?: string; // GA4 measurement id (sets cookies; turn cookieNotice on)
  };
  commerce?: {
    currency?: string; // default "usd"
    successPath?: string; // default "/success"
    cancelPath?: string; // default "/cancel"
  };
  // --- v0.2.0 ---
  // Persistent, mobile-first tap-to-call bar (fixed to the bottom of every page). Reads
  // business.phone and publishes it as a tel: link. Brand-neutral and config-driven: the
  // default call-to-action is a plain prompt to call (lib/trust.mjs), and any site can
  // override it via `label`. `dispatchRouted` only nuances the hours wording; it never
  // changes the number. A config that omits callBar renders no bar (additive).
  callBar?: {
    enabled?: boolean;
    label?: string; // override the default line (any trade-specific copy lives here, not the engine)
    regionLabel?: string; // accessible region/landmark name for the bar (default "Call us"); a site can name it, e.g. an emergency service line
    dispatchRouted?: boolean; // wording only: is this number answered any hour?
    note?: string; // optional small print under the button
    // Optional short noun-phrase for the /llms.txt AI-assistant emergency tip
    // (e.g. "a stopped elevator with someone inside", "a burst pipe"). Trade-specific
    // wording lives HERE in config, never in the engine. When absent, llms.txt emits
    // no emergency tip at all (silence beats a wrong vertical claim). See lib/llms.ts.
    emergencyContext?: string;
  };
  blog?: BlogConfig;
  // Header-nav chrome (condense on scroll, a scroll-progress hairline, an optional /blog nav link).
  // Default OFF: a config without `nav` renders the header unchanged. See NavConfig.
  nav?: NavConfig;
  // Footer legal line + utility links (and an optional dusk band). Default OFF: a config without
  // `footer` renders the existing footer unchanged. See FooterConfig.
  footer?: FooterConfig;
  // Informational cookie notice (harvested from RiseLynk's cookie-notice.js).
  // Default OFF; turn it on when the site actually sets cookies (GA4, a Stripe
  // checkout path, etc.). Cloudflare Web Analytics (analytics.cloudflareToken)
  // and Turnstile set NO cookies, so an analytics-only + Turnstile site can
  // leave this OFF. This is an INFORMATIONAL banner with a strictly-necessary
  // framing and a localStorage ack, NOT a consent wall: it informs and dismisses.
  // Its palette reads the two-color contract, so it reskins with the brand. If a
  // site ever adds advertising or tracking cookies, replace it with a real
  // opt-in / opt-out consent UI.
  cookieNotice?: {
    enabled?: boolean;
    // Override the default informational line. The engine default also mentions
    // first-party lead-source capture on form submit (landing page, campaign tags,
    // referring site without its query string). Not a cookie, but collection.
    message?: string;
    buttonLabel?: string; // dismiss button label (default "Got it")
    policyHref?: string; // link to the cookie/privacy page, e.g. "/privacy"
    policyLabel?: string; // link text (default "Cookie notice")
  };
  // Sitewide announcement bar (engine feature-backlog #26). Default OFF: a config without
  // `announcement` renders byte-for-byte as before. A time-bounded, dismissible notice
  // surface (a promotion window, holiday hours, a temporary service advisory) rendered on
  // every page. start/end dates are REQUIRED and the bar auto-hides outside that window
  // (evaluated against the viewer's clock, so a static build expires with no rebuild). The
  // text and link label pass through the SAME banned-phrase claims wall as every other copy
  // surface at build time (next.config.ts); a claims-violating announcement FAILs the build.
  // See AnnouncementConfig and lib/announcement.mjs.
  announcement?: AnnouncementConfig;
  // --- feature-backlog #4: contact-form spam shield ---
  // The lead/contact forms ALWAYS carry a hidden honeypot field (no config needed; a
  // filled trap is dropped server-side in lib/contact-intake.mjs). Turnstile is the
  // privacy-friendly (no-cookie) human check: forms that accept email SHOULD have it on.
  // Set the public siteKey to render the widget on every email intake form (contact,
  // leadform, request-access, content gate, request-service, careers), and set the
  // secret in server env (TURNSTILE_SECRET, never in config) to enforce it on
  // /api/contact and /api/lead. A one-sided deploy (siteKey without secret, or secret
  // without siteKey) fails CLOSED with turnstile_misconfig (503) - never silently
  // accepts unverified leads. Unconfigured (neither) fails open to honeypot-only.
  // Build readiness: next.config.ts WARNs when email intake is live without a siteKey.
  security?: {
    turnstile?: {
      siteKey?: string; // public Cloudflare Turnstile site key; its presence renders the widget
    };
    // Config-extendable CSP connect-src (engine feedback item #31a). The engine's baseline
    // Content-Security-Policy (next.config.ts) hardcodes connect-src to 'self' plus the
    // Cloudflare Turnstile host; a site that ships its own public/ artifact calling an
    // external endpoint (a site-local intake page posting to a control-plane function, for
    // example) needs that endpoint's origin allowed too, or the browser silently drops the
    // request client-side before it ever reaches the network (the ryan-dehart incident this
    // field fixes). Each entry must be a bare https origin - scheme + host + optional port,
    // nothing else: no path/query/hash, no wildcard, no non-https scheme. An entry that fails
    // validation is dropped (not a build failure) and logged loudly by next.config.ts;
    // duplicates against the base directive (including the Turnstile host) are deduped. Absent
    // or empty reproduces today's exact CSP byte-for-byte (additive-versioning contract). See
    // lib/csp.mjs for the validation/build logic and tools/csp.test.mjs for its gate.
    connectSrc?: string[];
    // Config-extendable CSP frame-src (teardown P2 7j, video embeds; also useful for a
    // Cal.com / Calendly booking iframe). Same origin-shape rules as connectSrc
    // (https-only, bare origin, no path/query/hash, no wildcard). The baseline already
    // allows the Cloudflare Turnstile host; a site that embeds YouTube (privacy-enhanced)
    // or Vimeo MUST list that host here or the browser will block the iframe. Absent /
    // empty keeps today's exact frame-src byte-for-byte.
    frameSrc?: string[];
  };
  // --- Phase-A product-marketing layer: software-product archetype tuning ---
  // Set `archetype: "software"` to emit a schema.org SoftwareApplication node in the site
  // @graph (in addition to Organization + WebSite), with its Offer / AggregateOffer built from
  // the pricing tiers in config (lib/offer-ld.mjs, claims-walled). This optional block tunes
  // that node; every field defaults sensibly, so `archetype: "software"` alone is enough.
  // Brand-neutral: no product name or category is baked into the engine. The AggregateRating
  // comes only from business.rating (claims wall). Additive: a config without the software
  // archetype emits no such node.
  software?: {
    name?: string; // product name (defaults to business.name)
    applicationCategory?: string; // schema.org applicationCategory (default "BusinessApplication")
    operatingSystem?: string; // default "Web"
    description?: string; // defaults to business.tagline
  };
  // Design-system structural craft (R5, harvested from riselynk.com). Default OFF: absent
  // means no data-craft attribute, no dark surface, no grain, no font requests, so a config
  // that omits it builds exactly as before. See CraftConfig.
  craft?: CraftConfig;
  // Dual-theme layer (G1 toggle + G2 per-theme palette). Default OFF: absent means no
  // data-theme, no token sheet, no toggle, no boot script, so a config that omits it builds
  // byte-for-byte as before. See ThemeConfig and lib/theme-tokens.mjs.
  theme?: ThemeConfig;
  pages: PageConfig[];
}

// Nav is the page index: a draft page (see PageConfig.draft) is excluded here even when
// it carries a `nav` label, the same way it is excluded from the sitemap and llms.txt.
// It stays reachable at its direct URL; it just is not listed anywhere yet.
export function navPages(site: SiteConfig): PageConfig[] {
  return site.pages.filter((p) => p.nav && !p.draft);
}

export function hrefFor(slug: string): string {
  return slug === "" ? "/" : `/${slug}`;
}

// Does the active site publish a blog? (Index/article routes 404 when it does not.)
export function publishedArticles(site: SiteConfig): Article[] {
  return (site.blog?.articles ?? []).filter((a) => !a.draft);
}
