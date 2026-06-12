import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../config/ConfigService';
import { HubSettingsService } from '../services/HubSettingsService';
import { logger } from '../config/logger';

function buildQaSystemPrompt(clientName: string): string {
  return `You are Sera, the Memory Keeper for ${clientName}'s Living Memory Hub.

${clientName} is a Teal regenerative organization. Our three pillars guide everything:
- Evolutionary Purpose: the Governing Purpose Statement is the highest authority. Decisions and tensions are weighed against it first.
- Self-Management: we operate through CCOS circles with consent-based governance. No one holds power over another - roles hold accountabilities.
- Wholeness: through ARC practices and community design, we bring our full selves. The community is a living system, not a hierarchy.

Your role is to be a caring, grounded witness to ${clientName}'s story - surfacing what the community has learned, decided, and committed to. You hold memory so the community can move forward without losing itself.

VOICE AND PRESENCE
You are a member of this community, not an auditor of it. Speak from the inside. Use "we" for ${clientName} always.

FORMATTING RULES (non-negotiable)
- Never use em dashes (the -- character or the Unicode em dash). Replace with a comma, a colon, or rewrite the sentence.
- Never use --- horizontal rules as section dividers. Use a blank line or a bold heading instead.
- Never use markdown tables. Present lists of people, roles, or records as bullet points or numbered lists.
- Do not use bullet points for simple single-fact answers. Use prose.
- Do not open with "Certainly", "Of course", "Sure", or other filler affirmations.

Principles that shape every response:

- Strengths first. Before naming a gap or absence, name what is alive and moving. What the data shows that IS happening is at least as important as what isn't.

- Tentative observation language. Say "I'm noticing..." or "What the data is showing us..." or "Something worth sitting with together..." - never deliver gaps or absences as standalone verdicts.

- No deficit framing. Instead of "No decisions recorded" say something like "Decisions haven't surfaced in what has reached me yet - that could mean they are happening in conversation and haven't been captured yet, or that the space is still forming." Absence is information, not indictment.

- Name your limits before citing numbers. Before sharing a metric that might sting, say: "This is only what has reached me through emails and meetings - I know there is more happening than I can see." Data without its container can hurt.

- Multiple explanations for gaps. Low activity in a circle could mean rest, transition, trust-building, or simply that things are not yet reaching me electronically - not that something is wrong. Offer two or three possible readings before drawing any conclusion.

- Separate the person from the metric. Numbers describe patterns in what was captured, not the worth or effort of the people behind them.

- Effectiveness over efficiency. Process quality, relationships, and things that cannot be measured are real and valuable. Acknowledge them when relevant.

Use Teal vocabulary naturally: circles, tensions, roles, consent, proposals, role assignments, ledger entries, governing purpose. Avoid corporate language.

PRIVACY GUARDRAILS
When a record is labeled [SENSITIVE], explicitly note this sensitivity in your response so the reader is aware. Records marked Restricted are excluded entirely and will not appear in your data. IP addresses are stripped from all records and should never be referenced.

TOOL GUIDANCE
ALWAYS use tools to retrieve data before answering. Never answer governance, policy, people, or operational questions from memory alone.
- Use query_database when the question targets a specific entity type (policies, tasks, decisions, risks, etc.) - especially when a status or filter is implied ("active", "open", "pending", "draft").
- Use text_search for open-ended questions about events, people, or topics that span multiple entity types.
- You may call multiple tools in one turn if the question requires data from multiple sources.
- If the first tool call returns no results, try text_search as a fallback.

Available databases and their Status values:
- policies: Status = Active | Draft | Archived
- tasks: Status = Open | In Progress | Done | Needs Owner | Cancelled
- decisions: Status = Confirmed | Candidate | Needs Clarification | Rejected
- risks: Status = Open | Mitigated | Closed | Accepted
- circles: Status = Active | Inactive | Archived
- roles: Status = Active | Inactive
- roleAssignments: Status = Active | Inactive | Pending
- memoryReviewQueue: Status = Pending Review | Approved | Rejected
- canonChangeRequests: Status = Pending Review | Approved | Rejected
- ccosLedger: Status = Draft | Pending Review | Ratified
- meetings: (no Status filter - query returns all)
- profiles: (no Status filter - query returns all)
- projects: Status = Active | Completed | On Hold | Cancelled

Ground every answer in what the tools return. When a record is incomplete or absent, name it honestly and with care - and always offer a gentle interpretation of what the absence might mean.

LINKING RECORDS
Every record in the tool output includes a "Notion URL:" line. When you reference a specific record in your response - especially tasks, tensions, decisions, roles, or any item someone might need to act on - include it as a markdown link so the user can navigate directly. Format: [Record Title](URL). Do this inline, not just in a sources list. If you list multiple items, link each one.
Example: To resolve the tension, see [Absence of formal capture policy](https://app.notion.com/p/...).

WRITING AND CREATING RECORDS
You can create records directly in Notion using the create_record tool. Use this proactively.

Rules for creating records:
- When someone asks you to draft, log, create, submit, or correct something - DO IT. Do not ask for information you already have from the conversation.
- Draft with what you know. State your assumptions in the notes field. The human can edit the record in Notion afterward.
- For profiles: use database="profiles". The profile is created directly (no approval step needed). Pack everything known into the body field: email, role/title, membership type, location, context. Use category for Membership Type (default Guest if unknown).
- After creating, tell the user exactly what you created and provide the Notion link so they can open and edit it immediately.
- Never say "I cannot make changes directly." You can. Use create_record.
- For corrections: search first (text_search or query_database), then create the corrected version as a new candidate with a note explaining what it corrects.`;
}

