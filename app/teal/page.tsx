import type { Metadata } from "next";
import { SegmentPage } from "@/components/SegmentPage";

export const metadata: Metadata = {
  title: "Institutional Memory for Teal Organizations",
  description:
    "Saberra captures governance decisions, role changes, policies, risks, and commitments for Teal, Holacracy, Sociocracy, regenerative, cooperative, and distributed authority teams.",
  alternates: { canonical: "/teal" }
};

export default function TealPage() {
  return (
    <SegmentPage
      headline="Distributed authority needs durable memory."
      subheadline="Saberra captures governance decisions, role changes, policies, risks, objections, and commitments automatically, so Teal and self-managing teams can remember what they have already agreed to."
      cta="Audit your governance memory"
      visualType="governance"
      pains={[
        "Role transitions lose context even when role descriptions are documented.",
        "Circle decisions, consent records, advice process context, and policy changes drift across meetings and Notion pages.",
        "Distributed authority quietly recentralizes around whoever remembers the most.",
        "Governance history becomes hard to trust when decisions are scattered across transcripts, email, and old proposals."
      ]}
      captures={[
        "Governance decisions",
        "Role changes",
        "Circle commitments",
        "Policy proposals",
        "Open risks",
        "Advice process context"
      ]}
    />
  );
}
