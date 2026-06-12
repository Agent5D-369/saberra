import type { Metadata } from "next";
import { Audit } from "@/components/Audit";
import { EditorialVisual } from "@/components/EditorialVisuals";
import { AuditReportVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Organizational Memory Audit",
  description:
    "10 questions. See whether your memory risk is stable, early-stage, serious, or critical. Free diagnostic. Takes 3 minutes.",
  alternates: { canonical: "/audit" },
  openGraph: {
    title: "Find out where your organization is leaking — Free Memory Audit",
    description:
      "10 questions. Segment-specific results. See whether your memory risk is stable, early-stage, serious, or critical. Takes 3 minutes.",
    images: [{ url: "/og-audit.png", width: 1200, height: 630, alt: "Saberra Organizational Memory Audit — find out where your org is leaking" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Find out where your organization is leaking",
    description: "10 questions. Segment-specific results. Takes 3 minutes.",
    images: ["/og-audit.png"]
  }
};

const auditJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "Organizational Memory Audit",
      "url": "https://saberra.com/audit",
      "description": "A 10-question diagnostic that scores organizational memory health and identifies where decisions, context, tasks, and institutional knowledge are leaking.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How long does the Organizational Memory Audit take?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The audit takes approximately 3 minutes. It consists of 10 questions about how your organization captures, stores, and retrieves decisions, context, tasks, and institutional knowledge."
          }
        },
        {
          "@type": "Question",
          "name": "What does the audit measure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The audit measures organizational memory health across four bands: Stable memory base (score 1-18), Early memory leakage (19-30), Serious operating intelligence gap (31-40), and Critical knowledge bleed (41-50). Results are specific to your organization type."
          }
        },
        {
          "@type": "Question",
          "name": "Is the audit free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The Organizational Memory Audit is completely free. No account required. Results are immediate and shareable."
          }
        },
        {
          "@type": "Question",
          "name": "What happens after I complete the audit?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You receive a segment-specific diagnosis, a score out of 50, your likely risk areas, and access to Sera for follow-up questions about your result. You can also share your result with your team."
          }
        }
      ]
    }
  ]
};

export default function AuditPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditJsonLd) }}
      />
      <section className="page-hero">
        <div className="container">
          <h1>Find out exactly where your organization is leaking.</h1>
          <p>
            Ten questions. Segment-specific results. See whether your memory risk is stable, early-stage, serious, or
            critical, and which records to fix first. Takes about three minutes. Share the result with your team.
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
