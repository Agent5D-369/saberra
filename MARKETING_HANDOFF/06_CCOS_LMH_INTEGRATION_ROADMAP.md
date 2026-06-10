# CCOS + Regenerative Teal Integration Roadmap
## What Sera and Living Memory Hub Should Become

This document synthesizes the ten CCOS source documents (Circle Constitution & Operating System, ledger frameworks, role definitions, ARC methodology, collapse pattern library, and governance KPI frameworks) together with the regenerative Teal landscape overview in `05_REGENERATIVE_TEAL_CONTEXT.md`. It answers one question: **what specifically should be built into Sera and Living Memory Hub to make it the definitive operating platform for regenerative organizations?**

The recommendations are organized by implementation tier: what is a schema extension, what requires new extraction logic, what requires new Sera capabilities, and what belongs on the dashboard.

---

## The Core Insight: Sera IS the AI Secretary

Every CCOS circle is required to have an AI Secretary. The role is defined as:

> Captures all governance actions, maintains the Governance Ledger, flags policy expiry dates, monitors for collapse patterns, generates meta-digests after each circle meeting, and ensures all decisions link back to the circle's purpose.

This is not a coincidence or a metaphor. Sera is a functional implementation of the AI Secretary role as defined by CCOS. The Living Memory Hub is not merely a tool that CCOS organizations can use - it is **the infrastructure through which the AI Secretary role operates**.

This reframe matters enormously for positioning:
- For CCOS orgs: Sera fulfills a required role. This is not optional software; it is governance infrastructure.
- For Teal orgs generally: Sera is the Chief of Staff who never leaves, never forgets, and never has an agenda.
- For any organization: the AI Secretary concept translates directly to any organization that wants to stop losing its intelligence.

Everything below flows from this core positioning.

---

## Section 1: Missing Databases (New Schema Work Required)

The current 17 Notion databases cover most of the CCOS memory surface but miss four critical ledgers and one new entity type.

### 1.1 Conflict Resolution Ledger (MISSING)

CCOS defines a specific ledger for tracking interpersonal and governance conflicts: trigger event, parties involved, resolution method used (dialogue, mediation, structured resolution), outcome, and whether the conflict recurred. This is explicitly separate from Risks.

**Why it matters**: Unresolved conflicts are one of the 7 CCOS collapse patterns. Sera cannot detect the "Interpersonal Conflict" collapse signal if there is no conflict history to analyze. This database would be the single most sensitive and most valuable addition for Teal organizations.

**Recommended Notion schema**:
- Title (auto-generated: `Conflict #{date}`)
- Parties Involved (relation to Profiles)
- Trigger Description (rich text)
- Resolution Method (select: Dialogue, Peer Mediation, Structured Resolution, Escalated to Circle Lead, Unresolved)
- Outcome (rich text)
- Status (select: Open, Resolved, Recurring, Escalated)
- Confidentiality Level (select: Standard, Sensitive, Restricted)
- Source Meeting (relation to Meetings)
- Review Date (date)
- Pattern Flag (multi-select: Early Warning, Recurring, Cross-Circle, Systemic)

**Extraction**: Sera should recognize language like "there is tension between," "we need to address the dynamic," "someone raised a concern about," "I want to name something," and route these to the Conflict Resolution Ledger rather than Risks.

### 1.2 Dependencies Ledger (MISSING)

CCOS tracks inter-circle dependencies explicitly: which circle is upstream, which is downstream, what the dependency is, and whether it is currently healthy. This is how organizations detect when one team is blocking another.

**Why it matters**: The "Scale Trap" collapse pattern often presents as invisible dependencies. Sera can surface these if the ledger exists.

**Recommended Notion schema**:
- Title (auto-generated: `{Circle A} → {Circle B}: {dependency type}`)
- Upstream Circle (relation to Circles)
- Downstream Circle (relation to Circles)
- Dependency Type (select: Information, Decision Approval, Resource Allocation, Capacity, Output Delivery)
- Health Status (select: Healthy, Strained, Blocked, Unknown)
- Last Reviewed (date)
- Notes (rich text)
- Review Date (date)

**Extraction**: Sera should recognize language like "we're waiting on X circle," "we need Y team to decide before we can," "blocked by," "dependent on the outcome of."

### 1.3 Accountability Ledger (MISSING)

