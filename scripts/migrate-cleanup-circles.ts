/**
 * Cleans up duplicate and legacy circles:
 *
 * 1. Re-points Rep Steward + Admin Facilitator from the sectorless
 *    "Governance and Coordination" duplicate to the canonical "Governance & Coordination"
 * 2. Archives "Governance and Coordination" (sectorless duplicate)
 * 3. Archives 6 legacy pre-script circles (Governance Circle, Community Life Circle, etc.)
 * 4. Fixes wrong sector assignments on Technology & Systems and Communications & Marketing
 *
 * Safe to re-run. Usage: npx ts-node scripts/migrate-cleanup-circles.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const ROLES_DB       = process.env.NOTION_DB_ROLES;
const CIRCLES_DB     = process.env.NOTION_DB_CIRCLES;

if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!ROLES_DB)       { console.error('NOTION_DB_ROLES required'); process.exit(1); }
if (!CIRCLES_DB)     { console.error('NOTION_DB_CIRCLES required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function getPage(pageId: string): Promise<any> {
  const r = await fetch(`${BASE}/pages/${pageId}`, { headers: H });
  if (!r.ok) throw new Error(`GET page ${pageId}: ${r.status}`);
  return r.json();
}

async function patchPage(pageId: string, body: object): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH page ${pageId}: ${r.status} ${await r.text()}`);
}

async function queryDb(dbId: string, filter: object): Promise<any[]> {
  const r = await fetch(`${BASE}/databases/${dbId}/query`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ filter, page_size: 100 }),
  });
  if (!r.ok) throw new Error(`Query ${dbId}: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).results ?? [];
}

async function findCircleByName(name: string): Promise<string | null> {
  const results = await queryDb(CIRCLES_DB!, {
    property: 'Circle Name', title: { equals: name },
  });
  return results.length > 0 ? results[0].id : null;
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${label} ... `);
  try {
    await fn();
    await new Promise(r => setTimeout(r, 350));
    process.stdout.write('ok\n');
  } catch (err) {
    process.stdout.write('FAILED\n');
    console.error(`    ${err}`);
    process.exit(1);
  }
}

async function main() {
  // ── Identify the two Governance circles ──────────────────────────────────
  const canonicalId  = await findCircleByName('Governance & Coordination');
  const duplicateId  = await findCircleByName('Governance and Coordination');

  if (!canonicalId) {
    console.error('Cannot find canonical "Governance & Coordination" circle — aborting.');
    process.exit(1);
  }

  console.log(`\nCanonical circle: ${canonicalId}  (Governance & Coordination)`);
  console.log(`Duplicate circle: ${duplicateId ?? '(not found)'}\n`);

  // ── 1. Re-point roles from the duplicate to the canonical circle ──────────
  if (duplicateId) {
    console.log('Re-pointing roles from sectorless duplicate to canonical circle...');
    const rolesOnDuplicate = await queryDb(ROLES_DB!, {
      property: 'Circle', relation: { contains: duplicateId },
    });

    for (const role of rolesOnDuplicate) {
      const roleName = role.properties?.['Role Name']?.title?.[0]?.plain_text ?? role.id;
      await step(`  Re-point "${roleName}"`, () =>
        patchPage(role.id, {
          properties: {
            Circle: { relation: [{ id: canonicalId }] },
          },
        }),
      );
    }

    if (!rolesOnDuplicate.length) {
      console.log('  No roles found on duplicate - skipping re-point step.');
    }
  }

  // ── 2. Archive duplicate "Governance and Coordination" ────────────────────
  console.log('\nArchiving duplicate and legacy circles...');

  if (duplicateId) {
    await step('Archive "Governance and Coordination" (sectorless duplicate)', () =>
      patchPage(duplicateId, { archived: true }),
    );
  }

  // ── 3. Archive the 6 legacy pre-script circles ───────────────────────────
  const legacyNames = [
    'Governance Circle',
    'Community Life Circle',
    'Finance & Stewardship Circle',
    'Land & Ecology Circle',
    'Learning & Education Circle',
    'Health & Wellness Circle',
    'Technology Architecture',
  ];

  for (const name of legacyNames) {
    const id = await findCircleByName(name);
    if (!id) {
      console.log(`  skip "${name}" — not found`);
      continue;
    }
    await step(`Archive "${name}"`, () => patchPage(id, { archived: true }));
  }

  // ── 4. Fix wrong sector assignments ──────────────────────────────────────
  console.log('\nFixing sector assignments...');

  const techId = await findCircleByName('Technology & Systems');
  if (techId) {
    await step('Clear wrong sector on "Technology & Systems"', () =>
      patchPage(techId, {
        properties: { Sector: { select: null } },
      }),
    );
  }

  const commsId = await findCircleByName('Communications & Marketing');
  if (commsId) {
    await step('Clear wrong sector on "Communications & Marketing"', () =>
      patchPage(commsId, {
        properties: { Sector: { select: null } },
      }),
    );
  }

  console.log('\nDone. Run the Circles view in Notion to verify.');
}

main().catch(err => { console.error(err); process.exit(1); });