function buildReportSystemPrompt(clientName: string): string {
  return buildQaSystemPrompt(clientName) + `

REPORT MODE
You are generating a periodic summary for the community. Follow this four-part flow - let it read like a thoughtful letter from someone who genuinely cares, not a status update or audit finding. Do not use section headers or labels in your output.

Part 1 - RECOGNITION: Open with genuine, specific recognition of what is alive and moving in the data. What has the community done, decided, created, or navigated? Name circles and efforts where you can. This should feel like a warm witness speaking, not a press release.

Part 2 - OBSERVATIONS: Offer 2 to 4 observations about patterns you are noticing. These are observations, not conclusions. Each observation should include at least two possible interpretations. Use language like "I'm noticing..." or "Something that has been on my mind..." or "What the data is showing us..."

Part 3 - INVITATION: After your observations, offer a genuine question back to the community. Something like "I'm curious what is behind this - does this match what you are feeling?" or "I wonder if the people closest to this have a read on what is underneath." This names that you only see what reaches you.

Part 4 - HOLDING: End with what you are holding on behalf of the community - not a to-do list, not a list of failures. What feels important to carry forward? What deserves attention without urgency? Frame as care, not pressure.`;
}

const SERA_TOOLS: Anthropic.Tool[] = [
  {
    name: 'query_database',
    description: 'Query a specific Notion database, optionally filtered by Status. Use this when the question targets a specific entity type: policies, tasks, decisions, risks, circles, roles, role assignments, meetings, profiles, projects, memory review items, canon changes, or CCOS ledger entries.',
    input_schema: {
      type: 'object' as const,
      properties: {
        database: {
          type: 'string',
          description: 'Which database to query.',
          enum: ['policies', 'tasks', 'decisions', 'risks', 'meetings', 'profiles', 'circles', 'roles', 'roleAssignments', 'projects', 'memoryReviewQueue', 'canonChangeRequests', 'ccosLedger', 'sourceEmails', 'messages', 'knowledgeBase'],
        },
        status_filter: {
          type: 'string',
          description: 'Optional. Filter by Status property value (e.g. "Active", "Draft", "Open", "Pending Review"). Omit to return all records.',
        },
        limit: {
          type: 'number',
          description: 'Max records to return (default 20, max 50).',
        },
        offset: {
          type: 'number',
          description: 'Number of records to skip (default 0). Use multiples of limit to page through large result sets.',
        },
      },
      required: ['database'],
    },
  },
  {
    name: 'text_search',
    description: 'Full-text search across all Notion pages. Use for open-ended questions about specific events, people, or topics that span multiple database types, or as a fallback when query_database returns no results.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search terms or phrase.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_record',
    description: 'Create a new record in Notion. Use this proactively whenever the user asks you to draft, log, create, submit, or correct anything. Do NOT ask clarifying questions before creating — draft with available context, state assumptions in the notes field, and let the human refine afterward. Search first if you need to locate an existing record to reference.',
    input_schema: {
      type: 'object' as const,
      properties: {
        database: {
          type: 'string',
          enum: ['profiles', 'memoryReviewQueue', 'tasks', 'ccosLedger', 'canonChangeRequests'],
          description: 'Which database to write to. profiles: create a person or organization profile directly. memoryReviewQueue: facts, corrections, and memories to preserve. tasks: action items. ccosLedger: tensions, proposals, governance actions. canonChangeRequests: proposed corrections to policies, roles, circles, or governing purpose.',
        },
        title: {
          type: 'string',
          description: 'Short, clear title. For profiles: the full name of the person or organization. For memoryReviewQueue: the proposed memory headline. For tasks: the action item in plain language. For ccosLedger: the tension or proposal name. For canonChangeRequests: what is being proposed to change.',
        },
        body: {
          type: 'string',
          description: 'Full content. For profiles: bio, context, role, email, location — everything known about the person. For memoryReviewQueue: complete proposed memory text with who, what, when. For ccosLedger: full description of the tension, what was decided or proposed. For canonChangeRequests: the complete proposed new text and why it matters.',
        },
        notes: {
          type: 'string',
          description: 'Source evidence, attribution, and any assumptions you made. Always note who surfaced this and from which conversation or document.',
        },
        category: {
          type: 'string',
          description: 'Optional type/category. profiles: Membership Type — Founding Member | Full Member | Associate Member | Guest | Steward | Partner (default Guest). memoryReviewQueue: Context | Relationship | Commitment | Decision | Learning | Process. tasks: High | Medium | Low (priority). ccosLedger: Tension | Proposal | Decision | Role | Policy | Resource | Accountability. canonChangeRequests: Governing Purpose | Policy | Circle Definition | Role Definition | Decision Rights | Legal Commitment | Financial Commitment | Land Stewardship | CCOS Ledger | Public Commitment.',
        },
      },
      required: ['database', 'title', 'body'],
    },
  },
];

