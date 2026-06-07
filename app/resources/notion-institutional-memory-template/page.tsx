import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { DatabaseMapVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Notion Institutional Memory Template",
  description:
    "A manual Notion institutional memory template for decisions, risks, roles, tasks, meetings, policies, source records, and review queues.",
  alternates: { canonical: "/resources/notion-institutional-memory-template" }
};

export default function NotionInstitutionalMemoryTemplatePage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>A Notion template for institutional memory.</h1>
          <p>
            The manual Memory OS gives teams a structured way to preserve decisions, risks, roles, meetings, policies,
            tasks, sources, and review queues inside Notion.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <article className="card">
            <h2 className="serif">The template is useful. The upkeep is the pitch.</h2>
            <p>
              A manual system can work when someone maintains it. Saberra exists because the most important memory is
              often created in meetings and email before anyone updates Notion.
            </p>
          </article>
          <ul className="list">
            <li>Use the template to see what a complete memory structure requires.</li>
            <li>Manually add records for decisions, risks, tasks, roles, and policies.</li>
            <li>Notice where updates fall behind after real meetings.</li>
            <li>Use Saberra when the capture and review loop should run automatically.</li>
          </ul>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <DatabaseMapVisual />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Get the manual Memory OS."
            copy="Duplicate the structure, use it manually, then see what Saberra automates."
          />
        </div>
      </section>
    </main>
  );
}
