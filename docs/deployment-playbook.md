# Saberra Deployment Playbook

Operator guide for provisioning a new Saberra client instance.
Run `npx ts-node scripts/deploy.ts` to execute this interactively.

---

## Prerequisites

Before running the engine, have the following ready or complete them during the guided steps:

| Item | Who | Time |
|------|-----|------|
| Saberra `.env.saberra` with `ANTHROPIC_API_KEY` | Operator | Already done |
| Railway CLI installed (`npm install -g @railway/cli`) | Operator | 1 min |
| Client slug decided (kebab-case, e.g. `verdana`) | Operator | - |
| Notion workspace for client exists | Client or Operator | 5 min |
| Capture inbox email account exists (e.g. `verdana@saberra.com`) | Operator | 10 min |

---

## Step 1: Railway Project Setup

**Time: ~10 minutes**

### What to do

1. Log in to railway.app and create a new project.
   - Suggested name: `[ClientName] - Saberra Living Memory Hub`
   - Example: `Verdana Commons - Saberra Living Memory Hub`

2. Inside the project, create 3 empty services with **exact names** (case-sensitive):
   - `Sera Worker`
   - `Sera Dashboard`
   - `Sera API`
   - These are empty services with no source connected yet. Source is added in Step 8.

3. Generate public domains for **Sera API** and **Sera Dashboard**:
   - Click service > Settings > Networking > Generate Domain
   - Copy the `https://xxx-production-xxxx.up.railway.app` URLs
   - You do NOT need a domain for Sera Worker (it has no HTTP interface)

4. Create a project-scoped Railway token:
   - Project Settings > Tokens > New Token
   - Scope: Project (not Team)
   - Copy the token value immediately (shown once)

5. Get the Project ID from the URL: `railway.app/project/PROJECT_ID`

