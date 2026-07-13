import { site } from "@/site.config";
import { telHref, callBarLabel, callBarRegionLabel } from "../lib/trust.mjs";

// Persistent, mobile-first tap-to-call bar, fixed to the bottom of every page. Brand-neutral
// and config-driven: it publishes business.phone as a tel: link with a plain call-to-action
// that any site can override via callBar.label. `dispatchRouted` only nuances the wording
// (a number answered any hour vs a plain daytime line); it never changes the number. The bar
// renders only when callBar.enabled and a phone number are set, so a config that omits the
// call bar renders nothing (additive). The highest-converting contact channel for local
// trades is a persistent tap-to-call, so a trade site turns this on above the fold.
export default function CallBar() {
  const cfg = site.callBar;
  const phone = site.business.phone;
  if (!cfg?.enabled || !phone) return null;

  return (
    <>
      {/* Spacer sits in flow so the fixed bar never covers the footer. Present only when
          the bar renders, so a site without a call bar keeps its full-bleed footer. */}
      <div className="callbar__spacer" aria-hidden="true" />
      <div className="callbar" role="region" aria-label={callBarRegionLabel(cfg)}>
        <div className="container callbar__row">
          <div className="callbar__text">
            <span className="callbar__label">{callBarLabel(cfg)}</span>
            {cfg.note ? <span className="callbar__note">{cfg.note}</span> : null}
          </div>
          <a className="callbar__btn" href={telHref(phone)}>
            Call {phone}
          </a>
        </div>
      </div>
    </>
  );
}
