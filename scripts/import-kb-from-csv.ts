/**
 * Import Knowledge Base articles from the Notion CSV backup.
 * - Skips Archived / [MERGED] entries
 * - Deduplicates by KB Title (skips if a page with that title already exists in Notion)
 * - Replaces "Sera" with "Sera" throughout all text content (AI persona rename)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

// ── Config ─────────────────────────────────────────────────────────────────────
const NOTION_API_KEY    = process.env.NOTION_API_KEY!;
const KB_DB_ID          = process.env.NOTION_DB_KNOWLEDGE_BASE!;
const CSV_PATH          = process.argv[2] || 'G:/My Drive/RickBroider.com/Projects/QuickLaunch Consulting/Development/Saberra.com/_Backup/Knowledge Base 36d0a88ef36a8101b080ff9ea07b3a9a_all.csv';
const DRY_RUN           = process.env.DRY_RUN === 'true';

if (!NOTION_API_KEY) throw new Error('NOTION_API_KEY not set');
if (!KB_DB_ID)       throw new Error('NOTION_DB_KNOWLEDGE_BASE not set');

const notion = new Client({ auth: NOTION_API_KEY });

// ── Sera→Sera replacement ──────────────────────────────────────────────────────
function seraify(text: string): string {
  if (!text) return text;
  // Replace "Sera" standalone word — not inside URLs (don't touch vera-api-*.railway.app)
  return text
    .replace(/\bVera\b(?![-.]api)/g, 'Sera')
    // Also catch "sera" lowercase as a word (e.g. "sera" in etymology or tips references)
    // but NOT in email addresses or URLs
    .replace(/\bvera\b(?![-@.])/g, 'sera');
}

// ── CSV parser (handles multi-line quoted fields) ──────────────────────────────
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseFullCsv(raw: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  let i = 0;
  let headers: string[] = [];
  let fieldBuf = '';
  let inQuotes = false;
  let rowFields: string[] = [];
  let isFirst = true;

  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuotes && raw[i + 1] === '"') { fieldBuf += '"'; i += 2; continue; }
      inQuotes = !inQuotes; i++; continue;
    }
    if (ch === ',' && !inQuotes) { rowFields.push(fieldBuf); fieldBuf = ''; i++; continue; }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      rowFields.push(fieldBuf);
      fieldBuf = '';
      if (rowFields.some(f => f.trim())) { // skip empty rows
        if (isFirst) { headers = rowFields; isFirst = false; }
        else {
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => { obj[h.trim()] = rowFields[idx] ?? ''; });
          rows.push(obj);
        }
      }
      rowFields = [];
      i++; continue;
    }
    fieldBuf += ch; i++;
  }
  // last row if no trailing newline
  if (rowFields.length || fieldBuf) {
    rowFields.push(fieldBuf);
    if (rowFields.some(f => f.trim()) && !isFirst) {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h.trim()] = rowFields[idx] ?? ''; });
      rows.push(obj);
    }
  }
  return rows;
}

// ── Notion helpers ─────────────────────────────────────────────────────────────
function rt(text: string) {
  const truncated = text.slice(0, 2000);
  return { rich_text: [{ text: { content: truncated } }] };
}
function ttl(text: string) {
  return { title: [{ text: { content: text.slice(0, 2000) } }] };
}
function sel(name: string) {
  return { select: { name } };
}
function ms(names: string[]) {
  return { multi_select: names.filter(Boolean).map(n => ({ name: n.trim() })) };
}
const MONTHS: Record<string,string> = {
  january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',
  july:'07',august:'08',september:'09',october:'10',november:'11',december:'12',
};
function dt(iso: string | undefined) {
  if (!iso?.trim()) return { date: null };
  let d = iso.trim();
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return { date: { start: d } };
  // M/D/YYYY
  const mdY = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdY) return { date: { start: `${mdY[3]}-${mdY[1].padStart(2,'0')}-${mdY[2].padStart(2,'0')}` } };
  // "Month D, YYYY" or "Month DD, YYYY"
  const longDate = d.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longDate) {
    const month = MONTHS[longDate[1].toLowerCase()];
    if (month) return { date: { start: `${longDate[3]}-${month}-${longDate[2].padStart(2,'0')}` } };
  }
  return { date: null };
}

async function titleExists(title: string): Promise<boolean> {
  const res = await notion.databases.query({
    database_id: KB_DB_ID,
    filter: { property: 'KB Title', title: { equals: title } } as never,
    page_size: 1,
  });
  return res.results.length > 0;
}

async function createKbPage(row: Record<string, string>): Promise<void> {
  const title     = seraify(row['KB Title']?.trim() || '');
  const summary   = seraify(row['Summary']?.trim() || '');
  const keyPoints = seraify(row['Key Points']?.trim() || '');
  const source    = seraify(row['Source']?.trim() || '');
  const dupOf     = seraify(row['Possible Duplicate Of']?.trim() || '');

  const rawAudience = row['Audience']?.trim() || '';
  const audience    = rawAudience ? rawAudience.split(',').map(s => s.trim()).filter(Boolean) : [];

  const validCategories = ['How-To','Best Practice','Process','Technology','Governance','Community','Land & Ecology','Finance','Learning','Wellness','General'];
  const rawCat = row['Category']?.trim() || 'General';
  const category = validCategories.includes(rawCat) ? rawCat : 'General';

  const validConfidence = ['High','Medium'];
  const rawConf = row['Confidence']?.trim() || 'High';
  const confidence = validConfidence.includes(rawConf) ? rawConf : 'High';

  const validStatus = ['Draft','Published','Archived'];
  const rawStatus = row['Status']?.trim() || 'Published';
  const status = validStatus.includes(rawStatus) ? rawStatus : 'Published';

  const properties: Record<string, unknown> = {
    'KB Title':   ttl(title),
    Category:     sel(category),
    Audience:     ms(audience),
    Summary:      rt(summary),
    'Key Points': rt(keyPoints),
    Source:       rt(source),
    Status:       sel(status),
    Confidence:   sel(confidence),
  };

  if (dupOf)                          properties['Possible Duplicate Of'] = rt(dupOf);
  const lastEnriched = dt(row['Last Enriched At']);
  const publishedAt  = dt(row['Published At']);
  if (lastEnriched.date)              properties['Last Enriched At'] = lastEnriched;
  if (publishedAt.date)               properties['Published At']     = publishedAt;

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create: ${title} (${status})`);
    return;
  }

  await notion.pages.create({
    parent: { database_id: KB_DB_ID },
    properties: properties as never,
  });
  console.log(`  Created: ${title}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Reading CSV: ${CSV_PATH}`);
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseFullCsv(raw);
  console.log(`Parsed ${rows.length} rows`);

  // Deduplicate by title within the CSV itself (keep first occurrence)
  const seen = new Set<string>();
  const deduped = rows.filter(row => {
    const title = row['KB Title']?.trim();
    if (!title) return false;
    if (seen.has(title)) { console.log(`  [SKIP dup in CSV] ${title}`); return false; }
    seen.add(title);
    return true;
  });
  console.log(`After CSV dedup: ${deduped.length} rows`);

  // Skip archived/merged
  const toImport = deduped.filter(row => {
    const title  = row['KB Title']?.trim() || '';
    const status = row['Status']?.trim() || '';
    if (title.startsWith('[MERGED]')) { console.log(`  [SKIP merged] ${title}`); return false; }
    if (status === 'Archived')         { console.log(`  [SKIP archived] ${title}`); return false; }
    return true;
  });
  console.log(`After filter: ${toImport.length} rows to import\n`);

  let created = 0, skipped = 0;
  for (const row of toImport) {
    const title = seraify(row['KB Title']?.trim() || '');
    if (!DRY_RUN) {
      const exists = await titleExists(title);
      if (exists) { console.log(`  [SKIP exists] ${title}`); skipped++; continue; }
    }
    try {
      await createKbPage(row);
      created++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${title}: ${msg}`);
    }
    // Rate-limit: 3 req/sec
    await new Promise(r => setTimeout(r, 340));
  }

  console.log(`\nDone. Created: ${created}, Skipped (exists): ${skipped}`);
}

main().catch(err => { console.error(err); process.exit(1); });
