# Amora Living Memory Hub - Tech Stack & Cost Reference

**System:** Sera (Amora Living Memory Hub)  
**As of:** June 2026  
**Contact:** rick@amora.cr

---

## What This System Does

A background worker that ingests emails sent to `roots@amora.cr`, extracts structured institutional memory using Claude AI, and writes draft/candidate/pending records into 17 Notion databases for human review. Three Railway services run continuously: the worker (IMAP polling every 3 minutes), the dashboard (web UI), and the API (Sera Q&A + extraction endpoints).

---

## Services and Credentials Required

### 1. Railway (Hosting)
- **What:** Hosts all three services as containers
- **Services running:**
  - `Sera Worker` (`6ae15b70`) - background IMAP polling loop
  - `Sera Dashboard` (`4bd316bd`) - web dashboard at `dashboard-production-1aae.up.railway.app`
  - `Sera API` (`da7bf532`) - REST API at `sera-api-production-28d0.up.railway.app`
- **Project ID:** `34612e1f-133c-4ce7-b7d8-34f4e8c63d6d`
- **Plan:** Hobby ($5/month base)
- **Estimated cost:** $15-35/month (3 services, always-on worker)
- **URL:** railway.app
- **Auth:** Railway account linked to rick@amora.cr

### 2. Anthropic Claude API
- **What:** AI extraction engine - processes email content into structured records
- **Model:** `claude-sonnet-4-6` (primary), `claude-haiku-4-5` (fallback)
- **Env var:** `ANTHROPIC_API_KEY`
- **Estimated cost:** $10-40/month at low-to-moderate email volume (~50-200 emails/day)
  - Sonnet 4.6: $3/MTok input, $15/MTok output
  - Each email extraction: ~3-8k input tokens + ~1-2k output tokens
- **URL:** console.anthropic.com
- **Note:** A regular API key (`sk-ant-api03-...`) is sufficient. Admin keys are not needed.

### 3. Notion
- **What:** The data store - all 17 databases live here
- **Databases (17):** Source Emails, Meetings, Meeting Assets, Messages, Profiles, Projects, Circles, Roles, Role Assignments, Tasks, Decision Candidates, Risks, Memory Review Queue, Canon Change Requests, CCOS Ledger Entries, Processing Events, Sensitive Review
- **Env vars:** 17 x `NOTION_DB_*` vars + `NOTION_TOKEN` (integration token) + `NOTION_HUB_SETTINGS_PAGE_ID`
- **Auth:** Notion internal integration token (created at notion.so/my-integrations)
- **Plan:** Free tier works; Plus ($10/user/month annual) if team grows
- **Estimated cost:** $0 (free) to $10-20/month depending on team size

### 4. Google APIs (Drive, Docs, Gmail)
- **What:**
  - **Drive v3:** Access check before downloading meeting recordings/transcripts
  - **Docs v1:** Export Google Docs (meeting notes, transcripts) to plain text
  - **Gmail v1:** Send outbound emails (access request notifications, admin alerts)
- **Auth:** OAuth2 via `client_secret.json` + `token.json` (stored on Railway as env vars or volume)
- **Env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- **Account:** roots@amora.cr Google account
- **Plan:** Google Workspace or personal Google account
- **Estimated cost:** $0 (APIs are free within quota; Google Workspace if used: $6-18/user/month)

### 5. WPX Hosting (IMAP Email)
- **What:** Hosts the `roots@amora.cr` mailbox; worker polls via IMAP
- **Server:** `s25.wpx.net:993` (SSL)
- **Env vars:** `IMAP_USER`, `IMAP_PASSWORD`, `IMAP_HOST`
- **Estimated cost:** ~$20-50/month (WPX Business plan)
- **URL:** wpx.net

### 6. Domain
- **Domain:** `amora.cr`
- **Estimated cost:** ~$30-50/year
- **Registrar:** wherever amora.cr is registered

---

## Environment Variables (full list)

All set via Railway dashboard - never committed to code.

