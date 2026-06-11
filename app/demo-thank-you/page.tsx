import type { Metadata } from "next";
import { CTAButton } from "@/components/UI";
import { demoCalendarUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Demo Request Received",
  description: "Saberra demo request confirmation.",
  alternates: { canonical: "/demo-thank-you" },
  robots: { index: false, follow: false }
};

export default function DemoThankYouPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Next step: schedule your 30-minute demo.</h1>
          <p>
            Pick a slot on the calendar, then bring one or two examples of decisions, tasks, risks, roles, or context
            your team cannot reliably find. The walkthrough will focus on how Sera would organize that chaos into
            human-reviewed operating intelligence.
          </p>
          <div className="cta-row">
            <CTAButton href={demoCalendarUrl}>Schedule your demo slot</CTAButton>
            <CTAButton href="/notion-template" variant="secondary">
              Open the demo hub while you wait
            </CTAButton>
          </div>
        </div>
      </section>
    </main>
  );
}
