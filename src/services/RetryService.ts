import { NotionWriterService } from './NotionWriterService';
import { logger } from '../config/logger';
import { getConfig } from '../config/ConfigService';

const N = NotionWriterService;

// Retry intervals in milliseconds: immediate, 30min, 2h, 24h
const RETRY_DELAYS_MS = [0, 30 * 60 * 1000, 2 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];

export class RetryService {
  private readonly maxRetries: number;

  constructor() {
    const config = getConfig();
    this.maxRetries = config.MAX_RETRY_COUNT;
  }

  /**
   * Marks a Meeting Asset as Needs Access and schedules the next retry.
   * If retryCount has reached max, escalates to Manual Review.
   */
  async scheduleRetry(
    notion: NotionWriterService,
    assetPageId: string,
    currentRetryCount: number,
    errorMessage?: string,
  ): Promise<'scheduled' | 'escalated'> {
    if (currentRetryCount >= this.maxRetries) {
      await notion.updatePage(assetPageId, {
        'Access Status': N.select('Denied'),
        'Processing Status': N.select('Manual Review'),
        'Retry Count': N.number(currentRetryCount),
        'Error Message': N.richText(errorMessage ?? 'Max retries reached'),
        'Next Retry At': N.date(null),
      });
      logger.warn({ assetPageId, retries: currentRetryCount }, 'Asset escalated to Manual Review after max retries');
      return 'escalated';
    }

    const delayMs = RETRY_DELAYS_MS[currentRetryCount] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
    const nextRetryAt = new Date(Date.now() + delayMs).toISOString();
    const newRetryCount = currentRetryCount + 1;

    await notion.updatePage(assetPageId, {
      'Access Status': N.select('Needs Access'),
      'Processing Status': N.select('Needs Access'),
      'Retry Count': N.number(newRetryCount),
      'Next Retry At': N.date(nextRetryAt),
      ...(errorMessage ? { 'Error Message': N.richText(errorMessage) } : {}),
    });

    logger.info({ assetPageId, nextRetryAt, attempt: newRetryCount }, 'Asset retry scheduled');
    return 'scheduled';
  }

  /**
   * Queries Meeting Assets that are due for retry (Needs Access + Next Retry At <= now).
   */
  async getDueRetries(notion: NotionWriterService): Promise<Array<{ id: string; properties: Record<string, unknown> }>> {
    const now = new Date().toISOString();
    return notion.queryDatabase(
      notion.dbIds.meetingAssets,
      {
        and: [
          { property: 'Processing Status', select: { equals: 'Needs Access' } },
          { property: 'Next Retry At', date: { on_or_before: now } },
        ],
      },
      50,
    );
  }
}
