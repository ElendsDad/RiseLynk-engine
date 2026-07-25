import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";
import { resolveSectionId } from "@/lib/section-id.mjs";

// Add-on / priced-menu section (feedback item 7). A SECOND priced-menu surface,
// deliberately decoupled from the pricing (software-archetype) section above it in
// the section map:
//   - its OWN DOM id, resolved by lib/section-id.mjs resolveSectionId, never the
//     hardcoded "pricing" components/sections/Pricing.tsx uses. A page with two (or
//     more) addons sections gets unique ids automatically - see Section.id's doc
//     comment in lib/config-schema.ts for the explicit-id / auto-suffix rule.
//   - its OWN item shape, AddonItem (see lib/config-schema.ts), NOT PricingTier:
//     `price` is DISPLAY COPY ONLY ("$25", "Included"), with no structured
//     priceValue field at all, so an addon item can never be fed into an Offer even
//     by a future wiring mistake.
//   - NO JSON-LD: lib/seo.ts's allPricingTiers collects ONLY `section.type ===
//     "pricing"` sections into the SoftwareApplication Offer / AggregateOffer
//     JSON-LD (lib/offer-ld.mjs pricingOffersLd). This section type is never in
//     that filter, so its items never reach that JSON-LD, and this component emits
//     no structured data of its own - a priced menu is presentation copy, not a
//     commercial offer claim. See tools/addons.test.mjs.
//   - NO Section.style variant: `style` ("ribbon" / "editorial") is resolved
//     through lib/style-variant.mjs's STYLE_HONORS map, which does not list
//     "addons" for either variant. An unhonored type ignores the field safely by
//     design (see that module's doc comment), so this component does not read
//     `section.style` at all; a config that sets it on an addons section has no
//     effect, the same as setting it on any other type the pack did not wire up.
//   - Motion: the card hover lift below matches the EXISTING .plan hover-lift
//     values byte-for-byte (app/globals.css, v0.21 baseline) on its own selectors,
//     fine-pointer gated and locally neutralized under prefers-reduced-motion
//     (same convention as .btn/.plan/.grid--ribbon; the master reduced-motion guard
//     kills transition/animation duration but not a hover-triggered transform, so
//     each hover site carries its own reduce block). No new motion is introduced.
export default function Addons({
  section,
  sections,
  index,
}: {
  section: Section;
  // Full page section list + this section's position, so the id resolver can count
  // same-type occurrences. Optional and defaulted below so this component still
  // renders (as the first-and-only occurrence) if ever mounted outside
  // SectionRenderer, which always supplies both.
  sections?: Section[];
  index?: number;
}) {
  const items = section.addonItems ?? [];
  if (!items.length) return null;
  const id = resolveSectionId(sections ?? [section], index ?? 0, "addons");
  return (
    <section className="section" id={id}>
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}

        <div className="addons-grid" style={{ marginTop: "1.5rem" }}>
          {items.map((it, i) => (
            <article className="addon" key={i}>
              <div className="addon__row">
                <h3 className="addon__name">{it.name}</h3>
                <p className="addon__price">{it.price}</p>
              </div>
              {it.description ? <p className="addon__desc">{it.description}</p> : null}
              {it.note ? <p className="addon__note">{it.note}</p> : null}
              {it.ctaHref ? (
                <a className="btn btn--ghost addon__cta" href={it.ctaHref}>
                  {it.ctaLabel ?? "Learn more"}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
