/**
 * Replaces the "Profile Card" formula on the Profiles database with a
 * comprehensive, layout-ready version.
 *
 * Steps:
 *   1. Remove the six _test_* rollup properties
 *   2. Add six permanent rollup count properties (per-profile, accurate)
 *   3. Update the "Profile Card" formula to use those rollups
 *
 * Rollup counts are used instead of length(prop("relation")) because Notion
 * formulas return the total database size for relation length — rollups
 * correctly scope counts to each profile.
 *
 * Usage: npx ts-node scripts/update-profile-card-formula.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const NOTION_KEY  = process.env.NOTION_API_KEY;
const PROFILES_DB = process.env.NOTION_DB_PROFILES;

if (!NOTION_KEY)    { console.error('NOTION_API_KEY required'); process.exit(1); }
if (!PROFILES_DB)   { console.error('NOTION_DB_PROFILES required'); process.exit(1); }

const BASE = 'https://api.notion.com/v1';
const H = {
  Authorization: `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// ── Rollup properties to add ──────────────────────────────────────────────────

const ROLLUPS: Array<{
  name: string;
  relation: string;
  rollupProp: string;
}> = [
  { name: '# Tasks',         relation: 'Tasks Owned',           rollupProp: 'Task'             },
  { name: '# Meetings Led',  relation: 'Meetings Organized',    rollupProp: 'Meeting Title'    },
  { name: '# Meetings In',   relation: 'Meetings Attended',     rollupProp: 'Meeting Title'    },
  { name: '# Roles',         relation: 'Role Assignments Held', rollupProp: 'Assignment Title' },
  { name: '# Circles Led',   relation: 'Circles Led',           rollupProp: 'Circle Name'      },
  { name: '# Projects Led',  relation: 'Projects Led',          rollupProp: 'Project Name'     },
];

// ── Formula ───────────────────────────────────────────────────────────────────
//
// Section 1  Identity — status dot + engagement + type + relationship + title
// Section 2  Contact  — email · phone · location
// Section 3  Tags
// ─────────────────────────
// Section 4  Timeline — member since · last seen · source
// Section 5  Activity — meetings led/attended · tasks · roles · circles · projects
// ─────────────────────────
// Section 6  Context summary (full text when set)
// ─────────────────────────
// Section 7  Sensitive flag warning (only when checked)
//
// Notes on Notion Formula 2.0 quirks found via API probing:
//   • Use not empty(prop("X")) for all null checks — works universally across types
//   • email/phone_number properties return `empty` (not "") when unset, so != "" gives false positives
//   • length(prop("relation")) returns DB total — use rollup count props instead
//   • rollup number props are accessed with prop("# Foo") and return a number

const DIV = '"\\n────────────────────────────────────────"';

const FORMULA = `concat(
  if(prop("Engagement Status") == "Active", "🟢  ", if(prop("Engagement Status") == "Inactive", "🔴  ", if(prop("Engagement Status") == "Prospect", "🟡  ", "⚪  "))),
  if(prop("Engagement Status") != "", prop("Engagement Status"), "Unknown"),
  "   ·   ",
  if(prop("Profile Type") != "", prop("Profile Type"), "—"),
  if(prop("Relationship to Amora") != "" and prop("Relationship to Amora") != "Unknown", "   ·   " + prop("Relationship to Amora"), ""),
  if(prop("Role / Title") != "", "\\n" + prop("Role / Title"), ""),
  if(not empty(prop("Email")), "\\n📧  " + prop("Email"), ""),
  if(not empty(prop("Phone")), "   📞  " + prop("Phone"), ""),
  if(prop("Location") != "", "   📍  " + prop("Location"), ""),
  if(length(prop("Tags")) > 0, "\\n🏷   " + join(prop("Tags"), "  ·  "), ""),
  ${DIV},
  "\\n📅  ",
  if(not empty(prop("First Seen")), "Since " + formatDate(prop("First Seen"), "MMM YYYY"), "—"),
  if(not empty(prop("Last Seen")), "   ·   Last seen " + formatDate(prop("Last Seen"), "MMM YYYY"), ""),
  if(prop("Source") != "", "\\n    Source: " + prop("Source"), ""),
  "\\n\\n📊  Meetings: " + format(prop("# Meetings Led")) + " led  ·  " + format(prop("# Meetings In")) + " attended",
  "\\n    Tasks: " + format(prop("# Tasks")),
  if(prop("# Roles") > 0, "   ·   Roles: " + format(prop("# Roles")), ""),
  if(prop("# Circles Led") > 0, "   ·   Circles led: " + format(prop("# Circles Led")), ""),
  if(prop("# Projects Led") > 0, "   ·   Projects: " + format(prop("# Projects Led")), ""),
  if(prop("Context Summary") != "", ${DIV} + "\\n" + prop("Context Summary"), ""),
  if(prop("Sensitive Notes Flag"), ${DIV} + "\\n⚠️  SENSITIVE — review Admin Notes before sharing", "")
)`.replace(/\n\s*/g, ' ').trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function patchDb(properties: object): Promise<{ ok: boolean; message?: string }> {
  const r = await fetch(`${BASE}/databases/${PROFILES_DB}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties }),
  });
  if (!r.ok) {
    const d = await r.json() as any;
    return { ok: false, message: d.message ?? String(r.status) };
  }
  return { ok: true };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(72));
  console.log('  Update Profile Card formula — rollup counts + comprehensive layout');
  console.log('='.repeat(72) + '\n');

  // 1. Remove test properties
  console.log('── Step 1: Remove _test_* properties ───────────────────────────────────');
  const testProps = ['_test_tasks', '_test_meetorg', '_test_meetatt', '_test_roles', '_test_circles', '_test_projects'];
  const removals = Object.fromEntries(testProps.map(k => [k, null]));
  const rm = await patchDb(removals);
  if (rm.ok) console.log('   Removed 6 test properties');
  else console.log('   WARN: ' + rm.message);

  // 2. Add rollup count properties
  console.log('\n── Step 2: Add rollup count properties ──────────────────────────────────');
  for (const rp of ROLLUPS) {
    const res = await patchDb({
      [rp.name]: {
        rollup: {
          relation_property_name: rp.relation,
          rollup_property_name: rp.rollupProp,
          function: 'count',
        },
      },
    });
    if (res.ok) console.log(`   OK    "${rp.name}"  (${rp.relation})`);
    else        console.log(`   FAIL  "${rp.name}" — ${res.message}`);
    await new Promise(r => setTimeout(r, 300));
  }

  // 3. Update the formula
  console.log('\n── Step 3: Update "Profile Card" formula ────────────────────────────────');
  const res = await patchDb({
    'Profile Card': { formula: { expression: FORMULA } },
  });
  if (res.ok) console.log('   OK    "Profile Card" formula updated');
  else        console.log('   FAIL  ' + res.message);

  console.log('\n' + '='.repeat(72));
  console.log('  Done.');
  console.log('  Add "Profile Card" as the first property in the profile page layout');
  console.log('  to use it as the top-of-page summary panel.');
  console.log('='.repeat(72) + '\n');
}

main().catch(err => { console.error(err); process.exit(1); });
