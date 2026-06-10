/**
 * Adds two-way relations for Tasks and Projects databases:
 *
 *   Tasks.Owner         richText → relation → Profiles   (back-ref: Tasks Owned)
 *   Tasks.Project       (new)    → relation → Projects   (back-ref: Tasks)
 *   Projects.Project Lead richText → relation → Profiles (back-ref: Projects Led)
 *   Projects.Circle     richText → relation → Circles    (back-ref: Projects)
 *
 * Safe to re-run: each step checks whether the target state already exists.
 *
 * Usage: railway run npx ts-node scripts/migrate-add-task-project-relations.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const TASKS_DB     = process.env.NOTION_DB_TASKS;
const PROJECTS_DB  = process.env.NOTION_DB_PROJECTS;
const PROFILES_DB  = process.env.NOTION_DB_PROFILES;
const CIRCLES_DB   = process.env.NOTION_DB_CIRCLES;

for (const [k, v] of Object.entries({ TASKS_DB, PROJECTS_DB, PROFILES_DB, CIRCLES_DB })) {
  if (!v) { console.error(`Missing env var NOTION_DB_${k.replace('_DB', '')}`); process.exit(1); }
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

async function renameProperty(dbId: string, oldName: string, newName: string, typeConfig: any): Promise<void> {
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

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${label} … `);
  try {
    await fn();
    await new Promise(r => setTimeout(r, 400));
  } catch (err) {
    console.log('✗ error');
    console.error(`    ${err}`);
    process.exit(1);
  }
}

async function main() {
  console.log('Migrating Tasks and Projects → relations…\n');

  // ── Tasks ──────────────────────────────────────────────────────────────────

  await step('Tasks: rename Owner (richText) → Owner Text', () =>
    renameProperty(TASKS_DB!, 'Owner', 'Owner Text', { rich_text: {} }));

  await step('Tasks: add Owner relation → Profiles (back-ref: Tasks Owned)', () =>
    addRelation(TASKS_DB!, 'Owner', PROFILES_DB!, 'Tasks Owned'));

  await step('Tasks: add Project relation → Projects (back-ref: Tasks)', () =>
    addRelation(TASKS_DB!, 'Project', PROJECTS_DB!, 'Tasks'));

  // ── Projects ───────────────────────────────────────────────────────────────

  await step('Projects: rename Project Lead (richText) → Project Lead Text', () =>
    renameProperty(PROJECTS_DB!, 'Project Lead', 'Project Lead Text', { rich_text: {} }));

  await step('Projects: add Project Lead relation → Profiles (back-ref: Projects Led)', () =>
    addRelation(PROJECTS_DB!, 'Project Lead', PROFILES_DB!, 'Projects Led'));

  await step('Projects: rename Circle (richText) → Circle Text', () =>
    renameProperty(PROJECTS_DB!, 'Circle', 'Circle Text', { rich_text: {} }));

  await step('Projects: add Circle relation → Circles (back-ref: Projects)', () =>
    addRelation(PROJECTS_DB!, 'Circle', CIRCLES_DB!, 'Projects'));

  console.log('\nDone. Deploy updated worker code before next email processing.');
}

main().catch(err => { console.error(err); process.exit(1); });
