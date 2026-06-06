import type { CSSProperties } from "react";
import {
  Archive,
  CheckCircle,
  CircleAlert,
  ClipboardCheck,
  Database,
  Languages,
  FileCheck,
  FileSearch,
  Inbox,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  TableProperties,
  UserRound
} from "lucide-react";

export function MemoryLoopVisual() {
  const inputs = ["Transcript", "Email thread", "Decision", "Task", "Risk", "Role change"];
  const records = ["Decision Candidates", "Tasks", "Risks", "Roles", "Policies", "Review Queue"];

  return (
    <div className="visual-panel memory-loop-visual" aria-label="Saberra memory loop visual">
      <div className="visual-header">
        <span className="eyebrow">From scattered to remembered</span>
        <strong>Work output becomes reviewed memory.</strong>
      </div>
      <div className="memory-loop-grid">
        <div className="visual-stack">
          {inputs.map((item) => (
            <div className="visual-chip" key={item}>
              <Mail size={15} aria-hidden="true" /> {item}
            </div>
          ))}
        </div>
        <div className="visual-converter">
          <div className="dot-field" aria-hidden="true">
            {Array.from({ length: 42 }).map((_, index) => {
              const left = 10 + (index % 7) * 13 + (index % 3) * 1.5;
              const top = 12 + Math.floor(index / 7) * 13 + (index % 2) * 2;
              return <span key={index} style={{ left: `${left}%`, top: `${top}%` } as CSSProperties} />;
            })}
          </div>
          <div className="converter-card">
            <Sparkles size={22} aria-hidden="true" />
            <strong>AI extraction</strong>
            <small>Structured candidates, never trusted memory yet</small>
          </div>
          <div className="converter-card approved">
            <CheckCircle size={22} aria-hidden="true" />
            <strong>Human review</strong>
            <small>Approve, reject, edit, govern</small>
          </div>
        </div>
        <div className="visual-records">
          {records.map((item) => (
            <div className="record-row" key={item}>
              <Database size={15} aria-hidden="true" />
              <span>{item}</span>
              <small>Notion</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotionTemplateVisual() {
  const columns = [
    ["Decisions", "Owner", "Source", "Status"],
    ["Risks", "Severity", "Mitigation", "Open"],
    ["Roles", "Domain", "Holder", "Term"],
    ["Policies", "Canon", "Review", "Approved"],
    ["Review Queue", "Candidate", "Source", "Decision"]
  ];

  return (
    <div className="visual-panel notion-template-visual" aria-label="Institutional Memory OS for Notion preview">
      <div className="visual-header">
        <span className="eyebrow">Free template</span>
        <strong>Institutional Memory OS for Notion</strong>
      </div>
      <div className="notion-window">
        <div className="notion-sidebar">
          <span className="mark">S</span>
          <p>Memory OS</p>
          {columns.map(([name]) => (
            <div className="sidebar-row" key={name}>
              <Archive size={13} aria-hidden="true" /> {name}
            </div>
          ))}
        </div>
        <div className="notion-table">
          {columns.map(([name, ...fields]) => (
            <div className="notion-card" key={name}>
              <strong>{name}</strong>
              {fields.map((field) => (
                <span key={field}>{field}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SovereigntyVisual() {
  const stack = [
    ["Google Workspace", "Meeting and email output"],
    ["Dedicated inbox", "Capture point your team controls"],
    ["AI provider account", "Extraction inside your deployment"],
    ["Notion", "Inspectable organizational record"],
    ["Railway", "Client-controlled runtime"]
  ];

  return (
    <div className="visual-panel sovereignty-visual" aria-label="Client controlled infrastructure visual">
      <div className="visual-header">
        <span className="eyebrow">Trust architecture</span>
        <strong>Your memory stays inspectable.</strong>
      </div>
      <div className="sovereignty-stack">
        {stack.map(([title, copy], index) => (
          <div className="stack-row" key={title}>
            <span className="stack-index">{index + 1}</span>
            <div>
              <strong>{title}</strong>
              <small>{copy}</small>
            </div>
            {index === stack.length - 1 ? <LockKeyhole size={18} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SegmentMemoryVisual({ type }: { type: "governance" | "nonprofit" | "consultancy" }) {
  const config = {
    governance: {
      title: "Governance memory map",
      rows: ["Circle decision", "Role assignment", "Policy proposal", "Open objection", "Consent record"],
      icon: Network
    },
    nonprofit: {
      title: "Program continuity record",
      rows: ["Board decision", "Program risk", "Partner context", "Grant commitment", "Leadership handoff"],
      icon: FileCheck
    },
    consultancy: {
      title: "Delivery memory record",
      rows: ["Client decision", "Open commitment", "Delivery risk", "Senior context", "Project history"],
      icon: Database
    }
  }[type];
  const Icon = config.icon;

  return (
    <div className="visual-panel segment-memory-visual" aria-label={`${config.title} visual`}>
      <div className="visual-header">
        <span className="eyebrow">What stays findable</span>
        <strong>{config.title}</strong>
      </div>
      <div className="segment-ledger">
        {config.rows.map((row, index) => (
          <div className="ledger-row" key={row}>
            <Icon size={18} aria-hidden="true" />
            <span>{row}</span>
            <small>{index % 2 === 0 ? "Reviewed" : "Candidate"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PipelineAnatomyVisual() {
  const stages = [
    ["Capture inbox", "Google Meet outputs and forwarded context", Inbox],
    ["Extraction pass", "Decisions, tasks, risks, roles, policies", Sparkles],
    ["Review queue", "Human approval before trusted memory", ClipboardCheck],
    ["Notion record", "20 databases with source traceability", Database],
    ["Sera answer", "Plain-English answer with citations", FileSearch]
  ];

  return (
    <div className="visual-panel anatomy-visual" aria-label="Detailed Saberra pipeline visual">
      <div className="visual-header">
        <span className="eyebrow">Pipeline anatomy</span>
        <strong>Every record has a path back to the source.</strong>
      </div>
      <div className="anatomy-grid">
        {stages.map(([title, copy, Icon], index) => {
          const IconComponent = Icon as typeof Inbox;
          return (
            <div className="anatomy-stage" key={title as string}>
              <span className="stack-index">{index + 1}</span>
              <IconComponent size={24} aria-hidden="true" />
              <strong>{title as string}</strong>
              <small>{copy as string}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SeraEvidenceVisual() {
  const sources = ["Board Meeting", "Decision Candidate", "Vendor Email", "Task Record"];

  return (
    <div className="visual-panel evidence-visual" aria-label="Sera evidence graph visual">
      <div className="visual-header">
        <span className="eyebrow">Sera evidence graph</span>
        <strong>Answers are assembled from reviewed sources.</strong>
      </div>
      <div className="evidence-grid">
        <div className="evidence-question">
          <small>Question</small>
          <strong>What did we decide about the vendor contract?</strong>
        </div>
        <div className="evidence-center">
          <span className="mark">S</span>
          <strong>Sera</strong>
          <small>Reviewed memory only</small>
        </div>
        <div className="evidence-sources">
          {sources.map((source) => (
            <div className="record-row" key={source}>
              <FileSearch size={15} aria-hidden="true" />
              <span>{source}</span>
              <small>Cited</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuditReportVisual() {
  const leaks = [
    ["Decision retrieval", "Serious leakage", 78],
    ["Key-person memory", "Critical exposure", 91],
    ["Meeting follow-through", "Early leakage", 54],
    ["Onboarding context", "Serious leakage", 72]
  ];

  return (
    <div className="visual-panel audit-report-visual" aria-label="Organizational Memory Audit report visual">
      <div className="visual-header">
        <span className="eyebrow">Audit output</span>
        <strong>A diagnosis your team can act on.</strong>
      </div>
      <div className="audit-report-body">
        <div className="audit-score-orb">
          <strong>37</strong>
          <span>Serious institutional memory risk</span>
        </div>
        <div className="audit-bars">
          {leaks.map(([name, label, value]) => (
            <div className="audit-bar-row" key={name as string}>
              <div>
                <strong>{name as string}</strong>
                <small>{label as string}</small>
              </div>
              <span>
                <i style={{ width: `${value}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SecurityBoundaryVisual() {
  const owned = ["Notion workspace", "Railway project", "Google Workspace", "Dedicated inbox"];
  const reviewed = ["Draft records", "Review queue", "Approved memory", "Sera citations"];

  return (
    <div className="visual-panel security-boundary-visual" aria-label="Saberra security boundary visual">
      <div className="visual-header">
        <span className="eyebrow">Ownership boundary</span>
        <strong>Client-controlled systems, reviewed memory.</strong>
      </div>
      <div className="security-boundary-grid">
        <div className="boundary-zone owned-zone">
          <LockKeyhole size={24} aria-hidden="true" />
          <h3>Your infrastructure</h3>
          {owned.map((item) => (
            <div className="visual-chip" key={item}>
              <ShieldCheck size={14} aria-hidden="true" /> {item}
            </div>
          ))}
        </div>
        <div className="boundary-zone review-zone">
          <ClipboardCheck size={24} aria-hidden="true" />
          <h3>Trusted memory path</h3>
          {reviewed.map((item) => (
            <div className="visual-chip" key={item}>
              <CheckCircle size={14} aria-hidden="true" /> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductDashboardVisual() {
  const metrics = [
    ["Est. hours saved", "12", "meetings, emails, tasks"],
    ["Emails processed", "52", "filed, extracted, remembered"],
    ["Meetings captured", "1", "recordings, transcripts, notes"],
    ["People known", "22", "profiles auto-built"]
  ];
  const ops = [
    ["Success rate", "100%", "10 of last 10 processed"],
    ["Access failures", "1", "needs review"],
    ["Pipeline failures", "0", "all clear"]
  ];

  return (
    <div className="visual-panel product-dashboard" aria-label="Saberra dashboard product preview">
      <div className="product-topbar">
        <strong>Sera · Client Memory</strong>
        <span><i /> Online</span>
        <small>Cached 1m ago · Next poll ready</small>
      </div>
      <div className="product-tabs">
        {["Overview", "Chat with Sera", "Queues", "Governance", "People", "Activity & Ops", "Settings"].map((tab, index) => (
          <span className={index === 0 ? "active" : ""} key={tab}>{tab}</span>
        ))}
      </div>
      <div className="product-body">
        <div className="dashboard-metrics">
          {metrics.map(([label, value, copy], index) => (
            <div className={`metric-tile metric-${index}`} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{copy}</small>
            </div>
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-chart">
            <div className="dashboard-title">Emails processed · last 7 days</div>
            <div className="bar-chart" aria-hidden="true">
              {[2, 1, 5, 1, 1, 1, 0].map((height, index) => (
                <span style={{ height: `${height * 18 + 8}px` }} key={index} />
              ))}
            </div>
          </div>
          <div className="ops-stack">
            <div className="dashboard-title">Activity & Ops</div>
            {ops.map(([label, value, copy]) => (
              <div className="ops-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{copy}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GovernanceConsoleVisual() {
  const risks = [
    ["No shared vision", "Clear", "No signals"],
    ["Poor governance", "Warning", "1"],
    ["Financial fragility", "Warning", "1"],
    ["Interpersonal conflict", "Clear", "No signals"],
    ["Burnout", "Warning", "1"],
    ["Wrong people", "Clear", "No signals"]
  ];
  const roles = [
    ["Admin Facilitator", "Vacant", "-"],
    ["AI Secretary (Sera)", "Sera", "May 1, 2026"],
    ["Ceremony Steward", "Rick B.", "Jun 2, 2026"],
    ["Rep Steward", "Vacant", "-"],
    ["Visionary Director", "Jessica F.", "May 28, 2026"]
  ];

  return (
    <div className="visual-panel governance-console" aria-label="Governance dashboard product preview">
      <div className="visual-header">
        <span className="eyebrow">Governance memory</span>
        <strong>Signals, roles, and decisions stay visible.</strong>
      </div>
      <div className="governance-layout">
        <div>
          <div className="dashboard-title">Health monitor</div>
          <p className="product-note">Sera watches processed meetings and email for early risk signals, then routes candidates to review.</p>
          <div className="risk-grid">
            {risks.map(([name, status, value]) => (
              <div className={status === "Warning" ? "risk-card warning" : "risk-card"} key={name}>
                <CircleAlert size={18} aria-hidden="true" />
                <strong>{name}</strong>
                <span>{status}</span>
                <small>{value}</small>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="dashboard-title">Active role holders</div>
          <div className="role-table">
            {roles.map(([role, holder, since]) => (
              <div className="role-row" key={role}>
                <span>{role}</span>
                <strong className={holder === "Vacant" ? "vacant" : ""}>{holder}</strong>
                <small>{since}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DatabaseMapVisual() {
  const core = [
    "Knowledge Base",
    "Profiles",
    "Tasks",
    "Projects",
    "Meetings",
    "Meeting Assets",
    "Policies",
    "Circles",
    "Roles",
    "Role Assignments",
    "Canon Change Requests",
    "Memory Review Queue",
    "Decision Candidates",
    "Risks",
    "CCOS Ledger Entries",
    "Source Emails",
    "Messages",
    "Processing Events",
    "Interactions"
  ];
  const admin = ["Hub Settings", "Sensitive Review"];

  return (
    <div className="visual-panel database-map" aria-label="Saberra Notion database map">
      <div className="visual-header">
        <span className="eyebrow">Notion memory backend</span>
        <strong>The record is structured, inspectable, and yours.</strong>
      </div>
      <div className="database-map-body">
        <div>
          <div className="dashboard-title">Core memory databases</div>
          <div className="database-list">
            {core.map((name, index) => (
              <div className="database-row" key={name}>
                {index % 3 === 0 ? <Archive size={15} aria-hidden="true" /> : index % 3 === 1 ? <UserRound size={15} aria-hidden="true" /> : <TableProperties size={15} aria-hidden="true" />}
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-box">
          <Languages size={22} aria-hidden="true" />
          <h3>Operational controls</h3>
          <p>Timezone, response language, review settings, and sensitive records stay configurable inside the workspace.</p>
          {admin.map((name) => (
            <div className="database-row" key={name}>
              <Database size={15} aria-hidden="true" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
