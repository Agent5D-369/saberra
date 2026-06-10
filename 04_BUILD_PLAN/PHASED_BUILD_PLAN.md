# Phased Build Plan

## Phase 0: Reality Feasibility Check

No code yet.

Tasks:

1. Read canon docs.
2. Inspect current repo or create new repo if approved.
3. Confirm stack.
4. Confirm credentials and API access.
5. Confirm Notion database approach.
6. Ask clarifying questions.
7. Create exact implementation plan.

Exit criteria:

- Rick approves plan.
- Missing credentials/IDs are identified.
- MVP implementation path is clear.

## Phase 1: Project Skeleton

Build:

- TypeScript or Python service skeleton.
- Environment variable loader.
- Logging.
- Config loader.
- Tenant config support.
- Basic CLI or worker entrypoint.
- Postgres connection if available.

Exit criteria:

- App starts locally.
- Config validates.
- Health check passes.

## Phase 2: Notion Connector

Build:

- Notion client.
- Database ID config.
- Schema map support.
- Create/update helpers.
- Processing Events write.
- Basic test write.

Exit criteria:

- Can create Processing Event.
- Can create Source Email test record.

## Phase 3: Gmail Connector

Build:

- Gmail OAuth support for Roots.
- Poll unread/unprocessed messages.
- Apply/read labels.
- Fetch email body.
- Deduplicate by Gmail message ID.
- Store Source Email records.

Exit criteria:

- Can poll Roots inbox.
- Can create Source Email record.
- Can label processed test email.

## Phase 4: Email Classifier and Parser

Build:

- Classify Google Meet Recording/Transcript/Notes/Operational Email/Unknown.
- Extract links.
- Extract Drive/Doc IDs.
- Generate Capture Key.
- Create Meeting / Meeting Asset / Message records.

Exit criteria:

- Test emails classify correctly.
- Duplicate assets do not create duplicates.
- Source records link to created records.

## Phase 5: Google Drive/Docs Access Checker

Build:

- Drive file metadata fetch.
- Docs text export.
- Access status logic.
- Retry queue.
- Access request email.

Exit criteria:

- Accessible Google Doc exports text.
- Denied file creates Needs Access.
- Access request email sends correctly.

## Phase 6: Claude Extraction

Build:

- Claude API client.
- Strict JSON schema validation.
- Repair retry if invalid JSON.
- Text chunking for large docs.
- Create extracted Notion records.

Exit criteria:

- Transcript/notes produce summary, tasks, decisions, risks, memory candidates.
- Invalid Claude output is handled safely.

## Phase 7: Full Meeting Pipeline

Build end-to-end:

- Recording email workflow.
- Transcript email workflow.
- Notes email workflow.
- Merge assets into same meeting via Capture Key.
- Process text when available.
- Store recording link without transcription unless needed.

Exit criteria:

- Real or fixture meeting asset emails process end-to-end.
- Multiple asset arrival order cases pass.

## Phase 8: Operational Email Pipeline

Build:

- CC/BCC/forwarded email handling.
- Message creation.
- Task/decision/risk extraction.
- People/org draft update generation.
- Sensitive flag routing.

Exit criteria:

- Forwarded email creates Message and draft extracted records.
- Sensitive item routes to review.

## Phase 9: Admin Review Support

Build:

- Notion dashboard documentation/setup.
- Review statuses.
- Canon Change Request routing.
- Memory Review Queue routing.
- Access failure view data.
- Processing Events.

Exit criteria:

- Admin can review all queues in Notion.
- Nothing updates canon automatically.

## Phase 10: Deployment

Build:

- Railway deployment configuration.
- Environment variable checklist.
- Worker scheduling/polling.
- Deployment docs.
- Smoke tests.

Exit criteria:

- Worker runs on Railway.
- Polls Roots.
- Writes Notion.
- Logs processing events.

## Phase 11: Claude Team Setup Guidance

Create guided instructions for Rick:

- How to set up Claude Team project.
- Which project names to create.
- Which docs to add.
- Which instructions to paste.
- Who gets edit/view access.
- How team should use the interface.

Exit criteria:

- Rick can set up Claude Team step by step.

## Phase 12: Optional Vercel Dashboard

Only if approved after MVP.

Build:

- Status dashboard.
- Retry button.
- Failed access queue.
- Pending review counts.
- System health.

Exit criteria:

- Dashboard is authenticated and read-only or controlled.
