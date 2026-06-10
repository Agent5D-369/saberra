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
      headline="You built distributed authority because you believe in it. But right now, three people still hold most of your organization's memory."
      subheadline="That is not self-management. It is a bottleneck with better values. Saberra keeps your governance record as distributed as your governance philosophy, automatically, from the meetings and emails you already run."
      visualType="governance"
      painIntro="Self-managing teams create governance agreements constantly. The failure mode is not bad decisions. The record of those decisions drifts into transcripts, old proposals, email threads, and the memory of whoever happened to be in the room."
      pains={[
        "Distributed authority quietly recentralizes around the people who remember the most, which is the opposite of what you built.",
        "Role transitions lose context even when role descriptions are documented, because the reasoning behind them is not.",
        "Circle decisions, consent records, and advice process context scatter across meeting notes and Notion pages no one updates.",
        "Governance history becomes impossible to trust when decisions are split across transcripts, email threads, and old proposals."
      ]}
      proofTitle="Self-management breaks when memory recentralizes."
      proofCopy="A 6-person governance circle used Saberra to surface 38 decisions, 22 role records, and 14 open risks before a coordinator transition. The incoming coordinator had full context on day one. No three-month re-ramp, no dependency on whoever remembered the most."
      languageTitle="Built in governance language"
      language={[
        "Circle memory and role ownership stay visible across transitions.",
        "Consent records and objections stay connected to the source conversation.",
        "Policy changes become reviewable records, not scattered notes.",
        "Role drift is detectable before it becomes authority confusion."
      ]}
      captures={[
        ["Governance decisions", "What changed, who consented, what remains open, and where the source lives."],
        ["Role changes", "Who holds what, since when, with role history preserved through transitions."],
        ["Circle commitments", "Commitments made inside circles without forcing a second documentation step into every conversation."],
        ["Policy proposals", "Draft changes, accepted policies, and review status with source traceability."],
        ["Open risks", "Governance and operating risks surfaced before they become expensive coordination failures."]
      ]}
    />
  );
}
