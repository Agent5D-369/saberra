/**
 * Removes the redundant "Needs Owner" checkbox from the Tasks database.
 * Status select option 'Needs Owner' covers this — the checkbox is duplicate.
 * Run once: npx ts-node scripts/migrate-remove-tasks-needs-owner-checkbox.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const DB = process.env.NOTION_DB_TASKS!;

if (!DB) {
  console.error('NOTION_DB_TASKS must be set');
  process.exit(1);
}

async function main() {
  console.log('\nTasks — removing redundant "Needs Owner" checkbox\n');

  await notion.databases.update({
    database_id: DB,
    properties: { 'Needs Owner': null },
  } as Parameters<typeof notion.databases.update>[0]);

  console.log('✓ "Needs Owner" checkbox removed from Tasks.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
