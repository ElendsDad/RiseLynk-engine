"use client";

import Script from "next/script";

// Cloudflare Turnstile widget (feature-backlog #4). Privacy-friendly, no-cookie bot
// check. Rendered inside a form ONLY when site.security.turnstile.siteKey is set, so a
// site that has not opted in ships nothing. When the script loads, the widget injects a
// hidden input named "cf-turnstile-response" into the enclosing form, which the form's
// FormData then posts; the receiver verifies it server-side when TURNSTILE_SECRET is set
// (see app/api/contact and app/api/lead). Enforcement is off unless BOTH the siteKey and
// the secret are configured, so this is fully additive.
//
// next/script dedupes by src, so multiple widgets on one page load the api.js once.
export default function Turnstile({ siteKey }: { siteKey: string }) {
  return (
    <div className="field--full">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        strategy="afterInteractive"
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
    </div>
  );
}
