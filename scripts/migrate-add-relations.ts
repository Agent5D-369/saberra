/**
 * Adds proper two-way Notion relation properties across all 16 databases.
 *
 * Pass 1 — renames existing richText/multiSelect fields that share a name with
 *           the incoming relation (appends " (text)").
 * Pass 2 — creates each dual_property relation.
 * Pass 3 — renames the auto-generated back-ref to the desired name.
 *
 * Usage:
 *   npx ts-node scripts/migrate-add-relations.ts
 *
 * Safe to re-run: each step checks whether the property already exists or has
 * already been renamed before touching it.
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

// ─── DB ids ───────────────────────────────────────────────────────────────────

const DB = {
  sourceEmails:        '3670a88e-f36a-818f-97ad-c6c2195a4b52',
  meetings:            '3670a88e-f36a-81f6-9df7-e3e3a8c28063',
  meetingAssets:       '3670a88e-f36a-81bd-bb5f-ee45ac046888',
  messages:            '3670a88e-f36a-81f0-914c-e5a587a5603d',
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
  processingEvents:    '3670a88e-f36a-8106-8a3e-f4275ab7e26e',
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function getDb(dbId: string): Promise<any> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET DB ${dbId}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function patchDb(dbId: string, body: any): Promise<any> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH DB ${dbId}: ${r.status} ${await r.text()}`);
  return r.json();
}

/** Returns the current property map for a database. */
async function getProps(dbId: string): Promise<Record<string, any>> {
  const db = await getDb(dbId);
  return db.properties ?? {};
}

/** Renames a property in a DB. No-op if the property doesn't exist or already has the new name. */
async function renameProp(dbId: string, oldName: string, newName: string): Promise<void> {
  const props = await getProps(dbId);
  if (!props[oldName]) {
    // Check if already renamed
    if (props[newName]) return; // already done
    console.log(`    skip rename '${oldName}' → already absent in ${dbId}`);
    return;
  }
  if (props[oldName].name === newName || props[newName]) return; // already renamed
  await patchDb(dbId, { properties: { [oldName]: { name: newName } } });
  console.log(`    renamed '${oldName}' → '${newName}'`);
}

/** Adds a dual_property relation. Returns the synced_property_id for back-ref renaming, or null if already exists. */
async function addRelation(
  sourceDbId: string,
  propName: string,
  targetDbId: string,
): Promise<{ syncedId: string; syncedName: string } | null> {
  const props = await getProps(sourceDbId);
  if (props[propName]?.type === 'relation') {
    console.log(`    '${propName}' relation already exists — skip`);
    return null;
  }
  const resp = await patchDb(sourceDbId, {
    properties: {
      [propName]: {
        relation: {
          database_id: targetDbId,
          type: 'dual_property',
          dual_property: {},
        },
      },
    },
  });
  const created = resp.properties?.[propName];
  const syncedId   = created?.relation?.dual_property?.synced_property_id ?? null;
  const syncedName = created?.relation?.dual_property?.synced_property_name ?? null;
  if (syncedId) console.log(`    created '${propName}' → back-ref id=${syncedId} name='${syncedName}'`);
  else          console.log(`    created '${propName}' (no synced id in response)`);
  return syncedId ? { syncedId, syncedName } : null;
}

/** Renames a back-ref property in a target DB using its Notion property ID. */
async function renameBackRef(targetDbId: string, propId: string, desiredName: string): Promise<void> {
  const props = await getProps(targetDbId);
  // Find by id
  const entry = Object.entries(props).find(([, v]: any) => v.id === propId);
  if (!entry) {
    console.log(`    back-ref id=${propId} not found in target DB — skip rename to '${desiredName}'`);
    return;
  }
  const [currentName] = entry;
  if (currentName === desiredName) return;
  await patchDb(targetDbId, { properties: { [currentName]: { name: desiredName } } });
  console.log(`    back-ref renamed '${currentName}' → '${desiredName}'`);
}

// ─── Relation definitions ────────────────────────────────────────────────────

interface RelDef {
  label: string;           // human-readable description
  sourceDb: string;        // source DB id
  prop: string;            // new relation property name in source DB
  targetDb: string;        // target DB id
  backRef: string;         // desired back-ref name in target DB
  conflictingTextProp?: string; // existing text/select property to rename first
}

