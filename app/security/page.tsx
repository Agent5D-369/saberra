import type { Metadata } from "next";
import Link from "next/link";
import { CTABand, SectionHeader } from "@/components/UI";
import { SecurityBoundaryVisual, SovereigntyVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security and Data Ownership | Saberra",
  description:
    "How Saberra keeps operating intelligence inspectable, human-reviewed, source-backed, and owned by the client. Your data lives in your workspace.",
  alternates: { canonical: "/security" },
  openGraph: {
    title: "Security and Data Ownership | Saberra",
    description: "Your organizational memory lives in accounts you control. Human review before anything becomes trusted.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://saberra.com"}/security`,
    images: [{ url: "/og.png", width: 1200, height: 630 }]
  }
};

const dataFlowRows = [
  {
    source: "Google Meet",
    what: "Meeting transcript and summary",
    where: "Forwarded to capture inbox → AI extraction → Notion draft record",
    control: "Your Google Workspace"
  },
  {
    source: "Email threads",
    what: "Message content and attachments",
    where: "Forwarded to capture inbox → AI extraction → Notion draft record",
    control: "Your Gmail or Google Workspace"
  },
  {
    source: "Zoom / Teams / other platforms",
    what: "AI-generated summaries or transcripts",
    where: "Emailed into dedicated capture inbox → same extraction pipeline",
    control: "Your email account"
  },
  {
    source: "AI extraction layer",
    what: "Draft decisions, tasks, risks, roles, policies, sources",
    where: "Written to Notion review queue — not trusted until human approved",
    control: "Your Notion workspace"
  },
  {
    source: "Sera queries",
    what: "Natural language questions from your team",
    where: "Answered from human-reviewed Notion records with source citations",
    control: "Your AI provider account (e.g. OpenAI)"
  }
];

const faqItems = [
  {
    q: "Does Saberra store our data on its own servers?",
    a: "No. The standard deployment routes data through your own Google Workspace, Notion workspace, AI provider account, and Railway instance. Saberra configures the pipeline inside accounts you control. Your organizational memory lives in your Notion databases, not in a Saberra database."
  },
  {
    q: "What AI provider does Saberra use?",
    a: "The extraction and Sera layers run through your own AI provider account — typically OpenAI. You control the API keys and the account. Saberra does not aggregate your data with other clients' data or use it to train models."
  },
  {
    q: "Who can see our Notion records?",
    a: "Only people with access to your Notion workspace. Saberra's deployment team has no standing access to your workspace. Access is managed through your organization's Notion permission settings."
  },
  {
    q: "What happens when the engagement ends?",
    a: "Every reviewed record stays in your Notion workspace. You own the databases, the content, and the structure. You can export everything from Notion at any time. Saberra holds no copy of your organizational memory."
  },
  {
    q: "Can we review what the AI extracted before it becomes organizational memory?",
    a: "Yes — that is the core of how the system works. AI extraction creates candidates. Nothing becomes a trusted record until a designated reviewer approves, edits, or rejects it in the review queue. Sera answers only from approved records."
  },
  {
    q: "What integrations are in the standard deployment?",
    a: "The standard stack is: Google Workspace (Meet capture and email), Notion (memory backend), an AI provider account (OpenAI by default), Railway (orchestration), and a dedicated capture inbox. Zoom, Teams, and other meeting platforms work when transcripts or summaries are emailed into the capture inbox."
  }
];

export default function SecurityPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="container">
          <h1>Your operating intelligence should live where your team can inspect it.</h1>
          <p>
            Saberra is built so your team can see the records, review what becomes trusted, and trace answers
            back to sources. Client data lives in client accounts.
          </p>
        </div>
      </section>

      {/* ── SECURITY BOUNDARY VISUAL ───────────────────── */}
      <section className="section tight">
        <div className="container">
          <SecurityBoundaryVisual />
        </div>
      </section>

      {/* ── HUMAN REVIEW ──────────────────────────────── */}
      <section className="section">
        <div className="container split">
          <SectionHeader title="Trust starts with records your team can inspect.">
            Saberra does not ask you to trust unsourced AI output. The system creates candidates, humans
            review them, and Sera answers from the documented record.
          </SectionHeader>
          <ul className="list">
            <li>Client data lives in the client&apos;s Notion workspace and tool accounts.</li>
            <li>AI extraction creates draft or candidate records for human review.</li>
            <li>Sera answers from reviewed organizational records with source context.</li>
            <li>The standard deployment uses Google Workspace, native Google Meet capture, Notion, an AI provider account, Railway, and a dedicated inbox.</li>
            <li>Zoom, Teams, and other meeting platforms can be captured when transcripts or summaries are emailed into the dedicated capture inbox.</li>
            <li>Notion is the default memory backend. Postgres or additional systems of record can be scoped for larger or more technical deployments.</li>
          </ul>
        </div>
      </section>

      {/* ── DATA FLOW TABLE ───────────────────────────── */}
      <section className="section tight alt">
        <div className="container">
          <SectionHeader
            eyebrow="Data flow"
            title="Where each piece of data goes."
            center
          >
            Every step in the pipeline runs inside accounts your organization controls.
          </SectionHeader>
          <div style={{ marginTop: 32, overflowX: "auto" }}>
            <table className="data-flow-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>What is captured</th>
                  <th>How it flows</th>
                  <th>Who controls the account</th>
                </tr>
              </thead>
              <tbody>
                {dataFlowRows.map((row) => (
                  <tr key={row.source}>
                    <td className="dft-source">{row.source}</td>
                    <td>{row.what}</td>
                    <td>{row.where}</td>
                    <td className="dft-control">{row.control}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SOVEREIGNTY VISUAL ────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="Data sovereignty"
            title="Your data lives in your workspace. Not ours."
          >
            Saberra is configured inside accounts your organization controls: Google Workspace, Notion,
            your AI provider account, Railway, and a dedicated capture inbox. When the engagement ends,
            every record stays in your workspace. Nothing moves to a vendor database.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <SovereigntyVisual />
          </div>
        </div>
      </section>

      {/* ── OFFBOARDING ───────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <div className="security-offboard-grid">
            <div className="security-offboard-card">
              <div className="eyebrow">When you offboard</div>
              <h3 className="serif">Your records stay. No extraction required.</h3>
              <p>
                Every approved decision, task, risk, role history, policy, and source record lives in your
                Notion databases. At any point you can export everything from Notion as CSV, PDF, or Markdown.
                There is no data that lives only on Saberra infrastructure.
              </p>
            </div>
            <div className="security-offboard-card">
              <div className="eyebrow">Pipeline access</div>
              <h3 className="serif">You control the keys. You can revoke access at any time.</h3>
              <p>
                The pipeline runs on API keys and OAuth connections your organization administers. To
                offboard, you revoke access from your Google Workspace settings, your Notion workspace,
                and your AI provider account. Saberra has no standing access to retain.
              </p>
            </div>
            <div className="security-offboard-card">
              <div className="eyebrow">What Saberra retains</div>
              <h3 className="serif">Configuration, not content.</h3>
              <p>
                Saberra may retain configuration details (deployment settings, integration routing) needed
                to support active clients. Organizational content — decisions, meeting records, task
                history — is never held in Saberra systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="section alt">
        <div className="container">
          <SectionHeader eyebrow="Common questions" title="Security and data ownership." center />
          <div className="security-faq" style={{ marginTop: 40 }}>
            {faqItems.map(({ q, a }) => (
              <details className="security-faq-item" key={q}>
                <summary className="security-faq-q">{q}</summary>
                <p className="security-faq-a">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <CTABand
            title="An AI operations layer should make trust easier to inspect."
            copy="Start with the Living Memory Hub demo, then book a focused walkthrough when you want to evaluate fit, tools, source boundaries, and human approval ownership."
          />
        </div>
      </section>
    </main>
  );
}
