/**
 * Migration: lifecycle states, priority routing, and extraction confidence
 *
 * Adds to Tasks, Risks, Decision Candidates:
 *   - Lifecycle select (Active / Stale / Archived)
 *   - Extraction Confidence select (High / Medium / Low)
 *
 * Adds to Memory Review Queue:
 *   - Priority select (Urgent / This Week / Backlog)
 *   - Archived At date
 *   - Status option "Archived"
 *
 * Adds to Canon Change Requests:
 *   - Extraction Confidence select (High / Medium / Low)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB = {
  tasks:               process.env.NOTION_DB_TASKS!,
  risks:               process.env.NOTION_DB_RISKS!,
  decisions:           process.env.NOTION_DB_DECISION_CANDIDATES!,
  memoryReviewQueue:   process.env.NOTION_DB_MEMORY_REVIEW_QUEUE!,
  canonChangeRequests: process.env.NOTION_DB_CANON_CHANGE_REQUESTS!,
};

const lifecycleOptions = [
  { name: 'Active',   color: 'green'  },
  { name: 'Stale',    color: 'yellow' },
  { name: 'Archived', color: 'gray'   },
];

const confidenceOptions = [
  { name: 'High',   color: 'green'  },
  { name: 'Medium', color: 'yellow' },
  { name: 'Low',    color: 'red'    },
];

const priorityOptions = [
  { name: 'Urgent',     color: 'red'    },
  { name: 'This Week',  color: 'yellow' },
  { name: 'Backlog',    color: 'gray'   },
];

async function addSelectProp(dbId: string, propName: string, options: { name: string; color: string }[]) {
  await (notion.databases.update as any)({
    database_id: dbId,
    properties: {
      [propName]: { select: { options } },
    },
  });
  console.log(`  + ${propName}`);
}

async function addDateProp(dbId: string, propName: string) {
  await (notion.databases.update as any)({
    database_id: dbId,
    properties: {
      [propName]: { date: {} },
    },
  });
  console.log(`  + ${propName}`);
}

async function addStatusOption(dbId: string, propName: string, newOption: { name: string; color: string }) {
  const db = await notion.databases.retrieve({ database_id: dbId });
  const existing = (db.properties as any)[propName];
  if (!existing || existing.type !== 'select') {
    console.log(`  ! ${propName} not found or not a select`);
    return;
  }
  const existingOptions: { name: string }[] = existing.select.options ?? [];
  if (existingOptions.some((o: { name: string }) => o.name === newOption.name)) {
    console.log(`  = ${propName} already has "${newOption.name}"`);
    return;
  }
  await (notion.databases.update as any)({
    database_id: dbId,
    properties: {
      [propName]: { select: { options: [...existingOptions, newOption] } },
    },
  });
  console.log(`  + ${propName} option "${newOption.name}"`);
}

async function run() {
  console.log('Tasks: adding Lifecycle + Extraction Confidence');
  await addSelectProp(DB.tasks, 'Lifecycle', lifecycleOptions);
  await addSelectProp(DB.tasks, 'Extraction Confidence', confidenceOptions);

  console.log('Risks: adding Lifecycle + Extraction Confidence');
  await addSelectProp(DB.risks, 'Lifecycle', lifecycleOptions);
  await addSelectProp(DB.risks, 'Extraction Confidence', confidenceOptions);

  console.log('Decision Candidates: adding Lifecycle + Extraction Confidence');
  await addSelectProp(DB.decisions, 'Lifecycle', lifecycleOptions);
  await addSelectProp(DB.decisions, 'Extraction Confidence', confidenceOptions);

  console.log('Memory Review Queue: adding Priority + Archived At + Status "Archived"');
  await addSelectProp(DB.memoryReviewQueue, 'Priority', priorityOptions);
  await addDateProp(DB.memoryReviewQueue, 'Archived At');
  await addStatusOption(DB.memoryReviewQueue, 'Status', { name: 'Archived', color: 'gray' });

  console.log('Canon Change Requests: adding Extraction Confidence');
  await addSelectProp(DB.canonChangeRequests, 'Extraction Confidence', confidenceOptions);

  console.log('Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
