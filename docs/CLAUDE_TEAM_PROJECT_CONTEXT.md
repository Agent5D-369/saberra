# Amora Living Memory Hub â€” Claude Team Project Context

> Upload this file to your Claude Team project under "Project Files."
> It gives Claude deep reference context for answering questions and taking actions.
> Update it whenever the circle structure, role holders, or key processes change.

---

## What This Project Is For

This Claude Team project is the AI workspace for the Amora Living Memory Hub. Use it for:

- Creating, updating, and querying Notion records (tasks, decisions, risks, meetings, profiles)
- Drafting content for roots@amora.cr so Sera can process it
- Getting status reports on circles, roles, and open governance items
- Preparing for governance meetings
- Onboarding new community members
- Building Knowledge Base articles

---

## The Amora Notion Workspace

Amora's Notion workspace has 17 databases. All are written to by Sera.

| Database | Purpose | Key Fields |
|----------|---------|------------|
| Source Emails | Every email processed by Sera | Message ID (dedup key), Email Type, Processing Status |
| Meetings | One record per meeting | Capture Key (dedup), Meeting Title, Date, Links, Processing Status |
| Meeting Assets | Per-asset record (recording/transcript/notes) | Asset Type, Google Drive Link, Access Status, Retry Count |
| Messages | Operational emails with summaries | Summary, Sender Profile, Follow-Up Needed |
| Profiles | Every person or org mentioned | Name, Email, Role at Amora, Circle Memberships, Engagement Status |
| Projects | Named initiatives | Status, Circle, Lead Profile, Priority, Target Date |
| Circles | CCOS governance circles | Circle Name, Sector, Purpose, Domains, Status |
| Roles | Teal role cards | Role Name, Circle, Role Type, Purpose, Domains, Accountabilities, Status |
| Role Assignments | Who holds which role | Assignment Title, Role, Role Holder, Circle, Status, Start Date |
| Tasks | Action items from extraction | Task, Assigned Role, Owner, Priority, Status, Due Date, Meeting |
| Decision Candidates | Decisions (all statuses) | Decision, Status, Decision Maker Role, Decision Maker Profile, Canon Impact |
| Risks | Flagged risks | Risk, Category, Severity, Owner Role, Owner, Status, Meeting |
| Memory Review Queue | Facts waiting for human approval | Proposed Memory, Category, Confidence, Status |
| Canon Change Requests | Proposed governance changes | Proposed Change, Affected Canon Area, Status (always Pending Review) |
| CCOS Ledger | Governance actions | Ledger Entry, Ledger Type, Circle, Status |
| Knowledge Base | Reusable how-to articles | KB Title, Category, Audience, Summary, Key Points, Status |
| Processing Events | Sera's audit trail | Event Type, Status, Started At, Token Estimate |
| Sensitive Review | Admin-only sensitive flags | Issue, Reason, Recommended Handling (admin only) |

---

## Circles and Roles (Current as of 2026-05-28)

### Governance & Coordination
Purpose: Hold the constitutional framework, steward consent-based decision process, coordinate across circles.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Visionary Director | Jessica Filkins | Appointed |
| Visionary Developer | Blake Delatte | Appointed |
| Admin Facilitator | (open â€” to be elected) | Consent Election |
| AI Secretary (Sera) | Sera â€” AI system | Appointed |
| Rep Steward | (open â€” to be elected) | Consent Election |

### Community & Culture
Purpose: Cultivate belonging, connection, and cultural vitality.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Community Steward | Victoria Leyden | Appointed |

### Land & Ecology
Purpose: Steward land, food systems, agroforestry, and ecological regeneration.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Agroforestry Steward | Ed Zaydelman | Appointed |

### Learning & Education
Purpose: Design and deliver nature-based and multigenerational learning experiences.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Education Steward | Ariana Binney | Appointed |

### Economics & Finance
Purpose: Steward financial health, funding strategy, regenerative economic structures.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Finance Steward | Kyleen Keenan | Appointed |

### Communications & Marketing
Purpose: Tell the Amora story, attract aligned members and partners.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Marketing Steward | Nikita Timmermans | Appointed |
| Social Media Steward | Maria Kusk | Volunteer |

### Technology & Systems
Purpose: Build and maintain digital infrastructure including the Living Memory Hub.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Technology Steward | Rick Broider | Appointed |

### Health & Wellbeing
Purpose: Cultivate physical, emotional, and spiritual health practices.

| Role | Holder | Assignment Type |
|------|--------|----------------|
| Wellbeing Steward | (currently open) | Appointed |

---

## Active Profiles (Core Team)

| Name | Role Title | Circle | Email |
|------|-----------|--------|-------|
| Jessica Filkins | Visionary Director | Governance & Coordination | â€” |
| Blake Delatte | Visionary Developer | Governance & Coordination | â€” |
| Ed Zaydelman | Agroforestry Steward | Land & Ecology | â€” |
| Kyleen Keenan | Finance Steward | Economics & Finance | â€” |
| Nikita Timmermans | Marketing Steward | Communications & Marketing | â€” |
| Victoria Leyden | Community Steward | Community & Culture | â€” |
| Ariana Binney | Education Steward | Learning & Education | â€” |
| Maria Kusk | Social Media Steward | Communications & Marketing | â€” |
| Rick Broider | Technology Steward | Technology & Systems | rick@amora.cr |

---

## How Sera Processes a Meeting (Step by Step)

