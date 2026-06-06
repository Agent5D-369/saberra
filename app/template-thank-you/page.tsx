import type { Metadata } from "next";
import { TemplateDeliveryCard } from "@/components/LeadForms";

export const metadata: Metadata = {
  title: "Your Notion Template",
  description: "Duplicate the Institutional Memory OS for Notion and see what the full Saberra system automates.",
  alternates: { canonical: "/template-thank-you" },
  robots: { index: false, follow: false }
};

export default function TemplateThankYouPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Structure first. Automation second.</h1>
          <p>
            Use the manual template to see what durable institutional memory requires. Then notice the work your team
            should not have to do by hand.
          </p>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <TemplateDeliveryCard />
        </div>
      </section>
    </main>
  );
}
