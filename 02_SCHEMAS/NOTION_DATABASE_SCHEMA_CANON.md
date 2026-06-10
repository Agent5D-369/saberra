# Notion Database Schema Canon

Create these MVP databases.

## 1. Source Emails

Purpose: every captured email becomes a source record.

Properties:

- Title (title)
- Gmail Message ID (text)
- Gmail Thread ID (text)
- From (email/text)
- To (text)
- CC (text)
- BCC Indicator (checkbox)
- Received Date (date)
- Subject (text)
- Email Type (select)
- Source Category (select)
- Raw Snippet (rich text)
- Raw Body (rich text or external link if long)
- Detected Links (url/rich text)
- Related Meeting (relation)
- Related Message (relation)
- Related Person (relation)
- Related Organization (relation)
- Processing Status (select)
- Error Log (rich text)
- Processed At (date)

Email Type options:

- Google Meet Recording
- Google Meet Transcript
- Google Meet Notes
- Operational Email
- Forwarded Thread
- Unknown

## 2. Meetings

Properties:

- Meeting Title (title)
- Capture Key (text)
- Meeting Date (date)
- Organizer (text/relation)
- Participants (multi-select/relation)
- Project (relation)
- Circle (relation or select)
- Google Calendar Link (url)
- Google Meet Link (url)
- Recording Link (url)
- Transcript Link (url)
- Notes Link (url)
- Recording Access Status (select)
- Transcript Access Status (select)
- Notes Access Status (select)
- Processing Status (select)
- Summary (rich text)
- Decisions Count (number)
- Tasks Count (number)
- Risks Count (number)
- Memory Candidates Count (number)
- Canon Review Required (checkbox)
- Sensitive Review Required (checkbox)
- Last Processed At (date)
- Automation Log (relation/rich text)

## 3. Meeting Assets

Properties:

- Asset Name (title)
- Asset Type (select)
- Related Meeting (relation)
- Source Email (relation)
- Google Drive File ID (text)
- Google Drive Link (url)
- Access Status (select)
- Processing Status (select)
- Received At (date)
- Processed At (date)
- Error Message (rich text)
- Retry Count (number)
- Next Retry At (date)

Asset Type options:

- Recording
- Transcript
- Gemini Notes
- Chat Log
- Caption File
- Attachment
- Unknown

## 4. Messages

Properties:

- Message Title (title)
- Source Email (relation)
- Sender (text/relation)
- Recipients (text)
- Date (date)
- Related People (relation)
- Related Organizations (relation)
- Related Project (relation)
- Related Circle (relation/select)
- Summary (rich text)
- Requests (rich text)
- Commitments (rich text)
- Questions (rich text)
- Emotional Tone (select/rich text)
- Urgency (select)
- Follow-Up Needed (checkbox)
- Confidentiality Level (select)
- Processing Status (select)

## 5. People

Properties:

- Name (title)
- Email (email)
- Phone (phone)
- Organization (relation)
- Role (text)
- Circles (relation)
- Related Projects (relation)
- Related Messages (relation)
- Related Meetings (relation)
- Commitments (rich text)
- Context Summary (rich text)
- Sensitive Notes Flag (checkbox)
- Last Interaction (date)

## 6. Organizations

Properties:

- Organization Name (title)
- Type (select)
- Website (url)
- Primary Contacts (relation)
- Related Projects (relation)
- Related Messages (relation)
- Related Meetings (relation)
- Status (select)
- Context Summary (rich text)

## 7. Tasks

Properties:

- Task (title)
- Owner (person/relation/text)
- Project (relation)
- Circle (relation/select)
- Source Meeting (relation)
- Source Email (relation)
- Source Evidence (rich text)
- Due Date (date)
- Priority (select)
- Status (select)
- Needs Owner (checkbox)
- Canon Impact (checkbox)

## 8. Decision Candidates

Properties:

- Decision (title)
- Status (select)
- Source Meeting (relation)
- Source Email (relation)
- Source Evidence (rich text)
- Decision Maker (text/relation)
- Circle (relation/select)
- Project (relation)
- Canon Impact (checkbox)
- Needs Confirmation (checkbox)
- Reviewer (person/text)
- Approved Date (date)

Status options:

- Candidate
- Confirmed
- Rejected
- Needs Clarification

## 9. Risks

Properties:

- Risk (title)
- Category (select)
- Severity (select)
- Source Meeting (relation)
- Source Email (relation)
- Evidence (rich text)
- Suggested Mitigation (rich text)
- Owner (person/text)
- Status (select)

## 10. Memory Review Queue

Properties:

- Proposed Memory (title)
- Category (select)
- Source Meeting (relation)
- Source Email (relation)
- Source Evidence (rich text)
- Confidence (select)
- Risk If Added (rich text)
- Risk If Ignored (rich text)
- Suggested Destination (text)
- Reviewer (person/text)
- Status (select)
- Approved Date (date)
- Implemented Link (url)

## 11. Canon Change Requests

Properties:

- Proposed Change (title)
- Affected Canon Area (select)
- Affected Canon Doc (url/relation/text)
- Reason (rich text)
- Source Meeting (relation)
- Source Email (relation)
- Source Evidence (rich text)
- Reviewer (person/text)
- Status (select)
- Approved Date (date)
- Implemented By (person/text)
- Implementation Link (url)

Status options:

- Pending Review
- Approved
- Rejected
- Needs Clarification
- Implemented
- Archived

## 12. CCOS Ledger Entries

Properties:

- Ledger Entry (title)
- Ledger Type (select)
- Circle (relation/select)
- Role (relation/text)
- Project (relation)
- Source Meeting (relation)
- Source Email (relation)
- Related People (relation)
- Related Organizations (relation)
- Status (select)
- Evidence (rich text)
- Review Required (checkbox)
- Approved By (person/text)
- Approved Date (date)

Ledger Type options:

- Tension
- Proposal
- Decision
- Role
- Policy
- Resource
- Accountability

## 13. Processing Events

Properties:

- Event ID (title)
- Tenant ID (text)
- Source Type (select)
- Source ID (text)
- Event Type (select)
- Status (select)
- Started At (date)
- Completed At (date)
- Error (rich text)
- Retry Count (number)
- Created Records (rich text)
- Claude Model Used (text)
- Token Estimate (number)
