/**
 * Deletes redundant relation properties across 7 databases after the full-schema-audit
 * migration created `*Profile`-suffixed duplicates alongside canonical named fields.
 *
 * Also removes numbered back-ref duplicates (1-suffix) in Circles and Roles.
 *
 * Properties deleted:
 *   Messages:              Sender [rich_text]
 *   Tasks:                 Owner Profile [relation]         (keep Owner)
 *   Meetings:              Organizer Profile [relation]     (keep Organizer)
 *                          Participant Profiles [relation]  (keep Participants)
 *   Risks:                 Owner Profile [relation]         (keep Owner)
 *   Canon Change Requests: Reviewer Profile [relation]      (keep Reviewer)
 *   CCOS Ledger:           Approver Profile [relation]      (keep Approved By)
 *   Circles:               Ledger Entries 1, Projects 1, Sub-circles (keep Sub-Circles)
 *   Roles:                 Ledger Entries 1, Assignments (keep Role Assignments)
 *
 * Usage: railway run npx ts-node scripts/migrate-cleanup-redundant-relations.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DB_MESSAGES  = process.env.NOTION_DB_MESSAGES;
const DB_TASKS     = process.env.NOTION_DB_TASKS;
const DB_MEETINGS  = process.env.NOTION_DB_MEETINGS;
const DB_RISKS     = process.env.NOTION_DB_RISKS;
const DB_CANON     = process.env.NOTION_DB_CANON_CHANGE_REQUESTS;
const DB_CCOS      = process.env.NOTION_DB_CCOS_LEDGER_ENTRIES;
const DB_CIRCLES   = process.env.NOTION_DB_CIRCLES;
const DB_ROLES     = process.env.NOTION_DB_ROLES;

const required: Record<string, string | undefined> = {
  NOTION_DB_MESSAGES: DB_MESSAGES,
  NOTION_DB_TASKS: DB_TASKS,
  NOTION_DB_MEETINGS: DB_MEETINGS,
  NOTION_DB_RISKS: DB_RISKS,
  NOTION_DB_CANON_CHANGE_REQUESTS: DB_CANON,
  NOTION_DB_CCOS_LEDGER_ENTRIES: DB_CCOS,
  NOTION_DB_CIRCLES: DB_CIRCLES,
  NOTION_DB_ROLES: DB_ROLES,
};
for (const [k, v] of Object.entries(required)) {
  if (!v) { console.error(`Missing env var ${k}`); process.exit(1); }
}

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const DELETIONS: Array<{ label: string; dbId: string; props: string[] }> = [
  { label: 'Messages',              dbId: DB_MESSAGES!, props: ['Sender'] },
  { label: 'Tasks',                 dbId: DB_TASKS!,    props: ['Owner Profile'] },
  { label: 'Meetings',              dbId: DB_MEETINGS!, props: ['Organizer Profile', 'Participant Profiles'] },
  { label: 'Risks',                 dbId: DB_RISKS!,    props: ['Owner Profile'] },
  { label: 'Canon Change Requests', dbId: DB_CANON!,    props: ['Reviewer Profile'] },
  { label: 'CCOS Ledger',           dbId: DB_CCOS!,     props: ['Approver Profile'] },
  { label: 'Circles',               dbId: DB_CIRCLES!,  props: ['Ledger Entries 1', 'Projects 1', 'Sub-circles'] },
  { label: 'Roles',                 dbId: DB_ROLES!,    props: ['Ledger Entries 1', 'Assignments'] },
];

async function getProps(dbId: string): Promise<Set<string>> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status} ${await r.text()}`);
  return new Set(Object.keys(((await r.json()) as any).properties ?? {}));
}

async function deleteProperty(dbId: string, propName: string): Promise<void> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ properties: { [propName]: null } }),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
}

async function main() {
  for (const { label, dbId, props } of DELETIONS) {
    console.log(`\n── ${label} ──`);
    let existing: Set<string>;
    try {
      existing = await getProps(dbId);
    } catch (err) {
      console.error(`  FAIL  fetch schema: ${(err as Error).message}`);
      continue;
    }
    for (const propName of props) {
      if (!existing.has(propName)) {
        console.log(`  SKIP  "${propName}" — not found`);
        continue;
      }
      try {
        await deleteProperty(dbId, propName);
        console.log(`  OK    deleted "${propName}"`);
      } catch (err) {
        console.error(`  FAIL  "${propName}": ${(err as Error).message}`);
      }
    }
  }
  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
