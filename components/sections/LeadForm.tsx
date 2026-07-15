"use client";

import { useState } from "react";
import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Turnstile from "@/components/Turnstile";
import { celebrateSuccess } from "@/lib/celebrate.mjs";
import RequestAccessForm from "@/components/RequestAccessForm";

export default function LeadForm({ section }: { section: Section }) {
  // Modal-enhanced request-access variant (additive). A section that opts in with `modal: true`
  // or declares rich `formFields` delegates to the progressive-enhancement component; the classic
  // inline leadform below is byte-for-byte unchanged for every existing config.
  if (section.modal || section.formFields) {
    return <RequestAccessForm section={section} />;
  }
  return <ClassicLeadForm section={section} />;
}

function ClassicLeadForm({ section }: { section: Section }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "mailto">("idle");
  const fields = section.fields ?? ["phone", "service", "message"];

  // Last-resort delivery: hand the request to the visitor's email client so a
  // lead is never lost if the receiver is unreachable or could not capture it.
  function mailtoFallback(data: Record<string, string>) {
    const subject = `Quote request - ${site.business.name}`;
    const bodyText = Object.entries(data)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    window.location.href = `mailto:${site.business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("bad status");
      const out = (await res.json().catch(() => ({}))) as { saved?: boolean; notified?: boolean };
      if (out.notified === false && out.saved !== true) {
        mailtoFallback(data);
        setStatus("mailto");
        return;
      }
      setStatus("ok");
      form.reset();
      // Config-gated celebration (celebrate: "confetti"): lazy-loads the vendored
      // first-party script, honors prefers-reduced-motion, and fails silently
      // offline. Fire and forget: the success message never waits on it.
      void celebrateSuccess(section.celebrate);
    } catch {
      mailtoFallback(data);
      setStatus("mailto");
    }
  }

  return (
    <section className="section section--surface" id="quote">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? <p className="lead">{section.body}</p> : null}

        <form className="leadform" onSubmit={onSubmit} noValidate style={{ marginTop: "1.5rem" }}>
          {/* Honeypot: a hidden anti-spam trap (feature-backlog #4). A human never sees or
              fills this; a bot that auto-fills every field trips it and the request is dropped
              server-side (lib/contact-intake.mjs). aria-hidden + tabIndex keep it out of the
              accessibility and tab order. */}
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="lf-website">Website</label>
            <input id="lf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="lf-name">Name</label>
            <input id="lf-name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="lf-email">Email</label>
            <input id="lf-email" name="email" type="email" required autoComplete="email" />
          </div>

          {fields.includes("phone") ? (
            <div className="field">
              <label htmlFor="lf-phone">Phone</label>
              <input id="lf-phone" name="phone" type="tel" autoComplete="tel" />
            </div>
          ) : null}

          {fields.includes("service") ? (
            <div className="field">
              <label htmlFor="lf-service">Service needed</label>
              <select id="lf-service" name="service" defaultValue="">
                <option value="" disabled>Choose one...</option>
                {(section.services ?? []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
          ) : null}

          {fields.includes("preferredTime") ? (
            <div className="field">
              <label htmlFor="lf-time">Best time to reach you</label>
              <input id="lf-time" name="preferredTime" placeholder="e.g. weekday mornings" />
            </div>
          ) : null}

          {fields.includes("building") ? (
            <div className="field">
              <label htmlFor="lf-building">Building or address</label>
              <input id="lf-building" name="building" autoComplete="street-address" />
            </div>
          ) : null}

          {fields.includes("message") ? (
            <div className="field field--full">
              <label htmlFor="lf-message">Project details</label>
              <textarea id="lf-message" name="message" rows={4} />
            </div>
          ) : null}

          {site.security?.turnstile?.siteKey ? (
            <Turnstile siteKey={site.security.turnstile.siteKey} />
          ) : null}
          <div className="field--full">
            <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : section.submitLabel ?? "Request a quote"}
            </button>
            {status === "ok" ? (
              <p className="form__status form__status--ok">
                {section.successMessage ?? "Thanks. We will be in touch shortly."}
              </p>
            ) : null}
            {status === "mailto" ? (
              <p className="form__status form__status--ok">
                Your email app should open with your request ready to send. If it did not, call or email us directly.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
