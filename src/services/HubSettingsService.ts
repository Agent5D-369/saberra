import { Client as NotionClient } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { getConfig } from '../config/ConfigService';
import { logger } from '../config/logger';

const REFRESH_MS = 2 * 60 * 1000; // 2 minutes

export type CorrectionMode = 'A' | 'B' | 'C' | 'D';

export type DbWritePermissions = Record<string, { create: boolean; update: boolean }>;

// These databases are infrastructure — always writable regardless of permissions settings.
const LOCKED_DBS = new Set([
  'sourceEmails', 'meetings', 'meetingAssets',
  'processingEvents', 'sensitiveReview', 'policies',
]);

export interface HubSettings {
  governingPurpose: string | null;
  purposeTest: string | null;
  outputLanguage: string;
  correctionMode: CorrectionMode;
  dbPermissions: DbWritePermissions;
  lastRefreshed: Date | null;
  source: 'notion' | 'env';
}

export class HubSettingsService {
  private static instance: HubSettingsService;
  private notion: NotionClient;
  private pageId: string | null;
  private settings: HubSettings;
  private timer: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    const config = getConfig();
    this.notion = new NotionClient({ auth: config.NOTION_API_KEY });
    this.pageId = process.env.NOTION_HUB_SETTINGS_PAGE_ID ?? null;
    const rawCorrectionMode = process.env.RECORD_CORRECTION_MODE ?? 'B';
    this.settings = {
      governingPurpose: process.env.GOVERNING_PURPOSE ?? process.env.AMORA_GOVERNING_PURPOSE ?? null,
      purposeTest: process.env.PURPOSE_TEST ?? process.env.AMORA_PURPOSE_TEST ?? null,
      outputLanguage: process.env.EXTRACTION_LANGUAGE ?? process.env.OUTPUT_LANGUAGE ?? 'English',
      correctionMode: (['A', 'B', 'C', 'D'].includes(rawCorrectionMode) ? rawCorrectionMode : 'B') as CorrectionMode,
      dbPermissions: {},
      lastRefreshed: null,
      source: 'env',
    };
  }

  static getInstance(): HubSettingsService {
    if (!HubSettingsService.instance) {
      HubSettingsService.instance = new HubSettingsService();
    }
    return HubSettingsService.instance;
  }

  /** Call once at service startup. Loads from Notion and starts background refresh. */
  async init(): Promise<void> {
    if (!this.pageId) return;
    await this.refresh();
    this.timer = setInterval(() => { this.refresh().catch(() => {}); }, REFRESH_MS);
  }

  get governingPurpose(): string | null { return this.settings.governingPurpose; }
  get purposeTest(): string | null { return this.settings.purposeTest; }
  get outputLanguage(): string { return this.settings.outputLanguage; }
  get correctionMode(): CorrectionMode { return this.settings.correctionMode; }
  get dbPermissions(): DbWritePermissions { return this.settings.dbPermissions; }

  canCreate(dbKey: string): boolean {
    if (LOCKED_DBS.has(dbKey)) return true;
    const p = this.settings.dbPermissions[dbKey];
    return p === undefined ? true : p.create;
  }

  canUpdate(dbKey: string): boolean {
    if (LOCKED_DBS.has(dbKey)) return true;
    const p = this.settings.dbPermissions[dbKey];
    return p === undefined ? true : p.update;
  }

  getSettings(): HubSettings { return { ...this.settings }; }

  async updateGoverningPurpose(text: string): Promise<void> {
    if (!this.pageId) throw new Error('NOTION_HUB_SETTINGS_PAGE_ID not set');
    await this.writeBlock('governing_purpose', text.trim());
    this.settings.governingPurpose = text.trim();
    logger.info('Hub Settings: governing_purpose updated');
  }

  async updatePurposeTest(text: string): Promise<void> {
    if (!this.pageId) throw new Error('NOTION_HUB_SETTINGS_PAGE_ID not set');
    await this.writeBlock('purpose_test', text.trim());
    this.settings.purposeTest = text.trim();
    logger.info('Hub Settings: purpose_test updated');
  }

  async updateOutputLanguage(language: string): Promise<void> {
    if (!this.pageId) throw new Error('NOTION_HUB_SETTINGS_PAGE_ID not set');
    await this.writeBlock('output_language', language.trim());
    this.settings.outputLanguage = language.trim();
    logger.info({ language }, 'Hub Settings: output_language updated');
  }

  async updateCorrectionMode(mode: CorrectionMode): Promise<void> {
    if (!this.pageId) throw new Error('NOTION_HUB_SETTINGS_PAGE_ID not set');
    await this.writeBlock('record_correction_mode', mode);
    this.settings.correctionMode = mode;
    logger.info({ mode }, 'Hub Settings: record_correction_mode updated');
  }

  async updateDbPermissions(permissions: DbWritePermissions): Promise<void> {
    if (!this.pageId) throw new Error('NOTION_HUB_SETTINGS_PAGE_ID not set');
    await this.writeBlock('db_permissions', JSON.stringify(permissions));
    this.settings.dbPermissions = permissions;
    logger.info('Hub Settings: db_permissions updated');
  }

  private async refresh(): Promise<void> {
    if (!this.pageId) return;
    try {
      const resp = await this.notion.blocks.children.list({ block_id: this.pageId, page_size: 50 });
      const blocks = resp.results as BlockObjectResponse[];
      const gps = this.extractValue(blocks, 'governing_purpose');
      const pt = this.extractValue(blocks, 'purpose_test');
      const lang = this.extractValue(blocks, 'output_language');
      const corrMode = this.extractValue(blocks, 'record_correction_mode');
      if (gps !== null) this.settings.governingPurpose = gps;
      if (pt !== null) this.settings.purposeTest = pt;
      if (lang) this.settings.outputLanguage = lang;
      if (corrMode) {
        const upper = corrMode.trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(upper)) this.settings.correctionMode = upper as CorrectionMode;
      }
      const dbPermsRaw = this.extractValue(blocks, 'db_permissions');
      if (dbPermsRaw) {
        try { this.settings.dbPermissions = JSON.parse(dbPermsRaw) as DbWritePermissions; } catch {}
      }
      this.settings.lastRefreshed = new Date();
      this.settings.source = 'notion';
    } catch (err) {
      logger.warn({ err }, 'HubSettingsService: failed to refresh from Notion, using cached values');
    }
  }

  private extractValue(blocks: BlockObjectResponse[], key: string): string | null {
    for (let i = 0; i < blocks.length - 1; i++) {
      const b = blocks[i] as any;
      if (b.type === 'heading_2') {
        const heading = (b.heading_2?.rich_text ?? []).map((t: any) => t.plain_text).join('');
        if (heading === key) {
          const next = blocks[i + 1] as any;
          if (next?.type === 'paragraph') {
            return (next.paragraph?.rich_text ?? []).map((t: any) => t.plain_text).join('');
          }
        }
      }
    }
    return null;
  }

  private async writeBlock(key: string, value: string): Promise<void> {
    const resp = await this.notion.blocks.children.list({ block_id: this.pageId!, page_size: 50 });
    const blocks = resp.results as BlockObjectResponse[];

    // Notion max rich_text content per block is 2000 chars; split if needed
    const chunks: string[] = [];
    for (let s = 0; s < value.length; s += 2000) chunks.push(value.slice(s, s + 2000));
    const richText = chunks.map(c => ({ type: 'text', text: { content: c } }));

    for (let i = 0; i < blocks.length - 1; i++) {
      const b = blocks[i] as any;
      if (b.type === 'heading_2') {
        const heading = (b.heading_2?.rich_text ?? []).map((t: any) => t.plain_text).join('');
        if (heading === key) {
          const next = blocks[i + 1] as any;
          if (next?.type === 'paragraph') {
            await (this.notion.blocks.update as any)({
              block_id: next.id,
              paragraph: { rich_text: richText },
            });
            return;
          }
        }
      }
    }

    // Block pair not found — create it by appending to the page
    await (this.notion.blocks.children.append as any)({
      block_id: this.pageId!,
      children: [
        { type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: key } }] } },
        { type: 'paragraph', paragraph: { rich_text: richText } },
      ],
    });
    logger.info({ key }, 'Hub Settings: created new setting block');
  }
}
