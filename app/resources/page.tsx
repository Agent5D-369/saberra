import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Saberra resources for institutional memory, organizational memory, Notion memory systems, and zero behavior change knowledge capture.",
  alternates: { canonical: "/resources" }
};

export default function ResourcesPage() {
  const resources = [
    ["What is an institutional memory system?", "A plain-English guide to capture, review, retrieval, and organizational continuity."],
    ["Meeting summaries are not memory", "Why per-call notes fail to become durable organizational intelligence."],
    ["Institutional Memory OS for Notion", "A manual structure for decisions, tasks, risks, roles, meetings, and review queues."],
    ["The cost of key-person memory loss", "How founder bottlenecks, departures, and slow onboarding create invisible operations debt."]
  ];

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>The institutional memory resource hub.</h1>
          <p>
            A future home for guides, templates, and category-defining content on organizational memory infrastructure.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeader title="Start with the questions buyers are already asking." />
          <div className="grid-4">
            {resources.map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Get the Notion structure, then automate it."
            copy="The template shows the shape of institutional memory. Saberra is what keeps it updated from meetings and email."
            primary="Get the Notion Template"
            primaryHref="mailto:rick@amora.cr?subject=Institutional%20Memory%20OS%20for%20Notion"
          />
        </div>
      </section>
    </main>
  );
}
