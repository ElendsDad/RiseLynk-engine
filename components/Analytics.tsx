import Script from "next/script";
import { site } from "@/site.config";

// Privacy-friendly by default (Plausible). GA4 supported if the business insists.
export default function Analytics() {
  const a = site.analytics;
  if (!a) return null;
  return (
    <>
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
