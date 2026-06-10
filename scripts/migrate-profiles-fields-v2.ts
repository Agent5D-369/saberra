/**
 * Adds missing fields to the live Profiles DB:
 *   - Admin Notes (richText, AI-never-writes)
 *   - Role at Amora (richText)
 *   - Tags (multiSelect)
 *   - Referred By (richText)
 *   - Expands Relationship to Amora options (Funder, Alumni)
 *
 * Run once: npm run migrate-profiles-v2
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const profilesDbId = process.env.NOTION_DB_PROFILES!;

async function main() {
  if (!profilesDbId) { console.error('NOTION_DB_PROFILES not set'); process.exit(1); }
  console.log('Updating Profiles DB...');

  await notion.databases.update({
    database_id: profilesDbId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: {
      'Role at Amora': { rich_text: {} },
      'Tags': {
        multi_select: {
          options: [
            { name: 'Leadership' },
            { name: 'Legal' },
            { name: 'Finance' },
            { name: 'Agriculture' },
            { name: 'Education' },
            { name: 'Communications' },
            { name: 'Operations' },
            { name: 'Governance' },
            { name: 'Technical' },
            { name: 'Community' },
            { name: 'Land Stewardship' },
            { name: 'Fundraising' },
          ],
        },
      },
      'Referred By': { rich_text: {} },
      'Admin Notes': { rich_text: {} },
      // Expand select options — Notion merges new options with existing ones
      'Relationship to Amora': {
        select: {
          options: [
            { name: 'Member' },
            { name: 'Partner' },
            { name: 'Vendor' },
            { name: 'Advisor' },
            { name: 'Funder' },
            { name: 'Contact' },
            { name: 'Community' },
            { name: 'Alumni' },
            { name: 'Government' },
            { name: 'Unknown' },
          ],
        },
      },
    } as any,
  });

  console.log('✓ Fields added and select options expanded.');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
