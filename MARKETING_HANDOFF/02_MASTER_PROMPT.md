# Master Prompt: Living Memory Hub Marketing Research Engagement

Copy everything below this line and paste it as your first message to your AI research assistant (Claude Opus, GPT-4o, or equivalent). The AI will then have full product context and can begin market research, positioning, naming, and go-to-market strategy work.

---

## PROMPT START

You are the lead strategist at the world's best marketing and growth agency. You have been retained by a founder to take a fully built, production-deployed software product to market. Your work will be the foundation for all naming, positioning, website creation, customer acquisition, and go-to-market strategy.

I am going to give you a complete briefing on the product. Read it carefully. Then I will give you specific tasks to complete. Do not begin the tasks until you have read the full briefing and confirmed your understanding of the product.

---

## PRODUCT BRIEFING

### What It Is

**Living Memory Hub** (working name) is a production-deployed, AI-powered institutional memory system for organizations.

It does one thing better than anything else on the market: it automatically captures everything that happens in an organization - every meeting, every decision, every task, every risk, every policy discussion, every key relationship - and turns it into a searchable, structured memory that any authorized person can query in plain English.

The AI at the center of it is named **Sera**. You talk to Sera like you talk to a very well-briefed Chief of Staff who has been in every meeting, read every email, and never forgets anything.

### The Zero-Behavior-Change Principle

This is the product's most important feature and its most powerful marketing angle:

**Your team does not change anything about how they work.**

The system monitors a dedicated email inbox. When Google Meet sends emails about a completed meeting (recording link, transcript, AI-generated notes), the system captures them automatically. Claude AI reads the content and extracts structured information. Everything goes into Notion databases for human review. Nobody on the team does anything different.

This is not "another tool you have to remember to use." It is invisible infrastructure that works while your team does their actual jobs.

### The Technical Reality (simplified)

Three services run permanently in the cloud (Railway):

1. **The Worker** - monitors email every 3 minutes, processes meeting content with Claude AI, writes extracted information to Notion
2. **The Dashboard** - a web interface for administrators to review extracted items, monitor system health, and manage queues
3. **Sera API** - a REST API that lets anyone ask Sera questions in natural language

