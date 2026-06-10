/**
 * Updates key Knowledge Base articles to reflect current system state.
 * Updates Summary + Key Points properties on existing articles.
 * Creates new articles if they don't already exist.
 *
 * Usage:  npx ts-node scripts/update-kb-articles.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const KEY  = process.env.NOTION_API_KEY;
const KB   = process.env.NOTION_DB_KNOWLEDGE_BASE;
if (!KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!KB)  { console.error('NOTION_DB_KNOWLEDGE_BASE required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = { Authorization: `Bearer ${KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
const TODAY = new Date().toISOString().slice(0, 10);

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function rt(text: string) {
  // Notion rich_text max 2000 chars
  const safe = text.slice(0, 1999);
  return [{ type: 'text', text: { content: safe } }];
}

async function patchPage(pageId: string, summary: string, keyPoints: string): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      properties: {
        Summary:       { rich_text: rt(summary) },
        'Key Points':  { rich_text: rt(keyPoints) },
        'Last Enriched At': { date: { start: TODAY } },
      },
    }),
  });
  if (!r.ok) throw new Error(`PATCH ${pageId}: ${r.status} ${await r.text()}`);
}

async function createArticle(title: string, category: string, audience: string[], summary: string, keyPoints: string, source: string): Promise<string> {
  const r = await fetch(`${BASE}/pages`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      parent: { database_id: KB },
      properties: {
        'KB Title':        { title: [{ type: 'text', text: { content: title } }] },
        Category:          { select: { name: category } },
        Audience:          { multi_select: audience.map(a => ({ name: a })) },
        Summary:           { rich_text: rt(summary) },
        'Key Points':      { rich_text: rt(keyPoints) },
        Source:            { rich_text: rt(source) },
        Status:            { select: { name: 'Published' } },
        Confidence:        { select: { name: 'High' } },
        'Last Enriched At': { date: { start: TODAY } },
        'Published At':    { date: { start: TODAY } },
      },
    }),
  });
  if (!r.ok) throw new Error(`CREATE: ${r.status} ${await r.text()}`);
  const d = await r.json() as any;
  return d.id;
}

// ── Article definitions ───────────────────────────────────────────────────────

interface Update { pageId: string; title: string; summary: string; keyPoints: string }
interface NewArticle { title: string; category: string; audience: string[]; summary: string; keyPoints: string; source: string }

const UPDATES: Update[] = [
  {
    pageId: '36e0a88e-f36a-81f6-aa27-dbebfb615e91',
    title: 'How Sera Works - A Complete Guide to the Living Memory Hub',
    summary: 'Sera (the Amora Living Memory Hub) is a TypeScript/Node.js background worker running on Railway that monitors the roots@amora.cr inbox every 3 minutes. For each email, it classifies the type, extracts structured data using Claude AI, and writes draft records to 17 interconnected Notion databases. For Google Meet assets (recordings, transcripts, Gemini notes), it checks Google Drive access, exports the content, and runs full AI extraction. Nothing is approved or published automatically - every extracted record starts as Pending, Candidate, or Draft for human review. The system is designed for zero-intervention operation: it self-deduplicates, retries denied access automatically, and escalates to the admin only when human action is truly required. Sera is also purpose-aware: when the Governing Purpose Statement (GPS) is configured in Railway, every decision and canon change is evaluated for alignment with Amora\'s organizational north star.',
    keyPoints: [
      'Poll cycle: checks roots@amora.cr IMAP inbox every 3 minutes on Railway - most emails processed within 5 minutes of arrival',
      '17 Notion databases: Source Emails, Meetings, Meeting Assets, Messages, Profiles, Projects, Circles, Roles, Role Assignments, Tasks, Decision Candidates, Risks, Memory Review Queue, Canon Change Requests, CCOS Ledger Entries, Processing Events, Sensitive Review',
      'Email classification: Google Meet Recording, Google Meet Transcript, Google Meet Notes, Operational Email, Forwarded Thread',
      'Meeting dedup: Capture Key strategy (Calendar ID > Meet code+date > title+domain+date > Drive ID > message ID)',
      'Drive access: checks canDownload and canCopy permissions before attempting export - retries at 30 min/2 hr/24 hr if denied',
      'AI extraction: Claude Sonnet primary, Claude Haiku fallback, JSON schema validation, JSON repair as third tier',
      'Extracts 12 entity types: decisions, tasks, risks, memory candidates, canon changes, sensitive flags, profile updates, project updates, circle updates, role updates, role assignments, CCOS ledger entries',
      'Purpose alignment scoring: when AMORA_GOVERNING_PURPOSE is set in Railway, Sera adds Purpose Alignment (Aligned/Neutral/Misaligned/Unclear) to every Decision Candidate and includes a one-sentence reasoning note',
      'Governing Purpose Statement is treated as the highest organizational authority (S.H.E.) - all decisions are evaluated against it automatically',
      'Memory candidates: strict criteria - only relationship context, institutional knowledge, historical facts, process insights, or ambiguous info with no other home',
      'Deferred IMAP seen-flagging: messages are only marked seen AFTER all processing completes - crash-safe by design',
      'Admin dashboard: 5-tab interface at Railway-hosted URL with real-time metrics, charts, queue management, and Sera tips',
    ].join('\n'),
  },
  {
    pageId: '36e0a88e-f36a-81c6-ac15-c710682a072b',
    title: 'Admin Dashboard - What It Shows and How to Use It',
    summary: 'The Amora admin dashboard is a real-time monitoring interface for the Living Memory Hub, available at the Railway-hosted dashboard URL. It is organized into 5 tabs: Overview (hero metrics and charts), Queues (pending review items with profile tags and queue health chart), Activity & Ops (processing event log, access failures, system health), Governance (policy library and community stats charts), and Settings (system configuration). A Sera tips bar appears persistently above the tabs on every page. The dashboard auto-refreshes its cache every 2.5 minutes so page loads are always fast. Access is protected by HTTP Basic Auth using DASHBOARD_USER and DASHBOARD_PASS environment variables.',
    keyPoints: [
      'Overview tab: 4 hero cards (hours saved, emails processed, meetings captured, people known), 7-day activity bar chart, email type breakdown donut chart',
      'Queues tab: all 8 review queues with counts and direct Notion links, horizontal queue health bar chart (color-coded by urgency), top 15 Memory Review items with profile tags and confidence badges, top 10 Sensitive Review items with profile tags',
      'Activity & Ops tab: event log filtered to meaningful activity (extractions, errors, access requests), Drive access failures table with retry button, system health panel (last poll, weekly event count), recent errors table',
      'Governance tab: policy library stats (total, draft, active, missing circle), community at-a-glance bar chart, policy status doughnut chart',
      'Settings tab: system configuration read-out (AI model, poll interval, retry count, tenant ID, KB enabled, admin email)',
      'Profile tags on Memory and Sensitive Review items show which people each item concerns directly on the dashboard',
      'Sign Out button forces browser to clear Basic Auth credentials - navigate away and re-enter credentials',
      'Cache age shown in header (e.g. Cached 45s ago) - click Reload for fresh data anytime',
      'Sera tips bar rotates through 20 tips on a 12-second cycle - click dots to jump to a specific tip',
    ].join('\n'),
  },
  {
    pageId: '36e0a88e-f36a-8100-8dd8-d23cfa248e76',
    title: 'How to Read the Admin Dashboard',
    summary: 'A quick reference for interpreting the numbers and indicators on the Amora admin dashboard. The dashboard uses color-coded status dots, queue counts, and charts to give an at-a-glance picture of system health and pending work. The header shows the current status (Online, Delayed, or Stale based on last poll age) and how fresh the cached data is. Queue cards link directly to the relevant Notion database. Charts rebuild automatically when you switch tabs.',
    keyPoints: [
      'Status dot colors: green (Online - polled in last 10 min), amber (Delayed - last 10-30 min), red (Stale - over 30 min or never)',
      'Queue card colors: grey number = zero items (all clear), amber = 1-9 items pending, red = 10+ items pending',
      'Queue health chart (Queues tab): horizontal bars - grey=0, amber=low, red=high urgency',
      'Estimated Hours Saved: 45 min per meeting + 5 min per email + 2 min per task + 3 min per decision, running total from day one',
      'Memory Review items show Confidence (High/Medium/Low badge) and Category, plus profile name chips for who each memory concerns',
      'Sensitive Review items show date flagged and profile name chips for who is directly involved',
      'Activity log (Activity & Ops tab): shows extractions, errors, access requests - heartbeat/poll noise filtered automatically',
      'Cache age in header: data is refreshed every 2.5 minutes in background; click Reload for an immediate fresh fetch',
    ].join('\n'),
  },
  {
    pageId: '36e0a88e-f36a-817a-ad23-db51234fb767',
    title: 'How the Memory Review Queue Works',
    summary: 'The Memory Review Queue holds institutional facts that Sera believes are worth preserving long-term but require human judgment before becoming official knowledge. Sera applies strict criteria: a memory candidate is only created for relationship context between people or organizations, long-term institutional knowledge not captured elsewhere, historical facts about Amora, process or learning insights for future members, or genuinely ambiguous information with no other structured home. Decisions, tasks, risks, and role assignments are NOT duplicated here. Each item now shows which profiles it concerns via the Related Profiles relation, visible both in Notion and on the dashboard Queues tab.',
    keyPoints: [
      'Created ONLY for: relationship context, institutional knowledge, historical facts, process insights, genuinely ambiguous info with no other home',
      'NOT created for items already captured as decisions, tasks, risks, or role assignments - those databases are the authoritative home',
      'NOT created for: technical glitches, email formatting errors, meeting logistics, or duplicate operational observations',
      'Related Profiles relation: links directly to the profiles this memory concerns - filter by person in Notion to review all memories about someone',
      'Dashboard Queues tab shows top 15 pending items inline with confidence badge, category, and profile name chips',
      'Confidence levels: High = clearly stated fact from source; Medium = reasonable inference; Low = passing mention (Low items skipped)',
      'Review workflow: Pending Review -> Approved (implement in KB or canonical doc) or Rejected or Needs Clarification',
      'Approved Date and Implemented Link fields track when and where each approved memory was actioned',
      'Run scripts/clean-review-noise.ts to use AI to auto-dismiss items that no longer meet the strict criteria',
    ].join('\n'),
  },
  {
    pageId: '36e0a88e-f36a-812b-932c-eb5c372d59b5',
    title: 'How to Handle Sensitive Information with Sera',
    summary: 'The Sensitive Review database is admin-only and lives in a separate Notion teamspace not visible to the general team. Sera applies strict criteria before flagging anything as sensitive: only genuine personal disclosures (health, family, personal hardship), conflict or safety situations between specific people, specific financial amounts or disputes, legal matters or liability, confidential organizational information shared in error, or information that could genuinely harm someone if exposed. Technical glitches, email formatting errors, routine operational items, and observations already captured as risks are automatically excluded. Each sensitive flag now includes a Related People relation showing which profiles are directly involved.',
    keyPoints: [
      'Strict KEEP criteria: personal disclosures, safety/conflict situations, specific financial amounts or disputes, legal matters, confidential data shared in error, genuine harm risk',
      'Auto-excluded: email formatting errors (broken links, wrong signatures), technical glitches, meeting logistics, scheduling issues, items already in the Risks database',
      'Related People relation: links directly to involved profiles - no need to search manually who is affected',
      'Database is admin-only in a separate Notion teamspace - team members cannot see sensitive flags',
      'Dashboard Queues tab shows top 10 pending items with profile tags - click "Open in Notion" for full details',
      'Status workflow: Pending Review -> Reviewed (add Review Notes) -> Dismissed or Escalated',
      'Review Notes field: document how each situation was handled for the audit trail',
      'Reviewed By and Reviewed Date fields provide accountability tracking',
      'To clean up stale items: run scripts/clean-review-noise.ts (DRY_RUN=true preview, DRY_RUN=false apply)',
      'Admin notification email is sent when a sensitive flag is created - check ADMIN_NOTIFICATION_EMAIL in Settings tab',
    ].join('\n'),
  },
  {
    pageId: '36e0a88e-f36a-8133-93c7-d646a7129452',
    title: 'How to Review the Dashboard Queues',
    summary: 'The Queues tab on the admin dashboard gives a complete picture of everything awaiting human review across all 8 Notion review databases. Each queue card shows the count and links directly to Notion. A horizontal bar chart shows relative urgency at a glance. Below the chart, the top pending Memory Review and Sensitive Review items are shown inline with profile name tags, confidence ratings, and category badges - so you can triage without opening Notion first.',
    keyPoints: [
      '8 queues tracked: KB Drafts, Canon Changes, Memory Queue, Decisions, Sensitive Review, CCOS Ledger, Unowned Tasks, High Risks',
      'Queue health bar chart: grey=0 (clear), amber=low (1-9), red=high urgency (10+) - horizontal layout for easy comparison',
      'Memory Queue inline list: top 15 pending items with title, confidence badge (High/Medium/Low), category, and related profile name chips',
      'Sensitive Review inline list: top 10 pending items with title, date flagged, and related profile name chips',
      'Profile name chips show who each review item concerns - click through to Notion to see full profile relations',
      'Click any queue card to jump directly to the filtered Notion database view',
      'Role health section below shows vacant roles and terms expiring within 30 days',
      'Triage order recommendation: Sensitive Review first (admin-only, time-sensitive), then High Risks, then Canon Changes, then Memory Queue',
      'Weekly review cadence: aim to clear all Pending Review items to zero once per week',
    ].join('\n'),
  },
  {
    pageId: '36e0a88e-f36a-81fa-aec2-e8c8ce3c1146',
    title: "Sera's Fun Facts - Things You Might Not Know",
    summary: "Surprising capabilities, design decisions, and hidden behaviors of Sera, the Amora Living Memory Hub AI. Updated to reflect the current state of the system as of May 2026.",
    keyPoints: [
      'Sera uses a Capture Key to deduplicate meetings - recording, transcript, and Gemini notes for the same meeting all land on one record, not three',
      'Sera upgrades profile names automatically: "Kyleen" becomes "Kyleen Keenan" when the full name arrives with the same email address',
      'Sera never writes em dashes in any output - hyphens only - enforced by explicit prompt instruction',
      'Memory candidates now tag the profiles they concern via a Related Profiles relation - visible in Notion and on the dashboard',
      'Sensitive flags now tag the people involved via a Related People relation - no manual cross-referencing needed',
      'Strict noise filtering is applied to both queues: only about half of items generated by older logic would meet today\'s stricter criteria',
      'Email subjects in admin notifications are RFC 2047 encoded - no more garbled special characters in email clients',
      'Sera uses Claude Sonnet as primary model, Claude Haiku as fallback, with JSON repair as a third-tier safety net',
      'The dashboard cache pre-warms every 2.5 minutes - every page load after the first is instant',
      'Retry schedule for denied Drive access: 30 min -> 2 hr -> 24 hr -> Manual Review with admin email escalation',
      'Sera parses the email body (not the From header) to find the real meeting organizer, since Google sends from no-reply addresses',
      'Google Meet notification emails always come from a no-reply address - Sera uses body parsing to find the real organizer',
      'Sera checks for KB article duplicates using keyword matching before creating new articles - existing articles are enriched instead',
      'The dedup-all-tables script uses richness scoring (filled properties + relations*2) to decide which duplicate to keep',
      'Profile dedup uses name matching first, then falls back to email matching to catch first-name-only vs full-name splits',
    ].join('\n'),
  },
];

const NEW_ARTICLES: NewArticle[] = [
  {
    title: 'Admin Dashboard Tab Reference - All 5 Tabs Explained',
    category: 'How-To',
    audience: ['Leadership', 'Circle Leads'],
    summary: 'A tab-by-tab reference guide for the Amora admin dashboard. The dashboard is divided into 5 tabs, each focused on a different aspect of system monitoring and review. A persistent Sera tips bar above the tabs provides rotating tips and pro tips. Charts on each tab rebuild automatically when the tab is opened.',
    keyPoints: [
      'Tab 1 - Overview: 4 hero metric cards (hours saved, emails processed, meetings captured, people known), 7-day processing activity bar chart, email type breakdown doughnut chart, community sub-stats (tasks, decisions, KB articles, circles, open risks)',
      'Tab 2 - Queues: 8 queue count cards with direct Notion links, queue health horizontal bar chart (color-coded urgency), Memory Review inline list (top 15 with profile tags), Sensitive Review inline list (top 10 with profile tags), role health panel (vacant/expiring roles)',
      'Tab 3 - Activity & Ops: recent activity event log (extractions, errors, access requests - noise filtered), Drive access failures table with Retry buttons, system health panel (last poll, weekly event count), recent errors table',
      'Tab 4 - Governance: policy library stats (total/draft/active/missing circle), community at-a-glance bar chart (6 metrics), policy status doughnut chart (active/draft/other)',
      'Tab 5 - Settings: system config display (AI model, poll interval, max retry count, tenant ID, KB enabled, admin email)',
      'Sera tips bar: persistent above tabs, rotates through 20 tips on 12-second cycle, dots for manual navigation, avatar has tilt/gyro animation',
      'Theme toggle: Light/Dark mode, persisted in localStorage',
      'Sign Out: clears browser Basic Auth credentials via 401 trick',
      'Cache: data pre-warmed every 2.5 minutes, age shown in header',
    ].join('\n'),
    source: 'Amora Living Memory Hub admin dashboard (auto-generated guide)',
  },
  {
    title: 'Understanding Profile Tagging on Review Items',
    category: 'How-To',
    audience: ['Leadership', 'Circle Leads'],
    summary: 'Since May 2026, both Memory Review Queue and Sensitive Review items automatically tag the Notion profiles they concern. This means when reviewing a memory candidate or a sensitive flag, you can immediately see which team members or contacts the item relates to - without having to search manually. The dashboard Queues tab shows profile name chips inline; the full Notion relation lets you filter by person.',
    keyPoints: [
      'Memory Review Queue: Related Profiles relation links to Profiles database entries that the memory concerns',
      'Sensitive Review: Related People relation links to Profiles database entries directly involved in the sensitive situation',
      'Profile names are shown as chips on the dashboard Queues tab inline list - visible without opening Notion',
      'In Notion: use the relation to filter the Memory Review Queue or Sensitive Review by a specific person - useful when preparing for a meeting or performance conversation',
      'Profile names are resolved from the extraction - Sera uses the names mentioned in the source text and matches them to existing profile records',
      'If a profile is not yet in the system, Sera creates it during extraction and then links it to the review item',
      'Retrospective tagging: use scripts/clean-review-noise.ts to evaluate existing items and dismiss noise; older items before May 2026 may not have profile relations set',
      'Admin guide: when reviewing sensitive items, check Related People first to understand context before reading the full reason',
    ].join('\n'),
    source: 'Amora Living Memory Hub - system update May 2026',
  },
  {
    title: 'The Three Pillars of Teal Regenerative Organizations',
    category: 'Governance',
    audience: ['Leadership', 'Circle Leads', 'All Members'],
    summary: 'Teal organizations (as defined by Frederic Laloux in Reinventing Organizations) rest on three foundational breakthroughs that distinguish them from conventional hierarchies. Amora operates as a Teal regenerative organization using CCOS as its operating system. All three pillars are active in Amora: Evolutionary Purpose is encoded in the Governing Purpose Statement (GPS), Self-Management operates through CCOS circles and consent-based governance, and Wholeness is supported through ARC practices and community design. Each pillar reinforces the others - none can stand alone.',
    keyPoints: [
      'Pillar 1 - Evolutionary Purpose (S.H.E.): The organization listens to what Life wants to create through it. Purpose is not a slogan but a functional governing authority - the highest decision-maker in the system. In Amora, this is encoded in the Governing Purpose Statement (GPS) stored in the system configuration.',
      'Pillar 2 - Self-Management: Authority is distributed through roles, circles, and consent-based decision-making rather than top-down hierarchy. CCOS (Collaborative Circle Operating System) is the mechanism for self-management in Amora - circles, role stewards, proposals, and the CCOS Ledger all serve this pillar.',
      'Pillar 3 - Wholeness: People bring their whole selves to the work. The organization creates conditions for human flourishing, not just productivity. ARC (Awareness, Resilience, Connection) practices, emotional literacy, and community design serve this pillar in Amora.',
      'Why all three must be present: removing hierarchy (Pillar 2) before re-housing authority in purpose (Pillar 1) creates chaos. Self-management without wholeness burns people out. Purpose without wholeness becomes ideology. The three pillars are a system, not a menu.',
      'S.H.E. (Systemic Holistic Evolution): in CCOS, the Governing Purpose is sometimes called "the She in charge" - purpose outranks people, personalities, and preferences. When conflict arises, the question shifts from "what do we want?" to "what does the purpose require right now?"',
      'Teal does not mean vague: a regenerative purpose must still attract the right people, repel the wrong ones, anchor decisions, and solve a real problem. "Teal with teeth" means complexity-aware and self-directing - not soft or undefined.',
    ].join('\n'),
    source: 'Frederic Laloux - Reinventing Organizations; QuickLaunch CCOS Purpose Framework',
  },
  {
    title: 'Governing Purpose Statement - Amoras Organizational North Star',
    category: 'Governance',
    audience: ['Leadership', 'Circle Leads', 'All Members'],
    summary: 'The Governing Purpose Statement (GPS) is Amora\'s highest organizational authority - a structured declaration of who the organization serves, what transformation it creates, and what regenerative outcome it protects. Unlike a mission statement or tagline, the GPS functions as a decision filter: every proposal, hiring decision, spending choice, and canon change can be tested against it. When the GPS is properly formulated, it removes personality from power - no one is "in charge," the purpose is, and people steward alignment to it. The GPS follows the QuickLaunch Teal Regenerative Purpose Formula: who we serve, their real pain, the transformation, our unique approach, and the long-term regenerative outcome.',
    keyPoints: [
      'Formula: "We exist to help [specific dream target] who are struggling with [real pain] move from [current reality] to [transformation] by [unique approach] so they can [long-term regenerative outcome]."',
      'What GPS is NOT: it is not a tagline, a values list, or an aspiration. It names a real nervous-system pain, defines a recognizable target, encodes transformation (not activity), and specifies a regenerative outcome that benefits future generations.',
      'Decision test: derived from the GPS, the one-sentence decision test is used in real-time: "Does this move us from X to Y without degrading people, trust, or the land?" If no, the purpose says stop.',
      'Three versions needed: (1) Full purpose statement (governing - used by Sera for alignment scoring), (2) One-sentence decision test (used in meetings and proposals), (3) Public-facing summary (used externally).',
      'GPS in Sera: Amora\'s GPS is stored as AMORA_GOVERNING_PURPOSE in Railway env vars. Sera automatically evaluates every Decision Candidate and Canon Change Request for purpose alignment, scoring it Aligned / Neutral / Misaligned / Unclear and adding a brief reasoning note.',
      'Updating the GPS: GPS is "living" - it evolves through the CCOS canon review process, not by unilateral decree. Proposed changes to the Governing Purpose should be filed as Canon Change Requests with "Affected Canon Area: Governing Purpose."',
      'Signs the GPS is working: the team can use it to say no to misaligned funding, partners, or projects. Conflict resolves to "what does the purpose require?" rather than personality battles. New members quickly understand what the organization is really for.',
      'Signs the GPS needs revision: it feels too vague to use as a filter, people use it selectively, or it no longer reflects the real work. Trigger a purpose review via the CCOS governance process.',
    ].join('\n'),
    source: 'QuickLaunch Teal Regenerative Purpose Formula; CCOS Purpose Generator Workshop Guide',
  },
  {
    title: 'How Sera Scores Purpose Alignment on Decisions',
    category: 'How-To',
    audience: ['Leadership', 'Circle Leads'],
    summary: 'When the Governing Purpose Statement (GPS) is configured in Railway, Sera automatically evaluates every Decision Candidate extracted from meetings and emails for purpose alignment. This means every decision that enters Notion arrives with a readymade alignment score (Aligned, Neutral, Misaligned, or Unclear) and a brief reasoning note. This does not replace human judgment - it surfaces purpose tension early, before decisions are confirmed. Misaligned decisions are flagged for closer human review. The GPS functions as an invisible reviewer on every extraction.',
    keyPoints: [
      'Activation: set AMORA_GOVERNING_PURPOSE in Railway environment variables with the full GPS text. Optionally set AMORA_PURPOSE_TEST with the one-sentence decision test. Sera picks these up automatically - no code deployment needed.',
      'Alignment scores: Aligned (decision clearly serves the purpose), Neutral (no clear connection either way), Misaligned (decision conflicts with or undermines the purpose), Unclear (cannot determine from available context).',
      '"Purpose Alignment Notes" field: Sera adds a one-sentence explanation of why it scored the decision as it did - visible on every Decision Candidate record in Notion.',
      'What "Misaligned" means: a Misaligned score is not a veto. It is a flag for human review. Sera surfaces the tension; the governance process resolves it. A circle may consent to proceed with a Misaligned decision after deliberation - but it should do so consciously.',
      'Canon changes are also evaluated: Sera applies the same GPS check to Canon Change Requests. A proposed canon change that conflicts with the governing purpose is flagged for heightened admin review.',
      'Reviewing alignment in Notion: in the Decision Candidates database, filter by Purpose Alignment = Misaligned to see all decisions that tension with the GPS. Review these in circle governance before confirming them.',
      'GPS is injected per extraction: Sera reads the GPS from config at startup. Changing AMORA_GOVERNING_PURPOSE in Railway takes effect on the next worker restart - existing records are not retroactively scored.',
      'When no GPS is set: Purpose Alignment and Purpose Alignment Notes fields are simply left blank on Decision records. Sera operates normally without GPS configured.',
    ].join('\n'),
    source: 'Amora Living Memory Hub - Governing Purpose alignment feature (May 2026)',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nUpdating Knowledge Base articles...\n');

  for (const u of UPDATES) {
    try {
      await patchPage(u.pageId, u.summary, u.keyPoints);
      console.log(`  UPDATED  ${u.title}`);
    } catch (err: any) {
      console.log(`  ERROR    ${u.title}: ${err.message}`);
    }
    await sleep(350);
  }

  console.log('\nCreating new articles...\n');

  for (const a of NEW_ARTICLES) {
    try {
      const id = await createArticle(a.title, a.category, a.audience, a.summary, a.keyPoints, a.source);
      console.log(`  CREATED  ${a.title} (${id})`);
    } catch (err: any) {
      console.log(`  ERROR    ${a.title}: ${err.message}`);
    }
    await sleep(350);
  }

  console.log('\nDone.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
