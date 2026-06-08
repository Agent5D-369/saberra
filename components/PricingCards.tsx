import { CheckCircle } from "lucide-react";
import { CTAButton, SectionHeader } from "@/components/UI";

const tiers = [
  {
    name: "Core Deployment",
    price: "$3,000 to $5,000 setup",
    monthly: "$750 to $1,250 monthly",
    best: "Best for small serious teams up to 30 people.",
    features: ["Done-for-you setup", "Sera Q&A", "Notion memory backend", "Human review workflow", "Memory operations support"]
  },
  {
    name: "Growth Deployment",
    price: "$5,000 to $8,000 setup",
    monthly: "$1,500 to $2,500 monthly",
    best: "Best for 30 to 100 people.",
    features: ["Expanded schema tuning", "Review queue training", "Founder-led onboarding", "Monthly memory health review"]
  },
  {
    name: "Enterprise",
    price: "Custom setup",
    monthly: "Custom monthly",
    best: "For advanced security, custom schema, SLA, and partner integrations.",
    features: ["Custom technical boundaries", "Security review", "Partner implementation", "Advanced governance support"]
  }
];

export function PricingCards() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Founder-led deployment pricing.">
          Saberra is currently delivered as a guided setup, not instant self-serve signup.
        </SectionHeader>
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <article className="card" key={tier.name}>
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
              <div className="cta-row">
                <CTAButton href="/demo">Book a 30-minute call</CTAButton>
              </div>
            </article>
          ))}
        </div>
        <article className="card" style={{ marginTop: 16 }}>
          <h3>Memory Admin requirement</h3>
          <p>
            Works best when one person owns memory review (~1-2 hours/week). Saberra reduces the capture burden, but
            trusted organizational memory still needs a human reviewer who can approve, correct, and steward records.
          </p>
        </article>
      </div>
    </section>
  );
}
