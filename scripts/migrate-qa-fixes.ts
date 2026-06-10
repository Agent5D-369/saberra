/**
 * QA fix: adds the 'Meeting ID' rich_text property to the live Meeting Assets database.
 * This enables per-meeting deduplication in MeetAssetParserService.
 * Run once: npx ts-node scripts/migrate-qa-fixes.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

async function main(): Promise<void> {
  const apiKey = process.env.NOTION_API_KEY;
  const meetingAssetsDbId = process.env.NOTION_DB_MEETING_ASSETS;

  if (!apiKey || !meetingAssetsDbId) {
    throw new Error('NOTION_API_KEY and NOTION_DB_MEETING_ASSETS must be set in .env');
  }

  const notion = new Client({ auth: apiKey });

  console.log(`Adding 'Meeting ID' field to Meeting Assets DB: ${meetingAssetsDbId}`);

  await notion.databases.update({
    database_id: meetingAssetsDbId,
    properties: {
      'Meeting ID': { rich_text: {} },
    },
  });

  console.log("Done — 'Meeting ID' field added to Meeting Assets database.");
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
