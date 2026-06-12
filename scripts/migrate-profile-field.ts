/**
 * Renames the Profiles DB relationship field to the canonical "Relationship to Org".
 * Handles all legacy names: "Relationship to Amora", "Community Relationship".
 * Safe to re-run: exits cleanly if already at the target name.
 *
 * Usage:
 *   npx ts-node scripts/migrate-profile-field.ts
 *
 * Reads NOTION_API_KEY and NOTION_DB_PROFILES from the environment (.env or Railway).
 */

import * as dotenv from 'dotenv';
dotenv.config({ override: false }); // pre-set env vars take precedence over .env

import { Client } from '@notionhq/client';

const NOTION_API_KEY  = process.env.NOTION_API_KEY;
const PROFILES_DB_ID  = process.env.NOTION_DB_PROFILES;

if (!NOTION_API_KEY || !PROFILES_DB_ID) {
  console.error('NOTION_API_KEY and NOTION_DB_PROFILES must be set.');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

async function run(): Promise<void> {
  console.log(`Profiles DB: ${PROFILES_DB_ID}`);

  const db = await notion.databases.retrieve({ database_id: PROFILES_DB_ID! });
  const props = (db as unknown as { properties: Record<string, { name: string }> }).properties;

  if (props['Relationship to Org']) {
    console.log('Field "Relationship to Org" already exists — nothing to migrate.');
    return;
  }

  const oldName = props['Community Relationship'] ? 'Community Relationship'
    : props['Relationship to Amora'] ? 'Relationship to Amora'
    : null;

  if (!oldName) {
    console.log('No legacy relationship field found — nothing to migrate.');
    return;
  }

  console.log(`Renaming "${oldName}" -> "Relationship to Org" ...`);
  await notion.databases.update({
    database_id: PROFILES_DB_ID!,
    properties: {
      [oldName]: { name: 'Relationship to Org' } as never,
    },
  });

  console.log('Done. Field renamed successfully.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
