/**
 * Notion Database Noise Audit
 * Queries all 17 databases and prints counts, breakdowns, and samples.
 * Run: node scripts/audit-notion-noise.js
 */

require('dotenv').config();

const API_KEY = process.env.NOTION_API_KEY;
if (!API_KEY) { console.error('NOTION_API_KEY required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function queryAll(dbId, label) {
  const results = [];
  let cursor;
  let page = 0;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`${BASE}/databases/${dbId}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Query ${label} (${dbId}): ${r.status} ${txt}`);
    }
    const d = await r.json();
    results.push(...(d.results ?? []));
    cursor = d.has_more ? d.next_cursor : undefined;
    page++;
    await sleep(200);
  } while (cursor);
  return results.filter(p => !p.archived);
}

function getTitle(page, field) {
  const prop = page.properties?.[field];
  if (!prop) return '(no field)';
  if (prop.type === 'title') return prop.title?.[0]?.plain_text?.trim() || '(blank)';
  if (prop.type === 'rich_text') return prop.rich_text?.[0]?.plain_text?.trim() || '(blank)';
  return '(unknown type)';
}

function getSelect(page, field) {
  return page.properties?.[field]?.select?.name ?? '(none)';
}

function getFormula(page, field) {
  const p = page.properties?.[field];
  if (!p) return null;
  if (p.type === 'formula') {
    const f = p.formula;
    if (f?.type === 'number') return f.number;
    if (f?.type === 'string') return f.string;
  }
  return null;
}

function getNumber(page, field) {
  return page.properties?.[field]?.number ?? null;
}

function getCheckbox(page, field) {
  return page.properties?.[field]?.checkbox ?? false;
}

