/**
 * Appends charter body content to existing Verdana Commons circle pages that have blank bodies.
 * Uses the appendCircleCharterBlocks template from NotionWriterService.
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

// Verdana circles use the Notion MCP OAuth token, not the .env API key.
// Run this via ts-node using VERDANA_NOTION_API_KEY env or hardcode the page IDs + blocks here.
// Since Verdana is accessed via MCP OAuth, we append via the Amora API key only for Amora pages.
// For Verdana circles, the body was added via the create-pages MCP call at creation time.
// This script handles AMORA circles only.

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function heading3(text: string) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: text } }], color: 'default' } } as any;
}
function para(text: string) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }], color: 'default' } } as any;
}
function bullet(text: string) {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }], color: 'default' } } as any;
}
function splitLines(text: string): string[] {
  return text.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
}

async function appendCharterToCircle(pageId: string, circle: {
  circle_name: string;
  purpose: string;
  accountabilities: string;
  domains: string;
  kpis: string;
  meeting_cadence: string;
}) {
  const blocks: any[] = [];

  blocks.push(heading3('Circle Identity'));
  blocks.push(para(`Circle Name: ${circle.circle_name}  |  Status: Active  |  Meeting Cadence: ${circle.meeting_cadence}  |  Review Cadence: Quarterly`));

  blocks.push(heading3('Purpose'));
  blocks.push(para(circle.purpose));

  blocks.push(heading3('Accountabilities'));
  for (const line of splitLines(circle.accountabilities)) blocks.push(bullet(line));

  blocks.push(heading3('Domains'));
  for (const line of splitLines(circle.domains)) blocks.push(bullet(line));

  blocks.push(heading3('KPIs / Success Indicators'));
  for (const line of splitLines(circle.kpis)) blocks.push(bullet(line));

  blocks.push(heading3('Wholeness Practices'));
  blocks.push(para('[Complete during charter review - describe how this circle creates conditions for members to bring their whole selves to the work.]'));

  blocks.push(heading3('Checks & Balances'));
  blocks.push(para('All circle decisions are documented in Saberra. Canon-level decisions require cross-circle consent. The Rep Steward carries tensions upward to the parent circle.'));

  blocks.push(heading3('Living Agreement'));
  blocks.push(para('This charter is a living document. It is reviewed quarterly and updated by circle consent. All changes are recorded in Saberra.'));

  blocks.push(heading3('Review & Adaptation'));
  blocks.push(para('[Complete during charter review - describe the review cadence, what triggers adaptation, and what happens if the circle is no longer needed.]'));

  await notion.blocks.children.append({ block_id: pageId, children: blocks });
  console.log(`  Charter appended to: ${circle.circle_name}`);
}

async function run() {
  console.log('Appending charter body content to blank Amora circle pages...\n');

  // Fetch all circles from the Amora Circles DB
  const circlesDbId = process.env.NOTION_DB_CIRCLES!;
  let cursor: string | undefined;
  let processed = 0;

  do {
    const res: any = await notion.databases.query({
      database_id: circlesDbId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of res.results) {
      const props = page.properties as any;
      const name = props['Circle Name']?.title?.[0]?.plain_text ?? '';
      if (!name) continue;

      // Check if page already has content
      const children = await notion.blocks.children.list({ block_id: page.id, page_size: 1 });
      if (children.results.length > 0) {
        console.log(`  Skipping ${name} (already has content)`);
        continue;
      }

      const purpose = props['Purpose']?.rich_text?.[0]?.plain_text ?? '';
      const accountabilities = props['Accountabilities']?.rich_text?.[0]?.plain_text ?? '';
      const domains = props['Domains']?.rich_text?.[0]?.plain_text ?? '';
      const kpis = props['KPIs']?.rich_text?.[0]?.plain_text ?? '';
      const meetingCadence = props['Meeting Cadence']?.rich_text?.[0]?.plain_text ?? 'Weekly';

      await appendCharterToCircle(page.id, {
        circle_name: name,
        purpose,
        accountabilities,
        domains,
        kpis,
        meeting_cadence: meetingCadence,
      });
      processed++;

      // Avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  console.log(`\nDone. ${processed} circles updated.`);
}

run().catch(console.error);
