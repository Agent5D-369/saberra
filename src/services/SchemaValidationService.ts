import { Client } from '@notionhq/client';
import type { Config } from '../config/ConfigService';
import { logger } from '../config/logger';

export interface SchemaValidationResult {
  reachable: string[];
  unreachable: string[];
  warnings: string[];
}

// The first 17 are required at startup; the rest are optional community-layer DBs.
const REQUIRED_DB_KEYS: Array<keyof Config> = [
  'NOTION_DB_SOURCE_EMAILS',
  'NOTION_DB_MEETINGS',
  'NOTION_DB_MEETING_ASSETS',
  'NOTION_DB_MESSAGES',
  'NOTION_DB_PROFILES',
  'NOTION_DB_PROJECTS',
  'NOTION_DB_CIRCLES',
  'NOTION_DB_ROLES',
  'NOTION_DB_ROLE_ASSIGNMENTS',
  'NOTION_DB_TASKS',
  'NOTION_DB_DECISION_CANDIDATES',
  'NOTION_DB_RISKS',
  'NOTION_DB_MEMORY_REVIEW_QUEUE',
  'NOTION_DB_CANON_CHANGE_REQUESTS',
  'NOTION_DB_CCOS_LEDGER_ENTRIES',
  'NOTION_DB_PROCESSING_EVENTS',
  'NOTION_DB_SENSITIVE_REVIEW',
];

const OPTIONAL_DB_KEYS: Array<keyof Config> = [
  'NOTION_DB_KNOWLEDGE_BASE',
  'NOTION_DB_POLICIES',
  'NOTION_DB_INTERACTIONS',
  'NOTION_DB_TENSIONS',
  'NOTION_DB_COMMITMENTS',
  'NOTION_DB_GRATITUDES',
  'NOTION_DB_EVENTS',
  'NOTION_DB_RETROSPECTIVES',
  'NOTION_DB_RESOURCES',
];

export class SchemaValidationService {
  static async validate(config: Config): Promise<SchemaValidationResult> {
    const client = new Client({ auth: config.NOTION_API_KEY });

    const reachable: string[] = [];
    const unreachable: string[] = [];
    const warnings: string[] = [];

    const check = async (key: keyof Config, required: boolean): Promise<void> => {
      const dbId = config[key] as string | undefined;

      if (!dbId) {
        // Required DBs are guaranteed present by Zod schema at startup; this branch
        // is only reachable for optional keys when the env var is absent.
        if (required) {
          const msg = `${key} is required but not set`;
          warnings.push(msg);
          unreachable.push(key as string);
          logger.warn({ key }, msg);
        }
        return;
      }

      try {
        await client.databases.retrieve({ database_id: dbId });
        reachable.push(key as string);
      } catch (err: any) {
        const msg = required
          ? `Required DB unreachable: ${key} (${dbId}) - check integration permissions`
          : `Optional DB unreachable: ${key} (${dbId})`;
        warnings.push(msg);
        unreachable.push(key as string);
        logger.warn({ key, dbId, err: err?.message }, msg);
      }
    };

    await Promise.all([
      ...REQUIRED_DB_KEYS.map((k) => check(k, true)),
      ...OPTIONAL_DB_KEYS.map((k) => check(k, false)),
    ]);

    const requiredReachable = reachable.filter((k) => REQUIRED_DB_KEYS.includes(k as keyof Config));
    const requiredTotal = REQUIRED_DB_KEYS.length;

    logger.info(
      { reachable: reachable.length, unreachable: unreachable.length, warnings: warnings.length },
      `Schema validation: ${requiredReachable.length}/${requiredTotal} required DBs reachable`,
    );

    if (unreachable.length > 0) {
      logger.warn({ unreachable }, 'Schema validation: unreachable databases detected');
    }

    return { reachable, unreachable, warnings };
  }
}
