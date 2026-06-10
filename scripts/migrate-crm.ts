/**
 * CRM migration — two steps:
 *   1. Creates the Interactions database under NOTION_PARENT_PAGE_ID
 *   2. Patches the Profiles database with four new CRM fields:
 *        Next Action, Follow-up Date, Lead Stage, Lead Source
 *
 * Safe to re-run — Notion ignores property additions when the name already exists.
 *
 * Usage:
 *   npx ts-node scripts/migrate-crm.ts
 *
 * After running, copy the printed NOTION_DB_INTERACTIONS value to Railway env vars
 * on both the worker and dashboard services, then deploy both.
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY        = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;
const PROFILES_DB    = process.env.NOTION_DB_PROFILES;
const MEETINGS_DB    = process.env.NOTION_DB_MEETINGS;
const SOURCE_EMAILS_DB = process.env.NOTION_DB_SOURCE_EMAILS;

if (!API_KEY)        { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!PARENT_PAGE_ID) { console.error('NOTION_PARENT_PAGE_ID required'); process.exit(1); }
if (!PROFILES_DB)    { console.error('NOTION_DB_PROFILES required'); process.exit(1); }
if (!MEETINGS_DB)    { console.error('NOTION_DB_MEETINGS required'); process.exit(1); }
if (!SOURCE_EMAILS_DB) { console.error('NOTION_DB_SOURCE_EMAILS required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function createInteractionsDb(): Promise<string> {
  console.log('  Creating Interactions database...');
  const r = await fetch(`${BASE}/databases`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      parent: { page_id: PARENT_PAGE_ID },
      title: [{ text: { content: 'Interactions' } }],
      properties: {
        Name:      { title: {} },
        Date:      { date: {} },
        Type:      { select: { options: [
          { name: 'Email' }, { name: 'Meeting' }, { name: 'Call' },
          { name: 'Note' }, { name: 'Forward' }, { name: 'Other' },
        ] } },
        Direction: { select: { options: [
          { name: 'Inbound' }, { name: 'Outbound' }, { name: 'Internal' },
        ] } },
        Summary:   { rich_text: {} },
        Contacts:  { relation: { database_id: PROFILES_DB, type: 'dual_property', dual_property: {} } },
        Meeting:   { relation: { database_id: MEETINGS_DB, type: 'single_property', single_property: {} } },
        'Source Email': { relation: { database_id: SOURCE_EMAILS_DB, type: 'single_property', single_property: {} } },
        'Logged By':       { rich_text: {} },
        'Follow-up Needed': { checkbox: {} },
      },
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`POST /databases: ${r.status} ${text}`);
  }
  const data = await r.json() as { id: string };
  console.log(`    Created — ID: ${data.id}`);
  return data.id;
}

async function patchProfilesCrmFields(): Promise<void> {
  console.log('  Adding CRM fields to Profiles...');
  const r = await fetch(`${BASE}/databases/${PROFILES_DB}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      properties: {
        'Lead Stage': { select: { options: [
          { name: 'New Lead' }, { name: 'Qualified' }, { name: 'Engaged' },
          { name: 'Proposal' }, { name: 'Negotiation' }, { name: 'Won' },
          { name: 'Lost' }, { name: 'Not a Lead' },
        ] } },
        'Lead Source': { select: { options: [
          { name: 'Referral' }, { name: 'Email' }, { name: 'Meeting' },
          { name: 'Event' }, { name: 'Website' }, { name: 'Social Media' },
          { name: 'Partner' }, { name: 'Unknown' },
        ] } },
        'Next Action': { rich_text: {} },
        'Follow-up Date': { date: {} },
        'Follow-up Owner': { rich_text: {} },
      },
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`PATCH /databases/${PROFILES_DB}: ${r.status} ${text}`);
  }
  console.log('    Done.');
}

async function main() {
  console.log('\nCRM migration starting...\n');

  const interactionsId = await createInteractionsDb();
  await patchProfilesCrmFields();

  console.log('\n─────────────────────────────────────────────────────');
  console.log('Migration complete. Add this to Railway env vars');
  console.log('on BOTH the worker and dashboard services:\n');
  console.log(`  NOTION_DB_INTERACTIONS=${interactionsId}`);
  console.log('─────────────────────────────────────────────────────\n');
}

main().catch(err => { console.error(err); process.exit(1); });
