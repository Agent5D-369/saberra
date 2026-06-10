/**
 * Assigns a Responsible Circle to all 40 policies that currently lack one.
 * Assignments are based on policy area and content — verified against the
 * Amora circle structure.
 *
 * Safe to re-run — skips any policy that already has a circle assigned.
 * Usage: npx ts-node scripts/migrate-assign-policy-circles.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY  = process.env.NOTION_API_KEY;
const POLICIES = process.env.NOTION_DB_POLICIES;
const CIRCLES  = process.env.NOTION_DB_CIRCLES;

if (!API_KEY)  { console.error('NOTION_API_KEY required');    process.exit(1); }
if (!POLICIES) { console.error('NOTION_DB_POLICIES required'); process.exit(1); }
if (!CIRCLES)  { console.error('NOTION_DB_CIRCLES required');  process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// Policy name → responsible circle name
// Logic: governance/decision/role/canon → Governance & Coordination
//        financial/legal → Economics & Finance
//        land/ecology → Land & Ecology
//        community/culture/integration/visitor/safety/ceremony → Community & Culture
//        technology/digital/living memory → Technology & Systems
//        communications/outreach/brand → Communications & Marketing
//        health/wellness circle charter → Health & Wellbeing
//        learning/education circle charter → Learning & Education
const POLICY_CIRCLE_MAP: Record<string, string> = {
  // Technology & Systems
  'Living Memory Hub Content Routing Policy':     'Technology & Systems',
  'Digital Communication & Technology Policy':    'Technology & Systems',

  // Communications & Marketing
  'Webinar, Event & Outreach Policy':             'Communications & Marketing',
  'External Communication & Brand Standards':     'Communications & Marketing',

  // Economics & Finance
  'Liability, Insurance & Risk Management Policy':       'Economics & Finance',
  'Stewardship Fee & Revenue Distribution Framework':    'Economics & Finance',
  'Development & Investment Authority Policy':           'Economics & Finance',
  'Community Contribution & Shared Prosperity Policy':   'Economics & Finance',
  'Financial Transparency & Reporting Standards':        'Economics & Finance',
  'Finance & Stewardship Circle Charter':                'Economics & Finance',

  // Land & Ecology
  'Land Ownership & Title Framework':            'Land & Ecology',
  'Biodiversity & Ecosystem Restoration Policy': 'Land & Ecology',
  'Food Sovereignty & Community Garden Policy':  'Land & Ecology',
  'Energy Sovereignty Policy':                   'Land & Ecology',
  'Water Sovereignty & Watershed Policy':        'Land & Ecology',
  'Land Use & Permaculture Standards':           'Land & Ecology',
  'Land & Ecology Circle Charter':               'Land & Ecology',

  // Community & Culture
  'Cultural Inclusion & Anti-Discrimination Policy': 'Community & Culture',
  'Ceremonial & Sacred Space Policy':               'Community & Culture',
  'Children & Youth Safety Policy':                 'Community & Culture',
  'New Member Integration Policy':                  'Community & Culture',
  'Guest & Visitor Policy':                         'Community & Culture',
  'Community Life Circle Charter':                  'Community & Culture',

  // Health & Wellbeing
  'Health & Wellness Circle Charter':            'Health & Wellbeing',

  // Learning & Education
  'Learning & Education Circle Charter':         'Learning & Education',

  // Governance & Coordination (everything governance, legal structure, CCOS process)
  'CCOS Ledger Governance Policy':                   'Governance & Coordination',
  'Legal Entity & Corporate Governance (Costa Rica)': 'Governance & Coordination',
  'Privacy & Personal Sovereignty Policy':            'Governance & Coordination',
  'Conflict Resolution & Restorative Justice Policy': 'Governance & Coordination',
  'Community Agreements & Code of Conduct':           'Governance & Coordination',
  'Canon Amendment Process':                          'Governance & Coordination',
  'Emergency Authority Protocol':                     'Governance & Coordination',
  'Advice Process Protocol':                          'Governance & Coordination',
  'Consent-Based Decision Making Process':            'Governance & Coordination',
  'Founding Member Role & Rights':                    'Governance & Coordination',
  'Steward Role Accountability Framework':            'Governance & Coordination',
  'Governance Circle Charter':                        'Governance & Coordination',
  'Feminine Leadership Covenant':                     'Governance & Coordination',
  'Teal Evolutionary Organization Principles':        'Governance & Coordination',
  'Community Purpose & Vision Charter':               'Governance & Coordination',
};

async function queryAll(dbId: string): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const body: any = { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) };
    const r = await fetch(`${BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    const d = await r.json() as any;
    results.push(...(d.results ?? []));
    cursor = d.has_more ? d.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function patchPage(pageId: string, props: object): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties: props }),
  });
  if (!r.ok) throw new Error(`PATCH ${pageId}: ${r.status} ${await r.text()}`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('\nLoading circles...');
  const circlePages = await queryAll(CIRCLES!);
  const circleMap = new Map<string, string>(); // name → page ID
  for (const c of circlePages) {
    const name = c.properties?.['Circle Name']?.title?.[0]?.plain_text;
    if (name) circleMap.set(name, c.id);
  }
  console.log(`Found ${circleMap.size} circles: ${[...circleMap.keys()].join(', ')}\n`);

  console.log('Loading policies...');
  const policyPages = await queryAll(POLICIES!);
  console.log(`Found ${policyPages.length} policies.\n`);

  let assigned = 0;
  let alreadySet = 0;
  let unmapped = 0;
  let noCircle = 0;

  for (const page of policyPages) {
    const name   = page.properties?.['Policy Name']?.title?.[0]?.plain_text ?? '';
    const hasCircle = (page.properties?.['Responsible Circle']?.relation?.length ?? 0) > 0;

    if (hasCircle) {
      console.log(`  skip  "${name}" — circle already set`);
      alreadySet++;
      continue;
    }

    const circleName = POLICY_CIRCLE_MAP[name];
    if (!circleName) {
      console.log(`  UNMAPPED "${name}" — no circle in map`);
      unmapped++;
      continue;
    }

    const circleId = circleMap.get(circleName);
    if (!circleId) {
      console.log(`  MISSING CIRCLE "${circleName}" for policy "${name}"`);
      noCircle++;
      continue;
    }

    process.stdout.write(`  assign "${name}"\n         → ${circleName} ... `);
    try {
      await patchPage(page.id, {
        'Responsible Circle': { relation: [{ id: circleId }] },
      });
      console.log('ok');
      assigned++;
    } catch (err: any) {
      console.log(`FAILED — ${err.message}`);
    }
    await sleep(350);
  }

  console.log(`\nDone: ${assigned} assigned, ${alreadySet} already set, ${unmapped} unmapped, ${noCircle} circle not found.\n`);
  if (unmapped > 0) console.log('Review UNMAPPED policies above and add them to POLICY_CIRCLE_MAP.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
