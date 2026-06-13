import Anthropic from '@anthropic-ai/sdk';
import { Client as NotionClient } from '@notionhq/client';
import { getConfig, getNotionDatabaseIds } from '../config/ConfigService';
import { HubSettingsService, type CorrectionMode } from './HubSettingsService';
import { NotionWriterService } from './NotionWriterService';
import { logger } from '../config/logger';
import { sanitizeSelect } from '../utils/sanitize';

const N = NotionWriterService;
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 20; // records per language-detection call

type DbKey = keyof ReturnType<typeof getNotionDatabaseIds>;

interface ScannableDb {
  key: DbKey;
  label: string;
  titleProp: string;
  textProps: string[];
}

// Databases eligible for language normalization scanning.
// Protected governance databases (decisions, policies, roles, etc.) are excluded
// from auto-update (modes C/D) but can still generate MRQ proposals (modes A/B).
const SCANNABLE_DBS: ScannableDb[] = [
  { key: 'messages',           label: 'Messages',          titleProp: 'Title',         textProps: ['Summary', 'Requests', 'Commitments', 'Questions'] },
  { key: 'tasks',              label: 'Tasks',             titleProp: 'Task',          textProps: ['Task'] },
  { key: 'decisionCandidates', label: 'Decisions',         titleProp: 'Decision',      textProps: ['Decision'] },
  { key: 'risks',              label: 'Risks',             titleProp: 'Risk',          textProps: ['Risk', 'Evidence', 'Suggested Mitigation'] },
  { key: 'knowledgeBase',      label: 'Knowledge Base',    titleProp: 'KB Title',      textProps: ['Summary', 'Key Points'] },
  { key: 'tensions',           label: 'Tensions',          titleProp: 'Tension',       textProps: ['Tension'] },
  { key: 'retrospectives',     label: 'Retrospectives',    titleProp: 'Title',         textProps: ['What Worked', "What Didn't Work", 'What to Change'] },
  { key: 'projects',           label: 'Projects',          titleProp: 'Project Name',  textProps: ['Description'] },
  { key: 'circles',            label: 'Circles',           titleProp: 'Circle Name',   textProps: ['Purpose', 'Domains', 'Accountabilities'] },
];

// Databases where auto-update (modes C/D) is never allowed regardless of settings
const AUTO_UPDATE_PROTECTED = new Set<DbKey>([
  'decisionCandidates',
  'canonChangeRequests',
  'ccosLedgerEntries',
  'policies',
  'roles',
  'roleAssignments',
]);

interface RecordSample {
  pageId: string;
  title: string;
  dbKey: DbKey;
  dbLabel: string;
  fields: Record<string, string>; // fieldName -> text content
  combinedText: string;
}

export interface DbNormalizationResult {
  database: string;
  scanned: number;
  flagged: number;
  created: number;
}

export interface NormalizationResult {
  hubLanguage: string;
  correctionMode: CorrectionMode;
  dryRun: boolean;
  scanned: number;
  flagged: number;
  created: number;
  errors: number;
  databaseResults: DbNormalizationResult[];
}

export class LanguageNormalizationService {
  private notion: NotionClient;
  private writer: NotionWriterService;
  private anthropic: Anthropic;
  private dbIds: ReturnType<typeof getNotionDatabaseIds>;

  constructor() {
    const config = getConfig();
    this.notion = new NotionClient({ auth: config.NOTION_API_KEY });
    this.writer = new NotionWriterService();
    this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    this.dbIds = getNotionDatabaseIds(config);
  }

  async scan(options: {
    databases?: string[];
    dryRun?: boolean;
    limitPerDb?: number;
    correctionModeOverride?: CorrectionMode;
  } = {}): Promise<NormalizationResult> {
    const hubLanguage = HubSettingsService.getInstance().outputLanguage;
    const correctionMode = options.correctionModeOverride ?? HubSettingsService.getInstance().correctionMode;
    const dryRun = options.dryRun ?? false;
    const limitPerDb = options.limitPerDb ?? 100;

    const result: NormalizationResult = {
      hubLanguage,
      correctionMode,
      dryRun,
      scanned: 0,
      flagged: 0,
      created: 0,
      errors: 0,
      databaseResults: [],
    };

    const dbs = options.databases
      ? SCANNABLE_DBS.filter(d => options.databases!.includes(d.key))
      : SCANNABLE_DBS;

    for (const db of dbs) {
      const dbId: string = this.dbIds[db.key] as string;
      if (!dbId) {
        logger.debug({ db: db.key }, 'Language normalization: skipping DB with no ID configured');
        continue;
      }

      const dbResult: DbNormalizationResult = { database: db.label, scanned: 0, flagged: 0, created: 0 };
      try {
        await this.scanDatabase(db, dbId, hubLanguage, correctionMode, dryRun, limitPerDb, dbResult, result);
      } catch (err) {
        logger.error({ err, db: db.key }, 'Language normalization: DB scan failed');
        result.errors++;
      }
      result.databaseResults.push(dbResult);
    }

    logger.info({ scanned: result.scanned, flagged: result.flagged, created: result.created }, 'Language normalization scan complete');
    return result;
  }

