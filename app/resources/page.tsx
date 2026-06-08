import type { Metadata } from "next";
import Link from "next/link";
import { EditorialVisual } from "@/components/EditorialVisuals";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Practical guides for teams losing decisions, context, tasks, roles, and program history across meetings, email, and Notion.",
  alternates: { canonical: "/resources" }
};

export default function ResourcesPage() {
  const resources = [
    [
      "What is an institutional memory system?",
      "What teams need when decisions, roles, risks, and source records have to survive staff changes.",
      "/resources/institutional-memory-system"
    ],
    [
      "Meeting summaries are not memory",
      "Why meeting notes still leave teams asking, didn't we already decide this?",
      "/resources/meeting-notes-are-not-memory"
    ],
    [
      "Institutional Memory OS for Notion",
      "A 20-database manual system for teams that want to see what good memory structure looks like.",
      "/resources/notion-institutional-memory-template"
    ],
    [
      "Saberra vs meeting notetakers",
      "The difference between summarizing calls and preserving what the organization decided.",
      "/resources/saberra-vs-meeting-notetakers"
    ],
    [
      "Notion AI vs Saberra",
      "Why answering from Notion is not enough when the important context never made it into Notion.",
      "/resources/notion-ai-vs-saberra"
    ],
    [
      "Google Meet institutional memory",
      "How Google Meet output and emailed transcripts become reviewed records your team can ask about.",
      "/resources/google-meet-institutional-memory"
    ],
    [
      "The cost of key-person memory loss",
      "Why departures, founder bottlenecks, and slow onboarding are usually memory problems first.",
      "/notion-template"
    ]
  ];

  return (
    <main>
      <section className="page-hero">
        <div className="container split">
          <div>
            <h1>Guides for teams tired of losing decisions.</h1>
            <p>
              Start here if your team keeps re-deciding the same issues, searching for old context, rebuilding what
              someone used to know, or wondering why Notion never stays current after meetings.
            </p>
          </div>
          <EditorialVisual
            src="/editorial-category-map.svg"
            alt="Comparison of meeting notes, knowledge bases, search, and institutional memory systems."
            eyebrow="Category"
            title="Name the missing system."
            copy="Most teams do not need more notes. They need a reliable way to preserve decisions, owners, risks, and sources."
          />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeader title="Start with the questions your team is already asking." />
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
            copy="Get the manual Memory OS: 20 databases for decisions, tasks, risks, roles, meetings, policies, review queues, and source records. Use it manually first, then see what Saberra keeps updated automatically."
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
