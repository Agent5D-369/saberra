import type { Metadata } from "next";
import { Audit } from "@/components/Audit";
import { EditorialVisual } from "@/components/EditorialVisuals";
import { AuditReportVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Organizational Memory Audit",
  description:
    "Take the 10-question Organizational Memory Audit and diagnose where decisions, context, tasks, and institutional knowledge are leaking from your system.",
  alternates: { canonical: "/audit" }
};

export default function AuditPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Find out exactly where your organization is leaking.</h1>
          <p>
            Ten questions. Segment-specific results. See whether your memory risk is stable, early-stage, serious, or
            critical — and which records to fix first. Takes about three minutes. Share the result with your team.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <EditorialVisual
            src="/editorial-audit-diagnosis.svg"
            alt="Organizational Memory Audit report showing decision, context, task, and key-person memory risks."
            eyebrow="Diagnosis"
            title="Make the leak visible before it gets more expensive."
            copy="The audit turns repeated decisions, key-person dependency, missing follow-through, and onboarding drag into a concrete, shareable score. Most teams use it to start a real conversation about what the cost of the current system actually is."
          />
          <AuditReportVisual />
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <Audit />
        </div>
      </section>
    </main>
  );
}
