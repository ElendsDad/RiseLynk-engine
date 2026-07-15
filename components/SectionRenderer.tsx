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

const MAP: Record<SectionType, ComponentType<{ section: Section }>> = {
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
};

export default function SectionRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => {
        const Cmp = MAP[section.type];
        return Cmp ? <Cmp key={i} section={section} /> : null;
      })}
    </>
  );
}
