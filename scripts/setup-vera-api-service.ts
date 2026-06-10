/**
 * Copies all env vars from the worker service to the sera-api service,
 * adds SERA_API_SECRET and NIXPACKS_START_CMD, then triggers a deploy.
 *
 * Usage: npx ts-node scripts/setup-vera-api-service.ts
 * Requires: RAILWAY_TOKEN env var or ~/.railway/config.json
 */

import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

const PROJECT_ID   = '34612e1f-133c-4ce7-b7d8-34f4e8c63d6d';
const ENVIRONMENT_ID = 'c35c313d-889a-4faa-9f24-2b4dd32f8297';
const SERA_API_SERVICE_ID = 'da7bf532-c97c-4fe6-bbd5-74ac1e0324ee';
const GRAPHQL_URL = 'https://backboard.railway.app/graphql/v2';

function getToken(): string {
  const configPath = os.homedir() + '/.railway/config.json';
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return cfg.user.accessToken as string;
}

async function gql(token: string, query: string, variables: unknown): Promise<unknown> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json() as { data?: unknown; errors?: unknown[] };
  if (data.errors?.length) throw new Error(JSON.stringify(data.errors, null, 2));
  return data.data;
}

async function main() {
  console.log('\n' + '='.repeat(72));
  console.log('  Sera API Service Setup');
  console.log('='.repeat(72) + '\n');

  const token = getToken();
  console.log('  Auth token loaded from ~/.railway/config.json');

  // Get worker vars
  const workerVarsRaw = execSync('railway variables --service worker --json', { encoding: 'utf-8' });
  const workerVars = JSON.parse(workerVarsRaw) as Record<string, string>;
  console.log(`  Worker vars loaded: ${Object.keys(workerVars).length} variables`);

  // Generate API secret or reuse existing
  const existingVars = (() => {
    try {
      const raw = execSync('railway variables --service "Sera API" --json', { encoding: 'utf-8' });
      return JSON.parse(raw) as Record<string, string>;
    } catch { return {} as Record<string, string>; }
  })();

  const secret = existingVars.SERA_API_SECRET ?? randomBytes(32).toString('hex');
  const isNewSecret = !existingVars.SERA_API_SECRET;
  console.log(`  SERA_API_SECRET: ${isNewSecret ? 'generated (new)' : 'reusing existing'}`);

  // Build final vars
  const skip = ['RAILWAY_'];
  const seraVars: Record<string, string> = {
    ...Object.fromEntries(Object.entries(workerVars).filter(([k]) => !skip.some(s => k.startsWith(s)))),
    SERA_API_SECRET: secret,
    NIXPACKS_START_CMD: 'node dist/api/server.js',
    NODE_ENV: 'production',
  };

  console.log(`  Variables to set: ${Object.keys(seraVars).length}`);

  // Set via GraphQL
  const result = await gql(token,
    `mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }`,
    {
      input: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERA_API_SERVICE_ID,
        variables: seraVars,
      },
    },
  );
  console.log('  Variables set:', JSON.stringify(result).slice(0, 80));

  if (isNewSecret) {
    console.log('\n  *** SERA_API_SECRET (save this) ***');
    console.log(`  ${secret}`);
    console.log('  ***********************************\n');
  }

  console.log('\n  Done. Run: railway up --service "Sera API"\n');
}

main().catch(err => { console.error(err); process.exit(1); });
