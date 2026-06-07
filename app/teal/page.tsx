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
      visualType="governance"
      painIntro="Self-managing teams create agreements constantly. The risk is that the record drifts across meeting notes, old proposals, email threads, and the memory of whoever was in the room."
      pains={[
        "Role transitions lose context even when role descriptions are documented.",
        "Circle decisions, consent records, advice process context, and policy changes drift across meetings and Notion pages.",
        "Distributed authority quietly recentralizes around whoever remembers the most.",
        "Governance history becomes hard to trust when decisions are scattered across transcripts, email, and old proposals."
      ]}
      proofTitle="Self-management breaks when memory recentralizes."
      proofCopy="A governance-driven team should not need the same three people to remember every role change, consent decision, and open objection. Saberra keeps the record durable enough for authority to stay distributed."
      languageTitle="Built in governance language"
      language={[
        "Circle memory and role ownership stay visible.",
        "Consent records and objections stay connected to sources.",
        "Policy changes become reviewable memory, not scattered notes.",
        "Role drift is easier to detect before it becomes confusion."
      ]}
      captures={[
        ["Governance decisions", "What changed, who consented, what remains open, and where the source lives."],
        ["Role changes", "Who holds what, since when, with role history preserved through transitions."],
        ["Circle commitments", "Commitments made inside circles without forcing a second documentation workflow."],
        ["Policy proposals", "Draft changes, accepted policies, and review status with source traceability."],
        ["Open risks", "Governance and operating risks surfaced before they become expensive coordination failures."],
        ["Advice process context", "Reasoning, input, and commitments connected to the decision that followed."]
      ]}
    />
  );
}
