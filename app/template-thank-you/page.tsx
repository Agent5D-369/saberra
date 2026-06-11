import type { Metadata } from "next";
import Link from "next/link";
import { CTAButton, CTABand } from "@/components/UI";
import { notionTemplateUrl, demoCalendarUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your Living Memory Hub Is Ready",
  description: "Open, duplicate, and explore the Saberra Living Memory Hub demo in Notion.",
  alternates: { canonical: "/template-thank-you" },
  robots: { index: false, follow: false }
};

const whatIsInside = [
  ["Decisions database", "Every decision from the demo week: what was agreed, who owns it, the reasoning, and the source record it came from. Ask Sera any of these and she answers with citations."],
  ["Tasks with ownership", "Action items from meetings and emails, with assigned owners, due dates, status, and the meeting context they came from."],
  ["Risks and open issues", "Concerns surfaced from conversation before they became failures. Each risk has a source, a severity, and an owner."],
  ["Role records", "Who holds what, since when, and with what accountabilities. Connected to the governance decisions that created or changed them."],
  ["Source inbox", "Every source email Sera processed is preserved here. Every record in every database links back to it. Nothing gets approved without a traceable source."],
  ["Review queue", "This is where Sera extraction candidates land before a human approves or rejects them. The review queue is what keeps Sera honest."]
];

const steps = [
  {
    number: "01",
    title: "Open the demo database",
    body: "The link below opens the shared Notion page. Browse it first with demo data so you can see the structure before making your own copy."
  },
  {
    number: "02",
    title: "Duplicate into your workspace",
    body: "In Notion, click the three-dot menu in the top right and choose Duplicate. Select your workspace. Notion will copy the hub and all linked databases into your account."
  },
  {
    number: "03",
    title: "Make a clean copy (optional)",
    body: "To test the hub with your own records, duplicate the copied hub again inside your workspace, then delete the example records from the second copy. Keep the demo copy as a reference."
  },
  {
    number: "04",
    title: "See Sera in action",
    body: "Book a 30-minute walkthrough and bring one or two real examples of decisions, risks, or context your team cannot reliably find. We will show you how Sera would organize and answer from them."
  }
];

export default function TemplateThankYouPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Your access is ready</div>
          <h1>Open the Living Memory Hub.</h1>
          <p>
            The demo database is live in Notion. Open it, explore the structure with real sample records, then duplicate
            it into your own workspace when you are ready to see it with your own data.
          </p>
          <div className="cta-row" style={{ marginTop: 32 }}>
            <Link
              className="btn btn-primary"
              href={notionTemplateUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the demo hub in Notion
            </Link>
            <CTAButton href={demoCalendarUrl} variant="secondary">
              Schedule a walkthrough
            </CTAButton>
          </div>
          <p className="cta-note">
            Opens in a new tab. No Notion account required to browse. You need one to duplicate.
          </p>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container">
          <div className="eyebrow">What you are looking at</div>
          <h2 className="serif" style={{ marginBottom: 32, maxWidth: "52ch" }}>
            Six databases. One week of organizational memory. Fully source-backed.
          </h2>
          <div className="grid-3">
            {whatIsInside.map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <div style={{ marginTop: 36, textAlign: "center" }}>
            <Link
              className="btn btn-primary"
              href={notionTemplateUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the demo hub
            </Link>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="eyebrow">How to use it</div>
          <h2 className="serif" style={{ marginBottom: 40, maxWidth: "48ch" }}>
            Four steps from demo to your own working memory hub.
          </h2>
          <div className="template-steps">
            {steps.map(({ number, title, body }) => (
              <div className="template-step" key={number}>
                <div className="template-step-number">{number}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container split">
          <div>
            <div className="eyebrow">What the demo does not show</div>
            <h2 className="serif">The demo is a snapshot. The real system is a live loop.</h2>
            <p>
              The Notion hub you are looking at was built from a single week of demo meeting output. In a real
              Saberra deployment, Sera is receiving meeting output and email context continuously, proposing new
              candidate records every week, and a human reviewer is approving what becomes trusted memory.
            </p>
            <p style={{ marginTop: 16 }}>
              What you cannot see in the demo: the capture inbox, the review queue filling up after a meeting,
              the approval workflow, or Sera answering a real question from records your own team created.
              That is what the walkthrough covers.
            </p>
          </div>
          <div>
            <article className="card" style={{ marginBottom: 16 }}>
              <h3>Take the Memory Audit</h3>
              <p>
                Ten questions that diagnose where your organization is most exposed: decisions that disappear,
                context that walks out, roles nobody can find. Takes about five minutes.
              </p>
              <div style={{ marginTop: 16 }}>
                <CTAButton href="/audit">Take the free audit</CTAButton>
              </div>
            </article>
            <article className="card">
              <h3>Apply for a founding spot</h3>
              <p>
                Founding Memory Partners get a fully guided 30-day deployment, founder-level access, and locked pricing
                in exchange for detailed deployment feedback.
              </p>
              <div style={{ marginTop: 16 }}>
                <CTAButton href="/founding-access" variant="secondary">See founding access</CTAButton>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="The demo shows what the system looks like. The walkthrough shows what it does for your situation."
            copy="Book 30 minutes and bring one or two real examples of decisions, risks, or context your team cannot reliably find."
            primary="Schedule a walkthrough"
            primaryHref={demoCalendarUrl}
            secondary="Apply for founding access"
            secondaryHref="/founding-access"
          />
        </div>
      </section>
    </main>
  );
}
