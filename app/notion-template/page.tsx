import type { Metadata } from "next";
import { NotionTemplateGateForm } from "@/components/LeadForms";
import { SectionHeader } from "@/components/UI";
import { DatabaseMapVisual, NotionTemplateVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Institutional Memory OS for Notion",
  description:
    "Get the free manual Notion template for institutional memory: 20 structured databases for decisions, risks, roles, tasks, meetings, policies, review queues, and source records.",
  alternates: { canonical: "/notion-template" }
};

export default function NotionTemplatePage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Get the manual Institutional Memory OS for Notion.</h1>
          <p>
            A practical Notion structure for teams that want decisions, risks, roles, tasks, meetings, policies, source
            records, and review queues to stop disappearing.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <div>
            <SectionHeader eyebrow="Free template" title="The structure is useful by itself. The manual upkeep is the point.">
              The template includes the memory architecture Saberra is built around, but no AI ingestion, email routing,
              automated extraction, human review workflow, or Sera retrieval layer.
            </SectionHeader>
            <NotionTemplateVisual />
          </div>
          <NotionTemplateGateForm />
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <div className="grid-3">
            {[
              ["20 structured databases", "Decisions, tasks, risks, roles, policies, meetings, people, sources, review queues, and institutional context."],
              ["Views and example records", "Start with a working manual system instead of a blank Notion page."],
              ["Clear upgrade gap", "When manual updates become the bottleneck, Saberra automates the capture and review loop."]
            ].map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <DatabaseMapVisual />
        </div>
      </section>
    </main>
  );
}
