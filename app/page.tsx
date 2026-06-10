import type { Metadata } from "next";
import {
  AudienceCards,
  CompetitiveComparison,
  FinalCTA,
  FitQualifier,
  FoundingOffer,
  FAQ,
  Hero,
  PainCards,
  ProcessFlow,
  SeraDemoSection,
  SocialProof,
  TrustSection
} from "@/components/HomeSections";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Saberra | AI Organizational Intelligence Infrastructure",
  description:
    "Saberra gives your organization Sera, the AI Secretary that turns meetings and emails into human-reviewed operating intelligence.",
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
        slogan: "Sera turns organizational chaos into operating intelligence."
      },
      {
        "@type": "SoftwareApplication",
        name: "Saberra",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "AI Organizational Intelligence Infrastructure that turns meetings and emails into structured, human-reviewed operating intelligence."
      },
      {
        "@type": "Product",
        name: "Saberra",
        brand: { "@type": "Brand", name: "Saberra" },
        description:
          "Done-for-you AI organizational intelligence system with Sera, human review, a Living Memory Hub backend, and source-backed answers."
      },
      {
        "@type": "HowTo",
        name: "How Sera organizes operating intelligence",
        description:
          "Saberra captures meeting and email output, Sera creates structured candidates, humans review them, approved records live in an inspectable backend, and teams ask Sera for source-backed answers.",
        step: [
          { "@type": "HowToStep", name: "Capture", text: "Capture Google Meet output, emailed transcripts, and email context through a dedicated inbox." },
          { "@type": "HowToStep", name: "Extract", text: "Create structured candidates for decisions, tasks, risks, roles, policies, and source records." },
          { "@type": "HowToStep", name: "Review", text: "Human reviewers approve, correct, or reject records before they become trusted memory." },
          { "@type": "HowToStep", name: "Retrieve", text: "Sera answers questions from reviewed records with source context." }
        ]
      }
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Hero />
      <PainCards />
      <ProcessFlow />
      <SocialProof />
      <CompetitiveComparison />
      <TrustSection />
      <AudienceCards />
      <SeraDemoSection />
      <FitQualifier />
      <FoundingOffer />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
