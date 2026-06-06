import type { Metadata } from "next";
import { PricingCards } from "@/components/PricingCards";
import { CTABand, SectionHeader } from "@/components/UI";

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
          <SectionHeader title="Transparent infrastructure reality.">
            Your team provides Google Workspace, Notion, Anthropic, Railway, and a dedicated inbox. We handle the
            technical setup and configure the memory workflow.
          </SectionHeader>
          <ul className="list">
            <li>No self-serve signup is implied.</li>
            <li>No per-seat pricing pressure for team-wide memory.</li>
            <li>Human review is part of the operating model.</li>
            <li>Infrastructure costs stay visible and client-controlled.</li>
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CTABand
            title="Apply for Founding Memory Partner access."
            copy="Best fit teams have 15 to 200 people, run on Google Workspace, use or are willing to use Notion, and feel real pain from lost decisions or key-person knowledge."
            primary="Apply for founding access"
            primaryHref="mailto:rick@amora.cr?subject=Saberra%20Founding%20Access"
          />
        </div>
      </section>
    </main>
  );
}
