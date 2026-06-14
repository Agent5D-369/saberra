import type { Metadata } from "next";
import { CTABand, SectionHeader } from "@/components/UI";
import { JobApplicationForm } from "@/components/JobApplicationForm";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Work With Saberra | Open Steward Roles",
  description:
    "Saberra is looking for independent stewards to lead deployments, support clients, and build the partner ecosystem. Role-share compensation from net collected revenue.",
  alternates: { canonical: "/careers" }
};

const schema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Saberra Open Steward Roles",
  url: `${siteUrl}/careers`,
  itemListElement: [
    { "@type": "JobPosting", title: "Memory Architecture Steward", hiringOrganization: { "@type": "Organization", name: "Saberra" }, employmentType: "CONTRACTOR", jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "US" } }, description: "Lead 30-day Saberra deployments for mission-driven organizations. Configure capture infrastructure, build the Notion Memory OS, train Memory Admins, and deliver the Week 4 Memory Health Readout." },
    { "@type": "JobPosting", title: "Client Memory Steward", hiringOrganization: { "@type": "Organization", name: "Saberra" }, employmentType: "CONTRACTOR", jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "US" } }, description: "Support active Saberra clients through the review queue process, train Memory Admins, and deliver monthly memory health check-ins." },
    { "@type": "JobPosting", title: "Ecosystem Bridge Steward", hiringOrganization: { "@type": "Organization", name: "Saberra" }, employmentType: "CONTRACTOR", jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "US" } }, description: "Build referral relationships with Notion consultants, ops advisors, and governance practitioners. Generate qualified referrals and bring market feedback back into Saberra." }
  ]
};

const roles = [
  {
    id: "memory-architecture-steward",
    title: "Memory Architecture Steward",
    conventional: "Implementation Lead",
    phase: "Phase 2",
    compensation: "25–35% of setup net collected revenue from deployments you lead (inside Delivery Pool), with a $500–$1,500 deployment floor recouped from your NCR share",
    summary:
      "This role delivers the core Saberra offer: the 30-day founder-led institutional memory deployment. You configure the capture infrastructure, build the Notion Memory OS, train the client's Memory Admin, and produce the Week 4 Memory Health Readout. When this role is filled, the founder stops being the only person who can close and deliver.",
    accountabilities: [
      "Lead the 30-Day Saberra Memory Deployment from source map to reviewed operating memory.",
      "Configure the Google Meet and email capture path into the dedicated inbox.",
      "Build or duplicate the Notion Memory OS: databases, review queues, role records, and source audit trail.",
      "Test the full loop: extraction, candidate review, approval, and Sera retrieval.",
      "Train the client Memory Admin to approve, correct, reject, and govern candidate records.",
      "Deliver the Week 4 Memory Health Readout with reviewed decisions, open risks, and next steps.",
      "Escalate scope changes, custom requests, and trust concerns rather than absorbing them."
    ],
    ideal: [
      "Deep Notion builder. You have built complex, multi-database Notion systems for real organizations, not just personal productivity setups.",
      "Operations or information architecture background. You think about how information flows and gets trusted, not just stored.",
      "Experience working with distributed, self-managing, nonprofit, or governance-heavy teams.",
      "Comfortable working directly with clients in a training and configuration capacity.",
      "Familiar with AI extraction workflows, email routing, or knowledge management systems.",
      "Independent contractor. This is a steward role with project-based engagement, not a staff position."
    ],
    notFor: [
      "People who want to build custom features or expand scope on every deployment.",
      "People who are not comfortable saying no to requests outside the defined 30-day scope.",
      "People who need a manager to define the work each week."
    ]
  },
  {
    id: "client-memory-steward",
    title: "Client Memory Steward",
    conventional: "Client Success",
    phase: "Phase 2",
    compensation: "10–25% of monthly retainer net collected revenue per client you actively steward (inside Client Continuity Pool)",
    summary:
      "Once a deployment is live, clients need ongoing support to build and sustain review habits. This role keeps the memory system working: checking in on review queue health, helping Memory Admins through difficult records, and flagging when a client's system is drifting. This is the role that makes retainers defensible.",
    accountabilities: [
      "Support active clients through the weekly review queue process with regular check-ins.",
      "Help Memory Admins understand candidate records, resolve review questions, and build approval confidence.",
      "Deliver monthly memory health reviews: queue depth, decision coverage, open risks, stale records.",
      "Identify and flag when a client system is drifting, inactive, or at risk of abandonment.",
      "Prepare renewal readiness notes before retainer reviews.",
      "Document common client questions and patterns to improve deployment quality.",
      "Escalate trust, data, or scope concerns rather than resolving them unilaterally."
    ],
    ideal: [
      "Operations generalist with strong written communication. You write clearly and train people without making them feel inadequate.",
      "Detail-oriented but not rigid. You can help someone work through a confusing record without needing a process for every scenario.",
      "Comfortable working with Notion at an intermediate level. You do not need to build databases from scratch but can navigate and explain complex ones.",
      "Experience in client success, account management, or organizational consulting.",
      "Genuine interest in how organizations remember and use their own history.",
      "Independent contractor. Ongoing engagement measured in hours per client per month, not full-time."
    ],
    notFor: [
      "People who need to own the product or system architecture decisions.",
      "People who are not comfortable doing repetitive, relationship-based check-in work.",
      "People looking for a high-volume, transactional support role."
    ]
  },
  {
    id: "ecosystem-bridge-steward",
    title: "Ecosystem Bridge Steward",
    conventional: "Partnerships",
    phase: "Phase 2 / Phase 3",
    compensation: "10–15% of setup net collected revenue when a referral materially contributes to a closed deployment, plus 5% of first 3 months retainer NCR (inside Market Pool)",
    summary:
      "Saberra grows through trusted relationships with people who already serve the teams we help: Notion consultants, operations advisors, fractional COOs, governance practitioners, cooperative developers, and organizational design consultants. This role builds those relationships, qualifies referrals, and brings market feedback back. It is not a sales role. It is a trust-building role with an economic incentive.",
    accountabilities: [
      "Build referral relationships with Notion consultants, ops advisors, governance practitioners, and fractional operators who serve distributed or mission-driven teams.",
      "Generate qualified referrals: organizations with active memory pain, live transition triggers, or repeated decision-loss problems.",
      "Track and document referral conversations, objections, and buyer language.",
      "Bring market feedback back into Saberra: what language resonates, what gets rejected, what competitors come up.",
      "Maintain a clean referral ledger so compensation is traceable.",
      "Represent Saberra honestly: diagnose before pitching, lead with the Memory Audit, do not overclaim.",
      "Escalate any partnership commitment that implies authority, exclusivity, or resources Saberra cannot deliver."
    ],
    ideal: [
      "Existing network in Notion consulting, ops consulting, Teal/Sociocracy/Holacracy spaces, cooperative development, nonprofit operations, or governance advisory.",
      "Consultative approach. You lead with questions and diagnosis, not demos and decks.",
      "Comfortable with uncertainty. You can hold a referral relationship without pushing for an outcome.",
      "Clear communicator who can explain what Saberra is not as clearly as what it is.",
      "Independent contractor with an existing practice or network, not someone building their network from scratch.",
      "Aligned with Saberra's values around human review, inspectable records, and not overpromising AI."
    ],
    notFor: [
      "People who want to pitch broadly and filter by response rate.",
      "People who need guaranteed commission timing before qualified lead conversion.",
      "People representing Saberra as an AI automation or meeting notes tool."
    ]
  }
];

