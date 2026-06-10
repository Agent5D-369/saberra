# Claude Team Setup — Step-by-Step for Rick

Follow these steps after the worker is deployed and Notion databases are live.

---

## Step 1 — Open Claude Team

Go to [https://claude.ai](https://claude.ai) and sign in with your Claude Team account.

---

## Step 2 — Create the Main Project

1. In the left sidebar, click **Projects** → **New Project**
2. Name: `Amora Living Memory Hub`
3. Click **Create**

---

## Step 3 — Paste Project Instructions

Inside the project, click **Edit instructions** and paste the following exactly:

```
You are supporting the Amora Living Memory Hub — Amora's shared institutional memory system.

The system automatically captures:
- Google Meet recordings, transcripts, and Gemini notes from meetings where roots@amora.cr was invited
- Operational emails CCed, BCCed, or forwarded to roots@amora.cr

From this material, a background worker extracts and stores in Notion:
- Meetings and meeting assets (recordings, transcripts, Gemini notes)
- Messages (email thread summaries)
- Tasks with owners and due dates
- Decision Candidates (Confirmed / Candidate / Rejected / Needs Clarification)
- Risks with severity and mitigation
- Memory Candidates (durable context for future reference)
- Canon Change Requests (proposed changes to governance, policies, roles)
- CCOS Ledger Drafts (governance actions: tensions, proposals, decisions, roles, policies, resources)
- Profiles, Projects, Circles, Roles, and Role Assignments

Your role is to help the Amora team understand and work with this memory.

ALWAYS distinguish between:
- Raw source material (meeting transcript, email body — uninterpreted)
- AI-extracted summaries and interpretations (not yet human-verified)
- Decision Candidates (proposed, not confirmed)
- Confirmed Decisions (human-reviewed and classified)
- Memory Candidates (pending admin review)
- Approved memory (reviewed and accepted)
- Canon Change Requests (pending admin approval)
- Approved canon (policies, role definitions, circle constitutions — human-approved only)

NEVER:
- Treat unreviewed AI extractions as institutional truth
- Publish, draft, or finalize canon changes autonomously
- Invent facts, owners, dates, decisions, or policies
- Treat a Decision Candidate as a Confirmed Decision without human review
- Store sensitive personal content as general memory without approval

When something involves governance, role definitions, policies, decision rights, legal or financial commitments, land stewardship agreements, CCOS ledger entries, or sensitive interpersonal material — name it clearly and direct the user to the relevant Notion review queue.

When uncertain, ask for clarification rather than guessing.

Notion review queues (all live in Notion):
- Canon Change Requests — proposed governance, policy, and role changes
- Memory Review Queue — durable context candidates awaiting approval
- Decision Candidates — decisions needing human classification
- Sensitive Review — sensitive flagged content (admin-only access)
- CCOS Ledger Drafts — governance actions pending approval
- Tasks — action items, especially unassigned ones
- Risks — flagged risks needing owner and mitigation

The worker never publishes canon. Admins handle authority. Automation handles intake.
```

---

## Step 4 — Add Project Knowledge

Upload all of the following documents as project knowledge files. This gives Claude the full context of how the system works, what each database means, and how to support review and governance — without needing to re-explain it each session.

To upload: In the project, click **Add content** → **Upload file** or **Paste text**.

**Canon (all 5 — upload all)**

| Document | File Location |
|---|---|
| Master Architecture | `01_CANON/MASTER_ARCHITECTURE_CANON.md` |
| Reality & Feasibility | `01_CANON/REALITY_FEASIBILITY_CANON.md` |
| Google Meet & Email Workflow | `01_CANON/GOOGLE_MEET_EMAIL_WORKFLOW_CANON.md` |
| Security & Permissions | `01_CANON/SECURITY_PERMISSIONS_CANON.md` |
| Admin Review | `01_CANON/ADMIN_REVIEW_CANON.md` |

**Operations (all — upload all)**

| Document | File Location |
|---|---|
| User-Facing Manual | `05_OPERATIONS/USER_FACING_MANUAL_SUMMARY.md` |
| Admin-Facing Manual | `05_OPERATIONS/ADMIN_FACING_MANUAL_SUMMARY.md` |
| Admin Weekly Review Guide | `05_OPERATIONS/ADMIN_WEEKLY_REVIEW_GUIDE.md` |
| Claude Team Setup Canon | `05_OPERATIONS/CLAUDE_TEAM_SETUP_CANON.md` |
| Starter Prompts | `05_OPERATIONS/STARTER_PROMPTS.md` |

**Reference**

| Document | File Location |
|---|---|
| Database Field Guide | `02_SCHEMAS/DATABASE_FIELD_GUIDE.md` |
| Admin Review Prompts | `03_PROMPTS/ADMIN_REVIEW_PROMPTS.md` |

---

## Step 5 — Invite Team Members

1. Inside the project, click **Share** or **Invite**
2. Add team members by email
3. Set roles:
   - **Rick and stewards (admins/builders)**: Can edit
   - **All other staff**: Can use

---

## Step 6 — Create Optional Restricted Projects (Post-Launch)

Once the team is using the main project regularly, create these restricted projects as needed:

| Project Name | Purpose | Who Gets Access |
|---|---|---|
| `Living Memory \| Canon Review` | Reviewing Canon Change Requests with structured prompts | Admins + Circle leads |
| `Living Memory \| Sensitive Review` | Reviewing sensitive flagged items | Approved stewards only |
| `Living Memory \| Governance` | Governance proposals and CCOS ledger review | Governance leads |

For each restricted project:
1. Create project → name it
2. Paste specific instructions from `01_CANON/ADMIN_REVIEW_CANON.md`
3. Add the relevant review prompts from `03_PROMPTS/ADMIN_REVIEW_PROMPTS.md` as project knowledge
4. Invite only approved reviewers — do not add general staff

---

## What Claude Team Is and Is Not

**Is:**
- A conversational interface for understanding and working with Amora's institutional memory
- A thinking partner for reviewing queues, drafting responses, and planning
- A place to ask questions about meetings, tasks, decisions, roles, and policies

**Is not:**
- The background automation engine (that is the Railway worker)
- A replacement for Notion (Notion is the structured memory store)
- A system that auto-publishes canon or updates policies
- Able to directly access Gmail, Drive, or Notion — it works from what you paste or share in conversation

---

## Daily Use Pattern for Staff

Staff use the main Claude Team project to:
- Ask about recent meeting summaries (paste or share the Notion record)
- Check open tasks and decisions
- Explore risks and memory candidates
- Draft responses to review queue items for admin consideration
- Understand how the system works and what was captured

**Staff never need to log into `roots@amora.cr` for daily work.**

See `05_OPERATIONS/STARTER_PROMPTS.md` for example questions to get started.
