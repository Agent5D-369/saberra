# Technical Setup Guide
## What the Marketing Team Needs to Know About Implementation

This document exists so the marketing team can speak accurately about setup, scope, and deliverables - without overpromising or underselling.

---

## What "Setup" Actually Means

Setting up Living Memory Hub for a new client involves configuring and connecting six systems. An experienced implementer takes 4-8 hours. A first-time implementer may take 8-16 hours.

### System 1: Google Cloud Project

The client needs a Google Cloud project with three APIs enabled:
- Google Drive API (to check access to meeting recordings)
- Google Docs API (to export transcript text)
- Gmail API (to send system notifications)

An OAuth 2.0 application is created within this project. The implementer runs an authorization flow to generate long-lived refresh tokens. These tokens allow the system to act on behalf of the dedicated email account.

**Client requirement**: Access to a Google Workspace account (not free Gmail). The dedicated inbox must be a real email address on a domain the client controls.

**Client involvement**: Minimal. The implementer handles the Google Cloud setup. The client provides admin access to their Google Workspace for about 15 minutes.

### System 2: Notion Workspace

The client must have a Notion Business plan or Enterprise plan (the API is not available on free or Personal plans).

17 databases must be created with exact schemas. This is handled by a setup script that creates all databases automatically given a Notion API key.

The implementer connects the Sera integration to each database, grants appropriate permissions, and copies the 17 database IDs into the configuration.

**Client requirement**: Notion Business plan ($15/member/month minimum). The client creates a dedicated Notion page or teamspace to house the Living Memory Hub databases.

**Client involvement**: Provides Notion API key and designates a Notion page as the "home" for the system. About 10 minutes.

### System 3: Anthropic Claude API

The client needs an Anthropic API account with billing configured. The system uses Claude Sonnet as the primary model with Claude Haiku as a fallback.

**Cost**: Approximately $0.01-0.05 per email processed depending on length. A 1-hour meeting transcript is typically 10,000-30,000 tokens, costing $0.05-0.25 per meeting.

**Client involvement**: Creates an Anthropic account, adds a credit card, generates an API key. About 10 minutes.

### System 4: WPX Email Hosting (or equivalent IMAP server)

The dedicated inbox (`roots@yourdomain.com` or similar) must be hosted on an IMAP-capable mail server. The current implementation uses WPX hosting (`s25.wpx.net:993`).

Any IMAP server works. Many clients already have email hosting that supports this.

**Client involvement**: Provides IMAP credentials for the dedicated inbox. If they don't have a suitable host, WPX hosting costs approximately $25-100/year depending on plan.

### System 5: Railway (Cloud Hosting)

Three services are deployed on Railway:
- Sera Worker (background processing)
- Sera Dashboard (admin web interface)
- Sera API (Q&A REST API)

Railway pricing: approximately $20-60/month for three services at normal usage levels.

The implementer creates the Railway project, deploys the three services, and configures approximately 30 environment variables (API keys, database IDs, email credentials).

**Client involvement**: Creates a Railway account, provides credit card. About 10 minutes. After setup, Railway sends a monthly bill directly to the client.

### System 6: DNS (for custom domain, optional)

If the client wants the dashboard and API accessible at a custom domain (e.g., `vera.theirclient.com`), DNS configuration is required. This is a 15-minute task.

---

## Total Client Recurring Costs (Monthly)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Railway (3 services) | $20 - $60 |
| Anthropic Claude API | $10 - $200 (volume-dependent) |
| Notion Business Plan | $15/member (existing or incremental) |
| Email hosting | $0 - $10 (usually existing) |
| **Total infrastructure** | **$50 - $270/month** |

These costs are in addition to the implementer's monthly subscription fee.

---

## What Can Go Wrong (and How It Is Handled)

**Drive access denied**: When a Google Meet recording or transcript is created, Google sometimes restricts access to the meeting organizer only. The system detects this, sends an automated email to the admin requesting access be granted, and retries automatically up to four times over 24 hours.

**AI extraction errors**: Claude occasionally returns malformed JSON or extracts items with incorrect field types. The system has automatic repair and retry logic. If repair fails, the item is routed to a "Manual Review" queue on the dashboard for human intervention.

**Email processing failures**: If an email fails to process (network error, API timeout, etc.), it is automatically retried at 30 minutes, 2 hours, and 24 hours. After four failures it enters a manual review queue.

**IMAP connection loss**: The worker detects IMAP disconnection and reconnects automatically. Emails are not marked as "seen" until after successful processing, so nothing is lost if the connection drops mid-process.

---

## What Clients Need to Provide (Checklist)

Before implementation can begin, the client provides:

- [ ] Google Workspace account access (admin for 15 minutes)
- [ ] A dedicated email address to use as the system inbox (e.g., `memory@theirclient.com`)
- [ ] Notion Business plan with API access enabled
- [ ] Railway account (can create during onboarding)
- [ ] Anthropic API account with billing configured
- [ ] IMAP credentials for the dedicated inbox
- [ ] Designation of one person as the "Memory Admin" (responsible for reviewing AI-extracted items)

---

## What the Implementer Delivers

At the conclusion of setup, the client receives:

1. A live Sera Dashboard at a Railway-provided URL (or custom domain)
2. A live Sera API endpoint
3. 17 Notion databases populated with the organization's first extracted records (from a test meeting or existing meeting data if available)
4. Documentation on how to use the dashboard, how to review and approve extracted items, and how to ask Sera questions
5. One-hour training session with the Memory Admin
6. 30-day check-in support

---

## Why Self-Service Is Not Yet Available

The primary barrier to mass-market self-service is the Google Cloud OAuth configuration. This requires:
- Creating a Google Cloud project
- Enabling three APIs
- Configuring an OAuth consent screen and getting it approved by Google (can take days to weeks for unverified apps)
- Running a one-time authorization flow that requires technical CLI access

This is solvable with significant engineering investment (building a hosted OAuth proxy, a database-driven configuration layer, an automated Notion workspace provisioner, and a proper onboarding UI). The founder is evaluating this investment path after validating market demand.

---

## Timeline from Signed Contract to Live System

| Phase | Duration |
|-------|---------|
| Client account setup (Google, Notion, Railway, Anthropic) | 1-2 days |
| Technical deployment and configuration | 4-8 hours |
| Testing with a real meeting transcript | 2-4 hours |
| Admin training session | 1 hour |
| **Total time to first live Sera response** | **3-5 business days** |

---

## Ongoing Maintenance Requirements

After launch, the system requires minimal maintenance:

- **Monthly**: Review Railway and Anthropic billing. Check for failed emails in the dashboard.
- **Quarterly**: Review and approve any items that have accumulated in the review queues.
- **As needed**: Re-grant access to new meeting recordings if the organizer changes. Update any changed API keys.

The Memory Admin spends approximately 30-60 minutes per week reviewing and approving AI-extracted items from meetings and emails.
