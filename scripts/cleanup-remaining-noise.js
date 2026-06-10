/**
 * cleanup-remaining-noise.js
 *
 * Targeted cleanup for all remaining noise identified by full-noise-scan:
 *   1. Archive "Via", "Via (Vera)", "Read Assistant" profiles; re-link Via variants → Victoria Leyden
 *   2. Archive duplicate role assignments (Eric Develing dups, Rick Broider dash dup)
 *   3. Archive duplicate tasks (keep richest; "obtain webinar transcript" x7 → x1)
 *   4. Archive duplicate decisions + task-masquerading candidate
 *   5. Archive near-dup project variants (4 campground → 1, 2 LMH → 1)
 *   6. Archive 5 duplicate [AMORA CAPTURE] messages
 *
 * Usage:
 *   node scripts/cleanup-remaining-noise.js            # dry run
 *   DRY_RUN=false node scripts/cleanup-remaining-noise.js  # apply
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DRY_RUN = process.env.DRY_RUN !== 'false';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function norm(s, len) {
  return (s || '').toLowerCase()
    .replace(/\d{4}-\d{2}-\d{2}/g, 'D')
    .replace(/may \d+,? \d{4}/gi, 'D')
    .replace(/june \d{4}/gi, 'D')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, len || 120);
}

async function queryAll(dbId) {
  if (!dbId) return [];
  const pages = []; let cursor;
  do {
    const res = await notion.databases.query({
      database_id: dbId, page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return pages;
}

function getPropValue(page, name) {
  const p = (page.properties || {})[name];
  if (!p) return '';
  if (p.type === 'title') return (p.title || []).map(x => x.plain_text).join('');
  if (p.type === 'rich_text') return (p.rich_text || []).map(x => x.plain_text).join('');
  if (p.type === 'select') return p.select ? p.select.name : '';
  if (p.type === 'relation') return (p.relation || []).map(r => r.id);
  return '';
}

function titleText(page) {
  const props = page.properties || {};
  for (const prop of Object.values(props)) {
    if (prop.type === 'title') return (prop.title || []).map(x => x.plain_text).join('').trim();
  }
  return '';
}

function scoreRichness(page) {
  let score = 0;
  for (const prop of Object.values(page.properties || {})) {
    switch (prop.type) {
      case 'title':      if (prop.title?.length > 0 && prop.title[0]?.plain_text?.trim()) score++; break;
      case 'rich_text':  if (prop.rich_text?.length > 0 && prop.rich_text[0]?.plain_text?.trim()) score++; break;
      case 'select':     if (prop.select?.name) score++; break;
      case 'multi_select': score += (prop.multi_select?.length ?? 0); break;
      case 'relation':   score += (prop.relation?.length ?? 0) * 2; break;
      case 'date':       if (prop.date?.start) score++; break;
      case 'checkbox':   if (prop.checkbox) score++; break;
      case 'url':        if (prop.url) score++; break;
      case 'email':      if (prop.email) score++; break;
    }
  }
  return score;
}

function toDashed(id) {
  const s = id.replace(/-/g, '').toLowerCase();
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

async function archivePage(id, label) {
  console.log(`    ARCHIVE "${label}" (${id})`);
  if (!DRY_RUN) {
    await notion.pages.update({ page_id: id, archived: true });
    await sleep(300);
  }
}

async function updateTitle(id, titlePropName, newTitle, label) {
  console.log(`    RENAME "${label}" → "${newTitle}" (${id})`);
  if (!DRY_RUN) {
    await notion.pages.update({
      page_id: id,
      properties: { [titlePropName]: { title: [{ text: { content: newTitle } }] } },
    });
    await sleep(300);
  }
}

// ── Re-link all relation-type properties pointing at dupIds to canonicalId ─────
async function relinkProfileDups(dupIds, canonicalId) {
  const dupNorms = new Set(dupIds.map(id => id.replace(/-/g, '').toLowerCase()));
  const canonNorm = canonicalId.replace(/-/g, '').toLowerCase();

  const DB_ENV_VARS = [
    'NOTION_DB_TASKS', 'NOTION_DB_MEMORY_REVIEW_QUEUE', 'NOTION_DB_SENSITIVE_REVIEW',
    'NOTION_DB_PROFILES', 'NOTION_DB_ROLE_ASSIGNMENTS', 'NOTION_DB_RISKS',
    'NOTION_DB_DECISION_CANDIDATES', 'NOTION_DB_CIRCLES', 'NOTION_DB_ROLES',
    'NOTION_DB_MEETINGS', 'NOTION_DB_PROJECTS', 'NOTION_DB_MESSAGES',
    'NOTION_DB_CANON_CHANGE_REQUESTS', 'NOTION_DB_CCOS_LEDGER_ENTRIES',
  ];

  let totalPatched = 0;
  for (const envVar of DB_ENV_VARS) {
    const dbId = process.env[envVar];
    if (!dbId) continue;
    let pages;
    try { pages = await queryAll(dbId); } catch { continue; }

    for (const page of pages) {
      if (!page.properties) continue;
      const updates = {};
      for (const [propName, prop] of Object.entries(page.properties)) {
        if (prop.type !== 'relation') continue;
        const existing = prop.relation || [];
        let changed = false;
        const next = [];
        for (const rel of existing) {
          const n = rel.id.replace(/-/g, '').toLowerCase();
          if (dupNorms.has(n)) {
            changed = true;
            const alreadyHasCanon = existing.some(r => r.id.replace(/-/g,'').toLowerCase() === canonNorm);
            if (!alreadyHasCanon && !next.some(r => r.id.replace(/-/g,'').toLowerCase() === canonNorm)) {
              next.push({ id: toDashed(canonNorm) });
            }
          } else {
            next.push(rel);
          }
        }
        if (changed) updates[propName] = { relation: next };
      }
      if (Object.keys(updates).length > 0) {
        console.log(`    RELINK ${envVar} page "${titleText(page).slice(0, 60)}"`);
        if (!DRY_RUN) {
          await notion.pages.update({ page_id: page.id, properties: updates });
          await sleep(300);
        }
        totalPatched++;
      }
    }
    await sleep(150);
  }
  return totalPatched;
}

// ── SECTION 1: Profile cleanup ─────────────────────────────────────────────────
async function cleanupProfiles() {
  console.log('\n' + '='.repeat(60) + '\nSECTION 1: Profile Cleanup\n' + '='.repeat(60));
  const profiles = await queryAll(process.env.NOTION_DB_PROFILES);

  // Find targets by name
  const find = (name) => profiles.find(p => titleText(p).toLowerCase() === name.toLowerCase());
  const via         = find('Via');
  const viaVera     = find('Via (Vera)');
  const readAssist  = find('Read Assistant');
  const victoria    = find('Victoria Leyden');

  if (!victoria) { console.log('  ERROR: Victoria Leyden canonical not found — aborting profile section'); return; }
  console.log(`  Victoria Leyden (canonical): ${victoria.id}`);

  const dupIds = [];
  if (via)      { console.log(`  Via: ${via.id}`);        dupIds.push(via.id); }
  if (viaVera)  { console.log(`  Via (Vera): ${viaVera.id}`); dupIds.push(viaVera.id); }

  if (dupIds.length > 0) {
    console.log('\n  Re-linking relations from Via variants → Victoria Leyden...');
    const patched = await relinkProfileDups(dupIds, victoria.id);
    console.log(`  Relations patched: ${patched}`);
    for (const p of [via, viaVera].filter(Boolean)) {
      await archivePage(p.id, titleText(p));
    }
  } else {
    console.log('  No Via/Via(Vera) profiles found — already cleaned up');
  }

  if (readAssist) {
    console.log('\n  Archiving Read Assistant (system artifact)...');
    await archivePage(readAssist.id, 'Read Assistant');
  } else {
    console.log('  Read Assistant not found — already cleaned up');
  }
}

// ── SECTION 2: Role Assignment cleanup ────────────────────────────────────────
async function cleanupRoleAssignments() {
  console.log('\n' + '='.repeat(60) + '\nSECTION 2: Role Assignment Cleanup\n' + '='.repeat(60));
  const ra = await queryAll(process.env.NOTION_DB_ROLE_ASSIGNMENTS);
  const live = ra.filter(p => !p.archived);

  const byTitle = {};
  for (const p of live) {
    const t = titleText(p);
    if (!byTitle[t]) byTitle[t] = [];
    byTitle[t].push(p);
  }

  // Log all assignments for visibility
  for (const [t, pages] of Object.entries(byTitle)) {
    const statuses = pages.map(p => getPropValue(p, 'Status') || '?').join(',');
    console.log(`  "${t}" [${statuses}] x${pages.length}`);
  }

  // Fix 1: Rick Broider dash vs em-dash Living Memory Steward
  // Always prefer em-dash format for consistency with all other canonical assignments
  const rbDash   = byTitle['Rick Broider - Living Memory Steward']?.[0];
  const rbEmDash = byTitle['Rick Broider — Living Memory Steward']?.[0];
  if (rbDash && rbEmDash) {
    const dashScore   = scoreRichness(rbDash);
    const emDashScore = scoreRichness(rbEmDash);
    console.log(`\n  Rick Broider LM Steward dup: dash(${dashScore}) vs em-dash(${emDashScore}) — archiving dash (prefer em-dash format)`);
    await archivePage(rbDash.id, titleText(rbDash));
  } else if (rbDash && !rbEmDash) {
    console.log('\n  Rick Broider - LM Steward: only dash variant, renaming to em-dash format');
    await updateTitle(rbDash.id, 'Assignment Title', 'Rick Broider — Living Memory Steward', titleText(rbDash));
  }

  // Fix 2: Eric Develing entries — archive duplicates, keep canonical (em-dash format)
  // Pattern: "Eric Develing - X" (dash, old) and "Eric Develing — X" (em-dash)
  // Both should be renamed to "Eric Timmermans — X" (canonical name)
  // If both exist for same role, archive dash variant
  const devGroups = {};
  for (const [t, pages] of Object.entries(byTitle)) {
    if (!t.includes('Eric Develing')) continue;
    const role = t.replace(/Eric Develing\s*[-—]\s*/, '').trim();
    if (!devGroups[role]) devGroups[role] = { dash: null, emDash: null };
    if (t.includes(' - ')) devGroups[role].dash = pages[0];
    else devGroups[role].emDash = pages[0];
  }

  for (const [role, variants] of Object.entries(devGroups)) {
    const canonTitle = `Eric Timmermans — ${role}`;
    console.log(`\n  Eric Develing role: "${role}"`);

    // If dash variant exists and em-dash also exists → archive dash, rename em-dash
    if (variants.dash && variants.emDash) {
      console.log(`    Archiving dash variant: "${titleText(variants.dash)}"`);
      await archivePage(variants.dash.id, titleText(variants.dash));
      const emStatus = getPropValue(variants.emDash, 'Status');
      if (emStatus !== 'Completed') {
        console.log(`    Renaming em-dash variant to: "${canonTitle}"`);
        await updateTitle(variants.emDash.id, 'Assignment Title', canonTitle, titleText(variants.emDash));
      } else {
        console.log(`    Em-dash variant is Completed — keeping as historical record with corrected name`);
        await updateTitle(variants.emDash.id, 'Assignment Title', canonTitle, titleText(variants.emDash));
      }
    } else if (variants.dash && !variants.emDash) {
      const dashStatus = getPropValue(variants.dash, 'Status');
      if (dashStatus === 'Completed') {
        await updateTitle(variants.dash.id, 'Assignment Title', canonTitle, titleText(variants.dash));
      } else {
        await updateTitle(variants.dash.id, 'Assignment Title', canonTitle, titleText(variants.dash));
      }
    } else if (variants.emDash && !variants.dash) {
      await updateTitle(variants.emDash.id, 'Assignment Title', canonTitle, titleText(variants.emDash));
    }
  }
}

