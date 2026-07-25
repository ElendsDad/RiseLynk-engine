import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";
import { resolveVideoEmbed } from "@/lib/video-embed.mjs";

// Allowlisted privacy-first video embed (teardown P2 7j). Fail-closed: a
// rejected / missing video renders nothing. YouTube always uses
// youtube-nocookie; no autoplay; loading=lazy. The consuming site must add the
// iframe origin to security.frameSrc or CSP will block the frame.
export default function VideoEmbed({ section }: { section: Section }) {
  const resolved = resolveVideoEmbed(section.video);
  if (!resolved) return null;

  return (
    <section className="section" id="video">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? (
          <p className="lead">
            <Prose text={section.body} />
          </p>
        ) : null}
        <div className="video-embed" style={{ marginTop: "1.5rem" }}>
          <iframe
            className="video-embed__frame"
            src={resolved.embedUrl}
            title={resolved.title}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}
