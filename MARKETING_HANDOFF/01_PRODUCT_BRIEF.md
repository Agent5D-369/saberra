# Product Brief: Living Memory Hub (powered by Sera)

## What This Is

Living Memory Hub is an always-on AI system that automatically captures everything that happens inside an organization - every meeting, email, decision, task, risk, and governance action - and turns it into a searchable, structured institutional memory that anyone on the team can query in plain language.

The AI assistant at the center of it is called **Sera**. You ask Sera a question. Sera answers from your organization's actual documented history, not from the internet or general knowledge.

---

## The Problem It Solves

Every organization hemorrhages knowledge. It bleeds out silently, continuously, and invisibly, and almost no one tracks the cost.

**The bleed happens in four ways:**

1. **Meetings dissolve.** A decision is made in a meeting. Someone takes notes. The notes go into a Google Doc or Notion page that nobody reads again. Three months later, someone makes the opposite decision because they have no idea the first one happened. This is not a people problem. It is a systems problem.

2. **Email threads bury everything.** A critical task is assigned in the middle of a 40-message email thread. No one flags it. No one follows up. It disappears. The client deal falls through. The vendor relationship sours. The opportunity is gone.

3. **People leave and take the organization with them.** When a key person walks out the door, they take three years of context, relationships, judgment calls, and institutional understanding with them. What remains is a file server and a half-documented Notion page.

4. **New people take six months to become useful.** Onboarding is slow not because people are slow, but because the knowledge they need is not written down anywhere. It lives in people's heads, in old Slack messages, in meeting recordings that no one has time to watch.

**The total cost of this knowledge bleed is enormous** - estimated at 20-35% of an organization's annual payroll wasted on duplicated work, repeated decisions, slow onboarding, and errors made in the absence of context. Most organizations never measure it because it is invisible.

---

## What the Product Actually Does

### The Zero-Behavior-Change Principle

The most important design decision in Living Memory Hub is this: **your team does not change anything about how they work.**

Your team already uses Google Meet for meetings. When a meeting ends, Google automatically sends emails with the recording link, the transcript, and the AI-generated notes (Gemini). Living Memory Hub watches that inbox. It captures those emails automatically. It processes them with Claude AI. It writes everything it finds into structured Notion databases.

The team never has to log into a new tool, fill in a new form, or change any workflow. The system captures what happens as a natural byproduct of work that is already happening.

### The Capture Layer

Living Memory Hub monitors a dedicated email inbox (`roots@amora.cr` in the current deployment). It checks for new emails every three minutes. When it finds one, it classifies it:

- **Google Meet Recording** - a link to a meeting recording on Google Drive
- **Google Meet Transcript** - the full text transcript of a meeting
- **Google Meet AI Notes** - Gemini's structured notes from the meeting
- **Operational Email** - any other significant email forwarded to the system (vendor quotes, client communications, board updates, etc.)
- **Forwarded Thread** - an email thread forwarded by a team member because it contains something worth capturing

Every email that enters the system is logged as a Source Email record with full audit trail.

### The AI Extraction Layer (Sera's Brain)

