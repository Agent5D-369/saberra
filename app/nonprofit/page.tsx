import type { Metadata } from "next";
import { SegmentPage } from "@/components/SegmentPage";

export const metadata: Metadata = {
  title: "Institutional Memory for Nonprofits",
  description:
    "Saberra preserves program decisions, board history, partner context, risks, commitments, and leadership continuity for nonprofits and social enterprises.",
  alternates: { canonical: "/nonprofit" }
};

export default function NonprofitPage() {
  return (
    <SegmentPage
      headline="Your mission should survive leadership change. Right now, it probably depends on three people."
      subheadline="Saberra preserves the decisions, board context, program risks, and partner relationships your mission depends on. Automatically. Without asking your team to adopt another tool or update another Notion page."
      visualType="nonprofit"
      painIntro="Nonprofits generate mission-critical context across board meetings, program check-ins, grant conversations, partner emails, and staff transitions. Too often, that context becomes fragile precisely when the organization needs it most: during the transition itself."
      pains={[
        "Every leadership change triggers months of context reconstruction from old minutes and scattered email threads.",
        "Program continuity depends too heavily on long-tenured people who carry institutional memory in their heads.",
        "Grant commitments, partner relationships, and donor context become hard to recover the moment the person who managed them leaves.",
        "Mission-critical risks get named in conversation, then disappear from the record before anyone can act on them."
      ]}
      proofTitle="The incoming leader should inherit context, not archaeology."
      proofCopy="A nonprofit program team used Saberra to preserve board decisions, partner commitments, grant follow-ups, and open program risks before a leadership handoff. The new lead inherited the reasoning behind the work, not just folders full of documents with no context for why anything was shaped the way it was."
      languageTitle="Built for mission continuity"
      language={[
        "Board decisions stay connected to the source conversation, not just the minutes.",
        "Program risks survive handoffs instead of disappearing into the previous person's memory.",
        "Partner and donor context stays findable even after the relationship manager changes.",
        "Grant commitments become records any staff member can inspect and act on."
      ]}
      captures={[
        ["Program decisions", "What was decided, what changed, and why it matters for delivery."],
        ["Board memory", "Board decisions, follow-ups, and governance context preserved with source trails."],
        ["Partner context", "Relationship history and commitments that should not vanish during staff changes."],
        ["Donor commitments", "Funding-related promises, deadlines, and context connected to source records."],
        ["Open risks", "Mission, program, staffing, and funding risks captured before they disappear."]
      ]}
    />
  );
}
