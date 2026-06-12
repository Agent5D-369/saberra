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
  "Governance decisions captured from week one of deployment",
  "Operating memory accessible to the full founding team, not stored in one person",
  "Community agreements and land stewardship decisions organized into inspectable records",
  "New team members onboard with full context without needing 1:1 knowledge transfers",
];

const stats = [
  { number: "Week 1", label: "Sera capturing governance context from day one of deployment" },
  { number: "5-person", label: "Founding team — every member can now find what was decided and why" },
  { number: "Zero", label: "Key-person bottleneck for accessing community operating history" },
];

export default function AmoraCase() {
  return (
    <main>
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
              &ldquo;We govern land decisions and community agreements across a distributed team. Sera started
              capturing the right conversations from week one. Our operating memory finally lives somewhere
              everyone can find it &mdash; not just in the heads of the people who were in the room.&rdquo;
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
          <SectionHeader eyebrow="The result" title="A community that can answer for itself." />
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
              <h3>What is true for Amora now</h3>
              <p>
                Amora&apos;s operating memory is no longer stored in the heads of the founding members who happened
                to be on a particular call. Governance decisions are captured, routed through human review, and
                stored in a backend that every founding team member can query.
              </p>
              <p>
                As Amora grows &mdash; adding residents, expanding governance circles, onboarding new community
                members &mdash; the institutional knowledge of how the community was built will be accessible to
                every person who joins. The memory of the village survives beyond the original team.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── CONTEXT NOTE ───────────────────────────────────────── */}
      <section className="section tight">
        <div className="container" style={{ maxWidth: 640 }}>
          <p style={{ color: "#6a8a90", fontSize: "0.88rem", fontStyle: "italic" }}>
            Amora Community is in active deployment with Saberra (week two at time of publication). Results will
            expand as the deployment matures. Governance complexity and the community&apos;s distributed
            decision-making model make Amora an ideal long-term case study for organizational memory infrastructure
            in intentional community settings.
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