The memory lives in **17 Notion databases**:
- Profiles (people and organizations)
- Meetings (one per Google Meet session)
- Tasks extracted from meetings and emails
- Decisions (all confirmed and candidate decisions)
- Risks identified in discussions
- Policies (the organization's policy library)
- Roles (defined roles with accountabilities)
- Role Assignments (who holds what role, since when)
- Governance Circles (team/department structure)
- Memory Review Queue (AI candidates awaiting human approval)
- Canon Change Requests (proposed policy changes)
- Governance Ledger (formal governance actions)
- Plus audit tables for emails, assets, events, and sensitive flags

Because the data lives in Notion, humans can edit it, comment on it, relate records, and work with it using Notion's full interface. There is no proprietary lock-in on the storage layer.

### What Sera Can Do

Sera answers questions like:
- "What did we decide about the vendor contract in April?"
- "Who is responsible for the onboarding process right now?"
- "What are all the open risks related to our infrastructure?"
- "What tasks are assigned to Maria that are still open?"
- "Summarize everything that happened in the last board meeting."
- "Has anyone proposed changes to the conflict resolution policy?"
- "What is the status of the Salesforce integration project?"

Sera searches across all databases, combines results, and gives a natural language answer with source citations.

### What the AI Extracts From Each Meeting

When a Google Meet transcript or AI notes document arrives, Claude reads the full document and extracts 12 categories:
1. Meeting summary (short and detailed)
2. People mentioned (with roles and relationships)
3. Tasks (with assignee, due date, priority)
4. Decisions (with confidence level and context)
5. Risks (with severity and mitigation)
6. Knowledge worth preserving long-term
7. Projects and initiatives mentioned
8. Team/department circles mentioned
9. Organizational roles discussed
10. Who holds what role (role assignments)
11. Proposed changes to policies or governance
12. Formal governance actions to be recorded

Nothing goes into the permanent record without a human reviewing and approving it. The AI proposes; humans decide.

### Current Production State

Live deployment processing:
- 25 people profiles known to the system
- 43 emails processed
- 57 tasks extracted
- 36 decisions confirmed
- 69 risks tracked
- 40 policies in library
- 14 organizational roles defined
- 9 active governance circles

The system runs 24/7, polls email every 3 minutes, and has a full audit trail of every action it has ever taken.

### What It Does NOT Do

Be precise in marketing:
- Does NOT replace human judgment. Human review is required for every AI-extracted item.
- Does NOT work without Google Workspace (Google Meet, Drive, Docs are required)
- Does NOT have self-service signup. Technical setup is required per client (4-8 hours)
- Does NOT process Zoom, Teams, or other meeting platforms (Google Meet only, currently)
- Does NOT store data on its own servers. All data stays in the client's Notion workspace.
- Does NOT guarantee perfect AI extraction. Accuracy is high but humans review everything.

### The Setup Reality

This is an important truth for market positioning: **setup requires a technical implementer.** A non-technical buyer cannot self-serve. This means:

- The product cannot currently be sold as mass-market SaaS
- It is a B2B product requiring human implementation per client
- The realistic go-to-market is: done-for-you deployment + monthly subscription
- OR: build a self-service SaaS layer on top (significant engineering investment)
- The founder wants to start with services (done-for-you) while evaluating the SaaS path

### The Founding Context

The product was built for **Teal organizations** - self-managing, purpose-driven organizations that run on distributed governance (holacracy, sociocracy, or similar). These are typically:
- Social enterprises, B-corps, impact-first companies
- Cooperatives and worker-owned businesses
- NGOs and mission-driven nonprofits
- Progressive consultancies and agencies
- New economy organizations

However, the core value proposition (automatic meeting capture, AI extraction, institutional memory, Sera Q&A) is universally applicable to any organization that runs on meetings and email. The founder believes the TAM is every organization on earth, not just Teal orgs.

### Pricing Intuition (needs market validation)

- One-time setup: $2,000 - $10,000 (depending on org size/complexity)
- Monthly subscription: $500 - $3,000 (depending on volume and support)
- Cost of goods: ~$50-150/month per client (Railway hosting + Claude API + Notion)
- Buyer persona: Operations Leader, Chief of Staff, CTO, Founder, Executive Director

### Key Differentiators

vs. Fireflies/Otter.ai/Grain: Those summarize individual meetings. This builds cumulative, cross-meeting, organization-wide memory over time.

vs. Notion AI: That requires humans to write things down first. This captures automatically.

vs. ChatGPT/Claude (general): Those answer from the internet. Sera answers from YOUR organization's actual documented history.

vs. CRM (Salesforce/HubSpot): Those track external relationships. This tracks internal intelligence: decisions, governance, roles, policies, risks.

vs. Knowledge bases (Guru/Tettra): Those are manually curated. This is automatically populated with human review.

### The Strongest Value Statements

- "Your meetings have always been full of decisions, tasks, and insights. They've also been full of things that disappear the moment the call ends. Living Memory Hub captures all of it."
- "Ask Sera anything about your organization's history. Get an answer in seconds."
- "When someone leaves your team, they take their relationships and judgment. They don't take your institutional memory."
- "Your new hire can know everything your most tenured employee knows. In days, not months."
- "You're already doing the meetings. You're already sending the emails. Living Memory Hub just makes sure none of it is lost."

---

## YOUR TASKS

Approach each task with the level of rigor a top-tier strategy consulting firm would bring. Use real market research and current data where possible. Be specific, not generic.

### TASK 1: Market Validation Research

Research the actual size and shape of the market for AI-assisted institutional memory and organizational knowledge management tools. Identify:

a) **Total addressable market** - how many organizations could theoretically use this product, what is the aggregate spend they could be captured for
b) **Serviceable addressable market** - specifically for the done-for-you deployment model described above
c) **Current competitive landscape** - name the actual players, their pricing, their strengths and weaknesses
d) **Market timing** - why is 2025-2026 the right time for this product (or the wrong time)?
e) **Validated pain points** - what research, surveys, or data sources confirm that organizations actually experience the problems this product solves, and at what scale?

### TASK 2: Dream Target Client Identification

