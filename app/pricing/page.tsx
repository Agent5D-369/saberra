import type { Metadata } from "next";
import { PricingCards } from "@/components/PricingCards";
import { CTABand, SectionHeader } from "@/components/UI";
import { SovereigntyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Saberra pricing for teams that need done-for-you setup, reviewed memory records, Sera answers, and a Notion memory backend.",
  alternates: { canonical: "/pricing" }
};

export default function PricingPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Pricing for teams that are done losing decisions.</h1>
          <p>
            Saberra is currently delivered as a done-for-you setup for teams using Google Workspace and Notion. We map
            where memory leaks, configure the capture and review workflow, and help your team start asking Sera from
            reviewed records.
          </p>
        </div>
      </section>
      <PricingCards />
      <section className="section tight">
        <div className="container split">
          <SectionHeader title="Your data. Your tools. Your memory.">
            Saberra is set up inside accounts your organization controls: Google Workspace, Notion, your AI provider
            account, Railway, and a dedicated capture inbox. We handle the technical setup and review workflow, but your
            organizational record stays inspectable in your workspace.
          </SectionHeader>
          <ul className="list">
            <li>Your memory lives in your Notion workspace by default.</li>
            <li>Your tool accounts stay yours.</li>
            <li>Saberra does not hide your organizational history in a database your team cannot inspect.</li>
            <li>Sera answers from records your team can inspect, edit, and govern.</li>
            <li>Custom data architecture, including Postgres or additional systems of record, can be scoped for larger deployments.</li>
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
            copy="Best-fit teams have 15 to 200 people, run on Google Workspace, use or are willing to use Notion, and feel real pain from lost decisions, unclear ownership, or key-person knowledge."
            primary="Get the manual Memory OS"
            primaryHref="/notion-template"
            secondary="Book a 30-minute call"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
