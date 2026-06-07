import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Notion AI vs Saberra",
  description:
    "Notion AI can answer from what is already written. Saberra captures what teams forget to write down and turns it into reviewed institutional memory.",
  alternates: { canonical: "/resources/notion-ai-vs-saberra" }
};

export default function NotionAiVsSaberraPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Notion AI vs Saberra",
    description: metadata.description,
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/notion-ai-vs-saberra/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero">
        <div className="container">
          <h1>Notion AI answers from what exists. Saberra helps create the record.</h1>
          <p>
            Notion AI is valuable when the right context is already written down. Saberra solves the upstream problem:
            meetings, emailed transcripts, email threads, decisions, risks, and roles that never become structured memory.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <article className="card">
            <h2 className="serif">The gap is not search. The gap is capture and review.</h2>
            <p>
              Many teams already have Notion. The issue is that people do not consistently convert meetings and email
              into durable records. Saberra uses Notion as the default memory backend, then adds capture, extraction,
              human review, and Sera retrieval.
            </p>
          </article>
          <ul className="list">
            <li>Notion AI helps with content already in Notion.</li>
            <li>Saberra captures meeting and email output before it disappears.</li>
            <li>Human review keeps trusted memory inspectable.</li>
            <li>Sera answers from reviewed records with source context.</li>
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Your Notion workspace can become memory infrastructure."
            copy="Get the manual 20-database Memory OS, then see what Saberra automates."
          />
        </div>
      </section>
    </main>
  );
}
