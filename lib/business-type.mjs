// ============================================================
// site-engine - LocalBusiness subtype allowlist (feedback item #29)
//
// The consumer feedback (engine-feedback-v0.12.0.md, lines 146-150) asked for
// an optional business.schemaType so a trade site can emit a real schema.org
// LocalBusiness SUBTYPE (Plumber, Electrician, HVACBusiness, and so on)
// instead of plain LocalBusiness. The roadmap deferred it before now because
// "an allowlist mistake ships wrong structured data silently" - so the
// allowlist and the fail-closed resolution below ARE the feature, not an
// afterthought bolted onto it.
//
// CLAIMS WALL for structured data: resolveBusinessType never returns a value
// outside BUSINESS_SCHEMA_TYPES, and it can never return a value it did not
// itself look up - the return is always the matching LIST entry, never the
// caller's input string, so a lookalike or injected value can never ride
// through untouched. Every input other than an exact, case-sensitive match
// against the list, on a config that already qualifies as LocalBusiness,
// resolves to null. Fail-closed by design: a typo, wrong case, stray
// whitespace, or unknown trade name loses the subtype silently rather than
// emitting a wrong or attacker-controlled "@type" into the page's JSON-LD.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

// Real schema.org LocalBusiness subtypes (https://schema.org/LocalBusiness),
// one entry per trade the feedback named plus a small set of safe umbrellas
// for a trade that has no dedicated schema.org type of its own. Frozen so the
// list itself cannot be mutated at runtime by an importer.
export const BUSINESS_SCHEMA_TYPES = Object.freeze([
  "HomeAndConstructionBusiness", // general home-construction umbrella (roofing, remodeling, and similar trades with no dedicated subtype)
  "Electrician", // electrical contractor
  "GeneralContractor", // general contracting / construction management
  "HVACBusiness", // heating, ventilation, and air conditioning contractor
  "HousePainter", // residential/commercial painting contractor
  "Locksmith", // locksmith services
  "MovingCompany", // moving and relocation services
  "Plumber", // plumbing contractor
  "RoofingContractor", // roofing contractor
  "AutomotiveBusiness", // general automotive-services umbrella
  "AutoRepair", // auto repair shop
  "AutoBodyShop", // collision / body-repair shop
  "AutoWash", // car wash
  "ProfessionalService", // safe umbrella for a trade the list above does not name
]);

// Fail-closed resolution: the ONLY way to get a non-null result is isLocal
// === true AND schemaType an exact (case-sensitive, untrimmed) === match
// against an entry in BUSINESS_SCHEMA_TYPES. Every other input - an unknown
// name, wrong case, leading/trailing whitespace, a lookalike/injected string,
// empty string, or any non-string value - returns null, and the caller (see
// lib/seo.ts organizationLd) is expected to fall back to its own existing
// LocalBusiness/Organization "@type" logic in that case, which is exactly
// today's behavior. The match returns the LIST's own entry (not the input
// string) by construction, so the return value can never be a value outside
// BUSINESS_SCHEMA_TYPES, even if a caller mutated its input after calling.
/**
 * @param {unknown} schemaType
 * @param {boolean} isLocal
 * @returns {string | null}
 */
export function resolveBusinessType(schemaType, isLocal) {
  if (isLocal !== true || typeof schemaType !== "string") return null;
  for (const entry of BUSINESS_SCHEMA_TYPES) {
    if (entry === schemaType) return entry;
  }
  return null;
}
