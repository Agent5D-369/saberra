/**
 * Creates CCOS-related KB articles in the Amora Knowledge Base.
 * Covers: meta-principles, the governance model, collapse patterns, what broke in
 * Holacracy/Sociocracy, the 7 sectors, the living constitution, and the ARC framework.
 *
 * Safe to re-run. Usage: npx ts-node scripts/populate-ccos-kb.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();
import { NotionWriterService } from '../src/services/NotionWriterService';
import { logger } from '../src/config/logger';

const N = NotionWriterService;

interface Article {
  title: string;
  category: string;
  audience: string[];
  summary: string;
  keyPoints: string;
}

const ARTICLES: Article[] = [
  {
    title: 'CCOS Foundations — What Is the Conscious Collective Operating System?',
    category: 'Governance',
    audience: ['All Members', 'Circle Leads', 'Tech Team'],
    summary: 'The CCOS (Conscious Collective Operating System) is the governance framework that Amora uses to distribute power, coordinate work, and make decisions without hierarchy. It draws on the best of Holacracy and Sociocracy while fixing the patterns that make those systems break down in communities. Understanding CCOS is the starting point for participating effectively at Amora.',
    keyPoints: `WHAT THE CCOS IS
The CCOS is a consent-based, role-distributed governance system designed for intentional communities, co-living spaces, and regenerative organizations.

It was built specifically to avoid the failure modes of Holacracy (too complex, too corporate) and Sociocracy (too slow, too consensus-dependent) while preserving what works: role clarity, distributed authority, and explicit governance processes.

The core premise: power should be distributed through defined roles, not accumulated by individuals. Anyone holding a role has full authority to act within it without asking permission.

THE FIVE DESIGN PRINCIPLES
1. Role clarity over personality — accountability lives in roles, not people. "Who owns this?" means "which role owns this?" not "which person do we ask?"
2. Consent over consensus — a decision is valid if no one has a substantive objection, not if everyone loves it. This prevents gridlock.
3. Tensions as signal — unmet needs and friction are called "tensions." They are surfaced in governance, not suppressed. A tension without a resolution pathway is a governance failure.
4. Transparency by default — circle meetings, decisions, and role assignments are visible to all members unless explicitly restricted.
5. Evolutionary governance — policies, roles, and accountabilities change through governance proposals, not mandate. Anyone can propose a change.

THE FOUR CORE ROLES
Every circle in CCOS has four foundational roles:
- Lead Steward: sets circle priorities, assigns roles, removes persistent blockers. Does NOT micromanage or override individual role authority.
- Rep Steward: represents the circle's tensions to parent circles. The voice going up.
- Admin Facilitator: runs governance and tactical meetings. Holds the process, not the content.
- AI Secretary: (at Amora, this is Sera) records decisions, maintains role definitions, tracks governance artifacts in Notion.

HOW IT FITS AMORA
Amora uses CCOS to govern 8 circles across 7 regenerative sectors. Sera captures every governance action as a CCOS Ledger Entry or Canon Change Request. The worker never approves or applies changes — those require human consent through the governance process.`,
  },
  {
    title: 'CCOS Meta-Principles — Resilience, Planetary Nesting, and Future Generations',
    category: 'Governance',
    audience: ['All Members', 'Circle Leads'],
    summary: 'Three meta-principles sit above all CCOS operational rules and govern how Amora makes decisions that affect the commons, the ecosystem, and people not yet in the room. These principles are non-negotiable constraints, not aspirational values — they override circle authority when in conflict.',
    keyPoints: `WHY META-PRINCIPLES EXIST
Normal governance rules cover who decides what and how. Meta-principles answer a deeper question: what constraints apply to ALL decisions regardless of who makes them?

At Amora, three meta-principles function as constitutional guardrails. Any circle decision that violates a meta-principle can be challenged and reversed through the governance process.

META-PRINCIPLE 1: RESILIENCE
Amora optimizes for long-term resilience over short-term efficiency.

What this means in practice:
- Decisions that concentrate power, resources, or information in one person or role are subject to review even if they seem efficient.
- Systems should have redundancy — no single point of failure for critical functions.
- Financial decisions that trade future flexibility for present convenience require explicit consent from the Finance circle.
- "This is faster if one person controls it" is not a valid justification for centralizing governance authority.

Sera's role: flags tasks and decisions that introduce single-point dependencies or reduce redundancy as risks with category "Resilience."

META-PRINCIPLE 2: PLANETARY NESTING
Amora's decisions must be nested within — not separate from — ecological and planetary systems.

What this means in practice:
- Resource use decisions (land, water, energy, materials) require explicit acknowledgment of ecological impact.
- The Land & Ecology circle has standing to raise a tension in any other circle's governance if a decision creates ecological harm.
- Planetary nesting is documented in the CCOS Ledger — every major governance decision includes a "Planetary Impact" field.
- Amora does not treat sustainability as a department; it is embedded in every circle's accountabilities.

META-PRINCIPLE 3: FUTURE GENERATIONS
Decisions with long-term effects must consider the interests of people not present — future residents, children, and communities who will inherit Amora's choices.

What this means in practice:
- Any decision that creates irreversible change (land use, major financial commitments, constitutional amendments) requires a "Future Generations review" — a structured question: "Would the people who live here in 20 years consent to this?"
- This review is facilitated by the Admin Facilitator but can be requested by any member.
- Canon changes that affect the living constitution always trigger a Future Generations review.

HOW TO RAISE A META-PRINCIPLE VIOLATION
Any member can raise a tension citing a meta-principle violation in any governance meeting. The Facilitator must address it before the meeting closes. If the tension cannot be resolved in the meeting, it escalates to a CCOS Ledger Entry for cross-circle resolution.`,
  },
  {
    title: 'CCOS Circles and Roles — How Amora Distributes Work and Authority',
    category: 'Governance',
    audience: ['All Members', 'Circle Leads'],
    summary: "Amora's work is organized into 8 circles, each responsible for one of the 7 CCOS sectors plus a Governance & Coordination meta-circle. Every circle has four core roles, its own accountabilities, and full authority within its domain. This article explains the circle structure, what each circle owns, and how circles coordinate.",
    keyPoints: `THE 8 CIRCLES AT AMORA
1. Governance & Coordination — runs cross-circle governance, conflict resolution, CCOS maintenance, and Admin Facilitation. Every constitutional change passes through this circle.

2. Community & Culture — stewards belonging, rituals, social cohesion, onboarding, and the felt experience of living at Amora. Manages community agreements and conflict transformation.

3. Land & Ecology — oversees land stewardship, regenerative agriculture, water systems, ecology projects, and any decision with direct environmental impact.

4. Learning & Education — coordinates knowledge sharing, skills development, workshops, and the relationship between Amora and external educational partners.

5. Economics & Finance — manages financial health, budgeting, income streams, member dues, purchasing decisions, and economic relationships with the outside world.

6. Communications & Marketing — handles external communications, digital presence, storytelling, media relationships, and how Amora represents itself publicly.

7. Technology & Systems — builds and maintains Amora's digital infrastructure, including Sera, Notion, Google Workspace, and any automation.

8. Health & Wellbeing — oversees physical and emotional health resources, safety protocols, healthcare access, and trauma-informed practices.

HOW CIRCLES COORDINATE
Circles are not silos. Coordination happens through:
- Rep Stewards: each circle sends a Rep Steward to the parent circle (Governance & Coordination) to surface tensions that cross circle boundaries.
- Shared roles: a person can hold roles in multiple circles. They bring information and alignment between circles naturally.
- Cross-circle proposals: any circle can propose a policy that affects another circle; the affected circle's Lead Steward must consent.

ROLE AUTHORITY WITHIN CIRCLES
When you hold a role, you have full authority to act within its accountabilities without asking permission. You cannot be micromanaged by the Lead Steward within your own role's domain. This is the core power distribution mechanism of CCOS.

If you are unsure whether an action falls within your role, check the role's accountabilities in Notion. If your action would be covered by an accountability, you are empowered to act. If not, bring it to governance as a proposal to expand the role.

FINDING ROLES AND ASSIGNMENTS IN NOTION
- Roles database: lists all active roles with their circle, purpose, domain, and accountabilities.
- Role Assignments database: shows who currently holds each role and their term dates.
- Tasks, Decisions, and Risks all have an "Assigned Role" or "Owner Role" field linking accountability to a role rather than just a person.`,
  },
  {
    title: 'CCOS Decision-Making — Consent, Tensions, and the Governance Process',
    category: 'Governance',
    audience: ['All Members', 'Circle Leads'],
    summary: 'CCOS uses consent-based decision-making, not consensus. A decision passes when no one has a valid, substantive objection — not when everyone agrees. This article explains the difference, how tensions become proposals, how proposals become policy, and what Sera captures from every governance meeting.',
    keyPoints: `CONSENT VS CONSENSUS
Consensus: everyone must agree before moving forward. This creates gridlock and gives any single person veto power indefinitely.

Consent: a decision is valid if no one has a valid objection — meaning an objection that would cause real, demonstrable harm to the circle or community. "I don't like it" is not a valid objection. "This would prevent me from fulfilling my role's accountabilities" is.

The standard question is: "Is this good enough for now, safe enough to try?" If yes, move forward. Governance is not about finding the perfect solution — it's about finding a solution that unblocks work and can be revised later.

THE TENSION-TO-RESOLUTION PATHWAY
1. Someone identifies a tension: something that is causing friction, blocking their role, or represents an unmet need.
2. They bring the tension to a governance meeting and propose a change: a new role, a policy, a role assignment, or a canon change.
3. The Facilitator runs a consent round — each person says whether they have a valid objection or consent.
4. If objections arise, they are integrated: the proposal is modified until all objections are addressed.
5. The decision is recorded. At Amora, Sera captures it as a CCOS Ledger Entry.

WHAT VERA CAPTURES FROM GOVERNANCE
For each meeting, Sera creates:
- CCOS Ledger Entries: any governance action (role change, policy, assignment, tension resolved) — created as Draft, requiring human confirmation.
- Decision Candidates: strategic decisions that affect multiple people or circles — created as Candidate status.
- Canon Change Requests: proposals to change the CCOS Living Constitution — created as Pending Review, always requiring human consent.
- Memory Review Queue: any proposed change to Amora's institutional memory.

Sera NEVER approves, ratifies, or publishes any governance artifact. All actions require human consent through the CCOS process.

TRACKING TENSION RESOLUTION IN NOTION
From 2025 forward, CCOS Ledger Entries have two relation fields:
- "Resolved By Decision" - links the tension to the Decision Candidate that resolved it
- "Resolved By Canon Change" - links the tension to the Canon Change Request that resolved it

This creates a complete audit trail: you can trace any decision back to the original tension that prompted it.

THE 7 CCOS LEDGERS
The governance system tracks 7 types of institutional action, each in its own logical ledger:
1. Role changes (new roles, modified accountabilities, role eliminations)
2. Policy changes (new or revised circle policies)
3. Role assignments (people taking on or releasing roles)
4. Tension resolutions (tensions addressed without creating a new policy)
5. Canon changes (amendments to the Living Constitution)
6. Financial decisions (above-threshold spending or commitment approvals)
7. Cross-circle agreements (mutual accountabilities between circles)`,
  },
  {
    title: 'What Broke in Holacracy and Sociocracy — Why CCOS Is Different',
    category: 'Governance',
    audience: ['Circle Leads', 'Tech Team'],
    summary: 'Amora did not invent CCOS from scratch. It studied why Holacracy and Sociocracy fail in community settings and made deliberate design choices to fix those failures. This article documents those failure modes so Amora can recognize and avoid them.',
    keyPoints: `WHY HOLACRACY BREAKS DOWN IN COMMUNITIES
Holacracy was designed for knowledge-work companies, not communities. Key failure modes:

1. Constitution worship: Holacracy's 40-page constitution is treated as inviolable. When reality does not fit the rules, practitioners either break the rules secretly or enforce them at the cost of human relationships. Communities cannot survive governance that prioritizes process over people.

2. Role-person confusion: Holacracy says "you are not your role." In companies this is clarifying. In communities where you live with your colleagues, it creates cognitive dissonance. CCOS acknowledges that people bring their whole selves to governance and designs for that reality.

3. No care layer: Holacracy has no explicit mechanism for addressing emotional harm, trauma, or interpersonal conflict. These get classified as "operational" and ignored in governance. Communities have high-stakes interpersonal dynamics that need dedicated governance space.

4. Anti-patterns from power concentration: despite the role distribution, power in Holacracy often recentralizes with the CEO or anchor circle. CCOS builds explicit anti-capture safeguards: no single role can hold veto power over constitutional changes.

WHY SOCIOCRACY BREAKS DOWN IN COMMUNITIES
Sociocracy is slower and more humanizing than Holacracy but has its own failure modes:

1. Consent rounds take forever: when a community treats consent as "check in with everyone's feelings," governance meetings run 3+ hours. CCOS tightens consent to "valid objections only" and trains facilitators to distinguish process from preference.

2. Double-link confusion: Sociocracy's double-link (circle sends rep up, super-circle sends rep down) creates information clutter. CCOS simplifies to single Rep Steward per circle going up, with defined escalation paths.

3. Equivalence without accountability: Sociocracy's principle that all voices are equivalent regardless of role creates situations where people without domain knowledge block experts. CCOS preserves domain authority — role holders have the final say within their accountabilities.

WHAT CCOS SPECIFICALLY FIXED
- The Living Constitution is versioned and amended through a consent process, not by leadership decree.
- Tensions are first-class governance objects with a documented resolution pathway.
- The AI Secretary (Sera) removes administrative burden from governance meetings — humans focus on dialogue, Sera captures artifacts.
- Meta-principles function as constitutional constraints that cannot be overridden by any circle, preventing capture by any single interest.
- Role terms have explicit expiration dates, preventing indefinite accumulation of authority.`,
  },
  {
    title: 'CCOS 7 Sectors of Regeneration — How Amora Organizes Its Purpose',
    category: 'Governance',
    audience: ['All Members'],
    summary: "Amora's work is organized around 7 regenerative sectors — the domains of life that a thriving intentional community must tend to. These sectors are not departments; they are lenses through which every circle views its responsibilities and priorities. Every task, decision, and risk Sera captures belongs to one or more of these sectors.",
    keyPoints: `THE 7 SECTORS
The CCOS framework identifies 7 core sectors that any regenerative community must actively steward. At Amora, each sector corresponds to a circle.

SECTOR 1: LAND AND ECOLOGY
The living systems that support all other sectors. Includes soil health, water, food production, biodiversity, and Amora's physical relationship with the land.

Core question: are our decisions regenerating or depleting the ecological systems we depend on?

SECTOR 2: COMMUNITY AND CULTURE
The social fabric — belonging, rituals, conflict, celebration, grief, identity, and the agreements that shape how people treat each other.

Core question: are people thriving here? Do they feel safe, seen, and supported?

SECTOR 3: LEARNING AND EDUCATION
Knowledge transmission, skill development, and the relationship between Amora's lived experience and the wider learning ecosystem.

Core question: are we building collective wisdom, and are we sharing it generatively?

SECTOR 4: ECONOMICS AND FINANCE
Flows of money, resources, and economic relationships. Includes membership finances, income streams, purchasing power, and economic justice.

Core question: does our economic system support resilience and equity, or does it reproduce scarcity patterns?

SECTOR 5: COMMUNICATIONS AND MARKETING
How Amora represents itself to the world. Includes storytelling, media, digital presence, and how Amora attracts aligned people and resources.

Core question: are we telling our story in a way that is honest, compelling, and attracts the right community?

SECTOR 6: TECHNOLOGY AND SYSTEMS
The digital and operational infrastructure that supports all other sectors. Includes Sera, Notion, Google Workspace, and any system Amora depends on to function.

Core question: do our systems serve humans, or are humans serving the systems?

SECTOR 7: HEALTH AND WELLBEING
Physical, emotional, and psychological health resources. Includes safety protocols, trauma-informed practices, healthcare access, and support systems.

Core question: are we caring for the whole person, not just their labor?

WHY SECTORS MATTER FOR VERA
When Sera extracts tasks, decisions, and risks, she tags them to relevant projects and circles. Understanding the 7 sectors helps you understand why a risk might be tagged "Land & Ecology" or why a task from a finance meeting shows up in the Economics circle's Notion view.

If a task lacks a circle relation in Notion, it means the source material did not clearly indicate which sector it belonged to. You can manually assign it.`,
  },
  {
    title: '7 Patterns That Collapse Intentional Communities — What Amora Guards Against',
    category: 'Governance',
    audience: ['Circle Leads', 'All Members'],
    summary: 'Field research from failed intentional communities identified 7 recurring patterns that lead to collapse. Amora has built specific governance safeguards against each. Understanding these patterns helps every member recognize warning signs early and bring a tension before the damage is done.',
    keyPoints: `WHY THIS MATTERS
Most intentional communities do not fail because of bad intentions. They fail because of predictable, well-documented patterns that repeat across communities globally. CCOS was designed with these patterns in mind.

THE 7 COLLAPSE PATTERNS

PATTERN 1: CHARISMATIC FOUNDER CAPTURE
A founding leader accumulates authority informally over time. Governance exists on paper but the founder's opinion overrides it in practice. When the founder leaves or becomes dysfunctional, the community has no real governance capacity.

Amora's safeguard: the Living Constitution prohibits any single role from holding constitutional veto power. Lead Stewards cannot override consent processes. Role assignments have term limits.

PATTERN 2: UNRESOLVED INTERPERSONAL CONFLICT
Two or more people have a deep conflict that is never formally addressed. It becomes the political undercurrent of every meeting. People take sides. Energy that should go to community work goes to managing the conflict.

Amora's safeguard: Community & Culture circle owns conflict transformation as an explicit accountability. The CCOS governance process has a defined pathway for interpersonal tensions separate from operational tensions.

PATTERN 3: FINANCIAL OPACITY
Financial decisions are made by a small group with no transparency. Members do not understand the community's financial health. When problems emerge, they emerge as crises rather than manageable tensions.

Amora's safeguard: Economics & Finance circle publishes financial summaries. Major decisions above defined thresholds require cross-circle consent. Sera captures all financial governance actions as CCOS Ledger Entries.

PATTERN 4: DECISION-MAKING WITHOUT ACCOUNTABILITY
The community has a practice of "we all decide together" but no one is accountable for outcomes. Decisions made collectively are owned by no one individually.

Amora's safeguard: every decision gets an Owner Role in Notion. If a decision requires follow-through, it becomes a Task with an Assigned Role. Accountability lives in roles, not in collective goodwill.

PATTERN 5: TRAUMA WITHOUT REPAIR
Something traumatic happens — an assault, a betrayal, a serious conflict — and the community "moves forward" without repair. The unaddressed trauma resurfaces in every major tension afterward.

Amora's safeguard: Health & Wellbeing circle has standing to pause any governance process to address harm. The CCOS Living Constitution includes a Restorative Process protocol that must be offered before anyone is removed from the community.

PATTERN 6: GROWTH WITHOUT INTEGRATION
New members join faster than the community can integrate them into the culture and governance. The community's culture is diluted by new people who do not understand or share it.

Amora's safeguard: Community & Culture circle owns onboarding as a core accountability. New members go through a structured stewardship period before they hold governance roles. Cultural transmission is not assumed — it is designed.

PATTERN 7: INFRASTRUCTURE DEBT
The community defers maintenance on physical and digital systems because "we are focused on the community, not the technology." Deferred maintenance creates crises that distract from community life.

Amora's safeguard: Technology & Systems circle has explicit accountability for infrastructure health. Sera's dashboard surfaces system health metrics. Risk items with category "Infrastructure" are flagged for review.

HOW TO USE THIS
If you notice any of these patterns emerging at Amora, bring it as a tension to the relevant circle's governance meeting immediately. Early tension surfacing is the single most effective governance health practice.`,
  },
  {
    title: 'ARC Framework in the CCOS — Accountability, Regeneration, Consent',
    category: 'Governance',
    audience: ['All Members', 'Circle Leads'],
    summary: "The ARC framework is CCOS's evaluative lens for governance decisions. Any proposal at Amora can be assessed through three questions: does it create clear Accountability? Does it support Regeneration? Does it honor Consent? When all three are present, a decision is aligned with Amora's deepest values.",
    keyPoints: `WHAT ARC STANDS FOR
A — Accountability: is it clear who is responsible for this, and do they have the authority to act?
R — Regeneration: does this decision support living systems — human, ecological, and social — or does it deplete them?
C — Consent: has this passed through a valid consent process where objections could be raised and integrated?

ARC is not a checklist. It is a frame for evaluating whether a decision is complete.

ACCOUNTABILITY IN PRACTICE
A decision without a clear owner is not a decision — it is a hope. At Amora:
- Every task has an Assigned Role.
- Every decision has a Decision Maker Role.
- Every risk has an Owner Role.
- Accountability is documented in Notion by Sera.

If you cannot answer "which role is accountable for this?" a proposal is not ready to be consented to.

REGENERATION IN PRACTICE
A regenerative decision leaves the system it touches in better condition than it found it. This applies to:
- Ecological systems: does this support or deplete land, water, energy?
- Social systems: does this strengthen or weaken the fabric of the community?
- Economic systems: does this create resilience or dependency?
- Knowledge systems: does this add to or deplete Amora's institutional memory?

Sera flags decisions with potential regeneration implications as Decision Candidates with "Canon Impact" flagged. The relevant circle reviews them.

CONSENT IN PRACTICE
A decision that was made without consent is not a CCOS decision — it is a unilateral action that may need to be reversed. Consent means:
- The people whose roles are affected had an opportunity to raise objections.
- Objections were either integrated or invalidated (not overridden).
- The decision was recorded as a CCOS Ledger Entry.

ARC AND VERA
When Sera extracts governance content from a meeting, she is operationalizing ARC:
- She captures who owns each action (Accountability).
- She flags ecological and social risks (Regeneration).
- She records decisions as candidates requiring consent, never as confirmed decisions (Consent).

The ARC framework is why Sera never approves anything — only humans can complete the consent step.`,
  },
  {
    title: 'CCOS Living Constitution — The Charter That Governs How Amora Governs Itself',
    category: 'Governance',
    audience: ['Circle Leads', 'All Members'],
    summary: "The CCOS Living Constitution is Amora's foundational governance charter — the document that defines who has authority, how decisions are made, how roles are created and filled, and how the constitution itself can be amended. It is 'living' because it can evolve through consent, but changing it is deliberately difficult to protect against capture.",
    keyPoints: `WHAT THE LIVING CONSTITUTION IS
The Living Constitution is the meta-governance document — the rules about the rules. It defines:
- The structure and authority of circles
- The four core roles and their powers
- The consent-based decision process
- The conflict and harm response process
- The amendment process for the constitution itself
- The meta-principles that constrain all governance
- Rights and responsibilities of all members

It is different from circle policies (which govern specific circles) and role accountabilities (which govern specific work). The Living Constitution governs everything.

THE 16 SECTIONS
1. Preamble — Amora's founding intention and values
2. Definitions — precise language for all CCOS terms
3. Circle Structure — how circles are nested and related
4. Core Roles — Lead Steward, Rep Steward, Admin Facilitator, AI Secretary
5. Role Authority — what role holders can and cannot do
6. Governance Process — how proposals are raised and decided
7. Tactical Process — how operational work is coordinated
8. Tension Process — how unmet needs become governance actions
9. Elections — how core roles are filled through sociocratic election
10. Role Removal — how role holders are removed for cause
11. Cross-Circle Coordination — how circles with shared concerns work together
12. Meta-Principles — Resilience, Planetary Nesting, Future Generations (non-negotiable)
13. Conflict and Harm — the restorative process protocol
14. Financial Governance — thresholds and transparency requirements
15. Constitutional Amendment — how the Living Constitution itself is changed
16. Transition Provisions — how communities migrate to CCOS from prior governance systems

THE AMENDMENT PROCESS
Constitutional amendments are the most deliberate process in CCOS because the constitution constrains everything else. To amend the Living Constitution:
1. A Canon Change Request is filed (by any member).
2. It is reviewed in the Governance & Coordination circle with at least 14 days notice to all members.
3. A Future Generations review is conducted.
4. A meta-principles review is conducted.
5. Consent is sought from all circle Lead Stewards.
6. If ratified, the change is recorded as a CCOS Ledger Entry with type "Canon Change."

Sera creates Canon Change Requests as Pending Review status. They are never auto-approved.

YOUR RIGHTS UNDER THE LIVING CONSTITUTION
Every member at Amora has:
- The right to raise a tension in any circle's governance meeting
- The right to request a Restorative Process if they experience harm
- The right to see any governance decision (except those restricted for safety)
- The right to propose a role change or policy change in any circle that affects their work
- The right to participate in elections for core roles

These rights cannot be removed by any circle policy or Lead Steward decision — only by a constitutional amendment.`,
  },
];

async function main() {
  const notion = new NotionWriterService();
  const today = new Date().toISOString().slice(0, 10);

  if (!notion.dbIds.knowledgeBase) {
    console.error('NOTION_DB_KNOWLEDGE_BASE not configured');
    process.exit(1);
  }

  for (const article of ARTICLES) {
    const existing = await notion.findByTitle(notion.dbIds.knowledgeBase, 'KB Title', article.title);
    if (existing) {
      await notion.updatePage(existing, {
        Summary:            N.richText(article.summary),
        'Key Points':       N.richTextLong(article.keyPoints),
        'Last Enriched At': N.date(today),
      });
      console.log(`Updated: "${article.title}"`);
    } else {
      await notion.createPage(notion.dbIds.knowledgeBase, {
        'KB Title':         N.title(article.title),
        Category:           N.select(article.category),
        Audience:           N.multiSelect(article.audience),
        Summary:            N.richText(article.summary),
        'Key Points':       N.richTextLong(article.keyPoints),
        Status:             N.select('Published'),
        Confidence:         N.select('High'),
        Source:             N.richText('CCOS documentation'),
        'Published At':     N.date(today),
        'Last Enriched At': N.date(today),
      });
      console.log(`Created: "${article.title}"`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\nAll CCOS KB articles written.');
}

main().catch(err => { logger.error({ err }, 'failed'); process.exit(1); });
