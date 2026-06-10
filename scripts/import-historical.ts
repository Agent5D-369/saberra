/**
 * Historical email import — processes past emails from IMAP into Notion.
 *
 * Usage:
 *   npx ts-node scripts/import-historical.ts
 *   npx ts-node scripts/import-historical.ts --since 2025-01-01
 *   npx ts-node scripts/import-historical.ts --since 2025-01-01 --dry-run
 *
 * Options:
 *   --since YYYY-MM-DD   Only import messages received on or after this date (default: all)
 *   --dry-run            Classify and count emails without writing to Notion
 *   --limit N            Stop after N emails (default: 500)
 *
 * The script does NOT mark emails as seen on IMAP. It relies on Notion Message ID
 * dedup to skip emails already ingested by the worker.
 */

import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { getConfig } from '../src/config/ConfigService';
import { logger } from '../src/config/logger';
import { NotionWriterService } from '../src/services/NotionWriterService';
import { PipelineService } from '../src/services/PipelineService';
import { EmailClassifierService } from '../src/services/EmailClassifierService';
import type { ParsedEmail } from '../src/types';

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs(): { since: Date | null; dryRun: boolean; limit: number } {
  const args = process.argv.slice(2);
  let since: Date | null = null;
  let dryRun = false;
  let limit = 500;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--since' && args[i + 1]) {
      since = new Date(args[++i]);
      if (isNaN(since.getTime())) {
        console.error(`Invalid --since date: ${args[i]}`);
        process.exit(1);
      }
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit < 1) {
        console.error(`Invalid --limit: ${args[i]}`);
        process.exit(1);
      }
    }
  }

  return { since, dryRun, limit };
}

// ─── IMAP fetch ───────────────────────────────────────────────────────────────

async function fetchAllMessages(since: Date | null, limit: number): Promise<ParsedEmail[]> {
  const config = getConfig();
  const client = new ImapFlow({
    host: config.IMAP_HOST,
    port: config.IMAP_PORT,
    secure: config.IMAP_PORT === 993,
    auth: { user: config.IMAP_USER, pass: config.IMAP_PASS },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  const results: ParsedEmail[] = [];

  try {
    const criteria: Record<string, unknown> = since
      ? { since }
      : { all: true };

    const searchResult = await client.search(criteria as any, { uid: true });
    const uids = Array.isArray(searchResult) ? searchResult : [];
    const total = uids.length;
    logger.info({ total, since: since?.toISOString() ?? 'all' }, 'IMAP messages found');

    let fetched = 0;
    for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
      if (fetched >= limit) break;
      try {
        if (!msg.source) continue;
        const mail = await simpleParser(msg.source as Buffer);
        const messageId = mail.messageId ?? `imap-uid-${msg.uid}`;
        const receivedDate = (mail.date ?? new Date()).toISOString();
        const bodyText = mail.text ?? '';
        const bodyHtml = typeof mail.html === 'string' ? mail.html : '';
        const fullText = bodyText || bodyHtml;
        const urlRegex = /https?:\/\/[^\s"'<>)]+/g;
        const detectedLinks = [...new Set(fullText.match(urlRegex) ?? [])];
        const threadReference = mail.inReplyTo
          ?? (Array.isArray(mail.references) ? mail.references[0] : undefined)
          ?? undefined;

        results.push({
          messageId,
          threadReference,
          from: mail.from?.text ?? '',
          to: mail.to ? (Array.isArray(mail.to) ? mail.to.map((a: { text: string }) => a.text).join(', ') : mail.to.text) : '',
          cc: mail.cc ? (Array.isArray(mail.cc) ? mail.cc.map((a: { text: string }) => a.text).join(', ') : mail.cc.text) : '',
          subject: mail.subject ?? '(no subject)',
          receivedDate,
          bodyText,
          bodyHtml,
          emailType: 'Unknown',
          detectedLinks,
        });
        fetched++;
      } catch (err) {
        logger.warn({ uid: msg.uid, err }, 'Failed to parse message — skipping');
      }
    }

    logger.info({ fetched, total, limitHit: fetched >= limit }, 'Messages fetched from IMAP');
  } finally {
    lock.release();
    await client.logout();
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { since, dryRun, limit } = parseArgs();
  logger.info({ since: since?.toISOString() ?? 'all', dryRun, limit }, 'Starting historical import');

  const messages = await fetchAllMessages(since, limit);
  if (messages.length === 0) {
    logger.info('No messages found — nothing to import');
    return;
  }

  const classifier = new EmailClassifierService();
  const typeCounts: Record<string, number> = {};
  for (const msg of messages) {
    msg.emailType = classifier.classify(msg);
    typeCounts[msg.emailType] = (typeCounts[msg.emailType] ?? 0) + 1;
  }
  logger.info({ typeCounts }, 'Email classification summary');

  if (dryRun) {
    logger.info('Dry run — no Notion writes. Classification complete.');
    return;
  }

  // Pre-filter: skip already-ingested messages
  const notion = new NotionWriterService();
  const toProcess: ParsedEmail[] = [];
  let skipped = 0;

  logger.info('Checking Notion dedup for each message...');
  for (const parsed of messages) {
    const existing = await notion.findByRichText(
      notion.dbIds.sourceEmails,
      'Message ID',
      parsed.messageId,
    );
    if (existing) {
      skipped++;
    } else {
      toProcess.push(parsed);
    }
    // Small delay to avoid Notion rate limits during bulk lookup
    await new Promise((r) => setTimeout(r, 200));
  }

  logger.info({ total: messages.length, skipped, toProcess: toProcess.length }, 'Dedup check complete');

  if (toProcess.length === 0) {
    logger.info('All messages already in Notion — nothing to import');
    return;
  }

  // Sort oldest-first so extraction context builds up naturally
  toProcess.sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));

  const pipeline = new PipelineService();
  const batchSize = 20;
  let processed = 0;

  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize);
    logger.info({ batchStart: i + 1, batchEnd: i + batch.length, total: toProcess.length }, 'Processing batch');
    await pipeline.runImportBatch(batch);
    processed += batch.length;
    logger.info({ processed, remaining: toProcess.length - processed }, 'Batch complete');

    // Pause between batches to let Claude/Notion rate limits recover
    if (i + batchSize < toProcess.length) {
      logger.info('Pausing 10s between batches...');
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }

  logger.info({ processed, skipped }, 'Historical import complete');
}

main().catch((err) => {
  logger.error({ err }, 'Historical import failed');
  process.exit(1);
});
