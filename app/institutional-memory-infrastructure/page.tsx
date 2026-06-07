import type { Metadata } from "next";
import { CTABand } from "@/components/UI";
import { MemoryLoopVisual, ProductDashboardVisual, SecurityBoundaryVisual } from "@/components/VisualPanels";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Institutional Memory Infrastructure",
  description:
    "Institutional memory infrastructure for teams that need capture, human review, source-backed retrieval, data ownership, and durable organizational continuity.",
  alternates: { canonical: "/institutional-memory-infrastructure" },
  keywords: [
    "institutional memory infrastructure",
    "institutional memory software",
    "organizational memory infrastructure",
    "AI institutional memory",
    "source-backed organizational memory"
  ],
  openGraph: {
    title: "Institutional Memory Infrastructure",
    description:
      "A buyer-grade guide to capture, review, retrieval, source traceability, and data ownership for organizational memory.",
    url: `${siteUrl}/institutional-memory-infrastructure`,
    images: ["/og.svg"]
  }
};

export default function InstitutionalMemoryInfrastructurePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Institutional Memory Infrastructure",
    description:
      "A practical guide to institutional memory infrastructure for capture, review, retrieval, source traceability, and data ownership.",
    about: ["institutional memory", "organizational memory", "knowledge management", "AI retrieval"],
    mainEntityOfPage: `${siteUrl}/institutional-memory-infrastructure`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Infrastructure guide</div>
          <h1>Institutional memory infrastructure for teams that cannot afford to forget.</h1>
          <p>
            A serious memory system needs more than search. It needs capture, extraction, review, source traceability,
            retrieval, ownership, and clear data boundaries.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container category-seo-grid">
          <aside className="card category-index" aria-label="Page contents">
            <a href="#loop">The memory loop</a>
            <a href="#architecture">Architecture</a>
            <a href="#ownership">Data ownership</a>
            <a href="#fit">Fit</a>
          </aside>
          <article className="category-article">
            <section id="loop">
              <h2>The infrastructure job is to close the memory loop.</h2>
              <p>
                Teams already create memory signals every day: meeting outputs, email threads, decisions, risks,
                assignments, roles, policies, and governance records. The problem is that those signals rarely become
                trusted, structured, searchable records. Saberra closes that loop.
              </p>
              <MemoryLoopVisual />
            </section>
            <section id="architecture">
              <h2>What the infrastructure includes.</h2>
              <div className="grid-3">
                {[
                  ["Capture", "Google Meet is native. Transcripts or summaries from other platforms can be emailed into the capture inbox."],
                  ["Extraction", "AI extraction turns source material into candidate decisions, tasks, risks, roles, policies, and context."],
                  ["Review", "A Memory Admin approves, corrects, or rejects candidates before they become trusted memory."],
                  ["Storage", "Notion is the default memory backend, with custom data architecture scoped when needed."],
                  ["Retrieval", "Sera answers in plain English from reviewed records and cites sources."],
                  ["Operations", "Memory health, intake status, and review workload remain visible."]
                ].map(([title, copy]) => (
                  <article className="card" key={title}>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
              <ProductDashboardVisual />
            </section>
            <section id="ownership">
              <h2>Your data should not disappear into a vendor black box.</h2>
              <p>
                Saberra is designed around inspectability. Client records live in the client workspace by default. For
                teams that need Postgres, a different source of truth, or additional systems of record, that architecture
                should be scoped as a deployment decision, not hidden behind a generic SaaS promise.
              </p>
              <SecurityBoundaryVisual />
            </section>
            <section id="fit">
              <h2>Infrastructure is the right frame when memory loss is operational risk.</h2>
              <p>
                The strongest fit is a team with repeated decisions, role or staff transitions, governance complexity,
                meeting-heavy operations, and at least one person who can own memory review for about 1-2 hours per week.
              </p>
            </section>
          </article>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <CTABand
            title="See what your memory infrastructure would need."
            copy="Start with the manual Memory OS, then book a focused call when you want to map capture, review, storage, and retrieval for your actual stack."
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
