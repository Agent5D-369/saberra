import type { Metadata } from "next";
import { SegmentPage } from "@/components/SegmentPage";

export const metadata: Metadata = {
  title: "Institutional Memory for Consultancies",
  description:
    "Saberra captures client decisions, delivery context, risks, commitments, and institutional knowledge for agencies and consultancies.",
  alternates: { canonical: "/for-consultancies" }
};

export default function ConsultanciesPage() {
  return (
    <SegmentPage
      headline="Your best people should not be your only memory system."
      subheadline="Saberra captures client decisions, delivery context, risks, commitments, and institutional knowledge before it disappears into calls and inboxes."
      visualType="consultancy"
      painIntro="Consultancies and agencies lose margin when delivery memory lives inside senior people. The work may be documented, but the judgment behind the work is often trapped in calls, inboxes, and hallway context."
      pains={[
        "Client history lives in senior people who cannot be in every delivery conversation.",
        "Delivery commitments get made in calls but do not always become operational records.",
        "Risks and decisions are remembered differently across the team.",
        "New delivery leads inherit documents without the judgment behind them."
      ]}
      proofTitle="Your senior people should not be the archive."
      proofCopy="When a delivery lead changes, a client escalates, or a founder steps out of day-to-day work, the team should be able to find the actual decision, source, commitment, risk, and reasoning without asking the busiest person in the company."
      languageTitle="Built for delivery memory"
      language={[
        "Client decisions become records, not folklore.",
        "Commitments made in calls become inspectable follow-through.",
        "Delivery risks stay visible across account transitions.",
        "Senior judgment becomes organizational memory over time."
      ]}
      captures={[
        ["Client decisions", "Approved choices, tradeoffs, and client commitments with source citations."],
        ["Delivery risks", "Risks surfaced in calls before they turn into scope, margin, or relationship issues."],
        ["Open commitments", "Follow-through items from meetings and email, tied to owners and source context."],
        ["Project context", "The why behind delivery decisions, not just the latest project document."],
        ["Senior judgment", "Patterns and reasoning from experienced people made available to the team."],
        ["Source-backed history", "Answers grounded in records the team can inspect instead of memory debates."]
      ]}
    />
  );
}
