import type { Metadata } from "next";
import { SegmentPage } from "@/components/SegmentPage";

export const metadata: Metadata = {
  title: "Institutional Memory for Self-Managing Teams",
  description:
    "Saberra captures governance decisions, role changes, policies, risks, and commitments for Teal, Holacracy, Sociocracy, regenerative, cooperative, and distributed governance teams.",
  alternates: { canonical: "/for-self-managing-teams" }
};

export default function SelfManagingPage() {
  return (
    <SegmentPage
      headline="Self-management without institutional memory becomes chaos management."
      subheadline="Saberra captures governance decisions, role changes, policies, risks, and commitments automatically, so distributed teams can remember what they have already agreed to."
      cta="Audit your governance memory"
      visualType="governance"
      pains={[
        "Role transitions lose context even when role descriptions are documented.",
        "Governance decisions get made, then become impossible to find six months later.",
        "Distributed authority quietly recentralizes around whoever remembers the most.",
        "Policy changes, proposals, objections, and consent records drift across tools."
      ]}
      captures={["Governance decisions", "Role changes", "Circle commitments", "Policy proposals", "Open risks", "Advice process context"]}
    />
  );
}
