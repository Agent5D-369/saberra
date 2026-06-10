import type { CreateDatabaseParameters } from '@notionhq/client/build/src/api-endpoints';

type PropertySchema = CreateDatabaseParameters['properties'];

// ─── Reusable property builders ───────────────────────────────────────────────

const title = (): PropertySchema[string] => ({ title: {} });
const richText = (): PropertySchema[string] => ({ rich_text: {} });
const select = (options: string[]): PropertySchema[string] => ({
  select: { options: options.map((name) => ({ name })) },
});
const multiSelect = (options: string[]): PropertySchema[string] => ({
  multi_select: { options: options.map((name) => ({ name })) },
});
const date = (): PropertySchema[string] => ({ date: {} });
const checkbox = (): PropertySchema[string] => ({ checkbox: {} });
const url = (): PropertySchema[string] => ({ url: {} });
const email = (): PropertySchema[string] => ({ email: {} });
const phone = (): PropertySchema[string] => ({ phone_number: {} });
const number = (): PropertySchema[string] => ({ number: { format: 'number' } });
const formula = (expression: string): PropertySchema[string] => ({ formula: { expression } } as PropertySchema[string]);
const uniqueId = (prefix?: string): PropertySchema[string] =>
  (prefix ? { unique_id: { prefix } } : { unique_id: {} }) as PropertySchema[string];

// ─── Review-date formula expressions ─────────────────────────────────────────

const REVIEW_DATE_BY_CADENCE = (cadenceProp: string, lastDateProp: string) =>
  `if(empty(prop("${lastDateProp}")), "Set ${lastDateProp}", if(empty(prop("${cadenceProp}")), "Set ${cadenceProp}", if(prop("${cadenceProp}") == "As Needed", "Review as needed", formatDate(dateAdd(prop("${lastDateProp}"), if(prop("${cadenceProp}") == "Monthly", 1, if(prop("${cadenceProp}") == "Quarterly", 3, if(prop("${cadenceProp}") == "Semi-Annual", 6, 12))), "months"), "MMM D, YYYY"))))`;

const REVIEW_DATE_BY_TERM = (termProp: string, startDateProp: string) =>
  `if(empty(prop("${startDateProp}")), "Set ${startDateProp}", if(empty(prop("${termProp}")), "Set ${termProp}", if(prop("${termProp}") == "No Term", "No term limit", formatDate(dateAdd(prop("${startDateProp}"), if(prop("${termProp}") == "3 Months", 3, if(prop("${termProp}") == "6 Months", 6, 12)), "months"), "MMM D, YYYY"))))`;

// Policy Ref: area abbreviation + zero-padded Policy ID number, e.g. "GOV-003"
// Note: unique_id does not support numeric comparison (<) in Notion formulas;
// zero-padding uses length(format(...)) instead.
const POLICY_REF_FORMULA = [
  `concat(`,
  `if(prop("Policy Area") == "Governing Purpose", "GOV-", if(prop("Policy Area") == "Policy", "POL-", if(prop("Policy Area") == "Circle Definition", "CIR-", if(prop("Policy Area") == "Role Definition", "ROL-", if(prop("Policy Area") == "Decision Rights", "DEC-", if(prop("Policy Area") == "Legal Commitment", "LEG-", if(prop("Policy Area") == "Financial Commitment", "FIN-", if(prop("Policy Area") == "Land Stewardship", "LND-", if(prop("Policy Area") == "CCOS Ledger", "CCO-", if(prop("Policy Area") == "Public Commitment", "PUB-", "GEN-")))))))))), `,
  `if(length(format(prop("Policy ID"))) == 1, concat("00", format(prop("Policy ID"))), if(length(format(prop("Policy ID"))) == 2, concat("0", format(prop("Policy ID"))), format(prop("Policy ID"))))`,
  `)`,
].join('');

// ─── Database schema definitions ─────────────────────────────────────────────