export default function CareersPage() {
  return (
    <main className="careers-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Open steward roles</div>
          <h1>Build the memory infrastructure for organizations that cannot afford to forget.</h1>
          <p>
            Saberra is looking for independent stewards to lead deployments, support clients, and build the partner
            ecosystem. These are not jobs. They are role-share engagements where compensation comes from the work you
            actually do, paid from net collected revenue.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#memory-architecture-steward">
              View role details
            </a>
            <a className="btn btn-secondary" href="#apply">
              Apply now
            </a>
          </div>
          <div id="open-roles" className="careers-role-cards" aria-label="Open steward roles">
            {roles.map((role) => (
              <a className="career-role-card" href={`#${role.id}`} key={role.id}>
                <span>{role.phase}</span>
                <strong>{role.title}</strong>
                <small>Comparable to: {role.conventional}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight alt">
        <div className="container">
          <SectionHeader
            eyebrow="How this works"
            title="Steward roles, not staff positions."
          >
            Saberra uses a transparent net-collected-revenue model. Every active role is compensated from a defined
            pool. Percentages are written before work begins. You are an independent steward, not an employee. Nothing
            starts without a clear written agreement on scope, compensation, and exit conditions.
          </SectionHeader>
          <div className="grid-3" style={{ marginTop: 32 }}>
            {[
              ["Role-share compensation", "Each role draws from a specific pool as a percentage of net collected revenue from the work it contributes to. No equity promises, no vague future upside. Implementation roles may include a small deployment floor that is recouped from the final NCR share."],
              ["Written before work begins", "Scope, compensation, review dates, payment timing, and exit conditions are written and agreed before any engagement starts. If the math does not work for both sides, we do not start."],
              ["Payment timing", "NCR shares are settled monthly and paid within 30 days after Saberra collects the related client revenue, unless the written agreement sets a different schedule."],
              ["Independent contractor", "These are project-based and ongoing retainer engagements for independent contractors. You keep your own practice. You set your own hours within agreed delivery expectations."]
            ].map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {roles.map((role, i) => (
        <section
          key={role.id}
          id={role.id}
          className={`section tight${i % 2 === 0 ? "" : " alt"}`}
        >
          <div className="container">
            <div className="role-header">
              <div>
                <div className="eyebrow">{role.phase}</div>
                <h2 className="serif">{role.title}</h2>
                <p className="role-conventional">
                  Comparable to: <strong>{role.conventional}</strong>
                </p>
                <p className="role-comp-line">
                  <strong>Compensation:</strong> {role.compensation}
                </p>
              </div>
            </div>

            <p className="role-summary">{role.summary}</p>

            <div className="role-detail-grid">
              <div>
                <h3 className="role-section-label">Accountabilities</h3>
                <ul className="list">
                  {role.accountabilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="role-section-label">Ideal background</h3>
                <ul className="list">
                  {role.ideal.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <h3 className="role-section-label" style={{ marginTop: 28 }}>This role is not for</h3>
                <ul className="list muted">
                  {role.notFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <a href="#apply" className="btn-secondary role-apply-link">
              Apply for this role
            </a>
          </div>
        </section>
      ))}

      <section id="apply" className="section tight">
        <div className="container">
          <SectionHeader
            eyebrow="Apply"
            title="Tell us what you would bring."
          >
            We review every application. If there is a fit, we will reach out to start a conversation about the role,
            the work model, and whether the compensation structure makes sense for your situation. Nothing moves forward
            without that conversation.
          </SectionHeader>
          <div className="form-container" style={{ marginTop: 40 }}>
            <JobApplicationForm />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CTABand
            title="Not sure which role fits? Take the conversation further."
            copy="If none of these roles map exactly to what you offer but the work resonates, tell us anyway. The right roles evolve with the right people."
            primary="Apply and tell us"
            primaryHref="#apply"
            secondary="Open the demo hub"
            secondaryHref="/notion-template"
          />
        </div>
      </section>
    </main>
  );
}
