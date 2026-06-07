import type { Metadata } from "next";
import { SegmentPage } from "@/components/SegmentPage";

export const metadata: Metadata = {
  title: "Institutional Memory for Nonprofits",
  description:
    "Saberra preserves program decisions, risks, relationships, board context, and leadership history for nonprofits and social enterprises.",
  alternates: { canonical: "/for-nonprofits" }
};

export default function NonprofitsPage() {
  return (
    <SegmentPage
      headline="When a program leader leaves, the program history should not leave with them."
      subheadline="Saberra preserves the decisions, risks, relationships, and context your mission depends on."
      visualType="nonprofit"
      painIntro="Nonprofits create mission-critical context in board meetings, program check-ins, grant conversations, partner emails, and staff transitions. Too often, that context becomes fragile exactly when the organization needs continuity."
      pains={[
        "Board history is reconstructed from old minutes and scattered email threads.",
        "Program continuity depends too heavily on long-tenured people.",
        "Grant, partner, donor, and stakeholder context is hard to recover during transitions.",
        "Mission-critical risks get noticed in conversation, then disappear from the record."
      ]}
      proofTitle="Leadership change should not erase program memory."
      proofCopy="When a program lead, board chair, or operations director leaves, the incoming person should inherit more than files. They should inherit the decisions, commitments, partner context, and risks that explain why the work is shaped the way it is."
      languageTitle="Built for mission continuity"
      language={[
        "Board decisions stay connected to the source conversation.",
        "Program risks survive handoffs instead of living in memory.",
        "Partner and donor context stays findable during transitions.",
        "Grant commitments become records staff can inspect."
      ]}
      captures={[
        ["Program decisions", "What was decided, what changed, and why it matters for delivery."],
        ["Board memory", "Board decisions, follow-ups, and governance context preserved with source trails."],
        ["Partner context", "Relationship history and commitments that should not vanish during staff changes."],
        ["Donor commitments", "Funding-related promises, deadlines, and context connected to source records."],
        ["Open risks", "Mission, program, staffing, and funding risks captured before they disappear."],
        ["Leadership transitions", "Handoff memory for incoming leaders who need context fast."]
      ]}
    />
  );
}
