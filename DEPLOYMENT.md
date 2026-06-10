# Deployment Guide — Railway

## Prerequisites

Before deploying, all items in `00_START_HERE/SETUP_CHECKLIST.md` must be complete:
- `.env` fully populated with real values
- Notion databases created and IDs in `.env`
- OAuth consent completed for roots@amora.cr

## Step 1 — Build locally first

```bash
npm run build
```

Confirm the `dist/` folder is created with `worker.js`.

## Step 2 — Push to GitHub

Create a new GitHub repository and push this project:

```bash
git init
git add .
git commit -m "Initial commit — Amora Living Memory Hub"
git remote add origin https://github.com/YOUR_ORG/amora-living-memory-hub.git
git push -u origin main
```

## Step 3 — Connect Railway to GitHub

1. Go to railway.app → your project
2. Click **+ New Service → GitHub Repo**
3. Select your `amora-living-memory-hub` repo
4. Railway will auto-detect Node.js and use `railway.toml`

## Step 4 — Set Environment Variables in Railway

In the Railway service → **Variables**, add every variable from your `.env`:

```
NODE_ENV=production
TENANT_ID=amora
ROOTS_EMAIL=roots@amora.cr
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
NOTION_API_KEY=...
NOTION_PARENT_PAGE_ID=...
NOTION_DB_SOURCE_EMAILS=...
NOTION_DB_MEETINGS=...
NOTION_DB_MEETING_ASSETS=...
NOTION_DB_MESSAGES=...
NOTION_DB_PEOPLE=...
NOTION_DB_ORGANIZATIONS=...
NOTION_DB_TASKS=...
NOTION_DB_DECISION_CANDIDATES=...
NOTION_DB_RISKS=...
NOTION_DB_MEMORY_REVIEW_QUEUE=...
NOTION_DB_CANON_CHANGE_REQUESTS=...
NOTION_DB_CCOS_LEDGER_ENTRIES=...
NOTION_DB_PROCESSING_EVENTS=...
ANTHROPIC_API_KEY=...
CLAUDE_MODEL=claude-sonnet-4-6
GMAIL_POLL_INTERVAL_SECONDS=180
MAX_RETRY_COUNT=4
ADMIN_NOTIFICATION_EMAIL=roots@amora.cr
```

## Step 5 — Deploy

Railway will auto-deploy on push. To trigger manually: click **Deploy** in the Railway dashboard.

## Step 6 — Smoke Test

After deploy, check Railway logs for:

```
Amora Living Memory Hub worker starting
Config loaded
Health check passed — worker ready
Poll cycle — ...
```

Send a test email to `roots@amora.cr` and verify:
- A `Processing Events` record appears in Notion
- A `Source Emails` record appears in Notion
- The Gmail message gets labeled `AMORA_PROCESSED`

## Monitoring

- Railway: Check **Logs** tab for worker output
- Notion: Check `Processing Events` database for each poll run
- Gmail: Check labels applied to incoming messages

## Troubleshooting

| Symptom | Likely Cause |
|---|---|
| Config validation error on start | Missing env var — check Railway Variables |
| "Refresh token" error | OAuth consent not done or expired — re-run `npm run oauth-setup` |
| "Database not found" | Notion database ID wrong or integration not shared with database |
| "Rate limit" in logs | Notion API rate limit — already handled with retry |
| No emails found | roots@amora.cr inbox may be empty or all labeled already |
