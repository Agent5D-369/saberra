import * as fs from 'fs';
import * as path from 'path';
import type { DashboardData, CollapsePatternName } from './queries';
import { COLLAPSE_PATTERNS } from './queries';

const SABERRA_ICON_B64 = fs.readFileSync(path.join(__dirname, 'saberra-icon.b64'), 'utf8').trim();

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmt(iso: string | null): string {
  if (!iso) return '<span class="dim">Never</span>';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: true, timeZone: 'America/Costa_Rica',
  });
}

function num(n: number): string {
  return n.toLocaleString();
}

function dayLabel(iso: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(iso + 'T12:00:00').getDay()];
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg:#0b0f1a;
  --surface:#111827;
  --card:#1a2235;
  --card-border:#1f2d42;
  --text:#e8edf5;
  --muted:#6b7a96;
  --border:#1f2d42;
  --accent:#6366f1;
  --accent-glow:rgba(99,102,241,0.15);
  --green:#10b981;
  --amber:#f59e0b;
  --red:#ef4444;
  --chart-grid:rgba(255,255,255,0.06);
  --chart-text:#6b7a96;
  --shadow:0 4px 24px rgba(0,0,0,0.4);
  --radius:12px;
}
[data-theme="light"]{
  --bg:#f0f4f8;
  --surface:#ffffff;
  --card:#ffffff;
  --card-border:#e2e8f0;
  --text:#0f172a;
  --muted:#64748b;
  --border:#e2e8f0;
  --accent:#4f46e5;
  --accent-glow:rgba(79,70,229,0.08);
  --green:#059669;
  --amber:#d97706;
  --red:#dc2626;
  --chart-grid:rgba(0,0,0,0.07);
  --chart-text:#64748b;
  --shadow:0 2px 12px rgba(0,0,0,0.08);
}

html{transition:background .25s,color .25s}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.5;min-height:100vh}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}

