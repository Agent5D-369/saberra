/**
 * Adds KB articles about the Amora org Google Drive structure and Claude Teams integration.
 * Usage: npx ts-node scripts/populate-org-drive-kb.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();
import { NotionWriterService } from '../src/services/NotionWriterService';
import { logger } from '../src/config/logger';

const N = NotionWriterService;

const ARTICLES = [
  {
    title: 'Amora Org Drive — Where to Store Files So Everyone Can Access Them',
    category: 'Technology',
    audience: ['All Members', 'Circle Leads'],
    summary: 'Amora uses a Google Shared Drive called "Amora Living Memory" as the central file store for all org assets. Files stored here are automatically accessible to roots@amora.cr (so Sera can process them), visible to all members, and accessible from the Claude Teams interface without permission errors.',
    keyPoints: `THE PROBLEM WITH PERSONAL DRIVE
When org files live in someone\'s personal Google Drive, only that person and anyone they explicitly share with can access them. This creates three problems:

1. Sera (roots@amora.cr) cannot process the file — she sends an access request email to admin
2. Other members cannot find or open the file from Notion or Claude Teams
3. When that person leaves or changes their Google account, the files become inaccessible

This is why you see "access denied" errors and empty folder results when browsing Drive in Claude Teams.

THE ORG SHARED DRIVE: AMORA LIVING MEMORY
The org Shared Drive is called "Amora Living Memory." All org files should go here.

Folder structure:
- Brand Assets: logos, color palette, fonts, brand guidelines, Canva exports
- Governance Docs: CCOS documents, circle charters, Living Constitution, policies
- Meeting Assets: Sera automatically copies accessible meeting transcripts/notes here
- Marketing: marketing plans, campaigns, outreach materials
- Finance: budgets, financial reports, funding documents (circle leads access)
- Templates: role card templates, circle charter templates, onboarding guides

HOW TO ACCESS THE ORG SHARED DRIVE
1. Go to drive.google.com
2. In the left sidebar, click "Shared drives"
3. Find "Amora Living Memory"

If you do not see it, ask a circle lead or admin to add you as a member.

HOW TO ADD FILES
Drag and drop files into the appropriate folder, or use "New" inside the folder.
Files you create or upload here are owned by the drive, not by you personally —
they remain accessible even if your account changes.

WHY VERA CAN ACCESS THESE FILES AUTOMATICALLY
roots@amora.cr is an Organizer in the Amora Living Memory Shared Drive.
Any file placed in this drive is automatically accessible to Sera without any additional
sharing steps. This means:
- Meeting notes placed here are processed immediately on the next poll
- No access request emails are triggered
- The Source Document link in Notion goes directly to the file

WHEN YOU STILL NEED TO SHARE INDIVIDUALLY
Google Meet automatically saves recordings, transcripts, and Gemini notes to the
organizer\'s personal Drive. These cannot be automatically placed in the Shared Drive.
For those files, share with roots@amora.cr directly, or Sera will send an access request.

MIGRATION: MOVING EXISTING FILES
To move a file from your personal Drive to the org Shared Drive:
1. Right-click the file in your Drive
2. Select "Move to" or "Organize"
3. Navigate to Shared drives > Amora Living Memory > appropriate folder
4. Click "Move here"

Note: Moving a file changes its owner to the Shared Drive. You will still be listed
as the person who uploaded it, and you retain full access.`,
  },
  {
    title: 'Claude Teams Setup — Connecting to roots@amora.cr for Full Org Access',
    category: 'Technology',
    audience: ['All Members', 'Circle Leads', 'Tech Team'],
    summary: 'The Claude Teams (claude.ai) interface has Google Drive and Notion integrations. For the best experience at Amora, the Drive integration should be connected to roots@amora.cr — not a personal Google account. This gives Claude visibility into all org files in the Shared Drive without permission errors.',
    keyPoints: `WHY CONNECTION ACCOUNT MATTERS
The Claude Teams Google Drive integration reads files as the Google account it is connected to.
If it is connected to your personal account (e.g., rick@gmail.com), it can only see files
shared with that account — not files owned by Nikita, Caro, or other members.

If it is connected to roots@amora.cr, it can see:
- Everything in the Amora Living Memory Shared Drive
- Any file shared with roots@amora.cr
- Meeting assets that Sera has processed and stored

HOW TO RECONNECT GOOGLE DRIVE IN CLAUDE TEAMS
1. Go to claude.ai
2. Click your profile icon -> Settings -> Integrations
3. Find Google Drive and click Disconnect
4. Click Connect again
5. When Google asks which account, sign in as roots@amora.cr
   (get credentials from the admin if you do not have them)
6. Grant the requested permissions

After reconnecting, ask Claude in Teams to "show me the Amora Living Memory Shared Drive"
to verify it has access.

THE BEST WORKFLOWS IN CLAUDE TEAMS

Finding org files:
  "Show me the latest files in the Brand Assets folder in the Amora Living Memory drive"
  "Find the Amora marketing plan in Drive"

Reading and summarizing documents:
  "Read the CCOS Living Constitution from Drive and summarize the amendment process"
  "What does the Amora Marketing Plan 2026-2027 say about hospitality events?"

Creating Notion records from Drive content:
  "Read the governance doc in Drive and create KB articles for each major section"

Cross-referencing Notion and Drive:
  "Which tasks in Notion reference the marketing plan? Show me what the plan says about those topics"

NOTION WRITE PERMISSIONS IN CLAUDE TEAMS
The Notion integration in Claude Teams may have read-only access. If you get write errors:
1. Go to notion.so/my-integrations
2. Find the Claude integration
3. Under Capabilities, enable "Insert content" and "Update content"
4. Save

For governance records (tasks, decisions, ledger entries), the most reliable path is
always to email roots@amora.cr with the context — Sera will create the Notion records
through the full pipeline with proper audit trail and deduplication.

WHAT VERA DOES VS. WHAT CLAUDE TEAMS DOES
Sera (roots@amora.cr):
- Processes meeting emails and creates structured Notion records automatically
- Maintains the audit trail (Source Emails, Processing Events)
- Handles deduplication — never creates a duplicate task or meeting record
- Sends access requests when Drive files are inaccessible

Claude Teams:
- Reads and synthesizes information from Notion and Drive on request
- Answers questions about org data without creating records
- Drafts content, generates agendas, and helps with analysis
- Can create Notion records directly when Notion write permissions are enabled

The two work best together: Sera keeps the structured data current,
Claude Teams is your intelligence layer on top of it.`,
  },
];

async function main() {
  const notion = new NotionWriterService();
  const today = new Date().toISOString().slice(0, 10);

  if (!notion.dbIds.knowledgeBase) {
    console.error('NOTION_DB_KNOWLEDGE_BASE not configured');
    process.exit(1);
  }

  for (const article of ARTICLES) {
    const existing = await notion.findByTitle(notion.dbIds.knowledgeBase, 'KB Title', article.title);
    if (existing) {
      await notion.updatePage(existing, {
        Summary:            N.richText(article.summary),
        'Key Points':       N.richTextLong(article.keyPoints),
        'Last Enriched At': N.date(today),
      });
      console.log(`Updated: "${article.title}"`);
    } else {
      await notion.createPage(notion.dbIds.knowledgeBase, {
        'KB Title':         N.title(article.title),
        Category:           N.select(article.category),
        Audience:           N.multiSelect(article.audience),
        Summary:            N.richText(article.summary),
        'Key Points':       N.richTextLong(article.keyPoints),
        Status:             N.select('Published'),
        Confidence:         N.select('High'),
        Source:             N.richText('Org Drive setup'),
        'Published At':     N.date(today),
        'Last Enriched At': N.date(today),
      });
      console.log(`Created: "${article.title}"`);
    }
    await new Promise(r => setTimeout(r, 400));
  }
}

main().catch(err => { logger.error({ err }, 'failed'); process.exit(1); });
