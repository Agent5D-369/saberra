# Saberra Deployment Playbook

Operator guide for provisioning a new Saberra client instance.
Run `npx ts-node scripts/deploy.ts` to execute this interactively.

---

## Prerequisites

Before running the engine, have the following ready:

| Item | Who | Time |
|------|-----|------|
| Saberra `.env.saberra` with `ANTHROPIC_API_KEY` | Operator | Already done |
| Railway CLI installed (`npm install -g @railway/cli`) | Operator | 1 min |
| Client slug and name decided (e.g. slug `verdana`, name `Verdana Commons`) | Operator | - |
| Notion workspace for client exists (or will be created) | Client or Operator | 5 min |
| Email setup path decided (see Step 3 below) | Operator | - |

---

## Email Setup Paths (decide before Step 3)

This is the most variable part of a deployment. Pick the right path before running the wizard.

### Path (a): Saberra-managed Gmail/Google Workspace - MOST COMMON
- Saberra has a capture address for the client: e.g. `verdana@saberra.com`
- This alias routes to a Saberra-owned mailbox: `systems@saberra.com`
- **CRITICAL**: IMAP must authenticate as the MAILBOX OWNER (`systems@saberra.com`), not the alias
- OAuth2 handles IMAP authentication. No password needed. `IMAP_PASS` is never set.
- `rootsEmail` = alias (`verdana@saberra.com`), `imapUser` = mailbox owner (`systems@saberra.com`)
- This is how Verdana Commons was set up.

### Path (b): Client's own Gmail or Google Workspace
- Client has a Google account we are using as the capture inbox
- We need their OAuth credentials (or they complete the OAuth flow themselves)
- Same OAuth/no-password rules as path (a)
- `rootsEmail` = their email, `imapUser` = same or mailbox owner if alias

### Path (c): Non-Google IMAP provider
- Client is on Outlook/M365, Fastmail, or another provider
- Uses IMAP password (app-specific password, not account password)
- **Proton Mail is incompatible with cloud workers** - Proton Bridge requires a local daemon
  - Workaround: set up forwarding from Proton to a Gmail/Workspace address, use path (a)
- Provider shortcuts in the wizard: `ol` (Outlook), `fm` (Fastmail), `gm` (Gmail fallback)
- Google OAuth is still required in Step 4 for Drive/Docs/Gmail APIs

### Path (d): New Google Workspace account (add-on service)
- Client needs a whole new Google Workspace account
- Billed at ~$7/month per seat, add to client invoice
- Wizard pauses with instructions, then continues as OAuth path (same as a/b)
- Takes an extra 10-15 minutes for account setup

---

## Step 0: Init

Engine prompts for:
- **Slug**: kebab-case identifier (e.g. `verdana-commons`) - used in file names
- **Client name**: human-readable (e.g. `Verdana Commons`) - used in labels and manifest
- Resume detection: if a `.progress.json` file exists for this slug, offers to resume

---

## Step 1: Railway Project Setup

**Time: ~10 minutes**

### What to do

1. Log in to railway.app as the **client's Railway account** (not your personal account).
   Each client has their own Railway account. The token must come from the account that OWNS the project.

2. Create a new Railway project.
   Suggested name: `[ClientName] - Saberra Living Memory Hub`

3. Inside the project, create 3 empty services with **exact names** (case-sensitive):
   - `Sera Worker`
   - `Sera Dashboard`
   - `Sera API`
   (Empty services - no source connected yet; that is Step 8.)

4. Generate public domains for **Sera API** and **Sera Dashboard**:
   - Click service > Settings > Networking > Generate Domain
   - Copy both `https://xxx-production-xxxx.up.railway.app` URLs
   - If domain generation hangs: add `PORT=3001` (API) or `PORT=3000` (Dashboard) in Variables first

5. Create an **account-level** token (NOT a project token):
   - Go to `railway.app/account/tokens` (while logged in as the CLIENT account)
   - New Token > copy immediately
   - **Project tokens** (Project Settings > Tokens) are deployment-only and WILL NOT work for `variable set`

6. Get the Project ID from the URL: `railway.app/project/PROJECT_ID_IS_HERE`

### Known gotchas
- Account isolation: each client Railway project lives under their own account, not Saberra's
- `railway add --service "Sera Worker"` needed if a service exists at project level but not in production environment
- `--environment production` required with `--project` for CLI commands

