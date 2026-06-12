import * as dotenv from 'dotenv';
dotenv.config();

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { getDashboardData, resetAssetForRetry, resetEmailForRetry, clearDashboardCache } from './queries';
import { renderDashboard, SABERRA_ICON_B64 } from './views';
import { HubSettingsService } from '../services/HubSettingsService';
import { logger } from '../config/logger';

const DASHBOARD_JS = fs.readFileSync(path.join(__dirname, 'static', 'dashboard.js'), 'utf8');

const PORT = Number(process.env.PORT ?? process.env.DASHBOARD_PORT ?? 3001);
const DASHBOARD_USER = process.env.DASHBOARD_USER ?? 'admin';
const DASHBOARD_PASS = process.env.DASHBOARD_PASS;
const ORG_NAME = process.env.ORG_NAME ?? process.env.TENANT_ID ?? 'Living Memory';
const SERA_API_URL = (process.env.SERA_API_URL ?? 'https://sera-api-production-28d0.up.railway.app').replace(/\/$/, '');
const SERA_API_SECRET = process.env.SERA_API_SECRET ?? '';

if (!DASHBOARD_PASS) {
  console.error('DASHBOARD_PASS env var is required');
  process.exit(1);
}

// ── Session store (in-memory, 24h TTL) ──────────────────────────────────────
const SESSION_TTL = 24 * 60 * 60 * 1000;
const sessions = new Map<string, number>(); // token -> expiry

function createSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  return token;
}

function checkSession(req: http.IncomingMessage): boolean {
  const cookies = parseCookies(req);
  const token = cookies['sera_session'];
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) { sessions.delete(token); return false; }
  return true;
}

