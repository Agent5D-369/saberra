import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { SegmentMemoryVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Representative Case Study: Nonprofit Leadership Handoff",
  description:
    "How a 12-person nonprofit captured 6 years of funder context, program memory, and board decisions before an executive director transition. The incoming ED had institutional context the board thought was permanently lost.",
  alternates: { canonical: "/cases/nonprofit-leadership-handoff" }
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Nonprofit leadership handoff without institutional memory loss",
  description: "How a nonprofit used Saberra to capture funder relationships, program history, and board decisions through an executive director transition.",
  author: { "@type": "Organization", name: "Saberra" },
  publisher: { "@type": "Organization", name: "Saberra" },
  mainEntityOfPage: `${siteUrl}/cases/nonprofit-leadership-handoff/`
};

const beforeState = [
  "Six years of funder relationship context lived in the outgoing ED&apos;s inbox and memory.",
  "Program history and what had been tried before required interviewing staff who might or might not remember it accurately.",
  "Board decisions and the reasoning behind them were scattered across PDFs, email threads, and in-person conversations that were never recorded.",
  "The organization had institutional knowledge but no institutional memory anyone could access.",
  "Grant renewal conversations required starting over each time because the relationship context was gone."
];

const captured = [
  ["6 years of funder context", "Relationship history, grant decisions, program updates shared with funders, and communication patterns across all active and lapsed funder relationships."],
  ["31 board decisions", "Decisions and the reasoning behind them from three years of board meeting minutes, with source context and vote records where available."],
  ["Program evolution records", "What was tried, what changed, why it changed, and what the outcomes were across major program iterations."],
  ["Key relationship contacts", "Staff, volunteers, partners, and funders with their history, role in the organization, and current standing."],
  ["Open commitments", "Outstanding commitments to funders, partners, and staff captured before the transition so nothing fell through during the handover."]
];

const afterState = [
  "Incoming ED asked Sera about the funder relationship history before the first renewal call.",
  "Sera returned communication history, past asks, what had been promised, and context on why a previous grant cycle was declined.",
  "Board did not need to reconstruct six years of decisions from memory at the first board meeting.",
  "Program staff stopped being the sole holders of institutional program memory.",
  "The organization retained knowledge its own leadership did not know it had."
];

export default function NonprofitHandoffCasePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://saberra.com"}, {"@type": "ListItem", "position": 2, "name": "Case Studies", "item": "https://saberra.com/cases"}, {"@type": "ListItem", "position": 3, "name": "Nonprofit Leadership Handoff", "item": "https://saberra.com/cases/nonprofit-leadership-handoff"}]}) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Representative case study: Nonprofit organization</div>
          <h1>Six years of funder context. Preserved through a leadership transition the board thought would erase it.</h1>
          <p>
            A 12-person nonprofit used Saberra to capture its executive director&apos;s institutional memory before a
            planned leadership transition. The incoming ED had full funder, program, and board context before the first
            board meeting.
          </p>
          <p className="case-placeholder-note">
            Placeholder conversion story based on Saberra&apos;s target deployment patterns. Replace with named client
            proof when approved.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container split">
          <div>
            <div className="eyebrow">Before Saberra</div>
            <h2 className="serif">The organization&apos;s memory lived in one person&apos;s inbox.</h2>
            <ul className="list">
              {beforeState.map((item) => (
                <li key={item} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </div>
          <SegmentMemoryVisual type="nonprofit" />
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="eyebrow">What Saberra captured</div>
          <h2 className="serif" style={{ marginBottom: 32 }}>
            Six years of operating context, structured and reviewed before the transition date.
          </h2>
          <div className="grid-2">
            {captured.map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container split">
          <div>
            <div className="eyebrow">After deployment</div>
            <h2 className="serif">Institutional memory the organization did not know it had.</h2>
            <ul className="list">
              {afterState.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <article className="case-vignette">
            <div className="eyebrow">What changed</div>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.5, color: "#d5dddf" }}>
              Before the first renewal call with a major funder, the incoming ED asked Sera for the full relationship
              history. Sera returned four years of communication context, the previous decline reason, two outstanding
              follow-ups, and a list of program updates the funder had been told about. The call lasted half as long as
              expected. The renewal was approved.
            </p>
            <div className="vignette-stats">
              <span>6 years of funder context</span>
              <span>31 board decisions</span>
              <span>Open commitments preserved</span>
              <span>0 months re-ramp</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Your next leadership transition does not have to cost you the relationships you built."
            copy="See how Saberra captures funder context, program history, and board decisions before the person who holds them moves on."
            primary="Apply for a founding spot"
            primaryHref="/founding-access"
            secondary="Take the Memory Audit"
            secondaryHref="/audit"
          />
        </div>
      </section>
    </main>
  );
}
