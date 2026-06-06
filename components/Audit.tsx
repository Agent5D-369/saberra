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

function band(score: number) {
  if (score <= 18) return "Stable memory base";
  if (score <= 30) return "Early memory leakage";
  if (score <= 40) return "Serious institutional memory risk";
  return "Critical knowledge bleed";
}

function diagnosis(score: number, segment: string) {
  const prefix =
    segment === "Self-managing or governance-driven team"
      ? "Your governance model needs memory that is as distributed as your authority."
      : segment === "Nonprofit or social enterprise"
        ? "Your mission depends on continuity through role changes, board cycles, and program transitions."
        : segment === "Consultancy or agency"
          ? "Your delivery quality depends on preserving client context before it concentrates in senior people."
          : segment === "Founder-led growing company"
            ? "Your team is likely outgrowing founder memory as the operating system."
            : "Your organization may be carrying hidden memory risk across meetings, email, and documentation.";

  return `${prefix} ${band(score)} means your records are ${score > 30 ? "not yet durable enough for the decisions your team is making." : "showing useful structure, with specific leaks worth closing."}`;
}

export function Audit() {
  const [segment, setSegment] = useState(segments[0]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(3));
  const score = useMemo(() => answers.reduce((sum, value) => sum + value, 0), [answers]);
  const complete = step >= questions.length;
  const progress = complete ? 100 : Math.round((step / questions.length) * 100);

  function updateAnswer(value: number) {
    setAnswers((current) => current.map((answer, index) => (index === step ? value : answer)));
  }

  if (complete) {
    const likelyRisks =
      score > 40
        ? ["Key-person departure could erase critical context.", "Repeated decisions are likely costing senior time.", "Tasks and risks may be escaping review."]
        : score > 30
          ? ["Decisions may be findable only through people.", "Onboarding likely depends on informal context transfer.", "Meeting outcomes may not become durable records."]
          : ["Memory practices exist but may not compound.", "Some records may be hard to query across time.", "Human review may need clearer ownership."];

    return (
      <div className="audit-shell">
        <article className="card">
          <div className="eyebrow">Audit result</div>
          <h2 className="serif" style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", margin: "8px 0", lineHeight: 1 }}>
            {score} out of 50
          </h2>
          <div className="badges">
            <SourceBadge label={band(score)} />
            <SourceBadge label={segment} />
          </div>
          <p style={{ color: "#d5dddf", fontSize: "1.1rem" }}>{diagnosis(score, segment)}</p>
        </article>
        <div className="grid-3">
          {likelyRisks.map((risk) => (
            <article className="card" key={risk}>
              <h3>{risk}</h3>
              <p>Recommended next step: map the records that should exist, then compare them with what your team can actually find.</p>
            </article>
          ))}
        </div>
        <article className="card">
          <h3>Turn this diagnosis into a memory map</h3>
          <p>
            The next step is a working session that maps where decisions, roles, risks, tasks, and context currently
            live, then identifies what Saberra would capture automatically.
          </p>
          <div className="cta-row">
            <CTAButton href={`mailto:rick@amora.cr?subject=Saberra%20Audit%20Result&body=Score:%20${score}%20of%2050%0ASegment:%20${encodeURIComponent(segment)}`}>
              Book a Memory Audit
            </CTAButton>
            <CTAButton href="mailto:rick@amora.cr?subject=Institutional%20Memory%20OS%20for%20Notion" variant="secondary">
              Get the Notion Template
            </CTAButton>
            <button className="btn btn-secondary" onClick={() => setStep(0)}>
              Retake audit
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
