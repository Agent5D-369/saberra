/* full-noise-scan.js — scans every Notion database for noise, duplicates, and misclassified records */
require('dotenv').config();
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function queryAll(dbId) {
  if (!dbId) return [];
  const pages = []; let cursor;
  do {
    const res = await notion.databases.query({ database_id: dbId, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return pages;
}

function val(page, name) {
  const p = page.properties[name];
  if (!p) return '';
  if (p.type === 'title') return (p.title || []).map(x => x.plain_text).join('');
  if (p.type === 'rich_text') return (p.rich_text || []).map(x => x.plain_text).join('');
  if (p.type === 'select') return p.select ? p.select.name : '';
  if (p.type === 'checkbox') return p.checkbox;
  if (p.type === 'relation') return (p.relation || []).length;
  if (p.type === 'date') return p.date ? p.date.start : '';
  if (p.type === 'multi_select') return (p.multi_select || []).map(s => s.name).join(',');
  return '';
}

function section(name) { console.log('\n' + '='.repeat(70) + '\n' + name + '\n' + '='.repeat(70)); }
function norm(s, len) { return s.toLowerCase().replace(/\d{4}-\d{2}-\d{2}/g,'D').replace(/may \d+,? \d{4}/gi,'D').replace(/june \d{4}/gi,'D').replace(/\s+/g,' ').trim().substring(0, len || 80); }

const SYS_NOISE = /overdue since|truncated|inaccessib|cannot fetch|no body text|pending since|only a link|full url|could not be processed|cannot process video|video url|entrance marker|motorcycle|calendar attendees/i;
const TASK_LANGUAGE = /must be manually|should be sent|needs to be sent|please review|check if|to be determined/i;

async function scan() {
  const dbs = {
    risks:      process.env.NOTION_DB_RISKS,
    mrq:        process.env.NOTION_DB_MEMORY_REVIEW_QUEUE,
    tasks:      process.env.NOTION_DB_TASKS,
    decisions:  process.env.NOTION_DB_DECISION_CANDIDATES,
    sensitive:  process.env.NOTION_DB_SENSITIVE_REVIEW,
    canon:      process.env.NOTION_DB_CANON_CHANGE_REQUESTS,
    ledger:     process.env.NOTION_DB_CCOS_LEDGER_ENTRIES,
    profiles:   process.env.NOTION_DB_PROFILES,
    messages:   process.env.NOTION_DB_MESSAGES,
    kb:         process.env.NOTION_DB_KNOWLEDGE_BASE,
    projects:   process.env.NOTION_DB_PROJECTS,
    roles:      process.env.NOTION_DB_ROLES,
    roleAssign: process.env.NOTION_DB_ROLE_ASSIGNMENTS,
    circles:    process.env.NOTION_DB_CIRCLES,
    meetings:   process.env.NOTION_DB_MEETINGS,
    sources:    process.env.NOTION_DB_SOURCE_EMAILS,
  };

  // RISKS
  const risks = await queryAll(dbs.risks);
  section('RISKS — ' + risks.length + ' total');
  const rg = {};
  for (const p of risks) {
    const t = val(p,'Risk'); const sev = val(p,'Severity'); const cat = val(p,'Category');
    const n = norm(t);
    if (rg[n]) console.log('  [DUP/'+sev+'/'+cat+'] ' + t.substring(0,90));
    else rg[n] = p.id;
    if (!t.trim()) console.log('  [BLANK/'+sev+'/'+cat+'] id:'+p.id);
    if (SYS_NOISE.test(t) && cat === 'Operational') console.log('  [SYS-NOISE/'+sev+'] ' + t.substring(0,90));
  }
  const bySev = risks.reduce((a,p) => { const s=val(p,'Severity')||'?'; a[s]=(a[s]||0)+1; return a; }, {});
  console.log('  By severity: ' + JSON.stringify(bySev));

  // MRQ
  const mrq = await queryAll(dbs.mrq);
  section('MRQ — ' + mrq.length + ' total');
  const mg = {};
  let mrqNoise = 0;
  for (const p of mrq) {
    const t = val(p,'Proposed Memory'); const status = val(p,'Status'); const conf = val(p,'Confidence');
    const n = norm(t, 70);
    if (mg[n]) { console.log('  [NEAR-DUP/'+status+'] ' + t.substring(0,90)); mrqNoise++; }
    else mg[n] = p.id;
    if (conf && conf !== 'High') { console.log('  [NON-HIGH/'+conf+'/'+status+'] ' + t.substring(0,90)); mrqNoise++; }
    if (SYS_NOISE.test(t)) { console.log('  [NOISE/'+status+'] ' + t.substring(0,90)); mrqNoise++; }
  }
  if (!mrqNoise) console.log('  No noise detected');
  const byStatus = mrq.reduce((a,p) => { const s=val(p,'Status')||'?'; a[s]=(a[s]||0)+1; return a; }, {});
  const byCat   = mrq.reduce((a,p) => { const s=val(p,'Category')||'?'; a[s]=(a[s]||0)+1; return a; }, {});
  console.log('  By status: ' + JSON.stringify(byStatus));
  console.log('  By category: ' + JSON.stringify(byCat));

  // TASKS
  const tasks = await queryAll(dbs.tasks);
  section('TASKS — ' + tasks.length + ' total');
  const tg = {};
  let taskNoise = 0;
  for (const p of tasks) {
    const t = val(p,'Task'); const status = val(p,'Status'); const pri = val(p,'Priority');
    // Use 100 chars so session-specific tasks (e.g. webinar transcripts with date after char 91) aren't flagged as dups
    const n = norm(t, 100);
    if (tg[n]) { console.log('  [DUP/'+status+'/'+pri+'] ' + t.substring(0,90)); taskNoise++; }
    else tg[n] = p.id;
    if (!t.trim()) { console.log('  [BLANK/'+status+'/'+pri+'] id:'+p.id); taskNoise++; }
    if (status === 'Needs Owner') { console.log('  [NEEDS-OWNER/'+pri+'] ' + t.substring(0,90)); }
  }
  const tByStatus = tasks.reduce((a,p) => { const s=val(p,'Status')||'?'; a[s]=(a[s]||0)+1; return a; }, {});
  const tByPri   = tasks.reduce((a,p) => { const s=val(p,'Priority')||'?'; a[s]=(a[s]||0)+1; return a; }, {});
  console.log('  By status: ' + JSON.stringify(tByStatus));
  console.log('  By priority: ' + JSON.stringify(tByPri));
  if (!taskNoise) console.log('  No structural noise detected');

  // DECISIONS
  const decisions = await queryAll(dbs.decisions);
  section('DECISIONS — ' + decisions.length + ' total');
  const decg = {};
  let decNoise = 0;
  for (const p of decisions) {
    const t = val(p,'Decision'); const status = val(p,'Status');
    const n = norm(t, 80);
    if (decg[n]) { console.log('  [DUP/'+status+'] ' + t.substring(0,90)); decNoise++; }
    else decg[n] = p.id;
    if (!t.trim()) { console.log('  [BLANK/'+status+'] id:'+p.id); decNoise++; }
    if (TASK_LANGUAGE.test(t)) { console.log('  [TASK-MASQUERADING/'+status+'] ' + t.substring(0,90)); decNoise++; }
  }
  const dByStatus = decisions.reduce((a,p) => { const s=val(p,'Status')||'?'; a[s]=(a[s]||0)+1; return a; }, {});
  console.log('  By status: ' + JSON.stringify(dByStatus));
  if (!decNoise) console.log('  No noise detected');

  // SENSITIVE
  const sens = await queryAll(dbs.sensitive);
  section('SENSITIVE REVIEW — ' + sens.length + ' total');
  const sg = {};
  let sensNoise = 0;
  for (const p of sens) {
    const t = val(p,'Issue'); const status = val(p,'Status');
    const fp = t.toLowerCase()
      .replace(/nikita|eric|timmermans/g,'T')
      .replace(/mariana|rius/g,'M')
      .replace(/kyleen|keenan/g,'K')
      .replace(/jessica|filkins/g,'J')
      .replace(/rick|broider/g,'R')
      .replace(/\s+/g,' ').trim().substring(0,70);
    if (sg[fp]) { console.log('  [NEAR-DUP/'+status+'] ' + t.substring(0,90)); sensNoise++; }
    else sg[fp] = p.id;
    if (/emoji|formatting error|rendering/i.test(t)) { console.log('  [INVALID/'+status+'] ' + t.substring(0,90)); sensNoise++; }
  }
  const sByStatus = sens.reduce((a,p) => { const s=val(p,'Status')||'?'; a[s]=(a[s]||0)+1; return a; }, {});
  console.log('  By status: ' + JSON.stringify(sByStatus));
  if (!sensNoise) console.log('  No near-dups or invalid flags found');

  // CANON
  const canon = await queryAll(dbs.canon);
  section('CANON CHANGE REQUESTS — ' + canon.length + ' total');
  const cg = {};
  let canNoise = 0;
  for (const p of canon) {
    const t = val(p,'Proposed Change'); const status = val(p,'Status');
    const n = norm(t, 80);
    if (cg[n]) { console.log('  [DUP/'+status+'] ' + t.substring(0,90)); canNoise++; }
    else cg[n] = p.id;
    if (!t.trim()) { console.log('  [BLANK/'+status+'] id:'+p.id); canNoise++; }
  }
  console.log('  By status: ' + JSON.stringify(canon.reduce((a,p)=>{const s=val(p,'Status')||'?';a[s]=(a[s]||0)+1;return a;},{})));
  if (!canNoise) console.log('  No duplicates or blank entries');

  // LEDGER
  const ledger = await queryAll(dbs.ledger);
  section('CCOS LEDGER — ' + ledger.length + ' total');
  const lg = {};
  for (const p of ledger) {
    const t = val(p,'Ledger Entry'); const type = val(p,'Ledger Type'); const status = val(p,'Status');
    const n = norm(t, 80);
    if (lg[n]) console.log('  [DUP/'+type+'] ' + t.substring(0,90));
    else lg[n] = p.id;
    console.log('  ['+type+'/'+status+'] ' + t.substring(0,90));
  }

  // KB
  const kb = await queryAll(dbs.kb);
  section('KNOWLEDGE BASE — ' + kb.length + ' total');
  const kg = {};
  let kbNoise = 0;
  for (const p of kb) {
    const t = val(p,'KB Title'); const cat = val(p,'Category'); const status = val(p,'Status');
    const n = norm(t, 80);
    if (kg[n]) { console.log('  [DUP/'+cat+'] ' + t.substring(0,90)); kbNoise++; }
    else kg[n] = p.id;
    if (!t.trim()) { console.log('  [BLANK/'+cat+'/'+status+'] id:'+p.id); kbNoise++; }
  }
  console.log('  By category: ' + JSON.stringify(kb.reduce((a,p)=>{const s=val(p,'Category')||'?';a[s]=(a[s]||0)+1;return a;},{})));
  if (!kbNoise) console.log('  No duplicates found');

  // MESSAGES
  const msgs = await queryAll(dbs.messages);
  section('MESSAGES — ' + msgs.length + ' total');
  const mgg = {};
  let msgNoise = 0;
  for (const p of msgs) {
    const t = val(p,'Message Title'); const conf = val(p,'Confidentiality Level'); const urg = val(p,'Urgency');
    const n = norm(t, 80);
    if (mgg[n]) { console.log('  [DUP/'+conf+'] ' + t.substring(0,90)); msgNoise++; }
    else mgg[n] = p.id;
    if (!t.trim()) { console.log('  [BLANK/'+conf+'] id:'+p.id); msgNoise++; }
  }
  console.log('  By confidentiality: ' + JSON.stringify(msgs.reduce((a,p)=>{const s=val(p,'Confidentiality Level')||'?';a[s]=(a[s]||0)+1;return a;},{})));
  if (!msgNoise) console.log('  No noise detected');

  // PROJECTS
  const projects = await queryAll(dbs.projects);
  section('PROJECTS — ' + projects.length + ' total');
  const pg = {};
  for (const p of projects) {
    const t = val(p,'Project Name'); const status = val(p,'Status'); const pri = val(p,'Priority');
    const n = norm(t, 60);
    if (pg[n]) console.log('  [DUP/'+status+'] ' + t.substring(0,80));
    else pg[n] = p.id;
    console.log('  ['+status+'/'+pri+'] ' + t);
  }

  // ROLES
  const roles = await queryAll(dbs.roles);
  section('ROLES — ' + roles.length + ' total');
  const rorg = {};
  for (const p of roles) {
    const t = val(p,'Role Name'); const status = val(p,'Status'); const type = val(p,'Role Type');
    const n = norm(t, 60);
    if (rorg[n]) console.log('  [DUP/'+type+'] ' + t.substring(0,80));
    else rorg[n] = p.id;
    console.log('  ['+status+'/'+type+'] ' + t);
  }

  // ROLE ASSIGNMENTS
  const ra = await queryAll(dbs.roleAssign);
  section('ROLE ASSIGNMENTS — ' + ra.length + ' total');
  const rag = {};
  for (const p of ra) {
    const t = val(p,'Assignment Title'); const status = val(p,'Status');
    const n = norm(t, 70);
    if (rag[n]) console.log('  [DUP/'+status+'] ' + t.substring(0,90));
    else rag[n] = p.id;
    console.log('  ['+status+'] ' + t);
  }

  // CIRCLES
  const circles = await queryAll(dbs.circles);
  section('CIRCLES — ' + circles.length + ' total');
  const cig = {};
  for (const p of circles) {
    const t = val(p,'Circle Name'); const status = val(p,'Status');
    const n = norm(t, 60);
    if (cig[n]) console.log('  [DUP/'+status+'] ' + t.substring(0,80));
    else cig[n] = p.id;
    console.log('  ['+status+'] ' + t);
  }

  // PROFILES
  const profiles = await queryAll(dbs.profiles);
  section('PROFILES — ' + profiles.length + ' total');
  const profg = {};
  for (const p of profiles) {
    const name = val(p,'Name'); const type = val(p,'Profile Type'); const status = val(p,'Engagement Status');
    const email = val(p,'Email');
    const n = norm(name, 60);
    if (profg[n]) console.log('  [DUP/'+type+'] ' + name + (email ? ' <'+email+'>' : ''));
    else profg[n] = p.id;
    console.log('  ['+status+'/'+type+'] ' + name + (email ? ' <'+email+'>' : ''));
  }

  // SOURCE EMAILS
  const sources = await queryAll(dbs.sources);
  section('SOURCE EMAILS — ' + sources.length + ' total');
  const props0 = sources[0] ? Object.keys(sources[0].properties) : [];
  console.log('  Properties: ' + props0.join(', '));
  const srcg = {};
  for (const p of sources) {
    const subj = val(p,'Subject') || val(p,'Email Subject') || val(p,'Title') || '';
    const from = val(p,'Sender Email') || val(p,'From') || '';
    const n = norm(subj+from, 80);
    if (srcg[n]) console.log('  [DUP] ' + from + ': ' + subj.substring(0,70));
    else srcg[n] = p.id;
  }
  console.log('  Total: ' + sources.length + ' (dedup by subject+sender)');

  // MEETINGS
  const meetings = await queryAll(dbs.meetings);
  section('MEETINGS — ' + meetings.length + ' total');
  const mProps = meetings[0] ? Object.keys(meetings[0].properties) : [];
  console.log('  Properties: ' + mProps.join(', '));
  for (const p of meetings) {
    const t = val(p,'Meeting Title') || val(p,'Title') || '(no title prop)';
    const status = val(p,'Processing Status');
    console.log('  ['+status+'] ' + t.substring(0,80));
  }
}

scan().catch(console.error);
