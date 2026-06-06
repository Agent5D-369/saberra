import { CTABand, SectionHeader } from "@/components/UI";
import { ProcessFlow, SeraDemoSection, TrustSection } from "@/components/HomeSections";
import { SegmentMemoryVisual } from "@/components/VisualPanels";

type SegmentPageProps = {
  headline: string;
  subheadline: string;
  cta: string;
  pains: string[];
  captures: string[];
  visualType: "governance" | "nonprofit" | "consultancy";
};

export function SegmentPage({ headline, subheadline, cta, pains, captures, visualType }: SegmentPageProps) {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>{headline}</h1>
          <p>{subheadline}</p>
          <div className="cta-row">
            <a className="btn btn-primary" href="/audit">
              {cta}
            </a>
            <a className="btn btn-secondary" href="mailto:rick@amora.cr?subject=Saberra%20Memory%20Demo">
              Book a Memory Demo
            </a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <SectionHeader title="The pain is not lack of intelligence. It is lack of durable memory.">
            These teams create valuable knowledge constantly, but the record is scattered across meetings, email,
            Notion pages, and senior people.
          </SectionHeader>
          <ul className="list">
            {pains.map((pain) => (
              <li key={pain}>{pain}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section tight">
        <div className="container">
          <SegmentMemoryVisual type={visualType} />
        </div>
      </section>
      <ProcessFlow />
      <section className="section tight">
        <div className="container">
          <SectionHeader title="What Saberra preserves for this team." />
          <div className="grid-3">
            {captures.map((item) => (
              <article className="card" key={item}>
                <h3>{item}</h3>
                <p>Captured from natural work output, structured for review, and available to Sera with sources.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SeraDemoSection />
      <TrustSection />
      <section className="section">
        <div className="container">
          <CTABand title="Find the leaks in your organizational memory." copy="The audit gives you a practical diagnosis before any demo conversation." primary={cta} />
        </div>
      </section>
    </main>
  );
}
