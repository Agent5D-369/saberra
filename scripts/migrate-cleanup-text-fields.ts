/**
 * Removes all redundant `(text)` backup fields that now have proper two-way
 * relations, converts Profiles.Organization and Profiles.Referred By from
 * richText to self-relations, and removes Meeting Assets.Meeting ID (dedup
 * now uses the Meeting relation filter).
 *
 * Run AFTER deploying the updated worker code (code no longer writes to these fields).
 *
 * Usage: railway run npx ts-node scripts/migrate-cleanup-text-fields.ts
 * Safe to re-run: skips missing fields.
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const DB = {
  meetings:            '3670a88e-f36a-81f6-9df7-e3e3a8c28063',
  meetingAssets:       '3670a88e-f36a-81bd-bb5f-ee45ac046888',
  profiles:            '3680a88e-f36a-819f-9074-f4fcc0405569',
  projects:            '3680a88e-f36a-81c9-a91b-e62b0b3862d8',
  tasks:               '3670a88e-f36a-8103-b5a8-c87733d13902',
  decisionCandidates:  '3670a88e-f36a-81df-aaad-fb1712cdb4b3',
  risks:               '3670a88e-f36a-8157-8890-ccf7efa5a65b',
  memoryReviewQueue:   '3670a88e-f36a-8139-bd3c-f30c83d361fb',
  canonChangeRequests: '3670a88e-f36a-816b-ac6f-f89269e947dd',
  ccosLedgerEntries:   '3670a88e-f36a-8116-901f-c7470f2703d7',
  circles:             '3680a88e-f36a-8129-bf10-f0071f7c5235',
  roles:               '3680a88e-f36a-81d4-bbfd-db16628d971b',
  roleAssignments:     '3680a88e-f36a-81c9-82bc-d3da1079c100',
};

async function getProps(dbId: string): Promise<Record<string, any>> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).properties ?? {};
}

async function patchDb(dbId: string, body: any): Promise<any> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function deleteProps(dbId: string, names: string[]): Promise<void> {
  const existing = await getProps(dbId);
  const payload: Record<string, null> = {};
  let count = 0;
  for (const n of names) {
    if (!existing[n]) { process.stdout.write(`    skip '${n}' (not found)\n`); continue; }
    payload[n] = null;
    count++;
  }
  if (count === 0) return;
  await patchDb(dbId, { properties: payload });
  for (const n of Object.keys(payload)) process.stdout.write(`    ✓ deleted '${n}'\n`);
}

async function addRelation(
  sourceDbId: string,
  propName: string,
  targetDbId: string,
): Promise<{ syncedId: string; syncedName: string } | null> {
  const props = await getProps(sourceDbId);
  if (props[propName]?.type === 'relation') {
    process.stdout.write(`    skip '${propName}' relation — already exists\n`);
    return null;
  }
  const resp = await patchDb(sourceDbId, {
    properties: {
      [propName]: {
        relation: { database_id: targetDbId, type: 'dual_property', dual_property: {} },
      },
    },
  });
  const created = resp.properties?.[propName];
  const syncedId   = created?.relation?.dual_property?.synced_property_id   ?? null;
  const syncedName = created?.relation?.dual_property?.synced_property_name ?? null;
  process.stdout.write(`    ✓ created '${propName}' relation (back-ref id=${syncedId})\n`);
  return syncedId ? { syncedId, syncedName } : null;
}

async function renameBackRef(targetDbId: string, propId: string, desiredName: string): Promise<void> {
  const props = await getProps(targetDbId);
  const entry = Object.entries(props).find(([, v]: any) => v.id === propId);
  if (!entry) { process.stdout.write(`    back-ref id=${propId} not found — skip rename to '${desiredName}'\n`); return; }
  const [currentName] = entry;
  if (currentName === desiredName) return;
  await patchDb(targetDbId, { properties: { [currentName]: { name: desiredName } } });
  process.stdout.write(`    ✓ back-ref '${currentName}' → '${desiredName}'\n`);
}

async function delay(ms = 500) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Pass 1: Delete Organization + Referred By richText (free up names for relations)
  console.log('\n══ Pass 1 — delete Organization and Referred By richText from Profiles');
  await deleteProps(DB.profiles, ['Organization', 'Referred By']);
  await delay();

  // ── Pass 2: Add Organization and Referred By as self-relations on Profiles
  console.log('\n══ Pass 2 — add Organization and Referred By relations on Profiles');

  const orgResult = await addRelation(DB.profiles, 'Organization', DB.profiles);
  await delay();
  if (orgResult) {
    await renameBackRef(DB.profiles, orgResult.syncedId, 'Members');
    await delay();
  }

  const refResult = await addRelation(DB.profiles, 'Referred By', DB.profiles);
  await delay();
  if (refResult) {
    await renameBackRef(DB.profiles, refResult.syncedId, 'Referrals');
    await delay();
  }

  // ── Pass 3: Delete Meeting Assets.Meeting ID (dedup now uses Meeting relation)
  console.log('\n══ Pass 3 — delete Meeting Assets.Meeting ID');
  await deleteProps(DB.meetingAssets, ['Meeting ID']);
  await delay();

  // ── Pass 4: Delete all (text) backup fields
  console.log('\n══ Pass 4 — delete (text) backup fields across all tables');

  const textFieldMap: Array<[string, string[]]> = [
    [DB.profiles,            ['Role at Amora (text)']],
    [DB.circles,             ['Circle Lead (text)', 'Parent Circle (text)']],
    [DB.roles,               ['Circle (text)']],
    [DB.roleAssignments,     ['Role (text)', 'Role Holder (text)', 'Circle (text)']],
    [DB.projects,            ['Circle (text)', 'Project Lead (text)']],
    [DB.tasks,               ['Owner (text)']],
    [DB.decisionCandidates,  ['Decision Maker (text)', 'Reviewer (text)']],
    [DB.risks,               ['Owner (text)']],
    [DB.memoryReviewQueue,   ['Reviewer (text)']],
    [DB.canonChangeRequests, ['Reviewer (text)', 'Implemented By (text)']],
    [DB.ccosLedgerEntries,   ['Circle (text)', 'Role (text)', 'Approved By (text)']],
  ];

  const dbName = (id: string) => Object.entries(DB).find(([, v]) => v === id)?.[0] ?? id;

  for (const [dbId, fields] of textFieldMap) {
    process.stdout.write(`  ${dbName(dbId)}\n`);
    await deleteProps(dbId, fields);
    await delay();
  }

  console.log('\n✓ Done.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
