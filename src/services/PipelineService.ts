/**
 * PipelineService: orchestrates a single IMAP poll cycle.
 *
 * For each unprocessed email:
 *   1. Classify
 *   2. Create Source Email record in Notion
 *   3. Route to meeting asset pipeline OR operational email pipeline
 *   4. For meeting assets: access check → export → extract → write Notion records
 *   5. For operational: extract from body → write Notion records
 *   6. Run due retries for Needs Access assets
 */

import { ImapIngestionService } from './ImapIngestionService';
import { SmtpService } from './SmtpService';
import { EmailClassifierService } from './EmailClassifierService';
import { MeetAssetParserService } from './MeetAssetParserService';
import { GoogleAccessService } from './GoogleAccessService';
import { GoogleDocsExportService } from './GoogleDocsExportService';
import { GoogleDriveUploadService } from './GoogleDriveUploadService';
import { ClaudeExtractionService } from './ClaudeExtractionService';
import { RetryService } from './RetryService';
import { AccessRequestService } from './AccessRequestService';
import { ReviewRoutingService } from './ReviewRoutingService';
import { NotionWriterService } from './NotionWriterService';
import { ProcessingEventService } from './ProcessingEventService';
import { ScheduledTaskService } from './ScheduledTaskService';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';
import { sanitizeSelect } from '../utils/sanitize';
import type { ParsedEmail, RawAttachment } from '../types';

const N = NotionWriterService;

