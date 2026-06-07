export const siteUrl = "https://saberra.com";

export const notionTemplateUrl = "REPLACE_WITH_NOTION_DUPLICATE_URL";

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
  ["Institutional knowledge", "Lessons, context, practices, and reasoning worth preserving."],
  ["Source emails", "Audit trail for every captured item and every review path."]
];

export const faqs = [
  [
    "How is Saberra different from Fireflies, Otter, or Fathom?",
    "Meeting tools summarize individual meetings. Saberra builds cumulative institutional memory across meetings, emails, decisions, tasks, roles, policies, and risks."
  ],
  [
    "How is Saberra different from Notion AI?",
    "Notion AI helps with what is already written in Notion. Saberra captures what your team forgets to write down, then places reviewed records into Notion."
  ],
  [
    "Does Saberra require behavior change?",
    "No. Your team keeps using Google Meet and email. A Memory Admin reviews extracted records before they become trusted memory, typically about 1-2 hours per week."
  ],
  [
    "Where does our data live?",
    "Client records live in the client's own Notion workspace and infrastructure. Saberra is delivered as a done-for-you implementation, not a black-box database."
  ],
  [
    "Does Sera answer from the internet?",
    "No. Sera answers from reviewed, sourced organizational records in your memory system."
  ],
  [
    "Does Saberra replace human judgment?",
    "No. AI extraction proposes structured records, humans review them, and Sera answers from the approved record."
  ],
  [
    "What tools are required?",
    "The standard deployment uses Google Workspace, Google Meet, Notion, an AI provider account, Railway, and a dedicated inbox. Google Meet is native, and transcripts or summaries from other meeting platforms can be captured when they are emailed into the dedicated inbox."
  ],
  [
    "Does Saberra work with Zoom or Teams?",
    "Google Meet is native. For Zoom, Teams, or other meeting platforms, Saberra can process transcripts or summaries when they are emailed into the dedicated capture inbox. Direct platform integrations are scoped separately."
  ],
  [
    "Can Saberra use Postgres or another data backend instead of Notion?",
    "Notion is the default memory backend because it keeps records inspectable for nontechnical teams. Custom data architecture, including Postgres or additional systems of record, can be scoped for larger or more technical deployments."
  ],
  [
    "How long does setup take?",
    "A focused deployment is typically planned as a done-for-you implementation cycle, with the first working instance configured after technical access is ready."
  ],
  [
    "Who is Saberra best for?",
    "Saberra is best for Notion-native, Google Workspace-based teams with 20 to 200 people and real knowledge loss pain."
  ]
];
