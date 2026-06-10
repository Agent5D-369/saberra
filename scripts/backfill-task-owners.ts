/**
 * Backfills Assigned Role on Tasks that have no Owner and no Assigned Role.
 *
 * Uses the same domain-to-role heuristic as the Sera extraction prompt:
 *   - Living Memory Hub / Saberra / Notion / institutional memory → Living Memory Steward
 *   - Technology / code / server / deploy / digital tools        → Technology Steward
 *   - Finance / budget / payment / invoice / fundraising         → Finance Steward
 *   - Education / learning / curriculum / workshop / training    → Education Steward
 *   - Governance / CCOS / policy / charter / membership / legal  → Lead Steward
 *
 * Tasks that cannot be matched to any role are left untouched (unowned tasks
 * that are Medium/Low priority get Status set to Needs Owner for visibility).
 *
 * Safe to re-run: skips tasks that already have an Owner or Assigned Role.
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB_TASKS = process.env.NOTION_DB_TASKS!;
const DB_ROLES = process.env.NOTION_DB_ROLES!;

if (!DB_TASKS || !DB_ROLES) {
  console.error('NOTION_DB_TASKS and NOTION_DB_ROLES must be set');
  process.exit(1);
}

// ── Domain-to-role heuristic ─────────────────────────────────────────────────

// Role names must exactly match what exists in the Notion Roles DB.
// Run the script once to see the current role list in the output.
const ROLE_PATTERNS: Array<{ role: string; patterns: RegExp[] }> = [
  {
    role: 'Living Memory Steward',
    patterns: [
      /living memory/i, /saberra/i, /\bsera\b/i, /notion database/i,
      /institutional memory/i, /extraction/i, /ingest/i, /memory hub/i,
      /meeting notes.*notion/i, /file.*notion/i, /route.*notion/i,
    ],
  },
  {
    role: 'Living Memory Operations Steward',
    patterns: [
      /memory operations/i, /daily.*notion/i, /routine.*extraction/i,
    ],
  },
  {
    role: 'Technology Steward',
    patterns: [
      /\bwebsite\b/i, /\bserver\b/i, /\bdeploy\b/i, /\bcode\b/i,
      /\bapi\b/i, /\bintegration\b/i, /\bapp\b/i,
      /\bsoftware\b/i, /\bplatform\b/i, /\bsystem maintenance\b/i,
      /\btechnolog/i, /\bdigital infrastructure\b/i,
    ],
  },
  {
    role: 'Finance Steward',
    patterns: [
      /\bfinance\b/i, /\bbudget\b/i, /\bpayment\b/i, /\binvoice\b/i,
      /\baccounting\b/i, /\bexpense\b/i, /\bfundraising\b/i, /\bgrant\b/i,
      /\bbank\b/i, /\bfinancial\b/i, /\bcost\b/i, /\bfunds?\b/i,
      /\bmoney\b/i, /\brevenue\b/i, /\bpayroll\b/i,
    ],
  },
  {
    role: 'Education Steward',
    patterns: [
      /\beducation\b/i, /\blearning\b/i, /\bcurriculum\b/i,
      /\bworkshop\b/i, /\btraining\b/i, /\bcourse\b/i, /\bskill\b/i,
      /\bteach\b/i, /\bmentor\b/i,
    ],
  },
  {
    role: 'Social Media Steward',
    patterns: [
      /\bsocial media\b/i, /\binstagram\b/i, /\bfacebook\b/i,
      /\btwitter\b/i, /\blinkedin\b/i, /\bpost\b.*\bpublic\b/i,
    ],
  },
  {
    role: 'Marketing Steward',
    patterns: [
      /\bmarketing\b/i, /\bcampaign\b/i, /\bbrand\b/i, /\bpromotion\b/i,
      /\boutreach\b/i, /\bnewsletter\b/i,
    ],
  },
  {
    role: 'Community Steward',
    patterns: [
      /\bmembership\b/i, /\bonboard\b/i, /\bwelcome\b/i, /\brecruit\b/i,
      /\bcommunity relation\b/i, /\bresident/i,
    ],
  },
  {
    role: 'Agroforestry Steward',
    patterns: [
      /\bagroforest/i, /\bagricultur/i, /\bfarm\b/i, /\bgarden\b/i,
      /\bcrops?\b/i, /\bsoil\b/i, /\becolog/i, /\bland steward/i,
      /\bpermacultur/i,
    ],
  },
  {
    role: 'Wellbeing Steward',
    patterns: [
      /\bwellbeing\b/i, /\bwellness\b/i, /\bmental health\b/i,
      /\bself-care\b/i, /\bhealing\b/i, /\bholistic\b/i,
    ],
  },
  {
    role: 'Ceremony Steward / GPS Facilitator',
    patterns: [
      /\bceremony\b/i, /\britual\b/i, /\bgathering\b/i, /\bfestival\b/i,
      /\bevent.*plan/i, /\bcelebration\b/i, /\bfacilitat/i,
    ],
  },
  {
    role: 'Admin Facilitator',
    patterns: [
      /\bgovernance\b/i, /\bccos\b/i, /\bpolicy\b/i, /\bcharter\b/i,
      /\bconsent\b/i, /\bproposal\b/i, /\blegal\b/i, /\bcontract\b/i,
      /\bpermit\b/i, /\bcompliance\b/i, /\bland title\b/i,
      /\borganizational structure\b/i, /\badmin\b/i,
    ],
  },
];

function inferRole(taskText: string): string | null {
  for (const { role, patterns } of ROLE_PATTERNS) {
    if (patterns.some((p) => p.test(taskText))) return role;
  }
  return null;
}

// ── Notion helpers ────────────────────────────────────────────────────────────

async function paginateAll(dbId: string, filter?: object): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      filter: filter as any,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function buildRoleMap(): Promise<Map<string, string>> {
  const roles = await paginateAll(DB_ROLES, {
    property: 'Status',
    select: { does_not_equal: 'Archived' },
  });
  const map = new Map<string, string>();
  for (const r of roles) {
    const nameProp = r.properties['Role Name'];
    const name: string | undefined =
      nameProp?.type === 'title' ? nameProp.title?.[0]?.plain_text : undefined;
    if (name) map.set(name.toLowerCase(), r.id);
  }
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Building role map from Roles DB...');
  const roleMap = await buildRoleMap();
  console.log(`  Found ${roleMap.size} active roles`);
  console.log('  Known roles:', [...roleMap.keys()].join(', '));

  console.log('\nQuerying unowned active tasks...');
  const unownedTasks = await paginateAll(DB_TASKS, {
    and: [
      { property: 'Owner',         relation: { is_empty: true } },
      { property: 'Assigned Role', relation: { is_empty: true } },
      { property: 'Lifecycle',     select: { equals: 'Active' } },
    ],
  });
  console.log(`  Found ${unownedTasks.length} unowned tasks`);

  let assigned = 0;
  let flagged = 0;
  let skipped = 0;

  for (const task of unownedTasks) {
    const titleProp = task.properties['Task'];
    const taskText: string =
      titleProp?.type === 'title' ? (titleProp.title?.[0]?.plain_text ?? '') : '';

    if (!taskText.trim()) { skipped++; continue; }

    const currentStatus: string =
      task.properties['Status']?.select?.name ?? 'Open';

    const roleName = inferRole(taskText);

    if (roleName) {
      const roleId = roleMap.get(roleName.toLowerCase());
      if (!roleId) {
        console.warn(`  [SKIP] Role "${roleName}" not found in Roles DB — task: "${taskText.slice(0, 60)}"`);
        skipped++;
        continue;
      }
      await notion.pages.update({
        page_id: task.id,
        properties: {
          'Assigned Role': { relation: [{ id: roleId }] },
          // If previously flagged Needs Owner but we now have a role, reopen it
          ...(currentStatus === 'Needs Owner' ? { Status: { select: { name: 'Open' } } } : {}),
        } as any,
      });
      console.log(`  [ASSIGNED] "${roleName}" → "${taskText.slice(0, 70)}"`);
      assigned++;
    } else {
      // Cannot infer a role — mark Needs Owner so it surfaces in the dashboard
      if (currentStatus !== 'Needs Owner') {
        await notion.pages.update({
          page_id: task.id,
          properties: { Status: { select: { name: 'Needs Owner' } } } as any,
        });
        console.log(`  [FLAGGED]  No role inferred → "${taskText.slice(0, 70)}"`);
        flagged++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`\nDone.`);
  console.log(`  Assigned role: ${assigned}`);
  console.log(`  Flagged Needs Owner: ${flagged}`);
  console.log(`  Skipped (no match or already flagged): ${skipped}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
