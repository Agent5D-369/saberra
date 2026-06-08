import type { Metadata } from "next";
import { FoundingAccessForm } from "@/components/LeadForms";
import { SectionHeader } from "@/components/UI";
import { SovereigntyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Founder-Led Memory Deployment",
  description:
    "Founder-led Saberra deployment for teams that need decisions, roles, risks, tasks, and source records to stay findable.",
  alternates: { canonical: "/founding-access" }
};

export default function FoundingAccessPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Get Saberra set up with a founder-led deployment.</h1>
          <p>
            Saberra is for teams that already feel the cost of forgetting: repeated decisions, stale Notion pages,
            unclear ownership, slow handoffs, and too much knowledge trapped in a few people&apos;s heads.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <div>
            <SectionHeader title="Best-fit teams already know what memory loss costs.">
              The strongest fits have 15 to 200 people, Google Workspace, Notion or willingness to use Notion,
              recurring meetings, real handoff pain, and one person who can review memory about 1-2 hours per week.
            </SectionHeader>
            <SovereigntyVisual />
          </div>
          <FoundingAccessForm />
        </div>
      </section>
    </main>
  );
}
