/**
 * Adds two properties to Policies and one to Tasks:
 *
 *   Policies:
 *     - Policy ID  (unique_id, prefix "POL") — auto-assigned, e.g. POL-1
 *     - Policy Ref (formula)                 — area-coded, e.g. GOV-003
 *
 *   Tasks:
 *     - Notes (rich_text) — searchable ongoing task notes
 *
 * Notion backfills unique_id to all existing Policies records automatically.
 * Policy Ref must be added after Policy ID so the formula can reference it.
 *
 * Run once: npx ts-node scripts/migrate-policy-id-tasks-notes.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../src/config/ConfigService';

dotenv.config();

const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });
const dbs = getNotionDatabaseIds(config);

// Keep in sync with notionSchemas.ts POLICY_REF_FORMULA
// unique_id does not support numeric < comparison in Notion formulas — use length() instead
const POLICY_REF_FORMULA = [
  `concat(`,
  `if(prop("Policy Area") == "Governing Purpose", "GOV-", if(prop("Policy Area") == "Policy", "POL-", if(prop("Policy Area") == "Circle Definition", "CIR-", if(prop("Policy Area") == "Role Definition", "ROL-", if(prop("Policy Area") == "Decision Rights", "DEC-", if(prop("Policy Area") == "Legal Commitment", "LEG-", if(prop("Policy Area") == "Financial Commitment", "FIN-", if(prop("Policy Area") == "Land Stewardship", "LND-", if(prop("Policy Area") == "CCOS Ledger", "CCO-", if(prop("Policy Area") == "Public Commitment", "PUB-", "GEN-")))))))))), `,
  `if(length(format(prop("Policy ID"))) == 1, concat("00", format(prop("Policy ID"))), if(length(format(prop("Policy ID"))) == 2, concat("0", format(prop("Policy ID"))), format(prop("Policy ID"))))`,
  `)`,
].join('');

async function updateDb(dbId: string, label: string, properties: object) {
  await notion.databases.update({
    database_id: dbId,
    properties: properties as never,
  });
  console.log(`  ${label} — done`);
}

async function main() {
  console.log('\nRunning migration: policy-id-tasks-notes\n');

  // Step 1: Add Policy ID (unique_id) — must exist before Policy Ref formula can reference it
  console.log('1. Policies — adding Policy ID (unique_id)');
  await updateDb(dbs.policies, 'Policy ID added', {
    'Policy ID': { unique_id: { prefix: 'POL' } },
  });

  // Step 2: Add Policy Ref formula (depends on Policy ID existing)
  console.log('2. Policies — adding Policy Ref (formula)');
  await updateDb(dbs.policies, 'Policy Ref added', {
    'Policy Ref': { formula: { expression: POLICY_REF_FORMULA } },
  });

  // Step 3: Add Notes to Tasks (independent)
  console.log('3. Tasks — adding Notes (rich_text)');
  await updateDb(dbs.tasks, 'Notes added', {
    Notes: { rich_text: {} },
  });

  console.log('\nAll done.\n');
  console.log('Notion will backfill Policy ID values to all existing policy records.');
  console.log('Policy Ref will compute automatically once Policy Area and Policy ID are set.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
