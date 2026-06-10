import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import { SecurityBoundaryVisual, SovereigntyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Security and Data Ownership",
  description:
    "How Saberra keeps operating intelligence inspectable, human-reviewed, source-backed, and owned by the client.",
  alternates: { canonical: "/security" }
};

export default function SecurityPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Your operating intelligence should live where your team can inspect it.</h1>
          <p>
            Saberra is built so your team can see the records, review what becomes trusted, and trace answers back to
            sources.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <SecurityBoundaryVisual />
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <SectionHeader title="Trust starts with records your team can inspect.">
            Saberra does not ask you to trust unsourced AI output. The system creates candidates, humans review them,
            and Sera answers from the documented record.
          </SectionHeader>
          <ul className="list">
            <li>Client data lives in the client&apos;s Notion workspace and tool accounts.</li>
            <li>AI extraction creates draft or candidate records for human review.</li>
            <li>Sera answers from reviewed organizational records with source context.</li>
            <li>The standard deployment uses Google Workspace, native Google Meet capture, Notion, an AI provider account, Railway, and a dedicated inbox.</li>
            <li>Zoom, Teams, and other meeting platforms can be captured when transcripts or summaries are emailed into the dedicated capture inbox.</li>
            <li>Notion is the default memory backend. Postgres or additional systems of record can be scoped for larger or more technical deployments.</li>
          </ul>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="Data sovereignty"
            title="Your data lives in your workspace. Not ours."
          >
            Saberra is configured inside accounts your organization controls: Google Workspace, Notion, your AI
            provider account, Railway, and a dedicated capture inbox. When the engagement ends, every record stays
            in your workspace. Nothing moves to a vendor database.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <SovereigntyVisual />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="An AI operations layer should make trust easier to inspect."
            copy="Start with the Living Memory Hub demo, then book a focused walkthrough when you want to evaluate fit, tools, source boundaries, and human approval ownership."
          />
        </div>
      </section>
    </main>
  );
}
