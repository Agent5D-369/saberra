/**
 * backfill-task-links.ts
 *
 * For every task in the Tasks DB whose page body is empty, searches Notion
 * for records the task title references, then appends a "Related Records"
 * block to the page so users can navigate directly.
 *
 * Run: npx ts-node scripts/backfill-task-links.ts
 */

import { Client, isFullPage } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

// Internal task prefixes we skip
const SKIP_PREFIXES = ['sched:', 'admin_action:'];

// DB label → Notion DB ID mapping for targeted searches
const DB_KEYWORD_MAP: Array<{ keywords: string[]; dbId: string | null | undefined; label: string }> = [
  { keywords: ['memory review queue', 'review queue'],       dbId: dbs.memoryReviewQueue,    label: 'Memory Review Queue' },
  { keywords: ['ccos ledger', 'ledger entry', 'ledger tension'], dbId: dbs.ccosLedgerEntries, label: 'CCOS Ledger Entries' },
  { keywords: ['canon change request', 'canon change'],      dbId: dbs.canonChangeRequests,  label: 'Canon Change Requests' },
  { keywords: ['decision candidate', 'decision'],            dbId: dbs.decisionCandidates,   label: 'Decisions' },
  { keywords: ['risk'],                                      dbId: dbs.risks,                label: 'Risks' },
  { keywords: ['meeting', 'recording', 'transcript', 'notes'], dbId: dbs.meetings,           label: 'Meetings' },
  { keywords: ['circle'],                                    dbId: dbs.circles,              label: 'Circles' },
  { keywords: ['role assignment'],                           dbId: dbs.roleAssignments,      label: 'Role Assignments' },
  { keywords: ['role'],                                      dbId: dbs.roles,                label: 'Roles' },
  { keywords: ['profile', 'contact', 'person'],              dbId: dbs.profiles,             label: 'Profiles' },
  { keywords: ['policy', 'gov-'],                            dbId: dbs.policies,             label: 'Policies' },
  { keywords: ['project'],                                   dbId: dbs.projects,             label: 'Projects' },
  { keywords: ['source email', 'email'],                     dbId: dbs.sourceEmails,         label: 'Source Emails' },
  { keywords: ['knowledge base', 'kb article'],              dbId: dbs.knowledgeBase,        label: 'Knowledge Base' },
];

function extractTitle(properties: Record<string, unknown>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const title = properties['Task'] as any;
  return (title?.title ?? []).map((t: { plain_text: string }) => t.plain_text).join('');
}

function detectTargetDb(title: string): { dbId: string; label: string } | null {
  const lower = title.toLowerCase();
  for (const entry of DB_KEYWORD_MAP) {
    if (!entry.dbId) continue;
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return { dbId: entry.dbId, label: entry.label };
    }
  }
  return null;
}

/** Build a search query from the task title by stripping common verbs and status words */
function buildSearchQuery(title: string): string {
  return title
    .replace(/^(update|mark|create|review|approve|reject|close|resolve|complete|send|contact|retrieve|facilitate|capture|synthesize|ingest|file|check|confirm|add|remove|assign|set|fix|investigate|escalate|schedule|notify|archive|merge|link|relate|connect|ensure|verify|validate|monitor)\s+/i, '')
    .replace(/\s+as\s+(resolved|approved|done|closed|complete|active|inactive|pending|open)\s*$/i, '')
    .replace(/\s+to\s+(approved|done|closed|resolved|active|inactive|pending|open)\s*$/i, '')
    .replace(/^\[(poor governance|burnout|urgent|overdue|blocked|sensitive)\]\s*/i, '')
    .trim()
    .slice(0, 100);
}

/** Score how well a search result title matches the task title */
function scoreMatch(taskTitle: string, resultTitle: string): number {
  const t = taskTitle.toLowerCase();
  const r = resultTitle.toLowerCase();
  // Split result title into significant words (4+ chars)
  const words = r.split(/\W+/).filter(w => w.length >= 4);
  if (words.length === 0) return 0;
  const matchCount = words.filter(w => t.includes(w)).length;
  return matchCount / words.length;
}

interface FoundRef { title: string; url: string; score: number }

