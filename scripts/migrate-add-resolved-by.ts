/**
 * Adds a "Resolved By" relation on CCOS Ledger Entries that links a tension/governance
 * action to the Decision or Canon Change that resolved it.
 *
 * Also adds a reciprocal "Resolved Tensions" relation on Decision Candidates so you can
 * navigate from a decision back to all the tensions it addressed.
 *
 * Safe to re-run. Usage: npx ts-node scripts/migrate-add-resolved-by.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DBS: Record<string, string | undefined> = {
  CCOS_LEDGER_ENTRIES:    process.env.NOTION_DB_CCOS_LEDGER_ENTRIES,
  DECISION_CANDIDATES:    process.env.NOTION_DB_DECISION_CANDIDATES,
  CANON_CHANGE_REQUESTS:  process.env.NOTION_DB_CANON_CHANGE_REQUESTS,
};

for (const [k, v] of Object.entries(DBS)) {
  if (!v) { console.error(`Missing env var NOTION_DB_${k}`); process.exit(1); }
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

async function addRelation(
  dbId: string,
  propName: string,
  targetDbId: string,
  dualPropName: string,
): Promise<void> {
  const props = await getProps(dbId);
  if (props[propName]?.type === 'relation') {
    console.log(`    skip '${propName}' — relation property already exists`);
    return;
  }
  if (props[propName]) {
    throw new Error(`Property '${propName}' already exists as type '${props[propName].type}'`);
  }
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      properties: {
        [propName]: {
          relation: {
            database_id: targetDbId,
            type: 'dual_property',
            dual_property: {
              synced_property_name: dualPropName,
            },
          },
        },
      },
    }),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
  console.log(`    '${propName}' relation created`);
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${label} ... `);
  try {
    await fn();
    await new Promise(r => setTimeout(r, 300));
    process.stdout.write('ok\n');
  } catch (err) {
    process.stdout.write('FAILED\n');
    console.error(`    ${err}`);
    process.exit(1);
  }
}

async function main() {
  console.log('Adding Resolved By relation to CCOS Ledger Entries...\n');

  await step('CCOS Ledger Entries: add Resolved By (-> Decision Candidates)', () =>
    addRelation(
      DBS.CCOS_LEDGER_ENTRIES!,
      'Resolved By Decision',
      DBS.DECISION_CANDIDATES!,
      'Resolved Tensions',
    ));

  await step('CCOS Ledger Entries: add Resolved By Canon Change (-> Canon Change Requests)', () =>
    addRelation(
      DBS.CCOS_LEDGER_ENTRIES!,
      'Resolved By Canon Change',
      DBS.CANON_CHANGE_REQUESTS!,
      'Resolved Tensions',
    ));

  console.log('\nDone. Ledger entries can now be linked to the decisions and canon changes that resolved them.');
}

main().catch(err => { console.error(err); process.exit(1); });