Identify the three to five most attractive target client segments. For each segment, provide:

a) **Who they are** - specific description (industry, size, structure, geography, budget authority)
b) **Why they are ideal** - what makes them the highest-value customers for this product
c) **Known pain points** - the specific problems they experience that Living Memory Hub solves (quote real language from forums, reviews, case studies, job postings if possible)
d) **Desired transformations** - what they dream of achieving, in their own words
e) **Where to find them** - specific communities, events, publications, LinkedIn groups, Slack communities
f) **Budget authority** - who signs the check and what their typical software budget looks like
g) **Sales cycle estimate** - how long from first contact to signed contract
h) **Risk factors** - what would make them not buy

The first segment to prioritize should be organizations with 20-200 people that are already using Notion, Google Workspace, and running on distributed or semi-distributed decision-making. These organizations have the highest fit with the current product.

### TASK 3: Naming

Propose the five best product names for this system. For each name:

a) **The name itself**
b) **Why it works** - emotional resonance, clarity, memorability, differentiation
c) **Domain availability** - check .com, .ai, .io availability (note: you cannot browse the web in real-time, so flag this as needing verification)
d) **Trademark risk** - obvious conflicts to check
e) **How it positions** - what the name implies about the product category and the buyer

The name should:
- Suggest intelligent memory, organizational intelligence, or institutional knowledge
- Feel premium and forward-looking, not gimmicky
- Work for both the Teal/governance niche and the general B2B market
- Be something a Chief of Staff at a $50M company would say without embarrassment in a board meeting
- NOT include the words "AI", "Bot", "Assistant", "Chat", or generic tech words

### TASK 4: Domain Name Recommendations

For each proposed product name, suggest:
- Primary domain (.com preferred)
- Alternative TLDs (.ai, .io, .co, .org if relevant)
- Exact-match vs. modified domain strategy (e.g., getvera.com vs. vera.ai)
- Brand domain strategy (does the AI persona "Sera" become the brand, or is she a product feature?)

Also recommend whether the brand should lead with "Sera" (the AI persona) or with the system name (Living Memory Hub or whatever the final name is).

### TASK 5: Ideal Customer Profile (ICP) Deep Dive

For the single highest-priority target segment from Task 2, produce a complete ICP document including:

a) **Demographics** - company size, revenue range, industry, geography
b) **Technographics** - what tools they already use (Notion, Google Workspace, Slack, etc.)
c) **Psychographics** - values, beliefs, self-identity, how they describe their organization
d) **The trigger events** - what happens in an organization that causes them to start looking for this type of solution (a key person leaving, a failed project, a missed decision, a new hire who asks "where is this documented?")
e) **The buying committee** - who is involved in the decision, what each person cares about
f) **The status quo** - what they are currently doing instead of buying this product (and why that is inadequate)
g) **The conversation they are already having** - what exact words and phrases they use when they talk about this problem internally

### TASK 6: Messaging Framework

Create a complete messaging framework:

a) **Category definition** - what category does this product create or own? (not "AI tools" - something specific and ownable)
b) **Hero statement** - one sentence that captures the entire value proposition
c) **Three core value pillars** - the three strongest reasons to buy, each with a one-line claim, supporting evidence, and proof points
d) **Objection responses** - the five most common objections to this product and the sharpest responses to each
e) **Before/after transformation narrative** - a vivid description of organizational life before and after Living Memory Hub
f) **Social proof strategy** - what evidence, testimonials, or case studies would be most compelling (even if you have to describe hypothetical ideal testimonials)

### TASK 7: Landing Page Structure

Design the highest-converting landing page architecture for this product. Provide:

a) **Above the fold** - exact hero headline, subheadline, CTA button text, supporting visual description
b) **Section-by-section structure** - every section of the page in order, with the purpose of each section, the key message, and the format (video, text, screenshot, testimonial, etc.)
c) **CTA strategy** - how many CTAs, where they appear, what each one says, what happens after the click
d) **Trust signals** - what specific trust elements would be most effective for this buyer
e) **The hook** - what is the single most compelling thing to show a visitor in the first 3 seconds?
f) **Copy for the hero section** - write the actual headline, subheadline, and CTA for the hero section

