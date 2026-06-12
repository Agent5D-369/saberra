"use client";

import { useMemo, useState } from "react";
import { CTAButton, SourceBadge } from "@/components/UI";

// ── Kit integration ───────────────────────────────────────────────────────────
// Fill in your Kit API key and sequence ID to activate email nurture
const KIT_API_KEY      = "REPLACE_WITH_KIT_API_KEY";       // Kit → Settings → API
const KIT_SEQUENCE_ID  = "REPLACE_WITH_KIT_SEQUENCE_ID";   // Kit → Sequences → URL

async function subscribeToKit(email: string, firstName: string, score: number, band: string, segment: string) {
  if (KIT_API_KEY === "REPLACE_WITH_KIT_API_KEY") return; // skip if not configured
  try {
    await fetch(`https://api.convertkit.com/v3/sequences/${KIT_SEQUENCE_ID}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email,
        first_name: firstName,
        fields: {
          audit_score: String(score),
          audit_band:  band,
          audit_segment: segment,
        },
        tags: [`audit-${band.toLowerCase()}`],
      }),
    });
  } catch {
    // silent — don't block the UI
  }
}

const segments = [
  "Self-managing or governance-driven team",
  "Nonprofit or social enterprise",
  "Consultancy or agency",
  "Founder-led growing company",
  "Not sure"
];

const questions = [
  {
    text: "When a key team member leaves, how long does it take the next person to reach the same effectiveness?",
    options: ["Same week", "2 to 4 weeks", "1 to 2 months", "3 to 6 months", "They start from scratch"]
  },
  {
    text: "In the last 6 months, how many times has your team re-debated something that was already decided?",
    options: ["Not once", "Once", "2 or 3 times", "Monthly", "Almost every week"]
  },
  {
    text: "How long would it take to find every decision made about one important topic in the last 12 months?",
    options: ["A few minutes", "Under an hour", "Half a day", "A full day", "We probably could not"]
  },
  {
    text: "What percentage of meeting outcomes are documented and findable 3 months later?",
    options: ["Nearly all", "Most", "About half", "A small portion", "Almost none"]
  },
  {
    text: "How often do important tasks fall through the cracks after meetings?",
    options: ["Rarely", "Occasionally", "Monthly", "Often", "Constantly"]
  },
  {
    text: "If your most tenured person left tomorrow, what percentage of their institutional knowledge would be lost?",
    options: ["Very little", "Some", "About half", "Most", "Nearly all"]
  },
  {
    text: "How long does it take a new team member to become effective without constant hand-holding?",
    options: ["Days", "A few weeks", "1 to 2 months", "3 to 6 months", "Longer than 6 months"]
  },
  {
    text: "Do you have a reliable record of what your organization has agreed to in the last 24 months?",
    options: ["Yes, searchable", "Mostly", "Partially", "Scattered", "No reliable record"]
  },
  {
    text: "When making a decision today, how easily can your team access related past decisions?",
    options: ["Instantly", "With a quick search", "After asking around", "Only if someone remembers", "We usually cannot"]
  },
  {
    text: "How much time do senior people spend each week answering questions that should already be documented?",
    options: ["Under 1 hour", "1 to 2 hours", "3 to 5 hours", "6 to 10 hours", "More than 10 hours"]
  }
];

function band(score: number): { label: string; color: string } {
  if (score <= 18) return { label: "Stable memory base", color: "#1A7A4A" };
  if (score <= 30) return { label: "Early memory leakage", color: "#D6A24A" };
  if (score <= 40) return { label: "Serious operating intelligence gap", color: "#C07800" };
  return { label: "Critical knowledge bleed", color: "#C0392B" };
}

type ScoreBand = "stable" | "early" | "serious" | "critical";

function getScoreBand(score: number): ScoreBand {
  if (score <= 18) return "stable";
  if (score <= 30) return "early";
  if (score <= 40) return "serious";
  return "critical";
}

const seraQuickQuestions: Record<ScoreBand, string[]> = {
  stable: [
    "What are the most likely gaps in an otherwise solid memory system?",
    "How do I make sure this holds through a leadership transition?",
    "What does Saberra add when the foundations are already decent?"
  ],
  early: [
    "Where is the memory most likely leaking for my type of organization?",
    "What is the highest-leverage fix I can make right now?",
    "How quickly do early leaks become serious problems?"
  ],
  serious: [
    "What is the most expensive consequence of this gap?",
    "Where do I start if I can only fix one thing?",
    "How long does it typically take to close a gap this size?"
  ],
  critical: [
    "What is the biggest risk if I do nothing for another six months?",
    "How fast can the damage be reversed once capture starts?",
    "What does an organization at this level usually lose first?"
  ]
};

const seraAnswers: Record<ScoreBand, string[]> = {
  stable: [
    "The most common gap at your level is source traceability. Decisions may be recorded but the reasoning, the context, and the source behind them are often missing. Six months from now, your team has the decision but not why it was made. That is where stable systems quietly develop blind spots.",
    "At a stable memory level, transition risk usually appears in relationship and role context, not in documented processes. Documented structure transfers reasonably well. The informal network intelligence, the context behind decisions, and background risk awareness do not. Capturing that context continuously is what makes a system transition-proof.",
    "When the foundations are already solid, Saberra primarily adds source traceability, continuous capture without asking anyone to document, and Sera as a query layer so your team can retrieve what you have. Most organizations with good practices still lose hours per week answering questions from memory that should be answerable from a record."
  ],
  early: [
    "For most organization types, the most common early leak point is decisions that were made in meetings but never became durable records. They exist in someone's memory of the meeting. In the first few months that is workable. After a year, or after the people who were in the room move on, the decision might as well not have been made.",
    "The highest-value immediate fix is usually a simple capture habit: every meeting that ends with a decision or a task assignment should route a transcript or summary somewhere structured. It does not need to be perfect. The goal is to create a record that exists outside someone's memory. Once the record exists, it can be improved. Without the record, nothing else is possible.",
    "Early leakage compounds quietly. What starts as occasional repeated decisions becomes systematic context loss when someone leaves. The typical window between early leakage and a serious operating intelligence gap is twelve to eighteen months, faster in organizations that are growing or experiencing regular role changes."
  ],
  serious: [
    "At a serious gap level, the most expensive consequence is usually the re-ramp cost on key person transitions. You are likely paying three to six months of reduced productivity every time a senior person moves on. Depending on their salary and the length of the gap, that is tens of thousands of dollars per transition, plus the relationship and context cost on top of the direct hours.",
    "The highest-leverage starting point is almost always decisions. Capturing what was decided, by whom, and with what reasoning gives you the foundation everything else rests on. Tasks and risks matter too, but decisions compound. Every day a decision record does not exist is a day someone might re-debate it, make the opposite call, or block on context they should be able to retrieve.",
    "The gap closes faster than it opened, assuming capture is consistent. Most organizations see material improvement in query reliability within the first three months of consistent capture and review. The knowledge that already exists but was never structured takes the longest to recover. New captures from this point forward can be solid from the start."
  ],
  critical: [
    "The most immediate risk is a key person departure. At critical knowledge bleed, a single unplanned exit can produce a coordination failure within weeks: open commitments the person was tracking, risks being quietly managed, relationship context that disappears entirely. The longer the gap continues, the more operating intelligence lives only in individual memory with no backup.",
    "The damage is reversible, but not all of it. What can be recovered: decisions from records that exist, tasks that were tracked, role assignments that were documented. What cannot be fully recovered: the reasoning behind decisions made years ago, the relationship intelligence of people who have already left, the risk awareness of processes that have already failed. The sooner capture begins, the more of the recoverable material gets preserved.",
    "Organizations at critical levels typically lose operating context in this order: first, risk awareness leaves when the person managing it does; second, relationship intelligence degrades as funder and client relationships are managed without context; third, repeated decisions start consuming senior time at a visible level; fourth, onboarding becomes so costly that growing the team starts feeling risky."
  ]
};

function getFallbackAnswer(scoreBand: ScoreBand): string {
  const fallbacks: Record<ScoreBand, string> = {
    stable: "Your foundations are solid. The risk areas worth watching are source traceability and transition readiness. If you have a more specific question about your memory system, the more concrete you can be, the more useful my answer.",
    early: "Your score shows early memory leakage. The pattern at this level is usually decisions that exist in someone's memory but not in a durable record. If you can be specific about which part of the system you are most uncertain about, I can give you a more targeted answer.",
    serious: "At your score level, the operating intelligence gap is real and worth addressing. The most actionable starting point depends on your specific situation. If you can tell me more about what you are trying to understand, I can give you a more useful answer.",
    critical: "Your score indicates critical knowledge bleed. This level of gap is affecting decisions, onboarding, and key-person risk right now. The most important thing: the sooner capture begins, the more recoverable the situation is. Is there a specific risk area you are most concerned about?"
  };
  return fallbacks[scoreBand];
}

function diagnosis(score: number, segment: string): { headline: string; body: string } {
  const segmentContext: Record<string, string> = {
    "Self-managing or governance-driven team":
      "Your governance model depends on distributed memory. Right now, authority is more distributed than the record that should support it.",
    "Nonprofit or social enterprise":
      "Your mission depends on continuity through role changes, board cycles, and program transitions. The gaps in your record are creating real continuity risk.",
    "Consultancy or agency":
      "Your delivery margin depends on client context not walking out the door with your senior people. The gaps here represent direct financial exposure.",
    "Founder-led growing company":
      "Your team has likely outgrown founder memory as the operating system. The gaps here are creating a bottleneck that compounds with every new hire.",
    "Not sure":
      "Your organization is carrying hidden memory risk across meetings, email, and documentation gaps."
  };

  const context = segmentContext[segment] ?? segmentContext["Not sure"];

  if (score <= 18) {
    return {
      headline: "Your memory practices are relatively solid.",
      body: `${context} Some specific leaks are worth closing, particularly around source traceability and review ownership, but the foundation is there.`
    };
  }
  if (score <= 30) {
    return {
      headline: "Memory is leaking in specific, fixable places.",
      body: `${context} The gaps are real but addressable. The risk is that early leakage compounds quietly: decisions that disappear today become full context loss in twelve months.`
    };
  }
  if (score <= 40) {
    return {
      headline: "Your organization has a serious operating intelligence gap.",
      body: `${context} This is the stage where the same decisions keep being made, onboarding takes too long, and a key departure becomes a genuine crisis. The longer this continues, the more it costs.`
    };
  }
  return {
    headline: "Your organization is bleeding knowledge, and it is accelerating.",
    body: `${context} At this level, memory loss is no longer a background cost. It is actively slowing decisions, extending onboarding, and creating key-person dependency that will not resolve on its own.`
  };
}

void band;

function getShareText(score: number, segment: string, bandLabel: string): string {
  return `I scored ${score}/50 on the Saberra Organizational Memory Audit.\n\nResult: ${bandLabel}\nSegment: ${segment}\n\n${diagnosis(score, segment).headline}\n\nTake the free audit at saberra.com/audit`;
}

type Phase = "start" | "segment" | "questions" | "complete";

export function Audit() {
  const [phase, setPhase] = useState<Phase>("start");
  const [segment, setSegment] = useState(segments[0]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(3));
  const [copied, setCopied] = useState(false);
  const [seraInput, setSeraInput] = useState("");
  const [seraAnswer, setSeraAnswer] = useState("");
  const [seraAsked, setSeraAsked] = useState(false);

  // Kit email capture
  const [kitEmail, setKitEmail]           = useState("");
  const [kitName, setKitName]             = useState("");
  const [kitSubmitted, setKitSubmitted]   = useState(false);
  const [kitLoading, setKitLoading]       = useState(false);

  const score = useMemo(() => answers.reduce((sum, value) => sum + value, 0), [answers]);
  const { label: bandLabel } = band(score);
  const scoreBand = getScoreBand(score);
  const { headline: diagHeadline, body: diagBody } = useMemo(
    () => diagnosis(score, segment),
    [score, segment]
  );

  function updateAnswer(value: number) {
    setAnswers((current) => current.map((answer, index) => (index === questionIndex ? value : answer)));
  }

  async function handleKitSubmit() {
    if (!kitEmail.trim()) return;
    setKitLoading(true);
    await subscribeToKit(kitEmail.trim(), kitName.trim() || "there", score, bandLabel, segment);
    setKitLoading(false);
    setKitSubmitted(true);
  }

  function handleShare() {
    const text = getShareText(score, segment, bandLabel);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleSeraAsk(question?: string) {
    const q = question ?? seraInput;
    if (!q.trim()) return;
    setSeraInput(q);
    const quickQs = seraQuickQuestions[scoreBand];
    const idx = quickQs.findIndex((item) => item === q);
    if (idx !== -1) {
      setSeraAnswer(seraAnswers[scoreBand][idx]);
    } else {
      setSeraAnswer(getFallbackAnswer(scoreBand));
    }
    setSeraAsked(true);
  }

  // START SCREEN
  if (phase === "start") {
    return (
      <div className="audit-shell">
        <article className="card audit-start-card">
          <div className="eyebrow">Free diagnostic</div>
          <h2 className="serif" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.05, marginBottom: 16 }}>
            Find out where your organization is leaking.
          </h2>
          <p style={{ color: "#9db5ba", fontSize: "1.05rem", lineHeight: 1.7, maxWidth: 520, marginBottom: 32 }}>
            10 questions. Segment-specific results. See whether your memory risk is stable, early-stage, serious, or critical. Takes about 3 minutes.
          </p>
          <div className="audit-start-meta">
            <span className="audit-meta-chip">10 questions</span>
            <span className="audit-meta-chip">~3 minutes</span>
            <span className="audit-meta-chip">Shareable result</span>
          </div>
          <button
            className="btn audit-start-btn"
            onClick={() => setPhase("segment")}
          >
            Start the Memory Audit
            <span className="audit-start-arrow">&#8594;</span>
          </button>
        </article>
      </div>
    );
  }

  // SEGMENT SELECTION
  if (phase === "segment") {
    return (
      <div className="audit-shell">
        <article className="card">
          <div className="eyebrow">Step 1 of 2 before we begin</div>
          <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, marginBottom: 8 }}>
            Which best describes your organization?
          </h2>
          <p style={{ color: "#9db5ba", marginBottom: 24 }}>
            Your result will be specific to your org type.
          </p>
          <div className="audit-options">
            {segments.map((item) => (
              <button
                className={`question-tab ${segment === item ? "active" : ""}`}
                key={item}
                onClick={() => setSegment(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="cta-row" style={{ marginTop: 28 }}>
            <button className="btn btn-secondary" onClick={() => setPhase("start")}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setPhase("questions")}
            >
              Begin the audit
            </button>
          </div>
        </article>
      </div>
    );
  }

  // RESULTS
  if (phase === "complete") {
    const likelyRisks =
      score > 40
        ? [
            "A key-person departure right now would erase significant operational context. Your team would spend months reconstructing it.",
            "Repeated decisions are costing senior people hours per week they should not be spending.",
            "Tasks and risks are almost certainly escaping from meetings without any durable record."
          ]
        : score > 30
        ? [
            "Decisions may be findable only by asking the people who were in the room. That is not a system.",
            "Onboarding is likely too dependent on informal context transfer from whoever has time to help.",
            "Meeting outcomes are probably not becoming durable records, which means the gaps are accumulating."
          ]
        : [
            "Memory practices exist, but they may not compound over time or survive transitions well.",
            "Some records may be hard to query across time, especially decisions from more than six months ago.",
            "Human review may need clearer ownership before memory becomes consistently trustworthy."
          ];

    return (
      <div className="audit-shell">
        <article className="card">
          <div className="eyebrow">Your organizational memory audit result</div>
          <h2
            className="serif"
            style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", margin: "8px 0", lineHeight: 1 }}
          >
            {score} out of 50
          </h2>
          <div className="badges">
            <SourceBadge label={bandLabel} />
            <SourceBadge label={segment} />
          </div>
          <h3 style={{ marginTop: 16, marginBottom: 8 }}>{diagHeadline}</h3>
          <p style={{ color: "#d5dddf", fontSize: "1.05rem" }}>{diagBody}</p>

          <div className="risk-grid">
            <div className="eyebrow">What this likely means for your team</div>
            {likelyRisks.map((risk, i) => (
              <div key={i} className="risk-item">{risk}</div>
            ))}
          </div>

          <div className="audit-score-cta">
            {scoreBand === "critical" || scoreBand === "serious" ? (
              <div className="audit-urgency-cta">
                <p className="audit-urgency-label">
                  {scoreBand === "critical"
                    ? "Your score is critical. Most teams at this level book a call within 48 hours."
                    : "Your score shows a serious gap. Most teams at this level start with a team demo."}
                </p>
                <div className="cta-row" style={{ marginTop: 12 }}>
                  <CTAButton href="/demo">Book a team demo</CTAButton>
                  <button className="btn btn-secondary" onClick={handleShare}>
                    {copied ? "Copied to clipboard" : "Share my result"}
                  </button>
                </div>
              </div>
            ) : scoreBand === "early" ? (
              <div className="cta-row" style={{ marginTop: 24 }}>
                <CTAButton href="/notion-template">Explore the demo hub</CTAButton>
                <button className="btn btn-secondary" onClick={handleShare}>
                  {copied ? "Copied to clipboard" : "Share my result"}
                </button>
              </div>
            ) : (
              <div className="cta-row" style={{ marginTop: 24 }}>
                <CTAButton href="/founding-access">Apply for a founding spot</CTAButton>
                <button className="btn btn-secondary" onClick={handleShare}>
                  {copied ? "Copied to clipboard" : "Share my result"}
                </button>
              </div>
            )}
          </div>
        </article>

        {/* ── Kit email capture ───────────────────────────────────────────── */}
        {!kitSubmitted ? (
          <article className="card kit-capture-card">
            <div className="eyebrow">Get your recovery plan</div>
            <h3 style={{ margin: "8px 0 6px" }}>Send this result + a 3-part action plan to your inbox</h3>
            <p style={{ color: "#9bb4b8", fontSize: "0.95rem", marginBottom: 20 }}>
              You will receive your score breakdown, a story from a team at your exact risk level, and a clear picture of what fixing it looks like. No pitch. Just context.
            </p>
            <div className="kit-form-row">
              <input
                type="text"
                className="sera-input"
                placeholder="First name"
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
                style={{ flex: "0 0 140px" }}
              />
              <input
                type="email"
                className="sera-input"
                placeholder="Work email"
                value={kitEmail}
                onChange={(e) => setKitEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleKitSubmit(); }}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                disabled={!kitEmail.trim() || kitLoading}
                onClick={handleKitSubmit}
              >
                {kitLoading ? "Sending..." : "Send it"}
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#5a7a7f", marginTop: 10 }}>
              No spam. Unsubscribe any time. Your data stays with you.
            </p>
          </article>
        ) : (
          <article className="card kit-capture-card">
            <h3 style={{ margin: "8px 0 6px" }}>Check your inbox</h3>
            <p style={{ color: "#9bb4b8", fontSize: "0.95rem" }}>
              Your audit result and 3-part recovery plan are on the way to {kitEmail}. Email 1 arrives in the next few minutes.
            </p>
          </article>
        )}

        <article className="card sera-ask-card">
          <div className="eyebrow">Ask Sera about your result</div>
          <p className="sera-ask-hint">
            Select a question or type your own. Sera will answer from what your score suggests about your situation.
          </p>
          <div className="sera-quick-questions">
            {seraQuickQuestions[scoreBand].map((q) => (
              <button
                key={q}
                className={`question-tab${seraInput === q ? " active" : ""}`}
                onClick={() => handleSeraAsk(q)}
              >
                {q}
              </button>
            ))}
          </div>
          {!seraAsked && (
            <div className="sera-input-row">
              <input
                type="text"
                className="sera-input"
                placeholder="Or type your own question..."
                value={seraInput}
                onChange={(e) => setSeraInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSeraAsk(); }}
              />
              <button className="btn btn-primary" onClick={() => handleSeraAsk()} disabled={!seraInput.trim()}>
                Ask
              </button>
            </div>
          )}
          {seraAsked && seraAnswer && (
            <div className="sera-response">
              <div className="eyebrow">Sera</div>
              <p>{seraAnswer}</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => { setSeraAsked(false); setSeraInput(""); setSeraAnswer(""); }}
              >
                Ask another question
              </button>
            </div>
          )}
        </article>
      </div>
    );
  }

  // QUESTIONS (phase === "questions")
  const progress = Math.round(((questionIndex) / questions.length) * 100);

  return (
    <div className="audit-shell">
      <div className="audit-progress" aria-label="Audit progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <article className="card">
        <div className="eyebrow">
          Question {questionIndex + 1} of {questions.length}
        </div>
        <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 5vw, 3.4rem)", lineHeight: 1.05 }}>
          {questions[questionIndex].text}
        </h2>
        <div className="audit-options">
          {questions[questionIndex].options.map((label, index) => {
            const value = index + 1;
            return (
              <button
                className={`score-button ${answers[questionIndex] === value ? "active" : ""}`}
                key={value}
                onClick={() => updateAnswer(value)}
              >
                <span className="score-number">{value}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="cta-row">
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (questionIndex === 0) setPhase("segment");
              else setQuestionIndex((i) => i - 1);
            }}
          >
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (questionIndex === questions.length - 1) setPhase("complete");
              else setQuestionIndex((i) => i + 1);
            }}
          >
            {questionIndex === questions.length - 1 ? "Show my result" : "Next question"}
          </button>
        </div>
      </article>
    </div>
  );
}
