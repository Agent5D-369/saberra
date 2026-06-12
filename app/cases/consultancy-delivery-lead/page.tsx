import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { SegmentMemoryVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Case Study: Consultancy Delivery Lead Transition",
  description:
    "How a boutique consultancy used Saberra to preserve client context, delivery decisions, and relationship history through a delivery lead transition. New lead had full client context by week two.",
  alternates: { canonical: "/cases/consultancy-delivery-lead" }
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Consultancy delivery lead transition without client context loss",
  description: "How a boutique consultancy used Saberra to capture client context, engagement history, and delivery decisions through a delivery lead transition.",
  author: { "@type": "Organization", name: "Saberra" },
  publisher: { "@type": "Organization", name: "Saberra" },
  mainEntityOfPage: `${siteUrl}/cases/consultancy-delivery-lead/`
};

const beforeState = [
  "Client context lived in the outgoing lead&apos;s head: what had been tried, what the client was sensitive about, why certain decisions were made the way they were.",
  "Re-ramping a new delivery lead on a client typically cost four to six weeks of reduced output and elevated client risk.",
  "Past engagement decisions were not documented in a way the new lead could act from.",
  "Client relationships had been built on trust that was personal, not organizational.",
  "The firm&apos;s institutional knowledge about how to work with each client evaporated when someone left."
];

const captured = [
  ["Client context and history", "Engagement history, client preferences, communication patterns, what had been tried, and the reasoning behind key delivery decisions across 8 active engagements."],
  ["Delivery decisions and rationale", "Why the delivery approach was structured a certain way, what had been rejected and why, and what the client had agreed to at each stage."],
  ["Open commitments and risks", "Outstanding deliverables, promised follow-ups, and flagged risks from weekly client meetings captured before the transition."],
  ["Relationship intelligence", "Key stakeholder context: who to brief first, who the real decision-maker is, communication style preferences, and known sensitivities."],
  ["Engagement milestones", "What had been completed, what was in progress, what had been deferred, and what the client&apos;s view of progress was."]
];

const afterState = [
  "New delivery lead asked Sera: what does the client care about most, what have we promised, what has gone wrong before.",
  "Sera returned client context organized by stakeholder, open commitments, past delivery issues, and the reasoning behind the current engagement structure.",
  "Client did not notice a transition had occurred until week three, when the new lead mentioned it.",
  "Firm retained client engagement knowledge it would have otherwise lost entirely.",
  "Re-ramp time dropped from six weeks to less than two."
];

export default function ConsultancyTransitionCasePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://saberra.com"}, {"@type": "ListItem", "position": 2, "name": "Case Studies", "item": "https://saberra.com/cases"}, {"@type": "ListItem", "position": 3, "name": "Consultancy Delivery Lead", "item": "https://saberra.com/cases/consultancy-delivery-lead"}]}) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Case study: Boutique consultancy</div>
          <h1>The delivery lead left. The client did not notice for three weeks.</h1>
          <p>
            A boutique consultancy used Saberra to capture delivery lead context across 8 active client engagements
            before a planned transition. The incoming lead had full client context by the end of week two.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container split">
          <div>
            <div className="eyebrow">Before Saberra</div>
            <h2 className="serif">Client context was personal, not organizational.</h2>
            <ul className="list">
              {beforeState.map((item) => (
                <li key={item} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </div>
          <SegmentMemoryVisual type="consultancy" />
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="eyebrow">What Saberra captured</div>
          <h2 className="serif" style={{ marginBottom: 32 }}>
            Eight client engagements worth of context, structured and reviewed before the transition date.
          </h2>
          <div className="grid-2">
            {captured.map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p dangerouslySetInnerHTML={{ __html: copy }} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container split">
          <div>
            <div className="eyebrow">After deployment</div>
            <h2 className="serif">Six weeks of re-ramp became two.</h2>
            <ul className="list">
              {afterState.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <article className="case-vignette">
            <div className="eyebrow">What changed</div>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.5, color: "#d5dddf" }}>
              Before the first client call, the new lead asked Sera about the client&apos;s history with
              the engagement. Sera returned the last four weeks of delivery decisions, the two commitments made in
              the most recent meeting, and context on a stakeholder the client had flagged as a risk six months earlier.
              The call opened without a single sign the lead was new.
            </p>
            <div className="vignette-stats">
              <span>8 engagements captured</span>
              <span>Re-ramp: 6 weeks to 2</span>
              <span>Client noticed at week 3</span>
              <span>0 client relationships lost</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Client relationships should belong to the firm, not to the person who managed them."
            copy="See how Saberra captures delivery context, client relationship history, and engagement decisions before the person who held them moves on."
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
