import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "Case Studies | Saberra",
  description:
    "Real organizations that stopped losing context. How Saberra's organizational memory infrastructure works in governance, program continuity, and founder-led deployments.",
  alternates: { canonical: "/cases" }
};

const cases = [
  {
    slug: "amora",
    eyebrow: "Live deployment",
    title: "The operating memory of a village.",
    org: "Amora Community &mdash; Regenerative Eco Village, Costa Rica",
    summary:
      "A 5-person founding team governing land decisions, community agreements, and distributed stewardship. Sera capturing governance context from week one of deployment.",
    stat: "76 decisions tracked · 148 tasks extracted · 8 health signals surfaced",
    color: "#D6A24A"
  },
  {
    slug: "governance-coordinator-transition",
    eyebrow: "Representative placeholder",
    title: "The coordinator left. The memory did not.",
    org: "Distributed governance team &mdash; 6-person leadership circle",
    summary:
      "A self-managing organization prepares for a coordinator transition without recentralizing authority around the one person who remembered every decision.",
    stat: "38 decisions surfaced · 22 role records preserved · day-one continuity",
    color: "#6FB7B7"
  },
  {
    slug: "nonprofit-leadership-handoff",
    eyebrow: "Representative placeholder",
    title: "The new program lead inherited the reasoning, not just the folders.",
    org: "Nonprofit program team &mdash; leadership handoff",
    summary:
      "A nonprofit preserves board decisions, funder context, partner commitments, and open risks before a leadership transition forces the organization to reconstruct its own history.",
    stat: "6 years of context mapped · grant commitments surfaced · no 3-month re-ramp",
    color: "#D6A24A"
  },
  {
    slug: "consultancy-delivery-lead",
    eyebrow: "Representative placeholder",
    title: "The senior consultant stopped being the account archive.",
    org: "Boutique consultancy &mdash; delivery lead transition",
    summary:
      "A client-services team captures delivery decisions, relationship history, risks, and open commitments so a new delivery lead can step in without dragging the founder back into every thread.",
    stat: "8 accounts mapped · 4 fewer founder calls/week · client context source-backed",
    color: "#6FB7B7"
  }
];

export default function CasesPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Case studies</div>
          <h1>The record survives. The organization stops starting over.</h1>
          <p>
            Live and representative case studies showing what changes when memory stops leaking. Placeholders are
            conversion drafts based on Saberra&apos;s target deployment patterns and should be replaced with named client
            stories as they are approved.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Case study library" title="Use these stories to help buyers see themselves." />
          <div className="grid-2 split" style={{ marginBottom: 48 }}>
            {cases.map((c) => (
              <Link
                key={c.slug}
                href={`/cases/${c.slug}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <article className="card" style={{ height: "100%", borderLeft: `3px solid ${c.color}`, cursor: "pointer", transition: "border-color 0.2s" }}>
                  <div className="eyebrow" dangerouslySetInnerHTML={{ __html: c.eyebrow }} />
                  <h2 className="serif" style={{ marginTop: 10 }}>{c.title}</h2>
                  <p style={{ color: "#9bb5ba", fontSize: "0.83rem", fontWeight: 700, marginTop: 4 }} dangerouslySetInnerHTML={{ __html: c.org }} />
                  <p style={{ marginTop: 14 }}>{c.summary}</p>
                  <div className="vignette-stats" style={{ marginTop: 16 }}>
                    <span>{c.stat}</span>
                  </div>
                  <div style={{ marginTop: 18, color: "#6FB7B7", fontSize: "0.88rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    Read the case study <ArrowRight size={13} aria-hidden="true" />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <CTABand
            title="Want to see what this would look like for your organization?"
            copy="Take the free Memory Audit and find out exactly where your team is leaking. Most teams score Serious or Critical on the first pass."
            primary="Take the free Memory Audit"
            primaryHref="/audit"
            secondary="Book a 30-minute call"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
