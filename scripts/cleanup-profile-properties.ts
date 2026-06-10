/**
 * Deletes the redundant 'Circle Affiliation' (multiSelect) and
 * 'Suggested Connections' (richText) properties from the Profiles database.
 *
 * Circle Affiliation is superseded by the Circle Memberships two-way relation.
 * Suggested Connections is superseded by the full relational graph.
 *
 * Usage: railway run npx ts-node scripts/cleanup-profile-properties.ts
 * Safe to re-run: skips properties that no longer exist.
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

const PROFILES_DB = '3680a88e-f36a-819f-9074-f4fcc0405569';
const PROPS_TO_DELETE = ['Circle Affiliation', 'Suggested Connections'];

async function getProps(dbId: string): Promise<Record<string, any>> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).properties ?? {};
}

async function deleteProps(dbId: string, names: string[]): Promise<void> {
  const existing = await getProps(dbId);
  const toDelete = names.filter((n) => {
    if (!existing[n]) { console.log(`  skip '${n}' — not found (already deleted?)`); return false; }
    return true;
  });
  if (toDelete.length === 0) { console.log('  Nothing to delete.'); return; }

  const payload: Record<string, null> = {};
  for (const n of toDelete) payload[n] = null;

  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ properties: payload }),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
  for (const n of toDelete) console.log(`  ✓ Deleted '${n}'`);
}

async function main() {
  console.log('Removing redundant properties from Profiles database…\n');
  await deleteProps(PROFILES_DB, PROPS_TO_DELETE);
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
