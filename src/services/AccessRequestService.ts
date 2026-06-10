import { SmtpService } from './SmtpService';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';

function orgSharedDriveUrl(): string | null {
  const id = getConfig().ORG_SHARED_DRIVE_ID;
  return id ? `https://drive.google.com/drive/folders/${id}` : null;
}

const ACCESS_REQUEST_TEMPLATE = (
  meetingTitle: string,
  assetLink: string,
  organizerEmail: string | undefined,
  sharedDriveUrl: string | null,
) => `The Amora Living Memory Hub received a meeting asset that roots@amora.cr cannot access.

Meeting: ${meetingTitle}
Asset link: ${assetLink}
${organizerEmail ? `Organizer: ${organizerEmail}` : ''}

OPTION 1 (quickest): Share the asset directly with roots@amora.cr
The system will automatically retry within 30 minutes once access is granted.

${sharedDriveUrl ? `OPTION 2 (best long-term): Move the file into the Amora org Shared Drive
All files in the org Shared Drive are automatically accessible to roots@amora.cr
and visible to all members with Drive access - no manual sharing needed.
Org Drive: ${sharedDriveUrl}
Place meeting assets in the "Meeting Assets" folder.

` : ''}To request access from the organizer, contact: ${organizerEmail ?? 'the meeting organizer'}

--
Amora Living Memory Hub (automated message)
`;

export class AccessRequestService {
  constructor(private readonly smtp: SmtpService) {}

  async sendAccessRequest(
    adminEmail: string,
    meetingTitle: string,
    assetLink: string,
    organizerEmail?: string,
  ): Promise<void> {
    const config = getConfig();
    const subject = `[AMORA] Access needed - ${meetingTitle}`;
    const body = ACCESS_REQUEST_TEMPLATE(meetingTitle, assetLink, organizerEmail, orgSharedDriveUrl());

    try {
      await this.smtp.sendEmail(adminEmail, subject, body);
      logger.info({ to: adminEmail, meetingTitle }, 'Access request notification sent to admin');
    } catch (err) {
      logger.error({ err, to: adminEmail }, 'Failed to send access request email');
      // Secondary attempt to ROOTS_EMAIL as fallback
      try {
        await this.smtp.sendEmail(
          config.ROOTS_EMAIL,
          `[AMORA] Access request failed - ${meetingTitle}`,
          `Could not send access notification to ${adminEmail} for asset:\n${assetLink}\n\nError: ${err instanceof Error ? err.message : String(err)}`,
        );
      } catch {
        logger.error({ admin: adminEmail }, 'Failed to send fallback access notification');
      }
    }
  }

  async notifyAdminOfEscalation(meetingTitle: string, assetPageId: string, assetLink?: string): Promise<void> {
    const config = getConfig();
    const notionUrl = `https://notion.so/${assetPageId.replace(/-/g, '')}`;
    const subject = `[AMORA] Manual Review Required - ${meetingTitle}`;
    const body = `An asset for the following meeting could not be processed after all retries:\n\nMeeting: ${meetingTitle}\nNotion Asset Page: ${notionUrl}\n${assetLink ? `Asset Link: ${assetLink}\n` : ''}\nPlease review and grant access manually.`;

    try {
      await this.smtp.sendEmail(config.ADMIN_NOTIFICATION_EMAIL, subject, body);
    } catch (err) {
      logger.error({ err }, 'Failed to send escalation notification to admin');
    }
  }
}