### What the engine collects
- `railwayProjectId` - UUID from the project URL
- `railwayToken` - project-scoped token
- `seraApiUrl` - Sera API domain (https://...)
- `seraDashboardUrl` - Sera Dashboard domain (https://...)

### Validation
The engine runs `railway variable list` to confirm the token is valid and the
Sera Worker service exists. If this fails, double-check that:
- The token is project-scoped (not personal or team)
- The service is named exactly `Sera Worker` (capital S, capital W)

### Known gotchas
- **Token type matters**: Railway has two token types. "Project tokens" (Project Settings > Tokens)
  are deployment-only and cannot run CLI commands like `variable set` or `domain generate`.
  The provisioner needs an **account token** from `railway.app/account/tokens`.
  Use an account token as `railwayToken` in the client input JSON.
- **Account isolation**: Each client's Railway project lives under its own Railway account.
  The account token must come from the account that OWNS the project - not the Saberra
  operator's personal account. Log into the client Railway account to generate the token.
  For Verdana: log in as the agent5d-369 GitHub account at railway.app.
- **Domain generation on empty services**: Railway may show "Public domain will be generated"
  indefinitely on services with no deployment and no PORT variable. Fix: add `PORT=3001` (API)
  or `PORT=3000` (Dashboard) via the Variables tab first, then generate the domain.
- The domain generation can take 30-60 seconds to propagate after clicking "Generate Domain"

---

## Step 2: Notion Workspace Setup

**Time: ~10 minutes**

### What to do

1. Create a Notion internal integration at `notion.so/my-integrations`:
   - Type: Internal
   - No user information capabilities needed
   - Copy the **Internal Integration Secret** (starts with `secret_`)

2. In the client's Notion workspace, create a blank page:
   - This becomes the hub page - all 18-24 databases will be created inside it
   - Suggested name: `[ClientName] Living Memory Hub` (e.g., `Verdana Commons Living Memory Hub`)

3. Connect the integration to this page:
   - Open the page > `...` (top right) > **Connections** > Add a connection > select the integration
   - **This step is the most commonly missed.** Without it, the API key is valid but
     the page will return 404.

4. Get the page ID from the URL:
   - `notion.so/workspace/Page-Name-32HEXCHARSHERE`
   - The ID is the last 32 hex characters (you can omit dashes; the engine strips them)

### What the engine collects
- `notionApiKey` - integration secret (`secret_xxx`)
- `notionParentPageId` - 32-char page ID
- `sensitiveReviewParentPageId` - optional, for security-conscious clients who want
  the Sensitive Review DB in a separate admin-only workspace

### Validation
The engine calls `notion.pages.retrieve()` to confirm the key and page ID are both valid.

### Known gotchas
- The most common failure is a valid API key but a page the integration can't access.
  Fix: open the page, `...` > Connections > Add the integration.
- Notion page IDs can be copied with dashes (from some URLs). The engine strips them.
- If using a separate workspace for Sensitive Review, create a blank page there too,
  connect the integration, and provide that page ID at the optional prompt.

---

## Step 3: Capture Inbox Setup

**Time: ~15 minutes for setup + validation**

### Email model

Saberra provisions and owns the capture inbox (e.g., `verdana@saberra.com`). The client
configures Google Meet to send notifications to this address. This approach ensures:
- Consistent IMAP setup regardless of client email provider
- The worker never touches client-controlled email systems
- Easy migration if client switches email providers

### Proton Mail: important limitation

**Proton Mail is incompatible with cloud IMAP workers.** Proton Mail's IMAP access
requires the Bridge desktop app, which must run on the same machine as the IMAP client.
Cloud workers (Railway, Render, Heroku) cannot run Bridge.

**Workaround for Proton Mail clients:** Set up forwarding from the client's Proton address
to a Saberra-controlled Gmail/Google Workspace inbox. The worker reads from the Gmail inbox.

### Setting up Gmail/Google Workspace IMAP

1. Log in to the capture inbox account (e.g., `verdana@saberra.com`)
2. Enable 2-Factor Authentication (required for app passwords)
3. Go to `myaccount.google.com/apppasswords`
   - App: Mail
   - Device: Other (name it "Saberra Worker")
   - Copy the 16-character app password
4. Enable IMAP in Gmail settings:
   - Gmail > Settings > See all settings > Forwarding and POP/IMAP
   - Enable IMAP > Save Changes

### IMAP settings
| Field | Value |
|-------|-------|
| Host | `imap.gmail.com` |
| Port | `993` |
| Security | SSL/TLS |
| Username | The full Gmail address |
| Password | App-specific password (NOT account password) |

### Known gotchas
- Using the account password instead of an app password is the most common failure.
  Gmail rejects account passwords for IMAP even when "Less secure app access" was
  previously enabled (Google deprecated that in 2024).
- App passwords require 2FA. If 2FA is not enabled, the app passwords page won't appear.
- For Google Workspace accounts: same flow, but you must be logged into the Workspace
  account, not a personal Google account, when generating the app password.

---

## Step 4: Google OAuth Setup

**Time: ~20 minutes first time, ~5 minutes if OAuth client already exists**

### What this is for

The worker uses Google OAuth to:
- Check Google Drive access (can the worker read Meeting recordings/transcripts?)
- Export Google Docs content (Gemini meeting notes, transcripts in Docs format)
- Send emails via Gmail API (admin notifications, access request emails)

The refresh token never expires unless revoked, so this is a one-time setup.

### Create the OAuth client

1. Go to `console.cloud.google.com` and log in **as the capture inbox account**
   (e.g., `verdana@saberra.com`). This ensures the token authorizes access to
   files shared with that account.

2. Create or select a project. Name it `Saberra` or `Saberra - [ClientName]`.

3. Configure the OAuth consent screen:
   - APIs & Services > OAuth consent screen
   - If Google Workspace: User Type = **Internal** (simpler, no Google review needed)
   - If personal Gmail: User Type = External (add capture inbox as test user)
   - App name: `Saberra`
   - Add scopes (do this in the OAuth flow, not required here)

4. Create a credential:
   - APIs & Services > Credentials > + Create Credentials > **OAuth 2.0 Client IDs**
   - Application type: **Desktop app**
   - Name: `Saberra`
   - Copy the Client ID and Client Secret

5. Enable the required APIs:
   - APIs & Services > Library
   - Enable: **Google Drive API**, **Google Docs API**, **Gmail API**,
     **Google Sheets API**, **Google Slides API**

### The OAuth flow

The engine runs `google-auth.ts` as a subprocess. It will:
1. Print an authorization URL
2. Try to start a local server on port 3456 to auto-capture the callback
3. If port 3456 is unavailable, fall back to prompting you to paste the code from the URL bar

When the browser opens, log in as the capture inbox account (not your personal account).

### Known gotchas
- **Wrong account**: The most common mistake is logging into the wrong Google account
  in the browser during the OAuth flow. The token authorizes the *logged-in user*, not
  the app. Make sure you're logged in as the capture inbox account.
- **No refresh token returned**: Happens if you already authorized this app before.
  Fix: go to `myaccount.google.com/permissions`, find and remove "Saberra", then retry.
- **Scopes not enabled**: If Drive/Docs/Gmail APIs aren't enabled, the token will be
  obtained but fail when the worker tries to use it. Enable all 5 APIs in Cloud Console.
- **External consent screen**: If the capture inbox is a personal Gmail (not Workspace),
  the consent screen needs to be in "Testing" mode and the capture inbox added as a test user.

---

## Step 5: Admin & Governance Config

**Time: ~5 minutes**

### Fields

| Field | Description | Example |
|-------|-------------|---------|
| `tenantId` | Short uppercase code for audit logs | `VERDANA` |
| `adminEmail` | Human inbox for access request alerts | `rick@amora.cr` |
| `governingPurpose` | Teal GPS statement (optional) | Enables purpose-alignment scoring |
| `communityLayer` | Create Tensions, Events, Gratitudes, etc. | Default: yes |
| `claudeModel` | Primary extraction model | `claude-sonnet-4-6` |

### Admin email rule
`adminEmail` **must not** equal `rootsEmail`. If they are the same, every outbound
admin notification email gets re-ingested by the worker, creating an infinite loop.

### Governing purpose
Optional but recommended. When set, Sera scores every Decision Candidate and Task for
alignment with the purpose. The GPS statement is stored in the `AMORA_GOVERNING_PURPOSE`
env var. Use the full statement (multiple sentences OK).

### Community layer
Creates 6 additional databases: Tensions, Agreements, Gratitudes, Events, Retrospectives,
Resources. Adds ~2 minutes to Step 6. Recommended for communities with active member
engagement tracking needs. Can always be added later via a migration script.

---

## Step 6: Create Notion Databases

**Time: 1-3 minutes (automated)**

### What happens
The engine runs `create-saberra-template.ts` as a subprocess. This creates:
- 18 core databases (always): Tasks, Decisions, Risks, Memory Review Queue, Profiles,
  Projects, Circles, Roles, Role Assignments, Canon Change Requests, CCOS Ledger,
  Knowledge Base, Messages, Source Emails, Meetings, Meeting Assets, Processing Events,
  Sensitive Review
- 6 community layer databases (if enabled): Tensions, Agreements, Gratitudes, Events,
  Retrospectives, Resources
- A "Getting Started with Saberra" guide page listing all manual post-setup steps

### What you get back
A JSON map of all database IDs, used in Step 7 to set the `NOTION_DB_*` env vars.

### Known gotchas
- The subprocess timeout is 5 minutes. Slow Notion API responses can cause it to
  exceed this. If it times out, re-run from Step 6 (the engine supports resuming).
- If the parent page already has databases from a previous run, the template creates
  new databases alongside them. There is no dedup at this level. Either delete the old
  databases first or use a fresh parent page.

---

## Step 7: Set Railway Environment Variables

**Time: 1-2 minutes (automated)**

### What happens
Sets ~30-35 env vars on each of the 3 Railway services. Each service gets the full set
plus service-specific vars:

| Var | Worker | Dashboard | API |
|-----|--------|-----------|-----|
| `SERVICE_TYPE` | `worker` | `dashboard` | `api` |
| `NIXPACKS_START_CMD` | `node dist/worker.js` | `node dist/dashboard/server.js` | `node dist/api/server.js` |
| `PORT` | - | - | `3001` |
| `SERA_API_URL` | - | set | set |

### Known gotchas
- Railway CLI must be installed (`railway --version` to check).
- The `RAILWAY_TOKEN` in the CLI call is the **project-scoped token** from Step 1,
  not a personal token from `railway login`.
- Values with special characters (quotes, backslashes) in governing purpose statements
  will have their double-quotes stripped. This is intentional to avoid shell quoting issues.
  The engine uses single-line values; multi-line governing purpose is stored as-is.

---

## Step 8: Connect GitHub Repository

**Time: ~5 minutes manual**

### What to do

For each of the 3 services, connect the GitHub repo:
1. Click the service in the Railway project
2. Settings > Source > Connect Repo
3. Select the Saberra GitHub repo (e.g., `saberra-hq/amora-living-memory-hub`)
4. Branch: `main`
5. Click Deploy to trigger the first build

All 3 services use the same repo. Railway distinguishes them via `SERVICE_TYPE` env var
(set in Step 7), which controls which `dist/` file the start command runs.

### Expected build output
- Nixpacks detects Node.js, runs `npm ci` then `npm run build` (compiles TypeScript)
- Build time: 2-4 minutes (first build downloads all dependencies)
- After build, the service starts. Worker starts polling IMAP every 180 seconds.

### Known gotchas
- If the build succeeds but the service exits immediately, check Railway logs for the
  specific error. Common: missing env var (check `NOTION_DB_*` vars were all set).
- If `NIXPACKS_START_CMD` is not recognized, verify the Railway CLI set it in Step 7.
  It should appear in the service's Variables tab.

---

## Step 9: Finalize

### The engine produces
- `clients/[slug].manifest.json` - full record of the deployment (DB IDs, URLs, secrets)
- `clients/[slug].deployment.log` - timestamped log of every engine step

### Manual steps remaining (always required)

**1. Notion cross-database relations (required)**
Notion's API does not support creating relation properties programmatically.
The "Getting Started" page created in Step 6 lists all 23 relations.
An implementor must manually add these from the Notion UI.
Time: ~30-45 minutes the first time.

**2. Google Meet forwarding (client action)**
The client must configure their Google Meet/Calendar to send meeting notifications
to the capture inbox. Instructions vary by Meet version; the standard path is:
- Google Meet admin settings > Meeting recordings > Notify via email: [rootsEmail]

**3. Sensitive Review security**
The Sensitive Review database should be in an admin-only workspace, not accessible
to all Notion workspace members. Move it and update `NOTION_DB_SENSITIVE_REVIEW`
on all 3 Railway services if not already using a separate page (Step 2 optional field).

**4. Verify worker health**
Check Railway > Sera Worker > Logs. Within 180 seconds of the service starting,
you should see a log line containing `poll_start` or `IMAP poll`. If not, check:
- IMAP credentials (test with a mail client using the same host/user/pass)
- Notion DB IDs (spot-check one by opening the DB URL in Notion)
- Processing Events DB for error entries

---

## Verification Checklist

- [ ] `clients/[slug].manifest.json` exists and has all 18-24 DB IDs
- [ ] Railway > Sera Worker > Variables: `ROOTS_EMAIL`, `ANTHROPIC_API_KEY`, `TENANT_ID` are set
- [ ] Railway > Sera Worker > Logs: First poll log appears within 3 minutes of start
- [ ] Railway > Sera API > `[seraApiUrl]/health` returns `{"status":"ok"}`
- [ ] Railway > Sera Dashboard > `[seraDashboardUrl]` loads without errors
- [ ] Notion: All 18-24 databases visible under the hub page
- [ ] Notion: "Getting Started" guide page is present

---

## Troubleshooting

### Worker exits immediately
Check logs for the specific error. Most common causes:
- Missing or malformed env var: Zod config validation at startup prints which var failed
- IMAP connection refused: IMAP not enabled, or host/port wrong
- Notion 401: Notion API key rotated or integration disconnected

### "SABERRA_DB_IDS not found" in Step 6
The `create-saberra-template.ts` subprocess failed before writing its output line.
Check the error in the engine output. Usually: invalid Notion API key, parent page
not shared with the integration, or Notion rate limit hit (wait 30s and retry).

### Railway CLI `Unauthorized`
The railway token (from Step 1) is project-scoped to a specific project. If the
token and project ID don't match, Railway returns 401. Double-check both values.

### OAuth flow "no refresh token returned"
Previous authorization session exists. Go to `myaccount.google.com/permissions`,
find "Saberra" (or whatever app name was used), revoke it, and retry Step 4.

---

## Lessons Learned (updated during deployments)

*This section is populated as we learn from real deployments.*

### Verdana Commons (first deployment - 2026-06-09)

**Email architecture:**
- `capture@saberra.com` is a Google Workspace alias routing to `systems@saberra.com` (only paid seat)
- IMAP must authenticate as `systems@saberra.com`, not the alias
- Google deprecated password-based IMAP for Workspace accounts March 2025. OAuth is required.
  Use the same Google OAuth credentials (client ID/secret/refresh token) for both IMAP and API access.
  Worker detects Gmail host and skips IMAP password - no `IMAP_PASS` env var needed.

**Railway account isolation:**
- Verdana Railway project lives on agent5d-369 GitHub account, NOT the Saberra operator account
- The Railway token MUST come from the account that OWNS the project. Using the wrong account
  returns "Not Authorized" even for valid tokens.
- Project tokens (UUIDs from Project Settings > Tokens) are deployment-only - they cannot run
  `variable set`, `domain generate`, or other CLI management commands. Use account tokens
  from `railway.app/account/tokens`.

**Railway service list inconsistency:**
- After project setup, `railway service list --environment production` only showed Sera API and
  Sera Dashboard. Sera Worker existed at project level ("already exists" error on create attempt)
  but was not in any environment.
- Fix: `railway add --service "Sera Worker"` (with RAILWAY_TOKEN set for the correct account).
  The `railway add` command does not accept `--project` flag - it uses the token's project context.
  New Sera Worker service ID: `6fc0bb2a-8735-4ecb-9067-6825e18bd224`

**Railway CLI flags:**
- `--environment production` is required whenever `--project` is used (variable set, variable list,
  service list). Without it you get: `--environment is required when using --project`
- `railway domain` command worked without `--environment` even when project flag was present.
  Try `--port 3000` (Dashboard) or `--port 3001` (API) if domain doesn't generate after 15 min.
  Domains generated: `https://sera-api-production.up.railway.app` (API),
  `https://sera-dashboard-production.up.railway.app` (Dashboard)

**Deploy engine - unattended run:**
- Run `npx ts-node scripts/deploy.ts --input clients/verdana.input.json --yes` to auto-accept
  all pre-populated defaults without interactive prompting.
- `--yes` auto-skips all prompts with defaults; optional fields with no value are auto-skipped too.
- Step 8 (GitHub connect) is still printed with instructions but doesn't block in `--yes` mode.
- The Railway validation in Step 1 now requires `--environment production` in the variable list check.

**Notion template creation:**
- 24 databases created (18 core + 6 community layer) in ~2 minutes.
- `SENSITIVE_REVIEW_PARENT_PAGE_ID` not set - Sensitive Review created in main hub page.
  For production clients, set this to a page in an admin-only Notion workspace.

**End state after automated steps (Steps 1-7, 9):**
- All 24 Notion databases provisioned
- 43-46 Railway env vars set on each of the 3 services
- `clients/verdana.manifest.json` written (contains all DB IDs and Sera API secret)
- Manual remaining: Step 8 (GitHub connect), Notion cross-DB relations (23 relations), Sensitive Review move
