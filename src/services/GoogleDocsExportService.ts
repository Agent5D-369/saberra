import { google } from 'googleapis';
import type { docs_v1 } from 'googleapis';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';

export class GoogleDocsExportService {
  private readonly docs: docs_v1.Docs;

  constructor() {
    const config = getConfig();
    const auth = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
    this.docs = google.docs({ version: 'v1', auth });
  }

  /**
   * Exports a Google Doc as plain text.
   * Returns the full text content, or null if export fails.
   */
  async exportAsText(docId: string): Promise<string | null> {
    try {
      const res = await this.docs.documents.get({ documentId: docId });
      const doc = res.data;
      const text = this.extractText(doc);
      logger.info({ docId, chars: text.length }, 'Doc exported as text');
      return text;
    } catch (err) {
      logger.error({ docId, err }, 'Doc text export failed');
      return null;
    }
  }

  private extractText(doc: docs_v1.Schema$Document): string {
    const lines: string[] = [];

    for (const element of doc.body?.content ?? []) {
      if (element.paragraph) {
        const paragraphText = (element.paragraph.elements ?? [])
          .map((el) => el.textRun?.content ?? '')
          .join('');
        if (paragraphText.trim()) lines.push(paragraphText);
      } else if (element.table) {
        for (const row of element.table.tableRows ?? []) {
          const cells = (row.tableCells ?? [])
            .map((cell) =>
              (cell.content ?? [])
                .flatMap((c) =>
                  (c.paragraph?.elements ?? []).map((e) => e.textRun?.content ?? ''),
                )
                .join('')
                .trim(),
            )
            .filter(Boolean);
          if (cells.length) lines.push(cells.join(' | '));
        }
      }
    }

    return lines.join('\n').trim();
  }
}
