# Lead-capture content gate (phased)

Status: session spec, 2026-07-14. Deliverable 4 of the local-trades conversion
batch. Phases 0-1 ship now on one feature branch; Phases 2-3 are specified here
and DEFERRED to a follow-up release. Shared ground rules, the byte-identical
proof protocol, and the delivery discipline are in
`local-trades-conversion-surfaces.md` and apply unchanged.

## Intent

A local-trade site often has one genuinely valuable content asset (a maintenance
checklist, a pricing guide, a spec sheet). The content gate trades that asset for
a lead: the visitor sees a teaser, submits the existing lead form, and the asset
unlocks. The gate rides the engine's save-first intake (`/api/lead` +
lib/contact-intake.mjs): the lead is saved before anything else happens, spam is
dropped by the same honeypot and optional Turnstile, and the source field tells
the operator which gate produced the lead.

## Honesty note (stated, not hidden)

Phase 1 is a SOFT gate: the asset href is present in the served markup and a
view-source visitor can take it without submitting. That is acceptable for the
launch use case (a checklist, not a secret) and it is the reason Phase 3 exists:
signed, expiring links minted only on an accepted lead are the real enforcement.
Site copy must not promise exclusivity the gate does not enforce; the schema
comments carry this note so a config author sees it.

## Phase 0 (ships now): schema + config surface

- SectionType gains "contentGate". Section gains `gate?: ContentGateConfig`.
- New interface in lib/config-schema.ts:

  - `id?: string` - short slug naming this gate; feeds the lead source tag.
  - `asset: { href: string; label?: string }` - the gated thing. href points at
    an asset in public/ (or an absolute URL); label is the unlock button text
    (default "Download").
  - `bullets?: string[]` - teaser bullet list rendered before the form (what the
    asset covers), verbatim config copy.
  - `fields?: ("phone" | "message")[]` - optional extra form fields; name and
    email are always on.
  - `submitLabel?: string` (default "Get the download"), `successMessage?: string`
    (default "Thanks. Your download is ready below.").
  - `source?: string` - explicit lead source override. Default:
    `content-gate:<id>` when id is set, else `content-gate`.

- Section heading/subheading/body carry the visible teaser copy, as everywhere
  else in the engine.
- Default OFF: a config with no contentGate section renders byte-identical
  output (proof protocol from the companion spec).
- Schema comments carry the claims wall (teaser copy is config-supplied, nothing
  invented) and the Phase 1 soft-gate honesty note.

## Phase 1 (ships now): component + save-first wiring

- `lib/content-gate.mjs` (pure, dependency-free, JSDoc-typed; the testable core):
  - `gateSource(gate)`: the source-tag rule above, trimmed to the 40-char cap
    lib/contact-intake.mjs applies.
  - `gateLeadBody(data, gate)`: assembles the POST body from submitted form
    data: name, email, plus opted-in phone/message, plus `source` from
    `gateSource`, plus the honeypot `website` field passed through untouched
    (the server-side trap must see what the browser sent). Only known intake
    columns are emitted, so nothing is silently dropped by the intake mapper.
- `components/ContentGate.tsx` (client component) + `components/sections/`
  wiring via one SectionRenderer line for type "contentGate":
  - Renders teaser (heading/subheading/body/bullets), then the form: name,
    email, opted-in extras, the same hidden honeypot field the other forms
    carry, and the Turnstile widget when `security.turnstile.siteKey` is set.
  - Native fallback attributes on the form element: `action="/api/lead"
    method="post"`. With JavaScript off, a submit still saves the lead through
    the intake's existing form-post path (save-first: a lead is never dropped)
    and lands on the engine's success page; the asset does NOT unlock in that
    flow until Phase 2 closes the loop. This is one attribute pair, not the
    Phase 2 no-JS reveal.
  - With JavaScript on: intercept submit, POST JSON to `/api/lead` with
    `gateLeadBody`, and on an ok response swap the form for the reveal panel:
    successMessage + the asset link styled as the primary button. On failure,
    show the same mailto fallback message pattern the classic LeadForm uses
    (the lead body handed to the visitor's mail client; the asset stays locked).
  - The reveal state is component-local (no persistence, no cookie); a reload
    re-gates. Stated in the schema comment.
- No new dependency, no new API route, no env var.

New gate `npm run test:content-gate` (tools/content-gate.test.mjs, plain Node):

- `gateSource`: default, id-derived, explicit override, 40-char cap.
- `gateLeadBody`: name/email only; with phone/message opted in; unknown
  submitted keys are NOT emitted; the `website` honeypot value passes through;
  source lands in the body.
- End-to-end through the REAL intake core: drive `submit()` from
  lib/contact-intake.mjs with a mock save and send, posting a gate body:
  - an accepted lead saves first with `source: "content-gate:<id>"`;
  - a honeypot-tripped body is dropped exactly as the other forms drop it;
  - a save failure still notifies (save-first semantics unchanged).

Acceptance criteria (Phases 0-1):

- [ ] `npm run test:content-gate` exists and passes; every case above covered.
- [ ] A config without a contentGate section builds byte-identical per the proof
      protocol (all seven configs; both demo seams).
- [ ] A scratch config (not committed) with a contentGate section: builds; the
      teaser and form render; the form carries the honeypot, the native
      action/method fallback, and the Turnstile widget only when configured;
      evidenced in the PR body.
- [ ] JSON-LD and llms.txt untouched by this feature (the gate emits neither).
- [ ] Full existing gate battery green.
- [ ] Copy discipline: engine-default strings carry no em or en dashes, no
      banned phrases, no exclusivity promise.

## Phase 2 (DEFERRED): no-JS reveal loop

Close the no-JS gap: after a native form post, the visitor reaches a surface
that carries the unlocked asset. Design sketch to build against: extend the
lead route's existing Post/Redirect/Get so a gate submission redirects to
`/success?gate=<id>`, and the success page (which today is a static thank-you)
resolves `<id>` against the active config and renders the asset link. Constraints
learned from the modal leadform's no-JS contract: the same form must serve both
paths, the redirect must carry no PII, and a bad or stale id degrades to the
plain thank-you. Do not ship Phase 2 without its own byte-identical pass (the
success page is shared surface).

## Phase 3 (DEFERRED): signed download links

Real enforcement: the asset href leaves the markup. On an accepted (non-spam)
lead, the server mints a signed, expiring URL (HMAC over asset id + expiry with
an env-keyed secret, verified by a small API route that streams the file or
302s to it). The reveal panel and the Phase 2 success surface render the signed
link instead of the raw href. Requires: an env secret (never in config), a
route, and a decision on link lifetime. Out of scope now; recorded so the soft
gate is a stated phase, not an accident.

## Follow-ups (Architect)

- Phase 2 and Phase 3 above, as one or two future releases.
- Showcase a contentGate section in a demo config at integration time.
- CLAUDE.md release-gates list gains test:content-gate at integration time.
- Consider a per-gate lead cap or dedupe (same email re-gating) once real usage
  shows whether it matters.
