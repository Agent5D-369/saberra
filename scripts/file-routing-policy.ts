/**
 * Creates the Living Memory Hub Content Routing Policy as a Notion Policies record.
 * Safe to re-run -- checks for existing record by title before creating.
 *
 * Run once: npx ts-node scripts/file-routing-policy.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

const POLICY_TITLE = 'Living Memory Hub Content Routing Policy';

async function main() {
  if (!dbs.policies) {
    console.error('NOTION_DB_POLICIES is not set. Run setup-notion first.');
    process.exit(1);
  }

  // Check if it already exists
  const existing = await notion.databases.query({
    database_id: dbs.policies,
    filter: { property: 'Policy Name', title: { equals: POLICY_TITLE } },
    page_size: 1,
  });

  if (existing.results.length > 0) {
    console.log('Policy already exists:', (existing.results[0] as { url: string }).url);
    return;
  }

  // Read the markdown document for the summary
  const docPath = path.join(__dirname, '..', 'docs', 'LIVING_MEMORY_ROUTING_POLICY.md');
  const summary = fs.existsSync(docPath)
    ? fs.readFileSync(docPath, 'utf8').slice(0, 1800)
    : 'See docs/LIVING_MEMORY_ROUTING_POLICY.md';

  const page = await notion.pages.create({
    parent: { database_id: dbs.policies },
    properties: {
      'Policy Name': { title: [{ text: { content: POLICY_TITLE } }] },
      'Policy Area': { select: { name: 'Governing Purpose' } },
      Status:        { select: { name: 'Active' } },
      'Review Cadence': { select: { name: 'Annual' } },
      'Effective Date': { date: { start: '2026-05-27' } },
      'Last Review Date': { date: { start: '2026-05-27' } },
      'Current Text Summary': {
        rich_text: [{ text: { content: summary.replace(/[#*`_]/g, '').slice(0, 1800) } }],
      },
      Notes: {
        rich_text: [{ text: { content: 'Authoritative routing policy for the Living Memory Hub. Full text at docs/LIVING_MEMORY_ROUTING_POLICY.md in the worker repository.' } }],
      },
    } as never,
  });

  console.log('Policy created:', (page as { url: string }).url);
  console.log('Policy Ref will compute automatically once Policy ID is assigned by Notion.');
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
