import * as dotenv from 'dotenv';
dotenv.config();

import * as http from 'http';
import * as crypto from 'crypto';
import { Client } from '@notionhq/client';
import { logger } from '../config/logger';
import { getConfig } from '../config/ConfigService';
import { SeraQAService, type StreamEvent, type AttachmentInput } from './SeraQAService';
import { ClaudeExtractionService } from '../services/ClaudeExtractionService';
import { NotionWriterService } from '../services/NotionWriterService';
import { HubSettingsService } from '../services/HubSettingsService';
import { handleSse, handleMcpPost, handleMcpHttp } from './mcpServer';
import { handleOAuthMetadata, handleOAuthAuthorizeGet, handleOAuthAuthorizePost, handleOAuthToken, handleOAuthRegister, handleProtectedResourceMetadata } from './oauthServer';

const PORT = Number(process.env.PORT ?? process.env.SERA_API_PORT ?? 3002);
const SERA_API_SECRET = process.env.SERA_API_SECRET;
const SERA_BASE_URL   = (process.env.SERA_API_BASE_URL ?? '').replace(/\/$/, '');

if (!SERA_API_SECRET) {
  console.error('SERA_API_SECRET env var is required');
  process.exit(1);
}

function checkAuth(req: http.IncomingMessage): boolean {
  const header = req.headers['authorization'] ?? '';
  if (!header.startsWith('Bearer ')) return false;
  const provided = header.slice(7);
  if (provided.length !== SERA_API_SECRET!.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(SERA_API_SECRET!));
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

const BODY_LIMIT_SMALL  = 64 * 1024;         // 64 KB — for /search, simple POSTs
const BODY_LIMIT_ASK    = 8 * 1024 * 1024;  // 8 MB  — for /ask, /ask-stream (image attachments)
const BODY_LIMIT_LARGE  = 10 * 1024 * 1024; // 10 MB — for /extract, /reprocess (full docs)

function readBody(req: http.IncomingMessage, maxBytes = BODY_LIMIT_SMALL): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error(`Request body too large (limit: ${maxBytes} bytes)`));
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

HubSettingsService.getInstance().init().catch(() => {});

