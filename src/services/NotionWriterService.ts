import { Client, APIErrorCode, APIResponseError } from '@notionhq/client';
import type {
  CreatePageParameters,
  QueryDatabaseParameters,
} from '@notionhq/client/build/src/api-endpoints';
import { getConfig, getNotionDatabaseIds } from '../config/ConfigService';
import { HubSettingsService } from './HubSettingsService';
import { logger } from '../config/logger';

/** Sentinel returned by createPage when the operation is blocked by db permissions. */
export const PERM_SKIP = '__perm_skip__';

type NotionProperties = CreatePageParameters['properties'];
// The Notion SDK's property union type is very wide; use this alias for builder returns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NotionPropValue = any;

export class NotionWriterService {
  private readonly client: Client;
  readonly dbIds: ReturnType<typeof getNotionDatabaseIds>;
  private readonly dbKeyById: Record<string, string>;

  constructor() {
    const config = getConfig();
    this.client = new Client({ auth: config.NOTION_API_KEY });
    this.dbIds = getNotionDatabaseIds(config);
    this.dbKeyById = Object.fromEntries(
      Object.entries(this.dbIds)
        .filter(([, id]) => Boolean(id))
        .map(([key, id]) => [id as string, key]),
    );
  }

  // ─── Core helpers ──────────────────────────────────────────────────────────

  async createPage(databaseId: string, properties: Record<string, NotionPropValue>): Promise<string> {
    const key = this.dbKeyById[databaseId];
    if (key && !HubSettingsService.getInstance().canCreate(key)) {
      logger.info({ key }, 'Write skipped: create permission disabled for database');
      return PERM_SKIP;
    }
    const page = await this.withRetry(() =>
      this.client.pages.create({
        parent: { database_id: databaseId },
        properties: properties as NotionProperties,
      }),
    );
    return page.id;
  }

  async updatePage(pageId: string, properties: Record<string, NotionPropValue>, dbKey?: string): Promise<void> {
    if (pageId === PERM_SKIP) return;
    if (dbKey && !HubSettingsService.getInstance().canUpdate(dbKey)) {
      logger.info({ dbKey }, 'Write skipped: update permission disabled for database');
      return;
    }
    await this.withRetry(() =>
      this.client.pages.update({
        page_id: pageId,
        properties: properties as NotionProperties,
      }),
    );
  }

  async archivePage(pageId: string): Promise<void> {
    await this.withRetry(() =>
      this.client.pages.update({ page_id: pageId, archived: true }),
    );
  }