// ── SECTION 3: Task dedup ──────────────────────────────────────────────────────
async function cleanupTasks() {
  console.log('\n' + '='.repeat(60) + '\nSECTION 3: Task Dedup\n' + '='.repeat(60));
  const tasks = await queryAll(process.env.NOTION_DB_TASKS);
  const live = tasks.filter(p => !p.archived);

  // 100-char norm for general cases.
  // Extra preprocessing for known near-dup patterns:
  //   - "Mark...Resolved in Notion." vs "Mark...Resolved." (differ at char 83)
  //   - "Build [the/a/] financial model for the Amora campground..." (wording variants)
  // Webinar transcript tasks intentionally NOT collapsed — each is a different session.
  const groups = {};
  for (const p of live) {
    const t = titleText(p);
    const cleaned = t
      .replace(/\b(as Resolved)\s+in Notion\.?/i, '$1.')
      .replace(/^Build the financial model for the Amora campground/i, 'Build a financial model for the Amora campground')
      .replace(/^Build financial model for Amora campground/i, 'Build a financial model for the Amora campground');
    const key = norm(cleaned, 100);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  let archived = 0;
  for (const [key, pages] of Object.entries(groups)) {
    if (pages.length < 2) continue;
    // Sort: Open/Done status preferred over Needs Owner; then richness; then oldest
    pages.sort((a, b) => {
      const aStatus = getPropValue(a, 'Status') || '';
      const bStatus = getPropValue(b, 'Status') || '';
      const aOpen = (aStatus === 'Open' || aStatus === 'Done') ? 1 : 0;
      const bOpen = (bStatus === 'Open' || bStatus === 'Done') ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;
      const diff = scoreRichness(b) - scoreRichness(a);
      if (diff !== 0) return diff;
      return new Date(a.created_time) - new Date(b.created_time);
    });
    const winner = pages[0];
    console.log(`\n  DUP x${pages.length}: "${key.slice(0, 80)}"`);
    console.log(`    KEEP [${getPropValue(winner,'Status')}]: "${titleText(winner).slice(0, 70)}" (score ${scoreRichness(winner)})`);
    for (const loser of pages.slice(1)) {
      console.log(`    ARCHIVE [${getPropValue(loser,'Status')}]: "${titleText(loser).slice(0, 60)}"`);
      await archivePage(loser.id, titleText(loser).slice(0, 60));
      archived++;
    }
  }

  if (archived === 0) console.log('  No duplicate tasks found');
  else console.log(`\n  Archived ${archived} duplicate tasks`);
}

// ── SECTION 4: Decision dedup ─────────────────────────────────────────────────
async function cleanupDecisions() {
  console.log('\n' + '='.repeat(60) + '\nSECTION 4: Decision Dedup\n' + '='.repeat(60));
  const decs = await queryAll(process.env.NOTION_DB_DECISION_CANDIDATES);
  const live = decs.filter(p => !p.archived);

  // Task-masquerading candidate — archive by pattern
  const TASK_LANG = /must be manually|should be sent|needs to be sent|please review|check if|to be determined/i;
  for (const p of live) {
    const t = titleText(p);
    const status = getPropValue(p, 'Status');
    if (TASK_LANG.test(t) && status === 'Candidate') {
      console.log(`\n  TASK-MASQUERADING Candidate: "${t.slice(0, 80)}"`);
      await archivePage(p.id, t.slice(0, 70));
    }
  }

  // Exact-norm dups — keep richest confirmed, archive others
  const groups = {};
  for (const p of live.filter(p => !p.archived)) {
    const t = titleText(p);
    const key = norm(t, 100);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  let archived = 0;
  for (const [key, pages] of Object.entries(groups)) {
    if (pages.length < 2) continue;
    pages.sort((a, b) => {
      // Prefer Confirmed status
      const aConf = getPropValue(a, 'Status') === 'Confirmed' ? 1 : 0;
      const bConf = getPropValue(b, 'Status') === 'Confirmed' ? 1 : 0;
      if (bConf !== aConf) return bConf - aConf;
      const diff = scoreRichness(b) - scoreRichness(a);
      if (diff !== 0) return diff;
      return new Date(a.created_time) - new Date(b.created_time);
    });
    const winner = pages[0];
    console.log(`\n  DUP x${pages.length}: "${key.slice(0, 80)}"`);
    console.log(`    KEEP: [${getPropValue(winner, 'Status')}] "${titleText(winner).slice(0, 60)}" (score ${scoreRichness(winner)})`);
    for (const loser of pages.slice(1)) {
      await archivePage(loser.id, `[${getPropValue(loser, 'Status')}] ${titleText(loser).slice(0, 50)}`);
      archived++;
    }
  }

  if (archived === 0) console.log('  No duplicate decisions found');
  else console.log(`\n  Archived ${archived} duplicate decisions`);
}

// ── SECTION 5: Project near-dup cleanup ───────────────────────────────────────
async function cleanupProjects() {
  console.log('\n' + '='.repeat(60) + '\nSECTION 5: Project Near-Dup Cleanup\n' + '='.repeat(60));
  const projects = await queryAll(process.env.NOTION_DB_PROJECTS);
  const live = projects.filter(p => !p.archived);

  const byTitle = {};
  for (const p of live) {
    byTitle[titleText(p)] = p;
  }

  // Campground variants — keep "Amora Campground and Events Hospitality Partnership" (Active/High)
  const campgroundVariants = [
    'Amora Campground and Events Hospitality Proposal',
    'Amora Campground and Events Hospitality - Solana Cosmica Partnership',
    'Amora Campground and Events Hospitality',
  ];
  const campgroundCanonical = byTitle['Amora Campground and Events Hospitality Partnership'];
  if (campgroundCanonical) {
    console.log(`\n  Campground canonical: "${titleText(campgroundCanonical)}" (${campgroundCanonical.id})`);
    for (const variant of campgroundVariants) {
      const page = byTitle[variant];
      if (page) {
        console.log(`  Archiving variant: "${variant}"`);
        await archivePage(page.id, variant);
      }
    }
  } else {
    console.log('\n  WARNING: Campground canonical "Amora Campground and Events Hospitality Partnership" not found');
    console.log('  Listing all campground variants found:');
    for (const [t, p] of Object.entries(byTitle)) {
      if (t.toLowerCase().includes('campground')) console.log(`    [${getPropValue(p,'Status')}] "${t}"`);
    }
  }

  // LMH variants — keep richest of "Living Memory Hub" vs "Amora Living Memory Hub"
  const lmh1 = byTitle['Living Memory Hub'];
  const lmh2 = byTitle['Amora Living Memory Hub'];
  if (lmh1 && lmh2) {
    const score1 = scoreRichness(lmh1), score2 = scoreRichness(lmh2);
    console.log(`\n  LMH variants: "Living Memory Hub" (score ${score1}) vs "Amora Living Memory Hub" (score ${score2})`);
    const winner = score1 >= score2 ? lmh1 : lmh2;
    const loser  = score1 >= score2 ? lmh2 : lmh1;
    console.log(`  Keep: "${titleText(winner)}"`);
    await archivePage(loser.id, titleText(loser));
  } else {
    console.log('\n  LMH variants: one or both already resolved');
    if (lmh1) console.log(`  Found: "Living Memory Hub"`);
    if (lmh2) console.log(`  Found: "Amora Living Memory Hub"`);
  }
}

// ── SECTION 6: Message dup cleanup ────────────────────────────────────────────
async function cleanupMessages() {
  console.log('\n' + '='.repeat(60) + '\nSECTION 6: Message Dedup\n' + '='.repeat(60));
  const msgs = await queryAll(process.env.NOTION_DB_MESSAGES);
  const live = msgs.filter(p => !p.archived);

  const groups = {};
  for (const p of live) {
    const t = titleText(p);
    const key = norm(t, 80);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  let archived = 0;
  for (const [key, pages] of Object.entries(groups)) {
    if (pages.length < 2) continue;
    pages.sort((a, b) => {
      const diff = scoreRichness(b) - scoreRichness(a);
      if (diff !== 0) return diff;
      return new Date(a.created_time) - new Date(b.created_time);
    });
    const winner = pages[0];
    console.log(`\n  DUP x${pages.length}: "${key.slice(0, 60)}"`);
    console.log(`    KEEP: (score ${scoreRichness(winner)})`);
    for (const loser of pages.slice(1)) {
      await archivePage(loser.id, titleText(loser).slice(0, 60));
      archived++;
    }
  }

  if (archived === 0) console.log('  No duplicate messages found');
  else console.log(`\n  Archived ${archived} duplicate messages`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`cleanup-remaining-noise — ${DRY_RUN ? 'DRY RUN' : 'LIVE (changes will apply)'}`);
  console.log('='.repeat(60));

  await cleanupProfiles();
  await cleanupRoleAssignments();
  await cleanupTasks();
  await cleanupDecisions();
  await cleanupProjects();
  await cleanupMessages();

  console.log('\n' + '='.repeat(60));
  console.log('Done.');
  if (DRY_RUN) console.log('(DRY RUN — no changes made. Set DRY_RUN=false to apply.)');
  console.log('='.repeat(60) + '\n');
}

main().catch(err => { console.error(err); process.exit(1); });
