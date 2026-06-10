/**
 * merge-dup-profiles.ts
 *
 * Re-links all Notion relations pointing at duplicate profile pages to their
 * canonical counterparts, renames canonicals where needed, then archives the
 * dup pages.
 *
 * Scans every database that could hold a profile relation and swaps dup IDs
 * for canonical IDs without knowing property names in advance — it inspects
 * every relation-type property on every page.
 *
 * Usage:
 *   npx ts-node scripts/merge-dup-profiles.ts            # dry run (safe)
 *   DRY_RUN=false npx ts-node scripts/merge-dup-profiles.ts  # apply
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DRY_RUN = process.env.DRY_RUN !== 'false';
const notion  = new Client({ auth: NOTION_API_KEY });

// ── Dup → Canonical mapping ────────────────────────────────────────────────
// dupId / canonicalId: dashes optional — normalised internally
interface DupEntry {
  dupId:          string;
  dupName:        string;
  canonicalId:    string | null; // null = no canonical, just archive
  canonicalRename?: string;      // rename canonical's Name to this after re-linking
}

const DUPS: DupEntry[] = [
  // ── Previously identified [DUP] pages ────────────────────────────────
  {
    dupId:       '3730a88e-f36a-8186-b73b-db40f44ac695',
    dupName:     '[DUP] Kyleen Keenan',
    canonicalId: '36c0a88e-f36a-8163-b1b2-dfdf52721a6d',
  },
  {
    dupId:       '3730a88e-f36a-8193-9f8c-dc40d602e35a',
    dupName:     '[DUP] Eric Timmermans',
    canonicalId: '36c0a88e-f36a-8118-8cee-d78f066cc202',
  },
  {
    dupId:       '3700a88e-f36a-815a-ac47-f934febc462c',
    dupName:     '[DUP] Ariana',
    canonicalId: '36e0a88e-f36a-81fa-8319-e36de18c0e07',
  },
  {
    dupId:       '3740a88e-f36a-81fb-b337-ed3034f86a66',
    dupName:     '[DUP] Kai',
    canonicalId: null, // Kai = Kyleen; thin page, just archive
  },
  {
    dupId:       '3740a88e-f36a-8145-96fc-c3e09339ff35',
    dupName:     '[DUP] Jess',
    canonicalId: null, // Jess = Jessica; thin page, just archive
  },
  // ── New dups found this session ───────────────────────────────────────
  {
    dupId:       '3730a88e-f36a-81e4-b76d-f1e52cb71f81',
    dupName:     'Via Leyden',
    canonicalId: '36c0a88e-f36a-81b7-a26c-ef0f60cefa55', // canonical Victoria Leyden
  },
  {
    dupId:       '3720a88e-f36a-818a-8e3a-ce066e899415',
    dupName:     'Nikita Timmermans (via Google Docs)',
    canonicalId: '36c0a88e-f36a-81c6-bdfc-c7dc120281ee', // canonical Nikita Timmermans
  },
  {
    dupId:          '3700a88e-f36a-81a1-a409-c5e3404e5084',
    dupName:        'Victoria Leyden (dup)',
    canonicalId:    '36c0a88e-f36a-81b7-a26c-ef0f60cefa55',
    canonicalRename: 'Victoria Leyden', // strips the "(Via)" parenthetical from the canonical
  },
  {
    dupId:       '3740a88e-f36a-81ad-8747-f8efc1ef5bf4',
    dupName:     'Nikita (dup)',
    canonicalId: '36c0a88e-f36a-81c6-bdfc-c7dc120281ee',
    // canonical name is already "Nikita Timmermans" — no rename needed
  },
];

// ── Databases to scan for stale profile relations ─────────────────────────
const DB_ENV_VARS = [
  'NOTION_DB_TASKS',
  'NOTION_DB_MEMORY_REVIEW_QUEUE',
  'NOTION_DB_SENSITIVE_REVIEW',
  'NOTION_DB_PROFILES',
  'NOTION_DB_ROLE_ASSIGNMENTS',
  'NOTION_DB_RISKS',
  'NOTION_DB_DECISION_CANDIDATES',
  'NOTION_DB_CIRCLES',
  'NOTION_DB_ROLES',
  'NOTION_DB_MEETINGS',
  'NOTION_DB_PROJECTS',
  'NOTION_DB_MESSAGES',
  'NOTION_DB_CANON_CHANGE_REQUESTS',
  'NOTION_DB_CCOS_LEDGER_ENTRIES',
];

// ── Helpers ───────────────────────────────────────────────────────────────

function norm(id: string): string {
  return id.replace(/-/g, '').toLowerCase();
}

function toDashed(id: string): string {
  const s = norm(id);
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

function getTitle(page: any): string {
  const props = (page.properties ?? {}) as Record<string, any>;
  for (const prop of Object.values(props)) {
    if ((prop as any)?.type === 'title') {
      return ((prop as any)?.title ?? [])
        .map((t: any) => t.plain_text ?? '')
        .join('')
        .trim() || '(untitled)';
    }
  }
  return '(untitled)';
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function queryAll(dbId: string): Promise<any[]> {
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: dbId,
      page_size:   100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}

// Build lookup structures
const DUP_NORM_SET    = new Set(DUPS.map(d => norm(d.dupId)));
const DUP_TO_CANON    = new Map(DUPS.map(d => [norm(d.dupId), d.canonicalId ? norm(d.canonicalId) : null]));

/**
 * Inspects all relation-type properties on a page.
 * Returns a map of propName → new relation array where dup IDs have been
 * replaced with canonical IDs (or removed if no canonical exists).
 * Returns null if no changes are needed.
 */