// Per-IP rate limit for /ask-stream: 20 requests per minute
const streamRateLimitMap = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of streamRateLimitMap.entries()) { if (now > e.resetAt) streamRateLimitMap.delete(ip); }
}, 60_000);
function checkStreamRateLimit(req: http.IncomingMessage): boolean {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown').split(',')[0].trim();
  const now = Date.now();
  const e = streamRateLimitMap.get(ip);
  if (!e || now > e.resetAt) { streamRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (e.count >= 20) return false;
  e.count++;
  return true;
}

const qa = new SeraQAService();
const extractor = new ClaudeExtractionService();
const notion = new NotionWriterService();

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url ?? '/';
  const method = req.method ?? 'GET';
  // Use pathname for routing so query params don't break exact matches
  const path = rawUrl.split('?')[0];

  // ── Public routes (no auth) ────────────────────────────────────────────────

  if (method === 'GET' && path === '/health') {
    json(res, 200, { status: 'ok', service: 'sera-api', ts: new Date().toISOString() });
    return;
  }

  // ── GET /stats — 7-day aggregate for operator portal (requires auth) ──────────
  if (method === 'GET' && path === '/stats') {
    if (!checkAuth(req)) { json(res, 401, { error: 'Unauthorized' }); return; }
    try {
      const cfg = getConfig();
      const notionClient = new Client({ auth: cfg.NOTION_API_KEY });
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      let emailsIngested = 0, tokensConsumed = 0, errorsCount = 0, lastPollAt: string | null = null;
      let cursor: string | undefined;
      do {
        const res2 = await notionClient.databases.query({
          database_id: cfg.NOTION_DB_PROCESSING_EVENTS,
          filter: { property: 'Timestamp', date: { on_or_after: sevenDaysAgo } },
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        });
        for (const page of res2.results) {
          const props = (page as { properties: Record<string, { select?: { name: string }; number?: number; date?: { start: string } }> }).properties;
          const eventType = props['Event Type']?.select?.name;
          const status    = props['Status']?.select?.name;
          const tokens    = props['Token Count']?.number ?? 0;
          const ts        = props['Timestamp']?.date?.start;
          if (eventType === 'Email Ingested') emailsIngested++;
          if (status === 'Error') errorsCount++;
          tokensConsumed += tokens;
          if (eventType === 'Poll Complete' && ts && (!lastPollAt || ts > lastPollAt)) lastPollAt = ts;
        }
        cursor = res2.has_more && res2.next_cursor ? res2.next_cursor : undefined;
      } while (cursor);
      json(res, 200, {
        clientName: cfg.SABERRA_CLIENT_NAME ?? cfg.TENANT_ID,
        tenantId: cfg.TENANT_ID,
        generatedAt: new Date().toISOString(),
        last7Days: { emailsIngested, tokensConsumed, errorsCount, lastPollAt },
      });
    } catch (err) {
      logger.error(err, '/stats error');
      json(res, 500, { error: 'Stats unavailable' });
    }
    return;
  }

  // OAuth 2.0 + PKCE — required for Claude.ai Team connector installation
  if (method === 'GET' && (path === '/.well-known/oauth-authorization-server' || path === '/.well-known/openid-configuration')) {
    handleOAuthMetadata(req, res, SERA_BASE_URL);
    return;
  }
  if (method === 'GET' && path === '/.well-known/oauth-protected-resource') {
    handleProtectedResourceMetadata(req, res, SERA_BASE_URL);
    return;
  }
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Authorization,Content-Type,mcp-session-id' });
    res.end();
    return;
  }
  if (method === 'GET' && path === '/oauth/authorize') {
    handleOAuthAuthorizeGet(req, res);
    return;
  }
  if (method === 'POST' && path === '/oauth/authorize') {
    await handleOAuthAuthorizePost(req, res, SERA_API_SECRET!);
    return;
  }
  if (method === 'POST' && path === '/oauth/token') {
    await handleOAuthToken(req, res, SERA_API_SECRET!);
    return;
  }
  if (method === 'POST' && path === '/oauth/register') {
    await handleOAuthRegister(req, res, SERA_BASE_URL);
    return;
  }

  // MCP Streamable HTTP transport (2025-03 spec) — used by Claude.ai Team connectors
  // Also handle root path: Claude.ai uses the connector URL directly as the MCP endpoint
  if (path === '/mcp' || path === '/') {
    await handleMcpHttp(req, res, SERA_API_SECRET!);
    return;
  }

  // MCP legacy SSE transport — kept for backward compatibility
  if (method === 'GET' && path === '/mcp/sse') {
    await handleSse(req, res, SERA_API_SECRET!);
    return;
  }
  if (method === 'POST' && path === '/mcp/messages') {
    await handleMcpPost(req, res, SERA_API_SECRET!);
    return;
  }

  // ── Protected routes ───────────────────────────────────────────────────────

  if (!checkAuth(req)) {
    json(res, 401, { error: 'Unauthorized' });
    return;
  }

  // ── POST /ask ──────────────────────────────────────────────────────────────
  // Body: { question: string, mode?: string, history?: Array<{role, content}>, images?: AttachmentInput[] }
  // Returns: { answer, sources, tokens }
  if (method === 'POST' && path === '/ask') {
    let body: unknown;
    try { body = await readBody(req, BODY_LIMIT_ASK); } catch { json(res, 400, { error: 'Invalid JSON' }); return; }
    const { question, mode, history, images } = body as { question?: string; mode?: string; history?: Array<{ role: 'user' | 'assistant'; content: string }>; images?: AttachmentInput[] };
    if (!question?.trim()) { json(res, 400, { error: '"question" is required' }); return; }
    const askMode = mode === 'report' ? 'report' : 'ask';
    const safeHistory = Array.isArray(history) ? history.filter(h => (h?.role === 'user' || h?.role === 'assistant') && typeof h?.content === 'string' && h.content.length > 0).slice(-10) : [];
    const safeImages: AttachmentInput[] = Array.isArray(images)
      ? images.filter(i => typeof i?.mediaType === 'string' && typeof i?.data === 'string').slice(0, 10)
      : [];
    try {
      const result = await qa.ask(question.trim(), askMode, safeHistory, safeImages);
      json(res, 200, result);
    } catch (err) {
      logger.error(err, '/ask error');
      json(res, 500, { error: 'Q&A failed - check logs' });
    }
    return;
  }

  // ── POST /ask-stream — SSE streaming version of /ask ──────────────────────
  if (method === 'POST' && path === '/ask-stream') {
    if (!checkStreamRateLimit(req)) { json(res, 429, { error: 'Too many requests' }); return; }
    let body: unknown;
    try { body = await readBody(req, BODY_LIMIT_ASK); } catch { json(res, 400, { error: 'Invalid JSON' }); return; }
    const { question, mode, history, images } = body as { question?: string; mode?: string; history?: Array<{ role: 'user' | 'assistant'; content: string }>; images?: AttachmentInput[] };
    if (!question?.trim()) { json(res, 400, { error: '"question" is required' }); return; }
    const askMode = mode === 'report' ? 'report' : 'ask';
    const safeHistory = Array.isArray(history) ? history.filter(h => (h?.role === 'user' || h?.role === 'assistant') && typeof h?.content === 'string' && h.content.length > 0).slice(-10) : [];
    const safeImages: AttachmentInput[] = Array.isArray(images)
      ? images.filter(i => typeof i?.mediaType === 'string' && typeof i?.data === 'string').slice(0, 10)
      : [];
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
    });
    let clientGone = false;
    res.on('close', () => { clientGone = true; });
    try {
      for await (const event of qa.streamAsk(question.trim(), askMode, safeHistory, safeImages)) {
        if (clientGone) break;
        res.write(`data: ${JSON.stringify(event as StreamEvent)}\n\n`);
      }
      if (!clientGone) res.write('data: [DONE]\n\n');
    } catch (err) {
      logger.error(err, '/ask-stream error');
      if (!clientGone) res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' } as StreamEvent)}\n\n`);
    }
    res.end();
    return;
  }

  // ── POST /search ───────────────────────────────────────────────────────────
  // Body: { query: string, databases?: string[] }
  // Returns: { results: [{ id, title, url, snippet }], total }
  if (method === 'POST' && path === '/search') {
    let body: unknown;
    try { body = await readBody(req); } catch { json(res, 400, { error: 'Invalid JSON' }); return; }
    const { query, databases } = body as { query?: string; databases?: string[] };
    if (!query?.trim()) { json(res, 400, { error: '"query" is required' }); return; }
    try {
      const result = await qa.search(query.trim(), databases);
      json(res, 200, result);
    } catch (err) {
      logger.error(err, '/search error');
      json(res, 500, { error: 'Search failed - check logs' });
    }
    return;
  }

  // ── POST /extract ──────────────────────────────────────────────────────────
  // Body: { text: string, sourceTitle?, sourceDate?, sourceType?, sourceActor?, relatedContext? }
  // Returns: { extracted, tokens, createdRecords }
  if (method === 'POST' && path === '/extract') {
    let body: unknown;
    try { body = await readBody(req, BODY_LIMIT_LARGE); } catch (e) { json(res, 400, { error: (e as Error).message }); return; }
    const { text, sourceTitle, sourceDate, sourceType, sourceActor, relatedContext } =
      body as { text?: string; sourceTitle?: string; sourceDate?: string; sourceType?: string; sourceActor?: string; relatedContext?: string };
    if (!text?.trim()) { json(res, 400, { error: '"text" is required' }); return; }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const extracted = await extractor.extract({
        sourceType: sourceType ?? 'Direct API Submission',
        sourceTitle: sourceTitle ?? 'API Submission',
        sourceDate: sourceDate ?? today,
        sourceActor: sourceActor ?? 'Sera API',
        relatedContext: relatedContext ?? '',
        sourceText: text.trim(),
      });
      if (!extracted) {
        json(res, 200, { extracted: null, tokens: 0, createdRecords: [] });
        return;
      }
      const { createdRecords } = await extractor.writeToNotion(
        notion, extracted.data, null, null, sourceDate ?? today,
      );
      json(res, 200, { extracted: extracted.data, tokens: extracted.tokens, createdRecords });
    } catch (err) {
      logger.error(err, '/extract error');
      json(res, 500, { error: 'Extraction failed - check logs' });
    }
    return;
  }

  // ── POST /reprocess ────────────────────────────────────────────────────────
  // Body: { text: string, pageId?: string, sourceDate? }
  // pageId links extracted records back to an existing Meeting or Source Email page.
  // Returns: { extracted, tokens, createdRecords }
  if (method === 'POST' && path === '/reprocess') {
    let body: unknown;
    try { body = await readBody(req, BODY_LIMIT_LARGE); } catch (e) { json(res, 400, { error: (e as Error).message }); return; }
    const { text, pageId, sourceDate } =
      body as { text?: string; pageId?: string; sourceDate?: string };
    if (!text?.trim()) { json(res, 400, { error: '"text" is required (full source content to re-extract)' }); return; }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const extracted = await extractor.extract({
        sourceType: 'Reprocess',
        sourceTitle: `Reprocess: ${pageId ?? 'unknown'}`,
        sourceDate: sourceDate ?? today,
        sourceActor: 'Sera API',
        relatedContext: '',
        sourceText: text.trim(),
      });
      if (!extracted) {
        json(res, 200, { extracted: null, tokens: 0, createdRecords: [] });
        return;
      }
      const { createdRecords } = await extractor.writeToNotion(
        notion, extracted.data, pageId ?? null, null, sourceDate ?? today,
      );
      json(res, 200, { extracted: extracted.data, tokens: extracted.tokens, createdRecords });
    } catch (err) {
      logger.error(err, '/reprocess error');
      json(res, 500, { error: 'Reprocess failed - check logs' });
    }
    return;
  }

  // ── POST /transition-brief ─────────────────────────────────────────────────
  // Body: { personName?: string, roleName?: string, circleName?: string }
  // Generates a structured onboarding/transition brief for a person, role, or circle.
  // Uses Sera's full search capability to synthesize across all Notion databases.
  if (method === 'POST' && path === '/transition-brief') {
    let body: unknown;
    try { body = await readBody(req); } catch (e) { json(res, 400, { error: (e as Error).message }); return; }
    const { personName, roleName, circleName } =
      body as { personName?: string; roleName?: string; circleName?: string };

    if (!personName && !roleName && !circleName) {
      json(res, 400, { error: 'At least one of personName, roleName, or circleName is required' });
      return;
    }

    const target = [
      personName  ? `person "${personName}"`  : null,
      roleName    ? `role "${roleName}"`       : null,
      circleName  ? `circle "${circleName}"`   : null,
    ].filter(Boolean).join(', ');

    const question = [
      `Generate a complete onboarding and transition brief for ${target}.`,
      'Structure the brief with these sections:',
      '1. ROLE AND CONTEXT - What this role/person does, their purpose, accountability, and circle.',
      '2. KEY DECISIONS - The most important decisions made by or affecting this role/person, with dates.',
      '3. OPEN TASKS - All currently open tasks assigned to this role/person, sorted by priority.',
      '4. ACTIVE RISKS - Risks owned by or relevant to this role/person or circle.',
      '5. RELEVANT POLICIES - Policies this role/person is accountable for or affected by.',
      '6. GOVERNANCE HISTORY - Role assignments, circle membership, and governance actions.',
      '7. RELATIONSHIPS - Key people and organizations this role/person works with.',
      '8. WHAT TO KNOW FIRST - The 3-5 most critical things a new person must understand to step into this role effectively.',
      'Be specific and factual. Cite source meetings or emails where relevant. Format clearly for a new team member.',
    ].join(' ');

    try {
      const result = await qa.ask(question, 'report');
      json(res, 200, { brief: result.answer, sources: result.sources, tokens: result.tokens });
    } catch (err) {
      logger.error(err, '/transition-brief error');
      json(res, 500, { error: 'Transition brief failed - check logs' });
    }
    return;
  }

  // ── GET /settings/language ─────────────────────────────────────────────────
  if (method === 'GET' && path === '/settings/language') {
    json(res, 200, { outputLanguage: HubSettingsService.getInstance().outputLanguage });
    return;
  }

  // ── POST /settings/language ────────────────────────────────────────────────
  // Body: { language: string }
  if (method === 'POST' && path === '/settings/language') {
    let body: unknown;
    try { body = await readBody(req); } catch { json(res, 400, { error: 'Invalid JSON' }); return; }
    const { language } = body as { language?: string };
    if (!language?.trim()) { json(res, 400, { error: '"language" is required' }); return; }
    try {
      await HubSettingsService.getInstance().updateOutputLanguage(language.trim());
      json(res, 200, { outputLanguage: language.trim() });
    } catch (err) {
      logger.error(err, '/settings/language error');
      json(res, 500, { error: 'Failed to update language setting' });
    }
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Sera API listening');
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
