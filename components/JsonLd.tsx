// Renders a JSON-LD (schema.org) block. The data comes from lib/seo.ts builders,
// which read the active site config, so nothing here is brand-specific.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
