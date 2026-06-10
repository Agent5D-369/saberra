/**
 * migrate-split-overloaded-titles.ts
 *
 * Backfills Canon Change Requests and Memory Review Queue records that have
 * full-text content crammed into the Notion title property.
 *
 * For each record:
 *   - If the title is longer than 100 chars, it was written by the old logic.
 *   - Truncate it to the first sentence (max 80 chars) → keep as title.
 *   - Copy the full original title text into the new Detail property.
 *   - Records already short enough are skipped.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const CANON_DB       = process.env.NOTION_DB_CANON_CHANGE_REQUESTS!;
const MEMORY_DB      = process.env.NOTION_DB_MEMORY_REVIEW_QUEUE!;

if (!NOTION_API_KEY || !CANON_DB || !MEMORY_DB) {
  console.error('Missing required env vars: NOTION_API_KEY, NOTION_DB_CANON_CHANGE_REQUESTS, NOTION_DB_MEMORY_REVIEW_QUEUE');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

function shortLabel(text: string, max = 80): string {
  const s = text.split(/[.!?\n]/)[0]?.trim() ?? text.trim();
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function extractTitle(page: any): string {
  const props = page.properties as Record<string, any>;
  for (const prop of Object.values(props)) {
    if (prop.type === 'title') {
      return (prop.title as Array<{ plain_text: string }>)
        .map(t => t.plain_text).join('') ?? '';
    }
  }
  return '';
}

async function paginateAll(dbId: string): Promise<any[]> {
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: dbId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function migrateDb(
  dbId: string,
  titleProp: string,
  detailProp: string,
  label: string,
): Promise<void> {
  console.log(`\n=== ${label} ===`);
  const pages = await paginateAll(dbId);
  console.log(`  Found ${pages.length} records`);

  let updated = 0;
  let skipped = 0;

  for (const page of pages) {
    const fullText = extractTitle(page);
    if (!fullText || fullText.length <= 100) {
      skipped++;
      continue;
    }

    const short = shortLabel(fullText);

    try {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          [titleProp]: {
            title: [{ type: 'text', text: { content: short } }],
          },
          [detailProp]: {
            rich_text: [{ type: 'text', text: { content: fullText.slice(0, 2000) } }],
          },
        } as any,
      });
      console.log(`  [updated] ${short.slice(0, 70)}`);
      updated++;
    } catch (err) {
      console.error(`  [error] ${page.id}:`, (err as Error).message);
    }

    // Polite rate limiting
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`  Done: ${updated} updated, ${skipped} skipped (already short)`);
}

async function main(): Promise<void> {
  await migrateDb(CANON_DB,  'Proposed Change', 'Change Detail',   'Canon Change Requests');
  await migrateDb(MEMORY_DB, 'Proposed Memory', 'Memory Detail',   'Memory Review Queue');
  console.log('\nMigration complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
