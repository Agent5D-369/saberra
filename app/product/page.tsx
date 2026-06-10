import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import {
  ProductDashboardVisual,
  GovernanceConsoleVisual,
  PipelineAnatomyVisual,
  DatabaseMapVisual
} from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "The Saberra Product: What You Actually Log Into",
  description:
    "An inside look at the Saberra product: the dashboard, governance console, pipeline anatomy, and Notion memory backend your team operates from.",
  alternates: { canonical: "/product" }
};

export default function ProductPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Inside the product</div>
          <h1>What your team actually operates from.</h1>
          <p>
            Saberra is not a summary screen. It is a done-for-you AI operations layer with intake health, review
            queues, a governance console, and a 20-database Notion backend your team can inspect, edit, and govern.
          </p>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="Client dashboard"
            title="Everything happening in your memory system, visible in one place."
          >
            Hours saved from avoided re-decisions, emails processed, meetings captured, people known. You can see
            exactly what Sera has processed and what is waiting in the review queue.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <ProductDashboardVisual />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="Governance console"
            title="Roles, risks, and decisions stay visible without asking anyone."
          >
            The governance console surfaces health signals from processed meetings and emails, keeps role holders
            current, and routes risk candidates to review before they become coordination failures.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <GovernanceConsoleVisual />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="Pipeline anatomy"
            title="Every record has a path back to its source."
          >
            From capture inbox to Sera answer, every step is traceable. No record becomes trusted without passing
            through human review. No answer Sera gives exists without a source your team can inspect.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <PipelineAnatomyVisual />
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="Notion memory backend"
            title="20 databases. Structured, inspectable, yours."
          >
            The Living Memory Hub lives in your own Notion workspace. Every database, every record, every source
            trail is visible to your team without logging into a vendor platform.
          </SectionHeader>
          <div style={{ marginTop: 32 }}>
            <DatabaseMapVisual />
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container">
          <div className="grid-3">
            {[
              ["Human review baked in", "Nothing becomes trusted organizational memory without a human decision. Sera proposes. Reviewers approve, edit, or reject."],
              ["Source-backed answers", "Every answer Sera gives points back to the meeting, email, or record that contains the evidence. No citations means no answer."],
              ["Client-controlled infrastructure", "Your Notion workspace, your Google Workspace, your Railway instance, your AI provider. Saberra is a configuration, not a custody arrangement."]
            ].map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Want to inspect the system instead of hear another pitch?"
            copy="Open the Living Memory Hub demo and see the kind of reviewed memory Sera creates. Then book a walkthrough if you want to evaluate fit."
            primary="Open the demo hub"
            primaryHref="/notion-template"
            secondary="Book a walkthrough"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
