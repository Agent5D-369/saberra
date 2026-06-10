import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Saberra vs Meeting Notetakers",
  description:
    "How Saberra differs from AI meeting notetakers by turning meetings, emailed transcripts, decisions, tasks, risks, roles, and policies into reviewed institutional memory.",
  alternates: { canonical: "/resources/saberra-vs-meeting-notetakers" }
};

export default function SaberraVsMeetingNotetakersPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Saberra vs Meeting Notetakers",
    description: metadata.description,
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/saberra-vs-meeting-notetakers/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero">
        <div className="container">
          <h1>Saberra vs meeting notetakers.</h1>
          <p>
            Meeting notetakers help people remember a call. Saberra helps the organization preserve decisions, tasks,
            risks, roles, policies, and source-backed history over time.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <div className="comparison-table" role="table" aria-label="Saberra versus meeting notetakers">
            <div className="comparison-row comparison-head" role="row">
              <span role="columnheader">Question</span>
              <span role="columnheader">Meeting notetaker</span>
              <span role="columnheader">Saberra</span>
            </div>
            {[
              ["Primary job", "Summarize one meeting.", "Build cumulative institutional memory."],
              ["Source coverage", "Mostly meeting transcripts.", "Google Meet, emailed transcripts, email, source records, and review queues."],
              ["Record quality", "Useful notes, often ungoverned.", "Draft records become trusted only after human review."],
              ["Retrieval", "Search or ask about meetings.", "Ask Sera about reviewed decisions, risks, roles, tasks, policies, and sources."],
              ["Best fit", "Individuals who want meeting notes.", "Teams that cannot afford organizational memory loss."]
            ].map(([question, notes, saberra]) => (
              <div className="comparison-row" role="row" key={question}>
                <strong role="cell">{question}</strong>
                <span role="cell">{notes}</span>
                <span role="cell">{saberra}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Summaries are useful. Operating intelligence is durable."
            copy="Open the Living Memory Hub demo, then see how Sera keeps it current from meetings, transcripts, and email."
          />
        </div>
      </section>
    </main>
  );
}
