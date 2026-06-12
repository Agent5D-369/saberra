import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { SeraQAService } from './SeraQAService';
import { ClaudeExtractionService } from '../services/ClaudeExtractionService';
import { NotionWriterService } from '../services/NotionWriterService';
import { logger } from '../config/logger';

const SERA_TOOLS = [
  {
    name: 'ask_sera',
    description: 'Ask Sera a question about your organization\'s institutional memory. Sera searches meetings, decisions, profiles, circles, tasks, risks, projects, and more, then synthesizes an answer grounded in the actual records. Use this for any question about organizational history, governance, people, or decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Your question in natural language.' },
      },
      required: ['question'],
    },
  },
  {
    name: 'search_memory',
    description: 'Raw keyword/semantic search over your organization\'s Notion databases. Returns matching records with titles and URLs. Use this when you need to find specific records rather than synthesized answers.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search terms or phrase.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'extract_content',
    description: 'Submit text or notes to Sera for extraction. Sera will identify decisions, tasks, risks, profiles, projects, and other entities and write them to Notion as draft/candidate records for human review. Use this to process meeting notes, emails, or any text containing actionable information.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Full text content to extract from.' },
        source_title: { type: 'string', description: 'Title or label for this content (e.g. "Board Meeting May 2026").' },
        source_date: { type: 'string', description: 'Date of the content in YYYY-MM-DD format.' },
        source_type: { type: 'string', description: 'Type of content: Meeting Notes, Email, Document, etc.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'reprocess_content',
    description: 'Re-extract content and link the results to an existing Notion page (e.g. a Meeting or Source Email record). Use this to re-run extraction on content that was previously processed, or to add extracted records that should be linked to an existing meeting.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Full text content to extract from.' },
        page_id: { type: 'string', description: 'Notion page ID to link extracted records to (UUID format).' },
        source_date: { type: 'string', description: 'Date of the content in YYYY-MM-DD format.' },
      },
      required: ['text'],
    },
  },
];

// Singletons — shared across all MCP sessions
const _mcpQa = new SeraQAService();
const _mcpExtractor = new ClaudeExtractionService();
const _mcpNotion = new NotionWriterService();

export function createMcpServer(): Server {
  const server = new Server(
    { name: 'sera', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  const qa = _mcpQa;
  const extractor = _mcpExtractor;

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: SERA_TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'ask_sera') {
      const question = (args?.question as string | undefined) ?? '';
      if (!question.trim()) {
        return { content: [{ type: 'text', text: 'Error: question is required.' }], isError: true };
      }
      try {
        const result = await qa.ask(question.trim());
        const sourcesText = result.sources.length > 0
          ? '\n\nSources:\n' + result.sources.map(s => `- [${s.title}](${s.url})`).join('\n')
          : '';
        return { content: [{ type: 'text', text: result.answer + sourcesText }] };
      } catch (err) {
        logger.error(err, 'MCP ask_sera error');
        return { content: [{ type: 'text', text: 'Sera Q&A failed. Check logs.' }], isError: true };
      }
    }

    if (name === 'search_memory') {
      const query = (args?.query as string | undefined) ?? '';
      if (!query.trim()) {
        return { content: [{ type: 'text', text: 'Error: query is required.' }], isError: true };
      }
      try {
        const result = await qa.search(query.trim());
        if (result.results.length === 0) {
          return { content: [{ type: 'text', text: 'No results found.' }] };
        }
        const text = result.results
          .map(r => `**${r.title}**\n${r.url}${r.snippet ? '\n' + r.snippet : ''}`)
          .join('\n\n');
        return { content: [{ type: 'text', text: `Found ${result.total} results:\n\n${text}` }] };
      } catch (err) {
        logger.error(err, 'MCP search_memory error');
        return { content: [{ type: 'text', text: 'Search failed. Check logs.' }], isError: true };
      }
    }

    if (name === 'extract_content') {
      const text = (args?.text as string | undefined) ?? '';
      if (!text.trim()) {
        return { content: [{ type: 'text', text: 'Error: text is required.' }], isError: true };
      }
      const today = new Date().toISOString().slice(0, 10);
      try {
        const extracted = await extractor.extract({
          sourceType: (args?.source_type as string | undefined) ?? 'Direct Submission',
          sourceTitle: (args?.source_title as string | undefined) ?? 'MCP Submission',
          sourceDate: (args?.source_date as string | undefined) ?? today,
          sourceActor: 'Sera MCP',
          relatedContext: '',
          sourceText: text.trim(),
        });
        if (!extracted) {
          return { content: [{ type: 'text', text: 'Extraction returned no results.' }] };
        }
        const notion = _mcpNotion;
        const { createdRecords } = await extractor.writeToNotion(notion, extracted.data, null, null, (args?.source_date as string | undefined) ?? today);
        return {
          content: [{
            type: 'text',
            text: `Extraction complete. Created ${createdRecords.length} records in Notion.\n\nRecord IDs:\n${createdRecords.join('\n')}\n\nTokens used: ${extracted.tokens}`,
          }],
        };
      } catch (err) {
        logger.error(err, 'MCP extract_content error');
        return { content: [{ type: 'text', text: 'Extraction failed. Check logs.' }], isError: true };
      }
    }

    if (name === 'reprocess_content') {
      const text = (args?.text as string | undefined) ?? '';
      if (!text.trim()) {
        return { content: [{ type: 'text', text: 'Error: text is required.' }], isError: true };
      }
      const today = new Date().toISOString().slice(0, 10);
      const pageId = (args?.page_id as string | undefined) ?? null;
      try {
        const extracted = await extractor.extract({
          sourceType: 'Reprocess',
          sourceTitle: `Reprocess: ${pageId ?? 'unknown'}`,
          sourceDate: (args?.source_date as string | undefined) ?? today,
          sourceActor: 'Sera MCP',
          relatedContext: '',
          sourceText: text.trim(),
        });
        if (!extracted) {
          return { content: [{ type: 'text', text: 'Extraction returned no results.' }] };
        }
        const notion = _mcpNotion;
        const { createdRecords } = await extractor.writeToNotion(notion, extracted.data, pageId, null, (args?.source_date as string | undefined) ?? today);
        return {
          content: [{
            type: 'text',
            text: `Reprocess complete. Created ${createdRecords.length} records${pageId ? ` linked to ${pageId}` : ''}.\n\nRecord IDs:\n${createdRecords.join('\n')}\n\nTokens used: ${extracted.tokens}`,
          }],
        };
      } catch (err) {
        logger.error(err, 'MCP reprocess_content error');
        return { content: [{ type: 'text', text: 'Reprocess failed. Check logs.' }], isError: true };
      }
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  });

  return server;
}

