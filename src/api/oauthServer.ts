import type { IncomingMessage, ServerResponse } from 'http';
import * as crypto from 'crypto';
import { logger } from '../config/logger';

interface PendingCode {
  codeChallenge: string;
  codeChallengeMethod: string;
  redirectUri: string;
  expiresAt: number;
}

const pendingCodes = new Map<string, PendingCode>();

setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingCodes.entries()) {
    if (data.expiresAt < now) pendingCodes.delete(code);
  }
}, 60_000);

function he(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pkceVerify(verifier: string, challenge: string, method: string): boolean {
  if (method === 'S256') {
    return crypto.createHash('sha256').update(verifier).digest('base64url') === challenge;
  }
  return verifier === challenge;
}

async function readFormBody(req: IncomingMessage): Promise<URLSearchParams> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(new URLSearchParams(data)));
    req.on('error', reject);
  });
}

// Registered clients — accepted at face value (single-tenant, passphrase is the real auth)
const registeredClients = new Map<string, { redirectUris: string[]; clientName?: string }>();

export function handleOAuthMetadata(
  _req: IncomingMessage,
  res: ServerResponse,
  baseUrl: string,
): void {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['mcp'],
  }));
}

export function handleProtectedResourceMetadata(
  _req: IncomingMessage,
  res: ServerResponse,
  baseUrl: string,
): void {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({
    resource: baseUrl,
    authorization_servers: [baseUrl],
    scopes_supported: ['mcp'],
    bearer_methods_supported: ['header', 'query'],
  }));
}

export async function handleOAuthRegister(
  req: IncomingMessage,
  res: ServerResponse,
  baseUrl: string,
): Promise<void> {
  const body = await new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(body); } catch { /* ignore malformed body */ }

  const clientId = crypto.randomBytes(16).toString('hex');
  const clientSecret = crypto.randomBytes(32).toString('hex');
  const redirectUris = Array.isArray(meta['redirect_uris']) ? (meta['redirect_uris'] as string[]) : [];

  registeredClients.set(clientId, {
    redirectUris,
    clientName: typeof meta['client_name'] === 'string' ? meta['client_name'] : undefined,
  });

  res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: 0,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post',
    ...(meta['client_name'] ? { client_name: meta['client_name'] } : {}),
    registration_client_uri: `${baseUrl}/oauth/register/${clientId}`,
  }));
}

