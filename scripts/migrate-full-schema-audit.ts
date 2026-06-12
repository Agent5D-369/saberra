/**
 * Comprehensive Notion schema audit for the Amora Living Memory Hub.
 *
 * Adds all missing relations, renames conflicting richText fields, adds
 * rollup count fields on Meetings, and removes redundant text backups.
 *
 * Safe to re-run: every step is idempotent — skips if already done.
 *
 * Usage: railway run npx ts-node scripts/migrate-full-schema-audit.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

// ─── API key ──────────────────────────────────────────────────────────────────

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

// ─── DB IDs from env ──────────────────────────────────────────────────────────

const REQUIRED_ENV: Record<string, string> = {
  NOTION_DB_MEETINGS:              'MEETINGS_DB',
  NOTION_DB_TASKS:                 'TASKS_DB',
  NOTION_DB_DECISION_CANDIDATES:   'DECISION_CANDIDATES_DB',
  NOTION_DB_RISKS:                 'RISKS_DB',
  NOTION_DB_MEMORY_REVIEW_QUEUE:   'MEMORY_REVIEW_QUEUE_DB',
  NOTION_DB_CANON_CHANGE_REQUESTS: 'CANON_CHANGE_REQUESTS_DB',
  NOTION_DB_CCOS_LEDGER_ENTRIES:   'CCOS_LEDGER_ENTRIES_DB',
  NOTION_DB_CIRCLES:               'CIRCLES_DB',
  NOTION_DB_ROLES:                 'ROLES_DB',
  NOTION_DB_ROLE_ASSIGNMENTS:      'ROLE_ASSIGNMENTS_DB',
  NOTION_DB_PROFILES:              'PROFILES_DB',
  NOTION_DB_PROJECTS:              'PROJECTS_DB',
};

const missing = Object.keys(REQUIRED_ENV).filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required environment variables:');
  missing.forEach(k => console.error(`  ${k}`));
  process.exit(1);
}

const MEETINGS_DB              = process.env.NOTION_DB_MEETINGS!;
const TASKS_DB                 = process.env.NOTION_DB_TASKS!;
const DECISION_CANDIDATES_DB   = process.env.NOTION_DB_DECISION_CANDIDATES!;
const RISKS_DB                 = process.env.NOTION_DB_RISKS!;
const MEMORY_REVIEW_QUEUE_DB   = process.env.NOTION_DB_MEMORY_REVIEW_QUEUE!;
const CANON_CHANGE_REQUESTS_DB = process.env.NOTION_DB_CANON_CHANGE_REQUESTS!;
const CCOS_LEDGER_ENTRIES_DB   = process.env.NOTION_DB_CCOS_LEDGER_ENTRIES!;
const CIRCLES_DB               = process.env.NOTION_DB_CIRCLES!;
const ROLES_DB                 = process.env.NOTION_DB_ROLES!;
const ROLE_ASSIGNMENTS_DB      = process.env.NOTION_DB_ROLE_ASSIGNMENTS!;
const PROFILES_DB              = process.env.NOTION_DB_PROFILES!;
const PROJECTS_DB              = process.env.NOTION_DB_PROJECTS!;

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function getProps(dbId: string): Promise<Record<string, any>> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).properties ?? {};
}

async function patchDb(dbId: string, properties: Record<string, any>): Promise<any> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ properties }),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
  return (await r.json()) as any;
}

// ─── Migration helpers ────────────────────────────────────────────────────────

async function renameProperty(
  dbId: string,
  oldName: string,
  newName: string,
  typeConfig: Record<string, any> = {},
): Promise<void> {
  const props = await getProps(dbId);
  if (!props[oldName]) {
    console.log(`    skip rename '${oldName}' → '${newName}' — source not found (already migrated?)`);
    return;
  }
  if (props[newName]) {
    console.log(`    skip rename '${oldName}' → '${newName}' — target already exists`);
    return;
  }
  await patchDb(dbId, { [oldName]: { name: newName, ...typeConfig } });
  console.log(`    renamed '${oldName}' → '${newName}'`);
}

async function addRelation(
  dbId: string,
  propName: string,
  targetDbId: string,
  backRefName: string,
): Promise<void> {
  const props = await getProps(dbId);
  if (props[propName]?.type === 'relation') {
    console.log(`    skip '${propName}' — relation already exists`);
    return;
  }
  if (props[propName]) {
    throw new Error(`Property '${propName}' exists but is not a relation — run rename step first`);
  }

  const result = await patchDb(dbId, {
    [propName]: {
      relation: {
        database_id: targetDbId,
        type: 'dual_property',
        dual_property: {},
      },
    },
  });

  const newProp = result.properties?.[propName];
  if (!newProp || newProp.type !== 'relation') {
    throw new Error(`'${propName}' relation was not created as expected`);
  }

  const syncedId = newProp.relation?.dual_property?.synced_property_id;
  if (!syncedId) {
    console.log(`    '${propName}' relation created (back-ref ID not returned — rename manually if needed)`);
    return;
  }

  await patchDb(targetDbId, { [syncedId]: { name: backRefName } });
  console.log(`    '${propName}' relation created, back-ref renamed to '${backRefName}'`);
}

async function deleteProperty(dbId: string, propName: string): Promise<void> {
  const props = await getProps(dbId);
  if (!props[propName]) {
    console.log(`    skip delete '${propName}' — not found`);
    return;
  }
  await patchDb(dbId, { [propName]: null });
  console.log(`    deleted '${propName}'`);
}

async function addRollup(
  dbId: string,
  propName: string,
  relationPropName: string,
  rollupPropName: string,
  fn: string,
): Promise<void> {
  const props = await getProps(dbId);
  if (props[propName]?.type === 'rollup') {
    console.log(`    skip '${propName}' — rollup already exists`);
    return;
  }
  if (props[propName]) {
    console.log(`    skip '${propName}' — property exists but is not a rollup (type: ${props[propName].type})`);
    return;
  }

  try {
    await patchDb(dbId, {
      [propName]: {
        rollup: {
          relation_property_name: relationPropName,
          rollup_property_name: rollupPropName,
          function: fn,
        },
      },
    });
    console.log(`    '${propName}' rollup created`);
  } catch (err) {
    console.warn(`    ⚠ Could not create '${propName}' rollup via API: ${err}`);
    console.warn(`      Set up '${propName}' rollup manually in Notion UI: Meetings → ${relationPropName} → ${fn}`);
  }
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${label} …\n`);
  try {
    await fn();
    await new Promise(r => setTimeout(r, 400));
  } catch (err) {
    console.error(`  ✗ FAILED: ${err}`);
    process.exit(1);
  }
}

function phaseHeader(n: number, title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Phase ${n} — ${title}`);
  console.log('─'.repeat(60));
}

async function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('Amora Living Memory Hub — Full Schema Audit Migration');
  console.log('═'.repeat(60));

  // ── Phase 1 — Entity → Meeting back-relations ───────────────────────────────
  phaseHeader(1, 'Entity → Meeting back-relations (needed for rollups)');

  await step('Tasks: add Meeting relation → Meetings (back-ref: Meeting Tasks)', () =>
    addRelation(TASKS_DB, 'Meeting', MEETINGS_DB, 'Meeting Tasks'));

  await step('Decision Candidates: add Meeting relation → Meetings (back-ref: Decisions)', () =>
    addRelation(DECISION_CANDIDATES_DB, 'Meeting', MEETINGS_DB, 'Decisions'));

  await step('Risks: add Meeting relation → Meetings (back-ref: Meeting Risks)', () =>
    addRelation(RISKS_DB, 'Meeting', MEETINGS_DB, 'Meeting Risks'));

  await step('Memory Review Queue: add Meeting relation → Meetings (back-ref: Memory Candidates)', () =>
    addRelation(MEMORY_REVIEW_QUEUE_DB, 'Meeting', MEETINGS_DB, 'Memory Candidates'));

  await delay();

  // ── Phase 2 — Decision Candidates relations ─────────────────────────────────
  phaseHeader(2, 'Decision Candidates relations');

  await step('Decision Candidates: rename Decision Maker (richText) → Decision Maker Text', () =>
    renameProperty(DECISION_CANDIDATES_DB, 'Decision Maker', 'Decision Maker Text', { rich_text: {} }));

  await step('Decision Candidates: add Decision Maker relation → Profiles (back-ref: Decisions Made)', () =>
    addRelation(DECISION_CANDIDATES_DB, 'Decision Maker', PROFILES_DB, 'Decisions Made'));

  await step('Decision Candidates: rename Reviewer (richText) → Reviewer Text', () =>
    renameProperty(DECISION_CANDIDATES_DB, 'Reviewer', 'Reviewer Text', { rich_text: {} }));

  await step('Decision Candidates: add Reviewer relation → Profiles (back-ref: Decisions to Review)', () =>
    addRelation(DECISION_CANDIDATES_DB, 'Reviewer', PROFILES_DB, 'Decisions to Review'));

  await delay();

  // ── Phase 3 — Risks relations ───────────────────────────────────────────────
  phaseHeader(3, 'Risks relations');

  await step('Risks: rename Owner (richText) → Owner Text', () =>
    renameProperty(RISKS_DB, 'Owner', 'Owner Text', { rich_text: {} }));

  await step('Risks: add Owner relation → Profiles (back-ref: Owned Risks)', () =>
    addRelation(RISKS_DB, 'Owner', PROFILES_DB, 'Owned Risks'));

  await delay();

  // ── Phase 4 — Memory Review Queue relations ─────────────────────────────────
  phaseHeader(4, 'Memory Review Queue relations');

  await step('Memory Review Queue: rename Reviewer (richText) → Reviewer Text', () =>
    renameProperty(MEMORY_REVIEW_QUEUE_DB, 'Reviewer', 'Reviewer Text', { rich_text: {} }));

  await step('Memory Review Queue: add Reviewer relation → Profiles (back-ref: Memories to Review)', () =>
    addRelation(MEMORY_REVIEW_QUEUE_DB, 'Reviewer', PROFILES_DB, 'Memories to Review'));

  await delay();

  // ── Phase 5 — Canon Change Requests relations ───────────────────────────────
  phaseHeader(5, 'Canon Change Requests relations');

  await step('Canon Change Requests: rename Reviewer (richText) → Reviewer Text', () =>
    renameProperty(CANON_CHANGE_REQUESTS_DB, 'Reviewer', 'Reviewer Text', { rich_text: {} }));

  await step('Canon Change Requests: add Reviewer relation → Profiles (back-ref: Canon Reviews)', () =>
    addRelation(CANON_CHANGE_REQUESTS_DB, 'Reviewer', PROFILES_DB, 'Canon Reviews'));

  await delay();

  // ── Phase 6 — CCOS Ledger Entries relations ─────────────────────────────────
  phaseHeader(6, 'CCOS Ledger Entries relations');

  await step('CCOS Ledger Entries: rename Circle (richText) → Circle Text', () =>
    renameProperty(CCOS_LEDGER_ENTRIES_DB, 'Circle', 'Circle Text', { rich_text: {} }));

  await step('CCOS Ledger Entries: add Circle relation → Circles (back-ref: Ledger Entries)', () =>
    addRelation(CCOS_LEDGER_ENTRIES_DB, 'Circle', CIRCLES_DB, 'Ledger Entries'));

  await step('CCOS Ledger Entries: rename Role (richText) → Role Text', () =>
    renameProperty(CCOS_LEDGER_ENTRIES_DB, 'Role', 'Role Text', { rich_text: {} }));

  await step('CCOS Ledger Entries: add Role relation → Roles (back-ref: Ledger Entries)', () =>
    addRelation(CCOS_LEDGER_ENTRIES_DB, 'Role', ROLES_DB, 'Ledger Entries'));

  await delay();

  // ── Phase 7 — Circles relations ─────────────────────────────────────────────
  phaseHeader(7, 'Circles relations');

  await step('Circles: rename Circle Lead (richText) → Circle Lead Text', () =>
    renameProperty(CIRCLES_DB, 'Circle Lead', 'Circle Lead Text', { rich_text: {} }));

  await step('Circles: add Circle Lead relation → Profiles (back-ref: Circles Led)', () =>
    addRelation(CIRCLES_DB, 'Circle Lead', PROFILES_DB, 'Circles Led'));

  await step('Circles: rename Parent Circle (richText) → Parent Circle Text', () =>
    renameProperty(CIRCLES_DB, 'Parent Circle', 'Parent Circle Text', { rich_text: {} }));

  await step('Circles: add Parent Circle self-relation → Circles (back-ref: Sub-circles)', () =>
    addRelation(CIRCLES_DB, 'Parent Circle', CIRCLES_DB, 'Sub-circles'));

  await delay();

  // ── Phase 8 — Roles relations ───────────────────────────────────────────────
  phaseHeader(8, 'Roles relations');

  await step('Roles: rename Circle (richText) → Circle Text', () =>
    renameProperty(ROLES_DB, 'Circle', 'Circle Text', { rich_text: {} }));

  await step('Roles: add Circle relation → Circles (back-ref: Circle Roles)', () =>
    addRelation(ROLES_DB, 'Circle', CIRCLES_DB, 'Circle Roles'));

  await delay();

  // ── Phase 9 — Role Assignments relations ────────────────────────────────────
  phaseHeader(9, 'Role Assignments relations');

  await step('Role Assignments: rename Role (richText) → Role Text', () =>
    renameProperty(ROLE_ASSIGNMENTS_DB, 'Role', 'Role Text', { rich_text: {} }));

  await step('Role Assignments: add Role relation → Roles (back-ref: Role Assignments)', () =>
    addRelation(ROLE_ASSIGNMENTS_DB, 'Role', ROLES_DB, 'Role Assignments'));

  await step('Role Assignments: rename Role Holder (richText) → Role Holder Text', () =>
    renameProperty(ROLE_ASSIGNMENTS_DB, 'Role Holder', 'Role Holder Text', { rich_text: {} }));

  await step('Role Assignments: add Role Holder relation → Profiles (back-ref: Role Assignments)', () =>
    addRelation(ROLE_ASSIGNMENTS_DB, 'Role Holder', PROFILES_DB, 'Role Assignments'));

  await step('Role Assignments: rename Circle (richText) → Circle Text', () =>
    renameProperty(ROLE_ASSIGNMENTS_DB, 'Circle', 'Circle Text', { rich_text: {} }));

  await step('Role Assignments: add Circle relation → Circles (back-ref: Circle Assignments)', () =>
    addRelation(ROLE_ASSIGNMENTS_DB, 'Circle', CIRCLES_DB, 'Circle Assignments'));

  await delay();

  // ── Phase 10 — Profiles missing relations ───────────────────────────────────
  phaseHeader(10, 'Profiles missing relations');

  await step('Profiles: add Organization self-relation → Profiles (back-ref: Members)', () =>
    addRelation(PROFILES_DB, 'Organization', PROFILES_DB, 'Members'));

  await step('Profiles: add Referred By self-relation → Profiles (back-ref: Referred Others)', () =>
    addRelation(PROFILES_DB, 'Referred By', PROFILES_DB, 'Referred Others'));

  await step('Profiles: add Primary Role relation → Roles (back-ref: Role Holders)', () =>
    addRelation(PROFILES_DB, 'Primary Role', ROLES_DB, 'Role Holders'));

  await step('Profiles: add Circle Memberships relation → Circles (back-ref: Circle Members)', () =>
    addRelation(PROFILES_DB, 'Circle Memberships', CIRCLES_DB, 'Circle Members'));

  await delay();

  // ── Phase 11 — Meeting rollup counts ────────────────────────────────────────
  phaseHeader(11, 'Meeting rollup counts');

  // Decisions Count
  await step('Meetings: delete Decisions Count (number)', () =>
    deleteProperty(MEETINGS_DB, 'Decisions Count'));

  await step('Meetings: add Decisions Count rollup', () =>
    addRollup(MEETINGS_DB, 'Decisions Count', 'Decisions', 'Decision', 'count'));

  // Tasks Count
  await step('Meetings: delete Tasks Count (number)', () =>
    deleteProperty(MEETINGS_DB, 'Tasks Count'));

  await step('Meetings: add Tasks Count rollup', () =>
    addRollup(MEETINGS_DB, 'Tasks Count', 'Meeting Tasks', 'Task', 'count'));

  // Risks Count
  await step('Meetings: delete Risks Count (number)', () =>
    deleteProperty(MEETINGS_DB, 'Risks Count'));

  await step('Meetings: add Risks Count rollup', () =>
    addRollup(MEETINGS_DB, 'Risks Count', 'Meeting Risks', 'Risk', 'count'));

  // Memory Candidates Count
  await step('Meetings: delete Memory Candidates Count (number)', () =>
    deleteProperty(MEETINGS_DB, 'Memory Candidates Count'));

  await step('Meetings: add Memory Candidates Count rollup', () =>
    addRollup(MEETINGS_DB, 'Memory Candidates Count', 'Memory Candidates', 'Proposed Memory', 'count'));

  await delay();

  // ── Phase 12 — Delete redundant text fields ─────────────────────────────────
  phaseHeader(12, 'Delete redundant text fields');

  await step('Meetings: delete Organizer Email', () =>
    deleteProperty(MEETINGS_DB, 'Organizer Email'));

  await step('Meetings: delete Participants Text', () =>
    deleteProperty(MEETINGS_DB, 'Participants Text'));

  await step('Tasks: delete Owner Text', () =>
    deleteProperty(TASKS_DB, 'Owner Text'));

  await step('Projects: delete Project Lead Text', () =>
    deleteProperty(PROJECTS_DB, 'Project Lead Text'));

  await step('Projects: delete Circle Text', () =>
    deleteProperty(PROJECTS_DB, 'Circle Text'));

  await step('Decision Candidates: delete Decision Maker Text', () =>
    deleteProperty(DECISION_CANDIDATES_DB, 'Decision Maker Text'));

  await step('Decision Candidates: delete Reviewer Text', () =>
    deleteProperty(DECISION_CANDIDATES_DB, 'Reviewer Text'));

  await step('Risks: delete Owner Text', () =>
    deleteProperty(RISKS_DB, 'Owner Text'));

  await step('Memory Review Queue: delete Reviewer Text', () =>
    deleteProperty(MEMORY_REVIEW_QUEUE_DB, 'Reviewer Text'));

  await step('Canon Change Requests: delete Reviewer Text', () =>
    deleteProperty(CANON_CHANGE_REQUESTS_DB, 'Reviewer Text'));

  await step('CCOS Ledger Entries: delete Circle Text', () =>
    deleteProperty(CCOS_LEDGER_ENTRIES_DB, 'Circle Text'));

  await step('CCOS Ledger Entries: delete Role Text', () =>
    deleteProperty(CCOS_LEDGER_ENTRIES_DB, 'Role Text'));

  await step('Circles: delete Circle Lead Text', () =>
    deleteProperty(CIRCLES_DB, 'Circle Lead Text'));

  await step('Circles: delete Parent Circle Text', () =>
    deleteProperty(CIRCLES_DB, 'Parent Circle Text'));

  await step('Roles: delete Circle Text', () =>
    deleteProperty(ROLES_DB, 'Circle Text'));

  await step('Role Assignments: delete Role Text', () =>
    deleteProperty(ROLE_ASSIGNMENTS_DB, 'Role Text'));

  await step('Role Assignments: delete Role Holder Text', () =>
    deleteProperty(ROLE_ASSIGNMENTS_DB, 'Role Holder Text'));

  await step('Role Assignments: delete Circle Text', () =>
    deleteProperty(ROLE_ASSIGNMENTS_DB, 'Circle Text'));

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('');
  console.log('═'.repeat(60));
  console.log('✓ Full schema audit migration complete.');
  console.log('  Deploy updated worker code before next email processing.');
  console.log('═'.repeat(60));
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
