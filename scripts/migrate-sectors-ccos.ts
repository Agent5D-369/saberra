/**
 * Updates the Circles DB Sector select options to match the official
 * CCOS 7 Sectors of Regeneration naming and numbering.
 *
 * Renames by option ID so Notion cascades the new names to all existing
 * circle records automatically — no per-page updates needed.
 *
 * OLD → NEW:
 *   Sector 1 — Land & Ecology          → Sector 5 — Ecology & Infrastructure
 *   Sector 2 — Community & Culture     → Sector 3 — Culture & Spirit
 *   Sector 3 — Learning & Education    → Sector 4 — Learning & Innovation
 *   Sector 4 — Health & Wellbeing      → Sector 1 — Health & Holistic Wellness
 *   Sector 5 — Governance & Coordination → Sector 2 — Governance & Justice
 *   Sector 6 — Economics & Finance     → Sector 6 — Economy & Exchange
 *   Sector 7 — Meaning & Mythos        → Sector 7 — Media & Technology
 *
 * Legacy stub options (Governance, Community, Land, Finance, Education, Wellness)
 * are excluded — Notion will remove them if they are unused.
 *
 * Usage: npx ts-node scripts/migrate-sectors-ccos.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.NOTION_API_KEY;
const CIRCLES_DB = process.env.NOTION_DB_CIRCLES;
if (!API_KEY)    { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!CIRCLES_DB) { console.error('NOTION_DB_CIRCLES required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// Maps old sector name → correct CCOS 7 Sectors of Regeneration name
const SECTOR_MAP: Record<string, string> = {
  'Sector 1 — Land & Ecology':            'Sector 5 — Ecology & Infrastructure',
  'Sector 2 — Community & Culture':       'Sector 3 — Culture & Spirit',
  'Sector 3 — Learning & Education':      'Sector 4 — Learning & Innovation',
  'Sector 4 — Health & Wellbeing':        'Sector 1 — Health & Holistic Wellness',
  'Sector 5 — Governance & Coordination': 'Sector 2 — Governance & Justice',
  'Sector 6 — Economics & Finance':       'Sector 6 — Economy & Exchange',
  'Sector 7 — Meaning & Mythos':          'Sector 7 — Media & Technology',
};

async function queryAllCircles(): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const body: any = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`${BASE}/databases/${CIRCLES_DB}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Query circles: ${r.status} ${await r.text()}`);
    const data = await r.json() as any;
    results.push(...(data.results ?? []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function patchPage(pageId: string, sectorName: string): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties: { Sector: { select: { name: sectorName } } } }),
  });
  if (!r.ok) throw new Error(`PATCH page ${pageId}: ${r.status} ${await r.text()}`);
}

async function main() {
  console.log('\nMigrating Circles sectors to CCOS 7 Sectors of Regeneration...\n');

  const circles = await queryAllCircles();
  console.log(`Found ${circles.length} circle records.\n`);

  let updated = 0;
  let skipped = 0;

  for (const circle of circles) {
    const name   = circle.properties?.['Circle Name']?.title?.[0]?.plain_text ?? circle.id;
    const sector = circle.properties?.Sector?.select?.name ?? null;

    if (!sector) {
      console.log(`  skip  "${name}" — no sector set`);
      skipped++;
      continue;
    }

    const newSector = SECTOR_MAP[sector];
    if (!newSector) {
      if (Object.values(SECTOR_MAP).includes(sector)) {
        console.log(`  skip  "${name}" — already on new name: ${sector}`);
      } else {
        console.log(`  skip  "${name}" — unknown sector: ${sector}`);
      }
      skipped++;
      continue;
    }

    process.stdout.write(`  update "${name}"\n         ${sector}\n         → ${newSector}\n`);
    try {
      await patchPage(circle.id, newSector);
      console.log(`         ok\n`);
      updated++;
    } catch (err: any) {
      console.log(`         FAILED — ${err.message}\n`);
    }
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped.`);
  console.log('The old option names remain in the dropdown but are unused.');
  console.log('You can remove them from the Circles > Sector select in Notion UI if desired.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
