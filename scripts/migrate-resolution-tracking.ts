/**
 * Adds resolution/closure tracking fields to five databases:
 *
 *   CCOS Ledger Entries  — Resolution Notes, Resolved Date, adds "Resolved" to Status
 *   Risks                — Resolution Notes, Resolved Date
 *   Tasks                — Completed Date
 *   Projects             — Completed Date, Completion Notes
 *   Sensitive Review     — Reviewed Date
 *
 * Safe to re-run — Notion ignores property updates where the config is unchanged.
 *
 * Run: npx ts-node scripts/migrate-resolution-tracking.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

async function update(dbId: string, label: string, properties: object) {
  await notion.databases.update({ database_id: dbId, properties: properties as never });
  console.log(`  ${label} — done`);
}

async function main() {
  console.log('\nMigrating resolution tracking fields...\n');

  console.log('1. CCOS Ledger Entries');
  await update(dbs.ccosLedgerEntries, 'Resolution Notes', { 'Resolution Notes': { rich_text: {} } });
  await update(dbs.ccosLedgerEntries, 'Resolved Date',    { 'Resolved Date':    { date: {} } });
  // Add "Resolved" to Status options — passing all options so Notion doesn't drop existing ones
  await update(dbs.ccosLedgerEntries, 'Status + Resolved option', {
    Status: {
      select: {
        options: [
          { name: 'Draft' },
          { name: 'Pending Review' },
          { name: 'Approved' },
          { name: 'Resolved' },
          { name: 'Archived' },
        ],
      },
    },
  });

  console.log('\n2. Risks');
  await update(dbs.risks, 'Resolution Notes', { 'Resolution Notes': { rich_text: {} } });
  await update(dbs.risks, 'Resolved Date',    { 'Resolved Date':    { date: {} } });

  console.log('\n3. Tasks');
  await update(dbs.tasks, 'Completed Date',   { 'Completed Date':   { date: {} } });

  console.log('\n4. Projects');
  await update(dbs.projects, 'Completed Date',    { 'Completed Date':    { date: {} } });
  await update(dbs.projects, 'Completion Notes',  { 'Completion Notes':  { rich_text: {} } });

  console.log('\n5. Sensitive Review');
  await update(dbs.sensitiveReview, 'Reviewed Date', { 'Reviewed Date': { date: {} } });

  console.log('\nAll done.\n');
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
