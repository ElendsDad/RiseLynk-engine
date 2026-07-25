import type { ComponentType } from "react";
import type { Section, SectionType } from "@/lib/config-schema";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import About from "@/components/sections/About";
import Gallery from "@/components/sections/Gallery";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import CTABanner from "@/components/sections/CTABanner";
import LeadForm from "@/components/sections/LeadForm";
import Booking from "@/components/sections/Booking";
import Products from "@/components/sections/Products";
// Phase-A product-marketing layer
import Pricing from "@/components/sections/Pricing";
// v0.2.0 elevator-contractor archetype
import ContractorServices from "@/components/sections/ContractorServices";
import TrustBar from "@/components/sections/TrustBar";
import RequestService from "@/components/sections/RequestService";
import PortalDoor from "@/components/sections/PortalDoor";
// v0.2.0 GEO pack
import Summary from "@/components/sections/Summary";
import Faq from "@/components/sections/Faq";
// v0.2.0 optional sections
import Careers from "@/components/sections/Careers";
import Records from "@/components/sections/Records";
import ModGallery from "@/components/sections/ModGallery";
// R5 design-system structural craft
import ScrollNarrative from "@/components/sections/ScrollNarrative";
// Local-trades conversion batch
import ServiceArea from "@/components/sections/ServiceArea";
// Lead-capture content gate (Phases 0-1)
import ContentGate from "@/components/ContentGate";
// Expressive pack
import StoryGraph from "@/components/sections/StoryGraph";
// Feedback item 7: add-on / priced-menu section
import Addons from "@/components/sections/Addons";
// Dense resource / link directory (teardown 2026-07-24)
import Directory from "@/components/sections/Directory";
// Teardown P2: capability matrix + allowlisted video embed
import FeatureMatrix from "@/components/sections/FeatureMatrix";
import VideoEmbed from "@/components/sections/VideoEmbed";

// sections/index are OPTIONAL and additive: every existing section component reads
// only `section`. Addons is the first consumer (lib/section-id.mjs resolveSectionId
// needs the page's full section list plus this section's position to compute a
// unique DOM id when a page renders more than one addons section); the shape is
// generic so a future section type facing the same problem can reuse it too. The
// renderer below supplies the two extra props ONLY to the types that consume them:
// several section components are client components ("use client" - contact,
// leadform, products, requestService, careers, scrollNarrative, contentGate), and
// any prop handed to a client component is serialized into the RSC flight payload
// of the emitted HTML, so spreading sections/index onto every section would change
// built output for configs that never use addons and break the
// byte-identical-absent guarantee. A new consuming type must be added to the
// conditional in SectionRenderer, and must be a server component (or accept the
// payload cost knowingly).
const MAP: Record<SectionType, ComponentType<{ section: Section; sections?: Section[]; index?: number }>> = {
  hero: Hero,
  services: Services,
  about: About,
  gallery: Gallery,
  testimonials: Testimonials,
  contact: Contact,
  cta: CTABanner,
  leadform: LeadForm,
  booking: Booking,
  products: Products,
  pricing: Pricing,
  contractorServices: ContractorServices,
  trustBar: TrustBar,
  requestService: RequestService,
  portalDoor: PortalDoor,
  summary: Summary,
  faq: Faq,
  careers: Careers,
  records: Records,
  modGallery: ModGallery,
  scrollNarrative: ScrollNarrative,
  serviceArea: ServiceArea,
  contentGate: ContentGate,
  storyGraph: StoryGraph,
  addons: Addons,
  directory: Directory,
  featureMatrix: FeatureMatrix,
  videoEmbed: VideoEmbed,
};

export default function SectionRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => {
        const Cmp = MAP[section.type];
        if (!Cmp) return null;
        // See the MAP doc comment: the id-resolution props go only to the section
        // types that consume them, so they are never serialized into a client
        // component's flight payload.
        if (section.type === "addons") {
          return <Cmp key={i} section={section} sections={sections} index={i} />;
        }
        return <Cmp key={i} section={section} />;
      })}
    </>
  );
}
