import type { Metadata } from "next";
import Image from "next/image";
import { CaptureGrid, ProcessFlow, SeraDemoSection, TrustSection } from "@/components/HomeSections";
import { CTABand, SectionHeader } from "@/components/UI";
import { PipelineAnatomyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "How Saberra Works",
  description:
    "See how Sera turns meetings and emails into a human-approved operating intelligence layer your team can trust.",
  alternates: { canonical: "/how-it-works" }
};

export default function HowItWorksPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Your team keeps working. The operating record builds itself.</h1>
          <p>
            Every meeting, every decision, every role change — Sera organizes it from the emails and transcripts you
            already produce. Your reviewer approves what becomes trusted. Your organization stops starting over.
          </p>
        </div>
      </section>
      <ProcessFlow />
      <section className="section tight">
        <div className="container">
          <PipelineAnatomyVisual />
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <div className="infographic-callout">
            <div className="infographic-copy">
              <div className="eyebrow">Detailed loop</div>
              <h2 className="serif">See the full Living Memory Loop.</h2>
              <p>
                This infographic shows the deeper path from raw meetings and emails to human-approved records in the
                Living Memory Hub, then back out through source-backed Sera answers.
              </p>
              <div className="cta-row">
                <a className="btn btn-primary" href="/how-the-memory-loop-works.png" target="_blank" rel="noreferrer">
                  Open full size
                </a>
                <a className="btn btn-secondary" href="/how-the-memory-loop-works.png" download>
                  Download PNG
                </a>
              </div>
            </div>
            <a
              className="infographic-frame"
              href="/how-the-memory-loop-works.png"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the Living Memory Loop infographic full size"
            >
              <Image
                src="/how-the-memory-loop-works-display.jpg"
                alt="Infographic explaining how Saberra's Living Memory Loop turns meetings and emails into reviewed memory and source-backed Sera answers."
                width={1800}
                height={1005}
                sizes="(max-width: 980px) 100vw, 1180px"
              />
              <span>Tap to enlarge</span>
            </a>
          </div>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <SectionHeader title="No new habits. No new logins for your team. Just memory that sticks.">
            A dedicated inbox receives Google Meet outputs and important operational email. Sera proposes structured
            records. A human reviews the queue. Approved records become the source Sera can answer from.
          </SectionHeader>
          <ul className="list">
            <li>Google Meet recordings, transcripts, and Gemini notes are captured through email.</li>
            <li>Operational email threads can be forwarded when they contain decisions, risks, or commitments.</li>
            <li>Sera creates candidates for decisions, tasks, roles, risks, policies, people, projects, and memory.</li>
            <li>Records enter the Living Memory Hub with status and source traceability.</li>
            <li>Nothing becomes trusted operating intelligence until human review accepts it.</li>
          </ul>
        </div>
      </section>
      <CaptureGrid />
      <SeraDemoSection />
      <TrustSection />
      <section className="section">
        <div className="container">
          <CTABand
            title="See what your current operating system is missing."
            copy="Ten questions. Specific results by segment. Find out exactly where decisions, roles, and context are leaking — before the next transition makes it more expensive."
            primary="Take the free Memory Audit"
            primaryHref="/audit"
            secondary="Apply for a founding spot"
            secondaryHref="/founding-access"
          />
        </div>
      </section>
    </main>
  );
}
