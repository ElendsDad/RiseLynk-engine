// The contract every part of the engine reads from.
// Per site, you edit a site.config.ts (typed by SiteConfig) and nothing else.
//
// Provenance: extracted 2026-07-10 from
// kitsap-website-creation/templates/brochure/lib/config-schema.ts. The `business.location`
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
  | "scrollNarrative"; // pinned scroll-narrative that degrades to a static step timeline

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

export interface FaqItem {
  q: string;
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
// type, each with its own label and required flag. Field NAMES that match a known intake column
// (name, company, email, phone, units, service, preferredTime, message, building) map straight to
// the save-first lead; every OTHER declared field folds into the message body of that same intake
// (lib/contact-intake.mjs foldExtras), so no structured extra is ever dropped. Brand-neutral and
// fully config-driven: the engine bakes no field, label, or option.
export interface LeadField {
  name: string; // form field name; a known intake column maps directly, anything else folds into the message
  label: string; // visible label
  type?: "text" | "email" | "tel" | "number" | "select" | "checkbox-group" | "textarea";
  required?: boolean;
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
  icon?: string;
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
}

export interface Section {
  type: SectionType;
  heading?: string;
  subheading?: string;
  body?: string;
  // --- Dusk closing band (harvested from the 2026-07-12 design bundle .dusk descent) ---
  // Opt a closing CTA section into the DUSK band: a dark-in-BOTH-themes surface derived from the
  // two brand colors (never a baked color), for the page's final call to action. Absent renders the
  // section unchanged. Honored by the cta (CTABanner) section.
  dusk?: boolean;
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
  images?: { src: string; alt: string }[];
  // testimonials
  quotes?: { quote: string; author: string; role?: string }[];
  // leadform (lead-gen)
  fields?: ("phone" | "service" | "preferredTime" | "message")[];
  services?: string[]; // options for the "service needed" select
  submitLabel?: string;
  successMessage?: string;
  // --- Modal request-access variant (harvested from the 2026-07-12 design bundle) ---
  // Additive + progressive-enhancement. A leadform section stays the classic inline form unless
  // it opts in here; setting `modal: true` (or declaring `formFields`) renders the enhanced
  // variant. CRITICAL no-JS contract: the enhanced variant SERVER-RENDERS the same form INLINE
  // with a native action/method, so with JavaScript OFF it is a normal inline form that still
  // POSTs a lead through the save-first intake (never a dropped lead). Only once JS mounts does it
  // become a focus-trapped modal (scrim + blur, focus trap, Escape, focus return, body scroll
  // lock, aria-modal + aria-labelledby) opened by a trigger button. The classic leadform (no
  // `modal`, no `formFields`) is byte-for-byte unchanged.
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
  points?: string[];
  ordered?: boolean; // render points as an ordered list (default true for summary)
  // faq (visible copy AND FAQPage JSON-LD from this one array => structural parity)
  faqs?: FaqItem[];

  // --- v0.2.0 optional sections ---
  careers?: CareersConfig;
  records?: RecordsConfig;
  enabled?: boolean; // optional-section off-switch (modGallery/records/careers)
  projects?: Project[]; // modGallery

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
  // answer-first block (same shape the `summary` section renders)
  summary?: { label?: string; intro?: string; points?: string[]; ordered?: boolean };
  body?: string; // markdown main content (rendered by lib/markdown.ts, zero deps)
  faqs?: FaqItem[]; // FAQ block; the FAQPage JSON-LD mirrors these verbatim
}

export interface BlogConfig {
  title?: string;
  description?: string;
  articles: Article[];
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
  };
  analytics?: {
    plausibleDomain?: string; // privacy-friendly default (recommended)
    gaId?: string; // GA4 measurement id, if the business wants Google Analytics
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
  };
  blog?: BlogConfig;
  // Header-nav chrome (condense on scroll, a scroll-progress hairline, an optional /blog nav link).
  // Default OFF: a config without `nav` renders the header unchanged. See NavConfig.
  nav?: NavConfig;
  // Footer legal line + utility links (and an optional dusk band). Default OFF: a config without
  // `footer` renders the existing footer unchanged. See FooterConfig.
  footer?: FooterConfig;
  // Informational cookie notice (harvested from RiseLynk's cookie-notice.js).
  // Default OFF; turn it on when the site actually sets cookies (analytics, a
  // Stripe checkout path, etc.). This is an INFORMATIONAL banner with a
  // strictly-necessary framing and a localStorage ack, NOT a consent wall: it
  // informs and dismisses. Its palette reads the two-color contract, so it
  // reskins with the brand. If a site ever adds advertising or tracking cookies,
  // replace it with a real opt-in / opt-out consent UI.
  cookieNotice?: {
    enabled?: boolean;
    message?: string; // override the default informational line
    buttonLabel?: string; // dismiss button label (default "Got it")
    policyHref?: string; // link to the cookie/privacy page, e.g. "/privacy"
    policyLabel?: string; // link text (default "Cookie notice")
  };
  // --- feature-backlog #4: contact-form spam shield ---
  // The lead/contact forms ALWAYS carry a hidden honeypot field (no config needed; a
  // filled trap is dropped server-side in lib/contact-intake.mjs). Turnstile is the
  // optional, privacy-friendly (no-cookie) second layer: set the public siteKey to render
  // the widget, and set the secret in server env (TURNSTILE_SECRET, never in config) to
  // enforce it. OFF by default: with no siteKey the forms are unchanged, so this is fully
  // additive.
  security?: {
    turnstile?: {
      siteKey?: string; // public Cloudflare Turnstile site key; its presence renders the widget
    };
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

export function navPages(site: SiteConfig): PageConfig[] {
  return site.pages.filter((p) => p.nav);
}

export function hrefFor(slug: string): string {
  return slug === "" ? "/" : `/${slug}`;
}

// Does the active site publish a blog? (Index/article routes 404 when it does not.)
export function publishedArticles(site: SiteConfig): Article[] {
  return (site.blog?.articles ?? []).filter((a) => !a.draft);
}
