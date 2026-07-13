import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout canceled" };

export default function CancelPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "640px", textAlign: "center" }}>
        <h1>Checkout canceled</h1>
        <p className="lead" style={{ marginInline: "auto" }}>
          No charge was made. You can try again whenever you are ready, or reach out with questions.
        </p>
        <Link className="btn btn--primary" href="/" style={{ marginTop: "1rem" }}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