function countBy(pages, fn) {
  const counts = {};
  for (const p of pages) {
    const key = fn(p) ?? '(none)';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function printBreakdown(label, counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log(`  ${label}:`);
  for (const [k, v] of entries) {
    console.log(`    ${String(v).padStart(4)}  ${k}`);
  }
}

function bar(label, total) {
  return `  Total: ${total}  ${label}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function section(title) {
  console.log(`\n${'─'.repeat(72)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(72)}`);
}

// ── DB IDs ────────────────────────────────────────────────────────────────────
const DB = {
  SOURCE_EMAILS:         process.env.NOTION_DB_SOURCE_EMAILS,
  MEETINGS:              process.env.NOTION_DB_MEETINGS,
  MEETING_ASSETS:        process.env.NOTION_DB_MEETING_ASSETS,
  MESSAGES:              process.env.NOTION_DB_MESSAGES,
  PROFILES:              process.env.NOTION_DB_PROFILES,
  PROJECTS:              process.env.NOTION_DB_PROJECTS,
  CIRCLES:               process.env.NOTION_DB_CIRCLES,
  ROLES:                 process.env.NOTION_DB_ROLES,
  ROLE_ASSIGNMENTS:      process.env.NOTION_DB_ROLE_ASSIGNMENTS,
  TASKS:                 process.env.NOTION_DB_TASKS,
  DECISION_CANDIDATES:   process.env.NOTION_DB_DECISION_CANDIDATES,
  RISKS:                 process.env.NOTION_DB_RISKS,
  MEMORY_REVIEW_QUEUE:   process.env.NOTION_DB_MEMORY_REVIEW_QUEUE,
  CANON_CHANGE_REQUESTS: process.env.NOTION_DB_CANON_CHANGE_REQUESTS,
  CCOS_LEDGER_ENTRIES:   process.env.NOTION_DB_CCOS_LEDGER_ENTRIES,
  PROCESSING_EVENTS:     process.env.NOTION_DB_PROCESSING_EVENTS,
  SENSITIVE_REVIEW:      process.env.NOTION_DB_SENSITIVE_REVIEW,
  POLICIES:              process.env.NOTION_DB_POLICIES,
  KNOWLEDGE_BASE:        process.env.NOTION_DB_KNOWLEDGE_BASE,
};

async function main() {
  console.log('\n' + '='.repeat(72));
  console.log('  Notion Database Noise Audit  —  ' + new Date().toISOString().slice(0, 16));
  console.log('='.repeat(72));

  const totals = {};

  // ── 1. Source Emails ────────────────────────────────────────────────────────
  section('Source Emails (ingestion log)');
  const sourceEmails = await queryAll(DB.SOURCE_EMAILS, 'Source Emails');
  totals['Source Emails'] = sourceEmails.length;
  console.log(bar('emails ingested', sourceEmails.length));
  const seStatus = countBy(sourceEmails, p => getSelect(p, 'Processing Status'));
  printBreakdown('By Processing Status', seStatus);

  // ── 2. Meetings ─────────────────────────────────────────────────────────────
  section('Meetings');
  const meetings = await queryAll(DB.MEETINGS, 'Meetings');
  totals['Meetings'] = meetings.length;
  console.log(bar('meetings', meetings.length));
  const meetStatus = countBy(meetings, p => getSelect(p, 'Processing Status'));
  printBreakdown('By Processing Status', meetStatus);

  // ── 3. Meeting Assets ───────────────────────────────────────────────────────
  section('Meeting Assets');
  const assets = await queryAll(DB.MEETING_ASSETS, 'Meeting Assets');
  totals['Meeting Assets'] = assets.length;
  console.log(bar('assets', assets.length));
  const assetType = countBy(assets, p => getSelect(p, 'Asset Type'));
  printBreakdown('By Asset Type', assetType);
  const assetAccess = countBy(assets, p => getSelect(p, 'Access Status'));
  printBreakdown('By Access Status', assetAccess);

  // ── 4. Messages ─────────────────────────────────────────────────────────────
  section('Messages (operational emails)');
  const messages = await queryAll(DB.MESSAGES, 'Messages');
  totals['Messages'] = messages.length;
  console.log(bar('messages', messages.length));

  // ── 5. Profiles ─────────────────────────────────────────────────────────────
  section('Profiles');
  const profiles = await queryAll(DB.PROFILES, 'Profiles');
  totals['Profiles'] = profiles.length;
  console.log(bar('profiles', profiles.length));
  // Check for Active/Inactive — might be a Status or checkbox field
  const profileStatus = countBy(profiles, p => getSelect(p, 'Status'));
  printBreakdown('By Status', profileStatus);
  const profileType = countBy(profiles, p => getSelect(p, 'Profile Type'));
  printBreakdown('By Profile Type', profileType);

  // ── 6. Projects ─────────────────────────────────────────────────────────────
  section('Projects');
  const projects = await queryAll(DB.PROJECTS, 'Projects');
  totals['Projects'] = projects.length;
  console.log(bar('projects', projects.length));
  const projStatus = countBy(projects, p => getSelect(p, 'Status'));
  printBreakdown('By Status', projStatus);

  // ── 7. Circles ──────────────────────────────────────────────────────────────
  section('Circles');
  const circles = await queryAll(DB.CIRCLES, 'Circles');
  totals['Circles'] = circles.length;
  console.log(bar('circles', circles.length));

  // ── 8. Roles ────────────────────────────────────────────────────────────────
  section('Roles');
  const roles = await queryAll(DB.ROLES, 'Roles');
  totals['Roles'] = roles.length;
  console.log(bar('roles', roles.length));

  // ── 9. Role Assignments ─────────────────────────────────────────────────────
  section('Role Assignments');
  const roleAssignments = await queryAll(DB.ROLE_ASSIGNMENTS, 'Role Assignments');
  totals['Role Assignments'] = roleAssignments.length;
  console.log(bar('assignments', roleAssignments.length));

  // ── 10. Tasks ───────────────────────────────────────────────────────────────
  section('Tasks');
  const tasks = await queryAll(DB.TASKS, 'Tasks');
  totals['Tasks'] = tasks.length;
  console.log(bar('tasks', tasks.length));
  const taskStatus = countBy(tasks, p => getSelect(p, 'Status'));
  printBreakdown('By Status', taskStatus);
  const taskPriority = countBy(tasks, p => getSelect(p, 'Priority'));
  printBreakdown('By Priority', taskPriority);
  const taskOwner = countBy(tasks, p => {
    const rel = p.properties?.['Assigned To']?.relation;
    return rel?.length > 0 ? 'Has Owner' : 'No Owner';
  });
  printBreakdown('Owner assigned?', taskOwner);

  // ── 11. Decision Candidates ─────────────────────────────────────────────────
  section('Decision Candidates');
  const decisions = await queryAll(DB.DECISION_CANDIDATES, 'Decision Candidates');
  totals['Decision Candidates'] = decisions.length;
  console.log(bar('decisions', decisions.length));
  const decStatus = countBy(decisions, p => getSelect(p, 'Status'));
  printBreakdown('By Status', decStatus);
  const decConfidence = countBy(decisions, p => getSelect(p, 'Confidence'));
  printBreakdown('By Confidence', decConfidence);

  // ── 12. Risks ───────────────────────────────────────────────────────────────
  section('Risks');
  const risks = await queryAll(DB.RISKS, 'Risks');
  totals['Risks'] = risks.length;
  console.log(bar('risks', risks.length));
  const riskSeverity = countBy(risks, p => getSelect(p, 'Severity'));
  printBreakdown('By Severity', riskSeverity);
  const riskStatus = countBy(risks, p => getSelect(p, 'Status'));
  printBreakdown('By Status', riskStatus);
  const riskOwner = countBy(risks, p => {
    const rel = p.properties?.['Owner']?.relation;
    return rel?.length > 0 ? 'Has Owner' : 'No Owner';
  });
  printBreakdown('Owner assigned?', riskOwner);

  // ── 13. Memory Review Queue ─────────────────────────────────────────────────
  section('Memory Review Queue');
  const memReview = await queryAll(DB.MEMORY_REVIEW_QUEUE, 'Memory Review Queue');
  totals['Memory Review Queue'] = memReview.length;
  console.log(bar('entries', memReview.length));
  const mrqStatus = countBy(memReview, p => getSelect(p, 'Status'));
  printBreakdown('By Status', mrqStatus);
  const mrqCategory = countBy(memReview, p => getSelect(p, 'Category'));
  printBreakdown('By Category', mrqCategory);
  const mrqConfidence = countBy(memReview, p => getSelect(p, 'Confidence'));
  printBreakdown('By Confidence', mrqConfidence);

  // Sample 10 random entries
  console.log('\n  SAMPLE — 10 random Memory Review Queue entries:');
  const mrqSample = shuffle(memReview).slice(0, 10);
  for (const p of mrqSample) {
    const title = getTitle(p, 'Proposed Memory');
    const category = getSelect(p, 'Category');
    const confidence = getSelect(p, 'Confidence');
    const status = getSelect(p, 'Status');
    const display = title.length > 70 ? title.slice(0, 70) + '...' : title;
    console.log(`    [${status}] [${category}] [${confidence}]`);
    console.log(`      "${display}"`);
  }

  // ── 14. Canon Change Requests ───────────────────────────────────────────────
  section('Canon Change Requests');
  const canon = await queryAll(DB.CANON_CHANGE_REQUESTS, 'Canon Change Requests');
  totals['Canon Change Requests'] = canon.length;
  console.log(bar('requests', canon.length));
  const canonStatus = countBy(canon, p => getSelect(p, 'Status'));
  printBreakdown('By Status', canonStatus);
  const canonCategory = countBy(canon, p => getSelect(p, 'Category'));
  printBreakdown('By Category', canonCategory);

  // ── 15. CCOS Ledger Entries ─────────────────────────────────────────────────
  section('CCOS Ledger Entries');
  const ledger = await queryAll(DB.CCOS_LEDGER_ENTRIES, 'CCOS Ledger Entries');
  totals['CCOS Ledger Entries'] = ledger.length;
  console.log(bar('entries', ledger.length));
  const ledgerType = countBy(ledger, p => getSelect(p, 'Entry Type'));
  printBreakdown('By Entry Type', ledgerType);
  const ledgerStatus = countBy(ledger, p => getSelect(p, 'Status'));
  printBreakdown('By Status', ledgerStatus);

  // ── 16. Processing Events ───────────────────────────────────────────────────
  section('Processing Events (audit log)');
  const events = await queryAll(DB.PROCESSING_EVENTS, 'Processing Events');
  totals['Processing Events'] = events.length;
  console.log(bar('events', events.length));
  const evtType = countBy(events, p => getSelect(p, 'Event Type'));
  printBreakdown('By Event Type', evtType);
  const evtStatus = countBy(events, p => getSelect(p, 'Status'));
  printBreakdown('By Status', evtStatus);

  // ── 17. Sensitive Review ────────────────────────────────────────────────────
  section('Sensitive Review (admin-only)');
  const sensitive = await queryAll(DB.SENSITIVE_REVIEW, 'Sensitive Review');
  totals['Sensitive Review'] = sensitive.length;
  console.log(bar('entries', sensitive.length));
  const sensStatus = countBy(sensitive, p => getSelect(p, 'Status'));
  printBreakdown('By Status', sensStatus);
  const sensCategory = countBy(sensitive, p => getSelect(p, 'Category'));
  printBreakdown('By Category', sensCategory);
  const sensSeverity = countBy(sensitive, p => getSelect(p, 'Severity'));
  printBreakdown('By Severity', sensSeverity);

  // ── 18. Policies ────────────────────────────────────────────────────────────
  if (DB.POLICIES) {
    section('Policies');
    const policies = await queryAll(DB.POLICIES, 'Policies');
    totals['Policies'] = policies.length;
    console.log(bar('policies', policies.length));
    const polStatus = countBy(policies, p => getSelect(p, 'Status'));
    printBreakdown('By Status', polStatus);
  }

  // ── 19. Knowledge Base ──────────────────────────────────────────────────────
  if (DB.KNOWLEDGE_BASE) {
    section('Knowledge Base');
    const kb = await queryAll(DB.KNOWLEDGE_BASE, 'Knowledge Base');
    totals['Knowledge Base'] = kb.length;
    console.log(bar('articles', kb.length));
    const kbCategory = countBy(kb, p => getSelect(p, 'Category'));
    printBreakdown('By Category', kbCategory);
  }

  // ── RISK SAMPLE ─────────────────────────────────────────────────────────────
  section('SAMPLE — 10 random Risks');
  const riskSample = shuffle(risks).slice(0, 10);
  for (const p of riskSample) {
    const title = getTitle(p, 'Risk');
    const severity = getSelect(p, 'Severity');
    const status = getSelect(p, 'Status');
    const display = title.length > 70 ? title.slice(0, 70) + '...' : title;
    console.log(`    [${status}] [${severity}]`);
    console.log(`      "${display}"`);
  }

  // ── GRAND SUMMARY ───────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(72));
  console.log('  GRAND SUMMARY — Record counts across all databases');
  console.log('='.repeat(72));
  let grandTotal = 0;
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  for (const [db, count] of sorted) {
    console.log(`  ${String(count).padStart(5)}  ${db}`);
    grandTotal += count;
  }
  console.log(`  ${'─'.repeat(30)}`);
  console.log(`  ${String(grandTotal).padStart(5)}  TOTAL RECORDS`);

  // Noise signal estimate
  const noiseDBs = ['Source Emails', 'Processing Events', 'Meeting Assets'];
  const noiseCount = noiseDBs.reduce((s, k) => s + (totals[k] || 0), 0);
  const signalCount = grandTotal - noiseCount;
  console.log(`\n  Signal/Noise estimate:`);
  console.log(`    Noise (audit/infra logs): ${noiseCount}  (${Math.round(noiseCount/grandTotal*100)}%)`);
  console.log(`    Signal (institutional memory): ${signalCount}  (${Math.round(signalCount/grandTotal*100)}%)`);

  // Pending review queue depth
  const pendingReview = (totals['Memory Review Queue'] || 0) + (totals['Canon Change Requests'] || 0) + (totals['Sensitive Review'] || 0);
  console.log(`\n  Pending human review depth: ~${pendingReview} records`);
  console.log('    (Memory Review Queue + Canon Change Requests + Sensitive Review)');
  console.log('');
}

main().catch(err => { console.error(err.message || err); process.exit(1); });
