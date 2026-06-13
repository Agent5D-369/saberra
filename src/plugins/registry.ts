import type { ClientPlugin } from './interface';
import { logger } from '../config/logger';

type PluginLoader = () => Promise<{ default: ClientPlugin }>;

/**
 * Maps lowercase tenant slugs to their plugin loader.
 * Add one line here when onboarding a new client with custom logic.
 */
const REGISTRY: Record<string, PluginLoader> = {
  amora:   () => import('./amora'),
  verdana: () => import('./verdana'),
};

export async function loadPlugin(tenantId: string): Promise<ClientPlugin | null> {
  const slug = tenantId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const loader = REGISTRY[slug];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default;
  } catch (err) {
    logger.warn({ err, slug }, 'Client plugin failed to load — running without plugin');
    return null;
  }
}
