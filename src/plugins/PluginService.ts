import { getConfig, getNotionDatabaseIds } from '../config/ConfigService';
import { NotionWriterService } from '../services/NotionWriterService';
import { logger } from '../config/logger';
import { loadPlugin } from './registry';
import type { ClientPlugin, PluginContext, ExtractionEvent, RecordsWrittenEvent } from './interface';

export class PluginService {
  private static instance: PluginService;
  private plugin: ClientPlugin | null = null;
  private ctx: PluginContext | null = null;

  private constructor() {}

  static getInstance(): PluginService {
    if (!PluginService.instance) PluginService.instance = new PluginService();
    return PluginService.instance;
  }

  async init(tenantId: string): Promise<void> {
    this.plugin = await loadPlugin(tenantId);
    if (!this.plugin) return;

    // Validate and collect custom DB IDs declared by the plugin
    const customDbIds: Record<string, string> = {};
    for (const envVar of this.plugin.customDatabases ?? []) {
      const id = process.env[envVar];
      if (!id) {
        logger.warn({ envVar, tenantId }, 'Plugin requires missing env var — plugin disabled');
        this.plugin = null;
        return;
      }
      customDbIds[envVar] = id;
    }

    const config = getConfig();
    const coreIds = getNotionDatabaseIds(config);
    const coreIdMap = Object.fromEntries(
      Object.entries(coreIds).filter(([, v]) => Boolean(v)) as [string, string][],
    );

    this.ctx = {
      tenantId,
      notion: new NotionWriterService(),
      dbIds: { ...coreIdMap, ...customDbIds },
    };

    logger.info({ tenantId, customDbs: Object.keys(customDbIds) }, 'Client plugin loaded');
  }

  isActive(): boolean { return this.plugin !== null && this.ctx !== null; }

  suppressEmail(): boolean { return this.plugin?.suppressOutboundEmail ?? false; }

  async callOnExtractionComplete(event: ExtractionEvent): Promise<void> {
    if (!this.plugin?.onExtractionComplete || !this.ctx) return;
    try {
      await this.plugin.onExtractionComplete(event, this.ctx);
    } catch (err) {
      logger.warn({ err }, 'Plugin onExtractionComplete failed — pipeline continues');
    }
  }

  async callOnRecordsWritten(event: RecordsWrittenEvent): Promise<void> {
    if (!this.plugin?.onRecordsWritten || !this.ctx) return;
    try {
      await this.plugin.onRecordsWritten(event, this.ctx);
    } catch (err) {
      logger.warn({ err }, 'Plugin onRecordsWritten failed — pipeline continues');
    }
  }
}