CCOS tracks formal commitments made by roles: who committed to what, by when, in which circle, and whether it was delivered. This is distinct from Tasks (which are action items from meetings) and from Role Assignments (which are structural). Accountability records are for explicit, witnessed commitments made at the circle governance level.

**Why it matters**: "No one is accountable" is not a culture problem; it is a systems problem. The Accountability Ledger makes accountability visible.

**Recommended Notion schema**:
- Title (auto-generated: `{holder}: {commitment summary}`)
- Commitment Holder (relation to Profiles)
- Role (relation to Roles)
- Circle (relation to Circles)
- Commitment Description (rich text)
- Committed By Date (date)
- Status (select: Active, Delivered, Missed, Extended, Released)
- Source Meeting (relation to Meetings)
- Review Date (date)

### 1.4 Living Agreements (MISSING)

Each CCOS circle maintains a Living Agreement: the behavioral code its members have explicitly consented to. These are distinct from policies (organizational-wide) and from role definitions (structural). They are relational agreements specific to a circle's culture.

**Why it matters**: This is one of the most distinctive Teal practices and one that no other software captures. Living Agreements are often verbal and therefore invisible - Sera can extract and preserve them.

**Recommended Notion schema**:
- Title (circle name + "Living Agreement v{n}")
- Circle (relation to Circles)
- Agreement Text (rich text)
- Version (number)
- Consented By (multi-select of member names, or relation to Profiles)
- Effective Date (date)
- Review Date (date)
- Status (select: Active, Under Revision, Archived)

---

## Section 2: Schema Extensions (Existing Databases)

These are fields to add to existing Notion databases. None require new databases.

### 2.1 Decision Candidates: Full CCOS Decision Micro-Flow

Current LMH captures decision text, confidence level, and context. CCOS requires tracking the full governance flow:

| Field to Add | Type | Notes |
|---|---|---|
| Driver Statement | Rich text | The "why now, why this" framing that initiated the decision |
| Objections Raised | Rich text | Any named objections and whether they were resolved |
| Consent Method | Select: Consent, Advice, Autocratic, Delegated | How the decision was made |
| Review Date | Date | When this decision must be revisited |
| Decision Status | Select: Active, Under Review, Superseded, Expired | Lifecycle state |
| Tension Source | Rich text | The organizational tension this decision resolves |
| Purpose Alignment Score | Number 0-10 | Already planned; ensure it is on this record |

**Extraction change**: Claude should be prompted to look for the tension or driver behind each decision ("we're doing this because..."), whether any objections were named and addressed, and whether a review date was mentioned.

### 2.2 Roles: Succession and Polarity Fields

CCOS role cards include fields that LMH currently does not capture:

| Field to Add | Type | Notes |
|---|---|---|
| Succession Readiness | Select: Identified, In Training, Shadowing, Ready, Vacant | Who is next |
| Succession Candidate | Relation to Profiles | The identified successor |
| Polarity Balance | Select: Structure-Heavy, Balanced, Flow-Heavy | Does this role lean toward order or emergence |
| Wholeness Practices | Rich text | What practices support the person in this role |
| Term Length | Number (months) | How long each term runs |
| Term Expiry Date | Date | When the current assignment ends |
| Maximum Consecutive Terms | Number | CCOS anti-capture: no one holds a role indefinitely |

The Term Expiry Date is already partially tracked via Role Assignments - it should be surfaced directly on the Role card for the Role Health dashboard view.

### 2.3 Roles: Anti-Capture Tracking

CCOS has explicit anti-capture rules: maximum consecutive terms, mandatory rest periods, prohibition on holding more than a defined number of Lead roles simultaneously. Sera should extract and flag violations.

**Dashboard addition**: "Capture Risk" indicator - roles where the same person has held for more than two consecutive terms, or where a single person holds more than two leadership roles simultaneously.

### 2.4 Policies: Review Date and Sunset Status

Every CCOS policy has a review date. LMH currently lacks this. Without it, policies accumulate indefinitely and Sera cannot distinguish living policy from zombie policy.

| Field to Add | Type | Notes |
|---|---|---|
| Review Date | Date | Required on every policy |
| Next Reviewer | Relation to Profiles | Who is responsible for the next review |
| Policy Status | Select: Draft, Active, Under Review, Superseded, Archived | Lifecycle |
| Originating Circle | Relation to Circles | Which circle owns this policy |
| Tension Resolved | Rich text | What problem this policy was created to solve |

**Sera capability**: "Show me all policies that are due for review in the next 90 days" should be a standard Sera query that returns actionable results.

