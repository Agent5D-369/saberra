import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';
import { PluginService } from '../plugins/PluginService';

// RFC 2047 base64 encoded-word encoding for email Subject headers.
// Required whenever the subject contains non-ASCII characters (e.g. accented chars
// decoded from MIME emails). Without this, raw UTF-8 bytes in the Subject header
// are misinterpreted by receiving clients as Latin-1, causing mojibake.
function encodeSubject(subject: string): string {
  if (!/[^\x00-\x7F]/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
}

export class SmtpService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    if (PluginService.getInstance().suppressEmail()) {
      logger.info({ to, subject }, 'Outbound email suppressed by tenant plugin');
      return;
    }

    const config = getConfig();
    const safeTo = to.replace(/[\r\n]/g, '');

    // Primary path: standard SMTP via nodemailer.
    // Used when SMTP_HOST + SMTP_USER + SMTP_PASS are all set.
    // Port 465 = implicit TLS (secure: true). Port 587 = STARTTLS (secure: false).
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      const port = config.SMTP_PORT ?? 465;
      const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
      });

      await transporter.sendMail({
        from: config.SMTP_USER,
        to: safeTo,
        subject,
        text: body,
      });

      logger.info({ to, subject, host: config.SMTP_HOST }, 'Email sent via SMTP');
      return;
    }

    // Fallback: Gmail API. Used when SMTP vars are absent (e.g. Google Workspace
    // deployments that authenticate purely via OAuth without a separate SMTP host).
    const auth = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = [
      `From: ${config.ROOTS_EMAIL}`,
      `To: ${safeTo}`,
      `Subject: ${encodeSubject(subject)}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: Buffer.from(raw).toString('base64url') },
    });

    logger.info({ to, subject }, 'Email sent via Gmail API');
  }
}
