import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import { NotionWorkspaceVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Weekly Pulse: Know What Changed Without Searching",
  description:
    "Saberra's Weekly Pulse email surfaces newly reviewed decisions, risks, tasks, and role changes so your team stays current without another meeting or another tool.",
  alternates: { canonical: "/weekly-pulse" }
};

const whatIsIncluded = [
  ["Decisions reviewed this week", "Every decision candidate that passed human review, with source context and owner."],
  ["New and updated tasks", "Tasks created or updated from meetings and email, with owners and due dates."],
  ["Open risks flagged", "Risks surfaced from the week's meetings and emails that reached review status."],
  ["Role changes detected", "Any role holder updates or new assignments captured from meeting or email context."],
  ["Records pending review", "Candidates waiting for human approval so nothing ages out of the queue unnoticed."]
];

const whyItMatters = [
  "Your team stops missing decisions made in meetings they were not in.",
  "Ops leads and chiefs of staff stop spending Monday morning asking what happened last week.",
  "Risks do not sit unread in a Notion database. They surface in the inbox everyone already watches.",
  "New team members see what changed the week they joined, not three months later when they finally ask.",
  "Leadership gets a factual record of organizational activity without a status meeting."
];

export default function WeeklyPulsePage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Weekly Pulse</div>
          <h1>What changed this week. In your inbox. Without asking anyone.</h1>
          <p>
            Sera summarizes newly reviewed organizational memory into a weekly digest: decisions made, tasks assigned,
            risks flagged, and role changes captured. Your team stays current without another meeting, another tool,
            or another Notion tab left open.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <NotionWorkspaceVisual />
        </div>
      </section>

      <section className="section tight">
        <div className="container split">
          <SectionHeader eyebrow="What the pulse contains" title="A factual digest from reviewed organizational memory.">
            The Weekly Pulse is not an AI summary of random meeting notes. Every item in the pulse was first reviewed
            and approved by a human before it became trusted organizational memory. The digest surfaces that trusted
            record, not raw output.
          </SectionHeader>
          <div>
            {whatIsIncluded.map(([title, copy]) => (
              <article className="card" key={title} style={{ marginBottom: 12 }}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Why it matters" title="Your team is already missing things that matter." center />
          <div className="grid-3" style={{ marginTop: 32 }}>
            {whyItMatters.map((item) => (
              <article className="card" key={item}>
                <p style={{ color: "#d5dddf", fontSize: "1.05rem" }}>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container split">
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="serif">Sera writes it. A human approves the memory behind it. You read it.</h2>
            <p>
              Every item in the Weekly Pulse traces back to a reviewed record in the Living Memory Hub. When something
              appears in the pulse, there is a source, a reviewer, a timestamp, and a record your team can inspect.
              The pulse is not a chatbot summary. It is a curated view of trusted memory.
            </p>
          </div>
          <ul className="list">
            <li>Sera drafts candidate records from meetings and emails throughout the week.</li>
            <li>Your reviewer approves, edits, or rejects each candidate in the review queue.</li>
            <li>Every Friday, Sera compiles newly approved records into the Weekly Pulse digest.</li>
            <li>The digest arrives in your team&apos;s inbox with links to source records in Notion.</li>
            <li>Clicking any item opens the full record with its source meeting or email trail.</li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Your team should know what changed this week without having to ask."
            copy="Start with the Living Memory Hub demo, then see how Sera keeps it current from the meetings and emails your team already creates."
            primary="Open the demo hub"
            primaryHref="/notion-template"
            secondary="Apply for a founding spot"
            secondaryHref="/founding-access"
          />
        </div>
      </section>
    </main>
  );
}
