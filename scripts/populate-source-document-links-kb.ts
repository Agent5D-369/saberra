import * as dotenv from 'dotenv';
dotenv.config();
import { NotionWriterService } from '../src/services/NotionWriterService';
import { logger } from '../src/config/logger';
const N = NotionWriterService;

async function main() {
  const notion = new NotionWriterService();
  const today = new Date().toISOString().slice(0, 10);
  const title = 'Source Document Links — Jumping Directly to the Source';
  const summary = 'Every task, decision, and risk that Sera extracts from a meeting now includes a Source Document link — a direct URL to the Google Doc (transcript or notes) that generated it. Instead of navigating meeting → transcript → open, you jump straight to the relevant source document from any Notion record. For forwarded emails that reference a Drive or Docs link, that is surfaced as the source document too.';
  const keyPoints = `WHAT THE SOURCE DOCUMENT LINK IS
Each task, decision, and risk in Notion now has a Source Document field containing a direct URL to the Google Doc used in extraction — typically the meeting transcript or Gemini notes.

Before this change, tracing a task back to its source required:
1. Open the task in Notion
2. Click the Meeting relation
3. Find the Transcript Link or Notes Link on the meeting record
4. Open the document

With Source Document on the record itself, you go directly from the task to the document in one click.

WHERE IT COMES FROM
For meeting extractions (Transcript or Gemini Notes): the URL points to the Google Docs document that Sera exported and sent to Claude. Format: https://docs.google.com/document/d/{docId}/edit

For operational emails and forwarded threads: if the email contains a Google Docs or Drive link, that link is surfaced as the Source Document. Useful for forwarded threads that reference a shared document.

If there is no source document (a short email with no Drive link), the field is left blank.

WHICH RECORDS HAVE IT
Tasks — links to the transcript or notes the task was extracted from.
Decision Candidates — links to the source that surfaced the decision.
Risks — links to the source that surfaced the risk.

Memory Review Queue and Canon Change Requests use Source Evidence (text) and the Meeting relation for navigation.

HOW TO USE IT
When reviewing a task and you want full context:
- Open the task in Notion
- Click Source Document to jump directly to the transcript or notes
- Use Ctrl+F / Cmd+F to search for the exact phrase in the Source Evidence field

When auditing decisions for a governance meeting:
- Open the decision in Notion
- Click Source Document to read the full discussion that led to it

EXISTING RECORDS
Records created before this change will not have a Source Document link — it applies to all extractions going forward.`;

  const existing = await notion.findByTitle(notion.dbIds.knowledgeBase, 'KB Title', title);
  if (existing) {
    await notion.updatePage(existing, { Summary: N.richText(summary), 'Key Points': N.richTextLong(keyPoints), 'Last Enriched At': N.date(today) });
    console.log('Updated: ' + title);
  } else {
    await notion.createPage(notion.dbIds.knowledgeBase, {
      'KB Title': N.title(title),
      Category: N.select('Technology'),
      Audience: N.multiSelect(['All Members', 'Circle Leads']),
      Summary: N.richText(summary),
      'Key Points': N.richTextLong(keyPoints),
      Status: N.select('Published'),
      Confidence: N.select('High'),
      Source: N.richText('Source document links feature'),
      'Published At': N.date(today),
      'Last Enriched At': N.date(today),
    });
    console.log('Created: ' + title);
  }
}
main().catch(err => { logger.error({ err }, 'failed'); process.exit(1); });
