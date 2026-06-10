/**
 * Adds a two-way "Connected To" self-relation on the Profiles database.
 * Run once: npm run migrate-profiles-relation
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

  console.log(`Adding "Connected To" self-relation to Profiles DB: ${profilesDbId}`);

  await notion.databases.update({
    database_id: profilesDbId,
    properties: {
      'Connected To': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relation: { database_id: profilesDbId, dual_property: {} } as any,
      },
    },
  });

  console.log('✓ "Connected To" relation added.');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
