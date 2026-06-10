/**
 * Adds descriptive tooltips to every property in all 16 Amora Living Memory Hub databases.
 *
 * Usage:
 *   npx ts-node scripts/set-property-descriptions.ts
 *
 * Prerequisites:
 *   - NOTION_API_KEY in .env
 *
 * Safe to re-run: PATCH only updates fields explicitly included in the payload.
 */

import * as dotenv from 'dotenv';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
  console.error('NOTION_API_KEY is required in .env');
  process.exit(1);
}

const BASE_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const HEADERS = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': NOTION_VERSION,
  'Content-Type': 'application/json',
};

// The Notion API requires the property type config to be present alongside description.
// We fetch the current schema, then re-include each property's type in the PATCH.
async function patchDatabase(dbId: string, descriptions: Record<string, string>) {
  // 1. Fetch current schema to get property types
  const getRes = await fetch(`${BASE_URL}/databases/${dbId}`, { headers: HEADERS });
  if (!getRes.ok) {
    const err = await getRes.text();
    throw new Error(`GET DB ${dbId} → ${getRes.status}: ${err}`);
  }
  const schema: any = await getRes.json();
  const existingProps: Record<string, any> = schema.properties ?? {};

  // 2. Build PATCH payload: include existing type config + new description
  const properties: Record<string, any> = {};
  for (const [propName, desc] of Object.entries(descriptions)) {
    const existing = existingProps[propName];
    if (!existing) {
      console.warn(`\n    ⚠ property '${propName}' not found in DB ${dbId}, skipping`);
      continue;
    }
    // Extract just the type key and its config (e.g. { rich_text: {} } or { select: { options: [...] } })
    const IGNORED_KEYS = new Set(['id', 'name', 'type', 'description']);
    const typeConfig: Record<string, any> = {};
    for (const [k, v] of Object.entries(existing)) {
      if (!IGNORED_KEYS.has(k)) typeConfig[k] = v;
    }
    properties[propName] = { ...typeConfig, description: desc };
  }

  // 3. PATCH
  const patchRes = await fetch(`${BASE_URL}/databases/${dbId}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ properties }),
  });
  if (!patchRes.ok) {
    const err = await patchRes.text();
    throw new Error(`PATCH DB ${dbId} → ${patchRes.status}: ${err}`);
  }
  return patchRes.json();
}

// ─── Database IDs ─────────────────────────────────────────────────────────────

const DB = {
  sourceEmails:        '3670a88e-f36a-818f-97ad-c6c2195a4b52',
  meetings:            '3670a88e-f36a-81f6-9df7-e3e3a8c28063',
  meetingAssets:       '3670a88e-f36a-81bd-bb5f-ee45ac046888',
  messages:            '3670a88e-f36a-81f0-914c-e5a587a5603d',
  profiles:            '3680a88e-f36a-819f-9074-f4fcc0405569',
  projects:            '3680a88e-f36a-81c9-a91b-e62b0b3862d8',
  tasks:               '3670a88e-f36a-8103-b5a8-c87733d13902',
  decisionCandidates:  '3670a88e-f36a-81df-aaad-fb1712cdb4b3',
  risks:               '3670a88e-f36a-8157-8890-ccf7efa5a65b',
  memoryReviewQueue:   '3670a88e-f36a-8139-bd3c-f30c83d361fb',
  canonChangeRequests: '3670a88e-f36a-816b-ac6f-f89269e947dd',
  ccosLedgerEntries:   '3670a88e-f36a-8116-901f-c7470f2703d7',
  circles:             '3680a88e-f36a-8129-bf10-f0071f7c5235',
  roles:               '3680a88e-f36a-81d4-bbfd-db16628d971b',
  roleAssignments:     '3680a88e-f36a-81c9-82bc-d3da1079c100',
  processingEvents:    '3670a88e-f36a-8106-8a3e-f4275ab7e26e',
};

// ─── Property description sets ────────────────────────────────────────────────

const DESCRIPTIONS: Record<string, Record<string, string>> = {  // values = raw description strings, wrapped into { description } in patchDatabase

  [DB.sourceEmails]: {
    Title:              'Auto-generated label: email subject + received date.',
    'Message ID':       'RFC 2822 Message-ID header — primary dedup key. Prevents re-processing the same email if the worker restarts before marking it seen.',
    'Thread Reference': 'In-Reply-To and References headers combined — used to group replies and forwards into the same thread.',
    From:               'Sender email address from the From header.',
    To:                 'Primary recipient(s) from the To header.',
    CC:                 "CC recipients — used to detect if roots@amora.cr was CC'd rather than the primary addressee.",
    'BCC Indicator':    'True if roots@amora.cr received this email via BCC (address not visible in To or CC).',
    'Received Date':    'Timestamp when the email arrived in the WPX IMAP mailbox.',
    Subject:            'Full email subject line.',
    'Email Type':       'Classified email type — determines which pipeline branch handles this email (Meeting Asset, Operational, or Unknown).',
    'Source Category':  'Broad grouping: Meeting Asset (recording/transcript/notes), Operational (actionable email), or Unknown.',
    'Raw Snippet':      'First ~500 characters of the email body for quick human triage.',
    'Detected Links':   'URLs extracted from the email body — Google Drive links, Meet links, etc.',
    'Processing Status':'Current pipeline state. Pending → Processing → Processed (or Failed → retried → Manual Review).',
    'Error Log':        'Last pipeline error if processing failed — cleared on successful retry.',
    'Processed At':     'Timestamp when the pipeline finished processing this email.',
  },

  [DB.meetings]: {
    'Meeting Title':          'Human-readable meeting title derived from the email subject.',
    'Capture Key':            'Dedup fingerprint. Priority order: cal:{id} > meet:{code}:{date} > title:{subject}:{domain}:{date} > drive:{fileId} > msg:{messageId}. Stable across re-sends of the same meeting notification.',
    'Meeting Date':           'Date the meeting occurred — extracted from the email body, not the received date.',
    Organizer:                "Meeting organizer email — parsed from body patterns ('organized by', 'invited you', 'host:') before falling back to the From header (which is always a Google noreply).",
    Participants:             'Comma-separated list of participants extracted by Claude from the transcript or notes content.',
    'Google Calendar Link':   'Full Google Calendar event URL reconstructed from the eid= parameter in the notification email.',
    'Google Meet Link':       'Google Meet room URL (meet.google.com).',
    'Recording Link':         'Google Drive URL of the meeting recording (MP4/video file).',
    'Transcript Link':        'Google Drive URL of the meeting transcript (Google Doc).',
    'Notes Link':             'Google Drive URL of the Gemini-generated meeting notes (Google Doc).',
    'Recording Access Status':'Whether roots@amora.cr can access the recording file via Google Drive API (canDownload or canCopy).',
    'Transcript Access Status':'Whether roots@amora.cr can access the transcript file via Google Drive API.',
    'Notes Access Status':    'Whether roots@amora.cr can access the notes file via Google Drive API.',
    'Processing Status':      'Pending=not yet processed, Partial=recording detected but no text extracted yet, Processed=full extraction complete.',
    Summary:                  'Claude-generated meeting summary with a short headline and detailed narrative.',
    'Decisions Count':        'Number of decision candidates extracted from this meeting.',
    'Tasks Count':            'Number of tasks extracted from this meeting.',
    'Risks Count':            'Number of risks extracted from this meeting.',
    'Memory Candidates Count':'Number of memory candidates extracted from this meeting.',
    'Canon Review Required':  'True if Claude flagged content that may require a CCOS canon change.',
    'Sensitive Review Required':'True if Claude flagged sensitive or restricted content requiring admin review.',
    'Last Processed At':      'Timestamp of the most recent successful extraction run for this meeting.',
    'Automation Log':         'Freeform pipeline action log — access requests, retries, errors.',
  },

  [DB.meetingAssets]: {
    'Asset Name':         "Descriptive label: '{Asset Type} for {Meeting Title}'.",
    'Asset Type':         'Type of Google Meet output: Recording, Transcript, Gemini Notes, Chat Log, Caption File, Attachment, or Unknown.',
    'Google Drive File ID':'Google Drive file ID used for access checks (Drive API) and text export (Docs API).',
    'Google Drive Link':  'Direct Google Drive URL for this asset file.',
    'Access Status':      'Whether roots@amora.cr can download or copy this file. Set by the GoogleAccessService access check.',
    'Processing Status':  'Pending=waiting for access, Needs Access=access request sent to admin, Processed=extraction complete.',
    'Received At':        'Timestamp when the notification email for this asset was received.',
    'Processed At':       'Timestamp when this asset was successfully processed (text exported + extraction complete).',
    'Error Message':      'Last error from access check or extraction — cleared on successful retry.',
    'Retry Count':        'Number of access-check or extraction retries attempted. After 4 retries the asset moves to Manual Review.',
    'Next Retry At':      'Scheduled timestamp for the next retry attempt (0 min → 30 min → 2 h → 24 h delays).',
  },

  [DB.messages]: {
    'Message Title':        'Subject line of the operational or forwarded email.',
    Sender:                 'From address of the email.',
    Recipients:             'All recipients (To + CC) concatenated.',
    Date:                   'Date the email was sent.',
    Summary:                'Claude-generated 2–3 sentence summary of the email purpose and key content.',
    Requests:               'Explicit asks or requests identified by Claude in the email.',
    Commitments:            'Commitments or promises made in the email, per Claude extraction.',
    Questions:              'Open questions raised in the email that may need follow-up.',
    'Emotional Tone':       "Claude's assessment of the emotional register: Neutral, Positive, Tense, Urgent, or Unclear.",
    Urgency:                "Claude's assessment of how time-sensitive this email is.",
    'Follow-Up Needed':     'True if Claude identified action items, requests, or open questions requiring a response.',
    'Confidentiality Level':'Standard=routine handling, Sensitive=handle with care, Restricted=high sensitivity. Sensitive and above trigger an admin review alert.',
    'Processing Status':    'Pipeline state for this message record.',
  },

  [DB.profiles]: {
    Name:                  'Full name of the person or organization — used as the upsert key (case-insensitive exact match).',
    'Profile Type':        'Person, Organization, or Both (e.g., a named company where the primary contact is the same entity).',
    'Engagement Status':   'Current relationship status with Amora.',
    'Relationship to Amora':'How this entity relates to Amora Living: Member, Partner, Vendor, Advisor, Funder, Contact, Community, Alumni, Government, or Unknown.',
    'Role / Title':        'Professional title or role at their own organization — free text for external roles (e.g. "CEO", "Professor").',
    Tags:                  'Functional area tags for cross-database filtering and discovery.',
    Email:                 'Primary email address for this profile.',
    Phone:                 'Primary phone number.',
    LinkedIn:              'LinkedIn profile URL.',
    Website:               'Personal or organization website.',
    Location:              'Geographic location: city, country, or region.',
    'Context Summary':     "Claude-generated summary of who this person is and why they matter to Amora — drawn from email and meeting context.",
    'Admin Notes':         'Internal notes for admin use — not shown in public-facing views.',
    'Sensitive Notes Flag':'True if this profile has sensitive information requiring careful handling before sharing.',
    'First Seen':          'Date this profile was first created in the system.',
    'Last Seen':           'Date this profile last appeared in a processed email or meeting.',
    Source:                'The email or meeting that first created this profile record.',
  },

  [DB.projects]: {
    'Project Name': 'Name of the initiative or project — used as the upsert key.',
    Status:         'Current lifecycle stage: Proposed, Active, On Hold, Complete, or Cancelled.',
    Circle:         'The CCOS circle responsible for or most closely associated with this project.',
    'Project Lead': 'Person responsible for driving this project forward.',
    Priority:       'Relative urgency or strategic importance: High, Medium, or Low.',
    'Start Date':   'When the project was initiated or first mentioned in a processed email or meeting.',
    'Target Date':  'Intended completion or milestone date.',
    Description:    "Claude-extracted description of the project's scope, goals, and context.",
    Source:         'The email or meeting where this project was first identified.',
  },

  [DB.tasks]: {
    Task:              'Action item text as extracted by Claude — kept close to verbatim from source.',
    Owner:             'Person assigned to or mentioned as responsible for completing this task.',
    'Source Evidence': 'Direct quote or context from the source email or meeting that supports this task extraction.',
    'Due Date':        'Deadline mentioned in the source, if any.',
    Priority:          'Urgency level: High (explicit deadline or blocking), Medium (routine), Low (nice-to-have).',
    Status:            'Open=not started, In Progress=underway, Done=complete, Cancelled=dropped, Needs Owner=unassigned.',
    'Needs Owner':     'True if no owner was identified in the source — requires a human to assign ownership.',
    'Canon Impact':    'True if Claude believes this task may require a CCOS canon change to complete.',
  },

  [DB.decisionCandidates]: {
    Decision:           'The proposed or observed decision, stated as a clear declarative sentence.',
    Status:             'Candidate=AI-extracted not yet reviewed, Confirmed=human-validated, Rejected=not actually a decision, Needs Clarification=ambiguous.',
    'Source Evidence':  'Direct quote or context from the source that supports this decision extraction.',
    'Decision Maker':   'Person or circle identified as having made or proposed this decision.',
    'Canon Impact':     'True if this decision may warrant a change to CCOS canon.',
    'Needs Confirmation':'True if the decision was inferred from context rather than explicitly stated.',
    Reviewer:           'Human reviewer assigned to validate this decision candidate.',
    'Approved Date':    'Date a reviewer confirmed this as a valid decision.',
  },

  [DB.risks]: {
    Risk:                  'Description of the identified risk in plain language.',
    Category:              'Type of risk: Operational, Financial, Legal, Governance, Interpersonal, Technical, or Unknown.',
    Severity:              'Potential impact if the risk materializes: High, Medium, or Low.',
    Evidence:              'Direct quote or context from the source that surfaced this risk.',
    'Suggested Mitigation':'Claude-suggested action to reduce, monitor, or address this risk.',
    Owner:                 'Person or circle best positioned to own and act on this risk.',
    Status:                'Open=unaddressed, Mitigated=action taken, Accepted=known and tolerated, Closed=no longer relevant.',
  },

  [DB.memoryReviewQueue]: {
    'Proposed Memory':      'Candidate memory statement — a concise, durable institutional fact worth encoding.',
    Category:               'Type of memory: Context, Relationship, Commitment, Decision, Learning, Process, or Unknown.',
    'Source Evidence':      'Direct quote or passage from the source that supports encoding this memory.',
    Confidence:             "Claude's confidence that this is genuinely memory-worthy: High, Medium, or Low.",
    'Risk If Added':        'Potential downside of encoding this memory (e.g., premature, contested, or sensitive).',
    'Risk If Ignored':      'What could be lost or misunderstood if this is not encoded in institutional memory.',
    'Suggested Destination':'Where Claude suggests this memory should live (e.g., specific Circle page, canon doc, or Profiles record).',
    Reviewer:               'Human reviewer assigned to evaluate and action this memory candidate.',
    Status:                 'Pending Review=awaiting human, Approved=accepted, Rejected=not memory-worthy, Needs Clarification=unclear.',
    'Approved Date':        'Date a reviewer approved this memory for encoding.',
    'Implemented Link':     'Link to where this memory was encoded after approval.',
  },

  [DB.canonChangeRequests]: {
    'Proposed Change':   'Description of the proposed CCOS canon amendment — stated as a specific, actionable change.',
    'Affected Canon Area':'Which area of canon this change would affect.',
    'Affected Canon Doc':'Specific document or section that would need to be updated.',
    Reason:              'Justification for why this change is needed — the problem it solves or the gap it addresses.',
    'Source Evidence':   'Quote or context from the meeting or email that surfaced this proposal.',
    Reviewer:            'Human reviewer responsible for evaluating and actioning this canon change request.',
    Status:              'Pending Review=awaiting human, Approved=accepted, Rejected=declined, Needs Clarification=unclear, Implemented=applied to canon, Archived=superseded.',
    'Approved Date':     'Date the change was approved by the appropriate decision-makers.',
    'Implemented By':    'Person who applied the actual change to the canon document.',
    'Implementation Link':'Link to the updated canon document after the change was applied.',
  },

  [DB.ccosLedgerEntries]: {
    'Ledger Entry':   'Description of the governance action, tension, proposal, or observation being recorded.',
    'Ledger Type':    'Type of CCOS governance entry: Tension, Proposal, Decision, Role, Policy, Resource, or Accountability.',
    Circle:           'Circle where this governance action occurred or is most relevant.',
    Role:             'Specific role involved in this governance entry, if applicable.',
    Evidence:         'Source material (quote, link, meeting reference) that documents this governance event.',
    Status:           'Draft=AI-created unreviewed, Pending Review=awaiting governance team, Approved=validated, Archived=superseded.',
    'Review Required':'True if this entry needs governance team review before it can be considered complete.',
    'Approved By':    'Person or circle that formally approved this ledger entry.',
    'Approved Date':  'Date this entry was formally approved.',
  },

  [DB.circles]: {
    'Circle Name':    'Name of the CCOS governance circle — used as the upsert key.',
    Sector:           "Which of Amora's 7 sectors this circle belongs to.",
    Status:           'Active=currently operating, Proposed=not yet ratified, Inactive=paused, Archived=dissolved.',
    'Circle Lead':    'Lead Steward responsible for this circle.',
    'Parent Circle':  'Parent circle in the CCOS hierarchy, if any.',
    Purpose:          "The circle's primary purpose as defined in its CCOS charter.",
    Domains:          'Areas of exclusive authority or stewardship held by this circle.',
    Accountabilities: 'Ongoing obligations this circle holds toward the broader organization.',
    KPIs:             'Key performance indicators or success metrics for this circle.',
    'Meeting Cadence':'How often this circle meets (e.g., weekly, bi-weekly, monthly).',
    'Next Review Date':'Date when this circle\'s charter and membership should next be reviewed.',
    'Last Review Date':'Date of the most recent governance review of this circle.',
    Notes:            'Additional context, history, or working notes about this circle.',
  },

  [DB.roles]: {
    'Role Name':         'Name of the CCOS role — used as the upsert key.',
    Circle:              'The circle this role belongs to.',
    'Role Type':         'Lead Steward, Rep Steward, Admin Facilitator, AI Secretary, or Custom Role.',
    Status:              'Active=filled and operating, Proposed=not yet ratified, Vacant=unfilled, Archived=retired.',
    Purpose:             'What this role exists to do — its core function within the circle.',
    Domains:             'Areas of authority or decision-making exclusive to this role.',
    Accountabilities:    'Ongoing responsibilities held by whoever fills this role.',
    'Term Length':       'Duration of appointment: No Term, 3 Months, 6 Months, 1 Year, or Custom.',
    'Assignment Method': 'How someone comes to fill this role: Consent Election, Appointed, Volunteer, or Interim.',
    'Next Audit Date':   "When this role's definition and current assignment should next be reviewed.",
    'Last Audit Date':   'Date of the most recent role audit.',
    Notes:               'Additional context or working notes about this role.',
    Source:              'The meeting or email where this role was first identified or last updated.',
  },

  [DB.roleAssignments]: {
    'Assignment Title':  "Auto-generated label: '{Role Holder} — {Role Name}' — used as the upsert key.",
    Role:                'Name of the role being held.',
    'Role Holder':       'Person filling this role.',
    Circle:              'Circle where this assignment is active.',
    Status:              'Active=currently in role, Delegated=temporarily transferred, Completed=term ended, Suspended=paused.',
    'Assignment Type':   'How this person came to hold the role: Consent Election, Appointed, Interim, or Volunteer.',
    'Start Date':        'When this assignment began.',
    'End Date':          'When this assignment ends or ended.',
    'Term Length':       'Duration of this assignment.',
    'Next Review Date':  'When this assignment should be reviewed or renewed.',
    'Source Evidence':   'Quote or context from the source email or meeting that documents this assignment.',
    Notes:               'Additional context about this role assignment.',
  },

  [DB.processingEvents]: {
    'Event ID':          "Auto-generated audit event identifier: '{event_type}:{source_id}:{timestamp}'.",
    'Tenant ID':         "Organization identifier written to every event — always 'amora' in this deployment.",
    'Source Type':       'Origin of this event: IMAP poll, a specific asset type (Recording/Transcript/Notes), Operational Email, Forwarded Thread, Retry, or Setup.',
    'Source ID':         'Identifier of the entity being processed — Message ID, Drive file ID, Notion page ID, or similar.',
    'Event Type':        'Specific pipeline step: poll_start, email_classified, asset_parsed, access_check, text_export, extraction, notion_write, access_request_sent, retry_scheduled, or error.',
    Status:              'started=in progress, completed=successful, failed=error occurred.',
    'Started At':        'Timestamp when this pipeline step began.',
    'Completed At':      'Timestamp when this pipeline step finished (success or failure).',
    Error:               "Error message and stack trace if Status is 'failed'.",
    'Retry Count':       'Number of times this specific event has been retried.',
    'Created Records':   'JSON array of Notion page IDs created during this event — useful for tracing what a run produced.',
    'Claude Model Used': 'Which Claude model was used for extraction (e.g., claude-sonnet-4-6 or claude-haiku-4-5).',
    'Token Estimate':    'Estimated total token usage for all Claude API calls in this event.',
  },
};

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  const entries = Object.entries(DESCRIPTIONS);
  console.log(`Updating property descriptions for ${entries.length} databases…\n`);

  for (const [dbId, properties] of entries) {
    const dbName = Object.entries(DB).find(([, id]) => id === dbId)?.[0] ?? dbId;
    process.stdout.write(`  ${dbName} … `);
    try {
      await patchDatabase(dbId, properties);
      console.log(`✓ (${Object.keys(properties).length} properties)`);
    } catch (err) {
      console.log(`✗ ERROR`);
      console.error(`    ${err}`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
