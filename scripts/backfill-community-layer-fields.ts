/**
 * Backfills fields added by migrate-community-layer.ts to existing records:
 *   - Decision Candidates: sets Implementation Status = 'Not Started' where missing
 *   - Risks: sets Review Date based on severity where missing
 *     (High severity = +30 days from source date; Medium/Low = +90 days)
 *
 * Safe to re-run: only touches records where the field is empty.
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB_DECISIONS = process.env.NOTION_DB_DECISION_CANDIDATES!;
const DB_RISKS     = process.env.NOTION_DB_RISKS!;

async function paginateAll(dbId: string, filter?: object): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      filter: filter as any,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

function addDays(isoDate: string | null, days: number): string {
  const base = isoDate ? new Date(isoDate) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

async function backfillDecisions() {
  console.log('\nBackfilling Decision Candidates: Implementation Status...');
  // Only pages where Implementation Status is empty
  const pages = await paginateAll(DB_DECISIONS, {
    property: 'Implementation Status',
    select: { is_empty: true },
  });
  console.log(`  Found ${pages.length} decisions without Implementation Status`);
  let updated = 0;
  for (const page of pages) {
    await notion.pages.update({
      page_id: page.id,
      properties: {
        'Implementation Status': { select: { name: 'Not Started' } },
      },
    });
    updated++;
    if (updated % 20 === 0) console.log(`  ...${updated} updated`);
  }
  console.log(`  Done: ${updated} decisions updated`);
}

async function backfillRisks() {
  console.log('\nBackfilling Risks: Review Date...');
  // Only pages where Review Date is empty
  const pages = await paginateAll(DB_RISKS, {
    property: 'Review Date',
    date: { is_empty: true },
  });
  console.log(`  Found ${pages.length} risks without Review Date`);
  let updated = 0;
  for (const page of pages) {
    const severityProp = page.properties['Severity'] as { select?: { name?: string } } | undefined;
    const severity = severityProp?.select?.name ?? 'Medium';
    const days = severity === 'High' ? 30 : 90;
    // Use Created Time as the base since we don't have sourceDate on existing records
    const createdDate = page.created_time?.slice(0, 10) ?? null;
    const reviewDate = addDays(createdDate, days);
    await notion.pages.update({
      page_id: page.id,
      properties: {
        'Review Date': { date: { start: reviewDate } },
      },
    });
    updated++;
    if (updated % 20 === 0) console.log(`  ...${updated} updated`);
  }
  console.log(`  Done: ${updated} risks updated`);
}

async function run() {
  if (!DB_DECISIONS || !DB_RISKS) {
    console.error('Missing required env vars: NOTION_DB_DECISION_CANDIDATES, NOTION_DB_RISKS');
    process.exit(1);
  }
  await backfillDecisions();
  await backfillRisks();
  console.log('\nBackfill complete.');
}

run().catch(console.error);
