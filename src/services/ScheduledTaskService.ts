import Anthropic from '@anthropic-ai/sdk';
import { NotionWriterService } from './NotionWriterService';
import { SmtpService } from './SmtpService';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';

const N = NotionWriterService;

interface TaskDef {
  name: string;
  intervalMs: number; // 0 = run every cycle
  run: () => Promise<void>;
}

export class ScheduledTaskService {
  private readonly notion: NotionWriterService;
  private readonly smtp: SmtpService;
  private readonly adminEmail: string;
  private readonly tenantId: string;
  private readonly claude: Anthropic;
  private readonly claudeModel: string;
  private readonly tasks: TaskDef[];

  constructor(notion: NotionWriterService, smtp: SmtpService, adminEmail: string) {
    this.notion = notion;
    this.smtp = smtp;
    this.adminEmail = adminEmail;
    const cfg = getConfig();
    this.tenantId = cfg.TENANT_ID;
    this.claude = new Anthropic({ apiKey: cfg.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 60_000 });
    this.claudeModel = cfg.CLAUDE_MODEL;

    this.tasks = [
      {
        name: 'heartbeat',
        intervalMs: 0,
        run: () => this.writeHeartbeat(),
      },
      {
        name: 'overdue-tasks',
        intervalMs: 7 * 24 * 60 * 60 * 1000, // weekly - daily/20h was generating 7 emails/week per task
        run: () => this.alertOverdueTasks(),
      },
      {
        name: 'stuck-meetings',
        intervalMs: 7 * 24 * 60 * 60 * 1000, // weekly
        run: () => this.escalateStuckMeetings(),
      },
      {
        name: 'review-sla',
        intervalMs: 7 * 24 * 60 * 60 * 1000, // weekly
        run: () => this.alertOverdueReviews(),
      },
      // weekly-digest removed: merged into weekly-pulse (which also has Claude synthesis)
      {
        name: 'weekly-circle-digest',
        intervalMs: 7 * 24 * 60 * 60 * 1000,
        run: () => this.sendCircleDigests(),
      },
      {
        name: 'cleanup-processing-events',
        intervalMs: 24 * 60 * 60 * 1000,
        run: () => this.cleanupProcessingEvents(),
      },
      {
        name: 'stale-queue-sweep',
        intervalMs: 24 * 60 * 60 * 1000,
        run: () => this.sweepStaleQueueItems(),
      },
      {
        name: 'weekly-pulse',
        intervalMs: 7 * 24 * 60 * 60 * 1000,
        run: () => this.sendWeeklyPulse(),
      },
    ];
  }

  async runDue(): Promise<void> {
    for (const task of this.tasks) {
      try {
        const due = task.intervalMs === 0 || (await this.isDue(task.name, task.intervalMs));
        if (!due) continue;
        logger.debug({ task: task.name }, 'Running scheduled task');
        // Record BEFORE executing: if the task crashes mid-way (e.g. after sending some digest
        // emails), recording afterwards would never happen and the task would re-run in 3 min,
        // potentially sending duplicate emails to recipients already reached before the crash.
        if (task.intervalMs > 0) await this.recordRun(task.name);
        try {
          await task.run();
        } catch (err) {
          logger.error({ err, task: task.name }, 'Scheduled task failed');
        }
      } catch (err) {
        logger.error({ err, task: task.name }, 'Scheduled task setup failed');
      }
    }
  }

  // ─── Durable schedule state ───────────────────────────────────────────────

