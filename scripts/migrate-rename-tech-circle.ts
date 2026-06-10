/**
 * Renames the Technology and Governance Architecture circle to Technology Architecture,
 * updates the associated Lead Steward role name, and renames the two role assignments.
 *
 * Background: Technology and Governance are separate concerns. Rick's circle covers
 * technical infrastructure only. Governance coordination belongs to a dedicated circle.
 *
 * Also removes em dashes from all record names (replaced with hyphens).
 *
 * Safe to re-run - skips records that already have the new name.
 * Run: npx ts-node scripts/migrate-rename-tech-circle.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

async function findByTitle(dbId: string, name: string): Promise<string | null> {
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: 'title', title: { equals: name } },
    page_size: 1,
  });
  return res.results.length > 0 ? (res.results[0].id as string) : null;
}

async function findRoleByName(name: string): Promise<string | null> {
  const res = await notion.databases.query({
    database_id: dbs.roles,
    filter: { property: 'Role Name', title: { equals: name } },
    page_size: 1,
  });
  return res.results.length > 0 ? (res.results[0].id as string) : null;
}

async function findAssignmentByTitle(title: string): Promise<string | null> {
  const res = await notion.databases.query({
    database_id: dbs.roleAssignments,
    filter: { property: 'Assignment Title', title: { equals: title } },
    page_size: 1,
  });
  return res.results.length > 0 ? (res.results[0].id as string) : null;
}

async function main() {
  console.log('\nRenaming Technology and Governance Architecture -> Technology Architecture...\n');

  // 1. Rename the circle
  const oldCircle = 'Technology and Governance Architecture';
  const newCircle = 'Technology Architecture';

  const existingNew = await findByTitle(dbs.circles, newCircle);
  if (existingNew) {
    console.log(`Circle "${newCircle}": already exists with new name, skipping`);
  } else {
    const oldId = await findByTitle(dbs.circles, oldCircle);
    if (!oldId) {
      console.log(`Circle "${oldCircle}": not found - may already be renamed or not yet created`);
    } else {
      await notion.pages.update({
        page_id: oldId,
        properties: {
          'Circle Name': { title: [{ text: { content: newCircle } }] },
          Notes: {
            rich_text: [{ text: { content: 'Founded 2026-05-27 during initial CCOS buildout. Technology Architecture is intentionally separate from governance circles to prevent role confusion. Currently operating as a single-steward circle. Renamed 2026-05-27 to clarify scope.' } }],
          },
        } as never,
      });
      console.log(`Circle: renamed "${oldCircle}" -> "${newCircle}"`);
    }
  }

  // 2. Rename the Lead Steward role (em dash to hyphen, and updated circle name)
  const oldRole = 'Lead Steward — Technology and Governance Architecture';
  const newRole = 'Lead Steward - Technology Architecture';

  const existingNewRole = await findRoleByName(newRole);
  if (existingNewRole) {
    console.log(`Role "${newRole}": already exists with new name, skipping`);
  } else {
    const oldRoleId = await findRoleByName(oldRole);
    if (!oldRoleId) {
      console.log(`Role "${oldRole}": not found - may already be renamed or not yet created`);
    } else {
      await notion.pages.update({
        page_id: oldRoleId,
        properties: {
          'Role Name': { title: [{ text: { content: newRole } }] },
        } as never,
      });
      console.log(`Role: renamed "${oldRole}" -> "${newRole}"`);
    }
  }

  // 3. Rename the Lead Steward assignment (em dashes to hyphens)
  const oldAssignment1 = 'Rick Broider — Lead Steward — Technology and Governance Architecture';
  const newAssignment1 = 'Rick Broider - Lead Steward - Technology Architecture';

  const existingNewA1 = await findAssignmentByTitle(newAssignment1);
  if (existingNewA1) {
    console.log(`Assignment "${newAssignment1}": already exists with new name, skipping`);
  } else {
    const oldA1Id = await findAssignmentByTitle(oldAssignment1);
    if (!oldA1Id) {
      console.log(`Assignment "${oldAssignment1}": not found - may already be renamed or not yet created`);
    } else {
      await notion.pages.update({
        page_id: oldA1Id,
        properties: {
          'Assignment Title': { title: [{ text: { content: newAssignment1 } }] },
        } as never,
      });
      console.log(`Assignment: renamed to "${newAssignment1}"`);
    }
  }

  // 4. Rename the Living Memory Steward assignment (em dash to hyphen)
  const oldAssignment2 = 'Rick Broider — Living Memory Steward';
  const newAssignment2 = 'Rick Broider - Living Memory Steward';

  const existingNewA2 = await findAssignmentByTitle(newAssignment2);
  if (existingNewA2) {
    console.log(`Assignment "${newAssignment2}": already exists with new name, skipping`);
  } else {
    const oldA2Id = await findAssignmentByTitle(oldAssignment2);
    if (!oldA2Id) {
      console.log(`Assignment "${oldAssignment2}": not found - may already be renamed or not yet created`);
    } else {
      await notion.pages.update({
        page_id: oldA2Id,
        properties: {
          'Assignment Title': { title: [{ text: { content: newAssignment2 } }] },
        } as never,
      });
      console.log(`Assignment: renamed to "${newAssignment2}"`);
    }
  }

  console.log('\nDone. Review the circle purpose/domains in Notion to ensure governance language has been removed.\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
