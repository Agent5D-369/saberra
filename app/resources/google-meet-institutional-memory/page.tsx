import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Google Meet Institutional Memory",
  description:
    "How Google Meet, emailed transcripts, email, human review, and Notion can become institutional memory instead of isolated meeting notes.",
  alternates: { canonical: "/resources/google-meet-institutional-memory" }
};

export default function GoogleMeetInstitutionalMemoryPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Google Meet Institutional Memory",
    description: metadata.description,
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/google-meet-institutional-memory/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero">
        <div className="container">
          <h1>Turn Google Meet output into institutional memory.</h1>
          <p>
            Google Meet is Saberra&apos;s native meeting workflow. Transcripts and summaries from other platforms can
            also enter the memory loop when they are emailed into the dedicated capture inbox.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <article className="card">
            <h2 className="serif">The meeting is only the beginning.</h2>
            <p>
              A transcript is not memory until the important pieces are structured, reviewed, connected to sources, and
              made retrievable later. Saberra turns meeting output into decision candidates, tasks, risks, role changes,
              policy records, source records, and Sera answers.
            </p>
          </article>
          <ul className="list">
            <li>Native Google Meet capture for Google Workspace teams.</li>
            <li>Email intake for transcripts and summaries from other platforms.</li>
            <li>Human review before records become trusted memory.</li>
            <li>Notion as the default inspectable memory backend.</li>
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Your meetings already contain the memory."
            copy="Saberra makes the record durable enough to ask later."
          />
        </div>
      </section>
    </main>
  );
}
