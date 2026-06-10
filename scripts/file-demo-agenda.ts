/**
 * Files the 30-minute team demo agenda as a Published KB article in Notion.
 * Safe to re-run - checks for existing title before creating.
 * Run: npx ts-node scripts/file-demo-agenda.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

const TITLE = 'How to Demo the Amora Living Memory Hub (30-Minute Team Guide)';

const SUMMARY = 'A structured 30-minute agenda for demonstrating Sera and the Living Memory Hub to the Amora team. Covers the five segments most likely to land emotionally and build trust: the hours-saved counter, a live email-to-memory walkthrough, the review queue model, the governance structure, and the routing policy trust layer.';

const KEY_POINTS = `OPENING HOOK (2 min): Open the admin dashboard. Point to the four animated hero counters. Let them animate. Say: "These numbers represent time Sera has already saved us. None of that required anyone to take notes."

SEGMENT 1 - THE EMAIL BECOMES MEMORY (8 min): Show a recent Google Meet notification email in roots@amora.cr. Then show the corresponding Meeting record in Notion with extracted Decision, Task, Risk, and Memory Candidate records. The team will recognize the meeting and see their own words turned into structured records.

SEGMENT 2 - THE REVIEW QUEUES (5 min): Walk the queue cards on the dashboard. Click a card to open Notion directly. Show one pending canon change request. Point to a tension entry Sera raised on her own. Key message: Sera does not decide what becomes policy - she raises tensions and the team decides.

SEGMENT 3 - GOVERNANCE STRUCTURE (6 min): Open Circles, Roles, and Role Assignments databases. Show GOV-001 (Living Memory Routing Policy) as the first canon policy. Optionally show the Policy Ref formula field. Key message: the CCOS is not just a document - it is a live database with real records and real accountability.

SEGMENT 4 - THE KNOWLEDGE BASE (4 min): Open KB database. Show published articles. Explain that Sera proposes KB articles from any meeting containing clear how-to knowledge. This directly addresses onboarding pain and knowledge silos.

SEGMENT 5 - THE TRUST LAYER (3 min): Show GOV-001 routing policy. Point to Sensitive Review queue. Explain the [lm-exclude] marker. Key message: we decided what Sera is allowed to know, wrote it down, and encoded it into the system.

CLOSE (2 min): Return to hero numbers. Name the date Sera went live, emails processed, meetings captured, and estimated hours saved.

TIPS: Keep Notion open in split-screen with the dashboard. If a record looks wrong, point to it and say "this is why we have review queues." Do not show the code or explain Railway. The demo is about what the system does for people.`;

async function main() {
  if (!dbs.knowledgeBase) {
    console.error('NOTION_DB_KNOWLEDGE_BASE not set');
    process.exit(1);
  }

  const existing = await notion.databases.query({
    database_id: dbs.knowledgeBase,
    filter: { property: 'KB Title', title: { equals: TITLE } },
    page_size: 1,
  });

  if (existing.results.length > 0) {
    console.log(`Already exists: "${TITLE}"`);
    return;
  }

  const page = await notion.pages.create({
    parent: { database_id: dbs.knowledgeBase },
    properties: {
      'KB Title':   { title: [{ text: { content: TITLE } }] },
      Category:     { select: { name: 'Process' } },
      Audience:     { multi_select: [{ name: 'Leadership' }, { name: 'All Members' }] },
      Summary:      { rich_text: [{ text: { content: SUMMARY } }] },
      'Key Points': { rich_text: [{ text: { content: KEY_POINTS.slice(0, 1900) } }] },
      Status:       { select: { name: 'Published' } },
      Confidence:   { select: { name: 'High' } },
      Source:       { rich_text: [{ text: { content: 'Filed by Sera via scripts/file-demo-agenda.ts' } }] },
    } as never,
  });

  console.log(`Created: "${TITLE}" -> ${(page as { url: string }).url}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
