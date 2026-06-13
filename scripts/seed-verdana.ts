/**
 * Seeds Verdana Commons' Notion workspace with realistic governance content.
 *
 * Usage:
 *   railway run --service "Sera Worker" npx ts-node scripts/seed-verdana.ts
 *
 * Safe to re-run: checks for existing records before creating; updates existing
 * circles and roles in place without overwriting relation fields.
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB_CIRCLES      = process.env.NOTION_DB_CIRCLES!;
const DB_ROLES        = process.env.NOTION_DB_ROLES!;
const DB_MEETINGS     = process.env.NOTION_DB_MEETINGS!;
const DB_TENSIONS     = process.env.NOTION_DB_TENSIONS;
const DB_EVENTS       = process.env.NOTION_DB_EVENTS;
const DB_COMMITMENTS  = process.env.NOTION_DB_COMMITMENTS;
const DB_GRATITUDES   = process.env.NOTION_DB_GRATITUDES;

if (!process.env.NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!DB_CIRCLES)  { console.error('NOTION_DB_CIRCLES required'); process.exit(1); }
if (!DB_ROLES)    { console.error('NOTION_DB_ROLES required'); process.exit(1); }
if (!DB_MEETINGS) { console.error('NOTION_DB_MEETINGS required'); process.exit(1); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rt = (content: string) => [{ type: 'text' as const, text: { content } }];

async function findPageByTitle(dbId: string, titleProp: string, value: string): Promise<string | null> {
  const res: any = await notion.databases.query({
    database_id: dbId,
    filter: { property: titleProp, title: { equals: value } },
    page_size: 1,
  });
  return res.results[0]?.id ?? null;
}

async function findPageByRichText(dbId: string, prop: string, value: string): Promise<string | null> {
  const res: any = await notion.databases.query({
    database_id: dbId,
    filter: { property: prop, rich_text: { equals: value } },
    page_size: 1,
  });
  return res.results[0]?.id ?? null;
}

// ─── Circle data ─────────────────────────────────────────────────────────────

const CIRCLE_DATA: Record<string, {
  purpose: string;
  domains: string;
  accountabilities: string;
  coreValues?: string;
  livingAgreement?: string;
  meetingCadence?: string;
  reviewCadence?: string;
  status: string;
}> = {
  'Governance Circle': {
    purpose: 'Hold the constitutional framework of Verdana Commons, steward the consent-based decision process across all circles, and ensure the community operates with clear agreements and shared accountability.',
    domains: 'CCOS canon and community constitution; Governance meeting facilitation; Cross-circle coordination and dependency management; Conflict resolution process and protocols; Canon change request review; Member onboarding into teal governance',
    accountabilities: 'Facilitating all-circle governance meetings on a biweekly cadence using CCOS consent process; Maintaining the governance backlog and open tension log; Reviewing and routing canon change requests within 30 days of submission; Coordinating dependencies between circles to prevent bottlenecks; Publishing decisions and amendments to the community constitution; Overseeing the AI Secretary role and ensuring Sera records remain accurate and current',
    coreValues: 'Consent over command; Transparency over secrecy; Distributed authority over centralized control; Process integrity over speed',
    livingAgreement: 'We show up prepared. We speak from direct experience. We name tensions without assigning blame. We trust the process to hold what feels unresolvable.',
    meetingCadence: 'Biweekly governance meeting; Monthly cross-circle sync; Quarterly all-hands review',
    reviewCadence: 'Quarterly',
    status: 'Active',
  },
  'Finance Circle': {
    purpose: 'Steward the financial health of Verdana Commons, maintain transparency with all members, and develop regenerative economic structures that sustain the community long-term.',
    domains: 'Monthly financial accounts and reporting; Annual budget process and circle allocations; Reserve fund management and policy; Member contribution agreements; Grant research and fundraising strategy; Vendor contracts and procurement',
    accountabilities: 'Publishing monthly financial summary to all members by the 10th of each month; Maintaining reserve fund at minimum 3 months of operating expenses; Facilitating annual budget process with input from all circles; Reviewing and approving vendor contracts; Reporting quarterly on grant pipeline and fundraising progress; Flagging financial risks to Governance Circle within 48 hours of identification',
    coreValues: 'Full transparency; Stewardship over ownership; Long-term sufficiency over short-term comfort',
    status: 'Active',
  },
  'Operations Circle': {
    purpose: 'Ensure the physical infrastructure, shared resources, and day-to-day operations of Verdana Commons run reliably and sustainably.',
    domains: 'Shared facilities maintenance and scheduling; Vendor and contractor relationships; Tool library and resource stewardship; Vehicle and equipment fleet; Safety protocols and emergency preparedness; Common house and workshop operations',
    accountabilities: 'Scheduling and coordinating shared facility use; Maintaining tool library inventory and condition records; Coordinating annual facility inspections and maintenance calendar; Managing active vendor and contractor relationships; Publishing monthly operations report to all members; Escalating safety issues to Governance within 24 hours',
    status: 'Active',
  },
  'Stewardship Circle': {
    purpose: 'Steward the land, food systems, native habitat, and ecological regeneration practices of Verdana Commons in service of long-term reciprocal relationship with the Pacific Northwest landscape.',
    domains: 'Land and soil health; Food gardens and annual production; Orchard and perennial food systems; Native plant restoration and habitat corridors; Water management and stormwater systems; Ecological monitoring and documentation',
    accountabilities: 'Coordinating seasonal planting, harvest, and restoration work parties; Maintaining and expanding the native plant restoration program; Documenting soil health and ecological observations on an annual basis; Stewarding the partnership with Watershed Foundation; Proposing land use policy changes to Governance for consent; Coordinating the summer permaculture internship program',
    coreValues: 'Reciprocity with the land; Patience over optimization; Observation before intervention; Local species over introduced varieties',
    status: 'Active',
  },
  'Community Experience Circle': {
    purpose: 'Cultivate belonging, connection, and cultural vitality at Verdana Commons — stewarding the rituals, relationships, and shared life that make this a community and not just a housing project.',
    domains: 'Community events and seasonal celebrations; New member welcome and integration process; Member wellbeing and interpersonal connection; Community communications and internal newsletter; Conflict support and listening circles',
    accountabilities: 'Organizing at minimum one community gathering per month; Stewarding the new member buddy system for the full 90-day integration period; Publishing community newsletter every two weeks; Facilitating listening circles when interpersonal tensions arise; Tracking member wellbeing indicators and reporting to Governance quarterly',
    status: 'Active',
  },
  'Technology & Infrastructure Circle': {
    purpose: 'Steward the digital infrastructure of Verdana Commons, including the Sera living memory system, and ensure technology serves the community rather than extracting its attention.',
    domains: 'Sera AI Secretary and Saberra Living Memory Hub; Notion workspace structure and database health; Community-facing digital tools and platforms; Cybersecurity and data stewardship; Digital onboarding for new members; Technical troubleshooting and support',
    accountabilities: 'Maintaining the Sera worker service and Notion integration in functional operating condition; Auditing Sera extraction quality monthly and flagging systematic errors; Stewarding the community data policy and ensuring member privacy is protected; Onboarding new members to digital tools within 7 days of move-in; Coordinating with Saberra support for platform issues; Reviewing and recommending new tools to the community using a digital minimalism lens',
    status: 'Active',
  },
};

// ─── Role data ────────────────────────────────────────────────────────────────

const ROLE_DATA: Record<string, {
  purpose: string;
  domains: string;
  accountabilities: string;
  arcAwareness?: string;
  arcChoice?: string;
  arcReciprocity?: string;
  roleType: string;
  termLength: string;
  assignmentMethod: string;
  status: string;
  kpis?: string;
}> = {
  'Lead Steward': {
    purpose: 'Serve as the named steward of Verdana Commons\' governing purpose, hold the long-view of community health, and ensure all circles are operating in coherent relationship with each other and the land.',
    domains: 'Governing purpose stewardship; Cross-circle coordination and escalation; External representation and partnerships; Community health and culture signal-holding; Canon integrity oversight',
    accountabilities: 'Convening and facilitating monthly all-circle lead sync; Representing Verdana Commons in external partnerships and agreements; Escalating cross-circle conflicts that cannot be resolved within circles; Reviewing and signing off on vendor contracts above $2,000; Holding final accountability for canon integrity in the absence of Governance Circle quorum; Presenting annual community state-of-health report at Spring Equinox gathering',
    arcAwareness: 'I know when the community is out of alignment with its governing purpose. I sense early signals of relational fracture, mission drift, or governance breakdown — and I name them before they become crises.',
    arcChoice: 'I choose to hold the long view even when urgency pulls toward short-term fixes. I choose transparency when it is uncomfortable and consent process when it is slow.',
    arcReciprocity: 'I offer steady presence, honest naming, and institutional memory. I ask for clear feedback, protected recovery time, and community trust in the governance process.',
    roleType: 'Lead Steward',
    termLength: '1 Year',
    assignmentMethod: 'Consent Election',
    status: 'Active',
    kpis: 'All-circle syncs held per quarter; External partnerships active; Open cross-circle conflicts resolved within 30 days; Canon change requests reviewed within target window',
  },
  'Finance Steward': {
    purpose: 'Maintain the financial integrity and transparency of Verdana Commons, protect the community\'s long-term economic resilience, and ensure every member can trust the numbers.',
    domains: 'Financial accounts, reporting, and audit trail; Reserve fund management; Member contribution agreements and exceptions; Grant applications and donor stewardship; Annual budget process facilitation',
    accountabilities: 'Producing and publishing monthly financial report by the 10th of each month; Maintaining reserve fund above 3-month minimum; Facilitating annual budget process across all circles with documented consent; Reviewing and approving vendor contracts under $2,000; Flagging financial risks to Lead Steward and Governance within 48 hours; Preparing annual audit-ready records by January 31',
    arcAwareness: 'I see the full financial picture clearly. I know which numbers indicate health and which are early warning signs — and I hold that awareness as a community service, not private knowledge.',
    arcChoice: 'I choose full transparency even when the numbers are uncomfortable. I choose long-term sufficiency over short-term relief.',
    arcReciprocity: 'I offer rigorous, timely, plain-language financial reporting. I ask for member trust, sufficient time for accurate bookkeeping, and advance notice before unusual expenditures.',
    roleType: 'Custom Role',
    termLength: '1 Year',
    assignmentMethod: 'Consent Election',
    status: 'Active',
    kpis: 'Monthly reports published on time; Reserve fund months maintained; Budget adherence by circle; Grant pipeline conversion rate',
  },
  'Land Steward': {
    purpose: 'Hold primary accountability for the health and regeneration of the Verdana Commons land base, stewarding an ongoing reciprocal relationship between the community and its ecosystem.',
    domains: 'Soil health monitoring and regenerative practices; Native plant restoration and habitat stewardship; Food garden and orchard coordination; Water management and stormwater systems; Seasonal work party planning and coordination',
    accountabilities: 'Coordinating at minimum four seasonal land work parties per year; Maintaining and publishing annual ecological health report; Stewarding the partnership with Watershed Foundation; Proposing land use policy changes to Governance Circle for consent; Coordinating the summer permaculture internship program with host family; Documenting all native species plantings and removals',
    arcAwareness: 'I read the land. I know what it needs, what it is giving, and where the relationship is breaking down — and I hold that knowledge as a responsibility to share, not to manage alone.',
    arcChoice: 'I choose observation before intervention. I choose native over introduced, perennial over annual, and relationship over productivity.',
    arcReciprocity: 'I offer deep ecological attention, seasonal coordination, and practical land knowledge. I ask for member participation in work parties, respect for restoration zones, and patience with ecological timescales.',
    roleType: 'Custom Role',
    termLength: '1 Year',
    assignmentMethod: 'Consent Election',
    status: 'Active',
    kpis: 'Work parties held per year; Native species planted vs. removed; Soil organic matter trend; Watershed Foundation partnership milestones met',
  },
  'Community Steward': {
    purpose: 'Tend the relational fabric and cultural vitality of Verdana Commons — holding the belonging, the joy, and the repair that makes this a living community.',
    domains: 'Community gathering and seasonal celebrations; New member welcome and 90-day integration; Member wellbeing monitoring and support; Community newsletter and internal communications; Interpersonal conflict support and listening circles',
    accountabilities: 'Organizing at minimum one community gathering per month; Matching every new member with a buddy within 3 days of move-in; Publishing community newsletter every two weeks; Facilitating at least two listening circles per quarter; Reporting community wellbeing signals to Governance quarterly; Coordinating logistics for Spring Equinox and Summer Solstice gatherings',
    arcAwareness: 'I feel the emotional temperature of the community. I notice who is isolated, who is burning out, who is thriving — and I bring that awareness into community design.',
    arcChoice: 'I choose belonging over efficiency. I choose repair over avoidance and celebration over being too busy to pause.',
    arcReciprocity: 'I offer consistent, warm, low-pressure connection. I ask for members\' honest sharing of how they are doing and community investment in gatherings as a non-optional part of life here.',
    roleType: 'Custom Role',
    termLength: '1 Year',
    assignmentMethod: 'Consent Election',
    status: 'Active',
    kpis: 'Community gatherings per month; New member buddy assignment within 3 days; Newsletter published biweekly; Listening circles facilitated per quarter',
  },
  'AI Secretary (Sera)': {
    purpose: 'Steward the Sera Living Memory Hub on behalf of Verdana Commons — ensuring the AI institutional memory system is operating correctly, its outputs are trustworthy, and the community can rely on it for governance continuity.',
    domains: 'Sera worker service and Saberra platform health; Notion workspace structure and database accuracy; Extraction quality review and error flagging; Member data privacy and community data policy; AI system documentation and onboarding',
    accountabilities: 'Reviewing Sera extraction outputs monthly for accuracy and hallucination flags; Reporting Sera system errors to Saberra support within 24 hours; Maintaining community data policy and ensuring compliance; Onboarding new members to Sera and Notion tools within 7 days of move-in; Documenting known Sera limitations in the Knowledge Base; Proposing Sera configuration changes to Technology Circle for consent',
    arcAwareness: 'I know when the system is producing noise, when records are drifting from ground truth, and when the technology is serving the community versus when it is creating additional burden.',
    arcChoice: 'I choose accuracy over volume. I choose human review over automation wherever the stakes are high. I choose to flag uncertainty rather than suppress it.',
    arcReciprocity: 'I offer consistent system maintenance, honest error reporting, and accessible documentation. I ask for member participation in record correction and good-faith engagement with the governance memory process.',
    roleType: 'AI Secretary',
    termLength: '1 Year',
    assignmentMethod: 'Consent Election',
    status: 'Active',
    kpis: 'Monthly extraction quality reviews completed; System errors reported within SLA; New member tech onboarding within 7 days; Knowledge Base articles current and accurate',
  },
  'Admin Facilitator': {
    purpose: 'Hold the operational backbone of Verdana Commons governance meetings — ensuring meetings start well, stay on track, and produce clear records.',
    domains: 'Governance meeting facilitation and agenda stewardship; Meeting notes and decision records; Consent process integrity during meetings; Tension processing and backlog management; CCOS Ledger entry submission',
    accountabilities: 'Preparing and distributing governance meeting agendas 48 hours in advance; Facilitating all governance meetings using the CCOS consent process; Publishing meeting decisions to the community within 24 hours of meeting close; Maintaining the open tension backlog and ensuring all tensions receive acknowledgment; Submitting CCOS Ledger entries for all decisions within 72 hours; Coordinating with AI Secretary for Sera memory updates',
    arcAwareness: 'I hold the process even when the room is chaotic. I notice when consent is being assumed rather than tested, when voices are missing, and when a tension needs more time.',
    arcChoice: 'I choose process integrity over speed. I choose the slower, cleaner decision over the fast decision that fractures.',
    arcReciprocity: 'I offer clear, fair, unhurried facilitation. I ask for members to come prepared, speak concisely, and trust the process even when it feels slow.',
    roleType: 'Admin Facilitator',
    termLength: '1 Year',
    assignmentMethod: 'Consent Election',
    status: 'Active',
    kpis: 'Agendas published 48 hours in advance; Decisions published within 24 hours; Tension backlog processed within 2 weeks; CCOS Ledger entries submitted within 72 hours',
  },
};

// ─── Meeting data ─────────────────────────────────────────────────────────────

const MEETING_DATA = [
  {
    title: 'Verdana Commons Q1 Finance Circle Review',
    date: '2026-04-15',
    processingStatus: 'Processed',
    notesAccessStatus: 'Confirmed',
    summary: 'Finance Circle reviewed Q1 actuals vs budget. Monthly contribution floor confirmed at $850. Reserve fund at 4.2 months of operating expenses. Watershed Foundation grant application approved for submission. Three open vendor contracts flagged for renewal in Q2. Devon Park to prepare comparative 2025 vs 2026 report for community all-hands in May.',
  },
  {
    title: 'Verdana Commons Stewardship Circle - Spring Planning',
    date: '2026-04-08',
    processingStatus: 'Processed',
    notesAccessStatus: 'Unknown',
    summary: 'Stewardship Circle planned spring work party schedule across April and May. Reviewed native planting progress in the north meadow corridor — 340 of 500 target plants established. Approved partnership with Cascadia Permaculture School for summer internship program: two students hosted June through August. Amara Nwosu to coordinate student housing placement by April 20.',
  },
];

// ─── Tensions data ────────────────────────────────────────────────────────────

const TENSIONS_DATA = [
  {
    title: 'Unclear process for amending member contribution agreements mid-year',
    type: 'Governance',
    evidence: 'Two households requested contribution adjustments in Q1 due to changed circumstances. Finance Circle and Governance Circle gave conflicting guidance. No documented process exists for mid-year amendment requests.',
  },
  {
    title: 'West garden water usage unresolved between two households',
    type: 'Operational',
    evidence: 'Ongoing dispute about drip irrigation schedule sharing in the west garden plot. Both households have escalated to Community Steward twice with no resolution. Operations Circle has not yet been engaged.',
  },
  {
    title: 'Reserve fund transparency: members want monthly vs quarterly reporting',
    type: 'Governance',
    evidence: 'Community survey (March 2026) showed 68% of members want monthly reserve fund balance published. Current policy is quarterly. Finance Circle has not proposed a change; tension logged by Jordan Kim.',
  },
  {
    title: 'Onboarding circle for new members not yet formally established',
    type: 'Governance',
    evidence: 'New Member Orientation Cohort 3 scheduled for May 10 without a formal onboarding circle or defined accountabilities. Community Experience Circle and Governance Circle both believe the other is responsible.',
  },
  {
    title: 'Role clarity gap: who approves vendor contracts under $500?',
    type: 'Governance',
    evidence: 'Finance Steward approves contracts over $2,000 and Lead Steward over $2,000. No defined authority for contracts under $500. At least four purchases in Q1 were made without documented authorization.',
  },
];

// ─── Events data ──────────────────────────────────────────────────────────────

const EVENTS_DATA = [
  {
    name: 'Spring Equinox Gathering 2026',
    type: 'Celebration',
    date: '2026-04-20',
    status: 'Confirmed',
    location: 'Verdana Commons Common House and South Meadow',
    description: 'Annual spring equinox celebration marking the start of the growing season. Includes potluck dinner, community intention-setting circle, seed swap, and first planting ceremony in the food garden. All 80 members invited; families and young children central to the program.',
  },
  {
    name: 'New Member Orientation - Cohort 3',
    type: 'Workshop',
    date: '2026-05-10',
    status: 'Confirmed',
    location: 'Verdana Commons Workshop Space',
    description: 'Full-day orientation for the six households joining in Spring 2026. Covers CCOS governance model, Notion and Sera tools, community agreements, land stewardship norms, shared resource access, and buddy system matching. Facilitated by Community Steward and Admin Facilitator.',
  },
  {
    name: 'Summer Solstice Work Party & Celebration',
    type: 'Work Party',
    date: '2026-06-21',
    status: 'Proposed',
    location: 'Verdana Commons — North Meadow Restoration Zone',
    description: 'Full-day land stewardship work party focused on native planting and invasive removal in the north meadow corridor, followed by evening solstice celebration. Cascadia Permaculture School interns to co-facilitate the restoration work. Potluck and fire circle in the evening.',
  },
];

// ─── Commitments data ─────────────────────────────────────────────────────────

const COMMITMENTS_DATA = [
  {
    title: 'Annual ecological audit partnership with Watershed Foundation',
    type: 'External',
    terms: 'Watershed Foundation conducts an annual ecological health assessment of the Verdana Commons land base each September. Verdana Commons provides full access to the land, staff time for accompaniment (minimum 8 hours), and a co-written summary report. Watershed Foundation provides the assessment report within 60 days. Both parties share findings with the broader watershed restoration network.',
    effectiveDate: '2024-09-01',
    reviewDate: '2026-09-01',
    evidence: 'Partnership formalized at September 2024 community meeting. Finance Circle approved in-kind contribution. Watershed Foundation letter of agreement on file with Finance Steward.',
  },
  {
    title: 'Monthly financial transparency report to all members',
    type: 'Org-Wide',
    terms: 'Finance Steward commits to publishing a plain-language financial summary to all members by the 10th of each calendar month. The report includes: actual vs. budgeted income and expenses, reserve fund balance, any open vendor contracts above $500, and a one-paragraph narrative from the Finance Steward. Members commit to reviewing the report and raising questions within 7 days of publication.',
    effectiveDate: '2025-01-10',
    reviewDate: '2026-12-31',
    evidence: 'Governance Circle consent decision, January 2025. Proposed by Rosa Figueroa following community feedback that quarterly reporting was insufficient.',
  },
  {
    title: 'New member buddy system - 90-day guided integration',
    type: 'Org-Wide',
    terms: 'Every new household joining Verdana Commons receives a designated buddy — an existing member who has lived at Verdana for at least one year. The buddy connects at minimum weekly during the first 30 days and biweekly in days 31-90. Community Steward is accountable for buddy matching within 3 days of move-in and check-ins at 30 and 90 days. New member feedback is collected at 90 days and used to improve the program.',
    effectiveDate: '2025-06-01',
    reviewDate: '2026-06-01',
    evidence: 'Adopted by Community Experience Circle June 2025 following feedback from Cohort 1 and 2 new members that informal welcome was insufficient.',
  },
];

// ─── Gratitudes data ──────────────────────────────────────────────────────────

const GRATITUDES_DATA = [
  {
    title: 'Marcus to Amara — spring planting leadership',
    appreciation: 'Amara led the spring native planting work party with remarkable steadiness and skill. She coordinated 22 volunteers across three work zones, taught plant identification to the new members, and stayed two hours after to help with cleanup without being asked. The north meadow looks more alive than it has in years. Thank you.',
    date: '2026-04-22',
    fromName: 'Marcus Webb',
    toName: 'Amara Nwosu',
  },
  {
    title: 'Jordan to Devon — financial clarity in hard conversation',
    appreciation: 'Devon brought an exceptionally clear explanation of the reserve fund trade-offs to last month\'s all-hands when the room was anxious and the numbers were complicated. The plain-language framing helped the whole community stay in consent process rather than defaulting to fear. That kind of grounded financial communication is rare and it matters here.',
    date: '2026-05-12',
    fromName: 'Jordan Kim',
    toName: 'Devon Park',
  },
  {
    title: 'Maria Elena to James — quiet infrastructure holding',
    appreciation: 'James has been quietly keeping the tool library organized, the irrigation timer calibrated, and the workshop swept for six months without ever putting it in a meeting agenda or asking for recognition. It noticed. The invisible labor of operational care is what keeps this place running. Seen and deeply appreciated.',
    date: '2026-05-28',
    fromName: 'Maria Elena Vasquez',
    toName: 'James Okonkwo',
  },
];

// ─── Step functions ───────────────────────────────────────────────────────────

async function updateCircles(): Promise<{ updated: number; skipped: number }> {
  console.log('\n── Circles ──────────────────────────────────────────────────────');
  let updated = 0;
  let skipped = 0;

  for (const [name, data] of Object.entries(CIRCLE_DATA)) {
    try {
      const pageId = await findPageByTitle(DB_CIRCLES, 'Circle Name', name);
      if (!pageId) {
        console.log(`  SKIP (not found): ${name}`);
        skipped++;
        continue;
      }

      const properties: any = {
        Purpose:           { rich_text: rt(data.purpose) },
        Domains:           { rich_text: rt(data.domains) },
        Accountabilities:  { rich_text: rt(data.accountabilities) },
        Status:            { select: { name: data.status } },
      };

      if (data.coreValues)     properties['Notes'] = { rich_text: rt(`Core Values: ${data.coreValues}${data.livingAgreement ? '\n\nLiving Agreement: ' + data.livingAgreement : ''}`) };
      if (data.meetingCadence) properties['Meeting Cadence'] = { rich_text: rt(data.meetingCadence) };
      if (data.reviewCadence)  properties['Review Cadence'] = { select: { name: data.reviewCadence } };

      await notion.pages.update({ page_id: pageId, properties });
      console.log(`  Updated: ${name}`);
      updated++;
    } catch (err: any) {
      console.error(`  ERROR updating circle "${name}": ${err.message}`);
    }
  }

  return { updated, skipped };
}

async function updateRoles(): Promise<{ updated: number; skipped: number }> {
  console.log('\n── Roles ────────────────────────────────────────────────────────');
  let updated = 0;
  let skipped = 0;

  for (const [name, data] of Object.entries(ROLE_DATA)) {
    try {
      let pageId = await findPageByTitle(DB_ROLES, 'Role Name', name);

      const arcParts: string[] = [];
      if (data.arcAwareness)   arcParts.push(`ARC — Awareness:\n${data.arcAwareness}`);
      if (data.arcChoice)      arcParts.push(`ARC — Choice:\n${data.arcChoice}`);
      if (data.arcReciprocity) arcParts.push(`ARC — Reciprocity:\n${data.arcReciprocity}`);

      const notesContent = [
        arcParts.join('\n\n'),
        data.kpis ? `KPIs:\n${data.kpis}` : '',
      ].filter(Boolean).join('\n\n');

      const properties: any = {
        Purpose:            { rich_text: rt(data.purpose) },
        Domains:            { rich_text: rt(data.domains) },
        Accountabilities:   { rich_text: rt(data.accountabilities) },
        'Role Type':        { select: { name: data.roleType } },
        'Term Length':      { select: { name: data.termLength } },
        'Assignment Method':{ select: { name: data.assignmentMethod } },
        Status:             { select: { name: data.status } },
        ...(notesContent ? { Notes: { rich_text: rt(notesContent) } } : {}),
      };

      if (pageId) {
        await notion.pages.update({ page_id: pageId, properties });
        console.log(`  Updated: ${name}`);
      } else {
        await notion.pages.create({ parent: { database_id: DB_ROLES }, properties: { 'Role Name': { title: rt(name) }, ...properties } });
        console.log(`  Created: ${name}`);
      }
      updated++;
    } catch (err: any) {
      console.error(`  ERROR updating role "${name}": ${err.message}`);
    }
  }

  return { updated, skipped };
}

async function createMeetings(): Promise<{ created: number; skipped: number }> {
  console.log('\n── Meetings ─────────────────────────────────────────────────────');
  let created = 0;
  let skipped = 0;

  for (const m of MEETING_DATA) {
    try {
      const existing = await findPageByTitle(DB_MEETINGS, 'Meeting Title', m.title);
      if (existing) {
        console.log(`  SKIP (exists): ${m.title}`);
        skipped++;
        continue;
      }

      const properties: any = {
        'Meeting Title':       { title: rt(m.title) },
        'Meeting Date':        { date: { start: m.date } },
        'Processing Status':   { select: { name: m.processingStatus } },
        'Notes Access Status': { select: { name: m.notesAccessStatus } },
        Summary:               { rich_text: rt(m.summary) },
      };

      await notion.pages.create({ parent: { database_id: DB_MEETINGS }, properties });
      console.log(`  Created: ${m.title}`);
      created++;
    } catch (err: any) {
      console.error(`  ERROR creating meeting "${m.title}": ${err.message}`);
    }
  }

  return { created, skipped };
}

async function createTensions(): Promise<{ created: number; skipped: number }> {
  console.log('\n── Tensions ─────────────────────────────────────────────────────');
  if (!DB_TENSIONS) {
    console.log('  SKIP: NOTION_DB_TENSIONS not set');
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const t of TENSIONS_DATA) {
    try {
      const existing = await findPageByTitle(DB_TENSIONS, 'Tension', t.title);
      if (existing) {
        console.log(`  SKIP (exists): ${t.title}`);
        skipped++;
        continue;
      }

      await notion.pages.create({
        parent: { database_id: DB_TENSIONS },
        properties: {
          Tension:            { title: rt(t.title) },
          Type:               { select: { name: t.type } },
          Status:             { select: { name: 'Open' } },
          'Source Evidence':  { rich_text: rt(t.evidence) },
        } as any,
      });
      console.log(`  Created: ${t.title}`);
      created++;
    } catch (err: any) {
      console.error(`  ERROR creating tension "${t.title}": ${err.message}`);
    }
  }

  return { created, skipped };
}

async function createEvents(): Promise<{ created: number; skipped: number }> {
  console.log('\n── Events ───────────────────────────────────────────────────────');
  if (!DB_EVENTS) {
    console.log('  SKIP: NOTION_DB_EVENTS not set');
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const e of EVENTS_DATA) {
    try {
      const existing = await findPageByTitle(DB_EVENTS, 'Event Name', e.name);
      if (existing) {
        console.log(`  SKIP (exists): ${e.name}`);
        skipped++;
        continue;
      }

      await notion.pages.create({
        parent: { database_id: DB_EVENTS },
        properties: {
          'Event Name':  { title: rt(e.name) },
          Type:          { select: { name: e.type } },
          Date:          { date: { start: e.date } },
          Status:        { select: { name: e.status } },
          Location:      { rich_text: rt(e.location) },
          Description:   { rich_text: rt(e.description) },
        } as any,
      });
      console.log(`  Created: ${e.name}`);
      created++;
    } catch (err: any) {
      console.error(`  ERROR creating event "${e.name}": ${err.message}`);
    }
  }

  return { created, skipped };
}

async function createCommitments(): Promise<{ created: number; skipped: number }> {
  console.log('\n── Commitments ──────────────────────────────────────────────────');
  if (!DB_COMMITMENTS) {
    console.log('  SKIP: NOTION_DB_COMMITMENTS not set');
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const c of COMMITMENTS_DATA) {
    try {
      const existing = await findPageByTitle(DB_COMMITMENTS, 'Agreement Title', c.title);
      if (existing) {
        console.log(`  SKIP (exists): ${c.title}`);
        skipped++;
        continue;
      }

      await notion.pages.create({
        parent: { database_id: DB_COMMITMENTS },
        properties: {
          'Agreement Title':  { title: rt(c.title) },
          Type:               { select: { name: c.type } },
          Status:             { select: { name: 'Active' } },
          Terms:              { rich_text: rt(c.terms) },
          'Effective Date':   { date: { start: c.effectiveDate } },
          'Review Date':      { date: { start: c.reviewDate } },
          'Source Evidence':  { rich_text: rt(c.evidence) },
        } as any,
      });
      console.log(`  Created: ${c.title}`);
      created++;
    } catch (err: any) {
      console.error(`  ERROR creating commitment "${c.title}": ${err.message}`);
    }
  }

  return { created, skipped };
}

async function createGratitudes(): Promise<{ created: number; skipped: number }> {
  console.log('\n── Gratitudes ───────────────────────────────────────────────────');
  if (!DB_GRATITUDES) {
    console.log('  SKIP: NOTION_DB_GRATITUDES not set');
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const g of GRATITUDES_DATA) {
    try {
      const existing = await findPageByTitle(DB_GRATITUDES, 'Appreciation', g.title);
      if (existing) {
        console.log(`  SKIP (exists): ${g.title}`);
        skipped++;
        continue;
      }

      await notion.pages.create({
        parent: { database_id: DB_GRATITUDES },
        properties: {
          Appreciation:        { title: rt(g.title) },
          Date:                { date: { start: g.date } },
          'Source Evidence':   { rich_text: rt(`Submitted by ${g.fromName}`) },
        } as any,
      });
      console.log(`  Created: ${g.title}`);
      created++;
    } catch (err: any) {
      console.error(`  ERROR creating gratitude "${g.title}": ${err.message}`);
    }
  }

  return { created, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('Verdana Commons seed script starting...');
  console.log(`Tenant: ${process.env.TENANT_ID ?? '(not set)'}`);

  const results = {
    circles:     { updated: 0, skipped: 0 },
    roles:       { updated: 0, skipped: 0 },
    meetings:    { created: 0, skipped: 0 },
    tensions:    { created: 0, skipped: 0 },
    events:      { created: 0, skipped: 0 },
    commitments: { created: 0, skipped: 0 },
    gratitudes:  { created: 0, skipped: 0 },
  };

  results.circles     = await updateCircles();
  results.roles       = await updateRoles();
  results.meetings    = await createMeetings();
  results.tensions    = await createTensions();
  results.events      = await createEvents();
  results.commitments = await createCommitments();
  results.gratitudes  = await createGratitudes();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Seed complete — Verdana Commons summary:');
  console.log(`  Circles:     ${results.circles.updated} updated, ${results.circles.skipped} not found`);
  console.log(`  Roles:       ${results.roles.updated} updated, ${results.roles.skipped} not found`);
  console.log(`  Meetings:    ${results.meetings.created} created, ${results.meetings.skipped} already existed`);
  console.log(`  Tensions:    ${DB_TENSIONS ? `${results.tensions.created} created, ${results.tensions.skipped} already existed` : 'skipped (env var not set)'}`);
  console.log(`  Events:      ${DB_EVENTS ? `${results.events.created} created, ${results.events.skipped} already existed` : 'skipped (env var not set)'}`);
  console.log(`  Commitments: ${DB_COMMITMENTS ? `${results.commitments.created} created, ${results.commitments.skipped} already existed` : 'skipped (env var not set)'}`);
  console.log(`  Gratitudes:  ${DB_GRATITUDES ? `${results.gratitudes.created} created, ${results.gratitudes.skipped} already existed` : 'skipped (env var not set)'}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
