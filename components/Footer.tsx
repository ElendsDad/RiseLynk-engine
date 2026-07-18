import Link from "next/link";
import { site } from "@/site.config";
import { navPages, hrefFor } from "@/lib/config-schema";
import { socialPlatform } from "@/lib/social-icons.mjs";
import SocialIcon from "@/components/SocialIcon";

const telHref = (p: string) => `tel:${p.replace(/[^0-9+]/g, "")}`;

export default function Footer() {
  const b = site.business;
  // Footer legal line + utility links + optional dusk band (FooterConfig). All default OFF:
  // with no `footer` block the legal name falls back to the brand name, no utility links render,
  // and the footer keeps its normal surface, so the output is byte-for-byte unchanged.
  const f = site.footer;
  const legalName = f?.legalName ?? b.name;
  const links = f?.links ?? [];
  const duskOn = Boolean(f?.dusk);
  // business.socials (SocialLink[]): omitted gracefully when unset/empty, same posture as
  // every other optional footer block. rel="me" declares reciprocal ownership of the linked
  // profile (IndieWeb convention); noopener protects the opened tab from window.opener access.
  const socials = b.socials ?? [];
  return (
    <footer className={`site-footer${duskOn ? " dusk site-footer--dusk" : ""}`}>
      <div className="container site-footer__row">
        <div>
          <strong>{b.name}</strong>
          {b.serviceArea ? <div>{b.serviceArea}</div> : null}
          {b.phone ? <div><a href={telHref(b.phone)}>{b.phone}</a></div> : null}
        </div>
        <nav className="nav" aria-label="Footer">
          {navPages(site).map((p) => (
            <Link key={p.slug} href={hrefFor(p.slug)}>{p.nav}</Link>
          ))}
        </nav>
        {links.length ? (
          <nav className="nav site-footer__legal" aria-label="Legal">
            {links.map((l, i) => (
              <a key={i} href={l.href}>{l.label}</a>
            ))}
          </nav>
        ) : null}
        {socials.length ? (
          <div className="site-footer__socials" aria-label="Social links">
            {socials.map((s, i) => (
              <a
                key={i}
                className="social-link"
                href={s.href}
                target="_blank"
                rel="me noopener"
                aria-label={s.label}
              >
                <SocialIcon platform={socialPlatform(s)} />
              </a>
            ))}
          </div>
        ) : null}
        <div>&copy; {new Date().getFullYear()} {legalName}</div>
      </div>
    </footer>
  );
}
