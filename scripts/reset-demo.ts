/**
 * Resets a Saberra demo environment back to its seed state.
 *
 * What is archived (soft-deleted in Notion):
 *   - All Source Emails, Meetings, Meeting Assets, Messages, Processing Events
 *   - All Tasks, Decision Candidates, Risks, Memory Review Queue, Canon Change Requests,
 *     CCOS Ledger Entries, Sensitive Review items
 *   - All Tensions, Commitments, Gratitudes, Events, Retrospectives, Resources
 *   - All Interactions
 *   - Knowledge Base items whose Source field does NOT contain [SABERRA_TEMPLATE]
 *   - Profiles not referenced by any Role Assignment (seed profiles are preserved)
 *
 * What is preserved:
 *   - Circles, Roles, Role Assignments (seed governance structure)
 *   - Knowledge Base items tagged [SABERRA_TEMPLATE] in the Source field
 *   - Profiles referenced by Role Assignments
 *   - Policies (reference data, never reset)
 *
 * Safe to re-run: archiving an already-archived page is a no-op.
 *
 * Usage:
 *   RAILWAY_TOKEN=<token> railway run --service "Sera Worker" npx ts-node scripts/reset-demo.ts
 *   or locally with env vars set:
 *   NOTION_API_KEY=ntn_... NOTION_DB_SOURCE_EMAILS=... npx ts-node scripts/reset-demo.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// ─── DB IDs from env vars ──────────────────────────────────────────────────────

function requireDb(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function optionalDb(key: string): string | null {
  return process.env[key] ?? null;
}

// ─── Notion API helpers ───────────────────────────────────────────────────────

async function queryAll(dbId: string, filter?: object): Promise<{ id: string; properties: Record<string, any> }[]> {
  const pages: { id: string; properties: Record<string, any> }[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (filter) body.filter = filter;
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`${BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Query ${dbId}: ${r.status} ${text}`);
    }
    const data = await r.json() as { results: any[]; has_more: boolean; next_cursor: string | null };
    pages.push(...data.results.map((p: any) => ({ id: p.id, properties: p.properties ?? {} })));
    cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function archivePage(pageId: string): Promise<void> {
  if (DRY_RUN) return;
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ archived: true }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Archive ${pageId}: ${r.status} ${text}`);
  }
}

// Archive all pages in a DB with rate limiting (350ms between requests)
async function archiveAll(dbId: string, label: string, filter?: object): Promise<number> {
  process.stdout.write(`  ${label} — querying...`);
  let pages: { id: string; properties: Record<string, any> }[];
  try {
    pages = await queryAll(dbId, filter);
  } catch (err) {
    console.log(` SKIP (${(err as Error).message.slice(0, 80)})`);
    return 0;
  }

  const active = pages.filter(p => !(p as any).archived);
  process.stdout.write(` ${active.length} active records\n`);

  let count = 0;
  for (const page of active) {
    try {
      await archivePage(page.id);
      count++;
    } catch (err) {
      console.warn(`    WARNING: could not archive ${page.id}: ${(err as Error).message.slice(0, 80)}`);
    }
    if (count % 10 === 0) await new Promise(r => setTimeout(r, 350));
  }
  return count;
}

function richTextValue(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'rich_text') return (prop.rich_text ?? []).map((t: any) => t.plain_text).join('');
  if (prop.type === 'title') return (prop.title ?? []).map((t: any) => t.plain_text).join('');
  return '';
}

function relationIds(prop: any): string[] {
  if (!prop || prop.type !== 'relation') return [];
  return (prop.relation ?? []).map((r: any) => r.id as string);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(DRY_RUN ? 'reset-demo — DRY RUN (no changes will be made)' : 'reset-demo — archiving extracted records');
  console.log('='.repeat(60));

  let totalArchived = 0;

  // ── Step 1: Collect preserved Profile IDs (referenced by Role Assignments) ───
  console.log('\n[Step 1] Identifying seed profiles to preserve...');
  const preservedProfileIds = new Set<string>();
  const roleAssignmentsDb = optionalDb('NOTION_DB_ROLE_ASSIGNMENTS');
  if (roleAssignmentsDb) {
    try {
      const assignments = await queryAll(roleAssignmentsDb);
      for (const a of assignments) {
        // Role Holder relation
        for (const id of relationIds(a.properties['Role Holder'])) preservedProfileIds.add(id);
      }
      console.log(`  Preserving ${preservedProfileIds.size} profiles referenced by Role Assignments`);
    } catch (err) {
      console.warn(`  WARNING: could not load role assignments: ${(err as Error).message.slice(0, 80)}`);
    }
  }

  // ── Step 2: Archive high-volume operational DBs ───────────────────────────────
  console.log('\n[Step 2] Archiving operational records...');

  const simpleDbs: Array<[string | null, string]> = [
    [optionalDb('NOTION_DB_SOURCE_EMAILS'),        'Source Emails'],
    [optionalDb('NOTION_DB_MEETINGS'),             'Meetings'],
    [optionalDb('NOTION_DB_MEETING_ASSETS'),       'Meeting Assets'],
    [optionalDb('NOTION_DB_MESSAGES'),             'Messages'],
    [optionalDb('NOTION_DB_PROCESSING_EVENTS'),    'Processing Events'],
    [optionalDb('NOTION_DB_TASKS'),                'Tasks'],
    [optionalDb('NOTION_DB_DECISION_CANDIDATES'),  'Decision Candidates'],
    [optionalDb('NOTION_DB_RISKS'),                'Risks'],
    [optionalDb('NOTION_DB_MEMORY_REVIEW_QUEUE'),  'Memory Review Queue'],
    [optionalDb('NOTION_DB_CANON_CHANGE_REQUESTS'),'Canon Change Requests'],
    [optionalDb('NOTION_DB_CCOS_LEDGER_ENTRIES'),  'CCOS Ledger Entries'],
    [optionalDb('NOTION_DB_SENSITIVE_REVIEW'),     'Sensitive Review'],
    [optionalDb('NOTION_DB_TENSIONS'),             'Tensions'],
    [optionalDb('NOTION_DB_COMMITMENTS'),          'Commitments'],
    [optionalDb('NOTION_DB_GRATITUDES'),           'Gratitudes'],
    [optionalDb('NOTION_DB_EVENTS'),               'Events'],
    [optionalDb('NOTION_DB_RETROSPECTIVES'),       'Retrospectives'],
    [optionalDb('NOTION_DB_RESOURCES'),            'Resources'],
    [optionalDb('NOTION_DB_INTERACTIONS'),         'Interactions'],
  ];

  for (const [dbId, label] of simpleDbs) {
    if (!dbId) { console.log(`  ${label} — SKIP (env var not set)`); continue; }
    const n = await archiveAll(dbId, label);
    totalArchived += n;
    await new Promise(r => setTimeout(r, 300));
  }

  // ── Step 3: Knowledge Base — preserve [SABERRA_TEMPLATE] items ────────────────
  console.log('\n[Step 3] Knowledge Base (preserving [SABERRA_TEMPLATE] items)...');
  const kbDb = optionalDb('NOTION_DB_KNOWLEDGE_BASE');
  if (!kbDb) {
    console.log('  Knowledge Base — SKIP (env var not set)');
  } else {
    try {
      const kbPages = await queryAll(kbDb);
      let kbArchived = 0;
      let kbPreserved = 0;
      for (const page of kbPages) {
        const source = richTextValue(page.properties['Source']);
        if (source.includes('[SABERRA_TEMPLATE]')) {
          kbPreserved++;
          continue;
        }
        try {
          await archivePage(page.id);
          kbArchived++;
        } catch (err) {
          console.warn(`    WARNING: could not archive KB ${page.id}: ${(err as Error).message.slice(0, 80)}`);
        }
        if (kbArchived % 10 === 0) await new Promise(r => setTimeout(r, 350));
      }
      console.log(`  Knowledge Base — archived ${kbArchived}, preserved ${kbPreserved} [SABERRA_TEMPLATE] items`);
      totalArchived += kbArchived;
    } catch (err) {
      console.log(`  Knowledge Base — SKIP (${(err as Error).message.slice(0, 80)})`);
    }
  }

  // ── Step 4: Profiles — archive those not in seed role assignments ──────────────
  console.log('\n[Step 4] Profiles (preserving seed members)...');
  const profilesDb = optionalDb('NOTION_DB_PROFILES');
  if (!profilesDb) {
    console.log('  Profiles — SKIP (env var not set)');
  } else {
    try {
      const profiles = await queryAll(profilesDb);
      let profArchived = 0;
      let profPreserved = 0;
      for (const page of profiles) {
        if (preservedProfileIds.has(page.id)) {
          profPreserved++;
          continue;
        }
        try {
          await archivePage(page.id);
          profArchived++;
        } catch (err) {
          console.warn(`    WARNING: could not archive profile ${page.id}: ${(err as Error).message.slice(0, 80)}`);
        }
        if (profArchived % 10 === 0) await new Promise(r => setTimeout(r, 350));
      }
      console.log(`  Profiles — archived ${profArchived}, preserved ${profPreserved} (in role assignments)`);
      totalArchived += profArchived;
    } catch (err) {
      console.log(`  Profiles — SKIP (${(err as Error).message.slice(0, 80)})`);
    }
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  if (DRY_RUN) {
    console.log('DRY RUN complete — no records were modified.');
  } else {
    console.log(`Reset complete — ${totalArchived} records archived.`);
    console.log('Preserved: Circles, Roles, Role Assignments, Policies, [SABERRA_TEMPLATE] KB items, seed Profiles.');
    console.log('Run scripts/seed-verdana.ts to restore seed data if needed.');
  }
  console.log('='.repeat(60) + '\n');
}

main().catch(err => { console.error(err); process.exit(1); });
