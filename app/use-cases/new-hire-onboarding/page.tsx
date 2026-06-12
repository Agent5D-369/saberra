import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Users, BookOpen, Clock, Zap, Shield } from "lucide-react";
import { CTABand, SectionHeader } from "@/components/UI";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "New Hire Onboarding with Sera | Saberra",
  description:
    "Sera gives every new hire the role history, open commitments, and key decisions they need on day one. No static doc required. No ramp time wasted reconstructing what someone else knew.",
  alternates: { canonical: "/use-cases/new-hire-onboarding" },
  openGraph: {
    title: "The last onboarding doc your organization will ever write | Saberra",
    description: "Sera gives new hires live, source-backed answers to every role question. Role history, open tasks, key decisions — on demand, from reviewed records.",
    url: `${siteUrl}/use-cases/new-hire-onboarding`,
    images: [{ url: "/og.png", width: 1200, height: 630 }]
  }
};

const seraExchanges = [
  {
    q: "What did the previous person in this role own?",
    a: "Based on reviewed role records: Jordan owned the Q3 partner pipeline (3 active accounts), the weekly ops digest, and the vendor SLA review process. There are 2 open commitments assigned to this role from the September 14th leadership call."
  },
  {
    q: "What decisions are still active that I need to know about?",
    a: "14 decisions from the last 90 days are tagged to your team. 3 are marked open and pending review: the Notion migration timeline, the contractor onboarding process, and the Q4 budget reallocation. Each links back to the meeting where it was made."
  },
  {
    q: "What are the policies that affect how I run my programs?",
    a: "5 policies are active for this role area: the partner communication protocol (updated August 2), the budget approval threshold policy ($2,500 without board sign-off), and 3 grant reporting requirements. Sources linked to original board decisions."
  },
  {
    q: "What risks was the team tracking before I joined?",
    a: "6 open risks are visible in your area. The highest-flagged: the Riverside partner contract renewal is overdue (flagged October 3rd meeting), and the Q4 deliverable timeline has a dependency conflict logged in the September 28th call."
  }
];

const beforeAfter = [
  ["Before Saberra", "After Saberra"],
  ["New hire gets a folder of docs nobody has updated in 8 months", "New hire asks Sera and gets source-backed answers from reviewed records"],
  ["First 4 weeks spent asking teammates what the previous person did", "Role history, decisions, and open commitments visible on day one"],
  ["Onboarding doc becomes stale the day it's written", "Organizational memory updates automatically from every meeting and email"],
  ["Senior people spend 3+ hours/week answering history questions", "Sera handles history questions. Senior people handle work that needs them."],
  ["When the onboarding doc author leaves, the context leaves too", "The record is maintained by the system, not by any single person"],
  ["Policy changes require updating every onboarding document manually", "Policy changes flow into the reviewed record and are immediately queryable"]
];

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "New Hire Onboarding with Sera",
  description: "How Saberra replaces static onboarding documents with a living role memory that Sera can answer from on day one.",
  author: { "@type": "Organization", name: "Saberra" },
  publisher: { "@type": "Organization", name: "Saberra" },
  mainEntityOfPage: `${siteUrl}/use-cases/new-hire-onboarding`
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Use Cases", item: `${siteUrl}/use-cases` },
    { "@type": "ListItem", position: 3, name: "New Hire Onboarding", item: `${siteUrl}/use-cases/new-hire-onboarding` }
  ]
};

