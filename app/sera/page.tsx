import type { Metadata } from "next";
import { SeraDemoSection, TrustSection } from "@/components/HomeSections";
import { CTABand, SectionHeader, SeraScene } from "@/components/UI";
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
          <div className="sera-hero-frame sera-hero-frame-scene">
            <SeraScene variant="memory" priority />
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
        <div className="container sera-record-layout">
          <SeraScene variant="cards" />
          <div>
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
        </div>
      </section>
      <section className="section tight alt">
        <div className="container">
          <SectionHeader eyebrow="What Sera does not do" title="Sera does not invent answers.">
            Sera answers from reviewed, source-backed organizational records. Not from the open internet. Not from
            unreviewed extractions. If the record does not exist, Sera says so. That restraint is deliberate: an AI
            that confidently invents answers is worse than no system at all.
          </SectionHeader>
          <div className="grid-3" style={{ marginTop: 32 }}>
            {[
              ["No hallucinated answers", "Every answer Sera gives is designed to point back to a source your team has already reviewed and approved."],
              ["No autonomous writes", "Sera proposes. Humans approve. Nothing becomes trusted organizational memory without a human in the loop."],
              ["No black-box extraction", "Every record Sera proposes is inspectable, editable, and correctable by your team before it enters the system."]
            ].map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
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