---

## Step 2: Notion Workspace Setup

**Time: ~10 minutes**

### What to do

1. Go to `notion.so/my-integrations` and create a new **Internal** integration.
   - No user information capabilities needed
   - Copy the **Internal Integration Secret** (starts with `secret_`)

2. In the client's Notion workspace, create a blank page.
   - Suggested name: `[ClientName] Living Memory Hub`
   - This is the hub page - all 18-24 databases go inside it

3. Connect the integration to this page:
   - Open the page > `...` (top right) > **Connections** > Add a connection > select your integration
   - **Most common failure**: valid API key but page returns 404 because integration is not connected

4. Get the page ID:
   - Can paste the full URL - the wizard auto-extracts the 32-char ID
   - `notion.so/workspace/Page-Title-32HEXCHARSHERE`

### Known gotchas
- Connecting the integration to the page is the single most common setup failure
- Notion page IDs can be pasted as full URLs; the wizard strips dashes and extracts the hex ID

---

## Step 3: Capture Inbox Setup

**Time: 5-20 minutes depending on path**

The wizard presents a 4-path decision tree. See "Email Setup Paths" section above for which to choose.

- Paths (a)/(b)/(d): OAuth flow - no IMAP password. Alias vs mailbox-owner gotcha explained inline.
- Path (c): IMAP password validation runs live. Provider shortcuts: `ol`, `fm`, `gm`.

---

## Step 4: Google OAuth Setup

**Time: ~20 minutes first time, ~5 minutes if credentials already exist**

Google OAuth is required for all paths - even non-Google IMAP - because Sera uses:
- Google Drive API: access check on meeting recordings and transcripts
- Google Docs API: export transcript/notes text for Claude extraction
- Gmail API: send outbound admin notifications and access request emails

### Create the OAuth client

1. Go to `console.cloud.google.com` and log in **as the capture inbox account** (or the Google account that owns the meeting data for path c).

2. Create or select a project. Name it `Saberra` or `Saberra - [ClientName]`.

3. Configure OAuth consent screen:
   - APIs & Services > OAuth consent screen
   - Google Workspace: User Type = **Internal** (simpler, no Google review)
   - Personal Gmail: User Type = External (add capture inbox as test user)
   - App name: `Saberra`

4. Create a credential:
   - APIs & Services > Credentials > + Create Credentials > **OAuth 2.0 Client IDs**
   - Application type: **Desktop app** - Name: `Saberra`
   - Copy the Client ID and Client Secret

5. Enable 5 APIs (APIs & Services > Library):
   - Google Drive API
   - Google Docs API
   - Gmail API
   - Google Sheets API
   - Google Slides API

### The OAuth flow
The engine launches `google-auth.ts` as a subprocess. It prints an authorization URL, tries to auto-capture the callback on port 3456, and extracts `GOOGLE_REFRESH_TOKEN` from the output.

**When the browser opens: log in as the capture inbox account, not your personal account.**

### Known gotchas
- **Wrong account in browser**: #1 failure. The token authorizes the logged-in user at consent time.
- **No refresh token returned**: previous auth session exists. Go to `myaccount.google.com/permissions`, find and revoke "Saberra", then retry.
- **Scopes not enabled**: token is obtained but worker fails at runtime. Enable all 5 APIs.
- **External consent screen**: personal Gmail requires "Testing" mode with capture inbox as test user.

---

## Step 5: Admin & Governance Config

**Time: ~5 minutes**

| Field | Description | Example |
|-------|-------------|---------|
| `tenantId` | Short uppercase code for audit logs | `VERDANA` |
| `adminEmail` | Human inbox for alerts (must differ from rootsEmail) | `rick@amora.cr` |
| `governingPurpose` | Teal GPS statement - enables AI purpose-alignment scoring | Optional |
| `communityLayer` | Creates Tensions, Events, Gratitudes, etc. (6 extra DBs) | Default: yes |
| `claudeModel` | Primary extraction model | `claude-sonnet-4-6` |

**Admin email rule**: `adminEmail` must not equal `rootsEmail`. If they match, every admin notification gets re-ingested, creating an infinite loop. The wizard enforces this.

---

## Step 6: Create Notion Databases

**Time: 1-3 minutes (automated)**

