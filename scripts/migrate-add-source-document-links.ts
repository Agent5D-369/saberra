/**
 * Adds a Source Document URL field to Tasks, Decision Candidates, Risks,
 * Memory Review Queue, and Canon Change Requests.
 *
 * This allows any extracted record to link directly back to the Google Doc
 * (transcript or notes) that it came from, instead of requiring 3 clicks
 * through the Meeting record.
 *
 * Safe to re-run. Usage: npx ts-node scripts/migrate-add-source-document-links.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DBS: Record<string, string | undefined> = {
  TASKS:     process.env.NOTION_DB_TASKS,
  DECISIONS: process.env.NOTION_DB_DECISION_CANDIDATES,
  RISKS:     process.env.NOTION_DB_RISKS,
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

async function addUrl(dbId: string, propName: string): Promise<void> {
  const props = await getProps(dbId);
  if (props[propName]?.type === 'url') {
    console.log(`    skip '${propName}' — url property already exists`);
    return;
  }
  if (props[propName]) {
    throw new Error(`Property '${propName}' already exists as type '${props[propName].type}'`);
  }
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties: { [propName]: { url: {} } } }),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
  console.log(`    '${propName}' url property created`);
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
  console.log('Adding Source Document URL fields...\n');

  await step('Tasks: add Source Document (url)', () =>
    addUrl(DBS.TASKS!, 'Source Document'));

  await step('Decision Candidates: add Source Document (url)', () =>
    addUrl(DBS.DECISIONS!, 'Source Document'));

  await step('Risks: add Source Document (url)', () =>
    addUrl(DBS.RISKS!, 'Source Document'));

  console.log('\nDone. Deploy updated worker to activate link population.');
}

main().catch(err => { console.error(err); process.exit(1); });
