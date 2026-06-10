# Amora Living Memory Hub Dev Handoff Package

Version: 1.0  
Date: 2026-05-20  
Prepared for: Rick Broider / QuickLaunch Consulting  
Target build environment: Claude Code Plan Mode, Railway, Vercel optional, Google Workspace, Notion, Claude API

## Purpose

This package gives Claude Code the full canon needed to plan, validate, build, deploy, and manage the Amora Living Memory Hub.

The first deployment is for Amora using `roots@amora.cr`, which is already set up in Google Workspace and Notion.

## High-Level Goal

Build a reliable, cost-effective institutional memory pipeline that captures:

- Google Meet recording notifications
- Google Meet transcript notifications
- Gemini / Google Meet notes notifications
- CC’d, BCC’d, and forwarded operational emails
- Important team/stakeholder communication

Then converts them into structured Notion records:

- Source Emails
- Meetings
- Meeting Assets
- Messages
- People
- Organizations
- Tasks
- Decision Candidates
- Risks
- Memory Review Queue
- Canon Change Requests
- CCOS Ledger Entries
- Processing Events

The system must preserve canon integrity:

- Automation may create drafts and review items.
- Automation may not publish canon.
- Admin approval is required for canon, governance, role, policy, legal, financial, and sensitive updates.

## How Claude Code Should Use This Package

Start with:

`00_START_HERE/CLAUDE_CODE_PLAN_MODE_PROMPT.md`

Claude Code must:

1. Read all canon docs.
2. Perform a reality feasibility check against the current repo/environment.
3. Identify missing credentials, permissions, IDs, or decisions.
4. Ask Rick all required clarifying questions before implementation.
5. Propose a phased build plan.
6. Build in small, testable phases.
7. Preserve tokens by summarizing docs once into an implementation plan and referring back only when needed.
8. Never invent credentials, IDs, secrets, or unsupported capabilities.

## MVP Scope

MVP uses:

- One Google Workspace account: `roots@amora.cr`
- One Notion workspace/backend
- Railway worker for background processing
- Claude API for structured extraction
- Optional Vercel dashboard later
- Gmail polling first, not Gmail push notifications
- Google Drive/Docs API for access checks and text export
- Notion API for structured writes

## Non-Negotiables

- Do not require staff to schedule meetings from Roots.
- Staff should invite Roots to memory-worthy meetings.
- Forwarding a Google Meet email gives Roots a link, not guaranteed access.
- The worker must always check file access.
- If access fails, send access request and retry.
- Do not auto-transcribe recordings in MVP unless notes/transcript are missing and Rick explicitly approves.
- Do not auto-publish canon.
- Do not auto-update approved policies, role definitions, circle definitions, or legal/financial commitments.
- Log every processing run.

## Package Structure

- `00_START_HERE`: Claude Code prompt and first steps.
- `01_CANON`: Architecture, feasibility, workflow, security, and productization canons.
- `02_SCHEMAS`: Notion database specs and JSON schemas.
- `03_PROMPTS`: Claude extraction and review prompts.
- `04_BUILD_PLAN`: Phased implementation and acceptance criteria.
- `05_OPERATIONS`: User/admin manuals and SOPs.
- `06_CONFIG_EXAMPLES`: Tenant config, schema map, and environment examples.
- `07_TESTS`: Test matrix and edge cases.
- `08_PRODUCTIZATION`: Redeployable product architecture.
