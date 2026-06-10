# Copy/Paste Prompt for Claude Code Plan Mode

Use the following prompt in Claude Code Plan Mode after uploading or placing this package in the repo.

---

You are building the Amora Living Memory Hub.

Do not code yet.

First, read `README.md` and `00_START_HERE/CLAUDE_CODE_PLAN_MODE_PROMPT.md`.

Then read the canon files in the order specified there.

Your first deliverable is a reality feasibility check, missing-access checklist, clarifying questions, and phased implementation plan.

Known facts:

- `roots@amora.cr` is already set up in Google Workspace and Notion.
- The MVP should avoid extra paid tools unless necessary.
- Railway and Vercel are available.
- Railway should be used for background worker processing.
- Vercel is optional for a future admin dashboard.
- Gmail polling is preferred for MVP unless you identify a strong reason not to use it.
- Automation must not publish canon.
- Staff must not be required to schedule meetings from Roots.
- Staff should invite Roots to memory-worthy meetings.
- Forwarded Google Meet links do not guarantee file access.
- Always check access and retry.
- Ask me all blocking questions before implementation.

After I answer your questions, build in phases and preserve tokens by working from a concise implementation summary.
