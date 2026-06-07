import type { Metadata } from "next";
import Link from "next/link";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Saberra resources for institutional memory, organizational memory, Notion memory systems, and zero behavior change knowledge capture.",
  alternates: { canonical: "/resources" }
};

export default function ResourcesPage() {
  const resources = [
    [
      "What is an institutional memory system?",
      "A plain-English guide to capture, review, retrieval, and organizational continuity.",
      "/resources/institutional-memory-system"
    ],
    [
      "Meeting summaries are not memory",
      "Why per-call notes fail to become durable organizational intelligence.",
      "/resources/meeting-notes-are-not-memory"
    ],
    [
      "Institutional Memory OS for Notion",
      "A manual template for decisions, tasks, risks, roles, meetings, policies, and review queues.",
      "/resources/notion-institutional-memory-template"
    ],
    [
      "The cost of key-person memory loss",
      "How founder bottlenecks, departures, and slow onboarding create invisible operations debt.",
      "/notion-template"
    ]
  ];

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>The institutional memory resource hub.</h1>
          <p>
            A future home for guides, templates, and category-defining content on organizational memory infrastructure.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeader title="Start with the questions buyers are already asking." />
          <div className="grid-4">
            {resources.map(([title, copy, href]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
                <Link className="text-link" href={href}>
                  Read more
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Get the manual Memory OS, then automate it."
            copy="Get the manual Memory OS: 20 databases, pre-wired for Saberra, ready in under five minutes. Use it manually first, then use Saberra to capture and review memory automatically from meetings and email."
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
