import type { Metadata } from "next";
import { ElementType } from "react";
import { Zap, FileSearch, Shield, Users, Clock } from "lucide-react";
import { FoundingAccessForm } from "@/components/LeadForms";

export const metadata: Metadata = {
  title: "Founding Memory Partner Program",
  description:
    "Apply for a founding deployment of Saberra: done-for-you institutional memory infrastructure for organizations that already know they are leaking.",
  alternates: { canonical: "/founding-access" }
};

type WhatYouGetItem = {
  Icon: ElementType;
  title: string;
  body: string;
};

const whatYouGet: WhatYouGetItem[] = [
  {
    Icon: Zap,
    title: "Done-for-you Saberra setup",
    body: "Week 1 through 4 is fully guided. We configure your capture inbox, connect your Google Workspace and Meet outputs, build your Living Memory Hub in Notion, and stand up Sera to answer from your organizational record."
  },
  {
    Icon: FileSearch,
    title: "Organizational Memory Audit: Before and After",
    body: "We run a pre-deployment memory audit and a post-deployment readout, so you have a clear before-and-after on where context was leaking and what has been closed."
  },
  {
    Icon: Shield,
    title: "Human review workflow designed for your team",
    body: "We design the approval queue, roll it into your ops rhythm, and train your human reviewer, so the system builds memory you can actually trust. Not just capture that accumulates without review."
  },
  {
    Icon: Users,
    title: "Sera configured for your actual meeting and email patterns",
    body: "Sera is tuned to your organizational context, not generic patterns. We use your real records, your actual role structure, and your operating vocabulary."
  },
  {
    Icon: Clock,
    title: "Direct founder access for the first 90 days",
    body: "Questions go directly to the person who built this. No ticket queue. No support bot. Real-time input on how to make the system work for your specific operating chaos."
  }
];

const lossItems = [
  "Another coordinator transitions and takes six months of governance context with them.",
  "The same strategic decision gets re-debated for the fourth time this quarter.",
  "A new hire spends three months in tribal knowledge archaeology instead of producing.",
  "The founder is still the operating system at 40 people, and it is getting worse.",
  "The board asks for the history behind a decision and nobody can find the source."
];

const fitItems = [
  "You are between 15 and 200 people on Google Workspace and Google Meet.",
  "You already use Notion as a memory backend, or are open to using it.",
  "At least one person can serve as a memory reviewer for 1 to 2 hours per week.",
  "Memory loss is already costing something visible: transitions, re-decisions, slow onboarding, key-person dependency.",
  "You want done-for-you infrastructure, not a self-serve tool you have to configure yourself."
];

export default function FoundingAccessPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Founding Memory Partner Program</div>
          <h1>This is for leaders who already know their organization is leaking.</h1>
          <p>
            Three to five organizations will get done-for-you Saberra deployment at founding pricing, with direct
            access to the founder for 90 days. This is not self-serve. Every piece is configured for your team.
          </p>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="section tight">
        <div className="container">
          <div className="eyebrow">What is included</div>
          <h2 className="serif" style={{ marginBottom: 32 }}>
            A fully operational memory layer. Not a tool you have to figure out yourself.
          </h2>
          <div className="grid-2">
            {whatYouGet.map(({ Icon, title, body }, index) => (
              <article
                className="card"
                key={title}
                style={index === whatYouGet.length - 1 && whatYouGet.length % 2 !== 0 ? { gridColumn: "1 / -1", maxWidth: 560 } : undefined}
              >
                <Icon size={26} style={{ color: "#1A7A4A", marginBottom: 10 }} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* VIGNETTE */}
      <section className="section tight">
        <div className="container">
          <article className="case-vignette" style={{ maxWidth: 860, margin: "0 auto" }}>
            <div className="eyebrow">What changes at organizations like yours</div>
            <h2 className="serif">The governance director transitioned. The organization did not notice.</h2>
            <p>
              A 40-person self-managing organization onboarded Saberra ahead of a planned governance director
              transition. Over six months, Sera captured 38 decisions, 22 role records, and 14 open risks from
              meeting outputs and email threads. The incoming director had full context on day one. No three-month
              re-ramp. No calls to the outgoing director to reconstruct what had been decided.
            </p>
          </article>
        </div>
      </section>

      {/* FORM + FIT */}
      <section className="section tight">
        <div className="container split">
          <div>
            <div className="eyebrow">Apply now</div>
            <h2 className="serif" style={{ marginBottom: 20 }}>
              If the leak is real, this is worth five minutes.
            </h2>
            <FoundingAccessForm />
          </div>
          <div>
            <div className="eyebrow">Who this is for</div>
            <h3 style={{ marginBottom: 16 }}>Founding deployments work best when all of these are true:</h3>
            <ul className="list">
              {fitItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* LOSS CLOSE */}
      <section className="section tight">
        <div className="container">
          <div className="eyebrow">The cost of waiting</div>
          <h2 className="serif" style={{ marginBottom: 24 }}>
            Every week without a memory layer, this keeps happening.
          </h2>
          <ul className="list">
            {lossItems.map((item) => (
              <li key={item} style={{ fontSize: "1.05rem" }}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