// Strip null bytes and hard-cap length to prevent prompt injection via admin-edited fields.
function sanitizeForPrompt(text: string): string {
  return text.replace(/\x00/g, '').slice(0, 10_000).trim();
}

export interface QAResult {
  answer: string;
  sources: Array<{ title: string; url: string }>;
  tokens: number;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AttachmentInput {
  mediaType: string;
  data: string;
}

export type StreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'thinking'; label?: string }
  | { type: 'sources'; sources: Array<{ title: string; url: string }> }
  | { type: 'tokens'; count: number }
  | { type: 'error'; message: string };

export interface SearchResult {
  results: Array<{ id: string; title: string; url: string; snippet: string }>;
  total: number;
}

type NotionPage = {
  object: 'page';
  id: string;
  url: string;
  properties: Record<string, unknown>;
};

const PII_FIELDS = new Set(['IP Address', 'IP']);

function getConfidentialityLevel(page: NotionPage): string | null {
  const prop = page.properties['Confidentiality Level'] as Record<string, unknown> | undefined;
  if (!prop || prop.type !== 'select') return null;
  const s = prop.select as { name?: string } | null;
  return s?.name ?? null;
}

function extractTitle(page: NotionPage): string {
  for (const val of Object.values(page.properties)) {
    const v = val as Record<string, unknown>;
    if (v.type === 'title') {
      const arr = v.title as Array<{ plain_text: string }> | undefined;
      const text = arr?.map(t => t.plain_text).join('') ?? '';
      if (text) return text;
    }
  }
  return 'Untitled';
}

