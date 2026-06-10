import type { Metadata } from "next";
import { TemplateDeliveryCard } from "@/components/LeadForms";

export const metadata: Metadata = {
  title: "Access the Saberra Demo Database",
  description: "Open, duplicate, and clean the Saberra Living Memory Hub demo database in Notion.",
  alternates: { canonical: "/template-thank-you" },
  robots: { index: false, follow: false }
};

export default function TemplateThankYouPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>Access the Saberra Living Memory Hub demo.</h1>
          <p>
            Open the demo database, duplicate it into your Notion workspace, then make a clean copy when you are ready
            to test it with your own records.
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
