/**
 * Saberra Operator Portal — company-wide client health and cost dashboard.
 * SERVICE_TYPE=operator to enable. Requires OPERATOR_PASSWORD and OPERATOR_CLIENTS env vars.
 *
 * OPERATOR_CLIENTS: JSON array of client configs:
 *   [{"slug":"amora","name":"Amora LMH","apiUrl":"https://...","apiSecret":"...","dashboardUrl":"https://..."}]
 *
 * Falls back to clients/registry.json for local development.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const PORT = Number(process.env.PORT ?? 3003);
const OPERATOR_PASSWORD = process.env.OPERATOR_PASSWORD ?? '';

if (!OPERATOR_PASSWORD) {
  console.error('OPERATOR_PASSWORD env var is required');
  process.exit(1);
}

// ─── Registry ─────────────────────────────────────────────────────────────────

interface ClientConfig {
  slug: string;
  name: string;
  apiUrl: string;
  apiSecret: string;
  dashboardUrl: string;
  deployedAt?: string;
  railwayProjectId?: string;
}

interface ClientStats {
  clientName: string;
  tenantId: string;
  generatedAt: string;
  last7Days: {
    emailsIngested: number;
    tokensConsumed: number;
    errorsCount: number;
    lastPollAt: string | null;
  };
}

function loadClients(): ClientConfig[] {
  const raw = process.env.OPERATOR_CLIENTS;
  if (raw) {
    try { return JSON.parse(raw) as ClientConfig[]; }
    catch { console.error('Invalid OPERATOR_CLIENTS JSON'); }
  }
  const registryPath = path.resolve(__dirname, '../../clients/registry.json');
  if (fs.existsSync(registryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as { clients: ClientConfig[] };
      return data.clients ?? [];
    } catch { console.error('Failed to parse clients/registry.json'); }
  }
  return [];
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https://') ? https : http;
    const req = lib.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Invalid JSON response')); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

async function fetchClientData(client: ClientConfig): Promise<{ health: 'online' | 'offline'; stats: ClientStats | null }> {
  const headers = { Authorization: `Bearer ${client.apiSecret}` };
  const [healthResult, statsResult] = await Promise.allSettled([
    fetchJson(`${client.apiUrl}/health`),
    fetchJson(`${client.apiUrl}/stats`, headers),
  ]);
  const health = healthResult.status === 'fulfilled' ? 'online' : 'offline';
  const stats  = statsResult.status === 'fulfilled' ? statsResult.value as ClientStats : null;
  return { health, stats };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function checkBasicAuth(req: http.IncomingMessage): boolean {
  const header = req.headers['authorization'] ?? '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
  const password = decoded.includes(':') ? decoded.slice(decoded.indexOf(':') + 1) : decoded;
  if (password.length !== OPERATOR_PASSWORD.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(OPERATOR_PASSWORD));
}

// ─── HTML renderer ────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function renderCard(client: ClientConfig, health: 'online' | 'offline', stats: ClientStats | null): string {
  const dot = health === 'online' ? 'dot-online' : 'dot-offline';
  const statusLabel = health === 'online' ? 'Online' : 'Offline';
  const emails = stats?.last7Days.emailsIngested ?? '-';
  const tokens = stats ? formatTokens(stats.last7Days.tokensConsumed) : '-';
  const errors = stats?.last7Days.errorsCount ?? '-';
  const lastPoll = relativeTime(stats?.last7Days.lastPollAt ?? null);
  const errClass = typeof errors === 'number' && errors > 0 ? ' metric-error' : '';

  return `
    <div class="card">
      <div class="card-header">
        <span class="dot ${dot}"></span>
        <div class="card-title">
          <h2>${esc(stats?.clientName ?? client.name)}</h2>
          <span class="slug">${esc(client.slug)}</span>
        </div>
        <span class="status-label ${health}">${statusLabel}</span>
      </div>
      <div class="metrics">
        <div class="metric">
          <span class="metric-label">Emails (7d)</span>
          <span class="metric-value">${emails}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Tokens (7d)</span>
          <span class="metric-value">${tokens}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Errors (7d)</span>
          <span class="metric-value${errClass}">${errors}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Last poll</span>
          <span class="metric-value">${lastPoll}</span>
        </div>
      </div>
      <div class="card-footer">
        <a href="${esc(client.dashboardUrl)}" target="_blank" rel="noopener">Dashboard</a>
        <a href="${esc(client.apiUrl)}/health" target="_blank" rel="noopener">API Health</a>
        ${client.deployedAt ? `<span class="deployed-at">Deployed ${esc(client.deployedAt.slice(0, 10))}</span>` : ''}
      </div>
    </div>`;
}

function renderPage(clients: ClientConfig[], results: Array<{ health: 'online' | 'offline'; stats: ClientStats | null }>): string {
  const now = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC';
  const cards = clients.map((c, i) => renderCard(c, results[i].health, results[i].stats)).join('\n');
  const onlineCount = results.filter(r => r.health === 'online').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="60">
  <title>Saberra Operator Portal</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e2e8f0; min-height: 100vh; }
    a { color: #60a5fa; text-decoration: none; } a:hover { text-decoration: underline; }

    .header { padding: 24px 32px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #f1f5f9; }
    .logo span { color: #22c55e; }
    .badge { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #94a3b8; }
    .header-right { font-size: 13px; color: #64748b; text-align: right; }
    .header-right strong { display: block; color: #94a3b8; }

    .summary-bar { padding: 12px 32px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; gap: 24px; font-size: 13px; color: #64748b; }
    .summary-bar span { color: #e2e8f0; font-weight: 500; }

    .grid-container { padding: 24px 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

    .card { background: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; transition: border-color 0.2s; }
    .card:hover { border-color: #334155; }

    .card-header { display: flex; align-items: flex-start; gap: 12px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
    .dot-online { background: #22c55e; box-shadow: 0 0 6px #22c55e66; }
    .dot-offline { background: #ef4444; }
    .card-title { flex: 1; min-width: 0; }
    .card-title h2 { font-size: 15px; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .slug { font-size: 11px; color: #64748b; font-family: monospace; }
    .status-label { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; flex-shrink: 0; }
    .status-label.online { background: #14532d; color: #4ade80; }
    .status-label.offline { background: #450a0a; color: #f87171; }

    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .metric { background: #0f172a; border-radius: 8px; padding: 10px 12px; }
    .metric-label { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { display: block; font-size: 22px; font-weight: 700; color: #e2e8f0; line-height: 1; }
    .metric-error { color: #f87171; }

    .card-footer { display: flex; align-items: center; gap: 12px; padding-top: 4px; border-top: 1px solid #1e293b; font-size: 13px; }
    .card-footer a { color: #60a5fa; }
    .deployed-at { margin-left: auto; font-size: 11px; color: #475569; }

    .empty { text-align: center; padding: 80px 32px; color: #475569; }
    .empty h2 { font-size: 18px; margin-bottom: 8px; color: #64748b; }
    .empty code { font-size: 12px; background: #111827; padding: 2px 6px; border-radius: 4px; }

    @media (max-width: 600px) {
      .header, .summary-bar, .grid-container { padding-left: 16px; padding-right: 16px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo">Saber<span>ra</span></div>
      <div class="badge">Operator Portal</div>
    </div>
    <div class="header-right">
      <strong>${onlineCount} / ${clients.length} online</strong>
      Refreshed ${now}
    </div>
  </div>
  <div class="summary-bar">
    <div>Clients: <span>${clients.length}</span></div>
    <div>Online: <span>${onlineCount}</span></div>
    ${clients.length > 0 && results[0].stats ? `<div>Tenant IDs: <span>${results.map((r, i) => r.stats?.tenantId ?? clients[i].slug).join(', ')}</span></div>` : ''}
    <div style="margin-left:auto">Auto-refreshes every 60s</div>
  </div>
  <div class="grid-container">
    ${clients.length === 0 ? `
      <div class="empty">
        <h2>No clients registered</h2>
        <p>Set the <code>OPERATOR_CLIENTS</code> env var with a JSON array of client configs,<br>or run <code>npx ts-node scripts/deploy.ts</code> to deploy your first client.</p>
      </div>` : `<div class="grid">${cards}</div>`}
  </div>
</body>
</html>`;
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (!checkBasicAuth(req)) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="Saberra Operator Portal"',
      'Content-Type': 'text/plain',
    });
    res.end('Unauthorized');
    return;
  }

  const clients = loadClients();
  const results = await Promise.all(clients.map(c => fetchClientData(c)));
  const html = renderPage(clients, results);

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`Saberra Operator Portal listening on port ${PORT}`);
  console.log(`Watching ${loadClients().length} client(s)`);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
