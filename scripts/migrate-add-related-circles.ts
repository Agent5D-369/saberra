/**
 * Adds "Related Circles" relation property (pointing to Circles DB) to 6 databases:
 *   Decision Candidates, Tasks, Risks, Canon Change Requests, Knowledge Base, Meetings
 *
 * Safe to re-run — Notion ignores property additions when the property already exists
 * with the same name (returns 200 without error).
 *
 * Usage:
 *   npx ts-node scripts/migrate-add-related-circles.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.NOTION_API_KEY;
if (!API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const CIRCLES_DB           = process.env.NOTION_DB_CIRCLES;
const DECISION_CANDS_DB    = process.env.NOTION_DB_DECISION_CANDIDATES;
const TASKS_DB             = process.env.NOTION_DB_TASKS;
const RISKS_DB             = process.env.NOTION_DB_RISKS;
const CANON_CHANGES_DB     = process.env.NOTION_DB_CANON_CHANGE_REQUESTS;
const KNOWLEDGE_BASE_DB    = process.env.NOTION_DB_KNOWLEDGE_BASE;
const MEETINGS_DB          = process.env.NOTION_DB_MEETINGS;

if (!CIRCLES_DB)        { console.error('NOTION_DB_CIRCLES required'); process.exit(1); }
if (!DECISION_CANDS_DB) { console.error('NOTION_DB_DECISION_CANDIDATES required'); process.exit(1); }
if (!TASKS_DB)          { console.error('NOTION_DB_TASKS required'); process.exit(1); }
if (!RISKS_DB)          { console.error('NOTION_DB_RISKS required'); process.exit(1); }
if (!CANON_CHANGES_DB)  { console.error('NOTION_DB_CANON_CHANGE_REQUESTS required'); process.exit(1); }
if (!KNOWLEDGE_BASE_DB) { console.error('NOTION_DB_KNOWLEDGE_BASE required'); process.exit(1); }
if (!MEETINGS_DB)       { console.error('NOTION_DB_MEETINGS required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function patchDb(label: string, dbId: string): Promise<void> {
  console.log(`  Adding Related Circles to ${label}...`);
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      properties: {
        'Related Circles': {
          relation: {
            database_id: CIRCLES_DB,
            type: 'dual_property',
            dual_property: {},
          },
        },
      },
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`PATCH /databases/${dbId}: ${r.status} ${text}`);
  }
  console.log(`    Done.`);
}

async function main() {
  console.log('\nAdding Related Circles relation to 6 databases...\n');
  await patchDb('Decision Candidates', DECISION_CANDS_DB!);
  await patchDb('Tasks',               TASKS_DB!);
  await patchDb('Risks',               RISKS_DB!);
  await patchDb('Canon Change Requests', CANON_CHANGES_DB!);
  await patchDb('Knowledge Base',      KNOWLEDGE_BASE_DB!);
  await patchDb('Meetings',            MEETINGS_DB!);
  console.log('\nMigration complete. All 6 databases now have a Related Circles relation.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
