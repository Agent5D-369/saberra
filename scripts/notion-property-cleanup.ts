/**
 * Two jobs in one pass:
 *
 * 1. Deletes redundant duplicate back-reference properties:
 *      Circles DB: "Circle Roles", "Projects 1", "Ledger Entries 1"
 *      Roles DB:   "Ledger Entries 1"
 *
 * 2. Adds user-facing descriptions to every property in all 17 Notion databases
 *    so any team member can understand each field's purpose at a glance.
 *
 * Safe to re-run — description patches are idempotent.
 * Usage: npx ts-node scripts/notion-property-cleanup.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.NOTION_API_KEY;
if (!API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DB: Record<string, string | undefined> = {
  sourceEmails:        process.env.NOTION_DB_SOURCE_EMAILS,
  meetings:            process.env.NOTION_DB_MEETINGS,
  meetingAssets:       process.env.NOTION_DB_MEETING_ASSETS,
  messages:            process.env.NOTION_DB_MESSAGES,
  profiles:            process.env.NOTION_DB_PROFILES,
  projects:            process.env.NOTION_DB_PROJECTS,
  circles:             process.env.NOTION_DB_CIRCLES,
  roles:               process.env.NOTION_DB_ROLES,
  roleAssignments:     process.env.NOTION_DB_ROLE_ASSIGNMENTS,
  tasks:               process.env.NOTION_DB_TASKS,
  decisionCandidates:  process.env.NOTION_DB_DECISION_CANDIDATES,
  risks:               process.env.NOTION_DB_RISKS,
  memoryReviewQueue:   process.env.NOTION_DB_MEMORY_REVIEW_QUEUE,
  canonChangeRequests: process.env.NOTION_DB_CANON_CHANGE_REQUESTS,
  ccosLedgerEntries:   process.env.NOTION_DB_CCOS_LEDGER_ENTRIES,
  processingEvents:    process.env.NOTION_DB_PROCESSING_EVENTS,
  sensitiveReview:     process.env.NOTION_DB_SENSITIVE_REVIEW,
  policies:            process.env.NOTION_DB_POLICIES,
  knowledgeBase:       process.env.NOTION_DB_KNOWLEDGE_BASE,
};

// Redundant back-reference properties to delete, by database key
const REDUNDANT_PROPS: Record<string, string[]> = {
  circles: ['Circle Roles', 'Projects 1', 'Ledger Entries 1'],
  roles:   ['Ledger Entries 1'],
};

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// ─── Descriptions ─────────────────────────────────────────────────────────────
// Key = DB map key above. Value = property name → description (max ~200 chars).
// Names must match what actually exists in Notion.

const DESCRIPTIONS: Record<string, Record<string, string>> = {

  sourceEmails: {
    Title:              'Auto-generated label (Subject + From). One row per email received by roots@amora.cr.',
    'Message ID':       'IMAP Message-ID header — Sera uses this to deduplicate emails across poll cycles.',
    'Thread Reference': 'In-Reply-To / References header, used to group related emails into threads.',
    From:               'Sender address as received in the email headers.',
    To:                 'Primary recipients of the email.',
    CC:                 'Carbon-copy recipients of the email.',
    'BCC Indicator':    'Checked when roots@amora.cr was BCC\'d rather than directly addressed.',
    'Received Date':    'Date and time the email arrived in the roots@amora.cr inbox.',
    Subject:            'Original email subject line.',
    'Email Type':       'What kind of email this is — meeting asset notification, operational, forwarded thread, etc.',
    'Source Category':  'Broad grouping: Meeting Asset (from Google Meet) or Operational (regular org email).',
    'Raw Snippet':      'First ~500 characters of the email body — quick context without opening the record.',
    'Detected Links':   'URLs found in the email body. Drive / Meet links are used to locate meeting assets.',
    'Processing Status':'Where this email is in Sera\'s pipeline. Failed or Manual Review need human attention.',
    'Error Log':        'Technical error message if processing failed. Check this when status is Failed.',
    'Processed At':     'When Sera finished processing this email.',
  },

  meetings: {
    'Meeting Title':            'Name of the meeting, extracted from the Google Meet notification subject.',
    'Capture Key':              'Unique dedup key Sera uses to avoid duplicate meeting records (e.g. cal:eventId or meet:code:date).',
    'Meeting Date':             'Date the meeting occurred. Extracted from email body, not the email received date.',
    Organizer:                  'Person who organized this meeting. Resolved from Profiles.',
    Participants:               'People who attended or were invited. Resolved from Profiles.',
    'Google Calendar Link':     'Link to the original Google Calendar event, if present in the notification email.',
    'Google Meet Link':         'Link to the Google Meet session.',
    'Recording Link':           'Link to the meeting recording in Google Drive.',
    'Transcript Link':          'Link to the auto-generated transcript in Google Drive.',
    'Notes Link':               'Link to Gemini-generated meeting notes in Google Drive.',
    'Recording Access Status':  'Whether roots@amora.cr can access the recording file in Drive.',
    'Transcript Access Status': 'Whether roots@amora.cr can access the transcript file in Drive.',
    'Notes Access Status':      'Whether roots@amora.cr can access the Gemini notes file in Drive.',
    'Processing Status':        'Processed = extraction complete. Partial = some assets inaccessible. Manual Review needs attention.',
    Summary:                    'AI-generated summary of the meeting, extracted from the transcript or Gemini notes.',
    'Canon Review Required':    'Checked if extracted content may affect CCOS governance canon — needs governance review.',
    'Sensitive Review Required':'Checked if content contains sensitive interpersonal, legal, or reputational material.',
    'Last Processed At':        'Timestamp of the most recent processing attempt by Sera.',
    'Automation Log':           'Sera\'s internal processing notes, including retry history and access requests.',
    // Back-references added by migrations
    Assets:                     'Meeting asset records (recording, transcript, notes) linked to this meeting.',
    'Meeting Tasks':            'Action items extracted from this meeting\'s transcript or notes.',
    'Meeting Risks':            'Risks flagged during this meeting.',
    'Memory Candidates':        'Institutional memory candidates identified from this meeting.',
    Decisions:                  'Decisions extracted from this meeting\'s transcript or notes.',
    'Decisions Count':          'Number of decisions extracted from this meeting.',
    'Tasks Count':              'Number of action items extracted from this meeting.',
    'Risks Count':              'Number of risks flagged in this meeting.',
    'Memory Candidates Count':  'Number of memory candidates identified from this meeting.',
  },

  meetingAssets: {
    'Asset Name':          'Auto-generated: Meeting title + asset type (e.g. "Budget Review — Transcript").',
    'Asset Type':          'What kind of file: Recording, Transcript, Gemini Notes, Chat Log, Caption File, Attachment.',
    'Google Drive File ID':'The Drive file ID — used by Sera for access checks and text export.',
    'Google Drive Link':   'Direct link to this file in Google Drive.',
    'Access Status':       'Whether roots@amora.cr can access this file. Needs Access = share it with roots@amora.cr.',
    'Processing Status':   'Where this asset is in Sera\'s extraction pipeline.',
    'Received At':         'When Sera first received the notification about this asset.',
    'Processed At':        'When Sera successfully processed and extracted content from this asset.',
    'Error Message':       'Technical error if processing failed — useful for debugging.',
    'Retry Count':         'How many times Sera has retried this asset. At 4 retries it escalates to Manual Review.',
    'Next Retry At':       'Scheduled time for the next access retry attempt.',
    Meeting:               'The parent meeting record this asset belongs to.',
  },

  messages: {
    'Message Title':       'AI-generated title summarizing the email content.',
    'Sender Profile':      'The sender, resolved to a Profiles record.',
    Recipients:            'Who the email was sent to (text reference for context).',
    Date:                  'Date the email was sent or received.',
    Summary:               'AI-generated 2-3 sentence summary of what the email is about.',
    Requests:              'Explicit asks or requests made in the email.',
    Commitments:           'Explicit promises made by the sender. These should also appear as Tasks.',
    Questions:             'Open questions raised in the email that may need answers.',
    'Emotional Tone':      'AI assessment of the email\'s emotional register.',
    Urgency:               'How time-sensitive the email\'s content appears to be.',
    'Follow-Up Needed':    'Checked if this email requires a response or follow-up action.',
    'Confidentiality Level':'Standard = normal. Sensitive = limited circulation. Restricted = admin only.',
    'Processing Status':   'Whether Sera successfully extracted and stored this message.',
  },

  profiles: {
    Name:                      'Person\'s or organization\'s full name.',
    'Profile Type':            'Person, Organization, or Both (e.g. a sole trader who is also their own business).',
    'Engagement Status':       'Current state of this person\'s relationship with Amora.',
    'Relationship to Amora':   'How this person or org relates to Amora (Member, Partner, Vendor, Advisor, Funder, etc.).',
    'Role / Title':            'Their job title or role inside or outside Amora.',
    Tags:                      'Skills and domain areas. Used for filtering and finding the right people for initiatives.',
    Email:                     'Primary email address.',
    Phone:                     'Phone number.',
    LinkedIn:                  'LinkedIn profile URL.',
    Website:                   'Personal or organizational website.',
    Location:                  'Geographic location (city, country, or region).',
    'Context Summary':         'How this person came to Amora\'s attention and what the relationship is.',
    'Admin Notes':             'Internal admin-only notes — not for sharing with the wider community.',
    'Sensitive Notes Flag':    'Checked if this profile contains sensitive or confidential information.',
    'First Seen':              'Date this person first appeared in Sera\'s email processing.',
    'Last Seen':               'Date this person most recently appeared in Sera\'s processing.',
    Source:                    'Which email or meeting first introduced this person.',
    // Back-reference relations added by migrations
    'Circle Memberships':      'The Amora circles this person is a member of.',
    Organization:              'The organization this person is associated with (for Person type profiles).',
    'Referred By':             'Who introduced this person to Amora.',
    'Role at Amora':           'Their current active role within Amora\'s CCOS governance structure.',
    'Policies Approved':       'Amora policies this person has formally ratified.',
    'Tasks Owned':             'Tasks assigned to this person.',
    'Canon Reviews':           'Canon change requests assigned to this person for review.',
    'Decisions to Review':     'Decision candidates assigned to this person for review or confirmation.',
    'Role Assignments Held':   'Current and past role assignments this person has held within Amora.',
    'Ledger Approvals':        'CCOS governance ledger entries approved by this person.',
    Referrals:                 'Other profiles who were referred to Amora by this person.',
    Members:                   'Organization members, if this is an Organization type profile.',
    'Meetings Attended':       'Meetings this person attended or organized, linked from the Meetings database.',
    'Owned Risks':             'Risks that this person is responsible for monitoring and mitigating.',
    'Role Assignments':        'Role assignments this person holds or has held.',
    'Meetings Organized':      'Meetings this person organized.',
    'Circles Led':             'Circles where this person is the Lead Steward.',
    'Memories to Review':      'Memory candidates assigned to this person for review before approval.',
    'Projects Led':            'Projects where this person is the project lead.',
    'Decisions Made':          'Decisions attributed to this person as the decision maker.',
  },

  projects: {
    'Project Name':    'Name of the initiative or project.',
    Status:            'Current lifecycle state.',
    'Team Profiles':   'People involved in this project, resolved from Profiles.',
    'Lead Profile':    'The person leading this project, resolved from Profiles.',
    Priority:          'How urgent or important this project is relative to others.',
    'Start Date':      'When work began or is planned to begin.',
    'Target Date':     'Deadline or goal completion date.',
    'Completed Date':  'When this project was finished.',
    Description:       'What this project is and why it matters.',
    'Completion Notes':'What was accomplished and lessons learned.',
    Source:            'Which email or meeting originated this project.',
    Tasks:             'Action items that belong to this project.',
  },

  circles: {
    'Circle Name':      'Full name of this CCOS governance circle.',
    Sector:             'Which of the 7 CCOS life sectors this circle operates in. Leave blank for Amora-specific circles.',
    Status:             'Active = operating. Proposed = forming. Inactive = paused. Archived = dissolved.',
    'Parent Circle':    'The circle this one is nested inside, if applicable.',
    'Sub-Circles':      'Circles nested inside this one.',
    Purpose:            'Why this circle exists — its core reason for being.',
    Domains:            'What this circle has exclusive authority over. Other circles need permission to act here.',
    Accountabilities:   'What this circle is expected to do on an ongoing, recurring basis.',
    KPIs:               'Key metrics used to assess whether this circle is fulfilling its purpose.',
    'Meeting Cadence':  'How often this circle meets and what types of meetings it holds.',
    'Review Cadence':   'How often this circle\'s health and structure should be formally reviewed.',
    'Next Review Date': 'Auto-calculated from Review Cadence and Last Review Date — when the next governance review is due.',
    'Last Review Date': 'When this circle was last formally reviewed by the governance process.',
    Notes:              'Additional context, history, or working notes about this circle.',
    // Back-reference relations
    Roles:              'Roles that belong to this circle.',
    'Role Assignments': 'Active and historical role assignments within this circle.',
    'Circle Members':   'Members of this circle, linked from Profiles.',
    'Circle Assignments':'People assigned to this circle via the circle membership process.',
    Projects:           'Projects this circle owns or leads.',
    'Ledger Entries':   'CCOS governance ledger entries associated with this circle.',
    'Circle Policies':  'Amora policies this circle is responsible for.',
  },

  roles: {
    'Role Name':           'Full name of this role.',
    'Role Type':           'Lead Steward, Rep Steward, Admin Facilitator, and AI Secretary are CCOS core roles. Custom Role = all others.',
    Status:                'Active = filled or open. Proposed = not yet ratified. Vacant = unfilled. Archived = dissolved.',
    Purpose:               'Why this role exists — its core reason for being.',
    Domains:               'What this role has exclusive authority over within its circle.',
    Accountabilities:      'What this role is expected to do on an ongoing, recurring basis.',
    'Term Length':         'How long an assignment to this role lasts before renewal or re-election.',
    'Assignment Method':   'How someone fills this role: Consent Election, Appointed, Volunteer, or Interim.',
    'Next Audit Date':     'Auto-calculated from Term Length and Last Audit Date — when this role\'s assignment is due for review.',
    'Last Audit Date':     'When this role\'s assignment was most recently reviewed.',
    Notes:                 'Additional context or working notes about this role.',
    Source:                'Which email or meeting defined or updated this role.',
    // Back-reference relations
    'Role Assignments':    'Active and historical assignments to this role.',
    'Profile Holders':     'People who currently hold or have held this role, linked from Profiles.',
    'Decisions by Role':   'Decisions attributed to this role as the accountable decision-maker.',
    'Tasks by Role':       'Tasks assigned to this role as the accountable party.',
    'Risks by Role':       'Risks where this role is the responsible steward.',
    'Ledger Entries':      'CCOS governance ledger entries where this role was involved.',
  },

  roleAssignments: {
    'Assignment Title': 'Auto-generated label combining the person\'s name and role name.',
    Role:               'The role being assigned.',
    'Role Holder':      'The person holding this role.',
    Circle:             'The circle this assignment belongs to.',
    Status:             'Active = holding the role. Delegated = passed to another. Completed = term finished. Suspended = paused.',
    'Assignment Type':  'How this person came to hold the role.',
    'Start Date':       'When this assignment began.',
    'End Date':         'When this assignment ended or is scheduled to end.',
    'Term Length':      'Length of the assignment term.',
    'Next Review Date': 'Auto-calculated — when this assignment is due for renewal or re-election.',
    'Source Evidence':  'The text from the meeting or email that recorded this assignment.',
    Notes:              'Context about the assignment, delegation details, or renewal notes.',
  },

  tasks: {
    Task:              'Description of the action item.',
    Owner:             'The person responsible for completing this task.',
    'Assigned Role':   'The role responsible when no specific person is named.',
    Project:           'The project or initiative this task belongs to.',
    Meeting:           'The meeting where this task was created or discussed.',
    'Source Decision': 'The decision that triggered this task, if applicable.',
    'Source Risk':     'The risk this task is meant to mitigate, if applicable.',
    'Source Evidence': 'The exact text from the source that generated this task.',
    'Source Document': 'Link to the Google Drive document (transcript or notes) this task was extracted from.',
    'Due Date':        'When this task needs to be completed.',
    Priority:          'How urgent or important this task is.',
    Status:            'Current state. Needs Owner = no one assigned yet.',
    'Canon Impact':    'Checked if completing this task would affect CCOS governance canon.',
    'Estimated Hours': 'Rough time estimate for planning purposes.',
    'Completed Date':  'When this task was marked done.',
    Notes:             'Additional context, blockers, or updates.',
  },

  decisionCandidates: {
    Decision:                'A clear statement of what was decided or proposed.',
    Status:                  'Candidate = proposed. Confirmed = formally approved. Needs Clarification = incomplete info.',
    'Source Evidence':       'The exact text that supports this decision.',
    'Decision Maker Profile':'The person who made or will make this decision, resolved from Profiles.',
    'Decision Maker Role':   'The role accountable for this decision when no specific individual is named.',
    'Reviewer Profile':      'The person assigned to confirm or challenge this decision, resolved from Profiles.',
    Meeting:                 'The meeting where this decision was made or discussed.',
    'Canon Impact':          'Checked if this decision affects CCOS governance, policy, or the Living Constitution.',
    'Needs Confirmation':    'Checked if this was extracted as a proposal still needing explicit sign-off.',
    'Approved Date':         'Date this decision was formally confirmed.',
    'Source Document':       'Link to the Google Drive document this decision was extracted from.',
    'Related Tasks':         'Tasks that were created as a result of this decision.',
    'Resolved Tensions':     'CCOS ledger tension entries that this decision resolved.',
  },

  risks: {
    Risk:                 'Description of the risk or concern.',
    Category:             'What domain this risk falls into.',
    Severity:             'How serious this risk is if it materializes.',
    Evidence:             'The source text that identified this risk.',
    'Suggested Mitigation':'AI-suggested ways to reduce or address this risk.',
    Owner:                'The person responsible for monitoring and mitigating this risk.',
    'Owner Role':         'The role responsible when no specific person is named.',
    Meeting:              'The meeting where this risk was raised.',
    Status:               'Open = active. Mitigated = addressed. Accepted = acknowledged. Closed = no longer relevant.',
    'Resolution Notes':   'How this risk was resolved or why it was closed.',
    'Resolved Date':      'When this risk was resolved or closed.',
    'Mitigation Tasks':   'Tasks created specifically to mitigate this risk.',
    'Source Document':    'Link to the Google Drive document this risk was extracted from.',
  },

  memoryReviewQueue: {
    'Proposed Memory':      'A concise factual statement of the institutional knowledge worth preserving.',
    Category:               'What kind of memory this is.',
    'Source Evidence':      'The text that prompted this memory candidate.',
    Confidence:             'How certain Sera is that this is a stable, accurate fact worth keeping.',
    'Risk If Added':        'Potential harm from storing this — e.g. sensitive, contested, or could mislead.',
    'Risk If Ignored':      'What might be lost if this is not preserved as institutional memory.',
    'Suggested Destination':'Where this memory should ultimately live (e.g. a specific database or document).',
    'Reviewer Profile':     'The person who should review this candidate before it is approved, from Profiles.',
    Meeting:                'The meeting that produced this memory candidate.',
    Status:                 'Pending Review = awaiting human review. Approved = ready to implement.',
    'Approved Date':        'When a reviewer approved this memory for institutional storage.',
    'Implemented Link':     'Link to where this memory was actually stored after approval.',
  },

  canonChangeRequests: {
    'Proposed Change':    'A clear description of the proposed change to CCOS governance canon.',
    'Affected Canon Area':'Which part of the governance framework this change touches.',
    Reason:               'Why this change is being proposed.',
    'Source Evidence':    'The text from the meeting or email that prompted this request.',
    Reviewer:             'The person assigned to review and approve or reject this canon change request.',
    'Implementer Profile':'The person who carried out the implementation of this change, from Profiles.',
    'Affected Policy':    'The Amora policy record this change would affect, if applicable.',
    Status:               'Pending Review = awaiting governance decision. Approved = ratified. Implemented = carried out.',
    'Approved Date':      'When the governing body approved this change.',
    'Implementation Link':'Link to the updated governance document or record after implementation.',
    'Resolved Tensions':  'CCOS ledger tension entries that this canon change resolved.',
  },

  ccosLedgerEntries: {
    'Ledger Entry':             'Description of the governance action or event that occurred.',
    'Ledger Type':              'Tension = problem raised. Proposal = something proposed. Decision = formally decided. Policy or Role = governance changes.',
    Evidence:                   'The source text supporting this ledger entry.',
    Status:                     'Draft = recorded. Pending Review = awaiting circle review. Approved = confirmed. Resolved = addressed.',
    'Review Required':          'Checked if this entry needs explicit governance circle review before being considered final.',
    'Approved By':              'Name of the person or role that approved this governance action.',
    'Approved Date':            'Date this entry was approved by the governance circle.',
    'Resolution Notes':         'How this governance action was resolved or what resulted from it.',
    'Resolved Date':            'Date this entry was fully resolved.',
    'Resolved By Decision':     'The decision that resolved this tension or proposal.',
    'Resolved By Canon Change': 'The canon change request that resolved this tension or proposal.',
  },

  processingEvents: {
    'Event ID':         'Auto-generated unique identifier for this processing event record.',
    'Tenant ID':        'Organization identifier (always "amora") — supports future multi-tenant deployments.',
    'Source Type':      'What kind of input triggered this processing event.',
    'Source ID':        'The Notion page ID or email Message-ID this event relates to.',
    'Event Type':       'Which specific processing step this event records.',
    Status:             'Whether this processing step completed successfully.',
    'Started At':       'When this processing step began.',
    'Completed At':     'When this step finished.',
    Error:              'Technical error message if this step failed — useful for debugging.',
    'Retry Count':      'How many retries were attempted for this processing step.',
    'Created Records':  'Comma-separated Notion page IDs created during this event.',
    'Claude Model Used':'Which AI model was used for extraction in this event.',
    'Token Estimate':   'Approximate tokens consumed by the AI call — used to monitor processing cost.',
  },

  policies: {
    'Policy Name':          'Full name of this Amora policy.',
    'Policy ID':            'Auto-incrementing unique identifier for this policy.',
    'Policy Ref':           'Auto-generated reference code: area abbreviation + zero-padded number (e.g. GOV-003).',
    'Policy Area':          'Which governance domain this policy governs.',
    Status:                 'Active = in force. Under Review = being evaluated. Superseded = replaced. Draft = not yet ratified.',
    'Current Text Summary': 'Plain-language summary of what this policy says and requires.',
    'Review Cadence':       'How often this policy should be formally reviewed by the responsible circle.',
    'Next Review Date':     'Auto-calculated from Review Cadence and Last Review Date.',
    'Last Review Date':     'When this policy was most recently reviewed and confirmed as current.',
    'Effective Date':       'When this policy came into force.',
    'Approved By':          'The person or role who ratified this policy.',
    'Responsible Circle':   'The circle responsible for upholding and periodically reviewing this policy.',
    'Canon Changes':        'Canon change requests that have affected this policy.',
    Notes:                  'Drafting history, related decisions, or implementation notes.',
  },

  knowledgeBase: {
    'KB Title':            'Clear, specific article title — describes what the article helps you do or understand.',
    Category:              'Primary domain or type of this article.',
    Audience:              'Who this article is for — used to filter the KB by role or familiarity level.',
    Summary:               '2-3 sentence overview of what this article covers and why it matters.',
    'Key Points':          'Core guidance, instructions, or facts — the main content of the article.',
    Source:                'Which email, meeting, or document this article was derived from.',
    Status:                'Draft = not ready. Published = available. Archived = outdated. Stale = may need updating.',
    Confidence:            'High = verified guidance. Medium = inferred best practice. Low articles are not published.',
    'Possible Duplicate Of':'Title of another KB article this may overlap with — check before publishing.',
    'Last Enriched At':    'When this article was most recently updated or improved by Sera or a team member.',
    'Published At':        'When this article was first made available to the relevant audience.',
  },

  sensitiveReview: {
    Issue:                 'Brief label for the sensitive matter that was flagged by Sera.',
    Reason:                'Why Sera flagged this — the specific concern that triggered the sensitive flag.',
    'Recommended Handling':'Sera\'s suggested next step for handling this matter sensitively.',
    Status:                'Pending Review = needs attention. Reviewed = looked at. Escalated = needs leadership.',
    Source:                'Which email or meeting record contained this sensitive content.',
    'Date Flagged':        'When Sera flagged this item.',
    'Reviewed By':         'The admin who reviewed this sensitive flag.',
    'Review Notes':        'Admin\'s notes and decision after reviewing.',
    'Reviewed Date':       'When an admin completed the review of this sensitive flag.',
  },
};

// For formula properties, send empty config — Notion rejects echoing back complex expressions.
// Rollup and unique_id configs must be echoed back in full (Notion requires their sub-fields).
const EMPTY_TYPE_CONFIG = new Set(['formula']);

// Notion system properties that Notion auto-creates — skip descriptions for these
const SYSTEM_PROPS = new Set([
  'Created by', 'Created time', 'Last edited by', 'Last edited time',
]);

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchDb(dbId: string): Promise<any> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET database ${dbId}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function patchDb(dbId: string, body: object): Promise<void> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`PATCH database ${dbId}: ${r.status} ${text}`);
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {

  // ── Step 1: Delete redundant back-reference properties ────────────────────
  console.log('\n── Step 1: Removing redundant properties ─────────────────────────────────');

  for (const [dbKey, propsToDelete] of Object.entries(REDUNDANT_PROPS)) {
    const dbId = DB[dbKey];
    if (!dbId) { console.log(`  skip  ${dbKey} — env var not set`); continue; }

    const schema = await fetchDb(dbId);
    await sleep(250);
    const existingNames = new Set(Object.keys(schema.properties ?? {}));

    for (const propName of propsToDelete) {
      if (!existingNames.has(propName)) {
        console.log(`  skip  ${dbKey}.${propName} — not found`);
        continue;
      }
      process.stdout.write(`  delete ${dbKey}.${propName} ... `);
      try {
        await patchDb(dbId, { properties: { [propName]: null } });
        console.log('ok');
      } catch (err: any) {
        console.log(`FAILED — ${err.message}`);
        console.log(`         (Synced back-references must be deleted from the Notion UI.)`);
      }
      await sleep(400);
    }
  }

  // ── Step 2: Add descriptions to all databases ─────────────────────────────
  console.log('\n── Step 2: Patching property descriptions ────────────────────────────────');

  for (const [dbKey, dbId] of Object.entries(DB)) {
    if (!dbId) {
      console.log(`  skip  ${dbKey} — env var not set`);
      continue;
    }

    const descriptions = DESCRIPTIONS[dbKey];
    if (!descriptions) {
      console.log(`  skip  ${dbKey} — no descriptions defined`);
      continue;
    }

    // Fetch current schema to know which properties actually exist
    let schema: any;
    try {
      schema = await fetchDb(dbId);
    } catch (err: any) {
      console.log(`  ERROR ${dbKey} — could not fetch schema: ${err.message}`);
      continue;
    }
    await sleep(250);

    const currentProps = schema.properties ?? {};
    const patch: Record<string, any> = {};
    const missing: string[] = [];
    const needsDesc: string[] = [];

    // Build patch — Notion requires type config alongside the description field
    for (const [propName, description] of Object.entries(descriptions)) {
      if (propName in currentProps) {
        const existing = currentProps[propName];
        const typeKey = existing.type as string;
        // For formula/rollup/unique_id, use empty config — echoing the expression causes parse errors
        const typeConfig = EMPTY_TYPE_CONFIG.has(typeKey) ? {} : (existing[typeKey] ?? {});
        patch[propName] = { [typeKey]: typeConfig, description };
      } else {
        missing.push(propName);
      }
    }

    // Report properties in Notion with no description defined (excluding system props)
    for (const propName of Object.keys(currentProps)) {
      if (!(propName in descriptions) && !SYSTEM_PROPS.has(propName)) {
        needsDesc.push(propName);
      }
    }

    if (Object.keys(patch).length === 0) {
      console.log(`  skip  ${dbKey} — no matching properties to describe`);
      continue;
    }

    process.stdout.write(`  patch ${dbKey} (${Object.keys(patch).length} props) ... `);
    try {
      await patchDb(dbId, { properties: patch });
      console.log('ok');
    } catch (err: any) {
      console.log(`FAILED — ${err.message}`);
    }
    await sleep(400);

    if (missing.length) {
      console.log(`        not in Notion:    ${missing.join(', ')}`);
    }
    if (needsDesc.length) {
      console.log(`        no description:   ${needsDesc.join(', ')}`);
    }
  }

  console.log('\nDone. Hover any column header in Notion to see property descriptions.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
