import type { Metadata } from "next";
import { CalculatorPage } from "@/components/CalculatorPage";

export const metadata: Metadata = {
  title: "Saberra Memory Cost Calculator | Estimate the Cost of Organizational Forgetting",
  description:
    "Estimate how much time and money your team may be losing to forgotten decisions, missed tasks, unclear ownership, stale documentation, and key-person dependency. See whether Saberra is a fit.",
  alternates: { canonical: "/calculator" },
  openGraph: {
    title: "Saberra Memory Cost Calculator",
    description:
      "Estimate the hidden cost of organizational forgetting and see whether Saberra can pay for itself.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Saberra Memory Cost Calculator" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Saberra Memory Cost Calculator",
    description: "Calculate your cost of forgetting and estimate Saberra ROI.",
    images: ["/og.png"]
  }
};

export default function MemoryCostCalculatorRoute() {
  return <CalculatorPage />;
}