  private async scanDatabase(
    db: ScannableDb,
    dbId: string,
    hubLanguage: string,
    correctionMode: CorrectionMode,
    dryRun: boolean,
    limit: number,
    dbResult: DbNormalizationResult,
    globalResult: NormalizationResult,
  ): Promise<void> {
    const records: RecordSample[] = [];
    let cursor: string | undefined;
    let fetched = 0;

    do {
      const resp = await this.notion.databases.query({
        database_id: dbId,
        page_size: Math.min(100, limit - fetched),
        ...(cursor ? { start_cursor: cursor } : {}),
      });

      for (const page of resp.results) {
        const props = (page as { id: string; properties: Record<string, any> }).properties;
        const fields: Record<string, string> = {};
        let combined = '';

        // Extract title field
        const titleText = this.extractTitle(props, db.titleProp);
        if (titleText) {
          fields[db.titleProp] = titleText;
          combined += titleText + ' ';
        }

        // Extract rich_text fields
        for (const fieldName of db.textProps) {
          if (fieldName === db.titleProp) continue;
          const text = this.extractRichText(props, fieldName);
          if (text) {
            fields[fieldName] = text;
            combined += text + ' ';
          }
        }

        combined = combined.trim();
        // Skip records with too little text to meaningfully detect language
        if (combined.length < 40) continue;

        records.push({
          pageId: page.id,
          title: titleText || '(untitled)',
          dbKey: db.key,
          dbLabel: db.label,
          fields,
          combinedText: combined,
        });
        fetched++;
      }

      cursor = resp.has_more && resp.next_cursor ? resp.next_cursor : undefined;
    } while (cursor && fetched < limit);

    dbResult.scanned = records.length;
    globalResult.scanned += records.length;

    if (records.length === 0) return;

    // Batch detect languages
    const flagged = await this.detectNonHubLanguageRecords(records, hubLanguage);
    dbResult.flagged = flagged.length;
    globalResult.flagged += flagged.length;

    if (flagged.length === 0 || correctionMode === 'A' || dryRun) {
      if (dryRun && flagged.length > 0) {
        logger.info({ db: db.label, flagged: flagged.map(r => r.title) }, 'Language normalization: dry run - would create MRQ items');
      }
      return;
    }

    // Mode B: create MRQ items with proposed corrections
    // Modes C/D: auto-update non-protected databases (future - falls back to B for now)
    for (const record of flagged) {
      try {
        const detectedLanguage = record.detectedLanguage;
        const corrections = await this.generateCorrections(record, detectedLanguage, hubLanguage);
        await this.createMrqItem(record, corrections, detectedLanguage, hubLanguage);
        dbResult.created++;
        globalResult.created++;
      } catch (err) {
        logger.warn({ err, page: record.pageId, db: db.label }, 'Language normalization: failed to create MRQ item');
        globalResult.errors++;
      }
    }
  }

  private async detectNonHubLanguageRecords(
    records: RecordSample[],
    hubLanguage: string,
  ): Promise<Array<RecordSample & { detectedLanguage: string }>> {
    const flagged: Array<RecordSample & { detectedLanguage: string }> = [];

    // Process in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const samples = batch.map((r, idx) => `[${idx}] ${r.combinedText.slice(0, 300)}`).join('\n\n');

      const prompt = `The target language for this organization's records is ${hubLanguage}.
Identify the primary language of each numbered text sample below.
Return ONLY a JSON array. Include only entries where the language is NOT ${hubLanguage}.
Format: [{"i": 0, "lang": "Dutch"}, ...]
If all samples are in ${hubLanguage}, return [].

${samples}`;

      try {
        const resp = await this.anthropic.messages.create({
          model: HAIKU_MODEL,
          max_tokens: 256,
          messages: [{ role: 'user', content: prompt }],
        });
        const text = (resp.content[0] as { type: 'text'; text: string }).text.trim();
        const parsed: Array<{ i: number; lang: string }> = JSON.parse(text.replace(/```json?|```/g, '').trim());
        for (const entry of parsed) {
          if (entry.i >= 0 && entry.i < batch.length) {
            flagged.push({ ...batch[entry.i], detectedLanguage: entry.lang });
          }
        }
      } catch (err) {
        logger.warn({ err }, 'Language normalization: batch language detection failed');
      }
    }

