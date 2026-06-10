/**
 * Adds "Primary Sector" select property to Profiles and Projects databases.
 *
 * Uses the same 7 sector values as the Circles.Sector property so views can
 * be filtered and grouped consistently across all three tables.
 *
 * Safe to re-run — Notion ignores PATCH if the property already exists.
 *
 * Usage: npx ts-node scripts/migrate-add-primary-sector.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_KEY  = process.env.NOTION_API_KEY;
const PROFILES_DB = process.env.NOTION_DB_PROFILES;
const PROJECTS_DB = process.env.NOTION_DB_PROJECTS;

if (!NOTION_KEY)    { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!PROFILES_DB)   { console.error('NOTION_DB_PROFILES required'); process.exit(1); }
if (!PROJECTS_DB)   { console.error('NOTION_DB_PROJECTS required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const SECTOR_OPTIONS = [
  'Sector 1 — Health & Holistic Wellness',
  'Sector 2 — Governance & Justice',
  'Sector 3 — Culture & Spirit',
  'Sector 4 — Learning & Innovation',
  'Sector 5 — Ecology & Infrastructure',
  'Sector 6 — Economy & Exchange',
  'Sector 7 — Media & Technology',
];

const sectorProperty = {
  'Primary Sector': {
    select: {
      options: SECTOR_OPTIONS.map(name => ({ name })),
    },
  },
};

async function addProp(label: string, dbId: string): Promise<void> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties: sectorProperty }),
  });
  if (!r.ok) {
    const d = await r.json() as any;
    throw new Error(`${label}: ${r.status} — ${d.message}`);
  }
  console.log(`  OK    ${label}`);
}

async function main() {
  console.log('\n' + '='.repeat(72));
  console.log('  Add "Primary Sector" to Profiles and Projects');
  console.log('='.repeat(72) + '\n');
  await addProp('Profiles database', PROFILES_DB!);
  await addProp('Projects database', PROJECTS_DB!);
  console.log('\n  Done. Sera will populate this field during extraction.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
