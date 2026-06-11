import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import { AuditReportVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Real Cost of Key Person Knowledge Loss",
  description:
    "What organizations actually lose when a key person leaves: financial cost of re-ramp, what transfers vs what gets lost, and why documentation alone does not solve the problem.",
  alternates: { canonical: "/resources/key-person-knowledge-loss" }
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The real cost of key person knowledge loss",
  description: "Financial cost framing, re-ramp timelines, and what actually transfers vs what gets lost when a key person leaves an organization.",
  author: { "@type": "Organization", name: "Saberra" },
  publisher: { "@type": "Organization", name: "Saberra" },
  mainEntityOfPage: `${siteUrl}/resources/key-person-knowledge-loss/`
};

const whatTransfers = [
  ["Documented processes", "If someone wrote it down and the document is findable, a successor can read it. Most processes are not written down. The ones that are often reflect how the work was designed, not how it is actually done."],
  ["Formal role responsibilities", "Job descriptions and org charts transfer. They describe what someone was supposed to do, not what they actually did or how they navigated the organization to do it."],
  ["Historical artifacts", "Old documents, proposals, and reports can be found in file systems. Finding them is not the same as understanding the context that produced them or knowing which ones still apply."]
];

const whatDoesNotTransfer = [
  ["Relationship context", "Who trusts whom, who the real decision-maker is, what a funder cares about most, why a partnership relationship is sensitive. None of this is documented. When the person who holds it leaves, it is gone."],
  ["Decision rationale", "Why something was decided the way it was. The decision may be recorded. The reasoning behind it, the options that were rejected, and the constraints that shaped it almost never are."],
  ["Operational workarounds", "The ten things the key person does that are not in any process document because they learned them by doing the job for three years. Successors re-learn them by making the same mistakes."],
  ["Network intelligence", "Who to call for what, which vendor relationships are actually reliable, who in the organization can move something through a bureaucratic process. This lives entirely in the person&apos;s memory."],
  ["Contextual risk awareness", "The risks the person was quietly managing because they knew about them. When they leave, the risks do not. Someone finds out about them when they become failures."]
];

const costBreakdown = [
  ["Productivity gap", "A new person operating at reduced effectiveness for 6-12 months while they re-ramp. For a senior role, this is typically 40-60% of salary cost in lost productivity."],
  ["Recruitment and onboarding", "External replacement costs 50-200% of annual salary when you include recruiting fees, interview time, and onboarding overhead."],
  ["Relationship repair", "Funder, client, and partner relationships that degrade during the transition gap. Harder to quantify, often more expensive than the direct costs."],
  ["Repeated mistakes", "The successor re-learns organizational lessons the departing person already knew. Each mistake has a cost. Organizations with no institutional memory pay these costs repeatedly."],
  ["Coordination failures", "Risks and commitments the departing person was tracking that no one else knew about. These surface as failures weeks or months after the transition."]
];

export default function KeyPersonKnowledgeLossPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Resource: Organizational knowledge risk</div>
          <h1>What you actually lose when a key person leaves.</h1>
          <p>
            Most organizations underestimate the cost of key person knowledge loss because they measure the costs they
            can see: recruiting, onboarding, the productivity gap in the first quarter. They do not measure what does
            not transfer: the relationship context, the decision rationale, the operational workarounds, the risk
            awareness. That is where the real cost is.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AuditReportVisual />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="What transfers and what does not"
            title="The documentation you have is not the knowledge you think it is."
          >
            Organizations conflate documentation with institutional memory. Documentation captures structure.
            Institutional memory captures judgment, context, and relationship intelligence. They are not the same thing,
            and documentation does not substitute for the second.
          </SectionHeader>
          <div style={{ marginTop: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>What transfers when someone leaves</div>
            <div className="grid-3" style={{ marginBottom: 48 }}>
              {whatTransfers.map(([title, copy]) => (
                <article className="card" key={title}>
                  <h3 style={{ color: "#8fc9a8" }}>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>What does not transfer</div>
            <div className="grid-3">
              {whatDoesNotTransfer.map(([title, copy]) => (
                <article className="card" key={title}>
                  <h3 style={{ color: "#e07a5f" }}>{title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: copy }} />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container">
          <SectionHeader
            eyebrow="The financial cost"
            title="Re-ramp is the visible cost. The invisible cost is larger."
          >
            The direct cost of a senior transition is significant. The indirect cost of repeated knowledge loss across
            multiple transitions compounds over time. Organizations that do not solve for institutional memory pay it
            again every time someone leaves.
          </SectionHeader>
          <div className="grid-2" style={{ marginTop: 32 }}>
            {costBreakdown.map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container split">
          <div>
            <div className="eyebrow">Why documentation alone does not work</div>
            <h2 className="serif">Documentation captures structure. It does not capture judgment.</h2>
            <p>
              The common response to key person knowledge loss is better documentation: exit interviews, handover
              documents, process wikis. These capture what someone did. They do not capture how they thought about
              it, what they were watching for, or what they would have done differently if they knew then what they
              know now.
            </p>
            <p style={{ marginTop: 16 }}>
              The judgment that makes a key person valuable takes years to accumulate and cannot be transferred in a
              two-week handover. The goal is not to replace that judgment. It is to preserve the context that surrounds
              it: the decisions made, the reasoning given, the risks tracked, the relationships built.
            </p>
            <p style={{ marginTop: 16 }}>
              That context can be captured continuously from the meetings and emails the person is already in. Not as
              documentation they are asked to write, but as structured records that are extracted, reviewed, and
              preserved as part of the ongoing work.
            </p>
          </div>
          <div>
            <div className="eyebrow">The re-ramp timeline</div>
            <div className="card" style={{ marginBottom: 12 }}>
              <h3>Month 1</h3>
              <p>New person oriented to formal structure. Job description, org chart, onboarding materials. Productivity is 20-30% of eventual output.</p>
            </div>
            <div className="card" style={{ marginBottom: 12 }}>
              <h3>Months 2-3</h3>
              <p>Learning by doing. Making the mistakes the previous person already knew to avoid. Productivity 40-60%. Relationships being rebuilt.</p>
            </div>
            <div className="card" style={{ marginBottom: 12 }}>
              <h3>Months 4-6</h3>
              <p>Operational workarounds discovered. Risk awareness building. Relationships partially restored. Productivity 60-80%.</p>
            </div>
            <div className="card">
              <h3>Months 7-12</h3>
              <p>Full effectiveness. The person now holds institutional knowledge the organization did not have a way to preserve before they arrived. The cycle begins again.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="The next transition does not have to restart the clock."
            copy="Saberra captures decisions, relationship context, and operational risk awareness continuously from the meetings and emails your team already creates. Take the audit to see where your organization is most exposed."
            primary="Take the Memory Audit"
            primaryHref="/audit"
            secondary="Apply for a founding spot"
            secondaryHref="/founding-access"
          />
        </div>
      </section>
     </main>
  );
}
