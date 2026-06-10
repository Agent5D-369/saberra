/**
 * Migrates the Processing Events database from the old v1 schema (snake_case event types,
 * started/completed/failed status, Event ID title) to the v2 template schema (title-case
 * event types, Success/Warning/Error/Info status, Event title).
 *
 * Safe to run multiple times - uses Notion's property update API which is idempotent.
 * Existing records with old values are left as-is (Notion shows them as "other").
 *
 * Run against Amora: NOTION_API_KEY=... NOTION_DB_PROCESSING_EVENTS=... npx ts-node scripts/migrate-processing-events-schema.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_DB_PROCESSING_EVENTS;

if (!NOTION_API_KEY || !DB_ID) {
  console.error('Required: NOTION_API_KEY and NOTION_DB_PROCESSING_EVENTS');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

function selectOptions(names: string[]) {
  return { options: names.map(name => ({ name })) };
}

async function main() {
  console.log(`Migrating Processing Events DB: ${DB_ID}`);

  // Step 1: Rename title property Event ID -> Event (if it exists as Event ID)
  let db;
  try {
    db = await notion.databases.retrieve({ database_id: DB_ID! });
  } catch (err) {
    console.error('Failed to retrieve database:', err);
    process.exit(1);
  }

  const props = db.properties as Record<string, { type: string; name: string }>;
  const hasEventId = 'Event ID' in props;
  const hasEvent   = 'Event' in props && props['Event'].type === 'title';

  if (hasEventId && !hasEvent) {
    console.log('  Renaming "Event ID" -> "Event" (title property)...');
    await notion.databases.update({
      database_id: DB_ID!,
      properties: {
        'Event ID': { name: 'Event' },
      } as never,
    });
    console.log('  Done.');
  } else if (hasEvent) {
    console.log('  Title property already named "Event" - skipping rename.');
  } else {
    console.log('  Warning: neither "Event ID" nor "Event" found as title property.');
  }

  // Step 2: Update Event Type select options to v2 title-case values
  console.log('  Updating "Event Type" select options...');
  await notion.databases.update({
    database_id: DB_ID!,
    properties: {
      'Event Type': {
        select: selectOptions([
          'Poll Start', 'Poll Complete', 'Email Ingested', 'Access Check',
          'Extraction Start', 'Extraction Complete', 'Extraction Failed',
          'Retry Queued', 'Access Requested', 'Manual Review Flagged',
          'Admin Action', 'Heartbeat', 'Scheduled Task',
        ]),
      },
    } as never,
  });

  // Step 3: Update Status select options to v2 values
  console.log('  Updating "Status" select options...');
  await notion.databases.update({
    database_id: DB_ID!,
    properties: {
      Status: {
        select: selectOptions(['Success', 'Warning', 'Error', 'Info']),
      },
    } as never,
  });

  // Step 4: Add new properties if missing
  const newProps: Record<string, unknown> = {};

  if (!('Service' in props)) {
    console.log('  Adding "Service" select property...');
    newProps['Service'] = { select: selectOptions(['Worker', 'API', 'Dashboard']) };
  }
  if (!('Timestamp' in props)) {
    console.log('  Adding "Timestamp" date property...');
    newProps['Timestamp'] = { date: {} };
  }
  if (!('Token Count' in props)) {
    console.log('  Adding "Token Count" number property...');
    newProps['Token Count'] = { number: {} };
  }
  if (!('Details' in props)) {
    console.log('  Adding "Details" rich_text property...');
    newProps['Details'] = { rich_text: {} };
  }

  if (Object.keys(newProps).length > 0) {
    await notion.databases.update({
      database_id: DB_ID!,
      properties: newProps as never,
    });
  } else {
    console.log('  No new properties needed.');
  }

  console.log('\nMigration complete.');
  console.log('Note: Existing records with old Status/Event Type values will show as "other" in Notion until manually updated.');
}

main().catch(err => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
