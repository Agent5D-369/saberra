const fs = require('fs');
let src = fs.readFileSync('src/dashboard/views.ts', 'utf8');

// New inline SVG avatar - fills circle completely, pupils are separate DOM elements
const NEW_SVG = '<svg class="vera-avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Vera">'
  + '<defs>'
  + '<radialGradient id="vbg" cx="50%" cy="38%" r="72%"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#07080e"/></radialGradient>'
  + '<radialGradient id="vskin" cx="42%" cy="28%" r="68%"><stop offset="0%" stop-color="#f2d5b0"/><stop offset="100%" stop-color="#c8925a"/></radialGradient>'
  + '<radialGradient id="viris" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#c7d2fe"/><stop offset="40%" stop-color="#6366f1"/><stop offset="100%" stop-color="#312e81"/></radialGradient>'
  + '<radialGradient id="vlip" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="#e07888"/><stop offset="100%" stop-color="#9a3a50"/></radialGradient>'
  + '<filter id="vglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
  + '<clipPath id="vclip"><circle cx="48" cy="48" r="48"/></clipPath>'
  + '</defs>'
  + '<g clip-path="url(#vclip)">'
  // background
  + '<circle cx="48" cy="48" r="48" fill="url(#vbg)"/>'
  + '<circle cx="48" cy="36" r="32" fill="rgba(99,102,241,0.13)"/>'
  // hair back
  + '<path d="M12 46 Q6 22 28 10 Q48 3 68 10 Q90 22 84 46 Q81 64 77 84 Q68 98 56 98L40 98 Q28 98 19 84 Q15 64 12 46Z" fill="#0e0c2e"/>'
  // neck
  + '<rect x="41" y="73" width="14" height="14" rx="4" fill="#c8925a"/>'
  // face
  + '<ellipse cx="48" cy="46" rx="22" ry="27" fill="url(#vskin)"/>'
  + '<ellipse cx="48" cy="46" rx="22" ry="27" fill="none" stroke="rgba(160,90,30,0.18)" stroke-width="2"/>'
  // hair front crown
  + '<path d="M26 32 Q29 9 48 12 Q67 9 70 32 Q63 21 48 22 Q33 21 26 32Z" fill="#0e0c2e"/>'
  // hair side wisps
  + '<path d="M26 33 Q23 42 25 54" stroke="#181550" stroke-width="4" fill="none" stroke-linecap="round"/>'
  + '<path d="M70 33 Q73 42 71 54" stroke="#181550" stroke-width="4" fill="none" stroke-linecap="round"/>'
  // eyebrows
  + '<path d="M31 35 Q36 32 41 33.5" stroke="#22120a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
  + '<path d="M55 33.5 Q60 32 65 35" stroke="#22120a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
  // eye socket shadows
  + '<ellipse cx="36.5" cy="42" rx="8.5" ry="6.5" fill="rgba(160,90,30,0.14)"/>'
  + '<ellipse cx="59.5" cy="42" rx="8.5" ry="6.5" fill="rgba(160,90,30,0.14)"/>'
  // eye whites
  + '<ellipse cx="36.5" cy="42" rx="7.5" ry="5.2" fill="#f6f1e8"/>'
  + '<ellipse cx="59.5" cy="42" rx="7.5" ry="5.2" fill="#f6f1e8"/>'
  // irises
  + '<circle cx="36.5" cy="42" r="4.9" fill="url(#viris)"/>'
  + '<circle cx="59.5" cy="42" r="4.9" fill="url(#viris)"/>'
  // iris rim glow
  + '<circle cx="36.5" cy="42" r="4.9" fill="none" stroke="#a5b4fc" stroke-width="0.7" opacity="0.75"/>'
  + '<circle cx="59.5" cy="42" r="4.9" fill="none" stroke="#a5b4fc" stroke-width="0.7" opacity="0.75"/>'
  // pupils - translated by JS
  + '<g id="vera-pupil-l" class="vera-pupil">'
  + '<circle cx="36.5" cy="42" r="2.5" fill="#08071a"/>'
  + '<circle cx="37.9" cy="40.7" r="0.9" fill="white" opacity="0.95"/>'
  + '<circle cx="35.9" cy="43.1" r="0.45" fill="white" opacity="0.38"/>'
  + '</g>'
  + '<g id="vera-pupil-r" class="vera-pupil">'
  + '<circle cx="59.5" cy="42" r="2.5" fill="#08071a"/>'
  + '<circle cx="60.9" cy="40.7" r="0.9" fill="white" opacity="0.95"/>'
  + '<circle cx="58.9" cy="43.1" r="0.45" fill="white" opacity="0.38"/>'
  + '</g>'
  // upper eyelid lines
  + '<path d="M29 38 Q36.5 34.5 44 38" stroke="#110a04" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
  + '<path d="M52 38 Q59.5 34.5 67 38" stroke="#110a04" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
  // lower lash subtle
  + '<path d="M30 46 Q36.5 48 43 46" stroke="#b07848" stroke-width="0.45" fill="none" opacity="0.35"/>'
  + '<path d="M53 46 Q59.5 48 66 46" stroke="#b07848" stroke-width="0.45" fill="none" opacity="0.35"/>'
  // nose
  + '<path d="M45.5 52 Q48 57 50.5 52" stroke="#a86838" stroke-width="1" fill="none" stroke-linecap="round"/>'
  + '<ellipse cx="45.5" cy="55" rx="1.5" ry="1" fill="#a86838" opacity="0.28"/>'
  + '<ellipse cx="50.5" cy="55" rx="1.5" ry="1" fill="#a86838" opacity="0.28"/>'
  // lips
  + '<path d="M39.5 60.5 Q44 58 48 59 Q52 58 56.5 60.5 Q52 59 48 59.5 Q44 59 39.5 60.5Z" fill="#9a3a50"/>'
  + '<path d="M39.5 60.5 Q44 66 48 66 Q52 66 56.5 60.5 Q52.5 63.5 48 64 Q43.5 63.5 39.5 60.5Z" fill="url(#vlip)"/>'
  + '<ellipse cx="48" cy="63.5" rx="4.5" ry="1.5" fill="rgba(255,255,255,0.16)"/>'
  // cheek blush
  + '<ellipse cx="28.5" cy="52" rx="7" ry="4.5" fill="rgba(220,85,65,0.07)"/>'
  + '<ellipse cx="67.5" cy="52" rx="7" ry="4.5" fill="rgba(220,85,65,0.07)"/>'
  // digital forehead mark
  + '<circle cx="48" cy="24" r="1.4" fill="rgba(165,180,252,0.55)" filter="url(#vglow)"/>'
  + '<circle cx="48" cy="24" r="0.7" fill="#c7d2fe"/>'
  // clothing
  + '<path d="M0 98L0 84 Q16 73 38 72 Q48 71 48 71 Q48 71 58 72 Q80 73 96 84L96 98Z" fill="#1a1848"/>'
  + '<path d="M38.5 73 Q48 81 57.5 73" stroke="#2d2a6e" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
  // face atmosphere rim
  + '<ellipse cx="48" cy="46" rx="22" ry="27" fill="none" stroke="rgba(165,180,252,0.09)" stroke-width="3.5"/>'
  + '</g></svg>';

