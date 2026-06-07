import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "What Is an Institutional Memory System?",
  description:
    "A practical guide to institutional memory systems, including capture, review, retrieval, source-backed answers, and organizational continuity.",
  alternates: { canonical: "/resources/institutional-memory-system" }
};

export default function InstitutionalMemorySystemPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is an institutional memory system?",
    description: metadata.description,
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/institutional-memory-system/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero">
        <div className="container">
          <h1>What is an institutional memory system?</h1>
          <p>
            An institutional memory system helps a team preserve decisions, risks, tasks, roles, policies, and context
            after the meeting ends and after the person who remembers leaves.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <article className="card">
            <h2 className="serif">The record has to be captured, reviewed, and usable.</h2>
            <p>
              A memory system is not just a place to store notes. It is a loop: natural work output gets captured,
              structured candidates are created, humans review what should become trusted memory, and the team can ask
              plain-English questions later.
            </p>
          </article>
          <ul className="list">
            <li>Capture from meetings and email without requiring new habits.</li>
            <li>Structure decisions, tasks, risks, roles, policies, and sources.</li>
            <li>Review before the record becomes trusted.</li>
            <li>Retrieve answers with citations your team can inspect.</li>
          </ul>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <div className="grid-3">
            {[
              ["Continuity", "New leaders and role holders inherit the reasoning behind the work."],
              ["Governance", "Agreements, roles, objections, and policies stay findable."],
              ["Focus", "Senior people answer fewer questions that should already be documented."]
            ].map(([title, copy]) => (
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
            title="Start with the manual version."
            copy="Use the manual Memory OS to see what a complete institutional memory structure looks like before automating capture and review with Saberra."
          />
        </div>
      </section>
    </main>
  );
}
