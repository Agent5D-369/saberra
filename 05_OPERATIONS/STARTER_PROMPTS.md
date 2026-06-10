# Starter Prompts for Claude Team

Use these in the **Amora Living Memory Hub** Claude Team project.
Paste the relevant Notion record or content into the conversation alongside the prompt.

---

## Meetings

**Get a plain-language summary of a meeting**
> Summarize this meeting record. What were the main topics discussed, what decisions were made (and by whom), what tasks were assigned, and what risks or open questions were flagged? Paste the Notion meeting record or transcript excerpt below.

**Find what was said about a topic across meetings**
> I'm looking for everything discussed about [topic] in recent meetings. Here are the meeting summaries I have. What was said, who said it, and was anything decided?

**Check what follow-up is outstanding from a meeting**
> Based on this meeting record, what tasks and decisions are still open? Which tasks have no assignee and which decisions are still Candidates (not yet Confirmed)?

---

## Tasks

**Triage this week's open tasks**
> Here are the open tasks extracted from recent meetings and emails. Help me triage them: group by owner, flag anything with no owner, highlight anything overdue or high-urgency, and suggest a priority order.

**Draft a task assignment message**
> I need to assign this task to [name]. Draft a short, clear message explaining the task, the context it came from, the expected output, and the due date.

**Find tasks related to a project or topic**
> Which of these tasks relate to [project name or topic]? Paste the task list below.

---

## Decisions

**Classify a Decision Candidate**
> Review this Decision Candidate. Was this a real decision or just a suggestion? Who made it and did they have authority? Should this be Confirmed, Rejected, or Needs Clarification? Does it require a Canon Change Request? Paste the candidate below.

**Summarize recent confirmed decisions on a topic**
> Here are the confirmed decisions we've recorded about [topic]. Give me a plain-language summary of where we stand and flag any tensions or contradictions between them.

**Draft a Canon Change Request**
> Based on this confirmed decision, help me draft a Canon Change Request. Include: what is changing, what the source evidence is, who made the decision, which existing canon document it affects, and what the proposed new language should be. I will submit this for admin review — do not treat it as approved. Paste the decision record below.

---

## Risks

**Review open risks**
> Here are the open risks currently flagged in Notion. Which are highest severity and have no owner? Which have mitigation plans that look incomplete? Suggest a review priority order.

**Assess a new risk**
> Based on this email or meeting excerpt, is there a risk worth flagging? If yes, suggest: risk title, description, severity (Low / Medium / High / Critical), owner, and mitigation plan. Paste the source content below.

---

## Memory and Canon

**Review a Memory Candidate**
> Review this Memory Candidate. Is it useful, sourced, neutral, and non-blaming? Does it belong in memory or should it be canon? Suggest: approve as-is, rewrite neutrally, reject, or escalate. Paste the candidate below.

**Answer a policy or governance question**
> What is Amora's position on [topic]? Look through the canon and memory records I've shared and give me the most relevant documented positions. Clearly distinguish between approved canon, confirmed decisions, and unreviewed memory candidates.

**Check for conflicts in proposed changes**
> I'm considering changing [X]. Are there any existing canon documents, confirmed decisions, or memory records that conflict with or complicate this change? Paste the relevant records below.

---

## Profiles, Roles, and Circles

**Look up a role**
> Based on the Roles and Role Assignments records I've shared, who currently holds [role name] and what are their documented accountabilities?

**Understand a circle's structure**
> Based on the Circles and Role Assignments records I've shared, what is the current structure of [circle name]? Who leads it, who are the members, and what projects are associated with it?

**Summarize a person's recent contributions**
> Based on the tasks, decisions, and meeting records I've shared, what has [name] been working on and committed to recently?

---

## System and Admin

**Triage the weekly review queues**
> I'm doing my weekly admin review. Here are the counts from Notion: [paste counts]. Which queues should I prioritize and why? Walk me through the recommended order.

**Explain what the system captured from a source email**
> Here is the Source Email record from Notion. What did the system extract from it? Does the extraction look accurate? Are there any tasks, decisions, or risks that seem misclassified?

**Investigate a processing error**
> Here is a Processing Event record showing an error. What likely went wrong and what should I do — retry, request access manually, or dismiss?

---

## Tips

- **Always paste source content** — Claude Team cannot access Notion directly. Copy and paste the record text into the conversation.
- **State the record type** — tell Claude whether you're sharing a meeting record, a Decision Candidate, a Memory Candidate, etc. so it applies the right review framework.
- **Check Claude's work** — AI extraction is a first pass, not final truth. Use Claude Team to help review and classify, but confirm before updating Notion.
- **Restricted content belongs in restricted projects** — don't paste Sensitive Review items into the main Claude Team project. Use the `Living Memory | Sensitive Review` project for that.
