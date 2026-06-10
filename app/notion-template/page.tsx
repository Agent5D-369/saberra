import type { Metadata } from "next";
import { NotionTemplateGateForm } from "@/components/LeadForms";
import { SectionHeader } from "@/components/UI";
import { DatabaseMapVisual, NotionTemplateVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Saberra Living Memory Hub Demo",
  description:
    "Access the Saberra Living Memory Hub demo in Notion and learn how to duplicate it into your own workspace.",
  alternates: { canonical: "/notion-template" }
};

export default function NotionTemplatePage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Open the Saberra Living Memory Hub demo.</h1>
          <p>
            See the private Notion backend where decisions, risks, roles, tasks, meetings, policies, source records,
            review queues, and operating memory can live.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <div>
            <SectionHeader eyebrow="Living Memory Hub" title="Explore the backend before Sera starts organizing it.">
              The demo shows the decision, risk, role, task, meeting, policy, source, profile, project, and review
              structure Saberra uses. It does not capture emails, route meeting transcripts, draft records, manage
              review, or let your team ask Sera for sourced answers until Saberra is configured.
            </SectionHeader>
            <article className="card challenge-card">
              <h3>Duplicate it in the easiest possible way.</h3>
              <p>
                Submit the short form, open the demo database, use Notion&apos;s duplicate control to copy it into your
                workspace, then duplicate that local copy again if you want a clean version with no sample records.
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
              ["Demo database access", "Open the working Living Memory Hub with sample decisions, tasks, risks, roles, policies, meetings, people, sources, and review queues."],
              ["Local duplication", "Copy the hub into your own Notion workspace so you can inspect, edit, and test the structure."],
              ["Clean database option", "Duplicate your local copy again, remove the sample records, and keep the original demo copy as a reference."]
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