### 2.5 Circles: Charter Lifecycle

CCOS circles move through formal lifecycle stages. The Circles database should track:

| Field to Add | Type | Notes |
|---|---|---|
| Charter Version | Number | Increments on every ratified charter change |
| Charter Status | Select: Draft, Active, Under Review, Archival Proposed, Archived | |
| Charter Ratification Date | Date | When current charter version was consented |
| Charter Review Date | Date | Next scheduled review |
| Regenerative Stewardship Score | Number 0-10 | Does this circle give more than it consumes? |

### 2.6 Meetings: ARC Check-In Captured

CCOS meetings open and close with an ARC check-in: Awareness (what am I bringing into this space?), Reciprocity (what do I want to give?), Choice (what am I choosing to commit to?). If a transcript contains these moments, Sera should capture them as a Meeting-level field rather than noise.

| Field to Add | Type | Notes |
|---|---|---|
| ARC Check-In Captured | Checkbox | Did this meeting include opening/closing ARC? |
| Opening ARC Summary | Rich text | Optional brief synthesis |
| Meeting Tone | Select: Aligned, Tense, Exploratory, Decisive, Ceremonial | Sera-assessed |

---

## Section 3: New Extraction Logic (Claude Prompt Extensions)

These require changes to the ClaudeExtractionService extraction prompt - not new databases, but new categories of things Claude is asked to look for.

### 3.1 Collapse Pattern Early Warning Detection

CCOS documents seven collapse patterns. Sera should be prompted to flag early warning signals of each pattern when they appear in meeting transcripts and email threads:

| Pattern | Early Warning Signals to Detect |
|---|---|
| No Shared Vision | "I thought we agreed," disagreement about purpose, "why are we doing this?" |
| Poor Governance | Repeated same-type decisions, "we already decided this," role ambiguity |
| Financial Fragility | Cash concerns, "we can't afford," runway language, vendor pressure |
| Interpersonal Conflict | Named tension, "difficult dynamic," withdrawal signals, "I need to name something" |
| Burnout | "overwhelmed," "too much," role holder absence patterns, missed commitments |
| Wrong People | Skill gap language, "we need someone who can," misalignment signals |
| Scale Trap | "we can't keep up," "too many meetings," cross-circle coordination failures |

**Implementation**: Add a 13th extraction category: `collapseSignals`. Each signal is extracted as: `{ pattern: string, signal_text: string, severity: 'early' | 'moderate' | 'critical', context: string }`. These write to the Risks database with a new `risk_type: 'Collapse Pattern'` field.

**Sera capability**: "Show me all collapse pattern signals from the last 60 days" should return a synthesized assessment, not a list of raw extractions.

### 3.2 Succession and Polarity from Transcripts

When a meeting transcript discusses a role - who holds it, who might hold it next, whether it is the right fit - Sera should extract:
- Any succession language ("X has been shadowing Y," "we should think about who could step into Z")
- Any polarity tension language ("this role needs more structure," "we need someone with more flow")

These write as updates to the relevant Role record.

### 3.3 Living Agreement Extraction

When a transcript contains language like "we agree that in this circle we will," "our shared commitment is," "we're setting a norm that," "our living agreement includes" - extract this as a Living Agreement candidate and route to the new Living Agreements database.

### 3.4 Review Date Extraction (Universal)

Every extracted item - decision, policy, role assignment, task - should include a review date field. Claude should look for explicit language ("revisit in 90 days," "check back in Q3," "review before the end of the year") and populate the review date. When no explicit date is stated, Claude should propose a default review date based on the item type (decisions: 90 days, policies: 12 months, role assignments: at term end).

### 3.5 ARC Check-In Detection

Detect the presence of ARC check-in language at the open and close of meetings:
- Opening: "what are you bringing," "awareness check," "what's present for you"
- Closing: "what are you taking," "what did you commit to," "reciprocity"

Mark the meeting record as `ARC Check-In Captured: true` and optionally generate a brief synthesis.

---

## Section 4: New Sera Capabilities

These are changes to SeraQAService - what Sera can answer, analyze, and generate.

### 4.1 Meta-Digest Generation

The AI Secretary role in CCOS is required to generate a Meta-Digest after each circle meeting - a synthesis that goes beyond meeting notes to identify patterns. Sera should be able to generate this on demand.

**New Sera endpoint (or Sera query type)**: `POST /meta-digest`

