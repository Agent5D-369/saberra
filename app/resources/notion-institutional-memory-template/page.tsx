import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { DatabaseMapVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Notion Living Memory Hub",
  description:
    "A Notion backend structure for decisions, risks, roles, tasks, meetings, policies, people, projects, source records, and review queues.",
  alternates: { canonical: "/resources/notion-institutional-memory-template" }
};

export default function NotionInstitutionalMemoryTemplatePage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Notion Living Memory Hub",
    description: metadata.description,
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/notion-institutional-memory-template/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero">
        <div className="container">
          <h1>A Notion backend for operating intelligence.</h1>
          <p>
            The Living Memory Hub gives teams a structured place for decisions, risks, roles, meetings, policies, tasks,
            people, projects, sources, and review queues inside Notion.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <article className="card">
            <h2 className="serif">The hub is useful. Sera makes it live.</h2>
            <p>
              A backend can work when someone maintains it. Saberra exists because the most important operating context
              is often created in meetings and email before anyone updates Notion.
            </p>
          </article>
          <ul className="list">
            <li>Use the hub to see what a complete trusted record requires.</li>
            <li>Manually add records for decisions, risks, tasks, roles, people, projects, and policies.</li>
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
            title="Open the Living Memory Hub."
            copy="Duplicate the structure, inspect the backend, then see how Sera keeps it current from meetings and emails."
          />
        </div>
      </section>
    </main>
  );
}
