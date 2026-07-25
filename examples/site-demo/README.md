# site-demo

A neutral demo site (a fictional business, Northgate Home Services) that proves the
config-drives-everything contract. It is the site the engine builds by default: the root
`site.config.ts` seam re-exports this config.

## What it demonstrates

- **The whole site is one config file.** `site.config.ts` here is the entire per-site
  surface. No engine code is edited to change the site.
- **The two-color reskin.** `brand.colors.primary` and `brand.colors.accent` are the whole
  palette. Change those two values and every surface, button, eyebrow, testimonial accent,
  and banner reskins with no other edit.
- **All three cumulative archetypes at once.** The pages exercise brochure sections (hero,
  services, about, testimonials, cta, contact), lead-gen sections (leadform with an
  autoresponder configured, booking), and simple-commerce (products with Stripe Checkout).

## Notes

- The demo omits the `gallery` section because it references image files; a real site drops
  photos into `public/` and lists them under a `gallery` section.
- Analytics is left unset so the demo build makes no third-party requests. Set
  `analytics.cloudflareToken` (recommended), or `analytics.plausibleDomain` /
  `analytics.gaId`, on a real site.
- Forms and checkout render and post, but only actually send or charge when the site sets
  `RESEND_API_KEY` / `CONTACT_FROM` / `STRIPE_SECRET_KEY` in its environment. Without those
  keys they no-op safely, which is why the demo builds and runs with zero secrets.

## Start a new site from this

1. Copy this folder to your site's location.
2. Edit `site.config.ts` (business, brand colors, pages and sections) and drop assets into
   `public/`.
3. Point the root `@/site.config` seam at your config.
4. `npm run build` must pass before the site is done.
