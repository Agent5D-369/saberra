import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Quote } from "lucide-react";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "Amora Community Case Study | Saberra",
  description:
    "How Amora Community, a regenerative eco village in Costa Rica, uses Saberra to capture governance decisions, community agreements, and operating context across a distributed founding team.",
  alternates: { canonical: "/cases/amora" }
};

const results = [
  "76 governance decisions tracked in the first two weeks (candidates + confirmed)",
  "148 tasks extracted from emails and meetings across all community sources",
  "69 risks formally logged — 66 still open, 17 flagged high severity",
  "23 community member profiles auto-built from email without any manual data entry",
  "9 CCOS governance circles identified and tracked by Sera",
  "86 KB articles drafted from organizational context (6 pending review)",
  "8 early-warning collapse signals detected across 4 risk categories",
  "100% pipeline success rate — zero processing failures in week two",
];

const stats = [
  { number: "76", label: "Governance decisions tracked — candidates and confirmed — in the first two weeks" },
  { number: "148", label: "Tasks extracted from emails and meetings across all community sources" },
  { number: "23", label: "Community member profiles auto-built from email without any manual data entry" },
];

export default function AmoraCase() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://saberra.com"}, {"@type": "ListItem", "position": 2, "name": "Case Studies", "item": "https://saberra.com/cases"}, {"@type": "ListItem", "position": 3, "name": "Amora Case Study", "item": "https://saberra.com/cases/amora"}]}) }} />
      <section className="page-hero">
        <div className="container">
          <Link href="/cases" className="back-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6FB7B7", fontSize: "0.88rem", marginBottom: 20, textDecoration: "none" }}>
            <ArrowLeft size={14} /> All case studies
          </Link>
          <div className="eyebrow">Case study &mdash; Governance memory</div>
          <h1>The operating memory of a village.</h1>
          <p>
            How a regenerative eco community in Costa Rica built a shared organizational memory that does not
            depend on any one person &mdash; from week one of deployment.
          </p>
        </div>
      </section>

      {/* ── STAT BAR ───────────────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <div className="grid-3">
            {stats.map(({ number, label }) => (
              <article className="card" key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 900, color: "#D6A24A", marginBottom: 8 }}>{number}</div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#9bb5ba" }}>{label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ─────────────────────────────────────────── */}
      <section className="section tight">
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ borderLeft: "4px solid #D6A24A", paddingLeft: 24, paddingTop: 4, paddingBottom: 4 }}>
            <Quote size={28} color="#D6A24A" style={{ marginBottom: 12, opacity: 0.7 }} aria-hidden="true" />
            <p style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)", color: "#d5dddf", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
              &ldquo;In week two, Sera had already tracked 76 governance decisions, extracted 148 tasks from our emails
              and meetings, and auto-built profiles for 23 community members. She found risks and patterns we had never
              formally logged. Our operating reality finally has a record.&rdquo;
            </p>
            <p style={{ marginTop: 16, fontWeight: 700, color: "#D6A24A", fontSize: "0.88rem", letterSpacing: "0.03em" }}>
              AMORA COMMUNITY &mdash; Regenerative Eco Village, Dominicalito, Costa Rica
            </p>
          </div>
        </div>
      </section>

      {/* ── THE ORGANIZATION ───────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="The organization" title="Building a village requires a memory." />
          <div className="grid-2 split">
            <article className="card">
              <h3>Who they are</h3>
              <p>
                Amora Community is a regenerative eco village being built on sacred land in Dominicalito, Costa Rica,
                overlooking the Pacific Ocean. Women-led and multigenerational, Amora is creating a radically
                cooperative living ecosystem: homeowners who are also shareholders in a shared community enterprise.
              </p>
              <p>
                The founding team of five people manages land stewardship decisions, membership governance,
                community agreements, event coordination, partner relationships, and financial commitments &mdash;
                all simultaneously, all in a distributed operating environment.
              </p>
            </article>
            <article className="card">
              <h3>Their stack</h3>
              <ul className="list">
                <li><CheckCircle size={16} color="#6FB7B7" aria-hidden="true" /> Google Workspace (Meet, Gmail, Drive)</li>
                <li><CheckCircle size={16} color="#6FB7B7" aria-hidden="true" /> Notion as the primary knowledge backend</li>
                <li><CheckCircle size={16} color="#6FB7B7" aria-hidden="true" /> Regular member webinars and governance calls</li>
                <li><CheckCircle size={16} color="#6FB7B7" aria-hidden="true" /> Distributed founding team across multiple time zones</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ── THE PAIN ───────────────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="The moment of pain" title="When you are building something from scratch, every decision matters. And every lost decision costs double." />
          <div className="grid-2 split">
            <article className="card">
              <h3>The specific problem</h3>
              <p>
                Amora is making foundational decisions: which land governance agreements to adopt, how shared
                stewardship structures work, which community agreements define membership, how financial
                commitments are tracked across dozens of conversations and calls.
              </p>
              <p>
                For a community whose entire operating philosophy is distributed and shared, having key context
                centralized in a few people&apos;s memory was a structural contradiction &mdash; and a real risk.
                If a founding member transitioned or was unreachable, critical governance context would vanish
                with them.
              </p>
            </article>
            <article className="card">
              <h3>What they had tried</h3>
              <p>
                Notion was already in use, but like most Notion deployments in active organizations, it captured
                what people remembered to write down &mdash; not the decisions that emerged in real conversations.
                Meeting notes existed but were scattered. Follow-up decisions were buried in email threads.
                Community agreements evolved over calls that nobody transcribed into durable records.
              </p>
              <p>
                The memory gap was not a discipline problem. It was a systems problem. There was no operating layer
                that captured the community&apos;s decisions automatically and routed them through human review before
                they became organizational truth.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── THE DEPLOYMENT ─────────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="The deployment" title="Four weeks to an operating memory layer." />
          <div className="deployment-path" style={{ maxWidth: 760 }}>
            {[
              ["Week 1", "Chaos map and source routing", "Saberra mapped where Amora&apos;s governance decisions, commitments, community agreements, and operating risks were currently leaking: which calls, which email threads, which recurring conversations needed to be captured."],
              ["Week 2", "Capture inbox and Living Memory Hub", "Sera was routed onto governance calls and key email threads. The private Notion Living Memory Hub backend was configured with Amora&apos;s actual governance structure: land decisions, membership agreements, community commitments, roles, open risks."],
              ["Week 3", "Human approval workflow", "The founding team&apos;s primary reviewer learned how to approve, correct, and steward Sera&apos;s candidate records. Nothing becomes organizational memory without a human saying yes."],
              ["Week 4", "Sera operating baseline", "Sera began answering from approved governance records. The founding team could ask what was decided about land governance, what commitments were open, what the current membership criteria were &mdash; and get source-backed answers."],
            ].map(([week, title, copy]) => (
              <article className="deployment-step" key={week}>
                <span>{week}</span>
                <h3 dangerouslySetInnerHTML={{ __html: title }} />
                <p dangerouslySetInnerHTML={{ __html: copy }} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE RESULT ─────────────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Week-two results" title="What two weeks of Sera looks like in a real deployment." />
          <div className="grid-2 split">
            <div>
              <ul className="list" style={{ gap: 14 }}>
                {results.map((r) => (
                  <li key={r} style={{ fontSize: "1rem" }}>
                    <CheckCircle size={18} color="#D6A24A" aria-hidden="true" /> {r}
                  </li>
                ))}
              </ul>
            </div>
            <article className="card" style={{ borderLeft: "3px solid #6FB7B7" }}>
              <h3>The Collapse Health Monitor</h3>
              <p>
                One of Saberra&apos;s most powerful features became visible immediately: the Collapse Health Monitor.
                Sera monitors every processed meeting and email for early-warning signals across 7 organizational
                collapse patterns.
              </p>
              <p>
                In week two, Amora&apos;s dashboard showed 8 active signals across four categories: Poor Governance
                (role ambiguity, repeated decisions, bypassed process), Financial Fragility (cash flow concerns,
                runway pressure), Burnout (overwhelm, missed commitments), and Scale Trap (coordination failures,
                capacity bottlenecks).
              </p>
              <p>
                These signals were not new problems. They were patterns that existed in the organization&apos;s
                conversations but had never been formally surfaced. Sera found them in the first two weeks. The
                founding team now has a live dashboard showing exactly where organizational health risks are
                accumulating.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── PIPELINE PROOF ─────────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Pipeline health" title="What Amora&apos;s operating record looks like right now." />
          <div className="grid-4">
            {[
              { number: "60", label: "emails processed", sub: "100% success rate, zero failures" },
              { number: "9", label: "governance circles", sub: "CCOS structure mapped and tracked" },
              { number: "86", label: "KB articles drafted", sub: "6 pending human review" },
              { number: "8", label: "collapse signals", sub: "detected across 4 risk categories" },
            ].map(({ number, label, sub }) => (
              <article className="card" key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "#D6A24A", lineHeight: 1 }}>{number}</div>
                <div style={{ fontWeight: 700, color: "#d5dddf", fontSize: "0.9rem", marginTop: 6 }}>{label}</div>
                <div style={{ color: "#6a8a90", fontSize: "0.8rem", marginTop: 4 }}>{sub}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS TRUE NOW ───────────────────────────────────── */}
      <section className="section tight">
        <div className="container" style={{ maxWidth: 720 }}>
          <article className="card" style={{ borderLeft: "3px solid #6FB7B7" }}>
            <h3>What is true for Amora now that was not true 14 days ago</h3>
            <p>
              Amora&apos;s operating memory is no longer stored in the heads of the founding members who happened to
              be on a particular call. 76 governance decisions are captured, tracked, and accessible. 148 tasks are
              assigned and visible across the whole team. 23 community member profiles were built automatically from
              email without anyone filling out a form.
            </p>
            <p>
              And Sera is scanning every conversation for the early warning signals that typically precede
              organizational health crises &mdash; surfacing them while there is still time to act.
            </p>
            <p>
              As Amora grows &mdash; adding residents, expanding governance circles, onboarding new community
              members &mdash; every person who joins will inherit the full operating history of how the village was
              built. The memory survives beyond the original team.
            </p>
          </article>
        </div>
      </section>

      {/* ── CONTEXT NOTE ───────────────────────────────────────── */}
      <section className="section tight">
        <div className="container" style={{ maxWidth: 640 }}>
          <p style={{ color: "#6a8a90", fontSize: "0.88rem", fontStyle: "italic" }}>
            All metrics above are from Amora&apos;s live Saberra dashboard at the end of week two of deployment.
            Results will expand significantly as the deployment matures and more meetings and emails are processed.
            Dashboard screenshots available on request.
          </p>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <CTABand
            title="Your organization has the same problem in a different container."
            copy="Whether you are a consultancy, a nonprofit, or a founder-led company, the memory loss pattern is the same. The solution is the same. Take the audit and find out exactly where yours is."
            primary="Take the free Memory Audit"
            primaryHref="/audit"
            secondary="See more case studies"
            secondaryHref="/cases"
          />
        </div>
      </section>
    </main>
  );
}
