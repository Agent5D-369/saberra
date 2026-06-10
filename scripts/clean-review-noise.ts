/**
 * Evaluates all Pending Review items in Memory Review Queue and Sensitive Review
 * against the strict post-tightening criteria, and marks noise as "Dismissed".
 *
 * Uses Claude Haiku for fast, cheap evaluation. Adds a "Review Notes" audit trail
 * on every dismissed item. Status change is reversible — set back to "Pending Review"
 * at any time to undo.
 *
 * DRY_RUN=true (default) — prints judgments, makes no changes
 * DRY_RUN=false          — applies dismissals to Notion
 *
 * Usage:
 *   npx ts-node scripts/clean-review-noise.ts           # preview
 *   DRY_RUN=false npx ts-node scripts/clean-review-noise.ts  # apply
 */

import * as dotenv from 'dotenv';
dotenv.config();

const DRY_RUN = process.env.DRY_RUN !== 'false';

const NOTION_KEY  = process.env.NOTION_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MEMORY_DB   = process.env.NOTION_DB_MEMORY_REVIEW_QUEUE;
const SENSITIVE_DB = process.env.NOTION_DB_SENSITIVE_REVIEW;

if (!NOTION_KEY)    { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('ANTHROPIC_API_KEY required'); process.exit(1); }
if (!MEMORY_DB)     { console.error('NOTION_DB_MEMORY_REVIEW_QUEUE required'); process.exit(1); }
if (!SENSITIVE_DB)  { console.error('NOTION_DB_SENSITIVE_REVIEW required'); process.exit(1); }

const NOTION_BASE = 'https://api.notion.com/v1';
const NOTION_H = {
  Authorization: `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const ANTHROPIC_H = {
  'x-api-key': ANTHROPIC_KEY!,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
};

const HAIKU = 'claude-haiku-4-5-20251001';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Notion helpers ────────────────────────────────────────────────────────────

async function queryPending(dbId: string): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await fetch(`${NOTION_BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: NOTION_H,
      body: JSON.stringify({
        filter: { property: 'Status', select: { equals: 'Pending Review' } },
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });
    if (!r.ok) throw new Error(`Query ${dbId}: ${r.status} ${await r.text()}`);
    const d = await r.json() as any;
    results.push(...(d.results ?? []));
    cursor = d.has_more ? d.next_cursor : undefined;
    await sleep(150);
  } while (cursor);
  return results;
}

