import type { Metadata } from "next";
import { Audit } from "@/components/Audit";
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
          <h1>Is your organization hemorrhaging knowledge?</h1>
          <p>
            Take the 10-question Organizational Memory Audit and see where decisions, context, tasks, and institutional
            knowledge are leaking from your system.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
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
