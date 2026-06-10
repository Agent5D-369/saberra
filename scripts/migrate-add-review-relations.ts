/**
 * Adds relation properties to Memory Review Queue and Sensitive Review databases:
 *   - Memory Review Queue: "Related Profiles" → Profiles DB
 *   - Sensitive Review:    "Related People"   → Profiles DB
 *
 * Safe to re-run (Notion ignores property additions if the property already exists
 * with the same name — it returns 200 without error).
 *
 * Usage:
 *   npx ts-node scripts/migrate-add-review-relations.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.NOTION_API_KEY;
if (!API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const PROFILES_DB         = process.env.NOTION_DB_PROFILES;
const MEMORY_REVIEW_DB    = process.env.NOTION_DB_MEMORY_REVIEW_QUEUE;
const SENSITIVE_REVIEW_DB = process.env.NOTION_DB_SENSITIVE_REVIEW;

if (!PROFILES_DB)         { console.error('NOTION_DB_PROFILES required'); process.exit(1); }
if (!MEMORY_REVIEW_DB)    { console.error('NOTION_DB_MEMORY_REVIEW_QUEUE required'); process.exit(1); }
if (!SENSITIVE_REVIEW_DB) { console.error('NOTION_DB_SENSITIVE_REVIEW required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function patchDb(dbId: string, properties: Record<string, unknown>): Promise<void> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ properties }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`PATCH /databases/${dbId}: ${r.status} ${text}`);
  }
}

async function main() {
  console.log('\nAdding Related Profiles relation to Memory Review Queue...');
  await patchDb(MEMORY_REVIEW_DB!, {
    'Related Profiles': {
      relation: {
        database_id: PROFILES_DB,
        type: 'dual_property',
        dual_property: {},
      },
    },
  });
  console.log('  Done.');

  console.log('Adding Related People relation to Sensitive Review...');
  await patchDb(SENSITIVE_REVIEW_DB!, {
    'Related People': {
      relation: {
        database_id: PROFILES_DB,
        type: 'dual_property',
        dual_property: {},
      },
    },
  });
  console.log('  Done.');

  console.log('\nMigration complete. Both review databases now have a profile relation.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
