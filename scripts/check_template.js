const fs = require('fs');
const src = fs.readFileSync('src/dashboard/views.ts', 'utf8');
const lines = src.split('\n');

let pos = 0;
for (let i = 0; i < 877; i++) pos += lines[i].length + 1;

const btPos = src.indexOf('`', pos);
console.log('Template literal opens at char', btPos, '(line 878)');

let i = btPos + 1;

function skipNestedTemplate(src, i) {
  // We've already consumed the opening backtick; skip until matching close backtick
  while (i < src.length) {
    const c = src[i];
    if (c === '`') return i + 1; // found closing backtick
    if (c === '$' && src[i+1] === '{') {
      i = skipInterpolation(src, i + 2);
      continue;
    }
    i++;
  }
  return i;
}

function skipInterpolation(src, i) {
  // We've already consumed '${'; skip until matching '}'
  let depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i + 1; }
    else if (c === '`') { i = skipNestedTemplate(src, i + 1); continue; }
    i++;
  }
  return i;
}

while (i < src.length) {
  const ch = src[i];
  if (ch === '`') {
    const lineNum = src.substring(0, i).split('\n').length;
    console.log('Template literal CLOSES at char', i, '(line', lineNum, ')');
    break;
  }
  if (ch === '$' && src[i+1] === '{') {
    i = skipInterpolation(src, i + 2);
    continue;
  }
  i++;
}
