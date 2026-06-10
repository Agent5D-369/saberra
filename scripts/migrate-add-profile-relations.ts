/**
 * Adds Profile relation fields to all relevant databases.
 * Run once: npm run migrate-add-profile-relations
 *
 * All relations are single_property (no reverse property cluttering Profiles).
 * The pipeline's existing rich-text fields are left intact as fallbacks.
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const P = process.env.NOTION_DB_PROFILES!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rel = (): any => ({ relation: { database_id: P, type: 'single_property', single_property: {} } });

interface DbPatch {
  dbId: string;
  label: string;
  fields: Record<string, unknown>;
}

const patches: DbPatch[] = [
  {
    dbId: process.env.NOTION_DB_MESSAGES!,
    label: 'Messages',
    fields: {
      'Sender Profile': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_TASKS!,
    label: 'Tasks',
    fields: {
      'Owner Profile': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_DECISION_CANDIDATES!,
    label: 'Decision Candidates',
    fields: {
      'Decision Maker Profile': rel(),
      'Reviewer Profile': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_RISKS!,
    label: 'Risks',
    fields: {
      'Owner Profile': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_PROJECTS!,
    label: 'Projects',
    fields: {
      'Lead Profile': rel(),
      'Team Profiles': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_MEETINGS!,
    label: 'Meetings',
    fields: {
      'Organizer Profile': rel(),
      'Participant Profiles': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_MEMORY_REVIEW_QUEUE!,
    label: 'Memory Review Queue',
    fields: {
      'Reviewer Profile': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_CANON_CHANGE_REQUESTS!,
    label: 'Canon Change Requests',
    fields: {
      'Reviewer Profile': rel(),
      'Implementer Profile': rel(),
    },
  },
  {
    dbId: process.env.NOTION_DB_CCOS_LEDGER_ENTRIES!,
    label: 'CCOS Ledger Entries',
    fields: {
      'Approver Profile': rel(),
    },
  },
];

async function main() {
  if (!P) { console.error('NOTION_DB_PROFILES not set'); process.exit(1); }

  console.log('\nAmora Living Memory Hub — Add Profile Relations\n');

  for (const patch of patches) {
    if (!patch.dbId) {
      console.warn(`  [SKIP] ${patch.label} — DB ID not set in env`);
      continue;
    }
    process.stdout.write(`  ${patch.label}...`);
    try {
      await notion.databases.update({
        database_id: patch.dbId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: patch.fields as any,
      });
      console.log(` ✓ added: ${Object.keys(patch.fields).join(', ')}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Relation already exists → not a real error
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(` (already exists — skipped)`);
      } else {
        console.log(` ✗ ${msg}`);
      }
    }
  }

  console.log('\n✓ Done. Property ordering must be set manually in Notion UI — see session notes.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
