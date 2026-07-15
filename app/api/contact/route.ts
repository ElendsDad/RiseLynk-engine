import { NextResponse } from "next/server";
import { site } from "@/site.config";
import { submit, getSaver, getSender, rateOk, clientIp, verifyTurnstile, turnstileConfig } from "@/lib/contact-intake.mjs";

// Public contact intake (Contact.tsx posts here). Hardened per the RiseLynk
// contact-submit harvest (unification plan phase R1): save the lead first, then
// notify; a mail failure returns { ok:true, notified:false } so a lead is never
// lost; reply_to = the lead; every field HTML-escaped; fail-open rate limiting.
// The notify target and from-address are read from config/env, never a literal.
export async function POST(req: Request) {
  try {
    let body: Record<string, string>;
    try {
      body = (await req.json()) as Record<string, string>;
    } catch {
      return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
    }

    // Trusted-IP + tenant-scoped rate limit (SEC hardening FIX 2). clientIp() prefers the
    // platform-set x-real-ip over the spoofable leftmost x-forwarded-for; the tenant (site domain)
    // keys the bucket so two sites at one shared IP do not collide. Backed by the shared atomic
    // store when RATE_LIMIT_REST_URL/TOKEN are set, else a per-isolate fallback.
    const ip = clientIp(req.headers);
    if (!(await rateOk({ ip, tenant: site.seo?.domain, bucket: "contact", max: 10, windowSecs: 3600 }))) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    // Turnstile spam shield (feature-backlog #4, SEC hardening FIX 4). A rendered widget and the
    // server secret are all-or-nothing (turnstileConfig): a one-sided config fails CLOSED (503) so
    // a visible CAPTCHA always implies real enforcement. When both are present enforcement runs and
    // a configured verify failure or outage fails CLOSED; the feature is off only when neither is
    // set (the brochure default). The honeypot in submit() runs regardless.
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
    const r = await submit({
      body,
      save: getSaver(),
      send: getSender(),
      to,
      from,
      sourceDefault: "website-contact",
    });
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (err) {
    console.error("contact route error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
