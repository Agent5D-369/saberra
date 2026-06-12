import { CheckCircle } from "lucide-react";
import { CTAButton, SectionHeader } from "@/components/UI";

const tiers = [
  {
    name: "Founding Partner",
    price: "Setup from $1,500",
    monthly: "From $300/month",
    best: "For 3–5 founding case-study organizations only. Full access, founder-led onboarding, and discounted pricing locked for 12 months.",
    badge: "Limited spots",
    features: [
      "Done-for-you Saberra setup",
      "Organizational memory audit before and after",
      "Sera Q&A configured for your operating patterns",
      "Living Memory Hub backend",
      "Human approval workflow design",
      "Direct founder access for 90 days",
      "Founding pricing locked for 12 months"
    ]
  },
  {
    name: "Core Deployment",
    price: "Setup from $3,000",
    monthly: "From $750/month",
    best: "Best for small serious teams up to 30 people that already feel the cost of forgetting.",
    badge: null,
    features: [
      "Done-for-you setup",
      "Sera Q&A",
      "Living Memory Hub backend",
      "Human approval workflow",
      "Operating intelligence support"
    ]
  },
  {
    name: "Growth Deployment",
    price: "Setup from $5,000",
    monthly: "From $1,500/month",
    best: "Best for 30 to 100 people with complex governance, delivery memory, or program continuity needs.",
    badge: null,
    features: [
      "Expanded schema tuning for your context",
      "Review queue training",
      "Founder-led onboarding",
      "Monthly memory health review",
      "All Core features included"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom setup",
    monthly: "Custom monthly",
    best: "For advanced security requirements, custom data architecture, SLA, and partner integrations.",
    badge: null,
    features: [
      "Custom technical boundaries",
      "Security review",
      "Partner implementation",
      "Advanced governance support",
      "Postgres or custom backend scoped"
    ]
  }
];

export function PricingCards() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Done-for-you deployment pricing.">
          Saberra is not instant self-serve software. Every deployment includes a guided setup inside your own tool
          accounts, so your organizational record stays inspectable, editable, and yours.
        </SectionHeader>

        {/* Cost callout ABOVE tiers — feel the cost before you see the price */}
        <article className="card" style={{ marginBottom: 32, borderLeft: "3px solid #C0392B" }}>
          <h3>What memory loss actually costs your team</h3>
          <p>
            When a key person transitions, the average team spends 3 to 6 months re-establishing context. At a
            fully-loaded cost of $80,000 per year, that is $20,000 to $40,000 of buried organizational knowledge per
            transition. Saberra&apos;s full annual cost is less than half of one transition. Saberra does not eliminate
            transitions. It eliminates the reconstruction tax.
          </p>
          <p style={{ marginTop: 12, color: "#6FB7B7", fontWeight: 700, fontSize: "0.93rem" }}>
            Saberra vs. hiring a chief of staff to do this manually: Saberra from $300/month. Part-time COA: $4,000 to $8,000/month.
          </p>
        </article>

        <div className="pricing-grid">
          {tiers.map((tier) => (
            <article className="card" key={tier.name} style={{ border: tier.name === "Founding Partner" ? "3px solid #D6A24A" : undefined, position: "relative" }}>
              {tier.badge ? (
                <div style={{ position: "absolute", top: -12, right: 16, background: "#D6A24A", color: "#0A1520", fontSize: "0.78rem", fontWeight: 800, padding: "3px 12px", borderRadius: 20, letterSpacing: "0.04em" }}>
                  {tier.badge}
                </div>
              ) : null}
              <h3>{tier.name}</h3>
              <div className="price">{tier.price}</div>
              <p style={{ color: "#6FB7B7", fontWeight: 800 }}>{tier.monthly}</p>
              <p>{tier.best}</p>
              <ul className="list">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle size={16} color="#D6A24A" aria-hidden="true" /> {feature}
                  </li>
                ))}
              </ul>
              <div className="cta-row" style={{ marginTop: 20 }}>
                <CTAButton href={tier.name === "Founding Partner" ? "/founding-access" : "/demo"}>
                  {tier.name === "Founding Partner" ? "Apply for a founding spot" : "Book a 30-minute call"}
                </CTAButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
