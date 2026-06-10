/**
 * Audits and cleans all select/multi-select dropdown options across all Notion databases.
 *
 * For each select/multi-select property:
 *   1. Fetches live options from Notion
 *   2. Compares against canonical options in notionSchemas.ts
 *   3. Checks page usage for any extra/duplicate options before touching them
 *   4. Removes extra options with 0 page usage (PATCH database schema)
 *   5. Reports extra options that ARE in use — manual review required
 *
 * Safe to re-run — idempotent.
 * Usage: npx ts-node scripts/audit-clean-dropdowns.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { DATABASE_SCHEMAS } from '../src/config/notionSchemas';

const API_KEY = process.env.NOTION_API_KEY;
if (!API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const DB_MAP: Record<string, string | undefined> = {
  sourceEmails:        process.env.NOTION_DB_SOURCE_EMAILS,
  meetings:            process.env.NOTION_DB_MEETINGS,
  meetingAssets:       process.env.NOTION_DB_MEETING_ASSETS,
  messages:            process.env.NOTION_DB_MESSAGES,
  profiles:            process.env.NOTION_DB_PROFILES,
  projects:            process.env.NOTION_DB_PROJECTS,
  circles:             process.env.NOTION_DB_CIRCLES,
  roles:               process.env.NOTION_DB_ROLES,
  roleAssignments:     process.env.NOTION_DB_ROLE_ASSIGNMENTS,
  tasks:               process.env.NOTION_DB_TASKS,
  decisionCandidates:  process.env.NOTION_DB_DECISION_CANDIDATES,
  risks:               process.env.NOTION_DB_RISKS,
  memoryReviewQueue:   process.env.NOTION_DB_MEMORY_REVIEW_QUEUE,
  canonChangeRequests: process.env.NOTION_DB_CANON_CHANGE_REQUESTS,
  ccosLedgerEntries:   process.env.NOTION_DB_CCOS_LEDGER_ENTRIES,
  processingEvents:    process.env.NOTION_DB_PROCESSING_EVENTS,
  sensitiveReview:     process.env.NOTION_DB_SENSITIVE_REVIEW,
  policies:            process.env.NOTION_DB_POLICIES,
  knowledgeBase:       process.env.NOTION_DB_KNOWLEDGE_BASE,
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function getDatabase(dbId: string): Promise<any> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET db ${dbId}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function countPagesWithOption(
  dbId: string,
  propName: string,
  propType: 'select' | 'multi_select',
  value: string,
): Promise<number> {
  const filter = propType === 'select'
    ? { property: propName, select:       { equals:   value } }
    : { property: propName, multi_select: { contains: value } };

  const r = await fetch(`${BASE}/databases/${dbId}/query`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ filter, page_size: 1 }),
  });
  if (!r.ok) {
    console.warn(`    WARNING: usage query failed for "${propName}"="${value}": ${r.status}`);
    return -1;
  }
  const d = await r.json() as any;
  if (d.has_more) return 999;
  return (d.results ?? []).length;
}

async function patchDbOptions(
  dbId: string,
  propName: string,
  propType: 'select' | 'multi_select',
  options: string[],
): Promise<void> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      properties: {
        [propName]: { [propType]: { options: options.map(name => ({ name })) } },
      },
    }),
  });
  if (!r.ok) throw new Error(`PATCH db prop "${propName}": ${r.status} ${await r.text()}`);
}

function getCanonicalOptions(schemaKey: string, propName: string): string[] | null {
  const schema = DATABASE_SCHEMAS[schemaKey];
  if (!schema) return null;
  const prop = (schema.properties as any)[propName];
  if (!prop) return null;
  if (prop.select?.options)       return prop.select.options.map((o: any) => o.name as string);
  if (prop.multi_select?.options) return prop.multi_select.options.map((o: any) => o.name as string);
  return null;
}

async function main() {
  console.log('\n── Auditing all select/multi-select dropdowns ──────────────────────────────\n');

  const manualReviewNeeded: { db: string; prop: string; option: string; pages: number }[] = [];
  let totalRemoved = 0;
  let totalClean   = 0;

  for (const [schemaKey, dbId] of Object.entries(DB_MAP)) {
    if (!dbId) { console.log(`  SKIP ${schemaKey} — no env var`); continue; }

    const schema = DATABASE_SCHEMAS[schemaKey];
    if (!schema) { console.log(`  SKIP ${schemaKey} — not in notionSchemas.ts`); continue; }

    console.log(`\n  ── ${schema.title} ──`);

    let liveDb: any;
    try { liveDb = await getDatabase(dbId); }
    catch (err: any) { console.log(`    ERROR fetching: ${err.message}`); continue; }

    const liveProps: Record<string, any> = liveDb.properties ?? {};

    for (const [propName, livePropDef] of Object.entries(liveProps)) {
      const propType: 'select' | 'multi_select' | null =
        livePropDef.type === 'select'       ? 'select' :
        livePropDef.type === 'multi_select' ? 'multi_select' : null;
      if (!propType) continue;

      const liveOptions: string[] = (livePropDef[propType]?.options ?? []).map((o: any) => o.name as string);
      const canonical = getCanonicalOptions(schemaKey, propName);

      if (!canonical) {
        // Property not tracked in our schema — report but don't touch
        console.log(`    [?] "${propName}" (${propType}): ${liveOptions.length} live options — not in canonical schema, skipping`);
        continue;
      }

      // Detect case-insensitive duplicates among live options
      const seenLower = new Map<string, string>();
      const caseDupes: string[] = [];
      for (const opt of liveOptions) {
        const lower = opt.toLowerCase().trim();
        if (seenLower.has(lower)) {
          caseDupes.push(opt);
        } else {
          seenLower.set(lower, opt);
        }
      }

      // Extra = live options not present in canonical (by exact name)
      const canonicalSet = new Set(canonical);
      const extras = liveOptions.filter(o => !canonicalSet.has(o));

      // Also flag canonical options that are present live with different casing
      const liveSet = new Set(liveOptions);
      const caseMismatches = canonical.filter(c => !liveSet.has(c) && liveOptions.some(l => l.toLowerCase() === c.toLowerCase()));

      const dirty = extras.length > 0 || caseDupes.length > 0 || caseMismatches.length > 0;

      if (!dirty) {
        console.log(`    [ok] "${propName}" (${propType}): ${liveOptions.length} options — clean`);
        totalClean++;
        continue;
      }

      if (caseMismatches.length > 0) {
        console.log(`    [!!] "${propName}" (${propType}): casing mismatch — live has ${caseMismatches.map(c => {
          const live = liveOptions.find(l => l.toLowerCase() === c.toLowerCase());
          return `"${live}" should be "${c}"`;
        }).join(', ')}`);
      }
      if (caseDupes.length > 0) {
        console.log(`    [!!] "${propName}" (${propType}): case duplicates — ${caseDupes.map(d => `"${d}"`).join(', ')}`);
      }
      if (extras.length > 0) {
        console.log(`    [!!] "${propName}" (${propType}): ${extras.length} extra option(s) — ${extras.map(e => `"${e}"`).join(', ')}`);
      }

      // Check usage for each problem option
      const allProblems = [...new Set([...extras, ...caseDupes])];
      const inUse: string[] = [];
      const unused: string[] = [];

      for (const opt of allProblems) {
        await sleep(150);
        const count = await countPagesWithOption(dbId, propName, propType, opt);
        if (count === 0) {
          unused.push(opt);
          console.log(`      "${opt}" — 0 pages → will remove`);
        } else if (count < 0) {
          inUse.push(opt); // unknown — keep to be safe
          console.log(`      "${opt}" — usage unknown → keeping`);
        } else {
          inUse.push(opt);
          console.log(`      "${opt}" — ${count} page(s) in use → KEEP (manual review needed)`);
          manualReviewNeeded.push({ db: schema.title, prop: propName, option: opt, pages: count });
        }
      }

      // For casing mismatches that aren't in the dirty lists: fix by including canonical spelling
      // (it will co-exist with the old casing; the old casing is in extras or caseDupes so handled above)

      if (unused.length > 0 || caseMismatches.length > 0) {
        // New options list = canonical + any in-use extras (preserves data)
        const newOptions = [...canonical, ...inUse];
        process.stdout.write(`      patching "${propName}" — removing ${unused.length} option(s)... `);
        try {
          await patchDbOptions(dbId, propName, propType, newOptions);
          console.log('ok');
          totalRemoved += unused.length;
        } catch (err: any) {
          console.log(`FAILED — ${err.message}`);
        }
        await sleep(350);
      }
    }

    await sleep(300);
  }

  console.log('\n── Summary ────────────────────────────────────────────────────────────────\n');
  console.log(`  Properties clean (no changes):    ${totalClean}`);
  console.log(`  Extra options removed (unused):   ${totalRemoved}`);

  if (manualReviewNeeded.length > 0) {
    console.log(`\n  OPTIONS IN USE THAT ARE NOT IN CANONICAL SCHEMA — manual review needed:`);
    for (const i of manualReviewNeeded) {
      console.log(`    ${i.db} > "${i.prop}": "${i.option}" — ${i.pages} page(s)`);
    }
    console.log('\n  For each: decide whether to migrate pages to the canonical value, then remove the option.');
  } else {
    console.log('\n  No in-use non-canonical options — all extra options were unused.');
  }
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
