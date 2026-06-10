import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { AuditReportVisual, MemoryLoopVisual, NotionTemplateVisual, SeraEvidenceVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Institutional Memory System",
  description:
    "A practical guide to institutional memory systems for teams losing decisions, risks, roles, tasks, policies, source records, and context.",
  alternates: { canonical: "/institutional-memory-system" },
  keywords: [
    "institutional memory system",
    "institutional memory software",
    "organizational memory system",
    "AI institutional memory",
    "meeting notes are not memory"
  ],
  openGraph: {
    title: "What Is an Institutional Memory System?",
    description:
      "Learn how institutional memory systems keep decisions, risks, roles, tasks, policies, source records, and context findable.",
    url: `${siteUrl}/institutional-memory-system`,
    images: ["/og.svg"]
  }
};

const faq = [
  [
    "What is an institutional memory system?",
    "An institutional memory system is the operating record a team uses to preserve what it decided, assigned, changed, approved, risked, and learned over time."
  ],
  [
    "How is it different from a knowledge base?",
    "A knowledge base waits for people to write and maintain articles. An institutional memory system captures the natural output of work, routes it through review, and turns it into durable records."
  ],
  [
    "Why do meeting notes fail as memory?",
    "Meeting notes describe a moment. Organizational memory needs cumulative decisions, task ownership, role history, source records, and review status that remain findable months later."
  ],
  [
    "Where does Saberra fit?",
    "Saberra captures Google Meet output, emailed transcripts, email context, decisions, risks, tasks, roles, and policies, then routes them into human-reviewed memory that Sera can answer from."
  ]
];

export default function InstitutionalMemorySystemPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text }
    }))
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Category guide</div>
          <h1>What is an institutional memory system?</h1>
          <p>
            It is the durable record of what your organization knows, decides, assigns, risks, changes, and approves.
            The goal is simple: when someone asks what happened, the answer should not depend on who happens to remember.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container category-seo-grid">
          <aside className="card category-index" aria-label="Page contents">
            <a href="#definition">What it means</a>
            <a href="#failure">Where memory breaks</a>
            <a href="#comparison">What tools miss</a>
            <a href="#records">Records to keep</a>
            <a href="#saberra">How Saberra works</a>
            <a href="#evaluate">How to evaluate</a>
          </aside>
          <article className="category-article">
            <section id="definition">
              <h2>Institutional memory is not documentation. It is continuity.</h2>
              <p>
                Documentation is useful when someone writes it, updates it, and remembers where it lives. Institutional
                memory is broader. It includes decisions made in meetings, commitments buried in email, the
                risks people named before they became urgent, the role changes that explain ownership, and the policies
                your team agreed to follow.
              </p>
              <p>
                A real institutional memory system does not depend on the most tenured person being available. It gives a
                distributed team a way to ask, &quot;What did we already decide?&quot;, &quot;Who owns this
                now?&quot;, &quot;What changed last quarter?&quot;, and &quot;Which source proves it?&quot;
              </p>
            </section>
            <section id="failure">
              <h2>The decision is not lost when it is made.</h2>
              <p>
                It is lost when nobody can find it later. That is why meeting summaries, chat search, and passive
                knowledge bases are not enough for teams with distributed authority, complex programs, or client work
                that depends on historical context.
              </p>
              <p>
                Teams usually notice the problem during a transition: a coordinator leaves, a program lead changes, a
                senior consultant is pulled into another account, or the founder can no longer be in every meeting. The
                work still happened. The record did not survive in a form the next person can use.
              </p>
              <MemoryLoopVisual />
            </section>
            <section id="comparison">
              <h2>Why summaries, search, and wikis do not close the loop.</h2>
              <div className="grid-2">
                {[
                  [
                    "Meeting summaries",
                    "They describe one call, but they rarely become durable decision, risk, task, role, and policy records."
                  ],
                  [
                    "Enterprise search",
                    "It helps you search what exists, but it does not decide what should become trusted organizational memory."
                  ],
                  [
                    "Knowledge bases",
                    "They wait for humans to write and maintain pages, which is exactly where busy teams fall behind."
                  ],
                  [
                    "Institutional memory systems",
                    "They capture work output, structure it, route it through review, preserve sources, and make it askable."
                  ]
                ].map(([title, copy]) => (
                  <article className="card" key={title}>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </section>
            <section id="records">
              <h2>The core records a memory system needs.</h2>
              <p>
                The goal is not more storage. The goal is a record structure that lets a team recover the truth of the
                work after the conversation has moved on.
              </p>
              <div className="grid-2">
                {[
                  ["Decisions", "What was decided, when, by whom, why, current status, and source evidence."],
                  ["Tasks", "Open commitments with owners, dates, status, source context, and follow-through history."],
                  ["Risks", "Concerns, severity, mitigation, owner, review status, and the meeting or email where the risk surfaced."],
                  ["Roles", "Who owns what, since when, with history through role transitions and vacancies."],
                  ["Policies", "Agreements, governance records, review cadence, approval status, and change history."],
                  ["Sources", "Meeting outputs, emailed transcripts, source emails, review notes, and audit trail."]
                ].map(([title, copy]) => (
                  <article className="card" key={title}>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </section>
            <section id="saberra">
              <h2>Saberra turns daily work into reviewed memory.</h2>
              <p>
                Saberra captures Google Meet output, emailed transcripts from other platforms, source emails, decisions,
                tasks, risks, roles, policies, and governance records. AI extraction proposes structured records. A human
                reviews them before they become trusted memory. Sera answers from that reviewed record with citations.
              </p>
              <p>
                That review step matters. Teams do not need another place where uncertain AI output becomes organizational
                truth by accident. Saberra separates candidate memory from trusted memory so the record stays useful,
                inspectable, and accountable.
              </p>
              <SeraEvidenceVisual />
              <NotionTemplateVisual />
            </section>
            <section id="evaluate">
              <h2>How to know whether your team needs one.</h2>
              <p>
                You probably need an institutional memory system if the same questions keep returning: &quot;Didn&apos;t
                we already decide this?&quot;, &quot;Who owns that now?&quot;, &quot;Where did that risk come
                from?&quot;, or &quot;What did the last person know that nobody wrote down?&quot;
              </p>
              <p>
                Start with the Organizational Memory Audit. It gives your team a practical diagnosis before any sales
                conversation: where decisions leak, where follow-through breaks, and where key-person memory is creating
                operational risk.
              </p>
              <AuditReportVisual />
            </section>
          </article>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <CTABand
            title="Make memory loss visible before it gets expensive."
            copy="Take the 10-question audit to see where decisions, context, tasks, and role history are leaking from your current system."
            primary="Take the Memory Audit"
            primaryHref="/audit"
            secondary="Open the demo hub"
            secondaryHref="/notion-template"
          />
        </div>
      </section>
    </main>
  );
}
