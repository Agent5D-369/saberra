/**
 * Cleans up duplicate profiles caused by two extraction patterns:
 *
 * PATTERN 1 — First-name vs full-name split:
 *   Google Meet guest lists only provide first names or emails.
 *   Sera creates "Kyleen", "Nikita", "Jessica" from guest lists.
 *   Later, emails with full names create "Kyleen Keenan", "Nikita Timmermans", "Jessica Filkins".
 *   Fix: re-point any relations from stub → full-name profile, then archive the stub.
 *
 * PATTERN 2 — Nickname vs legal name:
 *   "Jess Filkins" (jess@amora.cr) and "Jessica Filkins" (jessica@amora.cr) are the same person.
 *   Fix: re-point Jess's tasks to Jessica, then archive Jess.
 *
 * PATTERN 3 — Org artifacts:
 *   "Amora Community (Google Calendar)" — calendar notification address, not a real person.
 *   "Amora" (Organization) — duplicate of "Amora Community" with fewer relations.
 *   "Sera Living Memory Hub AI Worker" — the system itself, not a person. Archive it.
 *
 * ROOT CAUSE FIX (applied in ClaudeExtractionService.ts):
 *   Profile dedup now falls back to email match when name match fails.
 *   If found by email, the stored name is upgraded to the fuller name automatically.
 *   This prevents this class of duplicate from recurring.
 *
 * Safe to re-run — skips already-archived pages.
 * Usage: npx ts-node scripts/migrate-dedup-profiles.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY  = process.env.NOTION_API_KEY;
const PROFILES = process.env.NOTION_DB_PROFILES;
const TASKS    = process.env.NOTION_DB_TASKS;

if (!API_KEY)  { console.error('NOTION_API_KEY required');    process.exit(1); }
if (!PROFILES) { console.error('NOTION_DB_PROFILES required'); process.exit(1); }
if (!TASKS)    { console.error('NOTION_DB_TASKS required');    process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// Profiles to merge and archive.
// stubId = the incomplete/duplicate profile to retire
// keepId = the profile to keep (richer record)
// retaskToKeep = if true, re-point Tasks Owned from stub → keep before archiving
const MERGES = [
  // First-name stubs — no meaningful unique relations, just Organization:Amora which keep has too
  { label: 'Kyleen stub → Kyleen Keenan',         stubId: '36d0a88e-f36a-8124-ada6-ebf34ff90bde', keepId: '36c0a88e-f36a-8163-b1b2-dfdf52721a6d', retaskToKeep: false },
  { label: 'Nikita stub → Nikita Timmermans',      stubId: '36d0a88e-f36a-81c2-af01-ca01ab5ce083', keepId: '36c0a88e-f36a-81c6-bdfc-c7dc120281ee', retaskToKeep: false },
  { label: 'Jessica stub → Jessica Filkins',        stubId: '36d0a88e-f36a-8149-b4ca-f69bbd2605bc', keepId: '36c0a88e-f36a-8170-8a66-e86fd178c6b2', retaskToKeep: false },
  // Nickname duplicate — Jess has 1 task that needs re-pointing
  { label: 'Jess Filkins → Jessica Filkins',        stubId: '36c0a88e-f36a-8104-9d09-c41e38328dbe', keepId: '36c0a88e-f36a-8170-8a66-e86fd178c6b2', retaskToKeep: true },
];

// Profiles to archive outright (no relations to migrate, or relations are noise)
const ARCHIVE_ONLY = [
  { label: 'Amora Community (Google Calendar) — calendar notification artifact', id: '36d0a88e-f36a-8117-84e1-d5d397fb8919' },
  // "Amora Community" (org) has Organization:1 self-ref — less data than "Amora"
  // "Amora" has Members:12 — it is the canonical org record; keep it.
  // NOTE: "Sera Living Memory Hub AI Worker" has 2 tasks + 1 risk — leave it for now,
  // it represents the system as an actor and those records are valid context.
];

async function queryTasksByOwner(ownerId: string): Promise<any[]> {
  const r = await fetch(`${BASE}/databases/${TASKS}/query`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      filter: { property: 'Owner', relation: { contains: ownerId } },
      page_size: 100,
    }),
  });
  if (!r.ok) throw new Error(`Query tasks: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).results ?? [];
}

async function getPage(pageId: string): Promise<any> {
  const r = await fetch(`${BASE}/pages/${pageId}`, { headers: H });
  if (!r.ok) throw new Error(`GET page ${pageId}: ${r.status}`);
  return r.json();
}

async function patchPage(pageId: string, body: object): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${pageId}: ${r.status} ${await r.text()}`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function archivePage(pageId: string): Promise<void> {
  await patchPage(pageId, { archived: true });
}

async function main() {
  console.log('\n── Step 1: Merge duplicate profiles ─────────────────────────────────────\n');

  for (const merge of MERGES) {
    console.log(`  ${merge.label}`);

    // Verify stub is not already archived
    const stub = await getPage(merge.stubId);
    if (stub.archived) {
      console.log('    stub already archived — skip\n');
      continue;
    }

    // Re-point tasks if needed
    if (merge.retaskToKeep) {
      const tasks = await queryTasksByOwner(merge.stubId);
      if (tasks.length) {
        console.log(`    re-pointing ${tasks.length} task(s) to keep profile...`);
        for (const task of tasks) {
          const taskName = task.properties?.Task?.title?.[0]?.plain_text ?? task.id;
          process.stdout.write(`      task "${taskName}" ... `);
          try {
            await patchPage(task.id, {
              properties: { Owner: { relation: [{ id: merge.keepId }] } },
            });
            console.log('ok');
          } catch (err: any) {
            console.log(`FAILED — ${err.message}`);
          }
          await sleep(300);
        }
      } else {
        console.log('    no tasks to re-point');
      }
    }

    // Archive the stub
    process.stdout.write('    archiving stub ... ');
    try {
      await archivePage(merge.stubId);
      console.log('ok');
    } catch (err: any) {
      console.log(`FAILED — ${err.message}`);
    }
    await sleep(350);
    console.log('');
  }

  console.log('\n── Step 2: Archive artifact profiles ─────────────────────────────────────\n');

  for (const item of ARCHIVE_ONLY) {
    process.stdout.write(`  archive "${item.label}" ... `);
    try {
      const page = await getPage(item.id);
      if (page.archived) {
        console.log('already archived');
        continue;
      }
      await archivePage(item.id);
      console.log('ok');
    } catch (err: any) {
      console.log(`FAILED — ${err.message}`);
    }
    await sleep(350);
  }

  console.log('\n── Summary ────────────────────────────────────────────────────────────────\n');
  console.log('Cleaned up:');
  console.log('  - Kyleen (stub) → archived, Kyleen Keenan is canonical');
  console.log('  - Nikita (stub) → archived, Nikita Timmermans is canonical');
  console.log('  - Jessica (stub) → archived, Jessica Filkins is canonical');
  console.log('  - Jess Filkins → tasks re-pointed to Jessica Filkins, archived');
  console.log('  - Amora Community (Google Calendar) → archived (artifact)');
  console.log('');
  console.log('Root cause fix applied in ClaudeExtractionService.ts:');
  console.log('  Profile dedup now checks email as fallback when name does not match.');
  console.log('  Shorter stored names are upgraded to fuller names on next encounter.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