For meeting transcripts and AI notes, the system exports the full document from Google Drive using the Google Docs API and sends it to Claude (Anthropic's AI). Claude reads the entire document and extracts **12 categories of structured information:**

1. **Meeting Summary** - short one-sentence version and detailed 2-3 paragraph version
2. **Profiles** - every person and organization mentioned, with their role and relationship to the org
3. **Tasks** - every action item, with the assignee, due date, and priority
4. **Decisions** - every decision made or discussed, with confidence level and context
5. **Risks** - every risk identified, with severity and suggested mitigation
6. **Memory Candidates** - facts, policies, and knowledge that should be preserved long-term
7. **Projects** - named initiatives mentioned, with status and circle association
8. **Circles** - CCOS governance circles (or any team/department structure) mentioned
9. **Roles** - defined roles within the organization mentioned or updated
10. **Role Assignments** - who holds which role, since when, and with what term conditions
11. **Canon Change Candidates** - proposed changes to organizational policies or governance documents
12. **CCOS Ledger Entries** - formal governance actions that need to be recorded

Nothing Claude extracts goes directly into the final record without human review. Every extracted item is written as a **candidate** or **draft** - never as confirmed canon. A human reviews, approves, or rejects each item through the Notion interface.

### The Memory Layer (Notion Backend)

All extracted data is organized into **17 Notion databases**, each purpose-built:

| Database | What It Holds |
|----------|---------------|
| Source Emails | Every email ingested, with processing status and audit trail |
| Meetings | One record per meeting, deduped by Google Calendar event ID |
| Meeting Assets | Per-asset records (recording, transcript, notes) with access status |
| Messages | Operational emails with extracted summaries |
| Profiles | People and organizations known to the system |
| Projects | Named initiatives, status, and circle associations |
| Circles | Governance circles or team structures |
| Roles | Role definitions with accountabilities and domains |
| Role Assignments | Who holds which role, with full term history |
| Tasks | Action items with owner, due date, status |
| Decision Candidates | Decisions awaiting human review |
| Risks | Identified risks with severity and mitigation |
| Memory Review Queue | Memory candidates awaiting approval |
| Canon Change Requests | Proposed policy changes awaiting review |
| CCOS Ledger Entries | Formal governance records |
| Processing Events | Full audit trail of every system action |
| Sensitive Review | Items flagged as sensitive, admin-only |

Because this lives in Notion, humans can edit, comment on, relate, filter, and act on every record using Notion's full interface. There is no proprietary lock-in on the data storage layer.

### Sera - The Retrieval Layer

Sera is the AI-powered Q&A interface on top of all this memory. She can answer questions like:

- "What did we decide about the vendor contract in April?"
- "Who is responsible for the onboarding process right now?"
- "What are all the open risks related to our technology infrastructure?"
- "Summarize everything that happened in the last board meeting."
- "What tasks were assigned to Maria that are still open?"
- "Has anyone proposed changes to the conflict resolution policy?"

Sera searches across all 17 databases, combines results, and gives a natural language answer. She cites her sources so you can verify. She can also run structured searches when a precise lookup is needed.

Sera is available through:
- A chat interface on the admin dashboard
- A REST API for programmatic access
- A Claude Team Connector (MCP) so your team can ask Sera questions directly inside Claude.ai

### The Admin Dashboard

A real-time web dashboard shows:

- **Queue Health** - how many items are awaiting human review across each category
- **Activity Feed** - every email processed, every extraction run, every error
- **Role Health** - which active roles are vacant or have expiring terms
- **Policy Status** - how many policies are in draft vs. active
- **Community Stats** - profiles known, meetings captured, risks tracked
- **Task Performance** - who is completing tasks, which are overdue
- **CRM View** - contacts, follow-ups, and interaction history
- **System Health** - last successful poll, pipeline failures, Drive access issues

Admins can also trigger retries for failed extractions directly from the dashboard.

### The API Layer

A fully authenticated REST API provides programmatic access to all Sera capabilities:

- `POST /ask` - ask Sera any question in natural language
- `POST /search` - keyword/semantic search across all databases
- `POST /extract` - submit any text document for extraction into institutional memory
- `POST /reprocess` - re-extract a document that was previously processed, linked back to its original record

The API also supports the Model Context Protocol (MCP), making Sera available as a tool inside any MCP-compatible AI system.

---

## The Technical Stack (for technical buyers)

- **Runtime**: Node.js + TypeScript on Railway (cloud hosting)
- **Email ingestion**: IMAP monitoring of a dedicated inbox (WPX mail server)
- **AI extraction**: Anthropic Claude API (primary: claude-sonnet-4-6, fallback: claude-haiku)
- **Memory storage**: Notion (17 databases, no custom database required)
- **Google integration**: Google Drive API (access checking), Google Docs API (text export), Gmail API (outbound notifications)
- **Dashboard**: Self-hosted Node.js HTTP server on Railway
- **API**: Self-hosted REST + SSE server on Railway
- **Authentication**: HTTP Basic Auth (dashboard), Bearer token (API), OAuth 2.0 + PKCE (MCP connector)

Three services run independently on Railway:
1. **Sera Worker** - the always-on email processing engine
2. **Sera Dashboard** - the admin web interface
3. **Sera API** - the Q&A and extraction REST API

---

## What Makes This Different

### Versus note-taking tools (Notion AI, Confluence, Notion)
Those tools require someone to write things down. Living Memory Hub captures automatically from the natural output of your existing workflow (meetings, email). No one has to remember to log anything.

### Versus AI meeting tools (Fireflies, Otter.ai, Grain)
Those tools summarize individual meetings. Living Memory Hub builds a cumulative, cross-meeting, cross-document institutional memory over time. Sera knows about the meeting from six months ago as readily as the one from yesterday. The whole is smarter than the sum of its parts.

### Versus CRM tools (Salesforce, HubSpot)
CRM tools track external relationships. Living Memory Hub tracks internal organizational intelligence - decisions, governance, roles, policies, risks - as well as external relationships. It is both internal knowledge management and relationship intelligence.

### Versus knowledge base tools (Guru, Tettra, Confluence)
Those tools are manually curated. Living Memory Hub is automatically populated. Humans review and approve, but they never have to be the ones who write first.

### Versus general AI assistants (ChatGPT, Claude)
General AI answers from training data. Sera answers from your organization's specific, private, documented history. She knows what YOUR org decided, not what the internet thinks organizations generally decide.

---

## The Governing Philosophy

Living Memory Hub was built for **Teal organizations** - self-managing, purpose-driven organizations running on some variant of holacracy, sociocracy, or distributed governance. These organizations have specific needs that no other product addresses:

- Circle structure and role governance
- Canon document management (governance constitution)
- Distributed decision-making with audit trails
- Purpose alignment scoring for every decision
- Ledger entries for formal governance actions

However, the core product - automatic meeting-to-memory capture, task extraction, decision logging, risk tracking, and AI-powered retrieval - is universally valuable for any organization that runs on meetings and email. That is approximately every organization on earth.

---

## Current Deployment

The current live deployment (Amora Living Memory Hub) is processing:
- 43 emails ingested and fully processed
- 25 people profiles known
- 69 risks tracked (67 currently open)
- 40 policies in the policy library (39 in draft)
- 57 tasks extracted (38 currently open)
- 36 decisions confirmed, 6 still candidates
- 9 active governance circles
- 14 active roles, 13 with active holders
- 1 meeting fully captured end-to-end with AI extraction

The system has been running in production since initial deployment on Railway and is processing new emails in real time.

---

## Delivery Model

**Current state**: The product is fully built, tested in production, and running. It requires technical setup per client:
- Google Cloud project configuration (OAuth credentials, API access)
- Notion workspace setup (17 databases with correct schemas)
- Railway deployment (three services)
- Email inbox configuration
- Environment variable configuration (17+ Notion database IDs, API keys, OAuth credentials)

**The setup complexity is the primary barrier to mass market adoption.** A skilled technical implementer takes approximately 4-8 hours to deploy a clean instance. A non-technical buyer cannot self-serve.

**Realistic delivery models:**
1. **Done-for-you deployment** - Technical team sets up a complete instance; client gets a live Sera and dashboard within 48 hours
2. **White-label SaaS** - Multi-tenant version where clients sign up and get their own isolated instance managed centrally (requires significant engineering investment)
3. **Deployment-as-a-service + monthly subscription** - One-time setup fee + monthly fee for hosting, monitoring, and Claude API costs
4. **License + implementation partner network** - License the software; build a network of certified implementation partners

---

## Revenue Model Considerations

**One-time setup cost drivers:**
- Google Cloud configuration (OAuth app, API enablement)
- Notion workspace schema deployment (17 databases)
- Railway service deployment and environment configuration
- Initial system testing and validation
- Client training on Sera and dashboard

**Recurring cost drivers (cost of goods sold):**
- Railway hosting (currently ~$20-40/month for three services)
- Claude API usage (approximately $0.01-0.05 per email processed, depending on length)
- Notion subscription (Business or Enterprise plan required for API access)

**Estimated sustainable pricing range:**
- Setup: $2,000 - $10,000 depending on org size and complexity
- Monthly: $500 - $3,000 depending on volume and support tier
- This is a B2B product, not a consumer product. The buyer is an operations leader, CTO, Chief of Staff, or founder.

---

## What the Product Does NOT Do (important for honest marketing)

- It does not replace human judgment. Every extracted item goes through human review before it is accepted as institutional memory.
- It does not work without Google Workspace. The current implementation depends on Google Meet, Google Drive, and Google Docs APIs.
- It does not have a self-service signup flow. Setup requires technical implementation.
- It does not currently process Zoom, Teams, Loom, or other meeting platforms. It only captures what Google Meet generates.
- It does not guarantee perfect extraction. Claude is very good but not infallible. The human review layer exists precisely because AI makes mistakes.
- It does not store any data on its own servers. Everything lives in the client's own Notion workspace and their own Railway instance.

---

## The Strongest Single-Sentence Value Proposition (draft)

*"Living Memory Hub is the only system that automatically turns your team's meetings and emails into structured, searchable institutional memory - so Sera, your AI Chief of Staff, can answer any question about your organization's history in seconds."*

---

## Key Numbers for Marketing

- Setup time: 4-8 hours (technical implementation)
- Processing time per meeting: 2-5 minutes from email receipt to Notion records
- Query response time: 3-10 seconds for a Sera answer
- Polling interval: every 3 minutes (continuous monitoring)
- Data residency: 100% in client's own Notion workspace and Railway instance
- Zero-change adoption: team members do nothing differently
- Estimated knowledge capture rate: approximately 80-90% of actionable content from meeting transcripts
