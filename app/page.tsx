import type { Metadata } from "next";
import {
  AudienceCards,
  BuiltFor,
  CaptureGrid,
  CategoryBreak,
  FAQ,
  FinalCTA,
  FoundingOffer,
  Hero,
  LeadMagnets,
  PainCards,
  ProcessFlow,
  ProductProof,
  SeraDemoSection,
  TrustSection
} from "@/components/HomeSections";
import { siteUrl, faqs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Saberra | Institutional Memory for Teams That Can't Afford to Forget",
  description:
    "Saberra turns Google Meet meetings, emails, decisions, tasks, risks, and roles into searchable institutional memory. Ask Sera what your organization already knows.",
  alternates: { canonical: "/" }
};

export default function HomePage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Saberra",
        url: siteUrl,
        slogan: "Institutional memory for teams that can't afford to forget."
      },
      {
        "@type": "SoftwareApplication",
        name: "Saberra",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Institutional Memory Infrastructure that turns Google Meet meetings, emails, decisions, tasks, risks, and roles into searchable organizational memory."
      },
      {
        "@type": "Product",
        name: "Saberra",
        brand: { "@type": "Brand", name: "Saberra" },
        description:
          "Done-for-you institutional memory deployment with Sera, human review, Notion memory backend, and source-backed answers."
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer }
        }))
      }
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Hero />
      <PainCards />
      <CategoryBreak />
      <ProcessFlow />
      <ProductProof />
      <CaptureGrid />
      <SeraDemoSection />
      <BuiltFor />
      <AudienceCards />
      <TrustSection />
      <LeadMagnets />
      <FoundingOffer />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