Runs `create-saberra-template.ts` as a subprocess. Creates:
- 18 core databases (always): Tasks, Decisions, Risks, Memory Review Queue, Profiles, Projects, Circles, Roles, Role Assignments, Canon Change Requests, CCOS Ledger, Knowledge Base, Messages, Source Emails, Meetings, Meeting Assets, Processing Events, Sensitive Review
- 6 community layer databases (if enabled): Tensions, Commitments, Gratitudes, Events, Retrospectives, Resources
- A "Getting Started with Saberra" guide page listing all post-setup steps

### Known gotchas
- Subprocess timeout is 5 minutes. If it exceeds this, re-run from Step 6 (resume supported).
- If the parent page already has databases from a previous run, new databases are created alongside them (no dedup at this level). Use a fresh parent page or delete old databases first.

---

## Step 7: Set Railway Environment Variables

**Time: 1-2 minutes (automated)**

Sets ~35 env vars on each of the 3 Railway services via the Railway CLI. Each service gets the full set plus service-specific vars (`SERVICE_TYPE`, `NIXPACKS_START_CMD`, `PORT`).

### Known gotchas
- Railway CLI must be installed (`railway --version` to confirm)
- Values with special characters in the governing purpose will have double-quotes stripped

---

## Step 8: Connect GitHub Repository

**Time: ~5 minutes manual**

For each of the 3 services, connect the GitHub repo:
1. Click the service in the Railway project
2. Settings > Source > Connect Repo
3. Select the Saberra GitHub repo (e.g. `Agent5D-369/saberra`) and branch `backend`
4. Click Deploy to trigger the first build

All 3 services use the same repo. `SERVICE_TYPE` env var controls which service starts.

### Expected build output
- Nixpacks detects Node.js, runs `npm ci` then `npm run build`
- Build time: 2-4 minutes first time
- After build, worker starts polling IMAP every 180 seconds

### Known gotchas
- If build succeeds but service exits: check Railway logs for missing env var (Zod prints which one failed)
- `NIXPACKS_START_CMD` not recognized: verify it appears in the service's Variables tab

---

## Step 9: Post-Deploy Health Check

**Time: 0-5 minutes (automated polling)**

The engine polls `[seraApiUrl]/health` up to 30 times with 10-second intervals (5 minutes total).

- On success: prints "Worker is live. Deployment verified."
- On timeout: prints manual verification instructions. This is not necessarily a failure - slow first builds are expected. The deployment is still valid; the service may just not be done building yet.

**Manual verification if health check times out:**
1. Check Railway build logs for all 3 services
2. Open `[seraApiUrl]/health` in a browser - it should return `{"status":"ok"}`
3. Check Sera Worker logs for IMAP poll messages ("Poll cycle complete")

---

## Step 10: Finalize

Engine produces:
- `clients/[slug].manifest.json` - full record (DB IDs, URLs, secrets, client name, email path)
- `clients/[slug].deployment.log` - timestamped step log

Final summary shows:
- VERIFIED items (Railway, Notion, OAuth, DB creation, env vars - confirmed during run)
- MANUAL PENDING items in priority order

---

## Manual Steps Always Required

These cannot be automated.

**1. Notion cross-database relations (~30-45 minutes)**
Notion's API does not support creating relation properties programmatically.
The "Getting Started" page created in Step 6 lists all 23 relations.
An implementor must add these from the Notion UI. Can be done in a session with the client.

**2. Google Meet forwarding (client action)**
The client must configure Google Meet/Calendar to send meeting notifications to the capture inbox.
Standard path: Google Calendar event > Edit > Add guests > `[rootsEmail]`
Or via Google Workspace Admin: Admin Console > Apps > Google Workspace > Calendar > Meeting recordings > notify `[rootsEmail]`

**3. Email forwarding verification**
- For OAuth paths (a/b/d): Send a test email to `rootsEmail` and verify it appears in the Gmail inbox
- For IMAP password path (c): Send a test email and verify the worker processes it within 3 minutes

**4. Sensitive Review security**
The Sensitive Review database should be in an admin-only workspace, not accessible to all workspace members. If `sensitiveReviewParentPageId` was not set in Step 2, move it and update `NOTION_DB_SENSITIVE_REVIEW` on all 3 Railway services.

**5. Client handoff**
Share the Sera Dashboard URL and walk the client through:
- Their first look at the 18-24 Notion databases
- How to add connections to existing Notion pages
- The "Getting Started" guide page

