import type { Metadata } from "next";
import { PricingCards } from "@/components/PricingCards";
import { CTABand, SectionHeader, SeraScene } from "@/components/UI";
import { PipelineAnatomyVisual, SovereigntyVisual } from "@/components/VisualPanels";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Saberra costs less than one bad transition. Done-for-you deployment. No self-serve. See the plans.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Saberra Pricing — Costs less than one bad transition",
    description:
      "One key person leaves and you lose six months of operating context. Saberra costs less than that. Done-for-you deployment, no self-serve.",
    images: [{ url: "/og-pricing.png", width: 1200, height: 630, alt: "Saberra pricing — institutional memory infrastructure" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Saberra Pricing — Costs less than one bad transition",
    description: "One key person leaves. You lose six months of context. Saberra costs less than that.",
    images: ["/og-pricing.png"]
  }
};

export default function PricingPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Pricing for teams ready to stop operating from chaos.</h1>
          <p>
            Saberra is a done-for-you deployment, not instant self-serve software. We set up the full system inside
            your own tool accounts, configure Sera for your operating patterns, and design the human review workflow
            around your team. If the right Google Workspace or Notion foundation does not exist yet, we can provision,
            migrate, or clean it up as additional implementation scope. You own the record. We handle the setup.
          </p>
        </div>
      </section>

      {/* ── DATA SOVEREIGNTY: elevated above pricing tiers ─────── */}
      <section className="section tight">
        <div className="container split">
          <SectionHeader title="Your data never leaves your workspace. No black box. No vendor lock-in.">
            Saberra is set up inside accounts your organization controls: Google Workspace, Notion, your AI provider
            account, Railway, and a dedicated capture inbox. Every record Sera has ever touched is inspectable,
            editable, and yours to govern.
          </SectionHeader>
          <ul className="list">
            <li>Your Living Memory Hub lives in your own Notion workspace.</li>
            <li>Your tool accounts stay yours. Saberra is a configuration, not a custody arrangement.</li>
            <li>Every record is traceable to its source meeting or email.</li>
            <li>Sera answers from records your team can inspect, edit, and govern.</li>
            <li>Workspace provisioning, Notion cleanup, account migration, and custom backend work are scoped separately.</li>
            <li>Custom data architecture, including Postgres or additional systems of record, available for larger deployments.</li>
          </ul>
        </div>
        <div className="container" style={{ marginTop: 26 }}>
          <SovereigntyVisual />
        </div>
      </section>

      {/* ── PIPELINE ANATOMY: what they are paying for ───────── */}
      <section className="section tight">
        <div className="container pricing-sera-layout">
          <div>
            <SectionHeader
              eyebrow="What you are paying for"
              title="Every step is visible. Every record is traceable."
            >
              Saberra is a complete pipeline: capture to Sera-drafted candidate to human-reviewed record to
              source-backed answer. You see every step. Nothing becomes trusted organizational memory without a
              human decision.
            </SectionHeader>
            <div style={{ marginTop: 32 }}>
              <PipelineAnatomyVisual />
            </div>
          </div>
          <SeraScene variant="operator" />
        </div>
      </section>

      {/* ── COA COMPARISON: reframe price before tiers ───────── */}
      <section className="section tight">
        <div className="container">
          <div className="eyebrow" style={{ textAlign: "center", marginBottom: 16 }}>The real comparison</div>
          <p style={{ textAlign: "center", color: "#8da3a8", maxWidth: 560, margin: "0 auto 24px", fontSize: "1.05rem" }}>
            The alternative to Saberra is not nothing. It is a part-time operations person doing this manually.
          </p>
          <div className="pricing-coa-compare">
            <div className="pricing-coa-col saberra">
              <div className="pricing-coa-label">Saberra</div>
              <div className="pricing-coa-price">$300 &ndash; $500<span style={{ fontSize: "1rem", fontWeight: 400, color: "#6a8890" }}>/mo</span></div>
              <div className="pricing-coa-desc">Done-for-you. Human-reviewed. Sera included. Setup in 4 weeks.</div>
            </div>
            <div className="pricing-coa-divider">VS</div>
            <div className="pricing-coa-col manual">
              <div className="pricing-coa-label">Fractional COO / Chief of Staff</div>
              <div className="pricing-coa-price" style={{ color: "#6a8890" }}>$4,000 &ndash; $8,000<span style={{ fontSize: "1rem", fontWeight: 400 }}>/mo</span></div>
              <div className="pricing-coa-desc">Manual documentation. Context still walks out the door when they leave.</div>
            </div>
          </div>
          <p style={{ textAlign: "center", color: "#5a7880", fontSize: "0.9rem", marginTop: 12 }}>
            One key-person transition costs your team an estimated $20,000 &ndash; $40,000 in lost context and re-ramp time. Saberra&apos;s full annual cost is less than half of one transition.
          </p>
        </div>
      </section>

      <PricingCards />

      <section className="section">
        <div className="container">
          <CTABand
            title="If you have been nodding through this page, that is the signal."
            copy="Book 30 minutes. We'll show you exactly what leaks from your current system and what Saberra would look like for your team."
            primary="Apply for a founding spot"
            primaryHref="/founding-access"
            secondary="Watch Sera work"
            secondaryHref="/demo"
          />
        </div>
      </section>
    </main>
  );
}
