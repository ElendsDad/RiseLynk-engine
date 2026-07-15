import { serializeJsonLd } from "@/lib/jsonld-escape.mjs";

// Renders a JSON-LD (schema.org) block. The data comes from lib/seo.ts builders,
// which read the active site config, so nothing here is brand-specific. Serialization
// goes through serializeJsonLd (lib/jsonld-escape.mjs), which escapes '<' to < so a
// config-supplied string containing "</script>" can never terminate this inline block.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
