import Anthropic from '@anthropic-ai/sdk';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { NotionWriterService } from './NotionWriterService';
import { HubSettingsService } from './HubSettingsService';
import { logger } from '../config/logger';
import { getConfig } from '../config/ConfigService';
import { sanitizeDate, sanitizeSelect } from '../utils/sanitize';

const N = NotionWriterService;

// ─── Schema ───────────────────────────────────────────────────────────────────

const schemaPath = path.join(process.cwd(), '02_SCHEMAS', 'EXTRACTION_JSON_SCHEMA.json');
const extractionSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const ajv = new Ajv({ allErrors: true });
const validateSchema = ajv.compile(extractionSchema);

// ─── Extraction input ─────────────────────────────────────────────────────────

export interface ExtractionInput {
  sourceType: string;
  sourceTitle: string;
  sourceDate: string;
  sourceActor: string;
  relatedContext: string;
  sourceText: string;
  existingProjects?: string[];
  existingPolicies?: string[];
  existingProfiles?: string[];
  existingRoles?: string[];
  recentContext?: string;
  governingPurpose?: string;
  purposeTest?: string;
}

// ─── Known alias map — deterministic pre-lookup name normalization ─────────────
// Maps lowercase name variants → canonical profile name stored in Notion.
// Applied before any Notion query so these never create duplicate records.
// Add entries here whenever a new alias or nickname pattern is confirmed.
const CANONICAL_NAMES: Record<string, string> = {
  // Kyleen Keenan — Finance Steward (nickname: Ky; common misspelling: Kai)
  'ky':                          'Kyleen Keenan',
  'kai':                         'Kyleen Keenan',
  'kyleen':                      'Kyleen Keenan',
  'kyleen (ky) keenan':          'Kyleen Keenan',
  'kyleen keenan (ky)':          'Kyleen Keenan',
  // Jessica Filkins — Founder & Lead Steward
  'jess':                        'Jessica Filkins',
  'jessica':                     'Jessica Filkins',
  // Ariana Binney — Education Steward
  'ariana':                      'Ariana Binney',
  // Eric Timmermans — Technology Steward (middle name Develing sometimes parsed as last name)
  'eric develing':               'Eric Timmermans',
  'eric (develing) timmermans':  'Eric Timmermans',
  'eric develing timmermans':    'Eric Timmermans',
  // Victoria Leyden — common nickname Via; "Via Leyden" seen in calendar attendee lists
  'via':                         'Victoria Leyden',
  'victoria':                    'Victoria Leyden',
  'via leyden':                  'Victoria Leyden',
  'victoria (via) leyden':       'Victoria Leyden',
  // Nikita Timmermans
  'nikita':                      'Nikita Timmermans',
  // Rick Broider
  'rick':                        'Rick Broider',
  // Sera — AI persona; prevent spurious duplicate profiles for the AI itself
  'sera':                        'Sera',
  'sera mcp':                    'Sera',
};

function resolveCanonicalName(name: string): string {
  // Strip system-generated suffixes from automated notification emails
  // e.g. "Nikita Timmermans (via Google Docs)" → "Nikita Timmermans"
  const cleaned = name
    .replace(/\s*\(via Google Docs\)/gi, '')
    .replace(/\s*\(via Gmail\)/gi, '')
    .replace(/\s*\(via Google Drive\)/gi, '')
    .trim();
  return CANONICAL_NAMES[cleaned.toLowerCase()] ?? cleaned;
}

