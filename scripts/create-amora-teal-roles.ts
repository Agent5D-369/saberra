/**
 * Creates Teal/Holacracy roles for all Amora team members based on the
 * public website (amora.cr) and assigns them to appropriate circles.
 *
 * Idempotent: checks by name before creating. Safe to re-run.
 *
 * Usage: npx ts-node scripts/create-amora-teal-roles.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { NotionWriterService } from '../src/services/NotionWriterService';
import { logger } from '../src/config/logger';

const N = NotionWriterService;

// ─── Circles ──────────────────────────────────────────────────────────────────

const CIRCLES = [
  {
    name: 'Governance & Coordination',
    sector: 'Sector 2 — Governance & Justice',
    purpose: 'Hold the constitutional framework of Amora, steward the consent-based decision process, and coordinate across all circles.',
    status: 'Active',
  },
  {
    name: 'Community & Culture',
    sector: 'Sector 3 — Culture & Spirit',
    purpose: 'Cultivate belonging, connection, and cultural vitality. Steward community rituals, relationships, and the lived experience of Amora.',
    status: 'Active',
  },
  {
    name: 'Land & Ecology',
    sector: 'Sector 5 — Ecology & Infrastructure',
    purpose: 'Steward the land, food systems, agroforestry, and ecological regeneration practices of Amora.',
    status: 'Active',
  },
  {
    name: 'Learning & Education',
    sector: 'Sector 4 — Learning & Innovation',
    purpose: 'Design and deliver nature-based and multigenerational learning experiences, both for residents and the broader community.',
    status: 'Active',
  },
  {
    name: 'Economics & Finance',
    sector: 'Sector 6 — Economy & Exchange',
    purpose: 'Steward Amora\'s financial health, funding strategy, and regenerative economic structures including ownership and investment models.',
    status: 'Active',
  },
  {
    name: 'Communications & Marketing',
    sector: null, // Amora-specific circle, no standard CCOS sector mapping
    purpose: 'Tell the Amora story, attract aligned community members and partners, and manage external communications and brand.',
    status: 'Active',
  },
  {
    name: 'Technology & Systems',
    sector: null, // Amora-specific circle, no standard CCOS sector mapping
    purpose: 'Build and maintain the digital infrastructure that powers Amora\'s Living Memory Hub, communications, and operational systems.',
    status: 'Active',
  },
  {
    name: 'Health & Wellbeing',
    sector: 'Sector 1 — Health & Holistic Wellness',
    purpose: 'Cultivate physical, emotional, and spiritual health practices that support individual and collective flourishing at Amora.',
    status: 'Active',
  },
];

// ─── Roles ────────────────────────────────────────────────────────────────────

const ROLES = [
  // Governance & Coordination
  {
    name: 'Visionary Director',
    circle: 'Governance & Coordination',
    type: 'Lead Steward',
    purpose: 'Hold and communicate the long-term vision of Amora, ensure alignment across circles, and represent Amora to the world.',
    domains: 'Strategic direction; External partnerships; Founding vision',
    accountabilities: 'Articulating the community vision; Stewarding founding intent; Supporting circle leads in alignment',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },
  {
    name: 'Visionary Developer',
    circle: 'Governance & Coordination',
    type: 'Custom Role',
    purpose: 'Translate vision into built environment and community systems through sustainable design and ecological stewardship.',
    domains: 'Physical development; Infrastructure design; Ecological systems',
    accountabilities: 'Overseeing land and building development; Integrating ecological principles into design; Coordinating construction and site teams',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },
  {
    name: 'Admin Facilitator',
    circle: 'Governance & Coordination',
    type: 'Admin Facilitator',
    purpose: 'Facilitate governance meetings, hold the CCOS process, and ensure Amora\'s consent-based decision framework runs smoothly.',
    domains: 'Governance process; Meeting facilitation; CCOS canon',
    accountabilities: 'Facilitating all governance meetings; Maintaining the governance backlog; Coaching circles on Teal process',
    status: 'Active',
    assignmentMethod: 'Consent Election',
    termLength: '1 Year',
  },
  {
    name: 'AI Secretary (Sera)',
    circle: 'Governance & Coordination',
    type: 'AI Secretary',
    purpose: 'Capture, structure, and preserve all institutional memory for Amora through automated email and meeting processing.',
    domains: 'Living Memory Hub; Notion databases; Email processing; AI extraction',
    accountabilities: 'Processing all emails sent to roots@amora.cr; Writing structured records to Notion; Flagging sensitive and canon items for human review; Running the knowledge base',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },
  {
    name: 'Rep Steward',
    circle: 'Governance & Coordination',
    type: 'Rep Steward',
    purpose: 'Represent the voice and tensions of sub-circles in the Governance circle to maintain cross-circle coherence.',
    domains: 'Cross-circle tensions; Governance representation',
    accountabilities: 'Attending Governance circle meetings; Surfacing tensions from assigned circle; Reporting governance decisions back',
    status: 'Active',
    assignmentMethod: 'Consent Election',
    termLength: '6 Months',
  },

  // Land & Ecology
  {
    name: 'Agroforestry Steward',
    circle: 'Land & Ecology',
    type: 'Lead Steward',
    purpose: 'Design and maintain regenerative food forests, agroforestry systems, and ecological land management at Amora.',
    domains: 'Food forests; Agroforestry systems; Soil health; Biodiversity',
    accountabilities: 'Planning and executing agroforestry projects; Training residents in land stewardship; Monitoring ecological health indicators',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },
  {
    name: 'Community Steward',
    circle: 'Community & Culture',
    type: 'Lead Steward',
    purpose: 'Cultivate community belonging, co-design cultural rituals, and support residents in feeling at home and connected.',
    domains: 'Community events; Cultural programming; Resident relationships; Onboarding',
    accountabilities: 'Facilitating community gatherings and ceremonies; Welcoming new residents; Holding space for interpersonal dynamics',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },

  // Economics & Finance
  {
    name: 'Finance Steward',
    circle: 'Economics & Finance',
    type: 'Lead Steward',
    purpose: 'Steward Amora\'s financial integrity, funding strategy, and regenerative economic structures.',
    domains: 'Financial accounts; Budget; Investment structure; Funding proposals',
    accountabilities: 'Managing financial accounts and reporting; Sourcing regenerative funding; Stewarding ownership and investment documentation',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },

  // Communications & Marketing
  {
    name: 'Marketing Steward',
    circle: 'Communications & Marketing',
    type: 'Lead Steward',
    purpose: 'Tell the Amora story to the world and attract community members, partners, and funders who are aligned with the vision.',
    domains: 'Brand; Marketing strategy; Website; Partnerships',
    accountabilities: 'Developing and executing marketing campaigns; Managing brand consistency; Coordinating outreach to aligned communities',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },
  {
    name: 'Social Media Steward',
    circle: 'Communications & Marketing',
    type: 'Custom Role',
    purpose: 'Manage Amora\'s presence across social platforms and share authentic stories of community life.',
    domains: 'Social media accounts; Content creation; Community storytelling',
    accountabilities: 'Creating and publishing social content; Engaging with followers; Monitoring community sentiment online',
    status: 'Active',
    assignmentMethod: 'Volunteer',
    termLength: '6 Months',
  },

  // Learning & Education
  {
    name: 'Education Steward',
    circle: 'Learning & Education',
    type: 'Lead Steward',
    purpose: 'Design and deliver nature-based, multigenerational learning experiences that integrate land, culture, and deep ecology.',
    domains: 'Learning curriculum; Nature school; Educational partnerships',
    accountabilities: 'Designing the learning program for children and adults; Building educational partnerships; Maintaining learning spaces',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },

  // Technology & Systems
  {
    name: 'Technology Steward',
    circle: 'Technology & Systems',
    type: 'Lead Steward',
    purpose: 'Build and maintain the digital infrastructure, integrations, and AI systems that power Amora\'s operational memory.',
    domains: 'Living Memory Hub; Railway deployments; Notion; Google Workspace; AI integrations',
    accountabilities: 'Maintaining the Sera AI system; Managing technical infrastructure; Supporting circles with digital tools',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },

  // Health & Wellbeing
  {
    name: 'Wellbeing Steward',
    circle: 'Health & Wellbeing',
    type: 'Lead Steward',
    purpose: 'Cultivate practices of physical, emotional, and spiritual health that support individual and collective flourishing.',
    domains: 'Wellness programming; Somatic practices; Health resources',
    accountabilities: 'Designing and facilitating wellness offerings; Supporting residents through challenges; Curating wellbeing resources',
    status: 'Active',
    assignmentMethod: 'Appointed',
    termLength: 'No Term',
  },
];

// ─── People & Role Assignments ─────────────────────────────────────────────────
// Source: amora.cr public website

const PEOPLE = [
  {
    name: 'Jessica Filkins',
    roleTitle: 'Visionary Director',
    roleName: 'Visionary Director',
    circle: 'Governance & Coordination',
    email: null,
    tags: ['Leadership', 'Community', 'Governance'],
    relationshipToAmora: 'Member',
    contextNotes: 'Co-founder. Feminine leadership, holistic wellbeing, ocean connection.',
  },
  {
    name: 'Blake Delatte',
    roleTitle: 'Visionary Developer',
    roleName: 'Visionary Developer',
    circle: 'Governance & Coordination',
    email: null,
    tags: ['Leadership', 'Land Stewardship', 'Operations'],
    relationshipToAmora: 'Member',
    contextNotes: 'Co-founder. Sustainable community design, ecological stewardship.',
  },
  {
    name: 'Ed Zaydelman',
    roleTitle: 'Agroforestry Steward',
    roleName: 'Agroforestry Steward',
    circle: 'Land & Ecology',
    email: null,
    tags: ['Land Stewardship', 'Agriculture', 'Community'],
    relationshipToAmora: 'Member',
    contextNotes: '20+ years regenerative community development and agroforestry expertise.',
  },
  {
    name: 'Kyleen Keenan',
    roleTitle: 'Finance Steward',
    roleName: 'Finance Steward',
    circle: 'Economics & Finance',
    email: null,
    tags: ['Finance', 'Leadership', 'Governance'],
    relationshipToAmora: 'Member',
    contextNotes: 'Regenerative business structure and funding strategy.',
  },
  {
    name: 'Nikita Timmermans',
    roleTitle: 'Marketing Steward',
    roleName: 'Marketing Steward',
    circle: 'Communications & Marketing',
    email: null,
    tags: ['Communications', 'Leadership', 'Community'],
    relationshipToAmora: 'Member',
    contextNotes: 'Purpose-driven community outreach and marketing.',
  },
  {
    name: 'Victoria Leyden',
    roleTitle: 'Community Steward',
    roleName: 'Community Steward',
    circle: 'Community & Culture',
    email: null,
    tags: ['Community', 'Land Stewardship', 'Education'],
    relationshipToAmora: 'Member',
    contextNotes: 'Regenerative agriculture, song, dance, and nature attunement.',
  },
  {
    name: 'Ariana Binney',
    roleTitle: 'Education Steward',
    roleName: 'Education Steward',
    circle: 'Learning & Education',
    email: null,
    tags: ['Education', 'Community', 'Leadership'],
    relationshipToAmora: 'Member',
    contextNotes: '20+ years education background, nature-based schooling.',
  },
  {
    name: 'Maria Kusk',
    roleTitle: 'Social Media Steward',
    roleName: 'Social Media Steward',
    circle: 'Communications & Marketing',
    email: null,
    tags: ['Communications', 'Community'],
    relationshipToAmora: 'Member',
    contextNotes: 'Community storytelling and social media promotion.',
  },
  {
    name: 'Rick Broider',
    roleTitle: 'Technology Steward',
    roleName: 'Technology Steward',
    circle: 'Technology & Systems',
    email: 'rick@amora.cr',
    tags: ['Technical', 'Governance', 'Operations'],
    relationshipToAmora: 'Member',
    contextNotes: 'Amora Living Memory Hub architect and operator. Builds and maintains the Sera AI system.',
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const notion = new NotionWriterService();
  const today = new Date().toISOString().slice(0, 10);

  const sectorOptions = [
    'Sector 1 — Land & Ecology', 'Sector 2 — Community & Culture',
    'Sector 3 — Learning & Education', 'Sector 4 — Health & Wellbeing',
    'Sector 5 — Governance & Coordination', 'Sector 6 — Economics & Finance',
    'Sector 7 — Meaning & Mythos',
  ];

  const circleIdMap = new Map<string, string>();
  const roleIdMap   = new Map<string, string>();
  const profileIdMap = new Map<string, string>();

  // ── 1. Circles ──────────────────────────────────────────────────────────────
  console.log('\n-- Circles --');

  // Fetch all existing circles once so we can warn about near-duplicates
  const allCircles = await notion.queryDatabase(notion.dbIds.circles, undefined as any, 100);
  const existingCircleNames = allCircles.map(r => {
    const p = r.properties as any;
    return (p['Circle Name']?.title?.[0]?.plain_text ?? '').toLowerCase().trim();
  });

  for (const c of CIRCLES) {
    const existing = await notion.findByTitle(notion.dbIds.circles, 'Circle Name', c.name);
    if (existing) {
      circleIdMap.set(c.name.toLowerCase(), existing);
      console.log(`  skip  ${c.name} (exists)`);
      continue;
    }

    // Warn if a near-duplicate exists (same words, different punctuation)
    const normalized = c.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const nearDup = existingCircleNames.find(n => n.replace(/[^a-z0-9 ]/g, '').trim() === normalized);
    if (nearDup) {
      console.warn(`  WARN: "${c.name}" looks like a near-duplicate of existing circle "${nearDup}" — skipping to avoid duplicate`);
      const nearDupId = allCircles.find(r => {
        const p = r.properties as any;
        return (p['Circle Name']?.title?.[0]?.plain_text ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() === normalized;
      })?.id;
      if (nearDupId) circleIdMap.set(c.name.toLowerCase(), nearDupId);
      continue;
    }

    const sector = c.sector && sectorOptions.includes(c.sector) ? c.sector : null;
    const id = await notion.createPage(notion.dbIds.circles, {
      'Circle Name': N.title(c.name),
      ...(sector ? { Sector: N.select(sector) } : {}),
      Purpose: N.richText(c.purpose),
      Status: N.select(c.status),
    });
    circleIdMap.set(c.name.toLowerCase(), id);
    console.log(`  create ${c.name}`);
    await delay(300);
  }

  // ── 2. Roles ────────────────────────────────────────────────────────────────
  console.log('\n-- Roles --');
  const roleTypeOptions = ['Lead Steward', 'Rep Steward', 'Admin Facilitator', 'AI Secretary', 'Custom Role'];
  const assignMethodOpts = ['Consent Election', 'Appointed', 'Volunteer', 'Interim'];
  const termOptions = ['No Term', '3 Months', '6 Months', '1 Year', 'Custom'];

  for (const r of ROLES) {
    const existing = await notion.findByTitle(notion.dbIds.roles, 'Role Name', r.name);
    const circleId = circleIdMap.get(r.circle.toLowerCase()) ?? null;
    const roleType = roleTypeOptions.includes(r.type) ? r.type : 'Custom Role';
    const assignMethod = assignMethodOpts.includes(r.assignmentMethod) ? r.assignmentMethod : 'Appointed';
    const termLength = termOptions.includes(r.termLength) ? r.termLength : 'No Term';

    if (existing) {
      await notion.updatePage(existing, {
        Status: N.select('Active'),
        'Role Type': N.select(roleType),
        ...(circleId ? { Circle: N.relation([circleId]) } : {}),
        Purpose: N.richText(r.purpose),
        Domains: N.richText(r.domains),
        Accountabilities: N.richText(r.accountabilities),
        'Assignment Method': N.select(assignMethod),
        'Term Length': N.select(termLength),
      });
      roleIdMap.set(r.name.toLowerCase(), existing);
      console.log(`  update ${r.name}`);
    } else {
      const id = await notion.createPage(notion.dbIds.roles, {
        'Role Name': N.title(r.name),
        Status: N.select('Active'),
        'Role Type': N.select(roleType),
        ...(circleId ? { Circle: N.relation([circleId]) } : {}),
        Purpose: N.richText(r.purpose),
        Domains: N.richText(r.domains),
        Accountabilities: N.richText(r.accountabilities),
        'Assignment Method': N.select(assignMethod),
        'Term Length': N.select(termLength),
      });
      roleIdMap.set(r.name.toLowerCase(), id);
      console.log(`  create ${r.name}`);
    }
    await delay(300);
  }

  // ── 3. Profiles ─────────────────────────────────────────────────────────────
  console.log('\n-- Profiles --');
  for (const p of PEOPLE) {
    const existing = p.email
      ? (await notion.findByEmail(notion.dbIds.profiles, 'Email', p.email)) ?? await notion.findByTitle(notion.dbIds.profiles, 'Name', p.name)
      : await notion.findByTitle(notion.dbIds.profiles, 'Name', p.name);

    const roleId = roleIdMap.get(p.roleName.toLowerCase()) ?? null;
    const circleId = circleIdMap.get(p.circle.toLowerCase()) ?? null;

    if (existing) {
      await notion.updatePage(existing, {
        'Engagement Status': N.select('Active'),
        'Relationship to Amora': N.select('Member'),
        'Role / Title': N.richText(p.roleTitle),
        ...(p.email ? { Email: { email: p.email } } : {}),
        Tags: N.multiSelect(p.tags),
        ...(p.contextNotes ? { 'Context Summary': N.richText(p.contextNotes) } : {}),
        'Last Seen': N.date(today),
        ...(roleId ? { 'Primary Role': N.relation([roleId]) } : {}),
        ...(circleId ? { 'Circle Memberships': N.relation([circleId]) } : {}),
      });
      profileIdMap.set(p.name.toLowerCase(), existing);
      console.log(`  update ${p.name}`);
    } else {
      const id = await notion.createPage(notion.dbIds.profiles, {
        Name: N.title(p.name),
        'Profile Type': N.select('Person'),
        'Engagement Status': N.select('Active'),
        'Relationship to Amora': N.select('Member'),
        'Role / Title': N.richText(p.roleTitle),
        ...(p.email ? { Email: { email: p.email } } : {}),
        Tags: N.multiSelect(p.tags),
        ...(p.contextNotes ? { 'Context Summary': N.richText(p.contextNotes) } : {}),
        Source: N.richText('Amora website — amora.cr'),
        'Sensitive Notes Flag': N.checkbox(false),
        'First Seen': N.date(today),
        'Last Seen': N.date(today),
        ...(roleId ? { 'Primary Role': N.relation([roleId]) } : {}),
        ...(circleId ? { 'Circle Memberships': N.relation([circleId]) } : {}),
      });
      profileIdMap.set(p.name.toLowerCase(), id);
      console.log(`  create ${p.name}`);
    }
    await delay(300);
  }

  // ── 4. Role Assignments ─────────────────────────────────────────────────────
  console.log('\n-- Role Assignments --');
  for (const p of PEOPLE) {
    const assignmentTitle = `${p.name} — ${p.roleName}`;
    const existing = await notion.findByTitle(notion.dbIds.roleAssignments, 'Assignment Title', assignmentTitle);
    const roleId = roleIdMap.get(p.roleName.toLowerCase()) ?? null;
    const profileId = profileIdMap.get(p.name.toLowerCase()) ?? null;
    const circleId = circleIdMap.get(p.circle.toLowerCase()) ?? null;

    if (!roleId || !profileId) {
      console.log(`  skip  ${assignmentTitle} — missing role or profile`);
      continue;
    }

    if (existing) {
      await notion.updatePage(existing, {
        Status: N.select('Active'),
        ...(circleId ? { Circle: N.relation([circleId]) } : {}),
      });
      console.log(`  update ${assignmentTitle}`);
    } else {
      await notion.createPage(notion.dbIds.roleAssignments, {
        'Assignment Title': N.title(assignmentTitle),
        Role: N.relation([roleId]),
        'Role Holder': N.relation([profileId]),
        ...(circleId ? { Circle: N.relation([circleId]) } : {}),
        Status: N.select('Active'),
        'Assignment Type': N.select('Appointed'),
        'Term Length': N.select('No Term'),
        'Start Date': N.date(today),
        'Source Evidence': N.richText('Amora website — amora.cr'),
      });
      console.log(`  create ${assignmentTitle}`);
    }
    await delay(300);
  }

  console.log('\nDone.');
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

main().catch(err => { logger.error({ err }, 'Script failed'); process.exit(1); });
