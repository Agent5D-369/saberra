# Amora Living Memory Hub — Database Field Guide

Every database, every field. Who fills it, what it means, when to use it.

**Key:**
- 🤖 Filled automatically by the AI pipeline
- 👤 Filled manually by you
- 🔗 Links to another database record
- ⚙️ System-managed — do not edit

---

## SOURCE EMAILS
*Every email that arrives at roots@amora.cr is logged here first. This is the ingestion ledger — a permanent record of every source the system processed. You will rarely need to look here unless debugging a processing failure.*

| Field | Who | Description |
|---|---|---|
| **Title** | 🤖 | Subject line of the email. The primary identifier for this record. |
| **Message ID** | 🤖 | The unique technical identifier of the email, extracted from the email headers. Used by the system to prevent the same email from being processed twice. |
| **Thread Reference** | 🤖 | The thread ID if this email is part of a reply chain. Links it back to the original conversation. |
| **From** | 🤖 | The sender's name and email address, exactly as it appeared in the email. |
| **To** | 🤖 | The primary recipient(s) of the email. |
| **CC** | 🤖 | Anyone copied on the email. |
| **BCC Indicator** | 🤖 | Checked if roots@amora.cr was BCC'd rather than a direct recipient. |
| **Received Date** | 🤖 | When the email arrived in the roots@amora.cr inbox. |
| **Subject** | 🤖 | The full subject line, stored separately from the Title for search purposes. |
| **Email Type** | 🤖 | How the system classified this email: Google Meet Recording, Transcript, Notes, Operational Email, Forwarded Thread, or Unknown. |
| **Source Category** | 🤖 | Broader grouping: Meeting Asset (something from a Google Meet) or Operational (a regular email or thread). |
| **Raw Snippet** | 🤖 | The first 500 characters of the email body. Useful for a quick preview of what the email contained without opening the full message. |
| **Detected Links** | 🤖 | All URLs found in the email body. Useful for tracking which Google Drive or Docs links were mentioned. |
| **Processing Status** | 🤖 | Where this email is in the pipeline: Pending → Processing → Processed (or Failed / Manual Review if something went wrong). |
| **Error Log** | 🤖 | If processing failed, the technical error message appears here. Share this with the system administrator when reporting a problem. |
| **Processed At** | 🤖 | When the pipeline finished handling this email. |

---

## MEETINGS
*One record per meeting. Created automatically when a Google Meet notification email arrives at roots@amora.cr. A meeting record may exist before its transcript or notes are processed — it gets filled in progressively as assets become available.*

| Field | Who | Description |
|---|---|---|
| **Meeting Title** | 🤖 | Name of the meeting, derived from the Google Meet notification email subject. |
| **Capture Key** | 🤖 | An internal identifier the system uses to group all assets from the same meeting (recording, transcript, notes) into one record. Do not edit. |
| **Meeting Date** | 🤖 | The date the meeting took place, extracted from the notification email. |
| **Organizer** | 🤖 | Name of the person who organized or hosted the meeting, as plain text. |
| **Organizer Profile** | 🔗👤 | Link to the organizer's Profile record. Connect this manually once the organizer has a profile in the system. |
| **Participants** | 🤖 | Everyone in the meeting, listed as plain text from the notification email. |
| **Participant Profiles** | 🔗👤 | Links to Profile records for meeting participants. Connect these manually as profiles become available. |
| **Google Calendar Link** | 🤖 | Direct link to the Google Calendar event for this meeting. |
| **Google Meet Link** | 🤖 | The meet.google.com URL for this session. |
| **Recording Link** | 🤖 | Direct link to the recording file in Google Drive. |
| **Transcript Link** | 🤖 | Direct link to the transcript document in Google Drive. |
| **Notes Link** | 🤖 | Direct link to the Gemini-generated meeting notes in Google Drive. |
| **Recording Access Status** | 🤖 | Whether roots@amora.cr can currently access the recording: Unknown, Confirmed, Needs Access, or Denied. |
| **Transcript Access Status** | 🤖 | Whether roots@amora.cr can currently access the transcript. |
| **Notes Access Status** | 🤖 | Whether roots@amora.cr can currently access the meeting notes. |
| **Processing Status** | 🤖 | Overall progress of this meeting through the pipeline: Pending, Processing, Processed, Partial (some assets done, others still pending), Failed, or Manual Review. |
| **Summary** | 🤖 | AI-generated summary of what happened in the meeting, written from the transcript or notes. Includes key themes, outcomes, and context. |
| **Decisions Count** | 🤖 | How many decision candidates the AI extracted from this meeting's content. |
| **Tasks Count** | 🤖 | How many tasks the AI extracted from this meeting's content. |
| **Risks Count** | 🤖 | How many risks the AI identified in this meeting's content. |
| **Memory Candidates Count** | 🤖 | How many proposed institutional memories the AI surfaced from this meeting. |
| **Canon Review Required** | 🤖 | Checked if the AI detected content that may affect official governance documents, policies, or circle/role definitions. Means an admin should review the extracted records. |
| **Sensitive Review Required** | 🤖 | Checked if the AI flagged sensitive interpersonal content in this meeting. Means an admin should review the sensitive flags before taking any action. |
| **Last Processed At** | 🤖 | When the pipeline most recently updated this meeting record. |
| **Automation Log** | 🤖 | Internal notes left by the pipeline about what happened during processing. Useful for troubleshooting. |

