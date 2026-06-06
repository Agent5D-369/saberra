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
      cta="Audit your organizational memory"
      pains={[
        "Board history is reconstructed from old minutes and scattered email threads.",
        "Program continuity depends too heavily on long-tenured people.",
        "Grant, partner, donor, and stakeholder context is hard to recover during transitions.",
        "Mission-critical risks get noticed in conversation, then disappear from the record."
      ]}
      captures={["Program decisions", "Board memory", "Partner context", "Donor commitments", "Open risks", "Leadership transitions"]}
    />
  );
}
