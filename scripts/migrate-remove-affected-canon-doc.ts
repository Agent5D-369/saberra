/**
 * Removes the redundant "Affected Canon Doc" rich_text field from Canon Change Requests.
 * The "Affected Policy" relation supersedes it.
 * Run once: npx ts-node scripts/migrate-remove-affected-canon-doc.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const DB = process.env.NOTION_DB_CANON_CHANGE_REQUESTS!;

if (!DB) {
  console.error('NOTION_DB_CANON_CHANGE_REQUESTS must be set');
  process.exit(1);
}

async function main() {
  console.log('\nCanon Change Requests — removing redundant "Affected Canon Doc" rich_text\n');

  await notion.databases.update({
    database_id: DB,
    properties: { 'Affected Canon Doc': null },
  } as Parameters<typeof notion.databases.update>[0]);

  console.log('✓ "Affected Canon Doc" removed. "Affected Policy" relation is the canonical link.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
