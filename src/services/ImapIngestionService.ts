import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { google } from 'googleapis';
import { getConfig } from '../config/ConfigService';
import { NotionWriterService } from './NotionWriterService';
import { logger } from '../config/logger';
import type { ParsedEmail } from '../types';

const N = NotionWriterService;

const MEET_EMAIL_TYPES = ['Google Meet Recording', 'Google Meet Transcript', 'Google Meet Notes'] as const;

export class ImapIngestionService {
  private async createClient(): Promise<ImapFlow> {
    const config = getConfig();

    let auth: { user: string; pass?: string; accessToken?: string };
    if (config.IMAP_PASS) {
      auth = { user: config.IMAP_USER, pass: config.IMAP_PASS };
    } else {
      // No IMAP password - use OAuth2 access token (Google Workspace / Gmail)
      const oauth2 = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET);
      oauth2.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
      const { token } = await oauth2.getAccessToken();
      if (!token) throw new Error('Failed to obtain IMAP access token from Google refresh token');
      auth = { user: config.IMAP_USER, accessToken: token };
    }

    return new ImapFlow({
      host: config.IMAP_HOST,
      port: config.IMAP_PORT,
      secure: config.IMAP_PORT === 993,
      auth,
      logger: false,
    });
  }

  // ─── Polling ──────────────────────────────────────────────────────────────

  /** Fetches unseen messages WITHOUT marking them seen. Caller must call markMessagesSeen(uids) after processing. */
  async fetchUnseenMessages(): Promise<{ messages: ParsedEmail[]; uids: number[] }> {
    const client = await this.createClient();
    await client.connect();

    const results: ParsedEmail[] = [];
    let uids: number[] = [];
    const lock = await client.getMailboxLock('INBOX');

    try {
      const searchResult = await client.search({ seen: false }, { uid: true });
      uids = Array.isArray(searchResult) ? searchResult : [];

      for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
        try {
          if (!msg.source) continue;
          const mail = await simpleParser(msg.source as Buffer);
          results.push(this.toParsedEmail(msg.uid, mail));
        } catch (err) {
          logger.warn({ uid: msg.uid, err }, 'Failed to parse IMAP message — skipping');
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }

    return { messages: results, uids };
  }

  /** Marks the given UIDs as seen on IMAP. Call this AFTER all messages have been processed. */
  async markMessagesSeen(uids: number[]): Promise<void> {
    if (!uids.length) return;
    const client = await this.createClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
      logger.debug({ count: uids.length }, 'IMAP messages marked as seen');
    } finally {
      lock.release();
      await client.logout();
    }
  }

  // ─── Parse ────────────────────────────────────────────────────────────────

  private toParsedEmail(uid: number, mail: Awaited<ReturnType<typeof simpleParser>>): ParsedEmail {
    const bodyText = mail.text ?? '';
    const bodyHtml = typeof mail.html === 'string' ? mail.html : '';
    const fullText = bodyText || bodyHtml;
    const messageId = mail.messageId ?? `imap-uid-${uid}`;
    const receivedDate = (mail.date ?? new Date()).toISOString();
    const threadReference = mail.inReplyTo
      ?? (Array.isArray(mail.references) ? mail.references[0] : undefined)
      ?? undefined;

    const rawAttachments = (mail.attachments ?? [])
      .filter((a) => !a.related && a.contentDisposition !== 'inline' && a.content instanceof Buffer)
      .map((a) => ({
        filename: a.filename ?? 'attachment',
        contentType: a.contentType ?? 'application/octet-stream',
        content: a.content as Buffer,
      }));

    return {
      messageId,
      threadReference,
      from: mail.from?.text ?? '',
      to: mail.to ? (Array.isArray(mail.to) ? mail.to.map((a: { text: string }) => a.text).join(', ') : mail.to.text) : '',
      cc: mail.cc ? (Array.isArray(mail.cc) ? mail.cc.map((a: { text: string }) => a.text).join(', ') : mail.cc.text) : '',
      subject: mail.subject ?? '(no subject)',
      receivedDate,
      bodyText,
      bodyHtml,
      emailType: 'Unknown',
      detectedLinks: this.extractLinks(fullText),
      rawAttachments,
    };
  }

  private extractLinks(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s"'<>)]+/g;
    return [...new Set(text.match(urlRegex) ?? [])];
  }

  // ─── Notion deduplication ─────────────────────────────────────────────────

  async isAlreadyProcessed(notion: NotionWriterService, messageId: string): Promise<boolean> {
    const existing = await notion.findByRichText(
      notion.dbIds.sourceEmails,
      'Message ID',
      messageId,
    );
    return existing !== null;
  }

  // ─── Source Email record ──────────────────────────────────────────────────

  async createSourceEmailRecord(
    notion: NotionWriterService,
    parsed: ParsedEmail,
    processingStatus = 'Processing',
  ): Promise<string> {
    const subject = parsed.subject || '(no subject)';
    const sourceCategory = (MEET_EMAIL_TYPES as readonly string[]).includes(parsed.emailType)
      ? 'Meeting Asset'
      : parsed.emailType === 'Unknown' ? 'Unknown' : 'Operational';

    // BCC heuristic: roots received the message but is not in To or CC
    const rootsEmail = getConfig().ROOTS_EMAIL.toLowerCase();
    const bccIndicator = parsed.to !== '' &&
      !parsed.to.toLowerCase().includes(rootsEmail) &&
      !parsed.cc.toLowerCase().includes(rootsEmail);

    return notion.createPage(notion.dbIds.sourceEmails, {
      Title: N.title(subject),
      'Message ID': N.richText(parsed.messageId),
      'Thread Reference': N.richText(parsed.threadReference ?? null),
      From: N.richText(parsed.from),
      To: N.richText(parsed.to),
      CC: N.richText(parsed.cc),
      'BCC Indicator': N.checkbox(bccIndicator),
      'Received Date': N.date(parsed.receivedDate),
      Subject: N.richText(parsed.subject),
      'Email Type': N.select(parsed.emailType),
      'Source Category': N.select(sourceCategory),
      'Raw Snippet': N.richText(
        (parsed.bodyText.trim() || parsed.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 500),
      ),
      'Detected Links': N.richText(parsed.detectedLinks.slice(0, 20).join('\n')),
      'Processing Status': N.select(processingStatus),
    });
  }

  async updateSourceEmailStatus(
    notion: NotionWriterService,
    pageId: string,
    status: string,
    emailType?: string,
    errorLog?: string,
  ): Promise<void> {
    await notion.updatePage(pageId, {
      'Processing Status': N.select(status),
      ...(emailType ? { 'Email Type': N.select(emailType) } : {}),
      'Error Log': N.richText(errorLog ?? ''),
      ...(status === 'Processed' || status === 'Failed' ? { 'Processed At': N.date(new Date().toISOString()) } : {}),
    });
  }
}
