import type { Metadata } from "next";
import { FoundingAccessForm } from "@/components/LeadForms";
import { SectionHeader } from "@/components/UI";
import { SovereigntyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Founder-Led Memory Deployment",
  description:
    "Founder-led memory deployment details for high-fit Saberra teams using Google Workspace and Notion.",
  alternates: { canonical: "/founding-access" }
};

export default function FoundingAccessPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Founder-led memory deployment.</h1>
          <p>
            Saberra is currently delivered as done-for-you memory infrastructure for teams with real institutional
            memory pain, not as self-serve software.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container split">
          <div>
            <SectionHeader title="Best fit teams already feel the cost of forgetting.">
              Strong fits usually have 15 to 200 people, Google Workspace, Notion or willingness to use Notion,
              meeting-heavy operations, and one person who can own memory review (~1-2 hours/week).
            </SectionHeader>
            <SovereigntyVisual />
          </div>
          <FoundingAccessForm />
        </div>
      </section>
    </main>
  );
}
