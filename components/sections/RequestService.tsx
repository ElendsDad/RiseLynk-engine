"use client";

import { useState } from "react";
import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Prose from "@/components/Prose";
import Turnstile from "@/components/Turnstile";
import LeadAttribution from "@/components/LeadAttribution";

// Request-service form for the elevator-contractor archetype.
//
// When `intakeUrl` is set (the tenant's portal-intake path), the form POSTs there and the
// confirmation can honestly speak of a logged request and a reference number, because the
// request landed in a system that issues one. When it is unset, the form degrades to a
// mailto to the business inbox and says exactly that, with NO reference-number promise:
// an email is not a ticket. The site never reads the tenant DB; it only posts to the
// intake path the publish profile provided (the section 5.4 boundary).
export default function RequestService({ section }: { section: Section }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [reference, setReference] = useState<string | null>(null);
  const fields = section.fields ?? ["phone", "service", "message"];
  const wired = Boolean(section.intakeUrl);
  const mailto = section.intakeEmail ?? site.business.email;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    if (!wired) {
      // Graceful fallback: hand the request to the email client. No ticket, no reference.
      const subject = `Service request - ${site.business.name}`;
      const bodyText = Object.entries(data)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      setStatus("ok");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(section.intakeUrl as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "website", ...data }),
      });
      if (!res.ok) throw new Error("bad status");
      const out = (await res.json().catch(() => ({}))) as { reference?: string; ticket?: string };
      setReference(out.reference ?? out.ticket ?? null);
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("err");
    }
  }

  const okMessage = wired
    ? reference
      ? `Your request is logged. Reference ${reference}. We will follow up shortly.`
      : section.referenceNote ?? section.successMessage ?? "Your request is logged and routed to our team. We will follow up shortly."
    : "Your email app should open with the request ready to send. If it did not, call or email us directly.";

  return (
    <section className="section section--surface" id="request-service">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}

        <form className="leadform" onSubmit={onSubmit} noValidate style={{ marginTop: "1.5rem" }}>
          <LeadAttribution />
          <div className="field">
            <label htmlFor="rs-name">Name</label>
            <input id="rs-name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="rs-email">Email</label>
            <input id="rs-email" name="email" type="email" required autoComplete="email" />
          </div>

          {fields.includes("phone") ? (
            <div className="field">
              <label htmlFor="rs-phone">Phone</label>
              <input id="rs-phone" name="phone" type="tel" autoComplete="tel" />
            </div>
          ) : null}

          {fields.includes("service") ? (
            <div className="field">
              <label htmlFor="rs-service">What do you need?</label>
              <select id="rs-service" name="service" defaultValue="">
                <option value="" disabled>
                  Choose one...
                </option>
                {(section.services ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="Not sure yet">Not sure yet</option>
              </select>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="rs-building">Building or address</label>
            <input id="rs-building" name="building" autoComplete="address-line1" />
          </div>

          {fields.includes("message") ? (
            <div className="field field--full">
              <label htmlFor="rs-message">What is going on?</label>
              <textarea id="rs-message" name="message" rows={4} />
            </div>
          ) : null}

          {site.security?.turnstile?.siteKey ? (
            <Turnstile siteKey={site.security.turnstile.siteKey} />
          ) : null}

          <div className="field--full">
            <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : section.submitLabel ?? "Request service"}
            </button>
            {status === "ok" ? <p className="form__status form__status--ok">{okMessage}</p> : null}
            {status === "err" ? (
              <p className="form__status form__status--err">
                Something went wrong. Please call us so nothing gets missed.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
