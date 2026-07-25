import type { Section } from "@/lib/config-schema";
import { resolveGalleryModel } from "@/lib/gallery.mjs";

// Brochure photo gallery (feedback item #18): a plain image grid plus an optional
// brand-neutral before/after work-pair grid, resolved by lib/gallery.mjs
// resolveGalleryModel (see that module's doc comment for the claims-wall and
// drop-the-pair fail-safe rules this component leans on).
//
// BYTE-IDENTITY CONTRACT: a caption-less image renders the EXACT SAME <img loading="lazy">
// markup this section always rendered - no wrapping <figure>, no new attribute, nothing.
// Only an item that actually carries a caption gets the new <figure className="gallery__figure">
// / <figcaption> wrapper. A section with no `pairs` takes the early return below, whose
// JSX tree is child-for-child the pre-pairs component: a `{cond ? ... : null}` sibling
// would serialize an extra null into the RSC flight payload of every plain gallery page
// (the exact regression class the app routes fixed for the service node; a probe build
// of a plain two-image gallery caught this component doing the same), so the no-pairs
// case must not merely render nothing, it must contribute no child slot at all.
export default function Gallery({ section }: { section: Section }) {
  const model = resolveGalleryModel(section);
  const grid = (
    <div className="gallery" style={{ marginTop: "1.5rem" }}>
      {model.items.map((img, i) =>
        img.caption ? (
          <figure className="gallery__figure" key={i}>
            <img src={img.src} alt={img.alt} loading="lazy" />
            <figcaption>{img.caption}</figcaption>
          </figure>
        ) : (
          <img key={i} src={img.src} alt={img.alt} loading="lazy" />
        ),
      )}
    </div>
  );
  if (!model.pairs.length) {
    return (
      <section className="section section--surface" id="gallery">
        <div className="container">
          {section.heading ? <h2>{section.heading}</h2> : null}
          {grid}
        </div>
      </section>
    );
  }
  return (
    <section className="section section--surface" id="gallery">
      <div className="container">
        {section.heading ? <h2>{section.heading}</h2> : null}
        {grid}
        <div className="gallery-pairs" style={{ marginTop: "2rem" }}>
          {model.pairs.map((pair, i) => (
            <article className="gallery-pair" key={i}>
              <div className="gallery-pair__images">
                <figure>
                  <span className="gallery-pair__tag">{model.beforeLabel}</span>
                  <img src={pair.before.src} alt={pair.before.alt} loading="lazy" />
                </figure>
                <figure>
                  <span className="gallery-pair__tag">{model.afterLabel}</span>
                  <img src={pair.after.src} alt={pair.after.alt} loading="lazy" />
                </figure>
              </div>
              {pair.caption ? <p className="gallery-pair__caption">{pair.caption}</p> : null}
              {pair.note ? <p className="gallery-pair__note">{pair.note}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
