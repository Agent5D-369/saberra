# Claude Code Plan Mode Prompt

You are Claude Code operating in PLAN MODE for the Amora Living Memory Hub build.

You must not begin coding immediately.

Your first job is to read the canon documents in this package, understand the system, perform a reality feasibility check against the current repo/environment, and ask Rick all required clarifying questions before building.

## Project Name

Amora Living Memory Hub

## Core Product

A reusable Living Memory Hub system that captures important Google Meet and email activity through `roots@amora.cr`, processes it through middleware, extracts structured intelligence using Claude API, writes records into Notion, and routes canon-impacting or sensitive items to admin review.

## Current Known Facts

- `roots@amora.cr` already exists in Google Workspace.
- `roots@amora.cr` already exists in Notion.
- Roots is intended to act as the MVP capture/admin/integration account.
- The build should avoid extra paid services unless truly necessary.
- Railway and Vercel are available.
- Railway is preferred for background workers.
- Vercel is optional for future dashboards.
- Normal staff should not schedule meetings from Roots.
- Staff should invite Roots to memory-worthy meetings.
- Staff may CC, BCC, or forward important operational emails to Roots.
- Automation must check access before processing linked Google Drive/Docs assets.
- Automation must not publish canon directly.

## Read These First

Read all files in this order:

1. `01_CANON/MASTER_ARCHITECTURE_CANON.md`
2. `01_CANON/REALITY_FEASIBILITY_CANON.md`
3. `01_CANON/GOOGLE_MEET_EMAIL_WORKFLOW_CANON.md`
4. `01_CANON/SECURITY_PERMISSIONS_CANON.md`
5. `01_CANON/ADMIN_REVIEW_CANON.md`
6. `02_SCHEMAS/NOTION_DATABASE_SCHEMA_CANON.md`
7. `02_SCHEMAS/EXTRACTION_JSON_SCHEMA.md`
8. `04_BUILD_PLAN/PHASED_BUILD_PLAN.md`
9. `07_TESTS/MVP_TEST_MATRIX.md`
10. `08_PRODUCTIZATION/PRODUCTIZATION_CANON.md`

## Required First Output

After reading the canons, produce a structured plan with these sections:

1. **Understanding of the System**
2. **Reality Feasibility Check**
3. **Assumptions Detected**
4. **Missing Credentials / IDs / Access**
5. **Clarifying Questions for Rick**
6. **MVP Build Phases**
7. **Recommended First Implementation Step**
8. **Risks / Caveats**
9. **Do Not Build Yet Until These Are Answered**

## Required Clarifying Questions

You must ask Rick for anything you need, including but not limited to:

- Existing repo location or whether to create a new repo.
- Preferred stack: Node/TypeScript or Python.
- Railway project availability.
- Vercel project availability if dashboard is desired.
- Google Cloud project status.
- OAuth credential status for `roots@amora.cr`.
- Whether Gmail API, Drive API, Docs API, and Calendar API are enabled.
- Notion integration token status.
- Notion database IDs or permission to generate Notion setup scripts.
- Anthropic/Claude API key availability.
- Whether Postgres is available on Railway.
- Whether the first MVP should use Gmail polling or push notifications.
- Whether all MVP database names/properties should be created exactly as canon.
- Which staff should receive access request emails or admin notifications.
- Whether emails should include raw body content in Notion or only summary + source link.
- Whether sensitive content should be written into a restricted database or flagged only.

## Build Rules

- Build in small phases.
- Prefer deterministic code over LLM autonomy for ingestion, access checks, retries, deduplication, and writes.
- Use Claude API only for extraction/summarization/classification after source text is retrieved.
- Use strict JSON schema validation on Claude output.
- Include retry logic.
- Include idempotency.
- Include processing logs.
- Include environment variable examples.
- Include setup scripts or clear setup instructions.
- Do not hardcode Amora-specific values where configuration is possible.
- Design as `Living Memory Core` with `Amora Living Memory Hub` as tenant configuration.
- Keep MCP optional and future-facing. Do not make MCP the MVP automation engine.

## Token Preservation Instructions

After reading the canon, create a concise implementation summary and refer to it during the build. Do not keep re-reading every long document unless needed. When implementing a phase, read only the relevant canon files.

## Non-Negotiable Safety Rules

- Never publish canon directly.
- Never modify approved policies, role definitions, circle definitions, governance canon, legal/financial commitments, or final CCOS ledgers automatically.
- Never assume forwarded Google Meet links are accessible.
- Never assume Google Meet recordings arrive at meeting end.
- Never require staff to log into Roots for daily workflow.
- Never store API keys in source code.
- Never invent Notion database IDs or Google OAuth secrets.
- Never create a public unauthenticated MCP server.