| Variable | Purpose |
|----------|---------|
| `SERVICE_TYPE` | `worker` / `dashboard` / `api` - controls which service starts |
| `ANTHROPIC_API_KEY` | Claude API key |
| `NOTION_TOKEN` | Notion integration token |
| `NOTION_HUB_SETTINGS_PAGE_ID` | Notion page ID for live Hub Settings |
| `NOTION_DB_SOURCE_EMAILS` | Notion DB ID |
| `NOTION_DB_MEETINGS` | Notion DB ID |
| `NOTION_DB_MEETING_ASSETS` | Notion DB ID |
| `NOTION_DB_MESSAGES` | Notion DB ID |
| `NOTION_DB_PROFILES` | Notion DB ID |
| `NOTION_DB_PROJECTS` | Notion DB ID |
| `NOTION_DB_CIRCLES` | Notion DB ID |
| `NOTION_DB_ROLES` | Notion DB ID |
| `NOTION_DB_ROLE_ASSIGNMENTS` | Notion DB ID |
| `NOTION_DB_TASKS` | Notion DB ID |
| `NOTION_DB_DECISION_CANDIDATES` | Notion DB ID |
| `NOTION_DB_RISKS` | Notion DB ID |
| `NOTION_DB_MEMORY_REVIEW_QUEUE` | Notion DB ID |
| `NOTION_DB_CANON_CHANGE_REQUESTS` | Notion DB ID |
| `NOTION_DB_CCOS_LEDGER_ENTRIES` | Notion DB ID |
| `NOTION_DB_PROCESSING_EVENTS` | Notion DB ID |
| `NOTION_DB_SENSITIVE_REVIEW` | Notion DB ID (admin-only teamspace) |
| `ROOTS_EMAIL` | `roots@amora.cr` |
| `ADMIN_NOTIFICATION_EMAIL` | Human inbox for alerts (must differ from ROOTS_EMAIL) |
| `IMAP_HOST` | `s25.wpx.net` |
| `IMAP_USER` | IMAP login username |
| `IMAP_PASSWORD` | IMAP password |
| `GOOGLE_CLIENT_ID` | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN` | OAuth2 refresh token |
| `VERA_API_SECRET` | Bearer token for Sera API auth |
| `RAILWAY_API_TOKEN` | For System Balances widget in dashboard |
| `TENANT_ID` | Amora tenant identifier |
| `CLAUDE_MODEL` | e.g. `claude-sonnet-4-6` |
| `AMORA_GOVERNING_PURPOSE` | One-sentence GPS (auto-scored on every decision) |
| `MAX_RETRY_COUNT` | Max retries before escalation (default: 4) |
| `GMAIL_POLL_INTERVAL_SECONDS` | Poll interval (default: 180) |

---

## NPM Dependencies

| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude API client |
| `@notionhq/client` | Notion API client |
| `googleapis` | Google Drive, Docs, Gmail APIs |
| `imapflow` | IMAP email ingestion |
| `mailparser` | Parse raw email (MIME, HTML, attachments) |
| `pino` + `pino-pretty` | Structured JSON logging |
| `zod` | Config schema validation at startup |
| `@modelcontextprotocol/sdk` | MCP tool protocol (Sera API tool loop) |
| `dotenv` | Local dev env loading |
| `nodemailer` / `@types/nodemailer` | Type support (Gmail sends go via Gmail API) |
| `ajv` | JSON schema validation |

**Runtime:** Node.js 20+, TypeScript 5.7

---

## Monthly Cost Summary

| Service | Estimated Monthly | Notes |
|---------|------------------|-------|
| Railway (3 services) | $15-35 | Hobby plan base $5 + usage |
| Anthropic Claude API | $10-40 | Scales with email volume |
| WPX Hosting | $20-50 | Email hosting for roots@amora.cr |
| Notion | $0-20 | Free tier viable; Plus if team grows |
| Google APIs | $0 | Free within quota |
| Domain (amora.cr) | ~$4 | ~$30-50/year amortized |
| **Total** | **~$50-150/month** | Low volume baseline ~$50 |

---

## Access Recovery Checklist

If access is lost to any credential:

1. **Railway** - re-auth at railway.app, update `RAILWAY_API_TOKEN` env var
2. **Anthropic** - generate new key at console.anthropic.com, update `ANTHROPIC_API_KEY` on all 3 Railway services
3. **Notion** - regenerate integration token at notion.so/my-integrations, update `NOTION_TOKEN`
4. **Google OAuth** - run `npx ts-node scripts/oauth-setup.ts` locally to get new refresh token, update `GOOGLE_REFRESH_TOKEN`
5. **WPX / IMAP** - reset password at wpx.net, update `IMAP_PASSWORD`
6. **Sera API** - generate new secret, update `VERA_API_SECRET` on all services and any API consumers

After any credential update on Railway, the affected service redeploys automatically.

---

## Key Architectural Constraints

- The worker **never publishes, approves, or applies canon changes** - only creates Pending/Draft/Candidate records
- IMAP messages are not marked seen until after all processing completes (crash-safe)
- Notion is the only database - no Postgres, no Redis
- `SENSITIVE_REVIEW` Notion DB must live in an admin-only teamspace, separate from main workspace
- `ADMIN_NOTIFICATION_EMAIL` must be different from `ROOTS_EMAIL` (enforced at startup)
