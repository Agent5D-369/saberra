import type { Metadata } from "next";
import { CheckCircle, DollarSign, Handshake, Landmark, Network, UsersRound } from "lucide-react";
import { EditorialVisual } from "@/components/EditorialVisuals";
import { PartnerReferralForm } from "@/components/LeadForms";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "Saberra Channel Partner Program",
  description:
    "Add Saberra to your Notion, Google Workspace, or operations consulting practice as a managed institutional memory layer for clients.",
  alternates: { canonical: "/partners" },
  keywords: [
    "Saberra partner program",
    "institutional memory referral",
    "Notion consultant partner",
    "governance consultant referral",
    "operations consultant partner"
  ]
};

const partners = [
  {
    icon: Network,
    title: "Governance and self-management advisors",
    copy: "For consultants supporting Teal, Holacracy, Sociocracy, cooperative, and distributed authority teams."
  },
  {
    icon: Landmark,
    title: "Nonprofit and social enterprise operators",
    copy: "For advisors helping mission-driven teams preserve program history, decisions, and continuity."
  },
  {
    icon: UsersRound,
    title: "Fractional COOs and Chiefs of Staff",
    copy: "For operators who see the cost of founder memory, senior-person bottlenecks, and missing decision records."
  },
  {
    icon: Handshake,
    title: "Notion and Google Workspace consultants",
    copy: "For implementation partners whose clients need more than a workspace. They need a memory loop that stays updated."
  }
];

export default function PartnersPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container split">
          <div>
            <div className="eyebrow">Channel partners</div>
            <h1>Add Saberra to your Notion or Workspace practice.</h1>
            <p>
              Your clients already paid you to organize the workspace. Saberra adds the active memory layer: Sera
              extracts decisions, tasks, risks, and context from meetings and email so the system stays current after
              your engagement ends.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#partner-form">
                Apply as a partner
              </a>
              <a className="btn btn-secondary" href="/audit">
                Send the Memory Audit
              </a>
            </div>
          </div>
          <EditorialVisual
            src="/editorial-partner-network.svg"
            alt="A trusted advisor network visual showing referral paths into Saberra."
            eyebrow="Implementation channel"
            title="You keep the client relationship. Saberra runs the memory layer."
            copy="Built for Notion consultants, Workspace resellers, fractional operators, and governance advisors with clients who need more than a static knowledge base."
          />
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Who it is for" title="A channel path for implementation partners.">
            This is for partners whose clients need a memory loop that stays updated: Notion consultants, Google
            Workspace resellers, fractional COOs, Chiefs of Staff, and advisors who already see the cost of lost context.
          </SectionHeader>
          <div className="grid-4">
            {partners.map((partner) => {
              const Icon = partner.icon;
              return (
                <article className="card" key={partner.title}>
                  <Icon size={28} color="#D6A24A" aria-hidden="true" />
                  <h3>{partner.title}</h3>
                  <p>{partner.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container split">
          <div>
            <div className="eyebrow">Referral fit</div>
            <h2 className="serif">The right referral is already feeling memory pain.</h2>
            <p>
              Strong referrals use Google Workspace, Notion or a Notion-ready workflow, and have recurring decisions,
              risks, roles, policies, meetings, or client context that should survive beyond the people currently
              holding it.
            </p>
          </div>
          <div className="card">
            <h3>Best referrals usually say:</h3>
            <ul className="list">
              <li>We already decided this, but nobody can find where.</li>
              <li>Everything important is in one senior person&apos;s head.</li>
              <li>We use Notion, but the records do not stay current.</li>
              <li>We need source-backed answers, not another meeting summary.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── COMMISSION STRUCTURE ───────────────────────────────── */}
      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Partner economics" title="Add a recurring memory layer to client engagements." />
          <div className="grid-2 split">
            <article className="card" style={{ borderLeft: "3px solid #D6A24A" }}>
              <DollarSign color="#D6A24A" size={26} aria-hidden="true" />
              <h3>What you earn</h3>
              <ul className="list" style={{ marginTop: 14 }}>
                <li><CheckCircle size={15} color="#D6A24A" aria-hidden="true" /> 20% of the setup fee, paid at 30 days post-deployment</li>
                <li><CheckCircle size={15} color="#D6A24A" aria-hidden="true" /> 15% of monthly recurring for the first 12 months</li>
                <li><CheckCircle size={15} color="#D6A24A" aria-hidden="true" /> No minimums. No exclusivity. You keep the consulting relationship.</li>
              </ul>
            </article>
            <article className="card">
              <h3>Example: one referral at Core Deployment</h3>
              <p style={{ fontSize: "0.9rem", color: "#9bb5ba" }}>Setup $4,000 + $1,000/month</p>
              <ul className="list" style={{ marginTop: 14, fontSize: "0.95rem" }}>
                <li><CheckCircle size={15} color="#6FB7B7" aria-hidden="true" /> Setup fee: <strong style={{ color: "#D6A24A" }}>$800</strong></li>
                <li><CheckCircle size={15} color="#6FB7B7" aria-hidden="true" /> 12-month recurring: <strong style={{ color: "#D6A24A" }}>$1,800</strong></li>
                <li><CheckCircle size={15} color="#6FB7B7" aria-hidden="true" /> Year-one total: <strong style={{ color: "#D6A24A" }}>$2,600</strong> from one introduction</li>
              </ul>
              <p style={{ marginTop: 12, fontSize: "0.85rem", color: "#6a8a90" }}>
              We handle the AI layer and memory deployment. You stay the trusted advisor for the workspace.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="partner-form" className="section tight">
        <div className="container split">
          <div>
            <div className="eyebrow">Partner form</div>
            <h2 className="serif">Apply to add Saberra to your practice.</h2>
            <p>
              Tell us what kind of clients you serve and where Saberra could fit into your implementation motion. Warm
              referrals still work, but this page is built for channel partners who want a repeatable offer.
            </p>
            <p style={{ marginTop: 12 }}>
              Not ready to refer yet? Send the Memory Audit to any team you suspect is leaking and let them find out
              for themselves: saberra.com/audit.
            </p>
          </div>
          <PartnerReferralForm />
        </div>
      </section>
    </main>
  );
}
