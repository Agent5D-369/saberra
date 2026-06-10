/**
 * Populates the Policies database with Amora's full draft policy starter library.
 * Skips any policy whose name already exists (safe to re-run).
 * Run once: npx ts-node scripts/populate-policies-library.ts
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const DB = process.env.NOTION_DB_POLICIES!;

if (!DB) {
  console.error('NOTION_DB_POLICIES must be set');
  process.exit(1);
}

type ReviewCadence = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | 'As Needed';
type PolicyArea =
  | 'Governing Purpose' | 'Policy' | 'Circle Definition' | 'Role Definition'
  | 'Decision Rights' | 'Legal Commitment' | 'Financial Commitment'
  | 'Land Stewardship' | 'CCOS Ledger' | 'Public Commitment' | 'Unknown';

interface PolicyDef {
  name: string;
  area: PolicyArea;
  cadence: ReviewCadence;
  summary: string;
  purpose: string;
  principles: string[];
  notes?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const para = (text: string): any => ({
  object: 'block', type: 'paragraph',
  paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const h2 = (text: string): any => ({
  object: 'block', type: 'heading_2',
  heading_2: { rich_text: [{ type: 'text', text: { content: text } }] },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bullet = (text: string): any => ({
  object: 'block', type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callout = (text: string): any => ({
  object: 'block', type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: '📝' },
  },
});

const POLICIES: PolicyDef[] = [

  // ── Governing Purpose ──────────────────────────────────────────────────────

  {
    name: 'Community Purpose & Vision Charter',
    area: 'Governing Purpose',
    cadence: 'Annual',
    summary: 'Defines the founding purpose, long-term vision, and core reason for existence of Amora Eco Village as a regenerative, multigenerational, women-led community in Costa Rica.',
    purpose: 'This charter articulates the living purpose of Amora — why we exist, what we are building together, and the future we are committed to creating. It serves as the North Star against which all decisions, roles, and investments are measured.',
    principles: [
      'Amora exists to co-create a thriving, multigenerational, multicultural eco village in Dominicalito, Costa Rica, where nature and community flourish together.',
      'We are guided by the land itself — a call for women to lead the creation of a regenerative village centered around children, elders, and the sacred relationship with Earth.',
      'Our purpose is living and evolutionary: we hold it firmly enough to guide us and lightly enough to grow with us.',
      'True prosperity grows from living in balance — with the earth, with each other, and within ourselves.',
      'We are not just building homes, but creating a future rooted in belonging, beauty, and becoming.',
      'This charter may only be amended through a full community consent process with 30-day notice.',
    ],
    notes: 'Source of truth for all external communications, fundraising, and partnerships. Any proposal that conflicts with this charter requires a charter amendment, not a workaround.',
  },

  {
    name: 'Teal Evolutionary Organization Principles',
    area: 'Governing Purpose',
    cadence: 'Annual',
    summary: 'Establishes Amora\'s commitment to operating as a Teal organization: self-managing, whole, and evolutionary — drawing from Frederic Laloux\'s Reinventing Organizations framework.',
    purpose: 'Amora operates from a new organizational paradigm. This policy defines what that means in practice — how we make decisions, how we show up as whole people, and how we listen to the community\'s emerging purpose.',
    principles: [
      'Self-Management: authority is distributed. No one manages another. Roles hold accountabilities, not people.',
      'Wholeness: we bring our full selves — emotional, intuitive, and spiritual — alongside our professional capabilities.',
      'Evolutionary Purpose: Amora has its own sense of direction. We listen for where it wants to go rather than imposing a fixed plan.',
      'Advice Process: anyone may make any decision after seeking advice from those affected and those with expertise.',
      'Conflict is information, not failure. We have clear processes to metabolize it and grow.',
      'Compensation, roles, and structure evolve through community process, not top-down mandate.',
    ],
  },

  {
    name: 'Feminine Leadership Covenant',
    area: 'Governing Purpose',
    cadence: 'Annual',
    summary: 'Affirms Amora\'s founding commitment to feminine-principled leadership: receptive, relational, regenerative, and rooted in the wisdom of the feminine.',
    purpose: 'Amora was called into being through feminine leadership. This covenant defines what that means for how we lead, decide, communicate, and hold power — honoring both the feminine and masculine as complementary forces while centering feminine wisdom in our governance.',
    principles: [
      'Leadership at Amora is an act of stewardship, not dominance. We lead from service.',
      'We honor cyclical time: rest, reflection, and renewal are as sacred as action and output.',
      'Decisions made in relationship are stronger than decisions made in isolation.',
      'We prioritize depth over speed, presence over productivity, and belonging over performance.',
      'Power is shared, circulated, and regenerated — not hoarded or weaponized.',
      'We hold space for diverse expressions of femininity across culture, age, and identity.',
      'Men and non-binary members are honored partners in this vision, operating in reciprocal respect.',
    ],
  },

  // ── Circle Definitions ─────────────────────────────────────────────────────

  {
    name: 'Governance Circle Charter',
    area: 'Circle Definition',
    cadence: 'Annual',
    summary: 'Defines the purpose, accountabilities, membership, and authority of the Governance Circle — the highest coordination body at Amora.',
    purpose: 'The Governance Circle holds the overall health of Amora\'s organizational structure. It does not manage day-to-day operations but ensures that all other circles have the clarity, resources, and support they need to function sovereignly.',
    principles: [
      'Purpose: maintain organizational clarity, canon integrity, and inter-circle coordination.',
      'Membership: circle leads plus founding stewards. Rotating facilitation.',
      'Authority: amend organizational structure, ratify canon changes, resolve inter-circle tensions.',
      'Meets monthly. Decisions by consent. All records logged in CCOS Ledger.',
      'No circle or individual may override a Governance Circle consent decision without triggering a formal amendment process.',
      'Governance Circle does not have authority over the personal lives or creative work of members.',
    ],
  },

  {
    name: 'Community Life Circle Charter',
    area: 'Circle Definition',
    cadence: 'Annual',
    summary: 'Defines the purpose and accountabilities of the Community Life Circle, responsible for welcome, belonging, conflict resolution, celebrations, and daily community harmony.',
    purpose: 'The Community Life Circle holds the relational and cultural fabric of Amora. It ensures that every person who enters the community — whether resident, guest, or collaborator — feels genuinely welcomed, held, and clear on expectations.',
    principles: [
      'Purpose: cultivate belonging, navigate conflict, hold community agreements, and celebrate life.',
      'Accountabilities include: onboarding new members, facilitating conflict resolution, organizing community gatherings, and maintaining the Code of Conduct.',
      'This circle holds the somatic and emotional intelligence of the community.',
      'Anyone may bring a concern to this circle. Confidentiality is honored unless safety requires otherwise.',
      'Restorative practices are the default response to conflict. Punitive responses are a last resort.',
    ],
  },

  {
    name: 'Land & Ecology Circle Charter',
    area: 'Circle Definition',
    cadence: 'Annual',
    summary: 'Defines the purpose and accountabilities of the Land & Ecology Circle, responsible for permaculture systems, food forests, water, biodiversity, and ecosystem stewardship.',
    purpose: 'The land is not a resource to be used but a living partner to be tended. This circle holds Amora\'s relationship with the physical land, its watersheds, food systems, and ecosystems — practicing regenerative stewardship as a sacred responsibility.',
    principles: [
      'Purpose: steward the land, water, food systems, and living ecosystems of Amora.',
      'Guided by permaculture ethics: Earth Care, People Care, Fair Share.',
      'No decisions that permanently alter land, ecosystems, or water systems may be made without full circle consent.',
      'Maintains the living land map, seasonal planting calendars, and ecosystem health records.',
      'Interfaces with external ecologists, permaculture designers, and indigenous knowledge holders.',
      'Children\'s relationship with land and ecology is a priority in all planning.',
    ],
  },

  {
    name: 'Finance & Stewardship Circle Charter',
    area: 'Circle Definition',
    cadence: 'Annual',
    summary: 'Defines the purpose and accountabilities of the Finance & Stewardship Circle, responsible for financial health, transparency, revenue management, and resource allocation.',
    purpose: 'Money at Amora flows in service of the mission. The Finance & Stewardship Circle ensures that financial resources are managed with radical transparency, strategic wisdom, and alignment with our values — never allowing financial scarcity or abundance to compromise our purpose.',
    principles: [
      'Purpose: manage financial health, maintain transparency, allocate resources, and steward investments.',
      'Full financial transparency to all circle leads monthly. Community summary quarterly.',
      'No single person has unilateral authority over expenditures above the defined threshold.',
      'Surplus is reinvested in the mission, community resilience, and ecosystem restoration.',
      'All financial commitments above threshold require Governance Circle ratification.',
      'Stewardship fees and contribution structures are reviewed annually by the community.',
    ],
  },

  {
    name: 'Learning & Education Circle Charter',
    area: 'Circle Definition',
    cadence: 'Annual',
    summary: 'Defines the purpose and accountabilities of the Learning & Education Circle, responsible for the nature-based educational center, children\'s programs, and community learning.',
    purpose: 'Children are at the heart of Amora\'s vision. This circle ensures that the nature-based educational center provides every child a place to remember and express their magic — while supporting parents, educators, and the wider community as lifelong learners.',
    principles: [
      'Purpose: develop and steward the nature-based educational center and all learning initiatives.',
      'Education at Amora is rooted in nature connection, somatic wisdom, and whole-child development.',
      'Children have voice in their own learning. No coercive or punitive educational methods.',
      'Parent participation is welcomed and honored. The community raises children together.',
      'Interfaces with the Health & Wellness Circle on developmental and somatic wellbeing.',
      'Learning spaces are open to the wider community, not exclusive to residents.',
    ],
  },

  {
    name: 'Health & Wellness Circle Charter',
    area: 'Circle Definition',
    cadence: 'Annual',
    summary: 'Defines the purpose and accountabilities of the Health & Wellness Circle, responsible for the retreat center, health center, healing practices, and community wellbeing.',
    purpose: 'Amora\'s Health & Wellness Circle holds the physical, emotional, mental, and spiritual health of the whole community. It develops the retreat center and health center as sanctuaries for deep restoration — blending ancient wisdom with modern science.',
    principles: [
      'Purpose: steward the retreat center, health center, wellness programs, and community healing culture.',
      'Integrates holistic, indigenous, and evidence-based practices with equal respect.',
      'All healing practitioners on-site must meet agreed standards of training and ethics.',
      'Community members have access to baseline wellness support regardless of financial means.',
      'Retreat center offerings serve both community sustainability and outward hospitality.',
      'Mental health and emotional support are treated with the same gravity as physical health.',
    ],
  },

  // ── Role Definitions ───────────────────────────────────────────────────────

  {
    name: 'Steward Role Accountability Framework',
    area: 'Role Definition',
    cadence: 'Semi-Annual',
    summary: 'Defines the common accountability structure, expectations, and rights that apply to all named Steward roles at Amora across all circles.',
    purpose: 'Every named Steward role at Amora carries shared expectations of accountability, communication, and care. This framework establishes those shared standards so that individual role definitions can focus on what is unique to each role without restating common responsibilities.',
    principles: [
      'A Steward holds accountabilities, not authority over people.',
      'Every Steward communicates proactively: relevant updates, blockers, and hand-offs are shared before they become crises.',
      'Stewards seek the advice of those affected before making decisions in their domain.',
      'Steward roles are filled and vacated through community process, not individual appointment.',
      'No one is expected to hold a Steward role indefinitely. Regeneration of leadership is valued.',
      'Stewards receive honest feedback through defined channels. Feedback is a gift, not an attack.',
    ],
  },

  {
    name: 'Founding Member Role & Rights',
    area: 'Role Definition',
    cadence: 'Annual',
    summary: 'Defines the special role, responsibilities, and rights of Amora\'s founding members in relation to governance, canon, and organizational memory.',
    purpose: 'Founding members carry the original vision and organizational DNA of Amora. This policy clarifies what unique responsibilities and protections that entails — not to create a permanent elite, but to honor the weight of founding stewardship while ensuring healthy succession.',
    principles: [
      'Founding members hold sacred responsibility for the integrity of Amora\'s original purpose.',
      'Founding status grants voice in canon amendment processes and Governance Circle deliberations.',
      'Founding members do not hold veto power over community consent decisions.',
      'Founding membership does not expire but its governance weight diminishes as community deepens.',
      'A founding member who acts against the community\'s wellbeing may have founding rights suspended through a defined community process.',
      'Transition of founding stewardship to second-generation leadership is planned and celebrated, not resisted.',
    ],
  },

  // ── Decision Rights ────────────────────────────────────────────────────────

  {
    name: 'Consent-Based Decision Making Process',
    area: 'Decision Rights',
    cadence: 'Annual',
    summary: 'Defines Amora\'s primary governance decision-making method: consent — not consensus. A proposal passes when no one has a paramount objection, not when everyone agrees.',
    purpose: 'Consensus can paralyze communities. Consent is faster and more honest: it asks not "do you love this?" but "can you live with this and is it safe to try?" This policy defines how consent is sought, what qualifies as a valid objection, and how proposals are amended.',
    principles: [
      'Consent means: no paramount objection. It does not mean full agreement or enthusiasm.',
      'A valid objection must show the proposal would cause harm or move us away from our purpose — personal preference is not an objection.',
      'Any member may propose a change to anything in their purview using the defined proposal format.',
      'Proposals are shared with affected parties in advance. Surprise proposals are not valid.',
      'Facilitators guide consent rounds. They are neutral. They do not advocate.',
      'An integrative amendment loop is used when objections arise: the objector helps improve the proposal.',
      'Governance Circle decisions use formal consent. Operational decisions use the Advice Process.',
    ],
  },

  {
    name: 'Advice Process Protocol',
    area: 'Decision Rights',
    cadence: 'Annual',
    summary: 'Establishes the Advice Process as Amora\'s primary operational decision-making method: anyone may decide anything in their domain after genuinely seeking advice from those affected and those with expertise.',
    purpose: 'The Advice Process replaces hierarchy with distributed wisdom. It trusts individuals to make good decisions while ensuring they are informed by the people around them. The decision-maker takes full responsibility for the outcome.',
    principles: [
      'Anyone may make any operational decision within their role after seeking advice.',
      'Advice must be genuinely sought — not solicited as a formality.',
      'The decision-maker is not obligated to follow the advice, but must consider it seriously and explain divergence.',
      'Decisions with significant financial, ecological, or relational impact require broader advice circles.',
      'The Advice Process is not a veto system. Advisors inform; they do not govern.',
      'A decision made without the Advice Process when it was warranted may be reversed by the Governance Circle.',
    ],
  },

  {
    name: 'Emergency Authority Protocol',
    area: 'Decision Rights',
    cadence: 'Annual',
    summary: 'Defines the conditions, scope, and safeguards for emergency decision-making authority when normal consent and advice processes cannot be convened in time.',
    purpose: 'Emergencies require action. This protocol defines who may act unilaterally in a genuine emergency, what counts as an emergency, and what accountability follows — ensuring that emergency authority is never used to bypass governance out of convenience.',
    principles: [
      'Emergency authority applies only when delay would cause immediate harm to people, land, or legal standing.',
      'The most relevant Steward may act unilaterally and must notify Governance Circle within 24 hours.',
      'Emergency actions must be the minimum necessary to address the immediate harm.',
      'All emergency decisions are reviewed at the next Governance Circle meeting and may be reversed.',
      'Repeated use of emergency authority by the same person is treated as a governance concern.',
    ],
  },

  {
    name: 'Canon Amendment Process',
    area: 'Decision Rights',
    cadence: 'Annual',
    summary: 'Defines the formal process by which any canon policy, circle charter, or founding document may be proposed for amendment, reviewed, and adopted or rejected.',
    purpose: 'Canon represents Amora\'s collective memory and commitments. Changing it carries weight. This process ensures that amendments are taken seriously, broadly consulted, and recorded with full provenance — while remaining accessible enough that the community can genuinely evolve.',
    principles: [
      'Any member may propose a canon amendment by submitting a Canon Change Request with evidence and rationale.',
      'All Canon Change Requests enter the review queue and are reviewed within 14 days.',
      'Amendments to Governing Purpose documents require a 30-day community consultation period.',
      'All other canon amendments require Governance Circle consent plus announcement to the full community.',
      'Approved amendments are implemented in both Notion and any referenced documents within 7 days.',
      'Superseded policy versions are archived, never deleted. The provenance chain is permanent.',
    ],
  },

  // ── Community Living Policies ──────────────────────────────────────────────

  {
    name: 'Community Agreements & Code of Conduct',
    area: 'Policy',
    cadence: 'Semi-Annual',
    summary: 'The foundational agreements that all members, guests, and contributors commit to when participating in Amora community life.',
    purpose: 'Clear agreements make belonging possible. This code of conduct establishes the minimum shared commitments that protect safety, dignity, and the quality of relationships at Amora — for residents, guests, collaborators, and visitors.',
    principles: [
      'We treat every person with dignity, regardless of role, background, or status.',
      'We speak directly with people about concerns rather than triangulating or gossiping.',
      'We honor the land and living systems of Amora with conscious, regenerative care.',
      'We hold confidentiality for sensitive community matters unless safety requires disclosure.',
      'We take responsibility for our impact, not just our intention.',
      'We participate in the community\'s agreements and processes, not just its benefits.',
      'Violations of this code are addressed through the Conflict Resolution Policy, not exile.',
    ],
  },

  {
    name: 'Conflict Resolution & Restorative Justice Policy',
    area: 'Policy',
    cadence: 'Semi-Annual',
    summary: 'Defines Amora\'s restorative approach to conflict: conflict is metabolized through honest dialogue, facilitated process, and repair — not punishment or exclusion as a first response.',
    purpose: 'Conflict is inevitable in close community. This policy ensures that it is addressed honestly and restoratively, strengthening relationships and organizational health rather than creating underground resentment or exile culture.',
    principles: [
      'Direct conversation between the parties is always the first step.',
      'Any party may request a neutral community facilitator if direct conversation feels unsafe.',
      'The goal of any process is understanding, accountability, and repair — not winning.',
      'Harm that is acknowledged and repaired strengthens community more than harm that is hidden.',
      'Serious harm (abuse, boundary violation, legal breach) triggers a defined serious-harm protocol.',
      'No one is excluded from the community without a full process and Governance Circle review.',
      'Support is offered to all parties, including those who caused harm.',
    ],
  },

  {
    name: 'Guest & Visitor Policy',
    area: 'Policy',
    cadence: 'Quarterly',
    summary: 'Establishes the categories, expectations, and invitation process for all non-resident guests and visitors at Amora, including retreat participants, day visitors, and hosted guests.',
    purpose: 'Amora is a living community, not a resort. Guests are welcome and they enter a living ecosystem with its own norms, rhythms, and agreements. This policy ensures that hospitality and community integrity are both honored.',
    principles: [
      'All guests are hosted by a named community member who is responsible for their orientation and conduct.',
      'Guests receive a clear community orientation before or upon arrival.',
      'Retreat center guests are hosted in designated areas and have defined access to community spaces.',
      'Day visitors require prior coordination and are not free to wander unsupervised.',
      'Guest behavior that violates community agreements is addressed by their host first.',
      'Overnight stays beyond 7 days require Governance Circle notification.',
    ],
  },

  {
    name: 'New Member Integration Policy',
    area: 'Policy',
    cadence: 'Semi-Annual',
    summary: 'Defines the process and expectations for how new community members are invited, oriented, integrated, and transitioned to full membership at Amora.',
    purpose: 'New members change the community. Integration done well creates deep belonging. Integration done poorly creates confusion and harm. This policy ensures that new members are received with both genuine welcome and honest clarity about what they are joining.',
    principles: [
      'All new member invitations are initiated through the Community Life Circle.',
      'New members complete a defined orientation period (minimum 90 days for residents).',
      'A community buddy is assigned to each new member throughout their integration.',
      'New members participate in community agreements, processes, and contributions from day one.',
      'Full community membership is confirmed through a circle consent process after the orientation period.',
      'Children entering the community receive age-appropriate orientation and welcome.',
    ],
  },

  {
    name: 'Privacy & Personal Sovereignty Policy',
    area: 'Policy',
    cadence: 'Annual',
    summary: 'Protects the personal privacy, digital sovereignty, and physical boundaries of all community members, guests, and collaborators at Amora.',
    purpose: 'Living in close community requires active protection of privacy and personal sovereignty. This policy ensures that people\'s personal lives, communications, health information, and physical spaces are respected — and that no surveillance or data collection occurs without consent.',
    principles: [
      'Personal living spaces are sovereign. Entry requires explicit invitation.',
      'Personal health, financial, and family information is never shared without consent.',
      'Photography and recording of people requires their consent.',
      'Community data systems (including Living Memory Hub) capture only what is relevant to shared community life.',
      'Living Memory Hub records are held securely, and sensitive records are access-restricted.',
      'No community member may surveil another\'s communications or movements.',
    ],
  },

  {
    name: 'Children & Youth Safety Policy',
    area: 'Policy',
    cadence: 'Quarterly',
    summary: 'Establishes the non-negotiable safety standards, supervision expectations, and safeguarding principles that protect children and youth in all Amora contexts.',
    purpose: 'The safety of children is the community\'s highest shared responsibility. This policy ensures that every child in the Amora community is protected from harm, has trusted adults to turn to, and experiences the community as a genuinely safe place.',
    principles: [
      'No adult is ever alone with a child who is not their own without the parent\'s explicit consent.',
      'All adults who regularly work with children complete a safeguarding orientation.',
      'Children are taught and supported to express boundaries and have those boundaries respected.',
      'Any concern about a child\'s safety is reported to the Community Life Circle immediately.',
      'Community standards take precedence over individual parenting preferences when child safety is at stake.',
      'This policy applies equally to all adults on-site, including guests and retreat participants.',
    ],
  },

  {
    name: 'Ceremonial & Sacred Space Policy',
    area: 'Policy',
    cadence: 'Annual',
    summary: 'Establishes the principles for how ceremonial and sacred spaces are held, facilitated, and protected at Amora, honoring diverse spiritual traditions with integrity.',
    purpose: 'Amora is a spiritually alive community that holds diverse traditions with reverence. This policy ensures that ceremonial and sacred spaces are led with integrity, held safely, and open to genuine spiritual inquiry without cultural appropriation or coercion.',
    principles: [
      'Ceremonial spaces are held with explicit agreement about the tradition being honored.',
      'No ceremony at Amora endorses or requires adherence to any single religious or spiritual path.',
      'Plant medicine or altered-state ceremonies require explicit community authorization and defined safety protocols.',
      'Facilitators of ceremony are accountable to the community for the safety and integrity of the space.',
      'Cultural traditions are honored with the involvement and consent of their source communities.',
      'No one is pressured to participate in any ceremony. Participation is always voluntary.',
    ],
  },

  {
    name: 'Cultural Inclusion & Anti-Discrimination Policy',
    area: 'Policy',
    cadence: 'Annual',
    summary: 'Affirms Amora\'s commitment to genuine multicultural inclusion and establishes clear standards against discrimination based on race, ethnicity, gender, sexuality, disability, age, or cultural background.',
    purpose: 'A truly regenerative community is genuinely multicultural — not merely in aspiration but in daily practice. This policy establishes both the protection and the accountability structures that make inclusion real rather than symbolic.',
    principles: [
      'Amora is explicitly anti-racist and anti-discriminatory in its structures, practices, and culture.',
      'Diversity in leadership, membership, and contribution is actively sought and sustained.',
      'Microaggressions and systemic bias are addressed with the same seriousness as explicit discrimination.',
      'Community members from marginalized backgrounds are supported, not asked to educate alone.',
      'This policy is not symbolic. Violations are addressed through the Conflict Resolution process.',
      'Amora\'s vision of a "multicultural haven" is a living commitment, reviewed annually for evidence.',
    ],
  },

  {
    name: 'Digital Communication & Technology Policy',
    area: 'Policy',
    cadence: 'Annual',
    summary: 'Establishes standards for how digital tools, communication platforms, and community data systems are used at Amora, balancing effectiveness with sovereignty and depth.',
    purpose: 'Technology serves the community — the community does not serve technology. This policy ensures that digital tools enhance rather than fragment relationships, and that the community\'s data sovereignty is protected.',
    principles: [
      'Community-critical decisions are not made in ephemeral messaging apps — they go through defined governance processes.',
      'Deep work, family time, and sacred practices are protected from digital interruption by community norm.',
      'Community data is stored in systems controlled by Amora, not dependent on third-party benevolence.',
      'Living Memory Hub data is used to support the mission, never to monitor or profile individuals.',
      'Children\'s digital exposure within community contexts follows the values of the Educational Policy.',
      'Any new digital system affecting the community requires Community Life Circle review before adoption.',
    ],
  },

  // ── Land Stewardship ───────────────────────────────────────────────────────

  {
    name: 'Land Use & Permaculture Standards',
    area: 'Land Stewardship',
    cadence: 'Semi-Annual',
    summary: 'Defines the permaculture-based standards governing all land use, construction, planting, and modification at Amora Eco Village.',
    purpose: 'The land at Amora is a living partner. All human activity on it is guided by permaculture ethics and design principles — ensuring that everything we build and grow increases the health, biodiversity, and resilience of the living system rather than diminishing it.',
    principles: [
      'All land modifications require Land & Ecology Circle review and approval.',
      'Permaculture design principles govern all construction, landscaping, and planting decisions.',
      'Monocultures, synthetic chemicals, and extractive farming practices are prohibited.',
      'A living land map is maintained and updated at least quarterly.',
      'Existing ecosystems are disturbed only as a last resort and with documented restoration plans.',
      'Construction uses natural, local, or reclaimed materials as the first choice.',
    ],
  },

  {
    name: 'Water Sovereignty & Watershed Policy',
    area: 'Land Stewardship',
    cadence: 'Semi-Annual',
    summary: 'Governs the capture, storage, use, and return of water at Amora, with the goal of full water sovereignty — meeting community needs through managed on-site water systems.',
    purpose: 'Water is life. Amora\'s goal is full water sovereignty: capturing, storing, purifying, using, and returning water in a closed-loop system that serves the community and regenerates the watershed.',
    principles: [
      'Water capture, storage, and distribution systems are owned and managed by the community.',
      'Water use efficiency is a shared community responsibility — waste is actively tracked and reduced.',
      'Greywater and blackwater systems are designed for nutrient cycling, not mere disposal.',
      'No activity may degrade the local watershed or downstream water quality.',
      'Water systems are audited quarterly by the Land & Ecology Circle.',
      'Emergency water protocols exist and are reviewed annually.',
    ],
  },

  {
    name: 'Energy Sovereignty Policy',
    area: 'Land Stewardship',
    cadence: 'Semi-Annual',
    summary: 'Establishes Amora\'s commitment to energy sovereignty through renewable generation, community-managed storage, and a culture of conscious energy use.',
    purpose: 'Amora aspires to full energy sovereignty — generating all the energy it needs from renewable sources and managing that energy as a community commons. This policy guides the transition and governs ongoing energy stewardship.',
    principles: [
      'Renewable energy (solar, hydro, wind as appropriate) is the exclusive long-term energy source.',
      'Energy systems are community-owned, not dependent on individual household investment.',
      'A conscious energy culture is cultivated: sufficiency over abundance, sharing over hoarding.',
      'Energy data is visible to the community — production, consumption, and storage tracked in real-time.',
      'New construction must meet defined energy efficiency standards.',
      'Backup systems exist for critical community functions and are tested quarterly.',
    ],
  },

  {
    name: 'Food Sovereignty & Community Garden Policy',
    area: 'Land Stewardship',
    cadence: 'Quarterly',
    summary: 'Governs Amora\'s food production systems — food forests, garden beds, and shared harvests — with the goal of community food sovereignty and deep ecological relationship with nutrition.',
    purpose: 'Growing food together is one of the most powerful acts of community regeneration. This policy ensures that Amora\'s food systems are abundant, equitable, ecologically sound, and deeply connected to community culture.',
    principles: [
      'Food production is a community responsibility, not an individual household task.',
      'All produce grown on community land is considered shared abundance, with fair distribution agreements.',
      'Seed sovereignty is honored: saving, sharing, and preserving heritage seeds is a community practice.',
      'Agrochemicals of any kind are prohibited. Biological and permaculture approaches are the standard.',
      'Food systems are designed for nutritional diversity, ecological resilience, and cultural richness.',
      'Children participate in food growing as part of their education and community contribution.',
    ],
  },

  {
    name: 'Biodiversity & Ecosystem Restoration Policy',
    area: 'Land Stewardship',
    cadence: 'Semi-Annual',
    summary: 'Establishes Amora\'s active commitment to restoring and expanding native biodiversity across all land areas — treating ecosystem restoration as a core community purpose.',
    purpose: 'Amora exists on land that calls for healing. This policy commits the community to active ecosystem restoration — planting native species, creating habitat, protecting wildlife, and measuring the health of our living systems over time.',
    principles: [
      'A minimum of 30% of all land area is dedicated to native ecosystem restoration and wildlife habitat.',
      'Invasive species management is a continuous community responsibility.',
      'Wildlife movement corridors are identified, protected, and expanded.',
      'Annual biodiversity audits are conducted and results shared with the whole community.',
      'Restoration activities are integrated into community life, education, and ceremony.',
      'We aim to leave more biodiversity than we found — every year, measurably.',
    ],
  },

  // ── Financial Commitments ──────────────────────────────────────────────────

  {
    name: 'Financial Transparency & Reporting Standards',
    area: 'Financial Commitment',
    cadence: 'Quarterly',
    summary: 'Establishes Amora\'s non-negotiable commitment to financial transparency — all income, expenditure, and reserves are visible to the community on a defined cadence.',
    purpose: 'Financial transparency is the foundation of trust in community. This policy ensures that money flows are visible, accountable, and aligned with our values — preventing the financial secrecy that has destroyed many intentional communities.',
    principles: [
      'Full financial accounts are shared with all circle leads monthly.',
      'A plain-language financial summary is shared with the full community quarterly.',
      'No financial decision above the defined threshold is made by a single person.',
      'All revenue sources, expenditures, reserves, and liabilities are disclosed in full.',
      'External audit of community finances is conducted annually.',
      'Any financial irregularity is reported to Governance Circle immediately.',
    ],
  },

  {
    name: 'Community Contribution & Shared Prosperity Policy',
    area: 'Financial Commitment',
    cadence: 'Annual',
    summary: 'Defines how financial contribution, labor contribution, and community revenue are structured so that prosperity is genuinely shared and access to community is not limited by wealth.',
    purpose: 'Amora is not a club for the wealthy. This policy ensures that contribution structures are equitable, that community access is available across economic backgrounds, and that prosperity generated by the community is redistributed in alignment with our values.',
    principles: [
      'Community contribution takes multiple forms: financial, labor, knowledge, and creative.',
      'A sliding-scale contribution model is used wherever possible to ensure broad access.',
      'Surplus generated by community enterprises is first reinvested in community resilience and mission.',
      'No member is excluded from community life due to financial hardship without a full review process.',
      'Contribution expectations are clear, agreed, and not coerced.',
      'The contribution structure is reviewed annually by the Finance & Stewardship Circle with community input.',
    ],
  },

  {
    name: 'Development & Investment Authority Policy',
    area: 'Financial Commitment',
    cadence: 'Annual',
    summary: 'Defines who has authority to commit Amora to financial investments, development contracts, and capital expenditures, and at what thresholds additional authorization is required.',
    purpose: 'Clear investment authority prevents both paralysis and reckless spending. This policy defines tiered authorization levels so that day-to-day operations move freely while major commitments receive appropriate community deliberation.',
    principles: [
      'Operational expenditures up to the defined monthly threshold are within each Steward\'s authority.',
      'Capital expenditures above the defined threshold require Finance Circle and Governance Circle consent.',
      'All external investment relationships (loans, grants, equity) require full community disclosure.',
      'No Steward may commit the community to a multi-year financial obligation without Governance Circle consent.',
      'Development decisions that alter land use permanently require full community consent, not just Governance Circle.',
      'Emergency expenditure authority is defined and limited per the Emergency Authority Protocol.',
    ],
  },

  {
    name: 'Stewardship Fee & Revenue Distribution Framework',
    area: 'Financial Commitment',
    cadence: 'Annual',
    summary: 'Establishes the structure of stewardship fees, resident contributions, retreat revenue, and enterprise income — and how these funds are distributed across community needs.',
    purpose: 'The financial architecture of Amora must serve the mission, not undermine it. This framework ensures that income is generated sustainably, that stewardship costs are shared fairly, and that distribution of funds reflects our values.',
    principles: [
      'Stewardship fees are set annually by the Finance Circle with community input and published in advance.',
      'A defined percentage of all revenue is allocated to: land restoration, community resilience fund, and mission expansion.',
      'Retreat center revenue is accounted separately and contributes a defined proportion to community commons.',
      'No revenue stream may create a conflict of interest with the community\'s governance integrity.',
      'Founding members\' financial rights and obligations are defined explicitly and cannot be changed without their consent.',
    ],
  },

  // ── Legal Commitments ──────────────────────────────────────────────────────

  {
    name: 'Legal Entity & Corporate Governance (Costa Rica)',
    area: 'Legal Commitment',
    cadence: 'Annual',
    summary: 'Documents Amora\'s legal structure, corporate governance obligations under Costa Rican law, and the relationship between the legal entity and the community\'s governance systems.',
    purpose: 'A legal entity and a community organization are different things. This policy ensures that Amora\'s legal obligations under Costa Rican law are met with care, and that the legal structure serves the community rather than overriding it.',
    principles: [
      'All legal filings, corporate records, and statutory obligations are maintained current and accurate.',
      'The legal structure is designed to protect community members from personal liability.',
      'Legal entity governance (directors, shareholders) reflects community intent and is reviewed annually.',
      'External legal counsel is engaged for significant legal decisions or changes.',
      'The legal structure is explained in plain language to all members annually.',
      'Any material change to the legal entity requires Governance Circle consent.',
    ],
    notes: 'Full details of the current legal structure are held in restricted access. Contact Governance Circle for access.',
  },

  {
    name: 'Land Ownership & Title Framework',
    area: 'Legal Commitment',
    cadence: 'Annual',
    summary: 'Defines the legal ownership structure of Amora\'s land, the rights and responsibilities of different parties in relation to land title, and the framework for any future land transactions.',
    purpose: 'Land is Amora\'s most valuable and irreplaceable asset. This policy ensures that title, ownership, and stewardship rights are crystal clear — protecting the community\'s long-term tenure and preventing loss of land through legal ambiguity.',
    principles: [
      'All land titles are held by the appropriate legal entity and are current and encumbrance-free.',
      'No land may be sold, transferred, or encumbered without full Governance Circle consent and legal counsel review.',
      'Individual residents hold stewardship rights, not ownership rights, unless a defined purchase agreement exists.',
      'Land title documentation is reviewed and updated annually.',
      'A defined succession framework exists for what happens to land in the event of entity dissolution.',
      'This policy is reviewed by external legal counsel at minimum every three years.',
    ],
    notes: 'Full title documents held in restricted access by Finance & Stewardship Circle.',
  },

  {
    name: 'Liability, Insurance & Risk Management Policy',
    area: 'Legal Commitment',
    cadence: 'Semi-Annual',
    summary: 'Establishes the insurance coverage requirements, liability frameworks, and risk management practices that protect Amora, its members, guests, and the public.',
    purpose: 'Intentional communities carry real-world risks. This policy ensures that Amora maintains adequate insurance, manages foreseeable risks proactively, and has clear liability protocols — so that a single incident does not destabilize the whole community.',
    principles: [
      'General liability, property, and activity-specific insurance is maintained at appropriate levels at all times.',
      'Coverage levels are reviewed annually in consultation with an insurance broker.',
      'All guest waivers, contractor agreements, and event permits are reviewed by legal counsel before use.',
      'A community risk register is maintained and reviewed quarterly.',
      'High-risk activities (retreats, construction, plant medicine) require defined additional safety protocols.',
      'Insurance claims are handled through the Finance Circle with Governance Circle notification.',
    ],
  },

  // ── Public Commitment ──────────────────────────────────────────────────────

  {
    name: 'External Communication & Brand Standards',
    area: 'Public Commitment',
    cadence: 'Quarterly',
    summary: 'Defines the standards, approvals, and accountability for all external communications representing Amora — website, social media, press, partnerships, and public events.',
    purpose: 'Every external communication shapes how the world understands Amora. This policy ensures that public representations are accurate, aligned with our values, and not made unilaterally by individuals speaking for the community without authority.',
    principles: [
      'Communications that speak for Amora as a whole require Community Life Circle or Governance Circle review.',
      'Individual members may speak from personal experience but may not bind the community to positions.',
      'Brand assets, tone, and values guidelines are maintained and followed by all content creators.',
      'Social media accounts representing Amora are managed under defined stewardship with documented access.',
      'Media inquiries are routed to the designated communications steward.',
      'Any partnership announcement or public commitment on behalf of Amora requires Governance Circle approval.',
    ],
  },

  {
    name: 'Webinar, Event & Outreach Policy',
    area: 'Public Commitment',
    cadence: 'Quarterly',
    summary: 'Establishes the standards for planning, hosting, and following up on public events, webinars, and outreach activities that invite prospective members and collaborators into relationship with Amora.',
    purpose: 'Public events are Amora\'s front door. How we show up in these spaces shapes who comes, who stays, and how the community grows. This policy ensures that events are true representations of community life, not curated performances.',
    principles: [
      'All public events must be approved by the responsible Circle before external promotion.',
      'Event descriptions and invitations are honest — they do not over-promise or idealize.',
      'Follow-up with attendees is planned in advance, not improvised after.',
      'Event records (attendance, feedback, outcomes) are captured in Living Memory for institutional learning.',
      'Costs and revenue for events are tracked and reported to Finance Circle.',
      'A post-event review is conducted for all major events to inform future planning.',
    ],
  },

  // ── CCOS Ledger ────────────────────────────────────────────────────────────

  {
    name: 'CCOS Ledger Governance Policy',
    area: 'CCOS Ledger',
    cadence: 'Quarterly',
    summary: 'Defines what qualifies as a CCOS Ledger entry, who has authority to create and approve entries, and how the ledger serves as Amora\'s permanent governance audit trail.',
    purpose: 'The CCOS Ledger is Amora\'s institutional memory of governance actions — decisions made, roles changed, canon amended, and commitments taken. This policy ensures that the ledger is maintained with integrity and serves its purpose as the permanent record of how Amora governs itself.',
    principles: [
      'All Governance Circle decisions are recorded in the CCOS Ledger within 7 days.',
      'Ledger entries include: the decision, the authority behind it, the date, and any dissenting views.',
      'Ledger entries are permanent — they are never deleted, only annotated or superseded.',
      'Drafts require review within 14 days. Entries older than 14 days trigger an SLA alert.',
      'The CCOS Ledger is accessible to all community members in read-only form.',
      'Disputed entries are annotated with the dispute and its resolution, not silently corrected.',
    ],
  },
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function findExisting(name: string): Promise<boolean> {
  const res = await notion.databases.query({
    database_id: DB,
    filter: { property: 'Policy Name', title: { equals: name } },
    page_size: 1,
  });
  return res.results.length > 0;
}

async function createPolicy(p: PolicyDef, index: number): Promise<void> {
  if (await findExisting(p.name)) {
    console.log(`  [EXISTS]  ${p.name}`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [
    callout('Status: DRAFT — This policy has not been formally reviewed or adopted by the community.'),
    h2('Purpose'),
    para(p.purpose),
    h2('Core Principles'),
    ...p.principles.map(bullet),
  ];

  if (p.notes) {
    children.push(h2('Notes'));
    children.push(para(p.notes));
  }

  children.push(para(''));
  children.push(h2('Amendment History'));
  children.push(para('No amendments recorded. This is the initial draft.'));

  await notion.pages.create({
    parent: { database_id: DB },
    properties: {
      'Policy Name':          { title: [{ text: { content: p.name } }] },
      'Policy Area':          { select: { name: p.area } },
      Status:                 { select: { name: 'Draft' } },
      'Current Text Summary': { rich_text: [{ text: { content: p.summary.slice(0, 1900) } }] },
      'Review Cadence':       { select: { name: p.cadence } },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: children as any,
  });

  console.log(`  [${String(index + 1).padStart(2, '0')}] CREATED  ${p.name}`);
}

async function main() {
  console.log(`\nAmora Policy Library — populating ${POLICIES.length} draft policies\n`);

  for (let i = 0; i < POLICIES.length; i++) {
    await createPolicy(POLICIES[i], i);
    await sleep(400); // respect Notion rate limit (3 req/s)
  }

  console.log(`\n✓ Done. ${POLICIES.length} policies processed.\n`);
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