  async getPage(pageId: string): Promise<Record<string, unknown> | null> {
    try {
      const page = await this.withRetry(() => this.client.pages.retrieve({ page_id: pageId }));
      return page as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async queryDatabase(
    databaseId: string,
    filter: QueryDatabaseParameters['filter'],
    pageSize = 10,
  ): Promise<Array<{ id: string; properties: Record<string, unknown> }>> {
    const response = await this.client.databases.query({
      database_id: databaseId,
      filter,
      page_size: pageSize,
    });
    return response.results.map((r) => ({
      id: r.id,
      properties: 'properties' in r ? (r.properties as Record<string, unknown>) : {},
    }));
  }

  // ─── Deduplication helper ─────────────────────────────────────────────────

  /** Returns existing page ID if a record with this email property value exists, else null. */
  async findByEmail(databaseId: string, propertyName: string, value: string): Promise<string | null> {
    const results = await this.queryDatabase(
      databaseId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { property: propertyName, email: { equals: value } } as any,
      1,
    );
    return results.length > 0 ? results[0].id : null;
  }

  /** Returns existing page ID if a record with this rich_text property value exists, else null. */
  async findByRichText(
    databaseId: string,
    propertyName: string,
    value: string,
  ): Promise<string | null> {
    const results = await this.queryDatabase(
      databaseId,
      {
        property: propertyName,
        rich_text: { equals: value },
      },
      1,
    );
    return results.length > 0 ? results[0].id : null;
  }

  /** Returns existing page ID if a record with this title property value exists, else null. */
  async findByTitle(
    databaseId: string,
    propertyName: string,
    value: string,
  ): Promise<string | null> {
    const results = await this.queryDatabase(
      databaseId,
      {
        property: propertyName,
        title: { equals: value },
      },
      1,
    );
    return results.length > 0 ? results[0].id : null;
  }

  /** Finds a project by prefix (first 35 chars of name). Prevents near-name variant dups like "Amora Campground..." variations. */
  async findProjectByNamePrefix(prefix: string): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await this.queryDatabase(
      this.dbIds.projects,
      { property: 'Project Name', title: { starts_with: prefix } } as any,
      1,
    );
    return results.length > 0 ? results[0].id : null;
  }

  /** Returns all profiles whose Name starts with the given first name (used for single-word name dedup). */
  async findProfilesByFirstName(firstName: string): Promise<Array<{ id: string; name: string }>> {
    const results = await this.queryDatabase(
      this.dbIds.profiles,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { property: 'Name', title: { starts_with: firstName } } as any,
      10,
    );
    return results.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nameProp = (r.properties as any)['Name'];
      const name: string = nameProp?.title?.[0]?.plain_text ?? '';
      return { id: r.id, name };
    });
  }

  /** Returns all profiles whose Name contains the given substring (used for last-name dedup). */
  async findProfilesByLastName(lastName: string): Promise<Array<{ id: string; name: string }>> {
    const results = await this.queryDatabase(
      this.dbIds.profiles,
      { property: 'Name', title: { contains: lastName } } as any,
      10,
    );
    return results.map((r) => {
      const nameProp = (r.properties as any)['Name'];
      const name: string = nameProp?.title?.[0]?.plain_text ?? '';
      return { id: r.id, name };
    });
  }

  // ─── Startup validation ───────────────────────────────────────────────────

  /** Verifies all configured Notion databases are reachable. Returns names of unreachable ones. */
  async validateDatabases(): Promise<string[]> {
    const failures: string[] = [];
    await Promise.all(
      Object.entries(this.dbIds)
        .filter(([, id]) => Boolean(id))
        .map(async ([name, id]) => {
          try {
            await this.client.databases.retrieve({ database_id: id });
          } catch {
            failures.push(name);
          }
        }),
    );
    return failures;
  }

  // ─── Cross-meeting context ────────────────────────────────────────────────

  /** Fetches a formatted context string of recent open tasks, decisions, and risks. */
  async getRecentExtractionContext(days = 14): Promise<string> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const tsFilter = { timestamp: 'created_time', created_time: { after: cutoff } } as any;
    try {
      const [tasks, decisions, risks] = await Promise.all([
        this.queryDatabase(this.dbIds.tasks, {
          and: [
            { property: 'Status', select: { does_not_equal: 'Done' } },
            { property: 'Status', select: { does_not_equal: 'Cancelled' } },
            tsFilter,
          ],
        } as any, 30),
        this.queryDatabase(this.dbIds.decisionCandidates, {
          and: [
            { property: 'Status', select: { does_not_equal: 'Rejected' } },
            tsFilter,
          ],
        } as any, 20),
        this.queryDatabase(this.dbIds.risks, {
          and: [
            { property: 'Status', select: { does_not_equal: 'Closed' } },
            { property: 'Status', select: { does_not_equal: 'Mitigated' } },
            tsFilter,
          ],
        } as any, 20),
      ]);

      if (!tasks.length && !decisions.length && !risks.length) return '';

      const clientLabel = getConfig().SABERRA_CLIENT_NAME ?? getConfig().TENANT_ID ?? 'Organization';
      const lines: string[] = [`${clientLabel} institutional context from the last ${days} days (do NOT re-extract these — use them to detect contradictions, link related items, and avoid duplicates):`];
      if (tasks.length) {
        lines.push('\nOPEN TASKS:');
        tasks.forEach((r) => {
          const p = r.properties as any;
          const title = p.Task?.title?.[0]?.plain_text ?? '?';
          const due   = p['Due Date']?.date?.start ?? 'no due date';
          const status = p.Status?.select?.name ?? '?';
          lines.push(`  - [${status}] "${title}" (due: ${due})`);
        });
      }
      if (decisions.length) {
        lines.push('\nRECENT DECISIONS:');
        decisions.forEach((r) => {
          const p = r.properties as any;
          const text   = p.Decision?.title?.[0]?.plain_text ?? '?';
          const status = p.Status?.select?.name ?? '?';
          lines.push(`  - [${status}] "${text}"`);
        });
      }
      if (risks.length) {
        lines.push('\nACTIVE RISKS:');
        risks.forEach((r) => {
          const p = r.properties as any;
          const text = p.Risk?.title?.[0]?.plain_text ?? '?';
          const sev  = p.Severity?.select?.name ?? '?';
          lines.push(`  - [${sev}] "${text}"`);
        });
      }
      return lines.join('\n');
    } catch {
      return '';
    }
  }

  /** Returns active policies with their text summaries for compliance checking. */
  async getAllPolicySummaries(): Promise<Array<{ name: string; summary: string }>> {
    if (!this.dbIds.policies) return [];
    try {
      const response = await this.withRetry(() =>
        this.client.databases.query({
          database_id: this.dbIds.policies,
          filter: {
            and: [
              { property: 'Status', select: { does_not_equal: 'Archived' } },
              { property: 'Status', select: { does_not_equal: 'Superseded' } },
            ],
          },
          page_size: 50,
        }),
      );
      return response.results
        .map((r) => {
          if (!('properties' in r)) return null;
          const props = r.properties as any;
          const name    = props['Policy Name']?.title?.[0]?.plain_text ?? '';
          const summary = (props['Current Text Summary']?.rich_text ?? []).map((rt: any) => rt.plain_text).join('');
          return name ? { name, summary: summary || '(no summary)' } : null;
        })
        .filter(Boolean) as Array<{ name: string; summary: string }>;
    } catch {
      return [];
    }
  }

  /** Returns Source Email records in Failed status that are operational emails (eligible for retry). */
  async getFailedOperationalEmails(): Promise<Array<{ id: string; subject: string; rawSnippet: string; from: string }>> {
    try {
      // Also catch emails stuck in "Processing" for more than 10 minutes — these
      // indicate a worker crash mid-cycle where IMAP was already marked seen but
      // Claude extraction never completed. Without this, stuck emails are never retried.
      const results = await this.queryDatabase(
        this.dbIds.sourceEmails,
        {
          and: [
            { property: 'Source Category', select: { equals: 'Operational' } },
            { or: [
              { property: 'Processing Status', select: { equals: 'Failed' } },
              { property: 'Processing Status', select: { equals: 'Processing' } },
            ] },
          ],
        } as never,
        50,
      );
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      return results
        .filter(r => {
          const p = (r as any).properties;
          const status = p['Processing Status']?.select?.name ?? '';
          if (status === 'Failed') return true;
          // For stuck "Processing" emails, only retry if created > 10 min ago
          return new Date((r as any).created_time ?? 0).getTime() < tenMinutesAgo;
        })
        .map((r) => {
          const p = (r as any).properties;
          return {
            id:          r.id,
            subject:     p.Subject?.title?.[0]?.plain_text ?? p.Subject?.rich_text?.[0]?.plain_text ?? '(no subject)',
            rawSnippet:  p['Raw Snippet']?.rich_text?.[0]?.plain_text ?? '',
            from:        p.From?.rich_text?.[0]?.plain_text ?? '',
          };
        });
    } catch {
      return [];
    }
  }

  /** Returns existing task ID if an active task with this exact title exists (email-source dedup). */
  async findActiveTaskByTitle(dbId: string, title: string): Promise<string | null> {
    const results = await this.queryDatabase(
      dbId,
      {
        and: [
          { property: 'Task', title: { equals: title } },
          { or: [
            { property: 'Status', select: { equals: 'Open' } },
            { property: 'Status', select: { equals: 'Needs Owner' } },
            { property: 'Status', select: { equals: 'In Progress' } },
          ]},
        ],
      } as never,
      1,
    );
    return results.length > 0 ? results[0].id : null;
  }

  /** Finds a page by title within a specific meeting (compound filter). */
  async findByTitleInMeeting(
    dbId: string,
    titleProp: string,
    title: string,
    meetingPageId: string,
  ): Promise<string | null> {
    const results = await this.queryDatabase(
      dbId,
      {
        and: [
          { property: titleProp,  title:    { equals:   title          } },
          { property: 'Meeting',  relation: { contains: meetingPageId  } },
        ],
      },
      1,
    );
    return results.length > 0 ? results[0].id : null;
  }

  /** Returns names of all active/draft policies (up to 100). */
  async getAllPolicyNames(): Promise<string[]> {
    if (!this.dbIds.policies) return [];
    try {
      const response = await this.withRetry(() =>
        this.client.databases.query({
          database_id: this.dbIds.policies,
          filter: {
            and: [
              { property: 'Status', select: { does_not_equal: 'Archived' } },
              { property: 'Status', select: { does_not_equal: 'Superseded' } },
            ],
          },
          page_size: 100,
        }),
      );
      return response.results
        .map((r) => 'properties' in r
          ? (r.properties as any)?.['Policy Name']?.title?.[0]?.plain_text ?? ''
          : '')
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /** Returns full names of all profiles (up to 200) for Claude dedup context. */
  async getAllProfileNames(): Promise<string[]> {
    try {
      const response = await this.withRetry(() =>
        this.client.databases.query({
          database_id: this.dbIds.profiles,
          page_size: 200,
        }),
      );
      return response.results
        .map((r) => 'properties' in r
          ? (r.properties as any)?.['Name']?.title?.[0]?.plain_text ?? ''
          : '')
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /** Returns names of all non-archived roles (up to 100) for Claude role inference. */
  async getAllRoleNames(): Promise<string[]> {
    try {
      const response = await this.withRetry(() =>
        this.client.databases.query({
          database_id: this.dbIds.roles,
          filter: { property: 'Status', select: { does_not_equal: 'Archived' } },
          page_size: 100,
        }),
      );
      return response.results
        .map((r) => 'properties' in r
          ? (r.properties as any)?.['Role Name']?.title?.[0]?.plain_text ?? ''
          : '')
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /** Returns names of all non-cancelled, non-complete projects (up to 100). */
  async getAllProjectNames(): Promise<string[]> {
    try {
      const response = await this.withRetry(() =>
        this.client.databases.query({
          database_id: this.dbIds.projects,
          filter: {
            and: [
              { property: 'Status', select: { does_not_equal: 'Cancelled' } },
              { property: 'Status', select: { does_not_equal: 'Complete' } },
            ],
          },
          page_size: 100,
        }),
      );
      return response.results
        .map((r) => 'properties' in r
          ? (r.properties as any)?.['Project Name']?.title?.[0]?.plain_text ?? ''
          : '')
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  // ─── Property builders ────────────────────────────────────────────────────

  static title(text: string | null | undefined): NotionPropValue {
    return { title: [{ text: { content: (text ?? '').slice(0, 2000) } }] };
  }

  static richText(text: string | undefined | null): NotionPropValue {
    return { rich_text: [{ text: { content: (text ?? '').slice(0, 2000) } }] };
  }

  /** Like richText but chunks content > 2000 chars into multiple runs (up to 200k chars). */
  static richTextLong(text: string | undefined | null): NotionPropValue {
    const content = text ?? '';
    if (content.length <= 2000) return { rich_text: [{ text: { content } }] };
    const runs: Array<{ text: { content: string } }> = [];
    for (let i = 0; i < content.length && runs.length < 100; i += 2000) {
      runs.push({ text: { content: content.slice(i, i + 2000) } });
    }
    return { rich_text: runs };
  }

  static select(option: string | undefined | null): NotionPropValue {
    if (!option) return { select: null };
    return { select: { name: option } };
  }

  static multiSelect(options: string[]): NotionPropValue {
    return { multi_select: options.map((name) => ({ name })) };
  }

  static date(iso: string | undefined | null): NotionPropValue {
    if (!iso) return { date: null };
    return { date: { start: iso } };
  }

  static checkbox(value: boolean): NotionPropValue {
    return { checkbox: value };
  }

  static url(link: string | undefined | null): NotionPropValue {
    if (!link) return { url: null };
    return { url: link };
  }

  static number(n: number | undefined | null): NotionPropValue {
    if (n == null) return { number: null };
    return { number: n };
  }

  static relation(pageIds: string[]): NotionPropValue {
    return { relation: pageIds.filter(Boolean).map((id) => ({ id })) };
  }

  // ─── Role card / circle charter templates ────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static heading3(text: string): any {
    return { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: text } }], color: 'default' } };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static para(text: string): any {
    return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }], color: 'default' } };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static bullet(text: string): any {
    return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }], color: 'default' } };
  }
  private static splitLines(text: string): string[] {
    return text.split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
  }

  /** Appends a full ARC-integrated role card to a newly created Role page.
   *  `generated` comes from ClaudeExtractionService.generateRoleCardBody — when null, falls back to placeholders. */
  async appendRoleCardBlocks(pageId: string, role: {
    role_name: string;
    purpose?: string | null;
    accountabilities?: string | null;
    domains?: string | null;
    circle?: string | null;
    term_length?: string | null;
    assignment_method?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generated?: Record<string, any> | null;
  }): Promise<void> {
    const H = NotionWriterService.heading3;
    const P = NotionWriterService.para;
    const B = NotionWriterService.bullet;
    const split = NotionWriterService.splitLines;
    const g = role.generated ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any[] = [];

    // ── Role Identity ──
    blocks.push(H('Role Identity'));
    blocks.push(P(`Circle: ${role.circle ?? 'TBD'}  |  Term Length: ${role.term_length ?? '1 Year'}  |  Assignment Method: ${role.assignment_method ?? 'Consent Election'}  |  Status: Active`));

    // ── Regenerative Stewardship ──
    blocks.push(H('Regenerative Stewardship'));
    blocks.push(P(typeof g.regenerative_stewardship === 'string' && g.regenerative_stewardship
      ? g.regenerative_stewardship
      : '[Complete during role review - describe how this role expresses the organization\'s mission and values.]'));

    // ── Purpose ──
    if (role.purpose) { blocks.push(H('Purpose')); blocks.push(P(role.purpose)); }

    // ── Accountabilities ──
    if (role.accountabilities) {
      blocks.push(H('Accountabilities'));
      for (const line of split(role.accountabilities)) blocks.push(B(line));
    }

    // ── Domains ──
    if (role.domains) {
      blocks.push(H('Domains'));
      for (const line of split(role.domains)) blocks.push(B(line));
    }

    // ── Key Responsibilities ──
    const responsibilities = Array.isArray(g.responsibilities) ? g.responsibilities as string[] : [];
    blocks.push(H('Key Responsibilities'));
    if (responsibilities.length > 0) {
      for (const line of responsibilities) blocks.push(B(String(line)));
    } else {
      blocks.push(P('[Complete during role review - list 5-7 specific responsibilities more detailed than accountabilities.]'));
    }

    // ── Authorities ──
    blocks.push(H('Authorities'));
    const decide  = Array.isArray(g.authorities_decide)  ? g.authorities_decide  as string[] : [];
    const propose = Array.isArray(g.authorities_propose) ? g.authorities_propose as string[] : [];
    const block   = Array.isArray(g.authorities_block)   ? g.authorities_block   as string[] : [];
    if (decide.length || propose.length || block.length) {
      for (const line of decide)  blocks.push(B(`Decide: ${line}`));
      for (const line of propose) blocks.push(B(`Propose: ${line}`));
      for (const line of block)   blocks.push(B(`Block/Flag: ${line}`));
    } else {
      blocks.push(P('[Complete during role review - define Decide / Propose / Block authorities.]'));
    }

    // ── ARC Integration ──
    blocks.push(H('ARC Integration'));
    blocks.push(P(`Awareness: ${typeof g.arc_awareness === 'string' && g.arc_awareness ? g.arc_awareness : '[Complete during role review - what quality of attention does this role require?]'}`));
    blocks.push(P(`Reciprocity: ${typeof g.arc_reciprocity === 'string' && g.arc_reciprocity ? g.arc_reciprocity : '[Complete during role review - what does this role give and receive?]'}`));
    blocks.push(P(`Choice: ${typeof g.arc_choice === 'string' && g.arc_choice ? g.arc_choice : '[Complete during role review - what choices does this role hold and how are they exercised consciously?]'}`));

    // ── KPIs ──
    const kpis = Array.isArray(g.kpis) ? g.kpis as string[] : [];
    blocks.push(H('KPIs / Success Indicators'));
    if (kpis.length > 0) {
      for (const line of kpis) blocks.push(B(String(line)));
    } else {
      blocks.push(P('[Complete during role review - list 4-6 measurable success indicators.]'));
    }

    // ── Time Commitment ──
    blocks.push(H('Time Commitment'));
    blocks.push(P(typeof g.time_commitment === 'string' && g.time_commitment
      ? g.time_commitment
      : '[Complete during role review - weekly hours and rhythm.]'));

    // ── Energy & Sustainability Check ──
    blocks.push(H('Energy & Sustainability Check'));
    blocks.push(P(typeof g.energy_check === 'string' && g.energy_check
      ? g.energy_check
      : '[Complete during role review - describe sustainability practices and burnout risks specific to this role.]'));

    // ── Tools & Resources ──
    const tools = Array.isArray(g.tools) ? g.tools as string[] : [];
    blocks.push(H('Tools & Resources'));
    if (tools.length > 0) {
      for (const line of tools) blocks.push(B(String(line)));
    } else {
      blocks.push(P('[Complete during role review - list tools and resources used in this role.]'));
    }

    // ── Conflict Resolution ──
    blocks.push(H('Conflict Resolution'));
    blocks.push(P(typeof g.conflict_resolution === 'string' && g.conflict_resolution
      ? g.conflict_resolution
      : '[Complete during role review - how tensions in this role are handled using CCOS process.]'));

    // ── Feedback & Development ──
    blocks.push(H('Feedback & Development'));
    blocks.push(P(typeof g.feedback === 'string' && g.feedback
      ? g.feedback
      : '[Complete during role review - peer feedback cadence and professional development support.]'));

    // ── Review & Adaptation ──
    blocks.push(H('Review & Adaptation'));
    blocks.push(P(typeof g.review_adaptation === 'string' && g.review_adaptation
      ? g.review_adaptation
      : 'Annual role review by consent. Role card updated in Saberra after each review. Mid-year check-in at 6 months.'));

    // ── Succession or Dissolution ──
    blocks.push(H('Succession or Dissolution'));
    blocks.push(P(typeof g.succession === 'string' && g.succession
      ? g.succession
      : 'Minimum 2-week overlap for handover. All credentials, documentation, and active responsibilities transferred before departure is confirmed.'));

    // ── Core Values Alignment ──
    blocks.push(H('Core Values Alignment'));
    blocks.push(P('Wholeness | Self-Management | Evolutionary Purpose | Regenerativity | Transparency'));

    // ── Policy & Legal Compliance ──
    blocks.push(H('Policy & Legal Compliance'));
    blocks.push(P(typeof g.policy_legal_compliance === 'string' && g.policy_legal_compliance
      ? g.policy_legal_compliance
      : 'All activities must comply with applicable laws, community governance agreements, and relevant data privacy obligations.'));

    // Notion API max 100 blocks per append; our template is ~35 blocks - well within limit
    await this.withRetry(() =>
      this.client.blocks.children.append({ block_id: pageId, children: blocks }),
    );
  }

  /** Appends a structured circle charter template body to a newly created Circle page. */
  async appendCircleCharterBlocks(pageId: string, circle: {
    circle_name: string;
    purpose?: string | null;
    accountabilities?: string | null;
    domains?: string | null;
    kpis?: string | null;
    meeting_cadence?: string | null;
  }): Promise<void> {
    const H = NotionWriterService.heading3;
    const P = NotionWriterService.para;
    const B = NotionWriterService.bullet;
    const split = NotionWriterService.splitLines;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any[] = [];

    blocks.push(H('Circle Identity'));
    blocks.push(P(`Circle Name: ${circle.circle_name}  |  Status: Active  |  Meeting Cadence: ${circle.meeting_cadence ?? 'Weekly'}  |  Review Cadence: Quarterly`));

    if (circle.purpose) { blocks.push(H('Purpose')); blocks.push(P(circle.purpose)); }

    if (circle.accountabilities) {
      blocks.push(H('Accountabilities'));
      for (const line of split(circle.accountabilities)) blocks.push(B(line));
    }

    if (circle.domains) {
      blocks.push(H('Domains'));
      for (const line of split(circle.domains)) blocks.push(B(line));
    }

    if (circle.kpis) {
      blocks.push(H('KPIs / Success Indicators'));
      for (const line of split(circle.kpis)) blocks.push(B(line));
    }

    blocks.push(H('Wholeness Practices'));
    blocks.push(P('[Complete during charter review - describe how this circle creates conditions for members to bring their whole selves to the work.]'));

    blocks.push(H('Checks & Balances'));
    blocks.push(P('All circle decisions are documented in Saberra. Canon-level decisions require cross-circle consent. The Rep Steward carries tensions upward to the parent circle.'));

    blocks.push(H('Living Agreement'));
    blocks.push(P('This charter is a living document. It is reviewed quarterly and updated by circle consent. All changes are recorded in Saberra.'));

    blocks.push(H('Review & Adaptation'));
    blocks.push(P('[Complete during charter review - describe the review cadence, what triggers adaptation, and what happens if the circle is no longer needed.]'));

    await this.withRetry(() =>
      this.client.blocks.children.append({ block_id: pageId, children: blocks }),
    );
  }

  // ─── Entity body appenders ────────────────────────────────────────────────
  // Called after createPage for the entity types that benefit from readable body content.
  // Each method is a no-op when there is nothing meaningful to write.
  // Failures are non-fatal — the caller wraps these in try/catch.

  async appendTaskBody(pageId: string, task: { source_evidence?: string | null }): Promise<void> {
    if (!task.source_evidence?.trim()) return;
    const blocks: any[] = [
      NotionWriterService.heading3('Source Evidence'),
      NotionWriterService.para(task.source_evidence),
    ];
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  async appendDecisionBody(pageId: string, decision: {
    source_evidence?: string | null;
    purpose_alignment?: string | null;
    purpose_alignment_notes?: string | null;
  }): Promise<void> {
    const blocks: any[] = [];
    if (decision.source_evidence?.trim()) {
      blocks.push(NotionWriterService.heading3('Source Evidence'));
      blocks.push(NotionWriterService.para(decision.source_evidence));
    }
    if (decision.purpose_alignment) {
      blocks.push(NotionWriterService.heading3('Purpose Alignment'));
      const note = decision.purpose_alignment_notes?.trim();
      blocks.push(NotionWriterService.para(note
        ? `${decision.purpose_alignment} - ${note}`
        : decision.purpose_alignment,
      ));
    }
    if (blocks.length === 0) return;
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  async appendRiskBody(pageId: string, risk: {
    source_evidence?: string | null;
    suggested_mitigation?: string | null;
  }): Promise<void> {
    const blocks: any[] = [];
    if (risk.source_evidence?.trim()) {
      blocks.push(NotionWriterService.heading3('Evidence'));
      blocks.push(NotionWriterService.para(risk.source_evidence));
    }
    if (risk.suggested_mitigation?.trim()) {
      blocks.push(NotionWriterService.heading3('Suggested Mitigation'));
      for (const line of NotionWriterService.splitLines(risk.suggested_mitigation)) {
        blocks.push(NotionWriterService.bullet(line));
      }
    }
    if (blocks.length === 0) return;
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  async appendMRQBody(pageId: string, item: {
    proposed_memory?: string | null;
    source_evidence?: string | null;
    risk_if_added?: string | null;
    risk_if_ignored?: string | null;
    suggested_destination?: string | null;
  }): Promise<void> {
    const blocks: any[] = [];
    if (item.proposed_memory?.trim()) {
      blocks.push(NotionWriterService.heading3('Proposed Memory'));
      blocks.push(NotionWriterService.para(item.proposed_memory));
    }
    if (item.source_evidence?.trim()) {
      blocks.push(NotionWriterService.heading3('Source Evidence'));
      blocks.push(NotionWriterService.para(item.source_evidence));
    }
    if (item.risk_if_added?.trim()) {
      blocks.push(NotionWriterService.heading3('Risk If Added'));
      blocks.push(NotionWriterService.para(item.risk_if_added));
    }
    if (item.risk_if_ignored?.trim()) {
      blocks.push(NotionWriterService.heading3('Risk If Ignored'));
      blocks.push(NotionWriterService.para(item.risk_if_ignored));
    }
    if (item.suggested_destination?.trim()) {
      blocks.push(NotionWriterService.heading3('Suggested Destination'));
      blocks.push(NotionWriterService.para(item.suggested_destination));
    }
    if (blocks.length === 0) return;
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  async appendKBBody(pageId: string, article: {
    summary?: string | null;
    key_points?: string | null;
  }): Promise<void> {
    const blocks: any[] = [];
    if (article.summary?.trim()) {
      blocks.push(NotionWriterService.heading3('Summary'));
      blocks.push(NotionWriterService.para(article.summary));
    }
    if (article.key_points?.trim()) {
      blocks.push(NotionWriterService.heading3('Key Points'));
      for (const line of NotionWriterService.splitLines(article.key_points)) {
        blocks.push(NotionWriterService.bullet(line));
      }
    }
    if (blocks.length === 0) return;
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  // ─── Tension + Commitment page body appenders ────────────────────────────

  async appendTensionBody(pageId: string, tension: {
    tension?: string | null;
    source_evidence?: string | null;
  }): Promise<void> {
    const blocks: any[] = [];
    if (tension.tension?.trim()) {
      blocks.push(NotionWriterService.heading3('Tension Statement'));
      blocks.push(NotionWriterService.para(tension.tension));
    }
    if (tension.source_evidence?.trim()) {
      blocks.push(NotionWriterService.heading3('Source Evidence'));
      blocks.push(NotionWriterService.para(tension.source_evidence));
    }
    if (blocks.length === 0) return;
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  async appendCommitmentBody(pageId: string, commitment: {
    terms?: string | null;
    source_evidence?: string | null;
  }): Promise<void> {
    const blocks: any[] = [];
    if (commitment.terms?.trim()) {
      blocks.push(NotionWriterService.heading3('Terms'));
      blocks.push(NotionWriterService.para(commitment.terms));
    }
    if (commitment.source_evidence?.trim()) {
      blocks.push(NotionWriterService.heading3('Source Evidence'));
      blocks.push(NotionWriterService.para(commitment.source_evidence));
    }
    if (blocks.length === 0) return;
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  async appendRetrospectiveBody(pageId: string, retro: {
    what_worked?: string | null;
    what_didnt_work?: string | null;
    what_to_change?: string | null;
    celebrations?: string | null;
    source_evidence?: string | null;
  }): Promise<void> {
    const blocks: any[] = [];
    if (retro.what_worked?.trim()) {
      blocks.push(NotionWriterService.heading3('What Worked'));
      blocks.push(NotionWriterService.para(retro.what_worked));
    }
    if (retro.what_didnt_work?.trim()) {
      blocks.push(NotionWriterService.heading3('What Didn\'t Work'));
      blocks.push(NotionWriterService.para(retro.what_didnt_work));
    }
    if (retro.what_to_change?.trim()) {
      blocks.push(NotionWriterService.heading3('What to Change'));
      for (const line of NotionWriterService.splitLines(retro.what_to_change)) {
        blocks.push(NotionWriterService.bullet(line));
      }
    }
    if (retro.celebrations?.trim()) {
      blocks.push(NotionWriterService.heading3('Celebrations'));
      blocks.push(NotionWriterService.para(retro.celebrations));
    }
    if (retro.source_evidence?.trim()) {
      blocks.push(NotionWriterService.heading3('Source Evidence'));
      blocks.push(NotionWriterService.para(retro.source_evidence));
    }
    if (blocks.length === 0) return;
    await this.withRetry(() => this.client.blocks.children.append({ block_id: pageId, children: blocks }));
  }

  // ─── Retry wrapper ────────────────────────────────────────────────────────

  /** Wraps a Notion API call with one retry on rate-limit (429). */
  async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof APIResponseError && err.code === APIErrorCode.RateLimited) {
        logger.warn('Notion rate limit hit — waiting 2s before retry');
        await new Promise((r) => setTimeout(r, 2000));
        return fn();
      }
      throw err;
    }
  }
}