// Build alias hint string for Claude prompt — groups aliases by canonical name
function buildAliasHints(): string {
  const grouped: Record<string, string[]> = {};
  for (const [alias, canonical] of Object.entries(CANONICAL_NAMES)) {
    if (!grouped[canonical]) grouped[canonical] = [];
    grouped[canonical].push(alias);
  }
  return Object.entries(grouped)
    .map(([canonical, aliases]) => `- ${canonical}: also known as ${aliases.join(', ')}`)
    .join('\n');
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are processing institutional records for the Amora Living Memory Hub.

Your job is to extract structured operational intelligence from meeting notes, transcripts, recordings, emails, or forwarded threads.

Do not invent decisions, commitments, owners, dates, roles, permissions, or policies.

All extracted text written to structured fields must be in English, regardless of the source document language. Translate field values (summaries, task descriptions, decisions, memory proposals, etc.) to English when the source is in another language. Proper nouns (names of people, places, and organizations) should not be translated. Source evidence quotes may preserve the original language but must be followed by an English translation in brackets.

Separate confirmed decisions from candidate decisions.

Separate actual tasks from suggestions.

Separate raw source content from interpretation.

Flag anything involving governance, circle definitions, role definitions, policies, financial commitments, legal structure, land stewardship, public commitments, sensitive interpersonal dynamics, or CCOS canon for admin review.

Do not approve canon updates.

Do not write final policy.

Do not treat unreviewed content as institutional truth.

Use neutral, precise, non-inflammatory language.

Never use em dashes (the — character) anywhere in your output. Use a hyphen (-) or rewrite the sentence instead.

When Amora policies are listed in the prompt, flag any decisions or proposed actions that appear to conflict with those policies in sensitive_flags.

When the prompt includes a GOVERNING PURPOSE STATEMENT, treat it as the organization's highest governing authority (S.H.E. - Systemic Holistic Evolution). Evaluate each decision and each canon_change_candidate against it. For decisions, include "purpose_alignment" ("Aligned"|"Neutral"|"Misaligned"|"Unclear") and "purpose_alignment_notes" (one sentence max explaining the score). Omit these fields entirely when no Governing Purpose Statement is provided.

Cross-reference the provided recent institutional context — do not re-extract tasks or decisions that are already listed there. Only create new entries for genuinely new items.

Return only valid JSON. Only include fields that are relevant:
- For emails and forwarded threads: include "email_summary" as a JSON object (NEVER null) with fields: summary (plain text), requests (plain text), commitments (plain text — describe explicit promises made), questions (plain text), emotional_tone ("Neutral"|"Positive"|"Tense"|"Urgent"|"Unclear"), urgency ("High"|"Medium"|"Low"), follow_up_needed (boolean), confidentiality_level ("Standard"|"Sensitive"|"Restricted"). If the email contains only links or very little text, still provide a best-effort summary of what the links appear to be about. Omit "meeting_summary". IMPORTANT: any explicit actionable commitment (a person promised to do something) must ALSO appear as a task entry in the tasks array with that person as owner — do not let commitments live only in the commitments text field.
- For meeting transcripts and notes: include "meeting_summary" with short (one-sentence summary), detailed (2-3 paragraph summary), participants (array of participant names or emails), circles (array of CCOS circle names this meeting relates to — empty array if not circle-specific), confidence ("High"|"Medium"|"Low"). Omit "email_summary".
- For all source types: include "decisions", "tasks", "risks", "memory_candidates", "canon_change_candidates", "sensitive_flags", "profile_updates", "project_updates", "circle_updates", "role_updates", "role_assignment_updates", "ccos_ledger_entries", "kb_articles", "tensions", "agreements", "gratitudes", "events", "retrospectives" as arrays — use empty arrays [] if nothing found.
- Never omit an array field. Always return [] rather than omitting it.
- "profile_updates": array of people or organizations for whom you have genuinely new information not likely already on file. Do not extract a profile merely because someone attended a meeting or was mentioned by name - only extract when you have new contact details, a new role, a new organizational relationship, or substantive new context that enriches their record. Each entry: { "name": string, "profile_type": "Person"|"Organization"|"Both", "email": string|null, "role_title": string|null, "role_at_amora": string|null, "organization": string|null, "circle_affiliation": string[], "tags": string[], "location": string|null, "website": string|null, "linkedin": string|null, "relationship_to_amora": "Member"|"Partner"|"Vendor"|"Advisor"|"Funder"|"Contact"|"Community"|"Alumni"|"Government"|"Unknown", "membership_type": "Founding Member"|"Full Member"|"Associate Member"|"Guest"|"Steward"|"Partner"|null (Amora membership tier - extract only when explicitly stated), "primary_sector": "Sector 1 — Health & Holistic Wellness"|"Sector 2 — Governance & Justice"|"Sector 3 — Culture & Spirit"|"Sector 4 — Learning & Innovation"|"Sector 5 — Ecology & Infrastructure"|"Sector 6 — Economy & Exchange"|"Sector 7 — Media & Technology"|null, "context_notes": string|null, "referred_by": string|null, "source_evidence": string }. Only include profiles where you have at least a name. Do not invent contact details. "tags" should reflect skills or domains evident from context (choose from: Leadership, Legal, Finance, Agriculture, Education, Communications, Operations, Governance, Technical, Community, Land Stewardship, Fundraising). "circle_affiliation" should list the names of Amora CCOS circles this person is a member of or affiliated with, as mentioned in the source. "primary_sector" should reflect the person's primary domain of contribution to Amora — infer from their role, circle affiliation, or work described; use null when genuinely unclear.
- "project_updates": array of projects or initiatives mentioned. Each entry: { "project_name": string, "status": "Proposed"|"Active"|"On Hold"|"Complete"|"Cancelled", "circle": string|null, "project_lead": string|null, "priority": "High"|"Medium"|"Low", "start_date": string|null (YYYY-MM-DD only), "target_date": string|null (YYYY-MM-DD only), "description": string|null, "primary_sector": "Sector 1 — Health & Holistic Wellness"|"Sector 2 — Governance & Justice"|"Sector 3 — Culture & Spirit"|"Sector 4 — Learning & Innovation"|"Sector 5 — Ecology & Infrastructure"|"Sector 6 — Economy & Exchange"|"Sector 7 — Media & Technology"|null, "source_evidence": string }. "primary_sector" should reflect which sector this project primarily serves — infer from the circle, description, or project name; use null when genuinely unclear. Only extract if a named initiative or project is clearly referenced. Do not create a project for every task. When multiple tasks share the same initiative, create one project entry and reference it in each task's "project" field. When an existing project (from the provided list) matches semantically, reference it by its exact existing name rather than creating a duplicate. Never create a task for an action already extracted as a decision - if the key institutional value is the choice made, use a decision record only.
- "circle_updates": array of CCOS circles explicitly discussed or defined. Each entry: { "circle_name": string, "sector": string|null (use exact CCOS sector names: "Sector 1 — Health & Holistic Wellness", "Sector 2 — Governance & Justice", "Sector 3 — Culture & Spirit", "Sector 4 — Learning & Innovation", "Sector 5 — Ecology & Infrastructure", "Sector 6 — Economy & Exchange", "Sector 7 — Media & Technology", or null for Amora-specific circles with no sector mapping), "purpose": string|null, "domains": string|null, "accountabilities": string|null, "kpis": string|null, "meeting_cadence": string|null, "review_cadence": "Monthly"|"Quarterly"|"Semi-Annual"|"Annual"|"As Needed"|null, "last_review_date": string|null (YYYY-MM-DD — use when the source document itself is a formal circle review, or when a specific review date is mentioned; otherwise null), "circle_lead": string|null, "rep_steward": string|null (name of the person filling the Rep Steward role for this circle - extract only when explicitly named), "parent_circle": string|null, "status": "Active"|"Proposed"|"Inactive"|"Archived", "source_evidence": string }. Only extract when a circle is explicitly named and discussed. Do not infer from passing mentions.
- "role_updates": array of CCOS role cards explicitly defined or updated. Each entry: { "role_name": string, "circle": string|null, "role_type": "Lead Steward"|"Rep Steward"|"Admin Facilitator"|"AI Secretary"|"Custom Role", "purpose": string|null, "domains": string|null, "accountabilities": string|null, "term_length": "No Term"|"3 Months"|"6 Months"|"1 Year"|"Custom"|null, "assignment_method": "Consent Election"|"Appointed"|"Volunteer"|"Interim"|null, "last_audit_date": string|null (YYYY-MM-DD — use when the source document itself is a role audit/governance review, or when a specific audit date is mentioned; otherwise null), "status": "Active"|"Proposed"|"Vacant"|"Archived", "source_evidence": string }. Only extract when a role is explicitly defined, proposed, or updated.
- "role_assignment_updates": array of role assignments or appointments explicitly mentioned. Each entry: { "role_name": string, "holder_name": string, "circle": string|null, "assignment_type": "Consent Election"|"Appointed"|"Interim"|"Volunteer", "status": "Active"|"Delegated"|"Completed"|"Suspended", "start_date": string|null (YYYY-MM-DD only), "end_date": string|null (YYYY-MM-DD only), "term_length": "No Term"|"3 Months"|"6 Months"|"1 Year"|"Custom"|null, "energization_level": "Energized"|"Willing"|"Unwilling"|null (how energized the holder feels in this role - extract only when explicitly stated or clearly implied), "source_evidence": string }. Only extract when a specific person is assigned to or removed from a role.
- "decisions": array of decisions made, confirmed, or proposed. Each entry: { "decision": string, "status": "Candidate"|"Confirmed"|"Rejected"|"Needs Clarification", "decision_maker": string|null (person name, if a specific person is named), "decision_maker_role": string|null (role name if a role is responsible, e.g. 'Lead Steward', 'Finance Steward'; prefer role over person for Teal governance), "reviewer": string|null (person assigned to review this decision), "canon_impact": boolean (true if affects governance, policy, or CCOS canon), "review_required": boolean, "source_evidence": string, "purpose_alignment": "Aligned"|"Neutral"|"Misaligned"|"Unclear" (only when a Governing Purpose Statement is provided — omit otherwise), "purpose_alignment_notes": string|null (one sentence — only when a Governing Purpose Statement is provided), "circles": string[] (names of CCOS circles this decision directly relates to or impacts — use circle names from circle_updates or mentioned in the source; empty array if none) }. Separate confirmed decisions from proposals. If the same action is both a governance-level choice and an operational action, classify it as a decision if the primary institutional value is the choice made, or as a task if the primary value is the specific execution required - never create both a decision and a task for the same action.
- "tasks": array of concrete action items. OWNERSHIP RULE: every task must have either an owner (person name) or an assigned_role before it is created. If you cannot identify a responsible person AND cannot infer a responsible role from the domain guidance below, skip the task entirely — do not write it. Do not create a task with needs_owner: true unless it is a High priority item with a clear deadline that no role reasonably covers. Do not default priority to High — use High only when the source explicitly signals urgency or a firm deadline. TEAL ROLE INFERENCE GUIDE: When no specific person is named as responsible, infer the most appropriate role from the task domain. Use the following domain-to-role defaults — set assigned_role to the listed role name even when that role is not explicitly mentioned in the source: (1) Living Memory Hub, Saberra, Sera, Notion databases, institutional memory extraction, document routing, meeting filing → "Living Memory Steward"; (2) Technology, websites, servers, code, deployments, digital tools, integrations, APIs, app development, system maintenance → "Technology Steward"; (3) Finance, budget, payments, invoices, accounting, expenses, fundraising, grants, bank → "Finance Steward"; (4) Education, learning programs, curriculum, workshops, training, skill development → "Education Steward"; (5) Governance, CCOS policy, circle charters, role definitions, consent proposals, membership policy, organizational structure → "Lead Steward"; (6) Membership, onboarding, community relations, welcoming, recruitment of members → "Lead Steward"; (7) Legal, contracts, permits, compliance, land title, liability → "Lead Steward"; (8) Communications, social media, newsletter, public-facing content, external relationships → the circle whose domain this falls under, or "Lead Steward" if unclear; (9) Land, physical infrastructure, ecology, maintenance, stewardship of the commons → the circle or role explicitly named, or "Lead Steward" if unclear. When the task's circle affiliation is clear from context and a circle-specific role (e.g. "Governance Circle Lead") is implied, use that role name. When in doubt between a person and a role, prefer the role — Teal governance assigns accountabilities to roles, not individuals. Each entry: { "task": string, "owner": string|null (person name only — use when a specific individual is named as responsible, OR when the source sender/organizer clearly committed to performing this action themselves; do NOT default to the sender just because they submitted the email), "assigned_role": string|null (role name — use when ownership falls to a role domain rather than a named individual; infer from the TEAL ROLE INFERENCE GUIDE above when no explicit role is stated; CRITICAL: always use an exact name from the Available CCOS roles list provided in the prompt — never invent a role name not in that list; at least one of owner or assigned_role must be non-null or the task must be skipped), "due_date": string|null (YYYY-MM-DD only), "priority": "High"|"Medium"|"Low", "needs_owner": boolean (true only for High priority items with a clear deadline where no person or role can be inferred — use sparingly, maximum one per source), "canon_impact": boolean (true if this task directly affects governance, policy, or CCOS canon), "purpose_alignment": "Aligned"|"Neutral"|"Misaligned"|"Unclear" (only when a Governing Purpose Statement is provided AND canon_impact is true — omit otherwise), "purpose_alignment_notes": string|null (one sentence — only when a Governing Purpose Statement is provided AND canon_impact is true), "project": string|null (project name this task belongs to — use a name from the existing projects list if it matches semantically, otherwise use a name from project_updates if you created a project in this extraction, otherwise null if truly standalone), "circles": string[] (names of CCOS circles this task belongs to or is accountable to — use circle names from circle_updates or mentioned in the source; empty array if none), "source_evidence": string }. Do not extract vague intentions — only concrete commitments. When multiple tasks clearly belong to the same initiative, set the same project name on all of them and include one entry in project_updates for that initiative.
- "risks": array of risks, concerns, and organizational health warning signals explicitly raised. SEVERITY FLOOR: only extract High or Medium severity risks — skip Low severity entirely. NEVER flag Sera's own processing failures as organizational risks: if an email was truncated, a document was inaccessible, a URL could not be resolved, or Sera could not fetch content — that is a system note for Processing Events, not an org risk. Each entry: { "risk": string (for Collapse Pattern risks, prefix the title with the pattern name in brackets, e.g. "[Burnout] Maria has reported feeling overwhelmed for three consecutive weeks"), "category": "Operational"|"Financial"|"Legal"|"Governance"|"Interpersonal"|"Technical"|"Collapse Pattern"|"Unknown", "collapse_pattern_type": "No Shared Vision"|"Poor Governance"|"Financial Fragility"|"Interpersonal Conflict"|"Burnout"|"Wrong People"|"Scale Trap"|null (required when category is "Collapse Pattern", null otherwise), "severity": "High"|"Medium"|"Low", "owner": string|null (person name only - use when a specific individual is named), "owner_role": string|null (role name responsible for tracking this risk, e.g. 'Risk Steward', 'Circle Lead'; prefer role over person for Teal governance), "suggested_mitigation": string|null, "circles": string[] (names of CCOS circles this risk affects - use circle names from circle_updates or mentioned in the source; empty array if none), "source_evidence": string }. For Collapse Pattern detection: scan the source for early warning signals of organizational collapse and create a separate risk entry for each distinct signal found. The seven collapse patterns in canonical order (use this numbering for reference): 1-No Shared Vision, 2-Poor Governance, 3-Financial Fragility, 4-Interpersonal Conflict, 5-Burnout, 6-Wrong People, 7-Scale Trap. Signal language by pattern - 1-No Shared Vision: disagreement about purpose or direction, "I thought we agreed", "why are we doing this", conflicting interpretations of goals. 2-Poor Governance: "we already decided this", role ambiguity, "who is responsible for", repeated same-type unresolved decisions, governance process bypassed or ignored. 3-Financial Fragility: cash flow concerns, runway language, "we can't afford", vendor payment pressure, urgent fundraising pressure. 4-Interpersonal Conflict: named tension between individuals, "difficult dynamic", "I need to name something", withdrawal or non-participation signals, "there is tension between". 5-Burnout: "overwhelmed", "too much on my plate", recurring missed commitments by the same person, "I can't keep up", extended absences, "I need to step back". 6-Wrong People: skill gap language, "we need someone who can", misalignment between role requirements and holder capabilities, "this isn't working". 7-Scale Trap: "we can't keep up with the volume", "too many meetings", cross-circle coordination failures, "things are falling through the cracks", capacity bottlenecks preventing delivery. Only flag Collapse Pattern risks when the language is explicit and specific - do not flag normal governance tension, routine workload discussions, or ordinary challenges as collapse signals.
- "memory_candidates": array of institutional facts worth preserving long-term. STRICT CRITERIA: only create a memory candidate if the information is (a) relationship context between people or organizations, (b) long-term institutional knowledge not captured elsewhere, (c) historical facts about Amora, (d) process or learning insights that would benefit future members, or (e) ambiguous information with no other structured home. Do NOT create a memory candidate if the same information is already captured as a decision, task, risk, or role assignment in this extraction — those structured records are the authoritative home. NEVER create memory candidates for: email formatting errors, technical glitches, Sera's processing limitations ("cannot process video", "document inaccessible"), routine meeting logistics, attendee lists, arrival or travel details, or personal trivia about individuals that does not bear on their role or Amora work. If the fact would be better as a KB article (a reusable process insight), put it there instead. AIM FOR ZERO OR ONE memory candidate per source — do not generate a list. CONFIDENCE FLOOR: only extract High confidence memory candidates — drop Medium and Low confidence items entirely, do not include them in this array or any other array. Each entry: { "title": string (3-10 word scannable headline — the label, not the full statement. E.g. "Granola used for meeting capture" not the full sentence), "proposed_memory": string (a concise factual statement in third person), "category": "Context"|"Relationship"|"Commitment"|"Decision"|"Learning"|"Process"|"Unknown", "confidence": "High"|"Medium"|"Low", "reviewer": string|null (person who should review this before adding to Living Memory), "risk_if_added": string|null, "risk_if_ignored": string|null, "suggested_destination": string|null (e.g., which document or database should hold this), "related_profile_names": string[] (names of people this memory directly concerns — use exact names from profile_updates or source text; empty array if none), "source_evidence": string }.
- "canon_change_candidates": array of proposed changes to CCOS canon. Each entry: { "title": string (3-10 word scannable headline — the label, not the full proposal text. E.g. "Tiered Write Authority for Sera" not a multi-paragraph description), "proposed_change": string (full detailed proposal text), "affected_area": "Governing Purpose"|"Policy"|"Circle Definition"|"Role Definition"|"Decision Rights"|"Legal Commitment"|"Financial Commitment"|"Land Stewardship"|"CCOS Ledger"|"Public Commitment"|"Unknown", "affected_doc": string|null, "policy_name": string|null (exact name from the provided policies list if this change affects a known Amora policy, otherwise null), "reason": string, "reviewer": string|null (specific person who should approve this change, if known), "admin_review_required": true, "circles": string[] (names of CCOS circles affected by this canon change; infer from governance context even when not explicitly named — e.g. a change to AI Secretary write authority or data routing clearly affects both the Technology &amp; Systems circle and Governance &amp; Coordination circle; a change to a role definition always affects the circle that holds that role; empty array only when there is truly no governance connection), "roles": string[] (names of CCOS roles most directly affected by this change — include roles whose authority, accountabilities, write access, or term conditions would change; also include the role that would own or execute the new policy; infer from the proposal text even when role names are not explicitly stated, e.g. a change about an AI Secretary's write authority affects the "Technology Steward" and "AI Secretary" roles; empty array if no specific roles are affected), "source_evidence": string }. Always set admin_review_required to true.
- "sensitive_flags": array of interpersonal, legal, or reputational concerns requiring discretion. STRICT CRITERIA: only flag when the content involves (a) personal disclosures (health, family, personal hardship), (b) conflict or safety situations between people - not normal governance tension or disagreement, (c) financial disputes involving personal liability, alleged fraud, or financial information explicitly shared in confidence - not routine budget discussions, financial reporting, or project cost estimates, (d) legal matters or liability, (e) confidential organizational information shared in error, or (f) information that would directly harm a named individual's safety, reputation, or livelihood if made public - requires a specific identifiable person and a specific articulable harm, not merely uncomfortable or embarrassing content. Do NOT flag: email formatting errors, technical glitches, meeting logistics, emoji rendering issues, general meeting content, governance tensions, interpersonal frustrations, or disagreements that are part of normal teal self-management (these belong in ccos_ledger_entries), or anything already captured as a risk. Each entry: { "issue": string (specific description of the sensitive content), "reason": string (why this requires discretion), "recommended_handling": string, "related_profile_names": string[] (names of people directly involved — use exact names from profile_updates or source text; empty array if none) }.
- "ccos_ledger_entries": array of CCOS governance actions. Each entry: { "entry": string, "ledger_type": "Tension"|"Proposal"|"Decision"|"Role"|"Policy"|"Resource"|"Accountability", "circle": string|null (name of the circle this entry belongs to), "role": string|null (role involved if applicable), "review_required": boolean, "source_evidence": string }. Only extract when a clear CCOS governance action has occurred — tension raised, proposal made, decision logged, role changed, or policy defined.
- "kb_articles": array of knowledge base articles worth preserving as reusable guidance. ONLY include when the source contains clear how-to instructions, best practices, process documentation, tool guides, or educational content that would help a community member do something. Do NOT create kb_articles for meeting minutes, one-off decisions, tasks, or personal updates. Each entry: { "title": string (specific, action-oriented title like "How to Export Granola Notes for the Living Memory Hub"), "category": "How-To"|"Best Practice"|"Process"|"Technology"|"Governance"|"Community"|"Land & Ecology"|"Finance"|"Learning"|"Wellness"|"General", "audience": array of zero or more values from ["All Members","Leadership","New Members","Circle Leads","Tech Team"], "summary": string (2-3 sentences describing what this article covers and why it matters), "key_points": string (the most important guidance as a plain text list, one point per line), "confidence": "High"|"Medium"|"Low" (High = clearly written guidance; Medium = inferred best practice; Low = passing mention only), "circles": string[] (names of CCOS circles this article is most relevant to — empty array if general-purpose), "source_evidence": string }. Never return Low confidence articles — skip them entirely.
- "tensions": array of tensions raised — gaps between what is and what could be. A tension is a signal that something needs to change, surfaced by a person or circle. Distinct from risks (threats from the outside) and decisions (resolved choices). Extract when someone explicitly names a problem or gap: "I notice that...", "something isn't working about...", "I sense that...", "we need to address...", "there's friction around...", "I've been wanting to raise that...". Do not extract routine agenda items, background discussion, or general status updates as tensions. Aim for zero to three per source — extract only named, articulated tensions, not inferred ones. Each entry: { "tension": string (a clear one-sentence statement of the gap, written in third person), "type": "Governance"|"Operational"|"Relational"|"Structural", "sensed_by": string|null (person who named it — exact name), "sensing_circle": string|null (circle where it surfaced, if named), "source_evidence": string }.
- "agreements": array of explicit ongoing inter-party agreements. Distinct from tasks (one-time actions) and decisions (choices made). An agreement is an ongoing commitment between two or more parties — e.g. "Circle A will always consult Circle B before X", "person A and B will hold a weekly sync", "the Finance circle agrees to provide monthly reports". Only extract when parties explicitly commit to an ongoing arrangement with ongoing force. Do not extract one-off task commitments ("I will send you the doc by Friday") — those belong in tasks. Each entry: { "agreement_title": string (3-8 words), "terms": string (full statement of what was agreed), "parties": string[] (names of people involved — exact names), "circles": string[] (names of circles involved), "type": "Interpersonal"|"Inter-Circle"|"External"|"Org-Wide", "effective_date": string|null (YYYY-MM-DD), "review_date": string|null (YYYY-MM-DD — when to revisit), "source_evidence": string }.
- "gratitudes": array of explicit appreciations expressed by one person toward another. Extract when someone says "I want to appreciate...", "I'm grateful to...", "I want to acknowledge...", "thank you to X for Y", or equivalent language. Do not extract generic praise or group-level thank-yous with no specific giver or receiver. Each entry: { "from": string (name of person giving appreciation — exact name), "to": string (name of person being appreciated — exact name), "appreciation": string (what they are being appreciated for, in one or two sentences), "circle": string|null (circle context where this was expressed), "source_evidence": string }.
- "events": array of community gatherings, ceremonies, or shared experiences. Extract when a specific named event is announced, planned, or described in the source. Do not extract governance meetings (those are already captured in Meetings). Each entry: { "event_name": string, "type": "Community Dinner"|"Ceremony"|"Workshop"|"Learning Circle"|"Celebration"|"Work Party"|"Retreat"|"Other", "date": string|null (YYYY-MM-DD), "end_date": string|null (YYYY-MM-DD), "location": string|null, "description": string|null (1-2 sentences), "organizing_circle": string|null, "organizer": string|null (person name), "source_evidence": string }.
- "retrospectives": array of structured retrospective or lookback reviews. Only extract when a meeting or document is clearly structured as a retrospective (end-of-cycle, end-of-project, or explicit "what worked / what didn't" format). Do not extract from regular meeting notes. Each entry: { "title": string (e.g. "Governance Circle Q2 2026 Retrospective"), "circle": string|null, "retro_date": string|null (YYYY-MM-DD), "period_covered": string|null (e.g. "Q2 2026" or "May-June 2026"), "what_worked": string|null (2-5 sentences), "what_didnt_work": string|null (2-5 sentences), "what_to_change": string|null (concrete proposals), "energy_level": "High"|"Good"|"Neutral"|"Low"|"Critical"|null (overall team energy at time of retro), "celebrations": string|null (things worth celebrating from this period), "source_evidence": string }.
`;

function buildUserPrompt(input: ExtractionInput): string {
  const projectsLine = input.existingProjects?.length
    ? `Existing active projects (use exact names when matching): ${input.existingProjects.join(', ')}`
    : 'Existing active projects: none yet';
  const policiesLine = input.existingPolicies?.length
    ? `Existing Amora policies (use exact names in policy_name when matching): ${input.existingPolicies.join(', ')}`
    : 'Existing Amora policies: none yet';
  const profilesLine = input.existingProfiles?.length
    ? `Existing profiles (CRITICAL NAME NORMALIZATION RULES — follow strictly to prevent duplicates):\n${input.existingProfiles.join(', ')}\n\nKnown aliases and nicknames (always resolve these to the canonical name above):\n${buildAliasHints()}\n\nRules: (1) If you see a person by first name only, nickname, or partial name, use their full canonical name from this list. (2) If a last name matches someone in this list but the first name is uncertain, unclear, or could be a transcription variant, use the canonical name from this list — do NOT invent a new first name. (3) Never create a profile for someone who already appears in this list under a different name variant. (4) If a name matches any alias in the Known aliases list above, always use the canonical name instead. When in doubt, prefer the existing canonical name.`
    : 'Existing profiles: none yet';
  const rolesLine = input.existingRoles?.length
    ? `Available CCOS roles — CRITICAL: assigned_role must be an EXACT name from this list, or null. Do not invent role names not listed here. Use the domain inference guide in the system instructions to pick the best match: ${input.existingRoles.join(', ')}`
    : 'Available CCOS roles: use descriptive steward role names (e.g. "Technology Steward", "Finance Steward")';
  const purposeSection = input.governingPurpose
    ? `\nGOVERNING PURPOSE STATEMENT (organizational highest authority — evaluate all decisions and canon changes for alignment):\n${input.governingPurpose}${input.purposeTest ? `\n\nOne-sentence decision test: ${input.purposeTest}` : ''}\n`
    : '';
  return `Source Type: ${input.sourceType}
Source Title: ${input.sourceTitle}
Source Date: ${input.sourceDate}
Source Sender/Organizer: ${input.sourceActor}
Related Project/Circle if known: ${input.relatedContext}
${projectsLine}
${policiesLine}
${profilesLine}
${rolesLine}
${input.recentContext ? `\n${input.recentContext}` : ''}${purposeSection}

Content:
${input.sourceText}

Return JSON only.`;
}

// Max chars to send to Claude in one call (~100k tokens of headroom)
const MAX_CHARS = 300_000;

// ─── ClaudeExtractionService ──────────────────────────────────────────────────

const FALLBACK_MODEL = 'claude-haiku-4-5-20251001';

export class ClaudeExtractionService {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly governingPurpose: string | null;
  private readonly purposeTest: string | null;

  constructor() {
    const config = getConfig();
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY,
      maxRetries: 3,
      timeout: 120_000,
    });
    this.model = config.CLAUDE_MODEL;
    // Seed from env vars; HubSettingsService will override with live Notion values
    this.governingPurpose = config.AMORA_GOVERNING_PURPOSE ?? null;
    this.purposeTest = config.AMORA_PURPOSE_TEST ?? null;
  }

  // ─── Extract ──────────────────────────────────────────────────────────────

  async extract(input: ExtractionInput): Promise<{ data: Record<string, unknown>; tokens: number } | null> {
    // Inject governing purpose from config unless caller already provided one
    const hub = HubSettingsService.getInstance();
    const resolvedInput: ExtractionInput = {
      ...input,
      governingPurpose: input.governingPurpose ?? hub.governingPurpose ?? this.governingPurpose ?? undefined,
      purposeTest: input.purposeTest ?? hub.purposeTest ?? this.purposeTest ?? undefined,
    };
    let totalTokens = 0;
    const wasTruncated = resolvedInput.sourceText.length > MAX_CHARS;
    const truncatedInput = {
      ...resolvedInput,
      sourceText: wasTruncated
        ? resolvedInput.sourceText.slice(0, MAX_CHARS) + '\n\n[NOTE: This source was truncated at 300,000 characters. Content after this point was NOT included. Extract only from what is shown above.]'
        : resolvedInput.sourceText,
    };

    if (wasTruncated) {
      logger.warn(
        { originalLength: input.sourceText.length, truncatedTo: MAX_CHARS, title: input.sourceTitle },
        'Source text truncated - content past limit was NOT extracted; consider splitting long transcripts',
      );
    }

    // Try primary model, fall back to Haiku if unavailable
    let result = await this.callClaude(truncatedInput);
    if (!result) {
      logger.warn({ primary: this.model, fallback: FALLBACK_MODEL }, 'Primary model unavailable — trying fallback');
      result = await this.callClaude(truncatedInput, FALLBACK_MODEL);
    }
    if (!result) return null;
    totalTokens += result.tokens;

    const parsed = this.parseJson(result.text);
    if (!parsed) {
      // One repair attempt with fallback model
      logger.warn('Claude returned invalid JSON — retrying with repair hint');
      const repairHint = `${buildUserPrompt(truncatedInput)}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY valid JSON with no markdown, no explanation, no code fences.`;
      const retryResult = await this.callClaudeRaw(SYSTEM_PROMPT, repairHint, FALLBACK_MODEL);
      if (!retryResult) return null;
      totalTokens += retryResult.tokens;
      const retryParsed = this.parseJson(retryResult.text);
      if (!retryParsed) {
        logger.error('Claude repair attempt also returned invalid JSON — routing to Manual Review');
        return null;
      }
      const validated = this.validateAndReturn(retryParsed);
      return validated ? { data: validated, tokens: totalTokens } : null;
    }

    const validated = this.validateAndReturn(parsed);
    if (!validated) {
      // One repair attempt for schema violations (e.g. null where object expected)
      const schemaErrors = validateSchema.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ') ?? 'unknown';
      logger.warn({ schemaErrors }, 'Schema validation failed — retrying with repair hint');
      const repairHint = `${buildUserPrompt(truncatedInput)}\n\nIMPORTANT: Your previous response had schema errors: ${schemaErrors}. Return ONLY valid JSON. Never use null for object fields — use an empty object {} or omit the field entirely instead.`;
      const retryResult = await this.callClaudeRaw(SYSTEM_PROMPT, repairHint, FALLBACK_MODEL);
      if (!retryResult) return null;
      totalTokens += retryResult.tokens;
      const retryParsed = this.parseJson(retryResult.text);
      if (!retryParsed) return null;
      const retryValidated = this.validateAndReturn(retryParsed);
      return retryValidated ? { data: retryValidated, tokens: totalTokens } : null;
    }
    return { data: validated, tokens: totalTokens };
  }

  private async callClaude(input: ExtractionInput, model?: string): Promise<{ text: string; tokens: number } | null> {
    return this.callClaudeRaw(SYSTEM_PROMPT, buildUserPrompt(input), model);
  }

  private async callClaudeRaw(systemPrompt: string, userPrompt: string, model?: string): Promise<{ text: string; tokens: number } | null> {
    try {
      const response = await this.client.messages.create({
        model: model ?? this.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') return null;

      const tokens = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
      return { text: content.text.trim(), tokens };
    } catch (err) {
      logger.error({ err }, 'Claude API call failed');
      return null;
    }
  }

  private parseJson(text: string): Record<string, unknown> | null {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private validateAndReturn(data: Record<string, unknown>): Record<string, unknown> | null {
    const valid = validateSchema(data);
    if (!valid) {
      const errors = validateSchema.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ');
      logger.warn({ errors }, 'Claude JSON failed schema validation');
      return null;
    }
    return data;
  }

  // ─── Role card generation ─────────────────────────────────────────────────

  /** Generated role card sections returned by Claude. */
  private static readonly ROLE_CARD_SYSTEM = `You generate comprehensive Teal-aligned role card sections for Amora, a regenerative community in Diamante Valley, Costa Rica. Amora uses Saberra (AI institutional memory system, powered by Notion) for all governance records. Governance follows CCOS (Consent-based Circle Operating System). Never use em dashes (—); use hyphens (-) instead. Return only valid JSON.`;

  async generateRoleCardBody(role: {
    role_name: string;
    circle?: string | null;
    role_type?: string | null;
    purpose?: string | null;
    accountabilities?: string | null;
    domains?: string | null;
    term_length?: string | null;
    assignment_method?: string | null;
  }): Promise<Record<string, unknown> | null> {
    const userPrompt = `Generate a complete CCOS role card for this Amora role:

Role Name: ${role.role_name}
Circle: ${role.circle ?? 'TBD'}
Role Type: ${role.role_type ?? 'Custom Role'}
Purpose: ${role.purpose ?? '(not yet defined)'}
Accountabilities: ${role.accountabilities ?? '(not yet defined)'}
Domains: ${role.domains ?? '(not yet defined)'}
Term Length: ${role.term_length ?? '1 Year'}
Assignment Method: ${role.assignment_method ?? 'Consent Election'}

Return JSON with exactly these keys:
{
  "regenerative_stewardship": "(string) 2-3 sentences on how this role expresses Amora's regenerative mission and Teal values",
  "responsibilities": ["(5-7 specific key responsibilities, more detailed than accountabilities, each a complete sentence)"],
  "authorities_decide": ["(2-3 things this role can decide autonomously without circle consent)"],
  "authorities_propose": ["(2-3 things this role must bring to the circle for consent before acting)"],
  "authorities_block": ["(1-2 actions or decisions this role can pause or flag for review)"],
  "arc_awareness": "(string) 2-3 sentences on the quality of attention this specific role requires - what must the holder notice about themselves, others, and the system?",
  "arc_reciprocity": "(string) 2-3 sentences on what this role receives from the community and what it gives back - the exchange that makes it sustainable",
  "arc_choice": "(string) 2-3 sentences on the choices this role holds and how to exercise that authority consciously and with humility",
  "kpis": ["(4-6 measurable success indicators with specific targets or trends where meaningful)"],
  "time_commitment": "(string) 1 sentence on weekly hours and rhythm, noting seasonal variation if relevant",
  "energy_check": "(string) 2-3 sentences on how the holder sustains themselves in this role - specific risks and practices for this role type",
  "tools": ["(4-8 tools, platforms, or resources this role actively uses)"],
  "conflict_resolution": "(string) 1-2 sentences on how tensions in this role are handled using CCOS process",
  "feedback": "(string) 1-2 sentences on peer feedback cadence and professional development support",
  "succession": "(string) 1-2 sentences on minimum handover requirements when this role transitions",
  "core_values": "(string) 5-7 Teal core values each expressed as 'ValueName: one sentence on how this role embodies it', separated by periods",
  "review_adaptation": "(string) 1-2 sentences on the role review cadence, signals that indicate the role should adapt or dissolve, and what success looks like if the role is no longer needed",
  "policy_legal_compliance": "(string) 1-3 sentences naming the specific CCOS policies, legal frameworks, and applicable standards this role operates under"
}`;

    const language = HubSettingsService.getInstance().outputLanguage;
    const langInstruction = language && language !== 'English'
      ? ` Generate all JSON string values in ${language}. JSON keys must remain exactly as specified in English. Proper nouns (names of people, places, and organizations) may remain in their original form.`
      : '';
    const result = await this.callClaudeRaw(
      ClaudeExtractionService.ROLE_CARD_SYSTEM + langInstruction,
      userPrompt,
      this.model,
    );
    if (!result) {
      logger.warn({ role: role.role_name }, 'Role card generation returned null - using placeholder template');
      return null;
    }
    const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      logger.warn({ role: role.role_name }, 'Role card generation returned invalid JSON - using placeholder template');
      return null;
    }
  }

  private static readonly CIRCLE_CHARTER_SYSTEM = `You generate comprehensive Teal-aligned circle charter sections for Amora, a regenerative community in Diamante Valley, Costa Rica using CCOS governance. Never use em dashes (—); use hyphens (-) instead. Return only valid JSON.`;

  async generateCircleCharterBody(circle: {
    circle_name: string;
    purpose?: string | null;
    accountabilities?: string | null;
    domains?: string | null;
    kpis?: string | null;
    meeting_cadence?: string | null;
  }): Promise<Record<string, unknown> | null> {
    const userPrompt = `Generate comprehensive circle charter sections for this Amora CCOS circle:

Circle Name: ${circle.circle_name}
Purpose: ${circle.purpose ?? '(not yet defined)'}
Accountabilities: ${circle.accountabilities ?? '(not yet defined)'}
Domains: ${circle.domains ?? '(not yet defined)'}
KPIs: ${circle.kpis ?? '(not yet defined)'}
Meeting Cadence: ${circle.meeting_cadence ?? '(not yet defined)'}

Return JSON with exactly these keys:
{
  "regenerative_stewardship": "(string) 2-3 sentences on how this circle expresses Amora's regenerative mission and Teal values",
  "responsibilities": ["(5-7 specific ongoing responsibilities, each a complete sentence starting with a verb)"],
  "authorities": ["(3-5 things this circle can decide or do autonomously without governance consent)"],
  "time_commitment": "(string) 1-2 sentences on typical weekly time for lead and supporting roles",
  "tools": ["(4-7 tools, platforms, or resources this circle actively uses)"],
  "conflict_resolution": "(string) 1-2 sentences on how tensions within this circle are handled using CCOS process",
  "feedback_mechanisms": "(string) 1-2 sentences on how feedback is gathered internally and from other circles",
  "checks_and_balances": "(string) 2-3 sentences on what safeguards exist to prevent concentration of power or unchecked decisions",
  "succession_notes": "(string) 1-2 sentences on minimum handover requirements for key circle roles",
  "core_values": "(string) 5-7 Teal core values each expressed as 'ValueName: one sentence on how this circle embodies it', separated by periods",
  "wholeness_practices": "(string) 2-3 specific practices this circle uses to support member wellbeing",
  "living_agreement": "(string) 5-7 short principles this circle commits to, each starting with 'We'",
  "meta_core_operating_principles": "(string) Express each of Amora's 3 meta principles for this circle: Resilience (how this circle builds redundancy and avoids single-point failure), Planetary Nesting (how decisions consider ecological and social ripple effects beyond Amora's land), and Future Generations (how documentation and mentorship ensure the next generation can inherit and evolve this circle's work). One sentence per principle, separated by periods.",
  "review_cadence": "(string) One of: Monthly, Quarterly, Semi-Annual, Annual, As Needed - choose based on the circle's governance complexity and how frequently its domains need formal review",
  "review_adaptation": "(string) 2-3 sentences covering the charter review cadence, what triggers adaptation, and what happens if the circle is no longer needed",
  "policy_legal_compliance": "(string) 1-3 sentences naming the specific Amora policies, Costa Rican legal frameworks, and any applicable standards this circle operates under",
  "closing_statement": "(string) 2-3 sentence italicized closing that names what this circle holds, the condition under which it exists, and what success looks like when its purpose is fully realized - written in present tense, poetic and grounded"
}`;

    const language = HubSettingsService.getInstance().outputLanguage;
    const langInstruction = language && language !== 'English'
      ? ` Generate all JSON string values in ${language}. JSON keys must remain exactly as specified in English. Proper nouns (names of people, places, and organizations) may remain in their original form.`
      : '';
    const result = await this.callClaudeRaw(
      ClaudeExtractionService.CIRCLE_CHARTER_SYSTEM + langInstruction,
      userPrompt,
      this.model,
    );
    if (!result) {
      logger.warn({ circle: circle.circle_name }, 'Circle charter generation returned null');
      return null;
    }
    const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      logger.warn({ circle: circle.circle_name }, 'Circle charter generation returned invalid JSON');
      return null;
    }
  }

  // ─── Write extraction results to Notion ──────────────────────────────────

  async writeToNotion(
    notion: NotionWriterService,
    extraction: Record<string, unknown>,
    sourceMeetingPageId: string | null,
    sourceEmailPageId: string | null,
    sourceDate: string,
    sourceDocUrl: string | null = null,
  ): Promise<{ createdRecords: string[]; canonReviewRequired: boolean; sensitiveReviewRequired: boolean; sensitiveRecordIds: string[]; canonRecordIds: string[] }> {
    const created: string[] = [];
    let canonReviewRequired = false;
    let sensitiveReviewRequired = false;
    const sensitiveRecordIds: string[] = [];
    const canonRecordIds: string[] = [];
    // Truncate full-text to a short title if Claude didn't provide one
    const shortLabel = (text: string | undefined, fallback: string, max = 80): string => {
      if (!text) return fallback;
      const s = text.split(/[.!?\n]/)[0]?.trim() ?? text.trim();
      return s.length <= max ? s : s.slice(0, max - 1) + '…';
    };

    const data = extraction as {
      decisions?: Array<{ decision: string; status: string; source_evidence: string; decision_maker?: string; decision_maker_role?: string | null; reviewer?: string; canon_impact?: boolean; review_required?: boolean; purpose_alignment?: string; purpose_alignment_notes?: string; circles?: string[] }>;
      tasks?: Array<{ task: string; owner?: string; assigned_role?: string | null; due_date?: string; priority: string; source_evidence: string; needs_owner?: boolean; canon_impact?: boolean; purpose_alignment?: string; purpose_alignment_notes?: string | null; project?: string | null; circles?: string[] }>;
      risks?: Array<{ risk: string; category?: string; severity: string; source_evidence: string; suggested_mitigation?: string; owner?: string; owner_role?: string | null; circles?: string[] }>;
      memory_candidates?: Array<{ title: string; proposed_memory: string; category?: string; source_evidence: string; confidence: string; reviewer?: string; risk_if_added?: string; risk_if_ignored?: string; suggested_destination?: string; related_profile_names?: string[] }>;
      canon_change_candidates?: Array<{ title: string; affected_area: string; affected_doc?: string; proposed_change: string; reason: string; reviewer?: string; source_evidence: string; admin_review_required?: boolean; circles?: string[]; roles?: string[] }>;
      sensitive_flags?: Array<{ issue: string; reason: string; recommended_handling: string; related_profile_names?: string[] }>;
      profile_updates?: Array<{ name: string; profile_type?: string; email?: string; role_title?: string; role_at_amora?: string; organization?: string; circle_affiliation?: string[]; tags?: string[]; location?: string; website?: string; linkedin?: string; relationship_to_amora?: string; membership_type?: string; engagement_status?: string; primary_sector?: string; context_notes?: string; referred_by?: string; source_evidence?: string }>;
      project_updates?: Array<{ project_name: string; status?: string; circle?: string; project_lead?: string; priority?: string; start_date?: string; target_date?: string; description?: string; primary_sector?: string; source_evidence?: string }>;
      circle_updates?: Array<{ circle_name: string; sector?: string; purpose?: string; domains?: string; accountabilities?: string; kpis?: string; meeting_cadence?: string; review_cadence?: string; last_review_date?: string; circle_lead?: string; rep_steward?: string; parent_circle?: string; status?: string; source_evidence?: string }>;
      role_updates?: Array<{ role_name: string; circle?: string; role_type?: string; purpose?: string; domains?: string; accountabilities?: string; term_length?: string; assignment_method?: string; last_audit_date?: string; status?: string; source_evidence?: string }>;
      role_assignment_updates?: Array<{ role_name: string; holder_name: string; circle?: string; assignment_type?: string; status?: string; start_date?: string; end_date?: string; term_length?: string; energization_level?: string; source_evidence?: string }>;
      ccos_ledger_entries?: Array<{ ledger_type: string; entry: string; source_evidence: string; review_required?: boolean; circle?: string; role?: string }>;
      kb_articles?: Array<{ title: string; category: string; audience?: string[]; summary: string; key_points: string; confidence: string; circles?: string[]; source_evidence: string }>;
      tensions?: Array<{ tension: string; type?: string; sensed_by?: string; sensing_circle?: string; source_evidence?: string }>;
      agreements?: Array<{ agreement_title: string; terms?: string; parties?: string[]; circles?: string[]; type?: string; effective_date?: string; review_date?: string; source_evidence?: string }>;
      gratitudes?: Array<{ from: string; to: string; appreciation?: string; circle?: string; source_evidence?: string }>;
      events?: Array<{ event_name: string; type?: string; date?: string; end_date?: string; location?: string; description?: string; organizing_circle?: string; organizer?: string; source_evidence?: string }>;
      retrospectives?: Array<{ title: string; circle?: string; retro_date?: string; period_covered?: string; what_worked?: string; what_didnt_work?: string; what_to_change?: string; energy_level?: string; celebrations?: string; source_evidence?: string }>;
      meeting_summary?: { short: string; detailed: string; participants?: string[]; circles?: string[]; confidence: string };
    };

    // ID maps — populated as entities are created/upserted so later entities can link back
    const profileIdMap = new Map<string, string>(); // name.toLowerCase() → pageId
    const circleIdMap  = new Map<string, string>();
    const roleIdMap    = new Map<string, string>();
    const projectIdMap = new Map<string, string>();
    const policyIdMap  = new Map<string, string>();

    // Resolve a name to a Notion page ID: check local map first, then query the DB.
    const resolve = async (
      map: Map<string, string>,
      dbId: string,
      titleProp: string,
      name: string | null | undefined,
    ): Promise<string | null> => {
      if (!name?.trim()) return null;
      const key = name.trim().toLowerCase();
      if (map.has(key)) return map.get(key)!;
      const id = await notion.findByTitle(dbId, titleProp, name.trim());
      if (id) map.set(key, id);
      return id;
    };

    // Resolve active Role Assignment holders for a role — supports multi-holder Teal roles
    const resolveRoleHolders = async (roleId: string): Promise<string[]> => {
      try {
        const assignments = await notion.queryDatabase(
          notion.dbIds.roleAssignments,
          { and: [
            { property: 'Role', relation: { contains: roleId } } as never,
            { property: 'Status', select: { equals: 'Active' } },
          ] } as never,
          10,
        );
        const holderIds: string[] = [];
        for (const a of assignments) {
          const holderProp = (a.properties['Role Holder'] as { type: string; relation?: Array<{ id: string }> } | undefined);
          if (holderProp?.type === 'relation') {
            for (const rel of (holderProp.relation ?? [])) {
              if (rel.id) holderIds.push(rel.id);
            }
          }
        }
        return holderIds;
      } catch {
        return [];
      }
    };

    // Deferred queues — relations that can only be written after their target is created
    const roleAtAmoraQueue:       Array<{ profileId: string; roleName: string }> = [];
    const circleMembershipsQueue: Array<{ profileId: string; circleNames: string[] }> = [];
    const organizationQueue:      Array<{ profileId: string; orgName: string }> = [];
    const referredByQueue:        Array<{ profileId: string; referrerName: string }> = [];

    const today = new Date().toISOString().slice(0, 10);
    const termOptions       = ['No Term', '3 Months', '6 Months', '1 Year', 'Custom'];
    const roleTypeOptions   = ['Lead Steward', 'Rep Steward', 'Admin Facilitator', 'AI Secretary', 'Custom Role'];
    const assignMethodOpts  = ['Consent Election', 'Appointed', 'Volunteer', 'Interim'];
    const assignTypeOptions = ['Consent Election', 'Appointed', 'Interim', 'Volunteer'];
    const sectorOptions     = ['Sector 1 — Health & Holistic Wellness', 'Sector 2 — Governance & Justice', 'Sector 3 — Culture & Spirit', 'Sector 4 — Learning & Innovation', 'Sector 5 — Ecology & Infrastructure', 'Sector 6 — Economy & Exchange', 'Sector 7 — Media & Technology'];

    // ── 1. Profiles (must be first — everything else references them)
    for (let p of (Array.isArray(data.profile_updates) ? data.profile_updates : [])) {
      if (!p.name) continue;
      try {
        // Layer 1: deterministic alias resolution — catches known nicknames and name variants
        // before any Notion query runs, preventing duplicate profile creation at the source.
        const resolvedName = resolveCanonicalName(p.name);
        if (resolvedName !== p.name) {
          logger.info({ submitted: p.name, canonical: resolvedName }, 'Profile alias map: normalized to canonical name');
          p = { ...p, name: resolvedName };
        }

        const circleAffiliation = Array.isArray(p.circle_affiliation)
          ? p.circle_affiliation.filter(Boolean).map(String)
          : [];
        // Layer 2: exact name match
        const existingByName = await notion.findByTitle(notion.dbIds.profiles, 'Name', p.name);
        // Layer 3: email match (most reliable cross-name dedup)
        const existingByEmail = (!existingByName && p.email)
          ? await notion.findByEmail(notion.dbIds.profiles, 'Email', p.email)
          : null;
        const nameParts = p.name.trim().split(/\s+/);
        const lastName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : null;
        // Layer 4: last-name fuzzy match — catches transcription variants like "Kai Keenan" vs "Kyleen Keenan"
        let existingByLastName: string | null = null;
        if (!existingByName && !existingByEmail && lastName) {
          const lastNameMatches = await notion.findProfilesByLastName(lastName);
          // Filter out [DUP] profiles; only merge when exactly one active profile shares this last name
          const activeMatches = lastNameMatches.filter(m => !m.name.startsWith('[DUP]'));
          const differentFirstName = activeMatches.filter(m => m.name.toLowerCase() !== p.name.toLowerCase());
          if (differentFirstName.length === 1) {
            existingByLastName = differentFirstName[0].id;
            logger.warn({ submitted: p.name, canonical: differentFirstName[0].name }, 'Profile last-name dedup: merging into existing record');
          }
        }
        // Layer 5: first-name-only fallback — catches single-word names like "Jess", "Ariana"
        // that slip past the alias map (e.g. a new nickname we haven't added yet)
        let existingByFirstName: string | null = null;
        if (!existingByName && !existingByEmail && !existingByLastName && nameParts.length === 1) {
          const firstNameMatches = await notion.findProfilesByFirstName(p.name);
          const activeMatches = firstNameMatches.filter(m => !m.name.startsWith('[DUP]') && m.name.toLowerCase() !== p.name.toLowerCase());
          if (activeMatches.length === 1) {
            existingByFirstName = activeMatches[0].id;
            logger.warn({ submitted: p.name, canonical: activeMatches[0].name }, 'Profile first-name dedup: merging single-word name into existing record');
          }
        }
        const existing = existingByName ?? existingByEmail ?? existingByLastName ?? existingByFirstName;
        // True when found by email but not by name — means we can safely upgrade a short name
        const foundByEmail = !existingByName && !!existingByEmail;
        const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean).map(String) : [];
        const relToAmora = sanitizeSelect(
          p.relationship_to_amora,
          ['Member', 'Partner', 'Vendor', 'Advisor', 'Funder', 'Contact', 'Community', 'Alumni', 'Government', 'Unknown'],
          'Unknown',
        );
        let profileId: string;
        if (existing) {
          const relToAmoraUpdate = p.relationship_to_amora ? sanitizeSelect(
            p.relationship_to_amora,
            ['Member', 'Partner', 'Vendor', 'Advisor', 'Funder', 'Contact', 'Community', 'Alumni', 'Government', 'Unknown'],
            'Unknown',
          ) : null;
          const sectorUpdate = p.primary_sector && sectorOptions.includes(p.primary_sector) ? p.primary_sector : null;
          await notion.updatePage(existing, {
            // When found by email match, the stored name may be shorter (e.g. "Kyleen" vs "Kyleen Keenan") — upgrade it
            ...(foundByEmail ? { Name: N.title(p.name) } : {}),
            ...(p.email ? { Email: { email: p.email } } : {}),
            ...(p.profile_type ? { 'Profile Type': N.select(sanitizeSelect(p.profile_type, ['Person', 'Organization', 'Both'], 'Person')) } : {}),
            ...(relToAmoraUpdate ? { 'Relationship to Amora': N.select(relToAmoraUpdate) } : {}),
            ...(p.role_title ? { 'Role / Title': N.richText(p.role_title) } : {}),
            ...(p.location ? { Location: N.richText(p.location) } : {}),
            ...(p.website ? { Website: N.url(p.website) } : {}),
            ...(p.linkedin ? { LinkedIn: N.url(p.linkedin) } : {}),
            ...(p.context_notes ? { 'Context Summary': N.richText(p.context_notes) } : {}),
            ...(tags.length ? { Tags: N.multiSelect(tags) } : {}),
            ...(sectorUpdate ? { 'Primary Sector': N.select(sectorUpdate) } : {}),
            ...(p.membership_type ? { 'Membership Type': N.select(sanitizeSelect(p.membership_type, ['Founding Member', 'Full Member', 'Associate Member', 'Guest', 'Steward', 'Partner'], 'Full Member')) } : {}),
            'Engagement Status': N.select('Active'),
            'Last Seen': N.date(today),
          });
          profileId = existing;
          created.push(`Profile:${existing}(updated)`);
        } else {
          const sectorCreate = p.primary_sector && sectorOptions.includes(p.primary_sector) ? p.primary_sector : null;
          profileId = await notion.createPage(notion.dbIds.profiles, {
            Name: N.title(p.name),
            'Profile Type': N.select(sanitizeSelect(p.profile_type, ['Person', 'Organization', 'Both'], 'Person')),
            ...(p.email ? { Email: { email: p.email } } : {}),
            ...(p.role_title ? { 'Role / Title': N.richText(p.role_title) } : {}),
            ...(tags.length ? { Tags: N.multiSelect(tags) } : {}),
            ...(p.location ? { Location: N.richText(p.location) } : {}),
            ...(p.website ? { Website: N.url(p.website) } : {}),
            ...(p.linkedin ? { LinkedIn: N.url(p.linkedin) } : {}),
            'Relationship to Amora': N.select(relToAmora),
            'Engagement Status': N.select('Active'),
            ...(sectorCreate ? { 'Primary Sector': N.select(sectorCreate) } : {}),
            ...(p.membership_type ? { 'Membership Type': N.select(sanitizeSelect(p.membership_type, ['Founding Member', 'Full Member', 'Associate Member', 'Guest', 'Steward', 'Partner'], 'Full Member')) } : {}),
            ...(p.context_notes ? { 'Context Summary': N.richText(p.context_notes) } : {}),
            ...(p.source_evidence ? { Source: N.richText(p.source_evidence) } : {}),
            'Sensitive Notes Flag': N.checkbox(false),
            'First Seen': N.date(today),
            'Last Seen': N.date(today),
          });
          created.push(`Profile:${profileId}`);
        }
        profileIdMap.set(p.name.trim().toLowerCase(), profileId);
        if (p.role_at_amora) roleAtAmoraQueue.push({ profileId, roleName: p.role_at_amora });
        if (circleAffiliation.length) circleMembershipsQueue.push({ profileId, circleNames: circleAffiliation });
        if (p.organization) organizationQueue.push({ profileId, orgName: p.organization });
        if (p.referred_by)  referredByQueue.push({ profileId, referrerName: p.referred_by });
      } catch (err) {
        logger.warn({ err, name: p.name }, 'Profile write failed — skipping');
      }
    }

    // Flush organization and referred-by relations (per-item isolated — one failure never blocks others)
    for (const { profileId, orgName } of organizationQueue) {
      try {
        const orgId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', orgName);
        if (orgId) await notion.updatePage(profileId, { Organization: N.relation([orgId]) });
      } catch {}
    }
    for (const { profileId, referrerName } of referredByQueue) {
      try {
        const referrerId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', referrerName);
        if (referrerId) await notion.updatePage(profileId, { 'Referred By': N.relation([referrerId]) });
      } catch {}
    }

    // ── 2. Circles (needs profiles for Circle Lead)
    for (const c of (Array.isArray(data.circle_updates) ? data.circle_updates : [])) {
      if (!c.circle_name) continue;
      try {
        const existing = await notion.findByTitle(notion.dbIds.circles, 'Circle Name', c.circle_name);
        const status = sanitizeSelect(c.status, ['Active', 'Proposed', 'Inactive', 'Archived'], 'Active');
        const circleLeadId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', c.circle_lead);
        const repStewardId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', c.rep_steward);
        const props: Record<string, unknown> = {
          Status: N.select(status),
          ...(c.sector ? { Sector: N.select(sanitizeSelect(c.sector, sectorOptions, sectorOptions[4])) } : {}),
          ...(c.purpose ? { Purpose: N.richText(c.purpose) } : {}),
          ...(c.domains ? { Domains: N.richText(c.domains) } : {}),
          ...(c.accountabilities ? { Accountabilities: N.richText(c.accountabilities) } : {}),
          ...(c.kpis ? { KPIs: N.richText(c.kpis) } : {}),
          ...(c.meeting_cadence ? { 'Meeting Cadence': N.richText(c.meeting_cadence) } : {}),
          ...(c.review_cadence ? { 'Review Cadence': N.select(sanitizeSelect(c.review_cadence, ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed'], 'Quarterly')) } : {}),
          'Last Review Date': N.date(sanitizeDate(c.last_review_date) ?? sourceDate),
          ...(circleLeadId ? { 'Circle Lead': N.relation([circleLeadId]) } : {}),
          ...(repStewardId ? { 'Rep Steward': N.relation([repStewardId]) } : {}),
        };
        let circleId: string;
        if (existing) {
          await notion.updatePage(existing, props);
          circleId = existing;
          created.push(`Circle:${existing}(updated)`);
        } else {
          circleId = await notion.createPage(notion.dbIds.circles, {
            'Circle Name': N.title(c.circle_name),
            ...props,
            ...(c.source_evidence ? { Notes: N.richText(c.source_evidence) } : {}),
          });
          created.push(`Circle:${circleId}`);
          // Append charter template body to new circle pages, then write new DB properties
          try {
            await notion.appendCircleCharterBlocks(circleId, {
              circle_name: c.circle_name,
              purpose: c.purpose,
              accountabilities: c.accountabilities,
              domains: c.domains,
              kpis: c.kpis,
              meeting_cadence: c.meeting_cadence,
            });
            const genCircle = await this.generateCircleCharterBody({
              circle_name: c.circle_name,
              purpose: c.purpose,
              accountabilities: c.accountabilities,
              domains: c.domains,
              kpis: c.kpis,
              meeting_cadence: c.meeting_cadence,
            });
            if (genCircle) {
              const joinArr = (v: unknown): string =>
                Array.isArray(v) ? (v as string[]).join('; ') : (typeof v === 'string' ? v : '');
              await notion.updatePage(circleId, {
                ...(genCircle.regenerative_stewardship ? { 'Regenerative Stewardship': N.richText(String(genCircle.regenerative_stewardship)) } : {}),
                ...(genCircle.responsibilities ? { Responsibilities: N.richTextLong(joinArr(genCircle.responsibilities)) } : {}),
                ...(genCircle.authorities ? { Authorities: N.richTextLong(joinArr(genCircle.authorities)) } : {}),
                ...(genCircle.time_commitment ? { 'Time Commitment': N.richText(String(genCircle.time_commitment)) } : {}),
                ...(genCircle.tools ? { Tools: N.richText(joinArr(genCircle.tools)) } : {}),
                ...(genCircle.conflict_resolution ? { 'Conflict Resolution': N.richText(String(genCircle.conflict_resolution)) } : {}),
                ...(genCircle.feedback_mechanisms ? { 'Feedback Mechanisms': N.richText(String(genCircle.feedback_mechanisms)) } : {}),
                ...(genCircle.checks_and_balances ? { 'Checks & Balances': N.richTextLong(String(genCircle.checks_and_balances)) } : {}),
                ...(genCircle.succession_notes ? { 'Succession Notes': N.richText(String(genCircle.succession_notes)) } : {}),
                ...(genCircle.core_values ? { 'Core Values': N.richTextLong(String(genCircle.core_values)) } : {}),
                ...(genCircle.wholeness_practices ? { 'Wholeness Practices': N.richText(String(genCircle.wholeness_practices)) } : {}),
                ...(genCircle.living_agreement ? { 'Living Agreement': N.richTextLong(String(genCircle.living_agreement)) } : {}),
                ...(genCircle.meta_core_operating_principles ? { 'Meta Core Operating Principles': N.richText(String(genCircle.meta_core_operating_principles)) } : {}),
                ...(genCircle.review_cadence ? { 'Review Cadence': N.select(sanitizeSelect(String(genCircle.review_cadence), ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed'], 'Quarterly')) } : {}),
                ...(genCircle.review_adaptation ? { 'Review & Adaptation': N.richText(String(genCircle.review_adaptation)) } : {}),
                ...(genCircle.policy_legal_compliance ? { 'Policy & Legal Compliance': N.richText(String(genCircle.policy_legal_compliance)) } : {}),
                ...(genCircle.closing_statement ? { 'Closing Statement': N.richText(String(genCircle.closing_statement)) } : {}),
              });
            }
          } catch (err) {
            logger.warn({ err, circle: c.circle_name }, 'Circle charter body append failed - properties still written');
          }
        }
        circleIdMap.set(c.circle_name.trim().toLowerCase(), circleId);
        if (c.parent_circle) {
          try {
            const parentId = await resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', c.parent_circle);
            if (parentId) await notion.updatePage(circleId, { 'Parent Circle': N.relation([parentId]) });
          } catch {}
        }
      } catch (err) {
        logger.warn({ err, circle: c.circle_name }, 'Circle write failed — skipping');
      }
    }

    // Flush circle memberships now that circleIdMap is populated
    for (const { profileId, circleNames } of circleMembershipsQueue) {
      try {
        const ids = (await Promise.all(
          circleNames.map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n).catch(() => null)),
        )).filter((id): id is string => id !== null);
        if (ids.length) await notion.updatePage(profileId, { 'Circle Memberships': N.relation(ids) });
      } catch {}
    }

    // ── 3. Roles (needs circles)
    for (const r of (Array.isArray(data.role_updates) ? data.role_updates : [])) {
      if (!r.role_name) continue;
      try {
        const existing = await notion.findByTitle(notion.dbIds.roles, 'Role Name', r.role_name);
        const circleId = await resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', r.circle);
        const roleProps: Record<string, unknown> = {
          Status: N.select(sanitizeSelect(r.status, ['Active', 'Proposed', 'Vacant', 'Archived'], 'Active')),
          'Role Type': N.select(sanitizeSelect(r.role_type, roleTypeOptions, 'Custom Role')),
          ...(circleId ? { Circle: N.relation([circleId]) } : {}),
          ...(r.purpose ? { Purpose: N.richText(r.purpose) } : {}),
          ...(r.domains ? { Domains: N.richText(r.domains) } : {}),
          ...(r.accountabilities ? { Accountabilities: N.richText(r.accountabilities) } : {}),
          ...(r.term_length ? { 'Term Length': N.select(sanitizeSelect(r.term_length, termOptions, 'No Term')) } : {}),
          ...(r.assignment_method ? { 'Assignment Method': N.select(sanitizeSelect(r.assignment_method, assignMethodOpts, 'Appointed')) } : {}),
          'Last Audit Date': N.date(sanitizeDate(r.last_audit_date) ?? sourceDate),
          ...(r.source_evidence ? { Source: N.richText(r.source_evidence) } : {}),
        };
        let roleId: string;
        if (existing) {
          await notion.updatePage(existing, roleProps);
          roleId = existing;
          created.push(`Role:${existing}(updated)`);
        } else {
          roleId = await notion.createPage(notion.dbIds.roles, {
            'Role Name': N.title(r.role_name),
            ...roleProps,
          });
          created.push(`Role:${roleId}`);
          // Generate full role card body via Claude, then append to page
          try {
            const generated = await this.generateRoleCardBody({
              role_name: r.role_name,
              circle: r.circle,
              role_type: r.role_type,
              purpose: r.purpose,
              accountabilities: r.accountabilities,
              domains: r.domains,
              term_length: r.term_length,
              assignment_method: r.assignment_method,
            });
            await notion.appendRoleCardBlocks(roleId, {
              role_name: r.role_name,
              circle: r.circle,
              term_length: r.term_length,
              assignment_method: r.assignment_method,
              purpose: r.purpose,
              accountabilities: r.accountabilities,
              domains: r.domains,
              generated,
            });
            // Write new template-based DB properties from generated content
            if (generated) {
              const joinArr = (v: unknown): string =>
                Array.isArray(v) ? (v as string[]).join('; ') : (typeof v === 'string' ? v : '');
              const authParts = [
                ...(Array.isArray(generated.authorities_decide) ? generated.authorities_decide as string[] : []),
                ...(Array.isArray(generated.authorities_propose) ? generated.authorities_propose as string[] : []),
                ...(Array.isArray(generated.authorities_block) ? generated.authorities_block as string[] : []),
              ];
              await notion.updatePage(roleId, {
                ...(generated.regenerative_stewardship ? { 'Regenerative Stewardship': N.richText(String(generated.regenerative_stewardship)) } : {}),
                ...(generated.responsibilities ? { Responsibilities: N.richTextLong(joinArr(generated.responsibilities)) } : {}),
                ...(authParts.length ? { Authorities: N.richTextLong(authParts.join('; ')) } : {}),
                ...(generated.arc_awareness ? { 'ARC Awareness': N.richText(String(generated.arc_awareness)) } : {}),
                ...(generated.arc_reciprocity ? { 'ARC Reciprocity': N.richText(String(generated.arc_reciprocity)) } : {}),
                ...(generated.arc_choice ? { 'ARC Choice': N.richText(String(generated.arc_choice)) } : {}),
                ...(generated.kpis ? { KPIs: N.richText(joinArr(generated.kpis)) } : {}),
                ...(generated.time_commitment ? { 'Time Commitment': N.richText(String(generated.time_commitment)) } : {}),
                ...(generated.energy_check ? { 'Energy Check': N.richText(String(generated.energy_check)) } : {}),
                ...(generated.tools ? { Tools: N.richText(joinArr(generated.tools)) } : {}),
                ...(generated.conflict_resolution ? { 'Conflict Resolution': N.richText(String(generated.conflict_resolution)) } : {}),
                ...(generated.feedback ? { 'Feedback Mechanisms': N.richText(String(generated.feedback)) } : {}),
                ...(generated.succession ? { Succession: N.richText(String(generated.succession)) } : {}),
                ...(generated.core_values ? { 'Core Values': N.richTextLong(String(generated.core_values)) } : {}),
                ...(generated.review_adaptation ? { 'Review & Adaptation': N.richText(String(generated.review_adaptation)) } : {}),
                ...(generated.policy_legal_compliance ? { 'Policy & Legal Compliance': N.richText(String(generated.policy_legal_compliance)) } : {}),
              });
            }
          } catch (err) {
            logger.warn({ err, role: r.role_name }, 'Role card body generation/append failed - properties still written');
          }
        }
        roleIdMap.set(r.role_name.trim().toLowerCase(), roleId);
      } catch (err) {
        logger.warn({ err, role: r.role_name }, 'Role write failed — skipping');
      }
    }

    // Flush role-at-amora relations now that roleIdMap is populated
    for (const { profileId, roleName } of roleAtAmoraQueue) {
      try {
        const roleId = await resolve(roleIdMap, notion.dbIds.roles, 'Role Name', roleName);
        if (roleId) await notion.updatePage(profileId, { 'Role at Amora': N.relation([roleId]) });
      } catch {}
    }

    // ── 4. Role Assignments (needs profiles, circles, roles)
    for (const a of (Array.isArray(data.role_assignment_updates) ? data.role_assignment_updates : [])) {
      if (!a.role_name || !a.holder_name) continue;
      try {
        const assignmentTitle = `${a.holder_name} - ${a.role_name}`;
        const existing = await notion.findByTitle(notion.dbIds.roleAssignments, 'Assignment Title', assignmentTitle);
        const roleId   = await resolve(roleIdMap,    notion.dbIds.roles,    'Role Name',   a.role_name);
        const holderId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name',        a.holder_name);
        const assignStatus = sanitizeSelect(a.status, ['Active', 'Delegated', 'Completed', 'Suspended'], 'Active');
        const assignProps: Record<string, unknown> = {
          ...(roleId   ? { Role:         N.relation([roleId])   } : {}),
          ...(holderId ? { 'Role Holder': N.relation([holderId]) } : {}),
          // Circle is derived via rollup from Role — do not write it directly here
          Status: N.select(assignStatus),
          'Assignment Type': N.select(sanitizeSelect(a.assignment_type, assignTypeOptions, 'Appointed')),
          // Default Start Date to source date so the Term Length formula can compute Next Review Date
          'Start Date': N.date(sanitizeDate(a.start_date) ?? sourceDate),
          ...(a.end_date   ? { 'End Date':   N.date(sanitizeDate(a.end_date))   } : {}),
          ...(a.term_length ? { 'Term Length': N.select(sanitizeSelect(a.term_length, termOptions, 'No Term')) } : {}),
          ...(a.energization_level ? { 'Energization Level': N.select(sanitizeSelect(a.energization_level, ['Energized', 'Willing', 'Unwilling'], 'Willing')) } : {}),
          ...(a.source_evidence ? { 'Source Evidence': N.richText(a.source_evidence) } : {}),
        };
        if (existing) {
          await notion.updatePage(existing, assignProps);
          created.push(`RoleAssignment:${existing}(updated)`);
        } else {
          const id = await notion.createPage(notion.dbIds.roleAssignments, {
            'Assignment Title': N.title(assignmentTitle),
            ...assignProps,
          });
          created.push(`RoleAssignment:${id}`);
        }
      } catch (err) {
        logger.warn({ err, role: a.role_name, holder: a.holder_name }, 'Role assignment write failed — skipping');
      }
    }

    // ── 5. Projects (needs circles, profiles)
    for (const p of (Array.isArray(data.project_updates) ? data.project_updates : [])) {
      if (!p.project_name) continue;
      try {
        let existing = await notion.findByTitle(notion.dbIds.projects, 'Project Name', p.project_name);
        // Prefix fallback: catches near-name variants (e.g. "Amora Campground and Events Hospitality" matching canonical "...Partnership")
        if (!existing && p.project_name.length > 30) {
          existing = await notion.findProjectByNamePrefix(p.project_name.slice(0, 30));
          if (existing) logger.debug({ projectName: p.project_name }, 'Project matched by name prefix — treating as existing to prevent near-dup');
        }
        const circleId  = await resolve(circleIdMap,  notion.dbIds.circles,  'Circle Name', p.circle);
        const leadId    = await resolve(profileIdMap, notion.dbIds.profiles, 'Name',        p.project_lead);
        const projSector = p.primary_sector && sectorOptions.includes(p.primary_sector) ? p.primary_sector : null;
        const projProps: Record<string, unknown> = {
          ...(p.status ? { Status: N.select(sanitizeSelect(p.status, ['Proposed', 'Active', 'On Hold', 'Complete', 'Cancelled'], 'Proposed')) } : {}),
          ...(circleId ? { Circle:        N.relation([circleId]) } : {}),
          ...(leadId   ? { 'Lead Profile': N.relation([leadId])  } : {}),
          ...(p.priority ? { Priority: N.select(sanitizeSelect(p.priority, ['High', 'Medium', 'Low'], 'Medium')) } : {}),
          ...(p.start_date  ? { 'Start Date':  N.date(sanitizeDate(p.start_date))  } : {}),
          ...(p.target_date ? { 'Target Date': N.date(sanitizeDate(p.target_date)) } : {}),
          ...(p.description ? { Description: N.richText(p.description) } : {}),
          ...(projSector ? { 'Primary Sector': N.select(projSector) } : {}),
        };
        let projectPageId: string;
        if (existing) {
          await notion.updatePage(existing, projProps);
          projectPageId = existing;
          created.push(`Project:${existing}(updated)`);
        } else {
          projectPageId = await notion.createPage(notion.dbIds.projects, {
            'Project Name': N.title(p.project_name),
            Status: N.select(sanitizeSelect(p.status, ['Proposed', 'Active', 'On Hold', 'Complete', 'Cancelled'], 'Proposed')),
            Priority: N.select(sanitizeSelect(p.priority, ['High', 'Medium', 'Low'], 'Medium')),
            ...projProps,
            ...(p.source_evidence ? { Source: N.richText(p.source_evidence) } : {}),
          });
          created.push(`Project:${projectPageId}`);
        }
        projectIdMap.set(p.project_name.trim().toLowerCase(), projectPageId);
      } catch (err) {
        logger.warn({ err, project: p.project_name }, 'Project write failed — skipping');
      }
    }

    // ── 6. Tasks (needs profiles, projects) — parallelized; dedup against meeting if linked
    await Promise.all((Array.isArray(data.tasks) ? data.tasks : []).map(async (t) => {
      try {
        // Dedup: skip if an identical active task already exists
        if (t.task?.trim()) {
          if (sourceMeetingPageId) {
            const existingTask = await notion.findByTitleInMeeting(notion.dbIds.tasks, 'Task', t.task, sourceMeetingPageId);
            if (existingTask) {
              logger.debug({ task: t.task, meetingPageId: sourceMeetingPageId }, 'Task already exists for this meeting — skipping');
              created.push(`Task:${existingTask}(dedup-skipped)`);
              return;
            }
          } else {
            // Email-sourced: dedup by exact title across all active tasks
            const existingTask = await notion.findActiveTaskByTitle(notion.dbIds.tasks, t.task);
            if (existingTask) {
              logger.warn({ task: t.task }, 'Duplicate task suppressed (email dedup)');
              created.push(`Task:${existingTask}(email-dedup-skipped)`);
              return;
            }
          }
        }
        let ownerId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', t.owner);
        // Auto-create minimal profile if owner name was given but not found
        if (!ownerId && t.owner?.trim()) {
          try {
            ownerId = await notion.createPage(notion.dbIds.profiles, {
              Name: N.title(t.owner.trim()),
              'Profile Type': N.select('Person'),
              'Engagement Status': N.select('Unknown'),
              'Relationship to Amora': N.select('Unknown'),
              Source: N.richText('Auto-created from task extraction'),
              'Sensitive Notes Flag': N.checkbox(false),
              'First Seen': N.date(today),
              'Last Seen': N.date(today),
            });
            profileIdMap.set(t.owner.trim().toLowerCase(), ownerId);
            created.push(`Profile:${ownerId}(auto-task-owner)`);
          } catch {}
        }
        // Role-based assignment: resolve role and pull active holders
        const taskRoleId = await resolve(roleIdMap, notion.dbIds.roles, 'Role Name', t.assigned_role);
        const taskHolderIds = taskRoleId ? await resolveRoleHolders(taskRoleId) : [];
        // Merge direct owner + role holders, dedupe
        const allOwnerIds = [...new Set([...(ownerId ? [ownerId] : []), ...taskHolderIds])];
        // Needs Owner only when no role and no person identified
        const needsOwner = t.needs_owner && !taskRoleId && allOwnerIds.length === 0;
        const projectId = await resolve(projectIdMap, notion.dbIds.projects, 'Project Name', t.project);
        const taskCircleIds = (await Promise.all(
          (Array.isArray(t.circles) ? t.circles : []).filter(Boolean).map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n)),
        )).filter((id): id is string => id !== null);
        const taskEvidence = (t.source_evidence ?? '').trim();
        const taskConfidence = taskEvidence.length > 100 ? 'High' : taskEvidence.length > 20 ? 'Medium' : 'Low';
        const id = await notion.createPage(notion.dbIds.tasks, {
          Task: N.title(t.task ?? '(untitled task)'),
          ...(allOwnerIds.length  ? { Owner:             N.relation(allOwnerIds)            } : {}),
          ...(taskRoleId          ? { 'Assigned Role':   N.relation([taskRoleId])           } : {}),
          ...(projectId           ? { Project:           N.relation([projectId])            } : {}),
          ...(sourceMeetingPageId ? { Meeting:           N.relation([sourceMeetingPageId])  } : {}),
          ...(sourceDocUrl        ? { 'Source Document': N.url(sourceDocUrl)               } : {}),
          ...(taskCircleIds.length ? { 'Related Circles': N.relation(taskCircleIds) } : {}),
          'Source Evidence': N.richText(t.source_evidence),
          'Due Date': N.date(sanitizeDate(t.due_date)),
          Priority: N.select(sanitizeSelect(t.priority, ['High', 'Medium', 'Low'], 'Medium')),
          Status: N.select(needsOwner ? 'Needs Owner' : 'Open'),
          'Canon Impact': N.checkbox(t.canon_impact ?? false),
          Lifecycle: N.select('Active'),
          'Extraction Confidence': N.select(taskConfidence),
          ...(t.purpose_alignment ? { 'Purpose Alignment': N.select(sanitizeSelect(t.purpose_alignment, ['Aligned', 'Neutral', 'Misaligned', 'Unclear'], 'Unclear')) } : {}),
          ...(t.purpose_alignment_notes ? { 'Purpose Alignment Notes': N.richText(t.purpose_alignment_notes) } : {}),
        });
        created.push(`Task:${id}`);
        try {
          await notion.appendTaskBody(id, { source_evidence: t.source_evidence });
        } catch (err) {
          logger.warn({ err, task: t.task }, 'Task body append failed');
        }
      } catch (err) {
        logger.warn({ err, task: t.task }, 'Task write failed — skipping');
      }
    }));

    // ── 7. Decision Candidates (needs profiles) — parallelized; dedup against meeting if linked
    await Promise.all((Array.isArray(data.decisions) ? data.decisions : []).map(async (d) => {
      try {
        const impact = d.canon_impact ?? false;
        if (impact) canonReviewRequired = true;

        // Dedup: skip if this decision already exists (per-meeting first, then global)
        if (d.decision?.trim()) {
          if (sourceMeetingPageId) {
            const existingDecision = await notion.findByTitleInMeeting(notion.dbIds.decisionCandidates, 'Decision', d.decision, sourceMeetingPageId);
            if (existingDecision) {
              logger.debug({ decision: d.decision, meetingPageId: sourceMeetingPageId }, 'Decision already exists for this meeting — skipping');
              created.push(`Decision:${existingDecision}(dedup-skipped)`);
              return;
            }
          }
          // Cross-source dedup: confirmed decisions are institutional facts; same text from a second email = re-mention, not a new record
          const existingGlobal = await notion.findByTitle(notion.dbIds.decisionCandidates, 'Decision', d.decision);
          if (existingGlobal) {
            logger.debug({ decision: d.decision }, 'Decision already exists globally — cross-source dedup skipping');
            created.push(`Decision:${existingGlobal}(dedup-skipped)`);
            return;
          }
        }

        const makerId   = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', d.decision_maker);
        const reviewId  = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', d.reviewer);
        const decisionRoleId = await resolve(roleIdMap, notion.dbIds.roles, 'Role Name', d.decision_maker_role);
        const decisionHolderIds = decisionRoleId ? await resolveRoleHolders(decisionRoleId) : [];
        const allMakerIds = [...new Set([...(makerId ? [makerId] : []), ...decisionHolderIds])];
        const decisionCircleIds = (await Promise.all(
          (Array.isArray(d.circles) ? d.circles : []).filter(Boolean).map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n)),
        )).filter((id): id is string => id !== null);
        const decEvidence = (d.source_evidence ?? '').trim();
        const decConfidence = decEvidence.length > 100 ? 'High' : decEvidence.length > 20 ? 'Medium' : 'Low';
        const id = await notion.createPage(notion.dbIds.decisionCandidates, {
          Decision: N.title(d.decision ?? '(untitled decision)'),
          Status: N.select(sanitizeSelect(d.status, ['Candidate', 'Confirmed', 'Rejected', 'Needs Clarification'], 'Candidate')),
          'Source Evidence': N.richText(d.source_evidence),
          Lifecycle: N.select('Active'),
          'Extraction Confidence': N.select(decConfidence),
          ...(allMakerIds.length      ? { 'Decision Maker Profile': N.relation(allMakerIds)             } : {}),
          ...(decisionRoleId          ? { 'Decision Maker Role':    N.relation([decisionRoleId])         } : {}),
          ...(reviewId                ? { 'Reviewer Profile':       N.relation([reviewId])               } : {}),
          ...(sourceMeetingPageId     ? { Meeting:                  N.relation([sourceMeetingPageId])    } : {}),
          ...(sourceDocUrl            ? { 'Source Document':        N.url(sourceDocUrl)                  } : {}),
          ...(decisionCircleIds.length ? { 'Related Circles':       N.relation(decisionCircleIds)        } : {}),
          'Canon Impact': N.checkbox(impact),
          'Needs Confirmation': N.checkbox(d.review_required ?? false),
          'Approved Date': N.date(null),
          'Implementation Status': N.select('Not Started'),
          ...(d.purpose_alignment ? { 'Purpose Alignment': N.select(sanitizeSelect(d.purpose_alignment, ['Aligned', 'Neutral', 'Misaligned', 'Unclear'], 'Unclear')) } : {}),
          ...(d.purpose_alignment_notes ? { 'Purpose Alignment Notes': N.richText(d.purpose_alignment_notes) } : {}),
        });
        created.push(`Decision:${id}`);
        try {
          await notion.appendDecisionBody(id, {
            source_evidence: d.source_evidence,
            purpose_alignment: d.purpose_alignment,
            purpose_alignment_notes: d.purpose_alignment_notes,
          });
        } catch (err) {
          logger.warn({ err, decision: d.decision }, 'Decision body append failed');
        }
      } catch (err) {
        logger.warn({ err, decision: d.decision }, 'Decision write failed — skipping');
      }
    }));

    // ── 8. Risks (needs profiles) — parallelized; dedup against meeting if linked
    await Promise.all((Array.isArray(data.risks) ? data.risks : []).map(async (r) => {
      try {
        // Dedup: skip if this risk already exists on the same meeting
        if (sourceMeetingPageId && r.risk?.trim()) {
          const existingRisk = await notion.findByTitleInMeeting(notion.dbIds.risks, 'Risk', r.risk, sourceMeetingPageId);
          if (existingRisk) {
            logger.debug({ risk: r.risk, meetingPageId: sourceMeetingPageId }, 'Risk already exists for this meeting — skipping');
            created.push(`Risk:${existingRisk}(dedup-skipped)`);
            return;
          }
        }

        const riskOwnerId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', r.owner);
        const riskRoleId = await resolve(roleIdMap, notion.dbIds.roles, 'Role Name', r.owner_role);
        const riskHolderIds = riskRoleId ? await resolveRoleHolders(riskRoleId) : [];
        const allRiskOwnerIds = [...new Set([...(riskOwnerId ? [riskOwnerId] : []), ...riskHolderIds])];
        const riskCircleIds = (await Promise.all(
          (Array.isArray(r.circles) ? r.circles : []).filter(Boolean).map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n)),
        )).filter((id): id is string => id !== null);
        const riskEvidence = (r.source_evidence ?? '').trim();
        const riskConfidence = riskEvidence.length > 100 ? 'High' : riskEvidence.length > 20 ? 'Medium' : 'Low';
        const id = await notion.createPage(notion.dbIds.risks, {
          Risk: N.title(r.risk ?? '(untitled risk)'),
          Category: N.select(sanitizeSelect(r.category, ['Operational', 'Financial', 'Legal', 'Governance', 'Interpersonal', 'Technical', 'Collapse Pattern', 'Unknown'], 'Unknown')),
          Severity: N.select(sanitizeSelect(r.severity, ['High', 'Medium', 'Low'], 'Medium')),
          Evidence: N.richText(r.source_evidence),
          'Suggested Mitigation': N.richText(r.suggested_mitigation ?? null),
          ...(allRiskOwnerIds.length ? { Owner:             N.relation(allRiskOwnerIds)       } : {}),
          ...(riskRoleId             ? { 'Owner Role':      N.relation([riskRoleId])          } : {}),
          ...(sourceMeetingPageId    ? { Meeting:           N.relation([sourceMeetingPageId]) } : {}),
          ...(sourceDocUrl           ? { 'Source Document': N.url(sourceDocUrl)               } : {}),
          ...(riskCircleIds.length   ? { 'Related Circles': N.relation(riskCircleIds)         } : {}),
          Status: N.select('Open'),
          Lifecycle: N.select('Active'),
          'Extraction Confidence': N.select(riskConfidence),
          'Review Date': N.date((() => {
            const d = new Date(sourceDate);
            d.setDate(d.getDate() + (sanitizeSelect(r.severity, ['High', 'Medium', 'Low'], 'Medium') === 'High' ? 30 : 90));
            return d.toISOString().slice(0, 10);
          })()),
        });
        created.push(`Risk:${id}`);
        try {
          await notion.appendRiskBody(id, {
            source_evidence: r.source_evidence,
            suggested_mitigation: r.suggested_mitigation,
          });
        } catch (err) {
          logger.warn({ err, risk: r.risk }, 'Risk body append failed');
        }
      } catch (err) {
        logger.warn({ err, risk: r.risk }, 'Risk write failed — skipping');
      }
    }));

    // ── 9. Memory Candidates (needs profiles) — parallelized
    await Promise.all((Array.isArray(data.memory_candidates) ? data.memory_candidates : []).map(async (m) => {
      try {
        // Prompt instructs High-only — gate Low and Medium at the code layer too
        if (m.confidence === 'Low' || m.confidence === 'Medium') {
          logger.debug({ memory: m.proposed_memory?.slice(0, 80) }, 'Skipping non-High-confidence memory candidate');
          return;
        }
        const mrqTitle = m.title?.trim() || shortLabel(m.proposed_memory, '(untitled memory)');
        // Dedup by title — prevents repeated processing of the same source from creating duplicate queue entries
        const existingMrq = await notion.findByTitle(notion.dbIds.memoryReviewQueue, 'Proposed Memory', mrqTitle);
        if (existingMrq) {
          logger.debug({ mrqTitle }, 'MRQ entry already exists — skipping duplicate');
          created.push(`Memory:${existingMrq}`);
          return;
        }
        const reviewId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', m.reviewer);
        const relatedProfileIds = (await Promise.all(
          (Array.isArray(m.related_profile_names) ? m.related_profile_names : [])
            .filter(Boolean)
            .map((n) => resolve(profileIdMap, notion.dbIds.profiles, 'Name', n)),
        )).filter((id): id is string => id !== null);
        const urgentCategories = ['Commitment', 'Decision'];
        const hasRiskIfIgnored = ((m.risk_if_ignored as string | undefined) ?? '').trim().length > 20;
        const mrqCategory: string = (m.category as string | undefined) ?? '';
        const mrqPriority = urgentCategories.includes(mrqCategory) && hasRiskIfIgnored
          ? 'Urgent'
          : urgentCategories.includes(mrqCategory) || hasRiskIfIgnored
          ? 'This Week'
          : 'Backlog';
        const id = await notion.createPage(notion.dbIds.memoryReviewQueue, {
          'Proposed Memory': N.title(mrqTitle),
          'Memory Detail':   N.richText(m.proposed_memory ?? ''),
          Category: N.select(sanitizeSelect(m.category, ['Context', 'Relationship', 'Commitment', 'Decision', 'Learning', 'Process', 'Unknown'], 'Unknown')),
          'Source Evidence': N.richText(m.source_evidence),
          Confidence: N.select(sanitizeSelect(m.confidence, ['High', 'Medium', 'Low'], 'Medium')),
          Priority: N.select(mrqPriority),
          'Risk If Added': N.richText(m.risk_if_added ?? null),
          'Risk If Ignored': N.richText(m.risk_if_ignored ?? null),
          'Suggested Destination': N.richText(m.suggested_destination ?? null),
          ...(reviewId               ? { 'Reviewer Profile':  N.relation([reviewId])             } : {}),
          ...(sourceMeetingPageId    ? { Meeting:             N.relation([sourceMeetingPageId])  } : {}),
          ...(relatedProfileIds.length ? { 'Related Profiles': N.relation(relatedProfileIds)     } : {}),
          Status: N.select('Pending Review'),
          'Approved Date': N.date(null),
        });
        created.push(`Memory:${id}`);
        try {
          await notion.appendMRQBody(id, {
            proposed_memory: m.proposed_memory,
            source_evidence: m.source_evidence,
            risk_if_added: m.risk_if_added,
            risk_if_ignored: m.risk_if_ignored,
            suggested_destination: m.suggested_destination,
          });
        } catch (err) {
          logger.warn({ err, memory: m.proposed_memory }, 'MRQ body append failed');
        }
      } catch (err) {
        logger.warn({ err, memory: m.proposed_memory }, 'Memory candidate write failed — skipping');
      }
    }));

    // ── 10. Canon Change Requests (needs profiles, policies) — parallelized
    await Promise.all((Array.isArray(data.canon_change_candidates) ? data.canon_change_candidates : []).map(async (c) => {
      try {
        // Require source evidence — canon changes without it are speculative and generate noise
        if (!c.source_evidence?.trim()) {
          logger.debug({ change: c.proposed_change?.slice(0, 80) }, 'Skipping canon change candidate with no source evidence');
          return;
        }
        canonReviewRequired = true;
        const reviewId  = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', c.reviewer);
        const policyId  = notion.dbIds.policies
          ? await resolve(policyIdMap, notion.dbIds.policies, 'Policy Name', (c as any).policy_name)
          : null;
        const canonChangeCircleIds = (await Promise.all(
          (Array.isArray(c.circles) ? c.circles : []).filter(Boolean).map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n)),
        )).filter((id): id is string => id !== null);
        const canonChangeRoleIds = (await Promise.all(
          (Array.isArray(c.roles) ? c.roles : []).filter(Boolean).map((n) => resolve(roleIdMap, notion.dbIds.roles, 'Role Name', n)),
        )).filter((id): id is string => id !== null);
        const canonEvidence = (c.source_evidence ?? '').trim();
        const canonConfidence = canonEvidence.length > 100 ? 'High' : canonEvidence.length > 20 ? 'Medium' : 'Low';
        const id = await notion.createPage(notion.dbIds.canonChangeRequests, {
          'Proposed Change': N.title(c.title?.trim() || shortLabel(c.proposed_change, '(untitled change)')),
          'Change Detail':   N.richText(c.proposed_change ?? ''),
          'Affected Canon Area': N.select(sanitizeSelect(c.affected_area, ['Governing Purpose', 'Policy', 'Circle Definition', 'Role Definition', 'Decision Rights', 'Legal Commitment', 'Financial Commitment', 'Land Stewardship', 'CCOS Ledger', 'Public Commitment', 'Unknown'], 'Unknown')),
          Reason: N.richText(c.reason),
          ...(reviewId                    ? { Reviewer:          N.relation([reviewId])             } : {}),
          ...(policyId                    ? { 'Affected Policy': N.relation([policyId])             } : {}),
          ...(canonChangeCircleIds.length ? { 'Related Circles': N.relation(canonChangeCircleIds)  } : {}),
          ...(canonChangeRoleIds.length   ? { 'Affected Roles':  N.relation(canonChangeRoleIds)    } : {}),
          'Source Evidence': N.richText(c.source_evidence),
          Status: N.select('Pending Review'),
          'Approved Date': N.date(null),
          'Extraction Confidence': N.select(canonConfidence),
        });
        canonRecordIds.push(id);
        created.push(`CanonChange:${id}`);
      } catch (err) {
        logger.warn({ err, change: c.proposed_change }, 'Canon change write failed — skipping');
      }
    }));

    // ── 11. Sensitive Flags → Sensitive Review DB (admin-only, isolated from team queue) — parallelized
    await Promise.all((Array.isArray(data.sensitive_flags) ? data.sensitive_flags : []).map(async (s) => {
      try {
        // Dedup by issue title — the same concern raised across multiple email/meeting processings should not stack up
        const existingSensitive = await notion.findByTitle(notion.dbIds.sensitiveReview, 'Issue', s.issue);
        if (existingSensitive) {
          logger.debug({ issue: s.issue?.slice(0, 80) }, 'Sensitive flag already exists — skipping duplicate');
          sensitiveRecordIds.push(existingSensitive);
          created.push(`Sensitive:${existingSensitive}`);
          return;
        }
        sensitiveReviewRequired = true;
        const relatedPeopleIds = (await Promise.all(
          (Array.isArray(s.related_profile_names) ? s.related_profile_names : [])
            .filter(Boolean)
            .map((n) => resolve(profileIdMap, notion.dbIds.profiles, 'Name', n)),
        )).filter((id): id is string => id !== null);
        const id = await notion.createPage(notion.dbIds.sensitiveReview, {
          Issue:                  N.title(s.issue),
          Reason:                 N.richText(s.reason),
          'Recommended Handling': N.richText(s.recommended_handling),
          Status:                 N.select('Pending Review'),
          Source:                 N.richText(sourceEmailPageId ?? sourceMeetingPageId ?? ''),
          'Date Flagged':         N.date(new Date().toISOString().slice(0, 10)),
          ...(relatedPeopleIds.length ? { 'Related People': N.relation(relatedPeopleIds) } : {}),
        });
        sensitiveRecordIds.push(id);
        created.push(`Sensitive:${id}`);
      } catch (err) {
        logger.warn({ err, issue: s.issue }, 'Sensitive flag write failed — skipping');
      }
    }));

    // ── 12. CCOS Ledger Entries (needs circles, roles, profiles) — parallelized
    await Promise.all((Array.isArray(data.ccos_ledger_entries) ? data.ccos_ledger_entries : []).map(async (l) => {
      try {
        const circleId  = await resolve(circleIdMap,  notion.dbIds.circles,  'Circle Name', l.circle);
        const roleId    = await resolve(roleIdMap,    notion.dbIds.roles,    'Role Name',   l.role);
        const id = await notion.createPage(notion.dbIds.ccosLedgerEntries, {
          'Ledger Entry': N.title(l.entry ?? '(untitled entry)'),
          'Ledger Type': N.select(sanitizeSelect(l.ledger_type, ['Tension', 'Proposal', 'Decision', 'Role', 'Policy', 'Resource', 'Accountability'], 'Tension')),
          ...(circleId ? { Circle: N.relation([circleId]) } : {}),
          ...(roleId   ? { Role:   N.relation([roleId])   } : {}),
          Evidence: N.richText(l.source_evidence),
          Status: N.select('Draft'),
          'Review Required': N.checkbox(l.review_required ?? true),
          'Approved Date': N.date(null),
        });
        created.push(`CCOS:${id}`);
      } catch (err) {
        logger.warn({ err, entry: l.entry }, 'CCOS ledger entry write failed — skipping');
      }
    }));

    // ── 13. Knowledge Base Articles (Draft only — for human review before publishing) — parallelized
    await Promise.all((Array.isArray(data.kb_articles) ? data.kb_articles : []).map(async (kb) => {
      if (!notion.dbIds.knowledgeBase) return;
      try {
        const kbTitle = kb.title?.trim() || '(untitled article)';
        // Skip Low confidence (prompt rule — High only)
        if (kb.confidence === 'Low') return;
        // Dedup by title — prevents the same article being created repeatedly as emails are reprocessed
        const existingKb = await notion.findByTitle(notion.dbIds.knowledgeBase, 'KB Title', kbTitle);
        if (existingKb) {
          logger.debug({ kbTitle }, 'KB article already exists — skipping duplicate');
          created.push(`KB:${existingKb}`);
          return;
        }
        const kbCircleIds = (await Promise.all(
          (Array.isArray(kb.circles) ? kb.circles : []).filter(Boolean).map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n)),
        )).filter((id): id is string => id !== null);
        const id = await notion.createPage(notion.dbIds.knowledgeBase, {
          'KB Title':   N.title(kbTitle),
          Category:     N.select(sanitizeSelect(kb.category, ['How-To', 'Best Practice', 'Process', 'Technology', 'Governance', 'Community', 'Land & Ecology', 'Finance', 'Learning', 'Wellness', 'General'], 'General')),
          Audience:     N.multiSelect(Array.isArray(kb.audience) ? kb.audience : []),
          Summary:      N.richText(kb.summary ?? ''),
          'Key Points': N.richText(kb.key_points ?? ''),
          Source:       N.richText(sourceEmailPageId ?? sourceMeetingPageId ?? (kb.source_evidence ?? '')),
          Status:       N.select('Draft'),
          Confidence:   N.select(sanitizeSelect(kb.confidence, ['High', 'Medium'], 'Medium')),
          ...(kbCircleIds.length ? { 'Related Circles': N.relation(kbCircleIds) } : {}),
        });
        created.push(`KB:${id}`);
        try {
          await notion.appendKBBody(id, {
            summary: kb.summary,
            key_points: kb.key_points,
          });
        } catch (err) {
          logger.warn({ err, title: kb.title }, 'KB body append failed');
        }
      } catch (err) {
        logger.warn({ err, title: kb.title }, 'KB article write failed — skipping');
      }
    }));

    // ── 14. Tensions — parallelized; gate on DB being configured
    await Promise.all((Array.isArray(data.tensions) ? data.tensions : []).map(async (t) => {
      if (!notion.dbIds.tensions) return;
      try {
        const tensionText = t.tension?.trim() || '(untitled tension)';
        const sensedById = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', t.sensed_by);
        const sensingCircleId = await resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', t.sensing_circle);
        const id = await notion.createPage(notion.dbIds.tensions, {
          Tension: N.title(tensionText),
          Type: N.select(sanitizeSelect(t.type, ['Governance', 'Operational', 'Relational', 'Structural'], 'Operational')),
          Status: N.select('Open'),
          'Source Evidence': N.richText(t.source_evidence ?? ''),
          ...(sensedById     ? { 'Sensed By':      N.relation([sensedById])          } : {}),
          ...(sensingCircleId ? { 'Sensing Circle': N.relation([sensingCircleId])    } : {}),
          ...(sourceMeetingPageId ? { Meeting:       N.relation([sourceMeetingPageId]) } : {}),
        });
        created.push(`Tension:${id}`);
        try {
          await notion.appendTensionBody(id, {
            tension: t.tension,
            source_evidence: t.source_evidence,
          });
        } catch (err) {
          logger.warn({ err, tension: tensionText }, 'Tension body append failed');
        }
      } catch (err) {
        logger.warn({ err, tension: t.tension }, 'Tension write failed — skipping');
      }
    }));

    // ── 15. Agreements / Commitments — parallelized; gate on DB being configured
    await Promise.all((Array.isArray(data.agreements) ? data.agreements : []).map(async (a) => {
      if (!notion.dbIds.commitments) return;
      try {
        const agreementTitle = a.agreement_title?.trim() || '(untitled agreement)';
        const partyIds = (await Promise.all(
          (Array.isArray(a.parties) ? a.parties : []).filter(Boolean).map((n) => resolve(profileIdMap, notion.dbIds.profiles, 'Name', n)),
        )).filter((id): id is string => id !== null);
        const agreementCircleIds = (await Promise.all(
          (Array.isArray(a.circles) ? a.circles : []).filter(Boolean).map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n)),
        )).filter((id): id is string => id !== null);
        const id = await notion.createPage(notion.dbIds.commitments, {
          'Agreement Title': N.title(agreementTitle),
          Terms: N.richText(a.terms ?? ''),
          Type: N.select(sanitizeSelect(a.type, ['Interpersonal', 'Inter-Circle', 'External', 'Org-Wide'], 'Interpersonal')),
          Status: N.select('Active'),
          'Effective Date': N.date(sanitizeDate(a.effective_date)),
          'Review Date': N.date(sanitizeDate(a.review_date)),
          'Source Evidence': N.richText(a.source_evidence ?? ''),
          ...(partyIds.length          ? { Parties:          N.relation(partyIds)             } : {}),
          ...(agreementCircleIds.length ? { Circles:          N.relation(agreementCircleIds)   } : {}),
          ...(sourceMeetingPageId       ? { 'Source Meeting': N.relation([sourceMeetingPageId]) } : {}),
        });
        created.push(`Agreement:${id}`);
        try {
          await notion.appendCommitmentBody(id, {
            terms: a.terms,
            source_evidence: a.source_evidence,
          });
        } catch (err) {
          logger.warn({ err, agreement: agreementTitle }, 'Commitment body append failed');
        }
      } catch (err) {
        logger.warn({ err, agreement: a.agreement_title }, 'Agreement write failed — skipping');
      }
    }));

    // ── 16. Gratitudes — parallelized; gate on DB configured
    await Promise.all((Array.isArray(data.gratitudes) ? data.gratitudes : []).map(async (g) => {
      if (!notion.dbIds.gratitudes) return;
      try {
        const fromId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', g.from);
        const toId   = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', g.to);
        if (!fromId && !toId) return; // need at least one end resolved
        const circleId = await resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', g.circle);
        const autoTitle = `${g.from ?? '?'} → ${g.to ?? '?'}`;
        const id = await notion.createPage(notion.dbIds.gratitudes, {
          Title:             N.title(autoTitle),
          Appreciation:      N.richText(g.appreciation ?? ''),
          Date:              N.date(sourceDate ?? null),
          'Source Evidence': N.richText(g.source_evidence ?? ''),
          ...(fromId    ? { From:    N.relation([fromId])             } : {}),
          ...(toId      ? { To:      N.relation([toId])               } : {}),
          ...(circleId  ? { Circle:  N.relation([circleId])           } : {}),
          ...(sourceMeetingPageId ? { Meeting: N.relation([sourceMeetingPageId]) } : {}),
        });
        created.push(`Gratitude:${id}`);
      } catch (err) {
        logger.warn({ err, from: g.from, to: g.to }, 'Gratitude write failed — skipping');
      }
    }));

    // ── 17. Events — parallelized; gate on DB configured
    await Promise.all((Array.isArray(data.events) ? data.events : []).map(async (ev) => {
      if (!notion.dbIds.events) return;
      try {
        const organizerId = await resolve(profileIdMap, notion.dbIds.profiles, 'Name', ev.organizer);
        const orgCircleId = await resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', ev.organizing_circle);
        const id = await notion.createPage(notion.dbIds.events, {
          'Event Name': N.title(ev.event_name ?? '(untitled event)'),
          Type:         N.select(sanitizeSelect(ev.type, ['Community Dinner', 'Ceremony', 'Workshop', 'Learning Circle', 'Celebration', 'Work Party', 'Retreat', 'Other'], 'Other')),
          Date:         N.date(sanitizeDate(ev.date)),
          'End Date':   N.date(sanitizeDate(ev.end_date)),
          Location:     N.richText(ev.location ?? ''),
          Description:  N.richText(ev.description ?? ''),
          Status:       N.select('Proposed'),
          ...(organizerId  ? { Organizer:          N.relation([organizerId])  } : {}),
          ...(orgCircleId  ? { 'Organizing Circle': N.relation([orgCircleId]) } : {}),
        });
        created.push(`Event:${id}`);
      } catch (err) {
        logger.warn({ err, event: ev.event_name }, 'Event write failed — skipping');
      }
    }));

    // ── 18. Retrospectives — parallelized; gate on DB configured
    await Promise.all((Array.isArray(data.retrospectives) ? data.retrospectives : []).map(async (r) => {
      if (!notion.dbIds.retrospectives) return;
      try {
        const retroCircleId = await resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', r.circle);
        const id = await notion.createPage(notion.dbIds.retrospectives, {
          Title:            N.title(r.title ?? '(untitled retrospective)'),
          'Retro Date':     N.date(sanitizeDate(r.retro_date)),
          'Period Covered': N.richText(r.period_covered ?? ''),
          'What Worked':    N.richText(r.what_worked ?? ''),
          'What Didn\'t Work': N.richText(r.what_didnt_work ?? ''),
          'What to Change': N.richText(r.what_to_change ?? ''),
          'Energy Level':   r.energy_level ? N.select(sanitizeSelect(r.energy_level, ['High', 'Good', 'Neutral', 'Low', 'Critical'], 'Neutral')) : N.select('Neutral'),
          Celebrations:     N.richText(r.celebrations ?? ''),
          Status:           N.select('Draft'),
          ...(retroCircleId     ? { Circle:  N.relation([retroCircleId])       } : {}),
          ...(sourceMeetingPageId ? { Meeting: N.relation([sourceMeetingPageId]) } : {}),
        });
        created.push(`Retro:${id}`);
        try {
          await notion.appendRetrospectiveBody(id, r);
        } catch (err) {
          logger.warn({ err, retro: r.title }, 'Retrospective body append failed');
        }
      } catch (err) {
        logger.warn({ err, retro: r.title }, 'Retrospective write failed — skipping');
      }
    }));

    // ── 19. Update Meeting record whenever extraction is linked to a meeting page
    if (sourceMeetingPageId) {
      // Resolve participant names to Profiles relation IDs (graceful — no-ops until migration runs)
      let participantRelationIds: string[] = [];
      if (data.meeting_summary?.participants?.length) {
        participantRelationIds = (await Promise.all(
          data.meeting_summary.participants.map((name) =>
            resolve(profileIdMap, notion.dbIds.profiles, 'Name', name),
          ),
        )).filter((id): id is string => id !== null);
      }

      const meetingCircleIds = (await Promise.all(
        (Array.isArray(data.meeting_summary?.circles) ? data.meeting_summary!.circles! : []).filter(Boolean).map((n) => resolve(circleIdMap, notion.dbIds.circles, 'Circle Name', n)),
      )).filter((id): id is string => id !== null);

      await notion.updatePage(sourceMeetingPageId, {
        ...(data.meeting_summary ? { Summary: N.richTextLong(data.meeting_summary.detailed || data.meeting_summary.short) } : {}),
        ...(participantRelationIds.length ? { Participants:     N.relation(participantRelationIds) } : {}),
        ...(meetingCircleIds.length       ? { 'Related Circles': N.relation(meetingCircleIds)      } : {}),
        'Canon Review Required': N.checkbox(canonReviewRequired),
        'Sensitive Review Required': N.checkbox(sensitiveReviewRequired),
        'Processing Status': N.select('Processed'),
        'Last Processed At': N.date(new Date().toISOString()),
      });
    }

    // ── 15. Auto-log Interaction record (contact history) ────────────────────
    if (notion.dbIds.interactions && profileIdMap.size > 0) {
      try {
        const contactIds = [...profileIdMap.values()];
        const isMeeting  = !!data.meeting_summary;
        const type       = isMeeting ? 'Meeting' : 'Email';
        const direction  = isMeeting ? 'Internal' : 'Inbound';
        const rawData    = data as Record<string, any>;
        const summary    = rawData.meeting_summary?.short ?? rawData.email_summary?.summary ?? '';
        const label      = contactIds.length === 1
          ? [...profileIdMap.keys()][0]
          : `${contactIds.length} contacts`;
        await notion.createPage(notion.dbIds.interactions, {
          Name:      N.title(`${type} · ${label} · ${sourceDate}`),
          Date:      N.date(sourceDate),
          Type:      N.select(type),
          Direction: N.select(direction),
          ...(summary ? { Summary: N.richText(summary.slice(0, 2000)) } : {}),
          Contacts:  N.relation(contactIds),
          ...(sourceMeetingPageId  ? { Meeting:        N.relation([sourceMeetingPageId])  } : {}),
          ...(sourceEmailPageId    ? { 'Source Email': N.relation([sourceEmailPageId])    } : {}),
          'Logged By': N.richText('Sera'),
          'Follow-up Needed': N.checkbox(false),
        });
      } catch (err) {
        logger.warn({ err }, 'Interaction log failed — non-fatal');
      }
    }

    return { createdRecords: created, canonReviewRequired, sensitiveReviewRequired, sensitiveRecordIds, canonRecordIds };
  }

}
