/**
 * Comprehensive test email suite — covers every pipeline branch and edge case.
 * All emails are sent as self-mail FROM/TO roots@amora.cr via the Gmail API.
 *
 * Usage:
 *   npx ts-node scripts/send-test-emails.ts              # all 17 emails
 *   npx ts-node scripts/send-test-emails.ts --batch meet
 *   npx ts-node scripts/send-test-emails.ts --batch operational
 *   npx ts-node scripts/send-test-emails.ts --batch edge
 *   npx ts-node scripts/send-test-emails.ts --id meet-notes-full-extraction
 *   npx ts-node scripts/send-test-emails.ts --list
 *   npx ts-node scripts/send-test-emails.ts --delay 5000   # ms between sends
 *
 * SETUP for full Meet confirmed-access coverage:
 *   Share both test docs below with roots@amora.cr (Viewer access), then run the meet batch.
 *   Without sharing, Meet emails still exercise classification + meeting/asset record creation
 *   but hit the 403 "Needs Access" path instead of full Docs extraction.
 *
 *   Transcript doc: https://docs.google.com/document/d/1-D326yi0x-x8XOixzZfBXmhkjv185n8Rdl5L7yCtT-0
 *   Gemini Notes:   https://docs.google.com/document/d/1RjaTYgQO0Y9cunNlD2pV-cRMpxz4GOFmZYnQM_GQaCU
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN ?? '';
const ROOTS_EMAIL   = process.env.ROOTS_EMAIL          ?? 'roots@amora.cr';

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN are required');
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
auth.setCredentials({ refresh_token: REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth });

// ─── Test Drive documents (created 2026-05-25 by rick@amora.cr) ──────────────
// Share these with roots@amora.cr to exercise the confirmed-access → extraction path.
const TRANSCRIPT_DOC_ID = '1-D326yi0x-x8XOixzZfBXmhkjv185n8Rdl5L7yCtT-0';
const NOTES_DOC_ID      = '1RjaTYgQO0Y9cunNlD2pV-cRMpxz4GOFmZYnQM_GQaCU';
// Guaranteed 404 — tests permanent-skip path (no retry scheduled)
const FAKE_404_FILE_ID  = '0B0000000000000000000000404NotFound00';

// Shared identifiers — same across emails 1, 2, 3, 6 to exercise captureKey + asset dedup
const SHARED_MEET_CODE = 'abc-defg-hij';
const SHARED_CAL_EVENT = 'amT1ZXN0X2NhbF9ldmVudF9xMl9wbGFubmluZw';

// ─── Send helper ──────────────────────────────────────────────────────────────

async function sendEmail(opts: {
  subject: string;
  body: string;
  messageId?: string; // forced Message-ID header (for dedup tests)
  contentType?: 'text/plain' | 'text/html';
}): Promise<void> {
  const mid = opts.messageId ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@amora.cr`;
  const ct  = opts.contentType ?? 'text/plain';
  const raw = [
    `Message-ID: <${mid}>`,
    `From: ${ROOTS_EMAIL}`,
    `To: ${ROOTS_EMAIL}`,
    `Subject: ${opts.subject}`,
    `Content-Type: ${ct}; charset=utf-8`,
    `MIME-Version: 1.0`,
    '',
    opts.body,
  ].join('\r\n');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(raw).toString('base64url') },
  });
}

// ─── Test scenarios ───────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  batch: 'meet' | 'operational' | 'edge';
  description: string;
  run: () => Promise<void>;
}

const SCENARIOS: Scenario[] = [

  // ── Meet batch (7) ──────────────────────────────────────────────────────────

  {
    id: 'meet-recording-confirmed',
    batch: 'meet',
    description: 'Recording + Drive link → Google Meet Recording → access check → Meeting set to Partial',
    run: () => sendEmail({
      subject: 'Recording of your Google Meet: Amora Leadership Circle — Q2 Planning',
      body: `Your Google Meet recording is ready.

Meeting: Amora Leadership Circle — Q2 Planning
Date: May 25, 2026
Organized by: rick@amora.cr
Meet link: https://meet.google.com/${SHARED_MEET_CODE}
Calendar event: https://calendar.google.com/calendar/event?eid=${SHARED_CAL_EVENT}

Recording:
https://drive.google.com/file/d/${TRANSCRIPT_DOC_ID}/view

This recording will be available for 30 days.`,
    }),
  },

  {
    id: 'meet-transcript-confirmed',
    batch: 'meet',
    description: 'Transcript, same eid= → captureKey dedup finds existing Meeting → new Transcript asset created',
    run: () => sendEmail({
      subject: 'Transcript for your meeting: Amora Leadership Circle — Q2 Planning',
      body: `Your Google Meet transcript is ready.

Meeting: Amora Leadership Circle — Q2 Planning
Date: May 25, 2026
Organized by: rick@amora.cr
Meet link: https://meet.google.com/${SHARED_MEET_CODE}
Calendar event: https://calendar.google.com/calendar/event?eid=${SHARED_CAL_EVENT}

Transcript:
https://docs.google.com/document/d/${TRANSCRIPT_DOC_ID}/edit

The transcript has been auto-generated and is ready for review.`,
    }),
  },

  {
    id: 'meet-notes-full-extraction',
    batch: 'meet',
    description: 'Gemini Notes, same meeting → Docs export → Claude extracts all 12 entity types (profiles, projects, circles, roles, role assignments, tasks, decisions, risks, memory candidates, canon change, CCOS ledger, sensitive flag)',
    run: () => sendEmail({
      subject: 'Meet notes for Amora Leadership Circle — Q2 Planning',
      body: `AI-generated meeting notes are ready.

Meeting: Amora Leadership Circle — Q2 Planning
Date: May 25, 2026
Organized by: rick@amora.cr
Meet link: https://meet.google.com/${SHARED_MEET_CODE}
Calendar event: https://calendar.google.com/calendar/event?eid=${SHARED_CAL_EVENT}

Notes:
https://docs.google.com/document/d/${NOTES_DOC_ID}/edit`,
    }),
  },

  {
    id: 'meet-recording-needs-access',
    batch: 'meet',
    description: 'Recording file owned by rick@amora.cr → 403 Needs Access → retry scheduled + access request email to admin',
    run: () => sendEmail({
      subject: 'Recording of your Google Meet: Community Onboarding — May 2026',
      body: `Your Google Meet recording is ready.

Meeting: Community Onboarding — May 2026
Date: May 25, 2026
Organized by: marco.delgado@amora.cr
Meet link: https://meet.google.com/xyz-uvwx-yz1
Calendar event: https://calendar.google.com/calendar/event?eid=Y29tbXVuaXR5T25ib2FyZGluZzI2

Recording (access restricted):
https://drive.google.com/file/d/${NOTES_DOC_ID}/view`,
    }),
  },

  {
    id: 'meet-recording-404',
    batch: 'meet',
    description: 'Fake Drive file ID → 404 → permanent skip, Processing Status: Manual Review, retry queue NOT populated',
    run: () => sendEmail({
      subject: 'Recording of your Google Meet: Board Meeting — May 2026',
      body: `Your Google Meet recording is ready.

Meeting: Board Meeting — May 2026
Date: May 25, 2026
Organized by: sofia.chen@amora.cr
Meet link: https://meet.google.com/pqr-stuv-wx2
Calendar event: https://calendar.google.com/calendar/event?eid=Ym9hcmRNZWV0aW5nUGVybWFuZW50NDA0

Recording:
https://drive.google.com/file/d/${FAKE_404_FILE_ID}/view`,
    }),
  },

  {
    id: 'meet-transcript-asset-dedup',
    batch: 'meet',
    description: 'Second Transcript for the Q2 meeting → findExistingAsset finds existing Transcript asset → skips, no duplicate created',
    run: () => sendEmail({
      subject: 'Transcript is ready for your meeting: Amora Leadership Circle — Q2 Planning',
      body: `Your transcript is ready.
Amora Leadership Circle — Q2 Planning
Organized by: rick@amora.cr
Calendar event: https://calendar.google.com/calendar/event?eid=${SHARED_CAL_EVENT}
Meet transcript for your meeting is available.

https://docs.google.com/document/d/${NOTES_DOC_ID}/edit`,
    }),
  },

  {
    id: 'meet-no-fileid',
    batch: 'meet',
    description: 'Transcript email with no Drive/Docs file ID → no primaryFileId → Processing Status: Failed, error logged',
    run: () => sendEmail({
      subject: 'Transcript for your meeting: Sector 5 Circle Sync',
      body: `Your Google Meet transcript is ready.

Meeting: Sector 5 Circle Sync
Date: May 25, 2026
Organized by: lucia.vargas@amora.cr
Meet link: https://meet.google.com/qrs-tuvw-xy3
Calendar event: https://calendar.google.com/calendar/event?eid=c2VjdG9yNUNpcmNsZVN5bmNNYXkyNg

The transcript link will be available once processing completes. Please check back shortly.`,
    }),
  },

  // ── Operational batch (6) ────────────────────────────────────────────────────

  {
    id: 'policy-hit',
    batch: 'operational',
    description: 'Canon change that names an existing policy → Affected Policy relation linked in Notion',
    run: () => sendEmail({
      subject: '[Capture] Proposal: Amend Land Stewardship & Water Rights Policy — Emergency Drought Clause',
      body: `Leadership Circle,

We are proposing an amendment to an existing governance policy.

CURRENT POLICY: Land Stewardship & Water Rights Policy
Current text requires Leadership Circle approval and legal MOU review before any water-sharing agreement with a third party.

PROPOSED AMENDMENT:
Add an emergency drought exception: the Circle Lead for Sector 1 (Land & Ecology) may authorize temporary water-sharing arrangements (≤30 days duration) without full MOU review when a formal drought emergency has been declared by the national meteorology agency (IMN). All such temporary agreements must be reported to the full Leadership Circle within 72 hours.

Rationale: The current policy created a dangerous gap during the 2025 dry season when we could not respond quickly enough to a neighbor's request for emergency irrigation access. The proposed exception preserves oversight while enabling rapid humanitarian response.

CANON CHANGE DETAILS:
Affected policy: Land Stewardship & Water Rights Policy
Affected canon area: Land Stewardship
Affected document: Land Stewardship & Water Rights Policy v1.0
Reason: Emergency response gap identified in 2025 dry season
Reviewer: Rick Broitman

This requires Leadership Circle consent vote before implementation.

Marco Delgado
Land & Ecology Circle`,
    }),
  },

  {
    id: 'operational-standard',
    batch: 'operational',
    description: 'Rich [Capture] email → tasks + confirmed decision + risk + memory candidate + profile → 5+ Notion DBs written',
    run: () => sendEmail({
      messageId: 'test-msg-operational-standard-20260525@amora.cr',
      subject: '[Capture] Land Stewardship Working Group Update — May 2026',
      body: `Hi Amora team,

Here's a summary from today's Land Stewardship working group meeting.

We've confirmed the water quality testing protocol for the eastern sector is complete. This was a confirmed decision that Marco Delgado and Sofia Chen aligned on after consulting with Elena Marchetti (elena.marchetti@cooperativaverde.cr) from Cooperativa Verde (partner organization in Cartago, Costa Rica).

Action items:
- Rick Broitman: submit soil test results to SENASA by June 5, 2026 — HIGH priority
- Lucía Vargas: coordinate with local schools for the agroecology demonstration day — due June 20, 2026 — MEDIUM priority

Risk: The dry season is arriving two weeks earlier than usual. This could affect planting schedules for the northern terraces. Severity: Medium. Owner: Marco Delgado. Suggested mitigation: advance irrigation infrastructure installation timeline by two weeks.

Memory candidate: The eastern sector consistently outperforms during dry season due to the natural windbreak provided by the bamboo stand planted in 2019. Category: Learning. Confidence: High.

Profile to capture: Elena Marchetti — Partnership contact at Cooperativa Verde. cooperativa@verde.cr. Partner.

Best,
Rick Broitman`,
    }),
  },

  {
    id: 'operational-sensitive',
    batch: 'operational',
    description: 'Health/privacy content → sensitive_flag in Sensitive Review DB + admin notification email sent',
    run: () => sendEmail({
      subject: '[Capture] Member Support Situation — Confidential',
      body: `Dear Leadership Team,

I need to raise a sensitive matter about one of our long-term community members.

A community member (keeping them anonymous here) has been experiencing significant mental health challenges over the past weeks. Their family has been in contact with me, and this member has asked for a temporary leave of absence from their volunteer roles in the Land & Ecology and Community circles.

This information must be treated as Restricted — strictly leadership-only. The member has not consented to broader sharing.

Recommended handling:
1. Grant leave of absence with no timeline pressure
2. Temporarily redistribute their circle coordination duties
3. Follow up privately in 6 weeks

Please do not discuss in any circle meeting or shared channel.

Dr. Amara Osei
Health & Wellbeing Circle Lead`,
    }),
  },

  {
    id: 'operational-canon-change',
    batch: 'operational',
    description: 'Proposes changes to founding docs → canon_change_candidate + CCOS ledger entry + canon review alert email to admin',
    run: () => sendEmail({
      subject: '[Capture] Proposal: Revise CCOS Founding Purpose — Economic Sovereignty Clause',
      body: `Community,

After extensive discussion in the Governance & Coordination circle, we formally propose a revision to Amora's Founding Purpose document.

CURRENT TEXT (Economic Sovereignty clause):
"Amora operates as a financially self-sufficient community enterprise."

PROPOSED TEXT:
"Amora operates as a financially self-sufficient and legally autonomous community enterprise."

Rationale: "Legally autonomous" reflects our evolving land ownership stance and clarifies our relationship to national regulatory frameworks.

Affected areas: Governing Purpose, Legal Commitment, Public Commitment.
Affected document: Amora CCOS Founding Purpose v1.3.
Reviewer: Rick Broitman.
Requires unanimous Leadership Circle consent + 30-day public comment per CCOS protocol.

CCOS ledger entry needed: Recording this as a governance tension. Ledger type: Tension. Circle: Sector 5 — Governance & Coordination.

Please respond with any concerns within 14 days.

Lucía Vargas
Governance & Coordination Circle`,
    }),
  },

  {
    id: 'operational-html-only',
    batch: 'operational',
    description: 'No plain-text part, HTML body only → effectiveBody strips tags → normal extraction (tests HTML fallback path)',
    run: () => sendEmail({
      subject: '[Capture] Partnership Proposal — EcoFund Foundation',
      contentType: 'text/html',
      body: `<html><body>
<p>Dear Amora Leadership,</p>
<p>EcoFund Foundation proposes a <strong>regenerative agriculture funding partnership</strong> for 2026–2027.</p>
<p>Offer: <strong>$45,000 USD grant</strong> over 18 months for community-scale food systems projects in Central America.</p>
<ul>
<li>Quarterly narrative + financial reporting required</li>
<li>Expression of interest deadline: <strong>June 30, 2026</strong></li>
<li>Contact: Dr. Patricia Solano — p.solano@ecofund.org. Organization: EcoFund Foundation. Funder.</li>
</ul>
<p><strong>Decision needed:</strong> Proceed with expression of interest? Candidate decision. Decision maker: Rick Broitman.</p>
<p><strong>Risk:</strong> Accepting creates reporting obligations that may strain admin capacity. Severity: Medium. Owner: Lucía Vargas.</p>
<p><strong>Task:</strong> Assign someone to draft expression of interest by June 20, 2026 (needs_owner: true — no owner yet identified). Priority: High.</p>
<p>EcoFund Foundation Partnership Team</p>
</body></html>`,
    }),
  },

  {
    id: 'operational-short',
    batch: 'operational',
    description: 'Body < 50 chars → skips Claude extraction, calls createMessageRecord directly → bare Message record in Notion',
    run: () => sendEmail({
      subject: 'Can we reschedule tomorrow?',
      body: `Move the call to Thursday?`,
    }),
  },

  {
    id: 'forwarded-thread',
    batch: 'operational',
    description: 'Subject starts with "Fwd:" → Forwarded Thread type → full extraction, nested sender profile created (Maria Jimenez / CRLT)',
    run: () => sendEmail({
      subject: 'Fwd: Costa Rican Land Trust — Watershed Collaboration Inquiry',
      body: `---------- Forwarded message ---------
From: Maria Jimenez <maria.jimenez@costaricalandtrust.org>
Date: May 23, 2026, 2:14 PM
Subject: Costa Rican Land Trust — Watershed Collaboration Inquiry
To: info@amora.cr

Dear Amora team,

My name is Maria Jimenez, Partnership Director at Costa Rican Land Trust (CRLT). We've been following Amora's model closely.

Proposal: co-steward a 200-hectare watershed in Talamanca. Terms:
- CRLT retains title; Amora receives 30-year use rights
- Joint stewardship committee (3 members each organization)
- Shared food production rights for Amora members
- 5-year renewable MOU, annual review

This is a major legal and financial commitment requiring board approval.

Candidate decision: Accept CRLT partnership proposal for Talamanca watershed. Decision maker: Rick Broitman.

Risk: Agreement may constrain future land sovereignty decisions. Severity: High. Category: Legal.
Risk: 30-year commitment may outlast organizational capacity. Severity: Medium. Category: Governance.

Task: Legal review of MOU draft — assign to Amora legal advisor. Due: June 15, 2026. High priority.

Maria Jimenez | Partnership Director
Costa Rican Land Trust | maria.jimenez@costaricalandtrust.org`,
    }),
  },

  // ── Edge batch (4) ───────────────────────────────────────────────────────────

  {
    id: 'duplicate-message-id',
    batch: 'edge',
    description: 'Same Message-ID as operational-standard → isAlreadyProcessed returns true → entire message skipped, no Source Email created',
    run: () => sendEmail({
      messageId: 'test-msg-operational-standard-20260525@amora.cr',
      subject: '[Capture] DUPLICATE — must be skipped by Notion Message ID dedup',
      body: `This email shares a Message-ID with operational-standard and must be silently skipped.`,
    }),
  },

  {
    id: 'no-subject',
    batch: 'edge',
    description: 'Empty subject → defaults to "(no subject)" in Source Email title + Message title',
    run: () => sendEmail({
      subject: '',
      body: `Hey,

Quick note from this morning's sector walk — the water pump in sector C is showing reduced pressure. This is a risk: if it fails during dry season we lose irrigation for ~2 hectares. Severity: Medium. Owner: Marco Delgado. Category: Operational.

Task: Schedule pump maintenance inspection before June 15, 2026. Assign to Marco Delgado. High priority.

Rick`,
    }),
  },

  {
    id: 'unicode-content',
    batch: 'edge',
    description: 'Multi-byte characters in subject + body (Spanish + Japanese) → tests UTF-8 encoding end-to-end',
    run: () => sendEmail({
      subject: '[Capture] 日本の農業協同組合との連携提案 (Japan Cooperative Partnership)',
      body: `Estimado equipo de Amora,

Una cooperativa agrícola japonesa (農業協同組合) de Nagano está interesada en un intercambio de conocimientos sobre agroecología regenerativa.

Propuesta: intercambio de dos semanas en agosto 2026 — 3 agricultores japoneses visitan Amora; 2 miembros de Amora visitan Nagano en octubre 2026.

Contacto: Yuki Tanaka <yuki.tanaka@nagano-coop.jp>
Organización: 長野農業協同組合 (Nagano Agricultural Cooperative). Partner.

Decisión candidata: Avanzar con visita exploratoria a Nagano en octubre 2026. Decision maker: Rick Broitman.

Riesgo: Costos estimados ¥800,000 JPY (~$5,200 USD) no presupuestados. Severidad: Media. Propietario: Rick Broitman. Categoría: Financial.

Tarea: Preparar propuesta de presupuesto. Asignar a: Lucía Vargas. Fecha límite: June 30, 2026. Prioridad: Media.

Saludos,
Lucía Vargas`,
    }),
  },

  {
    id: 'unknown-type',
    batch: 'edge',
    description: 'Automated server notification — empty To, no google domain, no patterns → classified Unknown → Source Email created, Processing Status: Manual Review',
    run: () => sendEmail({
      subject: 'Automated notification: nightly backup complete',
      body: `Backup completed at 03:00 UTC.
Files: 4,821 | Size: 12.4 GB | Status: SUCCESS`,
    }),
  },
];

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list');
  const batchIdx = args.indexOf('--batch');
  const idIdx    = args.indexOf('--id');
  const delayIdx = args.indexOf('--delay');

  const batchArg = batchIdx >= 0 ? args[batchIdx + 1] as 'meet' | 'operational' | 'edge' : undefined;
  const idArg    = idIdx    >= 0 ? args[idIdx + 1]    : undefined;
  const delayMs  = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) || 3000 : 3000;

  let queue = SCENARIOS.slice();
  if (batchArg) queue = queue.filter(s => s.batch === batchArg);
  if (idArg)    queue = queue.filter(s => s.id === idArg);

  if (listOnly) {
    const maxId = Math.max(...SCENARIOS.map(s => s.id.length));
    console.log('\nTest email IDs:\n');
    const batches = ['meet', 'operational', 'edge'] as const;
    for (const b of batches) {
      console.log(`  ── ${b} ──`);
      for (const s of SCENARIOS.filter(x => x.batch === b)) {
        console.log(`  ${s.id.padEnd(maxId + 2)} ${s.description.slice(0, 72)}`);
      }
      console.log('');
    }
    console.log(`Total: ${SCENARIOS.length} emails across 3 batches\n`);
    return;
  }

  console.log(`\nSending ${queue.length} test email(s) → ${ROOTS_EMAIL} (${delayMs}ms between each)\n`);

  for (let i = 0; i < queue.length; i++) {
    const s = queue[i];
    try {
      await s.run();
      console.log(`  SENT  [${s.batch.padEnd(11)}] ${s.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAIL  [${s.batch.padEnd(11)}] ${s.id} — ${msg}`);
    }
    if (i < queue.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  console.log(`
Done. Wait one poll cycle (≤3 min) then check Notion and Railway logs.

Expected Notion records per batch:
  meet (7 emails):
    Source Emails: 7
    Meetings: 4  (meet-recording-confirmed, meet-recording-needs-access, meet-recording-404, meet-no-fileid)
    Meeting Assets: 6  (dedup skips the second Transcript for Q2 meeting)
    Tasks/Decisions/Risks: written from meet-notes-full-extraction if docs are shared with roots@amora.cr

  operational (6 emails):
    Source Emails: 6
    Messages: 5  (operational-short creates a bare record; operational-html-only extracts normally)
    Profiles: 8+  (Elena Marchetti, Cooperativa Verde, Dr. Amara Osei, Maria Jimenez, CRLT, Yuki Tanaka, Nagano Coop, EcoFund/Patricia Solano)
    Tasks: 6+     (from standard, canon-change, html-only, forwarded, unicode)
    Decisions: 4+ (from standard, canon-change, html-only, forwarded, unicode)
    Risks: 4+     (from standard, sensitive [no — that's sensitive flag], forwarded, unicode)
    Memory Queue: 1  (from standard)
    Canon Change Requests: 1  (from canon-change)
    CCOS Ledger Entries: 1    (from canon-change)
    Sensitive Review: 1       (from sensitive)

  edge (4 emails):
    Source Emails: 3  (duplicate-message-id is skipped by dedup — should NOT create a record)
    Processing Status: Manual Review for unknown-type
`);
}

main().catch(err => { console.error(err); process.exit(1); });
