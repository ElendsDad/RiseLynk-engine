// ============================================================
// site-engine - Section.style variant resolution (expressive pack)
//
// One generic opt-in field, Section.style, carries the pack's presentation
// variants ("ribbon", "editorial") instead of one-off section types or one
// boolean per look, following the schema's flat-field precedent (dusk,
// gradientPrice, pinned). This module is the single source of truth for WHICH
// section types honor WHICH variant, so a component never has to guess and a
// config can never turn a variant on somewhere it was not designed for: an
// unhonored (or unknown, or absent) style resolves to nothing and the section
// renders byte-for-byte as before.
//
// PROVENANCE NOTE for the integrating architect: the original technique source
// (a standalone gallery HTML file) was not reachable from the environment this was
// built in, so both variants are generalized from the written spec description
// alone. Compare against the source at integration; the CSS for each variant is
// one self-contained block in app/globals.css (search "Section.style").
//
// Dependency-free plain ESM so tools/style-variant.test.mjs can exercise it
// with plain Node, same as every other lib/*.mjs module.
// ============================================================

// Which section types honor which Section.style variant. Everything else
// ignores the field safely (resolves to null / an empty class suffix).
//   ribbon    - the services feature-card grid (the card system with the
//               FeatureItem.badge ribbon treatment)
//   editorial - the hero (oversized system-serif display treatment)
export const STYLE_HONORS = {
  ribbon: ["services"],
  editorial: ["hero"],
  // Teardown P2 7b: native <details> FAQ disclosure. Flat list when absent.
  collapse: ["faq"],
};

// Resolve a section's requested style against the honor map. Returns the
// variant name when this section TYPE honors it, else null (absent field,
// unknown variant string, or a type the variant was not designed for). Null
// means "render exactly as before"; nothing here ever throws.
export function styleVariantFor(sectionType, style) {
  if (typeof style !== "string" || !style) return null;
  const honors = STYLE_HONORS[style];
  if (!Array.isArray(honors) || !honors.includes(sectionType)) return null;
  return style;
}

// The class-suffix helper components use directly: returns " <base>--<style>"
// when the variant is honored, else "" - so appending it to an existing
// className string is byte-identical when the section does not opt in.
//   styleSuffix("hero", "editorial", "hero")     -> " hero--editorial"
//   styleSuffix("services", "ribbon", "grid")    -> " grid--ribbon"
//   styleSuffix("about", "ribbon", "grid")       -> ""   (not honored)
//   styleSuffix("hero", undefined, "hero")       -> ""   (no opt-in)
export function styleSuffix(sectionType, style, base) {
  const v = styleVariantFor(sectionType, style);
  return v ? " " + base + "--" + v : "";
}