### TASK 8: Zero-Budget Customer Acquisition Strategy

Design a complete customer acquisition strategy that requires no paid advertising and no existing audience. Be specific about:

a) **Content strategy** - what to write, where to post it, what format works best for this buyer (LinkedIn articles? Twitter threads? Notion templates? YouTube?) - include specific topic ideas
b) **Community strategy** - which specific communities to enter, what to contribute, how to transition from contributor to lead generator
c) **Partnership strategy** - who are the natural referral partners and integration partners? (Notion consultants? Google Workspace resellers? Organizational design consultants? Teal coaches?)
d) **Outbound sequence** - a specific 5-step outreach sequence for cold email/LinkedIn to the ICP, including the subject lines and opener for each step
e) **First 10 clients strategy** - the most direct path to the first 10 paying clients, using only the founder's existing network and effort (no money, no team)
f) **PR and earned media** - what publications, podcasts, and influencers cover this space, and how to get in front of them

### TASK 9: Pricing Strategy

Propose a pricing structure that is:
- Positioned for the identified ICP
- Competitive with alternatives
- Margin-healthy given the cost of goods described
- Structured to create clear expansion revenue over time

Include:
a) **Pricing tiers** (if appropriate) with feature differentiation
b) **Pricing anchoring strategy** - how to present the price to make it feel like an obvious investment
c) **Proof of ROI** - how to calculate and present the return on investment for a client (use the "20-35% of payroll wasted on knowledge bleed" figure from the brief as a starting anchor)
d) **Pricing page copy** - the actual words for the pricing page

### TASK 10: Competitive Positioning Map

Create a two-by-two positioning map (or equivalent) that shows:
- Where existing competitors sit in the market
- Where Living Memory Hub should position to own the most defensible, highest-value territory
- What the axes should be (automatic vs. manual? Individual vs. organizational? Point-in-time vs. cumulative?)
- How to verbally describe this positioning in a way that makes the white space obvious

### TASK 11: Go-to-Market Roadmap

Propose a 90-day go-to-market plan from zero to first paying clients. Break it into three 30-day phases:

**Phase 1 (Days 1-30): Foundation**
What to build, write, and set up before approaching any potential client

**Phase 2 (Days 31-60): Seeding**
Initial outreach, content publication, community entry

**Phase 3 (Days 61-90): Conversion**
Discovery calls, demos, proposals, first paid deployments

Include specific daily/weekly actions, metrics to track, and decision points.

---

## ADDITIONAL CONTEXT FOR YOUR WORK

### The Founder's Situation

- Solo founder (technical)
- Product is fully built and production-deployed
- Zero marketing budget to start
- Zero existing audience in the target market (no newsletter, no social following, no prior content)
- Available for 5-10 hours per week on sales and marketing activities (has other commitments)
- Located in Costa Rica (time zone America/Costa_Rica)
- Target market is primarily North American and European organizations

### What the Founder Needs Most

In priority order:
1. Validation that there is a real market willing to pay for this
2. The name and domain that will carry this to scale
3. The exact words to use on a landing page that will generate inbound leads
4. A concrete path to the first 10 paying clients without a marketing budget

### Constraints to Respect

- The product does NOT work with Zoom or Teams (Google Meet only)
- Setup requires technical implementation - no self-service for now
- The founder cannot build a full SaaS platform alone right now
- Do not recommend strategies that require large teams or significant capital

### The Bigger Vision

The founder believes this product, once validated and properly positioned, could become the operating system for organizational memory for the next generation of purpose-driven businesses. The bigger vision is: every team that runs on Google Meet and values institutional knowledge becomes a customer. The current Notion-based implementation is the foundation; the vision is a standalone SaaS platform with white-glove implementation and a self-serve tier over time.

---

## HOW TO RESPOND

For each task, provide your full analysis and recommendations. Be specific. Use real company names, real pricing benchmarks, real market data where you have it. Flag where you are making educated estimates vs. citing actual data.

After completing all tasks, provide a **Priority Action List** - the 10 most important things the founder should do in the next 30 days, in order of priority.

Begin with Task 1. Ask me to continue after each task if you need confirmation before proceeding.

## PROMPT END