---

## MEETING ASSETS
*Each individual file associated with a meeting — recording, transcript, notes — gets its own record here. One meeting may have multiple asset records. This table tracks whether each file is accessible and whether it has been extracted.*

| Field | Who | Description |
|---|---|---|
| **Asset Name** | 🤖 | Name of the file, typically the meeting name plus asset type (e.g. "Weekly Sync — Transcript"). |
| **Asset Type** | 🤖 | What kind of asset this is: Recording, Transcript, Gemini Notes, Chat Log, Caption File, Attachment, or Unknown. |
| **Google Drive File ID** | 🤖 | The internal Google Drive identifier for this file. Used by the system to check access and export content. |
| **Google Drive Link** | 🤖 | Clickable link to open this file directly in Google Drive. |
| **Access Status** | 🤖 | Whether the system can currently read this file: Unknown (not yet checked), Confirmed (accessible), Needs Access (roots@amora.cr was not shared on this file — an access request has been sent), or Denied (access was explicitly refused). |
| **Processing Status** | 🤖 | Where this asset is in the pipeline. Needs Access means the system is waiting for the file to be shared. |
| **Received At** | 🤖 | When the notification email for this asset arrived. |
| **Processed At** | 🤖 | When the asset was successfully read and extracted. |
| **Error Message** | 🤖 | Technical description of what went wrong if processing failed. |
| **Retry Count** | 🤖 | How many times the system has tried and failed to access or process this asset. |
| **Next Retry At** | 🤖 | When the system will try again for assets that need access. The system retries automatically on a schedule. |

---

## MESSAGES
*One record per operational email — any email that is not a Google Meet notification. This is where the intelligence from your day-to-day correspondence lives: what was asked, what was committed to, what was left unresolved.*

| Field | Who | Description |
|---|---|---|
| **Message Title** | 🤖 | The email subject line. Primary identifier for this record. |
| **Date** | 🤖 | When the email was received. |
| **Sender** | 🤖 | Name and email address of the person who sent this message, as plain text. |
| **Sender Profile** | 🔗👤 | Link to the sender's Profile record. Connect this manually once the sender has a profile in the system. |
| **Recipients** | 🤖 | Everyone who received this email (To and CC combined), as plain text. |
| **Processing Status** | 🤖 | Whether the AI successfully extracted intelligence from this email. Processed means all records were created. Failed means something went wrong — check the Source Emails record for details. |
| **Urgency** | 🤖 | How time-sensitive the AI judged this email to be: High, Medium, or Low. |
| **Emotional Tone** | 🤖 | The overall tone the AI detected: Neutral, Positive, Tense, Urgent, or Unclear. Use this to prioritize which messages need attention. |
| **Follow-Up Needed** | 🤖 | Checked if the AI determined this email requires a response or action that hasn't yet been captured as a task. |
| **Confidentiality Level** | 🤖 | Standard (routine), Sensitive (contains personal or politically delicate content), or Restricted (should not be shared broadly). |
| **Summary** | 🤖 | A concise AI-written summary of what this email was about. One paragraph covering the essential content. |
| **Requests** | 🤖 | Things the sender explicitly asked for or needs from Amora. Extracted verbatim or near-verbatim from the email. |
| **Commitments** | 🤖 | Things Amora or its members have committed to doing, as stated in this email. |
| **Questions** | 🤖 | Open questions raised in the email that have not yet been answered. |

---

