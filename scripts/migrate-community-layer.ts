/**
 * Creates 4 new community-layer databases and adds fields to 4 existing databases:
 *
 * NEW:
 *   - Gratitudes (appreciations between people)
 *   - Events (community gatherings and ceremonies)
 *   - Retrospectives (structured lookbacks)
 *   - Resources (shared commons and stewardship)
 *
 * FIELD ADDITIONS:
 *   - Tasks: Purpose Alignment, Purpose Alignment Notes
 *   - Decision Candidates: Implementation Status, Implemented Date
 *   - Risks: Review Date
 *
 * After running, set these Railway env vars:
 *   NOTION_DB_GRATITUDES, NOTION_DB_EVENTS, NOTION_DB_RETROSPECTIVES, NOTION_DB_RESOURCES
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const parentPageId = process.env.NOTION_PARENT_PAGE_ID!;

async function createDb(title: string, properties: Record<string, any>): Promise<string> {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: title } }],
    properties,
  } as any);
  return db.id;
}

async function run() {
  // ── New databases ───────────────────────────────────────────────────────────

  console.log('Creating Gratitudes database...');
  const gratitudesId = await createDb('Gratitudes', {
    Title:             { title: {} },
    Appreciation:      { rich_text: {} },
    Date:              { date: {} },
    'Source Evidence': { rich_text: {} },
    Lifecycle:         { select: { options: [{ name: 'Active' }, { name: 'Archived' }] } },
    'Extraction Confidence': { select: { options: [{ name: 'High' }, { name: 'Medium' }, { name: 'Low' }] } },
  });
  console.log(`  Created: ${gratitudesId}`);

  console.log('Creating Events database...');
  const eventsId = await createDb('Events', {
    'Event Name': { title: {} },
    Type:         { select: { options: ['Community Dinner', 'Ceremony', 'Workshop', 'Learning Circle', 'Celebration', 'Work Party', 'Retreat', 'Other'].map(name => ({ name })) } },
    Date:         { date: {} },
    'End Date':   { date: {} },
    Location:     { rich_text: {} },
    Description:  { rich_text: {} },
    Status:       { select: { options: ['Proposed', 'Confirmed', 'Completed', 'Cancelled'].map(name => ({ name })) } },
    Attendance:   { rich_text: {} },
    Notes:        { rich_text: {} },
    Lifecycle:    { select: { options: [{ name: 'Active' }, { name: 'Archived' }] } },
  });
  console.log(`  Created: ${eventsId}`);

  console.log('Creating Retrospectives database...');
  const retrospectivesId = await createDb('Retrospectives', {
    Title:               { title: {} },
    'Retro Date':        { date: {} },
    'Period Covered':    { rich_text: {} },
    'What Worked':       { rich_text: {} },
    "What Didn't Work":  { rich_text: {} },
    'What to Change':    { rich_text: {} },
    'Energy Level':      { select: { options: ['High', 'Good', 'Neutral', 'Low', 'Critical'].map(name => ({ name })) } },
    Celebrations:        { rich_text: {} },
    Status:              { select: { options: [{ name: 'Draft' }, { name: 'Complete' }] } },
    'Extraction Confidence': { select: { options: [{ name: 'High' }, { name: 'Medium' }, { name: 'Low' }] } },
  });
  console.log(`  Created: ${retrospectivesId}`);

  console.log('Creating Resources database...');
  const resourcesId = await createDb('Resources', {
    'Resource Name':    { title: {} },
    Type:               { select: { options: ['Land', 'Building', 'Vehicle', 'Tool', 'Equipment', 'Digital', 'Financial', 'Other'].map(name => ({ name })) } },
    Condition:          { select: { options: ['Excellent', 'Good', 'Fair', 'Needs Attention', 'Out of Service'].map(name => ({ name })) } },
    Status:             { select: { options: ['Available', 'In Use', 'Reserved', 'Under Repair', 'Retired'].map(name => ({ name })) } },
    Location:           { rich_text: {} },
    Description:        { rich_text: {} },
    'Acquisition Date': { date: {} },
    'Last Inspected':   { date: {} },
    'Next Service Date': { date: {} },
    'Usage Notes':      { rich_text: {} },
    Notes:              { rich_text: {} },
  });
  console.log(`  Created: ${resourcesId}`);

  // ── Relations on new databases ──────────────────────────────────────────────

  const profilesDbId  = process.env.NOTION_DB_PROFILES!;
  const circlesDbId   = process.env.NOTION_DB_CIRCLES!;
  const meetingsDbId  = process.env.NOTION_DB_MEETINGS!;

  console.log('Adding relations to Gratitudes...');
  await notion.databases.update({
    database_id: gratitudesId,
    properties: {
      From:    { relation: { database_id: profilesDbId, single_property: {} } },
      To:      { relation: { database_id: profilesDbId, single_property: {} } },
      Circle:  { relation: { database_id: circlesDbId,  single_property: {} } },
      Meeting: { relation: { database_id: meetingsDbId, single_property: {} } },
    },
  } as any);

  console.log('Adding relations to Events...');
  await notion.databases.update({
    database_id: eventsId,
    properties: {
      Organizer:          { relation: { database_id: profilesDbId, single_property: {} } },
      'Organizing Circle': { relation: { database_id: circlesDbId,  single_property: {} } },
    },
  } as any);

  console.log('Adding relations to Retrospectives...');
  await notion.databases.update({
    database_id: retrospectivesId,
    properties: {
      Circle:  { relation: { database_id: circlesDbId,  single_property: {} } },
      Meeting: { relation: { database_id: meetingsDbId, single_property: {} } },
    },
  } as any);

  console.log('Adding relations to Resources...');
  await notion.databases.update({
    database_id: resourcesId,
    properties: {
      Steward:         { relation: { database_id: profilesDbId, single_property: {} } },
      'Steward Circle': { relation: { database_id: circlesDbId,  single_property: {} } },
    },
  } as any);

  // ── Field additions to existing databases ───────────────────────────────────

  console.log('Adding Purpose Alignment fields to Tasks...');
  await notion.databases.update({
    database_id: process.env.NOTION_DB_TASKS!,
    properties: {
      'Purpose Alignment': { select: { options: ['Aligned', 'Neutral', 'Misaligned', 'Unclear'].map(name => ({ name })) } },
      'Purpose Alignment Notes': { rich_text: {} },
    },
  } as any);

  console.log('Adding Implementation Status + Implemented Date to Decision Candidates...');
  await notion.databases.update({
    database_id: process.env.NOTION_DB_DECISION_CANDIDATES!,
    properties: {
      'Implementation Status': { select: { options: ['Not Started', 'In Progress', 'Complete', 'Abandoned'].map(name => ({ name })) } },
      'Implemented Date':      { date: {} },
    },
  } as any);

  console.log('Adding Review Date to Risks...');
  await notion.databases.update({
    database_id: process.env.NOTION_DB_RISKS!,
    properties: {
      'Review Date': { date: {} },
    },
  } as any);

  console.log('\n=== Railway env vars to set ===');
  console.log(`NOTION_DB_GRATITUDES=${gratitudesId}`);
  console.log(`NOTION_DB_EVENTS=${eventsId}`);
  console.log(`NOTION_DB_RETROSPECTIVES=${retrospectivesId}`);
  console.log(`NOTION_DB_RESOURCES=${resourcesId}`);
}

run().catch(console.error);
