/**
 * Saberra Deployment Engine
 *
 * Interactive step-by-step CLI for provisioning a new Saberra client instance.
 * Guides an implementor through every credential, validates each one live,
 * and produces a complete provisioned environment.
 *
 * Usage:
 *   npx ts-node scripts/deploy.ts
 *   npx ts-node scripts/deploy.ts --input clients/[slug].input.json
 *   npx ts-node scripts/deploy.ts --input clients/[slug].input.json --yes
 *   npx ts-node scripts/deploy.ts --dry-run
 *   npx ts-node scripts/deploy.ts --skip-validation
 *
 * Steps:
 *   0. Init (slug + resume detection)
 *   1. Railway project setup
 *   2. Notion workspace setup
 *   3. Capture inbox (IMAP) setup
 *   4. Google OAuth setup
 *   5. Admin & governance config
 *   6. Create Notion databases
 *   7. Set Railway env vars
 *   8. Connect GitHub
 *   9. Finalize + manifest
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.saberra' });

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync, spawn } from 'child_process';
import { Client as NotionClient } from '@notionhq/client';
import { ImapFlow } from 'imapflow';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DeployState {
  slug: string;
  tenantId: string;
  // Step 1
  railwayProjectId: string;
  railwayToken: string;
  seraApiUrl: string;
  seraDashboardUrl: string;
  // Step 2
  notionApiKey: string;
  notionParentPageId: string;
  sensitiveReviewParentPageId?: string;
  // Step 3
  rootsEmail: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword: string;
  // Step 4
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  // Step 5
  adminEmail: string;
  governingPurpose?: string;
  communityLayer: boolean;
  claudeModel: string;
  // Step 6 output
  dbIds?: Record<string, string>;
  // Step 7 output
  seraApiSecret?: string;
}

interface ProgressFile {
  completedStep: number;
  state: Partial<DeployState>;
  startedAt: string;
  updatedAt: string;
}

// ─── CLI flags ───────────────────────────────────────────────────────────────

const cliArgs       = process.argv.slice(2);
const isDryRun      = cliArgs.includes('--dry-run');
const skipVal       = cliArgs.includes('--skip-validation');
const autoAccept    = cliArgs.includes('--yes');
const inputFlagIdx  = cliArgs.indexOf('--input');
const inputFilePath = inputFlagIdx !== -1 ? path.resolve(cliArgs[inputFlagIdx + 1]) : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isFillIn(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string' && (val === '' || val.startsWith('FILL_IN'))) return true;
  return false;
}

function loadInputFile(): Partial<DeployState> {
  if (!inputFilePath || !fs.existsSync(inputFilePath)) return {};
  const raw = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8')) as Record<string, unknown>;

  const out: Partial<DeployState> = {};
  const stringFields: (keyof DeployState)[] = [
    'slug', 'tenantId', 'railwayProjectId', 'railwayToken', 'seraApiUrl', 'seraDashboardUrl',
    'notionApiKey', 'notionParentPageId', 'sensitiveReviewParentPageId',
    'rootsEmail', 'imapHost', 'imapUser', 'imapPassword',
    'googleClientId', 'googleClientSecret', 'googleRefreshToken',
    'adminEmail', 'governingPurpose', 'claudeModel',
  ];
  for (const key of stringFields) {
    const val = raw[key];
    if (!isFillIn(val)) (out as Record<string, unknown>)[key] = val;
  }
  // Number
  if (!isFillIn(raw['imapPort'])) out.imapPort = Number(raw['imapPort']);
  // Boolean
  if (typeof raw['communityLayer'] === 'boolean') out.communityLayer = raw['communityLayer'] as boolean;

  return out;
}

function progressFilePath(slug: string): string {
  return path.join('clients', `${slug}.progress.json`);
}

function saveProgress(slug: string, completedStep: number, state: Partial<DeployState>): void {
  const existing = loadProgressFile(slug);
  const file: ProgressFile = {
    completedStep,
    state,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(progressFilePath(slug), JSON.stringify(file, null, 2), 'utf-8');
}

function loadProgressFile(slug: string): ProgressFile | null {
  const p = progressFilePath(slug);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as ProgressFile;
}

const deployLogLines: string[] = [];
function dlog(step: string, status: 'start' | 'done' | 'error' | 'info', detail?: string): void {
  deployLogLines.push(`[${new Date().toISOString()}] [${step}] [${status}] ${detail ?? ''}`);
}

function writeDeployLog(slug: string): void {
  const logPath = path.join('clients', `${slug}.deployment.log`);
  fs.writeFileSync(logPath, deployLogLines.join('\n') + '\n', 'utf-8');
}

// ─── Prompt helpers ──────────────────────────────────────────────────────────

function ask(rl: readline.Interface, question: string, defaultVal?: string): Promise<string> {
  if (autoAccept) {
    const val = (defaultVal !== undefined && !isFillIn(defaultVal)) ? defaultVal : '';
    const display = val ? `[${val}]` : '(skipped - optional)';
    console.log(`  ${question} ${display}: (auto)`);
    return Promise.resolve(val);
  }
  const label = defaultVal && !isFillIn(defaultVal)
    ? `  ${question} [${defaultVal}]: `
    : `  ${question}: `;
  return new Promise(resolve => {
    rl.question(label, (answer: string) => {
      resolve(answer.trim() || defaultVal || '');
    });
  });
}

async function askMultiline(rl: readline.Interface, label: string): Promise<string> {
  console.log(`\n  ${label}`);
  console.log('  (Type your text across multiple lines. Press Enter on a blank line to finish.)');
  const lines: string[] = [];
  while (true) {
    const line: string = await new Promise(resolve => rl.question('  > ', resolve));
    if (line.trim() === '') {
      if (lines.length > 0) break;
    } else {
      lines.push(line.trim());
    }
  }
  return lines.join(' ');
}

function header(num: number, total: number, title: string): void {
  console.log('\n' + '─'.repeat(62));
  console.log(`  [Step ${num}/${total}] ${title}`);
  console.log('─'.repeat(62));
}

function info(lines: string[]): void {
  console.log('');
  lines.forEach(l => console.log(`  ${l}`));
  console.log('');
}

// ─── Validators ──────────────────────────────────────────────────────────────

async function checkRailway(token: string, projectId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    execSync(
      `railway variable list --project ${projectId} --environment production --service "Sera Worker"`,
      { env: { ...process.env, RAILWAY_TOKEN: token }, encoding: 'utf-8', stdio: 'pipe', timeout: 20000 }
    );
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not found') || msg.includes('does not exist')) {
      return { ok: false, error: 'Service "Sera Worker" not found. Verify the service name is exactly "Sera Worker".' };
    }
    if (msg.includes('Unauthorized') || msg.includes('401')) {
      return { ok: false, error: 'Invalid Railway token or token does not have access to this project.' };
    }
    return { ok: false, error: `Railway error: ${msg.slice(0, 200)}` };
  }
}

async function checkNotion(apiKey: string, pageId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const notion = new NotionClient({ auth: apiKey });
    await notion.pages.retrieve({ page_id: pageId });
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('401') || msg.includes('Unauthorized')) {
      return { ok: false, error: 'Invalid Notion API key.' };
    }
    if (msg.includes('404') || msg.includes('not_found') || msg.includes('Could not find')) {
      return { ok: false, error: 'Notion page not found. Check the page ID and that the integration is connected to this page.' };
    }
    return { ok: false, error: `Notion error: ${msg.slice(0, 200)}` };
  }
}

async function checkImap(host: string, port: number, user: string, pass: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = new ImapFlow({
      host, port, secure: true,
      auth: { user, pass },
      logger: false,
    } as ConstructorParameters<typeof ImapFlow>[0]);
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth') || msg.includes('LOGIN') || msg.includes('password') || msg.includes('AUTHENTICATE')) {
      return { ok: false, error: 'IMAP authentication failed. Use an app-specific password, not your account password.' };
    }
    if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      return { ok: false, error: `Cannot reach IMAP server at ${host}:${port}. Check the host and port.` };
    }
    return { ok: false, error: `IMAP error: ${msg.slice(0, 200)}` };
  }
}

// ─── OAuth subprocess ─────────────────────────────────────────────────────────

function runOAuthSubprocess(clientId: string, clientSecret: string): Promise<string | null> {
  return new Promise(resolve => {
    const child = spawn(
      'npx',
      ['ts-node', 'scripts/google-auth.ts', '--client-id', clientId, '--client-secret', clientSecret],
      { stdio: ['inherit', 'pipe', 'inherit'], shell: true }
    );

    let output = '';
    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.on('close', () => {
      const match = output.match(/GOOGLE_REFRESH_TOKEN=([^\s\r\n]+)/);
      resolve(match ? match[1] : null);
    });

    child.on('error', (err: Error) => {
      console.error(`  OAuth subprocess error: ${err.message}`);
      resolve(null);
    });
  });
}

// ─── setVarsViaCli (identical logic to provision-client.ts) ──────────────────

function setVarsViaCli(token: string, projectId: string, serviceName: string, vars: Record<string, string>): void {
  const railwayEnv: NodeJS.ProcessEnv = { ...process.env, RAILWAY_TOKEN: token };
  const entries = Object.entries(vars);
  const BATCH = 10;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const kvPairs = batch
      .map(([k, v]) => `${k}="${v.trim().replace(/"/g, '')}"`)
      .join(' ');

    execSync(
      `railway variable set --project ${projectId} --service "${serviceName}" --environment production ${kvPairs}`,
      { env: railwayEnv, encoding: 'utf-8', stdio: 'pipe', timeout: 90000 }
    );
  }
}

// ─── Steps ───────────────────────────────────────────────────────────────────

async function step0_init(
  rl: readline.Interface,
  preloaded: Partial<DeployState>
): Promise<{ slug: string; resumeFrom: number; state: Partial<DeployState> }> {
  console.log('\n' + '='.repeat(62));
  console.log('  SABERRA DEPLOYMENT ENGINE');
  if (isDryRun)  console.log('  (DRY RUN - no changes will be made)');
  if (skipVal)   console.log('  (--skip-validation)');
  console.log('='.repeat(62));

  let slug = preloaded.slug;
  if (!slug) {
    slug = await ask(rl, 'Client slug (kebab-case, e.g. "verdana")');
    if (!slug) { console.error('Slug is required.'); process.exit(1); }
  } else {
    console.log(`\n  Using slug: ${slug}`);
  }

  const progress = loadProgressFile(slug);
  let resumeFrom = 1;
  let state: Partial<DeployState> = { ...preloaded, slug };

  if (progress && progress.completedStep > 0) {
    console.log(`\n  Found progress file for "${slug}" - completed through step ${progress.completedStep}.`);
    const resume = await ask(rl, `Resume from step ${progress.completedStep + 1}? (y/n)`, 'y');
    if (resume.toLowerCase() !== 'n') {
      resumeFrom = progress.completedStep + 1;
      // Merge: progress state takes priority over --input file values
      state = { ...state, ...progress.state, slug };
      console.log(`  Resuming from step ${resumeFrom}.`);
    } else {
      console.log('  Starting from step 1.');
    }
  }

  return { slug, resumeFrom, state };
}

async function step1_railway(rl: readline.Interface, state: Partial<DeployState>): Promise<void> {
  header(1, 9, 'Railway Project Setup');
  info([
    'Prerequisites - complete these in the Railway dashboard before continuing:',
    '',
    '  1. Create a new Railway project',
    '     Suggested name: "[ClientName] - Saberra Living Memory Hub"',
    '',
    '  2. Add 3 empty services with EXACT names:',
    '       - Sera Worker',
    '       - Sera Dashboard',
    '       - Sera API',
    '     (Empty services - no source connected yet, that is Step 8)',
    '',
    '  3. Generate public domains for Sera API and Sera Dashboard:',
    '     Click service > Settings > Networking > Generate Domain',
    '     Copy both https://...up.railway.app URLs',
    '',
    '  4. Create an account-level token (NOT a project token):',
    '     IMPORTANT: Log into Railway as the account that OWNS this project.',
    '     Each client has their own Railway account - use that account, not your personal one.',
    '     Go to railway.app/account/tokens > New Token (while logged in as the client account)',
    '     Account tokens are required for CLI commands. Project tokens will not work.',
    '',
    '  5. Get the Project ID from the URL:',
    '     https://railway.app/project/PROJECT_ID_IS_HERE',
  ]);

  state.railwayProjectId = await ask(rl, 'Railway project ID (UUID from URL)', state.railwayProjectId);
  state.railwayToken     = await ask(rl, 'Railway token (project-scoped)', state.railwayToken);
  state.seraApiUrl       = await ask(rl, 'Sera API URL (https://...up.railway.app)', state.seraApiUrl);
  state.seraDashboardUrl = await ask(rl, 'Sera Dashboard URL (https://...up.railway.app)', state.seraDashboardUrl);

  if (!skipVal && !isDryRun) {
    console.log('\n  Validating Railway connection...');
    dlog('step1', 'start', `project=${state.railwayProjectId}`);
    const r = await checkRailway(state.railwayToken!, state.railwayProjectId!);
    if (!r.ok) {
      console.error(`\n  Validation failed: ${r.error}`);
      dlog('step1', 'error', r.error);
      const reenter = await ask(rl, 'Re-enter Railway values? (y/n)', autoAccept ? 'n' : 'y');
      if (reenter.toLowerCase() !== 'n') {
        state.railwayToken     = await ask(rl, 'Railway token', state.railwayToken);
        state.railwayProjectId = await ask(rl, 'Railway project ID', state.railwayProjectId);
        const r2 = await checkRailway(state.railwayToken!, state.railwayProjectId!);
        if (!r2.ok) {
          console.error(`  Still failing: ${r2.error}`);
          console.error('  Continuing anyway - verify manually before step 7.');
          dlog('step1', 'error', `still failing: ${r2.error}`);
        } else {
          console.log('  Railway connection validated.');
          dlog('step1', 'done', 'validated on retry');
        }
      }
    } else {
      console.log('  Railway connection validated.');
      dlog('step1', 'done', 'validated');
    }
  }
}

async function step2_notion(rl: readline.Interface, state: Partial<DeployState>): Promise<void> {
  header(2, 9, 'Notion Workspace Setup');
  info([
    'You need a Notion workspace for this client and an internal integration.',
    '',
    '  1. Go to https://www.notion.so/my-integrations',
    '     Create new integration: Internal, no user capabilities',
    '     Copy the "Internal Integration Secret" (starts with secret_)',
    '',
    '  2. In the client Notion workspace, create a blank page',
    '     This is the hub page - all databases will be created under it',
    '',
    '  3. Connect the integration to this page:',
    '     Open the page > ... (top right) > Connections > Add a connection',
    '     Select the integration you created',
    '',
    '  4. Get the page ID from the URL:',
    '     notion.so/workspace-name/Page-Title-32HEXCHARACTERSHERE',
    '     The ID is the last 32 hex characters (no dashes needed)',
  ]);

  state.notionApiKey       = await ask(rl, 'Notion API key (secret_xxx)', state.notionApiKey);
  state.notionParentPageId = await ask(rl, 'Notion parent page ID (32 hex chars)', state.notionParentPageId);

  // Auto-extract ID if user pasted a full URL
  if (state.notionParentPageId?.includes('/') || state.notionParentPageId?.includes('-')) {
    const clean = state.notionParentPageId.replace(/-/g, '');
    const match = clean.match(/([a-f0-9]{32})/i);
    if (match) {
      state.notionParentPageId = match[1];
      console.log(`  Extracted page ID: ${state.notionParentPageId}`);
    }
  }

  const sensitivePrompt = await ask(
    rl,
    'Separate admin-only page ID for Sensitive Review DB? (optional, press Enter to skip)',
    state.sensitiveReviewParentPageId && !isFillIn(state.sensitiveReviewParentPageId)
      ? state.sensitiveReviewParentPageId
      : undefined
  );
  if (sensitivePrompt) state.sensitiveReviewParentPageId = sensitivePrompt;

  if (!skipVal && !isDryRun) {
    console.log('\n  Validating Notion connection...');
    dlog('step2', 'start', `page=${state.notionParentPageId}`);
    const r = await checkNotion(state.notionApiKey!, state.notionParentPageId!);
    if (!r.ok) {
      console.error(`\n  Validation failed: ${r.error}`);
      console.error('  Most common fix: open the Notion page, click ... > Connections > Add the integration.');
      dlog('step2', 'error', r.error);
      process.exit(1);
    }
    console.log('  Notion connection validated.');
    dlog('step2', 'done', 'validated');
  }
}

async function step3_email(rl: readline.Interface, state: Partial<DeployState>): Promise<void> {
  header(3, 9, 'Capture Inbox Setup');
  info([
    'Saberra uses a Saberra-owned capture inbox (e.g. verdana@saberra.com).',
    'The worker reads email from this inbox via IMAP.',
    '',
    '  IMPORTANT: Proton Mail does NOT work with cloud IMAP workers.',
    '  If the client uses Proton Mail, forward their address to a',
    '  Gmail/Google Workspace address that Saberra controls.',
    '',
    '  For Gmail or Google Workspace accounts, use an app-specific password:',
    '    myaccount.google.com > Security > App passwords',
    '    (requires 2FA to be enabled on the account)',
    '',
    '  Standard Gmail IMAP settings:',
    '    Host: imap.gmail.com   Port: 993   SSL: enabled',
    '',
    '  Also ensure IMAP is enabled in Gmail settings:',
    '    Settings > See all settings > Forwarding and POP/IMAP > Enable IMAP',
  ]);

  state.rootsEmail = await ask(rl, 'Capture inbox email (rootsEmail)', state.rootsEmail);
  state.imapHost   = await ask(rl, 'IMAP host', state.imapHost || 'imap.gmail.com');
  const portStr    = await ask(rl, 'IMAP port', String(state.imapPort ?? 993));
  state.imapPort   = parseInt(portStr, 10) || 993;
  state.imapUser   = await ask(rl, 'IMAP username (usually same as rootsEmail, or systems@ for aliases)', state.imapUser ?? state.rootsEmail);

  const isGmail = state.imapHost?.includes('gmail') || state.imapHost?.includes('google');
  if (isGmail) {
    console.log('\n  Gmail/Google Workspace detected - IMAP will use OAuth (no password needed).');
    console.log('  The refresh token from Step 4 authorizes IMAP access automatically.');
    console.log('  IMAP_PASS will not be set. Skipping password prompt.');
    state.imapPassword = undefined;
    dlog('step3', 'info', 'Gmail OAuth path - no IMAP password');
  } else {
    state.imapPassword = await ask(rl, 'IMAP app password (non-Google provider)', state.imapPassword);
    if (!skipVal && !isDryRun) {
      console.log('\n  Testing IMAP connection...');
      dlog('step3', 'start', `${state.imapUser}@${state.imapHost}:${state.imapPort}`);
      const r = await checkImap(state.imapHost!, state.imapPort!, state.imapUser!, state.imapPassword!);
      if (!r.ok) {
        console.error(`\n  IMAP validation failed: ${r.error}`);
        dlog('step3', 'error', r.error);
        process.exit(1);
      }
      console.log('  IMAP connection successful.');
      dlog('step3', 'done', 'IMAP validated');
    }
  }
}

async function step4_google(rl: readline.Interface, state: Partial<DeployState>): Promise<void> {
  header(4, 9, 'Google OAuth Setup');

  const hasToken = !isFillIn(state.googleRefreshToken);
  if (hasToken) {
    console.log(`\n  Existing refresh token found (${state.googleRefreshToken!.slice(0, 20)}...).`);
    const rerun = await ask(rl, 'Re-run OAuth flow to get a fresh token? (y/n)', 'n');
    if (rerun.toLowerCase() !== 'y') {
      dlog('step4', 'done', 'using existing refresh token');
      return;
    }
  }

  info([
    'You need a Google OAuth 2.0 client credential for the capture inbox account.',
    '',
    '  1. Go to https://console.cloud.google.com',
    '     Log in as the capture inbox account (e.g. verdana@saberra.com)',
    '',
    '  2. Create or open a project (name it "Saberra" or similar)',
    '',
    '  3. Configure OAuth consent screen:',
    '     APIs & Services > OAuth consent screen',
    '     User Type: Internal (if Google Workspace) or External',
    '     App name: Saberra   Scopes: leave defaults for now',
    '',
    '  4. Create a credential:',
    '     APIs & Services > Credentials > + Create Credentials > OAuth 2.0 Client IDs',
    '     Application type: Desktop app   Name: Saberra',
    '     Copy the Client ID and Client Secret',
    '',
    '  5. Enable these APIs (APIs & Services > Library):',
    '     - Google Drive API       (read meeting recordings/transcripts)',
    '     - Google Docs API        (export transcript/notes text)',
    '     - Gmail API              (send notifications, read capture inbox via OAuth)',
    '     - Google Sheets API      (Sera creates team spreadsheets)',
    '     - Google Slides API      (Sera creates team presentations)',
  ]);

  state.googleClientId     = await ask(rl, 'Google OAuth Client ID', state.googleClientId);
  state.googleClientSecret = await ask(rl, 'Google OAuth Client Secret', state.googleClientSecret);

  if (isDryRun) {
    console.log('\n  [DRY RUN] Skipping OAuth flow.');
    state.googleRefreshToken = 'DRY_RUN_TOKEN';
    return;
  }

  console.log('\n  Launching OAuth flow...');
  console.log('  A browser window will open. Log in as the capture inbox account and grant access.');
  console.log('  If no browser opens, copy the URL that is printed and open it manually.');
  dlog('step4', 'start', `clientId=${state.googleClientId}`);

  const refreshToken = await runOAuthSubprocess(state.googleClientId!, state.googleClientSecret!);
  if (!refreshToken) {
    console.error('\n  OAuth flow did not produce a refresh token.');
    console.error('  If you previously authorized this app, revoke it first:');
    console.error('    myaccount.google.com/permissions > remove "Saberra"');
    console.error('  Then re-run this step.');
    dlog('step4', 'error', 'no refresh token returned');
    process.exit(1);
  }

  state.googleRefreshToken = refreshToken;
  console.log('\n  Refresh token obtained and saved.');
  dlog('step4', 'done', 'refresh token obtained');
}

async function step5_config(rl: readline.Interface, state: Partial<DeployState>): Promise<void> {
  header(5, 9, 'Admin & Governance Config');

  const suggestedTenantId = state.slug
    ? state.slug.replace(/-/g, '_').toUpperCase()
    : undefined;

  state.tenantId   = await ask(rl, 'Tenant ID (short UPPERCASE code)', state.tenantId ?? suggestedTenantId);
  state.adminEmail = await ask(rl, 'Admin notification email (for alerts and access requests)', state.adminEmail);

  if (state.adminEmail === state.rootsEmail) {
    console.error('\n  Error: adminEmail cannot equal rootsEmail - this creates an email processing loop.');
    state.adminEmail = await ask(rl, 'Admin email (must be a different address from rootsEmail)');
  }

  // Governing purpose
  if (!isFillIn(state.governingPurpose)) {
    console.log(`\n  Current governing purpose:\n  "${state.governingPurpose!.slice(0, 100)}..."`);
    const keep = await ask(rl, 'Keep this governing purpose? (y/n)', 'y');
    if (keep.toLowerCase() === 'n') {
      state.governingPurpose = await askMultiline(rl, 'Governing Purpose Statement');
    }
  } else {
    const addGps = await ask(rl, '\n  Add a governing purpose statement? Enables AI purpose-alignment scoring. (y/n)', 'n');
    if (addGps.toLowerCase() === 'y') {
      state.governingPurpose = await askMultiline(rl, 'Governing Purpose Statement');
    }
  }

  const communityDefault = state.communityLayer !== undefined
    ? (state.communityLayer ? 'y' : 'n')
    : 'y';
  const cl = await ask(rl, 'Enable community layer DBs (Tensions, Events, Gratitudes, etc.)? (y/n)', communityDefault);
  state.communityLayer = cl.toLowerCase() !== 'n';

  state.claudeModel = await ask(rl, 'Claude model', state.claudeModel ?? 'claude-sonnet-4-6');

  dlog('step5', 'done', `tenantId=${state.tenantId}, communityLayer=${state.communityLayer}, model=${state.claudeModel}`);
}

async function step6_databases(state: Partial<DeployState>): Promise<void> {
  header(6, 9, 'Create Notion Databases');

  const dbCount = state.communityLayer ? 24 : 18;
  if (isDryRun) {
    console.log(`\n  [DRY RUN] Would create ${dbCount} Notion databases in page ${state.notionParentPageId}`);
    state.dbIds = {};
    return;
  }

  console.log(`\n  Creating ${dbCount} Notion databases... (this takes 1-3 minutes)`);
  dlog('step6', 'start', `${dbCount} databases, communityLayer=${state.communityLayer}`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NOTION_API_KEY:           state.notionApiKey!,
    TEMPLATE_PARENT_PAGE_ID:  state.notionParentPageId!,
    COMMUNITY_LAYER:          state.communityLayer ? 'true' : 'false',
    ...(state.sensitiveReviewParentPageId
      ? { SENSITIVE_REVIEW_PARENT_PAGE_ID: state.sensitiveReviewParentPageId }
      : {}),
  };

  let stdout: string;
  try {
    stdout = execSync(
      'npx ts-node scripts/create-saberra-template.ts',
      { env, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300000 }
    );
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; message?: string };
    console.error('\n  Database creation failed:');
    if (execErr.stderr) console.error(execErr.stderr);
    dlog('step6', 'error', execErr.message ?? 'unknown');
    throw new Error(`Database creation failed: ${execErr.message ?? 'unknown'}`);
  }

  stdout.split('\n')
    .filter(l => l.trim() && !l.startsWith('SABERRA_DB_IDS:'))
    .forEach(l => console.log(`  ${l}`));

  const idLine = stdout.split('\n').find(l => l.startsWith('SABERRA_DB_IDS:'));
  if (!idLine) {
    throw new Error('create-saberra-template.ts did not output SABERRA_DB_IDS. Check the template script.');
  }

  state.dbIds = JSON.parse(idLine.slice('SABERRA_DB_IDS:'.length)) as Record<string, string>;
  console.log(`  All ${dbCount} databases created.`);
  dlog('step6', 'done', `${Object.keys(state.dbIds).length} DB IDs`);
}

async function step7_envVars(state: Partial<DeployState>): Promise<void> {
  header(7, 9, 'Set Railway Environment Variables');

  if (isDryRun) {
    console.log('\n  [DRY RUN] Would set env vars on: Sera Worker, Sera Dashboard, Sera API');
    return;
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set in .env.saberra');

  const seraApiSecret = state.seraApiSecret ?? crypto.randomBytes(32).toString('hex');
  state.seraApiSecret = seraApiSecret;

  const dbIds = state.dbIds!;
  const notionVars: Record<string, string> = {
    NOTION_API_KEY:                  state.notionApiKey!,
    NOTION_PARENT_PAGE_ID:           state.notionParentPageId!,
    NOTION_DB_TASKS:                 dbIds['tasksId'],
    NOTION_DB_DECISION_CANDIDATES:   dbIds['decisionsId'],
    NOTION_DB_RISKS:                 dbIds['risksId'],
    NOTION_DB_MEMORY_REVIEW_QUEUE:   dbIds['mrqId'],
    NOTION_DB_PROFILES:              dbIds['profilesId'],
    NOTION_DB_PROJECTS:              dbIds['projectsId'],
    NOTION_DB_CIRCLES:               dbIds['circlesId'],
    NOTION_DB_ROLES:                 dbIds['rolesId'],
    NOTION_DB_ROLE_ASSIGNMENTS:      dbIds['assignmentsId'],
    NOTION_DB_CANON_CHANGE_REQUESTS: dbIds['canonId'],
    NOTION_DB_CCOS_LEDGER_ENTRIES:   dbIds['ledgerId'],
    NOTION_DB_MESSAGES:              dbIds['messagesId'],
    NOTION_DB_SOURCE_EMAILS:         dbIds['sourceEmailsId'],
    NOTION_DB_MEETINGS:              dbIds['meetingsId'],
    NOTION_DB_MEETING_ASSETS:        dbIds['meetingAssetsId'],
    NOTION_DB_PROCESSING_EVENTS:     dbIds['processingEventsId'],
    NOTION_DB_SENSITIVE_REVIEW:      dbIds['sensitiveReviewId'],
  };

  if (state.communityLayer) {
    if (dbIds['tensionsId'])   notionVars['NOTION_DB_TENSIONS']       = dbIds['tensionsId'];
    if (dbIds['agreementsId']) notionVars['NOTION_DB_COMMITMENTS']    = dbIds['agreementsId'];
    if (dbIds['gratitudesId']) notionVars['NOTION_DB_GRATITUDES']     = dbIds['gratitudesId'];
    if (dbIds['eventsId'])     notionVars['NOTION_DB_EVENTS']         = dbIds['eventsId'];
    if (dbIds['retrosId'])     notionVars['NOTION_DB_RETROSPECTIVES']  = dbIds['retrosId'];
    if (dbIds['resourcesId'])  notionVars['NOTION_DB_RESOURCES']      = dbIds['resourcesId'];
  }

  const baseVars: Record<string, string> = {
    ...notionVars,
    NODE_ENV:                     'production',
    ROOTS_EMAIL:                  state.rootsEmail!,
    IMAP_HOST:                    state.imapHost!,
    IMAP_PORT:                    String(state.imapPort),
    IMAP_USER:                    state.imapUser!,
    ...(state.imapPassword ? { IMAP_PASSWORD: state.imapPassword } : {}),
    GOOGLE_CLIENT_ID:             state.googleClientId!,
    GOOGLE_CLIENT_SECRET:         state.googleClientSecret!,
    GOOGLE_REFRESH_TOKEN:         state.googleRefreshToken!,
    ADMIN_NOTIFICATION_EMAIL:     state.adminEmail!,
    TENANT_ID:                    state.tenantId!,
    ANTHROPIC_API_KEY:            anthropicKey,
    CLAUDE_MODEL:                 state.claudeModel!,
    MAX_RETRY_COUNT:              '4',
    GMAIL_POLL_INTERVAL_SECONDS:  '180',
    SERA_API_SECRET:              seraApiSecret,
  };
  if (state.governingPurpose) baseVars['AMORA_GOVERNING_PURPOSE'] = state.governingPurpose;

  const workerVars: Record<string, string> = { ...baseVars, SERVICE_TYPE: 'worker',    NIXPACKS_START_CMD: 'node dist/worker.js' };
  const dashVars:   Record<string, string> = { ...baseVars, SERVICE_TYPE: 'dashboard', NIXPACKS_START_CMD: 'node dist/dashboard/server.js', SERA_API_URL: state.seraApiUrl!, SERA_DASHBOARD_URL: state.seraDashboardUrl! };
  const apiVars:    Record<string, string> = { ...baseVars, SERVICE_TYPE: 'api',       NIXPACKS_START_CMD: 'node dist/api/server.js',       SERA_API_URL: state.seraApiUrl!, SERA_API_BASE_URL: state.seraApiUrl!, PORT: '3001' };

  dlog('step7', 'start', `${Object.keys(baseVars).length} base vars, 3 services`);

  const services: [string, Record<string, string>][] = [
    ['Sera Worker', workerVars],
    ['Sera Dashboard', dashVars],
    ['Sera API', apiVars],
  ];

  for (const [name, vars] of services) {
    console.log(`\n  Setting vars on ${name}...`);
    try {
      setVarsViaCli(state.railwayToken!, state.railwayProjectId!, name, vars);
      console.log(`  Done (${Object.keys(vars).length} vars).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n  Failed on ${name}: ${msg.slice(0, 300)}`);
      console.error('  Check: token permissions, service name spelling, Railway CLI installed.');
      dlog('step7', 'error', `${name}: ${msg.slice(0, 200)}`);
      throw err;
    }
  }

  dlog('step7', 'done', 'all services updated');
}

async function step8_github(rl: readline.Interface, state: Partial<DeployState>): Promise<void> {
  header(8, 9, 'Connect GitHub Repository');
  info([
    'Connect the Saberra GitHub repo to each Railway service.',
    'All 3 services use the same repo - SERVICE_TYPE controls which process starts.',
    '',
    'For each service (Sera Worker, Sera Dashboard, Sera API):',
    `  Go to: https://railway.app/project/${state.railwayProjectId ?? '[your-project-id]'}`,
    '  Click the service > Settings > Source > Connect Repo',
    '  Select the Saberra GitHub repo and branch: main',
    '  Click Deploy to trigger the first build',
    '',
    'Expected build time: 2-4 minutes per service (first build caches dependencies).',
    'After deploying, check the build logs to confirm it starts without errors.',
    '',
    'Common build issues:',
    '  - "Cannot find module" -> env var NIXPACKS_START_CMD might not be set (Step 7 sets it)',
    '  - Worker exits immediately -> check IMAP credentials and Notion DB IDs in Railway variables',
  ]);

  if (!autoAccept) {
    await ask(rl, 'Press Enter when GitHub is connected and builds have been triggered');
  } else {
    console.log('\n  --yes mode: skipping GitHub confirmation. Connect GitHub manually after deployment.');
  }
  dlog('step8', 'done', 'GitHub connection confirmed');
}

async function step9_finalize(state: Partial<DeployState>): Promise<void> {
  header(9, 9, 'Finalize');

  const manualSteps = [
    `Add Notion cross-database relations: Open the "Getting Started" page created in Step 6. It lists all 23 relations that need to be added manually (Notion API limitation).`,
    `Google Meet/Calendar forwarding: Ask the client to configure Google Meet to send meeting notifications to ${state.rootsEmail}.`,
    state.sensitiveReviewParentPageId
      ? `Sensitive Review DB: Share the separate admin page (${state.sensitiveReviewParentPageId}) with the Notion integration.`
      : `SECURITY - Move Sensitive Review DB: The Sensitive Review database is currently in the shared workspace. Move it to an admin-only workspace and update NOTION_DB_SENSITIVE_REVIEW on all 3 Railway services.`,
    `Verify worker health: Check Railway logs for "Sera Worker". The first successful IMAP poll log should appear within 180 seconds of the service starting.`,
  ];

  if (!isDryRun) {
    const manifestPath = path.join('clients', `${state.slug}.manifest.json`);
    const manifest = {
      slug:                state.slug,
      tenantId:            state.tenantId,
      railwayProjectId:    state.railwayProjectId,
      seraApiUrl:          state.seraApiUrl,
      seraDashboardUrl:    state.seraDashboardUrl,
      seraApiSecret:       state.seraApiSecret,
      notionParentPageId:  state.notionParentPageId,
      dbIds:               state.dbIds,
      deployedAt:          new Date().toISOString(),
      manualStepsRequired: manualSteps,
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    dlog('step9', 'done', `manifest: ${manifestPath}`);
    writeDeployLog(state.slug!);

    // Clean up progress file now that deployment is complete
    const pf = progressFilePath(state.slug!);
    if (fs.existsSync(pf)) fs.unlinkSync(pf);
  }

  console.log('\n' + '='.repeat(62));
  console.log(isDryRun ? '  DRY RUN COMPLETE - no changes were made' : '  DEPLOYMENT COMPLETE');
  console.log('='.repeat(62));
  if (!isDryRun) {
    console.log(`  Client:          ${state.slug} (${state.tenantId})`);
    console.log(`  Railway project: https://railway.app/project/${state.railwayProjectId}`);
    console.log(`  Sera Dashboard:  ${state.seraDashboardUrl}`);
    console.log(`  Sera API:        ${state.seraApiUrl}`);
    console.log(`  Sera API secret: ${state.seraApiSecret}`);
    console.log(`  Manifest:        clients/${state.slug}.manifest.json`);
    console.log(`  Deploy log:      clients/${state.slug}.deployment.log`);
    console.log('\n  Manual steps remaining:');
    manualSteps.forEach((s, i) => console.log(`\n  ${i + 1}. ${s}`));
  }
  console.log('\n' + '='.repeat(62) + '\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not found.');
    console.error('Ensure .env.saberra exists with ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  const preloaded = loadInputFile();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.on('close', () => process.exit(0));

  const { slug, resumeFrom, state } = await step0_init(rl, preloaded);

  type StepFn = () => Promise<void>;
  const steps: Array<{ num: number; fn: StepFn }> = [
    { num: 1, fn: () => step1_railway(rl, state) },
    { num: 2, fn: () => step2_notion(rl, state) },
    { num: 3, fn: () => step3_email(rl, state) },
    { num: 4, fn: () => step4_google(rl, state) },
    { num: 5, fn: () => step5_config(rl, state) },
    { num: 6, fn: () => step6_databases(state) },
    { num: 7, fn: () => step7_envVars(state) },
    { num: 8, fn: () => step8_github(rl, state) },
    { num: 9, fn: () => step9_finalize(state) },
  ];

  for (const { num, fn } of steps) {
    if (num < resumeFrom) continue;

    try {
      await fn();
      if (num < 9) saveProgress(slug, num, state);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nStep ${num} failed: ${msg}`);
      dlog(`step${num}`, 'error', msg);
      if (num > 1) saveProgress(slug, num - 1, state);
      writeDeployLog(slug);
      console.error(`Progress saved through step ${num - 1}. Re-run to resume from step ${num}.`);
      rl.close();
      process.exit(1);
    }
  }

  rl.close();
}

main().catch((err: unknown) => {
  console.error('Deployment engine error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
