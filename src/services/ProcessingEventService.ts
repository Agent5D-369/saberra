import { randomUUID } from 'crypto';
import { NotionWriterService } from './NotionWriterService';
import { logger } from '../config/logger';
import type { ProcessingEvent } from '../types';

const N = NotionWriterService;

export class ProcessingEventService {
  constructor(private readonly notion: NotionWriterService) {}

  async log(event: ProcessingEvent): Promise<string | null> {
    try {
      const pageId = await this.notion.createPage(this.notion.dbIds.processingEvents, {
        'Event ID': N.title(event.sourceId ? `${event.eventType}:${event.sourceId}` : randomUUID()),
        'Tenant ID': N.richText(event.tenantId),
        'Source Type': N.select(event.sourceType),
        'Source ID': N.richText(event.sourceId),
        'Event Type': N.select(event.eventType),
        Status: N.select(event.status),
        'Started At': N.date(event.startedAt),
        'Completed At': N.date(event.completedAt ?? null),
        Error: N.richText(event.error ?? null),
        'Retry Count': N.number(event.retryCount),
        'Created Records': N.richText(event.createdRecords?.join(', ') ?? null),
        'Claude Model Used': N.richText(event.claudeModelUsed ?? null),
        'Token Estimate': N.number(event.tokenEstimate ?? null),
      });
      return pageId;
    } catch (err) {
      // Never let logging failures crash the worker
      logger.error({ err }, 'ProcessingEventService.log failed');
      return null;
    }
  }

  async logStart(tenantId: string, sourceType: string, sourceId: string, eventType: string): Promise<{ pageId: string | null; startedAt: string }> {
    const startedAt = new Date().toISOString();
    const pageId = await this.log({
      tenantId,
      sourceType,
      sourceId,
      eventType,
      status: 'started',
      startedAt,
      retryCount: 0,
    });
    return { pageId, startedAt };
  }

  async logComplete(
    tenantId: string,
    sourceType: string,
    sourceId: string,
    eventType: string,
    startedAt: string,
    opts: { createdRecords?: string[]; claudeModelUsed?: string; tokenEstimate?: number } = {},
  ): Promise<void> {
    await this.log({
      tenantId,
      sourceType,
      sourceId,
      eventType,
      status: 'completed',
      startedAt,
      completedAt: new Date().toISOString(),
      retryCount: 0,
      ...opts,
    });
  }

  async logError(
    tenantId: string,
    sourceType: string,
    sourceId: string,
    eventType: string,
    startedAt: string,
    error: string,
    retryCount = 0,
  ): Promise<void> {
    await this.log({
      tenantId,
      sourceType,
      sourceId,
      eventType,
      status: 'failed',
      startedAt,
      completedAt: new Date().toISOString(),
      error,
      retryCount,
    });
  }
}
