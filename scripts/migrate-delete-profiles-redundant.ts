/**
 * Deletes 12 redundant/duplicate relation properties from the Profiles database.
 *
 * Properties removed:
 *   - Numbered duplicates:  Circles Led 1, Decisions Made 1, Decisions to Review 1,
 *                           Memories to Review 1, Projects Led 1, Role Assignments 1
 *   - Ambiguous duplicates: Tasks (keep Tasks Owned), Risks Owned (keep Owned Risks),
 *                           Canon Changes Implemented, Canon Changes to Review (keep Canon Reviews)
 *   - Self-relation pair:   Connected To, Related to Profiles (Connected To)
 *
 * Usage: railway run npx ts-node scripts/migrate-delete-profiles-redundant.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const PROFILES_DB = process.env.NOTION_DB_PROFILES;
if (!PROFILES_DB) { console.error('NOTION_DB_PROFILES required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const PROPERTIES_TO_DELETE = [
  'Circles Led 1',
  'Decisions Made 1',
  'Decisions to Review 1',
  'Memories to Review 1',
  'Projects Led 1',
  'Role Assignments 1',
  'Tasks',
  'Risks Owned',
  'Canon Changes Implemented',
  'Canon Changes to Review',
  'Connected To',
  'Related to Profiles (Connected To)',
];

async function getProps(dbId: string): Promise<Record<string, any>> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).properties ?? {};
}

async function deleteProperty(dbId: string, propName: string): Promise<void> {
  const body = { properties: { [propName]: null } };
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`DELETE prop "${propName}": ${r.status} ${text}`);
  }
}

async function main() {
  console.log('Fetching Profiles DB schema...');
  const props = await getProps(PROFILES_DB!);
  const existingNames = new Set(Object.keys(props));

  console.log(`Found ${existingNames.size} properties on Profiles DB`);

  for (const propName of PROPERTIES_TO_DELETE) {
    if (!existingNames.has(propName)) {
      console.log(`  SKIP  "${propName}" — not found (already deleted?)`);
      continue;
    }
    try {
      await deleteProperty(PROFILES_DB!, propName);
      console.log(`  OK    deleted "${propName}"`);
    } catch (err) {
      console.error(`  FAIL  "${propName}": ${(err as Error).message}`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
