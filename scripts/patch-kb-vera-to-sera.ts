/**
 * Patches all KB articles in Notion: replaces every instance of Vera→Sera
 * in KB Title, Summary, Key Points, Source, and Possible Duplicate Of.
 *
 * Safe to re-run — skips pages that need no changes.
 * Usage: npx ts-node scripts/patch-kb-vera-to-sera.ts
 */

import * as dotenv from 'dotenv';
import { Client, isFullPage } from '@notionhq/client';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const KB_DB_ID       = process.env.NOTION_DB_KNOWLEDGE_BASE!;
const DRY_RUN        = process.env.DRY_RUN === 'true';

if (!NOTION_API_KEY) throw new Error('NOTION_API_KEY not set');
if (!KB_DB_ID)       throw new Error('NOTION_DB_KNOWLEDGE_BASE not set');

const notion = new Client({ auth: NOTION_API_KEY });

function seraify(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bVera\b(?![-.]api)/g, 'Sera')
    .replace(/\bvera\b(?![-@.])/g, 'sera');
}

function plainText(prop: any): string {
  if (!prop) return '';
  const blocks: any[] = prop.title ?? prop.rich_text ?? [];
  return blocks.map((b: any) => b.plain_text ?? '').join('');
}

function toRichText(text: string) {
  return { rich_text: [{ text: { content: text.slice(0, 2000) } }] };
}
function toTitle(text: string) {
  return { title: [{ text: { content: text.slice(0, 2000) } }] };
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('Fetching all KB articles...\n');

  let cursor: string | undefined;
  let total = 0, patched = 0, skipped = 0;

  do {
    const res = await notion.databases.query({
      database_id: KB_DB_ID,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of res.results) {
      if (!isFullPage(page)) continue;
      const p = page.properties as any;
      total++;

      const origTitle  = plainText(p['KB Title']);
      const origSumm   = plainText(p['Summary']);
      const origKP     = plainText(p['Key Points']);
      const origSource = plainText(p['Source']);
      const origDupOf  = plainText(p['Possible Duplicate Of']);

      const newTitle  = seraify(origTitle);
      const newSumm   = seraify(origSumm);
      const newKP     = seraify(origKP);
      const newSource = seraify(origSource);
      const newDupOf  = seraify(origDupOf);

      const changed = newTitle !== origTitle || newSumm !== origSumm ||
                      newKP !== origKP || newSource !== origSource || newDupOf !== origDupOf;

      if (!changed) { skipped++; continue; }

      const updates: Record<string, any> = {};
      if (newTitle  !== origTitle)  updates['KB Title']               = toTitle(newTitle);
      if (newSumm   !== origSumm)   updates['Summary']                = toRichText(newSumm);
      if (newKP     !== origKP)     updates['Key Points']             = toRichText(newKP);
      if (newSource !== origSource) updates['Source']                 = toRichText(newSource);
      if (newDupOf  !== origDupOf)  updates['Possible Duplicate Of']  = toRichText(newDupOf);

      const fields = Object.keys(updates).join(', ');
      if (DRY_RUN) {
        console.log(`  [DRY] "${origTitle}" — would patch: ${fields}`);
      } else {
        await notion.pages.update({ page_id: page.id, properties: updates as never });
        console.log(`  PATCHED "${newTitle}" — ${fields}`);
        await new Promise(r => setTimeout(r, 340)); // rate limit
      }
      patched++;
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  console.log(`\nDone. Total: ${total}, Patched: ${patched}, No change: ${skipped}`);
}

main().catch(err => { console.error(err); process.exit(1); });
