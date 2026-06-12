/**
 * Wires up all cross-database relation properties for the Verdana Notion workspace.
 *
 * All DB IDs are the Verdana values (hardcoded here since they're not secrets).
 * NOTION_API_KEY must be set in the environment.
 *
 * Safe to re-run: every step is idempotent.
 *
 * Usage: NOTION_API_KEY=ntn_... npx ts-node scripts/setup-verdana-relations.ts
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

// ─── Verdana DB IDs ───────────────────────────────────────────────────────────

const DB = {
  meetings:            '088130aa-ffa3-836b-a8d7-01518d9c30b2',
  meetingAssets:       'c48130aa-ffa3-82db-a9c4-8175a128b97a',
  tasks:               '9a6130aa-ffa3-8367-92a5-01649e5af8a0',
  projects:            'fc6130aa-ffa3-83e6-bed7-012745397ccd',
  decisionCandidates:  '40d130aa-ffa3-826c-a01b-011c90face9e',
  risks:               'a8d130aa-ffa3-8332-8865-010f0a4a2182',
  memoryReviewQueue:   'd0c130aa-ffa3-82c9-b671-81fbaa73c18e',
  canonChangeRequests: 'ae9130aa-ffa3-8351-a2d9-818e19e19d38',
  ccosLedgerEntries:   '723130aa-ffa3-83bf-bd41-81180a93544d',
  circles:             '860130aa-ffa3-83c5-8112-81fd24a80e3b',
  roles:               '4ed130aa-ffa3-8365-95df-01829ffe6c3a',
  roleAssignments:     '092130aa-ffa3-8272-9f6f-01bec2e87cb0',
  profiles:            '61d130aa-ffa3-83c5-8a57-01605d7d04c4',
  sensitiveReview:     'bb5130aa-ffa3-827c-8668-8142dc224ccd',
  tensions:            '37b130aa-ffa3-81f2-97df-d8cc4731ded6',
  commitments:         '37b130aa-ffa3-8144-ad74-d4b86a0ac80a',
  gratitudes:          '37b130aa-ffa3-81c0-912b-cec762cb3c0b',
  events:              '37b130aa-ffa3-810d-b398-cc8bc2ad1aa6',
  retrospectives:      '37b130aa-ffa3-81a3-bebf-c58c8e66ab03',
  resources:           '37b130aa-ffa3-813a-bee9-d927ec7e2dd5',
};

// ─── API helpers ──────────────────────────────────────────────────────────────

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function getProps(dbId: string): Promise<Record<string, any>> {
  const r = await fetch(`${BASE}/databases/${dbId}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${dbId}: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).properties ?? {};
}

async function patchDb(dbId: string, properties: Record<string, any>): Promise<any> {
  const r = await fetch(`${BASE}/databases/${dbId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ properties }),
  });
  if (!r.ok) throw new Error(`PATCH ${dbId}: ${r.status} ${await r.text()}`);
  return (await r.json()) as any;
}

async function renameProperty(dbId: string, oldName: string, newName: string): Promise<void> {
  const props = await getProps(dbId);
  if (!props[oldName]) { return; }
  if (props[newName])   { return; }
  await patchDb(dbId, { [oldName]: { name: newName } });
  console.log(`    renamed '${oldName}' -> '${newName}'`);
}

async function deleteProperty(dbId: string, propName: string): Promise<void> {
  const props = await getProps(dbId);
  if (!props[propName]) { return; }
  await patchDb(dbId, { [propName]: null });
  console.log(`    deleted '${propName}'`);
}

async function addRelation(
  sourceDb: string,
  prop: string,
  targetDb: string,
  backRef: string,
  dual = true,
): Promise<void> {
  const props = await getProps(sourceDb);
  if (props[prop]?.type === 'relation') {
    console.log(`    skip '${prop}' — already exists`);
    return;
  }
  if (props[prop]) {
    console.log(`    skip '${prop}' — property exists (${props[prop].type}), not a relation — rename first`);
    return;
  }

  const relDef = dual
    ? { database_id: targetDb, type: 'dual_property', dual_property: {} }
    : { database_id: targetDb, type: 'single_property', single_property: {} };

  const result = await patchDb(sourceDb, {
    [prop]: { relation: relDef },
  });

  const newProp = result.properties?.[prop];
  if (!newProp || newProp.type !== 'relation') {
    console.log(`    WARNING: '${prop}' relation may not have been created`);
    return;
  }

  if (dual) {
    const syncedId = newProp.relation?.dual_property?.synced_property_id;
    if (syncedId) {
      await patchDb(targetDb, { [syncedId]: { name: backRef } });
      console.log(`    created '${prop}' -> back-ref '${backRef}'`);
    } else {
      console.log(`    created '${prop}' (back-ref id not returned)`);
    }
  } else {
    console.log(`    created '${prop}' (single_property, no back-ref)`);
  }
}

async function addSelect(dbId: string, prop: string, options: string[]): Promise<void> {
  const props = await getProps(dbId);
  if (props[prop]) {
    console.log(`    skip '${prop}' — already exists`);
    return;
  }
  await patchDb(dbId, {
    [prop]: { select: { options: options.map(name => ({ name })) } },
  });
  console.log(`    added select '${prop}'`);
}

async function addRollup(
  dbId: string,
  propName: string,
  relationPropName: string,
  rollupPropName: string,
  fn: string,
): Promise<void> {
  const props = await getProps(dbId);
  if (props[propName]?.type === 'rollup') { console.log(`    skip '${propName}' — rollup already exists`); return; }
  if (props[propName]) { console.log(`    skip '${propName}' — property exists (type: ${props[propName].type})`); return; }
  try {
    await patchDb(dbId, { [propName]: { rollup: { relation_property_name: relationPropName, rollup_property_name: rollupPropName, function: fn } } });
    console.log(`    created rollup '${propName}'`);
  } catch (err) {
    console.warn(`    WARNING: '${propName}' rollup failed — set up manually in Notion UI: ${err}`);
  }
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${label}\n`);
  try {
    await fn();
    await new Promise(r => setTimeout(r, 350));
  } catch (err) {
    console.error(`  FAILED: ${err}`);
  }
}

function phase(n: number, title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Phase ${n} — ${title}`);
  console.log('─'.repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('Verdana — wiring all cross-database relations');
  console.log('='.repeat(60));

  // ── Phase 1: Meeting Assets ─────────────────────────────────────────────────
  phase(1, 'Meeting Assets');

  await step('Meeting Assets: add Meeting -> Meetings', () =>
    addRelation(DB.meetingAssets, 'Meeting', DB.meetings, 'Assets'));

  // ── Phase 2: Meetings ───────────────────────────────────────────────────────
  phase(2, 'Meetings');

  await step('Meetings: rename Participants -> Participants Text', () =>
    renameProperty(DB.meetings, 'Participants', 'Participants Text'));

  await step('Meetings: add Participants -> Profiles (back-ref: Meetings Attended)', () =>
    addRelation(DB.meetings, 'Participants', DB.profiles, 'Meetings Attended'));

  await step('Meetings: rename Organizer -> Organizer Email', () =>
    renameProperty(DB.meetings, 'Organizer', 'Organizer Email'));

  await step('Meetings: add Organizer -> Profiles (back-ref: Meetings Organized)', () =>
    addRelation(DB.meetings, 'Organizer', DB.profiles, 'Meetings Organized'));

  await step('Meetings: add Related Circles -> Circles', () =>
    addRelation(DB.meetings, 'Related Circles', DB.circles, 'Meeting Circles'));

  // ── Phase 3: Tasks ──────────────────────────────────────────────────────────
  phase(3, 'Tasks');

  await step('Tasks: rename Owner -> Owner Text (if exists)', () =>
    renameProperty(DB.tasks, 'Owner', 'Owner Text'));

  await step('Tasks: add Owner -> Profiles (back-ref: Tasks Owned)', () =>
    addRelation(DB.tasks, 'Owner', DB.profiles, 'Tasks Owned'));

  await step('Tasks: add Project -> Projects (back-ref: Tasks)', () =>
    addRelation(DB.tasks, 'Project', DB.projects, 'Tasks'));

  await step('Tasks: add Meeting -> Meetings (back-ref: Meeting Tasks)', () =>
    addRelation(DB.tasks, 'Meeting', DB.meetings, 'Meeting Tasks'));

  await step('Tasks: add Related Circles -> Circles', () =>
    addRelation(DB.tasks, 'Related Circles', DB.circles, 'Circle Tasks'));

  await step('Tasks: delete Owner Text (cleanup)', () =>
    deleteProperty(DB.tasks, 'Owner Text'));

  // ── Phase 4: Projects ───────────────────────────────────────────────────────
  phase(4, 'Projects');

  await step('Projects: rename Project Lead -> Project Lead Text (if exists)', () =>
    renameProperty(DB.projects, 'Project Lead', 'Project Lead Text'));

  await step('Projects: add Project Lead -> Profiles (back-ref: Projects Led)', () =>
    addRelation(DB.projects, 'Project Lead', DB.profiles, 'Projects Led'));

  await step('Projects: rename Circle -> Circle Text (if exists)', () =>
    renameProperty(DB.projects, 'Circle', 'Circle Text'));

  await step('Projects: add Circle -> Circles (back-ref: Projects)', () =>
    addRelation(DB.projects, 'Circle', DB.circles, 'Projects'));

  await step('Projects: delete Project Lead Text (cleanup)', () =>
    deleteProperty(DB.projects, 'Project Lead Text'));

  await step('Projects: delete Circle Text (cleanup)', () =>
    deleteProperty(DB.projects, 'Circle Text'));

  // ── Phase 5: Decision Candidates ────────────────────────────────────────────
  phase(5, 'Decision Candidates');

  await step('Decision Candidates: rename Decision Maker -> Decision Maker Text', () =>
    renameProperty(DB.decisionCandidates, 'Decision Maker', 'Decision Maker Text'));

  await step('Decision Candidates: add Decision Maker -> Profiles (back-ref: Decisions Made)', () =>
    addRelation(DB.decisionCandidates, 'Decision Maker', DB.profiles, 'Decisions Made'));

  await step('Decision Candidates: rename Reviewer -> Reviewer Text', () =>
    renameProperty(DB.decisionCandidates, 'Reviewer', 'Reviewer Text'));

  await step('Decision Candidates: add Reviewer -> Profiles (back-ref: Decisions to Review)', () =>
    addRelation(DB.decisionCandidates, 'Reviewer', DB.profiles, 'Decisions to Review'));

  await step('Decision Candidates: add Meeting -> Meetings (back-ref: Decisions)', () =>
    addRelation(DB.decisionCandidates, 'Meeting', DB.meetings, 'Decisions'));

  await step('Decision Candidates: add Related Circles -> Circles', () =>
    addRelation(DB.decisionCandidates, 'Related Circles', DB.circles, 'Circle Decisions'));

  await step('Decision Candidates: delete Decision Maker Text (cleanup)', () =>
    deleteProperty(DB.decisionCandidates, 'Decision Maker Text'));

  await step('Decision Candidates: delete Reviewer Text (cleanup)', () =>
    deleteProperty(DB.decisionCandidates, 'Reviewer Text'));

  // ── Phase 6: Risks ──────────────────────────────────────────────────────────
  phase(6, 'Risks');

  await step('Risks: rename Owner -> Owner Text', () =>
    renameProperty(DB.risks, 'Owner', 'Owner Text'));

  await step('Risks: add Owner -> Profiles (back-ref: Owned Risks)', () =>
    addRelation(DB.risks, 'Owner', DB.profiles, 'Owned Risks'));

  await step('Risks: add Meeting -> Meetings (back-ref: Meeting Risks)', () =>
    addRelation(DB.risks, 'Meeting', DB.meetings, 'Meeting Risks'));

  await step('Risks: add Related Circles -> Circles', () =>
    addRelation(DB.risks, 'Related Circles', DB.circles, 'Circle Risks'));

  await step('Risks: delete Owner Text (cleanup)', () =>
    deleteProperty(DB.risks, 'Owner Text'));

  // ── Phase 7: Memory Review Queue ────────────────────────────────────────────
  phase(7, 'Memory Review Queue');

  await step('Memory Review Queue: rename Reviewer -> Reviewer Text', () =>
    renameProperty(DB.memoryReviewQueue, 'Reviewer', 'Reviewer Text'));

  await step('Memory Review Queue: add Reviewer -> Profiles (back-ref: Memories to Review)', () =>
    addRelation(DB.memoryReviewQueue, 'Reviewer', DB.profiles, 'Memories to Review'));

  await step('Memory Review Queue: add Meeting -> Meetings (back-ref: Memory Candidates)', () =>
    addRelation(DB.memoryReviewQueue, 'Meeting', DB.meetings, 'Memory Candidates'));

  await step('Memory Review Queue: add Related Profiles -> Profiles', () =>
    addRelation(DB.memoryReviewQueue, 'Related Profiles', DB.profiles, 'Memory Reviews'));

  await step('Memory Review Queue: delete Reviewer Text (cleanup)', () =>
    deleteProperty(DB.memoryReviewQueue, 'Reviewer Text'));

  // ── Phase 8: Canon Change Requests ──────────────────────────────────────────
  phase(8, 'Canon Change Requests');

  await step('Canon Change Requests: rename Reviewer -> Reviewer Text', () =>
    renameProperty(DB.canonChangeRequests, 'Reviewer', 'Reviewer Text'));

  await step('Canon Change Requests: add Reviewer -> Profiles (back-ref: Canon Reviews)', () =>
    addRelation(DB.canonChangeRequests, 'Reviewer', DB.profiles, 'Canon Reviews'));

  await step('Canon Change Requests: rename Implemented By -> Implemented By Text', () =>
    renameProperty(DB.canonChangeRequests, 'Implemented By', 'Implemented By Text'));

  await step('Canon Change Requests: add Implemented By -> Profiles (back-ref: Canon Changes Implemented)', () =>
    addRelation(DB.canonChangeRequests, 'Implemented By', DB.profiles, 'Canon Changes Implemented'));

  await step('Canon Change Requests: add Related Circles -> Circles', () =>
    addRelation(DB.canonChangeRequests, 'Related Circles', DB.circles, 'Circle Canon Changes'));

  await step('Canon Change Requests: delete Reviewer Text (cleanup)', () =>
    deleteProperty(DB.canonChangeRequests, 'Reviewer Text'));

  await step('Canon Change Requests: delete Implemented By Text (cleanup)', () =>
    deleteProperty(DB.canonChangeRequests, 'Implemented By Text'));

  // ── Phase 9: CCOS Ledger Entries ────────────────────────────────────────────
  phase(9, 'CCOS Ledger Entries');

  await step('CCOS Ledger: rename Circle -> Circle Text', () =>
    renameProperty(DB.ccosLedgerEntries, 'Circle', 'Circle Text'));

  await step('CCOS Ledger: add Circle -> Circles (back-ref: Ledger Entries)', () =>
    addRelation(DB.ccosLedgerEntries, 'Circle', DB.circles, 'Ledger Entries'));

  await step('CCOS Ledger: rename Role -> Role Text', () =>
    renameProperty(DB.ccosLedgerEntries, 'Role', 'Role Text'));

  await step('CCOS Ledger: add Role -> Roles (back-ref: Ledger Entries)', () =>
    addRelation(DB.ccosLedgerEntries, 'Role', DB.roles, 'Ledger Entries'));

  await step('CCOS Ledger: rename Approved By -> Approved By Text', () =>
    renameProperty(DB.ccosLedgerEntries, 'Approved By', 'Approved By Text'));

  await step('CCOS Ledger: add Approved By -> Profiles (back-ref: Ledger Approvals)', () =>
    addRelation(DB.ccosLedgerEntries, 'Approved By', DB.profiles, 'Ledger Approvals'));

  await step('CCOS Ledger: delete Circle Text (cleanup)', () =>
    deleteProperty(DB.ccosLedgerEntries, 'Circle Text'));

  await step('CCOS Ledger: delete Role Text (cleanup)', () =>
    deleteProperty(DB.ccosLedgerEntries, 'Role Text'));

  await step('CCOS Ledger: delete Approved By Text (cleanup)', () =>
    deleteProperty(DB.ccosLedgerEntries, 'Approved By Text'));

  // ── Phase 10: Circles ───────────────────────────────────────────────────────
  phase(10, 'Circles');

  await step('Circles: rename Circle Lead -> Circle Lead Text', () =>
    renameProperty(DB.circles, 'Circle Lead', 'Circle Lead Text'));

  await step('Circles: add Circle Lead -> Profiles (back-ref: Circles Led)', () =>
    addRelation(DB.circles, 'Circle Lead', DB.profiles, 'Circles Led'));

  await step('Circles: rename Parent Circle -> Parent Circle Text', () =>
    renameProperty(DB.circles, 'Parent Circle', 'Parent Circle Text'));

  await step('Circles: add Parent Circle -> Circles self-relation (back-ref: Sub-circles)', () =>
    addRelation(DB.circles, 'Parent Circle', DB.circles, 'Sub-circles'));

  await step('Circles: add Rep Steward -> Profiles (single)', () =>
    addRelation(DB.circles, 'Rep Steward', DB.profiles, 'Circles as Rep Steward', false));

  await step('Circles: delete Circle Lead Text (cleanup)', () =>
    deleteProperty(DB.circles, 'Circle Lead Text'));

  await step('Circles: delete Parent Circle Text (cleanup)', () =>
    deleteProperty(DB.circles, 'Parent Circle Text'));

  // ── Phase 11: Roles ─────────────────────────────────────────────────────────
  phase(11, 'Roles');

  await step('Roles: rename Circle -> Circle Text', () =>
    renameProperty(DB.roles, 'Circle', 'Circle Text'));

  await step('Roles: add Circle -> Circles (back-ref: Circle Roles)', () =>
    addRelation(DB.roles, 'Circle', DB.circles, 'Circle Roles'));

  await step('Roles: delete Circle Text (cleanup)', () =>
    deleteProperty(DB.roles, 'Circle Text'));

  // ── Phase 12: Role Assignments ──────────────────────────────────────────────
  phase(12, 'Role Assignments');

  await step('Role Assignments: rename Role -> Role Text', () =>
    renameProperty(DB.roleAssignments, 'Role', 'Role Text'));

  await step('Role Assignments: add Role -> Roles (back-ref: Role Assignments)', () =>
    addRelation(DB.roleAssignments, 'Role', DB.roles, 'Role Assignments'));

  await step('Role Assignments: rename Role Holder -> Role Holder Text', () =>
    renameProperty(DB.roleAssignments, 'Role Holder', 'Role Holder Text'));

  await step('Role Assignments: add Role Holder -> Profiles (back-ref: Role Assignments)', () =>
    addRelation(DB.roleAssignments, 'Role Holder', DB.profiles, 'Role Assignments'));

  await step('Role Assignments: rename Circle -> Circle Text', () =>
    renameProperty(DB.roleAssignments, 'Circle', 'Circle Text'));

  await step('Role Assignments: add Circle -> Circles (back-ref: Circle Assignments)', () =>
    addRelation(DB.roleAssignments, 'Circle', DB.circles, 'Circle Assignments'));

  await step('Role Assignments: add Energization Level select', () =>
    addSelect(DB.roleAssignments, 'Energization Level', ['Full', 'Partial', 'Flagging', 'Seeking Successor']));

  await step('Role Assignments: delete Role Text (cleanup)', () =>
    deleteProperty(DB.roleAssignments, 'Role Text'));

  await step('Role Assignments: delete Role Holder Text (cleanup)', () =>
    deleteProperty(DB.roleAssignments, 'Role Holder Text'));

  await step('Role Assignments: delete Circle Text (cleanup)', () =>
    deleteProperty(DB.roleAssignments, 'Circle Text'));

  // ── Phase 13: Profiles ──────────────────────────────────────────────────────
  phase(13, 'Profiles');

  await step('Profiles: add Organization -> Profiles self-relation (back-ref: Members)', () =>
    addRelation(DB.profiles, 'Organization', DB.profiles, 'Members'));

  await step('Profiles: add Referred By -> Profiles self-relation (back-ref: Referred Others)', () =>
    addRelation(DB.profiles, 'Referred By', DB.profiles, 'Referred Others'));

  await step('Profiles: rename Role at Amora -> Role at Amora Text (if exists)', () =>
    renameProperty(DB.profiles, 'Role at Amora', 'Role at Amora Text'));

  await step('Profiles: add Role at Amora -> Roles (back-ref: Role Holders)', () =>
    addRelation(DB.profiles, 'Role at Amora', DB.roles, 'Role Holders'));

  await step('Profiles: add Circle Memberships -> Circles (back-ref: Circle Members)', () =>
    addRelation(DB.profiles, 'Circle Memberships', DB.circles, 'Circle Members'));

  await step('Profiles: add Membership Type select', () =>
    addSelect(DB.profiles, 'Membership Type', [
      'Founding Member', 'Full Member', 'Associate Member', 'Guest', 'Steward', 'Partner',
    ]));

  await step('Profiles: delete Role at Amora Text (cleanup)', () =>
    deleteProperty(DB.profiles, 'Role at Amora Text'));

  // ── Phase 14: Sensitive Review ──────────────────────────────────────────────
  phase(14, 'Sensitive Review');

  // Delete richText Reviewed By (if exists from template), then add relation
  await step('Sensitive Review: delete Reviewed By (richText) if exists', () =>
    deleteProperty(DB.sensitiveReview, 'Reviewed By'));

  await step('Sensitive Review: add Reviewed By -> Profiles (single)', () =>
    addRelation(DB.sensitiveReview, 'Reviewed By', DB.profiles, 'Sensitive Reviews', false));

  await step('Sensitive Review: add Related People -> Profiles', () =>
    addRelation(DB.sensitiveReview, 'Related People', DB.profiles, 'Sensitive Mentions'));

  // ── Phase 15: Tensions ──────────────────────────────────────────────────────
  phase(15, 'Tensions');

  await step('Tensions: rename Sensed By -> Sensed By Text', () =>
    renameProperty(DB.tensions, 'Sensed By', 'Sensed By Text'));
  await step('Tensions: add Sensed By -> Profiles (dual)', () =>
    addRelation(DB.tensions, 'Sensed By', DB.profiles, 'Tensions Sensed'));

  await step('Tensions: rename Sensing Circle -> Sensing Circle Text', () =>
    renameProperty(DB.tensions, 'Sensing Circle', 'Sensing Circle Text'));
  await step('Tensions: add Sensing Circle -> Circles (dual)', () =>
    addRelation(DB.tensions, 'Sensing Circle', DB.circles, 'Circle Tensions'));

  await step('Tensions: add Meeting -> Meetings (dual)', () =>
    addRelation(DB.tensions, 'Meeting', DB.meetings, 'Meeting Tensions'));
  await step('Tensions: add Resulting Decision -> Decision Candidates (dual)', () =>
    addRelation(DB.tensions, 'Resulting Decision', DB.decisionCandidates, 'Source Tensions'));
  await step('Tensions: add Related Tasks -> Tasks (dual)', () =>
    addRelation(DB.tensions, 'Related Tasks', DB.tasks, 'Related Tensions'));

  await step('Tensions: delete Sensed By Text (cleanup)', () =>
    deleteProperty(DB.tensions, 'Sensed By Text'));
  await step('Tensions: delete Sensing Circle Text (cleanup)', () =>
    deleteProperty(DB.tensions, 'Sensing Circle Text'));

  // ── Phase 16: Commitments ───────────────────────────────────────────────────
  phase(16, 'Commitments');

  await step('Commitments: rename Parties -> Parties Text', () =>
    renameProperty(DB.commitments, 'Parties', 'Parties Text'));
  await step('Commitments: add Parties -> Profiles (dual)', () =>
    addRelation(DB.commitments, 'Parties', DB.profiles, 'Commitments'));

  await step('Commitments: rename Circles -> Circles Text', () =>
    renameProperty(DB.commitments, 'Circles', 'Circles Text'));
  await step('Commitments: add Circles -> Circles (dual)', () =>
    addRelation(DB.commitments, 'Circles', DB.circles, 'Circle Commitments'));

  await step('Commitments: add Source Meeting -> Meetings (dual)', () =>
    addRelation(DB.commitments, 'Source Meeting', DB.meetings, 'Meeting Commitments'));
  await step('Commitments: add Source Decision -> Decision Candidates (dual)', () =>
    addRelation(DB.commitments, 'Source Decision', DB.decisionCandidates, 'Resulting Commitments'));

  await step('Commitments: delete Parties Text (cleanup)', () =>
    deleteProperty(DB.commitments, 'Parties Text'));
  await step('Commitments: delete Circles Text (cleanup)', () =>
    deleteProperty(DB.commitments, 'Circles Text'));

  // ── Phase 17: Gratitudes ────────────────────────────────────────────────────
  phase(17, 'Gratitudes');

  await step('Gratitudes: rename From -> From Text', () =>
    renameProperty(DB.gratitudes, 'From', 'From Text'));
  await step('Gratitudes: add From -> Profiles (dual)', () =>
    addRelation(DB.gratitudes, 'From', DB.profiles, 'Gratitudes Given'));

  await step('Gratitudes: rename To -> To Text', () =>
    renameProperty(DB.gratitudes, 'To', 'To Text'));
  await step('Gratitudes: add To -> Profiles (dual)', () =>
    addRelation(DB.gratitudes, 'To', DB.profiles, 'Gratitudes Received'));

  await step('Gratitudes: rename Circle -> Circle Text', () =>
    renameProperty(DB.gratitudes, 'Circle', 'Circle Text'));
  await step('Gratitudes: add Circle -> Circles (dual)', () =>
    addRelation(DB.gratitudes, 'Circle', DB.circles, 'Circle Gratitudes'));

  await step('Gratitudes: add Meeting -> Meetings (dual)', () =>
    addRelation(DB.gratitudes, 'Meeting', DB.meetings, 'Meeting Gratitudes'));

  await step('Gratitudes: delete From Text (cleanup)', () =>
    deleteProperty(DB.gratitudes, 'From Text'));
  await step('Gratitudes: delete To Text (cleanup)', () =>
    deleteProperty(DB.gratitudes, 'To Text'));
  await step('Gratitudes: delete Circle Text (cleanup)', () =>
    deleteProperty(DB.gratitudes, 'Circle Text'));

  // ── Phase 18: Events ────────────────────────────────────────────────────────
  phase(18, 'Events');

  await step('Events: rename Organizer -> Organizer Text', () =>
    renameProperty(DB.events, 'Organizer', 'Organizer Text'));
  await step('Events: add Organizer -> Profiles (dual)', () =>
    addRelation(DB.events, 'Organizer', DB.profiles, 'Events Organized'));

  await step('Events: rename Organizing Circle -> Organizing Circle Text', () =>
    renameProperty(DB.events, 'Organizing Circle', 'Organizing Circle Text'));
  await step('Events: add Organizing Circle -> Circles (dual)', () =>
    addRelation(DB.events, 'Organizing Circle', DB.circles, 'Circle Events'));

  await step('Events: delete Organizer Text (cleanup)', () =>
    deleteProperty(DB.events, 'Organizer Text'));
  await step('Events: delete Organizing Circle Text (cleanup)', () =>
    deleteProperty(DB.events, 'Organizing Circle Text'));

  // ── Phase 19: Retrospectives ─────────────────────────────────────────────────
  phase(19, 'Retrospectives');

  await step('Retrospectives: rename Circle -> Circle Text', () =>
    renameProperty(DB.retrospectives, 'Circle', 'Circle Text'));
  await step('Retrospectives: add Circle -> Circles (dual)', () =>
    addRelation(DB.retrospectives, 'Circle', DB.circles, 'Circle Retros'));

  await step('Retrospectives: add Meeting -> Meetings (dual)', () =>
    addRelation(DB.retrospectives, 'Meeting', DB.meetings, 'Meeting Retros'));

  await step('Retrospectives: delete Circle Text (cleanup)', () =>
    deleteProperty(DB.retrospectives, 'Circle Text'));

  // ── Phase 20: Resources ──────────────────────────────────────────────────────
  phase(20, 'Resources');

  await step('Resources: rename Steward -> Steward Text', () =>
    renameProperty(DB.resources, 'Steward', 'Steward Text'));
  await step('Resources: add Steward -> Profiles (dual)', () =>
    addRelation(DB.resources, 'Steward', DB.profiles, 'Stewardship'));

  await step('Resources: add Steward Circle -> Circles (dual)', () =>
    addRelation(DB.resources, 'Steward Circle', DB.circles, 'Circle Resources'));

  await step('Resources: delete Steward Text (cleanup)', () =>
    deleteProperty(DB.resources, 'Steward Text'));

  // ── Phase 21: Meeting rollup counts ─────────────────────────────────────────
  phase(21, 'Meeting rollup counts (best-effort)');

  await step('Meetings: add Decisions Count rollup', () =>
    addRollup(DB.meetings, 'Decisions Count', 'Decisions', 'Decision', 'count'));

  await step('Meetings: add Tasks Count rollup', () =>
    addRollup(DB.meetings, 'Tasks Count', 'Meeting Tasks', 'Task', 'count'));

  await step('Meetings: add Risks Count rollup', () =>
    addRollup(DB.meetings, 'Risks Count', 'Meeting Risks', 'Risk', 'count'));

  await step('Meetings: add Memory Candidates Count rollup', () =>
    addRollup(DB.meetings, 'Memory Candidates Count', 'Memory Candidates', 'Proposed Memory', 'count'));

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('Done — all Verdana cross-database relations wired.');
  console.log('='.repeat(60) + '\n');
}

main().catch(err => { console.error(err); process.exit(1); });
