import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Thank you" };

// Shared by the Stripe checkout success and the no-JS lead Post/Redirect/Get (/success?lead=1).
// The `lead` variant shows a neutral lead-received message instead of the payment-receipt copy,
// so a request-access submit with JavaScript off lands on an honest thank-you. Absent the flag the
// page is byte-for-byte the original payment success.
export default async function SuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const isLead = params.lead != null;
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px", textAlign: "center" }}>
        <h1>Thank you.</h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          {isLead
            ? "Your request came through. A real person reads every one and will be in touch shortly."
            : "Your payment went through and a receipt is on its way. We will be in touch shortly."}
        </p>
        <Link className="btn btn--primary" href="/" style={{ marginTop: "1rem" }}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
