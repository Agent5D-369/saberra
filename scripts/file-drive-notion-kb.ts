/**
 * Creates two Knowledge Base articles explaining the Drive-Notion-Sera architecture
 * and the Drive permissions model.
 *
 * Safe to re-run — checks for existing titles before creating.
 * Run: npx ts-node scripts/file-drive-notion-kb.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

interface KbArticle {
  title: string;
  category: string;
  audience: string[];
  summary: string;
  keyPoints: string;
  confidence: string;
}

const ARTICLES: KbArticle[] = [
  {
    title: 'How Sera, Google Drive, and Notion Work Together',
    category: 'Technology',
    audience: ['All Members', 'Leadership'],
    confidence: 'High',
    summary:
      'Sera (roots@amora.cr) is the Living Memory Hub worker. She bridges Google Drive and Notion: reading raw source files from Drive, extracting knowledge with Claude, and writing structured drafts into Notion for human review. Each system plays a distinct role.',
    keyPoints: [
      'GOOGLE DRIVE holds raw source materials only: meeting recordings, transcripts, and Gemini notes (owned by meeting participants) plus email attachments archived by Sera (owned by roots@amora.cr). Drive is a file store, not an intelligence layer.',
      '',
      'NOTION is the structured memory. Sera writes everything she extracts as Draft or Pending records: decisions, tasks, risks, profiles, policies, tensions. Nothing she writes is considered canon until a human approves it. Canon (policies, circle definitions, governance rules) lives in Notion, not Drive.',
      '',
      'VERA (roots@amora.cr) is the automated bridge. When a Google Meet notification or operational email arrives, she checks Drive for source files, exports the text, sends it to Claude for extraction, and writes structured records to Notion. She is a reader of Drive and a writer of Notion drafts.',
      '',
      'DATA FLOW: Meeting happens -> Google sends email to roots@ with Drive links -> Sera checks access -> exports transcript text -> Claude extracts decisions, tasks, risks, people, commitments, tensions -> Sera writes draft records to Notion -> humans review and approve.',
      '',
      'WHAT LIVES WHERE: Raw files = Google Drive (participants own them). Sera-archived attachments = Living Memory Inbox folder in Drive (roots@ owns). All extracted knowledge = Notion (Sera writes as drafts). Canon documents = Notion Policies database (humans approve).',
    ].join('\n'),
  },
  {
    title: 'Google Drive Permissions in the Living Memory Hub',
    category: 'Technology',
    audience: ['Leadership', 'Tech Team'],
    confidence: 'High',
    summary:
      'roots@amora.cr owns one Drive folder: "Living Memory Inbox." Team members with the folder link can view files. Only roots@ can add, edit, or delete files. Meeting recordings and transcripts belong to their respective owners -- Sera reads them but cannot change who has access.',
    keyPoints: [
      'WHAT ROOTS@ CONTROLS: Only the "Living Memory Inbox" folder and its contents. Sera uploads email attachments here. The folder is set to "anyone with the link can view" so team members can access source files. Only roots@ (the owner) can write to or delete from this folder.',
      '',
      'WHAT ROOTS@ DOES NOT CONTROL: Meeting recordings, transcripts, and Gemini notes live in the meeting organizer\'s personal Google Drive. Sera can read them if she has been granted Viewer access, but she cannot grant or revoke access on those files.',
      '',
      'HOW TO SHARE A DRIVE FILE WITH VERA: Open the file in Google Drive -> click Share -> add roots@amora.cr as Viewer -> save. Sera will pick it up on her next retry cycle (max 30 minutes). This is required for any recording or transcript that comes from an outside organizer.',
      '',
      'WHY ONLY ROOTS@ CAN EDIT INBOX FILES: roots@amora.cr is the owner of every file she uploads. Google Drive ownership means exclusive edit and delete rights. No one else is granted Editor access. Team members can view and download but cannot modify archived files.',
      '',
      'CANON AND DRIVE: Canon documents (policies, circle definitions, governance decisions) are Notion records, not Google Drive files. This separation is intentional. It means canon can only be changed through Notion\'s review workflow -- never by editing a Drive file directly.',
      '',
      'THE ONE-SENTENCE RULE: Sera reads Drive, Sera writes Notion drafts, humans approve canon. Drive is the raw material room. Notion is the structured memory. Humans hold the keys to canon.',
    ].join('\n'),
  },
];

async function fileArticle(article: KbArticle): Promise<void> {
  if (!dbs.knowledgeBase) {
    console.error('NOTION_DB_KNOWLEDGE_BASE not set');
    process.exit(1);
  }

  const existing = await notion.databases.query({
    database_id: dbs.knowledgeBase,
    filter: { property: 'KB Title', title: { equals: article.title } },
    page_size: 1,
  });

  if (existing.results.length > 0) {
    console.log(`Already exists: "${article.title}"`);
    return;
  }

  const page = await notion.pages.create({
    parent: { database_id: dbs.knowledgeBase },
    properties: {
      'KB Title':   { title: [{ text: { content: article.title } }] },
      Category:     { select: { name: article.category } },
      Audience:     { multi_select: article.audience.map(a => ({ name: a })) },
      Summary:      { rich_text: [{ text: { content: article.summary } }] },
      'Key Points': { rich_text: [{ text: { content: article.keyPoints.slice(0, 1900) } }] },
      Status:       { select: { name: 'Published' } },
      Confidence:   { select: { name: article.confidence } },
      Source:       { rich_text: [{ text: { content: 'Filed by Sera via scripts/file-drive-notion-kb.ts' } }] },
    } as never,
  });

  console.log(`Created: "${article.title}" -> ${(page as { url: string }).url}`);
}

async function main() {
  console.log('\nFiling Drive-Notion-Sera KB articles...\n');
  for (const article of ARTICLES) {
    await fileArticle(article);
  }
  console.log('\nDone.\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
