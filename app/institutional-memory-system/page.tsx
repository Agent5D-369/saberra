import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { NotionTemplateVisual } from "@/components/VisualPanels";
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
            <a href="#definition">Definition</a>
            <a href="#records">Core records</a>
            <a href="#failure">Why teams lose memory</a>
            <a href="#saberra">How Saberra helps</a>
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
            </section>
            <section id="records">
              <h2>The core records a memory system needs.</h2>
              <div className="grid-2">
                {[
                  ["Decisions", "What was decided, when, by whom, why, and where the source lives."],
                  ["Tasks", "Open commitments with owners, dates, status, and original meeting context."],
                  ["Risks", "Concerns, severity, mitigation, owner, and review status."],
                  ["Roles", "Who owns what, since when, with history through transitions."],
                  ["Policies", "Agreements, governance records, review cadence, and approval status."],
                  ["Sources", "Meeting outputs, email threads, transcripts, and audit trail."]
                ].map(([title, copy]) => (
                  <article className="card" key={title}>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </section>
            <section id="failure">
              <h2>The decision is not lost when it is made.</h2>
              <p>
                It is lost when nobody can find it later. That is why meeting summaries, chat search, and passive
                knowledge bases are not enough for teams with distributed authority, complex programs, or client work
                that depends on historical context.
              </p>
            </section>
            <section id="saberra">
              <h2>Saberra turns daily work into reviewed memory.</h2>
              <p>
                Saberra captures Google Meet output, emailed transcripts from other platforms, source emails, decisions,
                tasks, risks, roles, policies, and governance records. AI extraction proposes structured records. A human
                reviews them before they become trusted memory. Sera answers from that reviewed record with citations.
              </p>
              <NotionTemplateVisual />
            </section>
          </article>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <CTABand
            title="Start with the manual Memory OS."
            copy="Use the free 20-database Notion structure to see what your team can actually keep updated. Then see how Saberra automates capture, review, and Sera answers."
            primary="Get the manual Memory OS"
            primaryHref="/notion-template"
            secondary="Book a 30-minute call"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
