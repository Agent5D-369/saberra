/**
 * Archives (soft-deletes) all records from all 17 Notion databases.
 * Run this to get a clean slate before go-live testing.
 *
 * Usage: railway run npx ts-node scripts/reset-notion-databases.ts
 *
 * DESTRUCTIVE — only run in dev/test. All data will be archived.
 * Archived pages are recoverable from Notion's trash for 30 days.
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DB_IDS: Record<string, string | undefined> = {
  'Source Emails':          process.env.NOTION_DB_SOURCE_EMAILS,
  'Meetings':               process.env.NOTION_DB_MEETINGS,
  'Meeting Assets':         process.env.NOTION_DB_MEETING_ASSETS,
  'Messages':               process.env.NOTION_DB_MESSAGES,
  'Profiles':               process.env.NOTION_DB_PROFILES,
  'Projects':               process.env.NOTION_DB_PROJECTS,
  'Circles':                process.env.NOTION_DB_CIRCLES,
  'Roles':                  process.env.NOTION_DB_ROLES,
  'Role Assignments':       process.env.NOTION_DB_ROLE_ASSIGNMENTS,
  'Tasks':                  process.env.NOTION_DB_TASKS,
  'Decision Candidates':    process.env.NOTION_DB_DECISION_CANDIDATES,
  'Risks':                  process.env.NOTION_DB_RISKS,
  'Memory Review Queue':    process.env.NOTION_DB_MEMORY_REVIEW_QUEUE,
  'Canon Change Requests':  process.env.NOTION_DB_CANON_CHANGE_REQUESTS,
  'CCOS Ledger Entries':    process.env.NOTION_DB_CCOS_LEDGER_ENTRIES,
  'Processing Events':      process.env.NOTION_DB_PROCESSING_EVENTS,
  'Sensitive Review':       process.env.NOTION_DB_SENSITIVE_REVIEW,
};

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function getAllPageIds(dbId: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`${BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Query ${dbId}: ${r.status} ${await r.text()}`);
    const data = (await r.json()) as any;
    for (const page of data.results ?? []) ids.push(page.id);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return ids;
}

async function archivePage(pageId: string): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ archived: true }),
  });
  if (!r.ok) throw new Error(`Archive ${pageId}: ${r.status}`);
}

async function clearDatabase(name: string, dbId: string): Promise<void> {
  process.stdout.write(`  ${name} … `);
  const ids = await getAllPageIds(dbId);
  if (ids.length === 0) { console.log('empty'); return; }

  let done = 0;
  for (const id of ids) {
    await archivePage(id);
    done++;
    // Throttle to avoid rate limits
    if (done % 10 === 0) await new Promise(r => setTimeout(r, 300));
  }
  console.log(`archived ${done} records`);
}

async function main() {
  console.log('⚠️  RESETTING ALL NOTION DATABASES — this archives all records.\n');

  const missing = Object.entries(DB_IDS).filter(([, v]) => !v);
  if (missing.length > 0) {
    console.error('Missing env vars for:', missing.map(([k]) => k).join(', '));
    process.exit(1);
  }

  for (const [name, dbId] of Object.entries(DB_IDS)) {
    try {
      await clearDatabase(name, dbId!);
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.log(`✗ error`);
      console.error(`    ${err}`);
    }
  }

  console.log('\nDone. All databases cleared. Ready for clean go-live test.');
}

main().catch(err => { console.error(err); process.exit(1); });
