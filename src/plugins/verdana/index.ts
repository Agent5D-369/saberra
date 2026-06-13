import type { ClientPlugin } from '../interface';

/**
 * Verdana Commons — client plugin.
 *
 * To add a custom Notion database:
 *   1. Add the env var name to customDatabases below (e.g. 'NOTION_DB_VERDANA_UNITS')
 *   2. Set that env var on all 3 Verdana Railway services
 *   3. Access it in hooks via ctx.dbIds['NOTION_DB_VERDANA_UNITS']
 *
 * To react to extractions:
 *   - onExtractionComplete: runs before writes — mutate event.extraction to add data
 *   - onRecordsWritten: runs after writes — use ctx.notion.createPage() for custom DBs
 */
const plugin: ClientPlugin = {
  suppressOutboundEmail: true,

  // customDatabases: ['NOTION_DB_VERDANA_PROPERTIES'],

  // async onExtractionComplete(event, ctx) {
  //   // Example: tag every extraction with a Verdana-specific metadata field
  //   // event.extraction.verdana_metadata = { processed_at: new Date().toISOString() };
  // },

  // async onRecordsWritten(event, ctx) {
  //   // Example: write to a Verdana-specific database after core writes complete
  //   // const unitId = ctx.dbIds['NOTION_DB_VERDANA_PROPERTIES'];
  //   // if (unitId && event.sourceMeetingPageId) {
  //   //   await ctx.notion.createPage(unitId, { ... });
  //   // }
  // },
};

export default plugin;
