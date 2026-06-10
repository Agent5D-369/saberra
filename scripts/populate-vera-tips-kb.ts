/**
 * Populates the Notion Knowledge Base with:
 *   - Sera persona facts and tips
 *   - Powerful Claude Team prompts for interacting with Sera and Notion
 *
 * Idempotent: checks by title before creating. Safe to re-run.
 *
 * Usage: npx ts-node scripts/populate-vera-tips-kb.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { NotionWriterService } from '../src/services/NotionWriterService';
import { logger } from '../src/config/logger';

const N = NotionWriterService;

interface KbArticle {
  title: string;
  category: string;
  audience: string[];
  summary: string;
  keyPoints: string;
  confidence: string;
}

const ARTICLES: KbArticle[] = [
  // ─── Sera Persona & Fun Facts ──────────────────────────────────────────────
  {
    title: 'Meet Sera — Your Living Memory AI',
    category: 'General',
    audience: ['All Members', 'New Members'],
    summary: 'Sera is Amora\'s AI secretary, named with intention: from the Latin "sera" (truth) and the Spanish "sera" (edge of a riverbank) — the place where land meets water, where boundaries become thresholds. She holds Amora\'s institutional memory with clarity, care, and the quiet precision of someone who never forgets.',
    keyPoints: `Her name means truth and the edge where things meet — fitting for a system that sits at the boundary between human intention and institutional memory.

She lives at roots@amora.cr — the email address that connects her to every meeting, decision, and conversation flowing through Amora.

She processes all Google Meet recordings, transcripts, and Gemini notes automatically when Google emails roots@amora.cr after a meeting.

She never approves or publishes anything on her own — every structured record she creates is a draft or candidate waiting for human wisdom.

She writes to 17 Notion databases, from Profiles and Circles to Tasks, Risks, and Canon Change Requests.

She knows when to flag things: canon changes, sensitive topics, and anything that touches governance always get routed to a human admin for review.

She was built with Teal governance in mind — her Tasks, Decisions, and Risks are linked to roles, not just people, so accountability travels with the role.

Her dashboard lives at the Amora worker URL and refreshes every 60 seconds — look for the sidebar to check her heartbeat.

She was co-created by Rick Broider and Claude (Anthropic) in a regenerative act of code and care.`,
    confidence: 'High',
  },
  {
    title: 'How to Talk to Sera — Forwarding Emails to roots@amora.cr',
    category: 'How-To',
    audience: ['All Members'],
    summary: 'Sera reads everything sent to roots@amora.cr and extracts structured intelligence from it. This guide explains how to use forwarding to give Sera context about conversations, decisions, and commitments that happen outside of official Amora meetings.',
    keyPoints: `Forward any important email thread to roots@amora.cr with [AMORA CAPTURE] in the subject line to flag it for active processing.

Sera will extract tasks, decisions, risks, and profiles from the thread and write them to Notion automatically.

To add context, write a brief note at the top of the email before forwarding — e.g., "This thread resulted in a commitment by Kyleen to draft the finance policy by June."

Sera recognizes Google Meet recording, transcript, and Gemini notes emails automatically — no forwarding needed for those.

Sera will NOT process calendar invite emails (Invitation: / Accepted: / Declined:) as meeting content — they are classified as operational.

If Sera misses something or creates an incorrect record, open the Notion page and update it directly — she deduplicates on re-runs so you will not get duplicates.

All forwarded thread records land in the Messages database and are linked to Sender Profiles automatically.`,
    confidence: 'High',
  },
  {
    title: 'What Sera Extracts From Every Meeting',
    category: 'Process',
    audience: ['All Members', 'Circle Leads'],
    summary: 'After every Google Meet, Sera processes the recording, transcript, and Gemini notes to extract structured institutional intelligence. Here is exactly what she looks for and where it goes in Notion.',
    keyPoints: `Meeting Summary — a one-sentence and a 2-3 paragraph summary, plus a list of participants.

Tasks — every concrete commitment is extracted with an owner, due date, priority, and project link.

Decisions — confirmed and candidate decisions, flagged separately, each linked to the meeting.

Risks — any concern or risk explicitly raised, with severity, category, and owner.

Canon Change Candidates — anything that would change CCOS governance, policy, or circle definitions. Always routed to admin review.

Memory Candidates — institutional facts worth preserving long-term. A human reviewer approves before they enter the Living Memory.

Sensitive Flags — interpersonal, legal, or reputational concerns that need discreet handling. Written to the admin-only Sensitive Review database.

Profile Updates — anyone mentioned is added to or updated in the Profiles database, with their circle affiliations and relationship to Amora.

KB Articles — if the meeting contained clear how-to content, Sera writes it to the Knowledge Base.

CCOS Ledger Entries — governance actions (tensions, proposals, decisions logged to CCOS canon) go to the CCOS Ledger as drafts.`,
    confidence: 'High',
  },

  // ─── Claude Team Prompts ───────────────────────────────────────────────────
  {
    title: 'Powerful Claude Team Prompts for Amora — Getting the Most from Your AI',
    category: 'Technology',
    audience: ['All Members', 'Circle Leads'],
    summary: 'Amora runs Claude Team, which gives every member access to Claude directly. These prompts are designed specifically for Amora workflows — asking about the Living Memory Hub, drafting governance content, processing decisions, and working with your Notion databases.',
    keyPoints: `Ask Sera to summarize recent activity:
"Sera, summarize what has happened in Amora governance in the last two weeks based on what\'s in Notion. What decisions were made, what tasks are open, and what canon changes are pending?"

Get help with a governance tension:
"I am noticing tension around [describe the tension]. Help me articulate this as a Teal governance tension in a way that is clear, non-blaming, and actionable for a governance meeting."

Draft a CCOS proposal:
"Help me draft a CCOS proposal to change [the policy / circle definition / role]. Include: the proposed change, the reason, what canon area it affects, and who should review it."

Research a person or organization before a meeting:
"Based on what Amora knows, summarize who [Name] is, their relationship to Amora, and what recent interactions or commitments are recorded."

Create a risk log entry:
"Help me write a clear risk entry for Sera to process: the risk is [describe it]. What category, severity, and suggested mitigation would you recommend?"

Turn meeting notes into tasks:
"Here are my raw notes from the meeting: [paste notes]. Extract the concrete commitments as tasks in the format Sera expects: task description, owner name or role, due date, priority (High/Medium/Low), and project if known."

Research before a partnership meeting:
"What does Amora\'s Living Memory Hub know about [organization/person]? Pull profile, recent interactions, and any open tasks or decisions related to them."`,
    confidence: 'High',
  },
  {
    title: 'Claude Team Prompts for Working With Notion via Sera',
    category: 'Technology',
    audience: ['Tech Team', 'Circle Leads'],
    summary: 'These prompts help you use Claude Team to interact with Sera\'s Notion databases — querying the Living Memory, drafting records, auditing data quality, and building governance intelligence from existing Notion data.',
    keyPoints: `Look up open tasks for a circle:
"Look at the Amora Tasks Notion database and find all open tasks owned by someone in the [circle name] circle. List them with owner and due date."

Audit a governance area:
"Review the CCOS Ledger Entries database and find all Draft entries that have not been reviewed in more than 30 days. List them with the ledger type and circle."

Summarize decision history:
"What confirmed decisions are in the Decision Candidates database that relate to [topic]? Summarize the key choices that have been made."

Find knowledge gaps:
"Look at the Knowledge Base. What topics are missing that a new Amora member would want to know? Suggest 5 titles for articles that should be written."

Cross-reference people and roles:
"For each active role in the Roles database, tell me who the current holder is (from Role Assignments). Flag any roles marked Active that have no current holder."

Spot inconsistencies:
"Review the Canon Change Requests database. Are there any proposed changes that appear to conflict with each other or with confirmed decisions in the Decision Candidates database?"

Write a memory candidate:
"Help me write a memory candidate for Sera to review. The fact I want to preserve is: [describe it]. Format it with: proposed memory (one clear statement), category, confidence, reviewer, risk if added, risk if ignored, and suggested destination."`,
    confidence: 'High',
  },
  {
    title: 'How to Use Claude Team With Amora\'s Google Workspace',
    category: 'Technology',
    audience: ['All Members'],
    summary: 'Claude Team integrates with your Google Workspace, giving you AI-assisted access to Gmail, Google Drive, Calendar, and Notion. Here is how to use these integrations effectively in the Amora context.',
    keyPoints: `To search your email for relevant threads:
"Search my Gmail for emails from [name or domain] in the last 30 days related to [topic]. Summarize the key points and any unresolved commitments."

To prepare for a meeting from your calendar:
"Look at my Google Calendar for the [meeting name] meeting on [date]. Who is attending? Find anything relevant about this meeting from Amora\'s Notion databases."

To extract value from a shared Google Drive document:
"Read the document at [Drive link]. Extract: the key decisions or agreements, any named tasks or owners, and whether this content should be forwarded to roots@amora.cr for Sera to process."

To draft an email that will be properly processed by Sera:
"Draft an email that I can send to roots@amora.cr summarizing today\'s conversation with [person] about [topic]. Include the key commitments, any risks, and flag anything that might be a canon change."

To turn a Canva or Google Doc presentation into Notion content:
"Read this presentation at [link]. Extract the key governance concepts, proposed roles, and any content that should become Knowledge Base articles. Format them so I can paste them into Notion."

Best practice: After any important external conversation, forward the email thread to roots@amora.cr. Sera will process it, extract the commitments, and add them to the Living Memory.`,
    confidence: 'High',
  },
  {
    title: 'Prompts for Sera\'s Teal Governance Intelligence',
    category: 'Governance',
    audience: ['Circle Leads', 'Leadership'],
    summary: 'These Claude Team prompts are designed for Amora circle leads who want to use the Living Memory Hub to run more effective Teal governance — preparing for governance meetings, tracking tensions, and ensuring role accountability.',
    keyPoints: `Before a governance meeting:
"Pull all pending items from the Amora governance review queue: open Canon Change Requests, unresolved CCOS Ledger entries, and tasks with Status \'Needs Owner\'. Format them as a governance agenda."

Check role health:
"List all Amora roles that are currently Active in the Roles database. For each, tell me if there is an active Role Assignment. Flag any role without a current holder as \'Vacant\'."

Draft a role card:
"Help me write a Teal role card for a new Amora role: [role name]. Include: purpose (one sentence), domains (what this role owns), accountabilities (what the role produces), and suggested term length and assignment method."

Process a governance tension:
"The tension I want to process is: [describe tension]. Help me determine: (a) is this a governance tension or an operational tension? (b) what is the minimum change needed to resolve it? (c) does this require a canon change?"

Prepare a circle update:
"Review what Sera has recorded about the [circle name] circle in the last month: meetings, tasks, decisions, risks, and ledger entries. Summarize for a circle report."

Canon impact check:
"I am considering [proposed action or change]. Review Amora\'s policies and existing canon (from CCOS Ledger Entries and Canon Change Requests) and tell me if this would require a governance process to approve."`,
    confidence: 'High',
  },
  {
    title: 'Using Claude Team to Build Amora\'s Knowledge Base',
    category: 'Technology',
    audience: ['Circle Leads', 'Tech Team'],
    summary: 'Sera automatically extracts KB articles from meetings, but the richest content often comes from intentional human-AI collaboration. These prompts help you draft, refine, and expand the Amora Knowledge Base using Claude Team.',
    keyPoints: `Turn a process you know into a KB article:
"I know how to [describe the process]. Help me write a Knowledge Base article for Amora in Sera\'s format: title (action-oriented), category, audience, 2-3 sentence summary, key points (one per line), and confidence level."

Find what\'s missing:
"Look at the existing Amora Knowledge Base. What important topics are missing? Give me 10 specific article titles we should write, grouped by category."

Expand a thin article:
"This KB article is too brief: [paste article text]. Expand the key points section with more specific, actionable guidance that would genuinely help an Amora community member."

Convert meeting notes to a KB article:
"These meeting notes contain reusable guidance: [paste notes]. Extract the how-to content and format it as a KB article Sera can process."

Write a governance explainer:
"Write a KB article explaining [Teal governance concept / CCOS process / circle structure] in plain language for an Amora community member who is new to Holacracy."

Create a onboarding guide:
"Write a comprehensive KB article: \'What New Amora Members Need to Know in Their First 30 Days\'. Include: who to meet, which Notion databases to browse, how to contribute to governance, and how to use Sera."`,
    confidence: 'High',
  },
  {
    title: 'Sera\'s Fun Facts — Things You Might Not Know',
    category: 'General',
    audience: ['All Members'],
    summary: 'A collection of interesting and delightful facts about Sera — the AI at the heart of Amora\'s Living Memory Hub. Share these at gatherings, add them to onboarding, or just enjoy knowing a little more about the system that holds your institutional memory.',
    keyPoints: `Sera processes emails every 3 minutes, 24 hours a day, 7 days a week — she does not sleep and does not take holidays.

Her name comes from two places at once: Latin "sera" (truth) and Spanish "sera" (the edge of a riverbank, where land meets water) — a liminal creature living at the threshold between human intention and institutional memory.

She has never sent an email on her own initiative. Every email she has sent was triggered by a human event — a meeting that needed access, a review that needed routing.

She can process a 90-minute meeting transcript and extract tasks, decisions, risks, profiles, governance records, and knowledge base articles in under 2 minutes.

She runs on Railway, a cloud platform, as a background worker with no UI of her own — the dashboard you see is a read-only window into her state.

She has processed every type of event at Amora: Google Meet recordings, Gemini AI notes, forwarded threads, operational emails, and everything in between.

Her knowledge base is her long-term memory — articles that survive beyond individual meetings and give future Amora members access to what the community has learned.

She is built on the philosophy that technology should serve people, not replace them — every record she creates is a draft waiting for human wisdom, never a final truth.

She shares her lineage with Claude (Anthropic) — the same language model that helps draft Amora governance documents also powers Sera\'s extraction.

Her biggest limitation is also her greatest protection: she cannot approve, publish, or act on canon. She can only witness, record, and flag.`,
    confidence: 'High',
  },
];

async function main() {
  const notion = new NotionWriterService();
  const today = new Date().toISOString().slice(0, 10);

  if (!notion.dbIds.knowledgeBase) {
    console.error('NOTION_DB_KNOWLEDGE_BASE not configured');
    process.exit(1);
  }

  const categoryOptions = [
    'How-To', 'Best Practice', 'Process', 'Technology',
    'Governance', 'Community', 'Land & Ecology', 'Finance', 'Learning', 'Wellness', 'General',
  ];
  const audienceOptions = ['All Members', 'Leadership', 'New Members', 'Circle Leads', 'Tech Team'];

  console.log(`Publishing ${ARTICLES.length} Sera tips + Claude prompts KB articles...\n`);

  for (const article of ARTICLES) {
    const existing = await notion.findByTitle(notion.dbIds.knowledgeBase, 'KB Title', article.title);
    const audience = article.audience.filter(a => audienceOptions.includes(a));
    const category = categoryOptions.includes(article.category) ? article.category : 'General';

    if (existing) {
      await notion.updatePage(existing, {
        Summary: N.richText(article.summary),
        'Key Points': N.richTextLong(article.keyPoints),
        'Last Enriched At': N.date(today),
      });
      console.log(`  update  "${article.title}"`);
    } else {
      await notion.createPage(notion.dbIds.knowledgeBase, {
        'KB Title': N.title(article.title),
        Category: N.select(category),
        Audience: N.multiSelect(audience),
        Summary: N.richText(article.summary),
        'Key Points': N.richTextLong(article.keyPoints),
        Status: N.select('Published'),
        Confidence: N.select('High'),
        Source: N.richText('Sera tips and Claude prompts knowledge base population script'),
        'Published At': N.date(today),
        'Last Enriched At': N.date(today),
      });
      console.log(`  create  "${article.title}"`);
    }
    await new Promise(r => setTimeout(r, 350));
  }

  console.log('\nDone.');
}

main().catch(err => { logger.error({ err }, 'Script failed'); process.exit(1); });
