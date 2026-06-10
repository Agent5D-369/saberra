/**
 * Adds the "Suggested Connections" rich_text property to the existing Profiles DB.
 * Run once: npm run migrate-profiles-suggested-connections
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const profilesDbId = process.env.NOTION_DB_PROFILES!;

async function main() {
  if (!profilesDbId) {
    console.error('NOTION_DB_PROFILES not set in .env');
    process.exit(1);
  }

  console.log(`Adding "Suggested Connections" field to Profiles DB: ${profilesDbId}`);

  await notion.databases.update({
    database_id: profilesDbId,
    properties: {
      'Suggested Connections': { rich_text: {} },
    },
  });

  console.log('✓ "Suggested Connections" field added.');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
