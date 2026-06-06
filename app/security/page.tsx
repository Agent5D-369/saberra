import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import { SecurityBoundaryVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Security and Data Ownership",
  description:
    "How Saberra handles data ownership, human review, sourced answers, and current infrastructure boundaries.",
  alternates: { canonical: "/security" }
};

export default function SecurityPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Your memory should live where your team can inspect it.</h1>
          <p>
            Saberra is built around data ownership, human review, clear sources, and client-controlled infrastructure.
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
          <SectionHeader title="The trust model is practical, not performative.">
            Saberra does not ask you to trust unsourced AI output. The system creates candidates, humans review them,
            and Sera answers from the documented record.
          </SectionHeader>
          <ul className="list">
            <li>Client data lives in the client&apos;s Notion workspace and infrastructure.</li>
            <li>AI extraction creates draft or candidate records for human review.</li>
            <li>Sera answers from reviewed organizational records with source context.</li>
            <li>The current version requires Google Workspace, Google Meet, Notion, an AI provider account, Railway, and a dedicated inbox.</li>
            <li>The current version does not process Zoom or Teams.</li>
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand title="Memory infrastructure should make trust easier to inspect." copy="Start with the free Notion structure, then book a focused call when you want to evaluate fit, tools, and review ownership." />
        </div>
      </section>
    </main>
  );
}
