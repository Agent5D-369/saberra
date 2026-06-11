import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { SegmentMemoryVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Case Study: Governance Coordinator Transition",
  description:
    "How a self-managing organization used Saberra to capture 38 decisions, 22 role records, and 14 open risks before a coordinator transition. The incoming coordinator had full context on day one.",
  alternates: { canonical: "/cases/governance-coordinator-transition" }
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Governance coordinator transition without memory loss",
  description: "How a self-managing organization used Saberra to preserve governance decisions, role history, and open risks through a coordinator transition.",
  author: { "@type": "Organization", name: "Saberra" },
  publisher: { "@type": "Organization", name: "Saberra" },
  mainEntityOfPage: `${siteUrl}/cases/governance-coordinator-transition/`
};

const beforeState = [
  "Governance decisions lived in meeting notes, old email threads, and the memory of the outgoing coordinator.",
  "Role history required interviewing three or four people to reconstruct a single account of who held what and when.",
  "Open risks and objections from governance meetings were not consistently tracked anywhere findable.",
  "A six-month re-ramp was the accepted cost of every coordinator transition.",
  "Distributed authority was quietly recentralizing around the people who remembered the most."
];

const captured = [
  ["38 governance decisions", "Every major decision from the previous six months of circle and governance meetings, with source context and ownership."],
  ["22 role records", "Current role holders, role history, domains, and accountabilities with source trails back to the governance meetings where assignments were made."],
  ["14 open risks", "Governance and operating risks surfaced from meeting transcripts and email context before they became coordination failures."],
  ["Policy and consent records", "Policy proposals, objections, and consent decisions with source traceability."],
  ["Advice process context", "Reasoning and input from major decisions, connected to the decision that followed."]
];

const afterState = [
  "Incoming coordinator asked Sera directly: what has changed, who owns what, which commitments are still open.",
  "Sera answered from reviewed records with source context, on day one.",
  "No three-month re-ramp. No dependency on whoever remembered the most.",
  "No calls to the outgoing coordinator to reconstruct what had been decided.",
  "Governance authority stayed distributed instead of collapsing into whoever was left."
];

export default function GovernanceTransitionCasePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Case study: Self-managing organization</div>
          <h1>The governance director transitioned. The organization did not notice.</h1>
          <p>
            A 40-person self-managing organization used Saberra to capture six months of governance decisions, role
            records, and open risks before a planned coordinator transition. The incoming coordinator had full context
            on day one.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container split">
          <div>
            <div className="eyebrow">Before Saberra</div>
            <h2 className="serif">Governance memory lived in three people and nowhere else.</h2>
            <ul className="list">
              {beforeState.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <SegmentMemoryVisual type="governance" />
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="eyebrow">What Saberra captured</div>
          <h2 className="serif" style={{ marginBottom: 32 }}>
            Six months of governance context, structured and reviewed before the transition date.
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
            <h2 className="serif">Full context. Day one. No reconstruction.</h2>
            <ul className="list">
              {afterState.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <article className="case-vignette">
            <div className="eyebrow">What changed</div>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.5, color: "#d5dddf" }}>
              The incoming coordinator asked Sera what had changed in the last ninety days of governance meetings.
              Sera returned 14 decisions, 7 open risks, and 4 policy updates with source citations. The
              conversation that used to take three weeks of interviews took thirty seconds.
            </p>
            <div className="vignette-stats">
              <span>38 decisions captured</span>
              <span>22 role records preserved</span>
              <span>14 risks surfaced</span>
              <span>0 weeks re-ramp</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Your next transition does not have to cost three months."
            copy="See how Saberra captures governance decisions, role history, and open risks before the people who hold them are no longer available to ask."
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
