/**
 * Expands the live Circles DB to match the full CCOS Charter spec:
 *   - Renames Domain → Domains
 *   - Adds: Sector, Accountabilities, KPIs, Meeting Cadence, Parent Circle,
 *           Next Review Date, Last Review Date
 *
 * After this runs, set up the Roles and Role Assignments DBs via:
 *   npm run setup-notion   (idempotent — only creates missing DBs)
 *
 * Run once: npm run migrate-circles-roles
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const circlesDbId = process.env.NOTION_DB_CIRCLES!;

async function main() {
  if (!circlesDbId) { console.error('NOTION_DB_CIRCLES not set'); process.exit(1); }
  console.log('Expanding Circles DB to full CCOS Charter spec...');

  await notion.databases.update({
    database_id: circlesDbId,
    properties: {
      // Rename Domain → Domains
      Domain: { name: 'Domains', rich_text: {} },
      // Add Charter fields
      Sector: {
        select: {
          options: [
            { name: 'Sector 1 — Land & Ecology' },
            { name: 'Sector 2 — Community & Culture' },
            { name: 'Sector 3 — Learning & Education' },
            { name: 'Sector 4 — Health & Wellbeing' },
            { name: 'Sector 5 — Governance & Coordination' },
            { name: 'Sector 6 — Economics & Finance' },
            { name: 'Sector 7 — Meaning & Mythos' },
          ],
        },
      },
      'Parent Circle': { rich_text: {} },
      Accountabilities: { rich_text: {} },
      KPIs: { rich_text: {} },
      'Meeting Cadence': { rich_text: {} },
      'Next Review Date': { date: {} },
      'Last Review Date': { date: {} },
    } as any,
  });

  console.log('✓ Circles DB expanded.');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
