/**
 * Migration: property descriptions, logical ordering, and property groups
 *
 * For every production Notion database this script:
 *   1. Fetches the current schema (preserving existing select options and relation config)
 *   2. Applies property descriptions to all known properties
 *   3. Re-orders properties into UX-logical order for target users
 *   4. Attempts to create named property groups (sections) — skipped gracefully if API does not support it
 *   5. Marks Projects.Circle Text as deprecated (data is preserved; relation is canonical)
 *
 * Safe to run multiple times — idempotent.
 * Only updates properties that actually exist in the live DB (resilient to partial migrations).
 *
 * Usage:
 *   npx ts-node scripts/migrate-property-descriptions-and-groups.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ─── DB ID map ────────────────────────────────────────────────────────────────

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
  interactions:        process.env.NOTION_DB_INTERACTIONS,
  knowledgeBase:       process.env.NOTION_DB_KNOWLEDGE_BASE,
};

// ─── Property descriptions ────────────────────────────────────────────────────

const DESCRIPTIONS: Record<string, Record<string, string>> = {

  sourceEmails: {
    Title:              'Auto-generated title from email subject and classification.',
    'Message ID':       'Unique email message ID used for dedup — do not edit.',
    'Thread Reference': 'Email thread ID for grouping related messages.',
    From:               'Sender email address as received.',
    To:                 'Primary recipient address.',
    CC:                 'CC recipients, comma-separated.',
    'BCC Indicator':    'Checked if this email arrived as a BCC.',
    'Received Date':    'When the email arrived in the inbox.',
    Subject:            'Original email subject line.',
    'Email Type':       'Classification of this email: recording notification, transcript, notes, operational, or forwarded thread.',
    'Source Category':  'High-level category used for pipeline routing.',
    'Raw Snippet':      'First ~500 characters of the email body for quick scanning.',
    'Detected Links':   'URLs extracted from the email body.',
    'Processing Status':'Current pipeline state: Pending, Processing, Processed, Needs Access, Failed, or Manual Review.',
    'Error Log':        'Error details if processing failed. Check this first when troubleshooting.',
    'Processed At':     'Timestamp when pipeline processing completed for this email.',
  },

  meetings: {
    'Meeting Title':            'Name of the meeting, derived from the Google Calendar event or email subject.',
    'Capture Key':              'Internal dedup key — do not edit. Format: cal:{id}, meet:{code}:{date}, or title:{hash}.',
    'Meeting Date':             'Date the meeting took place, extracted from the email body (not the received date).',
    'Google Calendar Link':     'Link to the Google Calendar event for this meeting.',
    'Google Meet Link':         'Link to the Google Meet session.',
    'Recording Link':           'Google Drive link to the meeting recording.',
    'Transcript Link':          'Google Drive link to the auto-generated transcript.',
    'Notes Link':               'Google Drive link to the Gemini-generated meeting notes.',
    'Recording Access Status':  'Whether Sera has confirmed read access to the recording file.',
    'Transcript Access Status': 'Whether Sera has confirmed read access to the transcript file.',
    'Notes Access Status':      'Whether Sera has confirmed read access to the Gemini notes file.',
    'Processing Status':        'Partial = some assets processed; Processed = all assets complete; Failed = pipeline error.',
    Summary:                    'AI-generated summary of the meeting, extracted from transcript or Gemini notes.',
    'Canon Review Required':    'Checked if this meeting contains content that may require changes to governance documents or policies.',
    'Sensitive Review Required':'Checked if this meeting contains sensitive, personal, or confidential content.',
    'Last Processed At':        'Most recent timestamp when the pipeline ran against this meeting record.',
    'Automation Log':           'Internal pipeline notes about what was attempted and what succeeded.',
  },

  meetingAssets: {
    'Asset Name':           'Auto-generated: asset type + meeting title.',
    'Asset Type':           'Type of file: Recording, Transcript, Gemini Notes, Chat Log, Caption File, Attachment, or Unknown.',
    'Google Drive File ID': 'Raw file ID from Google Drive, used by the pipeline for access checks.',
    'Google Drive Link':    'Full Google Drive URL for this asset file.',
    'Access Status':        'Whether Sera can read this file: Confirmed, Needs Access, or Denied.',
    'Processing Status':    'Current pipeline state for this asset.',
    'Received At':          'When the email containing this asset link arrived.',
    'Processed At':         'When this asset was successfully exported and processed.',
    'Error Message':        'Details of any error that occurred during processing.',
    'Retry Count':          'Number of times the pipeline has attempted to process this asset.',
    'Next Retry At':        'Scheduled timestamp for the next processing attempt.',
  },

  messages: {
    'Message Title':       'Auto-generated or AI-summarized title for this message.',
    Recipients:            'Comma-separated recipient email addresses.',
    Date:                  'Date the message was sent or received.',
    Summary:               'AI-generated summary of the message content.',
    Requests:              'Specific asks or action requests extracted from the message.',
    Commitments:           'Promises or commitments made in the message.',
    Questions:             'Open questions raised that need a response.',
    'Emotional Tone':      'AI-assessed tone: Neutral, Positive, Tense, Urgent, or Unclear.',
    Urgency:               'Priority level based on content, language, and deadlines mentioned.',
    'Follow-Up Needed':    'Check if someone needs to respond to or act on this message.',
    'Confidentiality Level':'Standard = normal circulation; Sensitive = limit distribution; Restricted = admin only.',
    'Processing Status':   'Pipeline state for this message record.',
  },

  profiles: {
    Name:                   'Full name of the person or organization.',
    'Profile Type':         'Person, Organization, or Both (for individuals who also represent an org).',
    'Engagement Status':    'Current relationship status: Active, Inactive, Prospect, or Unknown.',
    'Relationship to Amora':'The role this person or org plays in relation to Amora.',
    'Primary Sector':       'Which of the 7 CCOS sectors this person or org operates in.',
    'Role / Title':         'Job title, role, or function (free text).',
    Tags:                   'Functional areas this person is involved in — used for filtering and outreach.',
    Email:                  'Primary email address.',
    Phone:                  'Primary phone number.',
    LinkedIn:               'LinkedIn profile URL.',
    Website:                'Personal or organizational website URL.',
    Location:               'City, country, or region.',
    'Context Summary':      'Key context Sera should know about this person or org — visible in AI answers.',
    'Admin Notes':          'Internal notes for admin use only. Not included in AI context by default.',
    'Sensitive Notes Flag': 'Check if this profile contains sensitive personal information requiring restricted access.',
    'First Seen':           'Date this person or org first appeared in records.',
    'Last Seen':            'Most recent date this person appeared in an email or meeting.',
    Source:                 'Where this profile was first identified (email, meeting, manual entry).',
    'Lead Stage':           'CRM funnel stage if this is a potential partner, funder, or client.',
    'Lead Source':          'How this lead was originally acquired.',
    'Next Action':          'What should happen next with this person or org.',
    'Follow-up Date':       'When to follow up.',
    'Follow-up Owner':      'Who is responsible for the next action. Consider using the Profiles relation for tracked assignment.',
  },

  interactions: {
    Name:              'Brief title describing this interaction.',
    Date:              'Date the interaction occurred.',
    Type:              'What kind of interaction this was: Email, Meeting, Call, Note, Forward, or Other.',
    Direction:         'Inbound = they contacted us; Outbound = we contacted them; Internal = within the team.',
    Summary:           'Brief description of what happened and any key outcomes.',
    'Logged By':       'Name of the person who logged this interaction. Use the Contacts relation for full profile linkage.',
    'Follow-up Needed':'Check if a follow-up action or response is required.',
  },

  knowledgeBase: {
    'KB Title':            'Short, descriptive title for this knowledge item.',
    Category:              'Topic area this knowledge belongs to.',
    Audience:              'Who this knowledge item is most relevant for.',
    Summary:               'One or two sentence description of what this item covers.',
    'Key Points':          'Numbered or bulleted main takeaways.',
    Source:                'Where this knowledge came from (meeting, email, manual entry).',
    Status:                'Draft = in progress; Published = approved for use; Archived = no longer current.',
    Confidence:            'High = verified and reliable; Medium = AI-extracted, may need review.',
    'Possible Duplicate Of':'Link or name of a possibly similar KB article to check before publishing.',
    'Last Enriched At':    'When this article was last updated with new information.',
    'Published At':        'When this article was approved and made available to the team.',
  },

  projects: {
    'Project Name':     'Short descriptive name for the initiative.',
    Status:             'Current state: Proposed, Active, On Hold, Complete, or Cancelled.',
    'Primary Sector':   'Which CCOS sector this project belongs to.',
    Priority:           'Relative importance compared to other active projects.',
    'Start Date':       'When work on this project began or is planned to begin.',
    'Target Date':      'Expected completion date.',
    'Completed Date':   'Actual completion date.',
    Description:        'Full description of project scope, goals, and success criteria.',
    'Completion Notes': 'Summary of outcomes, lessons learned, or handoff information.',
    Source:             'Where this project was identified or proposed (meeting, email, etc.).',
    'Circle Text':      '(Deprecated) Plain-text circle name, pre-dating the Circle relation. Use the Circle relation instead. This field is retained for historical data.',
  },

  tasks: {
    Task:                    'Short, action-oriented description of the work to be done.',
    Status:                  'Open = not started; In Progress = underway; Done = complete; Cancelled = no longer needed; Needs Owner = unassigned.',
    Priority:                'High = blocking or time-sensitive; Medium = important but not urgent; Low = do when capacity allows.',
    'Due Date':              'Target completion date.',
    'Source Evidence':       'Exact quote or reference from the source material where this task was identified.',
    Notes:                   'Additional context, updates, blockers, or relevant links.',
    'Canon Impact':          'Check if completing this task would change governance documents, roles, or policies.',
    'Estimated Hours':       'Rough estimate of time required to complete this task.',
    'Completed Date':        'When the task was marked Done or Cancelled.',
    Lifecycle:               'Active = currently relevant; Stale = may be outdated or superseded; Archived = no longer tracked.',
    'Extraction Confidence': 'How clearly this task was stated in the source: High = explicit, Medium = inferred, Low = uncertain.',
  },

  decisionCandidates: {
    Decision:                'Statement of the decision. Use past tense for confirmed decisions (e.g., "We agreed to..."). Use present for candidates.',
    Status:                  'Candidate = proposed but not ratified; Confirmed = consented; Rejected = declined; Needs Clarification = more info required.',
    'Source Evidence':       'Quote or reference from the meeting or email where this decision was recorded.',
    'Canon Impact':          'Check if this decision changes governance documents, roles, or policies.',
    'Needs Confirmation':    'Check if human review is required before treating this as a confirmed decision.',
    'Approved Date':         'Date the decision was formally confirmed or ratified.',
    'Purpose Alignment':     'How well this decision aligns with the governing purpose: Aligned, Neutral, Misaligned, or Unclear.',
    'Purpose Alignment Notes':'Brief explanation of the alignment assessment, especially when Misaligned or Unclear.',
    Lifecycle:               'Active = recently made or still relevant; Stale = may need revisiting; Archived = historical record only.',
    'Extraction Confidence': 'How confident Sera is in the quality of this extraction: High, Medium, or Low.',
  },

  risks: {
    Risk:                    'Short description of the risk or tension. Prefix with type for patterns (e.g., "[Burnout] ..." or "[Key Person] ...").',
    Category:                'Type: Operational, Financial, Legal, Governance, Interpersonal, Technical, or Unknown.',
    Severity:                'High = urgent, needs attention now; Medium = monitor closely; Low = track but low urgency.',
    Evidence:                'Specific evidence from meetings or emails that surfaced this risk.',
    'Suggested Mitigation':  'Recommended actions to address or reduce this risk.',
    Status:                  'Open = unresolved; Mitigated = action taken; Accepted = acknowledged as tolerable; Closed = no longer active.',
    'Resolution Notes':      'What was done to resolve, mitigate, or accept this risk.',
    'Resolved Date':         'When this risk was closed, mitigated, or formally accepted.',
    Lifecycle:               'Active = currently relevant; Stale = may be outdated; Archived = historical record only.',
    'Extraction Confidence': 'How confident Sera is in the quality of this extraction: High, Medium, or Low.',
  },

  memoryReviewQueue: {
    'Proposed Memory':    '3-10 word label for this memory candidate. Full text lives in Memory Detail.',
    'Memory Detail':      'Complete proposed memory text, ready to be applied to the appropriate Notion record if approved.',
    Category:             'What kind of institutional knowledge this represents.',
    'Source Evidence':    'Reference to the meeting or email where this information appeared.',
    Confidence:           'High = clearly stated in source; Medium = inferred from context; Low = uncertain.',
    Priority:             'Urgent = review immediately; This Week = review soon; Backlog = no rush.',
    'Risk If Added':      'What could go wrong if this memory is approved (inaccurate, outdated, sensitive, etc.).',
    'Risk If Ignored':    'What organizational knowledge would be lost if this memory is not preserved.',
    'Suggested Destination':'Where in Notion this memory should live once approved.',
    Status:               'Pending Review = awaiting decision; Approved = accepted; Rejected = declined; Needs Clarification = more info needed; Archived = historical.',
    'Approved Date':      'When a reviewer approved this memory candidate.',
    'Archived At':        'When this item was archived (rejected or superseded).',
    'Implemented Link':   'Link to the Notion record where this memory was applied after approval.',
  },

  canonChangeRequests: {
    'Proposed Change':       '3-10 word label for the proposed change. Full text lives in Change Detail.',
    'Change Detail':         'Complete description of the proposed change to a governance document, policy, or canon record.',
    'Affected Canon Area':   'Which part of CCOS canon this change would affect.',
    Reason:                  'Why this change is being proposed — the tension or gap it addresses.',
    'Source Evidence':       'Where this proposed change originated (meeting, email, governance discussion).',
    Status:                  'Pending Review = awaiting decision; Approved = accepted; Rejected = declined; Needs Clarification; Implemented = applied; Archived = historical.',
    'Approved Date':         'Date this change was formally approved.',
    'Implemented By':        'Name or reference of who applied the change to the governance documents.',
    'Implementation Link':   'Link to the updated governance document or the Notion record that was changed.',
    'Extraction Confidence': 'How confident Sera is in the quality of this extraction: High, Medium, or Low.',
  },

  ccosLedgerEntries: {
    'Ledger Entry':    'Short title describing this governance action, tension, proposal, or decision.',
    'Ledger Type':     'Tension = issue raised; Proposal = change suggested; Decision = resolution made; Role/Policy/Resource/Accountability = governance record.',
    Evidence:          'Source material (meeting notes, email) where this entry was identified.',
    Status:            'Draft = unreviewed; Pending Review = ready for governance discussion; Approved = accepted; Resolved = addressed; Archived = historical.',
    'Review Required': 'Check if this entry needs formal discussion at a governance meeting.',
    'Approved By':     'Name of the person or circle who approved this entry.',
    'Approved Date':   'Date of formal approval.',
    'Resolution Notes':'How this tension or proposal was addressed or resolved.',
    'Resolved Date':   'When this entry was formally closed.',
  },

  circles: {
    'Circle Name':     'Official name of this governance circle.',
    Sector:            'Which of the 7 CCOS sectors this circle belongs to.',
    Status:            'Active = operating; Proposed = awaiting ratification; Inactive = paused; Archived = dissolved.',
    Purpose:           'One or two sentence statement of why this circle exists — its evolutionary purpose.',
    Domains:           'Areas of authority this circle owns exclusively. No other circle can act in these domains without consent.',
    Accountabilities:  'Ongoing responsibilities this circle must fulfill, expressed as continuous present-tense verbs.',
    KPIs:              'Key metrics used to assess circle health, impact, and contribution to the governing purpose.',
    'Meeting Cadence': 'How often this circle meets (e.g., "Weekly Mondays 10am", "Bi-weekly").',
    'Review Cadence':  'How often the circle charter should be formally reviewed and updated.',
    'Last Review Date':'Date of the most recent charter review.',
    'Next Review Date':'Calculated: next review due based on cadence and last review date. Set Last Review Date and Review Cadence to activate.',
    Notes:             'Internal notes about this circle — context, history, or operating agreements.',
  },

  roles: {
    'Role Name':         'Official name of this role as it appears in the CCOS.',
    'Role Type':         'Lead Steward, Rep Steward, Admin Facilitator, AI Secretary, or Custom Role.',
    Status:              'Active = currently filled; Proposed = awaiting ratification; Vacant = unfilled; Archived = dissolved.',
    Purpose:             'Why this role exists — what unique contribution it makes to the circle.',
    Domains:             'Areas of authority this role holds exclusively within its circle.',
    Accountabilities:    'Ongoing responsibilities the role holder must fulfill, as continuous present-tense verbs.',
    'Term Length':       'How long this role assignment lasts before requiring re-election or review.',
    'Assignment Method': 'How this role is filled: Consent Election, Appointed, Volunteer, or Interim.',
    'Last Audit Date':   'Date of the most recent role audit or review.',
    'Next Audit Date':   'Calculated: next audit due based on term length and last audit date. Set both to activate.',
    Notes:               'Internal notes about this role — history, context, or governance agreements.',
    Source:              'Where this role definition originated (governance meeting, founding document, etc.).',
  },

  roleAssignments: {
    'Assignment Title': 'Auto-formatted as "{Holder Name} - {Role Name}". Used for dedup.',
    Status:             'Active = currently serving; Delegated = responsibility passed temporarily; Completed = term ended; Suspended = paused.',
    'Assignment Type':  'How this assignment was made: Consent Election, Appointed, Volunteer, or Interim.',
    'Start Date':       'When this assignment began.',
    'End Date':         'When this assignment ended or will end. Leave blank if ongoing.',
    'Term Length':      'Agreed duration for this assignment.',
    'Next Review Date': 'Calculated: when this assignment should be reviewed or renewed. Set Start Date and Term Length to activate.',
    'Source Evidence':  'Reference to the meeting or document where this assignment was formally recorded.',
    Notes:              'Any notes about this specific assignment — conditions, context, or delegation details.',
  },

  processingEvents: {
    'Event ID':           'Auto-generated unique identifier for this audit record.',
    'Tenant ID':          'Identifier for the Amora workspace instance.',
    'Source Type':        'What kind of input triggered this event (IMAP, Google Meet asset type, Retry, etc.).',
    'Source ID':          'Unique identifier of the source (message ID, file ID, scheduled task name).',
    'Event Type':         'Which pipeline step this event records.',
    Status:               'started = in progress; completed = finished successfully; failed = error occurred.',
    'Started At':         'When this pipeline event began.',
    'Completed At':       'When this pipeline event finished.',
    Error:                'Full error message if status is failed.',
    'Retry Count':        'Number of retry attempts for the source item at the time of this event.',
    'Created Records':    'JSON list of Notion page IDs created or updated during this event.',
    'Claude Model Used':  'Which Claude model performed the AI extraction for this event.',
    'Token Estimate':     'Approximate number of Claude API tokens consumed during this event.',
  },

  policies: {
    'Policy Name':          'Full formal name of this policy as it appears in the CCOS.',
    'Policy ID':            'Auto-incremented unique identifier — set automatically by Notion.',
    'Policy Ref':           'Calculated: area prefix + zero-padded ID (e.g., GOV-003). Read-only formula.',
    'Policy Area':          'Which area of CCOS governance this policy covers.',
    Status:                 'Active = in force; Under Review = being revised; Superseded = replaced; Draft = not yet ratified; Archived = no longer applicable.',
    'Current Text Summary': 'Summary of the current policy text. Link to the source document for the full text.',
    'Review Cadence':       'How often this policy should be formally reviewed.',
    'Last Review Date':     'Date of the most recent formal review.',
    'Next Review Date':     'Calculated: next review due based on cadence and last review date. Set both to activate.',
    'Effective Date':       'When this policy came into force.',
    Notes:                  'Internal notes about this policy — history, context, or related governance decisions.',
  },

  sensitiveReview: {
    Issue:                  'Brief title describing the sensitive matter.',
    Reason:                 'Why this content was flagged as sensitive.',
    'Recommended Handling': 'Suggested next steps for addressing or resolving this issue.',
    Status:                 'Pending Review = awaiting action; Reviewed = examined; Dismissed = no action needed; Escalated = referred to leadership.',
    Source:                 'Where this sensitive content appeared (email Message ID, meeting page ID, etc.).',
    'Date Flagged':         'When this issue was identified by the pipeline.',
    'Review Notes':         'Notes from the reviewer about their assessment and decisions.',
    'Reviewed Date':        'When a reviewer examined this issue.',
  },
};

// ─── Desired property display order ──────────────────────────────────────────
// Properties not listed here appear at the end in their current order.

const PROPERTY_ORDER: Record<string, string[]> = {

  sourceEmails: [
    'Title', 'Email Type', 'Source Category', 'Processing Status',
    'Received Date', 'Processed At',
    'From', 'To', 'CC', 'BCC Indicator', 'Subject',
    'Message ID', 'Thread Reference', 'Raw Snippet', 'Detected Links',
    'Error Log',
  ],

  meetings: [
    'Meeting Title', 'Processing Status', 'Meeting Date',
    'Organizer', 'Participants', 'Related Circles',
    'Summary', 'Canon Review Required', 'Sensitive Review Required',
    'Google Calendar Link', 'Google Meet Link',
    'Recording Link', 'Transcript Link', 'Notes Link',
    'Recording Access Status', 'Transcript Access Status', 'Notes Access Status',
    'Decisions Count', 'Tasks Count', 'Risks Count', 'Memory Candidates Count',
    'Capture Key', 'Last Processed At', 'Automation Log',
  ],

  meetingAssets: [
    'Asset Name', 'Asset Type', 'Access Status', 'Processing Status',
    'Received At', 'Processed At',
    'Google Drive File ID', 'Google Drive Link',
    'Error Message', 'Retry Count', 'Next Retry At',
  ],

  messages: [
    'Message Title', 'Urgency', 'Follow-Up Needed', 'Emotional Tone',
    'Date', 'Sender Profile', 'Recipients',
    'Summary', 'Requests', 'Commitments', 'Questions',
    'Confidentiality Level', 'Processing Status',
  ],

  profiles: [
    'Name', 'Profile Type', 'Engagement Status', 'Relationship to Amora', 'Primary Sector',
    'Role / Title', 'Tags', 'Email', 'Phone', 'LinkedIn', 'Website', 'Location',
    'Context Summary', 'Admin Notes', 'Sensitive Notes Flag',
    'First Seen', 'Last Seen', 'Source',
    'Lead Stage', 'Lead Source', 'Next Action', 'Follow-up Date', 'Follow-up Owner',
    'Interactions',
  ],

  interactions: [
    'Name', 'Type', 'Direction', 'Date',
    'Contacts', 'Meeting', 'Source Email',
    'Summary', 'Logged By', 'Follow-up Needed',
  ],

  knowledgeBase: [
    'KB Title', 'Status', 'Category', 'Audience', 'Confidence',
    'Summary', 'Key Points', 'Source',
    'Possible Duplicate Of', 'Last Enriched At', 'Published At',
  ],

  projects: [
    'Project Name', 'Status', 'Priority', 'Primary Sector',
    'Circle', 'Lead Profile',
    'Start Date', 'Target Date', 'Completed Date',
    'Description', 'Completion Notes', 'Source',
    'Circle Text',
  ],

  tasks: [
    'Task', 'Status', 'Priority', 'Due Date',
    'Owner', 'Project', 'Related Circles',
    'Meeting', 'Source Decision', 'Source Risk',
    'Source Evidence', 'Notes', 'Canon Impact', 'Estimated Hours', 'Completed Date',
    'Lifecycle', 'Extraction Confidence',
  ],

  decisionCandidates: [
    'Decision', 'Status', 'Canon Impact', 'Needs Confirmation',
    'Purpose Alignment', 'Purpose Alignment Notes',
    'Decision Maker', 'Reviewer', 'Related Circles', 'Meeting',
    'Source Evidence', 'Approved Date',
    'Lifecycle', 'Extraction Confidence',
  ],

  risks: [
    'Risk', 'Category', 'Severity', 'Status',
    'Owner', 'Related Circles', 'Meeting',
    'Evidence', 'Suggested Mitigation',
    'Resolution Notes', 'Resolved Date',
    'Lifecycle', 'Extraction Confidence',
  ],

  memoryReviewQueue: [
    'Proposed Memory', 'Status', 'Priority', 'Category', 'Confidence',
    'Memory Detail', 'Source Evidence',
    'Risk If Added', 'Risk If Ignored', 'Suggested Destination',
    'Reviewer', 'Meeting', 'Related Profiles',
    'Approved Date', 'Archived At', 'Implemented Link',
  ],

  canonChangeRequests: [
    'Proposed Change', 'Status', 'Affected Canon Area', 'Extraction Confidence',
    'Change Detail', 'Reason', 'Source Evidence',
    'Related Circles', 'Affected Roles', 'Affected Policy', 'Reviewer',
    'Approved Date', 'Implemented By', 'Implementation Link',
  ],

  ccosLedgerEntries: [
    'Ledger Entry', 'Ledger Type', 'Status', 'Review Required',
    'Circle', 'Role',
    'Evidence', 'Approved By', 'Approved Date',
    'Resolution Notes', 'Resolved Date',
  ],

  circles: [
    'Circle Name', 'Status', 'Sector',
    'Circle Lead', 'Parent Circle',
    'Purpose', 'Domains', 'Accountabilities', 'KPIs',
    'Meeting Cadence', 'Review Cadence', 'Last Review Date', 'Next Review Date',
    'Sub-circles', 'Notes',
  ],

  roles: [
    'Role Name', 'Status', 'Role Type', 'Circle',
    'Purpose', 'Domains', 'Accountabilities',
    'Term Length', 'Assignment Method', 'Last Audit Date', 'Next Audit Date',
    'Notes', 'Source',
  ],

  roleAssignments: [
    'Assignment Title', 'Status', 'Assignment Type',
    'Role', 'Role Holder', 'Circle',
    'Start Date', 'End Date', 'Term Length', 'Next Review Date',
    'Source Evidence', 'Notes',
  ],

  processingEvents: [
    'Event ID', 'Status', 'Event Type', 'Source Type', 'Source ID', 'Tenant ID',
    'Started At', 'Completed At',
    'Error', 'Retry Count', 'Created Records', 'Claude Model Used', 'Token Estimate',
  ],

  policies: [
    'Policy Name', 'Policy Ref', 'Policy ID', 'Policy Area', 'Status',
    'Current Text Summary', 'Effective Date',
    'Review Cadence', 'Last Review Date', 'Next Review Date',
    'Responsible Circle', 'Approved By', 'Affected Roles',
    'Notes',
  ],

  sensitiveReview: [
    'Issue', 'Status', 'Date Flagged',
    'Reason', 'Recommended Handling', 'Source',
    'Reviewed By', 'Related People', 'Review Notes', 'Reviewed Date',
  ],
};

// ─── Property group definitions ───────────────────────────────────────────────
// Applied via property_groups in the database update payload.
// If the Notion API does not support this field, the attempt is skipped.

const PROPERTY_GROUPS: Record<string, Array<{ name: string; props: string[] }>> = {

  sourceEmails: [
    { name: 'Classification', props: ['Title', 'Email Type', 'Source Category', 'Processing Status'] },
    { name: 'Timing',         props: ['Received Date', 'Processed At'] },
    { name: 'Sender',         props: ['From', 'To', 'CC', 'BCC Indicator', 'Subject'] },
    { name: 'Content',        props: ['Message ID', 'Thread Reference', 'Raw Snippet', 'Detected Links'] },
    { name: 'Pipeline',       props: ['Error Log'] },
  ],

  meetings: [
    { name: 'Core',           props: ['Meeting Title', 'Processing Status', 'Meeting Date'] },
    { name: 'People',         props: ['Organizer', 'Participants', 'Related Circles'] },
    { name: 'Extraction',     props: ['Summary', 'Canon Review Required', 'Sensitive Review Required'] },
    { name: 'Links',          props: ['Google Calendar Link', 'Google Meet Link', 'Recording Link', 'Transcript Link', 'Notes Link'] },
    { name: 'Access',         props: ['Recording Access Status', 'Transcript Access Status', 'Notes Access Status'] },
    { name: 'Counts',         props: ['Decisions Count', 'Tasks Count', 'Risks Count', 'Memory Candidates Count'] },
    { name: 'Pipeline',       props: ['Capture Key', 'Last Processed At', 'Automation Log'] },
  ],

  meetingAssets: [
    { name: 'Identity',       props: ['Asset Name', 'Asset Type', 'Access Status', 'Processing Status'] },
    { name: 'Timing',         props: ['Received At', 'Processed At'] },
    { name: 'Drive',          props: ['Google Drive File ID', 'Google Drive Link'] },
    { name: 'Retry',          props: ['Error Message', 'Retry Count', 'Next Retry At'] },
  ],

  messages: [
    { name: 'Core',           props: ['Message Title', 'Urgency', 'Follow-Up Needed', 'Emotional Tone'] },
    { name: 'Content',        props: ['Date', 'Sender Profile', 'Recipients', 'Summary', 'Requests', 'Commitments', 'Questions'] },
    { name: 'Classification', props: ['Confidentiality Level', 'Processing Status'] },
  ],

  profiles: [
    { name: 'Identity',       props: ['Name', 'Profile Type', 'Engagement Status', 'Relationship to Amora', 'Primary Sector'] },
    { name: 'Contact',        props: ['Role / Title', 'Tags', 'Email', 'Phone', 'LinkedIn', 'Website', 'Location'] },
    { name: 'Context',        props: ['Context Summary', 'Admin Notes', 'Sensitive Notes Flag'] },
    { name: 'History',        props: ['First Seen', 'Last Seen', 'Source'] },
    { name: 'CRM',            props: ['Lead Stage', 'Lead Source', 'Next Action', 'Follow-up Date', 'Follow-up Owner', 'Interactions'] },
  ],

  interactions: [
    { name: 'Core',           props: ['Name', 'Type', 'Direction', 'Date'] },
    { name: 'Links',          props: ['Contacts', 'Meeting', 'Source Email'] },
    { name: 'Detail',         props: ['Summary', 'Logged By', 'Follow-up Needed'] },
  ],

  knowledgeBase: [
    { name: 'Identity',       props: ['KB Title', 'Status', 'Category', 'Audience', 'Confidence'] },
    { name: 'Content',        props: ['Summary', 'Key Points', 'Source'] },
    { name: 'Metadata',       props: ['Possible Duplicate Of', 'Last Enriched At', 'Published At'] },
  ],

  projects: [
    { name: 'Core',           props: ['Project Name', 'Status', 'Priority', 'Primary Sector'] },
    { name: 'Team',           props: ['Circle', 'Lead Profile'] },
    { name: 'Schedule',       props: ['Start Date', 'Target Date', 'Completed Date'] },
    { name: 'Content',        props: ['Description', 'Completion Notes', 'Source'] },
    { name: 'Legacy',         props: ['Circle Text'] },
  ],

  tasks: [
    { name: 'Core',           props: ['Task', 'Status', 'Priority', 'Due Date'] },
    { name: 'Assignment',     props: ['Owner', 'Project', 'Related Circles'] },
    { name: 'Context',        props: ['Source Evidence', 'Notes', 'Canon Impact'] },
    { name: 'Time',           props: ['Estimated Hours', 'Completed Date'] },
    { name: 'Source Links',   props: ['Meeting', 'Source Decision', 'Source Risk'] },
    { name: 'Metadata',       props: ['Lifecycle', 'Extraction Confidence'] },
  ],

  decisionCandidates: [
    { name: 'Core',           props: ['Decision', 'Status', 'Canon Impact', 'Needs Confirmation'] },
    { name: 'Alignment',      props: ['Purpose Alignment', 'Purpose Alignment Notes'] },
    { name: 'Attribution',    props: ['Decision Maker', 'Reviewer', 'Related Circles', 'Meeting'] },
    { name: 'Review',         props: ['Source Evidence', 'Approved Date'] },
    { name: 'Metadata',       props: ['Lifecycle', 'Extraction Confidence'] },
  ],

  risks: [
    { name: 'Core',           props: ['Risk', 'Category', 'Severity', 'Status'] },
    { name: 'Attribution',    props: ['Owner', 'Related Circles', 'Meeting'] },
    { name: 'Detail',         props: ['Evidence', 'Suggested Mitigation'] },
    { name: 'Resolution',     props: ['Resolution Notes', 'Resolved Date'] },
    { name: 'Metadata',       props: ['Lifecycle', 'Extraction Confidence'] },
  ],

  memoryReviewQueue: [
    { name: 'Core',           props: ['Proposed Memory', 'Status', 'Priority', 'Category', 'Confidence'] },
    { name: 'Content',        props: ['Memory Detail', 'Source Evidence'] },
    { name: 'Risk Analysis',  props: ['Risk If Added', 'Risk If Ignored', 'Suggested Destination'] },
    { name: 'Attribution',    props: ['Reviewer', 'Meeting', 'Related Profiles'] },
    { name: 'Outcome',        props: ['Approved Date', 'Archived At', 'Implemented Link'] },
  ],

  canonChangeRequests: [
    { name: 'Core',           props: ['Proposed Change', 'Status', 'Affected Canon Area', 'Extraction Confidence'] },
    { name: 'Content',        props: ['Change Detail', 'Reason', 'Source Evidence'] },
    { name: 'Attribution',    props: ['Related Circles', 'Affected Roles', 'Affected Policy', 'Reviewer'] },
    { name: 'Outcome',        props: ['Approved Date', 'Implemented By', 'Implementation Link'] },
  ],

  ccosLedgerEntries: [
    { name: 'Core',           props: ['Ledger Entry', 'Ledger Type', 'Status', 'Review Required'] },
    { name: 'Attribution',    props: ['Circle', 'Role'] },
    { name: 'Detail',         props: ['Evidence', 'Approved By', 'Approved Date'] },
    { name: 'Resolution',     props: ['Resolution Notes', 'Resolved Date'] },
  ],

  circles: [
    { name: 'Identity',       props: ['Circle Name', 'Status', 'Sector'] },
    { name: 'Leadership',     props: ['Circle Lead', 'Parent Circle'] },
    { name: 'Charter',        props: ['Purpose', 'Domains', 'Accountabilities', 'KPIs'] },
    { name: 'Operations',     props: ['Meeting Cadence'] },
    { name: 'Review',         props: ['Review Cadence', 'Last Review Date', 'Next Review Date'] },
    { name: 'Relations',      props: ['Sub-circles'] },
    { name: 'Notes',          props: ['Notes'] },
  ],

  roles: [
    { name: 'Identity',       props: ['Role Name', 'Status', 'Role Type', 'Circle'] },
    { name: 'Charter',        props: ['Purpose', 'Domains', 'Accountabilities'] },
    { name: 'Governance',     props: ['Term Length', 'Assignment Method'] },
    { name: 'Review',         props: ['Last Audit Date', 'Next Audit Date'] },
    { name: 'Notes',          props: ['Notes', 'Source'] },
  ],

  roleAssignments: [
    { name: 'Core',           props: ['Assignment Title', 'Status', 'Assignment Type'] },
    { name: 'Role',           props: ['Role', 'Role Holder', 'Circle'] },
    { name: 'Term',           props: ['Start Date', 'End Date', 'Term Length', 'Next Review Date'] },
    { name: 'Context',        props: ['Source Evidence', 'Notes'] },
  ],

  processingEvents: [
    { name: 'Core',           props: ['Event ID', 'Status', 'Event Type'] },
    { name: 'Source',         props: ['Source Type', 'Source ID', 'Tenant ID'] },
    { name: 'Timing',         props: ['Started At', 'Completed At'] },
    { name: 'Detail',         props: ['Error', 'Retry Count', 'Created Records', 'Claude Model Used', 'Token Estimate'] },
  ],

  policies: [
    { name: 'Identity',       props: ['Policy Name', 'Policy Ref', 'Policy ID', 'Policy Area', 'Status'] },
    { name: 'Content',        props: ['Current Text Summary', 'Effective Date'] },
    { name: 'Review',         props: ['Review Cadence', 'Last Review Date', 'Next Review Date'] },
    { name: 'Attribution',    props: ['Responsible Circle', 'Approved By', 'Affected Roles'] },
    { name: 'Notes',          props: ['Notes'] },
  ],

  sensitiveReview: [
    { name: 'Issue',          props: ['Issue', 'Status', 'Date Flagged'] },
    { name: 'Content',        props: ['Reason', 'Recommended Handling', 'Source'] },
    { name: 'Review',         props: ['Reviewed By', 'Related People', 'Review Notes', 'Reviewed Date'] },
  ],
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

async function fetchDb(dbId: string): Promise<any> {
  return notion.databases.retrieve({ database_id: dbId });
}

async function applyDescriptionsAndOrder(
  dbKey: string,
  dbId: string,
  db: any,
) {
  const descs = DESCRIPTIONS[dbKey] ?? {};
  const order = PROPERTY_ORDER[dbKey] ?? [];
  const existingProps = db.properties as Record<string, any>;

  // Build ordered update payload: desired order first, then remaining props
  const seen = new Set<string>();
  const orderedNames: string[] = [];
  for (const name of order) {
    if (existingProps[name]) { orderedNames.push(name); seen.add(name); }
  }
  for (const name of Object.keys(existingProps)) {
    if (!seen.has(name)) orderedNames.push(name);
  }

  const updateProps: Record<string, any> = {};
  for (const name of orderedNames) {
    const prop = existingProps[name];
    if (!prop) continue;
    const typeDef = { [prop.type]: prop[prop.type] ?? {} };
    updateProps[name] = {
      ...typeDef,
      ...(descs[name] ? { description: descs[name] } : {}),
    };
  }

  await (notion.databases.update as any)({
    database_id: dbId,
    properties: updateProps,
  });
  console.log(`  Descriptions + order applied`);
}

async function applyPropertyGroups(dbKey: string, dbId: string, db: any) {
  const groups = PROPERTY_GROUPS[dbKey];
  if (!groups) return;

  const propNameToId: Record<string, string> = {};
  for (const [name, prop] of Object.entries(db.properties as Record<string, any>)) {
    propNameToId[name] = prop.id;
  }

  const propertyGroups = groups.map(g => ({
    name: g.name,
    property_ids: g.props.map(p => propNameToId[p]).filter(Boolean),
  })).filter(g => g.property_ids.length > 0);

  try {
    await (notion.databases.update as any)({
      database_id: dbId,
      property_groups: propertyGroups,
    });
    console.log(`  Property groups applied (${propertyGroups.length} sections)`);
  } catch (e: any) {
    // property_groups may not be in the public API for all workspaces
    console.log(`  Property groups skipped (${e?.code ?? e?.message ?? 'unsupported'})`);
    console.log(`  To add sections manually: open database > Properties > drag to group`);
  }
}

async function migrateDb(dbKey: string) {
  const dbId = DB[dbKey];
  if (!dbId) {
    console.log(`  Skipping ${dbKey} (env var not set)`);
    return;
  }
  try {
    const db = await fetchDb(dbId);
    await applyDescriptionsAndOrder(dbKey, dbId, db);
    await applyPropertyGroups(dbKey, dbId, db);
  } catch (e: any) {
    console.error(`  ERROR on ${dbKey}:`, e?.message ?? e);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ALL_KEYS = [
  'sourceEmails', 'meetings', 'meetingAssets', 'messages',
  'profiles', 'interactions', 'knowledgeBase', 'projects',
  'tasks', 'decisionCandidates', 'risks', 'memoryReviewQueue',
  'canonChangeRequests', 'ccosLedgerEntries',
  'circles', 'roles', 'roleAssignments',
  'processingEvents', 'policies', 'sensitiveReview',
];

async function run() {
  console.log('Applying property descriptions, ordering, and groups to all databases...\n');

  for (const key of ALL_KEYS) {
    console.log(`${key}`);
    await migrateDb(key);
  }

  console.log('\nDone.');
  console.log('\nNotes:');
  console.log('  - Projects.Circle Text has been marked deprecated in its description.');
  console.log('    The Circle relation is canonical. Manually remove Circle Text when all data has been migrated to the relation.');
  console.log('  - Rollup candidates: Role Assignments.Circle can be replaced by a rollup of Role -> Circle once all');
  console.log('    roles have circle relations set. Flag Profiles.Follow-up Owner for conversion to a relation if CRM grows.');
  console.log('  - Property groups require Notion workspace feature support. If skipped, add sections manually via');
  console.log('    Database Settings > Properties panel by dragging properties into groups.');
}

run().catch(e => { console.error(e); process.exit(1); });