export const DATABASE_SCHEMAS: Record<string, { title: string; properties: PropertySchema }> = {
  sourceEmails: {
    title: 'Source Emails',
    properties: {
      Title: title(),
      'Message ID': richText(),
      'Thread Reference': richText(),
      From: richText(),
      To: richText(),
      CC: richText(),
      'BCC Indicator': checkbox(),
      'Received Date': date(),
      Subject: richText(),
      'Email Type': select([
        'Google Meet Recording',
        'Google Meet Transcript',
        'Google Meet Notes',
        'Operational Email',
        'Forwarded Thread',
        'Unknown',
      ]),
      'Source Category': select(['Meeting Asset', 'Operational', 'Unknown']),
      'Raw Snippet': richText(),
      'Detected Links': richText(),
      'Processing Status': select(['Pending', 'Processing', 'Processed', 'Needs Access', 'Failed', 'Manual Review']),
      'Error Log': richText(),
      'Processed At': date(),
    },
  },

  meetings: {
    title: 'Meetings',
    properties: {
      'Meeting Title': title(),
      'Capture Key': richText(),
      'Meeting Date': date(),
      // Organizer → relation to Profiles (added by migrate-add-meeting-relations.ts)
      // Participants → relation to Profiles (added by migration)
      // Related Circles → relation to Circles (added by migrate-add-related-circles.ts)
      'Google Calendar Link': url(),
      'Google Meet Link': url(),
      'Recording Link': url(),
      'Transcript Link': url(),
      'Notes Link': url(),
      'Recording Access Status': select(['Unknown', 'Confirmed', 'Needs Access', 'Denied']),
      'Transcript Access Status': select(['Unknown', 'Confirmed', 'Needs Access', 'Denied']),
      'Notes Access Status': select(['Unknown', 'Confirmed', 'Needs Access', 'Denied']),
      'Processing Status': select(['Pending', 'Processing', 'Processed', 'Partial', 'Failed', 'Manual Review']),
      Summary: richText(),
      // Decisions Count → rollup of Decisions relation (migrate-full-schema-audit.ts)
      // Tasks Count     → rollup of Meeting Tasks relation
      // Risks Count     → rollup of Meeting Risks relation
      // Memory Candidates Count → rollup of Memory Candidates relation
      'Canon Review Required': checkbox(),
      'Sensitive Review Required': checkbox(),
      'Last Processed At': date(),
      'Automation Log': richText(),
    },
  },

  meetingAssets: {
    title: 'Meeting Assets',
    properties: {
      'Asset Name': title(),
      'Asset Type': select(['Recording', 'Transcript', 'Gemini Notes', 'Chat Log', 'Caption File', 'Attachment', 'Unknown']),
      'Google Drive File ID': richText(),
      'Google Drive Link': url(),
      'Access Status': select(['Unknown', 'Confirmed', 'Needs Access', 'Denied']),
      'Processing Status': select(['Pending', 'Processing', 'Processed', 'Needs Access', 'Failed', 'Manual Review']),
      'Received At': date(),
      'Processed At': date(),
      'Error Message': richText(),
      'Retry Count': number(),
      'Next Retry At': date(),
    },
  },

  messages: {
    title: 'Messages',
    properties: {
      'Message Title': title(),
      // Sender Profile → relation to Profiles (resolved by PipelineService after extraction)
      Recipients: richText(),
      Date: date(),
      Summary: richText(),
      Requests: richText(),
      Commitments: richText(),
      Questions: richText(),
      'Emotional Tone': select(['Neutral', 'Positive', 'Tense', 'Urgent', 'Unclear']),
      Urgency: select(['High', 'Medium', 'Low']),
      'Follow-Up Needed': checkbox(),
      'Confidentiality Level': select(['Standard', 'Sensitive', 'Restricted']),
      'Processing Status': select(['Pending', 'Processed', 'Failed', 'Manual Review']),
    },
  },

  profiles: {
    title: 'Profiles',
    properties: {
      Name: title(),
      'Profile Type': select(['Person', 'Organization', 'Both']),
      'Engagement Status': select(['Active', 'Inactive', 'Prospect', 'Unknown']),
      'Relationship to Amora': select(['Member', 'Partner', 'Vendor', 'Advisor', 'Funder', 'Contact', 'Community', 'Alumni', 'Government', 'Unknown']),
      'Primary Sector': select([
        'Sector 1 — Health & Holistic Wellness',
        'Sector 2 — Governance & Justice',
        'Sector 3 — Culture & Spirit',
        'Sector 4 — Learning & Innovation',
        'Sector 5 — Ecology & Infrastructure',
        'Sector 6 — Economy & Exchange',
        'Sector 7 — Media & Technology',
      ]),
      'Role / Title': richText(),
      Tags: multiSelect([
        'Leadership', 'Legal', 'Finance', 'Agriculture', 'Education',
        'Communications', 'Operations', 'Governance', 'Technical', 'Community',
        'Land Stewardship', 'Fundraising',
      ]),
      Email: email(),
      Phone: phone(),
      LinkedIn: url(),
      Website: url(),
      Location: richText(),
      'Context Summary': richText(),
      'Admin Notes': richText(),
      'Sensitive Notes Flag': checkbox(),
      'First Seen': date(),
      'Last Seen': date(),
      Source: richText(),
      // CRM fields — added by migrate-crm.ts
      'Lead Stage': select(['New Lead', 'Qualified', 'Engaged', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Not a Lead']),
      'Lead Source': select(['Referral', 'Email', 'Meeting', 'Event', 'Website', 'Social Media', 'Partner', 'Unknown']),
      'Next Action': richText(),
      'Follow-up Date': date(),
      'Follow-up Owner': richText(),
      // Interactions → relation to Interactions (dual_property, added by migrate-crm.ts)
    },
  },

  interactions: {
    title: 'Interactions',
    properties: {
      Name:      title(),
      Date:      date(),
      Type:      select(['Email', 'Meeting', 'Call', 'Note', 'Forward', 'Other']),
      Direction: select(['Inbound', 'Outbound', 'Internal']),
      Summary:   richText(),
      // Contacts → relation to Profiles (dual_property, added by migrate-crm.ts)
      // Meeting → relation to Meetings (single_property, added by migrate-crm.ts)
      // Source Email → relation to Source Emails (single_property, added by migrate-crm.ts)
      'Logged By':        richText(),
      'Follow-up Needed': checkbox(),
    },
  },

  knowledgeBase: {
    title: 'Knowledge Base',
    properties: {
      'KB Title':            title(),
      Category:              select(['How-To', 'Best Practice', 'Process', 'Technology', 'Governance', 'Community', 'Land & Ecology', 'Finance', 'Learning', 'Wellness', 'General']),
      Audience:              multiSelect(['All Members', 'Leadership', 'New Members', 'Circle Leads', 'Tech Team']),
      Summary:               richText(),
      'Key Points':          richText(),
      Source:                richText(),
      Status:                select(['Draft', 'Published', 'Archived']),
      Confidence:            select(['High', 'Medium']),
      'Possible Duplicate Of': richText(),
      'Last Enriched At':    date(),
      'Published At':        date(),
    },
  },

  projects: {
    title: 'Projects',
    properties: {
      'Project Name': title(),
      Status: select(['Proposed', 'Active', 'On Hold', 'Complete', 'Cancelled']),
      'Primary Sector': select([
        'Sector 1 — Health & Holistic Wellness',
        'Sector 2 — Governance & Justice',
        'Sector 3 — Culture & Spirit',
        'Sector 4 — Learning & Innovation',
        'Sector 5 — Ecology & Infrastructure',
        'Sector 6 — Economy & Exchange',
        'Sector 7 — Media & Technology',
      ]),
      // Circle → relation to Circles (added by migrate-add-task-project-relations.ts)
      'Circle Text': richText(),
      // Lead Profile → relation to Profiles (added by migrate-add-task-project-relations.ts)
      Priority: select(['High', 'Medium', 'Low']),
      'Start Date': date(),
      'Target Date': date(),
      'Completed Date': date(),
      Description: richText(),
      'Completion Notes': richText(),
      Source: richText(),
    },
  },

  tasks: {
    title: 'Tasks',
    properties: {
      Task: title(),
      // Owner → relation to Profiles (migrate-add-task-project-relations.ts)
      // Project → relation to Projects (migration)
      // Meeting → relation to Meetings (migrate-full-schema-audit.ts)
      // Source Decision → relation to Decision Candidates (migrate-policies-and-new-relations.ts, back-ref: Related Tasks)
      // Source Risk → relation to Risks (migration, back-ref: Mitigation Tasks)
      // Related Circles → relation to Circles (added by migrate-add-related-circles.ts)
      'Source Evidence': richText(),
      'Due Date': date(),
      Priority: select(['High', 'Medium', 'Low']),
      Status: select(['Open', 'In Progress', 'Done', 'Cancelled', 'Needs Owner']),
      'Canon Impact': checkbox(),
      'Purpose Alignment': select(['Aligned', 'Neutral', 'Misaligned', 'Unclear']),
      'Purpose Alignment Notes': richText(),
      'Estimated Hours': number(),
      'Completed Date': date(),
      Notes: richText(),
      Lifecycle: select(['Active', 'Stale', 'Archived']),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  decisionCandidates: {
    title: 'Decision Candidates',
    properties: {
      Decision: title(),
      Status: select(['Candidate', 'Confirmed', 'Rejected', 'Needs Clarification']),
      'Source Evidence': richText(),
      // Decision Maker → relation to Profiles (migrate-full-schema-audit.ts)
      // Reviewer → relation to Profiles (migration)
      // Meeting → relation to Meetings (migration)
      // Related Circles → relation to Circles (added by migrate-add-related-circles.ts)
      'Canon Impact': checkbox(),
      'Needs Confirmation': checkbox(),
      'Approved Date': date(),
      'Purpose Alignment': select(['Aligned', 'Neutral', 'Misaligned', 'Unclear']),
      'Purpose Alignment Notes': richText(),
      'Implementation Status': select(['Not Started', 'In Progress', 'Complete', 'Abandoned']),
      'Implemented Date': date(),
      Lifecycle: select(['Active', 'Stale', 'Archived']),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  risks: {
    title: 'Risks',
    properties: {
      Risk: title(),
      Category: select(['Operational', 'Financial', 'Legal', 'Governance', 'Interpersonal', 'Technical', 'Unknown']),
      Severity: select(['High', 'Medium', 'Low']),
      Evidence: richText(),
      'Suggested Mitigation': richText(),
      // Owner → relation to Profiles (migrate-full-schema-audit.ts)
      // Meeting → relation to Meetings (migration)
      // Related Circles → relation to Circles (added by migrate-add-related-circles.ts)
      Status: select(['Open', 'Mitigated', 'Accepted', 'Closed']),
      'Review Date': date(),
      'Resolution Notes': richText(),
      'Resolved Date': date(),
      Lifecycle: select(['Active', 'Stale', 'Archived']),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  memoryReviewQueue: {
    title: 'Memory Review Queue',
    properties: {
      'Proposed Memory': title(),   // Short label only (3-10 words). Full text lives in Memory Detail.
      'Memory Detail': richText(),  // Full proposed memory text
      Category: select(['Context', 'Relationship', 'Commitment', 'Decision', 'Learning', 'Process', 'Unknown']),
      'Source Evidence': richText(),
      Confidence: select(['High', 'Medium', 'Low']),
      Priority: select(['Urgent', 'This Week', 'Backlog']),
      'Risk If Added': richText(),
      'Risk If Ignored': richText(),
      'Suggested Destination': richText(),
      // Reviewer → relation to Profiles (migrate-full-schema-audit.ts)
      // Meeting → relation to Meetings (migration)
      // Related Profiles → relation to Profiles (migrate-add-review-relations.ts)
      Status: select(['Pending Review', 'Approved', 'Rejected', 'Needs Clarification', 'Archived']),
      'Approved Date': date(),
      'Archived At': date(),
      'Implemented Link': url(),
    },
  },

  canonChangeRequests: {
    title: 'Canon Change Requests',
    properties: {
      'Proposed Change': title(),   // Short label only (3-10 words). Full text lives in Change Detail.
      'Change Detail': richText(),  // Full proposed change text
      // Related Circles → relation to Circles (added by migrate-add-related-circles.ts)
      // Affected Roles → relation to Roles (dual back-ref: Canon Changes on Roles)
      'Affected Canon Area': select([
        'Governing Purpose',
        'Policy',
        'Circle Definition',
        'Role Definition',
        'Decision Rights',
        'Legal Commitment',
        'Financial Commitment',
        'Land Stewardship',
        'CCOS Ledger',
        'Public Commitment',
        'Unknown',
      ]),
      // 'Affected Canon Doc' removed — superseded by 'Affected Policy' relation
      // Affected Policy → relation to Policies (migrate-policies-and-new-relations.ts)
      Reason: richText(),
      'Source Evidence': richText(),
      // Reviewer → relation to Profiles (migrate-full-schema-audit.ts)
      Status: select(['Pending Review', 'Approved', 'Rejected', 'Needs Clarification', 'Implemented', 'Archived']),
      'Approved Date': date(),
      'Implemented By': richText(),
      'Implementation Link': url(),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  ccosLedgerEntries: {
    title: 'CCOS Ledger Entries',
    properties: {
      'Ledger Entry': title(),
      'Ledger Type': select(['Tension', 'Proposal', 'Decision', 'Role', 'Policy', 'Resource', 'Accountability']),
      // Circle → relation to Circles (migrate-full-schema-audit.ts)
      // Role → relation to Roles (migration)
      Evidence: richText(),
      Status: select(['Draft', 'Pending Review', 'Approved', 'Resolved', 'Archived']),
      'Review Required': checkbox(),
      'Approved By': richText(),
      'Approved Date': date(),
      'Resolution Notes': richText(),
      'Resolved Date': date(),
    },
  },

  circles: {
    title: 'Circles',
    properties: {
      'Circle Name': title(),
      Sector: select([
        'Sector 1 — Health & Holistic Wellness',
        'Sector 2 — Governance & Justice',
        'Sector 3 — Culture & Spirit',
        'Sector 4 — Learning & Innovation',
        'Sector 5 — Ecology & Infrastructure',
        'Sector 6 — Economy & Exchange',
        'Sector 7 — Media & Technology',
      ]),
      Status: select(['Active', 'Proposed', 'Inactive', 'Archived']),
      // Circle Lead → relation to Profiles (migrate-full-schema-audit.ts)
      // Parent Circle → self-relation to Circles (migration, back-ref: Sub-circles)
      Purpose: richText(),
      Domains: richText(),
      Accountabilities: richText(),
      KPIs: richText(),
      'Meeting Cadence': richText(),
      'Review Cadence': select(['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed']),
      'Next Review Date': formula(REVIEW_DATE_BY_CADENCE('Review Cadence', 'Last Review Date')),
      'Last Review Date': date(),
      Notes: richText(),
    },
  },

  roles: {
    title: 'Roles',
    properties: {
      'Role Name': title(),
      // Circle → relation to Circles (migrate-full-schema-audit.ts)
      'Role Type': select(['Lead Steward', 'Rep Steward', 'Admin Facilitator', 'AI Secretary', 'Custom Role']),
      Status: select(['Active', 'Proposed', 'Vacant', 'Archived']),
      Purpose: richText(),
      Domains: richText(),
      Accountabilities: richText(),
      'Term Length': select(['No Term', '3 Months', '6 Months', '1 Year', 'Custom']),
      'Assignment Method': select(['Consent Election', 'Appointed', 'Volunteer', 'Interim']),
      'Next Audit Date': formula(REVIEW_DATE_BY_TERM('Term Length', 'Last Audit Date')),
      'Last Audit Date': date(),
      Notes: richText(),
      Source: richText(),
    },
  },

  roleAssignments: {
    title: 'Role Assignments',
    properties: {
      'Assignment Title': title(),
      // Role → relation to Roles (migrate-full-schema-audit.ts)
      // Role Holder → relation to Profiles (migration)
      // Circle → relation to Circles (migration)
      Status: select(['Active', 'Delegated', 'Completed', 'Suspended']),
      'Assignment Type': select(['Consent Election', 'Appointed', 'Interim', 'Volunteer']),
      'Start Date': date(),
      'End Date': date(),
      'Term Length': select(['No Term', '3 Months', '6 Months', '1 Year', 'Custom']),
      'Next Review Date': formula(REVIEW_DATE_BY_TERM('Term Length', 'Start Date')),
      'Source Evidence': richText(),
      Notes: richText(),
    },
  },

  processingEvents: {
    title: 'Processing Events',
    properties: {
      'Event ID': title(),
      'Tenant ID': richText(),
      'Source Type': select(['IMAP', 'Google Meet Recording', 'Google Meet Transcript', 'Google Meet Notes', 'Operational Email', 'Forwarded Thread', 'Retry', 'Setup']),
      'Source ID': richText(),
      'Event Type': select(['poll_start', 'email_classified', 'asset_parsed', 'access_check', 'text_export', 'extraction', 'notion_write', 'access_request_sent', 'retry_scheduled', 'heartbeat', 'scheduled_task', 'error']),
      Status: select(['started', 'completed', 'failed']),
      'Started At': date(),
      'Completed At': date(),
      Error: richText(),
      'Retry Count': number(),
      'Created Records': richText(),
      'Claude Model Used': richText(),
      'Token Estimate': number(),
    },
  },

  policies: {
    title: 'Policies',
    properties: {
      'Policy Name': title(),
      'Policy ID':   uniqueId('POL'),
      'Policy Ref':  formula(POLICY_REF_FORMULA),
      'Policy Area': select([
        'Governing Purpose', 'Policy', 'Circle Definition', 'Role Definition', 'Decision Rights',
        'Legal Commitment', 'Financial Commitment', 'Land Stewardship', 'CCOS Ledger',
        'Public Commitment', 'Unknown',
      ]),
      Status: select(['Active', 'Under Review', 'Superseded', 'Draft', 'Archived']),
      'Current Text Summary': richText(),
      'Review Cadence': select(['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed']),
      'Next Review Date': formula(REVIEW_DATE_BY_CADENCE('Review Cadence', 'Last Review Date')),
      'Last Review Date': date(),
      'Effective Date': date(),
      // Approved By → relation to Profiles (migrate-policies-and-new-relations.ts, back-ref: Policies Approved)
      // Responsible Circle → relation to Circles (migration, back-ref: Circle Policies)
      // Canon Changes → back-ref from Canon Change Requests.Affected Policy
      // Affected Roles → relation to Roles (dual back-ref: Related Policies on Roles)
      Notes: richText(),
    },
  },

  sensitiveReview: {
    title: 'Sensitive Review',
    properties: {
      Issue:                  title(),
      Reason:                 richText(),
      'Recommended Handling': richText(),
      Status:                 select(['Pending Review', 'Reviewed', 'Dismissed', 'Escalated']),
      Source:                 richText(),
      'Date Flagged':         date(),
      // 'Reviewed By' → relation to Profiles (migrate-sensitive-review-reviewer-relation.ts)
      // 'Related People' → relation to Profiles (migrate-add-review-relations.ts)
      'Review Notes':         richText(),
      'Reviewed Date':        date(),
    },
  },

  tensions: {
    title: 'Tensions',
    properties: {
      Tension:              title(),
      Type:                 select(['Governance', 'Operational', 'Relational', 'Structural']),
      Status:               select(['Open', 'Processing', 'Resolved', 'Dropped']),
      // 'Sensed By' → relation to Profiles (added by migrate-tensions-commitments.ts)
      // 'Sensing Circle' → relation to Circles (added by migrate-tensions-commitments.ts)
      // 'Meeting' → relation to Meetings (added by migrate-tensions-commitments.ts)
      // 'Resulting Decision' → relation to Decision Candidates (added by migrate-tensions-commitments.ts)
      'Source Evidence':    richText(),
      'Resolution Notes':   richText(),
      'Resolved Date':      date(),
      Lifecycle:            select(['Active', 'Archived']),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  commitments: {
    title: 'Commitments',
    properties: {
      'Agreement Title':    title(),
      Terms:                richText(),
      Type:                 select(['Interpersonal', 'Inter-Circle', 'External', 'Org-Wide']),
      Status:               select(['Active', 'Modified', 'Dissolved', 'Superseded']),
      // 'Parties' → relation to Profiles (added by migrate-tensions-commitments.ts)
      // 'Circles' → relation to Circles (added by migrate-tensions-commitments.ts)
      // 'Source Decision' → relation to Decision Candidates (added by migrate-tensions-commitments.ts)
      // 'Source Meeting' → relation to Meetings (added by migrate-tensions-commitments.ts)
      'Effective Date':     date(),
      'Review Date':        date(),
      'Source Evidence':    richText(),
      Lifecycle:            select(['Active', 'Archived']),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  gratitudes: {
    title: 'Gratitudes',
    properties: {
      Title:             title(),
      Appreciation:      richText(),
      // 'From' → relation to Profiles (added by migrate-community-layer.ts)
      // 'To' → relation to Profiles (added by migrate-community-layer.ts)
      // 'Circle' → relation to Circles (added by migrate-community-layer.ts)
      // 'Meeting' → relation to Meetings (added by migrate-community-layer.ts)
      Date:              date(),
      'Source Evidence': richText(),
      Lifecycle:         select(['Active', 'Archived']),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  events: {
    title: 'Events',
    properties: {
      'Event Name':  title(),
      Type:          select(['Community Dinner', 'Ceremony', 'Workshop', 'Learning Circle', 'Celebration', 'Work Party', 'Retreat', 'Other']),
      Date:          date(),
      'End Date':    date(),
      Location:      richText(),
      Description:   richText(),
      Status:        select(['Proposed', 'Confirmed', 'Completed', 'Cancelled']),
      // 'Organizer' → relation to Profiles (added by migrate-community-layer.ts)
      // 'Organizing Circle' → relation to Circles (added by migrate-community-layer.ts)
      Attendance:    richText(),
      Notes:         richText(),
      Lifecycle:     select(['Active', 'Archived']),
    },
  },

  retrospectives: {
    title: 'Retrospectives',
    properties: {
      Title:            title(),
      // 'Circle' → relation to Circles (added by migrate-community-layer.ts)
      // 'Meeting' → relation to Meetings (added by migrate-community-layer.ts)
      'Retro Date':     date(),
      'Period Covered': richText(),
      'What Worked':    richText(),
      'What Didn\'t Work': richText(),
      'What to Change': richText(),
      'Energy Level':   select(['High', 'Good', 'Neutral', 'Low', 'Critical']),
      Celebrations:     richText(),
      Status:           select(['Draft', 'Complete']),
      'Extraction Confidence': select(['High', 'Medium', 'Low']),
    },
  },

  resources: {
    title: 'Resources',
    properties: {
      'Resource Name':   title(),
      Type:              select(['Land', 'Building', 'Vehicle', 'Tool', 'Equipment', 'Digital', 'Financial', 'Other']),
      // 'Steward' → relation to Profiles (added by migrate-community-layer.ts)
      // 'Steward Circle' → relation to Circles (added by migrate-community-layer.ts)
      Condition:         select(['Excellent', 'Good', 'Fair', 'Needs Attention', 'Out of Service']),
      Status:            select(['Available', 'In Use', 'Reserved', 'Under Repair', 'Retired']),
      Location:          richText(),
      Description:       richText(),
      'Acquisition Date': date(),
      'Last Inspected':  date(),
      'Next Service Date': date(),
      'Usage Notes':     richText(),
      Notes:             richText(),
    },
  },
};

export const DATABASE_KEYS = Object.keys(DATABASE_SCHEMAS) as Array<keyof typeof DATABASE_SCHEMAS>;
