/**
 * Creates Tensions and Commitments databases in Notion,
 * and adds three new fields to existing databases:
 *   - Energization Level on Role Assignments
 *   - Membership Type on Profiles
 *   - Rep Steward relation on Circles
 *
 * After running, copy the printed DB IDs into Railway env vars:
 *   NOTION_DB_TENSIONS
 *   NOTION_DB_COMMITMENTS
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const parentPageId = process.env.NOTION_PARENT_PAGE_ID!;

// ─── Create databases ─────────────────────────────────────────────────────────

async function createTensionsDb(): Promise<string> {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: 'Tensions' } }],
    properties: {
      Tension:               { title: {} },
      Type:                  { select: { options: [{ name: 'Governance' }, { name: 'Operational' }, { name: 'Relational' }, { name: 'Structural' }] } },
      Status:                { select: { options: [{ name: 'Open' }, { name: 'Processing' }, { name: 'Resolved' }, { name: 'Dropped' }] } },
      'Source Evidence':     { rich_text: {} },
      'Resolution Notes':    { rich_text: {} },
      'Resolved Date':       { date: {} },
      Lifecycle:             { select: { options: [{ name: 'Active' }, { name: 'Archived' }] } },
      'Extraction Confidence': { select: { options: [{ name: 'High' }, { name: 'Medium' }, { name: 'Low' }] } },
    },
  } as any);
  return db.id;
}

async function createCommitmentsDb(): Promise<string> {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: 'Commitments' } }],
    properties: {
      'Agreement Title':     { title: {} },
      Terms:                 { rich_text: {} },
      Type:                  { select: { options: [{ name: 'Interpersonal' }, { name: 'Inter-Circle' }, { name: 'External' }, { name: 'Org-Wide' }] } },
      Status:                { select: { options: [{ name: 'Active' }, { name: 'Modified' }, { name: 'Dissolved' }, { name: 'Superseded' }] } },
      'Effective Date':      { date: {} },
      'Review Date':         { date: {} },
      'Source Evidence':     { rich_text: {} },
      Lifecycle:             { select: { options: [{ name: 'Active' }, { name: 'Archived' }] } },
      'Extraction Confidence': { select: { options: [{ name: 'High' }, { name: 'Medium' }, { name: 'Low' }] } },
    },
  } as any);
  return db.id;
}

// ─── Add relation properties post-create ─────────────────────────────────────

async function addRelations(tensionsDbId: string, commitmentsDbId: string) {
  const profilesDbId = process.env.NOTION_DB_PROFILES!;
  const circlesDbId = process.env.NOTION_DB_CIRCLES!;
  const meetingsDbId = process.env.NOTION_DB_MEETINGS!;
  const decisionsDbId = process.env.NOTION_DB_DECISION_CANDIDATES!;

  // Tensions: Sensed By (Profiles), Sensing Circle (Circles), Meeting, Resulting Decision
  await notion.databases.update({
    database_id: tensionsDbId,
    properties: {
      'Sensed By':       { relation: { database_id: profilesDbId, single_property: {} } },
      'Sensing Circle':  { relation: { database_id: circlesDbId, single_property: {} } },
      Meeting:           { relation: { database_id: meetingsDbId, single_property: {} } },
      'Resulting Decision': { relation: { database_id: decisionsDbId, single_property: {} } },
    },
  } as any);

  // Commitments: Parties (Profiles), Circles, Source Meeting, Source Decision
  await notion.databases.update({
    database_id: commitmentsDbId,
    properties: {
      Parties:           { relation: { database_id: profilesDbId, single_property: {} } },
      Circles:           { relation: { database_id: circlesDbId, single_property: {} } },
      'Source Meeting':  { relation: { database_id: meetingsDbId, single_property: {} } },
      'Source Decision': { relation: { database_id: decisionsDbId, single_property: {} } },
    },
  } as any);
}

// ─── Field additions to existing databases ────────────────────────────────────

async function addEnergizationToRoleAssignments() {
  await notion.databases.update({
    database_id: process.env.NOTION_DB_ROLE_ASSIGNMENTS!,
    properties: {
      'Energization Level': {
        select: {
          options: [
            { name: 'Full' },
            { name: 'Partial' },
            { name: 'Flagging' },
            { name: 'Seeking Successor' },
          ],
        },
      },
    },
  } as any);
}

async function addMembershipTypeToProfiles() {
  await notion.databases.update({
    database_id: process.env.NOTION_DB_PROFILES!,
    properties: {
      'Membership Type': {
        select: {
          options: [
            { name: 'Full Member' },
            { name: 'Provisional' },
            { name: 'Associate' },
            { name: 'Ally' },
            { name: 'External' },
          ],
        },
      },
    },
  } as any);
}

async function addRepStewardToCircles() {
  await notion.databases.update({
    database_id: process.env.NOTION_DB_CIRCLES!,
    properties: {
      'Rep Steward': {
        relation: {
          database_id: process.env.NOTION_DB_PROFILES!,
          single_property: {},
        },
      },
    },
  } as any);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('Creating Tensions database...');
  const tensionsId = await createTensionsDb();
  console.log(`  Created: ${tensionsId}`);

  console.log('Creating Commitments database...');
  const commitmentsId = await createCommitmentsDb();
  console.log(`  Created: ${commitmentsId}`);

  console.log('Adding relations to Tensions and Commitments...');
  await addRelations(tensionsId, commitmentsId);
  console.log('  Relations added.');

  console.log('Adding Energization Level to Role Assignments...');
  await addEnergizationToRoleAssignments();
  console.log('  Done.');

  console.log('Adding Membership Type to Profiles...');
  await addMembershipTypeToProfiles();
  console.log('  Done.');

  console.log('Adding Rep Steward to Circles...');
  await addRepStewardToCircles();
  console.log('  Done.');

  console.log('\n=== Railway env vars to set ===');
  console.log(`NOTION_DB_TENSIONS=${tensionsId}`);
  console.log(`NOTION_DB_COMMITMENTS=${commitmentsId}`);
  console.log('\nRun: railway variables --set "NOTION_DB_TENSIONS=<id>" --set "NOTION_DB_COMMITMENTS=<id>"');
}

run().catch(console.error);
