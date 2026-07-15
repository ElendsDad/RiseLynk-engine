import type { Section } from "@/lib/config-schema";
import { site } from "@/site.config";
import { ratingSummaryLine } from "@/lib/stars.mjs";
import StarRating from "@/components/StarRating";

// Visible reviews (local-trades conversion batch, deliverable 2): two independent
// opt-ins on top of the classic quote grid. A quote that carries a `rating` renders
// a star row; `showBusinessReviews` renders, after any quotes, the business.rating
// summary line and the business.reviews items as quote cards. A section that sets
// neither renders byte-for-byte as before. Claims wall: every star value comes from
// config (quote rating, business.rating, business.reviews); StarRating and
// ratingSummaryLine render nothing without a real supplied rating.
export default function Testimonials({ section }: { section: Section }) {
  const rating = site.business.rating;
  const summary = section.showBusinessReviews ? ratingSummaryLine(rating) : null;
  const reviews = section.showBusinessReviews
    ? (site.business.reviews ?? []).slice(0, section.maxBusinessReviews)
    : [];
  return (
    <section className="section" id="testimonials">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        <div className="quotes" style={{ marginTop: "1.5rem" }}>
          {(section.quotes ?? []).map((q, i) => (
            <figure className="quote" key={i}>
              {q.rating !== undefined ? (
                <StarRating value={q.rating} style={{ marginBottom: "0.75rem" }} />
              ) : null}
              <blockquote>{q.quote}</blockquote>
              <figcaption>
                <cite>{q.author}</cite>
                {q.role ? <span>, {q.role}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>
        {summary || reviews.length ? (
          <div style={{ marginTop: "2rem" }}>
            {summary && rating ? (
              <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, margin: 0 }}>
                <StarRating value={rating.ratingValue} best={rating.bestRating ?? 5} />
                <span>{summary}</span>
              </p>
            ) : null}
            {reviews.length ? (
              <div className="quotes" style={{ marginTop: summary ? "1rem" : 0 }}>
                {reviews.map((r, i) => (
                  <figure className="quote" key={i}>
                    <StarRating
                      value={r.rating}
                      best={r.bestRating ?? 5}
                      style={{ marginBottom: "0.75rem" }}
                    />
                    {r.body ? <blockquote>{r.body}</blockquote> : null}
                    <figcaption>
                      <cite>{r.author}</cite>
                      {r.date ? <span>, {r.date}</span> : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
