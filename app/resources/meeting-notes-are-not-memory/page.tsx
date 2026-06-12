import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Meeting Notes Are Not Organizational Memory",
  description:
    "Why meeting summaries and note-taking tools are not enough for durable institutional memory across decisions, tasks, risks, roles, and policies.",
  alternates: { canonical: "/resources/meeting-notes-are-not-memory" }
};

export default function MeetingNotesAreNotMemoryPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Meeting notes are not organizational memory",
    description: metadata.description,
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/meeting-notes-are-not-memory/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://saberra.com"}, {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://saberra.com/resources"}, {"@type": "ListItem", "position": 3, "name": "Meeting Notes Are Not Memory", "item": "https://saberra.com/resources/meeting-notes-are-not-memory"}]}) }} />
      <section className="page-hero">
        <div className="container">
          <h1>Meeting notes are not organizational memory.</h1>
          <p>
            Notes help people remember a call. Memory helps an organization find what was decided, assigned, approved,
            changed, and left open months later.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <article className="card">
            <h2 className="serif">The decision is not lost when it is made.</h2>
            <p>
              It is lost when nobody can find it later. A transcript or summary can still leave the team debating the
              same issue again because the decision was never converted into a reviewed, source-backed record.
            </p>
          </article>
          <ul className="list">
            <li>Meeting summaries are isolated by meeting.</li>
            <li>Tasks often fail to connect to source context.</li>
            <li>Role changes and policies get buried inside long notes.</li>
            <li>AI answers are risky when the underlying record is not reviewed.</li>
          </ul>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <div className="grid-2">
            <article className="card">
              <h3>Meeting notes capture what happened.</h3>
              <p>Useful, but usually trapped inside a single meeting artifact.</p>
            </article>
            <article className="card">
              <h3>Institutional memory preserves what matters.</h3>
              <p>Decisions, risks, tasks, roles, policies, and sources become part of a cumulative record.</p>
            </article>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Build operating intelligence, not another pile of notes."
            copy="See where your current system is leaking, then open the Living Memory Hub to see what reviewed memory actually looks like."
            primary="Take the Memory Audit"
            primaryHref="/audit"
            secondary="Open the demo hub"
            secondaryHref="/notion-template"
          />
        </div>
      </section>
    </main>
  );
}
