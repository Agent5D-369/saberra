import { NotionWriterService } from './NotionWriterService';
import { logger } from '../config/logger';
import type { ProcessingEvent } from '../types';

const N = NotionWriterService;

// Maps legacy snake_case eventType + lifecycle to the template-schema title-case Event Type select values.
function mapEventType(eventType: string, status: 'Info' | 'Success' | 'Error' | 'Warning'): string {
  switch (eventType) {
    case 'poll_start':
      return status === 'Info' ? 'Poll Start' : 'Poll Complete';
    case 'extraction':
      return status === 'Error' ? 'Extraction Failed' : 'Extraction Complete';
    case 'access_check':
      return 'Access Check';
    case 'heartbeat':
      return 'Heartbeat';
    case 'scheduled_task':
      return 'Scheduled Task';
    case 'retry_scheduled':
      return 'Retry Queued';
    case 'access_request_sent':
      return 'Access Requested';
    default:
      return eventType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}

export class ProcessingEventService {
  constructor(private readonly notion: NotionWriterService) {}

  async log(event: ProcessingEvent): Promise<string | null> {
    try {
      const mappedType = mapEventType(event.eventType, event.status);
      const titleContent = event.sourceId && event.sourceId !== 'poll'
        ? `${mappedType} — ${event.sourceId.slice(0, 60)}`
        : mappedType;

      const pageId = await this.notion.createPage(this.notion.dbIds.processingEvents, {
        Event:          N.title(titleContent),
        'Tenant ID':    N.richText(event.tenantId),
        'Event Type':   N.select(mappedType),
        Service:        N.select('Worker'),
        Status:         N.select(event.status),
        Timestamp:      N.date(event.startedAt),
        'Token Count':  N.number(event.tokenEstimate ?? null),
        Details:        N.richText(event.error ?? null),
      });
      return pageId;
    } catch (err) {
      logger.error({ err }, 'ProcessingEventService.log failed');
      return null;
    }
  }

  async logStart(tenantId: string, sourceType: string, sourceId: string, eventType: string): Promise<{ pageId: string | null; startedAt: string }> {
    const startedAt = new Date().toISOString();
    const pageId = await this.log({
      tenantId, sourceType, sourceId, eventType, status: 'Info', startedAt,
    });
    return { pageId, startedAt };
  }

  async logComplete(
    tenantId: string,
    sourceType: string,
    sourceId: string,
    eventType: string,
    startedAt: string,
    opts: { tokenEstimate?: number } = {},
  ): Promise<void> {
    await this.log({ tenantId, sourceType, sourceId, eventType, status: 'Success', startedAt, ...opts });
  }

  async logError(
    tenantId: string,
    sourceType: string,
    sourceId: string,
    eventType: string,
    startedAt: string,
    error: string,
  ): Promise<void> {
    await this.log({ tenantId, sourceType, sourceId, eventType, status: 'Error', startedAt, error });
  }
}