1. Google Meet ends â†’ Google emails roots@amora.cr with recording link, transcript link, and Gemini notes
2. Sera picks up the emails within 3 minutes (polls every 3 minutes)
3. Sera creates a Meeting record in Notion (deduped by capture key: calendar event ID, meet code, or title)
4. Sera creates Meeting Asset records for recording, transcript, and notes
5. Sera checks Google Drive access for each asset
   - If accessible: exports text via Google Docs API
   - If not accessible: emails admin, schedules retry (30min â†’ 2h â†’ 24h â†’ Manual Review)
6. Sera sends the transcript/notes text to Claude for extraction
7. Claude extracts all structured entities (tasks, decisions, risks, profiles, governance records, KB articles)
8. Sera writes all records to Notion, linking everything to the meeting
9. If canon changes or sensitive flags are found â†’ admin review email sent with direct Notion links

---

## Sera's Extraction Format (for Drafting Content)

When drafting content to send to roots@amora.cr, use this format. Sera extracts these patterns reliably.

```
Subject: [AMORA CAPTURE] [Brief description]

[Optional context note â€” e.g., "Summary of conversation with Kyleen about Q3 budget"]

TASKS:
- Prepare Q3 budget proposal | Role: Finance Steward | Due: 2026-07-01 | Priority: High | Project: Q3 Planning
- Update community onboarding guide | Role: Community Steward | Due: 2026-06-15 | Priority: Medium

DECISIONS:
- Agreed to hold monthly governance meetings on the first Monday | Status: Confirmed | Role: Admin Facilitator
- Consider moving to weekly community calls during onboarding season | Status: Candidate | Role: Community Steward

RISKS:
- Finance reporting is 3 weeks behind schedule | Category: Financial | Severity: High | Role: Finance Steward | Mitigation: Block 4 hours this week for reconciliation

MEMORIES:
- Amora's first full-team governance meeting was held on 2026-05-28 with all 9 core team members present.
- Ed Zaydelman has 20+ years of regenerative agriculture experience and is the primary agroforestry knowledge holder.

CANON CHANGE:
- Proposed: Add a "Wellbeing Steward" election to the annual governance calendar | Area: Role Definition | Reason: Ensure the role is never vacant for more than 30 days
```

---

## Common User Requests and How to Handle Them

### "What tasks are open for [circle/role]?"
Query Notion Tasks database filtered by Assigned Role = [role] and Status not in (Done, Cancelled).
Report: task title, owner (if any), due date, priority, days overdue if past due.

### "What happened in the last governance meeting?"
Query Notion Meetings database for the most recent meeting. Pull: meeting summary, participants, tasks created, decisions made, risks raised.

### "Create a task for [role] to do [thing]"
Ask for: due date, priority, project (if any). Then create in Notion Tasks with Assigned Role linked.
Confirm with user before writing. Output the record details after creation.

### "What decisions have been made about [topic]?"
Query Decision Candidates filtered by Status = Confirmed and keyword in Decision title/evidence. Summarize.

### "Who is responsible for [domain/area]?"
Look up the relevant circle and role in Roles database. Check Role Assignments for current holder.

### "Give me a weekly report for [circle]"
Pull: open tasks (count + list of High priority), pending decisions, open High risks, last meeting summary, governance queue items. Format as a brief.

### "I need to raise a governance concern"
Ask them to describe the tension. Frame it as: current reality vs. what could be. Offer to draft a CCOS Ledger Entry (type: Tension) and/or Canon Change Request for them to forward to roots@amora.cr or create directly.

### "Help me prepare for [meeting name]"
Pull from Notion: open tasks relevant to meeting participants, pending decisions, recent meeting context for that circle. Draft a brief agenda.

### "Remember [fact] about [person/project]"
Draft this as a Memory Candidate to forward to roots@amora.cr:
"MEMORY: [Factual statement]. Category: [Context/Relationship/Decision/Learning/Process]. Confidence: High."

---

## Key Rules for Working with Sera and Notion

1. **Assign to roles, not just people.** "Finance Steward" not "Kyleen." Sera auto-resolves the current holder.
2. **One meeting = one Notion record.** Sera deduplicates by capture key. Never create duplicate meetings.
3. **roots@amora.cr is the intake.** Anything important should flow through it. Sera will structure it.
4. **Never approve canon.** Anything that changes governance must go through a consent process. Mark as Candidate.
5. **Sensitive content belongs in Sensitive Review, not team Notion.** Sera handles this automatically.
6. **Sera is a witness, not a decision-maker.** She records and flags; humans decide and approve.

---

## Integration MCP Tools to Enable in This Project

For full functionality, enable these in the Claude Team project settings:

| Tool | What it enables |
|------|----------------|
| Notion | Direct read/write access to all 17 Amora databases |
| Google Drive | Read documents, presentations, and meeting files |
| Gmail | Search email threads, draft forwarding emails |
| Google Calendar | Check schedules, find upcoming meetings |

With all four enabled, Claude can: look up a person's full profile and open tasks, pull a circle's recent activity, create a task directly in Notion, and draft an email to roots@amora.cr â€” all in a single conversation.

---

*Last updated: 2026-05-28 | Maintained by: Technology & Systems circle*
*To update this file: edit docs/CLAUDE_TEAM_PROJECT_CONTEXT.md in the Living Memory Hub repo and re-upload to the Claude Team project.*

