import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import { trustBarFacts } from "../../lib/trust.mjs";
import { resolveReviewCta } from "../../lib/gbp.mjs";

// Trust strip: renders whatever trust facts config supplies (license, insurance, years,
// brands, and any site-provided items) plus an optional verify link. Brand-neutral and
// fully config-driven, so any trade can use it: no credential, trade, or copy is assumed.
// Claims-walled - no fact is stated that config did not set (see lib/trust.mjs). Meant to
// sit above the fold, just under the hero, where trust signals lift quote requests most.
//
// When business.gbp.reviewUrl is set, also renders the equal public review CTA (no
// sentiment gating). The bar can render on review alone if trust facts are empty.
export default function TrustBar({ section }: { section: Section }) {
  const t = section.trust;
  const review = resolveReviewCta(site.business?.gbp);
  const facts = trustBarFacts(t);
  if (!facts.length && !t?.registryUrl && !review) return null;

  return (
    <section className="trustbar" aria-label="Credentials">
      <div className="container trustbar__row">
        {facts.length ? (
          <ul className="trustbar__facts">
            {facts.map((f, i) => (
              <li key={i}>
                <span className="trustbar__label">{f.label}</span>
                {f.href ? (
                  <a
                    className="trustbar__value trustbar__value--link"
                    href={f.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {f.value}
                  </a>
                ) : (
                  <span className="trustbar__value">{f.value}</span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
        {t?.registryUrl ? (
          <a className="trustbar__verify" href={t.registryUrl} target="_blank" rel="noopener noreferrer">
            {t.registryLabel ?? "Verify"}
          </a>
        ) : null}
        {review ? (
          <a
            className="trustbar__review"
            href={review.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {review.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}
