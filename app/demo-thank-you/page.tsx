import type { Metadata } from "next";
import { CTAButton } from "@/components/UI";

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
          <h1>Demo request received.</h1>
          <p>
            We will review your context and respond with the next step. In the meantime, the Memory Audit is the fastest
            way to sharpen the conversation.
          </p>
          <div className="cta-row">
            <CTAButton href="/notion-template">Get the free Notion template</CTAButton>
            <CTAButton href="/how-it-works" variant="secondary">
              See how Saberra works
            </CTAButton>
          </div>
        </div>
      </section>
    </main>
  );
}
