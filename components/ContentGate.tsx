"use client";

import { useState } from "react";
import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Turnstile from "@/components/Turnstile";
import LeadAttribution from "@/components/LeadAttribution";
import Prose from "@/components/Prose";
import { gateLeadBody, gateSource, sanitizeGateAssetHref } from "@/lib/content-gate.mjs";

// Lead-capture content gate, Phases 0-1 (docs/plans/lead-capture-content-gate.md).
// Teaser (section heading/subheading/body + config bullets), then a lead form riding the
// engine's save-first intake (/api/lead + lib/contact-intake.mjs): same hidden honeypot,
// same optional Turnstile, and a gate-specific `source` tag (lib/content-gate.mjs). On an
// accepted lead the form swaps for the reveal panel (successMessage + the asset link).
// The form carries native action/method fallback attributes, so with JavaScript off a
// submit still saves the lead through the intake's existing form-post path and lands on
// the success page; the no-JS reveal loop itself is Phase 2. The reveal state is
// component-local (no persistence, no cookie): a reload re-gates. Phase 1 is a SOFT gate
// (the asset href is in the served markup; real enforcement is Phase 3's signed links).
export default function ContentGate({ section }: { section: Section }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "mailto">("idle");
  const gate = section.gate;
  // No gate, no asset, or an asset href that fails the scheme guard: nothing safe to
  // trade, so render nothing (nothing invented, fail-closed - consistent with the
  // wiring.portalUrl hardening in tools/hydrate.mjs).
  const assetHref = sanitizeGateAssetHref(gate?.asset?.href);
  if (!gate?.asset || !assetHref) return null;
  const fields = gate.fields ?? [];

  // Last-resort delivery, same pattern as the classic LeadForm: hand the request to the
  // visitor's email client so the lead is never lost; the asset stays locked (no accepted
  // lead means no reveal).
  function mailtoFallback(data: Record<string, string>) {
    const subject = `Download request - ${site.business.name}`;
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
    const body = gateLeadBody(data, gate);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("bad status");
      const out = (await res.json().catch(() => ({}))) as { saved?: boolean; notified?: boolean };
      if (out.notified === false && out.saved !== true) {
        mailtoFallback(body);
        setStatus("mailto");
        return;
      }
      setStatus("ok");
    } catch {
      mailtoFallback(body);
      setStatus("mailto");
    }
  }

  return (
    <section className="section section--surface" id={gate.id ? `gate-${gate.id}` : "content-gate"}>
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        {gate.bullets && gate.bullets.length > 0 ? (
          <ul style={{ marginTop: "1rem" }}>
            {gate.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}

        {status === "ok" ? (
          // The reveal panel: shown only after the intake accepted the lead. Component-
          // local state, so a reload re-gates (stated in the schema comment). aria-live:
          // the JS submit path swaps the form for this panel in place with no navigation,
          // so a screen reader needs the live region to announce the reveal at all.
          <div aria-live="polite" style={{ marginTop: "1.5rem" }}>
            <p className="form__status form__status--ok">
              {gate.successMessage ?? "Thanks. Your download is ready below."}
            </p>
            <p style={{ marginTop: "1rem" }}>
              <a className="btn btn--primary" href={assetHref}>
                {gate.asset.label ?? "Download"}
              </a>
            </p>
          </div>
        ) : (
          // action/method are the native no-JS fallback: a plain form post still saves
          // the lead through the route's existing form-post path (save-first, never a
          // dropped lead). The JS path intercepts in onSubmit and POSTs JSON instead.
          // No noValidate: on the no-JS path the browser's built-in required/email
          // checks are the only validation there is (same as RequestAccessForm's
          // native fallback form).
          <form
            className="leadform"
            action="/api/lead"
            method="post"
            onSubmit={onSubmit}
            style={{ marginTop: "1.5rem" }}
          >
            {/* Honeypot: the same hidden anti-spam trap the other forms carry (feature-
                backlog #4). A human never sees or fills this; a bot that auto-fills every
                field trips it and the request is dropped server-side
                (lib/contact-intake.mjs). aria-hidden + tabIndex keep it out of the
                accessibility and tab order. */}
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="cg-website">Website</label>
              <input id="cg-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <LeadAttribution />
            {/* With JavaScript on, onSubmit's gateLeadBody() sets `source` explicitly. With
                JavaScript off the browser posts the DOM's own named fields verbatim, so
                without this the gate's attribution (which asset produced the lead) would be
                silently lost on exactly the path save-first exists to protect. Same value
                either way: gateSource() is pure and deterministic from the gate config. */}
            <input type="hidden" name="source" value={gateSource(gate)} />
            <div className="field">
              <label htmlFor="cg-name">Name</label>
              <input id="cg-name" name="name" required autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="cg-email">Email</label>
              <input id="cg-email" name="email" type="email" required autoComplete="email" />
            </div>

            {fields.includes("phone") ? (
              <div className="field">
                <label htmlFor="cg-phone">Phone</label>
                <input id="cg-phone" name="phone" type="tel" autoComplete="tel" />
              </div>
            ) : null}

            {fields.includes("message") ? (
              <div className="field field--full">
                <label htmlFor="cg-message">Anything we should know?</label>
                <textarea id="cg-message" name="message" rows={4} />
              </div>
            ) : null}

            {site.security?.turnstile?.siteKey ? (
              <Turnstile siteKey={site.security.turnstile.siteKey} />
            ) : null}
            <div className="field--full">
              <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : gate.submitLabel ?? "Get the download"}
              </button>
              {status === "mailto" ? (
                <p className="form__status form__status--ok">
                  Your email app should open with your request ready to send. If it did not, call or email us directly.
                </p>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
