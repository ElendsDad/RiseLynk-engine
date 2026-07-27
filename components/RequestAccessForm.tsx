"use client";

// =============================================================================
// Request-access lead form: the modal-enhanced, rich-field variant of the
// leadform section (harvested from the 2026-07-12 RiseLynk design bundle's
// #suScrim modal). Brand-neutral and config-gated (Section.modal / formFields).
//
// PROGRESSIVE ENHANCEMENT is the core contract. The SAME <form> is server-
// rendered with a native method="post" action="/api/lead". With JavaScript OFF
// it is a normal INLINE form that still POSTs a lead through the save-first
// intake (a <noscript> style flips the modal chrome to an inline card, hides the
// trigger, and reveals the form). Only once JS mounts does it become a focus-
// trapped modal (scrim + blur, focus trap, Escape, focus return, body scroll
// lock, aria-modal + aria-labelledby) opened by a trigger button OR by a
// same-page hash CTA / deep link whose hash matches this section's id
// (lib/leadform-hash-cta.mjs). A lead is therefore never lost to a missing or
// broken script, and pre-enhancement clicks still land on the SSR form.
//
// FIELD FOLDING: known intake columns (name/company/email/phone/units/service/
// preferredTime/building/message) map straight to the lead; every other declared
// field folds into the message body (with its label) so no structured extra is
// dropped. The server folds again for the no-JS path (lib/contact-intake.mjs
// foldExtras), so both paths carry the extras. Confetti fires on success only
// when the section opts in (celebrate: "confetti").
// =============================================================================

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { LeadField, Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import Turnstile from "@/components/Turnstile";
import LeadAttribution from "@/components/LeadAttribution";
import Prose from "@/components/Prose";
import { celebrateSuccess } from "@/lib/celebrate.mjs";
import { LEAD_ATTRIBUTION_KEYS } from "@/lib/lead-attribution.mjs";
import { bindLeadformHashCta } from "@/lib/leadform-hash-cta.mjs";

// Canonical intake columns (lowercased form-name -> the key lib/contact-intake.mjs reads).
// A declared field whose name matches one of these maps straight onto the lead; anything else
// folds into the message body. `website` and `source` are reserved (honeypot / lead source).
// Attribution keys (utm_*, referrer, landing_path) pass through as top-level fields so the
// intake can sanitize them before foldExtras; they are not pre-folded here.
const CANON: Record<string, string> = {
  name: "name",
  company: "company",
  email: "email",
  phone: "phone",
  units: "units",
  service: "service",
  preferredtime: "preferredTime",
  building: "building",
  message: "message",
  website: "website",
  source: "source",
};
const ATTR_KEYS = new Set(LEAD_ATTRIBUTION_KEYS);

// A sensible default field set when a site sets `modal: true` without declaring `formFields`.
const DEFAULT_FIELDS: LeadField[] = [
  { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Work email", type: "email", required: true, autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "message", label: "How can we help?", type: "textarea", full: true },
];

function visibleFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const sel =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return Array.prototype.filter.call(
    root.querySelectorAll(sel),
    (el: HTMLElement) => el.offsetParent !== null && el.getAttribute("tabindex") !== "-1",
  ) as HTMLElement[];
}

export default function RequestAccessForm({ section }: { section: Section }) {
  const fields = section.formFields && section.formFields.length ? section.formFields : DEFAULT_FIELDS;
  const triggerLabel = section.modalTriggerLabel ?? section.submitLabel ?? "Request access";
  const submitLabel = section.submitLabel ?? "Request access";
  const successMessage = section.successMessage ?? "Thanks. We will be in touch shortly.";
  // Explicit Section.id wins; otherwise the historical anchor sites already link to.
  const sectionId =
    typeof section.id === "string" && section.id.trim() ? section.id.trim() : "request-access";

  const [enhanced, setEnhanced] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "mailto" | "error">("idle");

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const doneCloseRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<Element | null>(null);

  const titleId = useId();

  // Enhance only after mount, so the server HTML (and the client's first render) match: no
  // hydration mismatch, and a no-JS visitor never reaches this code.
  useEffect(() => setEnhanced(true), []);

  const closeModal = useCallback(() => {
    setOpen(false);
    const el = lastFocusRef.current as HTMLElement | null;
    // Return focus to the trigger AFTER the state flush (no reliance on transitionend, so this
    // also fires correctly under prefers-reduced-motion where transitions are settled instantly).
    requestAnimationFrame(() => {
      if (el && typeof el.focus === "function") el.focus();
    });
  }, []);

  // Shared open path: the section-local trigger AND hash-CTA / hashchange enhancement
  // both call this. Do not fork a second open routine.
  const openModal = useCallback(() => {
    lastFocusRef.current = document.activeElement;
    setStatus("idle");
    setOpen(true);
  }, []);

  // Progressive enhancement: same-page anchors whose hash matches this section id
  // open the modal instead of scrolling. Scoped to this mount; torn down on unmount.
  // Absent this effect (no-JS / pre-enhance) the href remains a real link to the SSR form.
  useEffect(() => {
    if (!enhanced) return;
    return bindLeadformHashCta({ sectionId, openModal });
  }, [enhanced, sectionId, openModal]);

  // Body scroll lock + initial focus while the modal is open.
  useEffect(() => {
    if (!enhanced) return;
    if (!open) {
      document.documentElement.style.overflow = "";
      return;
    }
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        ".leadmodal__form input:not([type=hidden]):not([tabindex='-1']), .leadmodal__form select, .leadmodal__form textarea",
      );
      (first ?? panelRef.current?.querySelector<HTMLElement>("button"))?.focus();
    }, 60);
    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [open, enhanced]);

  // Escape to close + Tab focus trap, active only while the modal is open.
  useEffect(() => {
    if (!enhanced || !open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key === "Tab") {
        const f = visibleFocusable(panelRef.current);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enhanced, open, closeModal]);

  // On success, move focus to the done-panel close button (it replaces the form).
  useEffect(() => {
    if (status === "ok" && enhanced && open) doneCloseRef.current?.focus();
  }, [status, enhanced, open]);

  function mailtoFallback(data: Record<string, string>) {
    const subject = `Request access - ${site.business.name}`;
    const bodyText = Object.entries(data)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    window.location.href = `mailto:${site.business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  }

  // Build the intake payload from the live form: known names map to columns, everything else
  // folds into the message body with its label (the server folds again for the no-JS path).
  function buildPayload(form: HTMLFormElement): { payload: Record<string, string>; mailto: Record<string, string> } {
    const fd = new FormData(form);
    const labelByName = new Map(fields.map((f) => [f.name, f.label]));
    const payload: Record<string, string> = {};
    const extraLines: string[] = [];
    const names = new Set<string>(Array.from(fd.keys()) as string[]);
    for (const nm of names) {
      const val = fd
        .getAll(nm)
        .map((v) => String(v).trim())
        .filter(Boolean)
        .join(", ");
      const lower = nm.toLowerCase();
      const canon = CANON[lower];
      if (canon) {
        payload[canon] = val;
      } else if (ATTR_KEYS.has(lower)) {
        if (val) payload[lower] = val;
      } else if (val) {
        extraLines.push(`${labelByName.get(nm) ?? nm}: ${val}`);
      }
    }
    const base = payload.message ? [payload.message] : [];
    payload.message = [...base, ...extraLines].join("\n");
    if (!payload.source) payload.source = "website-lead";
    const mailto = { ...payload };
    delete mailto.website;
    return { payload, mailto };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // With JS active we always intercept, using the save-first fetch + mailto fallback. With JS
    // OFF this handler never runs and the browser natively POSTs to the form action (no-JS path).
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const { payload, mailto } = buildPayload(form);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status");
      const out = (await res.json().catch(() => ({}))) as { saved?: boolean; notified?: boolean };
      if (out.notified === false && out.saved !== true) {
        mailtoFallback(mailto);
        setStatus("mailto");
        return;
      }
      setStatus("ok");
      form.reset();
      // Config-gated celebration (celebrate: "confetti"): lazy-loads the vendored first-party
      // script, honors prefers-reduced-motion, fails silently offline. Fire and forget.
      void celebrateSuccess(section.celebrate);
    } catch {
      mailtoFallback(mailto);
      setStatus("mailto");
    }
  }

  const dialogAttrs = enhanced
    ? ({ role: "dialog", "aria-modal": true, "aria-labelledby": titleId } as const)
    : {};

  return (
    <section className="section section--surface" id={sectionId}>
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}

        {/* No-JS override: with scripting disabled the browser applies this style, flipping the
            modal chrome to a plain inline card, hiding the trigger and close button, and revealing
            the form. With JS enabled the <noscript> content is ignored, so the default (modal)
            styling wins and there is no flash of the inline form. */}
        <noscript>
          <style>{`.leadmodal__trigger{display:none!important}.leadmodal__x{display:none!important}.leadmodal__scrim{position:static!important;inset:auto!important;background:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;opacity:1!important;visibility:visible!important;padding:0!important;display:block!important}.leadmodal__panel{transform:none!important;opacity:1!important;max-height:none!important;margin:0!important}`}</style>
        </noscript>

        <div className={`leadmodal${enhanced ? " is-enhanced" : ""}${open ? " is-open" : ""}`} style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn btn--primary leadmodal__trigger"
            aria-haspopup="dialog"
            ref={triggerRef}
            onClick={openModal}
          >
            {triggerLabel}
          </button>

          <div
            className="leadmodal__scrim"
            onMouseDown={(e) => {
              if (enhanced && e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="leadmodal__panel" ref={panelRef} {...dialogAttrs}>
              <div className="leadmodal__head">
                <h3 id={titleId}>{triggerLabel}</h3>
                <button type="button" className="leadmodal__x" aria-label="Close" onClick={closeModal}>
                  &times;
                </button>
              </div>

              {status === "ok" ? (
                <div className="leadmodal__done">
                  <div className="leadmodal__tick" aria-hidden="true">&checkmark;</div>
                  <h3>Request received</h3>
                  <p>{successMessage}</p>
                  <button type="button" className="btn btn--ghost leadmodal__doneclose" ref={doneCloseRef} onClick={closeModal}>
                    Close
                  </button>
                </div>
              ) : (
                <form className="leadform leadmodal__form" method="post" action="/api/lead" onSubmit={onSubmit}>
                  {/* Honeypot anti-spam trap: a human never sees or fills it; a bot that fills every
                      field trips it and the request is dropped server-side (lib/contact-intake.mjs). */}
                  <div className="hp-field" aria-hidden="true">
                    <label htmlFor="ra-website">Website</label>
                    <input id="ra-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>
                  <LeadAttribution />

                  {fields.map((f) => (
                    <Field key={f.name} field={f} />
                  ))}

                  {site.security?.turnstile?.siteKey ? (
                    <Turnstile siteKey={site.security.turnstile.siteKey} />
                  ) : null}

                  <div className="leadmodal__foot field--full">
                    <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
                      {status === "sending" ? "Sending..." : submitLabel}
                    </button>
                    <p className="form__status" role="status" aria-live="polite">
                      {status === "mailto"
                        ? "Your email app should open with your request ready to send. If it did not, call or email us directly."
                        : status === "error"
                          ? "That did not go through. Please try again in a moment."
                          : ""}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// One declarative field. checkbox-group and radio-group are fieldset/legend groups (no single
// control to label); every other type is a labelled input/select/textarea. `full` spans both
// grid columns. radio-group is a NEW exclusive-choice chip UI (preferred follow-up, etc.); it
// was not expressible as checkbox-group (multi) and a select lacks the chip affordance.
function Field({ field }: { field: LeadField }) {
  const id = `ra-${field.name}`;
  const type = field.type ?? "text";
  const wrapClass = `field${field.full ? " field--full" : ""}`;

  if (type === "checkbox-group") {
    return (
      <fieldset className={`${wrapClass} ra-group`}>
        <legend>{field.label}</legend>
        <div className="ra-chips">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="ra-chip">
              <input type="checkbox" name={field.name} value={opt} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (type === "radio-group") {
    // Native radios: one name, exclusive choice, keyboard-navigable within the group.
    // `required` on every option is the HTML5 group-required pattern (any one selected satisfies).
    const legend = (
      <>
        {field.label}
        {field.required ? <span className="req" aria-hidden="true"> *</span> : null}
      </>
    );
    return (
      <fieldset className={`${wrapClass} ra-group`}>
        <legend>{legend}</legend>
        <div className="ra-chips" role="presentation">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="ra-chip">
              <input type="radio" name={field.name} value={opt} required={field.required} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const label = (
    <label htmlFor={id}>
      {field.label}
      {field.required ? <span className="req" aria-hidden="true"> *</span> : null}
    </label>
  );

  if (type === "textarea") {
    return (
      <div className={wrapClass}>
        {label}
        <textarea id={id} name={field.name} rows={4} required={field.required} placeholder={field.placeholder} />
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className={wrapClass}>
        {label}
        <select id={id} name={field.name} required={field.required} defaultValue="">
          <option value="" disabled>
            {field.placeholder ?? "Choose one..."}
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      {label}
      <input
        id={id}
        name={field.name}
        type={type}
        required={field.required}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        inputMode={type === "number" ? "numeric" : undefined}
        {...(type === "number" ? { min: 0, step: 1 } : {})}
      />
    </div>
  );
}
