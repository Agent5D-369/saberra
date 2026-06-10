import type { Metadata } from "next";
import { PricingCards } from "@/components/PricingCards";
import { CTABand, SectionHeader } from "@/components/UI";
import { SovereigntyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Saberra pricing for teams that need a done-for-you AI operations layer with Sera, human approval, and a private Living Memory Hub.",
  alternates: { canonical: "/pricing" }
};

export default function PricingPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Pricing for teams ready to stop operating from chaos.</h1>
          <p>
            Saberra is a done-for-you deployment — not instant self-serve software. We set up the full system inside
            your own tool accounts, configure Sera for your operating patterns, and design the human review workflow
            around your team. You own the record. We handle the setup.
          </p>
        </div>
      </section>

      {/* ── DATA SOVEREIGNTY — elevated above pricing tiers ─────── */}
      <section className="section tight">
        <div className="container split">
          <SectionHeader title="Your data never leaves your workspace. No black box. No vendor lock-in.">
            Saberra is set up inside accounts your organization controls — Google Workspace, Notion, your AI provider
            account, Railway, and a dedicated capture inbox. Every record Sera has ever touched is inspectable,
            editable, and yours to govern.
          </SectionHeader>
          <ul className="list">
            <li>Your Living Memory Hub lives in your own Notion workspace.</li>
            <li>Your tool accounts stay yours — Saberra is a configuration, not a custody arrangement.</li>
            <li>Every record is traceable to its source meeting or email.</li>
            <li>Sera answers from records your team can inspect, edit, and govern.</li>
            <li>Custom data architecture, including Postgres or additional systems of record, available for larger deployments.</li>
          </ul>
        </div>
        <div className="container" style={{ marginTop: 26 }}>
          <SovereigntyVisual />
        </div>
      </section>

      <PricingCards />

      <section className="section">
        <div className="container">
          <CTABand
            title="If you've been nodding through this page — that's the signal."
            copy="Book 30 minutes. We'll show you exactly what leaks from your current system and what Saberra would look like for your team."
            primary="Apply for a founding spot"
            primaryHref="/founding-access"
            secondary="See Sera organize chaos"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
