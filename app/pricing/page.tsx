import type { Metadata } from "next";
import { PricingCards } from "@/components/PricingCards";
import { CTABand, SectionHeader } from "@/components/UI";
import { SovereigntyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Founding Memory Partner pricing for Saberra, including done-for-you setup, Sera Q&A, Notion memory backend, and human review workflow.",
  alternates: { canonical: "/pricing" }
};

export default function PricingPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Early access pricing for serious memory loss pain.</h1>
          <p>
            Saberra is currently delivered as a done-for-you institutional memory deployment for high-fit teams using
            Google Workspace and Notion.
          </p>
        </div>
      </section>
      <PricingCards />
      <section className="section tight">
        <div className="container split">
          <SectionHeader title="Your data. Your tools. Your memory.">
            Saberra is deployed inside infrastructure your organization controls: Google Workspace, Notion, your AI
            provider account, Railway, and a dedicated capture inbox. We handle the technical setup and memory workflow, but your
            organizational record stays in your workspace.
          </SectionHeader>
          <ul className="list">
            <li>Your memory lives in your Notion workspace.</li>
            <li>Your infrastructure accounts stay yours.</li>
            <li>Saberra does not put your organizational history in a black-box database.</li>
            <li>Sera answers from records your team can inspect, edit, and govern.</li>
          </ul>
        </div>
        <div className="container" style={{ marginTop: 26 }}>
          <SovereigntyVisual />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Talk through fit before deployment."
            copy="Best fit teams have 15 to 200 people, run on Google Workspace, use or are willing to use Notion, and feel real pain from lost decisions or key-person knowledge."
            primary="Get the free Notion template"
            primaryHref="/notion-template"
            secondary="Book a 30-minute call"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
