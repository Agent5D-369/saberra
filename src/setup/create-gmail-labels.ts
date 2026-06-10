/**
 * One-time setup: creates all 10 AMORA Gmail labels for roots@amora.cr.
 *
 * Usage:
 *   npm run setup-gmail-labels
 *
 * Prerequisites: GOOGLE_* env vars set in .env (OAuth consent completed)
 */

import * as dotenv from 'dotenv';
import { google } from 'googleapis';
dotenv.config();

const GMAIL_LABELS = {
  CAPTURE:        'AMORA_CAPTURE',
  MEET_RECORDING: 'AMORA_MEET_RECORDING',
  MEET_TRANSCRIPT:'AMORA_MEET_TRANSCRIPT',
  MEET_NOTES:     'AMORA_MEET_NOTES',
  PROCESSING:     'AMORA_PROCESSING',
  PROCESSED:      'AMORA_PROCESSED',
  NEEDS_ACCESS:   'AMORA_NEEDS_ACCESS',
  FAILED:         'AMORA_FAILED',
  MANUAL_REVIEW:  'AMORA_MANUAL_REVIEW',
} as const;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN!;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Error: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN must be set');
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
auth.setCredentials({ refresh_token: REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth });

// Label colors (Notion-friendly palette)
const LABEL_COLORS: Record<string, { textColor: string; backgroundColor: string }> = {
  AMORA_PROCESSING:   { textColor: '#ffffff', backgroundColor: '#ffad47' },
  AMORA_PROCESSED:    { textColor: '#ffffff', backgroundColor: '#16a766' },
  AMORA_NEEDS_ACCESS: { textColor: '#ffffff', backgroundColor: '#e66550' },
  AMORA_FAILED:       { textColor: '#ffffff', backgroundColor: '#cc3a21' },
  AMORA_MANUAL_REVIEW:{ textColor: '#ffffff', backgroundColor: '#a479e2' },
};

async function main() {
  console.log('\nAmora Living Memory Hub — Gmail Label Setup\n');

  const existing = await gmail.users.labels.list({ userId: 'me' });
  const existingNames = new Set((existing.data.labels ?? []).map((l) => l.name));

  for (const labelName of Object.values(GMAIL_LABELS)) {
    if (existingNames.has(labelName)) {
      console.log(`  [EXISTS]  ${labelName}`);
      continue;
    }

    const color = LABEL_COLORS[labelName];
    await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
        ...(color ? { color } : {}),
      },
    });
    console.log(`  [CREATED] ${labelName}`);
  }

  console.log('\n✓ All Gmail labels ready.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