/* ─── Header ──────────────────────────────────────────── */
header{
  background:linear-gradient(135deg,#1a1040 0%,#0f1a3a 60%,#0a1628 100%);
  border-bottom:1px solid rgba(99,102,241,0.2);
  padding:0 28px;
  display:flex;align-items:center;justify-content:space-between;
  height:56px;
  position:sticky;top:0;z-index:100;
  backdrop-filter:blur(12px);
}
[data-theme="light"] header{background:linear-gradient(135deg,#4f46e5 0%,#3730a3 100%);border-bottom:none}
.header-left{display:flex;align-items:center;gap:12px}
.header-logo{font-size:16px;font-weight:700;color:#fff;letter-spacing:-.3px;display:flex;align-items:center;gap:8px}
.header-logo span{color:#a5b4fc}
.header-saberra-icon{width:24px;height:24px;border-radius:4px;flex-shrink:0}
.status-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.status-dot.ok{background:var(--green);box-shadow:0 0 6px var(--green)}
.status-dot.warn{background:var(--amber)}
.status-dot.err{background:var(--red)}
.status-label{font-size:12px;color:rgba(255,255,255,0.65)}
.header-right{display:flex;align-items:center;gap:12px;flex-shrink:0}
.header-meta{font-size:12px;color:rgba(255,255,255,0.55);white-space:nowrap}
.btn-ghost{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;transition:background .15s;white-space:nowrap}
.btn-ghost:hover{background:rgba(255,255,255,0.18)}
@media(max-width:640px){
  header{padding:0 14px;flex-wrap:nowrap;overflow:hidden}
  .header-logo span{display:none}
  .header-meta{display:none}
  .status-label{display:none}
  .btn-ghost.btn-reload{display:none}
  .header-right{gap:6px}
  .btn-ghost{padding:5px 9px;font-size:11px}
}

/* ─── Layout ───────────────────────────────────────────── */
.wrap{max-width:1240px;margin:0 auto;padding:28px 24px}
section{background:var(--surface);border:1px solid var(--card-border);border-radius:var(--radius);padding:22px 24px;margin-bottom:20px;box-shadow:var(--shadow)}
h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-bottom:16px}

/* ─── Hero cards ───────────────────────────────────────── */
.hero-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
@media(max-width:900px){.hero-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:500px){.hero-grid{grid-template-columns:1fr}}
.hero-card{border-radius:var(--radius);padding:20px 22px;position:relative;overflow:hidden;cursor:default}
.hero-card::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.04);opacity:0;transition:opacity .2s}
.hero-card:hover::after{opacity:1}
.hero-card.g1{background:linear-gradient(135deg,#f59e0b,#ef4444)}
.hero-card.g2{background:linear-gradient(135deg,#3b82f6,#6366f1)}
.hero-card.g3{background:linear-gradient(135deg,#10b981,#3b82f6)}
.hero-card.g4{background:linear-gradient(135deg,#8b5cf6,#ec4899)}
.hero-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.7px;color:rgba(255,255,255,0.75);margin-bottom:6px}
.hero-value{font-size:38px;font-weight:800;color:#fff;line-height:1;letter-spacing:-1px}
.hero-sub{font-size:11px;color:rgba(255,255,255,0.6);margin-top:6px}

/* ─── Charts ───────────────────────────────────────────── */
.chart-grid{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px}
@media(max-width:768px){.chart-grid{grid-template-columns:1fr}}
.chart-card{background:var(--surface);border:1px solid var(--card-border);border-radius:var(--radius);padding:20px 24px;box-shadow:var(--shadow)}
.chart-wrap{position:relative;height:180px}
.chart-empty{display:flex;align-items:center;justify-content:center;height:180px;color:var(--muted);font-size:13px;font-style:italic}

/* ─── Banner ───────────────────────────────────────────── */
.banner{border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px}
.banner.ok{background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:var(--green)}
.banner.warn{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:var(--amber)}
.banner.err{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:var(--red)}

/* ─── Queue cards ──────────────────────────────────────── */
.queue-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.q-card{background:var(--card);border:1px solid var(--card-border);border-radius:10px;padding:16px;transition:border-color .15s,box-shadow .15s;display:block;color:inherit;text-decoration:none}
.q-card:hover{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);text-decoration:none}
.q-label{font-size:11px;color:var(--muted);margin-bottom:6px;font-weight:500}
.q-desc{font-size:11px;color:var(--muted);margin-top:4px;opacity:.7;display:flex;align-items:center;gap:5px}
.q-notion-hint{opacity:0;transition:opacity .15s;font-size:10px;color:var(--accent)}
.q-card:hover .q-notion-hint{opacity:1}
.q-value{font-size:28px;font-weight:700;line-height:1}
.q-value.zero{color:var(--muted)}
.q-value.warn{color:var(--amber)}
.q-value.high{color:var(--red)}

/* ─── System settings ─────────────────────────────────── */
.cfg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.cfg-item{background:var(--card);border:1px solid var(--card-border);border-radius:10px;padding:14px 16px}
.cfg-label{font-size:11px;color:var(--muted);font-weight:500;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px}
.cfg-value{font-size:13px;font-weight:600;color:var(--text);word-break:break-all}
.cfg-value.mono{font-family:'SF Mono',monospace;font-size:12px}
.cfg-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.cfg-badge.on{background:rgba(16,185,129,0.15);color:var(--green)}
.cfg-badge.off{background:rgba(107,122,150,0.15);color:var(--muted)}

/* ─── Stat cards ───────────────────────────────────────── */
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:700px){.stat-grid{grid-template-columns:repeat(2,1fr)}}
.stat-card{background:var(--card);border:1px solid var(--card-border);border-radius:10px;padding:16px}
.s-label{font-size:11px;color:var(--muted);margin-bottom:4px;font-weight:500}
.s-value{font-size:26px;font-weight:700;line-height:1;color:var(--text)}
.s-value.warn{color:var(--amber)}
.s-sub{font-size:11px;color:var(--muted);margin-top:4px;opacity:.8}

/* ─── Health row ───────────────────────────────────────── */
.health-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.h-card{background:var(--card);border:1px solid var(--card-border);border-radius:10px;padding:14px 16px}
.h-label{font-size:11px;color:var(--muted);margin-bottom:4px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}
.h-value{font-size:13px;font-weight:500}
.h-value.ok{color:var(--green)}.h-value.warn{color:var(--red)}

/* ─── Table ────────────────────────────────────────────── */
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:11px;font-weight:600;color:var(--muted);padding:8px 12px;border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px}
td{padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:top;font-size:13px}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--accent-glow)}
.errtxt{color:var(--red);font-size:12px;max-width:280px;word-break:break-word}
.mono{font-family:'SF Mono',monospace;font-size:11px}
.dim{color:var(--muted);font-size:12px}
p.dim{font-style:italic;font-size:13px;padding:4px 0}

/* ─── Buttons ──────────────────────────────────────────── */
.btn{background:var(--accent);color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:12px;font-weight:500;transition:opacity .15s}
.btn:hover{opacity:.85}

/* ─── Sera Chat — full-width panel ────────────────────── */
/* Chat tab breaks out of .wrap horizontal+vertical padding for full-bleed */
#tab-sera-chat{margin:-28px -24px;padding:0}
.chat-container{display:flex;height:calc(100vh - 100px);min-height:520px;border-radius:0;border:none;border-top:1px solid var(--card-border);background:var(--surface);overflow:hidden}
.chat-sidebar{width:220px;flex-shrink:0;background:var(--card);border-right:1px solid var(--card-border);display:flex;flex-direction:column;overflow:hidden;transition:width .2s ease}
.chat-new-btn{margin:0;flex:1;padding:9px 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s;text-align:left}
.chat-new-btn:hover{opacity:.85}
.chat-thread-list{flex:1;overflow-y:auto;padding:0 8px 8px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.chat-thread-list::-webkit-scrollbar{width:3px}
.chat-thread-list::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.chat-thread-item{position:relative;padding:9px 30px 9px 10px;border-radius:7px;cursor:pointer;transition:background .12s;margin-bottom:2px;border:1px solid transparent}
.chat-thread-item:hover{background:var(--accent-glow)}
.chat-thread-item.active{background:var(--accent-glow);border-color:rgba(99,102,241,0.3)}
.chat-thread-title{font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-thread-meta{font-size:10px;color:var(--muted);margin-top:2px}
.chat-thread-del{position:absolute;top:50%;right:5px;transform:translateY(-50%);background:none;border:none;color:var(--muted);font-size:16px;line-height:1;cursor:pointer;opacity:0;transition:opacity .12s,color .12s;padding:1px 4px;border-radius:3px}
.chat-thread-item:hover .chat-thread-del{opacity:1}
.chat-thread-del:hover{color:var(--red);background:rgba(239,68,68,0.1)}
.chat-main{flex:1;min-width:0;display:flex;flex-direction:column;padding:0;overflow:hidden}
.chat-messages{flex:1;overflow-y:auto;padding:18px 8px 8px;display:flex;flex-direction:column;gap:14px;scrollbar-width:thin;scrollbar-color:var(--border) transparent;min-height:0}
.chat-messages::-webkit-scrollbar{width:4px}
.chat-messages::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.chat-msg{display:flex;gap:10px;align-items:flex-start;min-width:0;width:100%}
.chat-msg.user{flex-direction:row-reverse}
.chat-bubble-wrap{display:flex;flex-direction:column;align-items:flex-end;max-width:65%}
.chat-msg.user .chat-bubble{max-width:100%}
.chat-bubble{padding:10px 14px;border-radius:12px;font-size:13.5px;line-height:1.65;word-break:break-word;overflow-wrap:break-word;min-width:0;max-width:100%}
.chat-msg.user .chat-bubble{background:var(--accent);color:#fff;border-radius:12px 12px 2px 12px}
.chat-msg.sera .chat-bubble{background:var(--card);border:1px solid var(--card-border);border-radius:12px 12px 12px 2px}
.chat-avatar{width:30px;height:30px;border-radius:50%;flex-shrink:0;min-width:30px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff}
.chat-avatar.user-icon{background:var(--accent)}
/* Sources: collapsed <details> — click to expand */
.chat-sources{margin-top:10px}
.chat-sources summary{font-size:10.5px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:5px;padding:3px 0;user-select:none}
.chat-sources summary::-webkit-details-marker{display:none}
.chat-sources summary::before{content:'▸';font-size:9px;display:inline-block;transition:transform .15s;opacity:.7}
.chat-sources[open] summary::before{transform:rotate(90deg)}
.chat-sources summary:hover{color:var(--text)}
.chat-sources-list{padding-top:7px;border-top:1px solid rgba(255,255,255,0.08);margin-top:5px}
[data-theme="light"] .chat-sources-list{border-top-color:var(--border)}
.chat-source-link{display:block;font-size:11px;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;line-height:1.4}
.chat-thinking{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px;font-style:italic;padding:6px 8px;width:100%}
.chat-thinking-active{color:var(--text);background:var(--accent-glow);border-radius:8px;padding:8px 12px;border:1px solid var(--border);font-style:normal;font-weight:500}
.chat-thinking-active .chat-thinking-dots span{background:var(--accent)}
.chat-thinking-dots{display:flex;gap:3px}
.chat-thinking-dots span{width:5px;height:5px;border-radius:50%;background:var(--muted);animation:chatDot 1.2s infinite ease-in-out}
.chat-thinking-dots span:nth-child(2){animation-delay:.2s}
.chat-thinking-dots span:nth-child(3){animation-delay:.4s}
@keyframes chatDot{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}
.chat-input-row{display:flex;gap:8px;padding:12px 10px;border-top:1px solid var(--card-border);flex-shrink:0;width:100%;box-sizing:border-box}
.chat-input{flex:1;min-width:0;background:var(--card);border:1px solid var(--card-border);border-radius:10px;color:var(--text);font-size:13px;padding:10px 14px;resize:none;min-height:44px;max-height:140px;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s}
.chat-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(99,102,241,0.12)}
.chat-send{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 18px;cursor:pointer;font-size:13px;font-weight:600;transition:opacity .15s;white-space:nowrap;align-self:flex-end;flex-shrink:0}
.chat-send:hover{opacity:.85}
.chat-send:disabled{opacity:.4;cursor:not-allowed}
.chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:12px;color:var(--muted);padding:40px 0}
.chat-empty-icon{font-size:36px;opacity:.5}
.chat-empty-text{font-size:13px;text-align:center;max-width:300px;line-height:1.6}
.chat-tokens{font-size:10px;color:var(--muted);text-align:center;padding:4px 20px 6px;opacity:.6;flex-shrink:0}
@media(max-width:600px){.chat-sidebar{width:150px}.chat-thread-title{font-size:11px}.chat-input-row{padding:10px 8px}.chat-bubble-wrap{max-width:80%}}

/* ─── Sera tip panel ───────────────────────────────────── */
.sera-panel{display:flex;align-items:center;gap:20px;background:var(--surface);border:1px solid var(--card-border);border-left:3px solid var(--accent);border-radius:var(--radius);padding:18px 22px;margin-bottom:20px;box-shadow:var(--shadow);position:relative;overflow:hidden;min-height:112px}
.sera-panel::before{content:'';position:absolute;inset:0;background:var(--accent-glow);pointer-events:none}
.sera-avatar-wrap{flex-shrink:0;position:relative;width:96px;height:96px;border-radius:50%;overflow:hidden;box-shadow:0 0 24px rgba(99,102,241,0.5);cursor:pointer}
.sera-avatar{width:100%;height:100%;object-fit:cover;display:block;transition:transform .08s ease-out;will-change:transform}
.sera-body{flex:1;min-width:0}
.sera-badge{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:2px 8px;border-radius:4px;margin-bottom:6px}
.sera-badge.tip{background:rgba(99,102,241,0.2);color:#a5b4fc}
.sera-badge.didyouknow{background:rgba(16,185,129,0.15);color:#6ee7b7}
.sera-badge.protip{background:rgba(245,158,11,0.15);color:#fcd34d}
.sera-badge.aboutsera{background:rgba(99,102,241,0.2);color:#a5b4fc}
.sera-badge.tealpillar{background:rgba(20,184,166,0.18);color:#5eead4}
.sera-tip-text{font-size:13px;color:var(--text);line-height:1.55;opacity:0;transition:opacity .4s ease}
.sera-tip-text.visible{opacity:1}
.sera-dots{display:flex;gap:5px;margin-top:10px}
.sera-dot{width:5px;height:5px;border-radius:50%;background:var(--muted);transition:background .3s,transform .3s;cursor:pointer}
.sera-dot.active{background:var(--accent);transform:scale(1.3)}

/* ─── Role health panel ────────────────────────────────── */
.rh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.rh-item{display:flex;flex-direction:column;gap:4px;background:var(--card);border:1px solid var(--card-border);border-radius:10px;padding:12px 14px;transition:border-color .15s}
a.rh-item:hover{border-color:var(--accent);cursor:pointer}
.rh-badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;padding:2px 7px;border-radius:4px;display:inline-block;width:fit-content}
.rh-badge.vacant{background:rgba(239,68,68,0.15);color:var(--red)}
.rh-badge.expiring{background:rgba(245,158,11,0.15);color:var(--amber)}
.rh-role{font-size:13px;font-weight:600;margin-top:2px}
/* ─── Roles Directory */
.rd-circles{display:flex;flex-direction:column;gap:10px}
.rd-circle-section{border:1px solid var(--card-border);border-radius:10px;overflow:hidden}
.rd-circle-section summary{list-style:none;display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;background:rgba(99,102,241,0.07);border-bottom:1px solid transparent;user-select:none;transition:background .15s}
.rd-circle-section[open] summary{border-bottom-color:var(--card-border)}
.rd-circle-section summary::-webkit-details-marker{display:none}
.rd-circle-section summary::before{content:'';display:inline-block;width:14px;height:14px;border:2px solid var(--accent);border-radius:3px;flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2 4l3 3 3-3' fill='none' stroke='%236366f1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;transition:transform .2s}
.rd-circle-section:not([open]) summary::before{transform:rotate(-90deg)}
.rd-circle-name{font-size:13px;font-weight:700;color:var(--text)}
.rd-circle-meta{font-size:11px;color:var(--muted)}
.rd-circle-body{padding:0}
.rd-table{width:100%;border-collapse:collapse;font-size:13px}
.rd-table th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--muted);padding:8px 14px;border-bottom:1px solid var(--card-border)}
.rd-table td{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:top}
.rd-table tr:last-child td{border-bottom:none}
.rd-holder{font-weight:500;color:var(--text)}
.rd-since{font-size:11px;color:var(--muted)}
.rd-vacant{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--red);background:rgba(239,68,68,0.12);padding:2px 8px;border-radius:4px;display:inline-block}
.rd-past{font-size:11px;color:var(--muted);margin-top:2px}
.rd-status-proposed{font-size:10px;font-weight:700;text-transform:uppercase;color:var(--amber);background:rgba(245,158,11,.12);padding:1px 6px;border-radius:3px;display:inline-block;margin-left:4px}
.rh-circle{font-size:11px;color:var(--muted)}

/* ─── Upcoming Reviews ─────────────────────────────── */
.ur-table{width:100%;border-collapse:collapse;font-size:13px}
.ur-table th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);padding:7px 12px;border-bottom:1px solid var(--card-border)}
.ur-table td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
.ur-table tr:last-child td{border-bottom:none}
.ur-table tr:hover td{background:var(--accent-glow)}
.ur-days{font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;white-space:nowrap;display:inline-block}
.ur-days.overdue{background:rgba(239,68,68,0.15);color:var(--red)}
.ur-days.soon{background:rgba(245,158,11,0.15);color:var(--amber)}
.ur-days.ok{background:rgba(107,122,150,0.12);color:var(--muted)}
.ur-type{font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
.ur-type.role{background:rgba(99,102,241,0.12);color:var(--accent)}
.ur-type.policy{background:rgba(16,185,129,0.12);color:var(--green)}

/* ─── Chat attachment UI ───────────────────────────────────── */
.chat-attach-btn{background:none;border:1px solid var(--border);border-radius:8px;color:var(--muted);padding:0;width:38px;height:44px;cursor:pointer;font-size:24px;font-weight:300;line-height:1;display:flex;align-items:center;justify-content:center;transition:border-color .15s,color .15s;flex-shrink:0;align-self:flex-end}
.chat-attach-btn:hover{border-color:var(--accent);color:var(--accent)}
.chat-cancel-btn{background:none;border:1px solid var(--border);color:var(--muted);border-radius:8px;padding:10px 14px;cursor:pointer;font-size:12px;font-weight:600;transition:border-color .15s,color .15s;white-space:nowrap;align-self:flex-end;flex-shrink:0;display:none}
.chat-cancel-btn:hover{border-color:var(--red);color:var(--red)}
.chat-attach-strip{padding:6px 10px 0;width:100%;display:none;flex-wrap:wrap;gap:6px}
.chat-attach-thumb{position:relative;border-radius:6px;overflow:hidden;border:1px solid var(--card-border);background:var(--card)}
.chat-attach-thumb img{width:56px;height:56px;object-fit:cover;display:block}
.chat-attach-thumb-text{width:56px;height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);padding:4px;text-align:center;gap:3px}
.chat-attach-remove{position:absolute;top:2px;right:2px;width:16px;height:16px;background:rgba(0,0,0,0.65);border:none;border-radius:50%;color:#fff;font-size:12px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.chat-drop-overlay{position:absolute;inset:0;background:rgba(99,102,241,0.1);border:2px dashed var(--accent);pointer-events:none;display:none;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--accent);z-index:10;letter-spacing:.3px}
.chat-sidebar-header{display:flex;align-items:center;padding:8px;gap:6px;flex-shrink:0}
.chat-sidebar.collapsed{width:44px;min-width:44px}
.chat-sidebar.collapsed .chat-thread-list,.chat-sidebar.collapsed .chat-new-btn{display:none}
.chat-sidebar-toggle{background:none;border:1px solid var(--border);border-radius:6px;color:var(--muted);width:30px;height:34px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .15s,color .15s;padding:0}
.chat-sidebar-toggle:hover{border-color:var(--accent);color:var(--accent)}
.chat-sidebar.collapsed .chat-sidebar-toggle{margin:auto;width:28px;height:28px}
.chat-edit-btn{background:none;border:none;color:var(--muted);font-size:11px;cursor:pointer;padding:2px 6px;border-radius:4px;opacity:0;transition:opacity .15s;margin-top:3px}
.chat-msg.user:hover .chat-edit-btn{opacity:1}
.chat-edit-btn:hover{color:var(--accent);background:var(--accent-glow)}
.chat-edit-form{display:flex;flex-direction:column;gap:6px;width:100%}
.chat-edit-textarea{background:var(--card);border:1px solid var(--accent);border-radius:8px;color:var(--text);font-size:13px;padding:8px 12px;resize:none;min-height:56px;max-height:120px;outline:none;font-family:inherit;width:100%}
.chat-edit-actions{display:flex;gap:6px;justify-content:flex-end}
.chat-edit-send{background:var(--accent);color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600}
.chat-edit-cancel-btn{background:none;border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px}

/* ─── Sera outer container (persistent above tabs) ─────── */
.sera-outer{background:var(--surface);border-bottom:1px solid var(--card-border)}
.sera-outer-inner{max-width:1240px;margin:0 auto;padding:16px 24px}
.sera-outer .sera-panel{margin-bottom:0;box-shadow:none;border-radius:0;border:none;border-left:3px solid var(--accent)}

/* ─── Review queue item lists ──────────────────────────── */
.review-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.review-item{background:var(--card);border:1px solid var(--card-border);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:6px}
.review-item-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.review-title{font-size:13px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.conf-badge{font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px;flex-shrink:0}
.conf-badge.conf-high{background:rgba(16,185,129,0.15);color:var(--green)}
.conf-badge.conf-medium{background:rgba(245,158,11,0.15);color:var(--amber)}
.conf-badge.conf-low{background:rgba(107,122,150,0.15);color:var(--muted)}
.cat-badge{font-size:10px;padding:2px 6px;border-radius:4px;background:var(--accent-glow);color:var(--accent);flex-shrink:0}
.profile-tags{display:flex;flex-wrap:wrap;gap:4px}
.ptag{font-size:10px;padding:2px 7px;border-radius:12px;background:rgba(99,102,241,0.12);color:var(--accent);border:1px solid rgba(99,102,241,0.2);white-space:nowrap}

/* ─── People / Profile cards ─────────────────────────────── */
.profile-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.pc-card{background:var(--card);border:1px solid var(--card-border);border-radius:10px;padding:16px 18px;position:relative;transition:border-color .15s}
.pc-card:hover{border-color:var(--accent)}
.pc-score{position:absolute;top:14px;right:16px;font-size:20px;font-weight:800;color:var(--accent);opacity:.85;line-height:1}
.pc-rank{font-size:11px;font-weight:700;color:var(--muted);margin-right:2px}
.pc-name{font-size:15px;font-weight:700;margin-bottom:6px;padding-right:52px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.pc-badge{font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600}
.pc-type{background:rgba(99,102,241,0.15);color:var(--accent)}
.pc-rel{background:rgba(16,185,129,0.12);color:var(--green)}
.pc-tags{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.pc-tag{font-size:9px;padding:1px 5px;border-radius:3px;background:var(--accent-glow);color:var(--accent);text-transform:uppercase;letter-spacing:.4px;font-weight:600}
.pc-stats{display:flex;gap:14px;font-size:11px;color:var(--muted);border-top:1px solid var(--card-border);padding-top:10px}
.pc-stat-val{font-size:18px;font-weight:700;color:var(--text);line-height:1.1;display:block}
.pc-stat-val.green{color:var(--green)}

/* ─── Performance / Leaderboard ─────────────────────────── */
.lb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.lb-card{background:var(--card);border:1px solid var(--card-border);border-radius:10px;padding:16px 18px;position:relative;transition:border-color .15s}
.lb-card.top1{border-color:rgba(251,191,36,0.45);background:linear-gradient(135deg,rgba(251,191,36,0.06),var(--card))}
.lb-card.top2{border-color:rgba(148,163,184,0.45)}
.lb-card.top3{border-color:rgba(205,127,50,0.38)}
.lb-rank{position:absolute;top:12px;right:14px;font-size:22px;line-height:1}
.lb-name{font-size:15px;font-weight:700;margin-bottom:6px;padding-right:42px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-stats{display:flex;gap:18px;font-size:11px;color:var(--muted);margin-bottom:10px}
.lb-stat-val{font-weight:700;color:var(--text);font-size:14px;line-height:1.2}
.lb-bar-wrap{height:6px;background:rgba(107,122,150,0.2);border-radius:3px;overflow:hidden}
.lb-bar-fill{height:100%;border-radius:3px;background:var(--green)}
.lb-bar-label{font-size:10px;color:var(--muted);margin-top:4px}
.lb-overdue{font-size:10px;color:var(--amber);margin-top:3px}

/* ─── Email feed ─────────────────────────────────────────── */
.email-feed{display:flex;flex-direction:column;gap:6px}
.email-row{background:var(--card);border:1px solid var(--card-border);border-radius:8px;padding:10px 14px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start}
.email-row.status-failed{border-left:3px solid var(--red)}
.email-row.status-needs-access{border-left:3px solid var(--amber)}
.email-subject{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:540px}
.email-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;font-size:11px;color:var(--muted)}
.email-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;white-space:nowrap}
.email-status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px}
.email-status.s-processed{background:rgba(16,185,129,0.15);color:var(--green)}
.email-status.s-failed{background:rgba(239,68,68,0.15);color:var(--red)}
.email-status.s-needs-access,.email-status.s-manual-review{background:rgba(245,158,11,0.15);color:var(--amber)}
.email-status.s-default{background:rgba(107,122,150,0.15);color:var(--muted)}
.etype{font-size:10px;padding:2px 6px;border-radius:4px}
.etype-recording{background:rgba(59,130,246,0.15);color:#60a5fa}
.etype-transcript{background:rgba(139,92,246,0.15);color:#a78bfa}
.etype-notes{background:rgba(16,185,129,0.15);color:var(--green)}
.etype-operational{background:rgba(245,158,11,0.15);color:var(--amber)}
.etype-forwarded{background:rgba(99,102,241,0.15);color:var(--accent)}
.etype-unknown{background:rgba(107,122,150,0.15);color:var(--muted)}
.email-error{font-size:10px;color:var(--red);font-family:'SF Mono',monospace;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:440px}

/* ─── Activity feed ────────────────────────────────────── */
.activity-feed{display:flex;flex-direction:column;gap:0}
.act-row{display:grid;grid-template-columns:16px 1fr auto;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)}
.act-row:last-child{border-bottom:none}
.act-dot{width:8px;height:8px;border-radius:50%;margin-top:4px;flex-shrink:0}
.act-dot.ok{background:var(--green)}
.act-dot.err{background:var(--red)}
.act-dot.warn{background:var(--amber)}
.act-body{display:flex;flex-direction:column;gap:3px;min-width:0}
.act-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.act-type{font-size:13px;font-weight:600;color:var(--text)}
.act-src{font-size:11px;font-family:'SF Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px}
.act-meta{font-size:11px;color:var(--muted);background:var(--card);border:1px solid var(--card-border);border-radius:4px;padding:1px 6px}
.act-error{font-size:11px;color:var(--red);margin-top:2px;font-family:'SF Mono',monospace}
.act-time{font-size:11px;white-space:nowrap;padding-top:3px}

/* ─── Tabs ─────────────────────────────────────────────── */
.tab-nav{display:flex;gap:4px;padding:0 24px;background:var(--surface);border-bottom:1px solid var(--card-border);overflow-x:auto;scrollbar-width:none;position:sticky;top:56px;z-index:99}
.tab-nav::-webkit-scrollbar{display:none}
.tab-btn{flex-shrink:0;background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font-size:13px;font-weight:500;padding:12px 16px;cursor:pointer;transition:color .15s,border-color .15s;white-space:nowrap}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:var(--accent);border-bottom-color:var(--accent)}
.tab-panel{display:none}
.tab-panel.active{display:block}

/* ─── CRM ──────────────────────────────────────────────── */
.crm-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.crm-pipeline{display:flex;flex-direction:column;gap:6px}
.crm-stage-row{display:flex;align-items:center;gap:10px;font-size:13px}
.crm-stage-bar-wrap{flex:1;background:var(--card-border);border-radius:4px;height:8px;overflow:hidden}
.crm-stage-bar{height:8px;border-radius:4px;background:var(--accent);transition:width .4s ease}
.crm-stage-name{width:120px;color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crm-stage-count{width:28px;text-align:right;font-weight:600;font-size:12px}
.crm-followup-item{display:flex;align-items:flex-start;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);gap:12px}
.crm-followup-item:last-child{border-bottom:none}
.crm-followup-name{font-weight:500;font-size:13px}
.crm-followup-action{font-size:12px;color:var(--muted);margin-top:2px}
.crm-followup-date{font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;white-space:nowrap}
.crm-followup-date.overdue{background:rgba(239,68,68,0.15);color:var(--red)}
.crm-followup-date.today{background:rgba(245,158,11,0.15);color:var(--amber)}
.crm-followup-date.soon{background:rgba(16,185,129,0.12);color:var(--green)}
.crm-interaction-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.crm-interaction-row:last-child{border-bottom:none}
.crm-interaction-type{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:3px 8px;border-radius:4px;white-space:nowrap;background:var(--accent-glow);color:var(--accent)}
.crm-interaction-type.meeting{background:rgba(16,185,129,0.12);color:var(--green)}
.crm-interaction-type.email{background:rgba(99,102,241,0.15);color:var(--accent)}
.crm-interaction-type.call{background:rgba(245,158,11,0.12);color:var(--amber)}
.crm-interaction-body{flex:1;min-width:0}
.crm-interaction-name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crm-interaction-summary{font-size:12px;color:var(--muted);margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.crm-interaction-date{font-size:11px;color:var(--muted);white-space:nowrap}
.crm-flag{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--amber);margin-left:5px;vertical-align:middle}

/* ─── Global alert banner ──────────────────────────────── */
.alert-global{background:rgba(239,68,68,0.12);border-bottom:2px solid rgba(239,68,68,0.5);padding:10px 24px;display:flex;align-items:center;gap:12px;font-size:13px;color:var(--red)}
.alert-global strong{font-weight:700}
.alert-global a{color:var(--red);text-decoration:underline;font-weight:600}
.alert-global.hidden{display:none}

/* ─── Failed email list ────────────────────────────────── */
.fail-list{display:flex;flex-direction:column;gap:6px}
.fail-row{background:var(--card);border:1px solid rgba(239,68,68,0.3);border-left:3px solid var(--red);border-radius:8px;padding:10px 14px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start}
.fail-subject{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:540px;color:var(--text)}
.fail-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;font-size:11px;color:var(--muted)}
.fail-status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px}
.fail-status.s-failed{background:rgba(239,68,68,0.15);color:var(--red)}
.fail-status.s-stuck{background:rgba(245,158,11,0.15);color:var(--amber)}
.fail-actions{display:flex;flex-direction:column;align-items:flex-end;gap:5px;white-space:nowrap}

/* ─── Footer ───────────────────────────────────────────── */
footer{text-align:center;padding:20px 0 32px;color:var(--muted);font-size:12px}
footer span{opacity:.5}

/* ─── Clickable card links (Notion) ─────────────────────── */
a.hero-card{cursor:pointer;text-decoration:none}
a.stat-card{text-decoration:none;color:inherit;display:block;cursor:pointer}
a.stat-card:hover{border-color:var(--accent)}
.cn-hint{position:absolute;bottom:8px;right:10px;font-size:9px;opacity:0;transition:opacity .15s;color:rgba(255,255,255,0.8);font-weight:600;text-transform:uppercase;letter-spacing:.4px;pointer-events:none}
a.hero-card:hover .cn-hint{opacity:1}

/* ─── Mobile ─────────────────────────────────────────────── */
@media(max-width:600px){
  /* ── Layout ── */
  body{font-size:15px}
  .wrap{padding:16px 12px}
  section{padding:16px 14px}
  h2{font-size:14px}
  .banner{font-size:14px}

  /* ── Email rows: allow long subjects to wrap ── */
  .email-row{grid-template-columns:1fr;gap:4px}
  .email-right{flex-direction:row;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px}
  .email-subject{max-width:none;white-space:normal;word-break:break-word;overflow-wrap:break-word;overflow:visible;text-overflow:clip;font-size:14px}
  .email-meta{font-size:13px}
  .email-status,.etype{font-size:13px}
  .email-error{max-width:none;font-size:12px;white-space:normal;overflow:visible;text-overflow:unset;word-break:break-word}

  /* ── Fail rows ── */
  .fail-row{grid-template-columns:1fr;gap:8px}
  .fail-subject{max-width:none;white-space:normal;font-size:14px;word-break:break-word}
  .fail-actions{flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:flex-start;white-space:normal;gap:6px}
  .fail-status,.fail-meta{font-size:13px}

  /* ── Activity rows: allow source IDs to wrap ── */
  .act-row{gap:6px}
  .act-type{font-size:14px}
  .act-src{max-width:none;white-space:normal;word-break:break-all;overflow:visible;text-overflow:clip;font-size:13px}

  /* ── Tables ── */
  .rd-table th{font-size:12px;padding:7px 10px}
  .rd-table td{font-size:14px;padding:8px 10px}
  .rd-circle-name{font-size:14px}
  .rd-circle-meta,.rd-since,.rd-past{font-size:13px}

  /* ── Global label/meta bumps (nothing below 13px on mobile) ── */
  .dim{font-size:13px}
  td.dim{font-size:13px}
  p.dim{font-size:14px}
  .s-sub,.pc-stats,.lb-stats{font-size:13px}
  .s-label,.s-value{font-size:13px}
  .h-label,.h-value{font-size:14px}
  .hero-label,.hero-sub{font-size:13px}
  .q-value{font-size:24px}
  .q-label,.q-desc{font-size:13px}
  .rh-role{font-size:14px}
  .rh-circle{font-size:13px}
  .rh-badge{font-size:12px}
  .cfg-label{font-size:13px}
  .cfg-value{font-size:14px}
  .btn{font-size:13px}
}
@media(max-width:420px){
  .rd-table th:last-child,.rd-table td:last-child{display:none}
}

/* ─── Counter animation ────────────────────────────────── */
@keyframes fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.hero-card{animation:fade-up .4s ease both}
.hero-card:nth-child(1){animation-delay:.05s}
.hero-card:nth-child(2){animation-delay:.1s}
.hero-card:nth-child(3){animation-delay:.15s}
.hero-card:nth-child(4){animation-delay:.2s}

/* ─── Markdown in chat bubbles ─────────────────────────── */
.md-h1{font-size:18px;font-weight:700;margin:14px 0 8px;line-height:1.3;color:var(--text)}
.md-h2{font-size:16px;font-weight:700;margin:12px 0 6px;line-height:1.3;color:var(--text)}
.md-h3{font-size:14px;font-weight:700;margin:10px 0 5px;line-height:1.3;color:var(--text)}
.md-p{margin:0 0 10px;line-height:1.65}
.md-p:last-child,.chat-bubble>:last-child{margin-bottom:0}
.md-ul,.md-ol{margin:0 0 10px;padding-left:20px;line-height:1.65}
.md-ul:last-child,.md-ol:last-child{margin-bottom:0}
.md-li{margin-bottom:3px}
.md-pre{background:rgba(0,0,0,0.3);border-radius:6px;padding:10px 12px;margin:8px 0;overflow-x:auto;font-size:12px;line-height:1.5}
[data-theme="light"] .md-pre{background:rgba(0,0,0,0.06)}
.md-code{background:rgba(0,0,0,0.25);border-radius:3px;padding:1px 5px;font-size:12px;font-family:'SF Mono',monospace}
[data-theme="light"] .md-code{background:rgba(0,0,0,0.08)}
.md-code-block{font-family:'SF Mono',monospace;font-size:12px;color:var(--text);white-space:pre-wrap;word-break:break-word}
`;

const QUEUE_DEFS: Array<{
  key: keyof import('./queries').QueueCounts;
  label: string;
  desc: string;
  dbKey: string;
}> = [
  { key: 'canonChangeRequests', label: 'Canon Changes',    desc: 'Pending Review',              dbKey: 'canonChangeRequests'  },
  { key: 'memoryReviewQueue',   label: 'Memory Queue',     desc: 'Pending Review',              dbKey: 'memoryReviewQueue'    },
  { key: 'decisionCandidates',  label: 'Decisions',        desc: 'Candidate or Needs Clarity',  dbKey: 'decisionCandidates'   },
  { key: 'sensitiveReview',     label: 'Sensitive Review', desc: 'Pending Review',              dbKey: 'sensitiveReview'      },
  { key: 'ccosLedgerPending',   label: 'CCOS Ledger',      desc: 'Draft or Pending',            dbKey: 'ccosLedgerEntries'    },
  { key: 'tasksNeedingOwner',   label: 'Unowned Tasks',    desc: 'Open, no owner assigned',     dbKey: 'tasks'                },
  { key: 'highRisks',           label: 'High Risks',       desc: 'Severity: High, Open',        dbKey: 'risks'                },
  { key: 'kbDrafts',           label: 'KB Drafts',        desc: 'Draft articles pending review', dbKey: 'knowledgeBase'        },
];

type TipType = 'Did You Know?' | 'Pro Tip';
const SERA_TIPS: Array<{ badge: string; text: string }> = [
  { badge: 'Pro Tip', text: 'Forward any email to <strong>roots@amora.cr</strong> and I will extract the decisions, tasks, risks, and people mentioned - and file them as draft records for your review. Nothing becomes canon until a human approves it.' },
  { badge: 'Did You Know?', text: 'Every queue card on this dashboard is clickable. Click any card to jump directly to that Notion database and review the items waiting for your attention.' },
  { badge: 'Pro Tip', text: 'If I flag a Google Drive recording or transcript as <strong>Needs Access</strong>, just share the file with roots@amora.cr as Viewer in Google Drive. I retry automatically every 30 minutes.' },
  { badge: 'Did You Know?', text: 'The <strong>Estimated Hours Saved</strong> counter calculates: 45 min per meeting processed + 5 min per email + 2 min per task extracted + 3 min per decision tracked. It grows every time I process something new.' },
  { badge: 'Did You Know?', text: 'I never approve canon changes on my own. When I detect something that could affect a policy, circle definition, or governance rule, I create a <strong>Canon Change Request</strong> marked Pending Review and alert the admin.' },
  { badge: 'Pro Tip', text: 'The <strong>Policy Ref</strong> field on each policy auto-formats as a short code like GOV-001, OPS-002, or FIN-003 based on the governing area and a sequential ID. Reference these codes in meeting notes to help me link decisions to the right policy.' },
  { badge: 'Did You Know?', text: 'I check for <strong>duplicate records</strong> before writing. If the same task or decision shows up in a retry cycle, I skip it rather than creating a second copy. Your Notion databases stay clean automatically.' },
  { badge: 'Pro Tip', text: 'Sensitive flags (legal issues, interpersonal concerns, financial risks) go to a <strong>separate admin-only Sensitive Review database</strong> that is not visible in the main team workspace. Those records never appear in the shared queues.' },
  { badge: 'Did You Know?', text: 'I extract participants from meeting transcripts and automatically create or update their <strong>Profiles</strong> in the Profiles database. Over time, every person who participates in community meetings builds up a contact record automatically.' },
  { badge: 'Pro Tip', text: 'The <strong>CCOS Ledger</strong> is where tensions, proposals, and governance actions live. When I detect that a tension has been raised in a meeting, I log it automatically. You can track resolution by updating the Resolved Date and Resolution Notes fields.' },
  { badge: 'Did You Know?', text: 'I use a <strong>Capture Key</strong> to deduplicate meetings. If multiple emails about the same Google Meet arrive (recording + transcript + notes), I link them all to one meeting record rather than creating three.' },
  { badge: 'Pro Tip', text: 'The <strong>Memory Review Queue</strong> contains facts I think are worth preserving as long-term institutional knowledge. Review these regularly - approved memories become part of the context I use when processing future content.' },
  { badge: 'Did You Know?', text: 'I run on a <strong>3-minute poll cycle</strong> on Railway. Most emails are processed within 5 minutes of arrival. The Last Successful Poll time in System Health shows exactly when I last checked the inbox.' },
  { badge: 'Pro Tip', text: 'To help me link a meeting to the right CCOS circle, mention the circle name explicitly in the meeting title or agenda. I use pattern matching to associate extracted decisions and tasks with the correct circle record.' },
  { badge: 'Pro Tip', text: 'When a meeting or email contains clear how-to instructions, best practices, or process guides, I automatically create a <strong>Knowledge Base article</strong> in Draft status. Review and publish the ones worth keeping to build your team\'s living reference library.' },
  { badge: 'Did You Know?', text: 'The platform you are using is called <strong>Saberra</strong> - the productized name for this living memory system. The name quietly carries <em>saber</em>, Spanish for "to know." Saberra is built for teams that can\'t afford to forget. I am Sera, your AI memory keeper inside it.' },
];

const SERA_TIPS_ES: Array<{ badge: string; text: string }> = [
  { badge: 'Consejo Pro', text: 'Reenvía cualquier correo a <strong>roots@amora.cr</strong> y extraeré las decisiones, tareas, riesgos y personas mencionadas, archivándolos como registros borrador para tu revisión. Nada se convierte en canon hasta que un humano lo apruebe.' },
  { badge: '¿Sabías que...?', text: 'Cada tarjeta de cola en este panel es clicable. Haz clic en cualquier tarjeta para ir directamente a esa base de datos de Notion y revisar los elementos que esperan tu atención.' },
  { badge: 'Consejo Pro', text: 'Si marco una grabación o transcripción de Google Drive como <strong>Necesita Acceso</strong>, comparte el archivo con roots@amora.cr como Lector en Google Drive. Reintentaré automáticamente cada 30 minutos.' },
  { badge: '¿Sabías que...?', text: 'El contador de <strong>Horas Estimadas Ahorradas</strong> calcula: 45 min por reunión procesada + 5 min por correo + 2 min por tarea extraída + 3 min por decisión registrada. Crece cada vez que proceso algo nuevo.' },
  { badge: '¿Sabías que...?', text: 'Nunca apruebo cambios de canon por mi cuenta. Cuando detecto algo que podría afectar una política, definición de círculo o regla de gobernanza, creo una <strong>Solicitud de Cambio de Canon</strong> marcada como Pendiente de Revisión y aviso al administrador.' },
  { badge: 'Consejo Pro', text: 'El campo <strong>Ref. de Política</strong> en cada política se formatea automáticamente como un código corto tipo GOV-001, OPS-002 o FIN-003. Usa estos códigos en notas de reunión para ayudarme a vincular decisiones a la política correcta.' },
  { badge: '¿Sabías que...?', text: 'Verifico si hay <strong>registros duplicados</strong> antes de escribir. Si la misma tarea o decisión aparece en un ciclo de reintento, la omito en lugar de crear una segunda copia. Tus bases de datos de Notion se mantienen limpias automáticamente.' },
  { badge: 'Consejo Pro', text: 'Las marcas sensibles (problemas legales, conflictos interpersonales, riesgos financieros) van a una <strong>base de datos de Revisión Sensible solo para administradores</strong>, no visible en el espacio de trabajo del equipo. Esos registros nunca aparecen en las colas compartidas.' },
  { badge: '¿Sabías que...?', text: 'Extraigo participantes de las transcripciones de reuniones y creo o actualizo automáticamente sus <strong>Perfiles</strong> en la base de datos de Perfiles. Con el tiempo, toda persona que participa en reuniones de la comunidad acumula un registro de contacto automáticamente.' },
  { badge: 'Consejo Pro', text: 'El <strong>Libro Mayor de CCOS</strong> es donde viven las tensiones, propuestas y acciones de gobernanza. Cuando detecto que se ha planteado una tensión en una reunión, la registro automáticamente. Puedes hacer seguimiento actualizando los campos de Resolución.' },
  { badge: '¿Sabías que...?', text: 'Uso una <strong>Clave de Captura</strong> para deduplicar reuniones. Si llegan varios correos sobre el mismo Google Meet (grabación + transcripción + notas), los vinculo todos a un único registro de reunión en lugar de crear tres.' },
  { badge: 'Consejo Pro', text: 'La <strong>Cola de Revisión de Memoria</strong> contiene hechos que considero valiosos como conocimiento institucional a largo plazo. Revísala regularmente: las memorias aprobadas forman parte del contexto que uso al procesar contenido futuro.' },
  { badge: '¿Sabías que...?', text: 'Funciono en un ciclo de verificación de <strong>3 minutos</strong> en Railway. La mayoría de los correos se procesan en 5 minutos desde su llegada. El tiempo de Último Sondeo Exitoso en Salud del Sistema muestra exactamente cuándo revisé la bandeja por última vez.' },
  { badge: 'Consejo Pro', text: 'Para ayudarme a vincular una reunión al círculo CCOS correcto, menciona el nombre del círculo explícitamente en el título o la agenda de la reunión. Uso coincidencia de patrones para asociar decisiones y tareas con el registro de círculo correcto.' },
  { badge: 'Consejo Pro', text: 'Cuando una reunión o correo contiene instrucciones claras, mejores prácticas o guías de proceso, creo automáticamente un <strong>artículo de Base de Conocimiento</strong> en estado Borrador. Revisa y publica los que valgan la pena para construir la biblioteca de referencia viva de tu equipo.' },
  { badge: '¿Sabías que...?', text: 'La plataforma que estás usando se llama <strong>Saberra</strong>, el nombre productizado de este sistema de memoria viva. El nombre lleva silenciosamente <em>saber</em>, porque Saberra está construida para los equipos que no pueden permitirse olvidar. Soy Sera, tu guardiana de la memoria de IA dentro de ella.' },
];

interface UiStrings {
  // Chat
  chatPlaceholder: string;
  chatEmpty: string;
  btnNewChat: string;
  btnSend: string;
  btnCancel: string;
  dropOverlay: string;
  // Chart labels (passed to dashboard.js via window.AMORA_UI)
  chartActivityLabel: string;
  chartTypeLabels: string[];
  chartQueuePending: string;
  chartCommunityLabels: string[];
  chartPolicyTitle: string;
  chartInfluenceX: string;
  chartInfluenceY: string;
  chartInfluencePeople: string;
  chartPeopleGrowthSuffix: string;
  chartVelocityCreated: string;
  chartVelocityCompleted: string;
  chartPriorityLabels: string[];
  chartStatusLabels: string[];
  // Roles directory
  rdTip: string;
  rdSearchPlaceholder: string;
  // Worker status indicator
  statusOnline: string;
  statusDelayed: string;
  statusStale: string;
  statusNeverPolled: string;
  // Tabs
  tabOverview: string;
  tabChatWithSera: string;
  tabQueues: string;
  tabGovernance: string;
  tabPeople: string;
  tabActivityOps: string;
  tabPerformance: string;
  tabCrm: string;
  tabSettings: string;
  // Overview hero
  heroEstHoursSaved: string;
  heroEmailsProcessed: string;
  heroMeetingsCaptured: string;
  heroPeopleKnown: string;
  heroSubHours: string;
  heroSubEmails: string;
  heroSubMeetings: string;
  heroSubPeople: string;
  openInNotion: string;
  // Overview stats
  statTasksExtracted: string;
  statDecisionsTracked: string;
  statActiveCircles: string;
  statRisksTracked: string;
  statOpenRisks: string;
  statKbArticles: string;
  subAcrossAllSources: string;
  subCandidatesConfirmed: string;
  subCcosCircles: string;
  subTotalLogged: string;
  subHighSeverity: (n: number) => string;
  subDraftsPending: (n: number) => string;
  // Charts
  chartEmailsLast7: string;
  chartEmailIntake: string;
  chartNoEmailsYet: string;
  // System Health section
  sectionSystemHealth: string;
  labelLastPoll: string;
  labelEmailsThisWeek: string;
  labelRecentErrors: string;
  // Processing Failures section
  sectionProcessingFailures: string;
  failureNone: string;
  failureSome: (n: number) => string;
  // Queue health
  queueAllClear: string;
  queueNeedsAttention: (n: number) => string;
  sectionReviewQueues: string;
  sectionQueueHealthChart: string;
  sectionMemoryQueue: string;
  sectionSensitiveReview: string;
  sectionUpcomingReviews: string;
  upcomingReviewsSub: string;
  sectionRoleHealthVacant: string;
  roleHealthAllClear: string;
  roleHealthVacant: (n: number) => string;
  roleHealthExpiring: (n: number) => string;
  roleHealthBadgeVacant: string;
  roleHealthBadgeExpiring: string;
  // Queue card labels + descriptions (parallel to QUEUE_DEFS order)
  queueLabels: Array<{ label: string; desc: string }>;
  // Activity & Ops
  statEmailsAllTime: string;
  statRecentSuccessRate: string;
  statAccessFailures: string;
  statRecentFailures: string;
  statPipelineFailures: string;
  subIngestedThisWeek: (n: number) => string;
  subProcessedOk: (ok: number, total: number) => string;
  subDriveAssetsNeedReview: string;
  subInLastEmails: (n: number) => string;
  subEmailsStuck: string;
  subAllClear: string;
  emailStatusStuck: string;
  emailStatusFailed: string;
  emailStatusPending: string;
  subOverdue: (n: number) => string;
  sectionLast10Emails: string;
  sectionActivityLog: string;
  activityFilterPlaceholder: string;
  sectionDriveAccessFailures: string;
  // Governance
  sectionPolicyLibrary: string;
  statTotalPolicies: string;
  statDraft: string;
  statActive: string;
  statMissingCircle: string;
  subAwaitingRatification: string;
  subInEffect: string;
  subNeedResponsibleCircle: string;
  sectionRolesDirectory: string;
  rolesDirectoryDesc: string;
  sectionRoleHealth: string;
  sectionHowMuchSeraKnows: string;
  howMuchSeraKnowsDesc: string;
  subRecordsCapturedByType: string;
  subPolicyMaturity: string;
  // Collapse Health
  sectionCollapseHealth: string;
  collapseHealthDesc: string;
  collapseAllClear: string;
  collapseHasSignals: (n: number) => string;
  collapseActiveSignals: string;
  collapseStatusClear: string;
  collapseStatusWarning: string;
  collapseStatusCritical: string;
  collapseNoSignals: string;
  collapseAndMore: (n: number) => string;
  // People
  heroPeopleProfiles: string;
  heroActiveMembers: string;
  heroExpertiseAreas: string;
  heroTopContributor: string;
  subPeopleAndOrgs: (p: number, o: number) => string;
  subEngagementActive: string;
  subUniqueSkillsTags: string;
  subHighestSeraScore: (n: number) => string;
  sectionInfluenceMap: string;
  influenceMapDesc: string;
  influenceMapEmpty: string;
  sectionCommunitySkills: string;
  communitySkillsEmpty: string;
  sectionRelationshipToAmora: string;
  relationshipEmpty: string;
  sectionSeraLeaderboard: string;
  seraScoreDesc: string;
  sectionCommunityGrowth: string;
  // Performance
  statTotalTasks: string;
  statCompleted: string;
  statOpen: string;
  statCompletionRate: string;
  subExtractedBySera: string;
  subMarkedDone: string;
  subOrgWideAllTime: string;
  sectionTaskChampions: string;
  sectionTaskVelocity: string;
  legendCreated: string;
  legendCompleted: string;
  sectionPriorityBreakdown: string;
  noPriorityTasks: string;
  sectionStatusDistribution: string;
  noTasksYet: string;
  // CRM
  sectionPipeline: string;
  crmPipelineSub: (n: number) => string;
  sectionFollowUpsDue: string;
  crmFollowUpsSub: (n: number) => string;
  sectionRecentInteractions: string;
  recentInteractionsDesc: string;
  crmNoPipeline: string;
  crmNoFollowUps: string;
  crmInteractionsDisabled: string;
  crmNoInteractions: string;
  // Settings
  sectionDashboardTimezone: string;
  timezoneDesc: string;
  labelActiveTimezone: string;
  btnSave: string;
  sectionSeraLanguage: string;
  languageDesc: string;
  labelResponseLanguage: string;
  sectionGoverningPurpose: string;
  gpsDesc: string;
  labelFullGps: string;
  btnSaveGps: string;
  labelPurposeTest: string;
  purposeTestSub: string;
  btnSavePurposeTest: string;
  sectionSystemConfig: string;
  cfgAiModel: string;
  cfgPollInterval: string;
  cfgMaxRetry: string;
  cfgTenant: string;
  cfgAdminNotifications: string;
  systemConfigNote: string;
  hubSettingsNotConfigured: string;
  // System Balances
  sectionSystemBalances: string;
  systemBalancesDesc: string;
  balanceRailwayLabel: string;
  balanceCreditRemaining: string;
  balanceNotConfigured: string;
  balanceUnavailable: string;
  balanceRefresh: string;
  balanceLoading: string;
  balanceCheckedAt: (t: string) => string;
}

const UI_EN: UiStrings = {
  chatPlaceholder: 'Ask Sera anything... (Enter to send, Shift+Enter for newline)',
  chatEmpty: "Ask Sera anything about your organization's history, decisions, people, governance, or meetings.",
  btnNewChat: '+ New Chat',
  btnSend: 'Send',
  btnCancel: 'Cancel',
  dropOverlay: 'Drop image or text file here',
  chartActivityLabel: 'Items processed',
  chartTypeLabels: ['Recordings', 'Transcripts', 'Notes', 'Operational', 'Forwarded'],
  chartQueuePending: ' pending',
  chartCommunityLabels: ['Profiles', 'Meetings', 'Circles', 'Tasks', 'Decisions'],
  chartPolicyTitle: 'Policy Status',
  chartInfluenceX: 'Meetings Organized',
  chartInfluenceY: 'Tasks Completed',
  chartInfluencePeople: ' people',
  chartPeopleGrowthSuffix: ' new profiles',
  chartVelocityCreated: 'Created',
  chartVelocityCompleted: 'Completed',
  chartPriorityLabels: ['High', 'Medium', 'Low'],
  chartStatusLabels: ['Open', 'In Progress', 'Done', 'Cancelled', 'Needs Owner'],
  rdTip: 'Click a circle name to expand its roles. Use search to filter across all circles.',
  rdSearchPlaceholder: 'Search roles, holders, circles…',
  statusOnline: 'Online',
  statusDelayed: 'Delayed',
  statusStale: 'Stale',
  statusNeverPolled: 'Never polled',
  tabOverview: 'Overview',
  tabChatWithSera: 'Chat with Sera',
  tabQueues: 'Queues',
  tabGovernance: 'Governance',
  tabPeople: 'People',
  tabActivityOps: 'Activity & Ops',
  tabPerformance: 'Performance',
  tabCrm: 'CRM',
  tabSettings: 'Settings',
  heroEstHoursSaved: 'Est. Hours Saved',
  heroEmailsProcessed: 'Emails Processed',
  heroMeetingsCaptured: 'Meetings Captured',
  heroPeopleKnown: 'People Known',
  heroSubHours: 'meetings + emails + tasks combined',
  heroSubEmails: 'filed, extracted, and remembered',
  heroSubMeetings: 'recordings, transcripts & notes',
  heroSubPeople: 'profiles auto-built from email',
  openInNotion: 'Open in Notion ↗',
  statTasksExtracted: 'Tasks Extracted',
  statDecisionsTracked: 'Decisions Tracked',
  statActiveCircles: 'Active Circles',
  statRisksTracked: 'Risks Tracked',
  statOpenRisks: 'Open Risks',
  statKbArticles: 'KB Articles',
  subAcrossAllSources: 'across all sources',
  subCandidatesConfirmed: 'candidates + confirmed',
  subCcosCircles: 'CCOS governance circles',
  subTotalLogged: 'total logged',
  subHighSeverity: (n) => `${n} high severity`,
  subDraftsPending: (n) => `${n} drafts pending`,
  chartEmailsLast7: 'Emails Processed - Last 7 Days',
  chartEmailIntake: 'Email Intake Breakdown',
  chartNoEmailsYet: 'No emails processed yet',
  sectionSystemHealth: 'System Health',
  labelLastPoll: 'Last Successful Poll',
  labelEmailsThisWeek: 'Emails Ingested This Week',
  labelRecentErrors: 'Recent Errors',
  sectionProcessingFailures: 'Processing Failures',
  failureNone: 'No emails are stuck or failed. The pipeline is healthy.',
  failureSome: (n) => `${n} email${n !== 1 ? 's' : ''} failed or stuck. Click Retry to reset for the next worker cycle.`,
  queueAllClear: 'All queues clear - nothing awaiting human review.',
  queueNeedsAttention: (n) => `${n} item${n !== 1 ? 's' : ''} need attention across all queues.`,
  sectionReviewQueues: 'Review Queues',
  sectionQueueHealthChart: 'Queue Health - At a Glance',
  sectionMemoryQueue: 'Memory Review Queue',
  sectionSensitiveReview: 'Sensitive Review',
  sectionUpcomingReviews: 'Upcoming Reviews - Roles & Policies',
  upcomingReviewsSub: '(next 60 days, soonest first)',
  sectionRoleHealthVacant: 'Role Health - Vacant & Expiring Terms',
  roleHealthAllClear: 'All active roles are filled and no terms expire within 30 days.',
  roleHealthVacant: (n) => `${n} vacant role${n !== 1 ? 's' : ''} need filling. `,
  roleHealthExpiring: (n) => `${n} term${n !== 1 ? 's' : ''} expiring within 30 days.`,
  roleHealthBadgeVacant: 'Vacant',
  roleHealthBadgeExpiring: 'Term Expiring',
  queueLabels: [
    { label: 'Canon Changes',    desc: 'Pending Review' },
    { label: 'Memory Queue',     desc: 'Pending Review' },
    { label: 'Decisions',        desc: 'Candidate or Needs Clarity' },
    { label: 'Sensitive Review', desc: 'Pending Review' },
    { label: 'CCOS Ledger',      desc: 'Draft or Pending' },
    { label: 'Unowned Tasks',    desc: 'Open, no owner assigned' },
    { label: 'High Risks',       desc: 'Severity: High, Open' },
    { label: 'KB Drafts',        desc: 'Draft articles pending review' },
  ],
  statEmailsAllTime: 'Emails Processed (All Time)',
  statRecentSuccessRate: 'Recent Success Rate',
  statAccessFailures: 'Access Failures',
  statRecentFailures: 'Recent Failures',
  statPipelineFailures: 'Pipeline Failures',
  subIngestedThisWeek: (n) => `${n} ingested this week`,
  subProcessedOk: (ok, total) => `${ok} of last ${total} processed OK`,
  subDriveAssetsNeedReview: 'Drive assets needing manual review',
  subInLastEmails: (n) => `in last ${n} emails`,
  subEmailsStuck: 'emails stuck or failed - see Queues',
  subAllClear: 'all clear',
  emailStatusStuck: 'Stuck',
  emailStatusFailed: 'Failed',
  emailStatusPending: 'Pending',
  subOverdue: (n) => `${n} overdue`,
  sectionLast10Emails: 'Last 10 Emails Ingested',
  sectionActivityLog: 'Extraction Activity Log',
  activityFilterPlaceholder: 'Filter activity…',
  sectionDriveAccessFailures: 'Drive Access Failures - Manual Review',
  sectionPolicyLibrary: 'Policy Library',
  statTotalPolicies: 'Total Policies',
  statDraft: 'Draft',
  statActive: 'Active',
  statMissingCircle: 'Missing Circle',
  subAwaitingRatification: 'Awaiting ratification',
  subInEffect: 'In effect',
  subNeedResponsibleCircle: 'Need Responsible Circle',
  sectionRolesDirectory: 'Roles Directory',
  rolesDirectoryDesc: 'Active role holders (from Role Assignments). Role Assignments are the source of truth - each records who holds the role, since when, and any term limits. Historical assignments are counted in the History column.',
  sectionRoleHealth: 'Role Health',
  sectionHowMuchSeraKnows: 'How Much Does Sera Know?',
  howMuchSeraKnowsDesc: 'Total records Sera has captured across your organization\'s key memory categories. Higher numbers mean more institutional knowledge is structured and searchable. Low counts in any category suggest that area isn\'t being captured yet - not that nothing is happening.',
  subRecordsCapturedByType: 'Records captured by type',
  subPolicyMaturity: 'Policy maturity - how much governance is ratified vs. still draft',
  sectionCollapseHealth: 'Collapse Health Monitor',
  collapseHealthDesc: 'Sera monitors every processed meeting and email for early warning signals of the 7 organizational collapse patterns. Signals are stored as Collapse Pattern risks in Notion.',
  collapseAllClear: 'No collapse pattern signals detected in open risks. Organizational health indicators are clear.',
  collapseHasSignals: (n) => `${n} active collapse pattern signal${n !== 1 ? 's' : ''} detected across open risks. Review and address promptly.`,
  collapseActiveSignals: 'Active Signals',
  collapseStatusClear: 'Clear',
  collapseStatusWarning: 'Warning',
  collapseStatusCritical: 'Critical',
  collapseNoSignals: 'No signals',
  collapseAndMore: (n) => `...and ${n} more in Notion`,
  heroPeopleProfiles: 'Profiles Known',
  heroActiveMembers: 'Active Members',
  heroExpertiseAreas: 'Expertise Areas',
  heroTopContributor: 'Top Contributor',
  subPeopleAndOrgs: (p, o) => `${p} people · ${o} organizations`,
  subEngagementActive: 'engagement status: Active',
  subUniqueSkillsTags: 'unique skills & tags across community',
  subHighestSeraScore: (n) => `highest Sera Score: ${n}`,
  sectionInfluenceMap: "Influence Map - Who's Driving Things Forward",
  influenceMapDesc: 'Each bubble = one person. Position = meetings organized (X) × tasks completed (Y). Bubble size = Sera Score. Hover to explore.',
  influenceMapEmpty: 'No activity data yet - profiles will populate as Sera processes meetings.',
  sectionCommunitySkills: 'Community Skills & Expertise',
  communitySkillsEmpty: 'No tags on profiles yet',
  sectionRelationshipToAmora: 'Community Relationships',
  relationshipEmpty: 'No relationship data yet',
  sectionSeraLeaderboard: 'Sera Score Leaderboard',
  seraScoreDesc: 'Score = (active roles × 10) + (meetings organized × 5) + (tasks done × 3) + (tasks assigned × 1)',
  sectionCommunityGrowth: 'Community Growth - New Profiles Discovered by Month',
  statTotalTasks: 'Total Tasks',
  statCompleted: 'Completed',
  statOpen: 'Open',
  statCompletionRate: 'Completion Rate',
  subExtractedBySera: 'extracted by Sera',
  subMarkedDone: 'marked Done',
  subOrgWideAllTime: 'org-wide, all time',
  sectionTaskChampions: 'Task Champions',
  sectionTaskVelocity: 'Task Velocity - Last 8 Weeks',
  legendCreated: 'Created',
  legendCompleted: 'Completed',
  sectionPriorityBreakdown: 'Priority Breakdown',
  noPriorityTasks: 'No tasks with priority set',
  sectionStatusDistribution: 'Status Distribution',
  noTasksYet: 'No tasks yet',
  sectionPipeline: 'Pipeline',
  crmPipelineSub: (n) => `${n} contact${n !== 1 ? 's' : ''} with a Lead Stage`,
  sectionFollowUpsDue: 'Follow-ups Due',
  crmFollowUpsSub: (n) => `${n} overdue or due today`,
  sectionRecentInteractions: 'Recent Interactions',
  recentInteractionsDesc: 'Auto-logged by Sera as emails and meetings are processed',
  crmNoPipeline: 'No contacts with a Lead Stage set yet. Open a profile in Notion and assign a Lead Stage to start tracking.',
  crmNoFollowUps: 'No overdue follow-ups. Great job staying on top of contacts.',
  crmInteractionsDisabled: 'Run the <code>migrate-crm</code> script and add <code>NOTION_DB_INTERACTIONS</code> to Railway to enable interaction history.',
  crmNoInteractions: 'No interactions logged yet. They will appear here automatically as Sera processes emails and meetings.',
  sectionDashboardTimezone: 'Dashboard Timezone',
  timezoneDesc: 'Controls how "Last 7 Days" counts and date displays are calculated. Your selection is saved in a browser cookie.',
  labelActiveTimezone: 'Active timezone:',
  btnSave: 'Save',
  sectionSeraLanguage: 'Sera Response Language',
  languageDesc: 'Controls the language Sera uses in Q&A answers, role cards, and circle charters. Notion record field values remain in English for consistency. Changes take effect within 30 minutes - no redeploy needed.',
  labelResponseLanguage: 'Response language:',
  sectionGoverningPurpose: 'Governing Purpose Statement',
  gpsDesc: 'Sera injects this into every extraction to score Purpose Alignment on all Decision Candidates. Changes take effect within 30 minutes — no redeploy needed.',
  labelFullGps: 'Full GPS',
  btnSaveGps: 'Save GPS',
  labelPurposeTest: 'One-Sentence Purpose Test',
  purposeTestSub: '(used on every decision: "Does this move us toward our purpose?")',
  btnSavePurposeTest: 'Save Purpose Test',
  sectionSystemConfig: 'System Configuration',
  cfgAiModel: 'AI Model',
  cfgPollInterval: 'Poll Interval',
  cfgMaxRetry: 'Max Retry Count',
  cfgTenant: 'Tenant',
  cfgAdminNotifications: 'Admin Notifications',
  systemConfigNote: 'To change these settings, update the corresponding Railway environment variables and redeploy.',
  hubSettingsNotConfigured: 'Set <code>NOTION_HUB_SETTINGS_PAGE_ID</code> on all Railway services to enable live editing.',
  sectionSystemBalances: 'System Balances',
  systemBalancesDesc: 'Live credit balance for services connected to this hub.',
  balanceRailwayLabel: 'Railway Credits',
  balanceCreditRemaining: 'Credits remaining',
  balanceNotConfigured: 'Not configured',
  balanceUnavailable: 'Unavailable',
  balanceRefresh: 'Refresh',
  balanceLoading: 'Loading...',
  balanceCheckedAt: (t) => `Checked at ${t}`,
};

const UI_ES: UiStrings = {
  chatPlaceholder: 'Pregúntale a Sera lo que quieras... (Enter para enviar, Shift+Enter para nueva línea)',
  chatEmpty: 'Pregúntale a Sera sobre la historia, decisiones, personas, gobernanza o reuniones de la organización.',
  btnNewChat: '+ Nuevo Chat',
  btnSend: 'Enviar',
  btnCancel: 'Cancelar',
  dropOverlay: 'Suelta imagen o archivo de texto aquí',
  chartActivityLabel: 'Elementos procesados',
  chartTypeLabels: ['Grabaciones', 'Transcripciones', 'Notas', 'Operacional', 'Reenviados'],
  chartQueuePending: ' pendiente',
  chartCommunityLabels: ['Perfiles', 'Reuniones', 'Círculos', 'Tareas', 'Decisiones'],
  chartPolicyTitle: 'Estado de Políticas',
  chartInfluenceX: 'Reuniones Organizadas',
  chartInfluenceY: 'Tareas Completadas',
  chartInfluencePeople: ' personas',
  chartPeopleGrowthSuffix: ' nuevos perfiles',
  chartVelocityCreated: 'Creadas',
  chartVelocityCompleted: 'Completadas',
  chartPriorityLabels: ['Alta', 'Media', 'Baja'],
  chartStatusLabels: ['Abierta', 'En Progreso', 'Terminada', 'Cancelada', 'Sin Dueño'],
  rdTip: 'Haz clic en el nombre de un círculo para expandir sus roles. Usa la búsqueda para filtrar en todos los círculos.',
  rdSearchPlaceholder: 'Buscar roles, titulares, círculos…',
  statusOnline: 'En línea',
  statusDelayed: 'Retrasado',
  statusStale: 'Sin actualizar',
  statusNeverPolled: 'Sin sondeos',
  tabOverview: 'Resumen',
  tabChatWithSera: 'Chat con Sera',
  tabQueues: 'Colas',
  tabGovernance: 'Gobernanza',
  tabPeople: 'Personas',
  tabActivityOps: 'Actividad y Ops',
  tabPerformance: 'Rendimiento',
  tabCrm: 'CRM',
  tabSettings: 'Configuración',
  heroEstHoursSaved: 'Horas Estimadas Ahorradas',
  heroEmailsProcessed: 'Correos Procesados',
  heroMeetingsCaptured: 'Reuniones Capturadas',
  heroPeopleKnown: 'Personas Conocidas',
  heroSubHours: 'reuniones + correos + tareas combinados',
  heroSubEmails: 'archivados, extraídos y recordados',
  heroSubMeetings: 'grabaciones, transcripciones y notas',
  heroSubPeople: 'perfiles creados automáticamente del correo',
  openInNotion: 'Abrir en Notion ↗',
  statTasksExtracted: 'Tareas Extraídas',
  statDecisionsTracked: 'Decisiones Rastreadas',
  statActiveCircles: 'Círculos Activos',
  statRisksTracked: 'Riesgos Rastreados',
  statOpenRisks: 'Riesgos Abiertos',
  statKbArticles: 'Artículos de KB',
  subAcrossAllSources: 'en todas las fuentes',
  subCandidatesConfirmed: 'candidatas + confirmadas',
  subCcosCircles: 'círculos de gobernanza CCOS',
  subTotalLogged: 'total registrados',
  subHighSeverity: (n) => `${n} de severidad alta`,
  subDraftsPending: (n) => `${n} borrador${n !== 1 ? 'es' : ''} pendiente${n !== 1 ? 's' : ''}`,
  chartEmailsLast7: 'Correos Procesados - Últimos 7 Días',
  chartEmailIntake: 'Distribución de Correos',
  chartNoEmailsYet: 'No hay correos procesados aún',
  sectionSystemHealth: 'Salud del Sistema',
  labelLastPoll: 'Último Sondeo Exitoso',
  labelEmailsThisWeek: 'Correos Procesados Esta Semana',
  labelRecentErrors: 'Errores Recientes',
  sectionProcessingFailures: 'Fallas de Procesamiento',
  failureNone: 'No hay correos atascados o fallidos. El pipeline funciona correctamente.',
  failureSome: (n) => `${n} correo${n !== 1 ? 's' : ''} fallido${n !== 1 ? 's' : ''} o atascado${n !== 1 ? 's' : ''}. Haz clic en Reintentar para restablecer en el próximo ciclo del worker.`,
  queueAllClear: 'Todas las colas vacías - nada pendiente de revisión humana.',
  queueNeedsAttention: (n) => `${n} elemento${n !== 1 ? 's' : ''} ${n !== 1 ? 'necesitan' : 'necesita'} atención en todas las colas.`,
  sectionReviewQueues: 'Colas de Revisión',
  sectionQueueHealthChart: 'Salud de Colas - Vista Rápida',
  sectionMemoryQueue: 'Cola de Revisión de Memoria',
  sectionSensitiveReview: 'Revisión Sensible',
  sectionUpcomingReviews: 'Próximas Revisiones - Roles y Políticas',
  upcomingReviewsSub: '(próximos 60 días, más cercanas primero)',
  sectionRoleHealthVacant: 'Salud de Roles - Vacantes y Términos por Vencer',
  roleHealthAllClear: 'Todos los roles activos están ocupados y ningún término vence en 30 días.',
  roleHealthVacant: (n) => `${n} rol${n !== 1 ? 'es' : ''} vacante${n !== 1 ? 's' : ''} necesita${n !== 1 ? 'n' : ''} llenarse. `,
  roleHealthExpiring: (n) => `${n} término${n !== 1 ? 's' : ''} vence${n !== 1 ? 'n' : ''} en 30 días.`,
  roleHealthBadgeVacant: 'Vacante',
  roleHealthBadgeExpiring: 'Término Próximo',
  queueLabels: [
    { label: 'Cambios de Canon',   desc: 'Pendiente de Revisión' },
    { label: 'Cola de Memoria',    desc: 'Pendiente de Revisión' },
    { label: 'Decisiones',         desc: 'Candidato o Necesita Claridad' },
    { label: 'Revisión Sensible',  desc: 'Pendiente de Revisión' },
    { label: 'Libro Mayor CCOS',   desc: 'Borrador o Pendiente' },
    { label: 'Tareas Sin Dueño',   desc: 'Abiertas, sin responsable asignado' },
    { label: 'Riesgos Altos',      desc: 'Severidad: Alta, Abiertos' },
    { label: 'Borradores KB',      desc: 'Artículos en borrador pendientes de revisión' },
  ],
  statEmailsAllTime: 'Correos Procesados (Total)',
  statRecentSuccessRate: 'Tasa de Éxito Reciente',
  statAccessFailures: 'Fallas de Acceso',
  statRecentFailures: 'Fallas Recientes',
  statPipelineFailures: 'Fallas de Pipeline',
  subIngestedThisWeek: (n) => `${n} ingestado${n !== 1 ? 's' : ''} esta semana`,
  subProcessedOk: (ok, total) => `${ok} de los últimos ${total} procesados OK`,
  subDriveAssetsNeedReview: 'Activos de Drive que necesitan revisión manual',
  subInLastEmails: (n) => `en los últimos ${n} correos`,
  subEmailsStuck: 'correos atascados o fallidos - ver Colas',
  subAllClear: 'todo bien',
  emailStatusStuck: 'Atascado',
  emailStatusFailed: 'Fallido',
  emailStatusPending: 'Pendiente',
  subOverdue: (n) => `${n} vencida${n !== 1 ? 's' : ''}`,
  sectionLast10Emails: 'Últimos 10 Correos Ingestados',
  sectionActivityLog: 'Registro de Actividad de Extracción',
  activityFilterPlaceholder: 'Filtrar actividad…',
  sectionDriveAccessFailures: 'Fallas de Acceso a Drive - Revisión Manual',
  sectionPolicyLibrary: 'Biblioteca de Políticas',
  statTotalPolicies: 'Total de Políticas',
  statDraft: 'Borrador',
  statActive: 'Activa',
  statMissingCircle: 'Círculo Faltante',
  subAwaitingRatification: 'Esperando ratificación',
  subInEffect: 'En vigor',
  subNeedResponsibleCircle: 'Necesita Círculo Responsable',
  sectionRolesDirectory: 'Directorio de Roles',
  rolesDirectoryDesc: 'Titulares de roles activos (desde Asignaciones de Roles). Las Asignaciones de Roles son la fuente de verdad - cada una registra quién ocupa el rol, desde cuándo y los límites de término. Las asignaciones históricas se cuentan en la columna Historial.',
  sectionRoleHealth: 'Salud de Roles',
  sectionHowMuchSeraKnows: '¿Cuánto Sabe Sera?',
  howMuchSeraKnowsDesc: 'Total de registros que Sera ha capturado en las categorías clave de memoria de la organización. Números más altos significan más conocimiento institucional estructurado y buscable. Conteos bajos en una categoría sugieren que esa área aún no se está capturando.',
  subRecordsCapturedByType: 'Registros capturados por tipo',
  subPolicyMaturity: 'Madurez de políticas - cuánta gobernanza está ratificada vs. en borrador',
  sectionCollapseHealth: 'Monitor de Salud Organizacional',
  collapseHealthDesc: 'Sera monitorea cada reunión y correo procesado en busca de señales tempranas de advertencia de los 7 patrones de colapso organizacional. Las señales se almacenan como riesgos de Patrón de Colapso en Notion.',
  collapseAllClear: 'No se detectaron señales de patrones de colapso en riesgos abiertos. Los indicadores de salud organizacional están despejados.',
  collapseHasSignals: (n) => `${n} señal${n !== 1 ? 'es' : ''} activa${n !== 1 ? 's' : ''} de patrones de colapso detectada${n !== 1 ? 's' : ''} en riesgos abiertos. Revise y atienda con prontitud.`,
  collapseActiveSignals: 'Señales Activas',
  collapseStatusClear: 'Despejado',
  collapseStatusWarning: 'Advertencia',
  collapseStatusCritical: 'Crítico',
  collapseNoSignals: 'Sin señales',
  collapseAndMore: (n) => `...y ${n} más en Notion`,
  heroPeopleProfiles: 'Perfiles Conocidos',
  heroActiveMembers: 'Miembros Activos',
  heroExpertiseAreas: 'Áreas de Experiencia',
  heroTopContributor: 'Mayor Contribuidor',
  subPeopleAndOrgs: (p, o) => `${p} persona${p !== 1 ? 's' : ''} · ${o} organización${o !== 1 ? 'es' : ''}`,
  subEngagementActive: 'estado de participación: Activo',
  subUniqueSkillsTags: 'habilidades y etiquetas únicas en la comunidad',
  subHighestSeraScore: (n) => `Sera Score más alto: ${n}`,
  sectionInfluenceMap: 'Mapa de Influencia - Quiénes Impulsan las Cosas',
  influenceMapDesc: 'Cada burbuja = una persona. Posición = reuniones organizadas (X) × tareas completadas (Y). Tamaño = Sera Score. Pasa el cursor para explorar.',
  influenceMapEmpty: 'Sin datos de actividad aún - los perfiles se llenarán a medida que Sera procese reuniones.',
  sectionCommunitySkills: 'Habilidades y Experiencia de la Comunidad',
  communitySkillsEmpty: 'Sin etiquetas en perfiles aún',
  sectionRelationshipToAmora: 'Relaciones con la Comunidad',
  relationshipEmpty: 'Sin datos de relación aún',
  sectionSeraLeaderboard: 'Tabla de Líderes Sera Score',
  seraScoreDesc: 'Puntaje = (roles activos × 10) + (reuniones organizadas × 5) + (tareas completadas × 3) + (tareas asignadas × 1)',
  sectionCommunityGrowth: 'Crecimiento de la Comunidad - Nuevos Perfiles Descubiertos por Mes',
  statTotalTasks: 'Total de Tareas',
  statCompleted: 'Completadas',
  statOpen: 'Abiertas',
  statCompletionRate: 'Tasa de Finalización',
  subExtractedBySera: 'extraídas por Sera',
  subMarkedDone: 'marcadas como Terminadas',
  subOrgWideAllTime: 'toda la organización, todo el tiempo',
  sectionTaskChampions: 'Campeones de Tareas',
  sectionTaskVelocity: 'Velocidad de Tareas - Últimas 8 Semanas',
  legendCreated: 'Creadas',
  legendCompleted: 'Completadas',
  sectionPriorityBreakdown: 'Distribución de Prioridades',
  noPriorityTasks: 'Sin tareas con prioridad definida',
  sectionStatusDistribution: 'Distribución de Estados',
  noTasksYet: 'Sin tareas aún',
  sectionPipeline: 'Pipeline',
  crmPipelineSub: (n) => `${n} contacto${n !== 1 ? 's' : ''} con Etapa de Lead`,
  sectionFollowUpsDue: 'Seguimientos Pendientes',
  crmFollowUpsSub: (n) => `${n} vencido${n !== 1 ? 's' : ''} o con vencimiento hoy`,
  sectionRecentInteractions: 'Interacciones Recientes',
  recentInteractionsDesc: 'Registradas automáticamente por Sera al procesar correos y reuniones',
  crmNoPipeline: 'Aún no hay contactos con Etapa de Lead asignada. Abre un perfil en Notion y asigna una Etapa de Lead para comenzar.',
  crmNoFollowUps: 'Sin seguimientos vencidos. Buen trabajo manteniéndote al día con los contactos.',
  crmInteractionsDisabled: 'Ejecuta el script <code>migrate-crm</code> y agrega <code>NOTION_DB_INTERACTIONS</code> en Railway para habilitar el historial de interacciones.',
  crmNoInteractions: 'Aún no hay interacciones registradas. Aparecerán aquí automáticamente cuando Sera procese correos y reuniones.',
  sectionDashboardTimezone: 'Zona Horaria del Panel',
  timezoneDesc: 'Controla cómo se calculan los conteos de "Últimos 7 Días" y la visualización de fechas. Tu selección se guarda en una cookie del navegador.',
  labelActiveTimezone: 'Zona horaria activa:',
  btnSave: 'Guardar',
  sectionSeraLanguage: 'Idioma de Respuesta de Sera',
  languageDesc: 'Controla el idioma que usa Sera en respuestas de Q&A, tarjetas de roles y estatutos de círculos. Los valores de campos en Notion permanecen en inglés por consistencia. Los cambios tienen efecto en 30 minutos, sin redespliegue.',
  labelResponseLanguage: 'Idioma de respuesta:',
  sectionGoverningPurpose: 'Declaración de Propósito Rector',
  gpsDesc: 'Sera inyecta esto en cada extracción para puntuar la Alineación de Propósito en todos los Candidatos de Decisión. Los cambios tienen efecto en 30 minutos, sin redespliegue.',
  labelFullGps: 'GPS Completo',
  btnSaveGps: 'Guardar GPS',
  labelPurposeTest: 'Prueba de Propósito en Una Frase',
  purposeTestSub: '(usada en cada decisión: "¿Esto nos acerca a nuestro propósito?")',
  btnSavePurposeTest: 'Guardar Prueba de Propósito',
  sectionSystemConfig: 'Configuración del Sistema',
  cfgAiModel: 'Modelo de IA',
  cfgPollInterval: 'Intervalo de Sondeo',
  cfgMaxRetry: 'Máximo de Reintentos',
  cfgTenant: 'Inquilino',
  cfgAdminNotifications: 'Notificaciones de Administrador',
  systemConfigNote: 'Para cambiar esta configuración, actualiza las variables de entorno de Railway correspondientes y redesplega.',
  hubSettingsNotConfigured: 'Establece <code>NOTION_HUB_SETTINGS_PAGE_ID</code> en todos los servicios de Railway para habilitar la edición en vivo.',
  sectionSystemBalances: 'Saldos del Sistema',
  systemBalancesDesc: 'Saldo de créditos en tiempo real para los servicios conectados a este hub.',
  balanceRailwayLabel: 'Créditos Railway',
  balanceCreditRemaining: 'Créditos restantes',
  balanceNotConfigured: 'No configurado',
  balanceUnavailable: 'No disponible',
  balanceRefresh: 'Actualizar',
  balanceLoading: 'Cargando...',
  balanceCheckedAt: (t) => `Verificado a las ${t}`,
};

function getDashboardLocale(language: string): { tips: Array<{ badge: string; text: string }>; ui: UiStrings } {
  if (language === 'Spanish') return { tips: SERA_TIPS_ES, ui: UI_ES };
  return { tips: SERA_TIPS, ui: UI_EN };
}

const SERA_AVATAR_IMG = `<img class="sera-avatar" src="data:image/jpeg;base64,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">`;

// ── Collapse Health section builder ──────────────────────────────────────────

const PATTERN_ICONS: Record<string, string> = {
  'No Shared Vision':    '&#127919;',
  'Poor Governance':     '&#9878;&#65039;',
  'Financial Fragility': '&#128200;',
  'Interpersonal Conflict': '&#9889;',
  'Burnout':             '&#128293;',
  'Wrong People':        '&#129533;',
  'Scale Trap':          '&#128259;',
};

const PATTERN_DESCRIPTIONS: Record<string, string> = {
  'No Shared Vision':    'Disagreement about purpose or direction',
  'Poor Governance':     'Role ambiguity, repeated decisions, bypassed process',
  'Financial Fragility': 'Cash flow concerns, runway pressure',
  'Interpersonal Conflict': 'Named tension between individuals',
  'Burnout':             'Overwhelm, missed commitments, withdrawal signals',
  'Wrong People':        'Skill gaps, role-holder misalignment',
  'Scale Trap':          'Coordination failures, capacity bottlenecks',
};

function buildCollapseHealthSection(d: DashboardData, ui: UiStrings): string {
  const ch = d.collapseHealth;
  const total = ch.totalActive;
  const anyHigh = ch.signals.some(s => s.severity === 'High');

  const headerCls = total === 0 ? 'ok' : anyHigh ? 'err' : 'warn';
  const headerMsg = total === 0 ? ui.collapseAllClear : ui.collapseHasSignals(total);

  const patternCards = (COLLAPSE_PATTERNS as readonly string[]).map(name => {
    const count = ch.patternCounts[name] ?? 0;
    const statusColor = count === 0 ? 'var(--green)' : count <= 2 ? 'var(--amber)' : 'var(--red)';
    const statusLabel = count === 0 ? ui.collapseStatusClear : count <= 2 ? ui.collapseStatusWarning : ui.collapseStatusCritical;
    return `<div style="background:var(--card);border:1px solid ${count === 0 ? 'var(--card-border)' : statusColor};border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:18px">${PATTERN_ICONS[name] ?? ''}</span>
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;background:${statusColor}22;color:${statusColor}">${statusLabel}</span>
      </div>
      <div style="font-weight:600;font-size:13px">${esc(name)}</div>
      <div style="font-size:11px;color:var(--muted)">${esc(PATTERN_DESCRIPTIONS[name] ?? '')}</div>
      ${count > 0 ? `<div style="font-size:20px;font-weight:700;color:${statusColor};margin-top:4px">${count}</div>` : `<div style="font-size:12px;color:var(--green);margin-top:4px">${ui.collapseNoSignals}</div>`}
    </div>`;
  }).join('');

  const signalRows = ch.signals.length === 0 ? '' : `
    <div style="margin-top:20px">
      <h3 style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--muted)">${ui.collapseActiveSignals}</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${ch.signals.slice(0, 10).map(s => {
          const sevColor = s.severity === 'High' ? 'var(--red)' : s.severity === 'Medium' ? 'var(--amber)' : 'var(--muted)';
          const display = s.risk.replace(/^\[[^\]]+\]\s*/, '');
          return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--card);border:1px solid var(--card-border);border-left:3px solid ${sevColor};border-radius:8px">
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:2px">${esc(s.patternType)}</div>
              <div style="font-size:13px">${esc(display)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
              <span style="font-size:11px;padding:2px 7px;border-radius:99px;background:${sevColor}22;color:${sevColor};font-weight:600">${esc(s.severity)}</span>
              <span style="font-size:11px;color:var(--muted)">${esc(s.detectedAt)}</span>
            </div>
          </div>`;
        }).join('')}
        ${ch.signals.length > 10 ? `<div style="font-size:12px;color:var(--muted);padding:6px 0">${ui.collapseAndMore(ch.signals.length - 10)}</div>` : ''}
      </div>
    </div>`;

  return `<section>
    <h2>${ui.sectionCollapseHealth}</h2>
    <p class="dim" style="margin-bottom:14px">${ui.collapseHealthDesc}</p>
    <div class="banner ${headerCls}">${headerMsg}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:16px">
      ${patternCards}
    </div>
    ${signalRows}
  </section>`;
}

export function renderDashboard(d: DashboardData, orgName = 'Living Memory'): string {
  const locale = getDashboardLocale(d.systemConfig?.outputLanguage ?? 'English');

  // ── Status indicator ────────────────────────────────────────────────────────
  const lastPollAgeMin = d.lastPollAt
    ? (Date.now() - new Date(d.lastPollAt).getTime()) / 60000
    : Infinity;
  const statusClass = lastPollAgeMin < 10 ? 'ok' : lastPollAgeMin < 30 ? 'warn' : 'err';
  const statusText  = lastPollAgeMin < 10 ? locale.ui.statusOnline
    : lastPollAgeMin < 30 ? locale.ui.statusDelayed
    : d.lastPollAt ? locale.ui.statusStale : locale.ui.statusNeverPolled;

  // ── Queue totals ─────────────────────────────────────────────────────────────
  const queueTotal = Object.values(d.queues).reduce((a, b) => a + b, 0);
  const bannerCls  = queueTotal === 0 ? 'ok' : queueTotal > 20 ? 'err' : 'warn';
  const bannerMsg  = queueTotal === 0
    ? locale.ui.queueAllClear
    : locale.ui.queueNeedsAttention(queueTotal);

  // ── Queue cards ──────────────────────────────────────────────────────────────
  const queueCards = QUEUE_DEFS.map((q, i) => {
    const qloc = locale.ui.queueLabels[i] ?? q;
    const v   = d.queues[q.key];
    const cls = v === 0 ? 'zero' : v >= 10 ? 'high' : 'warn';
    const url = d.notionUrls[q.dbKey];
    const tag = url ? `a class="q-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer"` : `div class="q-card"`;
    const end = url ? 'a' : 'div';
    return `
    <${tag}>
      <div class="q-label">${qloc.label}</div>
      <div class="q-value ${cls}">${v}</div>
      <div class="q-desc">${qloc.desc}${url ? '<span class="q-notion-hint">Open in Notion</span>' : ''}</div>
    </${end}>`;
  }).join('');

  // ── Policy banner ────────────────────────────────────────────────────────────
  const policyOk  = d.policies.missingCircle === 0;
  const policyBnr = policyOk ? 'ok' : 'warn';
  const policyMsg = policyOk
    ? `All ${d.policies.total} policies have a Responsible Circle assigned.`
    : `${d.policies.missingCircle} polic${d.policies.missingCircle !== 1 ? 'ies' : 'y'} still missing a Responsible Circle.`;

  // ── Running since ────────────────────────────────────────────────────────────
  const rsd = d.metrics.runningSinceDays;
  const runningSinceStr = rsd === null ? 'N/A'
    : rsd === 0 ? 'Today'
    : rsd < 30  ? `${rsd}d`
    : `${Math.round(rsd / 30)}mo`;

  // ── Cache age & next poll ─────────────────────────────────────────────────────
  const cacheAgeSecs = d.cacheAgeSeconds;
  const cacheAgeStr = cacheAgeSecs < 60
    ? `${cacheAgeSecs}s ago`
    : `${Math.floor(cacheAgeSecs / 60)}m ${cacheAgeSecs % 60}s ago`;
  const nextPollIso = d.lastPollAt
    ? new Date(new Date(d.lastPollAt).getTime() + d.systemConfig.pollIntervalSeconds * 1000).toISOString()
    : null;

  // ── Global alert banner (processing failures only — Drive access issues surface in Activity tab) ──
  const dataErrorBannerHtml = d.dataError
    ? `<div class="alert-global">&#9888; <strong>Notion Unavailable:</strong> ${esc(d.dataError)} - data will reload automatically when the connection recovers. <a href="/" style="color:var(--red)">Refresh now</a></div>`
    : '';

  const alertBannerHtml = d.failedEmailList.length === 0 ? '' : (() => {
    const stuck  = d.failedEmailList.filter(e => e.status === 'Processing').length;
    const failed = d.failedEmailList.filter(e => e.status === 'Failed').length;
    const desc = [
      failed > 0 ? `${failed} failed email${failed !== 1 ? 's' : ''}` : '',
      stuck > 0  ? `${stuck} stuck in processing` : '',
    ].filter(Boolean).join(', ');
    return `<div class="alert-global">&#9888; <strong>Processing Alert:</strong> ${desc} - <a href="javascript:void(0)" onclick="document.querySelector('[data-tab=queues]').click()">view in Queues tab</a></div>`;
  })();

  // ── Failed email list ─────────────────────────────────────────────────────────
  const failedEmailHtml = d.failedEmailList.length === 0
    ? `<p class="dim">${locale.ui.failureNone}</p>`
    : `<div class="fail-list">${d.failedEmailList.map(e => {
        const subj = (e.subject || '(no subject)').slice(0, 90);
        const fromShort = e.from.replace(/^.*?<|>.*$/g, '').trim() || e.from;
        const isStuck = e.status === 'Processing';
        const statusLabel = isStuck ? locale.ui.emailStatusStuck : locale.ui.emailStatusFailed;
        const statusCls   = isStuck ? 's-stuck' : 's-failed';
        const when = e.createdAt ? fmt(e.createdAt) : '';
        return `<div class="fail-row">
          <div>
            <div class="fail-subject">${esc(subj)}</div>
            <div class="fail-meta">
              <span>from <strong>${esc(fromShort.slice(0, 45))}</strong></span>
              ${when ? `<span>${when}</span>` : ''}
              ${e.rawSnippet ? `<span class="dim">${esc(e.rawSnippet.slice(0, 60))}…</span>` : ''}
            </div>
          </div>
          <div class="fail-actions">
            <span class="fail-status ${statusCls}">${statusLabel}</span>
            <form method="POST" action="/reprocess-email/${esc(e.id)}" onsubmit="return confirm('Reset this email for retry on next worker poll?')">
              <button class="btn" style="font-size:11px;padding:4px 10px">Retry</button>
            </form>
            ${e.notionUrl ? `<a href="${esc(e.notionUrl)}" target="_blank" rel="noopener" style="font-size:10px">Open in Notion &#8599;</a>` : ''}
          </div>
        </div>`;
      }).join('')}</div>`;

  // ── Access failures table ────────────────────────────────────────────────────
  const failuresHtml = d.accessFailures.length === 0
    ? '<p class="dim">No assets in Manual Review.</p>'
    : `<table><thead><tr><th>Asset</th><th>Type</th><th>Retries</th><th>Error</th><th></th></tr></thead><tbody>
        ${d.accessFailures.map(f => `
          <tr>
            <td>${f.driveLink ? `<a href="${esc(f.driveLink)}" target="_blank">${esc(f.assetName)}</a>` : esc(f.assetName)}</td>
            <td>${esc(f.assetType)}</td>
            <td>${f.retryCount}</td>
            <td class="errtxt">${esc(f.errorMessage)}</td>
            <td>
              <form method="POST" action="/retry/${esc(f.id)}" onsubmit="return confirm('Reset this asset for retry?')">
                <button class="btn">Retry</button>
              </form>
            </td>
          </tr>`).join('')}
      </tbody></table>`;

  // ── Role health panel ────────────────────────────────────────────────────────
  // ── Upcoming reviews table ───────────────────────────────────────────────────
  const upcomingReviewsHtml = d.upcomingReviews.length === 0
    ? '<p class="dim">No roles or policies are due for review in the next 60 days.</p>'
    : `<table class="ur-table"><thead><tr>
        <th style="width:42%">Name</th>
        <th style="width:10%">Type</th>
        <th style="width:20%">Review Date</th>
        <th>Due</th>
      </tr></thead><tbody>
      ${d.upcomingReviews.map(r => {
        const daysCls = r.daysUntil < 0 ? 'overdue' : r.daysUntil <= 14 ? 'soon' : 'ok';
        const daysLabel = r.daysUntil < 0 ? `${Math.abs(r.daysUntil)}d overdue` : r.daysUntil === 0 ? 'Today' : `${r.daysUntil}d`;
        const name = r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a>` : esc(r.name);
        return `<tr>
          <td>${name}</td>
          <td><span class="ur-type ${r.type}">${r.type}</span></td>
          <td class="dim">${r.reviewDate}</td>
          <td><span class="ur-days ${daysCls}">${daysLabel}</span></td>
        </tr>`;
      }).join('')}
      </tbody></table>`;

  const vacantCount  = d.roleHealth.filter(r => r.issue === 'vacant').length;
  const expiringCount = d.roleHealth.filter(r => r.issue === 'expiring').length;
  const roleHealthHtml = d.roleHealth.length === 0
    ? '<p class="dim">All active roles are filled and no terms expire in the next 30 days.</p>'
    : `<div class="rh-grid">${d.roleHealth.map(r => {
      const tag = r.url ? `a class="rh-item" href="${esc(r.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"` : 'div class="rh-item"';
      const end = r.url ? 'a' : 'div';
      return `<${tag}>
        <span class="rh-badge ${r.issue}">${r.issue === 'vacant' ? locale.ui.roleHealthBadgeVacant : locale.ui.roleHealthBadgeExpiring}</span>
        <div class="rh-role">${esc(r.roleName)}</div>
        <div class="rh-circle">${esc(r.circleName)}${r.expiresAt ? ` - expires ${esc(r.expiresAt)}` : ''}</div>
      </${end}>`;
    }).join('')}</div>`;

  // ── Roles directory table ────────────────────────────────────────────────────
  function formatSince(iso: string): string {
    if (!iso) return '';
    const d2 = new Date(iso);
    return d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  let rolesDirectoryHtml = '';
  if (d.rolesDirectory.length === 0) {
    rolesDirectoryHtml = '<p class="dim">No roles found.</p>';
  } else {
    // Group by circle
    const byCircle = new Map<string, typeof d.rolesDirectory>();
    for (const r of d.rolesDirectory) {
      const list = byCircle.get(r.circleName) ?? [];
      list.push(r);
      byCircle.set(r.circleName, list);
    }
    const roleTableHeader = `<thead><tr>
        <th style="width:38%">Role</th>
        <th style="width:28%">Current Holder</th>
        <th style="width:14%">Since</th>
        <th>Previous Holders</th>
      </tr></thead>`;
    rolesDirectoryHtml = `<div class="rd-circles">
      ${[...byCircle.entries()].map(([circle, roles]) => {
        const vacantCount = roles.filter(r => r.activeHolders.length === 0).length;
        const meta = `${roles.length} role${roles.length !== 1 ? 's' : ''}${vacantCount > 0 ? ` · <span style="color:var(--red)">${vacantCount} vacant</span>` : ''}`;
        const rows = roles.map(r => `<tr>
          <td>
            <a href="${esc(r.roleUrl)}" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none">${esc(r.roleName)}</a>${r.roleStatus === 'Proposed' ? `<span class="rd-status-proposed">Proposed</span>` : ''}
          </td>
          <td>
            ${r.activeHolders.length === 0
              ? '<span class="rd-vacant">Vacant</span>'
              : r.activeHolders.map(h => `<div class="rd-holder">${esc(h.name)}</div>`).join('')}
          </td>
          <td>
            ${r.activeHolders.map(h => `<div class="rd-since">${formatSince(h.since)}</div>`).join('')}
          </td>
          <td>
            ${r.pastHolders.length === 0
              ? '<span class="rd-past">-</span>'
              : r.pastHolders.slice(0, 3).map(h => `<div class="rd-past">${esc(h.name)}</div>`).join('')
                + (r.pastHolders.length > 3 ? `<div class="rd-past">+${r.pastHolders.length - 3} more</div>` : '')}
          </td>
        </tr>`).join('');
        return `<details class="rd-circle-section">
          <summary>
            <span class="rd-circle-name">${esc(circle)}</span>
            <span class="rd-circle-meta">${meta}</span>
          </summary>
          <div class="rd-circle-body">
            <table class="rd-table">${roleTableHeader}<tbody>${rows}</tbody></table>
          </div>
        </details>`;
      }).join('')}
    </div>`;
  }

  // ── Review queue item lists (with profile tags) ──────────────────────────────
  function profileTags(names: string[]): string {
    if (!names.length) return '';
    return `<span class="profile-tags">${names.map(n => `<span class="ptag">${esc(n)}</span>`).join('')}</span>`;
  }

  const memoryItemsHtml = d.memoryReviewItems.length === 0
    ? '<p class="dim">No pending memory candidates.</p>'
    : `<ul class="review-list">${d.memoryReviewItems.map(m => `
      <li class="review-item">
        <div class="review-item-top">
          ${m.url
            ? `<a class="review-title" href="${esc(m.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(m.title)}</a>`
            : `<span class="review-title">${esc(m.title)}</span>`}
          <span class="conf-badge conf-${m.confidence.toLowerCase()}">${esc(m.confidence)}</span>
          ${m.category ? `<span class="cat-badge">${esc(m.category)}</span>` : ''}
        </div>
        ${profileTags(m.relatedProfileNames)}
      </li>`).join('')}</ul>`;

  const sensitiveItemsHtml = d.sensitiveReviewItems.length === 0
    ? '<p class="dim">No pending sensitive flags.</p>'
    : `<ul class="review-list">${d.sensitiveReviewItems.map(s => `
      <li class="review-item">
        <div class="review-item-top">
          ${s.url
            ? `<a class="review-title" href="${esc(s.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(s.issue)}</a>`
            : `<span class="review-title">${esc(s.issue)}</span>`}
          ${s.dateFlagged ? `<span class="dim" style="font-size:11px">${esc(s.dateFlagged)}</span>` : ''}
        </div>
        ${profileTags(s.relatedProfileNames)}
      </li>`).join('')}</ul>`;

  const errorsHtml = d.recentErrors.length === 0
    ? '<p class="dim">No recent errors.</p>'
    : `<table><thead><tr><th>Source Type</th><th>Source ID</th><th>Error</th><th>When</th></tr></thead><tbody>
        ${d.recentErrors.map(e => `
          <tr>
            <td>${esc(e.sourceType)}</td>
            <td class="mono">${esc(e.sourceId)}</td>
            <td class="errtxt">${esc(e.error)}</td>
            <td class="dim">${fmt(e.startedAt)}</td>
          </tr>`).join('')}
      </tbody></table>`;

  // ── Activity log ──────────────────────────────────────────────────────────────
  const EVENT_LABELS: Record<string, string> = {
    extraction:           'Extraction',
    error:                'Error',
    access_request_sent:  'Access Request',
    retry_scheduled:      'Retry Queued',
    scheduled_task:       'Scheduled Task',
  };
  const activityLogHtml = d.recentActivity.length === 0
    ? '<p class="dim">No recent activity to show.</p>'
    : `<div class="activity-feed">${d.recentActivity.map(a => {
        const statusCls = a.status === 'completed' ? 'ok' : a.status === 'failed' ? 'err' : 'warn';
        const label = EVENT_LABELS[a.eventType] ?? a.eventType;
        const tokens = a.tokenEstimate > 0 ? `<span class="act-meta">${a.tokenEstimate.toLocaleString()} tokens</span>` : '';
        const records = a.createdRecords ? `<span class="act-meta dim">${esc(a.createdRecords.slice(0, 60))}</span>` : '';
        const errMsg  = a.error ? `<div class="act-error">${esc(a.error.slice(0, 120))}</div>` : '';
        const src     = a.sourceId ? `<span class="act-src dim">${esc(a.sourceId.slice(0, 50))}</span>` : '';
        return `<div class="act-row">
          <div class="act-dot ${statusCls}"></div>
          <div class="act-body">
            <div class="act-top">
              <span class="act-type">${esc(label)}</span>
              ${src}
              ${tokens}
              ${records}
            </div>
            ${errMsg}
          </div>
          <div class="act-time dim">${fmt(a.startedAt)}</div>
        </div>`;
      }).join('')}</div>`;

  // ── Email feed ───────────────────────────────────────────────────────────────
  const EMAIL_TYPE_MAP: Record<string, { cls: string; label: string }> = {
    'Google Meet Recording': { cls: 'etype-recording', label: 'Recording' },
    'Google Meet Transcript': { cls: 'etype-transcript', label: 'Transcript' },
    'Google Meet Notes':       { cls: 'etype-notes',      label: 'Notes' },
    'Operational Email':       { cls: 'etype-operational', label: 'Operational' },
    'Forwarded Thread':        { cls: 'etype-forwarded',   label: 'Forwarded' },
  };
  const emailTypeBadge = (t: string) => {
    const m = EMAIL_TYPE_MAP[t] ?? { cls: 'etype-unknown', label: t || 'Unknown' };
    return `<span class="etype ${m.cls}">${esc(m.label)}</span>`;
  };
  const emailStatusCls = (s: string) =>
    s === 'Processed' ? 's-processed' : s === 'Failed' ? 's-failed' :
    s === 'Needs Access' ? 's-needs-access' : s === 'Manual Review' ? 's-manual-review' : 's-default';
  const emailRowCls = (s: string) =>
    s === 'Failed' ? ' status-failed' : s === 'Needs Access' ? ' status-needs-access' : '';

  const emailSuccessCount = d.recentEmails.filter(e => e.processingStatus === 'Processed').length;
  const emailFailCount    = d.recentEmails.filter(e => e.processingStatus === 'Failed').length;
  const emailFeedHtml = d.recentEmails.length === 0
    ? '<p class="dim">No emails ingested yet.</p>'
    : `<div class="email-feed">${d.recentEmails.map(e => {
        const subj = (e.subject || '(no subject)').slice(0, 90);
        const fromShort = e.from.replace(/^.*?<|>.*$/g, '').trim() || e.from;
        const subjHtml = e.url
          ? `<a class="email-subject" href="${esc(e.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(subj)}</a>`
          : `<div class="email-subject">${esc(subj)}</div>`;
        return `<div class="email-row${emailRowCls(e.processingStatus)}">
          <div>
            ${subjHtml}
            <div class="email-meta">
              ${emailTypeBadge(e.emailType)}
              <span>from <strong>${esc(fromShort.slice(0, 45))}</strong></span>
              ${e.receivedDate ? `<span>${fmt(e.receivedDate)}</span>` : ''}
            </div>
            ${e.errorSnippet ? `<div class="email-error">${esc(e.errorSnippet)}</div>` : ''}
          </div>
          <div class="email-right">
            <span class="email-status ${emailStatusCls(e.processingStatus)}">${esc(e.processingStatus || locale.ui.emailStatusPending)}</span>
            ${e.processedAt ? `<span class="dim" style="font-size:10px">${fmt(e.processedAt)}</span>` : ''}
          </div>
        </div>`;
      }).join('')}</div>`;

  // ── Chart data (server-side JSON, safe — all values are numbers/strings from Notion) ─
  const activityJson = JSON.stringify(
    d.metrics.weeklyActivity.map(a => ({ count: a.count, label: dayLabel(a.date) })),
  );
  const typeTotal = Object.values(d.metrics.emailTypeBreakdown).reduce((a, b) => a + b, 0);
  const typeJson  = JSON.stringify(d.metrics.emailTypeBreakdown);

  // ── People tab ───────────────────────────────────────────────────────────────
  const RANK_ICONS = ['🥇', '🥈', '🥉'];
  const maxScore = d.people.topProfiles.reduce((m, p) => Math.max(m, p.seraScore), 1);
  const pcCard = (p: typeof d.people.topProfiles[0], i: number) => {
    const rankLabel = i < 3 ? RANK_ICONS[i] : `#${i + 1}`;
    const tagsHtml = p.tags.slice(0, 3).map(t => `<span class="pc-tag">${esc(t)}</span>`).join('');
    return `<div class="pc-card">
      <div class="pc-score">${p.seraScore}</div>
      <div class="pc-name"><span class="pc-rank">${rankLabel}</span> ${esc(p.name)}</div>
      <div class="pc-meta">
        <span class="pc-badge pc-type">${esc(p.profileType)}</span>
        ${p.relationship ? `<span class="pc-badge pc-rel">${esc(p.relationship)}</span>` : ''}
      </div>
      ${tagsHtml ? `<div class="pc-tags">${tagsHtml}</div>` : ''}
      <div class="pc-stats">
        <div><span class="pc-stat-val">${p.activeRoles}</span>roles</div>
        <div><span class="pc-stat-val">${p.meetingsOrganized}</span>meetings</div>
        <div><span class="pc-stat-val green">${p.tasksDone}</span>tasks done</div>
      </div>
    </div>`;
  };
  const profileCardsHtml = d.people.topProfiles.length > 0
    ? d.people.topProfiles.map((p, i) => pcCard(p, i)).join('')
    : '<p class="dim">No profiles yet. Sera will build them as emails are processed.</p>';

  // ── Performance tab ──────────────────────────────────────────────────────────
  const MEDALS = ['🥇', '🥈', '🥉'];
  const perf = d.performance;
  const perfTotal = perf.byStatus.open + perf.byStatus.inProgress + perf.byStatus.done + perf.byStatus.cancelled + perf.byStatus.needsOwner;
  const overallRate = perfTotal > 0 ? Math.round((perf.byStatus.done / perfTotal) * 100) : 0;
  const lbCard = (p: typeof perf.leaderboard[0]) => {
    const medal = p.rank <= 3 ? MEDALS[p.rank - 1] : `#${p.rank}`;
    const topCls = p.rank === 1 ? ' top1' : p.rank === 2 ? ' top2' : p.rank === 3 ? ' top3' : '';
    return `<div class="lb-card${topCls}">
      <div class="lb-rank">${medal}</div>
      <div class="lb-name">${esc(p.name)}</div>
      <div class="lb-stats">
        <div><div class="lb-stat-val" style="color:var(--green)">${p.totalDone}</div>done</div>
        <div><div class="lb-stat-val">${p.totalAssigned}</div>assigned</div>
      </div>
      <div class="lb-bar-wrap"><div class="lb-bar-fill" style="width:${p.completionRate}%"></div></div>
      <div class="lb-bar-label">${p.completionRate}% completion rate</div>
      ${p.totalOverdue > 0 ? `<div class="lb-overdue">${p.totalOverdue} overdue</div>` : ''}
    </div>`;
  };
  const leaderboardHtml = perf.leaderboard.length > 0
    ? perf.leaderboard.map(lbCard).join('')
    : '<p class="dim">No tasks assigned to profiles yet. As Sera processes meetings, task champions will appear here.</p>';
  const perfPrioTotal = perf.priorityBreakdown.high + perf.priorityBreakdown.medium + perf.priorityBreakdown.low;

  // ── CRM tab ──────────────────────────────────────────────────────────────────
  const crm = d.crm;
  const crmMaxCount = crm.pipeline.reduce((m, s) => Math.max(m, s.count), 1);
  const crmPipelineHtml = crm.pipeline.length === 0
    ? `<p class="dim">${locale.ui.crmNoPipeline}</p>`
    : `<div class="crm-pipeline">${crm.pipeline.map(s => {
        const pct = Math.round((s.count / crmMaxCount) * 100);
        return `<div class="crm-stage-row">
          <div class="crm-stage-name">${esc(s.stage)}</div>
          <div class="crm-stage-bar-wrap"><div class="crm-stage-bar" style="width:${pct}%"></div></div>
          <div class="crm-stage-count">${s.count}</div>
        </div>`;
      }).join('')}</div>`;

  const today = new Date().toISOString().slice(0, 10);
  const crmFollowUpsHtml = crm.followUps.length === 0
    ? `<p class="dim">${locale.ui.crmNoFollowUps}</p>`
    : crm.followUps.map(f => {
        const isOverdue = f.followUpDate < today;
        const isToday   = f.followUpDate === today;
        const dateCls   = isOverdue ? 'overdue' : isToday ? 'today' : 'soon';
        const nameHtml  = f.url
          ? `<a href="${esc(f.url)}" target="_blank" rel="noopener" class="crm-followup-name">${esc(f.name)}</a>`
          : `<span class="crm-followup-name">${esc(f.name)}</span>`;
        return `<div class="crm-followup-item">
          <div>
            ${nameHtml}
            ${f.nextAction ? `<div class="crm-followup-action">${esc(f.nextAction.slice(0, 80))}</div>` : ''}
            ${f.followUpOwner ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">${esc(f.followUpOwner)}</div>` : ''}
          </div>
          <div>
            <span class="crm-followup-date ${dateCls}">${esc(f.followUpDate)}</span>
            ${f.leadStage ? `<div style="font-size:10px;color:var(--muted);text-align:right;margin-top:4px">${esc(f.leadStage)}</div>` : ''}
          </div>
        </div>`;
      }).join('');

  const crmInteractionsHtml = !crm.interactionsEnabled
    ? `<p class="dim">${locale.ui.crmInteractionsDisabled}</p>`
    : crm.recentInteractions.length === 0
    ? `<p class="dim">${locale.ui.crmNoInteractions}</p>`
    : crm.recentInteractions.map(i => {
        const typeCls = i.type?.toLowerCase() ?? '';
        const nameHtml = i.url
          ? `<a href="${esc(i.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none" class="crm-interaction-name">${esc(i.name)}</a>`
          : `<span class="crm-interaction-name">${esc(i.name)}</span>`;
        return `<div class="crm-interaction-row">
          <div>
            <span class="crm-interaction-type ${typeCls}">${esc(i.type || 'Other')}</span>
            ${i.followUpNeeded ? '<span class="crm-flag" title="Follow-up needed"></span>' : ''}
          </div>
          <div class="crm-interaction-body">
            ${nameHtml}
            ${i.summary ? `<div class="crm-interaction-summary">${esc(i.summary)}</div>` : ''}
          </div>
          <div class="crm-interaction-date">${esc(i.date ?? '')}</div>
        </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sera | ${orgName}</title>
<script async src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" onload="if(window._chartReady)window._chartReady()"></script>
<style>${CSS}</style>
</head>
<body>

<header>
  <div class="header-left">
    <span class="header-logo"><img class="header-saberra-icon" src="data:image/png;base64,${SABERRA_ICON_B64}" alt="Saberra">Sera <span>· ${orgName}</span></span>
    <span class="status-dot ${statusClass}"></span>
    <span class="status-label">${statusText}</span>
  </div>
  <div class="header-right">
    <a href="/" class="header-meta" title="Click to refresh" style="text-decoration:none;color:inherit;cursor:pointer">${d.fromCache ? `Cached ${cacheAgeStr}` : `Live`}${nextPollIso ? ` &nbsp;·&nbsp; Next poll <span id="next-poll-hdr" data-at="${nextPollIso}">…</span>` : ''}</a>
    <button class="btn-ghost" onclick="toggleTheme()" id="theme-btn">Light</button>
    <a href="/" class="btn-ghost btn-reload" style="text-decoration:none">Reload</a>
    <button class="btn-ghost" onclick="signOut()">Sign Out</button>
  </div>
</header>

<div class="sera-outer">
  <div class="sera-outer-inner">
    <div class="sera-panel" id="sera-panel">
      <div class="sera-avatar-wrap" id="sera-avatar-wrap">${SERA_AVATAR_IMG}</div>
      <div class="sera-body">
        <span class="sera-badge" id="sera-badge"></span>
        <div class="sera-tip-text" id="sera-tip"></div>
        <div class="sera-dots" id="sera-dots">
          ${locale.tips.map((_, i) => `<div class="sera-dot${i === 0 ? ' active' : ''}" onclick="showTip(${i})"></div>`).join('')}
        </div>
      </div>
    </div>
  </div>
</div>

${dataErrorBannerHtml}${alertBannerHtml}

<nav class="tab-nav" id="tab-nav">
  <button class="tab-btn" data-tab="overview" onclick="switchTab('overview')">${locale.ui.tabOverview}</button>
  <button class="tab-btn" data-tab="sera-chat" onclick="switchTab('sera-chat')">${locale.ui.tabChatWithSera}</button>
  <button class="tab-btn" data-tab="queues" onclick="switchTab('queues')">${locale.ui.tabQueues}</button>
  <button class="tab-btn" data-tab="governance" onclick="switchTab('governance')">${locale.ui.tabGovernance}</button>
  <button class="tab-btn" data-tab="people" onclick="switchTab('people')">${locale.ui.tabPeople}</button>
  <button class="tab-btn" data-tab="activity" onclick="switchTab('activity')">${locale.ui.tabActivityOps}</button>
  <button class="tab-btn" data-tab="performance" onclick="switchTab('performance')">${locale.ui.tabPerformance}</button>
  <button class="tab-btn" data-tab="crm" onclick="switchTab('crm')">${locale.ui.tabCrm}</button>
  <button class="tab-btn" data-tab="settings" onclick="switchTab('settings')">${locale.ui.tabSettings}</button>
</nav>

<div class="wrap">

  <!-- ── Tab 1: Overview ──────────────────────────────────── -->
  <div id="tab-overview" class="tab-panel active">

    <!-- ── Hero metrics ──────────────────────────────────── -->
    <div class="hero-grid">
      <div class="hero-card g1">
        <div class="hero-label">${locale.ui.heroEstHoursSaved}</div>
        <div class="hero-value counter" data-target="${d.metrics.estimatedHoursSaved}">${num(d.metrics.estimatedHoursSaved)}</div>
        <div class="hero-sub">${locale.ui.heroSubHours}</div>
      </div>
      <div class="hero-card g2">
        <div class="hero-label">${locale.ui.heroEmailsProcessed}</div>
        <div class="hero-value counter" data-target="${d.metrics.emailsProcessed}">${num(d.metrics.emailsProcessed)}</div>
        <div class="hero-sub">${locale.ui.heroSubEmails}</div>
      </div>
      ${d.notionUrls.meetings ? `<a class="hero-card g3" href="${d.notionUrls.meetings}" target="_blank" rel="noopener">` : '<div class="hero-card g3">'}
        <div class="cn-hint">${locale.ui.openInNotion}</div>
        <div class="hero-label">${locale.ui.heroMeetingsCaptured}</div>
        <div class="hero-value counter" data-target="${d.community.totalMeetings}">${num(d.community.totalMeetings)}</div>
        <div class="hero-sub">${locale.ui.heroSubMeetings}</div>
      ${d.notionUrls.meetings ? '</a>' : '</div>'}
      ${d.notionUrls.profiles ? `<a class="hero-card g4" href="${d.notionUrls.profiles}" target="_blank" rel="noopener">` : '<div class="hero-card g4">'}
        <div class="cn-hint">${locale.ui.openInNotion}</div>
        <div class="hero-label">${locale.ui.heroPeopleKnown}</div>
        <div class="hero-value counter" data-target="${d.community.totalProfiles}">${num(d.community.totalProfiles)}</div>
        <div class="hero-sub">${locale.ui.heroSubPeople}</div>
      ${d.notionUrls.profiles ? '</a>' : '</div>'}
    </div>

    <!-- ── Charts ────────────────────────────────────────── -->
    <div class="chart-grid">
      <div class="chart-card">
        <h2>${locale.ui.chartEmailsLast7}</h2>
        <div class="chart-wrap"><canvas id="activityChart"></canvas></div>
      </div>
      <div class="chart-card">
        <h2>${locale.ui.chartEmailIntake} ${d.notionUrls.meetings ? `<a href="${d.notionUrls.meetings}" target="_blank" rel="noopener" style="font-size:11px;font-weight:400;margin-left:6px">Meetings &#8599;</a>` : ''}</h2>
        ${typeTotal > 0
          ? '<div class="chart-wrap"><canvas id="typeChart"></canvas></div>'
          : `<div class="chart-empty">${locale.ui.chartNoEmailsYet}</div>`}
      </div>
    </div>

    <!-- ── Sub-stats row ──────────────────────────────────── -->
    <div class="stat-grid" style="margin-bottom:20px">
      ${d.notionUrls.tasks ? `<a class="stat-card" href="${d.notionUrls.tasks}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.tasks ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statTasksExtracted}${d.notionUrls.tasks ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value">${num(d.metrics.totalTasks)}</div>
        <div class="s-sub">${locale.ui.subAcrossAllSources}</div>
      ${d.notionUrls.tasks ? '</a>' : '</div>'}
      ${d.notionUrls.decisionCandidates ? `<a class="stat-card" href="${d.notionUrls.decisionCandidates}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.decisionCandidates ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statDecisionsTracked}${d.notionUrls.decisionCandidates ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value">${num(d.metrics.totalDecisions)}</div>
        <div class="s-sub">${locale.ui.subCandidatesConfirmed}</div>
      ${d.notionUrls.decisionCandidates ? '</a>' : '</div>'}
      <div class="stat-card">
        <div class="s-label">${locale.ui.statActiveCircles}</div>
        <div class="s-value">${d.community.activeCircles}</div>
        <div class="s-sub">${locale.ui.subCcosCircles}</div>
      </div>
      ${d.notionUrls.risks ? `<a class="stat-card" href="${d.notionUrls.risks}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.risks ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statRisksTracked}${d.notionUrls.risks ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value">${num(d.community.totalRisks)}</div>
        <div class="s-sub">${locale.ui.subTotalLogged}</div>
      ${d.notionUrls.risks ? '</a>' : '</div>'}
      ${d.notionUrls.risks ? `<a class="stat-card" href="${d.notionUrls.risks}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.risks ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statOpenRisks}${d.notionUrls.risks ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value ${d.community.openRisks > 0 ? 'warn' : ''}">${num(d.community.openRisks)}</div>
        <div class="s-sub">${locale.ui.subHighSeverity(d.queues.highRisks)}</div>
      ${d.notionUrls.risks ? '</a>' : '</div>'}
      ${d.notionUrls.knowledgeBase ? `<a class="stat-card" href="${d.notionUrls.knowledgeBase}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.knowledgeBase ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statKbArticles}${d.notionUrls.knowledgeBase ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value">${num(d.metrics.totalKbArticles)}</div>
        <div class="s-sub">${locale.ui.subDraftsPending(d.queues.kbDrafts)}</div>
      ${d.notionUrls.knowledgeBase ? '</a>' : '</div>'}
    </div>

  </div>

  <!-- ── Tab 2: Queues ─────────────────────────────────────── -->
  <div id="tab-queues" class="tab-panel">

    <!-- ── Review queues ─────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionReviewQueues}</h2>
      <div class="banner ${bannerCls}">${bannerMsg}</div>
      <div class="queue-grid">${queueCards}</div>
    </section>

    <!-- ── Queue health chart ────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionQueueHealthChart}</h2>
      <div class="chart-wrap" style="height:220px"><canvas id="queueChart"></canvas></div>
    </section>

    <!-- ── Memory Review items ─────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionMemoryQueue} <span class="dim" style="font-weight:400;font-size:13px">- top ${d.memoryReviewItems.length} pending</span>
        ${d.notionUrls.memoryReviewQueue ? `<a href="${d.notionUrls.memoryReviewQueue}" target="_blank" rel="noopener" style="font-size:12px;font-weight:400;margin-left:8px">${locale.ui.openInNotion}</a>` : ''}
      </h2>
      ${memoryItemsHtml}
    </section>

    <!-- ── Sensitive Review items ───────────────────────── -->
    <section>
      <h2>${locale.ui.sectionSensitiveReview} <span class="dim" style="font-weight:400;font-size:13px">- top ${d.sensitiveReviewItems.length} pending</span>
        ${d.notionUrls.sensitiveReview ? `<a href="${d.notionUrls.sensitiveReview}" target="_blank" rel="noopener" style="font-size:12px;font-weight:400;margin-left:8px">${locale.ui.openInNotion}</a>` : ''}
      </h2>
      ${sensitiveItemsHtml}
    </section>

    <!-- ── Upcoming Reviews ─────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionUpcomingReviews} <span class="dim" style="font-weight:400;font-size:13px">${locale.ui.upcomingReviewsSub}</span></h2>
      ${upcomingReviewsHtml}
    </section>

    <!-- ── Role health ────────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionRoleHealthVacant}</h2>
      <div class="banner ${d.roleHealth.length === 0 ? 'ok' : vacantCount > 0 ? 'err' : 'warn'}">
        ${d.roleHealth.length === 0
          ? locale.ui.roleHealthAllClear
          : `${vacantCount > 0 ? locale.ui.roleHealthVacant(vacantCount) : ''}${expiringCount > 0 ? locale.ui.roleHealthExpiring(expiringCount) : ''}`
        }
      </div>
      ${roleHealthHtml}
    </section>

    <!-- ── Processing Failures ───────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionProcessingFailures}</h2>
      <div class="banner ${d.failedEmailList.length === 0 ? 'ok' : 'err'}">
        ${d.failedEmailList.length === 0
          ? locale.ui.failureNone
          : locale.ui.failureSome(d.failedEmailList.length)
        }
      </div>
      ${failedEmailHtml}
    </section>

  </div>

  <!-- ── Tab 3: Activity & Ops ─────────────────────────────── -->
  <div id="tab-activity" class="tab-panel">

    <!-- ── Email processing metrics ─────────────────────── -->
    <div class="stat-grid" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="s-label">${locale.ui.statEmailsAllTime}</div>
        <div class="s-value">${num(d.metrics.emailsProcessed)}</div>
        <div class="s-sub">${locale.ui.subIngestedThisWeek(d.community.processedThisWeek)}</div>
      </div>
      <div class="stat-card">
        <div class="s-label">${locale.ui.statRecentSuccessRate}</div>
        <div class="s-value" style="color:var(--green)">${d.recentEmails.length > 0 ? Math.round((emailSuccessCount / d.recentEmails.length) * 100) : 0}%</div>
        <div class="s-sub">${locale.ui.subProcessedOk(emailSuccessCount, d.recentEmails.length)}</div>
      </div>
      <div class="stat-card">
        <div class="s-label">${locale.ui.statAccessFailures}</div>
        <div class="s-value ${d.accessFailures.length > 0 ? 'warn' : ''}">${d.accessFailures.length}</div>
        <div class="s-sub">${locale.ui.subDriveAssetsNeedReview}</div>
      </div>
      <div class="stat-card">
        <div class="s-label">${locale.ui.statRecentFailures}</div>
        <div class="s-value ${emailFailCount > 0 ? 'warn' : ''}">${emailFailCount}</div>
        <div class="s-sub">${locale.ui.subInLastEmails(d.recentEmails.length)}</div>
      </div>
      <div class="stat-card" style="${d.failedEmailList.length > 0 ? 'border-color:rgba(239,68,68,0.4)' : ''}">
        <div class="s-label">${locale.ui.statPipelineFailures}</div>
        <div class="s-value" style="${d.failedEmailList.length > 0 ? 'color:var(--red)' : 'color:var(--green)'}">${d.failedEmailList.length}</div>
        <div class="s-sub">${d.failedEmailList.length > 0 ? locale.ui.subEmailsStuck : locale.ui.subAllClear}</div>
      </div>
    </div>

    <!-- ── Last 10 emails ────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionLast10Emails}</h2>
      ${emailFeedHtml}
    </section>

    <!-- ── Activity log ──────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionActivityLog}</h2>
      <input id="act-search" type="search" placeholder="${esc(locale.ui.activityFilterPlaceholder)}" style="width:100%;max-width:360px;margin-bottom:12px;padding:7px 12px;background:var(--card);border:1px solid var(--card-border);border-radius:8px;color:var(--text);font-size:13px;outline:none">
      ${activityLogHtml}
    </section>

    <!-- ── Access failures ───────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionDriveAccessFailures} (${d.accessFailures.length})</h2>
      ${failuresHtml}
    </section>

    <!-- ── System health ─────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionSystemHealth}</h2>
      <div class="health-grid">
        <div class="h-card">
          <div class="h-label">${locale.ui.labelLastPoll}</div>
          <div class="h-value ${d.lastPollAt ? 'ok' : 'warn'}">${fmt(d.lastPollAt)}</div>
        </div>
        <div class="h-card">
          <div class="h-label">${locale.ui.labelEmailsThisWeek}</div>
          <div class="h-value ok">${d.community.processedThisWeek}</div>
        </div>
      </div>
      <h2>${locale.ui.labelRecentErrors}</h2>
      ${errorsHtml}
    </section>

  </div>

  <!-- ── Tab 4: Governance ─────────────────────────────────── -->
  <div id="tab-governance" class="tab-panel">

    <!-- ── Collapse Health ───────────────────────────────── -->
    ${buildCollapseHealthSection(d, locale.ui)}

    <!-- ── Policy library ────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionPolicyLibrary}</h2>
      <div class="banner ${policyBnr}">${policyMsg}</div>
      <div class="stat-grid">
        <a class="stat-card" href="${d.notionUrls.policies}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:block">
          <div class="s-label" style="display:flex;align-items:center;gap:4px">${locale.ui.statTotalPolicies} <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div class="s-value">${d.policies.total}</div>
        </a>
        <div class="stat-card">
          <div class="s-label">${locale.ui.statDraft}</div>
          <div class="s-value">${d.policies.draft}</div>
          <div class="s-sub">${locale.ui.subAwaitingRatification}</div>
        </div>
        <div class="stat-card">
          <div class="s-label">${locale.ui.statActive}</div>
          <div class="s-value">${d.policies.active}</div>
          <div class="s-sub">${locale.ui.subInEffect}</div>
        </div>
        <div class="stat-card">
          <div class="s-label">${locale.ui.statMissingCircle}</div>
          <div class="s-value ${d.policies.missingCircle > 0 ? 'warn' : ''}">${d.policies.missingCircle}</div>
          <div class="s-sub">${locale.ui.subNeedResponsibleCircle}</div>
        </div>
      </div>
    </section>

    <!-- ── Roles Directory ───────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionRolesDirectory}</h2>
      <p class="dim" style="margin-bottom:10px">${locale.ui.rolesDirectoryDesc}</p>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;gap:6px"><span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1.5px solid var(--accent);border-radius:3px;flex-shrink:0;font-size:9px;color:var(--accent);font-weight:700">+</span> ${esc(locale.ui.rdTip)}</p>
      <input id="rd-search" type="search" placeholder="${esc(locale.ui.rdSearchPlaceholder)}" style="width:100%;max-width:400px;margin-bottom:12px;padding:7px 12px;background:var(--card);border:1px solid var(--card-border);border-radius:8px;color:var(--text);font-size:13px;outline:none">
      ${rolesDirectoryHtml}
    </section>

    <!-- ── Role Health ───────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionRoleHealth}</h2>
      <div class="banner ${d.roleHealth.length === 0 ? 'ok' : vacantCount > 0 ? 'err' : 'warn'}">
        ${d.roleHealth.length === 0
          ? locale.ui.roleHealthAllClear
          : `${vacantCount > 0 ? locale.ui.roleHealthVacant(vacantCount) : ''}${expiringCount > 0 ? locale.ui.roleHealthExpiring(expiringCount) : ''}`}
      </div>
      ${roleHealthHtml}
    </section>

    <!-- ── Institutional memory snapshot chart ──────────── -->
    <section>
      <h2>${locale.ui.sectionHowMuchSeraKnows}</h2>
      <p class="dim" style="margin-bottom:16px">${locale.ui.howMuchSeraKnowsDesc}</p>
      <div class="chart-grid" style="margin-bottom:0">
        <div class="chart-card" style="border:none;background:transparent;padding:0;box-shadow:none">
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-bottom:6px">${locale.ui.subRecordsCapturedByType}</p>
          <div class="chart-wrap" style="height:200px"><canvas id="communityChart"></canvas></div>
        </div>
        <div class="chart-card" style="border:none;background:transparent;padding:0;box-shadow:none">
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-bottom:6px">${locale.ui.subPolicyMaturity}</p>
          <div class="chart-wrap" style="height:200px"><canvas id="policyPieChart"></canvas></div>
        </div>
      </div>
    </section>

  </div>

  <!-- ── Tab 5: Settings ───────────────────────────────────── -->
  <div id="tab-settings" class="tab-panel">

    <!-- ── Timezone selector ─────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionDashboardTimezone}</h2>
      <p class="dim" style="margin-bottom:14px">${locale.ui.timezoneDesc}</p>
      <form method="POST" action="/settings/timezone" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <label for="tz-select" style="font-size:13px;font-weight:500">${locale.ui.labelActiveTimezone}</label>
        <select id="tz-select" name="tz" style="font-size:13px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);cursor:pointer">
          ${[
            ['Pacific/Honolulu',     'Hawaii (UTC-10)'],
            ['America/Anchorage',    'Alaska (UTC-9)'],
            ['America/Los_Angeles',  'Pacific (UTC-8/-7)'],
            ['America/Denver',       'Mountain (UTC-7/-6)'],
            ['America/Chicago',      'Central (UTC-6/-5)'],
            ['America/New_York',     'Eastern (UTC-5/-4)'],
            ['America/Costa_Rica',   'Costa Rica (UTC-6)'],
            ['America/Bogota',       'Colombia (UTC-5)'],
            ['America/Lima',         'Peru (UTC-5)'],
            ['America/Santiago',     'Chile (UTC-4/-3)'],
            ['America/Sao_Paulo',    'Brazil / Sao Paulo (UTC-3)'],
            ['America/Argentina/Buenos_Aires', 'Argentina (UTC-3)'],
            ['Atlantic/Azores',      'Azores (UTC-1/0)'],
            ['Europe/London',        'UK (UTC+0/+1)'],
            ['Europe/Paris',         'Central Europe (UTC+1/+2)'],
            ['Europe/Helsinki',      'Eastern Europe (UTC+2/+3)'],
            ['Africa/Nairobi',       'East Africa (UTC+3)'],
            ['Asia/Dubai',           'UAE (UTC+4)'],
            ['Asia/Kolkata',         'India (UTC+5:30)'],
            ['Asia/Bangkok',         'Southeast Asia (UTC+7)'],
            ['Asia/Singapore',       'Singapore (UTC+8)'],
            ['Asia/Tokyo',           'Japan (UTC+9)'],
            ['Australia/Sydney',     'Sydney (UTC+10/+11)'],
            ['Pacific/Auckland',     'New Zealand (UTC+12/+13)'],
          ].map(([val, label]) =>
            `<option value="${val}"${d.systemConfig.activeTz === val ? ' selected' : ''}>${label}</option>`
          ).join('')}
        </select>
        <button type="submit" style="font-size:13px;padding:6px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500">${locale.ui.btnSave}</button>
      </form>
      <p class="dim" style="margin-top:10px;font-size:11px">Server default: <code>${esc(process.env.DASHBOARD_TIMEZONE ?? 'America/Costa_Rica')}</code> &nbsp;-&nbsp; override with <code>DASHBOARD_TIMEZONE</code> Railway env var.</p>
    </section>

    <!-- ── Sera Language ─────────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionSeraLanguage}</h2>
      <p class="dim" style="margin-bottom:14px">${locale.ui.languageDesc}</p>
      ${d.systemConfig.hubSettingsConfigured ? `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <label for="lang-select" style="font-size:13px;font-weight:500">${locale.ui.labelResponseLanguage}</label>
        <select id="lang-select" style="font-size:13px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);cursor:pointer">
          ${[
            'English', 'Spanish', 'Portuguese', 'French', 'German',
            'Italian', 'Dutch', 'Polish', 'Russian', 'Arabic',
            'Hindi', 'Bengali', 'Japanese', 'Chinese (Simplified)', 'Chinese (Traditional)',
            'Korean', 'Turkish', 'Vietnamese', 'Thai', 'Swahili',
          ].map(lang =>
            `<option value="${lang}"${d.systemConfig.outputLanguage === lang ? ' selected' : ''}>${lang}</option>`
          ).join('')}
        </select>
        <button onclick="saveLanguage()" style="font-size:13px;padding:6px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500">${locale.ui.btnSave}</button>
        <span id="lang-status" style="font-size:12px;color:var(--muted)"></span>
      </div>
      ` : `<p class="dim">${locale.ui.hubSettingsNotConfigured}</p>`}
    </section>

    <!-- ── Governing Purpose Statement ──────────────────── -->
    <section>
      <h2>${locale.ui.sectionGoverningPurpose}</h2>
      <p class="dim" style="margin-bottom:14px">${locale.ui.gpsDesc}</p>
      ${d.systemConfig.hubSettingsConfigured ? `
      <div style="margin-bottom:16px">
        <label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">${locale.ui.labelFullGps}</label>
        <textarea id="gps-text" rows="6" style="width:100%;font-size:13px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);resize:vertical;line-height:1.6">${esc(d.systemConfig.governingPurpose ?? '')}</textarea>
        <div style="margin-top:8px;display:flex;align-items:center;gap:10px">
          <button onclick="saveGPS()" style="font-size:13px;padding:6px 16px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500">${locale.ui.btnSaveGps}</button>
          <span id="gps-status" style="font-size:12px;color:var(--muted)"></span>
        </div>
      </div>
      <div>
        <label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">${locale.ui.labelPurposeTest} <span class="dim">${locale.ui.purposeTestSub}</span></label>
        <textarea id="pt-text" rows="2" style="width:100%;font-size:13px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);resize:vertical;line-height:1.6">${esc(d.systemConfig.purposeTest ?? '')}</textarea>
        <div style="margin-top:8px;display:flex;align-items:center;gap:10px">
          <button onclick="savePurposeTest()" style="font-size:13px;padding:6px 16px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500">${locale.ui.btnSavePurposeTest}</button>
          <span id="pt-status" style="font-size:12px;color:var(--muted)"></span>
        </div>
      </div>
      ` : `<p class="dim">${locale.ui.hubSettingsNotConfigured}</p>`}
    </section>

    <!-- ── System settings ───────────────────────────────── -->
    <section>
      <h2>${locale.ui.sectionSystemConfig}</h2>
      <div class="cfg-grid">
        <div class="cfg-item">
          <div class="cfg-label">${locale.ui.cfgAiModel}</div>
          <div class="cfg-value mono">${esc(d.systemConfig.claudeModel)}</div>
        </div>
        <div class="cfg-item">
          <div class="cfg-label">${locale.ui.cfgPollInterval}</div>
          <div class="cfg-value">${d.systemConfig.pollIntervalSeconds}s (${Math.round(d.systemConfig.pollIntervalSeconds / 60)} min)</div>
        </div>
        <div class="cfg-item">
          <div class="cfg-label">${locale.ui.cfgMaxRetry}</div>
          <div class="cfg-value">${d.systemConfig.maxRetryCount}</div>
        </div>
        <div class="cfg-item">
          <div class="cfg-label">${locale.ui.cfgTenant}</div>
          <div class="cfg-value mono">${esc(d.systemConfig.tenantId)}</div>
        </div>
        <div class="cfg-item">
          <div class="cfg-label">${locale.ui.cfgAdminNotifications}</div>
          <div class="cfg-value mono" style="font-size:11px">${esc(d.systemConfig.adminEmail)}</div>
        </div>
      </div>
      <p class="dim" style="margin-top:14px">${locale.ui.systemConfigNote}</p>
    </section>

    <section class="card" style="margin-top:24px">
      <h2>${locale.ui.sectionSystemBalances}</h2>
      <p class="dim" style="font-size:12px;margin-bottom:16px">${locale.ui.systemBalancesDesc}</p>
      <div id="balances-panel"><p class="dim" style="font-size:13px">${locale.ui.balanceLoading}</p></div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
        <button onclick="refreshBalances()" style="font-size:12px;padding:5px 14px;background:var(--card-border);color:var(--text);border:1px solid var(--border);border-radius:6px;cursor:pointer">${locale.ui.balanceRefresh}</button>
        <span id="balances-ts" class="dim" style="font-size:11px"></span>
      </div>
    </section>

    <script>
    (function(){
      var UI = window.AMORA_UI || {};
      var L = {
        loading:        UI.balanceLoading        || 'Loading...',
        notConfigured:  UI.balanceNotConfigured  || 'Not configured',
        unavailable:    UI.balanceUnavailable    || 'Unavailable',
        railway:        UI.balanceRailwayLabel   || 'Railway Credits',
        credits:        UI.balanceCreditRemaining|| 'Credits remaining',
        checkedAt:      UI.balanceCheckedAt      || function(t){ return 'Checked at ' + t; },
      };
      function usd(n){ return n == null ? L.unavailable : '$' + Number(n).toFixed(2); }
      function renderBalances(d){
        var html = '<div style="max-width:320px">';
        html += '<div style="background:var(--card-border);border-radius:8px;padding:14px">';
        html += '<div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--muted)">' + L.railway + '</div>';
        if(!d.railway.available){
          html += '<div style="font-size:12px;color:var(--muted)">' + (d.railway.needsKey ? '<code style="font-size:10px">RAILWAY_API_TOKEN</code> not set' : L.unavailable) + '</div>';
        } else {
          html += '<div style="display:flex;justify-content:space-between;font-size:12px"><span class="dim">' + L.credits + '</span><span style="font-weight:600">' + usd(d.railway.creditBalance) + '</span></div>';
        }
        html += '</div>';
        html += '</div>';
        return html;
      }
      window.refreshBalances = function(){
        var panel = document.getElementById('balances-panel');
        var ts = document.getElementById('balances-ts');
        if(panel) panel.innerHTML = '<p class="dim" style="font-size:13px">' + L.loading + '</p>';
        fetch('/api/balances').then(function(r){ return r.json(); }).then(function(d){
          if(panel) panel.innerHTML = renderBalances(d);
          if(ts && d.checkedAt){
            var t = new Date(d.checkedAt).toLocaleTimeString();
            ts.textContent = typeof L.checkedAt === 'function' ? L.checkedAt(t) : L.checkedAt + ' ' + t;
          }
        }).catch(function(){
          if(panel) panel.innerHTML = '<p class="dim" style="font-size:13px">' + L.unavailable + '</p>';
        });
      };
      // Auto-fetch when Settings tab becomes active
      var origSwitch = window.switchTab;
      window.switchTab = function(tab){
        if(typeof origSwitch === 'function') origSwitch(tab);
        if(tab === 'settings') window.refreshBalances();
      };
      // Fetch on load if Settings is already active
      if(document.getElementById('tab-settings') && document.getElementById('tab-settings').style.display !== 'none'){
        window.refreshBalances();
      }
    })();
    </script>

  </div>

  <!-- ── Tab 6: People ────────────────────────────────────────── -->
  <div id="tab-people" class="tab-panel">

    <!-- Hero stats -->
    <div class="hero-grid" style="margin-bottom:20px">
      ${d.notionUrls.profiles ? `<a class="hero-card g2" href="${d.notionUrls.profiles}" target="_blank" rel="noopener">` : '<div class="hero-card g2">'}
        <div class="cn-hint">${locale.ui.openInNotion}</div>
        <div class="hero-label">${locale.ui.heroPeopleProfiles}</div>
        <div class="hero-value counter" data-target="${d.people.totalProfiles}">${num(d.people.totalProfiles)}</div>
        <div class="hero-sub">${locale.ui.subPeopleAndOrgs(d.people.totalPeople, d.people.totalOrgs)}</div>
      ${d.notionUrls.profiles ? '</a>' : '</div>'}
      ${d.notionUrls.profiles ? `<a class="hero-card g3" href="${d.notionUrls.profiles}" target="_blank" rel="noopener">` : '<div class="hero-card g3">'}
        <div class="cn-hint">${locale.ui.openInNotion}</div>
        <div class="hero-label">${locale.ui.heroActiveMembers}</div>
        <div class="hero-value counter" data-target="${d.people.totalActive}">${num(d.people.totalActive)}</div>
        <div class="hero-sub">${locale.ui.subEngagementActive}</div>
      ${d.notionUrls.profiles ? '</a>' : '</div>'}
      <div class="hero-card g1">
        <div class="hero-label">${locale.ui.heroExpertiseAreas}</div>
        <div class="hero-value counter" data-target="${d.people.byTag.length}">${d.people.byTag.length}</div>
        <div class="hero-sub">${locale.ui.subUniqueSkillsTags}</div>
      </div>
      <div class="hero-card g4">
        <div class="hero-label">${locale.ui.heroTopContributor}</div>
        <div class="hero-value" style="font-size:${d.people.topProfiles[0] ? '20px' : '38px'};letter-spacing:-.3px;line-height:1.1">${esc(d.people.topProfiles[0]?.name ?? '-')}</div>
        <div class="hero-sub">${locale.ui.subHighestSeraScore(maxScore)}</div>
      </div>
    </div>

    <!-- Influence Map -->
    <section>
      <h2>${locale.ui.sectionInfluenceMap}</h2>
      <p class="dim" style="margin-bottom:14px">${locale.ui.influenceMapDesc}</p>
      ${d.people.topProfiles.length > 0
        ? '<div class="chart-wrap" style="height:310px"><canvas id="influenceChart"></canvas></div>'
        : `<div class="chart-empty" style="height:310px">${locale.ui.influenceMapEmpty}</div>`}
    </section>

    <!-- Skills + Relationship side by side -->
    <div class="chart-grid">
      <div class="chart-card">
        <h2>${locale.ui.sectionCommunitySkills}</h2>
        ${d.people.byTag.length > 0
          ? '<div class="chart-wrap" style="height:220px"><canvas id="tagChart"></canvas></div>'
          : `<div class="chart-empty">${locale.ui.communitySkillsEmpty}</div>`}
      </div>
      <div class="chart-card">
        <h2>${locale.ui.sectionRelationshipToAmora}</h2>
        ${d.people.byRelationship.length > 0
          ? '<div class="chart-wrap" style="height:220px"><canvas id="relChart"></canvas></div>'
          : `<div class="chart-empty">${locale.ui.relationshipEmpty}</div>`}
      </div>
    </div>

    <!-- Profile leaderboard -->
    <section>
      <h2>${locale.ui.sectionSeraLeaderboard}</h2>
      <p class="dim" style="margin-bottom:16px">${locale.ui.seraScoreDesc}</p>
      <div class="profile-cards-grid">
        ${profileCardsHtml}
      </div>
    </section>

    <!-- Growth timeline -->
    <section>
      <h2>${locale.ui.sectionCommunityGrowth}</h2>
      <div class="chart-wrap" style="height:160px"><canvas id="peopleTimelineChart"></canvas></div>
    </section>

  </div>

  <!-- ── Tab 7: Performance ──────────────────────────────────── -->
  <div id="tab-performance" class="tab-panel">

    <div class="stat-grid" style="margin-bottom:20px">
      ${d.notionUrls.tasks ? `<a class="stat-card" href="${d.notionUrls.tasks}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.tasks ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statTotalTasks}${d.notionUrls.tasks ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value">${num(perfTotal)}</div>
        <div class="s-sub">${locale.ui.subExtractedBySera}</div>
      ${d.notionUrls.tasks ? '</a>' : '</div>'}
      ${d.notionUrls.tasks ? `<a class="stat-card" href="${d.notionUrls.tasks}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.tasks ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statCompleted}${d.notionUrls.tasks ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value" style="color:var(--green)">${num(perf.byStatus.done)}</div>
        <div class="s-sub">${locale.ui.subMarkedDone}</div>
      ${d.notionUrls.tasks ? '</a>' : '</div>'}
      ${d.notionUrls.tasks ? `<a class="stat-card" href="${d.notionUrls.tasks}" target="_blank" rel="noopener">` : '<div class="stat-card">'}
        <div class="s-label" style="${d.notionUrls.tasks ? 'display:flex;align-items:center;gap:4px' : ''}">${locale.ui.statOpen}${d.notionUrls.tasks ? ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity:.5;flex-shrink:0"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div>
        <div class="s-value ${perf.totalOverdue > 0 ? 'warn' : ''}">${num(perf.byStatus.open + perf.byStatus.inProgress)}</div>
        <div class="s-sub">${locale.ui.subOverdue(perf.totalOverdue)}</div>
      ${d.notionUrls.tasks ? '</a>' : '</div>'}
      <div class="stat-card">
        <div class="s-label">${locale.ui.statCompletionRate}</div>
        <div class="s-value">${overallRate}%</div>
        <div class="s-sub">${locale.ui.subOrgWideAllTime}</div>
      </div>
    </div>

    <section>
      <h2>${locale.ui.sectionTaskChampions}</h2>
      <div class="lb-grid">
        ${leaderboardHtml}
      </div>
    </section>

    <section>
      <h2>${locale.ui.sectionTaskVelocity}</h2>
      <div class="chart-wrap" style="height:200px"><canvas id="velocityChart"></canvas></div>
      <div style="display:flex;gap:20px;margin-top:10px;font-size:11px;color:var(--muted)">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#6366f1;margin-right:5px;vertical-align:middle"></span>${locale.ui.legendCreated}</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#10b981;margin-right:5px;vertical-align:middle"></span>${locale.ui.legendCompleted}</span>
      </div>
    </section>

    <div class="chart-grid">
      <div class="chart-card">
        <h2>${locale.ui.sectionPriorityBreakdown}</h2>
        ${perfPrioTotal > 0
          ? '<div class="chart-wrap" style="height:160px"><canvas id="priorityChart"></canvas></div>'
          : `<div class="chart-empty">${locale.ui.noPriorityTasks}</div>`}
      </div>
      <div class="chart-card">
        <h2>${locale.ui.sectionStatusDistribution}</h2>
        ${perfTotal > 0
          ? '<div class="chart-wrap" style="height:160px"><canvas id="taskStatusChart"></canvas></div>'
          : `<div class="chart-empty">${locale.ui.noTasksYet}</div>`}
      </div>
    </div>

  </div>

  <!-- ── CRM Tab ───────────────────────────────────────────── -->
  <div id="tab-crm" class="tab-panel">
    <div class="crm-grid">
      <section>
        <h2>${locale.ui.sectionPipeline}</h2>
        <p class="dim" style="font-size:12px;margin-bottom:14px">${locale.ui.crmPipelineSub(crm.totalContacts)}</p>
        ${crmPipelineHtml}
      </section>
      <section>
        <h2>${locale.ui.sectionFollowUpsDue}</h2>
        <p class="dim" style="font-size:12px;margin-bottom:14px">${locale.ui.crmFollowUpsSub(crm.followUps.length)}</p>
        ${crmFollowUpsHtml}
      </section>
    </div>
    <section>
      <h2>${locale.ui.sectionRecentInteractions}</h2>
      <p class="dim" style="font-size:12px;margin-bottom:14px">${locale.ui.recentInteractionsDesc}</p>
      ${crmInteractionsHtml}
    </section>
  </div>

  <!-- ── Tab 8: Chat with Sera ─────────────────────────────── -->
  <div id="tab-sera-chat" class="tab-panel">
    <div class="chat-container">
      <div class="chat-sidebar" id="chat-sidebar">
        <div class="chat-sidebar-header">
          <button class="chat-new-btn" id="chat-new-btn">${locale.ui.btnNewChat}</button>
          <button class="chat-sidebar-toggle" id="chat-sidebar-toggle" title="Toggle sidebar">&#8249;</button>
        </div>
        <div class="chat-thread-list" id="chat-thread-list"></div>
      </div>
      <div class="chat-main" style="position:relative">
        <div class="chat-drop-overlay" id="chat-drop-overlay">${locale.ui.dropOverlay}</div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-attach-strip" id="chat-attach-strip"></div>
        <div class="chat-input-row">
          <button class="chat-attach-btn" id="chat-attach-btn" title="Attach image or text file">+</button>
          <input type="file" id="chat-file-input" accept="image/jpeg,image/png,image/gif,image/webp,.txt,.md,.csv" multiple style="display:none">
          <textarea class="chat-input" id="chat-input" rows="1" placeholder="${esc(locale.ui.chatPlaceholder)}"></textarea>
          <button class="chat-cancel-btn" id="chat-cancel-btn">&#x2715; ${locale.ui.btnCancel}</button>
          <button class="chat-send" id="chat-send">${locale.ui.btnSend}</button>
        </div>
        <div class="chat-tokens" id="chat-tokens"></div>
      </div>
    </div>
  </div>

</div>

<footer>
  <span>Sera &nbsp;·&nbsp; ${orgName} &nbsp;·&nbsp; Running ${runningSinceStr} &nbsp;·&nbsp; Next poll <span id="next-poll-footer" data-at="${nextPollIso ?? ''}">…</span></span>
  <span style="display:block;margin-top:5px">All data from Notion &nbsp;·&nbsp; Powered by <a href="http://quicklaunchconsulting.com/" target="_blank" rel="noopener" style="color:inherit;opacity:.8">QuickLaunch Consulting</a></span>
</footer>

<!-- Embedded chart data (server-rendered, no XHR needed) -->
<script id="activity-data" type="application/json">${activityJson}</script>
<script id="type-data" type="application/json">${typeJson}</script>
<script type="application/json" id="queue-data">${JSON.stringify({labels:locale.ui.queueLabels.map(q => q.label),values:[d.queues.canonChangeRequests,d.queues.memoryReviewQueue,d.queues.decisionCandidates,d.queues.sensitiveReview,d.queues.ccosLedgerPending,d.queues.tasksNeedingOwner,d.queues.highRisks,d.queues.kbDrafts]})}</script>
<script type="application/json" id="community-data">${JSON.stringify({profiles:d.community.totalProfiles,meetings:d.community.totalMeetings,circles:d.community.activeCircles,tasks:d.metrics.totalTasks,decisions:d.metrics.totalDecisions})}</script>
<script type="application/json" id="policy-data">${JSON.stringify({active:d.policies.active,draft:d.policies.draft,other:Math.max(0,d.policies.total-d.policies.active-d.policies.draft)})}</script>
<script type="application/json" id="perf-data">${JSON.stringify({velocity:d.performance.velocity,priority:d.performance.priorityBreakdown,status:{open:d.performance.byStatus.open,inProgress:d.performance.byStatus.inProgress,done:d.performance.byStatus.done,cancelled:d.performance.byStatus.cancelled,needsOwner:d.performance.byStatus.needsOwner}})}</script>
<script type="application/json" id="people-data">${JSON.stringify({
  bubbles: d.people.topProfiles.filter(p => p.profileType !== 'Organization').map(p => ({
    label: p.name,
    x: p.meetingsOrganized,
    y: p.tasksDone,
    r: Math.max(8, Math.round(8 + (p.seraScore / maxScore) * 22)),
    roles: p.activeRoles,
    score: p.seraScore,
  })),
  tags: { labels: d.people.byTag.map(t => t.label), values: d.people.byTag.map(t => t.count) },
  relationships: { labels: d.people.byRelationship.map(r => r.label), values: d.people.byRelationship.map(r => r.count) },
  timeline: { labels: d.people.timeline.map(t => t.month), values: d.people.timeline.map(t => t.count) },
})}</script>
<script type="application/json" id="sera-tips-data">${JSON.stringify(locale.tips)}</script>
<script>window.AMORA_UI=${JSON.stringify({
  chatEmpty: locale.ui.chatEmpty,
  chartActivityLabel: locale.ui.chartActivityLabel,
  chartTypeLabels: locale.ui.chartTypeLabels,
  chartQueuePending: locale.ui.chartQueuePending,
  chartCommunityLabels: locale.ui.chartCommunityLabels,
  chartPolicyTitle: locale.ui.chartPolicyTitle,
  chartInfluenceX: locale.ui.chartInfluenceX,
  chartInfluenceY: locale.ui.chartInfluenceY,
  chartInfluencePeople: locale.ui.chartInfluencePeople,
  chartPeopleGrowthSuffix: locale.ui.chartPeopleGrowthSuffix,
  chartVelocityCreated: locale.ui.chartVelocityCreated,
  chartVelocityCompleted: locale.ui.chartVelocityCompleted,
  chartPriorityLabels: locale.ui.chartPriorityLabels,
  chartStatusLabels: locale.ui.chartStatusLabels,
  balanceLoading: locale.ui.balanceLoading,
  balanceNotConfigured: locale.ui.balanceNotConfigured,
  balanceUnavailable: locale.ui.balanceUnavailable,
  balanceRailwayLabel: locale.ui.balanceRailwayLabel,
  balanceCreditRemaining: locale.ui.balanceCreditRemaining,
})};</script>

<script src="/dashboard.js" defer></script>
</body>
</html>`;
}
