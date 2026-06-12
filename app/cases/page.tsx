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
    eyebrow: "Governance memory",
    title: "The operating memory of a village.",
    org: "Amora Community &mdash; Regenerative Eco Village, Costa Rica",
    summary:
      "A 5-person founding team governing land decisions, community agreements, and distributed stewardship. Sera capturing governance context from week one of deployment.",
    stat: "Week 1 deployment &mdash; full founding team access to operating memory",
    color: "#D6A24A"
  },
];

const comingSoon = [
  {
    eyebrow: "Key person transition",
    title: "The coordinator left. The memory did not.",
    summary: "A governance-driven consultancy preserves full account context through three coordinator transitions in 12 months.",
  },
  {
    eyebrow: "Scaling founder",
    title: "The founder stopped being the system.",
    summary: "A 55-person founder-led company removes the founder from 40+ weekly context questions within 90 days of deployment.",
  },
];

export default function CasesPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Case studies</div>
          <h1>The record survives. The organization stops starting over.</h1>
          <p>
            Real deployments. Real operating patterns. What changes when memory stops leaking.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Live deployments" title="Organizations using Saberra now." />
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

          <SectionHeader eyebrow="Coming soon" title="More deployments in progress." />
          <div className="grid-2 split">
            {comingSoon.map((c) => (
              <article key={c.title} className="card" style={{ opacity: 0.65 }}>
                <div className="eyebrow">{c.eyebrow}</div>
                <h3 style={{ marginTop: 10 }}>{c.title}</h3>
                <p>{c.summary}</p>
                <p style={{ marginTop: 14, fontSize: "0.82rem", color: "#6FB7B7", fontWeight: 700 }}>Publishing soon</p>
              </article>
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
