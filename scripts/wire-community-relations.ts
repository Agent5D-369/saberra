/**
 * Upgrades all community-layer DB relations from single_property to dual_property,
 * creating the reverse back-ref properties on Profiles, Circles, Meetings, etc.
 *
 * WHAT THIS DOES: Notion single_property relations only go one way. This script
 * deletes each single_property relation and recreates it as dual_property so that,
 * e.g., writing Tension.Sensed By -> Profile automatically populates
 * Profile.Tensions Sensed with no extra code required.
 *
 * WARNING: Upgrading single -> dual requires deleting and recreating the property.
 * Existing relation links in those fields are lost. Run against workspaces with
 * minimal data, or accept the loss for test/setup-phase workspaces.
 *
 * Usage (Amora):
 *   npx ts-node -r dotenv/config scripts/wire-community-relations.ts
 *
 * Usage (Verdana - pass env vars inline or export them first):
 *   NOTION_API_KEY=ntn_... NOTION_DB_TENSIONS=... npx ts-node scripts/wire-community-relations.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const DB = {
  tensions:           process.env.NOTION_DB_TENSIONS ?? '',
  commitments:        process.env.NOTION_DB_COMMITMENTS ?? '',
  gratitudes:         process.env.NOTION_DB_GRATITUDES ?? '',
  events:             process.env.NOTION_DB_EVENTS ?? '',
  retrospectives:     process.env.NOTION_DB_RETROSPECTIVES ?? '',
  resources:          process.env.NOTION_DB_RESOURCES ?? '',
  profiles:           process.env.NOTION_DB_PROFILES ?? '',
  circles:            process.env.NOTION_DB_CIRCLES ?? '',
  meetings:           process.env.NOTION_DB_MEETINGS ?? '',
  decisionCandidates: process.env.NOTION_DB_DECISION_CANDIDATES ?? '',
  tasks:              process.env.NOTION_DB_TASKS ?? '',
};

const missing = Object.entries(DB).filter(([, v]) => !v).map(([k]) => `NOTION_DB_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
if (missing.length) {
  console.error(`Missing env vars:\n${missing.join('\n')}`);
  process.exit(1);
}

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

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Creates a brand-new dual_property relation on sourceDb[prop] -> targetDb.
 * Names the auto-created back-ref property backRef on the target side.
 */
async function createDual(sourceDb: string, prop: string, targetDb: string, backRef: string): Promise<void> {
  const result = await patchDb(sourceDb, {
    [prop]: { relation: { database_id: targetDb, type: 'dual_property', dual_property: {} } },
  });
  const newProp = result.properties?.[prop];
  if (!newProp || newProp.type !== 'relation') {
    console.log(`      WARNING: '${prop}' relation may not have been created`);
    return;
  }
  const syncedId = newProp.relation?.dual_property?.synced_property_id;
  if (syncedId) {
    await patchDb(targetDb, { [syncedId]: { name: backRef } });
    console.log(`      created dual '${prop}' <-> '${backRef}'`);
  } else {
    console.log(`      created dual '${prop}' (synced id not returned - rename '${backRef}' manually)`);
  }
}

/**
 * Upgrades a relation property to dual_property if it isn't already.
 * If the property is currently single_property, deletes then recreates it.
 * Existing relation data in single_property fields will be cleared on deletion.
 */
