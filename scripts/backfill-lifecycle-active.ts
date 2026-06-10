import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function backfillLifecycle(name: string, dbId: string) {
  console.log(`\n${name}`);
  let cursor: string | undefined;
  let updated = 0;
  let skipped = 0;

  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of res.results) {
      const lifecycle = page.properties['Lifecycle'];
      if (lifecycle?.select?.name) {
        skipped++;
        continue;
      }
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Lifecycle: { select: { name: 'Active' } },
        },
      });
      updated++;
    }

    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  console.log(`  Updated: ${updated}, Already set: ${skipped}`);
}

async function run() {
  await backfillLifecycle('Tasks', process.env.NOTION_DB_TASKS!);
  await backfillLifecycle('Risks', process.env.NOTION_DB_RISKS!);
  await backfillLifecycle('Decision Candidates', process.env.NOTION_DB_DECISION_CANDIDATES!);
  console.log('\nDone.');
}

run().catch(console.error);