async function dismissPage(pageId: string, reason: string): Promise<void> {
  const r = await fetch(`${NOTION_BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: NOTION_H,
    body: JSON.stringify({
      properties: {
        Status: { select: { name: 'Dismissed' } },
        'Review Notes': {
          rich_text: [{ type: 'text', text: { content: `[Auto-dismissed ${new Date().toISOString().slice(0, 10)}] ${reason}` } }],
        },
      },
    }),
  });
  if (!r.ok) throw new Error(`Dismiss ${pageId}: ${r.status} ${await r.text()}`);
}

// ── Title extraction ──────────────────────────────────────────────────────────

function getTitle(page: any): string {
  const props = page.properties ?? {};
  for (const val of Object.values(props) as any[]) {
    if (val?.type === 'title') {
      return (val.title ?? []).map((t: any) => t.plain_text).join('') || '(untitled)';
    }
  }
  return page.id;
}

function getRichText(page: any, prop: string): string {
  const p = page.properties?.[prop];
  if (p?.type === 'rich_text') return (p.rich_text ?? []).map((t: any) => t.plain_text).join('');
  return '';
}

// ── Claude evaluation ─────────────────────────────────────────────────────────

type Verdict = { keep: boolean; reason: string };

async function evaluateMemoryItem(title: string, category: string, sourceEvidence: string): Promise<Verdict> {
  const prompt = `You are evaluating whether a Memory Review Queue item meets strict criteria for institutional memory.

KEEP criteria (item must fit at least one):
- Relationship context between people or organizations that isn't captured elsewhere
- Long-term institutional knowledge not already captured as a decision, task, or risk
- Historical facts about Amora not documented elsewhere
- Process or learning insights that benefit future members
- Genuinely ambiguous information with no other structured home

DISMISS criteria (item should be dismissed if it matches any):
- Information already captured as a decision, task, risk, or role assignment in this extraction
- Email formatting errors, technical glitches, or rendering issues
- Routine meeting logistics or scheduling information
- Low-value observations about tools or systems

Item to evaluate:
Title: ${title}
Category: ${category}
Source Evidence: ${sourceEvidence}

Respond with JSON only: { "keep": true/false, "reason": "one sentence explaining the verdict" }`;

  return callHaiku(prompt);
}

async function evaluateSensitiveItem(title: string, reason: string): Promise<Verdict> {
  const prompt = `You are evaluating whether a Sensitive Review item meets strict criteria for the admin-only sensitive review queue.

KEEP criteria (item must fit at least one):
- Personal disclosures (health, family, personal hardship)
- Conflict or safety situations between specific people
- Specific financial amounts, disputes, or unauthorized transactions
- Legal matters, liability, or compliance violations
- Confidential organizational information shared in error
- Information that could genuinely harm someone if exposed

DISMISS criteria (item should be dismissed if it matches any):
- Email formatting errors (broken links, wrong signatures, truncated text)
- Technical glitches or rendering issues
- Meeting logistics, scheduling, or attendance
- General ambiguity about scope of a request
- Items already captured as a risk in the risks database
- Routine operational observations

Item to evaluate:
Issue: ${title}
Reason: ${reason}

Respond with JSON only: { "keep": true/false, "reason": "one sentence explaining the verdict" }`;

  return callHaiku(prompt);
}

async function callHaiku(prompt: string): Promise<Verdict> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: ANTHROPIC_H,
    body: JSON.stringify({
      model: HAIKU,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
  const d = await r.json() as any;
  const text = d.content?.[0]?.text ?? '{}';
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned) as Verdict;
  } catch {
    return { keep: true, reason: 'Parse error — defaulting to keep' };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`  Review Noise Cleanup — ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE — changes will be applied'}`);
  console.log(`${'='.repeat(72)}\n`);
  if (DRY_RUN) console.log('  Run with DRY_RUN=false to apply dismissals.\n');

  let totalKept = 0;
  let totalDismissed = 0;
  const errors: string[] = [];

  // ── Memory Review Queue
  console.log('── Memory Review Queue ──────────────────────────────────────────────────');
  const memoryItems = await queryPending(MEMORY_DB!);
  console.log(`   ${memoryItems.length} pending item${memoryItems.length !== 1 ? 's' : ''}`);

  for (const page of memoryItems) {
    const title = getTitle(page);
    const category = (page.properties?.Category?.select?.name ?? '');
    const sourceEvidence = getRichText(page, 'Source Evidence');
    let verdict: Verdict;
    try {
      verdict = await evaluateMemoryItem(title, category, sourceEvidence);
    } catch (err: any) {
      console.log(`  ERROR evaluating "${title.slice(0, 60)}": ${err.message}`);
      errors.push(err.message);
      continue;
    }
    const icon = verdict.keep ? '  KEEP   ' : '  DISMISS';
    console.log(`\n${icon} "${title.slice(0, 70)}"`);
    console.log(`         ${verdict.reason}`);
    if (!verdict.keep) {
      if (!DRY_RUN) {
        try {
          await dismissPage(page.id, verdict.reason);
          console.log('         → dismissed ok');
        } catch (err: any) {
          console.log(`         → FAILED: ${err.message}`);
          errors.push(err.message);
        }
        await sleep(350);
      } else {
        console.log('         → [DRY RUN — would dismiss]');
      }
      totalDismissed++;
    } else {
      totalKept++;
    }
    await sleep(200);
  }

  // ── Sensitive Review
  console.log('\n── Sensitive Review ─────────────────────────────────────────────────────');
  const sensitiveItems = await queryPending(SENSITIVE_DB!);
  console.log(`   ${sensitiveItems.length} pending item${sensitiveItems.length !== 1 ? 's' : ''}`);

  for (const page of sensitiveItems) {
    const title = getTitle(page);
    const reason = getRichText(page, 'Reason');
    let verdict: Verdict;
    try {
      verdict = await evaluateSensitiveItem(title, reason);
    } catch (err: any) {
      console.log(`  ERROR evaluating "${title.slice(0, 60)}": ${err.message}`);
      errors.push(err.message);
      continue;
    }
    const icon = verdict.keep ? '  KEEP   ' : '  DISMISS';
    console.log(`\n${icon} "${title.slice(0, 70)}"`);
    console.log(`         ${verdict.reason}`);
    if (!verdict.keep) {
      if (!DRY_RUN) {
        try {
          await dismissPage(page.id, verdict.reason);
          console.log('         → dismissed ok');
        } catch (err: any) {
          console.log(`         → FAILED: ${err.message}`);
          errors.push(err.message);
        }
        await sleep(350);
      } else {
        console.log('         → [DRY RUN — would dismiss]');
      }
      totalDismissed++;
    } else {
      totalKept++;
    }
    await sleep(200);
  }

  // ── Summary
  console.log(`\n${'='.repeat(72)}`);
  console.log(`  Summary`);
  console.log(`${'='.repeat(72)}`);
  console.log(`  Items kept:      ${totalKept}`);
  console.log(`  Items ${DRY_RUN ? 'to dismiss' : 'dismissed'}: ${totalDismissed}`);
  if (errors.length > 0) console.log(`  Errors:          ${errors.length} (check output above)`);
  if (DRY_RUN && totalDismissed > 0) console.log(`\n  To apply: DRY_RUN=false npx ts-node scripts/clean-review-noise.ts`);
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