## PROFILES
*Every person or organization Amora has a relationship with lives here — one record each. Created automatically when someone is mentioned in a processed email or meeting. The single source of truth for who is who in the Amora ecosystem.*

| Field | Who | Description |
|---|---|---|
| **Name** | 🤖 | Full name of the person or organization. |
| **Profile Type** | 🤖 | Person, Organization, or Both. "Both" is used for sole proprietors or individuals who are also their own entity (e.g. a freelance consultant operating under their own name). |
| **Engagement Status** | 👤 | How live the relationship is right now: Active (ongoing engagement), Inactive (relationship has gone quiet), Prospect (potential future relationship), or Unknown. Update this manually as relationships evolve. |
| **Relationship to Amora** | 🤖👤 | The nature of the relationship: Member (part of the Amora community), Partner (organizational collaboration), Vendor (paid services), Advisor (formal advisory role), Funder (financial supporter), Contact (general contact), Community (broader regenerative community), Alumni (former member), Government (regulatory or governmental entity), Unknown. AI makes an initial assignment; you should verify and correct it. |
| **Role / Title** | 🤖 | Their professional title or role in the world outside Amora (e.g. "Executive Director", "Land Rights Lawyer", "Co-founder"). |
| **Role at Amora** | 🤖 | What they specifically do within the Amora community (e.g. "Stewardship Circle legal advisor", "Learning Circle facilitator"). Different from their external title. |
| **Organization** | 🤖 | The name of their employer or primary affiliated organization, as plain text. Auto-populated by the AI even if that organization doesn't yet have its own Profile record. Once the org has a profile, you can link them via Connected To. |
| **Circle Affiliation** | 🤖 | Which Amora circles this person or org is connected to. Multi-select — they may be part of more than one circle. |
| **Tags** | 🤖 | Skills and expertise domains the AI inferred from context: Leadership, Legal, Finance, Agriculture, Education, Communications, Operations, Governance, Technical, Community, Land Stewardship, Fundraising. Use these to filter and find the right people for a given need. |
| **Email** | 🤖 | Primary email address, when mentioned in source content. |
| **Phone** | 👤 | Contact phone number. The AI does not currently extract phone numbers — add this manually. |
| **LinkedIn** | 🤖 | LinkedIn profile URL, when mentioned in source content. |
| **Website** | 🤖 | Website URL, when mentioned in source content. Most useful for organizations. |
| **Location** | 🤖 | City, country, or region, when mentioned in source content. |
| **Context Summary** | 🤖 | An AI-generated running summary of what is known about this person or organization from all emails and meetings in which they have been mentioned. Updated automatically each time they appear in new source content. **Do not use this field for your own notes** — it may be overwritten by the next extraction. Use Admin Notes instead. |
| **Admin Notes** | 👤 | Your personal notes about this profile. This field is invisible to the AI — it will never be read, overwritten, or referenced by the pipeline. Use it freely for sensitive observations, relationship context, or anything you don't want the AI touching. |
| **Suggested Connections** | 🤖 | Names of other people or organizations the AI identified as likely related to this profile, based on mentions in the same source content (e.g. "referred by", "reports to", "collaborating with"). Use this as a prompt to create formal links in the Connected To field. |
| **Referred By** | 🤖 | Who introduced this person or organization to Amora, when explicitly mentioned in source content. |
| **Sensitive Notes Flag** | 👤 | Check this if this profile involves sensitive interpersonal dynamics, a contested relationship, or information that requires extra discretion. Use it to remind yourself and teammates to handle this record carefully. |
| **Connected To** | 🔗👤 | Formal links to other Profile records. Use this for verified relationships: org membership, referral chains, collaborators, reports-to structures. When you link Profile A to Profile B here, Profile B automatically shows Profile A in its Connected From field. |
| **Connected From** | 🔗⚙️ | Automatically populated by Notion. Shows which other profiles have linked to this record via their Connected To field. Read-only — you cannot edit this directly. It is the reverse side of Connected To. |
| **First Seen** | 🤖 | Date this profile was first created in the system — the first time this person or org was mentioned in a processed email or meeting. |
| **Last Seen** | 🤖 | Date this profile was most recently mentioned or updated by the pipeline. A useful signal for how recently this relationship has been active in correspondence. |
| **Source** | 🤖 | The email subject or meeting title that first introduced this profile to the system. |

---

## PROJECTS
*Named initiatives or workstreams that group related tasks, decisions, and meetings together. Created automatically when the AI identifies a clearly named project or initiative in source content. Projects are the backbone that gives tasks and decisions their context.*

