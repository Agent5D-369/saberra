/**
 * Adds five relation properties that exist in code but were never added to the live Notion schema.
 * Silent write failures in ClaudeExtractionService are caused by these missing properties.
 *
 * Relations added:
 *   Role Assignments.Role Holder  → Profiles         (back-ref: Role Assignments)
 *   CCOS Ledger Entries.Circle    → Circles           (back-ref: Ledger Entries)
 *   CCOS Ledger Entries.Role      → Roles             (back-ref: Ledger Entries)
 *   Circles.Circle Lead           → Profiles          (back-ref: Circles Led)
 *   Projects.Circle               → Circles           (back-ref: Projects)
 *
 * Usage: npx ts-node scripts/migrate-add-missing-relations.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DB_ROLE_ASSIGNMENTS  = process.env.NOTION_DB_ROLE_ASSIGNMENTS;
const DB_CCOS_LEDGER       = process.env.NOTION_DB_CCOS_LEDGER_ENTRIES;
const DB_CIRCLES           = process.env.NOTION_DB_CIRCLES;
const DB_ROLES             = process.env.NOTION_DB_ROLES;
const DB_PROJECTS          = process.env.NOTION_DB_PROJECTS;
const DB_PROFILES          = process.env.NOTION_DB_PROFILES;

for (const [k, v] of Object.entries({
  NOTION_DB_ROLE_ASSIGNMENTS: DB_ROLE_ASSIGNMENTS,
  NOTION_DB_CCOS_LEDGER_ENTRIES: DB_CCOS_LEDGER,
  NOTION_DB_CIRCLES: DB_CIRCLES,
  NOTION_DB_ROLES: DB_ROLES,
  NOTION_DB_PROJECTS: DB_PROJECTS,
  NOTION_DB_PROFILES: DB_PROFILES,
})) {
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

async function main() {
  console.log('\n── Adding missing relations ──\n');

  await addRelation(
    DB_ROLE_ASSIGNMENTS!, 'Role Assignments.Role Holder → Profiles',
    'Role Holder', DB_PROFILES!, 'Role Assignments',
  );

  await addRelation(
    DB_CCOS_LEDGER!, 'CCOS Ledger Entries.Circle → Circles',
    'Circle', DB_CIRCLES!, 'Ledger Entries',
  );

  await addRelation(
    DB_CCOS_LEDGER!, 'CCOS Ledger Entries.Role → Roles',
    'Role', DB_ROLES!, 'Ledger Entries',
  );

  await addRelation(
    DB_CIRCLES!, 'Circles.Circle Lead → Profiles',
    'Circle Lead', DB_PROFILES!, 'Circles Led',
  );

  await addRelation(
    DB_PROJECTS!, 'Projects.Circle → Circles',
    'Circle', DB_CIRCLES!, 'Projects',
  );

  console.log('\nDone. Run tsc --noEmit to confirm no new type errors.\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
