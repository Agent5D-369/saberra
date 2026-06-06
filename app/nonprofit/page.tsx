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
      headline="Program history should survive leadership change."
      subheadline="Saberra preserves the decisions, risks, relationships, board context, and program memory your mission depends on, without asking staff to adopt another tool."
      cta="Audit your organizational memory"
      visualType="nonprofit"
      pains={[
        "Board history is reconstructed from old minutes and scattered email threads.",
        "Program continuity depends too heavily on long-tenured people.",
        "Grant, partner, donor, and stakeholder context is hard to recover during transitions.",
        "Mission-critical risks get noticed in conversation, then disappear from the record."
      ]}
      captures={[
        "Program decisions",
        "Board memory",
        "Partner context",
        "Donor commitments",
        "Open risks",
        "Leadership transitions"
      ]}
    />
  );
}