async function upgradeToDual(sourceDb: string, prop: string, targetDb: string, backRef: string): Promise<void> {
  const props = await getProps(sourceDb);

  if (!props[prop]) {
    await createDual(sourceDb, prop, targetDb, backRef);
    return;
  }

  if (props[prop].type !== 'relation') {
    console.log(`      skip '${prop}' - exists as ${props[prop].type}, not a relation`);
    return;
  }

  if (props[prop].relation?.type === 'dual_property') {
    console.log(`      skip '${prop}' - already dual_property`);
    return;
  }

  // single_property - delete then recreate as dual
  console.log(`      upgrading '${prop}' single->dual (existing links cleared)`);
  await patchDb(sourceDb, { [prop]: null });
  await delay(600);
  await createDual(sourceDb, prop, targetDb, backRef);
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${label}\n`);
  try {
    await fn();
    await delay(350);
  } catch (err) {
    console.error(`  FAILED: ${err}`);
  }
}

function phase(n: number, title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Phase ${n} - ${title}`);
  console.log('─'.repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('Community layer - single -> dual relation upgrades');
  console.log('='.repeat(60));
  console.log('\nWARNING: Existing links in single_property fields will be cleared.');
  console.log('Continuing in 5 seconds... (Ctrl+C to abort)\n');
  await delay(5000);

  // ── Phase 1: Tensions ────────────────────────────────────────────────────────
  phase(1, 'Tensions');

  await step('Sensed By -> Profiles (back-ref: Tensions Sensed)', () =>
    upgradeToDual(DB.tensions, 'Sensed By', DB.profiles, 'Tensions Sensed'));

  await step('Sensing Circle -> Circles (back-ref: Circle Tensions)', () =>
    upgradeToDual(DB.tensions, 'Sensing Circle', DB.circles, 'Circle Tensions'));

  await step('Meeting -> Meetings (back-ref: Meeting Tensions)', () =>
    upgradeToDual(DB.tensions, 'Meeting', DB.meetings, 'Meeting Tensions'));

  await step('Resulting Decision -> Decision Candidates (back-ref: Source Tensions)', () =>
    upgradeToDual(DB.tensions, 'Resulting Decision', DB.decisionCandidates, 'Source Tensions'));

  await step('Related Tasks -> Tasks (NEW; back-ref: Related Tensions)', () =>
    upgradeToDual(DB.tensions, 'Related Tasks', DB.tasks, 'Related Tensions'));

  // ── Phase 2: Commitments ─────────────────────────────────────────────────────
  phase(2, 'Commitments / Agreements');

  await step('Parties -> Profiles (back-ref: Commitments)', () =>
    upgradeToDual(DB.commitments, 'Parties', DB.profiles, 'Commitments'));

  await step('Circles -> Circles (back-ref: Circle Commitments)', () =>
    upgradeToDual(DB.commitments, 'Circles', DB.circles, 'Circle Commitments'));

  await step('Source Meeting -> Meetings (back-ref: Meeting Commitments)', () =>
    upgradeToDual(DB.commitments, 'Source Meeting', DB.meetings, 'Meeting Commitments'));

  await step('Source Decision -> Decision Candidates (back-ref: Resulting Commitments)', () =>
    upgradeToDual(DB.commitments, 'Source Decision', DB.decisionCandidates, 'Resulting Commitments'));

  // ── Phase 3: Gratitudes ──────────────────────────────────────────────────────
  phase(3, 'Gratitudes');

  await step('From -> Profiles (back-ref: Gratitudes Given)', () =>
    upgradeToDual(DB.gratitudes, 'From', DB.profiles, 'Gratitudes Given'));

  await step('To -> Profiles (back-ref: Gratitudes Received)', () =>
    upgradeToDual(DB.gratitudes, 'To', DB.profiles, 'Gratitudes Received'));

  await step('Circle -> Circles (back-ref: Circle Gratitudes)', () =>
    upgradeToDual(DB.gratitudes, 'Circle', DB.circles, 'Circle Gratitudes'));

  await step('Meeting -> Meetings (back-ref: Meeting Gratitudes)', () =>
    upgradeToDual(DB.gratitudes, 'Meeting', DB.meetings, 'Meeting Gratitudes'));

  // ── Phase 4: Events ──────────────────────────────────────────────────────────
  phase(4, 'Events');

  await step('Organizer -> Profiles (back-ref: Events Organized)', () =>
    upgradeToDual(DB.events, 'Organizer', DB.profiles, 'Events Organized'));

  await step('Organizing Circle -> Circles (back-ref: Circle Events)', () =>
    upgradeToDual(DB.events, 'Organizing Circle', DB.circles, 'Circle Events'));

  // ── Phase 5: Retrospectives ──────────────────────────────────────────────────
  phase(5, 'Retrospectives');

  await step('Circle -> Circles (back-ref: Circle Retros)', () =>
    upgradeToDual(DB.retrospectives, 'Circle', DB.circles, 'Circle Retros'));

  await step('Meeting -> Meetings (back-ref: Meeting Retros)', () =>
    upgradeToDual(DB.retrospectives, 'Meeting', DB.meetings, 'Meeting Retros'));

  // ── Phase 6: Resources ───────────────────────────────────────────────────────
  phase(6, 'Resources');

  await step('Steward -> Profiles (back-ref: Stewardship)', () =>
    upgradeToDual(DB.resources, 'Steward', DB.profiles, 'Stewardship'));

  await step('Steward Circle -> Circles (back-ref: Circle Resources)', () =>
    upgradeToDual(DB.resources, 'Steward Circle', DB.circles, 'Circle Resources'));

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('Done. Community layer relations are now dual_property.');
  console.log('Profiles, Circles, and Meetings now show reverse links.');
  console.log('='.repeat(60) + '\n');
}

main().catch(err => { console.error(err); process.exit(1); });
