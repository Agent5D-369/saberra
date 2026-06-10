/**
 * Creates / updates KB articles covering:
 *   1. How Sera Works (complete guide)
 *   2. Weekly Workflow for Managing the Living Memory Hub
 *   3. Admin Dashboard Guide
 *   4. Notion Backend Management Reference
 *
 * Usage: npx ts-node scripts/populate-operations-kb.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();
import { NotionWriterService } from '../src/services/NotionWriterService';
import { logger } from '../src/config/logger';

const N = NotionWriterService;

const ARTICLES = [
  // ── 1. How Sera Works ──────────────────────────────────────────────────────
  {
    title: 'How Sera Works — A Complete Guide to the Living Memory Hub',
    category: 'Technology',
    audience: ['All Members', 'Circle Leads', 'Tech Team'],
    summary: 'Sera is the AI Secretary for Amora, running as roots@amora.cr. She automatically processes emails about Google Meet recordings, transcripts, and notes — as well as operational org emails — and writes structured records into 17 Notion databases. This article explains what she does, what she does not do, and how to work with her effectively.',
    keyPoints: `WHAT VERA IS
Sera is an automated background service (not a chat assistant) that runs continuously on Railway cloud infrastructure. She receives emails at roots@amora.cr, processes them using Claude AI, and writes structured records into the Amora Notion workspace. She operates without human input — think of her as a permanent staff member who reads every email and never forgets anything.

She is the AI Secretary role within the Governance & Coordination circle.

HOW VERA PROCESSES EMAILS
Sera polls the roots@amora.cr inbox every 3 minutes. For each new email she:
1. Classifies the email type (Google Meet notification, operational email, forwarded thread, governance agenda request)
2. Creates a Source Email record in Notion (deduplication by Message-ID prevents double-processing)
3. Extracts structured data using Claude AI
4. Writes records into the appropriate Notion databases

WHAT VERA PROCESSES
- Google Meet Recording notifications: Sera checks whether roots@amora.cr can access the file in Drive, and flags for retry if not
- Google Meet Transcript notifications: Sera accesses the transcript, extracts it as text, and runs full AI extraction (tasks, decisions, risks, profiles, memory candidates, etc.)
- Gemini Notes notifications: Same as transcripts — full AI extraction
- Operational Emails: Regular emails forwarded or sent to roots@amora.cr — creates a Message record with AI-extracted summary, requests, commitments, questions
- Forwarded Threads: Thread context is preserved and extracted
- Governance Agenda Requests: Emails with [Governance Agenda] in the subject — Sera queries Notion and emails back an agenda with open tensions, decisions, and risks

WHAT VERA CREATES IN NOTION (17 DATABASES)
Source Emails — every email received (audit log)
Meetings — one record per meeting, deduplicated by Capture Key
Meeting Assets — one record per file (recording, transcript, notes) per meeting
Messages — operational emails with AI-extracted summary
Profiles — people and organizations mentioned
Projects — named initiatives extracted from context
Tasks — action items with owners and due dates
Decision Candidates — decisions confirmed or proposed
Risks — flagged risks with severity and mitigation
Memory Review Queue — institutional facts worth preserving (needs human review)
Canon Change Requests — proposed changes to CCOS governance (always Pending Review)
CCOS Ledger Entries — governance actions (tensions, proposals, decisions)
Role Assignments — people assigned to roles
Circles, Roles — updated when circle/role changes are discussed
Processing Events — full audit trail of every processing step
Sensitive Review — flagged sensitive items (admin-only access)
Knowledge Base — articles created from how-to content in emails or meetings

WHAT VERA NEVER DOES
- Approves decisions — all decisions stay as Candidate or Confirmed (no auto-approval)
- Applies canon changes — all canon change requests go to Pending Review
- Sends emails on her own initiative (except access requests and recaps)
- Deletes or modifies existing records without a trigger
- Creates final policy — only draft/candidate records

HOW TO SEND THINGS TO VERA
Simply email roots@amora.cr. To get the most out of Sera:
- Forward meeting notes after a meeting
- CC roots@amora.cr on operational emails that should be logged
- Email roots@amora.cr with subject [Governance Agenda] to request a pre-meeting agenda
- For governance actions, send a structured email describing the tension, proposal, or decision

GOOGLE DRIVE INTEGRATION
Sera checks whether she can access each Drive file (recording, transcript, notes) sent in Meet notifications. If she cannot:
- She retries automatically at 30 min, 2 hours, and 24 hours (4 attempts total)
- She sends an access request email to the admin with instructions for granting access
- After 4 failed retries, the asset moves to Manual Review status in Notion

The fastest fix is to move files into the Amora Living Memory Shared Drive (org-owned Drive), where Sera has automatic access. See the Org Drive KB article for setup instructions.

RETRY LOGIC
Asset retry schedule after access failure:
- Attempt 1: Immediate
- Attempt 2: 30 minutes later
- Attempt 3: 2 hours later
- Attempt 4: 24 hours later
- After attempt 4: Status set to Manual Review — admin must intervene

MEETING RECAP EMAILS
After successfully processing a meeting transcript or notes, Sera sends a recap email to the meeting organizer summarizing what was extracted: tasks created, decisions recorded, risks flagged, and a link to the Notion meeting record.

ADMIN DASHBOARD
A real-time dashboard is available showing:
- Role health (vacant roles, expiring term assignments)
- Recent processing events
- Items needing human attention
The dashboard URL is available from the Technology & Systems circle lead.`,
  },

  // ── 2. Weekly Workflow ──────────────────────────────────────────────────────
  {
    title: 'Weekly Workflow for Managing the Living Memory Hub',
    category: 'Process',
    audience: ['Circle Leads', 'Tech Team', 'Leadership'],
    summary: 'This article describes the recommended weekly routine for keeping the Amora Living Memory Hub healthy — what to check, what to action, who is responsible, and in what order. The goal is a consistent, low-effort process that ensures nothing slips through.',
    keyPoints: `WHO IS RESPONSIBLE
Primary: Technology & Systems circle (AI Secretary role + Circle Lead)
Secondary: Governance & Coordination circle (for governance-flagged items)
All circle leads: for items related to their circle

The AI Secretary role (currently held by Sera the automated system and supported by the human circle lead) is accountable for the Living Memory Hub being healthy and current.

DAILY CHECK (5 MINUTES) — Tech Lead or AI Secretary Designate
These items need timely attention:

1. SENSITIVE REVIEW (admin-only)
   Location: Notion > Sensitive Review database
   Filter: Status = Pending Review
   Action: Read each flagged item. Decide: Dismiss (not actually sensitive), Escalate (share with leadership), or Review (make a note and close). Never ignore. These are time-sensitive.

2. MANUAL REVIEW ASSETS
   Location: Notion > Meeting Assets database
   Filter: Processing Status = Manual Review
   Action: These are meeting files Sera could not access after 4 retries. Share the Drive file with roots@amora.cr OR move it to the org Shared Drive. Once shared, update Processing Status to Pending — Sera will retry on the next poll.

3. ADMIN DASHBOARD
   Check the dashboard for any new alerts: role health warnings, processing errors, unusual activity.

WEEKLY CHECK (20-30 MINUTES) — Tech Lead
1. MEMORY REVIEW QUEUE
   Location: Notion > Memory Review Queue
   Filter: Status = Pending Review
   Action: Read each proposed memory. Ask: Is this a stable institutional fact? If yes, Approve and decide where it should live (update Suggested Destination). If unclear, leave as Pending or set Needs Clarification. If not worth keeping, Reject.
   Target: clear the queue weekly.

2. DECISION CANDIDATES — NEEDS CONFIRMATION
   Location: Notion > Decision Candidates
   Filter: Needs Confirmation = true, Status = Candidate
   Action: Confirm or reject with the relevant decision-maker. Update Status to Confirmed or Rejected. If Canon Impact = true, escalate to Governance circle.

3. CANON CHANGE REQUESTS
   Location: Notion > Canon Change Requests
   Filter: Status = Pending Review
   Action: Review with Governance & Coordination circle. This is not a solo decision — bring it to a governance meeting. Update Status after the meeting.

4. OPEN TASKS WITH NO OWNER
   Location: Notion > Tasks
   Filter: Status = Needs Owner
   Action: Assign to a person or role, or mark Cancelled if no longer relevant.

5. PROCESSING EVENTS — ERRORS
   Location: Notion > Processing Events
   Filter: Status = failed
   Action: Check the Error field. Most failures are transient and resolve on retry. Persistent failures should be escalated to the Technology & Systems circle.

MONTHLY CHECK (1 HOUR) — Circle Leads + Tech Lead
1. CIRCLE HEALTH REVIEW
   Open each active circle in Notion. Check: Last Review Date, KPIs, open tasks, any unresolved tensions in the CCOS Ledger.
   Update Last Review Date after reviewing.

2. ROLE HEALTH
   Check the admin dashboard or Notion > Roles (filter: Status = Vacant).
   Any role vacant for more than 30 days should be brought to a governance meeting for re-election or discussion.

3. KNOWLEDGE BASE REVIEW
   Filter: Status = Stale or Last Enriched At is more than 60 days ago.
   Update outdated articles or archive ones that are no longer relevant.

4. POLICY REVIEW
   Filter Next Review Date <= end of month.
   Bring flagged policies to the relevant circle for review. Update Last Review Date.

QUARTERLY (GOVERNANCE MEETING AGENDA ITEM)
- Canon Change Request backlog: any requests that have been Pending Review for more than 30 days
- CCOS Ledger review: any Tensions that have been open for more than 60 days
- Role term renewals: any assignments expiring in the next 90 days

EMAIL roots@amora.cr WITH [Governance Agenda] IN THE SUBJECT
Sera will automatically compile open tensions, pending decisions, and upcoming role expirations into a formatted agenda and email it back to you. Do this before any governance meeting.`,
  },

  // ── 3. Admin Dashboard Guide ────────────────────────────────────────────────
  {
    title: 'Admin Dashboard — What It Shows and How to Use It',
    category: 'Technology',
    audience: ['Circle Leads', 'Tech Team', 'Leadership'],
    summary: 'The admin dashboard is a live web page showing the health of the Amora Living Memory Hub — role vacancies, expiring assignments, recent AI processing activity, and items needing human attention. This article explains each section and how to act on what you see.',
    keyPoints: `WHAT THE DASHBOARD IS
The admin dashboard is a real-time web page served by the Living Memory Hub on Railway. It queries the Notion databases and displays a summary of the system's current state. It is read-only — you cannot make changes from the dashboard, but it tells you exactly where to look in Notion.

Ask the Technology & Systems circle lead for the dashboard URL. It requires no login — the URL itself is the access control.

DASHBOARD SECTIONS

1. PROCESSING SUMMARY
Shows how many emails were processed in the last 7 days, how many succeeded, and how many failed. A healthy system shows 95%+ success rate.

If you see a high failure rate: check Notion > Processing Events, filter Status = failed, and look at the Error field for patterns.

2. ROLE HEALTH — VACANT AND EXPIRING
Lists any active roles with no current assignment (Vacant) and any role assignments expiring within the next 30 days.

Vacant role: bring to the relevant circle's next meeting. The circle should initiate a consent election or appointment.
Expiring assignment: contact the role holder and begin the renewal or re-election process before the term ends.

3. RECENT PROCESSING EVENTS
A log of the last 20 processing events — what Sera did and when. Each event shows the source type, status, and any errors.

Green = completed successfully
Red = failed (check the Error field in Notion)
Orange/yellow = started but not completed (could be in progress or stalled)

4. MANUAL REVIEW QUEUE
Meeting assets that Sera could not access after 4 retries. Each item shows the meeting name, asset type, and a link to the Drive file.

Action: Share the Drive file with roots@amora.cr or move it to the org Shared Drive. Then in Notion, set the asset's Processing Status back to Pending.

5. POLICY LIBRARY
A quick view of all active policies with their next review dates. Policies highlighted in red are past their review date.

Action: Bring overdue policies to the responsible circle for review. Update Last Review Date in Notion after review.

HOW OFTEN TO CHECK IT
- Daily: Tech lead or designated AI Secretary Designate (2 minutes)
- Weekly: Full review by Tech Lead (5 minutes)
- Before governance meetings: check for role health and policy alerts to include in the agenda

WHAT TO DO IF THE DASHBOARD IS DOWN
The dashboard runs on Railway. If it is unavailable:
1. Check railway.app — log in and look at the worker service status
2. Check deployment logs for errors
3. The Notion databases remain accessible directly — the dashboard is a convenience layer only`,
  },

  // ── 4. Notion Backend Management Reference ──────────────────────────────────
  {
    title: 'Notion Backend Management — Complete Reference for Circle Leads',
    category: 'Process',
    audience: ['Circle Leads', 'Leadership', 'Tech Team'],
    summary: 'This is the definitive reference for managing the Amora Notion workspace. It covers what each database is for, what Sera manages automatically vs. what requires human input, how to handle duplicates, what never to delete, and the naming and relationship conventions used throughout the system.',
    keyPoints: `THE 17 DATABASES — WHAT EACH ONE IS FOR

SOURCE EMAILS: Every email Sera receives. Read-only audit log. Never manually create records here. If an email is missing, check IMAP delivery.

MEETINGS: One record per Google Meet session. Deduplication by Capture Key prevents duplicates. Sera creates these automatically. Humans can add notes in the Summary field or link related Projects.

MEETING ASSETS: One record per file (recording, transcript, notes) per meeting. If Access Status = Needs Access, share the Drive file with roots@amora.cr.

MESSAGES: Operational emails processed by Sera. Humans can update Follow-Up Needed and add Notes after reading.

PROFILES: People and organizations. Sera creates these automatically from email context. Humans should review and enrich: add Location, Website, LinkedIn, Admin Notes. Set Sensitive Notes Flag for anyone requiring discretion.

PROJECTS: Named initiatives. Sera creates these when multiple tasks share the same initiative. Humans should set Target Date, Priority, and link the responsible Circle.

TASKS: Action items. Sera creates these. Humans must: assign Owners for tasks where Needs Owner = true, update Status as work progresses, set Due Dates where missing.

DECISION CANDIDATES: Sera creates these. Humans must: confirm Candidate decisions by setting Status to Confirmed, or Reject if the decision did not actually happen. Canon Impact = true decisions must go to a governance meeting.

RISKS: Sera flags these. Humans must: assign Owners, review Suggested Mitigation, update Status as risks are addressed.

MEMORY REVIEW QUEUE: Sera proposes memories. Humans must review each one. Approve means the fact is stable and worth keeping. The Suggested Destination field tells you where to put it. Never auto-approve.

CANON CHANGE REQUESTS: Proposed changes to CCOS governance. Always Pending Review — never approved automatically. The Governance & Coordination circle must formally review and vote. After approval, update Status to Approved and fill Implemented By.

CCOS LEDGER ENTRIES: CCOS governance actions (tensions, proposals, decisions). Draft means just logged; Pending Review means it needs a circle meeting; Approved means the circle voted on it.

CIRCLES: The 8 Amora governance circles. Sera updates these when circle changes are discussed in meetings. Humans should keep Purpose, Domains, Accountabilities, KPIs current. Update Last Review Date after each monthly review.

ROLES: Role cards for each role in each circle. Sera creates these when role changes are discussed. Humans should keep Status current (Active, Vacant, Archived). Never delete a role — Archive it instead.

ROLE ASSIGNMENTS: Who holds which role, when, and how they were assigned. Sera creates these from meeting context. Humans should update End Date when someone steps down, and set Status to Completed.

PROCESSING EVENTS: Automated audit log of every action Sera takes. Read-only. Use this for debugging when something doesn't appear in Notion.

SENSITIVE REVIEW: Flagged sensitive content. Admin-only. Review daily. Never dismiss without reading.

POLICIES: Amora governance policies. Created by humans, not Sera. The Policy Ref field auto-generates (e.g. GOV-003). Set Review Cadence so the system reminds you when to review.

KNOWLEDGE BASE: Articles created by Sera and humans. Sera creates these from meeting content with clear how-to guidance. Humans can create and edit articles directly. Always check Possible Duplicate Of before publishing.

WHAT NEVER TO DELETE
- Source Emails (they are the audit trail)
- Processing Events
- Archived circles and roles (historical record)
- Resolved CCOS Ledger Entries (governance history)
- Rejected decisions (shows what was considered and why)

NAMING CONVENTIONS
Meetings: Sera names them from the Google Meet notification subject
Tasks: Sera names them from the action item text exactly
Profiles: Full name as written in the email
Roles: Title Case (e.g. "Lead Steward", "Finance Steward")
Circles: Title Case (e.g. "Land & Ecology")

AVOIDING DUPLICATES
Sera deduplicates automatically:
- Emails: by Message-ID
- Meetings: by Capture Key (Google Calendar event ID where possible)
- Meeting Assets: by Meeting + Asset Type combination
- Profiles: by exact name match (case-sensitive)

If you see a duplicate profile: keep the richer record, copy any unique fields, then Archive the poorer one. Do not delete.

If you see a duplicate meeting: check the Capture Keys. If different, they may be legitimately different (same title, different day). If same, contact the Technology & Systems circle to investigate.

RELATIONS — HOW THINGS CONNECT
Most databases have relation fields that link records together. Key relations:
- Meetings → linked to Tasks, Decisions, Risks, Memory Candidates
- Profiles → linked to Tasks (owner), Decisions (decision maker), Role Assignments
- Projects → linked to Tasks
- Circles → linked to Roles, Role Assignments, Ledger Entries, Policies
- Decisions → can resolve CCOS Ledger tensions via Resolved By Decision

When creating records manually, always fill in the relation fields. An orphaned task with no Meeting or Project context is harder to act on.

REVIEW SCHEDULE SUMMARY
Daily: Sensitive Review, Manual Review Meeting Assets
Weekly: Memory Review Queue, Decisions Needing Confirmation, Open Tasks with No Owner
Monthly: Circle Health Reviews (update Last Review Date), Policy Reviews, Role Health
Quarterly: Canon Change backlog, CCOS Ledger tensions older than 60 days, Role term renewals`,
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
        Source:             N.richText('Operations guide — Amora Living Memory Hub'),
        'Published At':     N.date(today),
        'Last Enriched At': N.date(today),
      });
      console.log(`Created: "${article.title}"`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nAll KB articles written.\n');
}

main().catch(err => { logger.error({ err }, 'failed'); process.exit(1); });
