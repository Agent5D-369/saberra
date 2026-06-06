import type { Metadata } from "next";
import { CTAButton } from "@/components/UI";

export const metadata: Metadata = {
  title: "Founding Access Application Received",
  description: "Saberra Founding Memory Partner application confirmation.",
  alternates: { canonical: "/founding-thank-you" },
  robots: { index: false, follow: false }
};

export default function FoundingThankYouPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Application received.</h1>
          <p>
            We will review fit against the current implementation model. Saberra is best when the pain is real enough
            to justify a done-for-you memory deployment.
          </p>
          <div className="cta-row">
            <CTAButton href="/security">Review the trust model</CTAButton>
            <CTAButton href="/how-it-works" variant="secondary">
              See the pipeline
            </CTAButton>
          </div>
        </div>
      </section>
    </main>
  );
}
