import { CheckCircle } from "lucide-react";
import { CTAButton, SectionHeader } from "@/components/UI";

const tiers = [
  {
    name: "Core Deployment",
    price: "$3,000 to $5,000 setup",
    monthly: "$750 to $1,250 monthly",
    best: "Best for small serious teams up to 30 people.",
    features: ["Done-for-you setup", "Sera Q&A", "Notion memory backend", "Human review workflow"]
  },
  {
    name: "Growth Deployment",
    price: "$5,000 to $8,000 setup",
    monthly: "$1,500 to $2,500 monthly",
    best: "Best for 30 to 100 people.",
    features: ["Expanded schema tuning", "Review queue training", "Founder-led onboarding", "Monthly optimization"]
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
        <SectionHeader title="Founding Memory Partner pricing.">
          Saberra is currently delivered as done-for-you implementation, not self-serve signup.
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
                <CTAButton href="mailto:rick@amora.cr?subject=Saberra%20Founding%20Access">Apply for founding access</CTAButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