export default function NewHireOnboardingPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Use case: new hire onboarding</div>
          <h1>The last onboarding doc your organization will ever write.</h1>
          <p>
            Static onboarding documents are outdated the day they are written. They capture what one person
            knew at one point in time and then age in silence. Sera replaces them with something better:
            a living role memory that every new hire can query on day one, from reviewed organizational records.
          </p>
          <div className="cta-row" style={{ marginTop: 32 }}>
            <Link className="btn btn-primary" href="/demo">See Sera in action</Link>
            <Link className="btn btn-secondary" href="/audit">Take the Memory Audit</Link>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ────────────────────────────────── */}
      <section className="section tight alt">
        <div className="container">
          <SectionHeader
            eyebrow="The real cost of static onboarding"
            title="Your new hires are spending weeks reconstructing what someone else knew."
            center
          />
          <div className="onboarding-cost-grid" style={{ marginTop: 40 }}>
            {[
              { icon: Clock, stat: "4-8 weeks", label: "Average ramp time", note: "Most of which is reconstructing context, not learning the actual work." },
              { icon: Users, stat: "3+ hrs/week", label: "Senior team time", note: "Spent answering questions that a living record could answer in seconds." },
              { icon: BookOpen, stat: "Day 1", label: "When docs go stale", note: "The moment a document is written, it begins diverging from organizational reality." },
              { icon: Zap, stat: "$20k–$40k", label: "Cost of one transition", note: "When the context walks out with the previous person and cannot be recovered." }
            ].map(({ icon: Icon, stat, label, note }) => (
              <div className="onboarding-cost-card" key={label}>
                <Icon size={24} color="#7BCACA" aria-hidden="true" />
                <div className="onboarding-cost-stat">{stat}</div>
                <div className="onboarding-cost-label">{label}</div>
                <p className="onboarding-cost-note">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT SERA DOES INSTEAD ─────────────────────── */}
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="How Sera changes onboarding"
            title="Instead of a document. A conversation."
          >
            When a new hire joins, they do not get a PDF. They get access to Sera. Sera answers from
            the human-reviewed organizational record: role history, active decisions, open commitments,
            current risks, and standing policies. All source-backed. All up to the second.
          </SectionHeader>
          <div className="sera-exchange-list" style={{ marginTop: 40 }}>
            {seraExchanges.map(({ q, a }) => (
              <div className="sera-exchange" key={q}>
                <div className="sera-exchange-q">
                  <span className="sera-exchange-who">New hire</span>
                  <p>{q}</p>
                </div>
                <div className="sera-exchange-a">
                  <span className="sera-exchange-who sera-who">Sera</span>
                  <p>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DAY BY DAY ─────────────────────────────────── */}
      <section className="section tight alt">
        <div className="container">
          <SectionHeader
            eyebrow="What changes"
            title="Day 1. Week 1. Month 1."
            center
          />
          <div className="onboarding-timeline" style={{ marginTop: 48 }}>
            <div className="onboarding-milestone">
              <div className="onboarding-milestone-marker">Day 1</div>
              <h3 className="serif">Role history on demand.</h3>
              <p>
                The new hire asks Sera what the previous person in this role owned. Sera returns the
                reviewed role record: responsibilities, active projects, open commitments, and the
                decisions that shaped the current state of the work. No interview with a busy colleague required.
              </p>
              <ul className="list" style={{ marginTop: 16 }}>
                <li>What did this role own?</li>
                <li>What decisions am I inheriting?</li>
                <li>What commitments are still open?</li>
                <li>What risks was this role tracking?</li>
              </ul>
            </div>
            <div className="onboarding-milestone">
              <div className="onboarding-milestone-marker">Week 1</div>
              <h3 className="serif">Policies and context, not scavenger hunts.</h3>
              <p>
                As the new hire starts actual work, Sera answers the questions that usually require
                three Slack messages and a calendar invite. Standing policies, budget thresholds,
                partner protocols, and decision rationales are all queryable from reviewed records
                with citations.
              </p>
              <ul className="list" style={{ marginTop: 16 }}>
                <li>What is the approval process for this?</li>
                <li>Why is this relationship structured the way it is?</li>
                <li>What was decided about this last quarter?</li>
                <li>Who owns the related commitment on this project?</li>
              </ul>
            </div>
            <div className="onboarding-milestone">
              <div className="onboarding-milestone-marker">Month 1</div>
              <h3 className="serif">Fully ramped. Without the usual toll.</h3>
              <p>
                The new hire is contributing from context, not guessing at it. Senior team members
                were not the bottleneck. No one spent evenings writing a handoff document that will
                be outdated by next quarter. And when this person eventually transitions out, Sera
                will do the same for whoever comes next.
              </p>
              <ul className="list" style={{ marginTop: 16 }}>
                <li>Ramp time measured in weeks, not months</li>
                <li>3+ hours/week returned to senior team</li>
                <li>Role context ready for the next transition automatically</li>
                <li>No document to maintain, update, or remember to share</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER TABLE ───────────────────────── */}
      <section className="section">
        <div className="container">
          <SectionHeader eyebrow="Before and after" title="Static onboarding vs. living role memory." center />
          <div className="onboarding-comparison" style={{ marginTop: 40 }}>
            <div className="onboarding-comparison-head">
              <span>{beforeAfter[0][0]}</span>
              <span>{beforeAfter[0][1]}</span>
            </div>
            {beforeAfter.slice(1).map(([before, after]) => (
              <div className="onboarding-comparison-row" key={before}>
                <span className="onboarding-before">{before}</span>
                <span className="onboarding-after"><CheckCircle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} /> {after}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DATA OWNERSHIP NOTE ────────────────────────── */}
      <section className="section tight alt">
        <div className="container">
          <div className="onboarding-sovereignty-note">
            <Shield size={28} color="#7BCACA" aria-hidden="true" />
            <div>
              <h3 className="serif">The memory belongs to the organization. Not Saberra.</h3>
              <p>
                Every role record, decision, policy, and commitment lives in your own Notion workspace.
                New hires query Sera through your AI provider account, with your keys. When someone
                leaves, their role history is already in the record. When Saberra&apos;s role in your
                stack changes, the records stay exactly where they are.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <CTABand
            title="Stop writing onboarding documents that go stale. Start building memory that grows."
            copy="See the Living Memory Hub demo and watch Sera answer role history, open commitments, and decision rationale from reviewed records. Then take the Memory Audit to see what your organization is currently losing."
            primary="Open the demo hub"
            primaryHref="/notion-template"
            secondary="Take the Memory Audit"
            secondaryHref="/audit"
          />
        </div>
      </section>
    </main>
  );
}
