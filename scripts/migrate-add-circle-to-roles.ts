/**
 * Migration: Add Circle relation to Roles DB and backfill.
 *
 * Steps:
 * 1. Add "Circle" relation property to the Roles DB
 * 2. Backfill circle for every role using the mapping derived from existing
 *    Role Assignments and role purposes
 * 3. Add "Circle (from Role)" rollup to Role Assignments (via Role → Circle)
 * 4. Fix the two Role Assignments that have no Role relation set
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

const ROLES_DB    = process.env.NOTION_DB_ROLES!;
const RA_DB       = process.env.NOTION_DB_ROLE_ASSIGNMENTS!;
const CIRCLES_DB  = process.env.NOTION_DB_CIRCLES!;

// Circle IDs (confirmed from live Notion)
const CIRCLES = {
  anchor:    '36f0a88e-f36a-817b-8a96-eae06c15131a', // Amora Community Anchor
  wellbeing: '36e0a88e-f36a-8194-ab0c-ec716deb909c', // Health & Wellbeing
  tech:      '36e0a88e-f36a-815f-a009-dbe213b4509b', // Technology & Systems
  comms:     '36e0a88e-f36a-8125-a31d-e32324787570', // Communications & Marketing
  finance:   '36e0a88e-f36a-81b8-bf0a-de7e6d036f76', // Economics & Finance
  education: '36e0a88e-f36a-81d3-8479-e008cfc1e333', // Learning & Education
  land:      '36e0a88e-f36a-81c3-b214-d3f22f085e3e', // Land & Ecology
  community: '36e0a88e-f36a-8128-a5bd-e5c05ca2cae9', // Community & Culture
  governance:'36e0a88e-f36a-8188-aa2e-ea19dd6a1920', // Governance & Coordination
};

// Role ID → Circle ID mapping (derived from assignments + role purposes)
const ROLE_CIRCLE_MAP: Record<string, string> = {
  '36e0a88e-f36a-818a-916a-c93481acb64f': CIRCLES.wellbeing,  // Wellbeing Steward
  '36e0a88e-f36a-819f-b128-e97761c912b2': CIRCLES.tech,        // Technology Steward
  '36e0a88e-f36a-8133-9972-cd581a0eb2ae': CIRCLES.education,   // Education Steward
  '36e0a88e-f36a-8180-afb9-f27f2cdbeb03': CIRCLES.comms,       // Social Media Steward
  '36e0a88e-f36a-81bd-89f9-e4247222ac24': CIRCLES.comms,       // Marketing Steward
  '36e0a88e-f36a-8179-87c3-cd56655fdfcb': CIRCLES.finance,     // Finance Steward
  '36e0a88e-f36a-81fe-8bcf-cc7e6c69cf5e': CIRCLES.community,   // Community Steward
  '36e0a88e-f36a-81af-b264-c54ba99b18ea': CIRCLES.land,        // Agroforestry Steward
  '36e0a88e-f36a-8121-a618-e1f908303733': CIRCLES.governance,  // Rep Steward
  '36e0a88e-f36a-8106-9928-fddb590aef85': CIRCLES.governance,  // AI Secretary (Sera)
  '36e0a88e-f36a-8172-8d80-faf691d272aa': CIRCLES.governance,  // Admin Facilitator
  '36e0a88e-f36a-817e-bfeb-d800470abed6': CIRCLES.governance,  // Visionary Developer
  '36e0a88e-f36a-81be-9a54-eb678d29be94': CIRCLES.governance,  // Visionary Director
  '36d0a88e-f36a-8136-83aa-dbd33fb8bd94': CIRCLES.tech,        // Living Memory Steward
  '36d0a88e-f36a-8198-ae05-dd80030a2d92': CIRCLES.tech,        // Lead Steward - Technology Architecture
};

// Role Assignments that need their Role relation fixed
const RA_ROLE_FIXES: Record<string, string> = {
  // assignment page ID → role page ID
  // "Rick Broider - Living Memory Steward" and "Rick Broider - Lead Steward - Technology Architecture"
  // will be resolved by name below
};

async function step1_addCircleRelationToRoles(): Promise<void> {
  console.log('\n[1] Adding Circle relation to Roles DB...');
  await notion.databases.update({
    database_id: ROLES_DB,
    properties: {
      'Circle': {
        type: 'relation',
        relation: {
          database_id: CIRCLES_DB,
          type: 'dual_property',
          dual_property: {},
        },
      } as never,
    },
  });
  console.log('    Circle relation added to Roles DB.');
}

async function step2_backfillRoleCircles(): Promise<void> {
  console.log('\n[2] Backfilling Circle on each Role...');
  const roles = await notion.databases.query({ database_id: ROLES_DB, page_size: 50 });
  for (const page of roles.results) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = page as any;
    if (p.object !== 'page') continue;
    const circleId = ROLE_CIRCLE_MAP[p.id];
    const name: string = p.properties['Role Name']?.title?.map((t: { plain_text: string }) => t.plain_text).join('') || p.id;
    if (!circleId) {
      console.log(`    SKIP (no mapping): ${name}`);
      continue;
    }
    await notion.pages.update({
      page_id: p.id,
      properties: {
        'Circle': { relation: [{ id: circleId }] },
      },
    });
    console.log(`    Set circle on: ${name}`);
  }
}

async function step3_addRollupToRoleAssignments(): Promise<void> {
  console.log('\n[3] Adding "Circle (from Role)" rollup to Role Assignments...');
  await notion.databases.update({
    database_id: RA_DB,
    properties: {
      'Circle (from Role)': {
        type: 'rollup',
        rollup: {
          relation_property_name: 'Role',
          rollup_property_name: 'Circle',
          function: 'show_original',
        },
      } as never,
    },
  });
  console.log('    Rollup added to Role Assignments DB.');
}

async function step4_fixMissingRoleLinks(): Promise<void> {
  console.log('\n[4] Fixing Role Assignments missing Role relation...');
  const ras = await notion.databases.query({ database_id: RA_DB, page_size: 50 });

  for (const page of ras.results) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = page as any;
    if (p.object !== 'page') continue;
    const title: string = p.properties['Assignment Title']?.title?.map((t: { plain_text: string }) => t.plain_text).join('') || '';
    const roleRel: Array<{ id: string }> = p.properties['Role']?.relation ?? [];
    if (roleRel.length > 0) continue; // already linked

    let roleId: string | null = null;
    let circleId: string | null = null;

    if (title.includes('Living Memory Steward')) {
      roleId   = '36d0a88e-f36a-8136-83aa-dbd33fb8bd94';
      circleId = CIRCLES.tech;
    } else if (title.includes('Lead Steward - Technology Architecture') || title.includes('Lead Steward - Technology')) {
      roleId   = '36d0a88e-f36a-8198-ae05-dd80030a2d92';
      circleId = CIRCLES.tech;
    }

    if (!roleId) {
      console.log(`    SKIP (no role match): ${title}`);
      continue;
    }

    await notion.pages.update({
      page_id: p.id,
      properties: {
        'Role':   { relation: [{ id: roleId }] },
        'Circle': { relation: [{ id: circleId! }] },
      },
    });
    console.log(`    Fixed: ${title}`);
  }
}

async function main(): Promise<void> {
  console.log('=== Migrate: Add Circle to Roles + backfill ===');

  await step1_addCircleRelationToRoles();
  await step2_backfillRoleCircles();
  await step3_addRollupToRoleAssignments();
  await step4_fixMissingRoleLinks();

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
