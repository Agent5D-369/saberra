import type { NotionWriterService } from '../services/NotionWriterService';

/**
 * Context passed to every plugin hook. Provides the tenant ID, a dedicated
 * NotionWriterService instance, and a merged map of core + custom DB IDs.
 */
export interface PluginContext {
  tenantId: string;
  notion: NotionWriterService;
  /** Core DB IDs (from getNotionDatabaseIds) + any custom DB IDs declared by the plugin. */
  dbIds: Record<string, string>;
}

/**
 * Fired with the raw Claude extraction before any Notion writes.
 * The plugin MAY mutate `extraction` to add or modify fields — the core
 * will write whatever it finds there.
 */
export interface ExtractionEvent {
  extraction: Record<string, unknown>;
  sourceDate: string;
  sourceEmailPageId: string | null;
  sourceMeetingPageId: string | null;
  sourceDocUrl: string | null;
}

/**
 * Fired after all core Notion writes for one email/meeting have completed.
 * Use this to write to custom databases, trigger downstream integrations, etc.
 */
export interface RecordsWrittenEvent {
  createdRecords: string[];
  sourceDate: string;
  sourceEmailPageId: string | null;
  sourceMeetingPageId: string | null;
  canonReviewRequired: boolean;
  sensitiveReviewRequired: boolean;
}

/**
 * The interface every client plugin must implement (all fields optional).
 *
 * Hook execution is always wrapped in try/catch — a plugin error never
 * crashes the core pipeline.
 */
export interface ClientPlugin {
  /**
   * Notion DB env var names this plugin requires beyond the core 17.
   * PluginService validates these at startup and maps them into ctx.dbIds.
   * If any are missing, the plugin is disabled with a warning.
   *
   * @example ['NOTION_DB_VERDANA_PROPERTIES', 'NOTION_DB_VERDANA_UNITS']
   */
  customDatabases?: string[];

  /**
   * When true, all outbound emails (access requests, admin alerts) are
   * silently suppressed for this tenant. Use for demo environments with
   * fictional email addresses to prevent undeliverable mail errors.
   */
  suppressOutboundEmail?: boolean;

  /** Called before any Notion writes. Plugin can augment extraction. */
  onExtractionComplete?(event: ExtractionEvent, ctx: PluginContext): Promise<void>;

  /** Called after all Notion writes for one email/meeting. */
  onRecordsWritten?(event: RecordsWrittenEvent, ctx: PluginContext): Promise<void>;
}
