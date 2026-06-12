import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import { PipelineAnatomyVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Saberra vs Meeting Notetakers",
  description:
    "How Saberra differs from AI meeting notetakers like Fireflies, Otter, and Fathom. Notetakers help you remember one call. Saberra turns meetings into cumulative, reviewed organizational memory.",
  alternates: { canonical: "/resources/saberra-vs-meeting-notetakers" }
};

const comparisonRows = [
  ["Primary job", "Summarize a single meeting and produce a searchable transcript.", "Build cumulative institutional memory from meetings, email, and source records over time."],
  ["Output type", "Meeting summary and transcript. Useful notes, ungoverned.", "Draft records for decisions, tasks, risks, roles, policies, and sources that become trusted only after human review."],
  ["Source coverage", "Meetings the tool was present for.", "Google Meet, emailed transcripts from any platform, email context, and source records."],
  ["Human review layer", "None. Whatever the AI summarized becomes the record.", "Nothing becomes trusted organizational memory without reviewer approval."],
  ["Source traceability", "You can re-read the transcript.", "Every reviewed record links back to the specific meeting or email that produced it."],
  ["Retrieval", "Search transcripts or ask about meetings.", "Ask Sera about decisions, risks, roles, tasks, policies, and sources with citations from reviewed records."],
  ["Transition readiness", "Meeting history, but no structured organizational context.", "Reviewed decisions, role history, and risk records that survive transitions without needing the previous person."],
  ["Reviewer workflow", "None. No review, no approval, no governance.", "A dedicated review queue. Sera proposes. Your reviewer approves, edits, or rejects."],
  ["Best for", "Individuals and teams who want to remember what happened in meetings.", "Teams that need organizational memory to survive transitions, support decisions, and create accountability."]
];

const limitationsOfNotetakers = [
  "A summary is not a decision record. The fact that someone said something in a meeting is not the same as the organization deciding something. Notetakers capture the former, not the latter.",
  "Transcripts are not queryable organizational memory. Searching across 200 meeting transcripts to find a decision made six months ago is a research project, not a system.",
  "No review means no governance. When an AI summary becomes the organizational record without a human deciding whether it is correct, you have replaced one kind of unreliability with another.",
  "Meeting notetakers capture what was said. Saberra captures what was decided, assigned, flagged, and agreed. Those are different categories with different organizational value.",
  "Notetaker context lives in individual meeting history. Organizational context needs to survive role changes, leadership transitions, and the absence of whoever was in the meeting."
];

export default function SaberraVsMeetingNotetakersPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Saberra vs Meeting Notetakers",
    description: "How Saberra differs from AI meeting notetakers: notetakers help individuals remember calls, Saberra helps organizations build cumulative reviewed memory.",
    author: { "@type": "Organization", name: "Saberra" },
    publisher: { "@type": "Organization", name: "Saberra" },
    mainEntityOfPage: `${siteUrl}/resources/saberra-vs-meeting-notetakers/`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://saberra.com"}, {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://saberra.com/resources"}, {"@type": "ListItem", "position": 3, "name": "Saberra vs. Meeting Notetakers", "item": "https://saberra.com/resources/saberra-vs-meeting-notetakers"}]}) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Comparison: Meeting notetakers vs Saberra</div>
          <h1>Summaries help people remember a call. Saberra helps organizations remember everything that matters.</h1>
          <p>
            Fireflies, Otter, Fathom, and similar tools solve a personal memory problem. Saberra solves an
            organizational one: decisions, tasks, risks, roles, and policies that should outlast the meeting where
            they were created.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="The core difference"
            title="A summary is not a decision record."
          >
            The gap between a meeting summary and a trusted organizational record is not a search interface.
            It is extraction, structure, human review, and a query layer that answers from the approved record,
            not from raw transcript text.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <PipelineAnatomyVisual />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="comparison-table" role="table" aria-label="Meeting notetakers versus Saberra">
            <div className="comparison-row comparison-head" role="row">
              <span role="columnheader">Dimension</span>
              <span role="columnheader">Meeting notetaker (Fireflies, Otter, Fathom)</span>
              <span role="columnheader">Saberra</span>
            </div>
            {comparisonRows.map(([dim, notetaker, saberra]) => (
              <div className="comparison-row" role="row" key={dim}>
                <strong role="cell">{dim}</strong>
                <span role="cell">{notetaker}</span>
                <span role="cell">{saberra}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container">
          <SectionHeader
            eyebrow="Why notetakers are not enough"
            title="What a summary cannot do for your organization."
            center
          />
          <div className="grid-3" style={{ marginTop: 24 }}>
            {limitationsOfNotetakers.map((item) => (
              <article className="card" key={item}>
                <p style={{ color: "#d5dddf", fontSize: "1rem", lineHeight: 1.6 }}>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Summaries are useful. Operating intelligence is durable."
            copy="Open the Living Memory Hub demo and see what reviewed, source-backed organizational memory looks like. Then take the audit to see where your organization's current record has the biggest gaps."
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
