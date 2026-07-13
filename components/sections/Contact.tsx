"use client";

import { useState } from "react";
import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Turnstile from "@/components/Turnstile";
import { celebrateSuccess } from "@/lib/celebrate.mjs";

const telHref = (p: string) => `tel:${p.replace(/[^0-9+]/g, "")}`;

export default function Contact({ section }: { section: Section }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "mailto">("idle");
  const b = site.business;

  // Last-resort delivery: hand the message to the visitor's email client so a
  // lead is never lost if the receiver is unreachable or could not capture it.
  function mailtoFallback(data: Record<string, string>) {
    const subject = `Website message - ${b.name}`;
    const bodyText = Object.entries(data)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    window.location.href = `mailto:${b.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("bad status");
      const out = (await res.json().catch(() => ({}))) as { saved?: boolean; notified?: boolean };
      // If the server could neither store the lead nor email it, do not swallow
      // it: fall back to the email client so nothing is dropped.
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
      // The function is unreachable - fall back to the email client.
      mailtoFallback(data);
      setStatus("mailto");
    }
  }

  return (
    <section className="section section--surface" id="contact">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        <div className="contact" style={{ marginTop: "1.5rem" }}>
          <div className="contact__details">
            {section.body ? <p className="lead">{section.body}</p> : null}
            {b.phone ? (
              <p><strong>Call:</strong> <a href={telHref(b.phone)}>{b.phone}</a></p>
            ) : null}
            <p><strong>Email:</strong> <a href={`mailto:${b.email}`}>{b.email}</a></p>
            {b.address ? <p><strong>Address:</strong> {b.address}</p> : null}
            {b.hours ? <p><strong>Hours:</strong> {b.hours}</p> : null}
            {b.mapEmbedUrl ? (
              <iframe className="map" src={b.mapEmbedUrl} title="Map" loading="lazy" />
            ) : null}
          </div>

          <form onSubmit={onSubmit} noValidate>
            {/* Honeypot: a hidden anti-spam trap (feature-backlog #4). A human never sees or
                fills this; a bot that auto-fills every field trips it and the submission is
                dropped server-side (lib/contact-intake.mjs). aria-hidden + tabIndex keep it
                out of the accessibility and tab order. */}
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="c-website">Website</label>
              <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="message">How can we help?</label>
              <textarea id="message" name="message" rows={5} required />
            </div>
            {site.security?.turnstile?.siteKey ? (
              <Turnstile siteKey={site.security.turnstile.siteKey} />
            ) : null}
            <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send message"}
            </button>
            {status === "ok" ? (
              <p className="form__status form__status--ok">Thanks. We will get back to you shortly.</p>
            ) : null}
            {status === "mailto" ? (
              <p className="form__status form__status--ok">
                Your email app should open with your message ready to send. If it did not, call or email us directly.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
