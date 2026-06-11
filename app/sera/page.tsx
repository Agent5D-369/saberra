import type { Metadata } from "next";
import { SeraDemoSection, SeraLimitations, TrustSection } from "@/components/HomeSections";
import { CTABand, SectionHeader, SeraPortrait } from "@/components/UI";
import { SeraEvidenceVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Sera, Your AI Organizational Operator",
  description:
    "Sera turns meetings and emails into structured, human-reviewed operating intelligence inside Saberra.",
  alternates: { canonical: "/sera" }
};

export default function SeraPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container sera-page-hero">
          <div>
            <h1>Sera turns organizational chaos into operating intelligence.</h1>
            <p>
              Copy Sera on meetings and important emails. She prepares decisions, tasks, risks, profiles, projects,
              roles, policies, and governance records for human review inside your private memory system.
            </p>
          </div>
          <div className="sera-hero-frame">
            <SeraPortrait variant="environment" size="lg" />
            <div className="sera-hero-note">
              <strong>Sera</strong>
              <span>AI organizational operator inside Saberra</span>
            </div>
          </div>
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
          <SectionHeader title="Operating intelligence needs a trusted record.">
            Sera can only be as useful as the memory underneath her. Saberra makes that memory structured, reviewed, and
            source-backed before Sera uses it.
          </SectionHeader>
          <ul className="list">
            <li>Sera proposes structured records from meetings and emails.</li>
            <li>Humans approve what becomes trusted organizational memory.</li>
            <li>Every answer is designed to point back to sources your team can inspect.</li>
            <li>Sera is useful for decisions, roles, risks, tasks, policies, projects, and history.</li>
          </ul>
        </div>
      </section>
      <SeraLimitations />
      <TrustSection />
      <section className="section">
        <div className="container">
          <CTABand
            title="Ask Sera what your organization already knows."
            copy="Start with the Living Memory Hub demo to see reviewed memory in action, then apply if you want Sera operating inside your own organization."
            primary="Open the demo hub"
            primaryHref="/notion-template"
            secondary="Apply for a founding spot"
            secondaryHref="/founding-access"
          />
        </div>
      </section>
    </main>
  );
}
