/**
 * One-time migration: renames Notion Source Emails database properties
 * from Gmail-specific names to generic names.
 *
 * Run once after switching from Gmail API to IMAP ingestion:
 *   npm run migrate-schema
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

async function main() {
  const notionKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DB_SOURCE_EMAILS;

  if (!notionKey || !dbId) {
    console.error('NOTION_API_KEY and NOTION_DB_SOURCE_EMAILS must be set in .env');
    process.exit(1);
  }

  const notion = new Client({ auth: notionKey });

  console.log('Migrating Source Emails database schema...');

  await notion.databases.update({
    database_id: dbId,
    properties: {
      'Gmail Message ID': { name: 'Message ID', rich_text: {} },
      'Gmail Thread ID': { name: 'Thread Reference', rich_text: {} },
    },
  });

  console.log('✓ Renamed "Gmail Message ID" → "Message ID"');
  console.log('✓ Renamed "Gmail Thread ID" → "Thread Reference"');
  console.log('\nMigration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
