import { Client } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../config/ConfigService';
import { HubSettingsService } from '../services/HubSettingsService';

function notionDbUrl(id: string | undefined | null): string {
  if (!id) return '';
  const c = id.replace(/-/g, '');
  const slug = process.env.NOTION_WORKSPACE_SLUG;
  return slug ? `https://app.notion.com/p/${slug}/${c}` : `https://app.notion.com/p/${c}`;
}

const DASHBOARD_TZ = process.env.DASHBOARD_TIMEZONE ?? 'UTC';
function isoToTzDate(iso: string, tz = DASHBOARD_TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso));
}

type DbIds = ReturnType<typeof getNotionDatabaseIds>;

let _notion: Client | null = null;
let _dbs: DbIds | null = null;

function clients(): { notion: Client; dbs: DbIds } {
  if (!_notion || !_dbs) {
    const config = getConfig();
    _notion = new Client({ auth: config.NOTION_API_KEY });
    _dbs = getNotionDatabaseIds(config);
  }
  return { notion: _notion, dbs: _dbs! };
}

async function countQuery(dbId: string, filter: object): Promise<number> {
  const { notion } = clients();
  let count = 0;
  let cursor: string | undefined;
  try {
    do {
      const res = await notion.databases.query({
        database_id: dbId,
        filter: filter as never,
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      count += res.results.length;
      cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
    } while (cursor);
  } catch (err: unknown) {
    // Degrade gracefully rather than crashing the whole dashboard.
    // validation_error: schema mismatch (filter type doesn't match DB property type).
    // object_not_found: DB is inaccessible to the integration (e.g. moved to admin workspace).
    const code = (err as { code?: string })?.code;
    if (code === 'validation_error' || code === 'object_not_found') return 0;
    throw err;
  }
  return count;
}

async function countAll(dbId: string): Promise<number> {
  const { notion } = clients();
  let count = 0;
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: dbId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    count += res.results.length;
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return count;
}

function extractTitle(page: Record<string, unknown>): string {
  const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
  for (const val of Object.values(props)) {
    if (val?.type === 'title') {
      const parts = (val.title as Array<{ plain_text: string }>);
      if (parts?.length > 0) return parts.map(t => t.plain_text).join('');
    }
  }
  return String(page.id ?? '');
}

function extractProp(page: Record<string, unknown>, propName: string): string {
  const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
  const prop = props[propName];
  if (!prop) return '';
  if (prop.type === 'rich_text') return ((prop.rich_text as Array<{ plain_text: string }>) ?? []).map(t => t.plain_text).join('');
  if (prop.type === 'url') return String(prop.url ?? '');
  if (prop.type === 'select') return String((prop.select as { name: string } | null)?.name ?? '');
  if (prop.type === 'number') return String(prop.number ?? '');
  if (prop.type === 'date') return String((prop.date as { start: string } | null)?.start ?? '');
  return '';
}

export interface RoleHealthItem {
  id: string;
  roleName: string;
  circleName: string;
  issue: 'vacant' | 'expiring';
  expiresAt?: string;
  url?: string;
}

export interface UpcomingReviewItem {
  id: string;
  name: string;
  type: 'role' | 'policy';
  reviewDate: string;
  daysUntil: number;
  url: string;
}

export interface RoleDirectoryItem {
  roleId: string;
  roleName: string;
  roleUrl: string;
  roleStatus: string;
  circleName: string;
  activeHolders: Array<{ name: string; since: string }>;
  pastHolders: Array<{ name: string }>;
}

export interface PolicyStats {
  total: number;
  draft: number;
  active: number;
  missingCircle: number;
}

export interface CommunityStats {
  totalProfiles: number;
  totalMeetings: number;
  activeCircles: number;
  processedThisWeek: number;
  totalRisks: number;
  openRisks: number;
}

export interface QueueCounts {
  canonChangeRequests: number;
  memoryReviewQueue: number;
  decisionCandidates: number;
  sensitiveReview: number;
  ccosLedgerPending: number;
  tasksNeedingOwner: number;
  highRisks: number;
  failedEmails: number;
  kbDrafts: number;
}

export interface FailedEmailItem {
  id: string;
  subject: string;
  from: string;
  status: string;
  createdAt: string;
  rawSnippet: string;
  notionUrl: string;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  category: string;
  confidence: string;
  relatedProfileNames: string[];
  url?: string;
}

export interface SensitiveFlagItem {
  id: string;
  issue: string;
  dateFlagged: string;
  relatedProfileNames: string[];
  url?: string;
}

export interface ProfileSummary {
  id: string;
  name: string;
  profileType: string;
  engagementStatus: string;
  relationship: string;
  tags: string[];
  firstSeen: string;
  activeRoles: number;
  meetingsOrganized: number;
  tasksOwned: number;
  tasksDone: number;
  seraScore: number;
}

export interface PeopleData {
  topProfiles: ProfileSummary[];
  totalProfiles: number;
  totalPeople: number;
  totalOrgs: number;
  totalActive: number;
  byRelationship: Array<{ label: string; count: number }>;
  byTag: Array<{ label: string; count: number }>;
  byType: Record<string, number>;
  timeline: Array<{ month: string; count: number }>;
}

export interface TaskPerformer {
  profileId: string | null;
  name: string;
  totalAssigned: number;
  totalDone: number;
  totalOverdue: number;
  completionRate: number;
  rank: number;
}

export interface TaskVelocityPoint {
  weekLabel: string;
  created: number;
  completed: number;
}

export interface PerformanceData {
  leaderboard: TaskPerformer[];
  velocity: TaskVelocityPoint[];
  byStatus: { open: number; inProgress: number; done: number; cancelled: number; needsOwner: number };
  priorityBreakdown: { high: number; medium: number; low: number };
  totalOverdue: number;
}

export interface RecentEmail {
  id: string;
  subject: string;
  from: string;
  emailType: string;
  processingStatus: string;
  receivedDate: string;
  processedAt: string;
  errorSnippet: string;
  url: string;
}

export interface AccessFailure {
  id: string;
  assetName: string;
  driveLink: string;
  errorMessage: string;
  retryCount: number;
  assetType: string;
}

export interface RecentError {
  id: string;
  error: string;
  startedAt: string;
}

export interface ActivityItem {
  id: string;
  eventType: string;
  status: 'Success' | 'Error' | 'Info' | 'Warning';
  startedAt: string;
  tokenEstimate: number;
  error: string;
}

export interface ProcessingMetrics {
  emailsProcessed: number;
  totalTasks: number;
  totalDecisions: number;
  weeklyActivity: Array<{ date: string; count: number }>;
  emailTypeBreakdown: { recordings: number; transcripts: number; notes: number; operational: number; forwarded: number };
  runningSinceDays: number | null;
  estimatedHoursSaved: number;
  totalKbArticles: number;
}

export interface SystemConfig {
  pollIntervalSeconds: number;
  maxRetryCount: number;
  claudeModel: string;
  tenantId: string;
  adminEmail: string;
  activeTz: string;
  kbEnabled: boolean;
  governingPurpose: string | null;
  purposeTest: string | null;
  outputLanguage: string;
  correctionMode: string;
  dbPermissions: Record<string, { create: boolean; update: boolean }>;
  enabledDbs: Record<string, boolean>;
  hubSettingsConfigured: boolean;
}

export const COLLAPSE_PATTERNS = [
  'No Shared Vision',
  'Poor Governance',
  'Financial Fragility',
  'Interpersonal Conflict',
  'Burnout',
  'Wrong People',
  'Scale Trap',
] as const;

export type CollapsePatternName = typeof COLLAPSE_PATTERNS[number];

export interface CollapseSignal {
  id: string;
  risk: string;
  patternType: CollapsePatternName | 'Unknown';
  severity: 'High' | 'Medium' | 'Low';
  detectedAt: string;
  url: string;
}

export interface CollapseHealth {
  signals: CollapseSignal[];
  patternCounts: Record<string, number>;
  totalActive: number;
}

export interface ContributorEntry {
  name: string;
  email: string;
  emailCount: number;
  lastSeen: string;
}

export interface CommunityPulse {
  openTensions: number;
  upcomingEvents: number;
  activeCommitments: number;
  recentGratitudes: number;
}

export interface DashboardData {
  queues: QueueCounts;
  policies: PolicyStats;
  community: CommunityStats;
  metrics: ProcessingMetrics;
  people: PeopleData;
  recentEmails: RecentEmail[];
  failedEmailList: FailedEmailItem[];
  accessFailures: AccessFailure[];
  recentErrors: RecentError[];
  recentActivity: ActivityItem[];
  roleHealth: RoleHealthItem[];
  rolesDirectory: RoleDirectoryItem[];
  upcomingReviews: UpcomingReviewItem[];
  memoryReviewItems: ReviewQueueItem[];
  sensitiveReviewItems: SensitiveFlagItem[];
  performance: PerformanceData;
  crm: CrmData;
  collapseHealth: CollapseHealth;
  contributors: ContributorEntry[];
  communityPulse: CommunityPulse;
  lastPollAt: string | null;
  lastHeartbeatAt: string | null;
  fetchedAt: string;
  fromCache: boolean;
  cacheAgeSeconds: number;
  notionUrls: Record<string, string>;
  systemConfig: SystemConfig;
  dataError?: string;
}

// ── Server-side cache ─────────────────────────────────────────────────────────
// Notion has no COUNT API — fetching metrics requires paginating all records.
// Cache the result for CACHE_TTL_MS. On expiry, serve stale data immediately
// and refresh in the background so the next load is always fast.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _cache: DashboardData | null = null;
let _cacheBuiltAt = 0;
let _refreshing = false;

function buildEmptyData(activeTz: string, error: string): DashboardData {
  let cfg: ReturnType<typeof getConfig> | null = null;
  try { cfg = getConfig(); } catch { /* env vars missing — use defaults */ }
  return {
    queues: { canonChangeRequests: 0, memoryReviewQueue: 0, decisionCandidates: 0, sensitiveReview: 0, ccosLedgerPending: 0, tasksNeedingOwner: 0, highRisks: 0, failedEmails: 0, kbDrafts: 0 },
    policies: { total: 0, draft: 0, active: 0, missingCircle: 0 },
    community: { totalProfiles: 0, totalMeetings: 0, activeCircles: 0, processedThisWeek: 0, totalRisks: 0, openRisks: 0 },
    metrics: { emailsProcessed: 0, totalTasks: 0, totalDecisions: 0, weeklyActivity: [], emailTypeBreakdown: { recordings: 0, transcripts: 0, notes: 0, operational: 0, forwarded: 0 }, runningSinceDays: null, estimatedHoursSaved: 0, totalKbArticles: 0 },
    people: { topProfiles: [], totalProfiles: 0, totalPeople: 0, totalOrgs: 0, totalActive: 0, byRelationship: [], byTag: [], byType: {}, timeline: [] },
    recentEmails: [],
    failedEmailList: [],
    accessFailures: [],
    recentErrors: [],
    recentActivity: [],
    roleHealth: [],
    rolesDirectory: [],
    upcomingReviews: [],
    memoryReviewItems: [],
    sensitiveReviewItems: [],
    performance: { leaderboard: [], velocity: [], byStatus: { open: 0, inProgress: 0, done: 0, cancelled: 0, needsOwner: 0 }, priorityBreakdown: { high: 0, medium: 0, low: 0 }, totalOverdue: 0 },
    crm: { pipeline: [], followUps: [], recentInteractions: [], totalContacts: 0, interactionsEnabled: false },
    collapseHealth: { signals: [], patternCounts: {}, totalActive: 0 },
    contributors: [],
    communityPulse: { openTensions: 0, upcomingEvents: 0, activeCommitments: 0, recentGratitudes: 0 },
    lastPollAt: null,
    lastHeartbeatAt: null,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
    cacheAgeSeconds: 0,
    notionUrls: {},
    systemConfig: {
      pollIntervalSeconds: cfg ? Number(process.env.GMAIL_POLL_INTERVAL_SECONDS ?? 180) : 180,
      maxRetryCount: cfg ? Number(process.env.MAX_RETRY_COUNT ?? 4) : 4,
      claudeModel: process.env.CLAUDE_MODEL ?? 'unknown',
      tenantId: process.env.TENANT_ID ?? '',
      adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
      activeTz,
      kbEnabled: false,
      governingPurpose:      HubSettingsService.getInstance().governingPurpose,
      purposeTest:           HubSettingsService.getInstance().purposeTest,
      outputLanguage:        HubSettingsService.getInstance().outputLanguage,
      correctionMode:        HubSettingsService.getInstance().correctionMode,
      dbPermissions:         HubSettingsService.getInstance().dbPermissions,
      enabledDbs:            {},
      hubSettingsConfigured: Boolean(process.env.NOTION_HUB_SETTINGS_PAGE_ID),
    },
    dataError: error,
  };
}

export async function getDashboardData(timezone?: string): Promise<DashboardData> {
  const activeTz = timezone ?? DASHBOARD_TZ;
  const now = Date.now();
  const cacheHit = _cache && _cache.systemConfig.activeTz === activeTz;

  if (cacheHit && now - _cacheBuiltAt < CACHE_TTL_MS) {
    return { ..._cache!, fromCache: true, cacheAgeSeconds: Math.round((now - _cacheBuiltAt) / 1000) };
  }

  if (cacheHit && !_refreshing) {
    // Stale but available and same timezone — serve immediately, refresh silently in background
    _refreshing = true;
    fetchFreshData(activeTz)
      .then(data => { _cache = data; _cacheBuiltAt = Date.now(); })
      .catch(() => { /* keep stale on error */ })
      .finally(() => { _refreshing = false; });
    return { ..._cache!, fromCache: true, cacheAgeSeconds: Math.round((now - _cacheBuiltAt) / 1000) };
  }

  // First load, timezone changed, or actively refreshing — wait for fresh data
  try {
    const data = await fetchFreshData(activeTz);
    _cache = data;
    _cacheBuiltAt = Date.now();
    return data;
  } catch (err) {
    // Notion unavailable — render the dashboard shell with empty data rather than a 500 text page.
    // Background interval will repopulate the cache when Notion recovers.
    const msg = err instanceof Error ? err.message : String(err);
    return buildEmptyData(activeTz, `Data temporarily unavailable: ${msg}`);
  }
}

async function fetchCommunityPulse(notion: Client, dbs: DbIds, activeTz: string): Promise<CommunityPulse> {
  const todayDate = isoToTzDate(new Date().toISOString(), activeTz);
  const thirtyDaysAgoDate = isoToTzDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), activeTz);
  const [openTensions, upcomingEvents, activeCommitments, recentGratitudes] = await Promise.all([
    dbs.tensions   ? countQuery(dbs.tensions,    { property: 'Status', select: { equals: 'Open' } }).catch(() => 0)      : Promise.resolve(0),
    dbs.events     ? countQuery(dbs.events,      { property: 'Date', date: { on_or_after: todayDate } } as never).catch(() => 0) : Promise.resolve(0),
    dbs.commitments ? countQuery(dbs.commitments, { property: 'Status', select: { equals: 'Active' } }).catch(() => 0)   : Promise.resolve(0),
    dbs.gratitudes ? countQuery(dbs.gratitudes, { timestamp: 'created_time', created_time: { on_or_after: thirtyDaysAgoDate } } as never).catch(() => 0) : Promise.resolve(0),
  ]);
  return { openTensions, upcomingEvents, activeCommitments, recentGratitudes };
}