function parseCookies(req: http.IncomingMessage): Record<string, string> {
  const header = req.headers['cookie'] ?? '';
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

function redirectToLogin(res: http.ServerResponse, returnTo = '/'): void {
  res.writeHead(302, { Location: `/login?return=${encodeURIComponent(returnTo)}` });
  res.end();
}

function renderLoginPage(orgName: string, error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign In | ${orgName}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0b0f1a;color:#e8edf5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#111827;border:1px solid #1f2d42;border-radius:16px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.brand img{width:40px;height:40px;border-radius:8px;display:block;object-fit:contain}
.brand-name{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px}
.org-name{font-size:13px;color:#6b7a96;margin-bottom:32px}
label{display:block;font-size:12px;font-weight:600;color:#6b7a96;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
input{width:100%;background:#0b0f1a;border:1px solid #1f2d42;border-radius:8px;padding:10px 14px;font-size:14px;color:#e8edf5;outline:none;margin-bottom:16px;transition:border-color .15s}
input:focus{border-color:#6366f1}
.error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:10px 14px;font-size:13px;color:#f87171;margin-bottom:16px}
button{width:100%;background:#6366f1;color:#fff;font-size:15px;font-weight:600;border:none;border-radius:8px;padding:12px;cursor:pointer;transition:background .15s;margin-top:4px}
button:hover{background:#4f46e5}
.footer{font-size:11px;color:#374151;text-align:center;margin-top:24px}
</style>
</head>
<body>
<div class="card">
  <div class="brand">
    <img src="data:image/png;base64,${SABERRA_ICON_B64}" alt="Saberra">
    <span class="brand-name">Sera</span>
  </div>
  <div class="org-name">${orgName}</div>
  ${error ? `<div class="error">${error}</div>` : ''}
  <form method="POST" action="/login">
    <input type="hidden" name="return" value="">
    <label for="u">Username</label>
    <input id="u" name="username" type="text" autocomplete="username" autofocus required>
    <label for="p">Password</label>
    <input id="p" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Sign In</button>
  </form>
  <div class="footer">Powered by Saberra</div>
</div>
<script>
  const q = new URLSearchParams(location.search);
  const ret = q.get('return') || '/';
  document.querySelector('input[name=return]').value = ret;
</script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  // Railway health probe — no auth
  if (method === 'GET' && url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
    return;
  }

  // Static dashboard script — no auth (content is generic JS, no secrets)
  if (method === 'GET' && url === '/dashboard.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(DASHBOARD_JS);
    return;
  }

  // Login page (GET)
  if (method === 'GET' && (url === '/login' || url.startsWith('/login?'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(renderLoginPage(ORG_NAME));
    return;
  }

  // Login form submit (POST)
  if (method === 'POST' && url === '/login') {
    let body = '';
    req.on('data', (c: Buffer) => { body += c; });
    await new Promise<void>(resolve => req.on('end', resolve).on('close', resolve));
    const params = new URLSearchParams(body);
    const user = params.get('username') ?? '';
    const pass = params.get('password') ?? '';
    const returnTo = params.get('return') ?? '/';
    const safe = returnTo.startsWith('/') ? returnTo : '/';
    if (user === DASHBOARD_USER && pass === DASHBOARD_PASS) {
      const token = createSession();
      res.writeHead(302, {
        Location: safe,
        'Set-Cookie': `sera_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=Strict`,
      });
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(renderLoginPage(ORG_NAME, 'Incorrect username or password.'));
    }
    return;
  }

  // Logout — clear session cookie and redirect to login
  if (url === '/logout') {
    const token = parseCookies(req)['sera_session'];
    if (token) sessions.delete(token);
    res.writeHead(302, {
      Location: '/login',
      'Set-Cookie': 'sera_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
    });
    res.end();
    return;
  }

  if (!checkSession(req)) { redirectToLogin(res, url); return; }

  // Main dashboard page
  if (method === 'GET' && url === '/') {
    try {
      const cookies = parseCookies(req);
      const tzOverride = cookies['tz'] || undefined;
      const data = await getDashboardData(tzOverride);
      const html = renderDashboard(data, ORG_NAME);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
    } catch (err) {
      logger.error(err, 'Dashboard render error');
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error - check logs');
    }
    return;
  }

  // Reset Meeting Asset for retry
  const retryMatch = url.match(/^\/retry\/([0-9a-f-]{36})$/);
  if (method === 'POST' && retryMatch) {
    const pageId = retryMatch[1];
    try {
      await resetAssetForRetry(pageId);
      logger.info({ pageId }, 'Asset reset for retry via dashboard');
      res.writeHead(302, { Location: '/' });
      res.end();
    } catch (err) {
      logger.error({ err, pageId }, 'Failed to reset asset for retry');
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Failed to reset asset - check logs');
    }
    return;
  }

  // Reset Source Email for retry (marks as Failed so worker picks it up on next poll)
  const reprocessEmailMatch = url.match(/^\/reprocess-email\/([0-9a-f-]{36})$/);
  if (method === 'POST' && reprocessEmailMatch) {
    const pageId = reprocessEmailMatch[1];
    try {
      await resetEmailForRetry(pageId);
      logger.info({ pageId }, 'Source email reset for retry via dashboard');
      res.writeHead(302, { Location: '/' });
      res.end();
    } catch (err) {
      logger.error({ err, pageId }, 'Failed to reset email for retry');
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Failed to reset email - check logs');
    }
    return;
  }

  // ── POST /sera/ask — proxy to Sera API (dashboard auth protects it) ─────────
  if (method === 'POST' && url === '/sera/ask') {
    let body = '';
    let bodySize = 0;
    const BODY_LIMIT = 8 * 1024 * 1024; // 8 MB — allows image attachments (base64)
    let tooLarge = false;
    req.on('data', (c: Buffer) => {
      bodySize += c.length;
      if (bodySize > BODY_LIMIT) { tooLarge = true; req.destroy(); return; }
      body += c;
    });
    await new Promise<void>(resolve => req.on('end', resolve).on('close', resolve));
    if (tooLarge) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request too large' }));
      return;
    }
    try {
      const { question, history, images } = JSON.parse(body) as { question?: string; history?: unknown; images?: unknown };
      if (!question?.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'question required' }));
        return;
      }
      const upstream = await fetch(`${SERA_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SERA_API_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), history: history ?? [], images: images ?? [] }),
      });
      const data = await upstream.json();
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      logger.error(err, '/sera/ask proxy error');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sera unavailable' }));
    }
    return;
  }

  // ── POST /sera/ask-stream — streaming SSE proxy to Sera API ───────────────
  if (method === 'POST' && url === '/sera/ask-stream') {
    let body = '';
    let bodySize = 0;
    const BODY_LIMIT_STREAM = 8 * 1024 * 1024; // 8 MB — allows image attachments (base64)
    let tooLarge = false;
    req.on('data', (c: Buffer) => {
      bodySize += c.length;
      if (bodySize > BODY_LIMIT_STREAM) { tooLarge = true; req.destroy(); return; }
      body += c;
    });
    await new Promise<void>(resolve => req.on('end', resolve).on('close', resolve));
    if (tooLarge) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request too large' }));
      return;
    }
    try {
      const { question, history, images } = JSON.parse(body) as { question?: string; history?: unknown; images?: unknown };
      if (!question?.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'question required' }));
        return;
      }
      const upstream = await fetch(`${SERA_API_URL}/ask-stream`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SERA_API_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), history: history ?? [], images: images ?? [] }),
      });
      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text().catch(() => 'Stream unavailable');
        res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errText }));
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      });
      const reader = upstream.body.getReader();
      req.on('close', () => { reader.cancel().catch(() => {}); });
      for (;;) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        res.write(Buffer.from(value));
      }
    } catch (err) {
      logger.error(err, '/sera/ask-stream proxy error');
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Sera unavailable' }));
      }
    }
    return;
  }

  // POST /settings/timezone — persist org-local timezone override in a cookie
  if (method === 'POST' && url === '/settings/timezone') {
    let body = '';
    req.on('data', (c: Buffer) => { body += c; });
    await new Promise<void>(resolve => req.on('end', resolve).on('close', resolve));
    try {
      const params = new URLSearchParams(body);
      const tz = params.get('tz') ?? '';
      // Validate by attempting to format a date with the given timezone
      new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
      res.writeHead(302, {
        'Location': '/',
        'Set-Cookie': `tz=${encodeURIComponent(tz)}; Path=/; Max-Age=31536000; SameSite=Lax`,
      });
      res.end();
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid timezone identifier');
    }
    return;
  }

  // POST /settings/gps — update Governing Purpose Statement in Notion Hub Settings
  if (method === 'POST' && url === '/settings/gps') {
    let body = '';
    req.on('data', (c: Buffer) => { body += c; });
    await new Promise<void>(resolve => req.on('end', resolve).on('close', resolve));
    try {
      const params = new URLSearchParams(body);
      const gps = (params.get('gps') ?? '').trim();
      if (!gps) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GPS text is required' }));
        return;
      }
      await HubSettingsService.getInstance().updateGoverningPurpose(gps);
      clearDashboardCache();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      logger.error(err, '/settings/gps error');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update — is NOTION_HUB_SETTINGS_PAGE_ID set?' }));
    }
    return;
  }

  // POST /settings/language — update Sera response language in Notion Hub Settings
  if (method === 'POST' && url === '/settings/language') {
    let body = '';
    req.on('data', (c: Buffer) => { body += c; });
    await new Promise<void>(resolve => req.on('end', resolve).on('close', resolve));
    try {
      const params = new URLSearchParams(body);
      const language = (params.get('language') ?? '').trim();
      if (!language) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Language is required' }));
        return;
      }
      await HubSettingsService.getInstance().updateOutputLanguage(language);
      clearDashboardCache();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      logger.error(err, '/settings/language error');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update — is NOTION_HUB_SETTINGS_PAGE_ID set?' }));
    }
    return;
  }

  // GET /api/balances — live credit/cost data from Anthropic and Railway
  if (method === 'GET' && url === '/api/balances') {
    const now = new Date();
    const railwayToken = process.env.RAILWAY_API_TOKEN;

    const railwayResult = await Promise.allSettled([
      railwayToken
        ? (async () => {
            const r = await fetch('https://backboard.railway.com/graphql/v2', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${railwayToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: '{ me { creditBalance } }' }),
            });
            const d = await r.json() as { data?: { me?: { creditBalance?: number } } };
            const balance = d?.data?.me?.creditBalance;
            return { available: true, creditBalance: balance != null ? balance / 100 : null };
          })()
        : Promise.resolve({ available: false, needsKey: true }),
    ]);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      railway:   railwayResult[0].status === 'fulfilled' ? railwayResult[0].value : { available: false, error: String((railwayResult[0] as PromiseRejectedResult).reason) },
      checkedAt: now.toISOString(),
    }));
    return;
  }

  // POST /settings/purpose-test — update one-sentence Purpose Test in Notion Hub Settings
  if (method === 'POST' && url === '/settings/purpose-test') {
    let body = '';
    req.on('data', (c: Buffer) => { body += c; });
    await new Promise<void>(resolve => req.on('end', resolve).on('close', resolve));
    try {
      const params = new URLSearchParams(body);
      const pt = (params.get('pt') ?? '').trim();
      if (!pt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Purpose test text is required' }));
        return;
      }
      await HubSettingsService.getInstance().updatePurposeTest(pt);
      clearDashboardCache();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      logger.error(err, '/settings/purpose-test error');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update — is NOTION_HUB_SETTINGS_PAGE_ID set?' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  logger.info(`Admin dashboard listening on port ${PORT}`);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

// Init HubSettingsService so dashboard can read/write GPS without a worker running
HubSettingsService.getInstance().init().catch(() => {});

// Background cache pre-warm: refresh every 4.5 min so every page load is instant.
// First hit after deploy still pays Notion cost; all subsequent hits serve from cache.
getDashboardData().catch(() => {});
setInterval(() => { getDashboardData().catch(() => {}); }, 270_000);
