import { NextResponse } from "next/server";
import { site } from "@/site.config";
import { submit, getSaver, getSender, rateOk, clientIp, verifyTurnstile, turnstileConfig, autoReplyRecipient } from "@/lib/contact-intake.mjs";

// Public lead-gen intake (LeadForm.tsx posts here). Same R1 hardening as the
// contact route (save-first, never-drop, escaping, reply_to, fail-open limiting),
// plus the lead-gen extra: an optional autoresponder to the lead. The
// autoresponder is strictly best-effort and never changes the response - the
// lead is already saved and the team already notified by submit().
// Read the submission body from either a JSON fetch (the enhanced form) or a native form POST
// (the no-JS modal fallback). A native post is application/x-www-form-urlencoded or multipart; we
// parse it into a plain object, joining repeated names (a checkbox-group) so submit()/foldExtras
// carry every value. `isForm` marks the no-JS path so we can Post/Redirect/Get instead of JSON.
async function readBody(req: Request): Promise<{ body: Record<string, string>; isForm: boolean }> {
  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    return { body: (await req.json()) as Record<string, string>, isForm: false };
  }
  const fd = await req.formData();
  const body: Record<string, string> = {};
  for (const key of new Set(Array.from(fd.keys()))) {
    const vals = fd.getAll(key).map((v) => String(v));
    body[key] = vals.length > 1 ? vals.join(", ") : vals[0];
  }
  return { body, isForm: true };
}

export async function POST(req: Request) {
  try {
    let body: Record<string, string>;
    let isForm = false;
    try {
      ({ body, isForm } = await readBody(req));
    } catch {
      return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
    }

    // Trusted-IP + tenant-scoped rate limit (SEC hardening FIX 2). clientIp() prefers the
    // platform-set x-real-ip over the spoofable leftmost x-forwarded-for; the tenant (site domain)
    // keys the bucket so two sites at one shared IP do not collide. Backed by the shared atomic
    // store when RATE_LIMIT_REST_URL/TOKEN are set, else a per-isolate fallback.
    const ip = clientIp(req.headers);
    if (!(await rateOk({ ip, tenant: site.seo?.domain, bucket: "lead", max: 10, windowSecs: 3600 }))) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    // Turnstile spam shield (feature-backlog #4, SEC hardening FIX 4). Same gate as the contact
    // route via the shared turnstileConfig: a one-sided config (widget without secret, or secret
    // without widget) fails CLOSED (503), both-present enforces, and a configured verify failure or
    // outage fails CLOSED. Off only when neither is set. The honeypot in submit() runs regardless.
    const turnstileSecret = process.env.TURNSTILE_SECRET || "";
    const tcfg = turnstileConfig({ siteKey: site.security?.turnstile?.siteKey, secret: turnstileSecret });
    if (!tcfg.ok) {
      // XOR misconfig: a rendered widget with no server secret (or a secret with no widget) would
      // leave the CAPTCHA unenforced. Fail CLOSED with a 503 rather than accept unverified traffic.
      return NextResponse.json({ ok: false, error: "turnstile_misconfig" }, { status: 503 });
    }
    if (tcfg.enforced) {
      const tv = await verifyTurnstile({
        token: (body as Record<string, string>)["cf-turnstile-response"],
        secret: turnstileSecret,
        remoteip: ip,
      });
      if (!tv.ok) {
        return NextResponse.json({ ok: false, error: "turnstile_failed" }, { status: 400 });
      }
    }

    const to = process.env.CONTACT_TO || site.business.email;
    const from = process.env.CONTACT_FROM || "onboarding@resend.dev";
    const send = getSender();
    const r = await submit({
      body,
      save: getSaver(),
      send,
      to,
      from,
      sourceDefault: "website-lead",
    });

    // Autoresponder to the lead (lead-gen only), if configured. Best-effort and strictly gated:
    // autoReplyRecipient() returns a recipient ONLY on a genuinely accepted (non-spam) submission
    // and ONLY the address submit() validated (r.autoReplyTo), never the raw request body. A spam
    // (honeypot) submission returns ok:true but is not eligible, so it can no longer be reflected.
    const ar = site.business.autoReply;
    const replyTo = autoReplyRecipient(r, ar);
    if (send && ar && replyTo) {
      try {
        await send({ from, to: replyTo, subject: ar.subject, text: ar.body });
      } catch {
        /* the lead is already saved and the team notified; ignore */
      }
    }

    // No-JS native form post: Post/Redirect/Get to a thank-you page so a refresh does not
    // resubmit and the visitor sees confirmation. The lead is already saved by submit() above,
    // so this is purely the response surface. The enhanced (fetch) path still gets JSON.
    if (isForm) {
      return NextResponse.redirect(new URL(r.ok ? "/success?lead=1" : "/?lead=error", req.url), 303);
    }

    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (err) {
    console.error("lead route error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
