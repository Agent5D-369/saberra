"use client";

import { useMemo, useState } from "react";
import { CTAButton, SourceBadge } from "@/components/UI";

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

function diagnosis(score: number, segment: string): { headline: string; body: string } {
  const bandLabel = band(score).label;

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
      body: `${context} Some specific leaks are worth closing — particularly around source traceability and review ownership — but the foundation is there.`
    };
  }
  if (score <= 30) {
    return {
      headline: "Memory is leaking in specific, fixable places.",
      body: `${context} The gaps are real but addressable. The risk is that early leakage compounds quietly — decisions that disappear today become full context loss in twelve months.`
    };
  }
  if (score <= 40) {
    return {
      headline: "Your organization has a serious operating intelligence gap.",
      body: `${context} This is the stage where the same decisions keep being made, onboarding takes too long, and a key departure becomes a genuine crisis. The longer this continues, the more it costs.`
    };
  }
  return {
    headline: "Your organization is bleeding knowledge — and it's accelerating.",
    body: `${context} At this level, memory loss is no longer a background cost — it is actively slowing decisions, extending onboarding, and creating key-person dependency that will not resolve on its own.`
  };
}

function getShareText(score: number, segment: string, bandLabel: string): string {
  return `I scored ${score}/50 on the Saberra Organizational Memory Audit.\n\nResult: ${bandLabel}\nSegment: ${segment}\n\n${diagnosis(score, segment).headline}\n\nTake the free audit at saberra.com/audit`;
}

export function Audit() {
  const [segment, setSegment] = useState(segments[0]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(3));
  const [copied, setCopied] = useState(false);
  const score = useMemo(() => answers.reduce((sum, value) => sum + value, 0), [answers]);
  const complete = step >= questions.length;
  const progress = complete ? 100 : Math.round((step / questions.length) * 100);
  const { label: bandLabel } = band(score);
  const { headline: diagHeadline, body: diagBody } = useMemo(
    () => diagnosis(score, segment),
    [score, segment]
  );

  function updateAnswer(value: number) {
    setAnswers((current) => current.map((answer, index) => (index === step ? value : answer)));
  }

  function handleShare() {
    const text = getShareText(score, segment, bandLabel);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (complete) {
    const likelyRisks =
      score > 40
        ? [
            "A key-person departure right now would erase significant operational context — and your team would spend months reconstructing it.",
            "Repeated decisions are costing senior people hours per week they should not be spending.",
            "Tasks and risks are almost certainly escaping from meetings without any durable record."
          ]
        : score > 30
        ? [
            "Decisions may be findable only by asking the people who were in the room — which is not a system.",
            "Onboarding is likely too dependent on informal context transfer from whoever has time to help.",
            "Meeting outcomes are probably not becoming durable records — which means the gaps are accumulating."
          ]
        : [
            "Memory practices exist, but they may not compound over time or survive transitions well.",
            "Some records may be hard to query across time — especially decisions from more than six months ago.",
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
  
          <div style={{ marginTop: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>What this likely means for your team</div>
            {likelyRisks.map((risk, i) => (
              <div key={i} style={{ padding: "12px 16px", background: "rgba(192, 57, 43, 0.08)", borderLeft: "3px solid #C0392B", marginBottom: 10, borderRadius: 6, fontSize: "0.97rem" }}>
                {risk}
              </div>
            ))}
          </div>
          <div className="cta-row" style={{ marginTop: 28 }}>
            <CTAButton href="/founding-access">Apply for a founding spot</CTAButton>
            <button className="btn btn-secondary" onClick={handleShare}>
              {copied ? "Copied to clipboard" : "Share my result"}
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="audit-shell">
      <div className="audit-progress" aria-label="Audit progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      {step === 0 ? (
        <article className="card">
          <h2 className="serif">Which best describes your organization?</h2>
          <div className="audit-options">
            {segments.map((item) => (
              <button className={`question-tab ${segment === item ? "active" : ""}`} key={item} onClick={() => setSegment(item)}>
                {item}
              </button>
            ))}
          </div>
        </article>
      ) : null}
      <article className="card">
        <div className="eyebrow">
          Question {step + 1} of {questions.length}
        </div>
        <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 5vw, 3.4rem)", lineHeight: 1.05 }}>
          {questions[step].text}
        </h2>
        <div className="audit-options">
          {questions[step].options.map((label, index) => {
            const value = index + 1;
            return (
              <button className={`score-button ${answers[step] === value ? "active" : ""}`} key={value} onClick={() => updateAnswer(value)}>
                <span className="score-number">{value}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="cta-row">
          <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
            Back
          </button>
          <button className="btn btn-primary" onClick={() => setStep((current) => current + 1)}>
            {step === questions.length - 1 ? "Show my result" : "Next question"}
          </button>
        </div>
      </article>
    </div>
  );
}
