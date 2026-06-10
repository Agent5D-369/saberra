/**
 * Migrates Verdana's automation-only databases (Source Emails, Meetings, Meeting Assets)
 * from the simplified template schema to the full worker schema that the Sera worker expects.
 *
 * The create-saberra-template.ts used simplified field names (e.g. "Subject" as title,
 * "Drive File ID" instead of "Google Drive File ID"). This migration aligns them with what
 * the worker code actually reads and writes.
 *
 * Run: NOTION_API_KEY=ntn_... npx ts-node scripts/migrate-verdana-automation-schemas.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const KEY  = process.env.NOTION_API_KEY!;
const MEETINGS_DB        = process.env.MEETINGS_DB        ?? '37b130aa-ffa3-8190-bdf0-e8183b07c6ad';
const MEETING_ASSETS_DB  = process.env.MEETING_ASSETS_DB  ?? '37b130aa-ffa3-8181-bffb-d9a014c495bf';
const SOURCE_EMAILS_DB   = process.env.SOURCE_EMAILS_DB   ?? '37b130aa-ffa3-8116-a1e1-c7ccb45b909b';

if (!KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const notion = new Client({ auth: KEY });

function sel(opts: string[]) { return { select: { options: opts.map(n => ({ name: n })) } }; }
function richText()           { return { rich_text: {} }; }
function date_()              { return { date: {} }; }
function num()                { return { number: {} }; }
function check()              { return { checkbox: {} }; }
function url_()               { return { url: {} }; }

async function getProps(dbId: string): Promise<Record<string, string>> {
  const db = await notion.databases.retrieve({ database_id: dbId });
  return Object.fromEntries(
    Object.entries(db.properties as Record<string, { type: string }>).map(([name, p]) => [name, p.type])
  );
}

async function update(dbId: string, props: Record<string, unknown>): Promise<void> {
  await notion.databases.update({ database_id: dbId, properties: props as never });
}

// ─── Source Emails ────────────────────────────────────────────────────────────
async function migrateSourceEmails() {
  console.log('\n[Source Emails]');
  const props = await getProps(SOURCE_EMAILS_DB);

  // Rename title "Subject" → "Title" (worker writes Title: N.title(...))
  if ('Subject' in props && props['Subject'] === 'title') {
    console.log('  Renaming title "Subject" → "Title"');
    await update(SOURCE_EMAILS_DB, { Subject: { name: 'Title' } });
  } else {
    console.log('  Title already correct or already migrated');
  }

  // Add missing fields
  const toAdd: Record<string, unknown> = {};
  if (!('Thread Reference' in props))  toAdd['Thread Reference']  = richText();
  if (!('CC' in props))                toAdd['CC']                = richText();
  if (!('BCC Indicator' in props))     toAdd['BCC Indicator']     = check();
  if (!('Subject' in props) || props['Subject'] !== 'title') {
    // Subject (as richText - holds original subject, separate from Title)
    if (!('Subject' in props)) toAdd['Subject'] = richText();
  }
  if (!('Source Category' in props))   toAdd['Source Category']   = sel(['Meeting Asset', 'Operational', 'Unknown']);
  if (!('Raw Snippet' in props))       toAdd['Raw Snippet']       = richText();
  if (!('Detected Links' in props))    toAdd['Detected Links']    = richText();
  if (!('Error Log' in props))         toAdd['Error Log']         = richText();
  if (!('Processed At' in props))      toAdd['Processed At']      = date_();

  if (Object.keys(toAdd).length) {
    console.log('  Adding:', Object.keys(toAdd).join(', '));
    await update(SOURCE_EMAILS_DB, toAdd);
  } else {
    console.log('  No new fields needed');
  }

  // Update Email Type options to match worker values
  console.log('  Updating Email Type select options');
  await update(SOURCE_EMAILS_DB, {
    'Email Type': sel(['Google Meet Recording', 'Google Meet Transcript', 'Google Meet Notes', 'Operational Email', 'Forwarded Thread', 'Unknown']),
  });

  // Update Processing Status options
  console.log('  Updating Processing Status select options');
  await update(SOURCE_EMAILS_DB, {
    'Processing Status': sel(['Pending', 'Processing', 'Processed', 'Needs Access', 'Failed', 'Manual Review', 'Skipped']),
  });
}

// ─── Meetings ─────────────────────────────────────────────────────────────────
async function migrateMeetings() {
  console.log('\n[Meetings]');
  const props = await getProps(MEETINGS_DB);

  // Rename title "Meeting Name" → "Meeting Title"
  if ('Meeting Name' in props && props['Meeting Name'] === 'title') {
    console.log('  Renaming title "Meeting Name" → "Meeting Title"');
    await update(MEETINGS_DB, { 'Meeting Name': { name: 'Meeting Title' } });
  } else {
    console.log('  Title already correct or already migrated');
  }

  // Rename "Recording URL" → "Recording Link", "Transcript URL" → "Transcript Link", "Notes URL" → "Notes Link"
  const urlRenames: Array<[string, string]> = [
    ['Recording URL',  'Recording Link'],
    ['Transcript URL', 'Transcript Link'],
    ['Notes URL',      'Notes Link'],
  ];
  for (const [from, to] of urlRenames) {
    if (from in props && !(to in props)) {
      console.log(`  Renaming "${from}" → "${to}"`);
      await update(MEETINGS_DB, { [from]: { name: to } });
    }
  }

  // Add missing fields
  const props2 = await getProps(MEETINGS_DB);
  const toAdd: Record<string, unknown> = {};
  if (!('Google Calendar Link' in props2))          toAdd['Google Calendar Link']          = url_();
  if (!('Google Meet Link' in props2))              toAdd['Google Meet Link']              = url_();
  if (!('Recording Link' in props2))                toAdd['Recording Link']                = url_();
  if (!('Transcript Link' in props2))               toAdd['Transcript Link']               = url_();
  if (!('Notes Link' in props2))                    toAdd['Notes Link']                    = url_();
  if (!('Recording Access Status' in props2))       toAdd['Recording Access Status']       = sel(['Unknown', 'Confirmed', 'Needs Access', 'Denied']);
  if (!('Transcript Access Status' in props2))      toAdd['Transcript Access Status']      = sel(['Unknown', 'Confirmed', 'Needs Access', 'Denied']);
  if (!('Notes Access Status' in props2))           toAdd['Notes Access Status']           = sel(['Unknown', 'Confirmed', 'Needs Access', 'Denied']);
  if (!('Canon Review Required' in props2))         toAdd['Canon Review Required']         = check();
  if (!('Sensitive Review Required' in props2))     toAdd['Sensitive Review Required']     = check();
  if (!('Last Processed At' in props2))             toAdd['Last Processed At']             = date_();
  if (!('Automation Log' in props2))                toAdd['Automation Log']                = richText();
  if (!('Summary' in props2))                       toAdd['Summary']                       = richText();

  if (Object.keys(toAdd).length) {
    console.log('  Adding:', Object.keys(toAdd).join(', '));
    await update(MEETINGS_DB, toAdd);
  } else {
    console.log('  No new fields needed');
  }

  // Update Processing Status options
  console.log('  Updating Processing Status select options');
  await update(MEETINGS_DB, {
    'Processing Status': sel(['Pending', 'Processing', 'Processed', 'Partial', 'Failed', 'Manual Review']),
  });
}

// ─── Meeting Assets ───────────────────────────────────────────────────────────
async function migrateMeetingAssets() {
  console.log('\n[Meeting Assets]');
  const props = await getProps(MEETING_ASSETS_DB);

  // Rename "Drive File ID" → "Google Drive File ID"
  if ('Drive File ID' in props && !('Google Drive File ID' in props)) {
    console.log('  Renaming "Drive File ID" → "Google Drive File ID"');
    await update(MEETING_ASSETS_DB, { 'Drive File ID': { name: 'Google Drive File ID' } });
  }
  // Rename "URL" → "Google Drive Link"
  if ('URL' in props && props['URL'] === 'url' && !('Google Drive Link' in props)) {
    console.log('  Renaming "URL" → "Google Drive Link"');
    await update(MEETING_ASSETS_DB, { URL: { name: 'Google Drive Link' } });
  }
  // Rename "Processing Notes" → "Error Message"
  if ('Processing Notes' in props && !('Error Message' in props)) {
    console.log('  Renaming "Processing Notes" → "Error Message"');
    await update(MEETING_ASSETS_DB, { 'Processing Notes': { name: 'Error Message' } });
  }

  // Add missing fields
  const props2 = await getProps(MEETING_ASSETS_DB);
  const toAdd: Record<string, unknown> = {};
  if (!('Processing Status' in props2)) toAdd['Processing Status'] = sel(['Pending', 'Processing', 'Processed', 'Needs Access', 'Failed', 'Manual Review']);
  if (!('Received At' in props2))       toAdd['Received At']       = date_();
  if (!('Retry Count' in props2))       toAdd['Retry Count']       = num();
  if (!('Next Retry At' in props2))     toAdd['Next Retry At']     = date_();
  if (!('Error Message' in props2))     toAdd['Error Message']     = richText();
  if (!('Processed At' in props2))      toAdd['Processed At']      = date_();

  // Add Meeting as relation property (template had it as text - we add a relation alongside it)
  // The worker writes Meeting: N.relation([meetingPageId]) so it needs a relation property
  if (!('Meeting' in props2) || props2['Meeting'] !== 'relation') {
    if ('Meeting' in props2 && props2['Meeting'] === 'text') {
      console.log('  Renaming old text "Meeting" → "Meeting (legacy)"');
      await update(MEETING_ASSETS_DB, { Meeting: { name: 'Meeting (legacy)' } });
    }
    console.log('  Adding "Meeting" as relation → Meetings DB');
    toAdd['Meeting'] = {
      relation: {
        database_id: MEETINGS_DB,
        type: 'single_property',
        single_property: {},
      },
    };
  }

  if (Object.keys(toAdd).length) {
    console.log('  Adding:', Object.keys(toAdd).join(', '));
    await update(MEETING_ASSETS_DB, toAdd);
  } else {
    console.log('  No new fields needed');
  }

  // Update Asset Type select options
  console.log('  Updating Asset Type select options');
  await update(MEETING_ASSETS_DB, {
    'Asset Type': sel(['Recording', 'Transcript', 'Gemini Notes', 'Chat Log', 'Caption File', 'Attachment', 'Unknown']),
  });

  // Update Access Status options
  console.log('  Updating Access Status select options');
  await update(MEETING_ASSETS_DB, {
    'Access Status': sel(['Unknown', 'Confirmed', 'Needs Access', 'Denied']),
  });
}

async function main() {
  console.log('Migrating Verdana automation-only databases to worker schema...');
  console.log('  Source Emails:', SOURCE_EMAILS_DB);
  console.log('  Meetings:', MEETINGS_DB);
  console.log('  Meeting Assets:', MEETING_ASSETS_DB);

  await migrateSourceEmails();
  await migrateMeetings();
  await migrateMeetingAssets();

  console.log('\nMigration complete.');
}

main().catch(err => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
