/**
 * Google OAuth2 flow for a client capture inbox account.
 *
 * Usage:
 *   npx ts-node scripts/google-auth.ts --client-id <id> --client-secret <secret>
 *   npx ts-node scripts/google-auth.ts   # reads from GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars
 *
 * Output:
 *   GOOGLE_REFRESH_TOKEN=<token>
 *   Copy this value into the client input JSON under "googleRefreshToken".
 *
 * The script uses a local HTTP server to capture the OAuth callback so the
 * user does not need to manually copy the authorization code from the URL bar.
 * If port 3456 is unavailable the script falls back to manual code entry via stdin.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.saberra' });
dotenv.config(); // also load .env as fallback

import * as http from 'http';
import * as readline from 'readline';
import { google } from 'googleapis';

// ─── CLI arg parsing ──────────────────────────────────────────────────────────

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

const clientId     = getArg('--client-id')     ?? process.env.GOOGLE_CLIENT_ID;
const clientSecret = getArg('--client-secret') ?? process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Error: --client-id and --client-secret are required (or set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).');
  console.error('Usage: npx ts-node scripts/google-auth.ts --client-id <id> --client-secret <secret>');
  process.exit(1);
}

// ─── OAuth scopes ─────────────────────────────────────────────────────────────

const SCOPES = [
  // Current: read Drive files and Docs content, send and read Gmail
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  // Sera output capabilities: create/edit Sheets and Slides for teams
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/presentations',
];

const REDIRECT_URI = 'http://localhost:3456/oauth/callback';
const REDIRECT_URI_OOB = 'urn:ietf:wg:oauth:2.0:oob';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function askQuestion(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/** Try to capture the auth code via a local HTTP callback server. */
function waitForCallbackCode(timeoutMs = 120_000): Promise<string | null> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://localhost:3456');
        const code  = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<html><body><h2>OAuth error: ${error}</h2></body></html>`);
          server.close();
          resolve(null);
          return;
        }
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Authorization successful. You may close this tab.</h2></body></html>');
          server.close();
          resolve(code);
        }
      } catch {
        // ignore malformed requests
      }
    });

    server.on('error', () => {
      // Port already in use or other error — caller will fall back to OOB
      resolve(null);
    });

    server.listen(3456, () => {
      console.log('  Listening for OAuth callback on http://localhost:3456 ...');
    });

    setTimeout(() => {
      server.close();
      resolve(null);
    }, timeoutMs);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\nSaberra -- Google OAuth2 setup for client capture inbox\n');

  // First try local-server flow (more convenient); fall back to OOB (manual paste)
  let oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('Open this URL in a browser logged in as the capture inbox account:\n');
  console.log(`  ${authUrl}\n`);
  console.log('Waiting for the browser to redirect back to localhost:3456 ...');
  console.log('(If the browser shows a "This site cannot be reached" error, that is fine -- the code was captured.)\n');

  let code = await waitForCallbackCode();

  if (!code) {
    // Port 3456 was unavailable or timed out -- fall back to manual code entry
    console.log('\nCould not capture code automatically. Switching to manual entry.\n');

    // Regenerate URL with OOB redirect so Google shows the code on screen
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI_OOB);
    const oobUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });

    console.log('Open this URL in a browser logged in as the capture inbox account:\n');
    console.log(`  ${oobUrl}\n`);

    const raw = await askQuestion('Paste the authorization code here: ');
    code = raw;
  }

  if (!code) {
    console.error('No authorization code received. Aborting.');
    process.exit(1);
  }

  console.log('\nExchanging authorization code for tokens...');

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error('\nError: No refresh_token in response.');
    console.error('This usually means the account has already authorized this app.');
    console.error('Fix: Visit https://myaccount.google.com/permissions, revoke access for this app, then re-run.');
    process.exit(1);
  }

  console.log('\nOAuth consent complete.\n');
  console.log('Copy this value into your client input JSON under "googleRefreshToken":\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

  if (tokens.expiry_date) {
    const expiry = new Date(tokens.expiry_date);
    console.log(`Access token expires at: ${expiry.toISOString()} (refresh token does not expire unless revoked)\n`);
  }
}

main().catch((err: unknown) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