// Replace VERA_AVATAR_IMG const
const imgStart = src.indexOf('const VERA_AVATAR_IMG = `');
if (imgStart === -1) { console.error('VERA_AVATAR_IMG not found'); process.exit(1); }
const imgEnd = src.indexOf('`;\n', imgStart) + 3;
src = src.slice(0, imgStart) + 'const VERA_AVATAR_IMG = `' + NEW_SVG + '`;\n' + src.slice(imgEnd);
console.log('Replaced VERA_AVATAR_IMG');

// New pupil-tracking JS to replace the tilt block
const NEW_EYE_JS = [
  '  // -- Vera eye tracking -- pupils follow the cursor ---',
  '  (function() {',
  "    var wrap   = document.getElementById('vera-avatar-wrap');",
  '    if (!wrap) return;',
  "    var pupilL = document.getElementById('vera-pupil-l');",
  "    var pupilR = document.getElementById('vera-pupil-r');",
  '    if (!pupilL || !pupilR) return;',
  '    var MAX = 1.9;',
  '    function movePupils(mx, my) {',
  '      var rect = wrap.getBoundingClientRect();',
  '      var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;',
  '      var dx = mx - cx, dy = my - cy;',
  '      var dist = Math.sqrt(dx * dx + dy * dy);',
  '      var t = dist > 0 ? Math.min(1, Math.log(dist / 20 + 1) / Math.log(8)) : 0;',
  '      var nx = (dist > 0 ? dx / dist : 0) * t * MAX;',
  '      var ny = (dist > 0 ? dy / dist : 0) * t * MAX;',
  "      var v = 'translate(' + nx.toFixed(2) + ',' + ny.toFixed(2) + ')';",
  "      pupilL.setAttribute('transform', v);",
  "      pupilR.setAttribute('transform', v);",
  '    }',
  '    function resetPupils() {',
  "      pupilL.setAttribute('transform', 'translate(0,0)');",
  "      pupilR.setAttribute('transform', 'translate(0,0)');",
  '    }',
  "    var isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);",
  '    if (!isMobile) {',
  "      document.addEventListener('mousemove', function(e) { movePupils(e.clientX, e.clientY); });",
  "      document.addEventListener('mouseleave', resetPupils);",
  '    } else {',
  '      if (window.DeviceOrientationEvent) {',
  "        window.addEventListener('deviceorientation', function(e) {",
  '          if (e.gamma === null) return;',
  '          var rect = wrap.getBoundingClientRect();',
  '          movePupils(',
  '            (e.gamma / 45) * window.innerWidth  / 2 + rect.left + rect.width  / 2,',
  '            ((e.beta - 45) / 45) * window.innerHeight / 2 + rect.top + rect.height / 2',
  '          );',
  '        });',
  '      }',
  "      wrap.addEventListener('click', function() {",
  "        var whites = wrap.querySelectorAll('ellipse[rx=\"7.5\"]');",
  '        whites.forEach(function(w) {',
  "          var ry = w.getAttribute('ry');",
  "          w.setAttribute('ry', '0.5');",
  "          setTimeout(function() { w.setAttribute('ry', ry); }, 180);",
  '        });',
  '      });',
  '    }',
  '  })();',
  ''
].join('\n');

const TILT_MARKER = '  // ── Vera tilt (desktop: mouse, mobile: gyro)';
const tiltStart = src.indexOf(TILT_MARKER);
if (tiltStart === -1) { console.error('Tilt marker not found'); process.exit(1); }
const AFTER_IIFE = '\n  })();\n';
const tiltEndPos = src.indexOf(AFTER_IIFE, tiltStart);
if (tiltEndPos === -1) { console.error('Tilt end IIFE not found'); process.exit(1); }
const tiltEnd = tiltEndPos + AFTER_IIFE.length;

src = src.slice(0, tiltStart) + NEW_EYE_JS + src.slice(tiltEnd);
console.log('Replaced tilt JS with pupil-tracking JS');

fs.writeFileSync('src/dashboard/views.ts', src);
console.log('Done. File length:', src.length);
