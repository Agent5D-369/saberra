import type { ParsedEmail, EmailType } from '../types';
import { getConfig } from '../config/ConfigService';

// Calendar invite subjects always start with "Invitation:" (or localised variants).
// These emails are NOT asset notifications — they're scheduling emails. Skip Meet
// asset classification entirely so the body's join link + incidental words like
// "recording" don't trigger a false positive.
const CALENDAR_INVITE_SUBJECT_RE = /^(invitation|accepted|declined|tentative|updated invitation|cancelled):/i;

// Patterns sourced from Google's notification email formats
// NOTE: body patterns must be tight enough not to match across the full flattened
// body of a calendar invite that happens to contain a meet link + the word "recording".
const RECORDING_PATTERNS = [
  /recording of your google meet/i,
  /your meet recording is ready/i,
  /meet recording is available/i,
  /drive\.google\.com.*recording/i,
  // Google Workspace subject: "Google meeting - [title] - [datetime] - Recording"
  /^Google meeting\b.*\bRecording$/i,
  // Generic "- Recording" suffix on a Google-origin email
  / - Recording$/i,
];

const TRANSCRIPT_PATTERNS = [
  /transcript.*google meet/i,
  /transcript is ready/i,
  /transcript for your meeting/i,
  // Google Workspace subject: "Google meeting - [title] - [datetime] - Transcript"
  /^Google meeting\b.*\bTranscript$/i,
  / - Transcript$/i,
];

const NOTES_PATTERNS = [
  /gemini.*notes/i,
  /meet notes/i,
  /notes from your meeting/i,
  /ai-generated notes/i,
  /meeting notes.*google meet/i,
  // Google Workspace: "Google meeting - [title] - [datetime] - Notes"
  /^Google meeting\b.*\bNotes$/i,
  / - Notes$/i,
];

// Governance agenda trigger: subject must contain [GOVERNANCE AGENDA]
const GOVERNANCE_AGENDA_RE = /\[governance agenda\]/i;

// Subject/sender heuristics for forwarded or CC/BCC'd threads
const FORWARDED_PATTERNS = [
  /^fwd?:/i,
  /^fw:/i,
];

const CAPTURE_PATTERNS = [
  /\[amora capture\]/i,
  /\[capture\]/i,
];

export class EmailClassifierService {
  classify(email: ParsedEmail): EmailType {
    const subject = email.subject ?? '';
    const body = email.bodyText + ' ' + email.bodyHtml;
    const from = email.from ?? '';

    // Google Meet asset emails originate from Google accounts.
    // Secondary path: non-Google sender but body contains a Drive/Docs link alongside asset
    // patterns — covers forwarded notifications and test emails.
    const isFromGoogle = from.includes('@google.com');
    const hasDriveOrDocsLink = /(?:drive|docs)\.google\.com/i.test(body);

    // Governance agenda trigger — highest priority, checked before Meet asset patterns
    if (GOVERNANCE_AGENDA_RE.test(subject)) {
      return 'Governance Agenda Request';
    }

    // Calendar invite/update emails — never a Meet asset, always skip to operational path
    if (CALENDAR_INVITE_SUBJECT_RE.test(subject)) {
      return 'Operational Email';
    }

    if (isFromGoogle || hasDriveOrDocsLink) {
      if (RECORDING_PATTERNS.some((p) => p.test(subject) || p.test(body))) {
        return 'Google Meet Recording';
      }
      if (TRANSCRIPT_PATTERNS.some((p) => p.test(subject) || p.test(body))) {
        return 'Google Meet Transcript';
      }
      if (NOTES_PATTERNS.some((p) => p.test(subject) || p.test(body))) {
        return 'Google Meet Notes';
      }
    }

    if (FORWARDED_PATTERNS.some((p) => p.test(subject))) {
      return 'Forwarded Thread';
    }

    if (CAPTURE_PATTERNS.some((p) => p.test(subject))) {
      return 'Operational Email';
    }

    // Emails that were CC'd or BCC'd (BCC detection is heuristic — the 'to' field won't contain roots)
    const config_roots = getConfig().ROOTS_EMAIL;
    const isDirectlyAddressed =
      email.to.toLowerCase().includes(config_roots.toLowerCase()) ||
      email.cc.toLowerCase().includes(config_roots.toLowerCase());

    if (!isDirectlyAddressed && email.to !== '') {
      // BCC indicator: roots is not in To or CC but received the message
      return 'Operational Email';
    }

    if (isDirectlyAddressed) {
      return 'Operational Email';
    }

    return 'Unknown';
  }
}
