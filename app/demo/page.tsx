import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/LeadForms";
import { SectionHeader } from "@/components/UI";
import { PipelineAnatomyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Book a Memory Demo",
  description:
    "Request a Saberra memory demo and see how Google Meet outputs and email become reviewed, sourced institutional memory.",
  alternates: { canonical: "/demo" }
};

export default function DemoPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>See how Saberra would remember for your team.</h1>
          <p>
            Request a focused walkthrough of the capture, extraction, human review, Notion memory, and Sera answer
            workflow.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <div>
            <SectionHeader title="A demo should make the mechanism obvious.">
              We will look at the kinds of meetings, email threads, decisions, risks, tasks, and roles your team already
              produces, then show where Saberra would capture and structure them.
            </SectionHeader>
            <PipelineAnatomyVisual />
          </div>
          <DemoRequestForm />
        </div>
      </section>
    </main>
  );
}
