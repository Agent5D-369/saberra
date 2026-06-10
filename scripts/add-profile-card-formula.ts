/**
 * Adds a "Profile Card" formula property to the Profiles database.
 *
 * The formula produces a multi-line "dashboard" card showing:
 *   Status indicator + Engagement + Type + Relationship
 *   Role / Title
 *   📍 Location
 *   🏷  Tags
 *   📊 Activity metrics (meetings, tasks, roles)
 *   📅 First seen · Last seen
 *   ⚠️  Sensitive flag (only when set)
 *
 * Safe to re-run — if the property already exists it is updated in place.
 *
 * Usage: npx ts-node scripts/add-profile-card-formula.ts
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

// ── Formula ───────────────────────────────────────────────────────────────────
//
// Line 1: Status dot + Engagement + Profile Type + Relationship
// Line 2: Role / Title (if set)
// Line 3: 📍 Location (if set)
// Line 4: 🏷  Tags (if any)
// (blank line separator)
// Line 5: 📊 meetings · tasks · roles  (activity metrics from relations)
// Line 6: 📅 Since <First Seen> · Last <Last Seen>
// Line 7: ⚠️  Sensitive flag (only when checkbox is on)

// Notion Formula 2.0 notes (discovered via API probing):
//   - empty() is a function, not a value — use empty(prop("X")) not prop("X") == empty
//   - relation properties work with length() in formulas
//   - multi-select works with join() and length()
//   - date format "MMM YYYY" is valid in formatDate()

const FORMULA = `concat(
  if(prop("Engagement Status") == "Active", "🟢 ", if(prop("Engagement Status") == "Inactive", "🔴 ", if(prop("Engagement Status") == "Prospect", "🟡 ", "⚪ "))),
  if(prop("Engagement Status") != "", prop("Engagement Status"), "Unknown"),
  " · ",
  if(prop("Profile Type") != "", prop("Profile Type"), "—"),
  if(prop("Relationship to Amora") != "" and prop("Relationship to Amora") != "Unknown", " · " + prop("Relationship to Amora"), ""),
  "\n",
  if(prop("Role / Title") != "", prop("Role / Title") + "\n", ""),
  if(prop("Location") != "", "📍 " + prop("Location") + "\n", ""),
  if(length(prop("Tags")) > 0, "🏷  " + join(prop("Tags"), " · ") + "\n", ""),
  "\n",
  "📊 " + format(length(prop("Meetings Organized"))) + " meetings · " + format(length(prop("Tasks Owned"))) + " tasks · " + format(length(prop("Role Assignments Held"))) + " roles",
  if(not empty(prop("First Seen")), "\n📅 Since " + formatDate(prop("First Seen"), "MMM YYYY"), ""),
  if(not empty(prop("Last Seen")), " · Last " + formatDate(prop("Last Seen"), "MMM YYYY"), ""),
  if(prop("Sensitive Notes Flag"), "\n⚠️  Sensitive flag", "")
)`.replace(/\n\s*/g, ' ').trim();

async function main() {
  console.log('\n' + '='.repeat(72));
  console.log('  Add "Profile Card" formula to Profiles database');
  console.log('='.repeat(72) + '\n');

  console.log('Applying formula property...');
  const r = await fetch(`${BASE}/databases/${PROFILES_DB}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      properties: {
        'Profile Card': {
          formula: { expression: FORMULA },
        },
      },
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Notion API ${r.status}: ${text}`);
  }

  const db = await r.json() as any;
  const prop = db.properties?.['Profile Card'];
  if (prop?.type === 'formula') {
    console.log('  OK — "Profile Card" formula property added/updated');
    console.log(`\n  Expression:\n  ${FORMULA.slice(0, 120)}...`);
  } else {
    console.log('  Unexpected response — check Notion manually');
  }

  console.log('\n  Tip: In gallery or board view, set "Profile Card" as the card body');
  console.log('       property for a rich at-a-glance profile overview.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
