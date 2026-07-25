"use client";

import { useEffect, useRef } from "react";

// Lead-source attribution fields (UTM + referrer + landing path).
//
// First-party and session-scoped only: a short populate pass fills hidden inputs
// from location.search / document.referrer / location.pathname when the form
// mounts. No cookies, no storage APIs, no third-party calls, no visitor profiling.
// Server sanitizes in lib/lead-attribution.mjs before foldExtras() folds clean
// values into the save-first lead message. Absent params stay absent (empty
// inputs are never folded).
//
// Must render INSIDE a <form>. The inline script covers the progressive-
// enhancement / first-paint path; the effect covers React client mounts where
// injected <script> tags do not re-execute.

const ATTR_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "referrer",
  "landing_path",
] as const;

// Keep this script tiny and dependency-free. Client-side values are untrusted;
// the intake re-sanitizes everything server-side (query stripped from referrer).
const POPULATE_JS = `(function(){try{var s=document.currentScript;var f=s&&s.closest&&s.closest("form");if(!f)return;var p=new URLSearchParams(location.search);["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(function(k){var v=p.get(k);if(!v)return;var el=f.querySelector('input[name="'+k+'"]');if(el)el.value=String(v).slice(0,200);});var r=f.querySelector('input[name="referrer"]');if(r&&document.referrer){try{var u=new URL(document.referrer);r.value=(u.origin+u.pathname).slice(0,200);}catch(e){}}var lp=f.querySelector('input[name="landing_path"]');if(lp)lp.value=String(location.pathname||"").slice(0,200);}catch(e){}})();`;

function populateForm(form: HTMLFormElement | null) {
  if (!form || typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(location.search);
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const) {
      const v = params.get(key);
      if (!v) continue;
      const el = form.querySelector<HTMLInputElement>(`input[name="${key}"]`);
      if (el) el.value = String(v).slice(0, 200);
    }
    const ref = form.querySelector<HTMLInputElement>('input[name="referrer"]');
    if (ref && document.referrer) {
      try {
        const u = new URL(document.referrer);
        ref.value = (u.origin + u.pathname).slice(0, 200);
      } catch {
        /* malformed referrer: leave empty */
      }
    }
    const lp = form.querySelector<HTMLInputElement>('input[name="landing_path"]');
    if (lp) lp.value = String(location.pathname || "").slice(0, 200);
  } catch {
    /* never break the form */
  }
}

export default function LeadAttribution() {
  const anchorRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const form = anchorRef.current?.form ?? anchorRef.current?.closest("form") ?? null;
    populateForm(form);
  }, []);

  return (
    <>
      {ATTR_KEYS.map((name, i) => (
        <input
          key={name}
          ref={i === 0 ? anchorRef : undefined}
          type="hidden"
          name={name}
          defaultValue=""
          autoComplete="off"
        />
      ))}
      <script dangerouslySetInnerHTML={{ __html: POPULATE_JS }} />
    </>
  );
}
