/**
 * Finds and removes duplicate records across all Notion databases.
 *
 * Strategy per database:
 *   - Group all non-archived pages by their natural dedup key (name/title or specific field)
 *   - Within each duplicate group, score each page by "richness" (filled properties + relation count)
 *   - Keep the richest page; archive the rest
 *   - Ties broken by created_time (keep oldest — it has more history)
 *
 * Databases skipped:
 *   - Source Emails    — audit log, Message ID is already the dedup key in code
 *   - Meeting Assets   — compound key (Meeting + Asset Type), handled by worker
 *   - Processing Events — pure audit log, never dedup
 *
 * Set DRY_RUN=true (default) to preview without making changes.
 * Set DRY_RUN=false to apply.
 *
 * Usage:
 *   npx ts-node scripts/dedup-all-tables.ts           # dry run
 *   DRY_RUN=false npx ts-node scripts/dedup-all-tables.ts  # apply
 */

import * as dotenv from 'dotenv';
dotenv.config();

const DRY_RUN = process.env.DRY_RUN !== 'false';

const API_KEY = process.env.NOTION_API_KEY;
if (!API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── DB configs: label, env var, dedup key ─────────────────────────────────────
interface DbConfig {
  label: string;
  envVar: string;
  titleField: string;   // display name property
  dedupField: string;   // property used as dedup key
  dedupType: 'title' | 'rich_text';
  note?: string;
}

const DB_CONFIGS: DbConfig[] = [
  { label: 'Profiles',             envVar: 'NOTION_DB_PROFILES',            titleField: 'Name',            dedupField: 'Name',            dedupType: 'title' },
  { label: 'Projects',             envVar: 'NOTION_DB_PROJECTS',            titleField: 'Project Name',    dedupField: 'Project Name',    dedupType: 'title' },
  { label: 'Circles',              envVar: 'NOTION_DB_CIRCLES',             titleField: 'Circle Name',     dedupField: 'Circle Name',     dedupType: 'title' },
  { label: 'Roles',                envVar: 'NOTION_DB_ROLES',               titleField: 'Role Name',       dedupField: 'Role Name',       dedupType: 'title' },
  { label: 'Role Assignments',     envVar: 'NOTION_DB_ROLE_ASSIGNMENTS',    titleField: 'Assignment Title',dedupField: 'Assignment Title',dedupType: 'title' },
  { label: 'Meetings',             envVar: 'NOTION_DB_MEETINGS',            titleField: 'Meeting Title',   dedupField: 'Capture Key',     dedupType: 'rich_text', note: 'Dedup on Capture Key (stable meeting identity)' },
  { label: 'Messages',             envVar: 'NOTION_DB_MESSAGES',            titleField: 'Message Title',   dedupField: 'Message Title',   dedupType: 'title' },
  { label: 'Tasks',                envVar: 'NOTION_DB_TASKS',               titleField: 'Task',            dedupField: 'Task',            dedupType: 'title' },
  { label: 'Decision Candidates',  envVar: 'NOTION_DB_DECISION_CANDIDATES', titleField: 'Decision',        dedupField: 'Decision',        dedupType: 'title' },
  { label: 'Risks',                envVar: 'NOTION_DB_RISKS',               titleField: 'Risk',            dedupField: 'Risk',            dedupType: 'title' },
  { label: 'Memory Review Queue',  envVar: 'NOTION_DB_MEMORY_REVIEW_QUEUE', titleField: 'Proposed Memory', dedupField: 'Proposed Memory', dedupType: 'title' },
  { label: 'Canon Change Requests',envVar: 'NOTION_DB_CANON_CHANGE_REQUESTS',titleField:'Proposed Change', dedupField: 'Proposed Change', dedupType: 'title' },
  { label: 'CCOS Ledger Entries',  envVar: 'NOTION_DB_CCOS_LEDGER_ENTRIES', titleField: 'Ledger Entry',    dedupField: 'Ledger Entry',    dedupType: 'title' },
  { label: 'Policies',             envVar: 'NOTION_DB_POLICIES',            titleField: 'Policy Name',     dedupField: 'Policy Name',     dedupType: 'title' },
  { label: 'Knowledge Base',       envVar: 'NOTION_DB_KNOWLEDGE_BASE',      titleField: 'KB Title',        dedupField: 'KB Title',        dedupType: 'title' },
  { label: 'Sensitive Review',     envVar: 'NOTION_DB_SENSITIVE_REVIEW',    titleField: 'Issue',           dedupField: 'Issue',           dedupType: 'title' },
];

// ── Notion API helpers ────────────────────────────────────────────────────────

async function queryAll(dbId: string): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const body: any = { page_size: 100, filter: { property: 'object', checkbox: { equals: false } } };
    if (cursor) body.start_cursor = cursor;
    // Use plain query (no filter on archived — we handle that ourselves)
    const r = await fetch(`${BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    if (!r.ok) throw new Error(`Query ${dbId}: ${r.status} ${await r.text()}`);
    const d = await r.json() as any;
    results.push(...(d.results ?? []));
    cursor = d.has_more ? d.next_cursor : undefined;
    await sleep(150);
  } while (cursor);
  return results;
}

async function archivePage(pageId: string): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ archived: true }),
  });
  if (!r.ok) throw new Error(`Archive ${pageId}: ${r.status} ${await r.text()}`);
}

// ── Richness scoring ──────────────────────────────────────────────────────────
// Higher = more data filled in. Relations weighted 2x each item.

function scoreRichness(page: any): number {
  let score = 0;
  const props = page.properties ?? {};
  for (const prop of Object.values(props) as any[]) {
    switch (prop.type) {
      case 'title':
        if (prop.title?.length > 0 && prop.title[0]?.plain_text?.trim()) score += 1; break;
      case 'rich_text':
        if (prop.rich_text?.length > 0 && prop.rich_text[0]?.plain_text?.trim()) score += 1; break;
      case 'select':
        if (prop.select?.name) score += 1; break;
      case 'multi_select':
        score += (prop.multi_select?.length ?? 0); break;
      case 'relation':
        score += (prop.relation?.length ?? 0) * 2; break;
      case 'date':
        if (prop.date?.start) score += 1; break;
      case 'checkbox':
        if (prop.checkbox) score += 1; break;
      case 'url':
        if (prop.url) score += 1; break;
      case 'email':
        if (prop.email) score += 1; break;
      case 'phone_number':
        if (prop.phone_number) score += 1; break;
      case 'number':
        if (prop.number != null) score += 1; break;
    }
  }
  return score;
}

// ── Extract dedup key from a page ─────────────────────────────────────────────

function getDedupKey(page: any, cfg: DbConfig): string {
  const prop = page.properties?.[cfg.dedupField];
  if (!prop) return '';
  if (cfg.dedupType === 'title') {
    return (prop.title?.[0]?.plain_text ?? '').trim().toLowerCase();
  }
  if (cfg.dedupType === 'rich_text') {
    return (prop.rich_text?.[0]?.plain_text ?? '').trim().toLowerCase();
  }
  return '';
}

function getDisplayName(page: any, cfg: DbConfig): string {
  const prop = page.properties?.[cfg.titleField];
  return prop?.title?.[0]?.plain_text ?? prop?.rich_text?.[0]?.plain_text ?? page.id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface DupGroup {
  key: string;
  pages: any[];
  winner: any;
  losers: any[];
}

async function processDb(cfg: DbConfig): Promise<{ groups: DupGroup[]; totalArchived: number; errors: string[] }> {
  const dbId = process.env[cfg.envVar];
  if (!dbId) return { groups: [], totalArchived: 0, errors: [`${cfg.envVar} not set — skipped`] };

  let pages: any[];
  try {
    pages = await queryAll(dbId);
  } catch (err: any) {
    return { groups: [], totalArchived: 0, errors: [`Failed to query: ${err.message}`] };
  }

  // Only consider non-archived pages
  const live = pages.filter(p => !p.archived);

  // Group by dedup key (skip blank keys)
  const groups = new Map<string, any[]>();
  for (const page of live) {
    const key = getDedupKey(page, cfg);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(page);
  }

  const dupGroups: DupGroup[] = [];
  for (const [key, members] of groups) {
    if (members.length < 2) continue;

    // Sort by richness desc, then created_time asc (oldest wins ties)
    members.sort((a, b) => {
      const scoreDiff = scoreRichness(b) - scoreRichness(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
    });

    dupGroups.push({ key, pages: members, winner: members[0], losers: members.slice(1) });
  }

  if (dupGroups.length === 0) return { groups: [], totalArchived: 0, errors: [] };

  const errors: string[] = [];
  let totalArchived = 0;

  for (const grp of dupGroups) {
    const winnerName = getDisplayName(grp.winner, cfg);
    const winnerScore = scoreRichness(grp.winner);
    console.log(`\n    DUPLICATE: "${grp.key}" — ${grp.pages.length} copies`);
    console.log(`      KEEP:    "${winnerName}" (score ${winnerScore}, created ${grp.winner.created_time.slice(0, 10)})`);

    for (const loser of grp.losers) {
      const loserName = getDisplayName(loser, cfg);
      const loserScore = scoreRichness(loser);
      console.log(`      ARCHIVE: "${loserName}" (score ${loserScore}, created ${loser.created_time.slice(0, 10)})`);

      if (!DRY_RUN) {
        try {
          await archivePage(loser.id);
          console.log(`               → archived ok`);
          totalArchived++;
        } catch (err: any) {
          const msg = `Failed to archive ${loser.id}: ${err.message}`;
          console.log(`               → FAILED: ${err.message}`);
          errors.push(msg);
        }
        await sleep(350);
      } else {
        console.log(`               → [DRY RUN — would archive]`);
        totalArchived++;
      }
    }
  }

  return { groups: dupGroups, totalArchived, errors };
}

async function main() {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`  Notion Dedup — ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE — changes will be applied'}`);
  console.log(`${'='.repeat(72)}\n`);

  if (DRY_RUN) {
    console.log('  Run with DRY_RUN=false to apply changes.\n');
  }

  let totalDupGroups = 0;
  let totalToArchive = 0;
  const manualReview: string[] = [];

  for (const cfg of DB_CONFIGS) {
    console.log(`\n── ${cfg.label} ─────────────────────────────────────────────────────────`);
    if (cfg.note) console.log(`   Note: ${cfg.note}`);

    const { groups, totalArchived, errors } = await processDb(cfg);

    if (errors.length > 0) {
      for (const e of errors) console.log(`  ERROR: ${e}`);
    }

    if (groups.length === 0) {
      console.log('  No duplicates found.');
    } else {
      totalDupGroups += groups.length;
      totalToArchive += totalArchived;
    }

    // Flag groups where the loser has relations (might need manual re-pointing)
    for (const grp of groups) {
      for (const loser of grp.losers) {
        const relCount = Object.values(loser.properties ?? {}).reduce((sum: number, p: any) => {
          return sum + (p.type === 'relation' ? (p.relation?.length ?? 0) : 0);
        }, 0);
        if (relCount > 0) {
          manualReview.push(`${cfg.label}: archived "${getDedupKey(loser, cfg)}" had ${relCount} relation(s) — check for orphaned links`);
        }
      }
    }

    await sleep(200);
  }

  console.log(`\n${'='.repeat(72)}`);
  console.log(`  Summary`);
  console.log(`${'='.repeat(72)}`);
  console.log(`  Duplicate groups found:   ${totalDupGroups}`);
  console.log(`  Records ${DRY_RUN ? 'that would be archived' : 'archived'}:  ${totalToArchive}`);

  if (manualReview.length > 0) {
    console.log(`\n  Relations to manually verify (archived pages had outbound relations):`);
    for (const m of manualReview) console.log(`    - ${m}`);
  }

  if (DRY_RUN && totalDupGroups > 0) {
    console.log(`\n  To apply: DRY_RUN=false npx ts-node scripts/dedup-all-tables.ts`);
  }
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
