/**
 * verify-dashboard-metrics.ts
 *
 * Runs every query the dashboard uses and prints counts so you can
 * cross-check against what the dashboard currently shows.
 *
 * Run with: npx ts-node scripts/verify-dashboard-metrics.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

const DASHBOARD_TZ = process.env.DASHBOARD_TIMEZONE ?? 'America/Costa_Rica';

function isoToTzDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso));
}

async function count(label: string, dbId: string, filter?: object): Promise<number> {
  try {
    let n = 0;
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: dbId,
        filter: filter as never,
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      n += res.results.length;
      cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
    } while (cursor);
    console.log(`  ${String(n).padStart(5)}  ${label}`);
    return n;
  } catch (err: any) {
    console.log(`  ERROR  ${label} — ${err.message ?? err}`);
    return -1;
  }
}

async function main() {
  const sevenDaysAgoLocal = isoToTzDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const sevenDaysAgoUtc   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`\nTimezone: ${DASHBOARD_TZ}`);
  console.log(`7-day boundary (local date): ${sevenDaysAgoLocal}`);
  console.log(`7-day boundary (UTC):        ${sevenDaysAgoUtc.slice(0,10)}\n`);

  console.log('═══ QUEUE COUNTS ═══════════════════════════════════════════');
  await count('Canon Change Requests — Pending Review',  dbs.canonChangeRequests, { property: 'Status', select: { equals: 'Pending Review' } });
  await count('Memory Review Queue   — Pending Review',  dbs.memoryReviewQueue,   { property: 'Status', select: { equals: 'Pending Review' } });
  await count('Decision Candidates   — Candidate or Needs Clarification', dbs.decisionCandidates, { or: [
    { property: 'Status', select: { equals: 'Candidate' } },
    { property: 'Status', select: { equals: 'Needs Clarification' } },
  ]});
  await count('Sensitive Review      — Pending Review',  dbs.sensitiveReview,     { property: 'Status', select: { equals: 'Pending Review' } });
  await count('CCOS Ledger Entries   — Draft or Pending Review', dbs.ccosLedgerEntries, { or: [
    { property: 'Status', select: { equals: 'Draft' } },
    { property: 'Status', select: { equals: 'Pending Review' } },
  ]});
  await count('Tasks — no Owner, not Done, not Cancelled', dbs.tasks, { and: [
    { property: 'Owner', relation: { is_empty: true } },
    { property: 'Status', select: { does_not_equal: 'Done' } },
    { property: 'Status', select: { does_not_equal: 'Cancelled' } },
  ]});
  await count('Risks — High + Open',                     dbs.risks,               { and: [
    { property: 'Severity', select: { equals: 'High' } },
    { property: 'Status',   select: { equals: 'Open' } },
  ]});
  if (dbs.knowledgeBase) {
    await count('KB Articles — Draft',                   dbs.knowledgeBase,       { property: 'Status', select: { equals: 'Draft' } });
  }
  // Failed/stuck operational emails
  await count('Source Emails — Failed or stuck Processing (operational)', dbs.sourceEmails, { and: [
    { property: 'Source Category', select: { equals: 'Operational' } },
    { or: [
      { property: 'Processing Status', select: { equals: 'Failed' } },
      { property: 'Processing Status', select: { equals: 'Processing' } },
    ]},
  ]});

  console.log('\n═══ POLICY STATS ════════════════════════════════════════════');
  await count('Policies — total',          dbs.policies);
  await count('Policies — Draft',          dbs.policies, { property: 'Status', select: { equals: 'Draft' } });
  await count('Policies — Active',         dbs.policies, { property: 'Status', select: { equals: 'Active' } });
  await count('Policies — missing circle', dbs.policies, { property: 'Responsible Circle', relation: { is_empty: true } });

  console.log('\n═══ COMMUNITY STATS ═════════════════════════════════════════');
  await count('Profiles — total',          dbs.profiles);
  await count('Meetings — total',          dbs.meetings);
  await count('Circles  — Active',         dbs.circles,  { property: 'Status', select: { equals: 'Active' } });
  await count('Risks    — total',          dbs.risks);
  await count('Risks    — Open',           dbs.risks,    { property: 'Status', select: { equals: 'Open' } });

  console.log('\n═══ EMAILS PROCESSED — THIS WEEK (current dashboard method) ══');
  await count(`Source Emails created on_or_after ${sevenDaysAgoLocal} (current dashboard)`,
    dbs.sourceEmails, {
      timestamp: 'created_time', created_time: { on_or_after: sevenDaysAgoLocal },
    } as never);
  await count('Source Emails — Processed, created this week',
    dbs.sourceEmails, { and: [
      { property: 'Processing Status', select: { equals: 'Processed' } },
      { timestamp: 'created_time', created_time: { on_or_after: sevenDaysAgoLocal } },
    ]} as never);
  console.log('\n  [OLD / WRONG methods for comparison]');
  await count('Processing Events — completed, past_week: {} (OLD UTC method — was 5700+)',
    dbs.processingEvents, { and: [
      { property: 'Status',     select: { equals: 'completed' } },
      { property: 'Started At', date: { past_week: {} } },
    ]});

  console.log('\n═══ TASKS BREAKDOWN ═════════════════════════════════════════');
  await count('Tasks — total (all statuses)',     dbs.tasks);
  await count('Tasks — Open',                     dbs.tasks, { property: 'Status', select: { equals: 'Open' } });
  await count('Tasks — In Progress',              dbs.tasks, { property: 'Status', select: { equals: 'In Progress' } });
  await count('Tasks — Needs Owner',              dbs.tasks, { property: 'Status', select: { equals: 'Needs Owner' } });
  await count('Tasks — Done',                     dbs.tasks, { property: 'Status', select: { equals: 'Done' } });
  await count('Tasks — Cancelled',                dbs.tasks, { property: 'Status', select: { equals: 'Cancelled' } });
  await count('Tasks — has Owner (relation)',      dbs.tasks, { property: 'Owner', relation: { is_not_empty: true } });
  await count('Tasks — no Owner (relation)',       dbs.tasks, { property: 'Owner', relation: { is_empty: true } });

  console.log('\n═══ MEETING ASSETS ══════════════════════════════════════════');
  await count('Meeting Assets — Manual Review',   dbs.meetingAssets, { property: 'Processing Status', select: { equals: 'Manual Review' } });
  await count('Meeting Assets — Needs Access',    dbs.meetingAssets, { property: 'Processing Status', select: { equals: 'Needs Access' } });
  await count('Meeting Assets — Processing',      dbs.meetingAssets, { property: 'Processing Status', select: { equals: 'Processing' } });
  await count('Meeting Assets — Failed',          dbs.meetingAssets, { property: 'Processing Status', select: { equals: 'Failed' } });

  console.log('\n═══ SOURCE EMAILS ═══════════════════════════════════════════');
  await count('Source Emails — total',            dbs.sourceEmails);
  await count('Source Emails — Processed',        dbs.sourceEmails, { property: 'Processing Status', select: { equals: 'Processed' } });
  await count('Source Emails — Failed',           dbs.sourceEmails, { property: 'Processing Status', select: { equals: 'Failed' } });
  await count('Source Emails — Processing',       dbs.sourceEmails, { property: 'Processing Status', select: { equals: 'Processing' } });
  await count('Source Emails — Pending',          dbs.sourceEmails, { property: 'Processing Status', select: { equals: 'Pending' } });
  await count('Source Emails — Operational',      dbs.sourceEmails, { property: 'Source Category',   select: { equals: 'Operational' } });
  await count('Source Emails — Meeting Asset',     dbs.sourceEmails, { property: 'Source Category',   select: { equals: 'Meeting Asset' } });

  console.log('\n═══ ROLES & GOVERNANCE ══════════════════════════════════════');
  await count('Roles — total',                    dbs.roles);
  await count('Roles — Active',                   dbs.roles,  { property: 'Status', select: { equals: 'Active' } });
  await count('Role Assignments — total',         dbs.roleAssignments);
  await count('Role Assignments — Active',        dbs.roleAssignments, { property: 'Status', select: { equals: 'Active' } });
  await count('Roles — Vacant (Active + no Role Assignments)', dbs.roles, { and: [
    { property: 'Status',           select:   { equals:   'Active' } },
    { property: 'Role Assignments', relation: { is_empty: true     } },
  ]});

  console.log('\n═══ DECISION CANDIDATES BREAKDOWN ═══════════════════════════');
  await count('Decisions — Confirmed',            dbs.decisionCandidates, { property: 'Status', select: { equals: 'Confirmed' } });
  await count('Decisions — Candidate',            dbs.decisionCandidates, { property: 'Status', select: { equals: 'Candidate' } });
  await count('Decisions — Needs Clarification',  dbs.decisionCandidates, { property: 'Status', select: { equals: 'Needs Clarification' } });
  await count('Decisions — Rejected',             dbs.decisionCandidates, { property: 'Status', select: { equals: 'Rejected' } });

  console.log();
}

main().catch(err => { console.error(err); process.exit(1); });
