/**
 * cleanup-duplicate-tasks.ts
 *
 * Finds tasks with identical titles, keeps the most complete copy of each,
 * and archives the extras (sets archived: true via Notion API).
 *
 * "Most complete" priority: has Meeting relation > has Owner > older createdTime.
 *
 * Run with: npx ts-node scripts/cleanup-duplicate-tasks.ts
 * Add --dry-run to preview without archiving anything.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const TASKS_DB       = process.env.NOTION_DB_TASKS!;

if (!NOTION_API_KEY || !TASKS_DB) {
  console.error('Missing required env vars: NOTION_API_KEY, NOTION_DB_TASKS');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const notion  = new Client({ auth: NOTION_API_KEY });

interface TaskRecord {
  id:          string;
  title:       string;
  status:      string;
  hasMeeting:  boolean;
  hasOwner:    boolean;
  createdTime: string;
}

async function fetchAllTasks(): Promise<TaskRecord[]> {
  const tasks: TaskRecord[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: TASKS_DB,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const page of res.results) {
      if (!('properties' in page) || !('created_time' in page)) continue;
      const props = (page as any).properties as Record<string, any>;

      const titleParts = (props['Task']?.title as Array<{ plain_text: string }> | undefined) ?? [];
      const title = titleParts.map((t) => t.plain_text).join('').trim();
      if (!title) continue;

      const status      = props['Status']?.select?.name ?? '';
      const hasMeeting  = (props['Meeting']?.relation?.length ?? 0) > 0;
      const hasOwner    = (props['Owner']?.relation?.length ?? 0) > 0;
      const createdTime = (page as any).created_time as string;

      tasks.push({ id: page.id, title, status, hasMeeting, hasOwner, createdTime });
    }

    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);

  return tasks;
}

function score(t: TaskRecord): number {
  let s = 0;
  if (t.hasMeeting) s += 100;
  if (t.hasOwner)   s += 10;
  // Older = more likely the original; use negative epoch ms so lower is better
  s -= new Date(t.createdTime).getTime() / 1e12;
  return s;
}

async function main(): Promise<void> {
  console.log(`Fetching all tasks${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  const all = await fetchAllTasks();
  console.log(`  Found ${all.length} total tasks`);

  // Group by normalized title
  const groups = new Map<string, TaskRecord[]>();
  for (const t of all) {
    const key = t.title.toLowerCase().replace(/\s+/g, ' ');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const dupeGroups = [...groups.values()].filter((g) => g.length > 1);
  console.log(`  Found ${dupeGroups.length} duplicate title groups\n`);

  let archived = 0;
  let skipped  = 0;

  for (const group of dupeGroups) {
    // Sort: highest score first = best record to keep
    group.sort((a, b) => score(b) - score(a));
    const [keep, ...extras] = group;

    console.log(`[KEEP]    "${keep.title.slice(0, 70)}" (status: ${keep.status}, meeting: ${keep.hasMeeting}, owner: ${keep.hasOwner})`);

    for (const dupe of extras) {
      const isDone = dupe.status === 'Done' || dupe.status === 'Cancelled';
      // Don't archive Done/Cancelled tasks — they have intentional terminal state
      if (isDone) {
        console.log(`  [SKIP]  "${dupe.title.slice(0, 70)}" — terminal status (${dupe.status}), leaving as-is`);
        skipped++;
        continue;
      }
      console.log(`  [ARCHIVE] "${dupe.title.slice(0, 70)}" (id: ${dupe.id}, status: ${dupe.status})`);
      if (!DRY_RUN) {
        await notion.pages.update({ page_id: dupe.id, archived: true });
        await new Promise((r) => setTimeout(r, 300));
      }
      archived++;
    }
  }

  console.log(`\nDone: ${archived} archived, ${skipped} skipped (terminal status)${DRY_RUN ? ' — DRY RUN, nothing changed' : ''}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
