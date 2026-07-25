"use client";

import { useState } from "react";
import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Turnstile from "@/components/Turnstile";
import LeadAttribution from "@/components/LeadAttribution";

// Careers section (optional, default OFF: renders only when config.careers is present and
// not disabled). Mechanic voice, not HR: role types, the on-call reality said plainly, the
// apprenticeship path, and a low-friction apply form that reuses the intake pattern.
export default function Careers({ section }: { section: Section }) {
  const c = section.careers;
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  if (!c || c.enabled === false) return null;

  const wired = Boolean(c.applyIntakeUrl);
  const mailto = c.applyEmail ?? site.business.email;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    if (!wired) {
      const subject = `Job application - ${site.business.name}`;
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
      const res = await fetch(c!.applyIntakeUrl as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "careers", ...data }),
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("err");
    }
  }

  return (
    <section className="section section--surface" id="careers">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {c.intro ? <p className="lead">{c.intro}</p> : null}

        {c.roles?.length ? (
          <div className="grid" style={{ marginTop: "2rem" }}>
            {c.roles.map((r, i) => (
              <article className="card" key={i}>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </article>
            ))}
          </div>
        ) : null}

        {c.onCall || c.apprenticeship ? (
          <div className="careers__reality">
            {c.onCall ? (
              <div>
                <h3>On call, straight up</h3>
                <p>{c.onCall}</p>
              </div>
            ) : null}
            {c.apprenticeship ? (
              <div>
                <h3>Getting into the trade</h3>
                <p>{c.apprenticeship}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <form className="leadform careers__apply" onSubmit={onSubmit} noValidate style={{ marginTop: "2rem" }}>
          <LeadAttribution />
          <div className="field">
            <label htmlFor="cr-name">Name</label>
            <input id="cr-name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="cr-email">Email</label>
            <input id="cr-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="cr-phone">Phone</label>
            <input id="cr-phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="cr-experience">Years in the trade</label>
            <input id="cr-experience" name="experience" placeholder="e.g. IUEC mechanic, 6 years" />
          </div>
          <div className="field field--full">
            <label htmlFor="cr-note">Anything you want us to know</label>
            <textarea id="cr-note" name="note" rows={4} />
          </div>
          {site.security?.turnstile?.siteKey ? (
            <Turnstile siteKey={site.security.turnstile.siteKey} />
          ) : null}
          <div className="field--full">
            <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : c.submitLabel ?? "Apply"}
            </button>
            {status === "ok" ? (
              <p className="form__status form__status--ok">
                {wired
                  ? c.successMessage ?? "Thanks. We got your application and will be in touch."
                  : "Your email app should open with your application ready to send."}
              </p>
            ) : null}
            {status === "err" ? (
              <p className="form__status form__status--err">Something went wrong. Please email us directly.</p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
