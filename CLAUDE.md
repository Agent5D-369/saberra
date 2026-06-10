# Amora Living Memory Hub — Claude Code Reference

## What this is

A TypeScript/Node.js Railway background worker that processes emails sent to `roots@amora.cr` and writes structured institutional memory into 23 Notion databases. It handles Google Meet asset notifications (recordings, transcripts, Gemini notes), operational emails, and forwarded threads.

**The worker never publishes, approves, or applies canon changes.** It only creates draft/candidate/pending records for human review.

## Stack

- **Runtime**: Node.js + TypeScript, Railway (background worker, no HTTP server)
- **Email ingestion**: WPX IMAP (`s25.wpx.net:993`) via `imapflow` + `mailparser`
- **Google APIs**: Drive v3 (access check), Docs v1 (text export), Gmail v1 (outbound only) — OAuth2 via `googleapis`
- **AI extraction**: Anthropic Claude API (`@anthropic-ai/sdk`) — primary model in `CLAUDE_MODEL` env var, Haiku fallback
- **State store**: Notion (`@notionhq/client`) — 23 databases, no Postgres
- **Config validation**: Zod schema at startup (`src/config/ConfigService.ts`)
- **Logging**: pino (`src/config/logger.ts`)

## Key commands

```bash
npx tsc --noEmit          # Type check (must pass before deploy)
railway up --service worker  # Deploy to Railway
npx ts-node scripts/<name>   # Run a migration/setup script
```

## Architecture: data flow

```
IMAP (WPX) → classify → Source Email record (Notion)
    │
    ├─ Google Meet Recording/Transcript/Notes
    │   → upsertMeeting (dedup by Capture Key)
    │   → upsertMeetingAsset (dedup by Meeting ID + Asset Type)
    │   → checkAccess (Google Drive API)
    │   ├─ Confirmed → exportAsText (Docs API) → Claude extract → writeToNotion
    │   └─ Needs Access → scheduleRetry → sendAccessRequest (admin email)
    │
    └─ Operational Email / Forwarded Thread
        → Claude extract → createPage (Messages DB) → writeToNotion
```

## Service map

| File | Responsibility |
|------|---------------|
| `src/worker.ts` | Entry point, polling loop, SIGTERM handler |
| `src/services/PipelineService.ts` | Orchestrates the full poll cycle |
| `src/services/ImapIngestionService.ts` | IMAP fetch (deferred seen-flagging), Source Email records |
| `src/services/EmailClassifierService.ts` | Classifies email type from patterns |
| `src/services/MeetAssetParserService.ts` | Meeting dedup (Capture Key), asset dedup, link extraction |
| `src/services/GoogleAccessService.ts` | Drive access check (canDownload \|\| canCopy) |
| `src/services/GoogleDocsExportService.ts` | Google Docs → plain text via Docs API |
| `src/services/ClaudeExtractionService.ts` | Claude extraction + Notion writes for all 19 entity types |
| `src/services/RetryService.ts` | Retry queue: 0→30min→2h→24h, then Manual Review |
| `src/services/AccessRequestService.ts` | Admin notification emails for denied assets |
| `src/services/ReviewRoutingService.ts` | Canon/sensitive review admin alerts |
| `src/services/NotionWriterService.ts` | All Notion API calls, property builders |
| `src/services/ProcessingEventService.ts` | Audit trail in Processing Events DB |
| `src/services/SmtpService.ts` | Outbound email via Gmail API (not SMTP) |
| `src/config/ConfigService.ts` | Zod config + all 23 Notion DB ID getters |
| `src/config/notionSchemas.ts` | Schema definitions for all 23 Notion databases |
| `src/utils/sanitize.ts` | `sanitizeDate()`, `sanitizeSelect()` shared utilities |

## Notion databases (23)

Env var prefix: `NOTION_DB_`