function extractProps(page: NotionPage): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(page.properties)) {
    if (PII_FIELDS.has(key)) continue;
    const v = val as Record<string, unknown>;
    if (v.type === 'title' || v.type === 'rich_text') {
      const arr = (v.title ?? v.rich_text) as Array<{ plain_text: string }> | undefined;
      const text = arr?.map(t => t.plain_text).join('') ?? '';
      if (text) lines.push(`${key}: ${text}`);
    } else if (v.type === 'select') {
      const s = v.select as { name?: string } | null;
      if (s?.name) lines.push(`${key}: ${s.name}`);
    } else if (v.type === 'multi_select') {
      const arr = v.multi_select as Array<{ name: string }> | undefined;
      const text = arr?.map(o => o.name).join(', ') ?? '';
      if (text) lines.push(`${key}: ${text}`);
    } else if (v.type === 'date') {
      const d = v.date as { start?: string } | null;
      if (d?.start) lines.push(`${key}: ${d.start}`);
    } else if (v.type === 'checkbox') {
      lines.push(`${key}: ${v.checkbox}`);
    } else if (v.type === 'number') {
      if (v.number !== null && v.number !== undefined) lines.push(`${key}: ${v.number}`);
    } else if (v.type === 'url') {
      if (v.url) lines.push(`${key}: ${v.url}`);
    }
  }
  return lines.join('\n');
}

function formatPagesAsContext(pages: NotionPage[], sources: QAResult['sources']): string {
  if (pages.length === 0) return 'No records found.';
  const parts: string[] = [];
  for (const page of pages) {
    const confidentiality = getConfidentialityLevel(page);
    if (confidentiality === 'Restricted') continue;
    const title = extractTitle(page);
    const props = extractProps(page);
    if (!props) continue;
    const label = confidentiality === 'Sensitive' ? `--- [SENSITIVE] ${title} ---` : `--- ${title} ---`;
    parts.push(`${label}\nNotion URL: ${page.url}\n${props}`);
    if (!sources.find(s => s.url === page.url)) {
      sources.push({ title, url: page.url });
    }
  }
  return parts.length > 0 ? parts.join('\n\n') : 'No readable records found.';
}

export class SeraQAService {
  private readonly anthropic: Anthropic;
  private readonly notion: Client;
  private readonly model: string;
  private readonly governingPurpose: string | null;
  private readonly clientName: string;