export function handleOAuthAuthorizeGet(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const clientId            = url.searchParams.get('client_id') ?? '';
  const redirectUri         = url.searchParams.get('redirect_uri') ?? '';
  const state               = url.searchParams.get('state') ?? '';
  const codeChallenge       = url.searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? 'S256';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sera - Connect to Claude</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0e1a;color:#e2e0f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#1a1830;border:1px solid rgba(99,102,241,.25);border-radius:16px;padding:40px 36px;max-width:420px;width:100%;text-align:center}
    h1{font-size:22px;font-weight:700;margin-bottom:6px;color:#c7d2fe}
    p.sub{font-size:13px;color:#8884a8;margin-bottom:28px;line-height:1.6}
    label{display:block;font-size:13px;color:#a5b4fc;margin-bottom:6px;text-align:left}
    input[type=password]{width:100%;padding:10px 14px;background:#0f0e1a;border:1px solid rgba(99,102,241,.35);border-radius:8px;color:#e2e0f0;font-size:14px;outline:none;margin-bottom:20px;transition:border .15s}
    input[type=password]:focus{border-color:#6366f1}
    button{width:100%;padding:11px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:background .15s}
    button:hover{background:#4f46e5}
    .tag{display:inline-block;background:rgba(99,102,241,.15);color:#a5b4fc;font-size:11px;padding:2px 10px;border-radius:99px;margin-bottom:20px}
  </style>
</head>
<body>
<div class="card">
  <span class="tag">${he(process.env.SABERRA_CLIENT_NAME ?? process.env.TENANT_ID ?? 'Saberra')} Living Memory</span>
  <h1>Sera</h1>
  <p class="sub">AI Secretary &amp; Institutional Memory<br>Enter the connector passphrase to give Claude access to Sera's knowledge base.</p>
  <form method="POST" action="/oauth/authorize">
    <input type="hidden" name="client_id" value="${he(clientId)}">
    <input type="hidden" name="redirect_uri" value="${he(redirectUri)}">
    <input type="hidden" name="state" value="${he(state)}">
    <input type="hidden" name="code_challenge" value="${he(codeChallenge)}">
    <input type="hidden" name="code_challenge_method" value="${he(codeChallengeMethod)}">
    <label for="secret">Connector Passphrase</label>
    <input type="password" id="secret" name="secret" placeholder="Enter passphrase" autofocus autocomplete="current-password">
    <button type="submit">Connect to Sera</button>
  </form>
</div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

export async function handleOAuthAuthorizePost(
  req: IncomingMessage,
  res: ServerResponse,
  secret: string,
): Promise<void> {
  const params              = await readFormBody(req);
  const providedSecret      = params.get('secret') ?? '';
  const redirectUri         = params.get('redirect_uri') ?? '';
  const state               = params.get('state') ?? '';
  const codeChallenge       = params.get('code_challenge') ?? '';
  const codeChallengeMethod = params.get('code_challenge_method') ?? 'S256';

  logger.info({ redirectUri, hasChallenge: !!codeChallenge, challengeMethod: codeChallengeMethod, providedLen: providedSecret.length, secretLen: secret.length }, 'OAuth authorize POST');

  const sBuf = Buffer.from(secret);
  const pBuf = Buffer.from(providedSecret.length === secret.length ? providedSecret : providedSecret.padEnd(secret.length));
  const valid = providedSecret.length === secret.length &&
    crypto.timingSafeEqual(sBuf, pBuf);

  if (!valid) {
    logger.warn({ providedLen: providedSecret.length }, 'OAuth authorize: passphrase mismatch');
    if (redirectUri) {
      const errUrl = new URL(redirectUri);
      errUrl.searchParams.set('error', 'access_denied');
      if (state) errUrl.searchParams.set('state', state);
      res.writeHead(302, { Location: errUrl.toString() });
      res.end();
    } else {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Invalid passphrase');
    }
    return;
  }

  const code = crypto.randomBytes(32).toString('base64url');
  pendingCodes.set(code, {
    codeChallenge,
    codeChallengeMethod,
    redirectUri,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  const cbUrl = new URL(redirectUri);
  cbUrl.searchParams.set('code', code);
  if (state) cbUrl.searchParams.set('state', state);
  res.writeHead(302, { Location: cbUrl.toString() });
  res.end();
}

export async function handleOAuthToken(
  req: IncomingMessage,
  res: ServerResponse,
  secret: string,
): Promise<void> {
  // Support both form-encoded body and JSON body
  let grantType: string | null = null;
  let code: string | null = null;
  let codeVerifier: string | null = null;

  const contentType = req.headers['content-type'] ?? '';
  if (contentType.includes('application/json')) {
    const body = await new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
    try {
      const json = JSON.parse(body) as Record<string, string>;
      grantType    = json['grant_type'] ?? null;
      code         = json['code'] ?? null;
      codeVerifier = json['code_verifier'] ?? null;
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_request' }));
      return;
    }
  } else {
    const params = await readFormBody(req);
    grantType    = params.get('grant_type');
    code         = params.get('code');
    codeVerifier = params.get('code_verifier');
  }

  if (grantType !== 'authorization_code') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unsupported_grant_type' }));
    return;
  }

  logger.info({ hasCode: !!code, hasVerifier: !!codeVerifier, grantType }, 'OAuth token exchange');

  const stored = code ? pendingCodes.get(code) : undefined;
  if (!stored || stored.expiresAt < Date.now()) {
    logger.warn({ codeFound: !!stored, expired: stored ? stored.expiresAt < Date.now() : null, pendingCount: pendingCodes.size }, 'OAuth token: invalid_grant — code not found or expired');
    if (code) pendingCodes.delete(code);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_grant' }));
    return;
  }

  if (stored.codeChallenge && !pkceVerify(codeVerifier ?? '', stored.codeChallenge, stored.codeChallengeMethod)) {
    logger.warn({ method: stored.codeChallengeMethod }, 'OAuth token: PKCE verification failed');
    pendingCodes.delete(code!);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_grant' }));
    return;
  }

  pendingCodes.delete(code!);

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({
    access_token: secret,
    token_type: 'Bearer',
    expires_in: 31_536_000,
  }));
}
