import type { Metadata } from "next";
import { NotionTemplateGateForm } from "@/components/LeadForms";
import { SectionHeader } from "@/components/UI";
import { DatabaseMapVisual, NotionTemplateVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Manual Memory OS for Notion",
  description:
    "Get the manual Memory OS for Notion: 20 structured databases for decisions, risks, roles, tasks, meetings, policies, review queues, and source records.",
  alternates: { canonical: "/notion-template" }
};

export default function NotionTemplatePage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Get the manual Institutional Memory OS for Notion.</h1>
          <p>
            A practical 20-database Notion structure for teams that want decisions, risks, roles, tasks, meetings,
            policies, source records, and review queues to stop disappearing.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <div>
            <SectionHeader eyebrow="Manual Memory OS" title="The structure helps. The manual upkeep reveals the problem.">
              The template gives you the decision, risk, role, task, meeting, policy, source, and review structure
              Saberra uses. It does not capture emails, route meeting transcripts, draft records, manage review, or let
              your team ask Sera for sourced answers.
            </SectionHeader>
            <article className="card challenge-card">
              <h3>Run the 7-day Memory Stress Test.</h3>
              <p>
                Duplicate the template, then manually add every decision, risk, role change, policy update, source
                email, and meeting outcome your team creates this week. If the structure helps but the upkeep feels
                unrealistic, you have found the exact gap Saberra automates.
              </p>
            </article>
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
              ["Clear automation gap", "When manual updates become the bottleneck, Saberra captures meeting and email output, routes records for review, keeps sources attached, and lets your team ask Sera."]
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
