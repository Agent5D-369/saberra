import type { Metadata } from "next";
import {
  AudienceCards,
  BuiltFor,
  CaptureGrid,
  CategoryBreak,
  CompetitiveComparison,
  DeploymentPath,
  EditorialStoryStrip,
  FAQ,
  FitQualifier,
  FinalCTA,
  FoundingOffer,
  Hero,
  LeadMagnets,
  PainCards,
  ProcessFlow,
  ProductProof,
  SocialProof,
  SeraLimitations,
  SeraDemoSection,
  TrustSection,
  WorkspaceProof
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
          "Institutional Memory Infrastructure that turns Google Meet meetings, emailed transcripts, emails, decisions, tasks, risks, and roles into searchable organizational memory."
      },
      {
        "@type": "Product",
        name: "Saberra",
        brand: { "@type": "Brand", name: "Saberra" },
        description:
          "Done-for-you institutional memory deployment with Sera, human review, Notion memory backend, and source-backed answers."
      },
      {
        "@type": "HowTo",
        name: "How Saberra builds institutional memory",
        description:
          "Saberra captures meeting and email output, creates structured candidates, routes them through human review, stores approved memory in an inspectable backend, and lets teams ask Sera for source-backed answers.",
        step: [
          { "@type": "HowToStep", name: "Capture", text: "Capture Google Meet output, emailed transcripts, and email context through a dedicated inbox." },
          { "@type": "HowToStep", name: "Extract", text: "Create structured candidates for decisions, tasks, risks, roles, policies, and source records." },
          { "@type": "HowToStep", name: "Review", text: "Human reviewers approve, correct, or reject records before they become trusted memory." },
          { "@type": "HowToStep", name: "Retrieve", text: "Sera answers questions from reviewed records with source context." }
        ]
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
      <CompetitiveComparison />
      <EditorialStoryStrip />
      <ProcessFlow />
      <DeploymentPath />
      <ProductProof />
      <WorkspaceProof />
      <CaptureGrid />
      <SeraDemoSection />
      <SeraLimitations />
      <BuiltFor />
      <AudienceCards />
      <SocialProof />
      <FitQualifier />
      <TrustSection />
      <LeadMagnets />
      <FoundingOffer />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
