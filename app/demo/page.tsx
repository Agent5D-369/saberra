import type { Metadata } from "next";
import { demoCalendarUrl } from "@/lib/site";
import { CTAButton, SectionHeader } from "@/components/UI";
import { PipelineAnatomyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Watch Sera Work | Saberra Demo",
  description:
    "Watch how Sera turns meetings and email into reviewed decisions, tasks, risks, and searchable operating memory. Book a 25-minute setup call when ready.",
  alternates: { canonical: "/demo" }
};

const outcomes = [
  ["After 2 weeks", "Your first decisions, tasks, risks, and source records are captured in a reviewed memory hub."],
  ["After 4 weeks", "Your reviewer has a working approval rhythm and your team can ask Sera for source-backed answers."],
  ["After 8 weeks", "Transitions, repeated decisions, and open commitments become visible before they cost the team another cycle."]
];

const objections = [
  ["Is our data private?", "Yes. Records live in your Google Workspace, Notion workspace, and configured accounts. Your team keeps control."],
  ["How much setup is required?", "The standard deployment is four guided weeks: source routing, hub configuration, review workflow, and operating baseline."],
  ["What if we already use Notion?", "That is usually an advantage. Saberra keeps the memory hub current instead of asking humans to update it after every meeting."],
  ["Is this just another meeting notetaker?", "No. Meeting summaries are raw material. Saberra turns them into reviewed decisions, tasks, risks, roles, and source-backed answers."]
];

export default function DemoPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
            <span className="scarcity-counter">3 of 5 founding spots remaining</span>
          </div>
          <h1>Watch Sera work on a real meeting.</h1>
          <p>
            See how operating chaos becomes reviewed decisions, owned tasks, open risks, and answers your team can
            trust. When you are ready, book one 25-minute setup call.
          </p>
          <div className="cta-row">
            <CTAButton href={demoCalendarUrl}>Book a 25-minute setup call</CTAButton>
            <CTAButton href="/audit" variant="secondary">Take the Memory Audit first</CTAButton>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container split demo-layout">
          <div>
            <div className="hero-vsl-wrap">
              <video
                src="/Saberra Explainer Video - Phase 3 - compressed.mp4"
                poster="/saberra-video-poster.jpg"
                controls
                preload="metadata"
                className="hero-vsl-video"
                playsInline
              />
            </div>
            <p className="hero-vsl-caption">
              This is the full overview. The homepage is now ready for a 60-90 second before/after cut when the edited
              asset is available.
            </p>
          </div>
          <div>
            <SectionHeader title="One page. One next step.">
              The demo path is now built for qualified buyers: watch the workflow, scan the outcomes, then book the
              setup call.
            </SectionHeader>
            <div className="demo-outcome-list">
              {outcomes.map(([label, copy]) => (
                <article className="demo-outcome" key={label}>
                  <strong>{label}</strong>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container split demo-layout">
          <div>
            <SectionHeader title="What Sera turns into operating memory.">
              Meetings and email become source-backed records your team can inspect, approve, and query.
            </SectionHeader>
            <PipelineAnatomyVisual />
          </div>
          <div className="card">
            <h2 className="serif">Common questions before a setup call.</h2>
            <div className="faq-list compact">
              {objections.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
            <div className="cta-row">
              <CTAButton href={demoCalendarUrl}>Book a 25-minute setup call</CTAButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
