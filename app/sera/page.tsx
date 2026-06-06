import type { Metadata } from "next";
import { SeraDemoSection, TrustSection } from "@/components/HomeSections";
import { CTABand, SectionHeader } from "@/components/UI";
import { SeraEvidenceVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Sera, Your AI Memory Colleague",
  description:
    "Sera is the AI assistant inside Saberra. Ask plain-English questions and get answers from reviewed, sourced organizational records.",
  alternates: { canonical: "/sera" }
};

export default function SeraPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Sera answers from what your organization has actually documented.</h1>
          <p>
            Sera is not an internet answer engine. She is the retrieval layer on top of your reviewed institutional
            memory.
          </p>
        </div>
      </section>
      <SeraDemoSection />
      <section className="section tight">
        <div className="container">
          <SeraEvidenceVisual />
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <SectionHeader title="A trusted colleague needs a trusted record.">
            Sera can only be as useful as the memory underneath her. Saberra makes that memory structured, reviewed, and
            source-backed before Sera uses it.
          </SectionHeader>
          <ul className="list">
            <li>Sera answers from reviewed organizational records, not general web knowledge.</li>
            <li>Every answer is designed to point back to sources your team can inspect.</li>
            <li>Human review keeps Sera grounded in what your organization accepts as true.</li>
            <li>Sera is useful for decisions, roles, risks, tasks, policies, projects, and history.</li>
          </ul>
        </div>
      </section>
      <TrustSection />
      <section className="section">
        <div className="container">
          <CTABand title="Ask Sera the questions your team keeps asking each other." copy="Start with the audit, then see whether Saberra is a fit for your current workflow." />
        </div>
      </section>
    </main>
  );
}
