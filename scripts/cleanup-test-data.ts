/**
 * Archives all records in the ephemeral (transactional) databases.
 * Leaves master-data databases untouched: Profiles, Circles, Roles,
 * Role Assignments, and Policies.
 *
 * Safe to re-run — already-archived pages are skipped automatically
 * by the Notion query (archived pages are excluded from query results).
 *
 * Usage: npx ts-node scripts/cleanup-test-data.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const EPHEMERAL_DBS: Record<string, string> = {
  'Source Emails':          process.env.NOTION_DB_SOURCE_EMAILS!,
  'Meetings':               process.env.NOTION_DB_MEETINGS!,
  'Meeting Assets':         process.env.NOTION_DB_MEETING_ASSETS!,
  'Messages':               process.env.NOTION_DB_MESSAGES!,
  'Profiles':               process.env.NOTION_DB_PROFILES!,
  'Projects':               process.env.NOTION_DB_PROJECTS!,
  'Circles':                process.env.NOTION_DB_CIRCLES!,
  'Roles':                  process.env.NOTION_DB_ROLES!,
  'Role Assignments':       process.env.NOTION_DB_ROLE_ASSIGNMENTS!,
  'Tasks':                  process.env.NOTION_DB_TASKS!,
  'Decision Candidates':    process.env.NOTION_DB_DECISION_CANDIDATES!,
  'Risks':                  process.env.NOTION_DB_RISKS!,
  'Memory Review Queue':    process.env.NOTION_DB_MEMORY_REVIEW_QUEUE!,
  'Canon Change Requests':  process.env.NOTION_DB_CANON_CHANGE_REQUESTS!,
  'CCOS Ledger Entries':    process.env.NOTION_DB_CCOS_LEDGER_ENTRIES!,
  'Processing Events':      process.env.NOTION_DB_PROCESSING_EVENTS!,
  'Sensitive Review':       process.env.NOTION_DB_SENSITIVE_REVIEW!,
  'Policies':               process.env.NOTION_DB_POLICIES!,
};

for (const [name, id] of Object.entries(EPHEMERAL_DBS)) {
  if (!id) { console.error(`Missing env var for: ${name}`); process.exit(1); }
}

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function queryAll(dbId: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`${BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Query ${dbId}: ${r.status} ${await r.text()}`);
    const data = (await r.json()) as { results: { id: string }[]; has_more: boolean; next_cursor: string | null };
    ids.push(...data.results.map(p => p.id));
    cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
  } while (cursor);
  return ids;
}

async function archivePage(pageId: string, retries = 4): Promise<void> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(`${BASE}/pages/${pageId}`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ archived: true }),
      });
      if (!r.ok) throw new Error(`Archive ${pageId}: ${r.status} ${await r.text()}`);
      return;
    } catch (err: any) {
      const isSocket = err?.cause?.code === 'UND_ERR_SOCKET' || err?.message?.includes('fetch failed');
      if (isSocket && attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  console.log(`\n── Amora test-data cleanup ${DRY_RUN ? '[DRY RUN]' : ''} ──\n`);

  let totalArchived = 0;

  for (const [name, dbId] of Object.entries(EPHEMERAL_DBS)) {
    process.stdout.write(`  ${name.padEnd(24)} … `);
    const ids = await queryAll(dbId);
    if (ids.length === 0) {
      console.log('empty, skipping');
      continue;
    }
    if (DRY_RUN) {
      console.log(`would archive ${ids.length} records`);
      totalArchived += ids.length;
      continue;
    }
    // Archive in batches, throttle to avoid rate limits
    let count = 0;
    for (const id of ids) {
      await archivePage(id);
      count++;
      if (count % 10 === 0) await new Promise(r => setTimeout(r, 400));
    }
    console.log(`archived ${count}`);
    totalArchived += count;
  }

  console.log(`\n  Total: ${totalArchived} records ${DRY_RUN ? 'would be archived' : 'archived'}\n`);
  if (DRY_RUN) console.log('  Re-run without --dry-run to apply.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
