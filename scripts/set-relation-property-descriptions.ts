/**
 * Sets descriptions on all relation and back-ref properties across all databases.
 * Safe to re-run — skips properties that no longer exist.
 *
 * Usage: railway run npx ts-node scripts/set-relation-property-descriptions.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = { Authorization: `Bearer ${NOTION_API_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };

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
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status}`);
  return ((await r.json()) as any).properties ?? {};
}

async function setDesc(dbId: string, props: Record<string, string>) {
  const existing = await getProps(dbId);
  const patch: Record<string, any> = {};
  for (const [name, desc] of Object.entries(props)) {
    if (!existing[name]) { console.log(`    skip '${name}' — not found`); continue; }
    patch[name] = { ...existing[name], description: desc };
  }
  if (Object.keys(patch).length === 0) return;
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ properties: patch }),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
}

const DESCS: Array<[string, Record<string, string>]> = [
  [DB.meetingAssets, {
    Meeting: 'Two-way relation to the parent Meetings record. Enables Notion UI linking and is used by the pipeline for asset dedup.',
  }],

  [DB.meetings, {
    Assets:       'Back-ref: all Meeting Asset records linked to this meeting (Recording, Transcript, Notes). Populated automatically by the pipeline.',
    Participants: 'Linked Profiles records for people present at this meeting. Resolved from participant names in the transcript/notes. Two-way: each profile shows all meetings attended in "Meetings Attended".',
    Organizer:    'Linked Profiles record for the person who organized this meeting. Resolved from the organizer email via the Profiles Email field. Two-way: the profile shows all meetings organized in "Meetings Organized".',
  }],

  [DB.roleAssignments, {
    Role:          'Linked Roles record for this assignment. Two-way: the role shows all its assignments in "Assignments".',
    'Role Holder': 'Linked Profiles record for the person holding this role. Two-way: the profile shows all assignments in "Role Assignments".',
    Circle:        'Linked Circles record for the circle where this assignment is active. Two-way: the circle shows all assignments in "Role Assignments".',
  }],

  [DB.roles, {
    Circle:           'Linked Circles record this role belongs to. Two-way: the circle shows all its roles in "Roles".',
    Assignments:      'Back-ref: all Role Assignments that reference this role (populated automatically).',
    'Profile Holders':'Back-ref: Profiles that list this role in their "Role at Amora" field (populated automatically).',
    'Ledger Entries': 'Back-ref: CCOS Ledger Entries that reference this role (populated automatically).',
  }],

  [DB.circles, {
    'Circle Lead':  'Linked Profiles record for the Lead Steward of this circle. Two-way: the profile shows all circles led in "Circles Led".',
    'Parent Circle':'Linked Circles record for the parent in the CCOS hierarchy. Two-way: the parent shows its children in "Sub-Circles".',
    'Sub-Circles':  'Back-ref: child circles that list this circle as their Parent Circle (populated automatically).',
    Roles:          'Back-ref: all Roles that belong to this circle (populated automatically).',
    'Role Assignments': 'Back-ref: all Role Assignments active in this circle (populated automatically).',
    Projects:       'Back-ref: all Projects associated with this circle (populated automatically).',
    'Ledger Entries':'Back-ref: CCOS Ledger Entries referencing this circle (populated automatically).',
    'Circle Members':'Back-ref: Profiles that list this circle in their Circle Memberships (populated automatically).',
  }],

  [DB.profiles, {
    'Role at Amora':           'Linked Roles record for this person\'s primary role within Amora. Two-way: the role shows all profile holders in "Profile Holders".',
    'Circle Memberships':      'Linked Circles records for the circles this person is a member of. Two-way: each circle shows members in "Circle Members".',
    Organization:              'Linked Profiles record (Organization type) for the org this person belongs to. Two-way: the org shows all its people in "Members".',
    Members:                   'Back-ref: Profiles that list this organization as their Organization (populated automatically).',
    'Referred By':             'Linked Profiles record for the person who introduced this individual to Amora. Two-way: the referrer shows their referrals in "Referrals".',
    Referrals:                 'Back-ref: Profiles that list this person as the one who referred them (populated automatically).',
    'Role Assignments':        'Back-ref: all Role Assignments where this person is the role holder (populated automatically).',
    Tasks:                     'Back-ref: all Tasks assigned to this person (populated automatically).',
    'Decisions Made':          'Back-ref: Decision Candidates where this person is the Decision Maker (populated automatically).',
    'Decisions to Review':     'Back-ref: Decision Candidates assigned to this person for review (populated automatically).',
    'Risks Owned':             'Back-ref: Risks this person is responsible for tracking (populated automatically).',
    'Memories to Review':      'Back-ref: Memory Review Queue items assigned to this person (populated automatically).',
    'Canon Changes to Review': 'Back-ref: Canon Change Requests assigned to this person for review (populated automatically).',
    'Canon Changes Implemented':'Back-ref: Canon Change Requests this person implemented (populated manually after approval).',
    'Ledger Approvals':        'Back-ref: CCOS Ledger Entries approved by this person (populated manually after approval).',
    'Circles Led':             'Back-ref: Circles where this person is the Circle Lead (populated automatically).',
    'Projects Led':            'Back-ref: Projects where this person is the Project Lead (populated automatically).',
    'Meetings Attended':       'Back-ref: Meetings where this person appears in the Participants relation (populated automatically from transcripts/notes).',
    'Meetings Organized':      'Back-ref: Meetings where this person is the Organizer (populated automatically from email headers).',
  }],

  [DB.projects, {
    Circle:        'Linked Circles record for the responsible circle. Two-way: the circle shows all its projects in "Projects".',
    'Project Lead':'Linked Profiles record for the person leading this project. Two-way: the profile shows all projects led in "Projects Led".',
  }],

  [DB.tasks, {
    Owner: 'Linked Profiles record for the person responsible for this task. Two-way: the profile shows all tasks in "Tasks".',
  }],

  [DB.decisionCandidates, {
    'Decision Maker':'Linked Profiles record for the person who made or proposed this decision. Two-way: the profile shows all decisions in "Decisions Made".',
    Reviewer:        'Linked Profiles record for the person assigned to validate this decision. Two-way: the profile shows review assignments in "Decisions to Review".',
  }],

  [DB.risks, {
    Owner: 'Linked Profiles record for the person responsible for tracking and mitigating this risk. Two-way: the profile shows all owned risks in "Risks Owned".',
  }],

  [DB.memoryReviewQueue, {
    Reviewer: 'Linked Profiles record for the person assigned to evaluate this memory candidate. Two-way: the profile shows review assignments in "Memories to Review".',
  }],

  [DB.canonChangeRequests, {
    Reviewer:        'Linked Profiles record for the person who should approve or reject this canon change. Two-way: the profile shows review assignments in "Canon Changes to Review".',
    'Implemented By':'Linked Profiles record for the person who applied this change to the canon document. Set manually after approval. Two-way: the profile shows implemented changes in "Canon Changes Implemented".',
  }],

  [DB.ccosLedgerEntries, {
    Circle:      'Linked Circles record for the circle where this governance action occurred. Two-way: the circle shows all ledger entries in "Ledger Entries".',
    Role:        'Linked Roles record for the role involved in this governance entry. Two-way: the role shows related ledger entries in "Ledger Entries".',
    'Approved By':'Linked Profiles record for the person who approved this ledger entry. Set manually after approval. Two-way: the profile shows approved entries in "Ledger Approvals".',
  }],
];

async function main() {
  console.log(`Updating relation property descriptions…\n`);
  for (const [dbId, props] of DESCS) {
    const name = Object.entries(DB).find(([, id]) => id === dbId)?.[0] ?? dbId;
    process.stdout.write(`  ${name} … `);
    try {
      await setDesc(dbId, props);
      console.log(`✓`);
    } catch (err) {
      console.log(`✗`);
      console.error(`    ${err}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
