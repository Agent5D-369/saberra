/**
 * Saberra client provisioner.
 *
 * Usage:
 *   npx ts-node scripts/provision-client.ts --input clients/[slug].input.json
 *   npx ts-node scripts/provision-client.ts --input clients/[slug].input.json --dry-run
 *
 * Prerequisites (complete before running):
 *   - .env.saberra with ANTHROPIC_API_KEY
 *   - Client's Railway account has a project with 3 services already created:
 *       "Sera Worker", "Sera Dashboard", "Sera API"
 *   - Railway.app domains generated for Sera API and Sera Dashboard services
 *   - Project-scoped Railway token (railwayToken in input JSON)
 *   - Client input JSON filled out per clients/template.input.json
 *
 * What this does (6 steps):
 *   1. Load and validate input JSON
 *   2. Create all Notion databases via create-saberra-template.ts subprocess
 *   3. Map DB IDs to Railway env var names
 *   4. Build complete env vars object (one set for each service)
 *   5. Set env vars on all 3 services via Railway CLI
 *   6. Write manifest and print summary
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.saberra' });

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientInput {
  slug: string;
  tenantId: string;
  notionParentPageId: string;
  notionApiKey: string;
  rootsEmail: string;
  adminEmail: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword?: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  governingPurpose?: string;
  communityLayer: boolean;
  claudeModel?: string;
  sensitiveReviewParentPageId?: string;
  // Railway: project-scoped token + IDs for the pre-created client project
  railwayToken: string;
  railwayProjectId: string;
  seraApiUrl: string;
  seraDashboardUrl: string;
}

interface DbIds {
  tasksId: string;
  decisionsId: string;
  risksId: string;
  mrqId: string;
  profilesId: string;
  projectsId: string;
  circlesId: string;
  rolesId: string;
  assignmentsId: string;
  canonId: string;
  ledgerId: string;
  kbId: string;
  messagesId: string;
  tensionsId: string | null;
  agreementsId: string | null;
  gratitudesId: string | null;
  eventsId: string | null;
  retrosId: string | null;
  resourcesId: string | null;
  sourceEmailsId: string;
  meetingsId: string;
  meetingAssetsId: string;
  processingEventsId: string;
  sensitiveReviewId: string;
}

interface ClientManifest {
  slug: string;
  tenantId: string;
  railwayProjectId: string;
  seraApiUrl: string;
  seraDashboardUrl: string;
  seraApiSecret: string;
  notionParentPageId: string;
  dbIds: DbIds;
  provisionedAt: string;
  manualStepsRequired: string[];
}

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const inputFlag = args.indexOf('--input');
const isDryRun  = args.includes('--dry-run');

if (inputFlag === -1 || !args[inputFlag + 1]) {
  console.error('Usage: npx ts-node scripts/provision-client.ts --input clients/[slug].input.json [--dry-run]');
  process.exit(1);
}

const inputPath = path.resolve(args[inputFlag + 1]);

// ─── Validation ───────────────────────────────────────────────────────────────

function validateInput(raw: Record<string, unknown>): ClientInput {
  const required: (keyof ClientInput)[] = [
    'slug', 'tenantId', 'notionParentPageId', 'notionApiKey',
    'rootsEmail', 'adminEmail', 'imapHost', 'imapPort',
    'imapUser', 'googleClientId', 'googleClientSecret',
    'googleRefreshToken', 'railwayToken', 'railwayProjectId',
    'seraApiUrl', 'seraDashboardUrl',
  ];

  const missing: string[] = [];
  for (const key of required) {
    const val = raw[key];
    if (val === undefined || val === null || val === '') {
      missing.push(key);
    }
  }
  if (typeof raw.communityLayer !== 'boolean') {
    missing.push('communityLayer (must be true or false)');
  }

  if (missing.length > 0) {
    console.error('Validation failed. Missing or empty required fields:');
    missing.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }

  if ('_instructions' in raw) {
    console.error('Error: The input file still contains the _instructions block. Remove it before running.');
    process.exit(1);
  }

  return raw as unknown as ClientInput;
}

// ─── Step functions ───────────────────────────────────────────────────────────

// Step 2: Run create-saberra-template.ts as subprocess and parse DB IDs from stdout
function createNotionDatabases(input: ClientInput): DbIds {
  console.log('\nStep 2: Creating Notion databases...');
  console.log(`  Parent page: ${input.notionParentPageId}`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NOTION_API_KEY: input.notionApiKey,
    TEMPLATE_PARENT_PAGE_ID: input.notionParentPageId,
    COMMUNITY_LAYER: input.communityLayer ? 'true' : 'false',
    ...(input.sensitiveReviewParentPageId
      ? { SENSITIVE_REVIEW_PARENT_PAGE_ID: input.sensitiveReviewParentPageId }
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
    console.error('Error running create-saberra-template.ts:');
    if (execErr.stderr) console.error(execErr.stderr);
    if (execErr.stdout) console.error(execErr.stdout);
    throw new Error(`DB creation failed: ${execErr.message ?? 'unknown error'}`);
  }

  stdout.split('\n')
    .filter(l => !l.startsWith('SABERRA_DB_IDS:'))
    .forEach(l => console.log(' ', l));

  const idLine = stdout.split('\n').find(l => l.startsWith('SABERRA_DB_IDS:'));
  if (!idLine) {
    throw new Error(
      'create-saberra-template.ts did not emit SABERRA_DB_IDS line. ' +
      'Make sure the template script outputs this line.'
    );
  }

  const dbIds = JSON.parse(idLine.slice('SABERRA_DB_IDS:'.length)) as DbIds;
  console.log('  All databases created successfully.');
  return dbIds;
}

// Steps 3+4: Map DB IDs to env vars and build the complete vars object
function buildEnvVars(input: ClientInput, dbIds: DbIds): Record<string, string> {
  const seraApiSecret = crypto.randomBytes(32).toString('hex');

  const notionVars: Record<string, string> = {
    NOTION_API_KEY:                  input.notionApiKey,
    NOTION_PARENT_PAGE_ID:           input.notionParentPageId,
    NOTION_DB_TASKS:                 dbIds.tasksId,
    NOTION_DB_DECISION_CANDIDATES:   dbIds.decisionsId,
    NOTION_DB_RISKS:                 dbIds.risksId,
    NOTION_DB_MEMORY_REVIEW_QUEUE:   dbIds.mrqId,
    NOTION_DB_PROFILES:              dbIds.profilesId,
    NOTION_DB_PROJECTS:              dbIds.projectsId,
    NOTION_DB_CIRCLES:               dbIds.circlesId,
    NOTION_DB_ROLES:                 dbIds.rolesId,
    NOTION_DB_ROLE_ASSIGNMENTS:      dbIds.assignmentsId,
    NOTION_DB_CANON_CHANGE_REQUESTS: dbIds.canonId,
    NOTION_DB_CCOS_LEDGER_ENTRIES:   dbIds.ledgerId,
    NOTION_DB_MESSAGES:              dbIds.messagesId,
    NOTION_DB_SOURCE_EMAILS:         dbIds.sourceEmailsId,
    NOTION_DB_MEETINGS:              dbIds.meetingsId,
    NOTION_DB_MEETING_ASSETS:        dbIds.meetingAssetsId,
    NOTION_DB_PROCESSING_EVENTS:     dbIds.processingEventsId,
    NOTION_DB_SENSITIVE_REVIEW:      dbIds.sensitiveReviewId,
  };

  if (input.communityLayer) {
    if (dbIds.tensionsId)   notionVars['NOTION_DB_TENSIONS']       = dbIds.tensionsId;
    if (dbIds.agreementsId) notionVars['NOTION_DB_COMMITMENTS']    = dbIds.agreementsId;
    if (dbIds.gratitudesId) notionVars['NOTION_DB_GRATITUDES']     = dbIds.gratitudesId;
    if (dbIds.eventsId)     notionVars['NOTION_DB_EVENTS']         = dbIds.eventsId;
    if (dbIds.retrosId)     notionVars['NOTION_DB_RETROSPECTIVES']  = dbIds.retrosId;
    if (dbIds.resourcesId)  notionVars['NOTION_DB_RESOURCES']      = dbIds.resourcesId;
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY is not set in .env.saberra');

  const vars: Record<string, string> = {
    ...notionVars,

    NODE_ENV: 'production',

    ROOTS_EMAIL:   input.rootsEmail,
    IMAP_HOST:     input.imapHost,
    IMAP_PORT:     String(input.imapPort),
    IMAP_USER:     input.imapUser,
    ...(input.imapPassword ? { IMAP_PASSWORD: input.imapPassword } : {}),

    GOOGLE_CLIENT_ID:     input.googleClientId,
    GOOGLE_CLIENT_SECRET: input.googleClientSecret,
    GOOGLE_REFRESH_TOKEN: input.googleRefreshToken,

    ADMIN_NOTIFICATION_EMAIL:    input.adminEmail,
    TENANT_ID:                   input.tenantId,

    ANTHROPIC_API_KEY:           anthropicKey,
    CLAUDE_MODEL:                input.claudeModel ?? 'claude-sonnet-4-6',
    MAX_RETRY_COUNT:             '4',
    GMAIL_POLL_INTERVAL_SECONDS: '180',

    SERA_API_SECRET: seraApiSecret,
  };

  if (input.governingPurpose) {
    vars['AMORA_GOVERNING_PURPOSE'] = input.governingPurpose;
  }

  // Stash the secret for manifest writing
  (vars as Record<string, string>)['_seraApiSecret'] = seraApiSecret;

  return vars;
}

// Step 5: Set env vars on a Railway service via CLI.
// Uses batched calls (10 vars at a time) to stay well within arg limits.
// Values are double-quoted so spaces and special chars are handled safely.
// Note: values must not contain double-quote characters (true for all Saberra env vars).
function setVarsViaCli(
  token: string,
  projectId: string,
  serviceName: string,
  vars: Record<string, string>
): void {
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();

  // ── Step 1: Load and validate input ────────────────────────────────────────
  console.log('\nStep 1: Loading and validating input...');

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as Record<string, unknown>;
  const input   = validateInput(rawJson);

  console.log(`  Slug:            ${input.slug}`);
  console.log(`  TenantId:        ${input.tenantId}`);
  console.log(`  RootsEmail:      ${input.rootsEmail}`);
  console.log(`  Community layer: ${input.communityLayer}`);
  console.log(`  Railway project: ${input.railwayProjectId}`);
  console.log(`  Sera API URL:    ${input.seraApiUrl}`);
  console.log(`  Dashboard URL:   ${input.seraDashboardUrl}`);

  if (isDryRun) {
    console.log('\n-- DRY RUN -- No changes will be made.\n');
    console.log('Would create:');
    console.log(`  Notion databases: ${input.communityLayer ? 24 : 18} (in page ${input.notionParentPageId})`);
    console.log(`  Set Railway env vars on: Sera Worker, Sera Dashboard, Sera API`);
    console.log(`  Manifest: clients/${input.slug}.manifest.json`);
    process.exit(0);
  }

  // ── Step 2: Create Notion databases ────────────────────────────────────────
  const dbIds = createNotionDatabases(input);

  // ── Steps 3+4: Build env vars ───────────────────────────────────────────────
  console.log('\nSteps 3+4: Building env vars...');
  const allVars = buildEnvVars(input, dbIds);
  const seraApiSecret = allVars['_seraApiSecret'] ?? '';
  delete allVars['_seraApiSecret'];
  console.log(`  Built ${Object.keys(allVars).length} env vars`);

  // ── Step 5: Set env vars on all 3 services ─────────────────────────────────
  console.log('\nStep 5: Setting env vars via Railway CLI...');

  const workerVars: Record<string, string> = {
    ...allVars,
    SERVICE_TYPE:       'worker',
    NIXPACKS_START_CMD: 'node dist/worker.js',
  };

  const dashboardVars: Record<string, string> = {
    ...allVars,
    SERVICE_TYPE:       'dashboard',
    SERA_API_URL:       input.seraApiUrl,
    NIXPACKS_START_CMD: 'node dist/dashboard/server.js',
  };

  const apiVars: Record<string, string> = {
    ...allVars,
    SERVICE_TYPE:       'api',
    PORT:               '3001',
    SERA_API_URL:       input.seraApiUrl,
    SERA_API_BASE_URL:  input.seraApiUrl,
    NIXPACKS_START_CMD: 'node dist/api/server.js',
  };

  try {
    console.log('  Setting vars on Sera Worker...');
    setVarsViaCli(input.railwayToken, input.railwayProjectId, 'Sera Worker', workerVars);
    console.log('  Done.');

    console.log('  Setting vars on Sera Dashboard...');
    setVarsViaCli(input.railwayToken, input.railwayProjectId, 'Sera Dashboard', dashboardVars);
    console.log('  Done.');

    console.log('  Setting vars on Sera API...');
    setVarsViaCli(input.railwayToken, input.railwayProjectId, 'Sera API', apiVars);
    console.log('  Done.');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\nRailway CLI error:', msg);
    console.error('\nTroubleshooting:');
    console.error('  - Verify railwayToken is a valid project-scoped token for this project');
    console.error('  - Verify the services are named exactly: "Sera Worker", "Sera Dashboard", "Sera API"');
    console.error('  - Verify Railway CLI is installed: railway --version');
    throw err;
  }

  // ── Step 6: Write manifest ──────────────────────────────────────────────────
  console.log('\nStep 6: Writing manifest...');

  const manualSteps = [
    `Connect GitHub repo to all 3 Railway services: Railway Dashboard > each service > Settings > Source > GitHub > select repo + branch main, then trigger a deploy`,
    `Share the Notion hub page with the Notion integration: open parent page in Notion > ... > Connections > Add integration (from notionApiKey)`,
    `Configure Google Meet/Calendar to send asset notifications to ${input.rootsEmail}`,
    ...(input.sensitiveReviewParentPageId
      ? [`Share the separate Sensitive Review page with the integration: open the sensitiveReviewParentPageId page > ... > Connections > Add integration`]
      : [`SECURITY: Move 'Sensitive Review' DB to an admin-only Notion workspace. Update NOTION_DB_SENSITIVE_REVIEW on all 3 services with the new DB ID.`]
    ),
  ];

  const manifest: ClientManifest = {
    slug:                input.slug,
    tenantId:            input.tenantId,
    railwayProjectId:    input.railwayProjectId,
    seraApiUrl:          input.seraApiUrl,
    seraDashboardUrl:    input.seraDashboardUrl,
    seraApiSecret,
    notionParentPageId:  input.notionParentPageId,
    dbIds,
    provisionedAt:       new Date().toISOString(),
    manualStepsRequired: manualSteps,
  };

  const manifestPath = path.join(path.dirname(inputPath), `${input.slug}.manifest.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`  Manifest written to: ${manifestPath}`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('PROVISIONING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Client slug:      ${input.slug}`);
  console.log(`Time taken:       ${elapsed}s`);
  console.log(`Railway project:  https://railway.app/project/${input.railwayProjectId}`);
  console.log(`Sera API URL:     ${input.seraApiUrl}`);
  console.log(`Sera Dashboard:   ${input.seraDashboardUrl}`);
  console.log(`Sera API secret:  ${seraApiSecret}`);
  console.log(`Manifest:         ${manifestPath}`);
  console.log('\nManual steps required:');
  manualSteps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  console.log('='.repeat(60) + '\n');
}

main().catch((err: unknown) => {
  console.error('\nProvisioning failed:', err instanceof Error ? err.message : err);
  console.error('Check the manifest file (if created) for partial state.');
  process.exit(1);
});
