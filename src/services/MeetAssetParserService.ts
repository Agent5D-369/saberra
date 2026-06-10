import { NotionWriterService } from './NotionWriterService';
import { logger } from '../config/logger';
import type { ParsedEmail, AssetType, CaptureKey } from '../types';

const N = NotionWriterService;

// ─── Link extraction patterns ─────────────────────────────────────────────────

// Matches Drive file IDs in /d/, ?id=, &id= patterns.
// Deliberately excludes ?eid= (calendar event IDs) via the negative lookbehind.
const DRIVE_FILE_ID_RE = /(?:\/d\/|(?<![a-z])id=|\/file\/d\/)([a-zA-Z0-9_-]{25,})/;
const DOCS_ID_RE = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]{25,})/;
const MEET_CODE_RE = /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i;
const CALENDAR_EVENT_RE = /calendar\.google\.com.*?eid=([A-Za-z0-9_-]+)/;

const MONTH_NAMES = 'January|February|March|April|May|June|July|August|September|October|November|December';
const LONG_DATE_RE = new RegExp(`\\b(${MONTH_NAMES})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i');

export function extractDriveFileId(text: string): string | undefined {
  return text.match(DRIVE_FILE_ID_RE)?.[1];
}

export function extractDocId(text: string): string | undefined {
  return text.match(DOCS_ID_RE)?.[1];
}

export function extractMeetCode(text: string): string | undefined {
  return text.match(MEET_CODE_RE)?.[1];
}

export function extractCalendarEventId(text: string): string | undefined {
  return text.match(CALENDAR_EVENT_RE)?.[1];
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80);
}

function extractOrganizerEmail(from: string): string {
  const match = from.match(/<(.+?)>/);
  return match ? match[1] : from;
}

/** Try to find the actual meeting organizer email from the notification body. */
function extractOrganizerFromBody(text: string): string | null {
  const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const patterns = [
    // "organized by email@domain.com" or "organized by Name <email>"
    new RegExp(`organized by[^<\\n]*?(${EMAIL_RE.source})`, 'i'),
    // "email@domain.com invited you"
    new RegExp(`(${EMAIL_RE.source})\\s+invited you`, 'i'),
    // "Meeting host: email@domain.com"
    new RegExp(`(?:host|organizer)[:\\s]+[^<\\n]*?(${EMAIL_RE.source})`, 'i'),
  ];
  for (const p of patterns) {
    const m = text.match(p);
    // Exclude Google's own noreply addresses
    if (m?.[1] && !m[1].includes('noreply') && !m[1].includes('google.com')) return m[1];
  }
  return null;
}

/** Try to extract the actual meeting date from notification body/subject. */
function extractMeetingDateFromText(text: string): string | null {
  // ISO date first (most reliable if present)
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  // "May 21, 2026" or "21 May 2026"
  const longMatch = text.match(LONG_DATE_RE);
  if (longMatch) {
    const d = new Date(`${longMatch[1]} ${longMatch[2]} ${longMatch[3]}`);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  return null;
}

// ─── Capture Key ──────────────────────────────────────────────────────────────

export function buildCaptureKey(parsed: ParsedEmail): CaptureKey {
  const fullText = `${parsed.subject} ${parsed.bodyText} ${parsed.bodyHtml}`;
  const receivedDate = parsed.receivedDate.slice(0, 10);

  const calendarEventId = extractCalendarEventId(fullText);
  if (calendarEventId) {
    return { value: `cal:${calendarEventId}`, strategy: 'calendar_id' };
  }

  const meetCode = extractMeetCode(fullText);
  if (meetCode) {
    // Use body-extracted date so the same meeting doesn't split across two days
    const meetDate = extractMeetingDateFromText(fullText) ?? receivedDate;
    return { value: `meet:${meetCode}:${meetDate}`, strategy: 'meet_code_date' };
  }

  const subject = parsed.subject ?? '';
  if (subject.length > 5) {
    const organizer = extractOrganizerEmail(parsed.from);
    return {
      value: `title:${normalizeTitle(subject)}:${organizer.split('@')[1] ?? 'unknown'}:${receivedDate}`,
      strategy: 'title_organizer_date',
    };
  }

  const driveFileId = extractDriveFileId(fullText);
  if (driveFileId) {
    return { value: `drive:${driveFileId}`, strategy: 'drive_file_id' };
  }

  return { value: `msg:${parsed.messageId}`, strategy: 'thread_id' };
}

// ─── MeetAssetParserService ───────────────────────────────────────────────────

export class MeetAssetParserService {
  // ─── Meeting upsert ───────────────────────────────────────────────────────

  async upsertMeeting(
    notion: NotionWriterService,
    parsed: ParsedEmail,
    captureKey: CaptureKey,
    assetType: AssetType,
    assetLink: string | undefined,
  ): Promise<string> {
    const fullText = `${parsed.subject} ${parsed.bodyText} ${parsed.bodyHtml}`;
    const calendarEventId = extractCalendarEventId(fullText);
    const googleCalendarLink = calendarEventId
      ? `https://calendar.google.com/calendar/event?eid=${calendarEventId}`
      : undefined;

    const existing = await notion.findByRichText(
      notion.dbIds.meetings,
      'Capture Key',
      captureKey.value,
    );

    if (existing) {
      const linkProps = this.assetLinkProps(assetType, assetLink);
      await notion.updatePage(existing, {
        ...linkProps,
        ...(googleCalendarLink ? { 'Google Calendar Link': N.url(googleCalendarLink) } : {}),
      });
      logger.debug({ captureKey: captureKey.value, assetType }, 'Meeting record updated');
      return existing;
    }

    const meetingTitle = this.extractMeetingTitle(parsed);
    const meetingDate = extractMeetingDateFromText(fullText) ?? parsed.receivedDate.slice(0, 10);
    const organizer = extractOrganizerFromBody(fullText) ?? extractOrganizerEmail(parsed.from);

    const meetCode = extractMeetCode(fullText);
    const meetLink = meetCode ? `https://meet.google.com/${meetCode}` : undefined;

    const props: Record<string, unknown> = {
      'Meeting Title': N.title(meetingTitle),
      'Capture Key': N.richText(captureKey.value),
      'Meeting Date': N.date(meetingDate),
      'Google Meet Link': N.url(meetLink),
      'Google Calendar Link': N.url(googleCalendarLink),
      'Processing Status': N.select('Pending'),
      'Canon Review Required': N.checkbox(false),
      'Sensitive Review Required': N.checkbox(false),
      ...this.assetLinkProps(assetType, assetLink),
      ...this.assetAccessStatusProps(assetType, 'Unknown'),
    };

    const pageId = await notion.createPage(notion.dbIds.meetings, props);
    logger.info({ captureKey: captureKey.value, meetingTitle, organizer, meetingDate }, 'Meeting record created');
    return pageId;
  }

  private extractMeetingTitle(parsed: ParsedEmail): string {
    let subject = parsed.subject ?? '';

    // Strip leading emoji/symbol characters before first letter (e.g. "🗓 Title...")
    subject = subject.replace(/^[^a-zA-Z\[]+/, '');

    // Strip "Google meeting - " prefix (Google Workspace recording/transcript emails)
    subject = subject.replace(/^Google meeting\s*-\s*/i, '');

    // Strip Google notification prefixes: "Recording: ", "Transcript for ", "Invitation: ", etc.
    subject = subject.replace(/^(recording(?: of your google meet)?|transcript(?: for)?|notes(?: from your meeting)?|invitation|accepted|declined|updated invitation|cancelled)\s*:\s*/i, '');

    // Strip " - YYYY MM DD HH MM TZ - [AssetType]" suffix (Google Workspace email format)
    subject = subject.replace(/\s+-\s+\d{4}(?:\s+\d{2}){4,}.*$/i, '');

    // Strip " - Recording/Transcript/Notes" suffix
    subject = subject.replace(/\s+-\s+(?:Recording|Transcript|Notes)\s*$/i, '');

    // Strip " | Read Meeting Report" suffix (Google Calendar post-meeting summary)
    subject = subject.replace(/\s*\|\s*Read Meeting Report\s*$/i, '');

    // Strip " on [Date]" suffix from calendar-style subjects
    subject = subject.replace(/\s+on\s+\w+\s+\d{1,2},\s+\d{4}\s*$/i, '');

    // Strip Google Calendar time suffix: " @ Wed May 28, 2026 11am - 11:30am (PDT) (user@domain)"
    subject = subject.replace(/\s+@\s+\w{3}\s+\w+\s+\d{1,2},\s+\d{4}.*/i, '');

    return subject.trim() || 'Untitled Meeting';
  }

  private assetLinkProps(assetType: AssetType, link?: string): Record<string, unknown> {
    if (!link) return {};
    switch (assetType) {
      case 'Recording':    return { 'Recording Link': N.url(link) };
      case 'Transcript':   return { 'Transcript Link': N.url(link) };
      case 'Gemini Notes': return { 'Notes Link': N.url(link) };
      default:             return {};
    }
  }

  private assetAccessStatusProps(assetType: AssetType, status: string): Record<string, unknown> {
    switch (assetType) {
      case 'Recording':    return { 'Recording Access Status': N.select(status) };
      case 'Transcript':   return { 'Transcript Access Status': N.select(status) };
      case 'Gemini Notes': return { 'Notes Access Status': N.select(status) };
      default:             return {};
    }
  }

  // ─── Meeting Asset upsert ─────────────────────────────────────────────────

  async upsertMeetingAsset(
    notion: NotionWriterService,
    parsed: ParsedEmail,
    meetingPageId: string,
    assetType: AssetType,
    driveFileId: string | undefined,
    driveLink: string | undefined,
  ): Promise<string> {
    const existing = await this.findExistingAsset(notion, meetingPageId, assetType);

    if (existing) {
      logger.debug({ assetType, meetingPageId }, 'Meeting asset already exists — skipping');
      return existing;
    }

    const assetName = `${assetType} - ${parsed.receivedDate.slice(0, 10)}`;
    const pageId = await notion.createPage(notion.dbIds.meetingAssets, {
      'Asset Name': N.title(assetName),
      'Asset Type': N.select(assetType),
      Meeting: N.relation([meetingPageId]),
      'Google Drive File ID': N.richText(driveFileId ?? null),
      'Google Drive Link': N.url(driveLink ?? null),
      'Access Status': N.select('Unknown'),
      'Processing Status': N.select('Pending'),
      'Received At': N.date(parsed.receivedDate),
      'Retry Count': N.number(0),
    });

    logger.info({ assetType, meetingPageId }, 'Meeting asset created');
    return pageId;
  }

  private async findExistingAsset(
    notion: NotionWriterService,
    meetingPageId: string,
    assetType: AssetType,
  ): Promise<string | null> {
    const results = await notion.queryDatabase(
      notion.dbIds.meetingAssets,
      {
        and: [
          { property: 'Asset Type', select: { equals: assetType } },
          { property: 'Meeting', relation: { contains: meetingPageId } },
        ],
      },
      1,
    );
    return results.length > 0 ? results[0].id : null;
  }

  // ─── Message record (operational emails) ─────────────────────────────────

  async createMessageRecord(
    notion: NotionWriterService,
    parsed: ParsedEmail,
  ): Promise<string> {
    const subject = parsed.subject || '(no subject)';
    const pageId = await notion.createPage(notion.dbIds.messages, {
      'Message Title': N.title(subject),
      Recipients: N.richText([parsed.to, parsed.cc].filter(Boolean).join('; ')),
      Date: N.date(parsed.receivedDate),
      'Processing Status': N.select('Processed'),
      'Follow-Up Needed': N.checkbox(false),
      'Confidentiality Level': N.select('Standard'),
    });

    // Resolve or auto-create sender profile, then link to message
    try {
      const senderEmail = parsed.from.match(/<(.+?)>/)?.[1]?.trim() ?? parsed.from.trim();
      const senderName  = parsed.from.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim() ?? null;
      const today = new Date().toISOString().slice(0, 10);
      let profileId: string | null = null;

      if (senderEmail.includes('@')) {
        profileId = await notion.findByEmail(notion.dbIds.profiles, 'Email', senderEmail);
      }
      if (!profileId && senderName) {
        profileId = await notion.findByTitle(notion.dbIds.profiles, 'Name', senderName);
      }
      if (!profileId) {
        const displayName = senderName || (senderEmail.includes('@') ? senderEmail.split('@')[0] : senderEmail);
        profileId = await notion.createPage(notion.dbIds.profiles, {
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
      if (profileId) {
        await notion.updatePage(pageId, { 'Sender Profile': N.relation([profileId]) });
      }
    } catch (err) { logger.warn({ err }, 'Failed to resolve/link sender profile for message — skipping'); }

    logger.info({ subject, from: parsed.from }, 'Message record created');
    return pageId;
  }

  // ─── Parse a Google Meet asset email ─────────────────────────────────────

  parseAssetEmail(parsed: ParsedEmail): {
    assetType: AssetType;
    driveFileId: string | undefined;
    docId: string | undefined;
    driveLink: string | undefined;
    captureKey: CaptureKey;
    organizer: string;
  } {
    const fullText = `${parsed.subject} ${parsed.bodyText} ${parsed.bodyHtml}`;
    const driveFileId = extractDriveFileId(fullText);
    const docId = extractDocId(fullText);
    const captureKey = buildCaptureKey(parsed);
    const organizer = extractOrganizerFromBody(fullText) ?? extractOrganizerEmail(parsed.from);

    const driveLink = parsed.detectedLinks.find(
      (l) => l.includes('docs.google.com') || l.includes('drive.google.com'),
    );

    let assetType: AssetType = 'Unknown';
    switch (parsed.emailType) {
      case 'Google Meet Recording':  assetType = 'Recording'; break;
      case 'Google Meet Transcript': assetType = 'Transcript'; break;
      case 'Google Meet Notes':      assetType = 'Gemini Notes'; break;
    }

    return { assetType, driveFileId, docId, driveLink, captureKey, organizer };
  }
}
