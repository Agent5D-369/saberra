/**
 * Adds "Purpose Alignment" select and "Purpose Alignment Notes" text
 * to the Decision Candidates database.
 *
 * Sera auto-populates both fields when a Governing Purpose Statement (GPS)
 * is configured via the AMORA_GOVERNING_PURPOSE Railway env var.
 *
 * Purpose Alignment values:
 *   Aligned   - the decision clearly serves the governing purpose
 *   Neutral   - the decision neither serves nor conflicts
 *   Misaligned - the decision conflicts with or undermines the purpose
 *   Unclear   - the relationship cannot be determined from context
 *
 * Safe to re-run - Notion ignores PATCH if property already exists.
 *
 * Usage: npx ts-node scripts/migrate-add-purpose-alignment.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_KEY    = process.env.NOTION_API_KEY;
const DECISIONS_DB  = process.env.NOTION_DB_DECISION_CANDIDATES;

if (!NOTION_KEY)   { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!DECISIONS_DB) { console.error('NOTION_DB_DECISION_CANDIDATES required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function patchDb(label: string, properties: object): Promise<void> {
  const r = await fetch(`${BASE}/databases/${DECISIONS_DB}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties }),
  });
  if (!r.ok) {
    const d = await r.json() as any;
    console.log(`  WARN  ${label}: ${d.message ?? r.status}`);
    return;
  }
  console.log(`  OK    ${label}`);
}

async function main() {
  console.log('\n' + '='.repeat(72));
  console.log('  Add Purpose Alignment fields to Decision Candidates');
  console.log('='.repeat(72) + '\n');

  await patchDb('"Purpose Alignment" select', {
    'Purpose Alignment': {
      select: {
        options: [
          { name: 'Aligned' },
          { name: 'Neutral' },
          { name: 'Misaligned' },
          { name: 'Unclear' },
        ],
      },
    },
  });

  await new Promise(r => setTimeout(r, 400));

  await patchDb('"Purpose Alignment Notes" text', {
    'Purpose Alignment Notes': { rich_text: {} },
  });

  console.log('\n  Done.\n');
  console.log('  Next step: set AMORA_GOVERNING_PURPOSE in Railway env vars to activate alignment scoring.');
  console.log('  Optionally set AMORA_PURPOSE_TEST with the one-sentence decision test.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
