/**
 * One-time OAuth consent flow for roots@amora.cr.
 *
 * Usage:
 *   npm run oauth-setup
 *
 * Prerequisites:
 *   - client_secret.json in project root (downloaded from GCP → Credentials)
 *   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
 *
 * Output:
 *   - Prints GOOGLE_REFRESH_TOKEN — copy it to .env
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as readline from 'readline';
import { google } from 'googleapis';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  console.error('Download client_secret.json from GCP and copy client_id/client_secret to .env');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3456/oauth/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function main() {
  console.log('\nAmora Living Memory Hub — OAuth Setup for roots@amora.cr\n');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('Step 1: Open this URL in your browser and sign in as roots@amora.cr:\n');
  console.log(`  ${authUrl}\n`);

  // Start a local server to capture the callback
  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:3456`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400);
        res.end(`OAuth error: ${error}`);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Authorization successful! You may close this tab.</h2></body></html>');
        server.close();
        resolve(code);
      }
    });

    server.listen(3456, () => {
      console.log('Waiting for OAuth callback on http://localhost:3456 ...');
    });

    server.on('error', reject);
  });

  console.log('\nStep 2: Exchanging authorization code for tokens...');

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error('\nError: No refresh_token received.');
    console.error('This usually means the account already authorized this app.');
    console.error('Fix: Go to https://myaccount.google.com/permissions, revoke access for this app, then re-run.');
    process.exit(1);
  }

  console.log('\n✓ OAuth consent complete for roots@amora.cr\n');
  console.log('Add this to your .env:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

  // Also write to a temp file for convenience
  const outputPath = path.join(process.cwd(), 'google_refresh_token.txt');
  fs.writeFileSync(outputPath, tokens.refresh_token, 'utf-8');
  console.log(`(Also saved to: ${outputPath} — delete after copying to .env)\n`);
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
