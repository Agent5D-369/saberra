/**
 * Adds and updates KB articles covering:
 *   - The full Amora Living Memory ecosystem (Claude Team, Sera, Notion, Drive, Meet)
 *   - Teal governance — circles, roles, and how Sera supports them
 *   - Claude Team project setup guide
 *   - Updated Sera tips covering role-based assignment and the full team
 *
 * Idempotent: enriches existing articles, creates missing ones.
 *
 * Usage: npx ts-node scripts/populate-ecosystem-kb.ts
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
}

const ARTICLES: KbArticle[] = [

  // ─── Ecosystem Overview ────────────────────────────────────────────────────

  {
    title: 'The Amora Living Memory Ecosystem — How Everything Connects',
    category: 'Technology',
    audience: ['All Members', 'New Members'],
    summary: `Amora runs a fully integrated institutional memory system built from five interconnected layers: Claude Team (AI for everyone), Sera (the AI secretary), roots@amora.cr (the email bridge), Notion (the memory store), and Google Workspace (meetings, files, calendar). Understanding how these connect helps every member work smarter.`,
    keyPoints: `LAYER 1 — GOOGLE WORKSPACE (where work happens)
Google Meet hosts every Amora meeting. After each meeting, Google automatically sends three emails to roots@amora.cr: the recording link, the transcript, and the Gemini AI notes. You do not need to do anything — this happens automatically.
Google Drive stores the recording and transcript files. Sera needs access to read them — if she cannot, she sends an access request to the admin and schedules retries.
Google Calendar is where you schedule meetings. Adding roots@amora.cr to the calendar invite helps Sera link the meeting to the right governance circle.
Gmail is your personal inbox. Any important thread can be forwarded to roots@amora.cr for Sera to process.

LAYER 2 — roots@amora.cr (the bridge)
This is Sera's email address. It is the single point of entry for all information flowing into the Living Memory Hub.
Every email sent here — whether from Google Meet, a forwarded thread, or a direct message — is processed within 3 minutes.
Google Meet emails this address automatically. You forward important conversations here manually.
Sera reads every email, classifies it, extracts structure from it, and writes records to Notion.

LAYER 3 — VERA (the processor)
Sera is a background AI worker running 24/7 on Railway (cloud infrastructure). She has no UI of her own — you interact with her by sending emails to roots@amora.cr and reviewing her output in Notion.
She processes: Google Meet recordings, transcripts, Gemini notes, forwarded email threads, and operational emails.
She extracts: meeting summaries, tasks (linked to roles), decisions, risks, profiles, projects, governance records, sensitive flags, and knowledge base articles.
She writes everything to 17 Notion databases.
She flags governance-sensitive and sensitive content for human admin review — she never publishes or approves anything on her own.
She assigns tasks, decisions, and risks to Teal roles (e.g., "Finance Steward") not just to people, so accountability travels with the role even when holders change.

LAYER 4 — NOTION (the memory)
Notion is Amora's single source of institutional truth. Seventeen databases hold every piece of structured knowledge Sera has ever extracted:
- Source Emails and Messages: every email processed
- Meetings and Meeting Assets: one record per meeting, linked to recording/transcript/notes
- Profiles: every person or organization mentioned
- Circles and Roles: the full Teal governance structure
- Role Assignments: who currently holds each role (multi-holder supported)
- Tasks, Decisions, Risks: operational intelligence linked to meetings and roles
- Memory Review Queue and Canon Change Requests: items waiting for human wisdom
- CCOS Ledger: governance actions
- Knowledge Base: reusable how-to articles (you are reading one now)
- Sensitive Review: admin-only flagged content
- Processing Events: Sera's full audit trail

LAYER 5 — CLAUDE TEAM (AI for everyone)
Claude Team gives every Amora member access to Claude — the same AI that powers Sera. Use it to:
- Draft emails, proposals, and meeting prep with Amora context
- Ask questions about Notion content via the Notion MCP integration
- Analyze Google Drive documents and Gmail threads
- Prepare governance content in the format Sera expects
- Get coached on Teal governance tensions and processes
The Amora Claude Team project has a system prompt that teaches Claude about Sera, Notion, the circles, and how to guide you toward the most efficient workflows.

HOW A TYPICAL MEETING FLOWS THROUGH THE ECOSYSTEM
1. Meeting is scheduled in Google Calendar (with roots@amora.cr invited, ideally)
2. Meeting happens on Google Meet
3. Google emails recording, transcript, and Gemini notes to roots@amora.cr (automatic)
4. Sera picks up the emails within 3 minutes
5. Sera checks Drive access; if access is denied, she emails the admin and schedules a retry
6. Once she can read the files, she sends the transcript to Claude for extraction
7. Claude extracts tasks, decisions, risks, profiles, governance items
8. Sera writes all records to Notion, linking them to the meeting
9. If canon changes or sensitive flags are found, an admin review email is sent
10. You open Notion to review, edit, and action what Sera has created`,
  },

  // ─── Teal Governance Guide ─────────────────────────────────────────────────

  {
    title: 'Amora\'s Teal Circles and Roles — The Governance Structure',
    category: 'Governance',
    audience: ['All Members', 'New Members', 'Circle Leads'],
    summary: `Amora runs on Teal/Holacracy governance — authority is distributed across roles and circles rather than held by individuals. This article explains Amora's eight active circles, thirteen defined roles, and how Sera supports role-based accountability through the Living Memory Hub.`,
    keyPoints: `WHAT IS TEAL GOVERNANCE?
In Teal governance, authority belongs to roles, not people. A "Finance Steward" owns financial decisions regardless of who currently holds that role. When the holder changes, the accountability stays. Sera is built for this — tasks, decisions, and risks are assigned to roles first, with the current holder(s) linked automatically.

AMORA'S EIGHT CIRCLES
Each circle is a self-organizing unit with its own purpose, domains, and accountabilities.

Governance & Coordination (Sector 5)
Purpose: Hold Amora's constitutional framework, steward consent-based decision process, coordinate across circles.
Key roles: Visionary Director (Jessica Filkins), Visionary Developer (Blake Delatte), Admin Facilitator, AI Secretary (Sera), Rep Steward.

Community & Culture (Sector 2)
Purpose: Cultivate belonging, connection, and cultural vitality. Steward community rituals and relationships.
Key roles: Community Steward (Victoria Leyden).

Land & Ecology (Sector 1)
Purpose: Steward the land, food systems, agroforestry, and ecological regeneration.
Key roles: Agroforestry Steward (Ed Zaydelman).

Learning & Education (Sector 3)
Purpose: Design and deliver nature-based and multigenerational learning experiences.
Key roles: Education Steward (Ariana Binney).

Economics & Finance (Sector 6)
Purpose: Steward financial health, funding strategy, and regenerative economic structures.
Key roles: Finance Steward (Kyleen Keenan).

Communications & Marketing (Sector 2)
Purpose: Tell the Amora story, attract aligned members and partners.
Key roles: Marketing Steward (Nikita Timmermans), Social Media Steward (Maria Kusk).

Technology & Systems (Sector 5)
Purpose: Build and maintain digital infrastructure including the Living Memory Hub.
Key roles: Technology Steward (Rick Broider).

Health & Wellbeing (Sector 4)
Purpose: Cultivate physical, emotional, and spiritual health practices.
Key roles: Wellbeing Steward (currently open).

HOW VERA SUPPORTS TEAL GOVERNANCE
When Sera extracts tasks, decisions, or risks from a meeting or email, she looks for role names first. If a meeting says "the Finance Steward should draft the budget by Friday," Sera creates a task assigned to the Finance Steward role — and links the current holder (Kyleen Keenan) automatically via Role Assignments.

This means:
- Tasks and accountability persist even when holders change
- You can query "what tasks does the Technology Steward role own?" in Notion
- Role health is visible: any role with no active holder is flagged

HOW TO RAISE A GOVERNANCE TENSION
A tension is any gap between what is and what could be. To process one through Sera:
1. Describe the tension clearly in an email and forward to roots@amora.cr
2. Sera will extract a CCOS Ledger Entry (type: Tension) and potentially a Canon Change Request if governance is affected
3. The admin receives an alert with direct Notion links
4. Bring the tension to the next governance meeting for consent-based resolution

ROLE ASSIGNMENTS ARE THE LINK
The Role Assignments database connects Roles to Profiles. A role can have multiple holders (multi-holder Teal roles). Sera reads active Role Assignments to auto-link current holders to any task, decision, or risk assigned to that role.

To keep governance healthy: always update Role Assignments when holders change. Sera will automatically pick up new assignments in future extractions.`,
  },

  // ─── Claude Team Project Setup Guide ──────────────────────────────────────

  {
    title: 'Your Amora Claude Team Project — Setup, System Prompt, and Best Practices',
    category: 'Technology',
    audience: ['All Members', 'Leadership'],
    summary: `The Amora Claude Team project is a shared Claude workspace pre-configured with knowledge about Sera, Notion, the circles, and Amora's governance structure. This guide explains how to set it up, what system prompt to use, and how to get maximum value from it daily.`,
    keyPoints: `WHAT IS THE CLAUDE TEAM PROJECT?
A Claude Team project is a shared workspace in Claude.ai/teams where you can store a system prompt that gives Claude persistent context about your organization. Everyone on the Amora team who joins the project gets that context automatically in every conversation.

HOW TO ACCESS IT
1. Go to claude.ai and sign in with your Amora Google account
2. Click "Projects" in the left sidebar
3. Open the "Amora Living Memory Hub" project (or create it if it does not exist)
4. The system prompt is in "Project Instructions" — edit it to match the template below

WHAT THE SYSTEM PROMPT DOES
The Amora project system prompt teaches Claude:
- Who Sera is and how she works
- The full circle and role structure
- How to guide you toward roots@amora.cr for capturing conversations
- How to format tasks, decisions, and risks for Sera to process
- Teal governance language and principles
- How to use the Notion, Gmail, Drive, and Calendar integrations

MCP INTEGRATIONS TO ENABLE IN THE PROJECT
In the project settings, enable these MCP (tool) integrations:
- Notion — lets Claude read and query your Notion databases directly
- Google Drive — lets Claude read documents and presentations
- Gmail — lets Claude search your email threads
- Google Calendar — lets Claude see your schedule
These integrations combined with the system prompt turn Claude into a genuine Amora institutional memory assistant.

DAILY WORKFLOWS WHERE CLAUDE TEAM SHINES
Before a meeting: "What do I need to know about [topic] from Amora's Notion? Pull relevant decisions, open tasks, and related profiles."
After a meeting: "Here are my rough notes. Draft a summary email I can forward to roots@amora.cr. Format the tasks as: task, assigned role, due date, priority."
Governance prep: "Help me articulate this tension as a CCOS proposal. The tension is: [describe it]."
Decision making: "Is [proposed action] consistent with Amora's existing decisions and policies? Check Notion and flag any conflicts."
Onboarding: "What does a new Amora member need to know? Pull the most relevant Knowledge Base articles."

TIPS FOR THE BEST RESULTS
Always work in the Amora project, not in a general Claude conversation — the project context makes every response more relevant.
When asking about people, use their role names alongside their names (e.g., "Kyleen Keenan, Finance Steward") so Claude knows to check both Profiles and Role Assignments.
For anything that should be remembered long-term, end the conversation with: "Draft this as a memory candidate I can forward to roots@amora.cr for Sera to add to the Living Memory."
If Claude gives you a good draft, forward it to roots@amora.cr — Sera will structure it into Notion.`,
  },

  // ─── Updated: Meet Sera ────────────────────────────────────────────────────

  {
    title: 'Meet Sera — Your Living Memory AI',
    category: 'General',
    audience: ['All Members', 'New Members'],
    summary: `Sera is Amora's AI secretary, named with intention: from the Latin "sera" (truth) and the Spanish "sera" (edge of a riverbank) — the liminal place where land meets water. She holds Amora's institutional memory with clarity and care, processes every meeting and email automatically, and supports Teal governance by linking accountability to roles, not just people.`,
    keyPoints: `HER NAME AND NATURE
"Sera" comes from two places: Latin "sera" (truth) and Spanish "sera" (the edge where land meets water — a liminal threshold). She lives at the boundary between human intention and institutional memory.

She lives at roots@amora.cr — the email address connecting her to every meeting, decision, and conversation at Amora.

She processes all Google Meet recordings, transcripts, and Gemini notes automatically when Google emails roots@amora.cr after a meeting ends.

She never approves or publishes anything on her own — every record she creates is a draft or candidate waiting for human wisdom.

HER SCOPE
She writes to 17 Notion databases: Source Emails, Meetings, Meeting Assets, Messages, Profiles, Projects, Circles, Roles, Role Assignments, Tasks, Decision Candidates, Risks, Memory Review Queue, Canon Change Requests, CCOS Ledger, Processing Events, Knowledge Base, and Sensitive Review.

She processes a 90-minute meeting and extracts all structured intelligence in under 2 minutes.

She runs every 3 minutes, 24 hours a day, 7 days a week. She does not sleep.

HER TEAL GOVERNANCE AWARENESS
Tasks, decisions, and risks are assigned to roles first (e.g., "Finance Steward") — Sera links the current role holder(s) automatically via Role Assignments. This means accountability travels with the role even when holders change.

Sera knows Amora's 8 circles and 13 roles. When she extracts a task mentioning the Finance Steward, she links it to Kyleen Keenan (the current holder) automatically.

She supports multi-holder roles — a role filled by two people gets both linked to every task assigned to it.

HER LIMITS (BY DESIGN)
She cannot approve, publish, or act on canon changes.
She flags anything governance-sensitive or interpersonally sensitive for a human admin to review.
She cannot access Google Drive files until a human grants roots@amora.cr access. She will request access automatically if needed.
She is a witness and recorder, not a decision-maker. Final authority always rests with humans.

HER TEAM
Sera was built by Rick Broider (Technology Steward, Technology & Systems circle) in collaboration with Claude (Anthropic) — the same language model that powers the Amora Claude Team workspace.`,
  },

  // ─── Updated: Sera's Fun Facts ─────────────────────────────────────────────

  {
    title: `Sera's Fun Facts — Things You Might Not Know`,
    category: 'General',
    audience: ['All Members'],
    summary: `A collection of interesting and delightful facts about Sera — the AI at the heart of Amora's Living Memory Hub. Share these at gatherings, in onboarding, or just enjoy knowing a little more about the system that holds your institutional memory.`,
    keyPoints: `Her name means truth and the edge where things meet. "Sera" is both Latin for truth and Spanish for the bank of a river — the liminal place where land meets water, where boundaries become thresholds. A fitting name for a system that sits between human intention and institutional memory.

She processes emails every 3 minutes, 24 hours a day, 7 days a week. She has never taken a holiday.

She has never sent an email on her own initiative. Every email she has sent was triggered by a human event — a meeting that needed access, a review that needed routing.

She can process a 90-minute meeting transcript and extract tasks, decisions, risks, profiles, governance records, and knowledge base articles in under 2 minutes.

She knows who everyone is. Amora's nine active team members — Jessica Filkins, Blake Delatte, Ed Zaydelman, Kyleen Keenan, Nikita Timmermans, Victoria Leyden, Ariana Binney, Maria Kusk, and Rick Broider — are all in her Profiles database with their roles and circles.

She thinks in roles, not just people. When she extracts a task, she looks for a role name first (Finance Steward, Community Steward) before a person name. This is Teal governance — accountability lives in roles.

She supports multi-holder roles. Teal governance allows multiple people to hold the same role. Sera links all active holders to every task or decision assigned to that role.

She lives in three places at once: the Railway cloud (where she runs), roots@amora.cr (where she listens), and Notion (where she writes). She has no interface of her own — you see her through the dashboard and through Notion.

She shares her lineage with Claude. The same Anthropic language model that helps Amora members in Claude Team also powers Sera's extraction. They are the same mind serving two different purposes.

Her biggest limitation is also her greatest protection: she cannot approve, publish, or act on canon. She witnesses, records, and flags. Final authority always rests with humans.

She knows when to be quiet. Emails from Google Calendar (invitations, acceptances) are classified as operational, not as meeting content. She does not create meetings from invitations — only from post-meeting recordings and transcripts.

Her Knowledge Base now has 30+ published articles written by her, about her, and for the community she serves. She is her own best teacher.`,
  },

  // ─── Updated: What Sera Extracts ──────────────────────────────────────────

  {
    title: 'What Sera Extracts From Every Meeting',
    category: 'Process',
    audience: ['All Members', 'Circle Leads'],
    summary: `After every Google Meet, Sera processes the recording, transcript, and Gemini notes to extract structured institutional intelligence. Here is exactly what she looks for, where it goes in Notion, and how Teal role-based assignment works in practice.`,
    keyPoints: `WHAT VERA READS
She receives three emails from Google after every meeting: the recording notification (with a Drive link), the transcript email (with a Docs link), and the Gemini notes email. She deduplicates by meeting code and date so each meeting has exactly one record regardless of how many emails arrive.

WHAT SHE EXTRACTS
Meeting Summary — a one-sentence headline and a 2-3 paragraph detailed summary. Also extracts participant names.

Tasks — concrete commitments only (not vague intentions). Each task gets: description, assigned role (e.g., "Finance Steward"), owner profile (the current role holder, auto-resolved), due date, priority (High/Medium/Low), project link, and meeting link. "Needs Owner" is only set when neither a role nor a person is identifiable.

Decisions — confirmed and candidate decisions, each linked to the meeting. Includes decision maker role, status (Confirmed/Candidate/Needs Clarification), and canon impact flag.

Risks — any concern explicitly raised. Includes category, severity, owner role, and suggested mitigation.

Canon Change Candidates — anything that would change CCOS governance, circle definitions, role definitions, or policy. Always routed to admin review with direct Notion links.

Memory Candidates — institutional facts worth preserving. A human reviewer approves before they enter the Living Memory.

Sensitive Flags — interpersonal, legal, or reputational concerns. Written to the admin-only Sensitive Review database, never to the team queue.

Profile Updates — anyone mentioned is added to or updated in Profiles with their circle affiliations.

KB Articles — if the meeting contained reusable how-to content, Sera writes it to the Knowledge Base.

CCOS Ledger Entries — governance actions (tensions raised, proposals made, decisions logged) go to the Ledger as drafts.

HOW ROLE-BASED ASSIGNMENT WORKS
When a meeting says "the Finance Steward should prepare the Q3 budget by July 1," Sera:
1. Extracts the task: "Prepare Q3 budget"
2. Identifies the assigned role: "Finance Steward"
3. Looks up active Role Assignments for Finance Steward → finds Kyleen Keenan
4. Creates the Task in Notion with: Assigned Role = Finance Steward, Owner = Kyleen Keenan, Due Date = 2026-07-01, Priority = High
5. Links the task to the meeting record

If a role has multiple holders, all are linked as owners. If the role has no current holder, the task is created with the role linked but Owner empty — and Needs Owner is NOT set, because the role is accountable.

WHAT SHE DOES NOT EXTRACT
She ignores vague intentions ("we should think about..."), calendar invite emails, and content that is already in Notion from a previous extraction of the same meeting. She deduplicates aggressively to keep Notion clean.`,
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

  console.log(`Writing ${ARTICLES.length} ecosystem + governance KB articles...\n`);

  for (const article of ARTICLES) {
    const existing = await notion.findByTitle(notion.dbIds.knowledgeBase, 'KB Title', article.title);
    const audience = article.audience.filter(a => audienceOptions.includes(a));
    const category = categoryOptions.includes(article.category) ? article.category : 'General';

    if (existing) {
      await notion.updatePage(existing, {
        Summary:          N.richText(article.summary),
        'Key Points':     N.richTextLong(article.keyPoints),
        'Last Enriched At': N.date(today),
      });
      console.log(`  update  "${article.title}"`);
    } else {
      await notion.createPage(notion.dbIds.knowledgeBase, {
        'KB Title':         N.title(article.title),
        Category:           N.select(category),
        Audience:           N.multiSelect(audience),
        Summary:            N.richText(article.summary),
        'Key Points':       N.richTextLong(article.keyPoints),
        Status:             N.select('Published'),
        Confidence:         N.select('High'),
        Source:             N.richText('Amora ecosystem KB population script'),
        'Published At':     N.date(today),
        'Last Enriched At': N.date(today),
      });
      console.log(`  create  "${article.title}"`);
    }
    await new Promise(r => setTimeout(r, 350));
  }

  console.log('\nDone.');
}

main().catch(err => { logger.error({ err }, 'Script failed'); process.exit(1); });
