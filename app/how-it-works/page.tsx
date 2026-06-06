import type { Metadata } from "next";
import { CaptureGrid, ProcessFlow, SeraDemoSection, TrustSection } from "@/components/HomeSections";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "How Saberra Works",
  description:
    "See how Saberra captures Google Meet outputs and email, extracts structured records with Claude, routes them through human review, stores them in Notion, and lets teams ask Sera sourced questions.",
  alternates: { canonical: "/how-it-works" }
};

export default function HowItWorksPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Capture, review, remember.</h1>
          <p>
            Saberra turns natural work output into trusted organizational memory through a clear pipeline your team does
            not have to manage.
          </p>
        </div>
      </section>
      <ProcessFlow />
      <section className="section tight">
        <div className="container split">
          <SectionHeader title="The team keeps working. The memory keeps growing.">
            A dedicated inbox receives Google Meet outputs and important operational email. Claude proposes structured
            records. A human reviews the queue. Approved records become the source Sera can answer from.
          </SectionHeader>
          <ul className="list">
            <li>Google Meet recordings, transcripts, and Gemini notes are captured through email.</li>
            <li>Operational email threads can be forwarded when they contain decisions, risks, or commitments.</li>
            <li>Claude extracts candidates for decisions, tasks, roles, risks, policies, and memory.</li>
            <li>Records enter 17 structured Notion databases with status and source traceability.</li>
            <li>Nothing becomes trusted memory until human review accepts it.</li>
          </ul>
        </div>
      </section>
      <CaptureGrid />
      <SeraDemoSection />
      <TrustSection />
      <section className="section">
        <div className="container">
          <CTABand title="See what your current memory system is missing." copy="The audit takes a few minutes and gives you a practical diagnosis of where context is leaking." />
        </div>
      </section>
    </main>
  );
}
