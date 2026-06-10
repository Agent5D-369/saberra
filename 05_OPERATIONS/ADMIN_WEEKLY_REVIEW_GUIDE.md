# Admin Weekly Review Guide

## Principle

Automation handles intake. Admins handle authority.

The Railway worker runs every 3 minutes and creates draft/candidate/pending records. Nothing becomes canon, confirmed, or approved without a human decision. This guide is the weekly rhythm for clearing the queues.

---

## Recommended Weekly Cadence

Set aside 30–60 minutes once per week. Work through the queues in this order — highest-stakes first.

---

## 1. Sensitive Review (highest priority)

**Where:** Notion → Sensitive Review database
**Who:** Approved stewards only (restricted access)

Items flagged as sensitive include: interpersonal conflict, accusations, legal concerns, financial concerns, family/client privacy, health details, trauma disclosures, safety concerns, consent issues.

For each item:

1. Read the flagged content
2. Decide:
   - **Restrict** — keep in Sensitive Review, do not surface elsewhere
   - **Rewrite neutrally** — remove inflammatory framing, then approve for memory
   - **Route to steward** — forward to the appropriate circle lead or steward for handling
   - **Dismiss** — false positive, no sensitive content

3. Update the Status field in Notion accordingly
4. Never copy sensitive content into general memory without approval

**Prompt to use in Claude Team:**
> Review this sensitive item. Check: is this genuinely sensitive? If yes, who should handle it and how? If no, what is the appropriate neutral rewrite for memory? Paste the item text below.

---

## 2. Canon Change Requests

**Where:** Notion → Canon Change Requests database

Canon changes affect: governing purpose, policies, circle definitions, role definitions, decision rights, legal commitments, financial commitments, land stewardship agreements, CCOS ledger canon.

For each item:

1. Read the proposed change and its source evidence
2. Ask:
   - Is the source evidence clear and verifiable?
   - Was this decision actually made, or is it a suggestion?
   - Who had the authority to make this decision?
   - Does it conflict with existing canon?
   - Which circle or steward needs to weigh in?
3. Decide:
   - **Approve** — implement the change in the relevant canon document (manually)
   - **Reject** — document reason
   - **Needs Clarification** — add a comment, return to requester
   - **Escalate** — route to circle lead or full governance process

4. Update Status in Notion
5. If approved, implement the change manually in the relevant canon document — the worker will never do this for you

**Prompt to use in Claude Team:**
> Review this Canon Change Request. Check: (1) Is the source evidence clear? (2) Was this decision actually made? (3) Who had authority? (4) Does it conflict with existing canon? (5) Which circle or steward should review? Return: recommended status, reason, suggested revised language if needed, and implementation destination. Paste the request text below.

---

## 3. Decision Candidates

**Where:** Notion → Decision Candidates database

For each item:

1. Read the extracted decision and its source
2. Classify:
   - **Confirmed** — a real decision was made by someone with authority
   - **Candidate** — looks like a decision but needs verification
   - **Rejected** — not a real decision (suggestion, brainstorm, or misextracted)
   - **Needs Clarification** — unclear who decided or whether it was final
3. If Confirmed and it affects canon → create a Canon Change Request manually
4. If Confirmed and it creates tasks → verify those tasks exist in Tasks database

**Prompt to use in Claude Team:**
> Review this Decision Candidate. Check: (1) Was this a real decision? (2) Is it only a suggestion? (3) Who made it? (4) Did that person/circle have authority? (5) Does it require a canon update? Return: Confirmed / Rejected / Needs Clarification, reason, and suggested next action. Paste the candidate text below.

---

## 4. Memory Review Queue

**Where:** Notion → Memory Review Queue database

Memory candidates are durable context — things worth remembering for future work — but they are not canon.

For each item:

1. Read the memory candidate and its source
2. Ask:
   - Is this useful for future work?
   - Is it sourced (traceable to a meeting or email)?
   - Is it neutral — no blame, no inflammatory framing?
   - Is it specific enough to be actionable?
   - Is it sensitive? (if yes → route to Sensitive Review instead)
3. Decide:
   - **Approve** — keep in memory as-is
   - **Rewrite** — approve with neutral rewrite
   - **Reject** — not useful, too vague, or inappropriate
   - **Escalate to Sensitive Review** — contains sensitive content

**Prompt to use in Claude Team:**
> Review this Memory Candidate. Check: (1) Is it useful? (2) Is it sourced? (3) Is it neutral and non-blaming? (4) Is it specific? (5) Is it sensitive? Return: recommended status, suggested rewrite if needed, and risk if approved vs. ignored. Paste the candidate text below.

---

## 5. CCOS Ledger Drafts

**Where:** Notion → CCOS Ledger Entries database (filter: Status = Draft)

Supported ledger types: Tension, Proposal, Decision, Role, Policy, Resource, Accountability.

For each draft:

1. Read the extracted ledger entry
2. Verify:
   - Is the type correctly classified?
   - Is the source accurate?
   - Is the content neutral and precise?
3. Decide:
   - **Approve** → move to Official (manually)
   - **Revise** → edit content, keep as Draft
   - **Reject** → archive

Official ledger entries require human approval. Drafts are created automatically.

---

## 6. Tasks — Unassigned

**Where:** Notion → Tasks database (filter: Assignee is empty OR Status = Open)

1. Review unassigned tasks extracted from meetings and emails
2. Assign an owner
3. Set a due date if missing
4. Update Status as needed (Open → In Progress → Done)

Tasks extracted by AI may be incomplete or misattributed — verify against the source meeting or email before assigning.

---

## 7. Risks — High Severity / No Owner

**Where:** Notion → Risks database (filter: Severity = High OR Owner is empty)

1. Review high-severity risks and risks with no owner
2. Assign an owner if missing
3. Review and update Mitigation Plan
4. Update Status (Active / Resolved / Monitoring / Dismissed)

---

## 8. System Health

**Where:** Notion → Processing Events database

Filter by:
- `Event Type = Error` — failed processing attempts
- `Source Type = Retry` — items in the retry queue
- `Status = Manual Review` — items that exhausted all retries

For Manual Review items: check the Google Drive link, request access manually if needed, or mark as permanently inaccessible.

Check Railway logs weekly for any sustained errors: [Railway Dashboard](https://railway.app)

---

## Quick Reference — Notion Database Map

| Queue | Notion Database | Action |
|---|---|---|
| Sensitive items | Sensitive Review | Restrict / Rewrite / Route / Dismiss |
| Canon proposals | Canon Change Requests | Approve / Reject / Clarify / Escalate |
| Decision classification | Decision Candidates | Confirm / Reject / Clarify |
| Durable context | Memory Review Queue | Approve / Rewrite / Reject |
| Governance actions | CCOS Ledger Entries | Approve / Revise / Reject |
| Action items | Tasks | Assign / Update status |
| Flagged risks | Risks | Assign owner / Update mitigation |
| System errors | Processing Events | Investigate / Re-trigger / Dismiss |
