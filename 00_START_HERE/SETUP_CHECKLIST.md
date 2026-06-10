# Amora Living Memory Hub — Pre-Build Setup Checklist

Complete every step below before running any code. Steps marked **[HUMAN]** require you to act in a browser or terminal. Steps marked **[CODE]** are scripts you run after setup.

At the end you will have a completed `.env` file with all real credentials.

---

## Step 1 — Google Cloud Project [HUMAN]

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name: `amora-living-memory-hub` (or similar)
4. Organization: select your Amora Google Workspace org if available
5. Click **Create**
6. Wait for the project to be created, then confirm it is selected in the top bar

**Collect:** Copy the **Project ID** (e.g. `amora-living-memory-hub-123456`)

---

## Step 2 — Enable Google APIs [HUMAN]

In your new Google Cloud project, go to **APIs & Services → Library** and enable each of these:

| API | Search term |
|---|---|
| Gmail API | `gmail` |
| Google Drive API | `drive` |
| Google Docs API | `docs` |
| Google Calendar API | `calendar` |

For each: click the API → click **Enable**.

---

## Step 3 — Configure OAuth Consent Screen [HUMAN]

1. Go to **APIs & Services → OAuth consent screen**
2. Select **Internal** (Amora Google Workspace users only)
3. App name: `Amora Living Memory Hub`
4. User support email: `roots@amora.cr`
5. Developer contact email: your own email (e.g. `rbroider@gmail.com`)
6. Click **Save and Continue** through all steps (scopes, test users — defaults are fine for Internal)
7. Click **Back to Dashboard**

---

## Step 4 — Create OAuth 2.0 Credentials [HUMAN]

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Desktop app**
4. Name: `amora-worker-local`
5. Click **Create**
6. Click **Download JSON** → save as `client_secret.json` in the project root (this file is gitignored)

**Collect from the downloaded JSON:**
- `client_id` → save for `.env` as `GOOGLE_CLIENT_ID`
- `client_secret` → save for `.env` as `GOOGLE_CLIENT_SECRET`

---

## Step 5 — Complete OAuth Consent for roots@amora.cr [CODE]

After the project skeleton is built (Phase 1), run this one-time script to authorize `roots@amora.cr` and obtain a refresh token.

**You will run:**
```bash
npm run oauth-setup
```

This will:
1. Open a browser URL
2. Ask you to sign in as `roots@amora.cr`
3. Grant access to Gmail, Drive, Docs, and Calendar
4. Print a `GOOGLE_REFRESH_TOKEN` — copy it to `.env`

> Do not skip this step. The worker cannot poll Gmail without a valid refresh token for roots@amora.cr.

---

## Step 6 — Anthropic API Key [HUMAN]

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Go to **API Keys → Create Key**
4. Name: `amora-living-memory-hub`
5. Copy the key immediately (it is only shown once)

**Collect:** Save as `ANTHROPIC_API_KEY` in `.env`

---

## Step 7 — Railway Project [HUMAN]

1. Go to [https://railway.app](https://railway.app) and sign in
2. Click **New Project → Empty Project**
3. Name: `amora-living-memory-hub`
4. Note the project URL/ID for reference

Environment variables will be added in Phase 10 (deployment). For now just create the project.

---

## Step 8 — Notion Internal Integration [HUMAN]

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **+ New integration**
3. Name: `Amora Living Memory Hub`
4. Associated workspace: select the Amora workspace (where `roots@amora.cr` is a member)
5. Capabilities: check **Read content**, **Update content**, **Insert content**
6. Click **Submit**
7. Copy the **Internal Integration Token** (starts with `secret_...`)

**Collect:** Save as `NOTION_API_KEY` in `.env`

---

## Step 9 — Create a Notion Parent Page for Databases [HUMAN]

The Notion setup script (Phase 0B) needs a parent page to create databases under.

1. In Notion, create a new page called **Amora Living Memory Hub** (top-level in your workspace)
2. Open the page → click **Share** → click **+ Add connections** → select **Amora Living Memory Hub** (your integration)
3. Copy the page URL. The page ID is the 32-character string after the last `/` and before any `?`:
   - Example URL: `https://www.notion.so/Amora-Living-Memory-Hub-abc123def456...`
   - Page ID: `abc123def456...` (remove hyphens if present)

**Collect:** Save as `NOTION_PARENT_PAGE_ID` in `.env`

---

## Step 10 — Run Notion Database Setup Script [CODE]

After completing steps 1–9 and filling in `.env`, run:

```bash
npm run setup-notion
```

This will:
1. Create all 13 Notion databases under your parent page with the exact canon schema
2. Share each database with the integration automatically
3. Print all 13 database IDs
4. Save them to `.env.generated` — copy them into your `.env`

---

## Step 11 — Complete Your .env File

After all steps above, your `.env` should have all of these filled in:

```env
NODE_ENV=development
TENANT_ID=amora
ROOTS_EMAIL=roots@amora.cr

# Google OAuth (Steps 4-5)
GOOGLE_CLIENT_ID=<from client_secret.json>
GOOGLE_CLIENT_SECRET=<from client_secret.json>
GOOGLE_REFRESH_TOKEN=<from npm run oauth-setup>

# APIs (Steps 6, 8)
NOTION_API_KEY=secret_...
ANTHROPIC_API_KEY=sk-ant-...

# Notion Parent (Step 9)
NOTION_PARENT_PAGE_ID=<32-char page ID>

# Notion Database IDs (Step 10 - from .env.generated)
NOTION_DB_SOURCE_EMAILS=
NOTION_DB_MEETINGS=
NOTION_DB_MEETING_ASSETS=
NOTION_DB_MESSAGES=
NOTION_DB_PEOPLE=
NOTION_DB_ORGANIZATIONS=
NOTION_DB_TASKS=
NOTION_DB_DECISION_CANDIDATES=
NOTION_DB_RISKS=
NOTION_DB_MEMORY_REVIEW_QUEUE=
NOTION_DB_CANON_CHANGE_REQUESTS=
NOTION_DB_CCOS_LEDGER_ENTRIES=
NOTION_DB_PROCESSING_EVENTS=

# Polling
GMAIL_POLL_INTERVAL_SECONDS=180
MAX_RETRY_COUNT=4

# Admin
ADMIN_NOTIFICATION_EMAIL=roots@amora.cr
```

---

## Checklist Summary

| Step | Action | Done? |
|---|---|---|
| 1 | Google Cloud project created | ☐ |
| 2 | Gmail, Drive, Docs, Calendar APIs enabled | ☐ |
| 3 | OAuth consent screen configured (Internal) | ☐ |
| 4 | OAuth 2.0 Desktop app credentials created, JSON downloaded | ☐ |
| 5 | OAuth consent for roots@amora.cr completed, refresh token saved | ☐ (after Phase 1) |
| 6 | Anthropic API key created | ☐ |
| 7 | Railway project created | ☐ |
| 8 | Notion internal integration created, token saved | ☐ |
| 9 | Notion parent page created, integration connected, page ID copied | ☐ |
| 10 | Notion database setup script run, 13 DB IDs in .env | ☐ (after Phase 0B) |
| 11 | .env fully populated | ☐ |

---

> Steps 1–4, 6–9 can all be done before any code is written. Complete them now, then proceed to Phase 0B (Notion setup script) and Phase 1 (project skeleton).
