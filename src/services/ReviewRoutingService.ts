import { SmtpService } from './SmtpService';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';

function notionUrl(id: string): string {
  return `https://notion.so/${id.replace(/-/g, '')}`;
}

function linkBlock(label: string, ids: string[]): string[] {
  if (!ids.length) return [];
  return [``, label, ...ids.map((id) => `  ${notionUrl(id)}`)];
}

export class ReviewRoutingService {
  constructor(
    private readonly smtp: SmtpService,
  ) {}

  async notifyAdminIfNeeded(
    sourceTitle: string,
    canonReviewRequired: boolean,
    sensitiveReviewRequired: boolean,
    sensitiveRecordIds: string[] = [],
    canonRecordIds: string[] = [],
    sourcePageId?: string,
    meetingPageId?: string,
  ): Promise<void> {
    if (!canonReviewRequired && !sensitiveReviewRequired) return;

    const config = getConfig();
    const flags: string[] = [];
    if (canonReviewRequired)   flags.push('CANON REVIEW REQUIRED');
    if (sensitiveReviewRequired) flags.push('SENSITIVE REVIEW REQUIRED');

    const subject = `[AMORA REVIEW] ${flags.join(' + ')} - ${sourceTitle}`;
    const body = [
      `Sera has flagged records that require your attention.`,
      ``,
      `Source: ${sourceTitle}`,
      `Flags: ${flags.join(', ')}`,
      ...(sourcePageId  ? [``, `Source email in Notion:`, `  ${notionUrl(sourcePageId)}`]  : []),
      ...(meetingPageId ? [``, `Meeting record in Notion:`, `  ${notionUrl(meetingPageId)}`] : []),
      ...linkBlock(`Canon Change Requests (${canonRecordIds.length}):`, canonRecordIds),
      ...linkBlock(`Sensitive Review records (${sensitiveRecordIds.length}):`, sensitiveRecordIds),
      ``,
      `Open each link above to review, edit, and resolve the record directly in Notion.`,
    ].join('\n');

    try {
      await this.smtp.sendEmail(config.ADMIN_NOTIFICATION_EMAIL, subject, body);
      logger.info({ flags, sourceTitle, canonCount: canonRecordIds.length, sensitiveCount: sensitiveRecordIds.length }, 'Admin review notification sent');
    } catch (err) {
      logger.error({ err }, 'Failed to send admin review notification');
    }
  }
}
