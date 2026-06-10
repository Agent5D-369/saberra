/**
 * Backfills Verdana Commons demo hub with June 2026 fields:
 *   - Decision Candidates: Implementation Status = 'Not Started' where missing
 *   - Risks: Review Date based on severity where missing (High=+30d, Medium=+90d)
 *
 * Uses same NOTION_API_KEY as Amora (same Notion workspace).
 * Verdana DB IDs are hardcoded from the Verdana Commons - Living Memory Hub page.
 *
 * Safe to re-run: only touches records where the field is empty.
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Verdana Commons database page IDs (from https://app.notion.com/p/3770a88ef36a808f9816f50ed31c83df)
const VERDANA_DECISIONS = '66f0a88e-f36a-83a0-a054-017bc0113390';
const VERDANA_RISKS     = 'f080a88e-f36a-8288-b0f1-8168030d1c35';

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

async function backfillDecisions() {
  console.log('\n── Decision Candidates ─────────────────────────────────────────');
  const pages = await paginateAll(VERDANA_DECISIONS, {
    property: 'Implementation Status',
    select: { is_empty: true },
  });
  console.log(`  Found ${pages.length} decisions missing Implementation Status`);
  let updated = 0;
  for (const page of pages) {
    await notion.pages.update({
      page_id: page.id,
      properties: {
        'Implementation Status': { select: { name: 'Not Started' } },
      } as any,
    });
    updated++;
  }
  console.log(`  Updated: ${updated}`);
}

async function backfillRisks() {
  console.log('\n── Risks ────────────────────────────────────────────────────────');
  const pages = await paginateAll(VERDANA_RISKS, {
    property: 'Review Date',
    date: { is_empty: true },
  });
  console.log(`  Found ${pages.length} risks missing Review Date`);
  let updated = 0;
  for (const page of pages) {
    const severityProp = (page.properties['Severity'] as any)?.select?.name ?? 'Medium';
    const baseDate = new Date(page.created_time);
    const daysToAdd = severityProp === 'High' ? 30 : 90;
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const reviewDate = baseDate.toISOString().slice(0, 10);
    await notion.pages.update({
      page_id: page.id,
      properties: {
        'Review Date': { date: { start: reviewDate } },
      } as any,
    });
    console.log(`  [${severityProp}] Review Date = ${reviewDate}`);
    updated++;
  }
  console.log(`  Updated: ${updated}`);
}

async function main() {
  console.log('Verdana Commons backfill — June 2026 fields');
  await backfillDecisions();
  await backfillRisks();
  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
