import type { Section } from "@/lib/config-schema";
import Prose from "@/components/Prose";
import { imageSizeFromPath, resolvePublicPath } from "@/lib/image-size.mjs";

export default function About({ section }: { section: Section }) {
  const imgUrl = section.backgroundUrl;
  const abs = imgUrl ? resolvePublicPath(imgUrl) : null;
  const dims = abs ? imageSizeFromPath(abs) : null;
  return (
    <section className="section" id="about">
      <div className="container about">
        <div>
          {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
          {section.heading ? <h2>{section.heading}</h2> : null}
          {section.body
            ? section.body.split("\n\n").map((para, i) => (
                <p key={i}>
                  <Prose text={para} />
                </p>
              ))
            : null}
        </div>
        {imgUrl ? (
          <img
            className="about__img"
            src={imgUrl}
            alt=""
            width={dims?.width}
            height={dims?.height}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
    </section>
  );
}