| Field | Who | Description |
|---|---|---|
| **Project Name** | 🤖 | The name of the initiative as referenced in source content (e.g. "North Parcel Land Title Transfer", "Agroforestry Training Initiative"). |
| **Status** | 🤖👤 | Current state: Proposed (just surfaced, not yet confirmed), Active (underway), On Hold (paused), Complete, or Cancelled. AI makes an initial assignment based on context; update manually as the project progresses. |
| **Circle** | 🤖 | Which Amora circle owns or is responsible for this project. |
| **Project Lead** | 🤖 | Name of the person leading this project, as plain text. |
| **Lead Profile** | 🔗👤 | Link to the project lead's Profile record. Connect manually once they have a profile. |
| **Team Profiles** | 🔗👤 | Links to Profile records for everyone on the project team. Connect manually to build a full picture of who is involved. |
| **Priority** | 🤖 | High, Medium, or Low — AI-assessed based on urgency and significance of the content in which this project was mentioned. |
| **Start Date** | 🤖👤 | When the project began or is expected to begin, if mentioned in source content. |
| **Target Date** | 🤖 | Deadline or expected completion date, if mentioned in source content. Only populated when a specific date was given — never a guess. |
| **Description** | 🤖 | AI-written summary of what this project is, its purpose, and its current state based on available source content. |
| **Source** | 🤖 | The email or meeting where this project was first identified. |

---

## TASKS
*Concrete action items extracted from emails and meetings. Every task the AI identifies lands here for review and tracking. Tasks are extracted only when something was clearly assigned or committed to — not for general suggestions or possibilities.*

| Field | Who | Description |
|---|---|---|
| **Task** | 🤖 | A clear, actionable description of what needs to be done. Written as extracted from source content — the AI does not rephrase or interpret beyond what was said. |
| **Status** | 👤 | Where this task stands: Open (not started), In Progress, Done, Cancelled, or Needs Owner (no one has been assigned yet). Update this manually as work progresses. |
| **Priority** | 🤖 | High, Medium, or Low — the AI's assessment based on the urgency and language in the source content. |
| **Owner** | 🤖 | Name of the person responsible for this task, as plain text extracted from source content. |
| **Owner Profile** | 🔗👤 | Link to the owner's Profile record. Connect manually to enable filtering and relationship views. |
| **Needs Owner** | 🤖 | Checked if the task was identified but no owner was named in the source content. Use this filter to find tasks that need to be assigned. |
| **Due Date** | 🤖 | The deadline, if a specific date was mentioned. Never populated with a vague date like "next month" — only concrete dates are recorded. |
| **Canon Impact** | 🤖 | Checked if this task involves changes to official governance documents, policies, or circle/role definitions. Tasks with this checked warrant extra scrutiny before being marked done. |
| **Source Evidence** | 🤖 | The exact quote or paraphrase from the source email or meeting that this task was derived from. Use this to verify the AI's interpretation against the original text. |

---

## DECISION CANDIDATES
*Decisions that were made or discussed in emails and meetings, surfaced for human review. The AI does not confirm decisions — it identifies them as candidates. Every record here needs a human to verify it before it becomes institutional truth.*

| Field | Who | Description |
|---|---|---|
| **Decision** | 🤖 | A concise statement of the decision as it was made or discussed. Written faithfully to the source — the AI does not editorialize. |
| **Status** | 👤 | Where this decision stands: Candidate (AI-identified, not yet verified), Confirmed (a human has verified this was actually decided), Rejected (upon review, this was not actually a decision), or Needs Clarification (unclear from source — needs follow-up). You must update this manually. |
| **Canon Impact** | 🤖 | Checked if this decision may affect official governance documents, circle definitions, role definitions, policies, or legal/financial commitments. High-importance flag — confirmed decisions with this checked should trigger a Canon Change Request. |
| **Needs Confirmation** | 🤖 | Checked if the AI was uncertain whether this was a final decision or still under discussion. Treat these with extra care before confirming. |
| **Decision Maker** | 🤖 | Name of the person who made or proposed this decision, as plain text. |
| **Decision Maker Profile** | 🔗👤 | Link to the decision maker's Profile record. |
| **Source Evidence** | 🤖 | The quote or near-quote from the source that this decision was derived from. Always check this before confirming a decision. |
| **Reviewer** | 👤 | Name of the person who reviewed and verified this decision candidate. Fill in when you change Status to Confirmed or Rejected. |
| **Reviewer Profile** | 🔗👤 | Link to the reviewer's Profile record. |
| **Approved Date** | 👤 | The date this decision was confirmed as official. Fill in when setting Status to Confirmed. |

