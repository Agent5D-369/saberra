# Master Architecture Canon

## Official Name

Amora Living Memory Hub

Internal product core name:

Living Memory Core

## Purpose

The Amora Living Memory Hub is a shared institutional memory and coordination layer. It captures important meetings, email threads, decisions, tasks, risks, roles, policies, and governance signals so Amora can grow without relying on scattered inboxes, private Google Drives, informal recollection, or single-person memory.

## Core Architecture

```text
roots@amora.cr
  ↓
Gmail inbox / Google Meet asset notifications / CC-BCC-forwarded email
  ↓
Railway background worker
  ↓
Gmail API + Google Drive API + Google Docs API + optional Google Calendar API
  ↓
Access check + parsing + deduplication + retry logic
  ↓
Claude API structured extraction
  ↓
Notion structured backend
  ↓
Admin review queues
  ↓
Approved canon updates by humans only
```

## Tool Roles

### Google Workspace

- Holds the capture account: `roots@amora.cr`
- Holds Google Meet source assets.
- Holds canonical Drive structures.
- Handles Gmail, Drive, Docs, Calendar, and Meet.
- Controls the real permission boundary for Google data.

### Notion

- Structured backend database.
- Stores records, review queues, tasks, decision candidates, risks, memory candidates, and ledger drafts.
- Does not become raw file storage for huge transcripts or recordings.

### Claude API

- Background extraction engine.
- Receives accessible source text.
- Returns strict JSON.
- Does not decide what becomes canon.

### Claude Team

- Human-facing prompt interface.
- Used for team interaction, querying, planning, and review support.
- Not the background automation engine.

### Railway

- Primary MVP background worker host.
- Handles Gmail polling, asset parsing, Google access checks, Notion writes, Claude API calls, retry logic, and logs.

### Vercel

- Optional future dashboard.
- Not required for MVP.

## Account Canon

`roots@amora.cr` is the institutional capture/admin/integration account.

It may be:

- Google Workspace admin / Drive owner.
- Canonical document owner.
- Meeting capture inbox.
- Email import listener.
- Notion workspace admin or integration owner.
- Automation identity.

It is not:

- A personal inbox.
- A daily shared user account.
- A magical all-seeing account.
- A substitute for Google permissions.

## Staff Workflow Canon

Staff do not schedule meetings from Roots.

Staff schedule meetings normally and add:

`roots@amora.cr`

as a guest for memory-worthy meetings.

For important emails, staff may:

- CC Roots.
- BCC Roots when appropriate.
- Forward a thread to Roots.
- Use `[AMORA CAPTURE]` in subject for clarity.

## Canon Safety

Automation may create:

- Source Emails
- Meetings
- Meeting Assets
- Messages
- Tasks
- Decision Candidates
- Risks
- Memory Candidates
- Canon Change Requests
- CCOS Ledger Drafts
- Processing Events

Automation may not update:

- Approved policies
- Official role definitions
- Circle constitutions
- Legal agreements
- Financial commitments
- Final CCOS ledger canon
- Sensitive records outside approved review paths

## Core Principle

Automation handles intake. Admins handle authority.
