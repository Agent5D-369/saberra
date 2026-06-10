/**
 * Adds the Policies database and wires all new structural relations:
 *
 * Phase 1 — Tasks new properties:
 *   Tasks.Estimated Hours  → number (human-maintained running total in 0.25h increments)
 *   Tasks.Source Decision  → relation → Decision Candidates (back-ref: Related Tasks)
 *   Tasks.Source Risk      → relation → Risks (back-ref: Mitigation Tasks)
 *
 * Phase 2 — Create Policies database (prints ID — set as NOTION_DB_POLICIES Railway var)
 *   Policy Name, Policy Area, Status, Current Text Summary, Google Drive Doc,
 *   Review Cadence, Next Review Date, Last Review Date, Effective Date, Notes
 *
 * Phase 3 — Policies relations:
 *   Policies.Approved By         → relation → Profiles   (back-ref: Policies Approved)
 *   Policies.Responsible Circle  → relation → Circles    (back-ref: Circle Policies)
 *
 * Phase 4 — Canon Change Requests:
 *   Canon Change Requests.Affected Policy → relation → Policies (back-ref: Canon Changes)
 *
 * Usage: railway run npx ts-node scripts/migrate-policies-and-new-relations.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const PARENT_PAGE      = process.env.NOTION_PARENT_PAGE_ID;
const DB_TASKS         = process.env.NOTION_DB_TASKS;
const DB_DECISIONS     = process.env.NOTION_DB_DECISION_CANDIDATES;
const DB_RISKS         = process.env.NOTION_DB_RISKS;
const DB_PROFILES      = process.env.NOTION_DB_PROFILES;
const DB_CIRCLES       = process.env.NOTION_DB_CIRCLES;
const DB_CANON         = process.env.NOTION_DB_CANON_CHANGE_REQUESTS;

for (const [k, v] of Object.entries({ NOTION_PARENT_PAGE_ID: PARENT_PAGE, NOTION_DB_TASKS: DB_TASKS, NOTION_DB_DECISION_CANDIDATES: DB_DECISIONS, NOTION_DB_RISKS: DB_RISKS, NOTION_DB_PROFILES: DB_PROFILES, NOTION_DB_CIRCLES: DB_CIRCLES, NOTION_DB_CANON_CHANGE_REQUESTS: DB_CANON })) {
  if (!v) { console.error(`Missing env var ${k}`); process.exit(1); }
}

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function getProps(dbId: string): Promise<Set<string>> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status} ${await r.text()}`);
  return new Set(Object.keys(((await r.json()) as any).properties ?? {}));
}

async function patchDb(dbId: string, body: object): Promise<void> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
}

async function createDb(parentPageId: string, title: string, properties: Record<string, object>): Promise<string> {
  const r = await fetch(`${BASE}/databases`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: title } }],
      properties,
    }),
  });
  if (!r.ok) throw new Error(`CREATE DB "${title}": ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).id as string;
}

async function addNumberProp(dbId: string, label: string, propName: string): Promise<void> {
  const props = await getProps(dbId);
  if (props.has(propName)) { console.log(`  SKIP  ${label} — already exists`); return; }
  await patchDb(dbId, { properties: { [propName]: { number: { format: 'number' } } } });
  console.log(`  OK    ${label}`);
}

async function addRelation(
  dbId: string,
  label: string,
  propName: string,
  targetDbId: string,
  backRefName: string,
): Promise<void> {
  const props = await getProps(dbId);
  if (props.has(propName)) { console.log(`  SKIP  ${label} — already exists`); return; }
  await patchDb(dbId, {
    properties: {
      [propName]: {
        type: 'relation',
        relation: {
          database_id: targetDbId,
          type: 'dual_property',
          dual_property: { synced_property_name: backRefName },
        },
      },
    },
  });
  console.log(`  OK    ${label}`);
}

const CANON_AREA_OPTIONS = [
  'Governing Purpose', 'Policy', 'Circle Definition', 'Role Definition', 'Decision Rights',
  'Legal Commitment', 'Financial Commitment', 'Land Stewardship', 'CCOS Ledger',
  'Public Commitment', 'Unknown',
];

async function main() {
  // ── Phase 1: Tasks new properties ─────────────────────────────────────────
  console.log('\n── Phase 1: Tasks new properties ──');
  await addNumberProp(DB_TASKS!, 'Tasks.Estimated Hours', 'Estimated Hours');
  await addRelation(DB_TASKS!, 'Tasks.Source Decision → Decision Candidates', 'Source Decision', DB_DECISIONS!, 'Related Tasks');
  await addRelation(DB_TASKS!, 'Tasks.Source Risk → Risks', 'Source Risk', DB_RISKS!, 'Mitigation Tasks');

  // ── Phase 2: Create Policies database ─────────────────────────────────────
  console.log('\n── Phase 2: Create Policies database ──');
  let policiesDbId: string;
  const existingPoliciesId = process.env.NOTION_DB_POLICIES;
  if (existingPoliciesId) {
    console.log(`  SKIP  Policies DB already set: ${existingPoliciesId}`);
    policiesDbId = existingPoliciesId;
  } else {
    policiesDbId = await createDb(PARENT_PAGE!, 'Policies', {
      'Policy Name': { title: {} },
      'Policy Area': {
        select: { options: CANON_AREA_OPTIONS.map((name) => ({ name })) },
      },
      Status: {
        select: { options: ['Active', 'Under Review', 'Superseded', 'Draft', 'Archived'].map((name) => ({ name })) },
      },
      'Current Text Summary': { rich_text: {} },
      'Google Drive Doc': { url: {} },
      'Review Cadence': {
        select: { options: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed'].map((name) => ({ name })) },
      },
      'Next Review Date': { date: {} },
      'Last Review Date': { date: {} },
      'Effective Date': { date: {} },
      Notes: { rich_text: {} },
    });
    console.log(`  OK    Policies DB created: ${policiesDbId}`);
    console.log(`\n  ┌─────────────────────────────────────────────────────────────────┐`);
    console.log(`  │  ACTION REQUIRED — set this Railway env var, then redeploy:      │`);
    console.log(`  │  NOTION_DB_POLICIES=${policiesDbId}  │`);
    console.log(`  └─────────────────────────────────────────────────────────────────┘\n`);
  }

  // ── Phase 3: Policies relations ────────────────────────────────────────────
  console.log('\n── Phase 3: Policies relations ──');
  await addRelation(policiesDbId, 'Policies.Approved By → Profiles', 'Approved By', DB_PROFILES!, 'Policies Approved');
  await addRelation(policiesDbId, 'Policies.Responsible Circle → Circles', 'Responsible Circle', DB_CIRCLES!, 'Circle Policies');

  // ── Phase 4: Canon Change Requests.Affected Policy ─────────────────────────
  console.log('\n── Phase 4: Canon Change Requests ──');
  await addRelation(DB_CANON!, 'Canon Change Requests.Affected Policy → Policies', 'Affected Policy', policiesDbId, 'Canon Changes');

  console.log('\nDone.');
  if (!existingPoliciesId) {
    console.log(`\nNext step: railway variables --set NOTION_DB_POLICIES=${policiesDbId} && railway up --service worker`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
