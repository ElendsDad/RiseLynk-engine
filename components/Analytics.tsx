import Script from "next/script";
import { site } from "@/site.config";
import { resolveCloudflareBeacon } from "@/lib/analytics.mjs";

// Recommended default: Cloudflare Web Analytics (free, cookieless, no Cloudflare
// DNS required). Plausible (paid) and GA4 (cookies) remain available. CSP extras
// for the CF beacon are wired in next.config.ts only when cloudflareToken is set.
export default function Analytics() {
  const a = site.analytics;
  if (!a) return null;
  const cf = resolveCloudflareBeacon(a);
  return (
    <>
      {cf ? (
        <Script
          defer
          src={cf.src}
          data-cf-beacon={cf.dataCfBeacon}
          strategy="afterInteractive"
        />
      ) : null}
      {a.plausibleDomain ? (
        <Script
          defer
          data-domain={a.plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
      {a.gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${a.gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${a.gaId}');`}
          </Script>
        </>
      ) : null}
    </>
  );
}
