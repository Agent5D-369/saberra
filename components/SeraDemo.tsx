"use client";

import { useState } from "react";
import { seraQuestions } from "@/lib/site";
import { HumanReviewBadge, SourceBackedBadge, SourceBadge } from "@/components/UI";

export function SeraDemo() {
  const [active, setActive] = useState(0);
  const selected = seraQuestions[active];

  return (
    <div className="demo-shell">
      <div className="question-list" role="tablist" aria-label="Sample Sera questions">
        {seraQuestions.map((item, index) => (
          <button
            className={`question-tab ${active === index ? "active" : ""}`}
            key={item.question}
            onClick={() => setActive(index)}
            role="tab"
            aria-selected={active === index}
          >
            {item.question}
          </button>
        ))}
      </div>
      <div className="answer-panel" role="tabpanel">
        <div className="badges" style={{ marginBottom: 14 }}>
          <HumanReviewBadge />
          <SourceBackedBadge />
        </div>
        <h3 className="serif" style={{ marginTop: 0, fontSize: "2rem", lineHeight: 1.05 }}>
          Sera answers from reviewed memory.
        </h3>
        <p>{selected.answer}</p>
        <div className="answer-sources">
          {selected.sources.map((source) => (
            <SourceBadge key={source} label={source} />
          ))}
        </div>
      </div>
    </div>
  );
}
