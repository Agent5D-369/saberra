# Google Meet and Email Workflow Canon

## Core Workflow

```text
Incoming source
  ↓
roots@amora.cr Gmail inbox
  ↓
Railway worker polling Gmail
  ↓
Email classification
  ↓
Source Email record in Notion
  ↓
Meeting/Message/Asset record creation
  ↓
Access check
  ↓
Text extraction if accessible
  ↓
Claude structured extraction
  ↓
Notion draft/review records
  ↓
Admin review for canon/sensitive items
```

## Email Types

The worker must classify incoming email as one of:

- Google Meet Recording
- Google Meet Transcript
- Google Meet Notes
- Operational Email
- Forwarded Thread
- Unknown

## Gmail Labels

Create or use:

- AMORA_CAPTURE
- AMORA_MEET_RECORDING
- AMORA_MEET_TRANSCRIPT
- AMORA_MEET_NOTES
- AMORA_EMAIL_IMPORT
- AMORA_NEEDS_ACCESS
- AMORA_PROCESSING
- AMORA_PROCESSED
- AMORA_FAILED
- AMORA_MANUAL_REVIEW

## Meeting Capture

Staff schedule meetings normally and add `roots@amora.cr`.

After meeting, Google assets may arrive separately:

- Recording email
- Transcript email
- Gemini notes email

The system must merge these into one Meeting record using a Capture Key.

## Capture Key Priority

Use:

1. Google Calendar event ID, if available.
2. Google Meet code + date.
3. Normalized meeting title + organizer + date.
4. Drive file ID fallback.
5. Gmail thread ID fallback.

## Recording Email Workflow

1. Detect new email.
2. Classify as Google Meet Recording.
3. Create Source Email record.
4. Extract recording link.
5. Extract Drive file ID.
6. Upsert Meeting record.
7. Upsert Meeting Asset record.
8. Check Drive access.
9. If access confirmed, attach recording link.
10. If access denied, mark Needs Access, send access request, retry.
11. Do not transcribe video in MVP unless transcript/notes are missing and Rick approves.

## Transcript Email Workflow

1. Detect new email.
2. Classify as Google Meet Transcript.
3. Create Source Email record.
4. Extract transcript Google Doc link.
5. Extract Google Doc ID.
6. Upsert Meeting record.
7. Upsert Meeting Asset record.
8. Check access.
9. Export text if accessible.
10. Send text to Claude API.
11. Create/update summary, decisions, tasks, risks, memory candidates, canon change requests.
12. Mark processed.

## Notes Email Workflow

1. Detect new email.
2. Classify as Google Meet Notes.
3. Create Source Email record.
4. Extract notes Google Doc link.
5. Extract Google Doc ID.
6. Upsert Meeting record.
7. Upsert Meeting Asset record.
8. Check access.
9. Export text if accessible.
10. Send text to Claude API.
11. Create/update records.
12. Mark processed.

## Operational Email Workflow

1. Detect CC/BCC/forwarded/import email.
2. Create Source Email record.
3. Extract sender, recipients, subject, date, body, links, attachments metadata.
4. Send relevant body to Claude API.
5. Create Message record.
6. Create tasks, decision candidates, risks, memory candidates, canon change requests as needed.
7. Flag sensitive content.
8. Mark processed.

## Access Failure

If link cannot be opened:

1. Mark asset Needs Access.
2. Apply Gmail label AMORA_NEEDS_ACCESS.
3. Send automatic access request to organizer/sender.
4. Retry at immediate, 30 min, 2 hours, 24 hours.
5. Escalate to manual review after final failure.

## Processing Order

Prefer text sources:

1. Gemini/Google Meet notes.
2. Transcript.
3. Recording only if needed.

## Access Request Template

Subject: Please share Amora meeting asset with roots@amora.cr

Hi [Name],

The Amora Living Memory Hub received the meeting asset for:

[Meeting Title]

but roots@amora.cr does not currently have access to the file.

Please share this asset with roots@amora.cr so it can be processed into Living Memory:

[Asset Link]

Once shared, the system will automatically retry and complete processing.

Thank you.
