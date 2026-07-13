import { NextResponse } from "next/server";
import { site } from "@/site.config";
import { submit, getSaver, getSender, rateOk, verifyTurnstile } from "@/lib/contact-intake.mjs";

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

    const xff = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const ip = (xff.split(",")[0] || "").trim();
    if (!(await rateOk({ ip, bucket: "lead", max: 10, windowSecs: 3600 }))) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    // Turnstile spam shield (feature-backlog #4). Same gate as the contact route: enforced
    // only when a widget is configured AND the secret is present; fails open on any inability
    // to verify, so a real lead is never lost. The honeypot in submit() runs regardless.
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
    const send = getSender();
    const r = await submit({
      body,
      save: getSaver(),
      send,
      to,
      from,
      sourceDefault: "website-lead",
    });

    // Autoresponder to the lead (lead-gen only), if configured. Best-effort.
    const ar = site.business.autoReply;
    const email = String(body.email || "").trim();
    if (r.ok && send && ar && email) {
      try {
        await send({ from, to: email, subject: ar.subject, text: ar.body });
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
