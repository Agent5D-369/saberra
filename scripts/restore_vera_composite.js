const fs = require('fs');

// ── 1. Extract original base64 PNG from views.classic.ts ──────────────────
const classic = fs.readFileSync('src/dashboard/views.classic.ts', 'utf8');
const b64Start = classic.indexOf('data:image/png;base64,') + 'data:image/png;base64,'.length;
const b64End   = classic.indexOf('"', b64Start);
const b64      = classic.slice(b64Start, b64End);
console.log('Base64 length:', b64.length);

// ── 2. Build composite VERA_AVATAR_IMG ────────────────────────────────────
// - <img> with original portrait (CSS .vera-avatar handles sizing)
// - <svg> overlay with only the moveable pupils
// Eye positions calibrated from visual inspection of 96x96 image:
//   left eye center ≈ (29, 36), right eye center ≈ (62, 36)
//   Pupil dark overlay r=4.5 covers the original fixed pupil entirely
const NEW_IMG =
  '<img class="vera-avatar" src="data:image/png;base64,' + b64 + '">'
  + '<svg id="vera-eyes-overlay" xmlns="http://www.w3.org/2000/svg"'
  + ' style="position:absolute;top:0;left:0;pointer-events:none"'
  + ' width="96" height="96" viewBox="0 0 96 96">'
  + '<g id="vera-pupil-l" class="vera-pupil">'
  + '<circle cx="29" cy="36" r="4.5" fill="#120b06"/>'
  + '<circle cx="30.4" cy="34.7" r="1.3" fill="white" opacity="0.82"/>'
  + '<circle cx="28.2" cy="37.2" r="0.6" fill="white" opacity="0.32"/>'
  + '</g>'
  + '<g id="vera-pupil-r" class="vera-pupil">'
  + '<circle cx="62" cy="36" r="4.5" fill="#120b06"/>'
  + '<circle cx="63.4" cy="34.7" r="1.3" fill="white" opacity="0.82"/>'
  + '<circle cx="61.2" cy="37.2" r="0.6" fill="white" opacity="0.32"/>'
  + '</g>'
  + '</svg>';

// ── 3. Patch views.ts ─────────────────────────────────────────────────────
let src = fs.readFileSync('src/dashboard/views.ts', 'utf8');

// Replace VERA_AVATAR_IMG const
const imgStart = src.indexOf('const VERA_AVATAR_IMG = `');
if (imgStart === -1) { console.error('VERA_AVATAR_IMG not found'); process.exit(1); }

// Find end: the closing `; that ends the template literal
// The SVG ends with ...></svg>`; so we search for backtick+semicolon+newline
const imgEnd = src.indexOf('`;\n', imgStart) + 3;
src = src.slice(0, imgStart) + 'const VERA_AVATAR_IMG = `' + NEW_IMG + '`;\n' + src.slice(imgEnd);
console.log('Replaced VERA_AVATAR_IMG');

// Add position:relative to .vera-avatar-wrap so the SVG overlay can be positioned
src = src.replace(
  '.vera-avatar-wrap{flex-shrink:0;width:96px;height:96px;border-radius:50%;overflow:hidden;',
  '.vera-avatar-wrap{flex-shrink:0;position:relative;width:96px;height:96px;border-radius:50%;overflow:hidden;'
);
console.log('Added position:relative to .vera-avatar-wrap');

fs.writeFileSync('src/dashboard/views.ts', src);
console.log('Done. File length:', src.length);
