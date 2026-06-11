import Link from "next/link";
import {
  Archive,
  Brain,
  CheckCircle,
  CircleAlert,
  ClipboardCheck,
  Database,
  FileSearch,
  Inbox,
  Mail,
  MessageSquareQuote,
  Network,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { captureItems, faqs } from "@/lib/site";
import { CTAButton, CTABand, HumanReviewBadge, SectionHeader, SeraPortrait, SourceBackedBadge } from "@/components/UI";
import { SeraDemo } from "@/components/SeraDemo";
import { EditorialStoryStrip } from "@/components/EditorialVisuals";
import {
  DatabaseMapVisual,
  GovernanceConsoleVisual,
  MemoryLoopVisual,
  NotionWorkspaceVisual,
  NotionTemplateVisual,
  ProductDashboardVisual
} from "@/components/VisualPanels";

export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <h1>Ask Sera what your organization already knows.</h1>
          <p>
            Your team is having the same conversation for the fourth time this quarter. Decisions disappear into
            transcripts. Context walks out when people leave. Sera stops that, automatically, from the meetings and
            emails you already send. No new tools for your team. No new workflows. Just memory that finally sticks.
          </p>
          <div className="trust-line">
            Your data. Your workspace. Your values. Nothing becomes trusted memory until a human says so.
          </div>
          <div className="cta-row">
            <CTAButton href="/audit">Take the free Memory Audit</CTAButton>
            <CTAButton href="/demo" variant="secondary">
              See Sera organize chaos
            </CTAButton>
          </div>
          <p className="cta-note">Find out exactly where your organization is leaking, in 10 questions.</p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  const before = [
    "Meetings",
    "Emails",
    "Stale Notion",
    "People's heads"
  ];
  const after = [
    "Approved decisions",
    "Owned tasks",
    "Clear roles",
    "Project memory",
    "Ask Sera"
  ];

  return (
    <div className="hero-visual hero-visual-simple" aria-label="Before and after Sera organizes operating chaos">
      <div className="simple-hero-map">
        <div className="before-after-panel before-panel">
          <div className="mock-title">Before Sera</div>
          <h2>Scattered context</h2>
          <div className="simple-chip-list">
            {before.map((item) => (
              <div className="simple-chip weak" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="sera-bridge" aria-hidden="true">
          <SeraPortrait size="sm" />
          <strong>Copy Sera</strong>
          <span>Sera proposes. Humans approve.</span>
        </div>
        <div className="before-after-panel after-panel">
          <div className="mock-title">After Sera</div>
          <h2>Trusted operating memory</h2>
          <div className="simple-chip-list">
            {after.map((item) => (
              <div className="simple-chip strong" key={item}>
                <CheckCircle size={15} aria-hidden="true" /> {item}
              </div>
            ))}
          </div>
          <div className="simple-answer">
            <span>Ask Sera</span>
            <strong>What did we already decide?</strong>
            <small>Answer from approved records with sources.</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoSection() {
  return (
    <section className="section tight video-section">
      <div className="container">
        <div className="vsl-eyebrow">
          <span>2-minute overview</span>
        </div>
        <div className="vsl-frame-wrap">
          <div className="vsl-browser-chrome">
            <div className="vsl-chrome-bar">
              <span className="vsl-dot red" />
              <span className="vsl-dot yellow" />
              <span className="vsl-dot green" />
              <span className="vsl-chrome-url">saberra.com &mdash; Sera in action</span>
              <span className="vsl-chrome-spacer" />
            </div>
            <video
              src="/saberra-explainer.mp4"
              controls
              preload="metadata"
              className="vsl-video"
              playsInline
            />
          </div>
          <div className="vsl-phone-chrome" aria-hidden="true">
            <div className="vsl-phone-body">
              <div className="vsl-phone-notch" />
              <video
                src="/saberra-explainer.mp4"
                controls
                preload="metadata"
                className="vsl-video"
                playsInline
                tabIndex={-1}
              />
              <div className="vsl-phone-bar" />
            </div>
          </div>
        </div>
        <p className="vsl-caption">
          See how Sera turns a week of meetings and emails into reviewed decisions, owned tasks, and answers your team can ask for.
        </p>
      </div>
    </section>
  );
}

export function PainCards() {
  const cards = [
    [
      "If she leaves, we're screwed.",
      "Too much of what your organization knows lives in people's heads. Every week without a memory layer, that dependency gets worse. Not better."
    ],
    [
      "Didn't we already decide this?",
      "Decisions get made in meetings and buried in transcripts. The same issue gets re-debated months later because nobody can find the record. That costs real time, real energy, and real trust."
    ],
    [
      "Please don't give us another tool.",
      "Your team stays in Google Meet, email, and Notion. Sera becomes the operating layer that captures and organizes the work without asking anyone to change how they work."
    ]
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader title="Your team is not careless. Your organization is missing a memory layer." />
        <div className="grid-3">
          {cards.map(([title, copy]) => (
            <article className="card" key={title}>
              <MessageSquareQuote color="#D6A24A" size={28} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryBreak() {
  return (
    <section className="section statement">
      <div className="container">
        <h2>Sera turns organizational chaos into operating intelligence.</h2>
        <p>
          Memory is the foundation, not the ceiling. Saberra captures what your team already says and sends, then Sera
          organizes it into decisions, tasks, risks, projects, roles, policies, profiles, relationships, and reviewed
          memory your organization can actually trust.
        </p>
      </div>
    </section>
  );
}

export function CompetitiveComparison() {
  const rows = [
    [
      "Meeting notetakers",
      "Capture one conversation and produce a transcript or summary.",
      "The summary still has to become a decision, task, risk, role, policy, or source-backed record."
    ],
    [
      "Enterprise search",
      "Finds information that already exists across approved sources.",
      "It cannot reliably retrieve the decisions your team never converted into a durable record."
    ],
    [
      "Notion AI",
      "Answers from what your team already wrote into Notion.",
      "It does not solve the behavior problem when nobody updates Notion after the meeting."
    ],
    [
      "Saberra",
      "Turns meetings and emails into organized, human-reviewed operating intelligence.",
      "Sera proposes structured records. Humans approve what becomes trusted memory."
    ]
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="Category" title="Saberra is a done-for-you AI operations layer.">
          Meeting tools summarize conversations. Saberra organizes the operating record: what was decided, assigned,
          changed, risked, approved, and needs human review next.
        </SectionHeader>
        <div className="comparison-table" role="table" aria-label="Saberra comparison with adjacent tools">
          <div className="comparison-row comparison-head" role="row">
            <span role="columnheader">Tool type</span>
            <span role="columnheader">What it does well</span>
            <span role="columnheader">Where memory still leaks</span>
          </div>
          {rows.map(([type, good, gap]) => (
            <div className={type === "Saberra" ? "comparison-row featured" : "comparison-row"} role="row" key={type}>
              <strong role="cell">{type}</strong>
              <span role="cell">{good}</span>
              <span role="cell">{gap}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { EditorialStoryStrip };

export function ProcessFlow() {
  const steps = [
    ["Copy Sera.", "Include Sera on meetings and important email threads your organization should not lose."],
    ["Sera organizes.", "She prepares decisions, tasks, roles, policies, people, projects, and risks for human review."],
    ["Humans approve.", "Your team reviews every record before it becomes organizational truth. Nothing is trusted automatically."]
  ];
  const pipeline = [
    ["Google Meet", Mail],
    ["Email", Inbox],
    ["Sera structures", Sparkles],
    ["Human approval", ClipboardCheck],
    ["Living Hub", Database],
    ["Ask Sera", Brain]
  ];

  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <SectionHeader eyebrow="How it works" title="Your team keeps working. The operating record builds itself." />
        <div className="grid-3">
          {steps.map(([title, copy]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="pipeline" aria-label="Saberra pipeline">
          {pipeline.map(([label, Icon]) => {
            const IconComponent = Icon as typeof Mail;
            return (
              <div className="pipeline-step" key={label as string}>
                <IconComponent size={24} aria-hidden="true" />
                <h3>{label as string}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function DeploymentPath() {
  const weeks = [
    ["Week 1", "Chaos map and source routing", "We map where decisions, risks, tasks, roles, policies, people, projects, and source records currently leak."],
    ["Week 2", "Capture inbox and Living Memory Hub", "Google Meet, emailed transcripts, source emails, and the private Notion backend are configured."],
    ["Week 3", "Human approval workflow", "Your reviewer learns how to approve, correct, reject, and steward Sera's candidate records."],
    ["Week 4", "Sera operating baseline", "Sera starts answering from approved records, and the team receives a first operating intelligence readout."]
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="Deployment" title="Your operating layer goes live with you, not around you.">
          Saberra is a guided setup, not instant self-serve software. The first month makes capture, review, storage,
          and Sera answers inspectable inside tools your team controls.
        </SectionHeader>
        <div className="deployment-path">
          {weeks.map(([week, title, copy]) => (
            <article className="deployment-step" key={week}>
              <span>{week}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CaptureGrid() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow="Operating intelligence" title="Sera organizes the work your team already creates.">
          Meetings and emails become structured enough for review, retrieval, governance, source-backed answers, and
          actual follow-through.
        </SectionHeader>
        <MemoryLoopVisual />
        <div className="capture-grid">
          {captureItems.map(([title, copy]) => (
            <article className="card capture-card" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductProof() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow="Product reality" title="This is what a living operating system looks like.">
          Saberra is not a summary screen. It is a done-for-you AI operations layer with intake health, review queues,
          governance signals, role ownership, source records, project context, and workspace controls your team can inspect.
        </SectionHeader>
        <div className="sera-proof-callout">
          <SeraPortrait variant="environment" size="md" />
          <div>
            <div className="eyebrow">Sera in the loop</div>
            <h3>Sera is the intelligent organizational operator inside Saberra.</h3>
            <p>
              She organizes meetings and emails into reviewable records, surfaces what needs attention, and keeps the
              system legible to people who do not want to inspect databases every day.
            </p>
          </div>
        </div>
        <ProductDashboardVisual />
        <div className="product-proof-grid">
          <GovernanceConsoleVisual />
          <DatabaseMapVisual />
        </div>
      </div>
    </section>
  );
}

export function WorkspaceProof() {
  return (
    <section className="section tight">
      <div className="container split">
        <SectionHeader eyebrow="Private backend" title="The Living Memory Hub is where trust becomes inspectable.">
          The Living Memory Hub is the private backend where your organization&apos;s memory lives. Reviewed meeting and
          email output becomes structured Notion records, task updates, source links, and a weekly pulse your team can scan.
        </SectionHeader>
        <NotionWorkspaceVisual />
      </div>
    </section>
  );
}

export function BuiltFor() {
  const items = [
    ["Automatic capture", Mail],
    ["Human review first", ShieldCheck],
    ["Your data, your workspace", Database],
    ["Operating intelligence", FileSearch],
    ["Built for distributed governance", Network],
    ["Done-for-you setup", CheckCircle]
  ];
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Built for teams ready to stop operating from scattered context." />
        <div className="grid-3">
          {items.map(([title, Icon]) => {
            const IconComponent = Icon as typeof Mail;
            return (
              <article className="card" key={title as string}>
                <IconComponent color="#6FB7B7" size={26} aria-hidden="true" />
                <h3>{title as string}</h3>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AudienceCards() {
  const audiences = [
    [
      "Self-managing teams",
      "Distributed authority breaks when memory recentralizes. Saberra keeps your governance record as distributed as your governance philosophy.",
      "See it for self-managing teams",
      "/teal"
    ],
    [
      "Nonprofits and social enterprises",
      "Your mission should survive leadership change. Saberra preserves the decisions, risks, and context that explain why the work is shaped the way it is.",
      "See it for nonprofits",
      "/nonprofit"
    ],
    [
      "Consultancies and agencies",
      "Your senior people should not be the archive. Saberra captures the judgment behind the work, not just the deliverables.",
      "See it for consultancies",
      "/consultancy"
    ]
  ];
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Which kind of memory loss is costing you most?" />
        <div className="grid-3">
          {audiences.map(([title, copy, cta, href]) => (
            <article className="card light" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link className="btn btn-secondary" style={{ marginTop: 18, color: "#102232", borderColor: "rgba(30,109,120,.32)" }} href={href}>
                {cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const pillars = [
    "AI extracts. Your reviewer decides what stays.",
    "Your data never leaves your own workspace.",
    "Every record is traceable to its source meeting or email.",
    "Done-for-you setup inside tools your team controls."
  ];
  return (
    <section className="section">
      <div className="container split">
        <SectionHeader eyebrow="Trust" title="The only AI memory system where your team controls the record.">
          Saberra does not make your organization&apos;s history a black box. Sera surfaces what happened. Your people
          decide what becomes trusted organizational truth. Every record is inspectable, editable, and source-backed.
        </SectionHeader>
        <ul className="list">
          {pillars.map((pillar) => (
            <li key={pillar}>
              <ShieldCheck size={18} color="#D6A24A" aria-hidden="true" /> {pillar}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SocialProof() {
  const vignettes = [
    [
      "Governance transition",
      "A coordinator left. The memory did not.",
      "A 6-person governance circle used Saberra to surface 38 decisions, 22 role records, and 14 open risks before a coordinator transition. The incoming coordinator asked Sera what changed, who owned what, and which commitments were still open. On day one, without needing to reconstruct six months of meeting history.",
      ["38 decisions surfaced", "22 role records preserved", "14 open risks made findable on day one"]
    ],
    [
      "Program continuity",
      "The program lead changed. The context stayed.",
      "A nonprofit program team used Saberra to preserve board decisions, partner commitments, grant follow-ups, and open program risks before a leadership handoff. The new lead inherited the reasoning behind the work, not just folders full of documents with no context for why anything was the way it was.",
      ["Board context preserved", "Grant commitments surfaced", "No 3-month re-ramp period"]
    ],
    [
      "Delivery memory",
      "The senior consultant was no longer the archive.",
      "A consultancy used Saberra to capture client decisions, delivery risks, and open commitments across calls and email threads. When the delivery lead changed mid-engagement, the full account history was searchable, without pulling the founder back into every client question.",
      ["Client decisions source-backed", "Open commitments assigned", "Founder pulled from 4 fewer calls per week"]
    ]
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="What actually changes" title="The record survives. The organization stops starting over." />
        <div className="vignette-grid">
          {vignettes.map(([eyebrow, title, copy, stats]) => (
            <article className="case-vignette" key={title as string}>
              <div className="eyebrow">{eyebrow as string}</div>
              <h2 className="serif">{title as string}</h2>
              <p>{copy as string}</p>
              <div className="vignette-stats">
                {(stats as string[]).map((stat) => (
                  <span key={stat}>{stat}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FitQualifier() {
  const bestFor = [
    "Teams on Google Workspace and Google Meet (or meeting tools that can email transcripts)",
    "Notion-native workflows, or willingness to adopt Notion as the memory backend",
    "15 to 200 people feeling real pain from knowledge loss or context drift",
    "One person who can own memory review for about 1–2 hours per week"
  ];
  const notYet = [
    "Teams that require native Zoom or Teams integrations on day one",
    "Teams not ready for Notion and not scoped for a custom backend",
    "Self-serve buyers looking for instant no-touch signup",
    "Organizations with no one to own the human review step"
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="Fit" title="Saberra is not for everyone. Here is who it is for." />
        <div className="fit-grid">
          <article className="card fit-card fit-yes">
            <h3>Best for</h3>
            <ul className="list">
              {bestFor.map((item) => (
                <li key={item}>
                  <CheckCircle size={18} color="#6FB7B7" aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="card fit-card fit-no">
            <h3>Not yet for</h3>
            <ul className="list">
              {notYet.map((item) => (
                <li key={item}>
                  <CircleAlert size={18} color="#D6A24A" aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

export function LeadMagnets() {
  return (
    <section className="section">
      <div className="container">
        <div className="grid-2 split">
          <article className="card">
            <Archive color="#D6A24A" size={30} aria-hidden="true" />
            <h2 className="serif">Find out exactly where your organization is leaking.</h2>
            <p>
              Ten questions. Specific results by segment. Tells you whether your memory risk is stable, early-stage,
              serious, or critical, and which records to fix first.
            </p>
            <div className="cta-row">
              <CTAButton href="/audit">Take the free Memory Audit</CTAButton>
              <CTAButton href="/demo" variant="secondary">
                See Sera organize chaos
              </CTAButton>
            </div>
          </article>
          <article className="card">
            <NotionTemplateVisual />
            <h2 className="serif">Living Memory Hub demo</h2>
            <p>
              Open the Saberra Living Memory Hub demo: a Notion backend for decisions, tasks, risks, roles, meetings,
              policies, review queues, source records, and operating memory.
            </p>
            <ul className="list" style={{ marginTop: 14 }}>
              <li>Inspect the private backend where trusted records live.</li>
              <li>See how meetings and emails become reviewable records.</li>
              <li>Use the demo to understand what Sera automates.</li>
            </ul>
            <div className="cta-row">
              <CTAButton href="/notion-template" variant="secondary">
                Open the demo hub
              </CTAButton>
              <CTAButton href="/demo" variant="secondary">
                See Sera organize chaos
              </CTAButton>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function FoundingOffer() {
  const criteria = [
    "15 to 200 people",
    "Google Workspace",
    "Notion-native or willing to use Notion",
    "Meeting-heavy operations",
    "Real, expensive memory loss pain",
    "One person can own memory review (~1–2 hrs/week)"
  ];
  return (
    <section className="section tight">
      <div className="container">
        <CTABand
          title="Founding Memory Partner Program: limited spots."
          copy="We onboard a limited number of teams each month with full founder-led deployment: done-for-you setup, a memory audit before and after, human approval workflow design, and direct founder access for the first 90 days. If you've been nodding through this page, that's the signal."
          primary="Apply for a founding spot"
          primaryHref="/founding-access"
          secondary="See Sera organize chaos"
          secondaryHref="/demo"
        />
        <div className="grid-3" style={{ marginTop: 16 }}>
          {criteria.map((item) => (
            <div className="card" key={item}>
              <CheckCircle size={18} color="#6FB7B7" aria-hidden="true" /> {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="FAQ" title="The questions you're already asking." />
        <div className="grid-2 split">
          {faqs.map(([question, answer]) => (
            <article className="card" key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="section">
      <div className="container">
        <CTABand
          title="Every week without a memory layer, your organization gets a little harder to run."
          copy="Decisions keep disappearing. The same conversations keep repeating. The people who remember everything become the bottleneck. Sera stops that, from the work your team is already doing."
          primary="Take the free Memory Audit"
          primaryHref="/audit"
          secondary="Apply for a founding spot"
          secondaryHref="/founding-access"
        />
      </div>
    </section>
  );
}

export function SeraDemoSection() {
  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="Sera" title="Ask Sera what your team already knows." />
        <p style={{ color: "#d5dddf", marginBottom: 32, maxWidth: 640 }}>
          This is what it looks like when your organization can actually answer.
        </p>
        <SeraDemo />
      </div>
    </section>
  );
}
