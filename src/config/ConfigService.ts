import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TENANT_ID: z.string().min(1),
  ROOTS_EMAIL: z.string().email(),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REFRESH_TOKEN: z.string().min(1),

  IMAP_HOST: z.string().min(1),
  IMAP_PORT: z.coerce.number().int().positive().default(993),
  IMAP_USER: z.string().email(),
  // Optional: when absent, ImapIngestionService falls back to OAuth via GOOGLE_REFRESH_TOKEN.
  // Required only for non-Google IMAP providers (Fastmail, Outlook, etc.).
  IMAP_PASS: z.string().min(1).optional(),
  // Optional: IMAP folder/label to poll. Defaults to INBOX. Use a Gmail label path
  // (e.g. "Sera/Capture") to filter to only mail routed to a specific alias.
  IMAP_FOLDER: z.string().min(1).default('INBOX'),

  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(465).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().min(1).optional(),

  NOTION_API_KEY: z.string().refine(v => v.startsWith('secret_') || v.startsWith('ntn_'), { message: 'must start with "secret_" or "ntn_"' }),
  NOTION_PARENT_PAGE_ID: z.string().min(32).max(36),

  NOTION_DB_SOURCE_EMAILS: z.string().min(1),
  NOTION_DB_MEETINGS: z.string().min(1),
  NOTION_DB_MEETING_ASSETS: z.string().min(1),
  NOTION_DB_MESSAGES: z.string().min(1),
  NOTION_DB_PROFILES: z.string().min(1),
  NOTION_DB_PROJECTS: z.string().min(1),
  NOTION_DB_CIRCLES: z.string().min(1),
  NOTION_DB_ROLES: z.string().min(1),
  NOTION_DB_ROLE_ASSIGNMENTS: z.string().min(1),
  NOTION_DB_TASKS: z.string().min(1),
  NOTION_DB_DECISION_CANDIDATES: z.string().min(1),
  NOTION_DB_RISKS: z.string().min(1),
  NOTION_DB_MEMORY_REVIEW_QUEUE: z.string().min(1),
  NOTION_DB_CANON_CHANGE_REQUESTS: z.string().min(1),
  NOTION_DB_CCOS_LEDGER_ENTRIES: z.string().min(1),
  NOTION_DB_PROCESSING_EVENTS: z.string().min(1),
  NOTION_DB_SENSITIVE_REVIEW: z.string().min(1),
  NOTION_DB_POLICIES:       z.string().min(1).optional(),
  NOTION_DB_INTERACTIONS:   z.string().min(1).optional(),
  NOTION_DB_KNOWLEDGE_BASE: z.string().min(1).optional(),
  NOTION_DB_TENSIONS:       z.string().min(1).optional(),
  NOTION_DB_COMMITMENTS:    z.string().min(1).optional(),
  NOTION_DB_GRATITUDES:     z.string().min(1).optional(),
  NOTION_DB_EVENTS:         z.string().min(1).optional(),
  NOTION_DB_RETROSPECTIVES: z.string().min(1).optional(),
  NOTION_DB_RESOURCES:      z.string().min(1).optional(),

  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-6'),
  EXTRACTION_LANGUAGE: z.string().min(1).default('English'),

  GMAIL_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().default(180),
  MAX_RETRY_COUNT: z.coerce.number().int().positive().default(4),

  // Human-readable client name used in email subjects and notifications (e.g. "Verdana Commons").
  // Defaults to TENANT_ID when absent.
  SABERRA_CLIENT_NAME: z.string().min(1).optional(),

  // Governing Purpose Statement — stored as env var, injected into every extraction
  // Format: full multi-sentence purpose statement following the Teal GPS formula
  // Optional — when set, Sera evaluates every decision and canon change for purpose alignment
  GOVERNING_PURPOSE: z.string().min(1).optional(),
  // One-sentence decision test derived from the GPS (e.g. "Does this move us from X to Y without degrading people, trust, or the land?")
  PURPOSE_TEST: z.string().min(1).optional(),
  // Legacy aliases - read during transition; prefer GOVERNING_PURPOSE / PURPOSE_TEST for new clients
  AMORA_GOVERNING_PURPOSE: z.string().min(1).optional(),
  AMORA_PURPOSE_TEST: z.string().min(1).optional(),

  ORG_SHARED_DRIVE_ID:              z.string().min(1).optional(),
  ORG_SHARED_DRIVE_INBOX_FOLDER_ID: z.string().min(1).optional(),

  // Notion workspace slug (e.g. "newearthcocreators"). When set, dashboard Notion links
  // use https://app.notion.com/p/{slug}/{id} format. When absent, falls back to www.notion.so/{uuid}.
  NOTION_WORKSPACE_SLUG: z.string().min(1).optional(),
  // Verification token from Notion workspace webhook settings (enables POST /webhook/notion)
  NOTION_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Comma-separated list of email addresses. All receive access request and review alerts.
  ADMIN_NOTIFICATION_EMAIL: z.string().min(1).refine(
    (v) => v.split(',').map(s => s.trim()).every(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    { message: 'Must be a valid email or comma-separated list of emails' },
  ),
});

