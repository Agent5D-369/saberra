/**
 * Converts Sensitive Review "Reviewed By" from rich_text to a relation to Profiles.
 * Run once: npx ts-node scripts/migrate-sensitive-review-reviewer-relation.ts
 *
 * The old rich_text field is removed and replaced with a relation property of the same name.
 * Notion does not allow in-place type changes — delete then recreate.
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const DB = process.env.NOTION_DB_SENSITIVE_REVIEW!;
const PROFILES_DB = process.env.NOTION_DB_PROFILES!;

if (!DB || !PROFILES_DB) {
  console.error('NOTION_DB_SENSITIVE_REVIEW and NOTION_DB_PROFILES must be set');
  process.exit(1);
}

async function main() {
  console.log('\nSensitive Review — converting "Reviewed By" to Profiles relation\n');

  // Step 1: remove the existing rich_text field
  console.log('Removing rich_text "Reviewed By"...');
  await notion.databases.update({
    database_id: DB,
    properties: {
      'Reviewed By': null,
    },
  } as Parameters<typeof notion.databases.update>[0]);
  console.log('  Done.');

  // Step 2: add relation field with same name
  console.log('Adding relation "Reviewed By" → Profiles...');
  await notion.databases.update({
    database_id: DB,
    properties: {
      'Reviewed By': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relation: { database_id: PROFILES_DB, type: 'single_property', single_property: {} },
      } as any,
    },
  });
  console.log('  Done.');

  console.log('\n✓ "Reviewed By" is now a relation to Profiles.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
