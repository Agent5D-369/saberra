/**
 * Creates the Knowledge Base Notion database under the configured parent page.
 * Prints the new database ID — add it to Railway env as NOTION_DB_KNOWLEDGE_BASE.
 *
 * Run once: npx ts-node scripts/migrate-add-knowledge-base.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { DATABASE_SCHEMAS } from '../src/config/notionSchemas';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID!;

if (!PARENT_PAGE_ID) {
  console.error('NOTION_PARENT_PAGE_ID must be set');
  process.exit(1);
}

async function main() {
  const schema = DATABASE_SCHEMAS.knowledgeBase;
  console.log(`\nCreating "${schema.title}" database under parent page ${PARENT_PAGE_ID}...\n`);

  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: schema.title } }],
    properties: schema.properties as Parameters<typeof notion.databases.create>[0]['properties'],
  });

  console.log(`Done.\n\nAdd this to your Railway environment variables:\n`);
  console.log(`  NOTION_DB_KNOWLEDGE_BASE=${db.id}\n`);
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
