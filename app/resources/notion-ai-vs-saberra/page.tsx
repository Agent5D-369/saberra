import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import { SeraEvidenceVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Notion AI vs Saberra",
  description:
    "Notion AI can answer from what is already written. Saberra captures what teams forget to write down and turns it into reviewed institutional memory.",
  alternates: { canonical: "/resources/notion-ai-vs-saberra" }
};

const comparisonRows = [
  ["Primary job", "Answer questions from Notion content you already wrote.", "Capture what your team never writes down and turn it into reviewed, source-backed memory."],
  ["Source material", "What exists in your Notion workspace.", "Google Meet recordings, emailed transcripts, email threads, source records, and review queues."],
  ["Record creation", "Requires a human to write the record first.", "Sera extracts structured draft records from raw meeting and email output automatically."],
  ["Review and trust", "No review layer. Answers from whatever exists.", "Nothing becomes trusted memory without human review and approval."],
  ["Retrieval depth", "Answers from Notion page content.", "Answers from reviewed decisions, tasks, risks, roles, policies, and sources with citations."],
  ["Transition readiness", "As good as whatever your team documented before someone left.", "Continuous capture means institutional context survives transitions regardless of documentation habits."],
  ["Setup", "Included in Notion AI subscription. No configuration.", "Done-for-you 4-week deployment including capture routing, review workflow, and Sera baseline."],
  ["Best for", "Teams that already write things into Notion and want faster retrieval.", "Teams where important context lives in meetings and email and never reaches Notion."]
];

const whenToChooseNotion = [
  "Your team consistently documents decisions, tasks, and role changes into Notion already.",
  "You want a retrieval layer over content your team actively writes and maintains.",
  "You are solving a search problem, not a capture behavior problem.",
  "Your team has the discipline to keep Notion current through transitions and role changes."
];

const whenToChooseSaberra = [
  "Important organizational context lives in meeting output and email threads that no one is documenting.",
  "Key-person transitions result in knowledge loss that cannot be recovered by reading Notion.",
  "Your team has tried using Notion more consistently and the behavior problem keeps reasserting.",
  "You need source-backed answers that can be traced back to the meeting or email where something was said.",
  "Human review is important to you: you want trusted memory, not whatever was recently written."
];

export default function NotionAiVsSaberraPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Notion AI vs Saberra",
    description: "Notion AI can answer from what is already written. Saberra captures what teams forget to write down.",
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/notion-ai-vs-saberra/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://saberra.com"}, {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://saberra.com/resources"}, {"@type": "ListItem", "position": 3, "name": "Notion AI vs. Saberra", "item": "https://saberra.com/resources/notion-ai-vs-saberra"}]}) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Comparison: Notion AI vs Saberra</div>
          <h1>Notion AI answers from what exists. Saberra helps create the record.</h1>
          <p>
            Notion AI is valuable when the right context is already written down. Saberra solves the upstream problem:
            meetings, decisions, risks, and role changes that never become structured memory in the first place.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="The core difference"
            title="The gap is not search. The gap is capture and review."
          >
            Most teams already have Notion. The issue is that people do not consistently convert meetings and email
            into durable records. Notion AI works with what is in Notion. Saberra works on what your team is failing
            to put there.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <SeraEvidenceVisual />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="comparison-table" role="table" aria-label="Notion AI versus Saberra">
            <div className="comparison-row comparison-head" role="row">
              <span role="columnheader">Dimension</span>
              <span role="columnheader">Notion AI</span>
              <span role="columnheader">Saberra</span>
            </div>
            {comparisonRows.map(([dim, notion, saberra]) => (
              <div className="comparison-row" role="row" key={dim}>
                <strong role="cell">{dim}</strong>
                <span role="cell">{notion}</span>
                <span role="cell">{saberra}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container split">
          <div>
            <div className="eyebrow">When Notion AI is the right choice</div>
            <h3 className="serif" style={{ marginBottom: 16 }}>Your team already documents consistently.</h3>
            <ul className="list">
              {whenToChooseNotion.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="eyebrow">When Saberra is the right choice</div>
            <h3 className="serif" style={{ marginBottom: 16 }}>Your team&apos;s context lives in meetings and email.</h3>
            <ul className="list">
              {whenToChooseSaberra.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <article className="card" style={{ maxWidth: 680, margin: "0 auto" }}>
            <div className="eyebrow">They are not mutually exclusive</div>
            <h3 className="serif">Saberra uses Notion as the memory backend.</h3>
            <p>
              Saberra deploys the Living Memory Hub inside your own Notion workspace. Sera extracts and structures
              records into Notion databases your team can inspect, edit, and govern. Notion AI can then answer from
              those reviewed records, adding a retrieval layer on top of content that is now structured and
              source-backed.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Your Notion workspace can become the record your team actually trusts."
            copy="Open the Living Memory Hub demo and see what reviewed organizational memory looks like inside Notion. Then take the Memory Audit to see where your current record has the biggest gaps."
            primary="Open the demo hub"
            primaryHref="/notion-template"
            secondary="Take the Memory Audit"
            secondaryHref="/audit"
          />
        </div>
      </section>
    </main>
  );
}