const RELATIONS: RelDef[] = [
  // ── Meeting Assets → Meetings
  {
    label:    'Meeting Assets → Meetings',
    sourceDb: DB.meetingAssets,
    prop:     'Meeting',
    targetDb: DB.meetings,
    backRef:  'Assets',
    // Meeting ID (text) stays for dedup — no rename needed, new prop has different name
  },

  // ── Role Assignments → Roles
  {
    label:              'Role Assignments → Roles',
    sourceDb:           DB.roleAssignments,
    prop:               'Role',
    targetDb:           DB.roles,
    backRef:            'Assignments',
    conflictingTextProp: 'Role',
  },

  // ── Role Assignments → Profiles (Role Holder)
  {
    label:              'Role Assignments → Profiles (Role Holder)',
    sourceDb:           DB.roleAssignments,
    prop:               'Role Holder',
    targetDb:           DB.profiles,
    backRef:            'Role Assignments',
    conflictingTextProp: 'Role Holder',
  },

  // ── Role Assignments → Circles (Circle)
  {
    label:              'Role Assignments → Circles',
    sourceDb:           DB.roleAssignments,
    prop:               'Circle',
    targetDb:           DB.circles,
    backRef:            'Role Assignments',
    conflictingTextProp: 'Circle',
  },

  // ── Roles → Circles
  {
    label:              'Roles → Circles',
    sourceDb:           DB.roles,
    prop:               'Circle',
    targetDb:           DB.circles,
    backRef:            'Roles',
    conflictingTextProp: 'Circle',
  },

  // ── Profiles → Roles (Primary Role)
  {
    label:              'Profiles → Roles (Primary Role)',
    sourceDb:           DB.profiles,
    prop:               'Primary Role',
    targetDb:           DB.roles,
    backRef:            'Profile Holders',
    conflictingTextProp: 'Primary Role',
  },

  // ── Profiles → Circles (Circle Memberships — distinct from Circle Affiliation multiselect)
  {
    label:    'Profiles → Circles (Circle Memberships)',
    sourceDb: DB.profiles,
    prop:     'Circle Memberships',
    targetDb: DB.circles,
    backRef:  'Circle Members',
    // No conflict — new property name
  },

  // ── Circles → Profiles (Circle Lead)
  {
    label:              'Circles → Profiles (Circle Lead)',
    sourceDb:           DB.circles,
    prop:               'Circle Lead',
    targetDb:           DB.profiles,
    backRef:            'Circles Led',
    conflictingTextProp: 'Circle Lead',
  },

  // ── Circles → Circles (Parent Circle — self-relation)
  {
    label:              'Circles → Circles (Parent Circle)',
    sourceDb:           DB.circles,
    prop:               'Parent Circle',
    targetDb:           DB.circles,
    backRef:            'Sub-Circles',
    conflictingTextProp: 'Parent Circle',
  },

  // ── Projects → Circles
  {
    label:              'Projects → Circles',
    sourceDb:           DB.projects,
    prop:               'Circle',
    targetDb:           DB.circles,
    backRef:            'Projects',
    conflictingTextProp: 'Circle',
  },

  // ── Projects → Profiles (Project Lead)
  {
    label:              'Projects → Profiles (Project Lead)',
    sourceDb:           DB.projects,
    prop:               'Project Lead',
    targetDb:           DB.profiles,
    backRef:            'Projects Led',
    conflictingTextProp: 'Project Lead',
  },

  // ── Tasks → Profiles (Owner)
  {
    label:              'Tasks → Profiles (Owner)',
    sourceDb:           DB.tasks,
    prop:               'Owner',
    targetDb:           DB.profiles,
    backRef:            'Tasks',
    conflictingTextProp: 'Owner',
  },

  // ── Decision Candidates → Profiles (Decision Maker)
  {
    label:              'Decision Candidates → Profiles (Decision Maker)',
    sourceDb:           DB.decisionCandidates,
    prop:               'Decision Maker',
    targetDb:           DB.profiles,
    backRef:            'Decisions Made',
    conflictingTextProp: 'Decision Maker',
  },

  // ── Decision Candidates → Profiles (Reviewer)
  {
    label:              'Decision Candidates → Profiles (Reviewer)',
    sourceDb:           DB.decisionCandidates,
    prop:               'Reviewer',
    targetDb:           DB.profiles,
    backRef:            'Decisions to Review',
    conflictingTextProp: 'Reviewer',
  },

  // ── Risks → Profiles (Owner)
  {
    label:              'Risks → Profiles (Owner)',
    sourceDb:           DB.risks,
    prop:               'Owner',
    targetDb:           DB.profiles,
    backRef:            'Risks Owned',
    conflictingTextProp: 'Owner',
  },

  // ── Memory Review Queue → Profiles (Reviewer)
  {
    label:              'Memory Review Queue → Profiles (Reviewer)',
    sourceDb:           DB.memoryReviewQueue,
    prop:               'Reviewer',
    targetDb:           DB.profiles,
    backRef:            'Memories to Review',
    conflictingTextProp: 'Reviewer',
  },

  // ── Canon Change Requests → Profiles (Reviewer)
  {
    label:              'Canon Change Requests → Profiles (Reviewer)',
    sourceDb:           DB.canonChangeRequests,
    prop:               'Reviewer',
    targetDb:           DB.profiles,
    backRef:            'Canon Changes to Review',
    conflictingTextProp: 'Reviewer',
  },

  // ── Canon Change Requests → Profiles (Implemented By)
  {
    label:              'Canon Change Requests → Profiles (Implemented By)',
    sourceDb:           DB.canonChangeRequests,
    prop:               'Implemented By',
    targetDb:           DB.profiles,
    backRef:            'Canon Changes Implemented',
    conflictingTextProp: 'Implemented By',
  },

  // ── CCOS Ledger → Circles
  {
    label:              'CCOS Ledger → Circles',
    sourceDb:           DB.ccosLedgerEntries,
    prop:               'Circle',
    targetDb:           DB.circles,
    backRef:            'Ledger Entries',
    conflictingTextProp: 'Circle',
  },

  // ── CCOS Ledger → Roles
  {
    label:              'CCOS Ledger → Roles',
    sourceDb:           DB.ccosLedgerEntries,
    prop:               'Role',
    targetDb:           DB.roles,
    backRef:            'Ledger Entries',
    conflictingTextProp: 'Role',
  },

  // ── CCOS Ledger → Profiles (Approved By)
  {
    label:              'CCOS Ledger → Profiles (Approved By)',
    sourceDb:           DB.ccosLedgerEntries,
    prop:               'Approved By',
    targetDb:           DB.profiles,
    backRef:            'Ledger Approvals',
    conflictingTextProp: 'Approved By',
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Pass 1 — rename conflicting text properties`);
  console.log('═'.repeat(60));

  for (const rel of RELATIONS) {
    if (!rel.conflictingTextProp) continue;
    const textName = `${rel.conflictingTextProp} (text)`;
    process.stdout.write(`  ${rel.label} — rename '${rel.conflictingTextProp}' → '${textName}'\n`);
    try {
      await renameProp(rel.sourceDb, rel.conflictingTextProp, textName);
    } catch (err) {
      console.error(`    ✗ ${err}`);
    }
    // Small delay to avoid Notion rate limits
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Pass 2 — create relation properties`);
  console.log('═'.repeat(60));

  // Collect { rel, syncedId } for back-ref renaming
  const backRefs: Array<{ rel: RelDef; syncedId: string }> = [];

  for (const rel of RELATIONS) {
    process.stdout.write(`  ${rel.label}\n`);
    try {
      const result = await addRelation(rel.sourceDb, rel.prop, rel.targetDb);
      if (result) backRefs.push({ rel, syncedId: result.syncedId });
    } catch (err) {
      console.error(`    ✗ ${err}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Pass 3 — rename back-ref properties in target databases`);
  console.log('═'.repeat(60));

  for (const { rel, syncedId } of backRefs) {
    process.stdout.write(`  Back-ref for '${rel.label}' → '${rel.backRef}'\n`);
    try {
      await renameBackRef(rel.targetDb, syncedId, rel.backRef);
    } catch (err) {
      console.error(`    ✗ ${err}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n✓ Done.\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
