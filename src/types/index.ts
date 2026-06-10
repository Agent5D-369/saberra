export type EmailType =
  | 'Google Meet Recording'
  | 'Google Meet Transcript'
  | 'Google Meet Notes'
  | 'Operational Email'
  | 'Forwarded Thread'
  | 'Governance Agenda Request'
  | 'Unknown';

export type ProcessingStatus =
  | 'Pending'
  | 'Processing'
  | 'Processed'
  | 'Needs Access'
  | 'Failed'
  | 'Manual Review';

export type AccessStatus = 'Confirmed' | 'Needs Access' | 'Denied' | 'Unknown';

export type AssetType =
  | 'Recording'
  | 'Transcript'
  | 'Gemini Notes'
  | 'Chat Log'
  | 'Caption File'
  | 'Attachment'
  | 'Unknown';

export interface RawAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface ParsedEmail {
  messageId: string;
  threadReference?: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  receivedDate: string;
  bodyText: string;
  bodyHtml: string;
  emailType: EmailType;
  detectedLinks: string[];
  rawAttachments: RawAttachment[];
  driveFileId?: string;
  docId?: string;
  meetCode?: string;
  calendarEventId?: string;
}

export interface CaptureKey {
  value: string;
  strategy: 'calendar_id' | 'meet_code_date' | 'title_organizer_date' | 'drive_file_id' | 'thread_id';
}

export interface ProcessingEvent {
  tenantId: string;
  sourceType: string;
  sourceId: string;
  eventType: string;
  status: 'Info' | 'Success' | 'Error' | 'Warning';
  startedAt: string;
  error?: string;
  tokenEstimate?: number;
}
