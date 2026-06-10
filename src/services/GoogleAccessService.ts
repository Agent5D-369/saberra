import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';
import type { AccessStatus } from '../types';

export class GoogleAccessService {
  private readonly drive: drive_v3.Drive;

  constructor() {
    const config = getConfig();
    const auth = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Checks whether roots@amora.cr can access a Drive file.
   * `permanent: true` means the file is gone (404) — do NOT retry.
   * `permanent: false` with status Needs Access = permission issue, retry is appropriate.
   */
  async checkAccess(fileId: string): Promise<{ status: AccessStatus; permanent: boolean; mimeType?: string; name?: string }> {
    try {
      const res = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, capabilities',
      });
      const caps = res.data.capabilities;
      const canRead = caps?.canDownload === true || caps?.canCopy === true;
      if (!canRead) {
        return { status: 'Needs Access', permanent: false };
      }
      return {
        status: 'Confirmed',
        permanent: false,
        mimeType: res.data.mimeType ?? undefined,
        name: res.data.name ?? undefined,
      };
    } catch (err: unknown) {
      const code = this.extractErrorCode(err);
      if (code === 403 || code === 401) {
        logger.warn({ fileId, code }, 'Drive access denied (retryable)');
        return { status: 'Needs Access', permanent: false };
      }
      if (code === 404) {
        logger.warn({ fileId }, 'Drive file not found — permanent, skipping retry queue');
        return { status: 'Denied', permanent: true };
      }
      // Auth error = likely OAuth token issue — log distinctly
      if (code === 401) {
        logger.error({ fileId }, 'Drive auth error — Google OAuth token may be expired or revoked');
        return { status: 'Needs Access', permanent: false };
      }
      logger.error({ fileId, err }, 'Drive access check error');
      return { status: 'Denied', permanent: false };
    }
  }

  private extractErrorCode(err: unknown): number | null {
    if (err && typeof err === 'object') {
      const e = err as { code?: number; status?: number; response?: { status?: number } };
      return e.code ?? e.status ?? e.response?.status ?? null;
    }
    return null;
  }
}
