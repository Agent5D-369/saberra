/**
 * Populates the Knowledge Base with definitive how-to articles for the
 * Amora Living Memory Hub — Powered by Sera.
 * Safe to re-run: checks by title before creating.
 * Run: npx ts-node scripts/populate-knowledge-base.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

interface Article {
  title: string;
  category: string;
  audience: string[];
  summary: string;
  keyPoints: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

const ARTICLES: Article[] = [
  {
    title: 'How Sera Captures Your Meetings',
    category: 'How-To',
    audience: ['All Members'],
    summary: 'Everything you need to know about how Sera captures Google Meet sessions — from invitation to structured Notion records. Covers the full pipeline: recording, transcript, and Gemini notes.',
    keyPoints: `HOW IT WORKS: When you invite roots@amora.cr to a Google Calendar event, Sera attends as the Living Memory capture account. After the meeting ends, Google sends her notification emails for the recording, transcript, and AI-generated notes. She processes each asset, extracts decisions, tasks, risks, and people, then writes structured records into Notion.

STEP 1 — INVITE: Open your Google Calendar event. Add roots@amora.cr as a guest. That is all. She will attend automatically and receive the post-meeting notifications.

STEP 2 — ENABLE CAPTURE: When Google Meet asks "Allow recording?" click Allow. When it asks about transcription, allow that too. Without a recording or transcript, Sera has no content to process.

STEP 3 — WAIT: Within 5–15 minutes of the meeting ending, Google sends the assets to roots@amora.cr. Sera polls every 3 minutes. Expect the meeting to appear in Notion within 20 minutes.

WHAT VERA EXTRACTS: Decisions (with status and decision-maker), Tasks (with owner and due date), Risks (with severity and mitigation), People mentioned (auto-creates Profiles), Memory candidates (proposed institutional knowledge), Canon Change Requests (if governance was discussed), and a Meeting Summary.

DEDUPLICATION: If Sera receives multiple assets for the same meeting (recording + transcript + notes), she links them all to a single Meeting record. She never creates duplicates.

TROUBLESHOOTING: If the meeting does not appear within 30 minutes, check the Drive Access Failures section of the dashboard. Sera may need you to share the recording with her — see the article on sharing Google Drive recordings.`,
  },

  {
    title: 'How to Exclude Emails and Meetings from Sera',
    category: 'How-To',
    audience: ['All Members'],
    summary: 'Use the [lm-exclude] tag to prevent Sera from filing any content from a specific email or meeting. Essential for personal conversations, legally sensitive matters, or anything you want to keep private.',
    keyPoints: `THE TAG: Add [lm-exclude] anywhere in the email subject line or meeting title. Sera will mark the message as seen and skip all processing. Nothing is written to Notion.

FOR EMAILS: Change the subject to include [lm-exclude] before sending, or ask the sender to add it. Examples: "Re: Salary discussion [lm-exclude]" or "[lm-exclude] Personal health matter."

FOR MEETINGS: Add [lm-exclude] to the Google Calendar event title. Example: "1:1 with Rick [lm-exclude]." roots@amora.cr will still receive the notification email but Sera will ignore it entirely.

CASE INSENSITIVE: [LM-EXCLUDE], [lm-exclude], and [Lm-Exclude] all work the same way.

WHEN TO USE: Personal conversations, salary or compensation discussions, medical or personal health matters, legal proceedings or privileged communications, any meeting where participants have not consented to AI processing.

WHAT HAPPENS: Sera logs nothing. No Source Email record, no Meeting record, no extractions. The email is simply marked as seen in the inbox and never touched again.

IMPORTANT: This tag must be in the subject line. It does not work in the email body or meeting description.`,
  },

  {
    title: 'How to Forward Emails to Sera',
    category: 'How-To',
    audience: ['All Members'],
    summary: 'Forward or CC roots@amora.cr on any important email thread and Sera will extract the key information and file it as a draft Message record in Notion — ready for your review.',
    keyPoints: `THREE WAYS TO INCLUDE VERA:

1. FORWARD: Forward any email to roots@amora.cr. She will extract decisions, tasks, risks, and people from the thread and create a Message record. Use this for emails that have already been sent.

2. CC: Add roots@amora.cr to the CC field when composing. She processes the email as it arrives. Good for ongoing threads you want captured from the start.

3. BCC: Add roots@amora.cr to BCC for discrete capture. She processes the message but does not appear in the visible recipients list. Useful when you do not want external senders to see the capture account.

WHAT VERA CREATES: A Message record in Notion with a summary, plus separate records for any Decisions, Tasks, Risks, and People mentioned. All records are drafts — nothing is canon until a human approves it.

WHAT VERA DOES NOT DO: She does not reply. She does not forward to anyone else. She does not appear in Reply All unless you CC'd her (not BCC'd).

SENSITIVE THREADS: If the email contains legally sensitive content, salary information, or medical details, use [lm-exclude] in the subject instead of forwarding.

LIMITS: Sera processes the first 50,000 characters of a forwarded thread. Very long threads may be truncated. Attachments (PDF, Word) are extracted and included in the analysis.`,
  },

  {
    title: 'How to Share Google Drive Recordings with Sera',
    category: 'How-To',
    audience: ['All Members'],
    summary: 'When Sera flags a recording or transcript as Needs Access, you need to share the Google Drive file with roots@amora.cr. This article explains exactly how — it takes 30 seconds.',
    keyPoints: `WHY THIS HAPPENS: Google Meet recordings and transcripts are stored in the meeting organizer's Google Drive. Even though roots@amora.cr was invited to the meeting, she does not automatically get access to the Drive files. You need to share them explicitly.

WHERE TO SEE IT: Open the admin dashboard and look at the Drive Access Failures section, or check the Meeting Assets database in Notion for records with Processing Status: Needs Access.

HOW TO SHARE:
1. Open Google Drive (drive.google.com)
2. Find the recording or transcript file (usually in "Meet Recordings" folder)
3. Right-click the file and choose Share
4. Add roots@amora.cr as a Viewer
5. Click Send

AUTOMATIC RETRY: Sera checks for access every 30 minutes automatically. After you share the file, she will pick it up on the next retry cycle — no manual action needed beyond sharing.

BATCH SHARING: If you consistently forget to share, consider sharing your entire "Meet Recordings" folder with roots@amora.cr as a Viewer. She will then have access to all future recordings automatically.

WHAT IF THE FILE IS DELETED: If the recording was deleted before Sera could access it, the asset will show "File not found — permanently inaccessible." You can delete this record from Notion — nothing can be done.`,
  },

  {
    title: 'How to Review the Dashboard Queues',
    category: 'How-To',
    audience: ['Leadership', 'Circle Leads'],
    summary: 'A complete guide to the Review Queues on the admin dashboard — what each queue means, how often to check it, and what action to take for each type of record.',
    keyPoints: `OPENING A QUEUE: Every queue card on the dashboard is clickable. Click the card to open that specific Notion database, pre-filtered to show only the pending items.

DECISION CANDIDATES: Decisions Sera extracted from meetings and emails. Review each one. Change Status from "Candidate" to "Confirmed" if correct, or "Rejected" if wrong. Add the actual decision-maker if Sera guessed incorrectly. Target: review within 48 hours of the meeting.

CANON CHANGE REQUESTS: Proposals to modify CCOS governance documents — circles, roles, policies, or decision rights. These require deliberate team review. Do not approve these casually. Notify the relevant Circle Lead before approving. Target: review within 1 week.

MEMORY REVIEW QUEUE: Proposed facts Sera thinks are worth preserving as long-term institutional knowledge. Review the confidence level and source evidence. Approve good ones, dismiss noise. These become context Sera uses in future processing.

TASKS — NEEDS OWNER: Tasks Sera extracted where no owner could be identified. Assign an owner and due date. Unowned tasks are invisible to the team.

HIGH RISKS: Open risks flagged as High severity. Review the mitigation column and assign an owner. Unowned high risks are a governance gap.

SENSITIVE REVIEW: Admin-only. Content Sera flagged as potentially sensitive — personal, legal, or confidential. Only accessible to admins. Review and apply appropriate handling.

KB DRAFTS: Knowledge Base articles Sera proposed. Review for accuracy, edit as needed, and change Status to Published when ready.

CCOS LEDGER DRAFTS: Governance actions logged in draft state. Review and set to Approved or Archived.

FREQUENCY: Check the dashboard daily. Most queues should be kept below 10 items. High backlogs reduce the value of the system.`,
  },

  {
    title: 'How to Approve or Reject a Decision Candidate',
    category: 'How-To',
    audience: ['All Members', 'Leadership'],
    summary: 'Sera extracts decisions from every meeting and email but never marks them as confirmed. This article explains the review workflow and what each status means.',
    keyPoints: `WHAT IS A DECISION CANDIDATE: When Sera hears language like "we agreed," "the team decided," or "it was resolved that" — she creates a Decision Candidate. It is always marked Candidate until a human reviews it.

THE STATUSES:
- Candidate: Sera extracted this — not yet reviewed by a human
- Confirmed: A human verified this decision actually happened as described
- Rejected: Sera misheard or the decision was reversed — delete or archive

HOW TO REVIEW:
1. Open the Decision Candidates database (or click the queue card on the dashboard)
2. Read the "Decision" title and "Source Evidence" field — the evidence shows the exact quote Sera used
3. Check the "Decision Maker" field — correct it if Sera guessed wrong
4. Check the "Review Required" checkbox — if canon-impacting, flag for the team before confirming
5. Change Status to Confirmed or Rejected

LINKING TO MEETINGS: Each Decision Candidate has a relation to the Source Meeting and Source Email. Click through to see the original context.

CANON-IMPACTING DECISIONS: If a decision changes a policy, role, or governance rule, Sera will also create a Canon Change Request. Do not confirm the Decision Candidate without also reviewing the Canon Change Request.

WHAT CONFIRMED MEANS: A Confirmed decision is the official record. It is linked to the meeting, the decision-maker's Profile, and any related projects. It becomes part of Amora's institutional memory.`,
  },

  {
    title: 'How to Review a Canon Change Request',
    category: 'Governance',
    audience: ['Leadership', 'Circle Leads'],
    summary: 'Canon Change Requests are Sera\'s proposals to modify CCOS governance documents. They require deliberate human approval before anything changes. This article walks through the review process.',
    keyPoints: `WHAT IS A CANON CHANGE REQUEST: Whenever Sera detects language that could affect a CCOS governing document — a policy, circle definition, role accountabilities, or decision rights — she creates a Canon Change Request marked "Pending Review." She never modifies canon herself.

FIELDS TO REVIEW:
- Proposed Change: What Sera thinks should be updated
- Affected Canon Area: Policy / Circle Definition / Role Definition / Decision Rights / etc.
- Affected Policy: The specific policy (if applicable) — linked to the Policies database
- Reason: Why Sera flagged this — includes the source evidence
- Reviewer: The person Sera thinks should approve this
- Source Evidence: The exact text that triggered the request

APPROVAL PROCESS:
1. Read the Proposed Change and Source Evidence carefully
2. Consult the Affected Canon document in Notion
3. Discuss with the relevant Circle Lead or policy owner
4. If approved: update the actual policy or governing document manually, then set Status to "Approved" and set Approved Date
5. If rejected: set Status to "Rejected" and add a note in Reason explaining why

VERA DOES NOT UPDATE CANON: Even if you set a Canon Change Request to Approved, Sera does not go update the policy. You must update the governing document yourself. The Approved status is the human record that the decision was made.

ESCALATION: If the Proposed Change is significant — affects financial commitments, legal structure, or land stewardship — bring it to a full team meeting before approving.`,
  },

  {
    title: 'How the Memory Review Queue Works',
    category: 'How-To',
    audience: ['Leadership', 'All Members'],
    summary: 'The Memory Review Queue contains facts, patterns, and knowledge Sera thinks are worth preserving as long-term institutional memory. Reviewing it regularly keeps Sera\'s context sharp.',
    keyPoints: `WHAT VERA PUTS HERE: During extraction, Sera flags information she thinks has lasting value beyond the immediate meeting — recurring themes, established practices, community norms, key facts about land or people. These become Memory Candidates.

THE FIELDS:
- Proposed Memory: The fact or insight Sera wants to preserve
- Category: Process / Cultural Norm / Technical / Governance / Historical / People / etc.
- Source Evidence: The exact text it came from
- Confidence: How confident Sera is this is worth keeping (High / Medium / Low)
- Risk If Added: What could go wrong if this becomes canon (e.g., oversimplification)
- Risk If Ignored: What value is lost by dismissing it
- Suggested Destination: Where Sera thinks this knowledge belongs — KB article, Policy, Profile, etc.

REVIEW ACTIONS:
- Approved: This is worth preserving. It becomes part of Amora's long-term context.
- Dismissed: Not worth keeping — noise, already known, or incorrect.
- Needs Clarification: Interesting but needs a human to verify or expand before it can be trusted.

HOW OFTEN TO REVIEW: Weekly. A backlog of unreviewed memory candidates means Sera is accumulating noise without anyone steering what actually gets remembered.

QUALITY OVER QUANTITY: It is better to dismiss borderline memories than to approve low-confidence ones. Sera uses approved memories as context when processing future content — bad memories create compounding inaccuracies.`,
  },

  {
    title: 'How to Handle Sensitive Information with Sera',
    category: 'Best Practice',
    audience: ['All Members', 'Leadership'],
    summary: 'Sera has a routing policy for sensitive content — legal matters, personal health information, salary data, and confidential negotiations. This article explains how that policy works and what your options are.',
    keyPoints: `THE ROUTING POLICY (GOV-001): The Living Memory Routing Policy defines what Sera is and is not allowed to process. Read it in the Policies database under GOV-001.

THE THREE CONFIDENTIALITY LEVELS:
- Standard: Normal meeting and email content. Written to the main Notion workspace visible to all members.
- Sensitive: Personal, legal, or financially sensitive content. Written to the Sensitive Review database (admin-only, isolated from the main workspace).
- Restricted: Highest sensitivity — legal proceedings, medical records, personnel actions. Sera logs only that something was restricted, not the content.

HOW VERA DETECTS SENSITIVITY: Claude (the AI Sera uses for extraction) assesses the content during processing. If it detects signals — salary figures, medical language, legal terms, named personal disputes — it flags the record accordingly.

YOUR OPTIONS:
1. [lm-exclude] in subject: Sera skips the email entirely. Nothing is written anywhere.
2. Let Sera route it: She processes it and writes sensitive content to the admin-only Sensitive Review database. The main team never sees it.
3. Review the Sensitive Review queue: Only admins can access this. Review and apply appropriate handling.

PARTICIPANTS SHOULD KNOW: If you are recording a meeting that will contain sensitive content, inform participants that roots@amora.cr is attending and will process the meeting. For highly sensitive discussions, use [lm-exclude] or hold a separate meeting without roots@amora.cr.

VERA DOES NOT SHARE CONTENT: Sera never emails, posts, or shares content outside of Notion. Everything she writes stays in the designated databases.`,
  },

  {
    title: 'How to Read the Admin Dashboard',
    category: 'How-To',
    audience: ['Leadership', 'Circle Leads'],
    summary: 'A complete tour of the Amora Living Memory Hub admin dashboard — every section, every metric, and what to do when something looks wrong.',
    keyPoints: `HERO COUNTERS (top row): Four animated numbers showing cumulative totals since Sera went live — Hours Saved, Emails Processed, Meetings Captured, and Decisions Recorded. The Hours Saved formula: 45 min per meeting + 5 min per email + 2 min per task + 3 min per decision.

VERA\'S TIPS PANEL: Sera surfaces rotating tips and Pro Tips. Each dot at the bottom is a different tip. Tips rotate every 12 seconds automatically.

REVIEW QUEUES: Cards showing items awaiting human action. Each card is clickable — opens the relevant Notion database. A red number means immediate attention needed. Keep all queues below 10.

SYSTEM HEALTH: Shows whether the worker is running (last poll time), whether the scheduled task service is active (heartbeat), and whether all required Notion databases and Google credentials are connected.

PROCESSING ACTIVITY CHART (Emails Processed — Last 7 Days): Bar chart of actual emails processed per day. Low bars on recent days are normal if few emails arrived. Zero bars for multiple consecutive days may indicate a pipeline problem.

EMAIL TYPE BREAKDOWN (donut chart): Proportion of email types Sera has processed — Meet Recordings, Transcripts, Notes, Operational, Forwarded. Useful for understanding where institutional memory is coming from.

POLICY LIBRARY: Count of policies in the CCOS. Total Policies is a clickable link to the Policies database. Banner shows whether all policies have a Responsible Circle assigned.

DRIVE ACCESS FAILURES: Meeting assets where Sera cannot access the Google Drive file. These need a human to share the file. Each row links to the Meeting Asset record.

SYSTEM CONFIG: Current configuration — poll interval, Claude model, KB status, admin email. Change these in Railway environment variables.`,
  },

  {
    title: 'How to Write Meeting Descriptions That Help Sera',
    category: 'Best Practice',
    audience: ['All Members'],
    summary: 'The quality of what Sera extracts from a meeting depends partly on the meeting context she receives. A good calendar event description gives her the frame she needs to extract accurately.',
    keyPoints: `WHY IT MATTERS: Sera receives the Google Calendar event description as part of the meeting context. A clear description helps her distinguish between a governance decision and a casual discussion, identify the right projects and circles, and flag canon-relevant content.

INCLUDE: The purpose of the meeting ("Governance review of hiring process"), the circle or domain it belongs to ("Technology Architecture Circle"), any decisions already known to be on the agenda ("Confirm new onboarding policy"), and the names of key participants and their roles.

AVOID: Vague titles like "Team Sync" with no description. These force Sera to infer everything from the transcript alone, which increases extraction errors.

EXAMPLE OF A GOOD DESCRIPTION: "Monthly Governance Circle meeting to review the draft Hiring Policy (GOV-004) and make a final decision. Attendees: Rick (Governor), Eric (Circle Lead), Jess (Secretary). Agenda: (1) Review policy revisions, (2) Vote, (3) Assign implementation tasks."

POLICY REFERENCES: If the meeting relates to an existing policy, mention the policy code (e.g., GOV-001) in the description. Sera will link extracted decisions and canon change requests to that policy automatically.

SENSITIVE TOPICS: If the meeting will cover sensitive content, add [lm-exclude] to the title, or note in the description that specific agenda items are off the record.

NOTE FOR PARTICIPANTS: The description goes into Sera's context window. Do not put anything in the description that you would not want processed and filed in Notion.`,
  },

  {
    title: 'What Sera Extracts from Every Meeting and Email',
    category: 'How-To',
    audience: ['All Members', 'New Members'],
    summary: 'A full breakdown of the 12 types of structured records Sera creates from every meeting transcript, notes document, or forwarded email — and what each one means.',
    keyPoints: `1. DECISIONS: Any resolution, agreement, or conclusion reached. Includes decision-maker, status (Confirmed/Candidate), and whether it affects CCOS canon. Stored in Decision Candidates.

2. TASKS: Action items with owner, due date, priority, and the project they belong to. Tasks with no clear owner go to the Needs Owner queue. Stored in Tasks.

3. RISKS: Identified risks with severity (High/Medium/Low), category (Financial/Operational/Legal/etc.), suggested mitigation, and owner. Stored in Risks.

4. MEMORY CANDIDATES: Facts worth preserving as long-term institutional knowledge — community norms, established practices, key historical context. Stored in Memory Review Queue for human approval.

5. CANON CHANGE REQUESTS: Proposals to modify CCOS governing documents. Always Pending Review. Never auto-approved. Stored in Canon Change Requests.

6. SENSITIVE FLAGS: Content Sera flags as sensitive — routed to admin-only Sensitive Review database.

7. PROFILE UPDATES: People mentioned in the meeting — auto-creates or updates their Profile record with role, email, circle affiliation, and context notes.

8. PROJECT UPDATES: Named initiatives mentioned — auto-creates or updates the Project record with status, lead, and circle.

9. CIRCLE UPDATES: References to Amora governance circles — auto-creates or links to existing Circle records.

10. ROLE UPDATES: CCOS role cards mentioned or modified — auto-creates or updates Role records.

11. ROLE ASSIGNMENTS: Who holds which role — creates Role Assignment records linking a Profile to a Role.

12. CCOS LEDGER ENTRIES: Formal governance actions — tensions raised, proposals made, decisions logged. Stored in CCOS Ledger as Draft for review.

All records are drafts until a human approves them. Sera never publishes canon.`,
  },

  {
    title: 'How to Add roots@amora.cr to Your Google Calendar Events',
    category: 'How-To',
    audience: ['All Members', 'New Members'],
    summary: 'Step-by-step instructions for inviting roots@amora.cr to your Google Meet meetings so Sera can capture them automatically.',
    keyPoints: `OPTION 1 — ADD TO AN EXISTING EVENT:
1. Open Google Calendar and click the event
2. Click the pencil (Edit) icon
3. In the "Guests" field, type roots@amora.cr and press Enter
4. Click Save
5. When asked "Would you like to send invitations?" click Send

OPTION 2 — ADD WHEN CREATING A NEW EVENT:
1. Click the time slot to create a new event
2. Click "More options" to open the full editor
3. In the "Guests" field, type roots@amora.cr and press Enter
4. Add your Google Meet link (click "Add Google Meet video conferencing")
5. Fill in the event title and description
6. Click Save and send invites

OPTION 3 — ADD TO ALL RECURRING EVENTS:
1. Open any occurrence of the recurring event
2. Click Edit, then choose "All events" when prompted
3. Add roots@amora.cr to Guests
4. Save — she will receive all future occurrences

DOES VERA ATTEND THE MEETING: roots@amora.cr is a Google account that receives calendar notifications. She does not join the call as a live participant. She receives the post-meeting recording and transcript emails automatically.

WHAT IF I FORGET: You can add roots@amora.cr to the event after the meeting ends. She will still receive the recording and transcript notification emails as long as she is listed as an invited guest at the time Google sends the notifications.

WHO SEES HER ON THE INVITE: All guests see roots@amora.cr in the attendee list. If this is a concern for external participants, use BCC on forwarded content instead.`,
  },

  {
    title: 'How to Troubleshoot a Meeting That Was Not Captured',
    category: 'How-To',
    audience: ['Leadership', 'Circle Leads'],
    summary: 'If a meeting happened but does not appear in Notion, or appears with errors, this article walks through the most common causes and how to fix them.',
    keyPoints: `STEP 1 — CHECK THE DASHBOARD: Open the admin dashboard. Look at System Health to confirm the worker is running (Last Successful Poll should be within the last 5 minutes). Check Drive Access Failures for the meeting.

STEP 2 — CHECK SOURCE EMAILS: Open the Source Emails database in Notion and search for the meeting title or date. If Sera received the notification email, there will be a Source Email record. Check its Processing Status.

COMMON CAUSES:

ROOTS@AMORA.CR WAS NOT INVITED: If roots@amora.cr was not a guest on the calendar event, Google does not send her the notification emails. Fix: add her to the event (even post-meeting) and wait for the next poll cycle.

RECORDING NOT ENABLED: If no recording was made, Google sends nothing. Sera cannot process a meeting she never heard about. Transcript-only capture works if transcription was enabled.

DRIVE ACCESS DENIED: Sera received the notification but cannot read the Drive file. Fix: share the recording or transcript with roots@amora.cr as Viewer in Google Drive. Sera retries automatically every 30 minutes.

EXTRACTION FAILED: Sera received and accessed the content but Claude extraction failed. The Source Email will show Processing Status: Failed with an error message. Check the Retry Queue — Sera will retry automatically up to 4 times (at 30 min, 2 hr, and 24 hr intervals).

MANUAL REVIEW: If all retries are exhausted, the asset goes to Manual Review status. Open the Meeting Asset in Notion, review the error, and decide whether to delete or fix it.

STILL STUCK: Check the Processing Events database filtered by the meeting date. The event log will show exactly what step failed and what error occurred.`,
  },

  {
    title: 'How to Contribute to the Knowledge Base',
    category: 'How-To',
    audience: ['All Members', 'Circle Leads'],
    summary: 'The Knowledge Base is Amora\'s living library of how-to guides, best practices, and institutional knowledge. Anyone can contribute. This article explains how.',
    keyPoints: `TWO WAYS TO ADD KNOWLEDGE:

1. VIA VERA: Sera automatically proposes KB articles from any meeting or email containing clear how-to instructions, process guidance, or repeatable knowledge. These appear in the KB Drafts queue on the dashboard as Draft articles for you to review and publish.

2. MANUALLY: Open the Knowledge Base database in Notion and create a new page. Fill in:
   - KB Title: Clear, searchable title starting with "How to" or a descriptive phrase
   - Category: How-To / Best Practice / Process / Technology / Governance / etc.
   - Audience: Who this is most relevant to
   - Summary: 2-3 sentences describing what the article covers
   - Key Points: The actual content — steps, tips, caveats
   - Status: Set to Draft until reviewed, Published when ready
   - Confidence: High if well-established, Medium if emerging practice

PUBLISHING: Change Status from Draft to Published when you are confident the content is accurate and complete. Published articles are visible to all members. Stale marks articles that need updating.

UPDATING EXISTING ARTICLES: Find the article, open it, edit the Key Points directly. Add a note in the Source field recording what changed and why.

QUALITY STANDARDS: Good KB articles are specific (not vague), actionable (tell you exactly what to do), and honest about caveats (what can go wrong). Avoid duplicating content — search before creating.

VERA USES THE KB: Sera has access to published KB articles as context when extracting from meetings. Good articles help her recognize Amora-specific processes and name them correctly.`,
  },

  {
    title: 'Understanding Sera\'s Governance Role',
    category: 'Governance',
    audience: ['All Members', 'Leadership'],
    summary: 'Sera is a living memory system, not a decision-maker. This article explains exactly what she can and cannot do within Amora\'s governance structure, and why these limits matter.',
    keyPoints: `WHAT VERA CAN DO:
- Extract and record decisions, tasks, risks, and governance actions from meetings and emails
- Propose canon changes — never apply them
- Flag sensitive content for admin review
- Propose Knowledge Base articles
- Maintain running records of circles, roles, and role assignments
- Surface tensions and governance patterns across multiple meetings

WHAT VERA CANNOT DO:
- Approve or publish any record as canon
- Modify a policy, role definition, or circle structure
- Send emails on behalf of the team (she can notify the admin only)
- Make any decision or recommendation that binds Amora
- Access emails or meetings she was not explicitly invited to
- Override the [lm-exclude] tag or bypass the routing policy

THE PRINCIPLE: Sera observes and remembers. The team decides and acts. Every record Sera creates is a draft, a candidate, or pending review. Nothing she writes is authoritative until a human confirms it.

WHY THIS MATTERS: AI systems that auto-publish are a governance risk. If Sera could approve her own canon change requests, one incorrect extraction could silently change Amora policy. The human review layer is not a bug — it is the design.

THE ROUTING POLICY (GOV-001): The Living Memory Routing Policy is the governing document that defines Sera's scope, what she can process, and how sensitive content is handled. If you have a question about whether something should go through Sera, GOV-001 is the reference.

RAISING CONCERNS: If Sera extracts something that feels wrong or inappropriate, delete it from Notion. It will not be re-created. Then consider whether the routing policy needs updating.`,
  },

  {
    title: 'How to Use Policy References in Meetings',
    category: 'Best Practice',
    audience: ['All Members', 'Circle Leads'],
    summary: 'Amora policies have short reference codes like GOV-001, OPS-002, and FIN-003. Mentioning these codes in meetings and emails helps Sera link extracted content to the right policy automatically.',
    keyPoints: `THE CODE FORMAT: Every policy in the Policies database has a Policy Ref field formatted as [AREA]-[NUMBER]. Examples: GOV-001 (Governance area, first policy), OPS-003 (Operations, third policy), FIN-002 (Finance, second policy).

CURRENT AREA CODES: GOV (Governance), OPS (Operations), FIN (Finance), HR (Human Resources), TECH (Technology), LEGAL (Legal), LAND (Land & Ecology), COMM (Community).

HOW TO USE THEM IN MEETINGS: Say or write the code naturally in conversation. "This decision falls under GOV-001" or "We need to update OPS-003 to reflect the new process." Sera will detect the code and link the extracted decision or canon change request to that policy automatically.

IN EMAIL SUBJECTS: Include the policy code in the subject line when the email is about a specific policy. "Re: Proposed revision to GOV-001 [lm-capture]." Sera will use this to route the extraction correctly.

IN MEETING DESCRIPTIONS: List the policies being discussed in the calendar event description. Sera reads this before processing the transcript, so she enters the meeting already knowing the governance context.

FINDING THE RIGHT CODE: Open the Policies database in Notion. Use the Policy Ref field or the search to find the right code. If no policy exists yet for the area you are discussing, Sera may create a Canon Change Request to propose one.

IF YOU SAY THE WRONG CODE: Sera will link to the wrong policy. Check the Source Evidence field on any linked Decision or Canon Change Request — it will show the exact text she used. Correct the relation in Notion if needed.`,
  },
];

async function articleExists(title: string): Promise<boolean> {
  const res = await notion.databases.query({
    database_id: dbs.knowledgeBase!,
    filter: { property: 'KB Title', title: { equals: title } },
    page_size: 1,
  });
  return res.results.length > 0;
}

async function createArticle(article: Article): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: dbs.knowledgeBase! },
    properties: {
      'KB Title':   { title: [{ text: { content: article.title } }] },
      Category:     { select: { name: article.category } },
      Audience:     { multi_select: article.audience.map((a) => ({ name: a })) },
      Summary:      { rich_text: [{ text: { content: article.summary } }] },
      'Key Points': { rich_text: [{ text: { content: article.keyPoints.slice(0, 1990) } }] },
      Status:       { select: { name: 'Published' } },
      Confidence:   { select: { name: 'High' } },
      'Published At': { date: { start: TODAY } },
      Source:       { rich_text: [{ text: { content: 'Filed by Sera via scripts/populate-knowledge-base.ts' } }] },
    } as never,
  });
  return (page as { url: string }).url;
}

async function main() {
  if (!dbs.knowledgeBase) {
    console.error('NOTION_DB_KNOWLEDGE_BASE not set');
    process.exit(1);
  }

  console.log(`Filing ${ARTICLES.length} articles to Knowledge Base...\n`);
  let created = 0;
  let skipped = 0;

  for (const article of ARTICLES) {
    const exists = await articleExists(article.title);
    if (exists) {
      console.log(`  SKIP  "${article.title}"`);
      skipped++;
    } else {
      const url = await createArticle(article);
      console.log(`  OK    "${article.title}"`);
      console.log(`        ${url}`);
      created++;
    }
  }

  console.log(`\nDone. Created: ${created}  Skipped (already existed): ${skipped}`);
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