async function findReferences(taskTitle: string): Promise<FoundRef[]> {
  const found: FoundRef[] = [];
  const query = buildSearchQuery(taskTitle);
  if (!query || query.length < 10) return found;

  const target = detectTargetDb(taskTitle);

  // Targeted DB search if we know the type
  if (target?.dbId) {
    try {
      const result = await notion.databases.query({
        database_id: target.dbId,
        page_size: 10,
        filter: {
          or: [
            // We have to use full-text search via search API, not filter, so fall through
          ],
        } as never,
      });
      // databases.query doesn't do full-text search, so we use notion.search below
    } catch { /* ignore */ }

    try {
      const searchResult = await notion.search({
        query,
        filter: { property: 'object', value: 'page' },
        page_size: 5,
      });
      for (const page of searchResult.results) {
        if (!isFullPage(page)) continue;
        // Only include results from the target DB
        const parent = page.parent;
        if (parent.type !== 'database_id') continue;
        const parentDbId = parent.database_id.replace(/-/g, '');
        const targetNorm = target.dbId.replace(/-/g, '');
        if (!parentDbId.includes(targetNorm) && !targetNorm.includes(parentDbId)) continue;
        // Skip if it's the Tasks DB itself
        if (parentDbId === (dbs.tasks ?? '').replace(/-/g, '')) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
        const resultTitle = (titleProp?.title ?? []).map((t: { plain_text: string }) => t.plain_text).join('');
        const score = scoreMatch(taskTitle, resultTitle);
        if (score >= 0.3) {
          found.push({ title: resultTitle, url: page.url, score });
        }
      }
    } catch (err) {
      console.error(`  Search error for "${query}":`, err);
    }
  }

  // Fallback: general workspace search (across all DBs except Tasks)
  if (found.length === 0) {
    try {
      const searchResult = await notion.search({
        query,
        filter: { property: 'object', value: 'page' },
        page_size: 8,
      });
      for (const page of searchResult.results) {
        if (!isFullPage(page)) continue;
        const parent = page.parent;
        if (parent.type !== 'database_id') continue;
        const parentDbId = parent.database_id.replace(/-/g, '');
        // Skip Tasks DB
        if (parentDbId === (dbs.tasks ?? '').replace(/-/g, '')) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
        const resultTitle = (titleProp?.title ?? []).map((t: { plain_text: string }) => t.plain_text).join('');
        const score = scoreMatch(taskTitle, resultTitle);
        if (score >= 0.4) {
          found.push({ title: resultTitle, url: page.url, score });
        }
      }
    } catch (err) {
      console.error(`  Fallback search error for "${query}":`, err);
    }
  }

  // Deduplicate by URL and sort by score desc
  const seen = new Set<string>();
  return found
    .filter(r => { if (seen.has(r.url)) return false; seen.add(r.url); return true; })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function hasPageContent(pageId: string): Promise<boolean> {
  const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 1 });
  return blocks.results.length > 0;
}

/** Convert a Notion page URL to the shorter app URL format */
function toAppUrl(url: string): string {
  // Notion API returns https://www.notion.so/... — convert to https://app.notion.com/p/...
  const m = url.match(/([a-f0-9]{32})(?:\?|$)/);
  if (m) return `https://app.notion.com/p/${m[1]}`;
  return url;
}

async function run() {
  console.log('Fetching all tasks...');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPages: any[] = [];
  let cursor: string | undefined;
  do {
    const result = await notion.databases.query({
      database_id: dbs.tasks!,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    allPages.push(...result.results);
    cursor = result.has_more && result.next_cursor ? result.next_cursor : undefined;
  } while (cursor);

  const tasks = allPages.filter(isFullPage);
  console.log(`Found ${tasks.length} tasks total.\n`);

  let enriched = 0;
  let skipped = 0;

  for (const task of tasks) {
    const title = extractTitle(task.properties as Record<string, unknown>);

    // Skip internal tasks
    if (!title || SKIP_PREFIXES.some(p => title.startsWith(p))) {
      skipped++;
      continue;
    }

    // Skip if page already has content
    const hasContent = await hasPageContent(task.id);
    if (hasContent) {
      console.log(`  [skip - has content] ${title.slice(0, 70)}`);
      skipped++;
      continue;
    }

    console.log(`Searching for: ${title.slice(0, 80)}`);
    const refs = await findReferences(title);

    if (refs.length === 0) {
      console.log(`  -> no matches found`);
      skipped++;
      continue;
    }

    console.log(`  -> found ${refs.length} ref(s):`);
    refs.forEach(r => console.log(`     [${(r.score * 100).toFixed(0)}%] ${r.title.slice(0, 60)}`));

    // Build Notion blocks for the page body
    const blocks: Parameters<typeof notion.blocks.children.append>[0]['children'] = [
      {
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: 'Related Records' } }],
          color: 'default',
        },
      },
      ...refs.map(ref => ({
        object: 'block' as const,
        type: 'bulleted_list_item' as const,
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text' as const,
              text: { content: ref.title.slice(0, 200), link: { url: toAppUrl(ref.url) } },
            },
          ],
          color: 'default' as const,
        },
      })),
    ];

    try {
      await notion.blocks.children.append({
        block_id: task.id,
        children: blocks,
      });
      console.log(`  -> LINKED`);
      enriched++;
    } catch (err) {
      console.error(`  -> ERROR appending blocks:`, err);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. Enriched: ${enriched} / Skipped: ${skipped} / Total: ${tasks.length}`);
}

run().catch(err => { console.error(err); process.exit(1); });