export type Config = z.infer<typeof configSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;

  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Config validation failed:\n${missing}\n\nCopy .env.example to .env and fill in all values.`);
  }

  _config = result.data;

  const adminEmails = _config.ADMIN_NOTIFICATION_EMAIL.split(',').map(s => s.trim());
  if (adminEmails.includes(_config.ROOTS_EMAIL)) {
    throw new Error(
      `ADMIN_NOTIFICATION_EMAIL must not include ROOTS_EMAIL (${_config.ROOTS_EMAIL}) — ` +
      `this creates an infinite processing loop. Use only human inboxes.`,
    );
  }

  return _config;
}

export function getNotionDatabaseIds(config: Config) {
  return {
    sourceEmails: config.NOTION_DB_SOURCE_EMAILS,
    meetings: config.NOTION_DB_MEETINGS,
    meetingAssets: config.NOTION_DB_MEETING_ASSETS,
    messages: config.NOTION_DB_MESSAGES,
    profiles: config.NOTION_DB_PROFILES,
    projects: config.NOTION_DB_PROJECTS,
    circles: config.NOTION_DB_CIRCLES,
    roles: config.NOTION_DB_ROLES,
    roleAssignments: config.NOTION_DB_ROLE_ASSIGNMENTS,
    tasks: config.NOTION_DB_TASKS,
    decisionCandidates: config.NOTION_DB_DECISION_CANDIDATES,
    risks: config.NOTION_DB_RISKS,
    memoryReviewQueue: config.NOTION_DB_MEMORY_REVIEW_QUEUE,
    canonChangeRequests: config.NOTION_DB_CANON_CHANGE_REQUESTS,
    ccosLedgerEntries: config.NOTION_DB_CCOS_LEDGER_ENTRIES,
    processingEvents: config.NOTION_DB_PROCESSING_EVENTS,
    sensitiveReview: config.NOTION_DB_SENSITIVE_REVIEW,
    policies:      config.NOTION_DB_POLICIES ?? '',
    interactions:  config.NOTION_DB_INTERACTIONS ?? '',
    knowledgeBase: config.NOTION_DB_KNOWLEDGE_BASE ?? '',
    tensions:       config.NOTION_DB_TENSIONS ?? '',
    commitments:    config.NOTION_DB_COMMITMENTS ?? '',
    gratitudes:     config.NOTION_DB_GRATITUDES ?? '',
    events:         config.NOTION_DB_EVENTS ?? '',
    retrospectives: config.NOTION_DB_RETROSPECTIVES ?? '',
    resources:      config.NOTION_DB_RESOURCES ?? '',
  };
}
