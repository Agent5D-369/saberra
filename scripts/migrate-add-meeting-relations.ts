/**
 * Converts Meetings.Participants (richText) and Meetings.Organizer (richText)
 * to two-way relations pointing at the Profiles database.
 *
 * Steps:
 *   1. Rename Meetings."Participants" → "Participants Text"  (preserve raw value)
 *   2. Rename Meetings."Organizer"    → "Organizer Email"    (preserve raw value)
 *   3. Add Meetings."Participants" as multi-relation → Profiles (back-ref: "Meetings Attended")
 *   4. Add Meetings."Organizer"    as relation       → Profiles (back-ref: "Meetings Organized")
 *
 * Safe to re-run: steps skip if target property already exists or source no longer exists.
 *
 * Usage: railway run npx ts-node scripts/migrate-add-meeting-relations.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const MEETINGS_DB  = '3670a88e-f36a-81f6-9df7-e3e3a8c28063';
const PROFILES_DB  = '3680a88e-f36a-819f-9074-f4fcc0405569';

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
  if (props[propName] && props[propName].type === 'relation') {
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

  // Rename the auto-generated back-ref on the target DB
  await patchDb(targetDbId, { [syncedId]: { name: backRefName } });
  console.log(`    '${propName}' relation created, back-ref renamed to '${backRefName}'`);
}

async function main() {
  console.log('Migrating Meetings → Profiles relations…\n');

  // 1. Rename Participants (richText) → Participants Text
  process.stdout.write('  Step 1: rename Participants → Participants Text … ');
  await renameProperty(MEETINGS_DB, 'Participants', 'Participants Text', { rich_text: {} });
  console.log('done');
  await new Promise(r => setTimeout(r, 400));

  // 2. Rename Organizer (richText) → Organizer Email
  process.stdout.write('  Step 2: rename Organizer → Organizer Email … ');
  await renameProperty(MEETINGS_DB, 'Organizer', 'Organizer Email', { rich_text: {} });
  console.log('done');
  await new Promise(r => setTimeout(r, 400));

  // 3. Add Participants as multi-relation to Profiles
  process.stdout.write('  Step 3: add Participants relation (→ Profiles, back-ref: Meetings Attended) … ');
  await addRelation(MEETINGS_DB, 'Participants', PROFILES_DB, 'Meetings Attended');
  console.log('done');
  await new Promise(r => setTimeout(r, 400));

  // 4. Add Organizer as relation to Profiles
  process.stdout.write('  Step 4: add Organizer relation (→ Profiles, back-ref: Meetings Organized) … ');
  await addRelation(MEETINGS_DB, 'Organizer', PROFILES_DB, 'Meetings Organized');
  console.log('done');

  console.log('\nDone. Deploy updated pipeline code before running this script,');
  console.log('or ensure the pipeline is paused during the rename window.');
}

main().catch(err => { console.error(err); process.exit(1); });
