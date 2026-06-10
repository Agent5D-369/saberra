/**
 * Creates the Sensitive Review database.
 *
 * This database holds sensitive flags extracted by the pipeline and should live
 * in an admin-only section of Notion — NOT inside the main teamspace.
 *
 * How to position it outside the teamspace:
 *   1. In Notion, create a page in your Private section (or an admin-only page).
 *   2. Share that page with the pipeline integration (Share → Connections → add integration).
 *   3. Set SENSITIVE_REVIEW_PARENT_PAGE_ID to that page's ID in your env.
 *      If not set, falls back to NOTION_PARENT_PAGE_ID (teamspace — less isolated).
 *   4. Run: railway run npx ts-node scripts/create-sensitive-review-db.ts
 *   5. Copy the printed DB ID → add NOTION_DB_SENSITIVE_REVIEW to Railway env vars.
 *
 * Safe to re-run — checks for existing database before creating.
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const parentPageId = process.env.SENSITIVE_REVIEW_PARENT_PAGE_ID ?? process.env.NOTION_PARENT_PAGE_ID;
if (!parentPageId) { console.error('SENSITIVE_REVIEW_PARENT_PAGE_ID or NOTION_PARENT_PAGE_ID required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const select = (options: string[]) => ({
  select: { options: options.map(name => ({ name })) },
});

async function main() {
  // Check if already exists under this parent
  const searchRes = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ query: 'Sensitive Review', filter: { value: 'database', property: 'object' } }),
  });
  const searchData = (await searchRes.json()) as any;
  const existing = searchData.results?.find(
    (r: any) => r.title?.[0]?.plain_text === 'Sensitive Review',
  );
  if (existing) {
    console.log(`Sensitive Review database already exists: ${existing.id}`);
    console.log(`\nAdd to Railway env vars:\nNOTION_DB_SENSITIVE_REVIEW=${existing.id}`);
    return;
  }

  const res = await fetch(`${BASE}/databases`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: 'Sensitive Review' } }],
      properties: {
        Issue:                    { title: {} },
        Reason:                   { rich_text: {} },
        'Recommended Handling':   { rich_text: {} },
        Status:                   select(['Pending Review', 'Reviewed', 'Dismissed', 'Escalated']),
        Source:                   { rich_text: {} },
        'Date Flagged':           { date: {} },
        'Reviewed By':            { rich_text: {} },
        'Review Notes':           { rich_text: {} },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed to create database: ${res.status} ${err}`);
    process.exit(1);
  }

  const db = (await res.json()) as any;
  console.log(`\nSensitive Review database created: ${db.id}`);
  console.log(`\nAdd to Railway env vars:\nNOTION_DB_SENSITIVE_REVIEW=${db.id}`);
  console.log(`\nIMPORTANT: If this was created in the main teamspace, move it now:`);
  console.log(`  Notion → open the page → ··· menu → Move to → [admin private page]`);
  console.log(`  Then re-share it with the integration after moving.`);
}

main().catch(err => { console.error(err); process.exit(1); });
