/**
 * Three-in-one migration for Policies:
 *  1. Remove "Google Drive Doc" URL field (Notion is canon holder, not Drive)
 *  2. Seed 6 core circles into the Circles DB if they don't exist
 *  3. Assign Responsible Circle to all 39 draft policies + scrub em dashes from all text
 *
 * Run once: npx ts-node scripts/migrate-policies-circles-and-cleanup.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const POLICIES_DB  = process.env.NOTION_DB_POLICIES!;
const CIRCLES_DB   = process.env.NOTION_DB_CIRCLES!;

if (!POLICIES_DB || !CIRCLES_DB) {
  console.error('NOTION_DB_POLICIES and NOTION_DB_CIRCLES must be set');
  process.exit(1);
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (e?.code === 'rate_limited' && i < retries) {
        console.log('      Rate limited — waiting 65s...');
        await sleep(65_000);
        continue;
      }
      throw e;
    }
  }
  throw new Error('unreachable');
}

const fix = (s: string) => s.replace(/ — /g, ', ').replace(/—/g, ', ');

// ─── Circle definitions ───────────────────────────────────────────────────────

const CIRCLES = [
  {
    name: 'Governance Circle',
    sector: 'Governance',
    purpose: 'Maintain organizational clarity, canon integrity, and inter-circle coordination. Does not manage day-to-day operations.',
  },
  {
    name: 'Community Life Circle',
    sector: 'Community',
    purpose: 'Cultivate belonging, navigate conflict, hold community agreements, host onboarding, and celebrate life.',
  },
  {
    name: 'Land & Ecology Circle',
    sector: 'Land',
    purpose: 'Steward the land, water, food systems, and living ecosystems of Amora using permaculture ethics.',
  },
  {
    name: 'Finance & Stewardship Circle',
    sector: 'Finance',
    purpose: 'Manage financial health, maintain radical transparency, allocate resources, and steward investments in service of the mission.',
  },
  {
    name: 'Learning & Education Circle',
    sector: 'Education',
    purpose: 'Develop and steward the nature-based educational center and all community learning initiatives.',
  },
  {
    name: 'Health & Wellness Circle',
    sector: 'Wellness',
    purpose: 'Steward the retreat center, health center, wellness programs, and community healing culture.',
  },
];

// ─── Policy -> Circle assignments ─────────────────────────────────────────────

const ASSIGNMENTS: Record<string, string> = {
  'Community Purpose & Vision Charter':             'Governance Circle',
  'Teal Evolutionary Organization Principles':      'Governance Circle',
  'Feminine Leadership Covenant':                   'Governance Circle',
  'Governance Circle Charter':                      'Governance Circle',
  'Steward Role Accountability Framework':          'Governance Circle',
  'Founding Member Role & Rights':                  'Governance Circle',
  'Consent-Based Decision Making Process':          'Governance Circle',
  'Advice Process Protocol':                        'Governance Circle',
  'Emergency Authority Protocol':                   'Governance Circle',
  'Canon Amendment Process':                        'Governance Circle',
  'Digital Communication & Technology Policy':      'Governance Circle',
  'Legal Entity & Corporate Governance (Costa Rica)': 'Governance Circle',
  'CCOS Ledger Governance Policy':                  'Governance Circle',

  'Community Life Circle Charter':                  'Community Life Circle',
  'Community Agreements & Code of Conduct':         'Community Life Circle',
  'Conflict Resolution & Restorative Justice Policy': 'Community Life Circle',
  'Guest & Visitor Policy':                         'Community Life Circle',
  'New Member Integration Policy':                  'Community Life Circle',
  'Privacy & Personal Sovereignty Policy':          'Community Life Circle',
  'Children & Youth Safety Policy':                 'Community Life Circle',
  'Ceremonial & Sacred Space Policy':               'Community Life Circle',
  'Cultural Inclusion & Anti-Discrimination Policy': 'Community Life Circle',
  'External Communication & Brand Standards':       'Community Life Circle',
  'Webinar, Event & Outreach Policy':               'Community Life Circle',

  'Land & Ecology Circle Charter':                  'Land & Ecology Circle',
  'Land Use & Permaculture Standards':              'Land & Ecology Circle',
  'Water Sovereignty & Watershed Policy':           'Land & Ecology Circle',
  'Energy Sovereignty Policy':                      'Land & Ecology Circle',
  'Food Sovereignty & Community Garden Policy':     'Land & Ecology Circle',
  'Biodiversity & Ecosystem Restoration Policy':    'Land & Ecology Circle',
  'Land Ownership & Title Framework':               'Land & Ecology Circle',

  'Finance & Stewardship Circle Charter':           'Finance & Stewardship Circle',
  'Financial Transparency & Reporting Standards':   'Finance & Stewardship Circle',
  'Community Contribution & Shared Prosperity Policy': 'Finance & Stewardship Circle',
  'Development & Investment Authority Policy':      'Finance & Stewardship Circle',
  'Stewardship Fee & Revenue Distribution Framework': 'Finance & Stewardship Circle',
  'Liability, Insurance & Risk Management Policy':  'Finance & Stewardship Circle',

  'Learning & Education Circle Charter':            'Learning & Education Circle',
  'Health & Wellness Circle Charter':               'Health & Wellness Circle',
};

// ─── Step 1: Remove Google Drive Doc field ────────────────────────────────────

async function removeGoogleDriveDocField() {
  console.log('\n[1/3] Removing "Google Drive Doc" from Policies...');
  try {
    await notion.databases.update({
      database_id: POLICIES_DB,
      properties: { 'Google Drive Doc': null },
    } as Parameters<typeof notion.databases.update>[0]);
    console.log('      Done.');
  } catch (e: any) {
    if (e?.code === 'object_not_found' || e?.message?.includes('not found') || e?.message?.includes('does not exist')) {
      console.log('      Already removed, skipping.');
    } else throw e;
  }
}

// ─── Step 2: Seed circles ─────────────────────────────────────────────────────

async function seedCircles(): Promise<Map<string, string>> {
  console.log('\n[2/3] Seeding circles...');
  const circleIdMap = new Map<string, string>();

  for (const c of CIRCLES) {
    await sleep(300);
    const existing = await withRetry(() => notion.databases.query({
      database_id: CIRCLES_DB,
      filter: { property: 'Circle Name', title: { equals: c.name } },
      page_size: 1,
    }));

    if (existing.results.length > 0) {
      circleIdMap.set(c.name, existing.results[0].id);
      console.log(`      [EXISTS]  ${c.name}`);
      continue;
    }

    const page = await withRetry(() => notion.pages.create({
      parent: { database_id: CIRCLES_DB },
      properties: {
        'Circle Name': { title: [{ text: { content: c.name } }] },
        Sector:        { select: { name: c.sector } },
        Purpose:       { rich_text: [{ text: { content: c.purpose } }] },
        Status:        { select: { name: 'Active' } },
      },
    }));
    circleIdMap.set(c.name, page.id);
    console.log(`      [CREATED] ${c.name}`);
  }

  return circleIdMap;
}

// ─── Step 3: Update policies ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fixRichText(rt: any[]): { changed: boolean; rt: any[] } {
  let changed = false;
  const fixed = rt.map((seg: any) => {
    if (seg.type === 'text' && seg.text?.content?.includes('—')) {
      changed = true;
      return { ...seg, text: { ...seg.text, content: fix(seg.text.content) } };
    }
    return seg;
  });
  return { changed, rt: fixed };
}

async function updatePolicies(circleIdMap: Map<string, string>) {
  console.log('\n[3/3] Updating policies: assign circles + scrub em dashes...');

  let cursor: string | undefined;
  let processed = 0;

  do {
    const res = await withRetry(() => notion.databases.query({
      database_id: POLICIES_DB,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    }));

    for (const page of res.results) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = page as any;
      const name: string = p.properties['Policy Name']?.title?.[0]?.plain_text ?? '';
      const circleName = ASSIGNMENTS[name];
      const circleId = circleName ? circleIdMap.get(circleName) : undefined;

      // Fix Current Text Summary
      const summaryRt = p.properties['Current Text Summary']?.rich_text ?? [];
      const { changed: sumChanged, rt: fixedSummary } = fixRichText(summaryRt);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props: Record<string, any> = {};
      if (sumChanged) props['Current Text Summary'] = { rich_text: fixedSummary };
      if (circleId)   props['Responsible Circle']   = { relation: [{ id: circleId }] };

      if (Object.keys(props).length > 0) {
        await withRetry(() => notion.pages.update({ page_id: page.id, properties: props }));
        await sleep(500);
      }

      // Fix page body blocks
      let blockCursor: string | undefined;
      do {
        const blocks = await withRetry(() => notion.blocks.children.list({
          block_id: page.id,
          page_size: 100,
          ...(blockCursor ? { start_cursor: blockCursor } : {}),
        }));

        for (const block of blocks.results) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = block as any;
          const type = b.type as string;
          const content = b[type];
          if (!content?.rich_text) continue;

          const { changed, rt } = fixRichText(content.rich_text);
          if (!changed) continue;

          await withRetry(() => notion.blocks.update({
            block_id: block.id,
            [type]: { rich_text: rt },
          } as Parameters<typeof notion.blocks.update>[0]));
          await sleep(400);
        }

        blockCursor = blocks.has_more ? (blocks.next_cursor ?? undefined) : undefined;
      } while (blockCursor);

      processed++;
      const circleLabel = circleName ? ` -> ${circleName}` : ' (no circle mapping)';
      console.log(`      [${String(processed).padStart(2, '0')}] ${name}${circleLabel}`);
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  console.log(`\n      ${processed} policies updated.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nPolicies migration: Drive Doc removal + circle seeding + em dash cleanup\n');

  await removeGoogleDriveDocField();
  const circleIdMap = await seedCircles();
  await updatePolicies(circleIdMap);

  console.log('\nDone.\n');
}

main().catch(err => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