---

## Verification Checklist

- [ ] `clients/[slug].manifest.json` exists and has all 18-24 DB IDs
- [ ] Railway > Sera Worker > Variables: `ROOTS_EMAIL`, `ANTHROPIC_API_KEY`, `TENANT_ID` are set
- [ ] Railway > Sera Worker > Logs: First poll log within 3 minutes of service start
- [ ] Railway > Sera API > `[seraApiUrl]/health` returns `{"status":"ok"}`
- [ ] Railway > Sera Dashboard > `[seraDashboardUrl]` loads without errors
- [ ] Notion: All 18-24 databases visible under the hub page
- [ ] Notion: "Getting Started" guide page is present

---

## Troubleshooting

### Worker exits immediately
Zod config validation at startup prints exactly which env var failed. Check Railway > Sera Worker > Logs for the Zod error. Most common: `NOTION_DB_*` var missing or wrong DB ID.

### "SABERRA_DB_IDS not found" in Step 6
The `create-saberra-template.ts` subprocess failed before writing its output. Check the error. Usually: Notion API key invalid, parent page not shared with integration, or Notion rate limit (wait 30s and retry).

### Railway CLI "Unauthorized"
The Railway token (Step 1) must come from the account that owns the Railway project. Using a Saberra operator token for a client-owned project returns 401.

### OAuth flow "no refresh token returned"
Previous authorization session exists. Go to `myaccount.google.com/permissions`, find "Saberra" (or the app name used), revoke it, and retry Step 4.

### Dashboard shows "Notion Unavailable"
1. Check Processing Events DB exists and the `NOTION_DB_PROCESSING_EVENTS` var is set
2. Check `Event Type` select options match the worker's values (all title-case)
3. Check if any filter uses a relation property that is actually a text field in the DB (schema migration needed)

### IMAP authentication failed (path c)
- Using account password instead of app password is the #1 cause
- Gmail: app passwords require 2FA enabled
- Outlook/M365: Modern Authentication may need to be enabled by IT admin
- Fastmail: IMAP must be enabled in Settings > Passwords & Security

---

## Lessons Learned (updated during deployments)

### Verdana Commons (first deployment - 2026-06-09/10)

**Email architecture:**
- `capture@saberra.com` is a Google Workspace alias routing to `systems@saberra.com` (only paid seat)
- IMAP must authenticate as `systems@saberra.com`, not the alias - wizard now prominently warns this
- Google deprecated password-based IMAP for Workspace accounts March 2025. OAuth required.
  Use the same Google OAuth credentials (client ID/secret/refresh token) for both IMAP and Drive/Docs/Gmail.
  Worker detects Gmail host and skips IMAP password - `IMAP_PASS` env var never set.

**Railway account isolation:**
- Verdana Railway project lives on agent5d-369 GitHub account, NOT the Saberra operator account
- The Railway token MUST come from the account that OWNS the project
- Project tokens (UUIDs from Project Settings > Tokens) are deployment-only - cannot run `variable set`. Use account tokens from `railway.app/account/tokens`.

**Railway service environment bug:**
- After project setup, `railway service list --environment production` only showed 2 of 3 services
- Fix: `railway add --service "Sera Worker"` (uses RAILWAY_TOKEN context, no `--project` flag)

**Railway CLI flags:**
- `--environment production` required with `--project` flag for variable set/list
- `railway domain --port 3000/3001` if domain generation hangs on empty services

**Notion template vs worker schema:**
- `create-saberra-template.ts` was built as a simplified human-readable demo template
- Several field names differed from what the worker code reads and writes
- Fixed in migration scripts (`migrate-verdana-automation-schemas.ts`, `migrate-processing-events-schema.ts`)
- Template now uses correct field names matching the worker schema

**Dashboard resilience:**
- `countQuery()` now catches `validation_error` from Notion (type mismatch on filter properties) and returns 0
- This protects the dashboard from crashing when DB schema is partially set up
- Full schema alignment required for all relation filter counts to be accurate

**End state after automated steps (Steps 1-9 automated, Step 8 manual):**
- All 24 Notion databases provisioned
- 43-46 Railway env vars set on each of the 3 services
- `clients/verdana.manifest.json` written
- Manual remaining: Notion cross-DB relations (23 relations), Google Meet forwarding, Sensitive Review move
