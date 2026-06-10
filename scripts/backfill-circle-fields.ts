/**
 * Backfills Domains, Accountabilities, KPIs, and Meeting Cadence for the 8
 * active Amora CCOS circles. Does not overwrite non-empty fields.
 *
 * Safe to re-run. Usage: npx ts-node scripts/backfill-circle-fields.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const CIRCLES_DB     = process.env.NOTION_DB_CIRCLES;

if (!NOTION_API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!CIRCLES_DB)     { console.error('NOTION_DB_CIRCLES required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

interface CircleData {
  name: string;
  purpose: string;
  domains: string;
  accountabilities: string;
  kpis: string;
  meetingCadence: string;
}

const CIRCLES: CircleData[] = [
  {
    name: 'Governance & Coordination',
    purpose: 'Hold the constitutional framework of Amora, steward the consent-based decision process, and coordinate across all circles.',
    domains: 'CCOS canon and Living Constitution; Governance meeting facilitation; Cross-circle coordination; Conflict resolution process; AI Secretary (Sera) and Living Memory Hub',
    accountabilities: 'Running all governance meetings using CCOS consent process; Maintaining the governance backlog and canon change queue; Coordinating dependencies between circles; Onboarding new members into the Teal governance model; Overseeing the Living Memory Hub (Sera) and ensuring records remain accurate; Publishing and maintaining the Living Constitution',
    kpis: 'Governance meetings held per quarter; Open tensions resolved; Canon change requests reviewed within 30 days; Member onboarding completion rate',
    meetingCadence: 'Bi-weekly governance meeting; Monthly cross-circle sync',
  },
  {
    name: 'Community & Culture',
    purpose: 'Cultivate belonging, connection, and cultural vitality. Steward community rituals, relationships, and the lived experience of Amora.',
    domains: 'Community rituals and events; Welcome and onboarding experience; Member relationships and connection; Cultural expressions and celebrations; Community conflict support',
    accountabilities: 'Organizing community gatherings and rituals; Welcoming and integrating new members; Monitoring community health and belonging; Facilitating interpersonal connection across the community; Proposing and stewarding shared cultural practices',
    kpis: 'Community events per quarter; New member integration satisfaction; Member retention rate; Reported sense of belonging (survey)',
    meetingCadence: 'Weekly community check-in; Monthly circle meeting',
  },
  {
    name: 'Land & Ecology',
    purpose: 'Steward the land, food systems, agroforestry, and ecological regeneration practices of Amora.',
    domains: 'Land and soil stewardship; Food production and gardens; Agroforestry and silviculture; Water systems; Ecological restoration and biodiversity',
    accountabilities: 'Maintaining and developing food systems; Implementing regenerative agriculture and agroforestry practices; Stewarding water and soil health; Documenting ecological knowledge and practices; Coordinating land work teams and volunteers; Proposing land use policies for governance review',
    kpis: 'Hectares under active regenerative management; Food produced on-site (kg/month); Biodiversity indicators; Soil health metrics',
    meetingCadence: 'Weekly land team meeting; Monthly circle meeting',
  },
  {
    name: 'Learning & Education',
    purpose: 'Design and deliver nature-based and multigenerational learning experiences, both for residents and the broader community.',
    domains: 'Internal learning programs and workshops; Children and youth education; External course and retreat offerings; Learning partnerships and pedagogy; Knowledge documentation and library',
    accountabilities: 'Designing and delivering internal learning programs; Supporting multigenerational education within the community; Developing external course and retreat offerings; Building partnerships with educational institutions; Curating the Amora knowledge library and resources',
    kpis: 'Learning events per quarter; Participants in external programs; Youth education hours per week; External revenue from courses',
    meetingCadence: 'Bi-weekly circle meeting; Quarterly curriculum review',
  },
  {
    name: 'Economics & Finance',
    purpose: 'Steward Amora\'s financial health, funding strategy, and regenerative economic structures including ownership and investment models.',
    domains: 'Financial accounts and reporting; Funding strategy and fundraising; Budget process and allocation; Ownership and investment models; Legal entity and compliance',
    accountabilities: 'Producing monthly financial reports; Maintaining the annual budget with circle input; Stewarding the fundraising strategy; Developing and proposing regenerative economic structures (investment, land trust, etc.); Ensuring legal and tax compliance; Communicating financial health to the full community',
    kpis: 'Monthly revenue vs. expenses; Fundraising target vs. actuals; Months of operating reserves; Budget adherence by circle',
    meetingCadence: 'Monthly finance circle meeting; Quarterly community financial report',
  },
  {
    name: 'Communications & Marketing',
    purpose: 'Tell the Amora story, attract aligned community members and partners, and manage external communications and brand.',
    domains: 'Brand identity and guidelines; Website and social media; Newsletter and content; Press and media relations; Community applications and inquiries',
    accountabilities: 'Maintaining and evolving the Amora brand; Publishing regular content (newsletter, social media, blog); Managing the website; Responding to media and press inquiries; Stewarding the community application and waitlist process; Supporting other circles\' communication needs',
    kpis: 'Newsletter open rate; Social media reach and growth; Website visitors per month; Community application conversions',
    meetingCadence: 'Bi-weekly circle meeting; Monthly content planning session',
  },
  {
    name: 'Technology & Systems',
    purpose: 'Build and maintain the digital infrastructure that powers Amora\'s Living Memory Hub, communications, and operational systems.',
    domains: 'Living Memory Hub (Sera AI system); Notion workspace; Email infrastructure (roots@amora.cr); Google Drive and cloud storage; Internal tools and integrations; Data security and privacy',
    accountabilities: 'Operating and improving the Living Memory Hub (Sera); Maintaining the Notion workspace and database schemas; Managing email infrastructure and integrations; Supporting other circles with technical tooling; Evaluating and adopting new tools with governance approval; Maintaining data security and privacy standards',
    kpis: 'Living Memory Hub uptime; Email processing success rate; Notion database health (no schema errors); Open tech support requests',
    meetingCadence: 'Weekly tech standup; Bi-weekly circle meeting',
  },
  {
    name: 'Health & Wellbeing',
    purpose: 'Cultivate physical, emotional, and spiritual health practices that support individual and collective flourishing at Amora.',
    domains: 'Physical health practices and facilities; Emotional and somatic support resources; Spiritual and contemplative practices; Mental health referrals and support; Collective wellbeing rituals',
    accountabilities: 'Organizing physical health and movement practices; Providing or connecting members to emotional support resources; Stewarding shared contemplative and spiritual practices; Monitoring community wellbeing and flagging concerns; Coordinating with Community & Culture on wellbeing rituals; Proposing health-related policies for governance review',
    kpis: 'Health and wellbeing events per month; Member reported wellbeing (survey); Referrals to external support (count); Somatic and contemplative sessions held per quarter',
    meetingCadence: 'Bi-weekly circle meeting; Monthly community wellbeing check-in',
  },
];

async function richText(text: string) {
  return [{ type: 'text', text: { content: text.slice(0, 2000) } }];
}

async function queryDb(dbId: string, filter: object): Promise<any[]> {
  const r = await fetch(`${BASE}/databases/${dbId}/query`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ filter, page_size: 10 }),
  });
  if (!r.ok) throw new Error(`Query ${dbId}: ${r.status} ${await r.text()}`);
  return ((await r.json()) as any).results ?? [];
}

async function patchPage(pageId: string, props: object): Promise<void> {
  const r = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties: props }),
  });
  if (!r.ok) throw new Error(`PATCH ${pageId}: ${r.status} ${await r.text()}`);
}

function getPlainText(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title?.map((t: any) => t.plain_text).join('') ?? '';
  if (prop.type === 'rich_text') return prop.rich_text?.map((t: any) => t.plain_text).join('') ?? '';
  return '';
}

async function main() {
  console.log('\nBackfilling circle Domains, Accountabilities, KPIs, and Meeting Cadence...\n');

  for (const circle of CIRCLES) {
    const results = await queryDb(CIRCLES_DB!, {
      property: 'Circle Name', title: { equals: circle.name },
    });

    if (!results.length) {
      console.log(`  SKIP  "${circle.name}" — not found in Notion`);
      continue;
    }

    const page = results[0];
    const p = page.properties;

    const existingDomains         = getPlainText(p['Domains']);
    const existingAccountabilities = getPlainText(p['Accountabilities']);
    const existingKpis             = getPlainText(p['KPIs']);
    const existingCadence          = getPlainText(p['Meeting Cadence']);
    const existingPurpose          = getPlainText(p['Purpose']);

    const updates: Record<string, any> = {};

    if (!existingPurpose.trim()) {
      updates['Purpose'] = { rich_text: await richText(circle.purpose) };
    }
    if (!existingDomains.trim()) {
      updates['Domains'] = { rich_text: await richText(circle.domains) };
    }
    if (!existingAccountabilities.trim()) {
      updates['Accountabilities'] = { rich_text: await richText(circle.accountabilities) };
    }
    if (!existingKpis.trim()) {
      updates['KPIs'] = { rich_text: await richText(circle.kpis) };
    }
    if (!existingCadence.trim()) {
      updates['Meeting Cadence'] = { rich_text: await richText(circle.meetingCadence) };
    }

    if (!Object.keys(updates).length) {
      console.log(`  skip  "${circle.name}" — all fields already populated`);
      continue;
    }

    await patchPage(page.id, updates);
    const filled = Object.keys(updates).join(', ');
    console.log(`  OK    "${circle.name}" — filled: ${filled}`);
    await new Promise(r => setTimeout(r, 350));
  }

  console.log('\nDone. Check the Circles database in Notion to verify.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
