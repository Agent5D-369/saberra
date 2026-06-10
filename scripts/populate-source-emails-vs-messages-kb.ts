/**
 * Adds a KB article explaining the difference between Source Emails and Messages.
 * Usage: npx ts-node scripts/populate-source-emails-vs-messages-kb.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { NotionWriterService } from '../src/services/NotionWriterService';
import { logger } from '../src/config/logger';

const N = NotionWriterService;

const ARTICLE = {
  title: 'Source Emails vs. Messages — What\'s the Difference?',
  category: 'Technology',
  audience: ['All Members', 'Circle Leads', 'Tech Team'],
  summary: `Sera writes to two email-related Notion databases — Source Emails and Messages — and they are not redundant. Source Emails is the raw intake log created for every email Sera receives, regardless of type. Messages is the semantic extraction record created only for operational emails and forwarded threads after Claude has analyzed the content. Understanding the difference helps you know where to look for what.`,
  keyPoints: `SOURCE EMAILS — THE INGESTION LOG
Source Emails is created for every single email Sera receives — before any processing happens.
It is Sera's receipt and audit trail. It proves an email arrived, tracks whether it was processed or failed, and stores the raw signals Sera used to classify it.

What it contains:
- Message ID: the deduplication key. Sera checks this before doing anything — if the message ID is already in this database, the email is skipped. This prevents double-processing even if Sera crashes mid-run.
- Email Type: how Sera classified the email (Google Meet Recording, Transcript, Gemini Notes, Operational Email, Forwarded Thread, Unknown)
- Source Category: Meeting Asset or Operational — the top-level branch in Sera's processing logic
- Processing Status: Processing → Processed, Failed, or Manual Review
- Raw Snippet: first 500 characters of the email body — useful for debugging classification errors
- Detected Links: all URLs found in the email
- Error Log: what went wrong if the email failed to process

When to look here: if Sera missed an email, check Source Emails first. Search by subject or date. If the record exists with Status = Failed, the Error Log will tell you what happened. If the record does not exist at all, Sera never received the email.

MESSAGES — THE SEMANTIC EXTRACTION RECORD
Messages is created only for Operational Email and Forwarded Thread types, after Claude has analyzed the email content.
It holds the meaning of the email — the summary, what was asked, what was promised, who sent it.

What it contains:
- Message Title: the email subject
- Summary: Claude's plain-text summary of the email
- Requests: what the email was asking for
- Commitments: explicit promises made (these also become Tasks)
- Questions: open questions raised
- Emotional Tone: Neutral, Positive, Tense, Urgent, or Unclear
- Urgency: High, Medium, or Low
- Follow-Up Needed: checkbox
- Sender Profile: relation to the Profiles database — Sera auto-creates a profile if one does not exist
- Confidentiality Level: Standard, Sensitive, or Restricted

When to look here: when you want to understand what an email meant, find a commitment someone made in writing, or see a sender's full interaction history at Amora. Messages is where operational email content lives as structured knowledge.

THE KEY DISTINCTION
Source Emails answers: "Did Sera receive this email? Did she process it successfully?"
Messages answers: "What did this email mean? What was committed? Who sent it?"

HOW EACH EMAIL TYPE FLOWS THROUGH THE SYSTEM

Operational Email or Forwarded Thread:
- Source Emails record created (intake log)
- Claude extracts meaning
- Messages record created (semantic content, linked to Sender Profile)
- Tasks created from any explicit commitments found in the email

Google Meet Recording, Transcript, or Gemini Notes email:
- Source Emails record created (intake log)
- Meeting record created or updated (one per meeting, deduplicated by capture key)
- Meeting Asset record created (one per file type per meeting)
- Once Drive access is confirmed: Claude extracts tasks, decisions, risks, governance records
- NO Messages record is created for meeting emails — the Meeting and Meeting Asset records serve that purpose

Unknown email type:
- Source Emails record created with Processing Status = Manual Review
- No further processing — a human needs to review and decide

PRACTICAL GUIDE
If you are looking for... go to...
An email Sera received but is not sure she processed → Source Emails (search by subject, check Processing Status)
The summary and commitments from an email thread → Messages
Who sent Sera an email and their profile → Messages > Sender Profile
Whether a meeting was captured → Meetings (not Source Emails)
What went wrong with a failed email → Source Emails > Error Log
All emails from a specific person → Messages > filter by Sender Profile`,
};

async function main() {
  const notion = new NotionWriterService();
  const today = new Date().toISOString().slice(0, 10);

  if (!notion.dbIds.knowledgeBase) {
    console.error('NOTION_DB_KNOWLEDGE_BASE not configured');
    process.exit(1);
  }

  const existing = await notion.findByTitle(notion.dbIds.knowledgeBase, 'KB Title', ARTICLE.title);

  if (existing) {
    await notion.updatePage(existing, {
      Summary:            N.richText(ARTICLE.summary),
      'Key Points':       N.richTextLong(ARTICLE.keyPoints),
      'Last Enriched At': N.date(today),
    });
    console.log(`Updated: "${ARTICLE.title}"`);
  } else {
    await notion.createPage(notion.dbIds.knowledgeBase, {
      'KB Title':         N.title(ARTICLE.title),
      Category:           N.select(ARTICLE.category),
      Audience:           N.multiSelect(ARTICLE.audience),
      Summary:            N.richText(ARTICLE.summary),
      'Key Points':       N.richTextLong(ARTICLE.keyPoints),
      Status:             N.select('Published'),
      Confidence:         N.select('High'),
      Source:             N.richText('Source emails vs messages clarification'),
      'Published At':     N.date(today),
      'Last Enriched At': N.date(today),
    });
    console.log(`Created: "${ARTICLE.title}"`);
  }
}

main().catch(err => { logger.error({ err }, 'Script failed'); process.exit(1); });
