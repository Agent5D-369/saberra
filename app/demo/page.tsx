import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/LeadForms";
import { SectionHeader } from "@/components/UI";
import { PipelineAnatomyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "See Sera Organize Your Chaos",
  description:
    "Show us how your team actually works. We will show you what it would look like if Sera had been in the room. In 30 minutes.",
  alternates: { canonical: "/demo" }
};

export default function DemoPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
            <span className="scarcity-counter">3 of 5 founding spots remaining</span>
          </div>
          <h1>Show us your real workflow. We&apos;ll show you what Sera would have captured.</h1>
          <p>
            Bring a real meeting scenario, a real decision that disappeared, or a real handoff that went wrong. We will
            map your actual operating patterns through the system and show you exactly what the record would look like
            if it had existed.
          </p>
        </div>
      </section>

      {/* ── VIGNETTE ABOVE FORM ──────────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <article className="case-vignette" style={{ maxWidth: 860, margin: "0 auto 40px" }}>
            <div className="eyebrow">What typically changes in 30 minutes</div>
            <h2 className="serif">The senior consultant was no longer the archive.</h2>
            <p>
              A growing consultancy used Saberra to capture client decisions, delivery risks, and open commitments
              across calls and email threads. When the delivery lead changed mid-engagement, the full account history
              was searchable. The new lead had context on day one, without pulling the founder back in for every
              question that should already have been answerable.
            </p>
          </article>
        </div>
      </section>

      {/* ── FORM + VISUAL ─────────────────────────────────────────── */}
      <section className="section tight">
        <div className="container split demo-layout">
          <div>
            <SectionHeader title="Bring the chaos. Leave with a memory map.">
              Show us a real meeting scenario, a decision that disappeared, or a handoff that went badly. We will map
              your actual operating patterns through Saberra and show you exactly what the record would look like if
              it had existed.
            </SectionHeader>
            <PipelineAnatomyVisual />
          </div>
          <DemoRequestForm />
        </div>
      </section>
    </main>
  );
}
