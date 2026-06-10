import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { getConfig } from './config/ConfigService';
import { logger } from './config/logger';
import { PipelineService } from './services/PipelineService';
import { HubSettingsService } from './services/HubSettingsService';

async function main(): Promise<void> {
  logger.info('Sera (Amora Living Memory) starting');

  const config = getConfig();
  logger.info({ tenantId: config.TENANT_ID, rootsEmail: config.ROOTS_EMAIL }, 'Config loaded');

  await HubSettingsService.getInstance().init();
  const pipeline = new PipelineService();
  const intervalMs = config.GMAIL_POLL_INTERVAL_SECONDS * 1000;

  const unreachable = await pipeline.validateStartup();
  if (unreachable.length > 0) {
    logger.error({ unreachable }, 'STARTUP WARNING: Some Notion databases are unreachable — check integration permissions and env vars');
  } else {
    logger.info('All Notion databases validated');
  }

  logger.info({ intervalSeconds: config.GMAIL_POLL_INTERVAL_SECONDS }, 'Poll interval configured');
  logger.info('Sera ready');

  let isShuttingDown = false;

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — finishing current poll cycle then exiting');
    isShuttingDown = true;
    setTimeout(() => {
      logger.warn('Graceful shutdown timeout — forcing exit');
      process.exit(0);
    }, 60_000).unref();
  });

  // Run first cycle immediately, then on interval
  await pipeline.runPollCycle();

  const timer = setInterval(async () => {
    if (isShuttingDown) {
      clearInterval(timer);
      logger.info('Shutdown complete');
      process.exit(0);
    }
    try {
      await pipeline.runPollCycle();
    } catch (err) {
      logger.error({ err }, 'Poll cycle error');
    }
  }, intervalMs);
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error — Sera shutting down');
  process.exit(1);
});