| Key | DB Name | Primary purpose |
|-----|---------|-----------------|
| `SOURCE_EMAILS` | Source Emails | Every ingested email, dedup by Message ID |
| `MEETINGS` | Meetings | One record per meeting, dedup by Capture Key |
| `MEETING_ASSETS` | Meeting Assets | Per-asset record, dedup by Meeting ID + Asset Type |
| `MESSAGES` | Messages | Operational emails with Claude-extracted summary |
| `PROFILES` | Profiles | People/orgs, upsert by name. Fields: Membership Type (Founding Member/Full Member/Associate Member/Guest/Steward/Partner) |
| `PROJECTS` | Projects | Named initiatives, upsert by name |
| `CIRCLES` | Circles | CCOS governance circles, upsert by name. Fields: Circle Lead, Rep Steward (relations to Profiles) |
| `ROLES` | Roles | CCOS role cards, upsert by Role Name |
| `ROLE_ASSIGNMENTS` | Role Assignments | Person→Role assignments. Fields: Energization Level (Energized/Willing/Unwilling) |
| `TASKS` | Tasks | Action items. Fields: Purpose Alignment (only when GPS active + canon_impact=true) |
| `DECISION_CANDIDATES` | Decision Candidates | Decisions. Fields: Implementation Status (default Not Started), Implemented Date, Purpose Alignment |
| `RISKS` | Risks | Flagged risks. Fields: Review Date (auto-calculated: High=+30d, Medium=+90d); Status options: Open / Acknowledged / Mitigated / Accepted / Closed; Collapse Pattern risks use `Collapse Pattern Type` select — seven patterns in canonical order: 1-No Shared Vision, 2-Poor Governance, 3-Financial Fragility, 4-Interpersonal Conflict, 5-Burnout, 6-Wrong People, 7-Scale Trap; Related Decisions and Related Tasks relation fields link contributing records |
| `MEMORY_REVIEW_QUEUE` | Memory Review Queue | Memory candidates for human review |
| `CANON_CHANGE_REQUESTS` | Canon Change Requests | Proposed CCOS canon changes (always Pending Review) |
| `CCOS_LEDGER_ENTRIES` | CCOS Ledger Entries | Governance actions (Draft only) |
| `PROCESSING_EVENTS` | Processing Events | Audit log for every poll/extraction |
| `SENSITIVE_REVIEW` | Sensitive Review | **Admin-only** — sensitive flags, must live outside main teamspace |
| `TENSIONS` | Tensions | Named governance/operational gaps, gated (optional) |
| `COMMITMENTS` | Commitments | Ongoing inter-party agreements, gated (optional) |
| `GRATITUDES` | Gratitudes | Appreciations between community members, gated (optional) |
| `EVENTS` | Events | Community gatherings (not governance meetings), gated (optional) |
| `RETROSPECTIVES` | Retrospectives | Structured end-of-cycle reviews, gated (optional) |
| `RESOURCES` | Resources | Shared commons and stewardship records, gated (optional) |

## Critical design decisions

**Deferred IMAP seen-flagging**: `fetchUnseenMessages()` returns UIDs without marking them seen. `markMessagesSeen(uids)` is called only AFTER all messages are processed. Notion dedup on Message ID prevents double-processing if the worker crashes.

**Meeting dedup — Capture Key strategy** (priority order):
1. `cal:{calendarEventId}` — most stable (Google Calendar URL `eid=` param)
2. `meet:{meetCode}:{meetingDate}` — date extracted from email body, not received date
3. `title:{normalizedSubject}:{organizerDomain}:{date}` — fallback
4. `drive:{fileId}` — last resort
5. `msg:{messageId}` — unique per email, no dedup

**Meeting Asset dedup**: compound Notion filter on `[Asset Type = X] AND [Meeting ID = pageId]`. Prevents creating duplicate Transcript records for the same meeting when the same email is retried.

**Organizer extraction**: `extractOrganizerFromBody()` parses "organized by", "invited you", "host:" patterns in email body before falling back to From header (which is always a Google noreply).

**HTML-only emails**: `effectiveBody = bodyText.trim() || bodyHtml.replace(/<[^>]+>/g, ' ')...` — prevents short-email skip for HTML-only emails.

**Access request routing**: Access requests go to `ADMIN_NOTIFICATION_EMAIL` (must differ from `ROOTS_EMAIL` — enforced at startup). The admin receives the extracted organizer email, not the Google noreply.

