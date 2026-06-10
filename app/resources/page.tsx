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
      "Living Memory Hub for Notion",
      "A private backend structure for teams that want decisions, tasks, roles, policies, people, and projects to become inspectable.",
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
            <h1>Guides for teams tired of operating from scattered context.</h1>
            <p>
              Start here if your team keeps re-deciding the same issues, losing tasks after meetings, searching for old
              context, rebuilding what someone used to know, or wondering why Notion never stays current.
            </p>
          </div>
          <EditorialVisual
            src="/editorial-category-map.svg"
            alt="Comparison of meeting notes, knowledge bases, search, and institutional memory systems."
            eyebrow="Category"
            title="Name the missing layer."
            copy="Most teams do not need more notes. They need an AI operations layer that turns work output into records humans can approve."
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
            title="Open the Living Memory Hub, then see what Sera automates."
            copy="Inspect the backend for decisions, tasks, risks, roles, meetings, policies, people, projects, review queues, and source records. Then see how Sera keeps it current from meetings and emails."
            primary="Open the demo hub"
            primaryHref="/notion-template"
            secondary="See Sera organize chaos"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
