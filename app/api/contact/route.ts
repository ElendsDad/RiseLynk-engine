import { NextResponse } from "next/server";
import { site } from "@/site.config";
import { submit, getSaver, getSender, rateOk, verifyTurnstile } from "@/lib/contact-intake.mjs";

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

    const xff = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const ip = (xff.split(",")[0] || "").trim();
    if (!(await rateOk({ ip, bucket: "contact", max: 10, windowSecs: 3600 }))) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    // Turnstile spam shield (feature-backlog #4). Enforced only when the site configured a
    // widget (security.turnstile.siteKey) AND the server holds the secret (TURNSTILE_SECRET).
    // Off by default; verifyTurnstile fails open on any inability to check, so a real lead is
    // never lost to a verify outage. The honeypot in submit() runs regardless.
    const turnstileSecret = process.env.TURNSTILE_SECRET || "";
    if (site.security?.turnstile?.siteKey && turnstileSecret) {
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
