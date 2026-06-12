import type { Metadata } from "next";
import { CheckCircle, DollarSign, Handshake, Landmark, Network, UsersRound } from "lucide-react";
import { EditorialVisual } from "@/components/EditorialVisuals";
import { PartnerReferralForm } from "@/components/LeadForms";
import { CTABand, SectionHeader } from "@/components/UI";

export const metadata: Metadata = {
  title: "Saberra Partner Program &mdash; Earn 20% for Referrals",
  description:
    "Refer teams that need organizational memory infrastructure. Earn 20% of setup fees and 15% of first-year recurring. Built for Notion consultants, fractional COOs, and governance advisors.",
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
            <div className="eyebrow">Partner referrals</div>
            <h1>Know a team that cannot afford to forget?</h1>
            <p>
              Saberra works best when a trusted advisor can see the pattern before the team has language for it:
              decisions get buried, role history disappears, context lives in a few people, and nobody wants another tool
              to manage.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#partner-form">
                Refer a team
              </a>
              <a className="btn btn-secondary" href="/audit">
                Send the Memory Audit
              </a>
            </div>
          </div>
          <EditorialVisual
            src="/editorial-partner-network.svg"
            alt="A trusted advisor network visual showing referral paths into Saberra."
            eyebrow="Trusted network"
            title="The best referrals come from people who see the risk early."
            copy="Partners do not need to sell software. They need to recognize when a team is running without durable memory."
          />
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <SectionHeader eyebrow="Who it is for" title="A private referral path for high-trust advisors.">
            This is for people who already advise teams where memory loss creates real operational risk: repeated
            decisions, founder bottlenecks, stale Notion records, and painful handoffs.
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
          <SectionHeader eyebrow="Commission structure" title="Earn 20% for every team you introduce." />
          <div className="grid-2 split">
            <article className="card" style={{ borderLeft: "3px solid #D6A24A" }}>
              <DollarSign color="#D6A24A" size={26} aria-hidden="true" />
              <h3>What you earn</h3>
              <ul className="list" style={{ marginTop: 14 }}>
                <li><CheckCircle size={15} color="#D6A24A" aria-hidden="true" /> 20% of th