function buildRelationUpdates(page: any): Map<string, { id: string }[]> | null {
  const props = (page.properties ?? {}) as Record<string, any>;
  const updates = new Map<string, { id: string }[]>();

  for (const [propName, prop] of Object.entries(props)) {
    if (prop?.type !== 'relation') continue;
    const existing: { id: string }[] = prop.relation ?? [];
    let changed = false;
    const next: { id: string }[] = [];

    for (const rel of existing) {
      const n = norm(rel.id);
      if (DUP_NORM_SET.has(n)) {
        const canonNorm = DUP_TO_CANON.get(n);
        if (canonNorm) {
          // Replace dup with canonical — skip if canonical is already present
          const canonAlreadyPresent = existing.some(r => norm(r.id) === canonNorm);
          if (!canonAlreadyPresent) {
            next.push({ id: toDashed(canonNorm) });
          }
        }
        // else no canonical — just drop the dup ref
        changed = true;
      } else {
        next.push(rel);
      }
    }

    if (changed) updates.set(propName, next);
  }

  return updates.size > 0 ? updates : null;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`merge-dup-profiles — Mode: ${DRY_RUN ? 'DRY RUN (pass DRY_RUN=false to apply)' : 'LIVE'}`);
  console.log(`Dups to process: ${DUPS.length}`);
  for (const d of DUPS) {
    console.log(`  ${d.dupId}  "${d.dupName}"  →  ${d.canonicalId ?? '(archive only)'}`);
  }
  console.log('─'.repeat(60) + '\n');

  let totalRelationProps = 0;
  let totalPagesPatched  = 0;

  // ── Step 1: Re-link relations across all databases ─────────────────────
  for (const envVar of DB_ENV_VARS) {
    const dbId = process.env[envVar];
    if (!dbId) { console.log(`SKIP ${envVar} (not set)`); continue; }

    process.stdout.write(`Scanning ${envVar} ... `);
    let pages: any[];
    try {
      pages = await queryAll(dbId);
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      continue;
    }
    console.log(`${pages.length} pages`);

    for (const page of pages) {
      if (!('properties' in page)) continue;

      const updates = buildRelationUpdates(page);
      if (!updates) continue;

      const title = getTitle(page);
      console.log(`  [PATCH] "${title}" (${page.id})`);
      for (const [prop, newRels] of updates) {
        const oldCount = (page.properties[prop]?.relation ?? []).length;
        console.log(`    ${prop}: ${oldCount} → ${newRels.length} entries`);
        totalRelationProps++;
      }

      if (!DRY_RUN) {
        const propPayload: Record<string, any> = {};
        for (const [prop, newRels] of updates) {
          propPayload[prop] = { relation: newRels };
        }
        try {
          await notion.pages.update({ page_id: page.id, properties: propPayload });
          totalPagesPatched++;
        } catch (err: any) {
          console.error(`    ERROR patching ${page.id}: ${err.message}`);
        }
        await sleep(250);
      }
    }

    await sleep(150);
  }

  // ── Step 2: Rename canonical pages where needed ─────────────────────────
  console.log('\n── Canonical renames ──');
  for (const entry of DUPS) {
    if (!entry.canonicalId || !entry.canonicalRename) continue;
    console.log(`  Rename ${entry.canonicalId} → "${entry.canonicalRename}"`);
    if (!DRY_RUN) {
      try {
        await notion.pages.update({
          page_id:    entry.canonicalId,
          properties: { Name: { title: [{ text: { content: entry.canonicalRename } }] } } as any,
        });
      } catch (err: any) {
        console.error(`  ERROR renaming ${entry.canonicalId}: ${err.message}`);
      }
      await sleep(250);
    }
  }

  // ── Step 3: Archive all dup pages ───────────────────────────────────────
  console.log('\n── Archiving dups ──');
  for (const entry of DUPS) {
    const note = entry.canonicalId
      ? `→ canonical ${entry.canonicalId}`
      : '(no canonical — archive only)';
    console.log(`  Archive "${entry.dupName}" (${entry.dupId})  ${note}`);
    if (!DRY_RUN) {
      try {
        await (notion.pages.update as any)({ page_id: entry.dupId, archived: true });
      } catch (err: any) {
        console.error(`  ERROR archiving ${entry.dupId}: ${err.message}`);
      }
      await sleep(250);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Done. ${totalRelationProps} relation props patched across ${totalPagesPatched} pages.`);
  if (DRY_RUN) console.log('(DRY RUN — nothing was changed)');
}

main().catch(err => { console.error(err); process.exit(1); });
