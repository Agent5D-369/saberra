import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function auditDb(name: string, dbId: string, fields: string[]) {
  console.log('\n' + name);
  let cursor: string | undefined;
  let total = 0;
  const counts: Record<string, number> = {};
  fields.forEach(f => { counts[f] = 0; });
  do {
    const res: any = await notion.databases.query({ database_id: dbId, start_cursor: cursor, page_size: 100 });
    for (const page of res.results) {
      total++;
      for (const f of fields) {
        const prop = (page as any).properties[f];
        if (!prop) continue;
        let hasVal = false;
        if (prop.type === 'select' && prop.select) hasVal = true;
        if (prop.type === 'checkbox' && prop.checkbox === true) hasVal = true;
        if (prop.type === 'rich_text' && prop.rich_text?.length > 0) hasVal = true;
        if (prop.type === 'date' && prop.date) hasVal = true;
        if (prop.type === 'relation' && prop.relation?.length > 0) hasVal = true;
        if (hasVal) counts[f]++;
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  console.log('  total records:', total);
  for (const f of fields) {
    const pct = total ? Math.round(counts[f] / total * 100) : 0;
    console.log(`  ${f}: ${counts[f]}/${total} (${pct}%)`);
  }
}

async function run() {
  await auditDb('Decision Candidates', process.env.NOTION_DB_DECISION_CANDIDATES!, [
    'Status', 'Lifecycle', 'Extraction Confidence', 'Purpose Alignment', 'Canon Impact',
  ]);
  await auditDb('Tasks', process.env.NOTION_DB_TASKS!, [
    'Status', 'Priority', 'Lifecycle', 'Extraction Confidence',
  ]);
  await auditDb('Risks', process.env.NOTION_DB_RISKS!, [
    'Status', 'Severity', 'Category', 'Lifecycle', 'Extraction Confidence',
  ]);
  await auditDb('Memory Review Queue', process.env.NOTION_DB_MEMORY_REVIEW_QUEUE!, [
    'Status', 'Priority', 'Confidence',
  ]);
  await auditDb('Knowledge Base', process.env.NOTION_DB_KNOWLEDGE_BASE!, [
    'Status', 'Category', 'Confidence',
  ]);
  await auditDb('Profiles', process.env.NOTION_DB_PROFILES!, [
    'Engagement Status', 'Profile Type', 'Primary Sector',
  ]);
}

run().catch(console.error);