function parseAddressString(raw: string): Array<{ name: string | null; email: string }> {
  if (!raw?.trim()) return [];
  const results: Array<{ name: string | null; email: string }> = [];
  const re = /([^,<]*?)\s*<([^>]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const email = m[2].trim().toLowerCase();
    const name = m[1].trim().replace(/^["']+|["']+$/g, '') || null;
    if (email.includes('@')) results.push({ name, email });
  }
  return results;
}

// ─── Cycle context ────────────────────────────────────────────────────────────

interface CycleContext {
  existingProjects: string[];
  existingPolicies: string[];
  existingProfiles: string[];
  existingRoles: string[];
  recentContext: string;
  processedInCycle: Set<string>;
}

export class PipelineService {
  private readonly imap: ImapIngestionService;
  private readonly smtp: SmtpService;
  private readonly classifier: EmailClassifierService;
  private readonly meetParser: MeetAssetParserService;
  private readonly access: GoogleAccessService;
  private readonly docsExport: GoogleDocsExportService;
  private readonly driveUpload: GoogleDriveUploadService;
  private readonly claude: ClaudeExtractionService;
  private readonly retry: RetryService;
  private readonly accessRequest: AccessRequestService;
  private readonly review: ReviewRoutingService;
  private readonly notion: NotionWriterService;
  private readonly events: ProcessingEventService;
  private readonly scheduled: ScheduledTaskService;
  private readonly tenantId: string;

  constructor() {
    this.notion = new NotionWriterService();
    this.imap = new ImapIngestionService();
    this.smtp = new SmtpService();
    this.classifier = new EmailClassifierService();
    this.meetParser = new MeetAssetParserService();
    this.access = new GoogleAccessService();
    this.docsExport = new GoogleDocsExportService();
    this.driveUpload = new GoogleDriveUploadService();
    this.claude = new ClaudeExtractionService();
    this.retry = new RetryService();
    this.accessRequest = new AccessRequestService(this.smtp);
    this.review = new ReviewRoutingService(this.smtp);
    this.events = new ProcessingEventService(this.notion);
    this.scheduled = new ScheduledTaskService(this.notion, this.smtp, getConfig().ADMIN_NOTIFICATION_EMAIL);
    this.tenantId = getConfig().TENANT_ID;
  }

  // ─── Startup validation ───────────────────────────────────────────────────

  async validateStartup(): Promise<string[]> {
    return this.notion.validateDatabases();
  }

  // ─── Historical import batch ─────────────────────────────────────────────

  /** Processes a batch of pre-fetched emails through the full pipeline. Used by import-historical script. */
  async runImportBatch(messages: ParsedEmail[]): Promise<void> {
    const [existingProjects, existingPolicies, existingProfiles, existingRoles, recentContext] = await Promise.all([
      this.notion.getAllProjectNames(),
      this.notion.getAllPolicyNames(),
      this.notion.getAllProfileNames(),
      this.notion.getAllRoleNames(),
      this.notion.getRecentExtractionContext(),
    ]);
    const ctx: CycleContext = {
      existingProjects,
      existingPolicies,
      existingProfiles,
      existingRoles,
      recentContext,
      processedInCycle: new Set<string>(),
    };
    for (const parsed of messages) {
      await this.processMessage(parsed, ctx);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // ─── Main poll cycle ──────────────────────────────────────────────────────

  async runPollCycle(): Promise<void> {
    const { startedAt } = await this.events.logStart(this.tenantId, 'IMAP', 'poll', 'poll_start');

    try {
      const { messages, uids } = await this.imap.fetchUnseenMessages();
      logger.info({ count: messages.length }, 'Unprocessed messages found');

      // Fetch shared context once per cycle — amortises repeated Notion queries
      const [existingProjects, existingPolicies, existingProfiles, existingRoles, recentContext] = await Promise.all([
        this.notion.getAllProjectNames(),
        this.notion.getAllPolicyNames(),
        this.notion.getAllProfileNames(),
        this.notion.getAllRoleNames(),
        this.notion.getRecentExtractionContext(),
      ]);

      const ctx: CycleContext = {
        existingProjects,
        existingPolicies,
        existingProfiles,
        existingRoles,
        recentContext,
        processedInCycle: new Set<string>(),
      };

      for (const parsed of messages) {
        await this.processMessage(parsed, ctx);
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Mark IMAP messages seen only after ALL have been processed.
      // Notion dedup (Message ID) prevents double-processing if worker crashes before this point.
      if (uids.length > 0) {
        await this.imap.markMessagesSeen(uids);
      }

      await this.scheduled.runDue();

      await this.processRetries(ctx);

      await this.events.logComplete(this.tenantId, 'IMAP', 'poll', 'poll_start', startedAt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.events.logError(this.tenantId, 'IMAP', 'poll', 'poll_start', startedAt, msg);
      logger.error({ err }, 'Poll cycle failed');
    }
  }

  // ─── Process a single message ─────────────────────────────────────────────

  private async processMessage(parsed: ParsedEmail, ctx: CycleContext): Promise<void> {
    // In-cycle dedup — catches duplicate UIDs in the same IMAP batch before hitting Notion
    if (ctx.processedInCycle.has(parsed.messageId)) {
      logger.debug({ messageId: parsed.messageId }, 'Message already processed in this cycle — skipping');
      return;
    }

    const alreadyDone = await this.imap.isAlreadyProcessed(this.notion, parsed.messageId);
    if (alreadyDone) {
      logger.debug({ messageId: parsed.messageId }, 'Message already processed — skipping');
      return;
    }

    const emailType = this.classifier.classify(parsed);
    parsed.emailType = emailType;
    logger.info({ messageId: parsed.messageId, emailType, subject: parsed.subject }, 'Email classified');

    let sourceEmailPageId: string;
    try {
      sourceEmailPageId = await this.imap.createSourceEmailRecord(this.notion, parsed);
    } catch (err) {
      logger.error({ messageId: parsed.messageId, err }, 'Failed to create Source Email record');
      return;
    }

    // Mark as processed in this cycle immediately after creating the record
    ctx.processedInCycle.add(parsed.messageId);

    try {
      switch (emailType) {
        case 'Google Meet Recording':
        case 'Google Meet Transcript':
        case 'Google Meet Notes':
          await this.processMeetAssetEmail(parsed, sourceEmailPageId, ctx);
          break;
        case 'Operational Email':
        case 'Forwarded Thread':
          await this.processOperationalEmail(parsed, sourceEmailPageId, ctx);
          break;
        case 'Governance Agenda Request':
          await this.processGovernanceAgendaRequest(parsed, sourceEmailPageId);
          break;
        default:
          logger.warn({ emailType, subject: parsed.subject }, 'Unknown email type — marking for manual review');
          await this.imap.updateSourceEmailStatus(this.notion, sourceEmailPageId, 'Manual Review');
          return;
      }
      await this.imap.updateSourceEmailStatus(this.notion, sourceEmailPageId, 'Processed', emailType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ messageId: parsed.messageId, err }, 'Message processing error');
      await this.imap.updateSourceEmailStatus(this.notion, sourceEmailPageId, 'Failed', undefined, msg);
    }
  }

  // ─── Meet Asset email pipeline ────────────────────────────────────────────

  private async processMeetAssetEmail(parsed: ParsedEmail, sourceEmailPageId: string, ctx: CycleContext): Promise<void> {
    const { assetType, driveFileId, docId, driveLink, captureKey, organizer } = this.meetParser.parseAssetEmail(parsed);
    const primaryFileId = docId ?? driveFileId;

    const meetingPageId = await this.meetParser.upsertMeeting(
      this.notion, parsed, captureKey, assetType, driveLink,
    );

    const assetPageId = await this.meetParser.upsertMeetingAsset(
      this.notion, parsed, meetingPageId, assetType, driveFileId, driveLink,
    );

    if (assetType === 'Recording') {
      if (primaryFileId) {
        const { status, permanent } = await this.access.checkAccess(primaryFileId);
        await this.notion.updatePage(assetPageId, {
          'Access Status': N.select(status),
          'Processing Status': N.select(status === 'Confirmed' ? 'Processed' : permanent ? 'Manual Review' : 'Needs Access'),
          ...(status === 'Confirmed' ? { 'Processed At': N.date(new Date().toISOString()) } : {}),
          ...(permanent ? { 'Error Message': N.richText('File not found (404) — permanently inaccessible') } : {}),
        });
        await this.notion.updatePage(meetingPageId, {
          'Recording Access Status': N.select(status),
          ...(status === 'Confirmed' ? { 'Processing Status': N.select('Partial') } : {}),
        });
        if (status !== 'Confirmed' && !permanent) {
          await this.retry.scheduleRetry(this.notion, assetPageId, 0);
          if (driveLink) {
            await this.accessRequest.sendAccessRequest(
              getConfig().ADMIN_NOTIFICATION_EMAIL, parsed.subject, driveLink, organizer,
            );
          }
        }
      } else {
        await this.notion.updatePage(assetPageId, { 'Processing Status': N.select('Processed') });
      }
      return;
    }

    if (!primaryFileId) {
      logger.warn({ assetType, subject: parsed.subject }, 'No file ID found for asset');
      await this.notion.updatePage(assetPageId, {
        'Processing Status': N.select('Failed'),
        'Error Message': N.richText('No Drive/Doc file ID found in email'),
      });
      return;
    }

    const { status, permanent } = await this.access.checkAccess(primaryFileId);
    await this.notion.updatePage(assetPageId, { 'Access Status': N.select(status) });
    await this.notion.updatePage(meetingPageId, {
      [assetType === 'Transcript' ? 'Transcript Access Status' : 'Notes Access Status']: N.select(status),
    });

    if (status !== 'Confirmed') {
      // 404 — file permanently gone; skip retry queue, go straight to Manual Review
      if (permanent) {
        await this.notion.updatePage(assetPageId, {
          'Processing Status': N.select('Manual Review'),
          'Error Message': N.richText('File not found (404) — permanently inaccessible'),
        });
        return;
      }
      await this.retry.scheduleRetry(this.notion, assetPageId, 0);
      if (driveLink) {
        await this.accessRequest.sendAccessRequest(
          getConfig().ADMIN_NOTIFICATION_EMAIL, parsed.subject, driveLink, organizer,
        );
      }
      return;
    }

    const text = await this.docsExport.exportAsText(docId ?? primaryFileId);
    if (!text) {
      await this.notion.updatePage(assetPageId, {
        'Processing Status': N.select('Failed'),
        'Error Message': N.richText('Text export returned empty'),
      });
      return;
    }

    await this.notion.updatePage(assetPageId, { 'Processing Status': N.select('Processing') });

    // Append any attachment text (e.g. Granola notes attached to the meet email)
    let fullSourceText = text;
    if (parsed.rawAttachments?.length) {
      const { additionalText } = await this.processAttachments(parsed.rawAttachments);
      if (additionalText) fullSourceText += additionalText;
    }

    const extraction = await this.claude.extract({
      sourceType: assetType,
      sourceTitle: parsed.subject,
      sourceDate: parsed.receivedDate.slice(0, 10),
      sourceActor: parsed.from,
      relatedContext: '',
      sourceText: fullSourceText,
      existingProjects: ctx.existingProjects,
      existingPolicies: ctx.existingPolicies,
      existingProfiles: ctx.existingProfiles,
      existingRoles: ctx.existingRoles,
      recentContext: ctx.recentContext,
    });

    if (!extraction) {
      await this.notion.updatePage(assetPageId, {
        'Processing Status': N.select('Manual Review'),
        'Error Message': N.richText('Claude extraction failed or returned invalid JSON'),
      });
      return;
    }

    const sourceDocUrl = docId
      ? `https://docs.google.com/document/d/${docId}/edit`
      : (driveLink ?? null);

    const { createdRecords, canonReviewRequired, sensitiveReviewRequired, sensitiveRecordIds, canonRecordIds } =
      await this.claude.writeToNotion(this.notion, extraction.data, meetingPageId, sourceEmailPageId, parsed.receivedDate.slice(0, 10), sourceDocUrl);

    // Resolve organizer to a Profiles relation — try email first, then name, then auto-create
    if (organizer) {
      try {
        let orgProfileId = await this.notion.findByEmail(this.notion.dbIds.profiles, 'Email', organizer);
        if (!orgProfileId) {
          // Parse the name portion from "Display Name <email>" or plain email
          const organizerName = organizer.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim()
            ?? (organizer.includes('@') ? null : organizer.trim());
          if (organizerName) {
            orgProfileId = await this.notion.findByTitle(this.notion.dbIds.profiles, 'Name', organizerName);
            if (!orgProfileId) {
              const organizerEmail = organizer.match(/<(.+?)>/)?.[1]?.trim() ?? organizer.trim();
              const displayName = organizerName;
              const today = new Date().toISOString().slice(0, 10);
              orgProfileId = await this.notion.createPage(this.notion.dbIds.profiles, {
                Name: N.title(displayName),
                ...(organizerEmail.includes('@') ? { Email: { email: organizerEmail } } : {}),
                'Profile Type': N.select('Person'),
                'Engagement Status': N.select('Unknown'),
                'Relationship to Amora': N.select('Unknown'),
                Source: N.richText('Auto-created from meeting organizer'),
                'Sensitive Notes Flag': N.checkbox(false),
                'First Seen': N.date(today),
                'Last Seen': N.date(today),
              });
            }
          }
        }
        if (orgProfileId) {
          await this.notion.updatePage(meetingPageId, { Organizer: N.relation([orgProfileId]) });
        }
      } catch (err) { logger.warn({ err }, 'Failed to resolve/link organizer profile — skipping'); }
    }

    await this.notion.updatePage(assetPageId, {
      'Access Status': N.select('Confirmed'),
      'Processing Status': N.select('Processed'),
      'Processed At': N.date(new Date().toISOString()),
    });

    await this.events.logComplete(this.tenantId, parsed.emailType, parsed.messageId, 'extraction', parsed.receivedDate, {
      tokenEstimate: extraction.tokens,
    });

    if (canonReviewRequired || sensitiveReviewRequired) {
      await this.review.notifyAdminIfNeeded(
        parsed.subject, canonReviewRequired, sensitiveReviewRequired,
        sensitiveRecordIds, canonRecordIds, sourceEmailPageId, meetingPageId,
      );
    }

    // Send recap email to organizer after successful extraction
    if (organizer) {
      const organizerEmail = organizer.match(/<(.+?)>/)?.[1]?.trim() ?? (organizer.includes('@') ? organizer.trim() : null);
      const rootsEmail = getConfig().ROOTS_EMAIL.toLowerCase();
      if (organizerEmail && organizerEmail.toLowerCase() !== rootsEmail) {
        try {
          await this.sendMeetingRecap(organizerEmail, parsed.subject, meetingPageId, extraction.data);
        } catch (err) {
          logger.warn({ err, organizerEmail }, 'Meeting recap email failed — non-fatal');
        }
      }
    }
  }

  // ─── Meeting recap email ──────────────────────────────────────────────────

  private async sendMeetingRecap(
    organizerEmail: string,
    meetingSubject: string,
    meetingPageId: string,
    extractionData: Record<string, unknown>,
  ): Promise<void> {
    const data = extractionData as {
      tasks?: unknown[];
      decisions?: unknown[];
      risks?: unknown[];
      memory_candidates?: unknown[];
      canon_change_candidates?: unknown[];
    };

    const taskCount    = data.tasks?.length ?? 0;
    const decCount     = data.decisions?.length ?? 0;
    const riskCount    = data.risks?.length ?? 0;
    const memCount     = data.memory_candidates?.length ?? 0;
    const canonCount   = data.canon_change_candidates?.length ?? 0;

    const meetingUrl = `https://www.notion.so/${meetingPageId.replace(/-/g, '')}`;
    const title = meetingSubject.replace(/^(re:|fwd?:)\s*/i, '').trim() || 'your meeting';

    const lines: string[] = [
      `Hi,`,
      '',
      `Sera processed "${title}" and created the following records in Notion:`,
      '',
    ];

    if (taskCount)  lines.push(`  Tasks:               ${taskCount}`);
    if (decCount)   lines.push(`  Decision candidates: ${decCount}`);
    if (riskCount)  lines.push(`  Risks flagged:       ${riskCount}`);
    if (memCount)   lines.push(`  Memory candidates:   ${memCount}`);
    if (canonCount) lines.push(`  Canon change requests: ${canonCount}`);

    if (!taskCount && !decCount && !riskCount && !memCount) {
      lines.push('  No structured records were extracted - the meeting may not have contained actionable content.');
    }

    lines.push('');
    lines.push(`Review everything in Notion: ${meetingUrl}`);
    lines.push('');
    lines.push('Tasks and decisions are in Draft/Candidate status and need your review before they are acted on.');
    lines.push('');
    lines.push('-- Sera, Amora Living Memory');

    await this.smtp.sendEmail(
      organizerEmail,
      `[Amora] Meeting processed: ${title}`,
      lines.join('\n'),
    );
    logger.info({ organizerEmail, taskCount, decCount, riskCount }, 'Meeting recap email sent');
  }

  // ─── Governance agenda generator ─────────────────────────────────────────

  private async processGovernanceAgendaRequest(parsed: ParsedEmail, sourceEmailPageId: string): Promise<void> {
    const senderEmail = parsed.from.match(/<(.+?)>/)?.[1]?.trim() ?? parsed.from.trim();
    logger.info({ from: senderEmail }, 'Processing governance agenda request');

    // Pull open governance items from Notion in parallel
    const [tensions, canonChanges, pendingDecisions, highRisks] = await Promise.all([
      this.notion.queryDatabase(
        this.notion.dbIds.ccosLedgerEntries,
        { or: [
          { property: 'Status', select: { equals: 'Draft' } },
          { property: 'Status', select: { equals: 'Pending Review' } },
        ] } as never,
        25,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.canonChangeRequests,
        { property: 'Status', select: { equals: 'Pending Review' } } as never,
        15,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.decisionCandidates,
        { or: [
          { property: 'Status', select: { equals: 'Candidate' } },
          { property: 'Status', select: { equals: 'Needs Clarification' } },
        ] } as never,
        20,
      ),
      this.notion.queryDatabase(
        this.notion.dbIds.risks,
        { and: [
          { property: 'Status', select: { equals: 'Open' } },
          { property: 'Severity', select: { equals: 'High' } },
        ] } as never,
        10,
      ),
    ]);

    const today = new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Costa_Rica',
    });

    const lines: string[] = [
      `GOVERNANCE AGENDA - ${today}`,
      '='.repeat(50),
      '',
      'Generated by Sera from open items in Notion.',
      'Agenda items listed in recommended discussion order.',
      '',
    ];

    // 1. Tensions and ledger items
    if (tensions.length) {
      lines.push(`1. OPEN TENSIONS & LEDGER ITEMS (${tensions.length})`);
      lines.push('-'.repeat(40));
      tensions.slice(0, 10).forEach((r, i) => {
        const p = r.properties as any;
        const title  = p['Ledger Entry']?.title?.[0]?.plain_text ?? p['Entry Title']?.title?.[0]?.plain_text ?? `Item ${i + 1}`;
        const status = p.Status?.select?.name ?? '?';
        const type   = p['Entry Type']?.select?.name ?? p.Type?.select?.name ?? '';
        lines.push(`  ${i + 1}. [${status}] ${title}${type ? ` (${type})` : ''}`);
      });
      if (tensions.length > 10) lines.push(`  ... and ${tensions.length - 10} more`);
      lines.push('');
    }

    // 2. Canon change requests
    if (canonChanges.length) {
      lines.push(`2. CONSTITUTION CHANGE REQUESTS (${canonChanges.length})`);
      lines.push('-'.repeat(40));
      lines.push('NOTICE: Canon changes require a Future Generations review and consent from all circle Lead Stewards.');
      lines.push('');
      canonChanges.slice(0, 8).forEach((r, i) => {
        const p = r.properties as any;
        const title = p['Proposed Change']?.title?.[0]?.plain_text ?? `Canon Change ${i + 1}`;
        lines.push(`  ${i + 1}. ${title}`);
      });
      if (canonChanges.length > 8) lines.push(`  ... and ${canonChanges.length - 8} more`);
      lines.push('');
    }

    // 3. Pending decisions
    if (pendingDecisions.length) {
      lines.push(`3. DECISIONS AWAITING CONSENT (${pendingDecisions.length})`);
      lines.push('-'.repeat(40));
      pendingDecisions.slice(0, 10).forEach((r, i) => {
        const p = r.properties as any;
        const text   = p.Decision?.title?.[0]?.plain_text ?? `Decision ${i + 1}`;
        const status = p.Status?.select?.name ?? '?';
        const maker  = p['Decision Maker Profile']?.relation?.length
          ? '(owner assigned)' : '(no owner)';
        lines.push(`  ${i + 1}. [${status}] ${text} ${maker}`);
      });
      if (pendingDecisions.length > 10) lines.push(`  ... and ${pendingDecisions.length - 10} more`);
      lines.push('');
    }

    // 4. High-severity risks
    if (highRisks.length) {
      lines.push(`4. HIGH-SEVERITY RISKS FOR AWARENESS (${highRisks.length})`);
      lines.push('-'.repeat(40));
      highRisks.slice(0, 8).forEach((r, i) => {
        const p = r.properties as any;
        const text = p.Risk?.title?.[0]?.plain_text ?? `Risk ${i + 1}`;
        lines.push(`  ${i + 1}. ${text}`);
      });
      lines.push('');
    }

    if (!tensions.length && !canonChanges.length && !pendingDecisions.length && !highRisks.length) {
      lines.push('No open governance items found. All queues are clear.');
      lines.push('');
      lines.push('Consider using this meeting time for strategic review or community building.');
    }

    lines.push('='.repeat(50));
    lines.push('Review and manage all items in Notion.');
    lines.push('To regenerate this agenda, email roots@amora.cr with [GOVERNANCE AGENDA] in the subject.');

    await this.smtp.sendEmail(
      senderEmail,
      `[Amora] Governance Agenda - ${today}`,
      lines.join('\n'),
    );

    await this.imap.updateSourceEmailStatus(this.notion, sourceEmailPageId, 'Processed', 'Governance Agenda Request');
    logger.info({ senderEmail, tensions: tensions.length, canonChanges: canonChanges.length, pendingDecisions: pendingDecisions.length }, 'Governance agenda sent');
  }

  // ─── Operational email pipeline ───────────────────────────────────────────

  private async processOperationalEmail(parsed: ParsedEmail, sourceEmailPageId: string, ctx: CycleContext): Promise<void> {
    // Prefer plain text; fall back to HTML stripped of tags for HTML-only emails
    const effectiveBody = parsed.bodyText.trim()
      || parsed.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Process attachments and append their text to the body
    let attachmentText = '';
    if (parsed.rawAttachments?.length) {
      const { additionalText } = await this.processAttachments(parsed.rawAttachments);
      attachmentText = additionalText;
    }

    const fullSourceText = (effectiveBody + attachmentText).trim();

    // Short emails with no attachment content: create Message record immediately
    if (fullSourceText.length < 50) {
      await this.meetParser.createMessageRecord(this.notion, parsed);
      return;
    }

    // Extract first — only create Message record if extraction succeeds
    const extraction = await this.claude.extract({
      sourceType: parsed.emailType,
      sourceTitle: parsed.subject,
      sourceDate: parsed.receivedDate.slice(0, 10),
      sourceActor: parsed.from,
      relatedContext: '',
      sourceText: fullSourceText.slice(0, 50_000),
      existingProjects: ctx.existingProjects,
      existingPolicies: ctx.existingPolicies,
      existingProfiles: ctx.existingProfiles,
      existingRoles: ctx.existingRoles,
      recentContext: ctx.recentContext,
    });

    if (!extraction) {
      // Both Sonnet and Haiku failed — leave Source Email as Failed, no blank Message record
      logger.warn({ subject: parsed.subject }, 'Extraction failed after fallback — no Message record created');
      throw new Error('Claude extraction failed after all retries');
    }

    const es = (extraction.data as { email_summary?: Record<string, unknown> }).email_summary;
    const subject = parsed.subject || '(no subject)';

    const summary = this.toStr(es?.summary);
    const requests = this.toStr(es?.requests);
    const commitments = this.toStr(es?.commitments);
    const questions = this.toStr(es?.questions);
    const emotionalTone = this.toStr(es?.emotional_tone);
    const urgency = this.toStr(es?.urgency);
    const followUp = typeof es?.follow_up_needed === 'boolean' ? es.follow_up_needed : false;
    const confidentialityLevel = sanitizeSelect(
      this.toStr(es?.confidentiality_level),
      ['Standard', 'Sensitive', 'Restricted'],
      'Standard',
    );

    const messagePageId = await this.notion.createPage(this.notion.dbIds.messages, {
      'Message Title': N.title(subject),
      Recipients: N.richText([parsed.to, parsed.cc].filter(Boolean).join('; ')),
      Date: N.date(parsed.receivedDate),
      ...(summary ? { Summary: N.richText(summary) } : {}),
      ...(requests ? { Requests: N.richText(requests) } : {}),
      ...(commitments ? { Commitments: N.richText(commitments) } : {}),
      ...(questions ? { Questions: N.richText(questions) } : {}),
      ...(emotionalTone ? { 'Emotional Tone': N.select(sanitizeSelect(emotionalTone, ['Neutral', 'Positive', 'Tense', 'Urgent', 'Unclear'], 'Neutral')) } : {}),
      ...(urgency ? { Urgency: N.select(sanitizeSelect(urgency, ['High', 'Medium', 'Low'], 'Medium')) } : {}),
      'Follow-Up Needed': N.checkbox(followUp),
      'Confidentiality Level': N.select(confidentialityLevel),
      'Processing Status': N.select('Processed'),
    });

    logger.info({ subject, from: parsed.from }, 'Message record created');

    // If the email contains a Google Docs or Drive link, surface it as the source document
    const emailDocUrl = parsed.detectedLinks.find(
      l => l.includes('docs.google.com') || l.includes('drive.google.com'),
    ) ?? null;

    let { createdRecords, canonReviewRequired, sensitiveReviewRequired, sensitiveRecordIds, canonRecordIds } =
      await this.claude.writeToNotion(this.notion, extraction.data, null, sourceEmailPageId, parsed.receivedDate.slice(0, 10), emailDocUrl);

    if (sensitiveReviewRequired && confidentialityLevel === 'Standard') {
      await this.notion.updatePage(messagePageId, {
        'Confidentiality Level': N.select('Sensitive'),
      });
    }

    // Route message to Sensitive Review if Claude flagged it as Sensitive or Restricted
    if (confidentialityLevel !== 'Standard') {
      try {
        await this.notion.createPage(this.notion.dbIds.sensitiveReview, {
          Issue:                  N.title(`Sensitive message: ${subject}`),
          Reason:                 N.richText(`Email flagged as ${confidentialityLevel} by Claude extraction.`),
          'Recommended Handling': N.richText('Review message content and apply confidentiality policy before sharing or acting on this email.'),
          Status:                 N.select('Pending Review'),
          Source:                 N.richText(messagePageId),
          'Date Flagged':         N.date(new Date().toISOString().slice(0, 10)),
        });
        sensitiveReviewRequired = true;
      } catch (err) {
        logger.warn({ err, subject }, 'Failed to create Sensitive Review record for message');
      }
    }

    // Resolve or auto-create sender profile, then link to message
    try {
      const senderEmail = parsed.from.match(/<(.+?)>/)?.[1]?.trim() ?? parsed.from.trim();
      const senderName  = parsed.from.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim() ?? null;
      const today = new Date().toISOString().slice(0, 10);
      let senderProfileId: string | null = null;

      if (senderEmail.includes('@')) {
        senderProfileId = await this.notion.findByEmail(this.notion.dbIds.profiles, 'Email', senderEmail);
      }
      if (!senderProfileId && senderName) {
        senderProfileId = await this.notion.findByTitle(this.notion.dbIds.profiles, 'Name', senderName);
      }
      if (!senderProfileId) {
        const displayName = senderName || (senderEmail.includes('@') ? senderEmail.split('@')[0] : senderEmail);
        senderProfileId = await this.notion.createPage(this.notion.dbIds.profiles, {
          Name: N.title(displayName),
          ...(senderEmail.includes('@') ? { Email: { email: senderEmail } } : {}),
          'Profile Type': N.select('Person'),
          'Engagement Status': N.select('Unknown'),
          'Relationship to Amora': N.select('Unknown'),
          Source: N.richText('Auto-created from message ingestion'),
          'Sensitive Notes Flag': N.checkbox(false),
          'First Seen': N.date(today),
          'Last Seen': N.date(today),
        });
      }
      if (senderProfileId) {
        await this.notion.updatePage(messagePageId, { 'Sender Profile': N.relation([senderProfileId]) });
      }
    } catch (err) { logger.warn({ err }, 'Failed to resolve/link sender profile — skipping'); }

    // Resolve or auto-create profiles for all To/CC recipients
    try {
      const rootsEmail = getConfig().ROOTS_EMAIL.toLowerCase();
      const today = new Date().toISOString().slice(0, 10);
      const recipientAddrs = parseAddressString([parsed.to, parsed.cc].filter(Boolean).join(', '));

      for (const { name, email } of recipientAddrs) {
        if (email === rootsEmail) continue;
        try {
          let profileId: string | null = null;
          let foundByEmail = false;

          profileId = await this.notion.findByEmail(this.notion.dbIds.profiles, 'Email', email);
          if (profileId) {
            foundByEmail = true;
          } else if (name) {
            profileId = await this.notion.findByTitle(this.notion.dbIds.profiles, 'Name', name);
          }

          if (profileId) {
            const updates: Record<string, unknown> = { 'Last Seen': N.date(today) };
            if (!foundByEmail) updates['Email'] = { email };
            await this.notion.updatePage(profileId, updates);
            logger.debug({ email, name }, 'Updated existing recipient profile');
          } else {
            const displayName = name || email.split('@')[0];
            await this.notion.createPage(this.notion.dbIds.profiles, {
              Name: N.title(displayName),
              Email: { email },
              'Profile Type': N.select('Person'),
              'Engagement Status': N.select('Unknown'),
              'Relationship to Amora': N.select('Unknown'),
              Source: N.richText('Auto-created from message ingestion'),
              'Sensitive Notes Flag': N.checkbox(false),
              'First Seen': N.date(today),
              'Last Seen': N.date(today),
            });
            logger.info({ email, name }, 'Created recipient profile');
          }
        } catch (err) {
          logger.warn({ err, email }, 'Failed to upsert recipient profile — skipping');
        }
      }
    } catch (err) { logger.warn({ err }, 'Failed to resolve/link recipient profiles — skipping'); }

    if (canonReviewRequired || sensitiveReviewRequired) {
      await this.review.notifyAdminIfNeeded(
        parsed.subject, canonReviewRequired, sensitiveReviewRequired,
        sensitiveRecordIds, canonRecordIds, sourceEmailPageId,
      );
    }

    await this.events.logComplete(this.tenantId, this.toEventSourceType(parsed.emailType), parsed.messageId, 'extraction', parsed.receivedDate, {
      tokenEstimate: extraction.tokens,
    });
  }

  // ─── Attachment processing ────────────────────────────────────────────────

  /**
   * Extracts text from email attachments and archives originals to Drive.
   * - text/* and markdown: decoded inline
   * - PDF / Word / RTF: uploaded to Drive as Google Doc, then exported as text
   * - Other files: archived to Drive only (no text extraction)
   */
  private async processAttachments(attachments: RawAttachment[]): Promise<{
    additionalText: string;
    archivedDriveIds: string[];
  }> {
    const textParts: string[] = [];
    const archivedDriveIds: string[] = [];

    for (const att of attachments) {
      const { filename, contentType, content } = att;

      if (contentType.startsWith('text/')) {
        const raw = content.toString('utf-8').trim();
        const clean = contentType === 'text/html'
          ? raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          : raw;
        if (clean) textParts.push(`\n\n--- Attachment: ${filename} ---\n${clean}`);
        continue;
      }

      if (this.driveUpload.isConvertible(contentType)) {
        const docId = await this.driveUpload.uploadAndConvertToDoc(content, filename, contentType);
        if (docId) {
          archivedDriveIds.push(docId);
          const text = await this.docsExport.exportAsText(docId);
          if (text) textParts.push(`\n\n--- Attachment: ${filename} ---\n${text}`);
        }
        continue;
      }

      // Non-text, non-convertible: archive only
      const fileId = await this.driveUpload.archiveFile(content, filename, contentType);
      if (fileId) archivedDriveIds.push(fileId);
    }

    return { additionalText: textParts.join(''), archivedDriveIds };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // Normalize a Claude field that may be a string, array, or null to a plain string
  private toStr(val: unknown): string {
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(String).join('\n');
    return '';
  }

  // Map internal asset/email type names to Processing Events Source Type schema values
  private toEventSourceType(type: string): string {
    const map: Record<string, string> = {
      'Forwarded Thread': 'Operational Email',
      'Transcript': 'Google Meet Transcript',
      'Gemini Notes': 'Google Meet Notes',
      'Recording': 'Google Meet Recording',
    };
    return map[type] ?? type;
  }

  // ─── Retry due assets ─────────────────────────────────────────────────────

  private async processRetries(ctx: CycleContext): Promise<void> {
    const dueAssets = await this.retry.getDueRetries(this.notion);
    if (dueAssets.length === 0) {
      await this.retryFailedOperationalEmails(ctx);
      return;
    }
    logger.info({ count: dueAssets.length }, 'Processing retry queue');

    for (const asset of dueAssets) {
      try {
        await this.retryAsset(asset, ctx);
      } catch (err) {
        logger.error({ err, assetId: asset.id }, 'Retry asset failed — continuing with remaining queue');
      }
    }

    await this.retryFailedOperationalEmails(ctx);
  }

  private async retryAsset(asset: { id: string; properties: Record<string, unknown> }, ctx: CycleContext): Promise<void> {
    const retryStartedAt = new Date().toISOString();
    const props = asset.properties as Record<string, { rich_text?: Array<{ plain_text: string }>; title?: Array<{ plain_text: string }>; number?: { number: number }; select?: { name: string }; url?: string; relation?: Array<{ id: string }> }>;
    const fileId = props['Google Drive File ID']?.rich_text?.[0]?.plain_text;
    const driveLink = props['Google Drive Link']?.url;
    const retryCount = props['Retry Count']?.number?.number ?? 0;
    const assetType = props['Asset Type']?.select?.name ?? 'Unknown';
    const meetingPageId = props['Meeting']?.relation?.[0]?.id;
    const assetName = props['Asset Name']?.title?.[0]?.plain_text ?? assetType;

    if (!fileId) {
      logger.warn({ assetId: asset.id }, 'Retry asset has no file ID — escalating');
      await this.retry.scheduleRetry(this.notion, asset.id, 999);
      return;
    }

    const { status, permanent } = await this.access.checkAccess(fileId);

    // 404 — permanently gone; skip retry queue entirely
    if (permanent) {
      logger.warn({ assetId: asset.id, assetType }, 'Retry asset returned 404 — marking for Manual Review');
      await this.notion.updatePage(asset.id, {
        'Processing Status': N.select('Manual Review'),
        'Error Message': N.richText('File not found (404) — permanently inaccessible'),
        'Next Retry At': N.date(null),
      });
      return;
    }

    if (status !== 'Confirmed') {
      const result = await this.retry.scheduleRetry(this.notion, asset.id, retryCount, `Access check failed: ${status}`);
      if (result === 'escalated') {
        await this.accessRequest.notifyAdminOfEscalation(
          `Asset ${assetType} (${asset.id})`, asset.id, driveLink,
        );
      }
      return;
    }

    if (assetType === 'Recording') {
      await this.notion.updatePage(asset.id, {
        'Access Status': N.select('Confirmed'),
        'Processing Status': N.select('Processed'),
        'Processed At': N.date(new Date().toISOString()),
        'Retry Count': N.number(retryCount + 1),
        'Next Retry At': N.date(null),
        'Error Message': N.richText(null),
      });
      if (meetingPageId) {
        await this.notion.updatePage(meetingPageId, {
          'Recording Access Status': N.select('Confirmed'),
          'Processing Status': N.select('Partial'),
        });
      }
      await this.events.logComplete(this.tenantId, 'Google Meet Recording', asset.id, 'access_check', retryStartedAt);
      logger.info({ assetId: asset.id }, 'Recording retry — access confirmed');
      return;
    }

    const text = await this.docsExport.exportAsText(fileId);
    if (!text) {
      await this.retry.scheduleRetry(this.notion, asset.id, retryCount, 'Text export failed');
      return;
    }

    // Use the actual meeting date rather than today — decisions/tasks should be stamped correctly
    let meetingDate = new Date().toISOString().slice(0, 10);
    if (meetingPageId) {
      const meetingPage = await this.notion.getPage(meetingPageId);
      if (meetingPage) {
        const mProps = (meetingPage.properties ?? {}) as Record<string, Record<string, unknown>>;
        const dateStart = (mProps['Meeting Date']?.date as { start?: string } | null)?.start;
        if (dateStart) meetingDate = dateStart.slice(0, 10);
      }
    }

    const extraction = await this.claude.extract({
      sourceType: assetType,
      sourceTitle: assetName,
      sourceDate: meetingDate,
      sourceActor: '',
      relatedContext: '',
      sourceText: text,
      existingProjects: ctx.existingProjects,
      existingPolicies: ctx.existingPolicies,
      existingProfiles: ctx.existingProfiles,
      existingRoles: ctx.existingRoles,
      recentContext: ctx.recentContext,
    });

    if (!extraction) {
      await this.notion.updatePage(asset.id, {
        'Processing Status': N.select('Manual Review'),
        'Error Message': N.richText('Claude extraction failed on retry'),
      });
      return;
    }

    const now = new Date().toISOString();
    let createdRecords: string[] = [];
    try {
      const result = await this.claude.writeToNotion(this.notion, extraction.data, meetingPageId ?? null, null, now.slice(0, 10));
      createdRecords = result.createdRecords;
      if (result.canonReviewRequired || result.sensitiveReviewRequired) {
        await this.review.notifyAdminIfNeeded(
          assetName, result.canonReviewRequired, result.sensitiveReviewRequired,
          result.sensitiveRecordIds, result.canonRecordIds, undefined, meetingPageId ?? undefined,
        );
      }
    } catch (err) {
      logger.error({ err, assetId: asset.id }, 'writeToNotion failed on retry — marking for manual review');
      await this.notion.updatePage(asset.id, {
        'Processing Status': N.select('Manual Review'),
        'Error Message': N.richText('writeToNotion failed on retry: ' + (err instanceof Error ? err.message : String(err))),
      });
      return;
    }
    await this.notion.updatePage(asset.id, {
      'Access Status': N.select('Confirmed'),
      'Processing Status': N.select('Processed'),
      'Processed At': N.date(now),
      'Next Retry At': N.date(null),
      'Retry Count': N.number(retryCount + 1),
      'Error Message': N.richText(null),
    });
    if (meetingPageId) {
      await this.notion.updatePage(meetingPageId, {
        [assetType === 'Transcript' ? 'Transcript Access Status' : 'Notes Access Status']: N.select('Confirmed'),
        'Processing Status': N.select('Processed'),
        'Last Processed At': N.date(now),
      });
    }
    await this.events.logComplete(this.tenantId, this.toEventSourceType(assetType), asset.id, 'extraction', retryStartedAt, {
      tokenEstimate: extraction.tokens,
    });
    logger.info({ assetId: asset.id, assetType }, 'Retry succeeded');
  }

  // ─── Retry failed operational emails ─────────────────────────────────────

  private async retryFailedOperationalEmails(ctx: CycleContext): Promise<void> {
    const failed = await this.notion.getFailedOperationalEmails();
    if (!failed.length) return;
    logger.info({ count: failed.length }, 'Retrying failed operational email extractions');
    for (const email of failed) {
      if (!email.rawSnippet) continue;
      try {
        const extraction = await this.claude.extract({
          sourceType: 'Operational Email',
          sourceTitle: email.subject,
          sourceDate: new Date().toISOString().slice(0, 10),
          sourceActor: email.from,
          relatedContext: '',
          sourceText: email.rawSnippet,
          existingProjects: ctx.existingProjects,
          existingProfiles: ctx.existingProfiles,
          existingPolicies: ctx.existingPolicies,
          existingRoles: ctx.existingRoles,
          recentContext: ctx.recentContext,
        });
        if (!extraction) continue;
        await this.claude.writeToNotion(this.notion, extraction.data, null, email.id, new Date().toISOString().slice(0, 10));
        await this.notion.updatePage(email.id, { 'Processing Status': N.select('Processed') });
        logger.info({ subject: email.subject }, 'Failed operational email retry succeeded');
      } catch (err) {
        await this.notion.updatePage(email.id, { 'Processing Status': N.select('Failed') }).catch(() => {});
        logger.warn({ err, subject: email.subject }, 'Failed operational email retry failed again — marked as Failed');
      }
    }
  }
}