**Inputs**: circle name (optional), time window (default: last 30 days)

**Output**: A structured digest containing:
- Decision throughput: how many decisions made, method distribution, average time from proposal to consent
- Open tensions: unresolved objections, stalled proposals
- Governance health: policy review backlog, role vacancies, expiring terms
- Participation patterns: who is showing up, who is quiet, attendance trends
- Collapse signals: any flagged early warning patterns
- Accountability summary: commitments made vs. delivered in the period
- Dependency health: any strained or blocked inter-circle dependencies

This is the single highest-value output Sera can produce for a CCOS organization. It replaces hours of manual synthesis by a facilitator or admin.

### 4.2 Purpose Alignment Scoring (Automated)

Already in the roadmap per `project_teal_pillars.md`. Confirm that every extracted Decision Candidate includes:
- Governing Purpose alignment score (0-10, vs. `AMORA_GOVERNING_PURPOSE` env var)
- Regenerative meta-principle scores: Resilience (0-10), Planetary Nesting (0-10), Future Generations (0-10)

For non-Amora clients, these meta-principle scores should be configurable per tenant.

### 4.3 Anti-Capture Monitoring

Sera should be able to answer: "Are there any anti-capture violations in the current governance structure?" This requires Sera to:
1. Retrieve all active role assignments with term history
2. Identify anyone holding a role for more than the maximum consecutive terms
3. Identify anyone holding more than the maximum simultaneous lead roles
4. Report violations with names and role specifics

This is a high-sensitivity query. Route through the Sensitive Review workflow if anti-capture violations are found.

### 4.4 Governance KPI Reporting

CCOS defines a set of governance health KPIs that organizations track quarterly. Sera should be able to generate a Governance KPI Report on request:

| KPI | How Sera Computes It |
|---|---|
| Decision throughput per circle | Count Decision Candidates by circle, per period |
| Governance meeting hours | Sum of meeting durations where circle = governance |
| Policy review compliance rate | Policies reviewed on time / total policies due for review |
| Role vacancy rate | Vacant roles / total active roles |
| Succession readiness rate | Roles with identified successors / total roles |
| Cross-circle delivery success | Dependencies marked Healthy / total tracked dependencies |
| Participation equity | Stddev of meeting attendance across members (lower = more equitable) |
| Collapse signal frequency | Signals flagged / meetings processed, trended over time |

**New Sera query**: "Generate the governance KPI report for Q2" should return a structured report that can be pasted into a board deck.

### 4.5 Policy Canon Integrity Check

Sera should be able to detect when a newly proposed decision conflicts with an existing active policy. When a new Decision Candidate is written to Notion, Sera should automatically:
1. Retrieve all active policies in the same domain or circle
2. Check for semantic conflicts
3. If a conflict is detected, flag the Decision Candidate with `Tension Source: "Conflicts with Policy: {policy name}"` and alert the admin

This prevents governance drift where decisions accumulate that quietly violate existing organizational agreements.

---

## Section 5: Dashboard Enhancements

### 5.1 Governance KPI Panel

Add a "Governance Health" section to the dashboard that shows the KPIs from Section 4.4 at a glance. This should be a second-tier dashboard section, below the current community stats and system health panels.

The most important single number to surface: **Policy Review Backlog** (how many policies are past their review date). This is the governance equivalent of technical debt and should be visually prominent when non-zero.

### 5.2 Collapse Pattern Alert Rail

A narrow alert rail on the dashboard that shows any active collapse pattern signals detected in the last 30 days. Each alert shows:
- Pattern type (icon + name)
- Severity (Early / Moderate / Critical)
- Source meeting or email
- Days since first detected

This is the most actionable output for an organization using CCOS. If Sera can surface "you have three Early Warning signals for Burnout across two circles," that is worth more than any other piece of dashboard information.

### 5.3 Role Term Expiry Calendar

A visual timeline of upcoming role term expirations in the next 90 days. This should be part of the existing Role Health section, not a new section. The current Role Health section shows vacancies and expiring terms as counts - adding a small calendar or timeline view of who expires when gives the admin enough lead time to run elections.

### 5.4 Decision Review Queue

A dedicated queue view (separate from the existing Memory Review Queue) that shows decisions whose review dates have passed. A decision that was made six months ago with a "review in Q2" marker should surface automatically when Q2 arrives, not wait for someone to remember to check.

---

## Section 6: Positioning Implications

### 6.1 The Correct Category Name