    return flagged;
  }

  private async generateCorrections(
    record: RecordSample,
    fromLanguage: string,
    toLanguage: string,
  ): Promise<Record<string, string>> {
    const fieldsJson = JSON.stringify(record.fields, null, 2);
    const prompt = `Translate the following JSON field values from ${fromLanguage} to ${toLanguage}.
Rules:
- Translate all field values. Do NOT translate proper nouns (names of people, places, organizations).
- Return ONLY valid JSON with the same keys. No explanation, no markdown.
- Preserve the meaning faithfully.

${fieldsJson}`;

    try {
      const resp = await this.anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = (resp.content[0] as { type: 'text'; text: string }).text.trim();
      return JSON.parse(text.replace(/```json?|```/g, '').trim());
    } catch (err) {
      logger.warn({ err, pageId: record.pageId }, 'Language normalization: correction generation failed, using empty corrections');
      return {};
    }
  }

  private async createMrqItem(
    record: RecordSample & { detectedLanguage: string },
    corrections: Record<string, string>,
    detectedLanguage: string,
    hubLanguage: string,
  ): Promise<void> {
    const titleSlug = record.title.slice(0, 40).replace(/\s+/g, ' ').trim();
    const mrqTitle = `[Lang Norm] ${record.dbLabel}: ${titleSlug}`;

    // Dedup - skip if an MRQ item with this title already exists
    const existing = await this.writer.findByTitle(this.dbIds.memoryReviewQueue, 'Proposed Memory', mrqTitle);
    if (existing) {
      logger.debug({ mrqTitle }, 'Language normalization: MRQ item already exists, skipping');
      return;
    }

    // Build the correction detail text
    const correctionLines: string[] = [
      `LANGUAGE NORMALIZATION PROPOSAL`,
      `Record: ${record.title}`,
      `Database: ${record.dbLabel}`,
      `Notion page ID: ${record.pageId}`,
      `Detected language: ${detectedLanguage}`,
      `Target language: ${hubLanguage}`,
      ``,
      `PROPOSED CORRECTIONS:`,
    ];

    for (const [fieldName, originalText] of Object.entries(record.fields)) {
      const corrected = corrections[fieldName];
      if (corrected && corrected !== originalText) {
        correctionLines.push(`\n[${fieldName}]`);
        correctionLines.push(`ORIGINAL: ${originalText.slice(0, 500)}`);
        correctionLines.push(`PROPOSED: ${corrected.slice(0, 500)}`);
      }
    }

    if (correctionLines.length <= 9) {
      // No corrections were generated - still create the MRQ to flag the record
      correctionLines.push(`(No field-level corrections generated - please review manually)`);
    }

    const memoryDetail = correctionLines.join('\n');
    const sourceEvidence = `Detected ${detectedLanguage} content in ${record.dbLabel} DB. Notion page: ${record.pageId}`;

    await this.writer.createPage(this.dbIds.memoryReviewQueue, {
      'Proposed Memory': N.title(mrqTitle),
      'Memory Detail':   N.richText(memoryDetail),
      Category:          N.select(sanitizeSelect('Language Normalization', ['Context', 'Relationship', 'Commitment', 'Decision', 'Learning', 'Process', 'Language Normalization', 'Unknown'], 'Unknown')),
      'Source Evidence': N.richText(sourceEvidence),
      Confidence:        N.select('High'),
      Priority:          N.select('This Week'),
      'Risk If Ignored': N.richText(`Records in ${detectedLanguage} create inconsistency in the hub and increase review labor.`),
      'Suggested Destination': N.richText(`Update the existing ${record.dbLabel} record (Notion: ${record.pageId})`),
      Status:            N.select('Pending Review'),
      'Approved Date':   N.date(null),
    });

    logger.info({ mrqTitle, db: record.dbLabel, detectedLanguage }, 'Language normalization: MRQ item created');
  }

  private extractTitle(props: Record<string, any>, propName: string): string {
    return (props[propName]?.title ?? []).map((t: any) => t.plain_text).join('').trim();
  }

  private extractRichText(props: Record<string, any>, propName: string): string {
    return (props[propName]?.rich_text ?? []).map((t: any) => t.plain_text).join('').trim();
  }
}
