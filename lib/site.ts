export const siteUrl = "https://saberra.com";

export const notionTemplateUrl =
  "https://newearthcocreators.notion.site/Verdana-Commons-Saberra-Living-Memory-Hub-Demo-076130aaffa3826aa390010a6c8f3910";

export const demoCalendarUrl = "https://calendar.app.google/tVK5xuwheLsiCL4WA";

export const formspreeForms = {
  notionTemplate: "https://formspree.io/f/mbdedveq",
  demoRequest: "https://formspree.io/f/xdavarvv",
  foundingAccess: "https://formspree.io/f/mqeoevor"
};

export const navItems = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/sera", label: "Ask Sera" },
  { href: "/pricing", label: "Pricing" },
  { href: "/audit", label: "Audit" }
];

export const seraQuestions = [
  {
    question: "What did we decide about the vendor contract in April?",
    answer:
      "On April 14, the team decided to extend the vendor contract for 12 months with revised pricing. Decision owner: Maya R. The open follow-up is legal review of the renewal language.",
    sources: ["Board Meeting, Apr 14, 2026", "Decision Candidate 36", "Vendor Email Thread"]
  },
  {
    question: "Who owns onboarding right now?",
    answer:
      "Onboarding is currently held by the People Circle, with Elena M. assigned as role holder through September 2026. The role includes first-week orientation, Notion access, and 30-day context review.",
    sources: ["Role Assignment, May 2, 2026", "People Circle Notes"]
  },
  {
    question: "What risks are still open from last month's governance meeting?",
    answer:
      "Three risks remain open: unclear decision rights for vendor renewals, delayed review of the conflict policy, and onboarding dependency on one senior operator.",
    sources: ["Governance Meeting, May 18, 2026", "Risk Register"]
  },
  {
    question: "What tasks were assigned to Maria that are still open?",
    answer:
      "Maria has two open tasks: prepare the revised donor briefing by June 12 and confirm the implementation owner for the CRM migration by June 17.",
    sources: ["Tasks Database", "Ops Weekly, May 29, 2026"]
  }
];

export const captureItems = [
  ["Decisions", "What was agreed, when it changed, and where the source lives."],
  ["Tasks", "Action items with owners, dates, status, and meeting context."],
  ["Risks", "Concerns that surface in conversation before they become expensive."],
  ["Roles", "Defined accountabilities, domains, and ownership history."],
  ["Role assignments", "Who holds what, since when, and under what conditions."],
  ["People and organizations", "Profiles, relationships, and interaction history."],
  ["Policies", "Governance and operating agreements with review status."],
  ["Governance proposals", "Draft changes, objections, and reviewable canon updates."],
  ["Meeting summaries", "Useful summaries connected to structured records."],
  ["Projects", "Initiatives, commitments, risks, and decision history."],
  ["Leads and relationships", "Relationship context, follow-ups, and stakeholder history that should not live only in one person's inbox."],
  ["Institutional knowledge", "Lessons, context, practices, and reasoning worth preserving."],
  ["Source emails", "Audit trail for every captured item and every review path."]
];

export const faqs = [
  [
    "How is Saberra different from Fireflies, Otter, or Fathom?",
    "Meeting tools summarize one conversation and produce a transcript. That transcript still has to become a decision, task, risk, or role record, and in most teams, it never does. Saberra closes that gap: Sera extracts structured records from meetings and emails, a human reviews them, and the approved records become the source Sera answers from."
  ],
  [
    "How is Saberra different from Notion AI?",
    "Notion AI is useful for what your team already wrote into Notion. It does not solve the behavior problem: the meetings that never get documented, the emails that never get filed, the decisions that lived only in someone's head. Saberra captures what your team forgets to write down, routes it through human review, and then puts the approved records into Notion."
  ],
  [
    "Does my team have to change how they work?",
    "No. Your team keeps using Google Meet and email exactly as they do today. Copy Sera on the meetings and email threads that matter. That is the only change your team makes. A human reviewer, usually an ops lead or chief of staff, spends about 1–2 hours per week reviewing Sera's candidate records. Everyone else keeps working normally."
  ],
  [
    "Where does our data live?",
    "In your accounts. Saberra is a configured system, not a database your team cannot see. Your Living Memory Hub lives in your own Notion workspace. Your tool accounts stay yours. Every record Sera has ever touched is inspectable, editable, and governable by your team."
  ],
  [
    "Does Sera make things up?",
    "No. Sera answers from reviewed, source-backed organizational records. Not the open internet, not unreviewed extractions. If the record does not exist, Sera says so. That restraint is deliberate: an AI that confidently invents answers is worse than no system at all."
  ],
  [
    "Does Saberra replace human judgment?",
    "No, and that is the point. Sera recommends. Your reviewer decides. AI extraction proposes structured records, humans review and approve them, and Sera answers only from the approved record. Nothing becomes trusted organizational truth without a human in the loop."
  ],
  [
    "What tools are required?",
    "Google Workspace and Google Meet are native. Notion is the default memory backend. The full setup also uses an AI provider account, Railway for the pipeline, and a dedicated capture inbox. Transcripts or summaries from Zoom, Teams, or other platforms can be processed when emailed into the capture inbox."
  ],
  [
    "How long does setup take?",
    "A guided four-week deployment. Week 1: chaos map and source routing. Week 2: capture inbox and Living Memory Hub configuration. Week 3: human approval workflow design. Week 4: Sera operating baseline and first memory intelligence readout."
  ],
  [
    "Can Saberra use Postgres or a custom backend instead of Notion?",
    "Notion is the default because it keeps records inspectable for nontechnical teams without engineering work. Custom data architecture, including Postgres or additional systems of record, is scoped separately for larger or more technical deployments."
  ],
  [
    "Who is Saberra for?",
    "Teams of 15 to 200 people on Google Workspace and Notion that are already feeling the cost of lost decisions, unclear ownership, slow onboarding, or key-person knowledge dependency. If the pain is real, the fit is usually strong."
  ]
];