  /**
   * Returns true if no successful run of taskName exists within the last intervalMs milliseconds.
   * Uses created_time timestamp filter so no sort is needed — presence of a recent record = ran recently.
   */
  private async isDue(taskName: string, intervalMs: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - intervalMs).toISOString();
    try {
      const results = await this.notion.queryDatabase(
        this.notion.dbIds.processingEvents,
        {
          and: [
            { property: 'Event Type', select: { equals: 'Scheduled Task' } },
            { property: 'Tenant ID',  rich_text: { equals: this.tenantId } },
            { property: 'Details',    rich_text: { contains: `sched:${taskName}` } },
            { timestamp: 'created_time', created_time: { after: cutoff } } as any,
          ],
        } as any,
        1,
      );
      return results.length === 0;
    } catch {
      return true;
    }
  }

  private async recordRun(taskName: string): Promise<void> {
    const now = new Date().toISOString();
    try {
      await this.notion.createPage(this.notion.dbIds.processingEvents, {
        Event:         N.title(`Scheduled Task — ${taskName}`),
        'Tenant ID':   N.richText(this.tenantId),
        'Event Type':  N.select('Scheduled Task'),
        Service:       N.select('Worker'),
        Status:        N.select('Success'),
        Timestamp:     N.date(now),
        Details:       N.richText(`sched:${taskName}`),
      });
    } catch (err) {
      logger.warn({ err, taskName }, 'Failed to record scheduled task run — will re-run next cycle');
    }
  }

  // ─── Heartbeat ────────────────────────────────────────────────────────────

  private async writeHeartbeat(): Promise<void> {
    const now = new Date().toISOString();
    await this.notion.createPage(this.notion.dbIds.processingEvents, {
      Event:        N.title('Heartbeat'),
      'Tenant ID':  N.richText(this.tenantId),
      'Event Type': N.select('Heartbeat'),
      Service:      N.select('Worker'),
      Status:       N.select('Info'),
      Timestamp:    N.date(now),
    });
  }

  // ─── Overdue task alerts ──────────────────────────────────────────────────

  private async alertOverdueTasks(): Promise<void> {
    // 3-day grace period: don't nudge for tasks that became past-due yesterday.
    // Life shifts; a same-day or next-day nudge feels like surveillance, not support.
    const graceCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const results = await this.notion.queryDatabase(
      this.notion.dbIds.tasks,
      {
        and: [
          { property: 'Due Date', date: { before: graceCutoff } },
          { property: 'Status',   select: { does_not_equal: 'Done' } },
          { property: 'Status',   select: { does_not_equal: 'Cancelled' } },
        ],
      } as any,
      50,
    );
    if (!results.length) return;

    const client = (this.notion as any).client as import('@notionhq/client').Client;

    // Collect all unique profile IDs up front, then fetch in parallel
    type TaskRow = { name: string; due: string; status: string };
    const taskRows: Array<{ row: TaskRow; ownerIds: string[] }> = [];
    const allProfileIds = new Set<string>();

    for (const r of results) {
      const p = r.properties as any;
      const name   = p.Task?.title?.[0]?.plain_text ?? '?';
      const due    = p['Due Date']?.date?.start ?? 'unknown';
      const status = p.Status?.select?.name ?? '?';
      const ownerIds: string[] = (p.Owner?.relation ?? []).map((x: any) => x.id as string);
      taskRows.push({ row: { name, due, status }, ownerIds });
      ownerIds.forEach(id => allProfileIds.add(id));
    }

    // Parallel profile fetch — one API call per unique profile ID
    const profileCache = new Map<string, { name: string; email: string | null }>();
    await Promise.all([...allProfileIds].map(async (profileId) => {
      try {
        const profilePage = await client.pages.retrieve({ page_id: profileId });
        const pp = 'properties' in profilePage ? profilePage.properties as any : {};
        const email: string | null = pp.Email?.email ?? null;
        const name: string = pp.Name?.title?.[0]?.plain_text ?? profileId;
        profileCache.set(profileId, { name, email });
      } catch {
        profileCache.set(profileId, { name: profileId, email: null });
      }
    }));

    // Group tasks by owner email
    const byOwnerEmail = new Map<string, { ownerName: string; tasks: TaskRow[] }>();
    const unowned: TaskRow[] = [];

    for (const { row, ownerIds } of taskRows) {
      if (!ownerIds.length) { unowned.push(row); continue; }
      let assigned = false;
      for (const profileId of ownerIds) {
        const profile = profileCache.get(profileId);
        if (!profile?.email) continue;
        if (!byOwnerEmail.has(profile.email)) byOwnerEmail.set(profile.email, { ownerName: profile.name, tasks: [] });
        byOwnerEmail.get(profile.email)!.tasks.push(row);
        assigned = true;
      }
      if (!assigned) unowned.push(row);
    }

    // Per-owner gentle nudge emails (trauma-informed: no shame framing, empowering options)
    for (const [email, { ownerName, tasks }] of byOwnerEmail) {
      const lines = tasks.map(t => `  * "${t.name}" - was due ${t.due}`);
      const subject = `[Amora] A few things in your Notion queue`;
      const body = [
        `Hi ${ownerName},`,
        '',
        `This is a gentle heads-up from Sera. I noticed ${tasks.length} item${tasks.length !== 1 ? 's' : ''} in your task queue with dates that have passed. I am sharing this in case any of them need a nudge, more time, or a different home.`,
        '',
        ...lines,
        '',
        'A few ways to respond to any of these:',
        '  - Move it forward: update the due date if life or priorities shifted',
        '  - Close it out: mark Done or Cancelled if it is complete or no longer needed',
        '  - Pass it on: reassign if someone else is better placed',
        '  - Let it rest: no action needed if it is already handled outside Notion',
        '',
        'You know your work better than I do - this is just what I can see.',
        '',
        'With care,',
        'Sera, Amora Living Memory',
      ].join('\n');
      try {
        await this.smtp.sendEmail(email, subject, body);
      } catch (err) {
        logger.warn({ err, email, ownerName }, 'Failed to send task queue nudge to owner');
      }
    }

    // Admin summary - factual, not alarmist
    const total = results.length;
    const adminLines: string[] = [];
    for (const [, { ownerName, tasks }] of byOwnerEmail) {
      adminLines.push(`${ownerName} (${tasks.length} item${tasks.length !== 1 ? 's' : ''}):`);
      tasks.forEach(t => adminLines.push(`  * [${t.status}] "${t.name}" - due ${t.due}`));
      adminLines.push('');
    }
    if (unowned.length) {
      adminLines.push(`No owner assigned (${unowned.length}):`);
      unowned.forEach(t => adminLines.push(`  * [${t.status}] "${t.name}" - due ${t.due}`));
      adminLines.push('');
    }

    const subject = `[Amora] Task queue nudge sent to ${byOwnerEmail.size} member${byOwnerEmail.size !== 1 ? 's' : ''}`;
    const body = [
      `Sera sent a gentle task queue nudge to ${byOwnerEmail.size} member${byOwnerEmail.size !== 1 ? 's' : ''} covering ${total} item${total !== 1 ? 's' : ''} with dates that have passed (${unowned.length} with no owner assigned).`,
      '',
      ...adminLines,
      'Items with no owner may need attention in Notion.',
    ].join('\n');

    await this.smtp.sendEmail(this.adminEmail, subject, body);
    logger.info({ count: total, owners: byOwnerEmail.size, unowned: unowned.length }, 'Task queue nudge sent');
  }

  // ─── Stuck meeting escalation ─────────────────────────────────────────────

  private async escalateStuckMeetings(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const results = await this.notion.queryDatabase(
      this.notion.dbIds.meetings,
      {
        and: [
          { property: 'Processing Status', select: { equals: 'Partial' } },
          { timestamp: 'created_time', created_time: { before: cutoff } } as any,
        ],
      } as any,
      20,
    );
    if (!results.length) return;

    await Promise.all(
      results.map((r) =>
        this.notion.updatePage(r.id, {
          'Processing Status': N.select('Manual Review'),
          'Automation Log':    N.richText('Escalated by scheduler: stuck in Partial status for >7 days. Likely missing transcript/notes Drive access.'),
        }),
      ),
    );

    const names = results.map((r) => {
      const p = r.properties as any;
      return p['Meeting Title']?.title?.[0]?.plain_text ?? r.id;
    });

    const subject = `[Amora] ${results.length} stuck meeting${results.length !== 1 ? 's' : ''} escalated to Manual Review`;
    const body = [
      `${results.length} meeting${results.length !== 1 ? 's have' : ' has'} been in Partial status for >7 days and escalated to Manual Review:`,
      '',
      ...names.map((n) => `  • ${n}`),
      '',
      'These likely need manual Drive permission grants. Check Meeting Assets in Notion.',
    ].join('\n');

    await this.smtp.sendEmail(this.adminEmail, subject, body);
    logger.info({ count: results.length }, 'Stuck meetings escalated');
  }

  // ─── Review SLA alerts ────────────────────────────────────────────────────

  private async alertOverdueReviews(): Promise<void> {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const tsFilter = { timestamp: 'created_time', created_time: { before: cutoff } } as any;

    const [canonChanges, memoryQueue, ledgerEntries] = await Promise.all([
      this.notion.queryDatabase(
        this.notion.dbIds.canonChangeRequests,
        { and: [{ property: 'Status', select: { equals: 'Pending Review' } }, tsFilter] } as any,
        20,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.memoryReviewQueue,
        { and: [{ property: 'Status', select: { equals: 'Pending Review' } }, tsFilter] } as any,
        20,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.ccosLedgerEntries,
        { and: [{ property: 'Status', select: { equals: 'Draft' } }, tsFilter] } as any,
        20,
      ),
    ]);

    const total = canonChanges.length + memoryQueue.length + ledgerEntries.length;
    if (total === 0) return;

    const lines: string[] = [];
    if (canonChanges.length) {
      lines.push(`Canon Change Requests pending >14 days (${canonChanges.length}):`);
      canonChanges.forEach((r) => {
        const p = r.properties as any;
        lines.push(`  • ${p['Proposed Change']?.title?.[0]?.plain_text ?? r.id}`);
      });
      lines.push('');
    }
    if (memoryQueue.length) {
      lines.push(`Memory Review Queue items pending >14 days (${memoryQueue.length}):`);
      memoryQueue.forEach((r) => {
        const p = r.properties as any;
        lines.push(`  • ${p['Proposed Memory']?.title?.[0]?.plain_text ?? r.id}`);
      });
      lines.push('');
    }
    if (ledgerEntries.length) {
      lines.push(`CCOS Ledger Entries in Draft >14 days (${ledgerEntries.length}):`);
      ledgerEntries.forEach((r) => {
        const p = r.properties as any;
        lines.push(`  • ${p['Ledger Entry']?.title?.[0]?.plain_text ?? r.id}`);
      });
      lines.push('');
    }

    const subject = `[Amora] ${total} review item${total !== 1 ? 's' : ''} overdue in Notion`;
    const body = [
      `${total} item${total !== 1 ? 's have' : ' has'} been awaiting review for more than 14 days:`,
      '',
      ...lines,
      'Review these items in Notion to keep governance records current.',
    ].join('\n');

    await this.smtp.sendEmail(this.adminEmail, subject, body);
    logger.info({ total, canonChanges: canonChanges.length, memoryQueue: memoryQueue.length, ledgerEntries: ledgerEntries.length }, 'Review SLA alert sent');
  }

  // ─── Weekly digest ────────────────────────────────────────────────────────

  private async sendWeeklyDigest(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const tsFilter = { timestamp: 'created_time', created_time: { after: cutoff } } as any;
    const sinceFilter = { and: [tsFilter] } as any;

    const [emails, tasks, decisions, risks, meetings, collapseSignalsWeek, urgentQueue] = await Promise.all([
      this.notion.queryDatabase(this.notion.dbIds.sourceEmails,       sinceFilter, 100),
      this.notion.queryDatabase(this.notion.dbIds.tasks,              sinceFilter,  50),
      this.notion.queryDatabase(this.notion.dbIds.decisionCandidates, sinceFilter,  30),
      this.notion.queryDatabase(this.notion.dbIds.risks,              sinceFilter,  30),
      this.notion.queryDatabase(this.notion.dbIds.meetings,           sinceFilter,  20),
      this.notion.queryDatabase(
        this.notion.dbIds.risks,
        { and: [{ property: 'Category', select: { equals: 'Collapse Pattern' } }, { property: 'Status', select: { equals: 'Open' } }, tsFilter] } as any,
        20,
      ),
      // Urgent review queue items (all time, not just this week)
      this.notion.queryDatabase(
        this.notion.dbIds.memoryReviewQueue,
        { and: [{ property: 'Priority', select: { equals: 'Urgent' } }, { property: 'Status', select: { equals: 'Pending Review' } }] } as any,
        20,
      ),
    ]);

    const today   = new Date().toISOString().slice(0, 10);
    const weekAgo = cutoff.slice(0, 10);

    const openTasks = tasks.filter((r) => {
      const s = (r.properties as any).Status?.select?.name;
      return s !== 'Done' && s !== 'Cancelled';
    });

    const lines: string[] = [
      `Weekly Amora Living Memory Hub digest (${weekAgo} to ${today}):`,
      '',
      `  Emails ingested:        ${emails.length}`,
      `  Meetings processed:     ${meetings.length}`,
      `  Tasks created:          ${tasks.length}  (${openTasks.length} still open)`,
      `  Decisions/candidates:   ${decisions.length}`,
      `  Risks flagged:          ${risks.length}`,
      `  Collapse signals (new): ${collapseSignalsWeek.length}`,
      '',
    ];

    if (urgentQueue.length) {
      lines.push(`URGENT: ${urgentQueue.length} memory item${urgentQueue.length !== 1 ? 's need' : ' needs'} your attention:`);
      urgentQueue.slice(0, 8).forEach((r) => {
        const p = r.properties as any;
        const text = p['Proposed Memory']?.title?.[0]?.plain_text ?? '?';
        const cat  = p.Category?.select?.name ?? '?';
        lines.push(`  • [${cat}] ${text}`);
      });
      if (urgentQueue.length > 8) lines.push(`  … and ${urgentQueue.length - 8} more`);
      lines.push('');
    }

    if (decisions.length) {
      lines.push('New decisions/candidates:');
      decisions.slice(0, 8).forEach((r) => {
        const p = r.properties as any;
        const text   = p.Decision?.title?.[0]?.plain_text ?? '?';
        const status = p.Status?.select?.name ?? '?';
        const conf   = p['Extraction Confidence']?.select?.name;
        lines.push(`  • [${status}${conf && conf !== 'High' ? ` / ${conf} confidence` : ''}] ${text}`);
      });
      if (decisions.length > 8) lines.push(`  … and ${decisions.length - 8} more`);
      lines.push('');
    }

    if (risks.length) {
      lines.push('Risks flagged this week:');
      risks.slice(0, 8).forEach((r) => {
        const p = r.properties as any;
        const text = p.Risk?.title?.[0]?.plain_text ?? '?';
        const sev  = p.Severity?.select?.name ?? '?';
        lines.push(`  • [${sev}] ${text}`);
      });
      if (risks.length > 8) lines.push(`  … and ${risks.length - 8} more`);
      lines.push('');
    }

    if (collapseSignalsWeek.length) {
      lines.push('New collapse pattern signals this week:');
      collapseSignalsWeek.slice(0, 8).forEach((r) => {
        const p = r.properties as any;
        lines.push(`  [${p.Severity?.select?.name ?? '?'}] ${p.Risk?.title?.[0]?.plain_text ?? '?'}`);
      });
      if (collapseSignalsWeek.length > 8) lines.push(`  ... and ${collapseSignalsWeek.length - 8} more`);
      lines.push('');
    }

    lines.push('Review new items in Notion to keep institutional memory current.');

    const subject = urgentQueue.length
      ? `[Amora] Weekly digest - ${weekAgo} to ${today} (${urgentQueue.length} URGENT)`
      : `[Amora] Weekly digest - ${weekAgo} to ${today}`;
    await this.smtp.sendEmail(this.adminEmail, subject, lines.join('\n'));
    logger.info({ emails: emails.length, tasks: tasks.length, decisions: decisions.length, risks: risks.length, meetings: meetings.length, collapseSignals: collapseSignalsWeek.length, urgentQueue: urgentQueue.length }, 'Weekly digest sent');
  }

  // ─── Per-circle weekly digest ─────────────────────────────────────────────

  private async sendCircleDigests(): Promise<void> {
    const circles = await this.notion.queryDatabase(
      this.notion.dbIds.circles,
      { property: 'Status', select: { equals: 'Active' } } as any,
      20,
    );

    const today   = new Date().toISOString().slice(0, 10);
    const cutoff  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let sent = 0;

    const client = (this.notion as any).client as import('@notionhq/client').Client;

    for (const circle of circles) {
      const p = circle.properties as any;
      const circleName = p['Circle Name']?.title?.[0]?.plain_text ?? 'Your Circle';

      const leadIds: string[] = (p['Circle Lead']?.relation ?? []).map((r: any) => r.id as string);
      if (!leadIds.length) continue;

      const leadEmails: string[] = [];
      for (const profileId of leadIds) {
        try {
          const profilePage = await client.pages.retrieve({ page_id: profileId });
          const props = 'properties' in profilePage ? profilePage.properties as any : {};
          const email: string | null = props.Email?.email ?? null;
          if (email) {
            leadEmails.push(email);
          } else {
            const name = props.Name?.title?.[0]?.plain_text ?? profileId;
            logger.warn({ circleName, profileId, name }, 'Circle lead has no email — skipping for digest');
          }
        } catch {
          // Profile not reachable — skip
        }
      }

      if (!leadEmails.length) {
        logger.warn({ circleName }, 'No lead emails found for circle — digest skipped');
        continue;
      }

      const circleFilter = { property: 'Circle', relation: { contains: circle.id } } as any;

      const [openTasks, pendingDecisions, openRisks] = await Promise.all([
        this.notion.queryDatabase(
          this.notion.dbIds.tasks,
          {
            and: [
              circleFilter,
              { property: 'Status', select: { does_not_equal: 'Done' } },
              { property: 'Status', select: { does_not_equal: 'Cancelled' } },
            ],
          } as any,
          30,
        ),
        this.notion.queryDatabase(
          this.notion.dbIds.decisionCandidates,
          { and: [circleFilter, { or: [
            { property: 'Status', select: { equals: 'Candidate' } },
            { property: 'Status', select: { equals: 'Needs Clarification' } },
          ]}] } as any,
          20,
        ),
        this.notion.queryDatabase(
          this.notion.dbIds.risks,
          { and: [circleFilter, { property: 'Status', select: { equals: 'Open' } }] } as any,
          20,
        ),
      ]);

      const highPrioTasks  = openTasks.filter(r => (r.properties as any).Priority?.select?.name === 'High');
      const pastDueTasks   = openTasks.filter(r => {
        const due = (r.properties as any)['Due Date']?.date?.start;
        return due && due < today;
      });
      const highRisks      = openRisks.filter(r => (r.properties as any).Severity?.select?.name === 'High');

      const lines: string[] = [
        `Hi ${circleName} - here is what is alive in your circle this week (${cutoff} to ${today}):`,
        '',
        `  Tasks in motion:     ${openTasks.length}  (${highPrioTasks.length} high priority, ${pastDueTasks.length} past their date)`,
        `  Decisions to hold:   ${pendingDecisions.length}`,
        `  Open tensions/risks: ${openRisks.length}  (${highRisks.length} high severity)`,
        '',
      ];

      if (highPrioTasks.length) {
        lines.push('High-priority tasks:');
        highPrioTasks.slice(0, 8).forEach(r => {
          const tp = r.properties as any;
          const name = tp.Task?.title?.[0]?.plain_text ?? '?';
          const due  = tp['Due Date']?.date?.start ?? 'no due date';
          lines.push(`  * "${name}" - due ${due}`);
        });
        if (highPrioTasks.length > 8) lines.push(`  ... and ${highPrioTasks.length - 8} more`);
        lines.push('');
      }

      if (pendingDecisions.length) {
        lines.push('Decisions awaiting consent:');
        pendingDecisions.slice(0, 5).forEach(r => {
          const dp = r.properties as any;
          const text   = dp.Decision?.title?.[0]?.plain_text ?? '?';
          const status = dp.Status?.select?.name ?? '?';
          lines.push(`  * [${status}] ${text}`);
        });
        if (pendingDecisions.length > 5) lines.push(`  ... and ${pendingDecisions.length - 5} more`);
        lines.push('');
      }

      if (highRisks.length) {
        lines.push('High-severity open risks:');
        highRisks.slice(0, 5).forEach(r => {
          const rp = r.properties as any;
          lines.push(`  * ${rp.Risk?.title?.[0]?.plain_text ?? '?'}`);
        });
        lines.push('');
      }

      lines.push('Take what is useful here. Forward any updates, new tensions, or decisions to roots@amora.cr and Sera will capture them.');

      const subject = `[${circleName}] Weekly digest - ${cutoff} to ${today}`;
      for (const email of leadEmails) {
        await this.smtp.sendEmail(email, subject, lines.join('\n'));
        sent++;
      }
    }

    logger.info({ sent }, 'Per-circle weekly digests sent');
  }

  // ─── Processing Events cleanup ────────────────────────────────────────────

  private async cleanupProcessingEvents(): Promise<void> {
    const heartbeatCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const otherCutoff     = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [heartbeats, others] = await Promise.all([
      this.notion.queryDatabase(
        this.notion.dbIds.processingEvents,
        {
          and: [
            { property: 'Event Type', select: { equals: 'Heartbeat' } },
            { timestamp: 'created_time', created_time: { before: heartbeatCutoff } } as any,
          ],
        } as any,
        100,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.processingEvents,
        {
          and: [
            { property: 'Event Type', select: { does_not_equal: 'Heartbeat' } },
            { timestamp: 'created_time', created_time: { before: otherCutoff } } as any,
          ],
        } as any,
        100,
      ),
    ]);

    const toArchive = [...heartbeats, ...others];
    if (!toArchive.length) {
      logger.debug('Processing Events cleanup: nothing to archive');
      return;
    }

    await Promise.all(toArchive.map(r => this.notion.archivePage(r.id)));
    logger.info(
      { heartbeats: heartbeats.length, others: others.length, total: toArchive.length },
      'Processing Events cleanup complete',
    );
  }

  // ─── Stale queue and lifecycle sweep ────────────────────────────────────────
  // Memory Review Queue items pending >30 days → Status: Archived (visible, recoverable)
  // Decision Candidates stuck as Candidate >60 days → Lifecycle: Stale
  // Tasks open with no activity >90 days → Lifecycle: Stale
  // Risks open with no activity >90 days → Lifecycle: Stale
  // All thresholds are conservative; items remain visible and recoverable.

  private async sweepStaleQueueItems(): Promise<void> {
    const now             = new Date().toISOString();
    const memoryCutoff    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const decisionCutoff  = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const entityCutoff    = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const tsFilter = (before: string) => ({ timestamp: 'created_time', created_time: { before } } as any);

    const [staleMemory, staleDecisions, staleTasks, staleRisks] = await Promise.all([
      this.notion.queryDatabase(
        this.notion.dbIds.memoryReviewQueue,
        { and: [{ property: 'Status', select: { equals: 'Pending Review' } }, tsFilter(memoryCutoff)] } as any,
        100,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.decisionCandidates,
        { and: [{ property: 'Status', select: { equals: 'Candidate' } }, tsFilter(decisionCutoff)] } as any,
        100,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.tasks,
        {
          and: [
            { property: 'Status', select: { does_not_equal: 'Done' } },
            { property: 'Status', select: { does_not_equal: 'Cancelled' } },
            { property: 'Status', select: { does_not_equal: 'Needs Owner' } },
            tsFilter(entityCutoff),
          ],
        } as any,
        100,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.risks,
        {
          and: [
            { property: 'Status', select: { equals: 'Open' } },
            tsFilter(entityCutoff),
          ],
        } as any,
        100,
      ),
    ]);

    const total = staleMemory.length + staleDecisions.length + staleTasks.length + staleRisks.length;
    if (total === 0) {
      logger.debug('Stale queue sweep: nothing to update');
      return;
    }

    const isAlreadyStale = (r: { properties: Record<string, unknown> }) =>
      (r.properties as any).Lifecycle?.select?.name === 'Stale';

    const toArchiveMrq    = staleMemory.filter(r => (r.properties as any).Status?.select?.name !== 'Archived');
    const toStaleDecisions = staleDecisions.filter(r => !isAlreadyStale(r));
    const toStaleTasks     = staleTasks.filter(r => !isAlreadyStale(r));
    const toStaleRisks     = staleRisks.filter(r => !isAlreadyStale(r));

    const actualTotal = toArchiveMrq.length + toStaleDecisions.length + toStaleTasks.length + toStaleRisks.length;
    if (actualTotal === 0) {
      logger.debug('Stale queue sweep: all found items already processed');
      return;
    }

    await Promise.all([
      // MRQ: set Status = Archived + Archived At (stays visible, user can recover)
      ...toArchiveMrq.map(r => this.notion.updatePage(r.id, {
        Status: N.select('Archived'),
        'Archived At': N.date(now),
      })),
      // Decision Candidates: set Lifecycle = Stale (keeps Status intact for governance history)
      ...toStaleDecisions.map(r => this.notion.updatePage(r.id, {
        Lifecycle: N.select('Stale'),
      })),
      // Tasks: set Lifecycle = Stale
      ...toStaleTasks.map(r => this.notion.updatePage(r.id, {
        Lifecycle: N.select('Stale'),
      })),
      // Risks: set Lifecycle = Stale
      ...toStaleRisks.map(r => this.notion.updatePage(r.id, {
        Lifecycle: N.select('Stale'),
      })),
    ]);

    const parts = [
      toArchiveMrq.length    ? `  Memory candidates (>30 days pending):     ${toArchiveMrq.length} - archived` : '',
      toStaleDecisions.length ? `  Decision candidates (>60 days Candidate): ${toStaleDecisions.length} - marked Stale` : '',
      toStaleTasks.length    ? `  Tasks (>90 days open, no activity):       ${toStaleTasks.length} - marked Stale` : '',
      toStaleRisks.length    ? `  Risks (>90 days open, no activity):       ${toStaleRisks.length} - marked Stale` : '',
    ].filter(Boolean);

    const subject = `[Amora] Lifecycle sweep - ${actualTotal} item${actualTotal !== 1 ? 's' : ''} updated`;
    const body = [
      `Sera updated ${actualTotal} item${actualTotal !== 1 ? 's' : ''} that exceeded their review window:`,
      '',
      ...parts,
      '',
      'Archived memory candidates can be recovered by changing their Status. Stale items remain visible in Notion with Lifecycle = Stale - update them or change their status to remove the flag.',
    ].join('\n');

    await this.smtp.sendEmail(this.adminEmail, subject, body);
    logger.info({ archived: toArchiveMrq.length, staleDecisions: toStaleDecisions.length, staleTasks: toStaleTasks.length, staleRisks: toStaleRisks.length, actualTotal }, 'Lifecycle sweep complete');
  }

  // ─── Weekly organisational pulse (Claude synthesis) ───────────────────────

  private async sendWeeklyPulse(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today  = new Date().toISOString().slice(0, 10);
    const weekAgo = cutoff.slice(0, 10);
    const tsFilter = { timestamp: 'created_time', created_time: { after: cutoff } } as any;

    // Fetch all data in a single parallel round (absorbs the old weekly-digest queries too)
    const [newTasks, newDecisions, newRisks, newMeetings, newRoleAssignments, orgHealthTensions, emails, urgentQueue] = await Promise.all([
      this.notion.queryDatabase(this.notion.dbIds.tasks, { and: [tsFilter] } as any, 50),
      this.notion.queryDatabase(this.notion.dbIds.decisionCandidates, { and: [tsFilter] } as any, 30),
      this.notion.queryDatabase(this.notion.dbIds.risks, { and: [tsFilter] } as any, 30),
      this.notion.queryDatabase(this.notion.dbIds.meetings, { and: [tsFilter] } as any, 20),
      this.notion.queryDatabase(this.notion.dbIds.roleAssignments, { and: [tsFilter] } as any, 20),
      this.notion.queryDatabase(
        this.notion.dbIds.risks,
        { and: [
          { property: 'Category', select: { equals: 'Collapse Pattern' } },
          { property: 'Status',   select: { equals: 'Open' } },
        ] } as any,
        20,
      ),
      this.notion.queryDatabase(this.notion.dbIds.sourceEmails, { and: [tsFilter] } as any, 100),
      this.notion.queryDatabase(
        this.notion.dbIds.memoryReviewQueue,
        { and: [{ property: 'Priority', select: { equals: 'Urgent' } }, { property: 'Status', select: { equals: 'Pending Review' } }] } as any,
        20,
      ),
    ]);

    const [openTasks, pendingReviews] = await Promise.all([
      this.notion.queryDatabase(
        this.notion.dbIds.tasks,
        {
          and: [
            { property: 'Status', select: { does_not_equal: 'Done' } },
            { property: 'Status', select: { does_not_equal: 'Cancelled' } },
          ],
        } as any,
        100,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.memoryReviewQueue,
        { property: 'Status', select: { equals: 'Pending Review' } } as any,
        50,
      ),
    ]);

    // Build structured context for Claude
    const lines: string[] = [
      `AMORA ORGANISATIONAL PULSE - week of ${weekAgo} to ${today}`,
      '',
      '## ACTIVITY THIS WEEK',
      `Emails ingested:         ${emails.length}`,
      `Meetings processed:      ${newMeetings.length}`,
      `Tasks created:           ${newTasks.length}`,
      `Decisions/candidates:    ${newDecisions.length}`,
      `Risks flagged:           ${newRisks.length}`,
      `Role assignment changes: ${newRoleAssignments.length}`,
      '',
    ];

    // URGENT items surface before everything else
    if (urgentQueue.length) {
      lines.push(`URGENT: ${urgentQueue.length} memory item${urgentQueue.length !== 1 ? 's need' : ' needs'} your attention:`);
      urgentQueue.slice(0, 8).forEach((r) => {
        const p = r.properties as any;
        const text = p['Proposed Memory']?.title?.[0]?.plain_text ?? '?';
        const cat  = p.Category?.select?.name ?? '?';
        lines.push(`  * [${cat}] ${text}`);
      });
      if (urgentQueue.length > 8) lines.push(`  ... and ${urgentQueue.length - 8} more`);
      lines.push('');
    }

    if (newDecisions.length) {
      lines.push('DECISIONS THIS WEEK:');
      newDecisions.forEach(r => {
        const p = r.properties as any;
        const status = p.Status?.select?.name ?? '?';
        const conf   = p['Extraction Confidence']?.select?.name;
        lines.push(`  [${status}${conf && conf !== 'High' ? ` / ${conf} confidence` : ''}] ${p.Decision?.title?.[0]?.plain_text ?? '?'}`);
      });
      lines.push('');
    }

    if (newRisks.length) {
      lines.push('RISKS THIS WEEK:');
      newRisks.forEach(r => {
        const p = r.properties as any;
        lines.push(`  [${p.Severity?.select?.name ?? '?'}] ${p.Risk?.title?.[0]?.plain_text ?? '?'} - owner: ${p.Owner?.rich_text?.[0]?.plain_text ?? 'unassigned'}`);
      });
      lines.push('');
    }

    if (newRoleAssignments.length) {
      lines.push('ROLE CHANGES THIS WEEK:');
      newRoleAssignments.forEach(r => {
        const p = r.properties as any;
        lines.push(`  ${p['Assignment Name']?.title?.[0]?.plain_text ?? '?'} - ${p.Status?.select?.name ?? '?'}`);
      });
      lines.push('');
    }

    // Tasks past their due date
    const pastDueAll = openTasks.filter(r => {
      const due = (r.properties as any)['Due Date']?.date?.start;
      return due && due < today;
    });
    const unownedOpen = openTasks.filter(r => {
      const owners: unknown[] = (r.properties as any).Owner?.relation ?? [];
      return owners.length === 0;
    });

    if (orgHealthTensions.length) {
      lines.push('ACTIVE ORGANIZATIONAL TENSIONS:');
      orgHealthTensions.forEach(r => {
        const p = r.properties as any;
        const title = p.Risk?.title?.[0]?.plain_text ?? '?';
        const sev   = p.Severity?.select?.name ?? '?';
        lines.push(`  [${sev}] ${title}`);
      });
      lines.push('');
    }

    lines.push('## CUMULATIVE STATE');
    lines.push(`Total open tasks: ${openTasks.length}  (${pastDueAll.length} past due date, ${unownedOpen.length} no owner)`);
    lines.push(`Memory items awaiting review: ${pendingReviews.length}`);
    lines.push(`Organizational health tensions: ${orgHealthTensions.length}`);
    lines.push('');

    if (pastDueAll.length) {
      lines.push('TASKS PAST DUE DATE (oldest first):');
      pastDueAll
        .sort((a, b) => {
          const da = (a.properties as any)['Due Date']?.date?.start ?? '';
          const db = (b.properties as any)['Due Date']?.date?.start ?? '';
          return da < db ? -1 : 1;
        })
        .slice(0, 15)
        .forEach(r => {
          const p = r.properties as any;
          lines.push(`  [${p.Status?.select?.name ?? '?'}] "${p.Task?.title?.[0]?.plain_text ?? '?'}" - due ${p['Due Date']?.date?.start}`);
        });
      if (pastDueAll.length > 15) lines.push(`  ... and ${pastDueAll.length - 15} more`);
      lines.push('');
    }

    const rawContext = lines.join('\n');

    // Ask Claude for synthesis
    let synthesis = '';
    try {
      const systemPrompt = [
        'You are the organisational intelligence layer for Amora, a teal self-managing organisation.',
        'Your role is to synthesise a week of organisational data into a concise, actionable pulse report.',
        'Focus on: (1) patterns and clustering - are risks/tasks concentrating in one area?',
        '(2) tensions worth holding together - where do decisions conflict with risks or tasks?',
        '(3) governance gaps - roles without holders, tasks without owners, decisions stuck as Candidate;',
        '(4) momentum signals - what is accelerating or stalling?',
        'When writing about organizational health tensions (formerly called collapse patterns), use curious and grounded language.',
        'Name what you observe with care, not alarm. Offer a possible interpretation alongside each observation.',
        'Be direct. Write in plain text. No markdown headers. No em dashes. Use short paragraphs separated by blank lines.',
        'Maximum 350 words. End with 1-3 specific recommended actions for the leadership team this week.',
      ].join(' ');

      const msg = await this.claude.messages.create({
        model: this.claudeModel,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: rawContext }],
      });

      const block = msg.content.find(b => b.type === 'text');
      synthesis = block?.type === 'text' ? block.text.trim() : '';
    } catch (err) {
      logger.warn({ err }, 'Claude synthesis failed for weekly pulse — sending raw data only');
    }

    const subject = urgentQueue.length
      ? `[Amora] Weekly pulse - ${weekAgo} to ${today} (${urgentQueue.length} URGENT)`
      : `[Amora] Weekly pulse - ${weekAgo} to ${today}`;
    const body = synthesis
      ? [
          `AMORA WEEKLY PULSE - ${weekAgo} to ${today}`,
          '='.repeat(50),
          '',
          synthesis,
          '',
          '-'.repeat(50),
          'RAW DATA:',
          '',
          rawContext,
        ].join('\n')
      : rawContext;

    await this.smtp.sendEmail(this.adminEmail, subject, body);
    logger.info(
      { emails: emails.length, meetings: newMeetings.length, tasks: newTasks.length, decisions: newDecisions.length, risks: newRisks.length, urgentQueue: urgentQueue.length, orgHealthTensions: orgHealthTensions.length, hasSynthesis: Boolean(synthesis) },
      'Weekly pulse sent',
    );
  }
}