async function fetchContributors(notion: Client, dbs: DbIds, rootsEmail: string): Promise<ContributorEntry[]> {
  const ninetyDaysAgo = isoToTzDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
  const pages: unknown[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: dbs.sourceEmails,
      filter: { timestamp: 'created_time', created_time: { on_or_after: ninetyDaysAgo } } as never,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);

  const counts = new Map<string, { name: string; count: number; lastSeen: string }>();
  const rootsLower = rootsEmail.toLowerCase();
  const systemDomains = ['noreply.', 'mailer.', 'no-reply.', 'notifications.', 'notify.', 'reply.'];

  for (const p of pages) {
    const page = p as Record<string, unknown>;
    const from = extractProp(page, 'From').trim();
    if (!from) continue;

    // Parse "Name <email@example.com>" or just "email@example.com"
    const angleMatch = from.match(/^(.+?)\s*<([^>]+)>$/);
    const rawEmail = angleMatch ? angleMatch[2].trim().toLowerCase() : from.toLowerCase();
    const displayName = angleMatch ? angleMatch[1].trim().replace(/^["']|["']$/g, '') : rawEmail;

    if (rawEmail === rootsLower) continue;
    if (systemDomains.some(d => rawEmail.includes(d))) continue;
    if (rawEmail.includes('google.com') || rawEmail.includes('gmail.com') && displayName.toLowerCase().includes('google')) continue;

    const createdTime = String((page as Record<string, string>).created_time ?? '');
    const existing = counts.get(rawEmail);
    if (!existing) {
      counts.set(rawEmail, { name: displayName || rawEmail, count: 1, lastSeen: createdTime });
    } else {
      existing.count++;
      if (createdTime > existing.lastSeen) existing.lastSeen = createdTime;
    }
  }

  return Array.from(counts.entries())
    .map(([email, v]) => ({ name: v.name, email, emailCount: v.count, lastSeen: v.lastSeen }))
    .sort((a, b) => b.emailCount - a.emailCount)
    .slice(0, 10);
}

async function fetchFreshData(activeTz = DASHBOARD_TZ): Promise<DashboardData> {
  const { notion, dbs } = clients();
  const config = getConfig();
  const sevenDaysAgoLocalDate = isoToTzDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), activeTz);

  // Kick off heavy data fetches concurrently with the rest
  const perfDataPromise        = fetchTaskPerformanceData(notion, dbs.tasks);
  const peopleDataPromise      = fetchPeopleData(notion, dbs);
  const communityPulsePromise  = fetchCommunityPulse(notion, dbs, activeTz);
  const contributorsPromise    = fetchContributors(notion, dbs, config.ROOTS_EMAIL);

  const [
    canonPending,
    memoryPending,
    decisionsPending,
    sensitivePending,
    ccosPending,
    tasksNoOwner,
    highRisks,
    kbDrafts,
    policiesTotal,
    policiesDraft,
    policiesActive,
    policiesMissingCircle,
    profilesTotal,
    meetingsTotal,
    circlesActive,
    risksTotal,
    risksOpen,
    processedThisWeek,
    failedAssetsRes,
    recentErrorsRes,
    lastPollRes,
    lastHeartbeatRes,
    failedEmailsRes,
  ] = await Promise.all([
    countQuery(dbs.canonChangeRequests, { property: 'Status', select: { equals: 'Pending Review' } }),
    countQuery(dbs.memoryReviewQueue,   { property: 'Status', select: { equals: 'Pending Review' } }),
    countQuery(dbs.decisionCandidates,  { or: [
      { property: 'Status', select: { equals: 'Candidate' } },
      { property: 'Status', select: { equals: 'Needs Clarification' } },
    ]}),
    countQuery(dbs.sensitiveReview,     { property: 'Status', select: { equals: 'Pending Review' } }),
    countQuery(dbs.ccosLedgerEntries,   { or: [
      { property: 'Status', select: { equals: 'Draft' } },
      { property: 'Status', select: { equals: 'Pending Review' } },
    ]}),
    countQuery(dbs.tasks,               { and: [
      { property: 'Owner', relation: { is_empty: true } },
      { property: 'Status', select: { does_not_equal: 'Done' } },
      { property: 'Status', select: { does_not_equal: 'Cancelled' } },
    ]}),
    countQuery(dbs.risks,               { and: [
      { property: 'Severity', select: { equals: 'High' } },
      { property: 'Status',   select: { equals: 'Open' } },
    ]}),
    dbs.knowledgeBase ? countQuery(dbs.knowledgeBase, { property: 'Status', select: { equals: 'Draft' } }) : Promise.resolve(0),
    dbs.policies ? countAll(dbs.policies)                                                                   : Promise.resolve(0),
    dbs.policies ? countQuery(dbs.policies, { property: 'Status', select: { equals: 'Draft' } })           : Promise.resolve(0),
    dbs.policies ? countQuery(dbs.policies, { property: 'Status', select: { equals: 'Active' } })          : Promise.resolve(0),
    dbs.policies ? countQuery(dbs.policies, { property: 'Responsible Circle', relation: { is_empty: true } }) : Promise.resolve(0),
    countAll(dbs.profiles),
    countAll(dbs.meetings),
    countQuery(dbs.circles,   { property: 'Status', select: { equals: 'Active' } }),
    countAll(dbs.risks),
    countQuery(dbs.risks, { property: 'Status', select: { equals: 'Open' } }),
    countQuery(dbs.sourceEmails, {
      timestamp: 'created_time', created_time: { on_or_after: sevenDaysAgoLocalDate },
    } as never),
    notion.databases.query({
      database_id: dbs.meetingAssets,
      filter: { property: 'Processing Status', select: { equals: 'Manual Review' } } as never,
      page_size: 50,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
    notion.databases.query({
      database_id: dbs.processingEvents,
      filter: { property: 'Status', select: { equals: 'Error' } } as never,
      page_size: 10,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
    notion.databases.query({
      database_id: dbs.processingEvents,
      filter: { property: 'Event Type', select: { equals: 'Poll Complete' } } as never,
      page_size: 1,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
    notion.databases.query({
      database_id: dbs.processingEvents,
      filter: { property: 'Event Type', select: { equals: 'Heartbeat' } } as never,
      page_size: 1,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
    // Failed or stuck-in-Processing operational source emails
    notion.databases.query({
      database_id: dbs.sourceEmails,
      filter: { or: [
        { property: 'Processing Status', select: { equals: 'Failed' } },
        { property: 'Processing Status', select: { equals: 'Pending' } },
      ] } as never,
      page_size: 50,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
  ]);

  // ── Metrics + review-queue items batch
  const [
    emailsProcessed,
    totalTasks,
    totalDecisions,
    typeRecordings,
    typeTranscripts,
    typeNotes,
    typeOperational,
    typeForwarded,
    totalKbArticles,
    weeklyActivityRes,
    oldestEventRes,
    recentActivityRes,
    memoryItemsRes,
    sensitiveItemsRes,
    recentEmailsRes,
  ] = await Promise.all([
    countQuery(dbs.sourceEmails, { property: 'Processing Status', select: { equals: 'Processed' } }),
    countAll(dbs.tasks),
    countAll(dbs.decisionCandidates),
    countQuery(dbs.sourceEmails, { property: 'Email Type', select: { equals: 'Google Meet Recording' } }),
    countQuery(dbs.sourceEmails, { property: 'Email Type', select: { equals: 'Google Meet Transcript' } }),
    countQuery(dbs.sourceEmails, { property: 'Email Type', select: { equals: 'Google Meet Notes' } }),
    countQuery(dbs.sourceEmails, { property: 'Email Type', select: { equals: 'Operational Email' } }),
    countQuery(dbs.sourceEmails, { property: 'Email Type', select: { equals: 'Forwarded Thread' } }),
    dbs.knowledgeBase ? countAll(dbs.knowledgeBase) : Promise.resolve(0),
    notion.databases.query({
      database_id: dbs.sourceEmails,
      filter: { timestamp: 'created_time', created_time: { on_or_after: sevenDaysAgoLocalDate } } as never,
      page_size: 200,
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    }),
    notion.databases.query({
      database_id: dbs.processingEvents,
      page_size: 1,
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    }),
    // Activity log: last 50 events any type, filtered client-side to strip heartbeat/poll noise
    notion.databases.query({
      database_id: dbs.processingEvents,
      page_size: 50,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
    // Pending memory review items (top 15)
    notion.databases.query({
      database_id: dbs.memoryReviewQueue,
      filter: { property: 'Status', select: { equals: 'Pending Review' } } as never,
      page_size: 15,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
    // Pending sensitive review items (top 10) — catch object_not_found (admin-only workspace)
    notion.databases.query({
      database_id: dbs.sensitiveReview,
      filter: { property: 'Status', select: { equals: 'Pending Review' } } as never,
      page_size: 10,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }).catch(() => ({ results: [], has_more: false, object: 'list' as const, type: 'page_or_database' as const, page_or_database: {} })),
    // Last 10 source emails (all statuses, most recent first)
    notion.databases.query({
      database_id: dbs.sourceEmails,
      page_size: 10,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }),
  ]);

  // Group weekly activity by day, using DASHBOARD_TZ so late-night UTC emails land on the correct local date
  const activityMap = new Map<string, number>();
  for (const page of weeklyActivityRes.results) {
    const createdTime = String((page as Record<string, string>).created_time ?? '');
    if (createdTime) {
      const date = isoToTzDate(createdTime, activeTz);
      activityMap.set(date, (activityMap.get(date) ?? 0) + 1);
    }
  }
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = isoToTzDate(d.toISOString(), activeTz);
    return { date, count: activityMap.get(date) ?? 0 };
  });

  const oldestCreatedTime = (oldestEventRes.results[0] as Record<string, string> | undefined)?.created_time;
  const runningSinceDays = oldestCreatedTime
    ? Math.floor((Date.now() - new Date(oldestCreatedTime).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const estimatedHoursSaved = Math.round(
    (meetingsTotal * 45 + emailsProcessed * 5 + totalTasks * 2 + totalDecisions * 3) / 60,
  );

  const tenMinutesAgoMs = Date.now() - 10 * 60 * 1000;
  const failedEmailList: FailedEmailItem[] = failedEmailsRes.results
    .filter(p => {
      if (p.object !== 'page') return false;
      const props = ((p as unknown as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
      const status = (props['Processing Status']?.select as { name?: string } | null)?.name ?? '';
      if (status === 'Failed') return true;
      // Only surface stuck "Processing" emails older than 10 min (actively processing ones are fine)
      return new Date((p as unknown as Record<string, string>).created_time ?? 0).getTime() < tenMinutesAgoMs;
    })
    .map(p => {
      const page = p as unknown as Record<string, unknown>;
      const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
      const status = (props['Processing Status']?.select as { name?: string } | null)?.name ?? '';
      return {
        id:          String(page.id ?? ''),
        subject:     extractTitle(page),
        from:        extractProp(page, 'From'),
        status,
        createdAt:   String((page as Record<string, string>).created_time ?? ''),
        rawSnippet:  (props['Raw Snippet']?.rich_text as Array<{ plain_text: string }> | undefined)?.[0]?.plain_text ?? '',
        notionUrl:   String((page as Record<string, string>).url ?? ''),
      };
    });

  const accessFailures: AccessFailure[] = failedAssetsRes.results.map(p => {
    const page = p as unknown as Record<string, unknown>;
    return {
      id: String(page.id ?? ''),
      assetName: extractTitle(page),
      driveLink: extractProp(page, 'Google Drive Link'),
      errorMessage: extractProp(page, 'Error Message'),
      retryCount: Number(extractProp(page, 'Retry Count')) || 0,
      assetType: extractProp(page, 'Asset Type'),
    };
  });

  const recentErrors: RecentError[] = recentErrorsRes.results.map(p => {
    const page = p as unknown as Record<string, unknown>;
    return {
      id: String(page.id ?? ''),
      error: extractProp(page, 'Details'),
      startedAt: extractProp(page, 'Timestamp') || String((page as Record<string, string>).created_time ?? ''),
    };
  });

  const ACTIVITY_NOISE = new Set([
    'Heartbeat', 'Scheduled Task', 'Poll Start', 'Poll Complete', 'Email Ingested', 'Access Check', 'Extraction Start',
  ]);
  const recentActivity: ActivityItem[] = recentActivityRes.results
    .filter(p => {
      const et = extractProp(p as unknown as Record<string, unknown>, 'Event Type');
      return !ACTIVITY_NOISE.has(et);
    })
    .slice(0, 20)
    .map(p => {
      const page = p as unknown as Record<string, unknown>;
      const status = (extractProp(page, 'Status') || 'Info') as ActivityItem['status'];
      return {
        id:            String(page.id ?? ''),
        eventType:     extractProp(page, 'Event Type'),
        status,
        startedAt:     extractProp(page, 'Timestamp') || String((page as Record<string, string>).created_time ?? ''),
        tokenEstimate: Number(extractProp(page, 'Token Count')) || 0,
        error:         extractProp(page, 'Details'),
      };
    });

  // ── Resolve profile names for review queue items
  // Collect all unique profile page IDs from relation properties
  function extractRelationIds(page: Record<string, unknown>, propName: string): string[] {
    const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
    const rel = props[propName]?.relation as Array<{ id: string }> | undefined;
    return (rel ?? []).map(r => r.id).filter(Boolean);
  }

  const allProfileIds = new Set<string>();
  for (const p of memoryItemsRes.results) {
    for (const id of extractRelationIds(p as unknown as Record<string, unknown>, 'Related Profiles')) allProfileIds.add(id);
  }
  for (const p of sensitiveItemsRes.results) {
    for (const id of extractRelationIds(p as unknown as Record<string, unknown>, 'Related People')) allProfileIds.add(id);
  }

  // Batch-fetch all profile pages we need (parallel, bounded to unique IDs)
  const profileNameMap = new Map<string, string>();
  if (allProfileIds.size > 0) {
    const profileIdArr = Array.from(allProfileIds);
    const fetched = await Promise.allSettled(
      profileIdArr.map(id => notion.pages.retrieve({ page_id: id })),
    );
    fetched.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        profileNameMap.set(profileIdArr[idx], extractTitle(result.value as unknown as Record<string, unknown>));
      }
    });
  }

  const memoryReviewItems: ReviewQueueItem[] = memoryItemsRes.results.map(p => {
    const page = p as unknown as Record<string, unknown>;
    const relIds = extractRelationIds(page, 'Related Profiles');
    return {
      id: String(page.id ?? ''),
      title: extractTitle(page),
      category: extractProp(page, 'Category'),
      confidence: extractProp(page, 'Confidence'),
      relatedProfileNames: relIds.map(id => profileNameMap.get(id) ?? '').filter(Boolean),
      url: String((page as Record<string, string>).url ?? ''),
    };
  });

  const sensitiveReviewItems: SensitiveFlagItem[] = sensitiveItemsRes.results.map(p => {
    const page = p as unknown as Record<string, unknown>;
    const relIds = extractRelationIds(page, 'Related People');
    return {
      id: String(page.id ?? ''),
      issue: extractTitle(page),
      dateFlagged: extractProp(page, 'Date Flagged'),
      relatedProfileNames: relIds.map(id => profileNameMap.get(id) ?? '').filter(Boolean),
      url: String((page as Record<string, string>).url ?? ''),
    };
  });

  const recentEmails: RecentEmail[] = recentEmailsRes.results.map(p => {
    const page = p as unknown as Record<string, unknown>;
    return {
      id: String(page.id ?? ''),
      subject: extractProp(page, 'Subject') || extractTitle(page),
      from: extractProp(page, 'From'),
      emailType: extractProp(page, 'Email Type'),
      processingStatus: extractProp(page, 'Processing Status'),
      receivedDate: extractProp(page, 'Received Date'),
      processedAt: extractProp(page, 'Processed At'),
      errorSnippet: extractProp(page, 'Error Log').slice(0, 120),
      url: String((page as Record<string, string>).url ?? ''),
    };
  });

  const [roleHealth, rolesDirectory, upcomingReviews, crmData, collapseHealth] = await Promise.all([
    getRoleHealth().catch(() => [] as RoleHealthItem[]),
    getRolesDirectory().catch(() => [] as RoleDirectoryItem[]),
    getUpcomingReviews().catch(() => [] as UpcomingReviewItem[]),
    getCrmData().catch((): CrmData => ({
      pipeline: [], followUps: [], recentInteractions: [], totalContacts: 0, interactionsEnabled: false,
    })),
    getCollapsePatternSignals().catch((): CollapseHealth => ({
      signals: [], patternCounts: Object.fromEntries(COLLAPSE_PATTERNS.map(p => [p, 0])), totalActive: 0,
    })),
  ]);
  const performanceData = await perfDataPromise.catch((): PerformanceData => ({
    leaderboard: [], velocity: [],
    byStatus: { open: 0, inProgress: 0, done: 0, cancelled: 0, needsOwner: 0 },
    priorityBreakdown: { high: 0, medium: 0, low: 0 },
    totalOverdue: 0,
  }));
  const peopleData = await peopleDataPromise.catch((): PeopleData => ({
    topProfiles: [], totalProfiles: 0, totalPeople: 0, totalOrgs: 0, totalActive: 0,
    byRelationship: [], byTag: [], byType: {}, timeline: [],
  }));
  const communityPulse = await communityPulsePromise.catch((): CommunityPulse => ({
    openTensions: 0, upcomingEvents: 0, activeCommitments: 0, recentGratitudes: 0,
  }));
  const contributors = await contributorsPromise.catch((): ContributorEntry[] => []);

  return {
    queues: {
      canonChangeRequests: canonPending,
      memoryReviewQueue:   memoryPending,
      decisionCandidates:  decisionsPending,
      sensitiveReview:     sensitivePending,
      ccosLedgerPending:   ccosPending,
      tasksNeedingOwner:   tasksNoOwner,
      highRisks,
      failedEmails:        failedEmailList.length,
      kbDrafts,
    },
    policies: {
      total:         policiesTotal,
      draft:         policiesDraft,
      active:        policiesActive,
      missingCircle: policiesMissingCircle,
    },
    community: {
      totalProfiles:     profilesTotal,
      totalMeetings:     meetingsTotal,
      activeCircles:     circlesActive,
      processedThisWeek,
      totalRisks:        risksTotal,
      openRisks:         risksOpen,
    },
    metrics: {
      emailsProcessed,
      totalTasks,
      totalDecisions,
      weeklyActivity,
      emailTypeBreakdown: {
        recordings:  typeRecordings,
        transcripts: typeTranscripts,
        notes:       typeNotes,
        operational: typeOperational,
        forwarded:   typeForwarded,
      },
      runningSinceDays,
      estimatedHoursSaved,
      totalKbArticles,
    },
    recentEmails,
    failedEmailList,
    accessFailures,
    recentErrors,
    recentActivity,
    roleHealth,
    rolesDirectory,
    upcomingReviews,
    memoryReviewItems,
    sensitiveReviewItems,
    people: peopleData,
    performance: performanceData,
    crm: crmData,
    collapseHealth,
    contributors,
    communityPulse,
    lastPollAt:      (lastPollRes.results[0] as Record<string, string> | undefined)?.created_time ?? null,
    lastHeartbeatAt: (lastHeartbeatRes.results[0] as Record<string, string> | undefined)?.created_time ?? null,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
    cacheAgeSeconds: 0,
    notionUrls: {
      hub:                 notionDbUrl(config.NOTION_PARENT_PAGE_ID),
      canonChangeRequests: notionDbUrl(dbs.canonChangeRequests),
      memoryReviewQueue:   notionDbUrl(dbs.memoryReviewQueue),
      decisionCandidates:  notionDbUrl(dbs.decisionCandidates),
      sensitiveReview:     notionDbUrl(dbs.sensitiveReview),
      ccosLedgerEntries:   notionDbUrl(dbs.ccosLedgerEntries),
      tasks:               notionDbUrl(dbs.tasks),
      risks:               notionDbUrl(dbs.risks),
      policies:            notionDbUrl(dbs.policies),
      meetings:            notionDbUrl(dbs.meetings),
      profiles:            notionDbUrl(dbs.profiles),
      sourceEmails:        notionDbUrl(dbs.sourceEmails),
      knowledgeBase:       notionDbUrl(dbs.knowledgeBase),
    },
    systemConfig: {
      pollIntervalSeconds:    config.GMAIL_POLL_INTERVAL_SECONDS,
      maxRetryCount:          config.MAX_RETRY_COUNT,
      claudeModel:            config.CLAUDE_MODEL,
      tenantId:               config.TENANT_ID,
      adminEmail:             config.ADMIN_NOTIFICATION_EMAIL,
      activeTz,
      kbEnabled:              Boolean(dbs.knowledgeBase),
      governingPurpose:       HubSettingsService.getInstance().governingPurpose,
      purposeTest:            HubSettingsService.getInstance().purposeTest,
      outputLanguage:         HubSettingsService.getInstance().outputLanguage,
      correctionMode:         HubSettingsService.getInstance().correctionMode,
      dbPermissions:          HubSettingsService.getInstance().dbPermissions,
      enabledDbs: {
        knowledgeBase:  Boolean(dbs.knowledgeBase),
        interactions:   Boolean(dbs.interactions),
        tensions:       Boolean(dbs.tensions),
        commitments:    Boolean(dbs.commitments),
        gratitudes:     Boolean(dbs.gratitudes),
        events:         Boolean(dbs.events),
        retrospectives: Boolean(dbs.retrospectives),
        resources:      Boolean(dbs.resources),
      },
      hubSettingsConfigured:  Boolean(process.env.NOTION_HUB_SETTINGS_PAGE_ID),
    },
  };
}


async function paginatePages(notion: Client, dbId: string, filter?: object): Promise<unknown[]> {
  const pages: unknown[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: dbId, page_size: 100,
      ...(filter ? { filter: filter as never } : {}),
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function fetchPeopleData(notion: Client, dbs: DbIds): Promise<PeopleData> {
  const [profilePages, assignPages, meetPages, taskPages] = await Promise.all([
    paginatePages(notion, dbs.profiles),
    paginatePages(notion, dbs.roleAssignments, { property: 'Status', select: { equals: 'Active' } }),
    paginatePages(notion, dbs.meetings),
    paginatePages(notion, dbs.tasks),
  ]);

  // Role count per holder (Role Holder → Profiles relation)
  const roleCount = new Map<string, number>();
  for (const p of assignPages) {
    const props = ((p as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    for (const r of (props['Role Holder']?.relation as Array<{ id: string }> | undefined) ?? [])
      roleCount.set(r.id, (roleCount.get(r.id) ?? 0) + 1);
  }

  // Meeting organizer count
  const meetCount = new Map<string, number>();
  for (const p of meetPages) {
    const props = ((p as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    for (const r of (props['Organizer']?.relation as Array<{ id: string }> | undefined) ?? [])
      meetCount.set(r.id, (meetCount.get(r.id) ?? 0) + 1);
  }

  // Task counts per owner
  const taskMap = new Map<string, { total: number; done: number }>();
  for (const p of taskPages) {
    const props = ((p as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    const status = ((props['Status']?.select as { name: string } | null)?.name ?? '') as string;
    for (const r of (props['Owner']?.relation as Array<{ id: string }> | undefined) ?? []) {
      const e = taskMap.get(r.id) ?? { total: 0, done: 0 };
      e.total++; if (status === 'Done') e.done++;
      taskMap.set(r.id, e);
    }
  }

  // Timeline buckets: last 6 calendar months
  const now = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count: 0,
    };
  });

  // Aggregation maps
  const relCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const typeCounts: Record<string, number> = {};
  let totalPeople = 0, totalOrgs = 0, totalActive = 0;
  const profiles: ProfileSummary[] = [];

  for (const page of profilePages) {
    const p = page as Record<string, unknown>;
    const props = (p.properties ?? {}) as Record<string, Record<string, unknown>>;
    const id = String(p.id ?? '');
    const name = extractTitle(p);
    const profileType = ((props['Profile Type']?.select as { name: string } | null)?.name ?? 'Person');
    const engStatus  = ((props['Engagement Status']?.select as { name: string } | null)?.name ?? 'Unknown');
    const relationship = ((props['Relationship to Org']?.select as { name: string } | null)?.name ?? (props['Community Relationship']?.select as { name: string } | null)?.name ?? (props['Relationship to Amora']?.select as { name: string } | null)?.name ?? '');
    const tags = ((props['Tags']?.multi_select as Array<{ name: string }> | undefined) ?? []).map(t => t.name);
    const firstSeen = ((props['First Seen']?.date as { start: string } | null)?.start ?? '');

    if (profileType === 'Organization' || profileType === 'Both') totalOrgs++;
    if (profileType === 'Person' || profileType === 'Both') totalPeople++;
    if (engStatus === 'Active') totalActive++;
    typeCounts[profileType] = (typeCounts[profileType] ?? 0) + 1;
    if (relationship) relCounts.set(relationship, (relCounts.get(relationship) ?? 0) + 1);
    for (const tag of tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    if (firstSeen) {
      const bkt = monthBuckets.find(b => b.key === firstSeen.slice(0, 7));
      if (bkt) bkt.count++;
    }

    const roles = roleCount.get(id) ?? 0;
    const meetings = meetCount.get(id) ?? 0;
    const tasks = taskMap.get(id) ?? { total: 0, done: 0 };
    const seraScore = roles * 10 + meetings * 5 + tasks.done * 3 + tasks.total;

    profiles.push({ id, name, profileType, engagementStatus: engStatus, relationship, tags, firstSeen, activeRoles: roles, meetingsOrganized: meetings, tasksOwned: tasks.total, tasksDone: tasks.done, seraScore });
  }

  profiles.sort((a, b) => b.seraScore - a.seraScore);

  return {
    topProfiles: profiles.slice(0, 15),
    totalProfiles: profilePages.length,
    totalPeople,
    totalOrgs,
    totalActive,
    byRelationship: Array.from(relCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count })),
    byTag: Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, count]) => ({ label, count })),
    byType: typeCounts,
    timeline: monthBuckets.map(b => ({ month: b.label, count: b.count })),
  };
}

function getWeekBuckets(now: Date, count: number): Array<{ start: Date; end: Date; label: string }> {
  const daysToMonday = (now.getDay() + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - (count - 1 - i) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end, label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  });
}

async function fetchTaskPerformanceData(notion: Client, tasksDbId: string): Promise<PerformanceData> {
  // Paginate all tasks
  const allTasks: unknown[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({ database_id: tasksDbId, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    allTasks.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);

  // Collect unique owner profile IDs
  const ownerIds = new Set<string>();
  for (const t of allTasks) {
    const props = ((t as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    for (const r of (props['Owner']?.relation as Array<{ id: string }> | undefined) ?? []) ownerIds.add(r.id);
  }

  // Resolve profile names
  const profileNames = new Map<string, string>();
  if (ownerIds.size > 0) {
    const ownerIdArr = Array.from(ownerIds);
    const fetched = await Promise.allSettled(ownerIdArr.map(id => notion.pages.retrieve({ page_id: id })));
    fetched.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        profileNames.set(ownerIdArr[idx], extractTitle(result.value as unknown as Record<string, unknown>));
      }
    });
  }

  // Aggregate
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const byStatus = { open: 0, inProgress: 0, done: 0, cancelled: 0, needsOwner: 0 };
  const priority = { high: 0, medium: 0, low: 0 };
  let totalOverdue = 0;
  type OwnerEntry = { name: string; profileId: string | null; total: number; done: number; overdue: number };
  const byOwner = new Map<string, OwnerEntry>();

  for (const t of allTasks) {
    const props = ((t as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    const status = ((props['Status']?.select as { name: string } | null)?.name ?? '') as string;
    const dueDate = ((props['Due Date']?.date as { start: string } | null)?.start ?? null) as string | null;
    const prio   = ((props['Priority']?.select as { name: string } | null)?.name ?? '') as string;
    const ownerRel = (props['Owner']?.relation as Array<{ id: string }> | undefined) ?? [];

    if (status === 'Done') byStatus.done++;
    else if (status === 'In Progress') byStatus.inProgress++;
    else if (status === 'Cancelled') byStatus.cancelled++;
    else if (status === 'Needs Owner') byStatus.needsOwner++;
    else byStatus.open++;

    if (prio === 'High') priority.high++;
    else if (prio === 'Medium') priority.medium++;
    else if (prio === 'Low') priority.low++;

    const isOverdue = (status === 'Open' || status === 'In Progress') && dueDate !== null && new Date(dueDate) < today;
    if (isOverdue) totalOverdue++;

    const owners = ownerRel.length > 0 ? ownerRel.map((r: { id: string }) => r.id) : [null as string | null];
    for (const ownerId of owners) {
      const key = ownerId ?? '__none__';
      const name = ownerId ? (profileNames.get(ownerId) ?? 'Unknown') : 'Unassigned';
      if (!byOwner.has(key)) byOwner.set(key, { name, profileId: ownerId ?? null, total: 0, done: 0, overdue: 0 });
      const e = byOwner.get(key)!;
      e.total++;
      if (status === 'Done') e.done++;
      if (isOverdue) e.overdue++;
    }
  }

  const leaderboard: TaskPerformer[] = Array.from(byOwner.values())
    .filter(e => e.profileId !== null)
    .sort((a, b) => b.done - a.done || (b.done / Math.max(b.total, 1)) - (a.done / Math.max(a.total, 1)))
    .slice(0, 10)
    .map((e, i) => ({
      profileId: e.profileId,
      name: e.name,
      totalAssigned: e.total,
      totalDone: e.done,
      totalOverdue: e.overdue,
      completionRate: e.total > 0 ? Math.round((e.done / e.total) * 100) : 0,
      rank: i + 1,
    }));

  const weeks = getWeekBuckets(new Date(), 8);
  const velocity: TaskVelocityPoint[] = weeks.map(w => {
    let created = 0, completed = 0;
    for (const t of allTasks) {
      const page = t as Record<string, string>;
      const props = ((t as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
      const completedDate = ((props['Completed Date']?.date as { start: string } | null)?.start ?? null) as string | null;
      const createdAt = new Date(page.created_time ?? '');
      if (createdAt >= w.start && createdAt < w.end) created++;
      if (completedDate) { const cd = new Date(completedDate); if (cd >= w.start && cd < w.end) completed++; }
    }
    return { weekLabel: w.label, created, completed };
  });

  return { leaderboard, velocity, byStatus, priorityBreakdown: priority, totalOverdue };
}

export async function getRolesDirectory(): Promise<RoleDirectoryItem[]> {
  const { notion, dbs } = clients();

  const [rolesRes, circlesRes, allAssignRes] = await Promise.all([
    notion.databases.query({ database_id: dbs.roles, page_size: 100 }),
    notion.databases.query({ database_id: dbs.circles, page_size: 100 }),
    notion.databases.query({ database_id: dbs.roleAssignments, page_size: 100 }),
  ]);

  const circleMap = new Map<string, string>();
  for (const p of circlesRes.results)
    circleMap.set(p.id, extractTitle(p as unknown as Record<string, unknown>));

  // Map role ID → assignments
  type AssignInfo = { name: string; since: string; status: string };
  const assignsByRole = new Map<string, AssignInfo[]>();
  for (const p of allAssignRes.results) {
    const page = p as unknown as Record<string, unknown>;
    const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
    const status = (props['Status']?.select as { name?: string } | null)?.name ?? '';
    const roleRel = (props['Role']?.relation as Array<{ id: string }> | undefined) ?? [];
    if (!roleRel[0]) continue;
    const title = extractTitle(page);
    // Assignment title format: "Person - Role" (legacy records may use " — ")
    const sep = title.includes(' - ') ? ' - ' : title.includes(' — ') ? ' — ' : null;
    const holderName = sep ? title.split(sep)[0].trim() : title;
    const since = (props['Start Date']?.date as { start?: string } | null)?.start ?? '';
    const list = assignsByRole.get(roleRel[0].id) ?? [];
    list.push({ name: holderName, since, status });
    assignsByRole.set(roleRel[0].id, list);
  }

  const items: RoleDirectoryItem[] = [];
  for (const p of rolesRes.results) {
    const page = p as unknown as Record<string, unknown>;
    const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
    const roleStatus = (props['Status']?.select as { name?: string } | null)?.name ?? 'Unknown';
    if (roleStatus === 'Archived') continue;
    const circleRel = (props['Circle']?.relation as Array<{ id: string }> | undefined) ?? [];
    const circleName = circleRel[0] ? (circleMap.get(circleRel[0].id) ?? 'No Circle') : 'No Circle';
    const assignments = assignsByRole.get(String(page.id ?? '')) ?? [];
    const activeHolders = assignments
      .filter(a => a.status === 'Active')
      .map(a => ({ name: a.name, since: a.since }));
    const pastHolders = assignments
      .filter(a => a.status !== 'Active')
      .map(a => ({ name: a.name }));
    items.push({
      roleId:    String(page.id ?? ''),
      roleName:  extractTitle(page),
      roleUrl:   String((page as Record<string, unknown>).url ?? ''),
      roleStatus,
      circleName,
      activeHolders,
      pastHolders,
    });
  }

  // Sort: circle name, then role name
  items.sort((a, b) => a.circleName.localeCompare(b.circleName) || a.roleName.localeCompare(b.roleName));
  return items;
}

export async function getRoleHealth(): Promise<RoleHealthItem[]> {
  const { notion, dbs } = clients();
  const items: RoleHealthItem[] = [];
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Pre-load circles and all roles in parallel — eliminates N+1 page.retrieve calls
  const [circlesRes, allRolesRes, vacantRolesRes, expiringRes] = await Promise.all([
    notion.databases.query({ database_id: dbs.circles, page_size: 100 }),
    notion.databases.query({ database_id: dbs.roles,   page_size: 100 }),
    notion.databases.query({
      database_id: dbs.roles,
      filter: { and: [
        { property: 'Status',           select:   { equals:   'Active'   } },
        { property: 'Role Assignments', relation: { is_empty: true       } },
      ] } as never,
      page_size: 50,
    }),
    notion.databases.query({
      database_id: dbs.roleAssignments,
      filter: { and: [
        { property: 'Status',     select: { equals:       'Active' } },
        { property: 'End Date',   date:   { before:       soon     } },
        { property: 'End Date',   date:   { is_not_empty: true     } },
      ] } as never,
      page_size: 30,
    }),
  ]);

  // Build lookup Maps from prefetched data
  const circleMap = new Map<string, string>(); // page id -> circle name
  for (const p of circlesRes.results) {
    circleMap.set(p.id, extractTitle(p as unknown as Record<string, unknown>));
  }

  const roleMap = new Map<string, { name: string; circleId: string | null }>(); // page id -> {name, circleId}
  for (const p of allRolesRes.results) {
    const props = ((p as unknown as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    const circleRel = (props['Circle']?.relation as Array<{ id: string }> | undefined) ?? [];
    roleMap.set(p.id, {
      name:     extractTitle(p as unknown as Record<string, unknown>),
      circleId: circleRel[0]?.id ?? null,
    });
  }

  for (const p of vacantRolesRes.results) {
    const page = p as unknown as Record<string, unknown>;
    const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
    const circleRel = (props['Circle']?.relation as Array<{ id: string }> | undefined) ?? [];
    const circleName = circleRel[0] ? (circleMap.get(circleRel[0].id) ?? 'Unknown Circle') : 'Unknown Circle';
    items.push({ id: String(page.id ?? ''), roleName: extractTitle(page), circleName, issue: 'vacant', url: String((page as Record<string, string>).url ?? '') });
  }

  for (const p of expiringRes.results) {
    const page = p as unknown as Record<string, unknown>;
    const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
    const roleRel = (props['Role']?.relation as Array<{ id: string }> | undefined) ?? [];
    const roleInfo  = roleRel[0] ? roleMap.get(roleRel[0].id) : null;
    const roleName  = roleInfo?.name  ?? extractTitle(page);
    const circleName = roleInfo?.circleId ? (circleMap.get(roleInfo.circleId) ?? 'Unknown Circle') : 'Unknown Circle';
    items.push({ id: String(page.id ?? ''), roleName, circleName, issue: 'expiring', expiresAt: extractProp(page, 'End Date'), url: String((page as Record<string, string>).url ?? '') });
  }

  return items;
}

export async function getUpcomingReviews(): Promise<UpcomingReviewItem[]> {
  const { notion, dbs } = clients();
  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60-day window
  const items: UpcomingReviewItem[] = [];

  function formulaDate(props: Record<string, Record<string, unknown>>, propName: string): string | null {
    const formula = (props[propName]?.formula ?? {}) as Record<string, unknown>;
    if (formula.type !== 'date') return null;
    return (formula.date as { start?: string } | null)?.start ?? null;
  }

  const [assignRes, policyRes] = await Promise.all([
    notion.databases.query({
      database_id: dbs.roleAssignments,
      filter: { property: 'Status', select: { equals: 'Active' } } as never,
      page_size: 100,
    }),
    dbs.policies
      ? notion.databases.query({
          database_id: dbs.policies,
          filter: { or: [
            { property: 'Status', select: { equals: 'Active' } },
            { property: 'Status', select: { equals: 'Under Review' } },
          ] } as never,
          page_size: 100,
        })
      : Promise.resolve({ results: [] }),
  ]);

  for (const p of assignRes.results) {
    const props = ((p as unknown as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    const reviewDateStr = formulaDate(props, 'Next Review Date');
    if (!reviewDateStr) continue;
    const reviewDate = new Date(reviewDateStr);
    if (reviewDate > horizon) continue;
    const daysUntil = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    items.push({
      id: p.id,
      name: extractTitle(p as unknown as Record<string, unknown>),
      type: 'role',
      reviewDate: reviewDateStr,
      daysUntil,
      url: String((p as Record<string, string>).url ?? ''),
    });
  }

  for (const p of policyRes.results) {
    const props = ((p as unknown as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>;
    const reviewDateStr = formulaDate(props, 'Next Review Date');
    if (!reviewDateStr) continue;
    const reviewDate = new Date(reviewDateStr);
    if (reviewDate > horizon) continue;
    const daysUntil = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    items.push({
      id: p.id,
      name: extractTitle(p as unknown as Record<string, unknown>),
      type: 'policy',
      reviewDate: reviewDateStr,
      daysUntil,
      url: String((p as Record<string, string>).url ?? ''),
    });
  }

  items.sort((a, b) => a.daysUntil - b.daysUntil);
  return items;
}

async function logAdminAction(action: string, targetId: string): Promise<void> {
  const { notion, dbs } = clients();
  const tenantId = process.env.TENANT_ID ?? 'unknown';
  const now = new Date().toISOString();
  try {
    await notion.pages.create({
      parent: { database_id: dbs.processingEvents },
      properties: {
        Event:         { title: [{ text: { content: `Admin Action - ${action}` } }] },
        'Tenant ID':   { rich_text: [{ text: { content: tenantId } }] },
        'Event Type':  { select: { name: 'Admin Action' } },
        Service:       { select: { name: 'Dashboard' } },
        Status:        { select: { name: 'Success' } },
        Timestamp:     { date: { start: now } },
        Details:       { rich_text: [{ text: { content: `${action}: ${targetId}` } }] },
      } as never,
    });
  } catch { /* never let audit logging crash a user action */ }
}

export async function resetEmailForRetry(pageId: string): Promise<void> {
  const { notion } = clients();
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'Processing Status': { select: { name: 'Failed' } },
    } as never,
  });
  _cache = null; _cacheBuiltAt = 0;
  void logAdminAction('reset email for retry', pageId);
}

export async function resetAssetForRetry(pageId: string): Promise<void> {
  const { notion } = clients();
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'Access Status':     { select: { name: 'Needs Access' } },
      'Processing Status': { select: { name: 'Needs Access' } },
      'Retry Count':       { number: 0 },
      'Next Retry At':     { date: { start: new Date().toISOString() } },
      'Error Message':     { rich_text: [{ text: { content: 'Reset by admin dashboard' } }] },
    } as never,
  });
  _cache = null; _cacheBuiltAt = 0;
  void logAdminAction('reset asset for retry', pageId);
}

export function clearDashboardCache(): void {
  _cache = null; _cacheBuiltAt = 0;
}

// ── CRM ───────────────────────────────────────────────────────────────────────

export interface CrmFollowUp {
  id: string;
  name: string;
  nextAction: string;
  followUpDate: string;
  followUpOwner: string;
  leadStage: string;
  url: string;
}

export interface CrmInteraction {
  id: string;
  name: string;
  date: string;
  type: string;
  direction: string;
  summary: string;
  followUpNeeded: boolean;
  url: string;
}

export interface CrmPipelineStage {
  stage: string;
  count: number;
}

export interface CrmData {
  pipeline: CrmPipelineStage[];
  followUps: CrmFollowUp[];
  recentInteractions: CrmInteraction[];
  totalContacts: number;
  interactionsEnabled: boolean;
}

export async function getCrmData(): Promise<CrmData> {
  const { notion, dbs } = clients();
  const today = new Date().toISOString().slice(0, 10);

  const STAGES = ['New Lead', 'Qualified', 'Engaged', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Not a Lead'];

  // Fetch profiles with a Lead Stage set
  const profilePages = await paginatePages(notion, dbs.profiles, {
    property: 'Lead Stage', select: { is_not_empty: true },
  } as never);

  const stageCounts = new Map<string, number>(STAGES.map(s => [s, 0]));
  const followUps: CrmFollowUp[] = [];

  for (const p of profilePages) {
    const page = p as Record<string, unknown>;
    const stage = extractProp(page, 'Lead Stage');
    if (stage) stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);

    const followUpDate = extractProp(page, 'Follow-up Date');
    if (followUpDate && followUpDate <= today) {
      followUps.push({
        id:             String(page.id ?? ''),
        name:           extractTitle(page),
        nextAction:     extractProp(page, 'Next Action'),
        followUpDate,
        followUpOwner:  extractProp(page, 'Follow-up Owner'),
        leadStage:      stage,
        url:            String((page as Record<string, string>).url ?? ''),
      });
    }
  }

  followUps.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

  // Recent interactions
  let recentInteractions: CrmInteraction[] = [];
  if (dbs.interactions) {
    try {
      const res = await notion.databases.query({
        database_id: dbs.interactions,
        sorts: [{ property: 'Date', direction: 'descending' }],
        page_size: 15,
      });
      recentInteractions = res.results.map(p => {
        const page = p as unknown as Record<string, unknown>;
        const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
        const followUpNeeded = (props['Follow-up Needed']?.checkbox as boolean | undefined) ?? false;
        return {
          id:             String(page.id ?? ''),
          name:           extractTitle(page),
          date:           extractProp(page, 'Date'),
          type:           extractProp(page, 'Type'),
          direction:      extractProp(page, 'Direction'),
          summary:        extractProp(page, 'Summary'),
          followUpNeeded,
          url:            String((page as Record<string, string>).url ?? ''),
        };
      });
    } catch { /* interactions DB not yet configured */ }
  }

  const pipeline: CrmPipelineStage[] = STAGES
    .map(stage => ({ stage, count: stageCounts.get(stage) ?? 0 }))
    .filter(s => s.count > 0);

  return {
    pipeline,
    followUps,
    recentInteractions,
    totalContacts: profilePages.length,
    interactionsEnabled: Boolean(dbs.interactions),
  };
}

// ── Collapse pattern health ───────────────────────────────────────────────────

async function getCollapsePatternSignals(): Promise<CollapseHealth> {
  const { notion, dbs } = clients();

  const results = await notion.databases.query({
    database_id: dbs.risks,
    filter: {
      and: [
        { property: 'Category', select: { equals: 'Collapse Pattern' } },
        { property: 'Status',   select: { equals: 'Open' } },
      ],
    } as never,
    page_size: 100,
  });

  const patternCounts: Record<string, number> = {};
  for (const p of COLLAPSE_PATTERNS) patternCounts[p] = 0;

  const signals: CollapseSignal[] = results.results.map(p => {
    const page = p as unknown as Record<string, unknown>;
    const title = extractTitle(page);

    // Parse "[Pattern Name] description" prefix
    const match = title.match(/^\[([^\]]+)\]\s*(.*)/);
    const rawPattern = match ? match[1].trim() : 'Unknown';
    const patternType = (COLLAPSE_PATTERNS as readonly string[]).includes(rawPattern)
      ? (rawPattern as CollapsePatternName)
      : 'Unknown';
    if (patternType !== 'Unknown') patternCounts[patternType] = (patternCounts[patternType] ?? 0) + 1;

    const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
    const severity = ((props['Severity']?.select as { name: string } | null)?.name ?? 'Medium') as 'High' | 'Medium' | 'Low';
    const createdTime = String((page as Record<string, string>).created_time ?? '');

    return {
      id: String(page.id ?? ''),
      risk: title,
      patternType,
      severity,
      detectedAt: createdTime.slice(0, 10),
      url: String((page as Record<string, string>).url ?? ''),
    };
  });

  // Sort by severity then date desc
  const sevOrder = { High: 0, Medium: 1, Low: 2 };
  signals.sort((a, b) => (sevOrder[a.severity] - sevOrder[b.severity]) || b.detectedAt.localeCompare(a.detectedAt));

  return { signals, patternCounts, totalActive: signals.length };
}