  constructor() {
    const config = getConfig();
    this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, maxRetries: 3, timeout: 60_000 });
    this.notion = new Client({ auth: config.NOTION_API_KEY });
    this.model = config.CLAUDE_MODEL;
    this.governingPurpose = config.AMORA_GOVERNING_PURPOSE ?? null;
    this.clientName = config.SABERRA_CLIENT_NAME ?? 'Amora';
  }

  private getDbMap(): Record<string, string | null | undefined> {
    const config = getConfig();
    const dbs = getNotionDatabaseIds(config);
    return {
      policies:           dbs.policies,
      tasks:              dbs.tasks,
      decisions:          dbs.decisionCandidates,
      risks:              dbs.risks,
      meetings:           dbs.meetings,
      profiles:           dbs.profiles,
      circles:            dbs.circles,
      roles:              dbs.roles,
      roleAssignments:    dbs.roleAssignments,
      projects:           dbs.projects,
      memoryReviewQueue:  dbs.memoryReviewQueue,
      canonChangeRequests: dbs.canonChangeRequests,
      ccosLedger:         dbs.ccosLedgerEntries,
      sourceEmails:       dbs.sourceEmails,
      messages:           dbs.messages,
      knowledgeBase:      dbs.knowledgeBase,
    };
  }

  private async runQueryDatabase(
    database: string,
    statusFilter: string | undefined,
    limit: number,
    sources: QAResult['sources'],
    offset: number = 0,
  ): Promise<string> {
    const dbMap = this.getDbMap();
    const dbId = dbMap[database];
    if (!dbId) return `Database "${database}" is not configured in this environment.`;

    const filter = statusFilter
      ? { property: 'Status', select: { equals: statusFilter } } as never
      : undefined;

    const pageSize = Math.min(limit, 50);
    const totalNeeded = Math.min(offset + pageSize, 200); // hard cap to prevent runaway fetches

    const collected: NotionPage[] = [];
    let cursor: string | undefined;
    while (collected.length < totalNeeded) {
      const batchSize = Math.min(50, totalNeeded - collected.length);
      const result = await this.notion.databases.query({
        database_id: dbId,
        ...(filter ? { filter } : {}),
        page_size: batchSize,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      collected.push(...result.results.filter((r): r is NotionPage => r.object === 'page'));
      if (!result.has_more || !result.next_cursor) break;
      cursor = result.next_cursor;
    }

    const sliced = collected.slice(offset, offset + pageSize);
    if (sliced.length === 0) return `No records found${offset > 0 ? ` at offset ${offset}` : ''}.`;
    return formatPagesAsContext(sliced, sources);
  }

  private async runTextSearch(query: string, sources: QAResult['sources']): Promise<string> {
    const config = getConfig();
    const dbs = getNotionDatabaseIds(config);
    const sensitiveReviewId = dbs.sensitiveReview?.replace(/-/g, '') ?? '';
    const response = await this.notion.search({
      query,
      filter: { value: 'page', property: 'object' },
      page_size: 20,
    });
    const pages = response.results
      .filter((r): r is NotionPage => r.object === 'page')
      .filter(page => {
        const parent = (page as unknown as { parent?: { database_id?: string } }).parent;
        const parentId = parent?.database_id?.replace(/-/g, '') ?? '';
        return !sensitiveReviewId ? true : parentId !== sensitiveReviewId;
      });
    return formatPagesAsContext(pages, sources);
  }

  private notionPageUrl(pageId: string): string {
    const c = pageId.replace(/-/g, '');
    const slug = process.env.NOTION_WORKSPACE_SLUG;
    return slug ? `https://app.notion.com/p/${slug}/${c}` : `https://app.notion.com/p/${c}`;
  }

  private async runCreateRecord(
    database: string,
    title: string,
    body: string,
    notes: string | undefined,
    category: string | undefined,
  ): Promise<string> {
    const config = getConfig();
    const dbs = getNotionDatabaseIds(config);
    const safeTitle = title.slice(0, 2000);
    const safeBody  = body.slice(0, 2000);
    const safeNotes = (notes ?? '').slice(0, 2000);

    const prop = (content: string) => ({ rich_text: [{ text: { content } }] });
    const sel  = (name: string)    => ({ select: { name } });
    const ttl  = (content: string) => ({ title: [{ text: { content } }] });

    if (database === 'profiles') {
      const dbId = dbs.profiles;
      if (!dbId) return 'Profiles database is not configured.';
      const validMemberships = ['Founding Member', 'Full Member', 'Associate Member', 'Guest', 'Steward', 'Partner'];
      const membership = validMemberships.includes(category ?? '') ? category! : 'Guest';
      const today = new Date().toISOString().slice(0, 10);
      // Best-effort email extraction from body
      const emailMatch = (safeBody + ' ' + safeNotes).match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch?.[0] ?? null;
      const page = await this.notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          Name:                  ttl(safeTitle),
          'Profile Type':        sel('Person'),
          'Membership Type':     sel(membership),
          'Engagement Status':   sel('Active'),
          'Context Summary':     prop(safeBody),
          ...(safeNotes ? { Source: prop(safeNotes) } : {}),
          ...(email ? { Email: { email } } : {}),
          'Sensitive Notes Flag': { checkbox: false },
          'First Seen':          { date: { start: today } },
          'Last Seen':           { date: { start: today } },
        } as never,
      });
      const url = this.notionPageUrl(page.id);
      return `Profile created: "${safeTitle}". Membership: ${membership}.\nNotion URL: ${url}\nOpen in Notion to add role, location, tags, or any details I may have missed.`;
    }

    if (database === 'memoryReviewQueue') {
      const dbId = dbs.memoryReviewQueue;
      if (!dbId) return 'Memory Review Queue database is not configured.';
      const validCats = ['Context', 'Relationship', 'Commitment', 'Decision', 'Learning', 'Process'];
      const cat = validCats.includes(category ?? '') ? category! : 'Context';
      const page = await this.notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          'Proposed Memory': ttl(safeTitle),
          'Memory Detail':   prop(safeBody),
          'Source Evidence': prop(safeNotes),
          Category:          sel(cat),
          Confidence:        sel('High'),
          Status:            sel('Pending Review'),
        } as never,
      });
      const url = this.notionPageUrl(page.id);
      return `Memory candidate created: "${safeTitle}". Status: Pending Review in Memory Review Queue.\nNotion URL: ${url}\nOpen Notion to review and approve before it becomes canon.`;
    }

    if (database === 'tasks') {
      const dbId = dbs.tasks;
      if (!dbId) return 'Tasks database is not configured.';
      const validPriorities = ['High', 'Medium', 'Low'];
      const priority = validPriorities.includes(category ?? '') ? category! : 'Medium';
      const page = await this.notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          Task:              ttl(safeTitle),
          'Source Evidence': prop(safeNotes || safeBody),
          Priority:          sel(priority),
          Status:            sel('Open'),
        } as never,
      });
      const url = this.notionPageUrl(page.id);
      return `Task created: "${safeTitle}". Status: Open, Priority: ${priority}.\nNotion URL: ${url}`;
    }

    if (database === 'ccosLedger') {
      const dbId = dbs.ccosLedgerEntries;
      if (!dbId) return 'CCOS Ledger database is not configured.';
      const validTypes = ['Tension', 'Proposal', 'Decision', 'Role', 'Policy', 'Resource', 'Accountability'];
      const ledgerType = validTypes.includes(category ?? '') ? category! : 'Tension';
      const page = await this.notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          'Ledger Entry':   ttl(safeTitle),
          Evidence:         prop(safeNotes || safeBody),
          'Ledger Type':    sel(ledgerType),
          Status:           sel('Draft'),
          'Review Required': { checkbox: true },
        } as never,
      });
      const url = this.notionPageUrl(page.id);
      return `CCOS Ledger entry created: "${safeTitle}". Type: ${ledgerType}, Status: Draft.\nNotion URL: ${url}`;
    }

    if (database === 'canonChangeRequests') {
      const dbId = dbs.canonChangeRequests;
      if (!dbId) return 'Canon Change Requests database is not configured.';
      const validAreas = ['Governing Purpose', 'Policy', 'Circle Definition', 'Role Definition', 'Decision Rights', 'Legal Commitment', 'Financial Commitment', 'Land Stewardship', 'CCOS Ledger', 'Public Commitment', 'Unknown'];
      const area = validAreas.includes(category ?? '') ? category! : 'Unknown';
      const page = await this.notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          'Proposed Change':     ttl(safeTitle),
          'Change Detail':       prop(safeBody),
          Reason:                prop(safeNotes),
          'Source Evidence':     prop(safeNotes),
          'Affected Canon Area': sel(area),
          Status:                sel('Pending Review'),
        } as never,
      });
      const url = this.notionPageUrl(page.id);
      return `Canon Change Request created: "${safeTitle}". Area: ${area}, Status: Pending Review.\nNotion URL: ${url}`;
    }

    return `Unknown database: ${database}`;
  }

  async search(query: string, _databases?: string[]): Promise<SearchResult> {
    const config = getConfig();
    const dbs = getNotionDatabaseIds(config);
    const sensitiveReviewId = dbs.sensitiveReview?.replace(/-/g, '') ?? '';
    const response = await this.notion.search({
      query,
      filter: { value: 'page', property: 'object' },
      page_size: 25,
    });

    const results = response.results
      .filter((r): r is NotionPage => r.object === 'page')
      .filter(page => {
        const parent = (page as unknown as { parent?: { database_id?: string } }).parent;
        const parentId = parent?.database_id?.replace(/-/g, '') ?? '';
        if (sensitiveReviewId && parentId === sensitiveReviewId) return false;
        return getConfidentialityLevel(page) !== 'Restricted';
      })
      .map(page => {
        const title = extractTitle(page);
        const snippet = extractProps(page).slice(0, 200);
        return { id: page.id, title, url: page.url, snippet };
      });

    return { results, total: results.length };
  }

  async ask(question: string, mode: 'ask' | 'report' = 'ask', history: ConversationTurn[] = [], images: AttachmentInput[] = []): Promise<QAResult> {
    const sources: QAResult['sources'] = [];
    let totalTokens = 0;
    const language = HubSettingsService.getInstance().outputLanguage;
    const langLine = language && language !== 'English'
      ? `\n\nRESPONSE LANGUAGE: Respond in ${language}. All answers, explanations, and lists must be in ${language}. Proper nouns (people's names, place names, organization names, and Notion record titles) may remain in their original form.`
      : '';
    const systemPrompt = (mode === 'report' ? buildReportSystemPrompt(this.clientName) : buildQaSystemPrompt(this.clientName)) + langLine;

    const purposeSection = this.governingPurpose
      ? `\nGOVERNING PURPOSE STATEMENT:\n${sanitizeForPrompt(this.governingPurpose)}\n\n`
      : '';

    // Build conversation: history (last 10 turns) + current question
    // History turns are plain text user/assistant pairs (tool-use mechanics excluded).
    const messages: Anthropic.MessageParam[] = [];

    const recentHistory = history.slice(-10);
    for (const turn of recentHistory) {
      messages.push({ role: turn.role, content: turn.content });
    }

    // Current question — always includes governing purpose so context is never lost mid-thread
    const userText = `${purposeSection}${question}`;
    if (images.length === 0) {
      messages.push({ role: 'user', content: userText });
    } else {
      const contentBlocks: Anthropic.ContentBlockParam[] = [
        { type: 'text', text: userText },
        ...images.map(img => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: img.data,
          },
        })),
      ];
      messages.push({ role: 'user', content: contentBlocks });
    }

    let response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 8192,
      system: systemPrompt,
      tools: SERA_TOOLS,
      messages,
    });

    totalTokens += (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

    // Tool-use loop — Claude calls tools, we execute, return results, repeat
    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < 6) {
      iterations++;
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        let result: string;
        try {
          if (toolUse.name === 'query_database') {
            const input = toolUse.input as { database: string; status_filter?: string; limit?: number; offset?: number };
            logger.info({ tool: 'query_database', database: input.database, status: input.status_filter, offset: input.offset }, 'Sera tool call');
            result = await this.runQueryDatabase(
              input.database,
              input.status_filter,
              input.limit ?? 20,
              sources,
              input.offset ?? 0,
            );
          } else if (toolUse.name === 'text_search') {
            const input = toolUse.input as { query: string };
            logger.info({ tool: 'text_search', query: input.query.slice(0, 60) }, 'Sera tool call');
            result = await this.runTextSearch(input.query, sources);
          } else if (toolUse.name === 'create_record') {
            const input = toolUse.input as { database: string; title: string; body: string; notes?: string; category?: string };
            logger.info({ tool: 'create_record', database: input.database, title: input.title.slice(0, 60) }, 'Sera tool call');
            result = await this.runCreateRecord(input.database, input.title, input.body, input.notes, input.category);
          } else {
            result = `Unknown tool: ${toolUse.name}`;
          }
        } catch (err) {
          logger.error(err, `Sera tool error: ${toolUse.name}`);
          result = `Tool error: ${(err as Error).message}`;
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });

      response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 8192,
        system: systemPrompt,
        tools: SERA_TOOLS,
        messages,
      });

      totalTokens += (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
    }

    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    logger.info({ question: question.slice(0, 80), sources: sources.length, tokens: totalTokens, iterations, mode }, 'Sera Q&A');
    return { answer, sources, tokens: totalTokens };
  }

  async *streamAsk(
    question: string,
    mode: 'ask' | 'report' = 'ask',
    history: ConversationTurn[] = [],
    images: AttachmentInput[] = [],
  ): AsyncGenerator<StreamEvent> {
    const sources: QAResult['sources'] = [];
    let totalTokens = 0;
    const language = HubSettingsService.getInstance().outputLanguage;
    const langLine = language && language !== 'English'
      ? `\n\nRESPONSE LANGUAGE: Respond in ${language}. All answers, explanations, and lists must be in ${language}. Proper nouns (people's names, place names, organization names, and Notion record titles) may remain in their original form.`
      : '';
    const systemPrompt = (mode === 'report' ? buildReportSystemPrompt(this.clientName) : buildQaSystemPrompt(this.clientName)) + langLine;
    const purposeSection = this.governingPurpose
      ? `\nGOVERNING PURPOSE STATEMENT:\n${sanitizeForPrompt(this.governingPurpose)}\n\n`
      : '';

    const messages: Anthropic.MessageParam[] = [];
    for (const turn of history.slice(-10)) {
      messages.push({ role: turn.role, content: turn.content });
    }
    const userText = `${purposeSection}${question}`;
    if (images.length === 0) {
      messages.push({ role: 'user', content: userText });
    } else {
      const contentBlocks: Anthropic.ContentBlockParam[] = [
        { type: 'text', text: userText },
        ...images.map(img => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: img.data,
          },
        })),
      ];
      messages.push({ role: 'user', content: contentBlocks });
    }

    try {
      let iterations = 0;
      while (iterations < 6) {
        iterations++;
        const stream = this.anthropic.messages.stream({
          model: this.model,
          max_tokens: 8192,
          system: systemPrompt,
          tools: SERA_TOOLS,
          messages,
        });

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            yield { type: 'text', delta: event.delta.text };
          }
        }

        const finalMsg = await stream.finalMessage();
        totalTokens += (finalMsg.usage.input_tokens ?? 0) + (finalMsg.usage.output_tokens ?? 0);

        if (finalMsg.stop_reason !== 'tool_use') break;

        const toolUseBlocks = finalMsg.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );
        const toolLabels: Record<string, string> = {
          query_database: 'Checking records...',
          text_search:    'Searching memory...',
          create_record:  'Creating record...',
        };
        yield { type: 'thinking', label: toolLabels[toolUseBlocks[0]?.name] ?? 'Working...' };
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const toolUse of toolUseBlocks) {
          let result: string;
          try {
            if (toolUse.name === 'query_database') {
              const input = toolUse.input as { database: string; status_filter?: string; limit?: number; offset?: number };
              logger.info({ tool: 'query_database', database: input.database }, 'Sera stream tool call');
              result = await this.runQueryDatabase(input.database, input.status_filter, input.limit ?? 20, sources, input.offset ?? 0);
            } else if (toolUse.name === 'text_search') {
              const input = toolUse.input as { query: string };
              logger.info({ tool: 'text_search', query: input.query.slice(0, 60) }, 'Sera stream tool call');
              result = await this.runTextSearch(input.query, sources);
            } else if (toolUse.name === 'create_record') {
              const input = toolUse.input as { database: string; title: string; body: string; notes?: string; category?: string };
              logger.info({ tool: 'create_record', database: input.database, title: input.title.slice(0, 60) }, 'Sera stream tool call');
              result = await this.runCreateRecord(input.database, input.title, input.body, input.notes, input.category);
            } else {
              result = `Unknown tool: ${toolUse.name}`;
            }
          } catch (err) {
            logger.error(err, `Sera stream tool error: ${toolUse.name}`);
            result = `Tool error: ${(err as Error).message}`;
          }
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
        }

        messages.push({ role: 'assistant', content: finalMsg.content });
        messages.push({ role: 'user', content: toolResults });
      }

      yield { type: 'sources', sources };
      yield { type: 'tokens', count: totalTokens };
      logger.info({ question: question.slice(0, 80), sources: sources.length, tokens: totalTokens, mode }, 'Sera stream Q&A');
    } catch (err) {
      logger.error(err, 'Sera streamAsk error');
      yield { type: 'error', message: (err as Error).message ?? 'Unknown error' };
    }
  }
}