**Recording path**: No Claude extraction — only access check. Sets Meeting `Processing Status: 'Partial'`. Transcript/Notes path does full extraction and sets Meeting to `'Processed'`.

**Claude extraction**: Primary model → Haiku fallback → JSON repair attempt. Returns `{ data, tokens }`. Token count accumulated across all calls. `writeToNotion` is called with `sourceMeetingPageId` (links extraction to meeting) and `sourceEmailPageId` (currently accepted but unused in entity writes — future relation field).

**`sanitizeSelect(val, valid[], fallback)`**: Never pass `[]` as the valid array — it title-cases the value without matching, producing wrong casing. Always pass the full options array.

**Confidentiality levels**: `'Standard' | 'Sensitive' | 'Restricted'` (not 'Confidential') — must match Notion schema.

## Environment variables (key ones)

| Var | Purpose |
|-----|---------|
| `ROOTS_EMAIL` | `roots@amora.cr` — the mailbox and Google identity |
| `ADMIN_NOTIFICATION_EMAIL` | Human inbox for access requests + review alerts (≠ ROOTS_EMAIL) |
| `TENANT_ID` | Amora tenant identifier written to Processing Events |
| `CLAUDE_MODEL` | Primary model, e.g. `claude-sonnet-4-6` |
| `MAX_RETRY_COUNT` | Max retries before escalation (default: 4) |
| `GMAIL_POLL_INTERVAL_SECONDS` | Poll interval (default: 180) |

The first 17 `NOTION_DB_*` vars (everything except the community layer) are required at startup. The 6 community layer vars (`TENSIONS`, `COMMITMENTS`, `GRATITUDES`, `EVENTS`, `RETROSPECTIVES`, `RESOURCES`) are optional — Sera skips those entity types gracefully if their env vars are absent. See `src/config/ConfigService.ts` for full schema.

## Railway deployment

- Project: `34612e1f-133c-4ce7-b7d8-34f4e8c63d6d`
- Worker service: `6ae15b70-ab51-448a-a28a-7082be22cdc0` — polls every 3 minutes (Railway: Sera Worker)
- Dashboard service: `4bd316bd-1506-489b-88f7-e96aaa11c23b` — https://dashboard-production-1aae.up.railway.app (Railway: Sera Dashboard)
- Sera API service: `da7bf532-c97c-4fe6-bbd5-74ac1e0324ee` — https://sera-api-production-28d0.up.railway.app (Railway: Sera API)
- All env vars set via Railway (not `.env`). `SERVICE_TYPE` env var controls which service starts: `worker` | `dashboard` | `api`

## Sera API — "Hey Sera" routing

When the user's message begins with **"Sera"**, **"Hey Sera"**, or **"Ok Sera"**, call the Sera API directly and relay the response. Do not handle the question yourself.

Get the secret: `railway variables --service "Sera API" --json` → field `SERA_API_SECRET`

| Intent | Endpoint | Body |
|--------|----------|------|
| Q&A over institutional memory | `POST /ask` | `{"question": "..."}` |
| Raw keyword search | `POST /search` | `{"query": "..."}` |
| Extract text to Notion | `POST /extract` | `{"text": "...", "sourceTitle": "...", "sourceDate": "YYYY-MM-DD"}` |
| Re-extract with Notion link | `POST /reprocess` | `{"text": "...", "pageId": "...", "sourceDate": "YYYY-MM-DD"}` |

All routes require `Authorization: Bearer <SERA_API_SECRET>`. `/health` is unauthenticated.

## What NOT to do

- Do not add approval logic — the worker only creates Pending/Candidate/Draft records
- Do not commit `.env` or `client_secret.json`
- Do not use `sanitizeSelect` with an empty valid array
- Do not use `N.richText()` for long text fields (meeting Summary etc.) — use `N.richTextLong()`
- Do not mark IMAP messages seen before processing completes
- Gmail API is used for outbound email only (via `SmtpService`); IMAP (`ImapIngestionService`) is used for ingestion