---

## RISKS
*Risks, concerns, and vulnerabilities identified in emails and meetings. Not every worry is a risk — the AI uses judgment to surface things that could meaningfully affect Amora's operations, relationships, finances, governance, or land stewardship.*

| Field | Who | Description |
|---|---|---|
| **Risk** | 🤖 | A clear statement of the risk as identified from source content. |
| **Severity** | 🤖 | How serious this risk is: High (could significantly damage Amora's mission, finances, or relationships), Medium (notable concern that warrants monitoring), or Low (minor issue worth noting). |
| **Category** | 🤖 | What domain this risk falls in: Operational, Financial, Legal, Governance, Interpersonal, Technical, or Unknown. |
| **Status** | 👤 | Where this risk stands: Open (unaddressed), Mitigated (steps taken to reduce it), Accepted (acknowledged and consciously accepted), or Closed (no longer relevant). Update manually. |
| **Owner** | 🤖👤 | Name of the person responsible for monitoring or addressing this risk, as plain text. The AI extracts this if someone was named; otherwise assign manually. |
| **Owner Profile** | 🔗👤 | Link to the risk owner's Profile record. |
| **Evidence** | 🤖 | The quote or passage from source content that gave rise to this risk identification. |
| **Suggested Mitigation** | 🤖 | If the source content included any discussion of how to address this risk, the AI captures it here. This is a suggestion, not a directive. |

---

## MEMORY REVIEW QUEUE
*Proposed additions to Amora's institutional knowledge base. When the AI identifies something worth remembering long-term — a pattern, a relationship, a commitment, a lesson — it surfaces it here for human review. Nothing in this queue becomes institutional memory until a human approves it.*

| Field | Who | Description |
|---|---|---|
| **Proposed Memory** | 🤖 | A clear, standalone statement of what the AI thinks should be remembered. Written to be durable — useful in future contexts without referring back to the original source. |
| **Status** | 👤 | Pending Review (awaiting your decision), Approved (this memory is valid and should be acted on), Rejected (not accurate or not worth retaining), or Needs Clarification (more context needed before deciding). You must update this. |
| **Confidence** | 🤖 | How certain the AI is that this memory is accurate and worth keeping: High, Medium, or Low. Low-confidence memories warrant extra scrutiny. |
| **Category** | 🤖 | What type of memory this is: Context (background about a situation or person), Relationship (how people or orgs relate to each other), Commitment (something Amora or a partner has committed to), Decision (a decision worth preserving separately from Decision Candidates), Learning (a lesson from experience), Process (how something is or should be done), or Unknown. |
| **Source Evidence** | 🤖 | The quote or passage from source content that generated this proposed memory. |
| **Risk If Added** | 🤖 | The AI's assessment of what could go wrong if this memory is added incorrectly or prematurely. Read this before approving. |
| **Risk If Ignored** | 🤖 | The AI's assessment of what could be lost if this memory is rejected or overlooked. Read this before rejecting. |
| **Suggested Destination** | 🤖 | Where the AI thinks this memory should live — which document, database, or person should hold it. A suggestion only. |
| **Reviewer** | 👤 | Name of the person who reviewed this memory candidate. Fill in when updating Status. |
| **Reviewer Profile** | 🔗👤 | Link to the reviewer's Profile record. |
| **Approved Date** | 👤 | Date this memory was approved. Fill in when setting Status to Approved. |
| **Implemented Link** | 👤 | If this memory was added to a document or another system, paste the link here so it can be traced. |

---

## CANON CHANGE REQUESTS
*Proposals to change Amora's official governing documents — its policies, circle definitions, role definitions, legal commitments, and public commitments. These are the highest-stakes records in the system. The AI never approves canon changes; it only surfaces them for human review and decision.*

| Field | Who | Description |
|---|---|---|
| **Proposed Change** | 🤖 | A clear description of what change is being proposed to official canon. |
| **Status** | 👤 | Pending Review → Approved → Implemented (or Rejected / Needs Clarification / Archived). This workflow must be human-driven. |
| **Affected Canon Area** | 🤖 | Which part of Amora's governance structure this change would affect: Governing Purpose, Policy, Circle Definition, Role Definition, Decision Rights, Legal Commitment, Financial Commitment, Land Stewardship, CCOS Ledger, Public Commitment, or Unknown. |
| **Affected Canon Doc** | 🤖 | The specific document, policy, or charter that would need to be updated if this change is approved. |
| **Reason** | 🤖 | Why this change is being proposed, as extracted from the source content. |
| **Source Evidence** | 🤖 | The exact passage from the email or meeting that generated this request. |
| **Reviewer** | 👤 | Name of the person responsible for reviewing this change request. |
| **Reviewer Profile** | 🔗👤 | Link to the reviewer's Profile record. |
| **Approved Date** | 👤 | Date the change was formally approved by the appropriate decision-makers. |
| **Implemented By** | 👤 | Name of the person who made the actual change to the canon document. |
| **Implementer Profile** | 🔗👤 | Link to the implementer's Profile record. |
| **Implementation Link** | 👤 | Link to the updated canon document after the change has been made. Paste this here to close the loop. |

---

## CCOS LEDGER ENTRIES
*Draft entries for the CCOS (Circle Operating System) governance ledger. The CCOS ledger is Amora's formal record of organizational events — tensions raised, proposals made, decisions taken, roles changed, policies set, resources allocated, and accountability actions. All entries start as drafts here and require admin review before becoming official.*

| Field | Who | Description |
|---|---|---|
| **Ledger Entry** | 🤖 | A formal statement of the governance event, written in ledger language. Drafted by the AI — must be reviewed before treating as official. |
| **Ledger Type** | 🤖 | What kind of governance event this is: Tension (a problem or concern raised within a circle), Proposal (a formal proposal being considered), Decision (a governance decision taken), Role (a change to a role definition or assignment), Policy (a policy being created or modified), Resource (a resource allocation or financial decision), or Accountability (an accountability process or outcome). |
| **Circle** | 🤖 | Which circle this ledger entry belongs to. |
| **Role** | 🤖 | Which role, if any, this entry relates to. |
| **Evidence** | 🤖 | The source passage that generated this ledger entry. |
| **Status** | 👤 | Draft (AI-generated, not yet reviewed), Pending Review (submitted for formal review), Approved (accepted as official), or Archived (superseded or no longer relevant). |
| **Review Required** | 🤖 | Always checked on AI-generated entries. The AI marks every entry as requiring review because it cannot confirm governance validity — only humans can do that. |
| **Approved By** | 👤 | Name of the circle lead or governance steward who approved this entry. |
| **Approver Profile** | 🔗👤 | Link to the approver's Profile record. |
| **Approved Date** | 👤 | Date this entry was formally approved and entered into the official ledger. |

---

## PROCESSING EVENTS
*⚙️ System audit log — you will almost never need to look at this table. It records every action the pipeline takes: each poll cycle, each email processed, each extraction run, each Notion write. Used for debugging, performance monitoring, and accountability. Do not edit any records here.*

| Field | Who | Description |
|---|---|---|
| **Event ID** | ⚙️ | Unique identifier for this pipeline event. Auto-generated. |
| **Tenant ID** | ⚙️ | Identifies which organization this instance belongs to (always "amora" for this installation). |
| **Source Type** | ⚙️ | What triggered this event: an IMAP poll, a specific email type, a retry, or a setup operation. |
| **Source ID** | ⚙️ | The email message ID or asset ID that this event was processing. |
| **Event Type** | ⚙️ | What the pipeline was doing: poll_start, email_classified, asset_parsed, access_check, text_export, extraction, notion_write, access_request_sent, retry_scheduled, or error. |
| **Status** | ⚙️ | Whether this pipeline action started, completed successfully, or failed. |
| **Started At** | ⚙️ | When this pipeline action began. |
| **Completed At** | ⚙️ | When this pipeline action finished. |
| **Error** | ⚙️ | Technical error message if this event failed. Share with the system administrator when reporting a problem. |
| **Retry Count** | ⚙️ | How many times this operation was retried before succeeding or failing permanently. |
| **Created Records** | ⚙️ | List of Notion record IDs that were created during this event. Used for tracing what was produced by a given pipeline run. |
| **Claude Model Used** | ⚙️ | Which AI model handled the extraction (Sonnet or Haiku fallback). Useful for cost monitoring and quality comparison. |
| **Token Estimate** | ⚙️ | Approximate number of tokens consumed by the AI call for this event. Used for cost tracking. |
