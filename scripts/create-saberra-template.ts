/**
 * Creates the Saberra free Notion template in a target page.
 *
 * Usage:
 *   TEMPLATE_PARENT_PAGE_ID=<your-page-id> npx ts-node scripts/create-saberra-template.ts
 *
 * How to get the parent page ID:
 *   1. Create a blank page in your Notion workspace called "Saberra Template"
 *   2. Open it and copy the URL — the ID is the 32-character hex string after the last /
 *   3. Set TEMPLATE_PARENT_PAGE_ID to that value
 *
 * What this creates:
 *   - A getting-started guide page
 *   - 13 databases covering the full institutional memory schema
 *   - Sample records in each database
 *
 * Notes:
 *   - Relations are not included — the Notion API cannot create cross-DB relations
 *     without both databases already existing in the same workspace.
 *     Owner, Project, Circle Lead, etc. are plain text placeholders here.
 *   - Formula properties (Next Review Date, Next Audit Date) ARE included
 *     and key off properties in the same database.
 *   - Automation-only databases (Source Emails, Meeting Assets, Processing Events,
 *     Sensitive Review) are excluded — they are meaningless without the live worker.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PARENT = process.env.TEMPLATE_PARENT_PAGE_ID;
if (!PARENT) { console.error('Set TEMPLATE_PARENT_PAGE_ID env var and re-run'); process.exit(1); }

// ─── Property helpers ─────────────────────────────────────────────────────────

const title    = (desc?: string) => ({ title:        {}, ...(desc ? { description: desc } : {}) });
const text     = (desc?: string) => ({ rich_text:    {}, ...(desc ? { description: desc } : {}) });
const sel      = (opts: string[], desc?: string) => ({ select:       { options: opts.map(n => ({ name: n })) }, ...(desc ? { description: desc } : {}) });
const msel     = (opts: string[], desc?: string) => ({ multi_select: { options: opts.map(n => ({ name: n })) }, ...(desc ? { description: desc } : {}) });
const date     = (desc?: string) => ({ date:         {}, ...(desc ? { description: desc } : {}) });
const check    = (desc?: string) => ({ checkbox:     {}, ...(desc ? { description: desc } : {}) });
const url      = (desc?: string) => ({ url:          {}, ...(desc ? { description: desc } : {}) });
const emailProp = (desc?: string) => ({ email:       {}, ...(desc ? { description: desc } : {}) });
const num      = (desc?: string) => ({ number:       { format: 'number' as const }, ...(desc ? { description: desc } : {}) });
const formula  = (expression: string, desc?: string) => ({ formula: { expression }, ...(desc ? { description: desc } : {}) });

// ─── Review-date formula expressions ─────────────────────────────────────────

const REVIEW_DATE_BY_CADENCE = (cadenceProp: string, lastDateProp: string) =>
  `if(empty(prop("${lastDateProp}")), "Set ${lastDateProp}", if(empty(prop("${cadenceProp}")), "Set ${cadenceProp}", if(prop("${cadenceProp}") == "As Needed", "Review as needed", formatDate(dateAdd(prop("${lastDateProp}"), if(prop("${cadenceProp}") == "Monthly", 1, if(prop("${cadenceProp}") == "Quarterly", 3, if(prop("${cadenceProp}") == "Semi-Annual", 6, 12))), "months"), "MMM D, YYYY"))))`;

const REVIEW_DATE_BY_TERM = (termProp: string, startDateProp: string) =>
  `if(empty(prop("${startDateProp}")), "Set ${startDateProp}", if(empty(prop("${termProp}")), "Set ${termProp}", if(prop("${termProp}") == "No Term", "No term limit", formatDate(dateAdd(prop("${startDateProp}"), if(prop("${termProp}") == "3 Months", 3, if(prop("${termProp}") == "6 Months", 6, 12)), "months"), "MMM D, YYYY"))))`;

// ─── Page content helpers ─────────────────────────────────────────────────────

const h2  = (t: string) => ({ object: 'block' as const, type: 'heading_2' as const,          heading_2:          { rich_text: [{ type: 'text' as const, text: { content: t } }], color: 'default' as const } });
const h3  = (t: string) => ({ object: 'block' as const, type: 'heading_3' as const,          heading_3:          { rich_text: [{ type: 'text' as const, text: { content: t } }], color: 'default' as const } });
const p   = (t: string) => ({ object: 'block' as const, type: 'paragraph' as const,          paragraph:          { rich_text: [{ type: 'text' as const, text: { content: t } }], color: 'default' as const } });
const bul = (t: string) => ({ object: 'block' as const, type: 'bulleted_list_item' as const, bulleted_list_item: { rich_text: [{ type: 'text' as const, text: { content: t } }], color: 'default' as const } });
const div = ()           => ({ object: 'block' as const, type: 'divider' as const,            divider: {} });

// ─── Create a database ────────────────────────────────────────────────────────

async function createDb(parentId: string, dbTitle: string, properties: Record<string, unknown>, description?: string): Promise<string> {
  const db = await (notion.databases.create as any)({
    parent: { page_id: parentId },
    title: [{ type: 'text', text: { content: dbTitle } }],
    ...(description ? { description: [{ type: 'text', text: { content: description } }] } : {}),
    properties,
  });
  console.log(`  Created: ${dbTitle}`);
  return db.id;
}

// ─── Add sample rows ──────────────────────────────────────────────────────────

async function addRow(dbId: string, properties: Record<string, unknown>): Promise<string> {
  const page = await (notion.pages.create as any)({
    parent: { database_id: dbId },
    properties,
  });
  return page.id;
}

const T  = (t: string) => ({ title:     [{ text: { content: t } }] });
const RT = (t: string) => ({ rich_text: [{ text: { content: t } }] });
const S  = (n: string) => ({ select: { name: n } });
const D  = (s: string) => ({ date: { start: s } });
const CB = (v: boolean) => ({ checkbox: v });
const MS = (...names: string[]) => ({ multi_select: names.map(n => ({ name: n })) });

const today     = new Date().toISOString().slice(0, 10);
const inOneWeek = new Date(Date.now() + 7  * 86400000).toISOString().slice(0, 10);
const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

// ─── Guide page ───────────────────────────────────────────────────────────────

async function createGuidePage(parentId: string): Promise<void> {
  const page = await (notion.pages.create as any)({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: '📚' },
    properties: { title: T('Getting Started with Saberra') },
  });

  await (notion.blocks.children.append as any)({
    block_id: page.id,
    children: [
      p('This template gives you the complete Saberra institutional memory schema to use in Notion — the same 19 databases that Saberra populates automatically. 13 core databases capture governance, people, and operations. 6 community layer databases (Tensions, Agreements, Gratitudes, Events, Retrospectives, Resources) capture the relational and cultural fabric of your organization. Start building institutional memory now, and upgrade to full AI automation when you are ready.'),
      div(),

      h2('What is in this template'),
      bul('Tasks — action items with owners, due dates, and priority'),
      bul('Decision Candidates — decisions made, proposed, or pending consent'),
      bul('Risks — organizational tensions and risks with severity and mitigation'),
      bul('Memory Review Queue — facts worth preserving as institutional knowledge'),
      bul('Profiles — people and organizations your team works with'),
      bul('Projects — named initiatives and their current status'),
      bul('Circles — self-managing governance circles (Teal, Holacracy, Sociocracy)'),
      bul('Roles — role cards with purpose, domains, and accountabilities'),
      bul('Role Assignments — who holds which role and when'),
      bul('Canon Change Requests — proposed changes to governance documents'),
      bul('CCOS Ledger — tensions, proposals, and governance decisions'),
      bul('Knowledge Base — how-to guides, processes, and best practices'),
      bul('Messages — captured communications and email summaries'),
      bul('Tensions — named gaps between what is and what could be'),
      bul('Agreements — ongoing commitments between people or circles'),
      bul('Gratitudes — appreciations between community members'),
      bul('Events — community gatherings, ceremonies, and celebrations'),
      bul('Retrospectives — structured end-of-cycle reviews'),
      bul('Resources — shared commons and stewardship records'),
      div(),

      h2('How the full Saberra system works'),
      p('With Saberra, all of the above is populated automatically from your Google Meet recordings and emails. Sera, the AI assistant built into Saberra, extracts structured records from every meeting and creates draft entries across all databases. A human reviewer approves before anything becomes trusted institutional memory.'),
      p('Sera can then answer questions from your documented records: "What did we decide about the budget in March?" or "Who owns the onboarding process?"'),
      div(),

      h2('Getting started with this template'),
      bul('1. Open each database and review the sample records — they show the schema in action.'),
      bul('2. Delete the sample records and start adding your own.'),
      bul('3. Assign a Memory Admin who reviews the Memory Review Queue weekly (1-2 hours/week).'),
      bul('4. Add relations between databases manually (Tasks -> Profiles, Circles -> Roles, etc.) — see below.'),
      bul('5. When you are ready for AI automation, visit saberra.com to apply for access.'),
      div(),

      h2('Property groups'),
      p('Each database has properties organized into logical sections. To see the sections in Notion, open a database, click the three-dot menu, choose Properties, and drag properties into groups. The groups are documented in each database description.'),
      div(),

      h2('Formulas that activate automatically'),
      bul('Circles - Next Review Date: calculates from Review Cadence + Last Review Date'),
      bul('Roles - Next Audit Date: calculates from Term Length + Last Audit Date'),
      bul('Role Assignments - Next Review Date: calculates from Term Length + Start Date'),
      p('Set the source properties and the calculated date appears automatically — no formula editing required.'),
      div(),

      h2('Where to add relations'),
      p('The full Saberra system links databases together. These relations cannot be created by this template script, but you can add them manually in Notion database settings:'),
      bul('Tasks.Owner -> Profiles'),
      bul('Tasks.Project -> Projects'),
      bul('Tasks.Circle -> Circles'),
      bul('Decision Candidates.Decision Maker -> Profiles'),
      bul('Decision Candidates.Reviewer -> Profiles'),
      bul('Risks.Owner -> Profiles'),
      bul('Risks.Related Decisions -> Decision Candidates'),
      bul('Risks.Related Tasks -> Tasks'),
      bul('Circles.Circle Lead -> Profiles'),
      bul('Circles.Rep Steward -> Profiles'),
      bul('Circles.Parent Circle -> Circles (self-relation)'),
      bul('Roles.Circle -> Circles'),
      bul('Role Assignments.Role -> Roles'),
      bul('Role Assignments.Role Holder -> Profiles'),
      bul('Role Assignments.Circle -> Circles'),
      bul('Projects.Circle -> Circles'),
      bul('Projects.Lead -> Profiles'),
      bul('Memory Review Queue.Reviewer -> Profiles'),
      bul('Canon Change Requests.Reviewer -> Profiles'),
      bul('Canon Change Requests.Affected Roles -> Roles'),
      bul('CCOS Ledger.Circle -> Circles'),
      bul('CCOS Ledger.Role -> Roles'),
      div(),

      h2('Rollup opportunities'),
      p('Once relations are in place, some text fields can be upgraded to rollups that pull data automatically:'),
      bul('Role Assignments.Circle can be a rollup of Role -> Circle (instead of a direct relation)'),
      bul('Tasks can show a Project Status rollup once Tasks -> Projects is wired up'),
      bul('Circles can show Task Count, Decision Count, Risk Count rollups once those relations exist'),
      div(),

      h2('Collapse Health Monitor — view setup'),
      p('The Risks database can serve as a live organizational health dashboard for Collapse Pattern signals. Once relations are wired up, create a dedicated view with the following configuration:'),
      bul('1. Open the Risks database and click + Add a view. Choose Board or Table.'),
      bul('2. Name the view "Collapse Health Monitor".'),
      bul('3. Add a Filter: Category is Collapse Pattern.'),
      bul('4. Add a second Filter: Status is not Closed (to hide resolved patterns).'),
      bul('5. Set Group by: Collapse Pattern Type. Each column or group shows one of the seven patterns.'),
      bul('6. In Properties, show: Risk, Status, Severity, Review Date, Evidence, Related Decisions, Related Tasks, Meeting.'),
      bul('7. Sort by Severity descending so High signals appear first within each group.'),
      p('With this view, each Collapse Pattern type (Burnout, Poor Governance, Financial Fragility, etc.) has its own section. Related Decisions and Related Tasks appear as clickable chips inside each risk record, letting reviewers navigate directly to the contributing records without leaving the view.'),
      p('To clear a pattern from the active view: set Status to Acknowledged (seen, in review) or Mitigated (action taken). Closed removes it permanently. Use Acknowledged when you want to signal awareness without claiming resolution.'),
      div(),

      p('Questions? Email hello@saberra.com or visit saberra.com'),
    ],
  });
  console.log('  Created: Getting Started Guide');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('Creating Saberra template...\n');

  await createGuidePage(PARENT!);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Tasks
  // Target users: all team members, circle leads, Memory Admin
  // Property groups: Core | Assignment | Context | Time | Metadata
  // ──────────────────────────────────────────────────────────────────────────
  const tasksId = await createDb(PARENT!, 'Tasks', {
    // Core
    Task:           title('Short, action-oriented description of the work to be done.'),
    Status:         sel(['Open', 'In Progress', 'Done', 'Cancelled', 'Needs Owner'],
                      'Open = not started; In Progress = underway; Done = complete; Cancelled = no longer needed; Needs Owner = nobody assigned yet.'),
    Priority:       sel(['High', 'Medium', 'Low'],
                      'High = blocking or time-sensitive; Medium = important but not urgent; Low = do when capacity allows.'),
    'Due Date':     date('Target completion date.'),
    // Assignment (text placeholders — link to Profiles/Projects/Circles via relations after setup)
    Owner:          text('Person responsible for completing this task. In Saberra, linked to a Profile record.'),
    Project:        text('Initiative this task belongs to. In Saberra, linked to a Project record.'),
    Circle:         text('Governance circle this task falls under. In Saberra, linked to a Circle record.'),
    // Context
    'Source Evidence': text('Exact quote or paraphrase from the source material where this task was identified.'),
    Notes:          text('Additional context, progress updates, blockers, or relevant links.'),
    'Canon Impact': check('Check if completing this task would require changes to governance documents, roles, or policies.'),
    // Time
    'Estimated Hours': num('Rough estimate of time required to complete this task.'),
    'Completed Date':  date('When this task was marked Done or Cancelled.'),
    // Metadata
    Lifecycle:               sel(['Active', 'Stale', 'Archived'],
                               'Active = currently relevant; Stale = may be outdated or superseded; Archived = no longer tracked.'),
    'Extraction Confidence': sel(['High', 'Medium', 'Low'],
                               'How clearly this task was stated in the source: High = explicit, Medium = inferred, Low = uncertain. In Saberra, set automatically.'),
  }, 'Action items captured from meetings, emails, and decisions. Saberra extracts tasks automatically from meeting transcripts and links them to their source meeting, project, and owners. Property groups: Core | Assignment | Context | Time | Metadata.');

  await addRow(tasksId, {
    Task: T('Document decisions from the leadership retreat'),
    Status: S('Open'), Priority: S('High'), 'Due Date': D(inOneWeek),
    Owner: RT('[Your name]'), Project: RT('Governance Documentation Sprint'),
    'Source Evidence': RT('Leadership retreat, June 2026 - three key decisions were made but not yet formally recorded.'),
    'Canon Impact': CB(true), Lifecycle: S('Active'), 'Extraction Confidence': S('High'),
  });
  await addRow(tasksId, {
    Task: T('Update onboarding guide to reflect new role structure'),
    Status: S('In Progress'), Priority: S('Medium'),
    Owner: RT('[Operations Lead]'), Project: RT('New Member Onboarding Redesign'),
    'Source Evidence': RT('Circle meeting May 14 - agreed the guide is out of date after the March reorganization.'),
    Lifecycle: S('Active'), 'Extraction Confidence': S('High'),
  });
  await addRow(tasksId, {
    Task: T('Confirm renewal terms with legal counsel'),
    Status: S('Needs Owner'), Priority: S('High'), 'Due Date': D(inTwoWeeks),
    'Source Evidence': RT('Email from legal team June 1 - renewal window closes July 31.'),
    'Canon Impact': CB(true), Lifecycle: S('Active'), 'Extraction Confidence': S('Medium'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Decision Candidates
  // Target users: circle leads, governance team, Memory Admin
  // Property groups: Core | Alignment | Attribution | Review | Metadata
  // ──────────────────────────────────────────────────────────────────────────
  const decisionsId = await createDb(PARENT!, 'Decision Candidates', {
    // Core
    Decision:            title('Statement of the decision. Use past tense for confirmed decisions (e.g., "We agreed to..."). Use present tense for candidates.'),
    Status:              sel(['Candidate', 'Confirmed', 'Rejected', 'Needs Clarification'],
                           'Candidate = proposed but not ratified; Confirmed = consented to; Rejected = declined; Needs Clarification = more information required.'),
    'Canon Impact':      check('Check if this decision requires changes to governance documents, roles, or policies.'),
    'Needs Confirmation':check('Check if human review is required before treating this decision as confirmed.'),
    // Alignment
    'Purpose Alignment':       sel(['Aligned', 'Neutral', 'Misaligned', 'Unclear'],
                                 'How well this decision aligns with the governing purpose. In Saberra, assessed automatically.'),
    'Purpose Alignment Notes': text('Brief explanation of the alignment assessment, especially when Misaligned or Unclear.'),
    // Implementation
    'Implementation Status': sel(['Not Started', 'In Progress', 'Complete', 'Abandoned'],
                               'Tracks whether the work required by this decision has been carried out. Default: Not Started.'),
    'Implemented Date':      date('Date this decision was fully implemented. Set manually when Implementation Status reaches Complete.'),
    // Attribution (text placeholders — link to Profiles/Circles/Meetings via relations after setup)
    'Decision Maker':   text('Person or circle that made or proposed this decision. In Saberra, linked to a Profile record.'),
    Reviewer:           text('Person assigned to review this decision. In Saberra, linked to a Profile record.'),
    Circle:             text('Governance circle where this decision was made. In Saberra, linked to a Circle record.'),
    Meeting:            text('Meeting where this decision occurred. In Saberra, linked to a Meeting record.'),
    // Review
    'Source Evidence':  text('Quote or reference from the meeting or email where this decision was recorded.'),
    'Approved Date':    date('Date the decision was formally confirmed or ratified.'),
    // Metadata
    Lifecycle:               sel(['Active', 'Stale', 'Archived'],
                               'Active = recently made or still relevant; Stale = may need revisiting; Archived = historical record only.'),
    'Extraction Confidence': sel(['High', 'Medium', 'Low'],
                               'How confident Sera is in this extraction. In Saberra, set automatically.'),
  }, 'Decisions made, proposed, or awaiting consent. Saberra extracts decisions from meeting transcripts and flags them for human review before they become trusted institutional record. Property groups: Core | Alignment | Attribution | Review | Metadata.');

  await addRow(decisionsId, {
    Decision: T('Team meetings move to Wednesdays at 10am starting July'),
    Status: S('Confirmed'), 'Canon Impact': CB(false), 'Needs Confirmation': CB(false),
    'Decision Maker': RT('Lead Steward'), 'Source Evidence': RT('All-hands meeting June 3 - unanimous consent after proposal from Operations circle.'),
    'Approved Date': D('2026-06-03'), 'Purpose Alignment': S('Neutral'),
    'Implementation Status': S('In Progress'),
    Lifecycle: S('Active'), 'Extraction Confidence': S('High'),
  });
  await addRow(decisionsId, {
    Decision: T('Pause new hiring until Q3 budget review is complete'),
    Status: S('Candidate'), 'Canon Impact': CB(false), 'Needs Confirmation': CB(true),
    'Decision Maker': RT('Finance Steward'),
    'Source Evidence': RT('Finance circle June 5 - proposed in response to slower Q2 revenue. Not yet ratified.'),
    'Purpose Alignment': S('Aligned'),
    'Implementation Status': S('Not Started'),
    Lifecycle: S('Active'), 'Extraction Confidence': S('Medium'),
  });
  await addRow(decisionsId, {
    Decision: T('Adopt consent-based process for all role changes'),
    Status: S('Confirmed'), 'Canon Impact': CB(true), 'Needs Confirmation': CB(false),
    'Source Evidence': RT('Governance circle May 20 - ratified after 2-week proposal period, no unresolved objections.'),
    'Approved Date': D('2026-05-20'), 'Purpose Alignment': S('Aligned'),
    'Implementation Status': S('Complete'), 'Implemented Date': D('2026-06-01'),
    Lifecycle: S('Active'), 'Extraction Confidence': S('High'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Risks
  // Target users: circle leads, Lead Steward, Memory Admin
  // Property groups: Core | Attribution | Evidence Links | Detail | Resolution | Metadata
  // ──────────────────────────────────────────────────────────────────────────
  const risksId = await createDb(PARENT!, 'Risks', {
    // Core
    Risk:       title('Short description of the risk or tension. For Collapse Pattern risks prefix with the pattern name, e.g. "[Burnout] ..." or "[Poor Governance] ...".'),
    Category:   sel(['Operational', 'Financial', 'Legal', 'Governance', 'Interpersonal', 'Technical', 'Collapse Pattern', 'Unknown'],
                  'Type of risk. Use Collapse Pattern for organizational health warning signals (see Collapse Pattern Type).'),
    'Collapse Pattern Type': sel(['No Shared Vision', 'Poor Governance', 'Financial Fragility', 'Interpersonal Conflict', 'Burnout', 'Wrong People', 'Scale Trap'],
                  'Required when Category is Collapse Pattern. Canonical order for reference: 1-No Shared Vision, 2-Poor Governance, 3-Financial Fragility, 4-Interpersonal Conflict, 5-Burnout, 6-Wrong People, 7-Scale Trap.'),
    Severity:   sel(['High', 'Medium', 'Low'],
                  'High = urgent, needs attention now; Medium = monitor closely; Low = track but low urgency. In Saberra, Low severity risks are not extracted automatically.'),
    Status:     sel(['Open', 'Acknowledged', 'Mitigated', 'Accepted', 'Closed'],
                  'Open = unresolved; Acknowledged = seen and in review, not yet actioned (clears it from active view without claiming resolution); Mitigated = action taken; Accepted = tolerable as-is; Closed = no longer active.'),
    // Attribution (text placeholders — link to Profiles/Circles/Meetings via relations after setup)
    Owner:    text('Person responsible for monitoring or mitigating this risk. In Saberra, linked to a Profile record.'),
    Circle:   text('Circle most accountable for this risk. In Saberra, linked to a Circle record.'),
    Meeting:  text('Meeting where this risk was first identified. In Saberra, linked to a Meeting record.'),
    // Evidence Links (text placeholders — convert to relations after setup for clickable chips)
    'Related Decisions': text('Decision Candidates that evidence or contributed to this risk. Link here so reviewers can navigate directly to the decisions signalling this pattern. In Saberra, linked to Decision Candidate records.'),
    'Related Tasks':     text('Tasks created to mitigate or resolve this risk. Keeps mitigation work visible alongside the risk. In Saberra, linked to Task records.'),
    // Detail
    Evidence:            text('Specific evidence from meetings or emails that surfaced this risk.'),
    'Suggested Mitigation': text('Recommended actions to address or reduce this risk.'),
    'Review Date':       date('When this risk should next be reviewed. In Saberra, auto-calculated: High severity = +30 days, Medium = +90 days from extraction date.'),
    // Resolution
    'Resolution Notes': text('What was done to resolve, mitigate, or formally accept this risk.'),
    'Resolved Date':    date('When this risk was closed, mitigated, or formally accepted.'),
    // Metadata
    Lifecycle:               sel(['Active', 'Stale', 'Archived'],
                               'Active = currently relevant; Stale = may be outdated; Archived = historical record only.'),
    'Extraction Confidence': sel(['High', 'Medium', 'Low'],
                               'How confident Sera is in this extraction. In Saberra, set automatically.'),
  }, 'Organizational risks, tensions, and concerns. Saberra flags risks during extraction and routes them for human review before they enter the record. For Collapse Pattern risks, use Related Decisions and Related Tasks to link the contributing records directly. Property groups: Core | Attribution | Evidence Links | Detail | Resolution | Metadata.');

  await addRow(risksId, {
    Risk: T('[Burnout] Two members are the sole holders of financial reporting knowledge'),
    Category: S('Collapse Pattern'), 'Collapse Pattern Type': S('Wrong People'), Severity: S('High'), Status: S('Open'),
    Owner: RT('[Finance Steward]'), Circle: RT('Operations & Finance'),
    Evidence: RT('Identified during onboarding review May 2026. If either person leaves, monthly close stops.'),
    'Suggested Mitigation': RT('Cross-train a second person on Quickbooks and the reporting workflow by end of Q3.'),
    'Review Date': D(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)),
    Lifecycle: S('Active'), 'Extraction Confidence': S('High'),
  });
  await addRow(risksId, {
    Risk: T('[Poor Governance] No formal succession plan exists for the Lead Steward role'),
    Category: S('Collapse Pattern'), 'Collapse Pattern Type': S('Poor Governance'), Severity: S('High'), Status: S('Open'),
    Owner: RT('[Governance Circle]'), Circle: RT('Governance & Coordination'),
    Evidence: RT('Raised as a tension in governance circle April 2026. Role held by one person for 3 years.'),
    'Suggested Mitigation': RT('Draft succession criteria and an interim lead protocol before the next governance review.'),
    'Review Date': D(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)),
    Lifecycle: S('Active'), 'Extraction Confidence': S('High'),
  });
  await addRow(risksId, {
    Risk: T('Annual software contract auto-renews in 30 days at higher rate'),
    Category: S('Financial'), Severity: S('Medium'), Status: S('Open'),
    Owner: RT('[Operations Lead]'), Circle: RT('Operations & Finance'),
    Evidence: RT('Email from vendor June 2 - auto-renewal applies unless cancelled by July 5.'),
    'Suggested Mitigation': RT('Review usage and decide whether to renegotiate, cancel, or accept renewal by June 25.'),
    'Review Date': D(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)),
    Lifecycle: S('Active'), 'Extraction Confidence': S('High'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Memory Review Queue
  // Target users: Memory Admin (primary), Lead Steward
  // Property groups: Core | Content | Risk Analysis | Attribution | Outcome
  // ──────────────────────────────────────────────────────────────────────────
  const mrqId = await createDb(PARENT!, 'Memory Review Queue', {
    // Core
    'Proposed Memory': title('3-10 word label for this memory candidate. Full text lives in Memory Detail.'),
    Status:            sel(['Pending Review', 'Approved', 'Rejected', 'Needs Clarification', 'Archived'],
                         'Pending Review = awaiting decision; Approved = accepted; Rejected = declined; Needs Clarification = more info needed; Archived = historical.'),
    Priority:          sel(['Urgent', 'This Week', 'Backlog'],
                         'Urgent = review immediately; This Week = review soon; Backlog = no rush.'),
    Category:          sel(['Context', 'Relationship', 'Commitment', 'Decision', 'Learning', 'Process', 'Unknown'],
                         'What kind of institutional knowledge this represents.'),
    Confidence:        sel(['High', 'Medium', 'Low'],
                         'High = clearly stated in source; Medium = inferred from context; Low = uncertain.'),
    // Content
    'Memory Detail':     text('Complete proposed memory text, ready to be applied to the appropriate Notion record if approved.'),
    'Source Evidence':   text('Reference to the meeting or email where this information appeared.'),
    // Risk Analysis
    'Risk If Added':     text('What could go wrong if this memory is approved (inaccurate, outdated, sensitive, etc.).'),
    'Risk If Ignored':   text('What organizational knowledge would be lost if this memory is not preserved.'),
    'Suggested Destination': text('Where in Notion this memory should live once approved (e.g., Profiles, Knowledge Base, Circles).'),
    // Attribution (text placeholders)
    Reviewer:  text('Person assigned to review this memory candidate. In Saberra, linked to a Profile record.'),
    Meeting:   text('Meeting this memory came from. In Saberra, linked to a Meeting record.'),
    // Outcome
    'Approved Date':     date('When a reviewer approved this memory candidate.'),
    'Archived At':       date('When this item was archived (rejected or superseded).'),
    'Implemented Link':  url('Link to the Notion record where this memory was applied after approval.'),
  }, 'Facts worth preserving as institutional memory, pending human review. Saberra proposes memory candidates from meetings and emails — a human must approve before anything becomes trusted canon. Property groups: Core | Content | Risk Analysis | Attribution | Outcome.');

  await addRow(mrqId, {
    'Proposed Memory': T('Founding year and location of the organization'),
    'Memory Detail': RT('The organization was founded in 2019 in Diamante Valley, Costa Rica as a regenerative community and social enterprise.'),
    Status: S('Pending Review'), Priority: S('Backlog'), Category: S('Context'), Confidence: S('High'),
    'Source Evidence': RT('Website copy and founding documents reviewed June 2026.'),
  });
  await addRow(mrqId, {
    'Proposed Memory': T('Land partner agreement requires renewal by March 1'),
    'Memory Detail': RT('The partnership agreement with the primary land stewardship partner requires written renewal by March 1 each year. Failure to renew automatically terminates the agreement.'),
    Status: S('Pending Review'), Priority: S('Urgent'), Category: S('Commitment'), Confidence: S('High'),
    'Source Evidence': RT('Contract clause identified in legal review May 2026.'),
    'Risk If Ignored': RT('Partnership lapses and land access is suspended - would halt all field programs.'),
    'Suggested Destination': RT('Profiles record for the partner organization'),
  });
  await addRow(mrqId, {
    'Proposed Memory': T('Consent election process used for Technology Steward role'),
    'Memory Detail': RT('The Technology Steward role was filled using a consent election in March 2026. Two rounds were needed: one objection was resolved by modifying the term from 1 year to 6 months. First time consent election was used for a technical role.'),
    Status: S('Pending Review'), Priority: S('Backlog'), Category: S('Learning'), Confidence: S('High'),
    'Source Evidence': RT('Governance circle notes March 15, 2026.'),
    'Suggested Destination': RT('Knowledge Base - Governance process'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Profiles
  // Target users: all team members, CRM users
  // Property groups: Identity | Contact | Context | History | CRM
  // ──────────────────────────────────────────────────────────────────────────
  const profilesId = await createDb(PARENT!, 'Profiles', {
    // Identity
    Name:                   title('Full name of the person or organization.'),
    'Profile Type':         sel(['Person', 'Organization', 'Both'],
                              'Person, Organization, or Both (for individuals who also represent an org).'),
    'Engagement Status':    sel(['Active', 'Inactive', 'Prospect', 'Unknown'],
                              'Current relationship status with the organization.'),
    'Relationship to Org':  sel(['Member', 'Partner', 'Vendor', 'Advisor', 'Funder', 'Contact', 'Community', 'Alumni', 'Government', 'Unknown'],
                              'The role this person or org plays in relation to your organization.'),
    'Membership Type':      sel(['Founding Member', 'Full Member', 'Associate Member', 'Guest', 'Steward', 'Partner'],
                              'Membership tier. In Saberra, extracted only when explicitly stated in source material.'),
    'Primary Sector':       sel([
                              'Sector 1 - Health & Holistic Wellness',
                              'Sector 2 - Governance & Justice',
                              'Sector 3 - Culture & Spirit',
                              'Sector 4 - Learning & Innovation',
                              'Sector 5 - Ecology & Infrastructure',
                              'Sector 6 - Economy & Exchange',
                              'Sector 7 - Media & Technology',
                            ], 'Which of the 7 sectors this person or org operates in.'),
    // Contact
    'Role / Title':         text('Job title, role, or function.'),
    Tags:                   msel(['Leadership', 'Legal', 'Finance', 'Agriculture', 'Education', 'Communications', 'Operations', 'Governance', 'Technical', 'Community', 'Land Stewardship', 'Fundraising'],
                              'Functional areas this person is involved in.'),
    Email:                  emailProp('Primary email address. In Saberra, used to match incoming emails to this profile.'),
    Location:               text('City, country, or region.'),
    // Context
    'Context Summary':      text('Key context that should be known about this person or org. Visible to Sera for AI answers.'),
    'Admin Notes':          text('Internal notes for admin use only — not included in AI context.'),
    'Sensitive Notes Flag': check('Check if this profile contains sensitive personal information requiring restricted access.'),
    // History
    'First Seen':           date('Date this person or org first appeared in records.'),
    'Last Seen':            date('Most recent date they appeared in a meeting or email.'),
    Source:                 text('Where this profile was first identified (email, meeting, manual entry).'),
    // CRM
    'Lead Stage':           sel(['New Lead', 'Qualified', 'Engaged', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Not a Lead'],
                              'CRM funnel stage if this is a potential partner, funder, or client.'),
    'Lead Source':          sel(['Referral', 'Email', 'Meeting', 'Event', 'Website', 'Social Media', 'Partner', 'Unknown'],
                              'How this lead was originally acquired.'),
    'Next Action':          text('What should happen next with this person or org.'),
    'Follow-up Date':       date('When to follow up.'),
    'Follow-up Owner':      text('Who is responsible for the next action.'),
  }, 'People and organizations your team interacts with. Saberra creates and enriches profiles automatically from meeting participants and email contacts. Property groups: Identity | Contact | Context | History | CRM.');

  await addRow(profilesId, {
    Name: T('[Your Lead Steward Name]'),
    'Profile Type': S('Person'), 'Engagement Status': S('Active'), 'Relationship to Org': S('Member'),
    'Role / Title': RT('Lead Steward'), Tags: MS('Leadership', 'Governance'),
    'Context Summary': RT('Co-founder. Holds the vision and external relationships. Longest-tenured member.'),
    'First Seen': D('2019-01-01'), 'Last Seen': D(today),
  });
  await addRow(profilesId, {
    Name: T('[Sample Partner Organization]'),
    'Profile Type': S('Organization'), 'Engagement Status': S('Active'), 'Relationship to Org': S('Partner'),
    Tags: MS('Land Stewardship'),
    'Context Summary': RT('Land partnership agreement since 2020. Annual renewal required by March 1.'),
    'First Seen': D('2020-03-01'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Projects
  // Target users: all team members, project leads
  // Property groups: Core | Team | Schedule | Content
  // ──────────────────────────────────────────────────────────────────────────
  const projectsId = await createDb(PARENT!, 'Projects', {
    // Core
    'Project Name': title('Short descriptive name for the initiative.'),
    Status:         sel(['Proposed', 'Active', 'On Hold', 'Complete', 'Cancelled'],
                      'Current state of the project.'),
    Priority:       sel(['High', 'Medium', 'Low'],
                      'Relative importance compared to other active projects.'),
    // Team (text placeholders)
    'Project Lead': text('Person responsible for this project. In Saberra, linked to a Profile record.'),
    Circle:         text('Governance circle this project belongs to. In Saberra, linked to a Circle record.'),
    // Schedule
    'Start Date':       date('When work began or is planned to begin.'),
    'Target Date':      date('Expected completion date.'),
    'Completed Date':   date('Actual completion date.'),
    // Content
    Description:        text('Full description of project scope, goals, and success criteria.'),
    'Completion Notes': text('Outcomes, lessons learned, or handoff information.'),
    Source:             text('Where this project was identified or proposed.'),
  }, 'Named initiatives and their current status. Saberra identifies projects during extraction and groups related tasks, decisions, and risks under each project. Property groups: Core | Team | Schedule | Content.');

  await addRow(projectsId, {
    'Project Name': T('Governance Documentation Sprint'),
    Status: S('Active'), Priority: S('High'), 'Project Lead': RT('[Governance Circle Lead]'),
    Circle: RT('Governance & Coordination'), 'Start Date': D('2026-05-01'), 'Target Date': D('2026-07-31'),
    Description: RT('Formally document all circle charters, role cards, and decision rights before the annual governance review.'),
  });
  await addRow(projectsId, {
    'Project Name': T('New Member Onboarding Redesign'),
    Status: S('Proposed'), Priority: S('Medium'), Circle: RT('Learning & Innovation'),
    Description: RT('Redesign the 90-day onboarding journey to reflect the current role structure and introduce new members to Saberra.'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Circles
  // Target users: governance team, all members
  // Property groups: Identity | Leadership | Charter | Operations | Review | Notes
  // ──────────────────────────────────────────────────────────────────────────
  const circlesId = await createDb(PARENT!, 'Circles', {
    // Identity
    'Circle Name': title('Official name of this governance circle.'),
    Status:        sel(['Active', 'Proposed', 'Inactive', 'Archived'],
                     'Active = operating; Proposed = awaiting ratification; Inactive = paused; Archived = dissolved.'),
    Sector:        sel([
                     'Sector 1 - Health & Holistic Wellness',
                     'Sector 2 - Governance & Justice',
                     'Sector 3 - Culture & Spirit',
                     'Sector 4 - Learning & Innovation',
                     'Sector 5 - Ecology & Infrastructure',
                     'Sector 6 - Economy & Exchange',
                     'Sector 7 - Media & Technology',
                   ], 'Which of the 7 sectors this circle belongs to.'),
    // Leadership (text placeholders — link to Profiles via relations after setup)
    'Circle Lead':   text('Lead facilitator and governance accountability holder for this circle. In Saberra, linked to a Profile record.'),
    'Rep Steward':   text('Representative to the broader governance structure. In Saberra, linked to a Profile record.'),
    'Parent Circle': text('Circle this circle is nested within, if applicable. In Saberra, a self-relation.'),
    // Charter
    Purpose:          text('One or two sentence statement of why this circle exists - its evolutionary purpose.'),
    Domains:          text('Areas of authority this circle owns exclusively. No other circle can act here without consent.'),
    Accountabilities: text('Ongoing responsibilities this circle must fulfill, expressed as continuous present-tense verbs.'),
    KPIs:             text('Key metrics used to assess circle health, impact, and contribution to the governing purpose.'),
    // Operations
    'Meeting Cadence': text('How often this circle meets (e.g., "Weekly Mondays 10am", "Bi-weekly").'),
    // Review
    'Review Cadence':  sel(['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed'],
                         'How often the circle charter should be formally reviewed and updated.'),
    'Last Review Date': date('Date of the most recent charter review.'),
    'Next Review Date': formula(REVIEW_DATE_BY_CADENCE('Review Cadence', 'Last Review Date'),
                         'Calculated: next review due based on Review Cadence + Last Review Date. Set both to activate this formula.'),
    // Notes
    Notes:             text('Internal notes about this circle - context, history, or operating agreements.'),
  }, 'Self-managing governance circles with purpose, domains, and accountabilities. Saberra updates circle records automatically when governance discussions are captured. Formula: Next Review Date keys off Review Cadence + Last Review Date. Property groups: Identity | Leadership | Charter | Operations | Review | Notes.');

  await addRow(circlesId, {
    'Circle Name': T('Governance & Coordination'),
    Status: S('Active'), 'Circle Lead': RT('[Lead Steward Name]'),
    Purpose: RT('To steward the organizational governance system, ensure role clarity, and support consent-based decision-making across all circles.'),
    Domains: RT('Governance process; Role definitions; Circle charters; Decision rights records'),
    Accountabilities: RT('Facilitating governance meetings; Maintaining role cards; Resolving cross-circle tensions; Tracking governance decisions'),
    'Meeting Cadence': RT('Bi-weekly'), 'Review Cadence': S('Quarterly'), 'Last Review Date': D('2026-04-01'),
  });
  await addRow(circlesId, {
    'Circle Name': T('Operations & Finance'),
    Status: S('Active'),
    Purpose: RT('To manage day-to-day operations, financial stewardship, and organizational infrastructure.'),
    Accountabilities: RT('Monthly financial close; Vendor relationships; Payroll; Team logistics'),
    'Meeting Cadence': RT('Weekly'), 'Review Cadence': S('Quarterly'),
  });
  await addRow(circlesId, {
    'Circle Name': T('Learning & Innovation'),
    Status: S('Active'),
    Purpose: RT('To steward the knowledge, skills, and learning culture of the organization.'),
    Accountabilities: RT('Onboarding; Internal training; Knowledge management; Tool evaluation; Saberra stewardship'),
    'Meeting Cadence': RT('Monthly'), 'Review Cadence': S('Semi-Annual'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Roles
  // Target users: all members, governance team
  // Property groups: Identity | Charter | Governance | Review | Notes
  // ──────────────────────────────────────────────────────────────────────────
  const rolesId = await createDb(PARENT!, 'Roles', {
    // Identity
    'Role Name':     title('Official name of this role as it appears in the governance system.'),
    Status:          sel(['Active', 'Proposed', 'Vacant', 'Archived'],
                       'Active = currently filled; Proposed = awaiting ratification; Vacant = unfilled; Archived = dissolved.'),
    'Role Type':     sel(['Lead Steward', 'Rep Steward', 'Admin Facilitator', 'AI Secretary', 'Custom Role'],
                       'Lead Steward = circle lead; Rep Steward = cross-circle rep; Admin Facilitator = meeting facilitator; AI Secretary = Sera integration role; Custom Role = other.'),
    Circle:          text('Circle this role belongs to. In Saberra, linked to a Circle record.'),
    // Charter
    Purpose:          text('Why this role exists - the unique contribution it makes to the circle.'),
    Domains:          text('Areas of authority this role holds exclusively within its circle.'),
    Accountabilities: text('Ongoing responsibilities the role holder must fulfill, as continuous present-tense verbs.'),
    // Governance
    'Term Length':       sel(['No Term', '3 Months', '6 Months', '1 Year', 'Custom'],
                           'How long this role assignment lasts before requiring re-election or review.'),
    'Assignment Method': sel(['Consent Election', 'Appointed', 'Volunteer', 'Interim'],
                           'How this role is filled.'),
    // Review
    'Last Audit Date': date('Date of the most recent role audit or review.'),
    'Next Audit Date': formula(REVIEW_DATE_BY_TERM('Term Length', 'Last Audit Date'),
                         'Calculated: next audit due based on Term Length + Last Audit Date. Set both to activate this formula.'),
    // Notes
    Notes:  text('Internal notes about this role - history, context, or governance agreements.'),
    Source: text('Where this role definition originated (governance meeting, founding document, etc.).'),
  }, 'Role cards defining purpose, accountabilities, and domains. Saberra extracts role definitions from governance discussions and links them to current role holders. Formula: Next Audit Date keys off Term Length + Last Audit Date. Property groups: Identity | Charter | Governance | Review | Notes.');

  await addRow(rolesId, {
    'Role Name': T('Lead Steward'), Circle: RT('Governance & Coordination'),
    'Role Type': S('Lead Steward'), Status: S('Active'),
    Purpose: RT('To hold the organization\'s vision, represent it externally, and ensure governance processes are healthy.'),
    Domains: RT('External relationships; Final governance escalation; Annual strategy'),
    Accountabilities: RT('Representing the organization externally; Ensuring governance health; Legal compliance'),
    'Term Length': S('1 Year'), 'Assignment Method': S('Consent Election'), 'Last Audit Date': D('2026-01-15'),
  });
  await addRow(rolesId, {
    'Role Name': T('Finance Steward'), Circle: RT('Operations & Finance'),
    'Role Type': S('Custom Role'), Status: S('Active'),
    Purpose: RT('To steward the financial health and transparency of the organization.'),
    Accountabilities: RT('Monthly financial close; Budget management; Payroll; Audit readiness'),
    'Term Length': S('1 Year'), 'Assignment Method': S('Consent Election'), 'Last Audit Date': D('2026-01-15'),
  });
  await addRow(rolesId, {
    'Role Name': T('Memory Admin'), Circle: RT('Learning & Innovation'),
    'Role Type': S('Custom Role'), Status: S('Active'),
    Purpose: RT('To steward the institutional memory system, review AI-proposed records, and ensure knowledge is accurate and accessible.'),
    Accountabilities: RT('Weekly review queue; Approving memory candidates; Training team on knowledge capture; Coordinating with Saberra'),
    'Term Length': S('6 Months'), 'Assignment Method': S('Volunteer'), 'Last Audit Date': D('2026-06-01'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Role Assignments
  // Target users: governance team, all members
  // Property groups: Core | Role | Term | Context
  // ──────────────────────────────────────────────────────────────────────────
  const assignmentsId = await createDb(PARENT!, 'Role Assignments', {
    // Core
    'Assignment Title': title('Auto-formatted as "{Holder Name} - {Role Name}". Used for dedup in Saberra.'),
    Status:             sel(['Active', 'Delegated', 'Completed', 'Suspended'],
                          'Active = currently serving; Delegated = responsibility passed temporarily; Completed = term ended; Suspended = paused.'),
    'Assignment Type':  sel(['Consent Election', 'Appointed', 'Interim', 'Volunteer'],
                          'How this assignment was made.'),
    // Role (text placeholders)
    Role:         text('Role being assigned. In Saberra, linked to a Role record.'),
    'Role Holder':text('Person holding this role. In Saberra, linked to a Profile record.'),
    Circle:       text('Circle this assignment is in. In Saberra, can be a rollup of Role -> Circle.'),
    // Term
    'Start Date':         date('When this assignment began.'),
    'End Date':           date('When this assignment ended or will end. Leave blank if ongoing.'),
    'Term Length':        sel(['No Term', '3 Months', '6 Months', '1 Year', 'Custom'],
                            'Agreed duration for this assignment.'),
    'Energization Level': sel(['Energized', 'Willing', 'Unwilling'],
                            'How the role holder feels in this role. In Saberra, extracted only when explicitly stated.'),
    'Next Review Date': formula(REVIEW_DATE_BY_TERM('Term Length', 'Start Date'),
                          'Calculated: when this assignment should be reviewed or renewed. Set Start Date and Term Length to activate.'),
    // Context
    'Source Evidence': text('Reference to the meeting or document where this assignment was formally recorded.'),
    Notes:             text('Notes about this assignment - conditions, context, or delegation details.'),
  }, 'Who holds which role, and when. Saberra extracts role assignments from governance meetings and updates them automatically when changes are mentioned. Formula: Next Review Date keys off Term Length + Start Date. Property groups: Core | Role | Term | Context.');

  await addRow(assignmentsId, {
    'Assignment Title': T('[Lead Name] - Lead Steward'),
    Status: S('Active'), 'Assignment Type': S('Consent Election'),
    Role: RT('Lead Steward'), 'Role Holder': RT('[Lead Name]'), Circle: RT('Governance & Coordination'),
    'Start Date': D('2026-01-15'), 'Term Length': S('1 Year'),
    'Source Evidence': RT('Consent election held January 15, 2026. No objections raised.'),
  });
  await addRow(assignmentsId, {
    'Assignment Title': T('[Finance Name] - Finance Steward'),
    Status: S('Active'), 'Assignment Type': S('Consent Election'),
    Role: RT('Finance Steward'), 'Role Holder': RT('[Finance Name]'), Circle: RT('Operations & Finance'),
    'Start Date': D('2026-01-15'), 'Term Length': S('1 Year'),
  });
  await addRow(assignmentsId, {
    'Assignment Title': T('[Admin Name] - Memory Admin'),
    Status: S('Active'), 'Assignment Type': S('Volunteer'),
    Role: RT('Memory Admin'), 'Role Holder': RT('[Admin Name]'), Circle: RT('Learning & Innovation'),
    'Start Date': D('2026-06-01'), 'Term Length': S('6 Months'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Canon Change Requests
  // Target users: Memory Admin, governance team
  // Property groups: Core | Content | Attribution | Outcome
  // ──────────────────────────────────────────────────────────────────────────
  const canonId = await createDb(PARENT!, 'Canon Change Requests', {
    // Core
    'Proposed Change':       title('3-10 word label for the proposed change. Full text lives in Change Detail.'),
    Status:                  sel(['Pending Review', 'Approved', 'Rejected', 'Needs Clarification', 'Implemented', 'Archived'],
                               'Pending Review = awaiting decision; Approved = accepted; Rejected = declined; Needs Clarification; Implemented = applied; Archived = historical.'),
    'Affected Canon Area':   sel(['Governing Purpose', 'Policy', 'Circle Definition', 'Role Definition', 'Decision Rights', 'Legal Commitment', 'Financial Commitment', 'Land Stewardship', 'CCOS Ledger', 'Public Commitment', 'Unknown'],
                               'Which part of governance canon this change would affect.'),
    'Extraction Confidence': sel(['High', 'Medium', 'Low'],
                               'How confident Sera is in this extraction. In Saberra, set automatically.'),
    // Content
    'Change Detail':    text('Complete description of the proposed change to a governance document, policy, or canon record.'),
    Reason:             text('Why this change is being proposed - the tension or gap it addresses.'),
    'Source Evidence':  text('Where this proposed change originated (meeting, email, governance discussion).'),
    // Attribution (text placeholders)
    Reviewer:       text('Person assigned to review this change request. In Saberra, linked to a Profile record.'),
    Circle:         text('Circle most responsible for this canon area. In Saberra, linked to a Circle record.'),
    'Affected Role':text('Role most affected by this change. In Saberra, linked to a Role record.'),
    // Outcome
    'Approved Date':      date('Date this change was formally approved.'),
    'Implemented By':     text('Name or reference of who applied the change to the governance documents.'),
    'Implementation Link':url('Link to the updated governance document or Notion record that was changed.'),
  }, 'Proposed changes to governance documents, policies, and role definitions. All canon changes require human review and approval before being implemented - Saberra never applies changes automatically. Property groups: Core | Content | Attribution | Outcome.');

  await addRow(canonId, {
    'Proposed Change': T('Add Memory Admin to Governance circle accountabilities'),
    'Change Detail': RT('Formally recognize the Memory Admin role as part of the Governance & Coordination circle accountabilities, with explicit authority to approve or reject AI-proposed memory candidates.'),
    'Affected Canon Area': S('Circle Definition'), Status: S('Pending Review'),
    Reason: RT('Role is operating informally. Formalizing it clarifies accountability and prevents review queue backlog.'),
    'Source Evidence': RT('Raised in governance circle June 3, 2026.'),
    'Extraction Confidence': S('High'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. CCOS Ledger
  // Target users: governance team
  // Property groups: Core | Attribution | Detail | Resolution
  // ──────────────────────────────────────────────────────────────────────────
  const ledgerId = await createDb(PARENT!, 'CCOS Ledger', {
    // Core
    'Ledger Entry':   title('Short title describing this governance action, tension, proposal, or decision.'),
    'Ledger Type':    sel(['Tension', 'Proposal', 'Decision', 'Role', 'Policy', 'Resource', 'Accountability'],
                        'Tension = issue raised; Proposal = change suggested; Decision = resolution; Role/Policy/Resource/Accountability = governance record.'),
    Status:           sel(['Draft', 'Pending Review', 'Approved', 'Resolved', 'Archived'],
                        'Draft = unreviewed; Pending Review = ready for governance; Approved = accepted; Resolved = addressed; Archived = historical.'),
    'Review Required':check('Check if this entry needs formal discussion at a governance meeting.'),
    // Attribution (text placeholders)
    Circle: text('Circle responsible for this entry. In Saberra, linked to a Circle record.'),
    Role:   text('Role most relevant to this entry. In Saberra, linked to a Role record.'),
    // Detail
    Evidence:          text('Source material (meeting notes, email) where this entry was identified.'),
    'Approved By':     text('Name of the person or circle that approved this entry.'),
    'Approved Date':   date('Date of formal approval.'),
    // Resolution
    'Resolution Notes': text('How this tension or proposal was addressed or resolved.'),
    'Resolved Date':    date('When this entry was formally closed.'),
  }, 'Governance actions: tensions raised, proposals made, decisions logged. Saberra extracts ledger entries from governance meetings and flags them for review. Property groups: Core | Attribution | Detail | Resolution.');

  await addRow(ledgerId, {
    'Ledger Entry': T('Tension: Onboarding process does not reflect current role structure'),
    'Ledger Type': S('Tension'), Status: S('Draft'), 'Review Required': CB(true),
    Circle: RT('Learning & Innovation'),
    Evidence: RT('Raised by two new members in separate check-ins. Current onboarding references roles reorganized in March.'),
  });
  await addRow(ledgerId, {
    'Ledger Entry': T('Proposal: Move all governance meetings to async-first format'),
    'Ledger Type': S('Proposal'), Status: S('Pending Review'), 'Review Required': CB(true),
    Circle: RT('Governance & Coordination'),
    Evidence: RT('Proposed in governance circle May 28. Motivation: reduce meeting fatigue, allow distributed participation.'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Knowledge Base
  // Target users: all members
  // Property groups: Identity | Content | Metadata
  // ──────────────────────────────────────────────────────────────────────────
  const kbId = await createDb(PARENT!, 'Knowledge Base', {
    // Identity
    'KB Title':  title('Short, descriptive title for this knowledge item.'),
    Status:      sel(['Draft', 'Published', 'Archived'],
                   'Draft = in progress; Published = approved for use; Archived = no longer current.'),
    Category:    sel(['How-To', 'Best Practice', 'Process', 'Technology', 'Governance', 'Community', 'Land & Ecology', 'Finance', 'Learning', 'Wellness', 'General'],
                   'Topic area this knowledge belongs to.'),
    Audience:    msel(['All Members', 'Leadership', 'New Members', 'Circle Leads', 'Tech Team'],
                   'Who this knowledge item is most relevant for.'),
    Confidence:  sel(['High', 'Medium'],
                   'High = verified and reliable; Medium = AI-extracted, may need review.'),
    // Content
    Summary:    text('One or two sentence description of what this item covers.'),
    'Key Points': text('Numbered or bulleted main takeaways.'),
    Source:     text('Where this knowledge came from (meeting, email, manual entry).'),
    // Metadata
    'Possible Duplicate Of': text('Link or name of a possibly similar KB article to check before publishing.'),
    'Last Enriched At':      date('When this article was last updated with new information.'),
    'Published At':          date('When this article was approved and made available.'),
  }, 'Reusable guides, processes, and best practices. Saberra extracts KB articles when emails or meetings contain clear how-to information, then routes them for human review. Property groups: Identity | Content | Metadata.');

  await addRow(kbId, {
    'KB Title': T('How to submit items for the governance agenda'),
    Category: S('Governance'), Audience: MS('All Members'), Status: S('Published'), Confidence: S('High'),
    Summary: RT('Step-by-step process for raising a tension or proposal for the next governance meeting.'),
    'Key Points': RT('1. Write a one-sentence description of the tension\n2. Email it to the Memory Admin or add it to the CCOS Ledger as a Draft\n3. It will appear in the next governance agenda\n4. Come prepared to describe the tension - you do not need to propose a solution'),
    Source: RT('Governance circle documentation, June 2026'),
  });
  await addRow(kbId, {
    'KB Title': T('Monthly financial close process'),
    Category: S('Finance'), Audience: MS('Leadership'), Status: S('Published'), Confidence: S('High'),
    Summary: RT('Steps the Finance Steward follows to close monthly books and distribute the financial report.'),
    'Key Points': RT('1. Export transactions from banking by the 5th of the month\n2. Reconcile in Quickbooks\n3. Generate P&L and balance sheet\n4. Share with Lead Steward and Governance circle\n5. File signed copy in Notion'),
    Source: RT('Finance Steward documentation, May 2026'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Messages
  // Target users: Memory Admin, team leads
  // Property groups: Core | Content | Classification
  // ──────────────────────────────────────────────────────────────────────────
  const messagesId = await createDb(PARENT!, 'Messages', {
    // Core
    'Message Title':   title('Auto-generated or AI-summarized title for this message.'),
    Urgency:           sel(['High', 'Medium', 'Low'],
                         'Priority level based on content, language, and deadlines mentioned.'),
    'Follow-Up Needed':check('Check if someone needs to respond to or act on this message.'),
    'Emotional Tone':  sel(['Neutral', 'Positive', 'Tense', 'Urgent', 'Unclear'],
                         'AI-assessed tone of the message.'),
    Date:              date('Date the message was sent or received.'),
    // Content
    Sender:      text('Sender name or email. In Saberra, linked to a Profile record.'),
    Recipients:  text('Comma-separated recipient email addresses.'),
    Summary:     text('AI-generated summary of the message content.'),
    Requests:    text('Specific asks or action requests extracted from the message.'),
    Commitments: text('Promises or commitments made in the message.'),
    Questions:   text('Open questions raised that need a response.'),
    // Classification
    'Confidentiality Level': sel(['Standard', 'Sensitive', 'Restricted'],
                               'Standard = normal circulation; Sensitive = limit distribution; Restricted = admin only.'),
    'Processing Status':     sel(['Pending', 'Processed', 'Failed', 'Manual Review'],
                               'Pipeline state for this message record.'),
  }, 'Emails, notes, and communications that have been captured and summarized. Saberra processes messages automatically when sent to the dedicated inbox and extracts structured records. Property groups: Core | Content | Classification.');

  await addRow(messagesId, {
    'Message Title': T('Partnership renewal terms from legal counsel'),
    Urgency: S('High'), 'Follow-Up Needed': CB(true), 'Emotional Tone': S('Neutral'),
    Date: D('2026-06-01'), Sender: RT('legal@partnerfirm.com'),
    Summary: RT('Legal counsel confirms auto-renewal terms for land partnership. Renewal window closes July 5 unless written cancellation is submitted.'),
    Requests: RT('Confirm whether to renew, renegotiate, or cancel by June 20 so they have time to prepare documentation.'),
    'Confidentiality Level': S('Standard'), 'Processing Status': S('Processed'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Community layer (14-19): Tensions, Agreements, Gratitudes, Events,
  // Retrospectives, Resources — gated on COMMUNITY_LAYER env var.
  // ──────────────────────────────────────────────────────────────────────────
  const communityLayer = process.env.COMMUNITY_LAYER !== 'false';
  let tensionsId:   string | undefined;
  let agreementsId: string | undefined;
  let gratitudesId: string | undefined;
  let eventsId:     string | undefined;
  let retrosId:     string | undefined;
  let resourcesId:  string | undefined;

  if (communityLayer) {
  // 14. Tensions
  tensionsId = await createDb(PARENT!, 'Tensions', {
    Tension:        title('One-sentence statement of the gap between what is and what could be.'),
    Type:           sel(['Governance', 'Operational', 'Relational', 'Structural'],
                      'Governance = process/authority gap; Operational = workflow gap; Relational = people gap; Structural = design gap.'),
    Status:         sel(['Open', 'In Process', 'Resolved', 'Accepted'],
                      'Current state of this tension.'),
    'Sensed By':    text('Person who named this tension. In Saberra, linked to a Profile record.'),
    'Sensing Circle': text('Circle where this tension surfaced. In Saberra, linked to a Circle record.'),
    'Source Evidence': text('Quote or context from the meeting or email where this tension was raised.'),
    'Resolution Notes': text('How this tension was addressed or resolved.'),
    'Resolved Date':   date('When this tension was formally closed.'),
  }, 'Named gaps between current reality and what is possible. Tensions are signals for change, distinct from risks (external threats) and decisions (resolved choices). Saberra extracts tensions when someone explicitly names a problem or gap.');

  await addRow(tensionsId, {
    Tension: T('Our onboarding process does not reflect the current role structure'),
    Type: S('Operational'), Status: S('Open'), 'Sensed By': RT('[New Member Name]'),
    'Sensing Circle': RT('Learning & Innovation'),
    'Source Evidence': RT('Raised by two new members in separate check-ins. Current guide references roles reorganized in March.'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Agreements
  // Target users: all members, circle leads
  // ──────────────────────────────────────────────────────────────────────────
  agreementsId = await createDb(PARENT!, 'Agreements', {
    'Agreement Title': title('3-8 word name for this ongoing commitment.'),
    Terms:        text('Full statement of what was agreed and what it means in practice.'),
    Parties:      text('Names of people or circles involved. In Saberra, linked to Profile records.'),
    Circles:      text('Circles involved in or affected by this agreement. In Saberra, linked to Circle records.'),
    Type:         sel(['Interpersonal', 'Inter-Circle', 'External', 'Org-Wide'],
                    'Scope of this agreement.'),
    Status:       sel(['Active', 'Paused', 'Completed', 'Dissolved'],
                    'Current state of this agreement.'),
    'Effective Date': date('When this agreement came into force.'),
    'Review Date':    date('When this agreement should be revisited.'),
    'Source Evidence': text('Where this agreement was made (meeting, email, governance session).'),
  }, 'Ongoing commitments between people or circles. Distinct from tasks (one-time actions) and decisions (choices made). An agreement has ongoing force: "Circle A will always consult Circle B before X." Saberra extracts agreements from governance discussions.');

  await addRow(agreementsId, {
    'Agreement Title': T('Finance circle provides monthly report to all stewards'),
    Terms: RT('The Finance circle will distribute a one-page P&L and balance sheet to all circle leads by the 10th of each month.'),
    Parties: RT('Finance Steward, All Circle Leads'),
    Type: S('Inter-Circle'), Status: S('Active'), 'Effective Date': D('2026-01-01'),
    'Review Date': D('2026-12-31'),
    'Source Evidence': RT('All-hands meeting January 2026 - proposed by Finance Steward, consented to unanimously.'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 16. Gratitudes
  // Target users: all members
  // ──────────────────────────────────────────────────────────────────────────
  gratitudesId = await createDb(PARENT!, 'Gratitudes', {
    Appreciation: title('One or two sentence description of what the person is being appreciated for.'),
    From:         text('Name of the person giving appreciation. In Saberra, linked to a Profile record.'),
    To:           text('Name of the person being appreciated. In Saberra, linked to a Profile record.'),
    Circle:       text('Circle context where this was expressed. In Saberra, linked to a Circle record.'),
    Date:         date('When this appreciation was expressed.'),
    'Source Evidence': text('Meeting or email where this gratitude appeared.'),
  }, 'Appreciations between community members. Saberra extracts gratitudes when someone says "I want to appreciate", "I am grateful to", or "thank you to X for Y". Both giver and receiver must be named.');

  await addRow(gratitudesId, {
    Appreciation: T('Helped three new members navigate their first governance meeting with patience and clear explanations.'),
    From: RT('[Member Name]'), To: RT('[Recipient Name]'), Circle: RT('Governance & Coordination'),
    Date: D(today),
    'Source Evidence': RT('Governance circle check-in, June 2026.'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 17. Events
  // Target users: all members, event organizers
  // ──────────────────────────────────────────────────────────────────────────
  eventsId = await createDb(PARENT!, 'Events', {
    'Event Name':   title('Name of the community gathering or celebration.'),
    Type:           sel(['Community Dinner', 'Ceremony', 'Workshop', 'Learning Circle', 'Celebration', 'Work Party', 'Retreat', 'Other'],
                      'Type of community event. Does not include governance meetings (those are in Meetings database).'),
    Status:         sel(['Planned', 'In Progress', 'Complete', 'Cancelled'],
                      'Current state of this event.'),
    Date:           date('Event start date.'),
    'End Date':     date('Event end date (for multi-day events).'),
    Location:       text('Where the event takes place.'),
    Description:    text('Brief description of the event and its purpose.'),
    'Organizing Circle': text('Circle responsible for this event. In Saberra, linked to a Circle record.'),
    Organizer:      text('Person leading this event. In Saberra, linked to a Profile record.'),
    'Source Evidence': text('Where this event was announced or documented.'),
  }, 'Community gatherings, ceremonies, and celebrations. Does not include governance meetings. Saberra extracts events when a specific named gathering is announced or described.');

  await addRow(eventsId, {
    'Event Name': T('Summer Solstice Community Gathering'),
    Type: S('Ceremony'), Status: S('Planned'),
    Date: D(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)),
    Location: RT('Main gathering space'),
    Description: RT('Annual solstice ceremony and community dinner. Open to all members and guests.'),
    'Organizing Circle': RT('Governance & Coordination'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 18. Retrospectives
  // Target users: circle leads, all members
  // ──────────────────────────────────────────────────────────────────────────
  retrosId = await createDb(PARENT!, 'Retrospectives', {
    Title:          title('Name of this retrospective, e.g. "Governance Circle Q2 2026 Retrospective".'),
    Circle:         text('Circle that held this retrospective. In Saberra, linked to a Circle record.'),
    'Retro Date':   date('Date the retrospective was held.'),
    'Period Covered': text('Time period reviewed, e.g. "Q2 2026" or "May-June 2026".'),
    'What Worked':  text('2-5 sentences on what went well during this period.'),
    'What Did Not Work': text('2-5 sentences on what fell short or caused friction.'),
    'What to Change': text('Concrete proposals for the next period.'),
    'Energy Level': sel(['High', 'Good', 'Neutral', 'Low', 'Critical'],
                      'Overall team energy at the time of this retrospective.'),
    Celebrations:   text('Specific things worth celebrating from this period.'),
    'Source Evidence': text('Meeting or document where this retrospective was held.'),
  }, 'Structured end-of-cycle reviews. Only extracted when a meeting or document is explicitly formatted as a retrospective (what worked / what did not work / what to change). Saberra extracts retrospectives from structured meeting notes.');

  await addRow(retrosId, {
    Title: T('Governance Circle Q2 2026 Retrospective'),
    Circle: RT('Governance & Coordination'), 'Retro Date': D(today),
    'Period Covered': RT('April - June 2026'),
    'What Worked': RT('Consent elections ran smoothly for two new roles. Documentation sprint made real progress. New members report feeling clearer about how decisions are made.'),
    'What Did Not Work': RT('Meeting prep documents were often shared less than 24 hours before. Agenda overruns happened 3 out of 6 meetings.'),
    'What to Change': RT('Share prep docs 48 hours in advance. Add a 5-minute time-check at the halfway point of each meeting.'),
    'Energy Level': S('Good'),
    Celebrations: RT('First consent election completed with objection resolved gracefully. KB article on governance process published and well-received.'),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 19. Resources
  // Target users: stewards, circle leads, all members
  // ──────────────────────────────────────────────────────────────────────────
  resourcesId = await createDb(PARENT!, 'Resources', {
    'Resource Name': title('Name of the shared resource or commons.'),
    Type:            sel(['Physical', 'Digital', 'Financial', 'Knowledge', 'Relational', 'Other'],
                       'Type of resource.'),
    Status:          sel(['Active', 'Inactive', 'Transitioning', 'Archived'],
                       'Current state of this resource.'),
    Steward:         text('Person or circle responsible for stewarding this resource. In Saberra, linked to a Profile record.'),
    Circle:          text('Circle that holds this resource. In Saberra, linked to a Circle record.'),
    Description:     text('What this resource is and how it is used.'),
    'Access Policy': text('Who can access this resource and under what conditions.'),
    'Review Date':   date('When stewardship of this resource should next be reviewed.'),
    'Source Evidence': text('Where this resource was documented or discussed.'),
  }, 'Shared commons and stewardship records. Tracks physical, digital, financial, and knowledge resources held in common by the organization. Saberra creates resource records when shared assets are discussed in meetings or emails.');

  await addRow(resourcesId, {
    'Resource Name': T('Shared Google Drive - Institutional Documents'),
    Type: S('Digital'), Status: S('Active'),
    Steward: RT('[Technology Steward]'), Circle: RT('Learning & Innovation'),
    Description: RT('Central repository for governance documents, meeting notes, financial records, and project files.'),
    'Access Policy': RT('All active members have view access. Circle leads have edit access in their circle folders. Admin has full access.'),
  });
  } // end if (communityLayer)

  // ──────────────────────────────────────────────────────────────────────────
  // Automation-only databases (20-24).
  // Always created regardless of communityLayer. Populated by the Sera worker
  // — not useful without the live worker, but created here so the provisioner
  // can set all 23 NOTION_DB_* env vars in one pass.
  // ──────────────────────────────────────────────────────────────────────────

  // 20. Source Emails
  const sourceEmailsId = await createDb(PARENT!, 'Source Emails', {
    Subject:           title('Email subject line.'),
    'Message ID':      text('RFC 2822 Message-ID header — unique per email, used for deduplication.'),
    From:              text('Sender email address.'),
    To:                text('Primary recipient email address.'),
    'Received Date':   date('Date the email was received by the capture inbox.'),
    'Email Type':      sel(['Google Meet Recording', 'Google Meet Transcript', 'Google Meet Notes', 'Operational', 'Forwarded Thread', 'Unknown'],
                         'Type of email determined by Sera during classification.'),
    'Processing Status': sel(['Pending', 'Processed', 'Failed', 'Manual Review', 'Skipped'],
                           'Current processing state.'),
    'Body Preview':    text('First 500 characters of the email body for quick reference.'),
    'Asset Links':     text('Google Drive URLs extracted from this email, if any.'),
  }, 'Every email ingested by Sera. One record per email, keyed by Message ID. Do not edit manually — populated by the Sera worker for deduplication and audit trail.');

  // 21. Meetings
  const meetingsId = await createDb(PARENT!, 'Meetings', {
    'Meeting Name':    title('Auto-generated from the email subject or Google Meet title.'),
    'Meeting Date':    date('Date the meeting took place. Extracted from email body, not received date.'),
    Organizer:         text('Name or email of the meeting organizer, extracted from email body.'),
    Participants:      text('Comma-separated list of participants from invite or recording notification.'),
    'Processing Status': sel(['Pending', 'Partial', 'Processed', 'Failed', 'Manual Review'],
                           'Partial = recording received but transcript or notes still pending.'),
    'Capture Key':     text('Deduplication key. Format: cal:{calId} | meet:{code}:{date} | title:{hash} | drive:{fileId} | msg:{messageId}.'),
    'Source Email':    text('Subject line of the email that first triggered this meeting record.'),
    'Recording URL':   url('Google Drive URL of the meeting recording, if received and accessible.'),
    'Transcript URL':  url('Google Drive URL of the meeting transcript, if received and accessible.'),
    'Notes URL':       url('Google Drive URL of the Gemini meeting notes, if received and accessible.'),
  }, 'One record per meeting, deduplicated by Capture Key. A single meeting may generate multiple emails (recording + transcript + notes) — all map to the same record here. Populated automatically by the Sera worker.');

  // 22. Meeting Assets
  const meetingAssetsId = await createDb(PARENT!, 'Meeting Assets', {
    'Asset Name':      title('Auto-generated: "[Asset Type] — [Meeting Name]".'),
    'Asset Type':      sel(['Recording', 'Transcript', 'Notes'],
                         'Type of Google Meet output. Each meeting can have one of each.'),
    Meeting:           text('Meeting this asset belongs to. In Saberra, linked to a Meetings record.'),
    URL:               url('Google Drive URL for this asset.'),
    'Access Status':   sel(['Confirmed', 'Needs Access', 'Access Requested', 'Unavailable'],
                         'Whether Sera can read this file from Google Drive.'),
    'Drive File ID':   text('Google Drive file ID extracted from the asset URL.'),
    'Processed At':    date('When this asset was successfully downloaded and extracted.'),
    'Processing Notes':text('Notes on access issues, retry history, or extraction errors.'),
  }, 'Individual meeting assets (recording, transcript, Gemini notes). Each meeting can have up to 3 assets, one per type. Deduplicated by Meeting + Asset Type. Populated automatically by the Sera worker — do not edit manually.');

  // 23. Processing Events
  const processingEventsId = await createDb(PARENT!, 'Processing Events', {
    Event:             title('Short description of this event, e.g. "Extraction complete — [Meeting Name]".'),
    'Event Type':      sel(['Poll Start', 'Email Ingested', 'Access Check', 'Extraction Start', 'Extraction Complete', 'Extraction Failed', 'Retry Queued', 'Access Requested', 'Manual Review Flagged', 'Poll Complete'],
                         'Which step in the pipeline this event records.'),
    Service:           sel(['Worker', 'API', 'Dashboard'],
                         'Which Sera service generated this event.'),
    'Tenant ID':       text('Client identifier written to every event. Set via TENANT_ID env var.'),
    Status:            sel(['Success', 'Warning', 'Error', 'Info'],
                         'Outcome of this processing step.'),
    Timestamp:         date('When this event occurred.'),
    'Source Email ID': text('Notion page ID of the Source Email this event relates to.'),
    'Meeting ID':      text('Notion page ID of the Meeting this event relates to, if applicable.'),
    'Token Count':     num('Anthropic API tokens consumed in this event, if applicable.'),
    Details:           text('Full event details, error messages, or extraction summary.'),
  }, 'Audit log for every Sera processing cycle. Do not edit manually. Used for debugging, monitoring, and API cost tracking. One record per significant pipeline step.');

  // 24. Sensitive Review — lives in a separate admin-only page if SENSITIVE_REVIEW_PARENT_PAGE_ID is set.
  const sensitiveParent = process.env.SENSITIVE_REVIEW_PARENT_PAGE_ID ?? PARENT!;
  if (sensitiveParent === PARENT) {
    console.log('  Note: SENSITIVE_REVIEW_PARENT_PAGE_ID not set — Sensitive Review will be created in main hub page.');
    console.log('  For production: set this to a page in an admin-only Notion workspace.');
  }
  const sensitiveReviewId = await createDb(sensitiveParent, 'Sensitive Review', {
    Title:             title('Brief flag description — must NOT contain the sensitive content itself.'),
    Category:          sel(['Personal Health', 'Financial', 'Legal', 'Interpersonal Conflict', 'Confidential Partnership', 'Other'],
                         'Type of sensitive content flagged.'),
    Status:            sel(['Pending Review', 'Reviewed', 'Escalated', 'Archived'],
                         'Current review state.'),
    'Sensitivity Level': sel(['Sensitive', 'Restricted'],
                           'Sensitive = limited distribution; Restricted = admin eyes only.'),
    'Source Email':    text('Subject or ID of the email that contained this sensitive content.'),
    Meeting:           text('Meeting this relates to, if applicable.'),
    'Flagged At':      date('When Sera flagged this item.'),
    'Reviewed By':     text('Admin who reviewed this item.'),
    'Reviewed At':     date('When this item was reviewed.'),
    'Resolution Notes':text('How this sensitive content was handled — admin eyes only.'),
    'Destruction Notes':text('Whether source content was deleted or retained, and when.'),
  }, 'ADMIN-ONLY sensitive content flags. This database must live in a restricted Notion workspace accessible only to administrators. Sera creates records here when content exceeds the sensitivity threshold — it never stores the sensitive content itself, only the reference and flag.');

  // Done
  console.log('\nTemplate created successfully!');
  console.log(`View it at: https://www.notion.so/${PARENT!.replace(/-/g, '')}`);
  console.log('\nNext steps:');
  console.log('  1. Open the page in Notion and verify databases and sample records look correct');
  console.log('  2. Add relations between databases manually (see guide page for the full list)');
  console.log('  3. Add property group sections manually: open each DB > Properties panel > drag into groups');
  console.log('  4. Delete sample records and add your own data');
  console.log('  5. Set the page to "Anyone with the link can view"');
  console.log('  6. Click "Duplicate" in the top-right to confirm the template experience works');
  console.log('  7. Copy the page URL and use it as the template link on saberra.com');

  // Machine-readable DB ID output for provision-client.ts
  const dbIdPayload = {
    tasksId,
    decisionsId,
    risksId,
    mrqId,
    profilesId,
    projectsId,
    circlesId,
    rolesId,
    assignmentsId,
    canonId,
    ledgerId,
    kbId,
    messagesId,
    tensionsId:         tensionsId         ?? null,
    agreementsId:       agreementsId       ?? null,
    gratitudesId:       gratitudesId       ?? null,
    eventsId:           eventsId           ?? null,
    retrosId:           retrosId           ?? null,
    resourcesId:        resourcesId        ?? null,
    sourceEmailsId,
    meetingsId,
    meetingAssetsId,
    processingEventsId,
    sensitiveReviewId,
  };
  console.log('SABERRA_DB_IDS:' + JSON.stringify(dbIdPayload));
}

run().catch(e => { console.error(e); process.exit(1); });
