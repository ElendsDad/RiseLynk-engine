import { site } from "@/site.config";
import type { Product } from "./config-schema";

// Collect every product defined across all `products` sections in the active site config.
//
// Provenance: extracted 2026-07-10 from
// kitsap-website-creation/templates/brochure/lib/products.ts (unchanged).
export function allProducts(): Product[] {
  const out: Product[] = [];
  for (const page of site.pages) {
    for (const section of page.sections) {
      if (section.type === "products" && section.products) {
        out.push(...section.products);
      }
    }
  }
  return out;
}

export function findProduct(id: string): Product | undefined {
  return allProducts().find((p) => p.id === id);
}
