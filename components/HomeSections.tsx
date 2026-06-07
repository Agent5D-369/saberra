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
          <h1>Ask your organization what it already knows.</h1>
          <p>
            Saberra captures decisions, tasks, risks, roles, policies, and source records from Google Meet, email,
            and emailed meeting transcripts, then turns them into reviewed institutional memory. Ask Sera, your AI
            memory colleague, what your organization already knows.
          </p>
          <div className="trust-line">
            No new workflows. No new habits. Human-reviewed memory. Sourced answers from your own organizational record.
          </div>
          <div className="cta-row">
            <CTAButton href="/notion-template">Get the manual Memory OS</CTAButton>
            <CTAButton href="/demo" variant="secondary">
              Book a 30-minute call
            </CTAButton>
          </div>
          <p className="cta-note">20 Notion databases for decisions, risks, roles, meetings, policies, and review queues.</p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  const fragments = [
    ["Email", "Vendor contract renewal moved to April review."],
    ["Meeting", "Maya owns pricing revision and legal follow-up."],
    ["Risk", "Renewal terms may conflict with current policy."],
    ["Task", "Confirm owner before next board meeting."]
  ];

  return (
    <div className="hero-visual" aria-label="Saberra memory flow preview">
      <div className="memory-map">
        <div className="mock-column">
          <div className="mock-title">Scattered output</div>
          <div className="scatter">
            {fragments.map(([label, text]) => (
              <div className="fragment" key={label}>
                <span>{label}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="mock-column">
          <div className="mock-title">Capture and structure</div>
          <div className="flow-lines" aria-hidden="true">
            <span className="flow-line" />
            <span className="flow-line" />
            <span className="flow-line" />
          </div>
          <div className="process-list">
            {["Dedicated inbox", "AI extraction", "Human review", "Notion memory"].map((item) => (
              <div className="process-pill" key={item}>
                <CheckCircle size={15} aria-hidden="true" /> {item}
              </div>
            ))}
          </div>
          <div className="extraction-proof">
            <small>After one meeting</small>
            <strong>Decision candidate</strong>
            <span>Extend vendor contract for 12 months</span>
            <span>Owner: Maya R.</span>
            <span>Risk: legal review pending</span>
            <em>Review status: approved</em>
          </div>
        </div>
        <div className="mock-column">
          <div className="mock-title">Ask Sera</div>
          <div className="sera-card">
            <div className="sera-identity">
              <SeraPortrait size="sm" />
              <div>
                <strong>Sera</strong>
                <small>AI memory colleague</small>
              </div>
            </div>
            <div className="query">What did we decide about the vendor contract in April?</div>
            <div className="answer">
              On April 14, the team decided to extend the vendor contract for 12 months with revised pricing.
              Decision owner: Maya R.
              <span className="source-pill">Source: Board Meeting, Apr 14, 2026</span>
            </div>
            <div className="badges">
              <HumanReviewBadge />
              <SourceBackedBadge />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PainCards() {
  const cards = [
    [
      "If she leaves, we're screwed.",
      "Too much of what your organization knows lives in people's heads. When someone changes roles or leaves, that context walks out with them."
    ],
    [
      "Didn't we already decide this?",
      "Decisions get made in meetings and buried in transcripts. Months later, the same issue gets debated again because nobody can find the record."
    ],
    [
      "Please don't give us another tool.",
      "Your team is already in Google Meet, email, and Notion. Saberra works with that. The team keeps working. Saberra keeps remembering."
    ]
  ];

  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Your team is not careless. Your memory system is missing." />
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
        <h2>We don&apos;t need more notes. We need memory.</h2>
        <p>
          Meeting note-takers capture calls. Knowledge bases wait for humans to write things down. Saberra closes the
          loop by turning what already happened into reviewed, structured, searchable institutional memory.
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
      "Turns what happened into reviewed institutional memory before people forget to document it.",
      "Capture, review, structured records, and Sera retrieval live in one memory loop."
    ]
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="Category" title="Saberra is not another meeting note tool.">
          Meeting summaries help individuals remember a call. Saberra helps the organization preserve what it agreed,
          assigned, changed, risked, and approved.
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
    ["Your team meets.", "Google Meet is native. Other meeting transcripts can be sent by email to the capture inbox."],
    ["Saberra captures.", "Meeting outputs, emails, tasks, risks, decisions, roles, and policies are extracted automatically."],
    ["Sera remembers.", "Human-reviewed records become searchable memory with source citations."]
  ];
  const pipeline = [
    ["Google Meet", Mail],
    ["Email", Inbox],
    ["AI extraction", Sparkles],
    ["Human review", ClipboardCheck],
    ["Notion memory", Database],
    ["Ask Sera", Brain]
  ];

  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <SectionHeader eyebrow="How it works" title="Three steps. Zero new habits." />
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
    ["Week 1", "Memory audit and source mapping", "We map where decisions, risks, tasks, roles, policies, and source records currently leak."],
    ["Week 2", "Capture inbox and workspace setup", "Google Meet, emailed transcripts, source emails, and the 20-database Memory OS are configured."],
    ["Week 3", "Review queue training", "Your Memory Admin learns how to approve, correct, reject, and steward candidate records."],
    ["Week 4", "Sera and memory health baseline", "Sera starts answering from reviewed records, and the team receives a first memory health readout."]
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="Deployment" title="What happens in the first 30 days.">
          Saberra is founder-led infrastructure work, not a black-box signup. The first month is designed to make the
          memory loop real, inspectable, and owned by your team.
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
        <SectionHeader eyebrow="Capture" title="What Saberra captures">
          The output is structured enough for review, retrieval, governance, and source-backed answers.
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
        <SectionHeader eyebrow="Product reality" title="This is what institutional memory looks like when it is operating.">
          Saberra is not a summary screen. It is a working memory console with intake health, review queues, governance
          signals, role ownership, source records, and workspace-level controls.
        </SectionHeader>
        <div className="sera-proof-callout">
          <SeraPortrait variant="environment" size="md" />
          <div>
            <div className="eyebrow">Sera in the loop</div>
            <h3>Sera gives the system a face without turning it into a gimmick.</h3>
            <p>
              She answers from reviewed records, surfaces what needs attention, and keeps the memory system legible to
              people who do not want to inspect databases every day.
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
        <SectionHeader eyebrow="Notion output" title="This is what your team actually receives.">
          Saberra does not stop at a transcript or summary. Reviewed meeting and email output becomes structured Notion
          records, task updates, source links, and a weekly pulse your team can scan.
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
    ["Source-backed answers", FileSearch],
    ["Built for distributed governance", Network],
    ["Done-for-you setup", CheckCircle]
  ];
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Built for teams that cannot afford memory loss." />
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
      "For Teal, Holacracy, Sociocracy, regenerative, cooperative, and distributed governance organizations.",
      "Explore governance memory",
      "/teal"
    ],
    [
      "Nonprofits and social enterprises",
      "For mission-driven teams that lose program history when people leave.",
      "Preserve program memory",
      "/nonprofit"
    ],
    [
      "Consultancies and agencies",
      "For knowledge-intensive teams where client context lives in senior people's heads.",
      "Protect delivery memory",
      "/consultancy"
    ]
  ];
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Built for organizations where context matters." />
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
    "Human review before memory becomes trusted.",
    "Sera answers from your documented record.",
    "Your data lives in your Notion workspace.",
    "Done-for-you setup with clear technical boundaries."
  ];
  return (
    <section className="section">
      <div className="container split">
        <SectionHeader eyebrow="Trust" title="Memory you can trust.">
          Saberra does not replace human judgment. It preserves what humans already decided, said, assigned, and approved.
        </SectionHeader>
        <div className="grid-2">
          <ul className="list">
            {pillars.map((pillar) => (
              <li key={pillar}>
                <ShieldCheck size={18} color="#D6A24A" aria-hidden="true" /> {pillar}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function SocialProof() {
  const vignettes = [
    [
      "Governance transition",
      "A coordinator left. The memory did not.",
      "A 6-person governance circle used Saberra to review 38 decisions, 22 role records, and 14 open risks before a coordinator transition. The incoming coordinator could ask Sera what changed, who owned what, and which commitments were still open.",
      ["38 decisions reviewed", "22 role records preserved", "14 open risks made findable"]
    ],
    [
      "Program continuity",
      "The program lead changed. The context stayed.",
      "A nonprofit program team used Saberra to preserve board decisions, partner commitments, grant follow-ups, and open program risks before a leadership handoff. The new lead inherited the reasoning behind the work, not just folders.",
      ["Board context preserved", "Grant commitments surfaced", "Program risks still visible"]
    ],
    [
      "Delivery memory",
      "The senior consultant was no longer the archive.",
      "A consultancy used Saberra to capture client decisions, delivery risks, and open commitments across calls and email. When a delivery lead changed, the account history was searchable without pulling the founder back into every question.",
      ["Client decisions source-backed", "Open commitments assigned", "Founder memory load reduced"]
    ]
  ];

  return (
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow="Use-case vignettes" title="Proof does not have to be loud to be useful." />
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
    "Teams using Google Workspace, Google Meet, or meeting tools that can email transcripts",
    "Notion-based workflows or willingness to use Notion",
    "5 to 50 people for the first deployment, with a path up to 200",
    "One Memory Admin who can review records about 1-2 hours per week"
  ];
  const notYet = [
    "Teams that require native Zoom or Teams integrations on day one",
    "Teams that do not want Notion and are not ready for a custom backend deployment",
    "Self-serve buyers looking for instant signup",
    "Teams that cannot assign anyone to review memory"
  ];

  return (
    <section className="section tight">
      <div className="container">
        <SectionHeader eyebrow="Fit" title="Is Saberra right for you?" />
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
            <h2 className="serif">Is your organization hemorrhaging knowledge?</h2>
            <p>
              Take the 10-question Organizational Memory Audit and see where decisions, context, tasks, and
              institutional knowledge are leaking from your system.
            </p>
            <div className="cta-row">
              <CTAButton href="/audit">Take the Memory Audit</CTAButton>
              <CTAButton href="/demo" variant="secondary">
                Book a 30-minute call
              </CTAButton>
            </div>
          </article>
          <article className="card">
            <NotionTemplateVisual />
            <h2 className="serif">Institutional Memory OS for Notion</h2>
            <p>
              Get the manual Memory OS: 20 Notion databases, pre-wired for Saberra, ready in under five minutes. It is
              useful on its own, and every manual update shows the exact pain Saberra removes.
            </p>
            <ul className="list" style={{ marginTop: 14 }}>
              <li>Duplicate the 20-database Notion structure.</li>
              <li>Map what your team can actually find.</li>
              <li>Automate the capture and review loop with Saberra.</li>
            </ul>
            <div className="cta-row">
              <CTAButton href="/notion-template" variant="secondary">
                Get the manual Memory OS
              </CTAButton>
              <CTAButton href="/demo" variant="secondary">
                Book a 30-minute call
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
    "Notion by default, or a scoped custom data backend for larger deployments",
    "Meeting-heavy operations",
    "Real knowledge loss pain",
    "One person owns memory review (~1-2 hours/week)"
  ];
  return (
    <section className="section">
      <div className="container">
        <CTABand
          title="Founder-led memory deployment"
          copy="We are onboarding high-fit teams using Google Workspace and Notion. Deployments include done-for-you setup, founder-led onboarding, review workflow design, and a memory audit before and after implementation."
          primary="Get the manual Memory OS"
          primaryHref="/notion-template"
          secondary="Book a 30-minute call"
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
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow="FAQ" title="Plain answers for skeptical teams." />
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
          title="Your organization already knows more than it can find."
          copy="Saberra makes it remember."
        />
      </div>
    </section>
  );
}

export function SeraLimitations() {
  const limits = [
    "Answer from the open internet.",
    "Treat unreviewed extractions as trusted memory.",
    "Invent a decision if no reviewed record exists.",
    "Replace human judgment.",
    "Claim a native Zoom or Teams integration unless transcript intake is configured by email."
  ];

  return (
    <section className="section tight">
      <div className="container">
        <div className="limits-panel">
          <div>
            <div className="eyebrow">Trust by restraint</div>
            <h2>Sera is useful because she has boundaries.</h2>
            <p>
              Saberra should make your organization easier to inspect, not harder to question. Sera answers from reviewed
              memory and is expected to say when the record does not contain an answer.
            </p>
          </div>
          <ul className="list">
            {limits.map((item) => (
              <li key={item}>
                <CircleAlert size={18} color="#D6A24A" aria-hidden="true" /> Sera will not {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function SeraDemoSection() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow="Sera" title="Ask Sera what your team already knows." />
        <SeraDemo />
      </div>
    </section>
  );
}
