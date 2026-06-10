/**
 * Creates the "Amora Community Anchor" root circle (if it doesn't exist) and
 * sets it as the Parent Circle for every other circle in the Circles database.
 *
 * Safe to re-run — creation is skipped if the circle already exists, and the
 * parent relation is only set on circles that currently have no parent.
 *
 * Usage: npx ts-node scripts/create-anchor-circle.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_KEY = process.env.NOTION_API_KEY;
const CIRCLES_DB = process.env.NOTION_DB_CIRCLES;

if (!NOTION_KEY)  { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!CIRCLES_DB)  { console.error('NOTION_DB_CIRCLES required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const ANCHOR_NAME = 'Amora Community Anchor';

const ANCHOR = {
  purpose:
    'Hold the overall purpose, authority, and living identity of Amora as a regenerative community. ' +
    'Serve as the root circle from which all other circles derive their authority, domains, and accountabilities. ' +
    'Ensure the whole remains coherent, purposeful, and aligned with Amora\'s founding vision.',
  domains:
    'Overall Amora community identity and purpose; ' +
    'The Living Constitution and CCOS canon as a whole; ' +
    'All community activity and resources not explicitly delegated to a sub-circle; ' +
    'Cross-circle conflict resolution of last resort; ' +
    'Relationships with the land, legal entities, and external bodies at the highest level',
  accountabilities:
    'Ratifying and evolving the overall community vision and founding purpose; ' +
    'Setting the outer boundaries within which all sub-circles operate; ' +
    'Facilitating cross-circle resolution when sub-circles cannot resolve a tension themselves; ' +
    'Stewarding the Living Constitution and ensuring it reflects actual lived governance; ' +
    'Convening the annual community assembly and quarterly all-circles gatherings; ' +
    'Holding the ultimate decision right on existential or community-wide questions',
  kpis:
    'Annual community assembly held; ' +
    'Quarterly all-circles sync held; ' +
    'Open cross-circle tensions resolved within 60 days; ' +
    'Living Constitution reviewed annually',
  meetingCadence: 'Annual community assembly; Quarterly all-circles gathering',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function rt(text: string) {
  return [{ type: 'text', text: { content: text.slice(0, 2000) } }];
}

function getTitle(page: any): string {
  for (const val of Object.values(page.properties ?? {}) as any[]) {
    if (val?.type === 'title') return (val.title ?? []).map((t: any) => t.plain_text).join('');
  }
  return '';
}

function getRelationIds(page: any, prop: string): string[] {
  return (page.properties?.[prop]?.relation ?? []).map((r: any) => r.id);
}

async function queryAll(dbId: string): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await fetch(`${BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    if (!r.ok) throw new Error(`Query: ${r.status} ${await r.text()}`);
    const d = await r.json() as any;
    results.push(...(d.results ?? []));
    cursor = d.has_more ? d.next_cursor : undefined;
    await sleep(150);
  } while (cursor);
  return results;
}

async function createPage(props: object): Promise<any> {
  const r = await fetch(`${BASE}/pages`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ parent: { database_id: CIRCLES_DB }, properties: props }),
  });
  if (!r.ok) throw new Error(`Create: ${r.status} ${await r.text()}`);
  return r.json();
}

async function patchPage(pageId: string, props: object): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties: props }),
  });
  if (!r.ok) throw new Error(`PATCH ${pageId}: ${r.status} ${await r.text()}`);
}

async function main() {
  console.log('\n' + '='.repeat(72));
  console.log('  Create Amora Community Anchor Circle');
  console.log('='.repeat(72) + '\n');

  // ── 1. Load all circles ────────────────────────────────────────────────────
  console.log('Loading all circles from Notion...');
  const allCircles = await queryAll(CIRCLES_DB!);
  console.log(`  Found ${allCircles.length} circle(s)\n`);

  // ── 2. Find or create the anchor ──────────────────────────────────────────
  let anchorId: string;
  const existing = allCircles.find(p => getTitle(p) === ANCHOR_NAME);

  if (existing) {
    anchorId = existing.id;
    console.log(`  EXISTS  "${ANCHOR_NAME}" — ${anchorId}`);
  } else {
    console.log(`  CREATE  "${ANCHOR_NAME}"`);
    const created = await createPage({
      'Circle Name': { title: rt(ANCHOR_NAME) },
      Status: { select: { name: 'Active' } },
      Purpose: { rich_text: rt(ANCHOR.purpose) },
      Domains: { rich_text: rt(ANCHOR.domains) },
      Accountabilities: { rich_text: rt(ANCHOR.accountabilities) },
      KPIs: { rich_text: rt(ANCHOR.kpis) },
      'Meeting Cadence': { rich_text: rt(ANCHOR.meetingCadence) },
      'Review Cadence': { select: { name: 'Annual' } },
    }) as any;
    anchorId = created.id;
    console.log(`  CREATED  id=${anchorId}`);
    await sleep(400);
  }

  // ── 3. Set Parent Circle on all other circles ─────────────────────────────
  console.log('\nSetting Parent Circle on sub-circles...\n');

  const subCircles = allCircles.filter(p => p.id !== anchorId);
  let updated = 0;
  let skipped = 0;

  for (const page of subCircles) {
    const name = getTitle(page);
    const currentParents = getRelationIds(page, 'Parent Circle');

    if (currentParents.includes(anchorId)) {
      console.log(`  skip    "${name}" — already points to anchor`);
      skipped++;
      continue;
    }

    await patchPage(page.id, {
      'Parent Circle': { relation: [{ id: anchorId }] },
    });
    console.log(`  OK      "${name}"`);
    updated++;
    await sleep(350);
  }

  // ── 4. Summary ────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(72));
  console.log('  Summary');
  console.log('='.repeat(72));
  console.log(`  Anchor circle:   ${existing ? 'already existed' : 'created'}`);
  console.log(`  Sub-circles updated: ${updated}`);
  console.log(`  Sub-circles skipped: ${skipped}`);
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
