import type { Metadata } from "next";
import { SegmentPage } from "@/components/SegmentPage";

export const metadata: Metadata = {
  title: "Institutional Memory for Consultancies",
  description:
    "Saberra captures client decisions, delivery context, risks, commitments, and institutional knowledge for agencies and consultancies.",
  alternates: { canonical: "/consultancy" }
};

export default function ConsultancyPage() {
  return (
    <SegmentPage
      headline="Your senior people should not be the archive. But right now, they are."
      subheadline="Saberra captures client decisions, delivery risks, open commitments, and the judgment behind the work, before it disappears into calls, inboxes, and the heads of people who cannot be in every meeting."
      visualType="consultancy"
      painIntro="Consultancies and agencies lose real margin when delivery memory lives inside senior people. The documents exist. The judgment behind them is trapped in calls, inboxes, and hallway context that never makes it into any system."
      pains={[
        "Client history lives in senior people who cannot be pulled into every delivery conversation, but they keep getting pulled in anyway.",
        "Delivery commitments get made in calls and vanish. The client remembers. Your team does not.",
        "Account transitions become expensive context reconstruction exercises instead of clean handoffs.",
        "New delivery leads inherit documentation without the reasoning that explains why anything was done the way it was."
      ]}
      proofTitle="The delivery lead changed. The client never noticed."
      proofCopy="A consultancy used Saberra to capture client decisions, delivery risks, and open commitments across calls and email threads. When the delivery lead changed mid-engagement, the full account history was searchable, without pulling the founder back into every question the new lead should have been able to answer independently."
      languageTitle="Built for delivery memory"
      language={[
        "Client decisions become records, not folklore that shifts with every retelling.",
        "Commitments made in calls become inspectable follow-through items with source context.",
        "Delivery risks stay visible across account transitions, not buried in someone's inbox.",
        "Senior judgment compounds over time instead of leaving with the person who holds it."
      ]}
      captures={[
        ["Client decisions", "Approved choices, tradeoffs, and client commitments with source citations."],
        ["Delivery risks", "Risks surfaced in calls before they turn into scope, margin, or relationship issues."],
              ["Open commitments", "Follow-through items from meetings and email, tied to owners and source context."],
        ["Project context", "The why behind delivery decisions, not just the latest project document."],
        ["Senior judgment", "Patterns and reasoning from experienced people made available to the team."]
      ]}
    />
  );
}
