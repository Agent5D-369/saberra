import type { Metadata } from "next";
import { CTAButton } from "@/components/UI";

export const metadata: Metadata = {
  title: "Application Received: Founding Memory Partner Program",
  description: "Your Saberra founding partner application has been received.",
  alternates: { canonical: "/founding-thank-you" },
  robots: { index: false, follow: false }
};

export default function FoundingThankYouPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Application received</div>
          <h1>Good. The pain is real enough to act on.</h1>
          <p>
            We will review your fit against the current deployment model and respond within two business days. Saberra
            works best when the memory loss is already costing something real: decisions that keep evaporating, context
            that keeps walking out, or a founder who is still the operating system at 40 people.
          </p>
          <p>
                While you wait: if you have not already seen the Living Memory Hub demo, it is worth ten minutes. It shows
            exactly what the record looks like after Sera organizes it and a human approves it.
          </p>
          <div className="cta-row">
            <CTAButton href="/demo">Watch Sera work</CTAButton>
            <CTAButton href="/notion-template" variant="secondary">
              Open the demo hub
            </CTAButton>
          </div>
        </div>
      </section>
    </main>
  );
}