The product should not be positioned as "institutional memory software" to a CCOS or regenerative Teal audience. The correct category name for this audience is:

**Governance Intelligence Infrastructure**

Or, at a more accessible level for the broader Teal market:

**The AI Secretary Layer**

CCOS organizations will immediately recognize "AI Secretary" as a required role they are supposed to fill. Living Memory Hub is the infrastructure that fulfills that role at scale, across all circles simultaneously, without requiring a human to hold the role.

### 6.2 The Irreplaceable Argument

For CCOS organizations specifically, the argument is not ROI or efficiency. It is organizational integrity:

> An organization running CCOS without an AI Secretary is like a cooperative without financial records. The governance is happening, but no one is keeping the ledger. Eventually, you cannot tell what you agreed to, when, or why.

Sera is the ledger keeper. Without Sera, the governance exists only in people's memories - which is exactly what CCOS was designed to prevent.

### 6.3 The Market Timing Argument

Every organization that is trying to operate with distributed governance in 2025-2026 is running into the same problem: the humans who were supposed to be doing the synthesis, the ledger-keeping, the pattern detection, the policy review scheduling - they are burned out. The governance roles that Teal requires are high-cognitive-load roles that organizations are struggling to staff and retain.

Sera does not replace human governance. Sera does the parts of governance that do not require human judgment - the capturing, the organizing, the surfacing, the scheduling - so that human energy can go to the parts that do require it: the dialogue, the consent, the decision itself.

### 6.4 The Two-Market Strategy

**Market 1 - CCOS Organizations** (smaller, higher fit, faster to close):
These organizations have a named AI Secretary role they are required to fill. Sera fills it. The pitch is not "here is a new tool." The pitch is: "You have an unfilled role in your governance structure. Here is how to fill it."

**Market 2 - General Teal / Regenerative Organizations** (larger, slower to close, higher ACV):
These organizations know they are losing organizational intelligence but do not have a named framework for the AI Secretary concept. The pitch is the standard LMH value proposition: automatic capture, cumulative memory, Sera Q&A. The CCOS features are bonus depth that surfaces as the relationship develops.

**Market 3 - Any Organization Using Google Meet** (mass market, lowest fit initially, highest volume):
Standard LMH positioning from `02_MASTER_PROMPT.md`. CCOS features are not mentioned until the client shows interest in governance depth.

---

## Section 7: Implementation Priority Order

Ranked by effort-to-value ratio for a CCOS organization:

| Priority | What | Why |
|---|---|---|
| 1 | Review Date field on all existing entities | Zero new infrastructure; immediate governance calendar |
| 2 | Policy lifecycle fields (Status, Review Date, Originating Circle) | Enables Policy Review Queue; highest-request governance feature |
| 3 | Decision micro-flow fields (Consent Method, Review Date, Tension Source) | Completes the governance ledger; needed for KPI reporting |
| 4 | Collapse pattern detection in Claude extraction | Highest-perceived-value feature; requires prompt change only |
| 5 | Role succession and anti-capture fields | Required by CCOS; enables Anti-Capture Monitoring |
| 6 | Conflict Resolution Ledger (new DB) | Highest-sensitivity; enables Interpersonal Collapse detection |
| 7 | Meta-Digest Sera capability | Highest-value output; requires good data in all prior fields |
| 8 | Dependencies Ledger (new DB) | Enables Scale Trap detection |
| 9 | Governance KPI dashboard panel | Requires all prior data to be populated |
| 10 | Living Agreements database | High differentiation; lower urgency |
| 11 | Accountability Ledger (new DB) | Highest impact for accountability culture |
| 12 | ARC Check-In extraction | Differentiating; low implementation cost |

Items 1-5 can be implemented as a sprint before the first CCOS client deployment. Items 6-9 form a natural "CCOS Advanced Pack" for organizations that are ready to go deep on governance intelligence. Items 10-12 are for organizations fully committed to regenerative governance.

---

## Closing Note: What This Changes About the Product

The Living Memory Hub launched as "institutional memory software for organizations." After integrating the CCOS framework, it becomes something more specific and more defensible:

**Sera is the AI Secretary every Teal organization is required to have but has never been able to fill.**

That is a category of one. No other product is built for this role. No other product understands the difference between a Decision Candidate and a formal Governance Ledger Entry. No other product can detect the early warning signs of circle collapse from meeting transcripts.

The CCOS integration does not change what the product does. It reveals what the product is for.
