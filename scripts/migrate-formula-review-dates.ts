/**
 * Converts date-type review-date properties to formula properties in four databases:
 *   Policies     — Next Review Date  (Review Cadence + Last Review Date)
 *   Circles      — adds Review Cadence select, then Next Review Date formula
 *   Roles        — Next Audit Date   (Term Length + Last Audit Date)
 *   Role Assignments — Next Review Date (Term Length + Start Date)
 *
 * Run once: npx ts-node scripts/migrate-formula-review-dates.ts
 * Safe to re-run — formula updates are idempotent.
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

// ─── Formula expressions (must stay in sync with notionSchemas.ts) ────────────

function reviewDateByCadence(cadenceProp: string, lastDateProp: string): string {
  return `if(empty(prop("${lastDateProp}")), "Set ${lastDateProp}", if(empty(prop("${cadenceProp}")), "Set ${cadenceProp}", if(prop("${cadenceProp}") == "As Needed", "Review as needed", formatDate(dateAdd(prop("${lastDateProp}"), if(prop("${cadenceProp}") == "Monthly", 1, if(prop("${cadenceProp}") == "Quarterly", 3, if(prop("${cadenceProp}") == "Semi-Annual", 6, 12))), "months"), "MMM D, YYYY"))))`;
}

function reviewDateByTerm(termProp: string, startDateProp: string): string {
  return `if(empty(prop("${startDateProp}")), "Set ${startDateProp}", if(empty(prop("${termProp}")), "Set ${termProp}", if(prop("${termProp}") == "No Term", "No term limit", formatDate(dateAdd(prop("${startDateProp}"), if(prop("${termProp}") == "3 Months", 3, if(prop("${termProp}") == "6 Months", 6, 12)), "months"), "MMM D, YYYY"))))`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updateProperty(dbId: string, dbLabel: string, propName: string, config: object) {
  console.log(`  Updating "${propName}" on ${dbLabel}...`);
  await notion.databases.update({
    database_id: dbId,
    properties: { [propName]: config } as never,
  });
  console.log(`  Done.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nMigrating review-date properties to formula type...\n');

  // 1. Policies — Next Review Date
  console.log('1. Policies');
  await updateProperty(dbs.policies, 'Policies', 'Next Review Date', {
    formula: { expression: reviewDateByCadence('Review Cadence', 'Last Review Date') },
  });

  // 2. Circles — add Review Cadence select, then set Next Review Date formula
  console.log('\n2. Circles');
  await updateProperty(dbs.circles, 'Circles', 'Review Cadence', {
    select: {
      options: [
        { name: 'Monthly' },
        { name: 'Quarterly' },
        { name: 'Semi-Annual' },
        { name: 'Annual' },
        { name: 'As Needed' },
      ],
    },
  });
  await updateProperty(dbs.circles, 'Circles', 'Next Review Date', {
    formula: { expression: reviewDateByCadence('Review Cadence', 'Last Review Date') },
  });

  // 3. Roles — Next Audit Date
  console.log('\n3. Roles');
  await updateProperty(dbs.roles, 'Roles', 'Next Audit Date', {
    formula: { expression: reviewDateByTerm('Term Length', 'Last Audit Date') },
  });

  // 4. Role Assignments — Next Review Date
  console.log('\n4. Role Assignments');
  await updateProperty(dbs.roleAssignments, 'Role Assignments', 'Next Review Date', {
    formula: { expression: reviewDateByTerm('Term Length', 'Start Date') },
  });

  console.log('\nAll done. Review-date properties are now formulas.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
