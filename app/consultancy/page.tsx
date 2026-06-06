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
      headline="Client context should not live only in your best people."
      subheadline="Saberra captures client decisions, delivery context, risks, commitments, and institutional knowledge before they disappear into calls and inboxes."
      cta="Audit your delivery memory"
      visualType="consultancy"
      pains={[
        "Client history lives in senior people who cannot be in every delivery conversation.",
        "Delivery commitments get made in calls but do not always become operational records.",
        "Risks and decisions are remembered differently across the team.",
        "New delivery leads inherit documents without the judgment behind them."
      ]}
      captures={[
        "Client decisions",
        "Delivery risks",
        "Open commitments",
        "Project context",
        "Senior judgment",
        "Source-backed history"
      ]}
    />
  );
}