// Active transports keyed by session ID
const transports = new Map<string, SSEServerTransport>();

const BASE_URL = (process.env.SERA_API_BASE_URL ?? 'https://sera-api-production-28d0.up.railway.app').replace(/\/$/, '');
const RESOURCE_METADATA_URL = `${BASE_URL}/.well-known/oauth-protected-resource`;

function extractToken(req: IncomingMessage, secret: string): boolean {
  // Accept Bearer header (Claude Code / direct API) or ?token= query param (claude.ai connectors UI)
  const auth = req.headers['authorization'] ?? '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (token.length !== secret.length) {
      logger.warn({ tokenLen: token.length, secretLen: secret.length }, 'MCP auth: token length mismatch');
      return false;
    }
    const match = require('crypto').timingSafeEqual(Buffer.from(token), Buffer.from(secret));
    if (!match) logger.warn('MCP auth: bearer token mismatch');
    return match;
  }
  const url = new URL(req.url ?? '/', `http://localhost`);
  return url.searchParams.get('token') === secret;
}

function rejectUnauthorized(res: ServerResponse): void {
  res.writeHead(401, {
    'Content-Type': 'application/json',
    'WWW-Authenticate': `Bearer realm="sera", resource_metadata="${RESOURCE_METADATA_URL}"`,
  });
  res.end(JSON.stringify({ error: 'Unauthorized' }));
}

export async function handleSse(
  req: IncomingMessage,
  res: ServerResponse,
  secret: string,
): Promise<void> {
  if (!extractToken(req, secret)) { rejectUnauthorized(res); return; }

  const transport = new SSEServerTransport('/mcp/messages', res);
  transports.set(transport.sessionId, transport);
  res.on('close', () => {
    transports.delete(transport.sessionId);
    logger.info({ sessionId: transport.sessionId }, 'MCP SSE client disconnected');
  });

  const server = createMcpServer();
  await server.connect(transport);
  logger.info({ sessionId: transport.sessionId }, 'MCP SSE client connected');
}

export async function handleMcpPost(
  req: IncomingMessage,
  res: ServerResponse,
  secret: string,
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'mcp-session-id header required' }));
    return;
  }

  // Session presence is sufficient auth — sessions are only created via the authenticated SSE endpoint.
  // We also accept an explicit Bearer token for clients that send it on POST requests too.
  const transport = transports.get(sessionId);
  if (!transport) {
    if (!extractToken(req, secret)) { rejectUnauthorized(res); return; }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session not found or expired' }));
    return;
  }

  await transport.handlePostMessage(req, res);
}

// ── Streamable HTTP transport (MCP spec 2025-03, used by Claude.ai Team) ────────

interface HttpSession {
  transport: StreamableHTTPServerTransport;
}

const httpSessions = new Map<string, HttpSession>();

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

export async function handleMcpHttp(
  req: IncomingMessage,
  res: ServerResponse,
  secret: string,
): Promise<void> {
  if (!extractToken(req, secret)) { rejectUnauthorized(res); return; }

  const method = req.method ?? 'GET';
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // ── POST: new session (no session ID) or existing session message ────────────
  if (method === 'POST') {
    if (!sessionId) {
      // New session — must be an initialize request
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });
      const server = createMcpServer();
      await server.connect(transport);

      transport.onclose = () => {
        if (transport.sessionId) httpSessions.delete(transport.sessionId);
        logger.info({ sessionId: transport.sessionId }, 'MCP HTTP session closed');
      };

      let body: unknown;
      try { body = await readJsonBody(req); }
      catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }

      await transport.handleRequest(req, res, body);

      if (transport.sessionId) {
        httpSessions.set(transport.sessionId, { transport });
        logger.info({ sessionId: transport.sessionId }, 'MCP HTTP session created');
      }
      return;
    }

    const session = httpSessions.get(sessionId);
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found or expired' }));
      return;
    }
    let body: unknown;
    try { body = await readJsonBody(req); }
    catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }
    await session.transport.handleRequest(req, res, body);
    return;
  }

  // ── GET: SSE stream for server-initiated messages ────────────────────────────
  if (method === 'GET') {
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'mcp-session-id header required for GET' }));
      return;
    }
    const session = httpSessions.get(sessionId);
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found or expired' }));
      return;
    }
    await session.transport.handleRequest(req, res);
    return;
  }

  // ── DELETE: explicit session termination ─────────────────────────────────────
  if (method === 'DELETE') {
    if (sessionId && httpSessions.has(sessionId)) {
      await httpSessions.get(sessionId)!.transport.close();
      httpSessions.delete(sessionId);
    }
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(405, { Allow: 'GET, POST, DELETE' });
  res.end();
}
