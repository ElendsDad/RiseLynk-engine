"use client";

import { useState } from "react";
import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Prose from "@/components/Prose";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function Products({ section }: { section: Section }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const currency = site.commerce?.currency ?? "usd";

  async function buy(id: string) {
    setBusy(id);
    setErr(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("no url");
    } catch {
      setErr(true);
      setBusy(null);
    }
  }

  return (
    <section className="section" id="shop">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}

        <div className="products" style={{ marginTop: "1.5rem" }}>
          {(section.products ?? []).map((p) => {
            // Priced = has an inline price or a pre-created Stripe price id -> Stripe checkout.
            // Unpriced with a quote target (per-product ctaHref, else section.quoteHref) ->
            // the card's CTA links to that page (quote-only catalog). Unpriced with no target
            // keeps the legacy buy button (back-compatible).
            const priced = typeof p.priceCents === "number" || Boolean(p.priceId);
            const quoteTo = !priced ? p.ctaHref ?? section.quoteHref : undefined;
            return (
              <article className="product" key={p.id}>
                {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : null}
                <div className="product__body">
                  <h3>{p.name}</h3>
                  {p.description ? <p>{p.description}</p> : null}
                  <div className="product__foot">
                    {typeof p.priceCents === "number" ? (
                      <span className="product__price">
                        {formatPrice(p.priceCents, p.currency ?? currency)}
                      </span>
                    ) : <span />}
                    {quoteTo ? (
                      <a className="btn btn--primary" href={quoteTo}>
                        {p.cta ?? "Request a quote"}
                      </a>
                    ) : (
                      <button
                        className="btn btn--primary"
                        onClick={() => buy(p.id)}
                        disabled={busy === p.id}
                      >
                        {busy === p.id ? "..." : p.cta ?? "Buy now"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {err ? (
          <p className="form__status form__status--err">
            Could not start checkout. Please try again or call us.
          </p>
        ) : null}
      </div>
    </section>
  );
}
