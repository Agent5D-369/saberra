/**
 * Creates the foundational CCOS records for Rick Broider:
 *   1. Profile (rick@amora.cr)
 *   2. Circle: "Technology Architecture" (Sector 5 - the tech infrastructure that supports governance)
 *   3. Role: Lead Steward of that circle
 *   4. Role: Living Memory Steward (custom, accountable for Sera)
 *   5. Role Assignments linking Rick to both roles
 *
 * Note: Technology Architecture and Governance are intentionally separate circles.
 * This circle covers only technical infrastructure (Sera, databases, Railway, integrations).
 * Governance coordination belongs to a dedicated Governance circle.
 *
 * Safe to re-run - each block checks for existing records first.
 * Run: npx ts-node scripts/create-rick-broider-records.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

function titleOf(page: Record<string, unknown>): string {
  const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
  for (const val of Object.values(props)) {
    if (val?.type === 'title') {
      const parts = (val.title as Array<{ plain_text: string }>) ?? [];
      return parts.map(t => t.plain_text).join('');
    }
  }
  return '';
}

async function findByTitle(dbId: string, name: string): Promise<string | null> {
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: 'title', title: { equals: name } },
    page_size: 1,
  });
  return res.results.length > 0 ? (res.results[0].id as string) : null;
}

async function findProfileByName(name: string): Promise<string | null> {
  const res = await notion.databases.query({
    database_id: dbs.profiles,
    filter: { property: 'Name', title: { equals: name } },
    page_size: 1,
  });
  return res.results.length > 0 ? (res.results[0].id as string) : null;
}

async function main() {
  console.log('\nCreating CCOS records for Rick Broider...\n');

  // 1. Profile
  let profileId = await findProfileByName('Rick Broider');
  if (profileId) {
    console.log('Profile: already exists');
  } else {
    const page = await notion.pages.create({
      parent: { database_id: dbs.profiles },
      properties: {
        Name:                    { title: [{ text: { content: 'Rick Broider' } }] },
        'Profile Type':          { select: { name: 'Person' } },
        'Engagement Status':     { select: { name: 'Active' } },
        'Relationship to Amora': { select: { name: 'Member' } },
        'Role / Title':          { rich_text: [{ text: { content: 'Founder, CCOS Architect, Living Memory Steward' } }] },
        Tags:                    { multi_select: [{ name: 'Leadership' }, { name: 'Governance' }, { name: 'Technical' }] },
        Email:                   { email: 'rick@amora.cr' },
        'Context Summary':       { rich_text: [{ text: { content: 'Founder of Amora. Architect of the CCOS governance structure and the Living Memory Hub (Sera). Responsible for organizational memory systems, technology infrastructure, and the design of circle and role frameworks. Primary steward of the Technology Architecture circle.' } }] },
        'First Seen':            { date: { start: new Date().toISOString().slice(0, 10) } },
        'Last Seen':             { date: { start: new Date().toISOString().slice(0, 10) } },
        Source:                  { rich_text: [{ text: { content: 'Manually created by Sera during CCOS setup' } }] },
      } as never,
    });
    profileId = page.id;
    console.log('Profile: created ->', (page as { url: string }).url);
  }

  // 2. Circle - Technology Architecture only (governance is a separate circle)
  const CIRCLE_NAME = 'Technology Architecture';
  let circleId = await findByTitle(dbs.circles, CIRCLE_NAME);
  if (circleId) {
    console.log('Circle: already exists');
  } else {
    const page = await notion.pages.create({
      parent: { database_id: dbs.circles },
      properties: {
        'Circle Name': { title: [{ text: { content: CIRCLE_NAME } }] },
        Sector:        { select: { name: 'Sector 5 — Governance & Coordination' } },
        Status:        { select: { name: 'Active' } },
        Purpose: {
          rich_text: [{ text: { content: 'To design, build, and steward the technical infrastructure that enables Amora to operate with institutional memory and organizational resilience. This circle owns Sera, the Living Memory Hub databases, and all integrations that support how the organization captures and accesses knowledge.' } }],
        },
        Domains: {
          rich_text: [{ text: { content: 'Living Memory Hub (Sera) architecture and maintenance. Notion database structure. Railway infrastructure. Integration with Google Drive, Gmail, and Claude AI. Policy on automated knowledge capture. AI system governance.' } }],
        },
        Accountabilities: {
          rich_text: [{ text: { content: 'Maintain Sera in reliable working order. Evolve the database schema as the organization grows. Ensure the Living Memory Hub faithfully captures and structures organizational knowledge. Protect canon from unauthorized modification. Review and approve changes to technical infrastructure. File and maintain KB articles about system operation.' } }],
        },
        'Meeting Cadence':  { rich_text: [{ text: { content: 'As needed' } }] },
        'Review Cadence':   { select: { name: 'Quarterly' } },
        'Last Review Date': { date: { start: new Date().toISOString().slice(0, 10) } },
        Notes: {
          rich_text: [{ text: { content: 'Founded 2026-05-27 during initial CCOS buildout. Technology Architecture is intentionally separate from governance circles to prevent role confusion. Currently operating as a single-steward circle.' } }],
        },
      } as never,
    });
    circleId = page.id;
    console.log('Circle: created ->', (page as { url: string }).url);
  }

  // 3. Role - Lead Steward of Technology Architecture
  const LEAD_ROLE_NAME = 'Lead Steward - Technology Architecture';
  let leadRoleId = await findByTitle(dbs.roles, LEAD_ROLE_NAME);
  if (leadRoleId) {
    console.log('Role (Lead Steward): already exists');
  } else {
    const page = await notion.pages.create({
      parent: { database_id: dbs.roles },
      properties: {
        'Role Name': { title: [{ text: { content: LEAD_ROLE_NAME } }] },
        'Role Type': { select: { name: 'Lead Steward' } },
        Status:      { select: { name: 'Active' } },
        Purpose: {
          rich_text: [{ text: { content: 'Hold the purpose and direction of the Technology Architecture circle. Ensure the circle fulfills its domains and accountabilities. Represent the circle in cross-circle coordination.' } }],
        },
        Domains: {
          rich_text: [{ text: { content: 'All domains of the Technology Architecture circle.' } }],
        },
        Accountabilities: {
          rich_text: [{ text: { content: 'Set priorities for the circle. Allocate resources and attention across circle domains. Represent the circle in governance meetings. Ensure technical infrastructure remains healthy and current.' } }],
        },
        'Term Length':      { select: { name: 'No Term' } },
        'Assignment Method': { select: { name: 'Appointed' } },
        'Last Audit Date':  { date: { start: new Date().toISOString().slice(0, 10) } },
        Source:             { rich_text: [{ text: { content: 'Created during CCOS initial buildout' } }] },
      } as never,
    });
    leadRoleId = page.id;
    console.log('Role (Lead Steward): created ->', (page as { url: string }).url);
  }

  // 4. Role - Living Memory Steward
  const LM_ROLE_NAME = 'Living Memory Steward';
  let lmRoleId = await findByTitle(dbs.roles, LM_ROLE_NAME);
  if (lmRoleId) {
    console.log('Role (Living Memory Steward): already exists');
  } else {
    const page = await notion.pages.create({
      parent: { database_id: dbs.roles },
      properties: {
        'Role Name': { title: [{ text: { content: LM_ROLE_NAME } }] },
        'Role Type': { select: { name: 'Custom Role' } },
        Status:      { select: { name: 'Active' } },
        Purpose: {
          rich_text: [{ text: { content: 'Ensure the Living Memory Hub (Sera) faithfully serves the organization. Own the architecture, configuration, and evolution of Sera and the 18 Notion databases that form organizational memory.' } }],
        },
        Domains: {
          rich_text: [{ text: { content: 'Sera (roots@amora.cr) configuration and deployment. All Living Memory Hub Notion databases. Google Drive Living Memory Inbox folder. KB article quality and coverage. Living Memory routing policy.' } }],
        },
        Accountabilities: {
          rich_text: [{ text: { content: 'Keep Sera deployed and processing emails reliably on Railway. Evolve Sera when organizational needs change. Review and approve KB articles before they reach Published status. Maintain the Living Memory routing policy. Ensure sensitive content is handled correctly. Train team members on how to interact with the Hub.' } }],
        },
        'Term Length':      { select: { name: 'No Term' } },
        'Assignment Method': { select: { name: 'Appointed' } },
        'Last Audit Date':  { date: { start: new Date().toISOString().slice(0, 10) } },
        Notes: {
          rich_text: [{ text: { content: 'Sera (the AI worker) fills the AI Secretary function within the Hub. The Living Memory Steward is the human accountable for Sera and the system she runs.' } }],
        },
        Source: { rich_text: [{ text: { content: 'Created during CCOS initial buildout' } }] },
      } as never,
    });
    lmRoleId = page.id;
    console.log('Role (Living Memory Steward): created ->', (page as { url: string }).url);
  }

  // 5. Role Assignments - no em dashes in assignment titles
  const assignments = [
    { title: `Rick Broider - ${LEAD_ROLE_NAME}`,  roleId: leadRoleId! },
    { title: `Rick Broider - ${LM_ROLE_NAME}`,    roleId: lmRoleId! },
  ];

  for (const a of assignments) {
    const existing = await findByTitle(dbs.roleAssignments, a.title);
    if (existing) {
      console.log(`Assignment "${a.title}": already exists`);
      continue;
    }
    const page = await notion.pages.create({
      parent: { database_id: dbs.roleAssignments },
      properties: {
        'Assignment Title': { title: [{ text: { content: a.title } }] },
        Status:             { select: { name: 'Active' } },
        'Assignment Type':  { select: { name: 'Appointed' } },
        'Term Length':      { select: { name: 'No Term' } },
        'Start Date':       { date: { start: new Date().toISOString().slice(0, 10) } },
        'Source Evidence':  { rich_text: [{ text: { content: 'Self-appointed as founding steward during initial CCOS buildout.' } }] },
      } as never,
    });
    console.log(`Assignment "${a.title}": created -> ${(page as { url: string }).url}`);
  }

  console.log('\nAll records created. Relations (Circle -> Roles -> Profile) can be wired\nvia Notion\'s UI using the relation properties.\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
