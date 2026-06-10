import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';

const INBOX_FOLDER_NAME = 'Meeting Assets'; // folder name inside org Shared Drive, or personal Drive fallback

const CONVERTIBLE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'text/rtf',
]);

export class GoogleDriveUploadService {
  private readonly drive: drive_v3.Drive;
  private readonly orgSharedDriveId: string | null;
  private readonly orgInboxFolderId: string | null;
  private inboxFolderId: string | null = null;
  private inboxPermissionSet  = false;

  constructor() {
    const config = getConfig();
    const auth = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
    this.drive = google.drive({ version: 'v3', auth });
    this.orgSharedDriveId  = config.ORG_SHARED_DRIVE_ID ?? null;
    this.orgInboxFolderId  = config.ORG_SHARED_DRIVE_INBOX_FOLDER_ID ?? null;
  }

  /**
   * Sets "anyone with the link can view" on a Drive file or folder.
   * roots@amora.cr remains the owner (sole editor/deleter).
   */
  private async setAnyoneCanView(fileId: string, label: string): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        fields: 'id',
      });
      logger.info({ fileId, label }, 'Drive viewer permission set (anyone with link)');
    } catch (err) {
      // Non-fatal — file is still usable, just not broadly viewable
      logger.warn({ fileId, label, err }, 'Could not set Drive viewer permission');
    }
  }

  isConvertible(mimeType: string): boolean {
    return CONVERTIBLE_TYPES.has(mimeType);
  }

  async getOrCreateInboxFolder(): Promise<string> {
    if (this.inboxFolderId) return this.inboxFolderId;

    // Prefer the org Shared Drive inbox folder when configured
    if (this.orgInboxFolderId) {
      this.inboxFolderId = this.orgInboxFolderId;
      logger.info({ folderId: this.inboxFolderId }, 'Using org Shared Drive Meeting Assets folder');
      return this.inboxFolderId;
    }

    // Fall back: find or create a personal Drive folder
    const listParams: drive_v3.Params$Resource$Files$List = {
      q: `name = '${INBOX_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
      pageSize: 1,
    };
    if (this.orgSharedDriveId) {
      listParams.driveId = this.orgSharedDriveId;
      listParams.includeItemsFromAllDrives = true;
      listParams.supportsAllDrives = true;
      listParams.corpora = 'drive';
    }

    const res = await this.drive.files.list(listParams);

    if (res.data.files?.length) {
      this.inboxFolderId = res.data.files[0].id!;
      if (!this.inboxPermissionSet && !this.orgSharedDriveId) {
        await this.setAnyoneCanView(this.inboxFolderId, INBOX_FOLDER_NAME);
        this.inboxPermissionSet = true;
      }
      return this.inboxFolderId;
    }

    const createParams: drive_v3.Params$Resource$Files$Create = {
      requestBody: {
        name: INBOX_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        ...(this.orgSharedDriveId ? { parents: [this.orgSharedDriveId] } : {}),
      },
      fields: 'id',
      ...(this.orgSharedDriveId ? { supportsAllDrives: true } : {}),
    };

    const folder = await this.drive.files.create(createParams);
    this.inboxFolderId = folder.data.id!;
    logger.info({ folderId: this.inboxFolderId, inSharedDrive: Boolean(this.orgSharedDriveId) }, 'Created Meeting Assets folder in Drive');
    if (!this.orgSharedDriveId) {
      await this.setAnyoneCanView(this.inboxFolderId, INBOX_FOLDER_NAME);
    }
    this.inboxPermissionSet = true;
    return this.inboxFolderId;
  }

  /**
   * Uploads a PDF or Office document to Drive, converting it to a Google Doc on the way.
   * Returns the Google Doc file ID, which can be passed to GoogleDocsExportService.exportAsText().
   */
  async uploadAndConvertToDoc(buffer: Buffer, filename: string, sourceMimeType: string): Promise<string | null> {
    try {
      const folderId = await this.getOrCreateInboxFolder();
      const res = await this.drive.files.create({
        supportsAllDrives: true,
        requestBody: {
          name: filename,
          mimeType: 'application/vnd.google-apps.document',
          parents: [folderId],
        },
        media: {
          mimeType: sourceMimeType,
          body: Readable.from(buffer),
        },
        fields: 'id',
      });
      const docId = res.data.id ?? null;
      if (docId) logger.info({ filename, docId, inSharedDrive: Boolean(this.orgSharedDriveId) }, 'Attachment uploaded and converted to Google Doc');
      return docId;
    } catch (err) {
      logger.error({ filename, err }, 'Drive upload/convert failed');
      return null;
    }
  }

  /**
   * Archives a raw file to the Living Memory Inbox folder without conversion.
   * Returns the Drive file ID.
   */
  async archiveFile(buffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
    try {
      const folderId = await this.getOrCreateInboxFolder();
      const res = await this.drive.files.create({
        supportsAllDrives: true,
        requestBody: {
          name: filename,
          mimeType,
          parents: [folderId],
        },
        media: {
          mimeType,
          body: Readable.from(buffer),
        },
        fields: 'id',
      });
      const fileId = res.data.id ?? null;
      if (fileId) logger.info({ filename, fileId, inSharedDrive: Boolean(this.orgSharedDriveId) }, 'Attachment archived to Drive');
      return fileId;
    } catch (err) {
      logger.error({ filename, err }, 'Drive archive failed');
      return null;
    }
  }
}
