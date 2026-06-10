/**
 * Adds role relation fields to Tasks, Decision Candidates, and Risks databases
 * to support Teal governance — assign work to roles, not just people.
 *
 *   Tasks.Assigned Role             → Roles  (back-ref: Tasks by Role)
 *   Decision Candidates.Decision Maker Role → Roles  (back-ref: Decisions by Role)
 *   Risks.Owner Role                → Roles  (back-ref: Risks by Role)
 *
 * Safe to re-run: each step checks whether the target state already exists.
 *
 * Usage: npx ts-node scripts/migrate-add-role-fields.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const TASKS_DB      = process.env.NOTION_DB_TASKS;
const DECISIONS_DB  = process.env.NOTION_DB_DECISION_CANDIDATES;
const RISKS_DB      = process.env.NOTION_DB_RISKS;
const ROLES_DB      = process.env.NOTION_DB_ROLES;

for (const [k, v] of Object.entries({ TASKS_DB, DECISIONS_DB, RISKS_DB, ROLES_DB })) {
  if (!v) { console.error(`Missing env var for ${k}`); process.exit(1); }
}

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
    method: 'PATCH', headers: H, body: JSON.stringify({ properties }),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
  return (await r.json()) as any;
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
    throw new Error(`Property '${propName}' exists but is type '${props[propName].type}' — cannot convert`);
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
    console.log(`    '${propName}' relation created (back-ref rename skipped — ID not returned)`);
    return;
  }

  await patchDb(targetDbId, { [syncedId]: { name: backRefName } });
  console.log(`    '${propName}' relation created, back-ref renamed to '${backRefName}'`);
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${label} ... `);
  try {
    await fn();
    await new Promise(r => setTimeout(r, 400));
    process.stdout.write('ok\n');
  } catch (err) {
    process.stdout.write('FAILED\n');
    console.error(`    ${err}`);
    process.exit(1);
  }
}

async function main() {
  console.log('Adding role relation fields to Tasks, Decisions, and Risks...\n');

  await step('Tasks: add Assigned Role relation -> Roles (back-ref: Tasks by Role)', () =>
    addRelation(TASKS_DB!, 'Assigned Role', ROLES_DB!, 'Tasks by Role'));

  await step('Decision Candidates: add Decision Maker Role relation -> Roles (back-ref: Decisions by Role)', () =>
    addRelation(DECISIONS_DB!, 'Decision Maker Role', ROLES_DB!, 'Decisions by Role'));

  await step('Risks: add Owner Role relation -> Roles (back-ref: Risks by Role)', () =>
    addRelation(RISKS_DB!, 'Owner Role', ROLES_DB!, 'Risks by Role'));

  console.log('\nDone. Deploy updated worker code to activate role-based extraction.');
}

main().catch(err => { console.error(err); process.exit(1); });
