import { CTABand, SectionHeader } from "@/components/UI";
import { ProcessFlow, SeraDemoSection, TrustSection } from "@/components/HomeSections";
import { SegmentMemoryVisual } from "@/components/VisualPanels";

type SegmentPageProps = {
  headline: string;
  subheadline: string;
  pains: string[];
  painIntro: string;
  proofTitle: string;
  proofCopy: string;
  captures: Array<[string, string]>;
  languageTitle: string;
  language: string[];
  visualType: "governance" | "nonprofit" | "consultancy";
};

export function SegmentPage({
  headline,
  subheadline,
  painIntro,
  pains,
  proofTitle,
  proofCopy,
  captures,
  languageTitle,
  language,
  visualType
}: SegmentPageProps) {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <h1>{headline}</h1>
          <p>{subheadline}</p>
          <div className="cta-row">
            <a className="btn btn-primary" href="/notion-template">
              Get the manual Memory OS
            </a>
            <a className="btn btn-secondary" href="/demo">
              Book a 30-minute call
            </a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <SectionHeader title="The pain is not lack of intelligence. It is lack of durable memory.">
            {painIntro}
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
      <section className="section tight">
        <div className="container split">
          <article className="case-vignette segment-vignette">
            <div className="eyebrow">What changes</div>
            <h2 className="serif">{proofTitle}</h2>
            <p>{proofCopy}</p>
          </article>
          <article className="card">
            <h3>{languageTitle}</h3>
            <ul className="list">
              {language.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      <ProcessFlow />
      <section className="section tight">
        <div className="container">
          <SectionHeader title="What Saberra preserves for this team." />
          <div className="grid-3">
            {captures.map((item) => (
              <article className="card" key={item[0]}>
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SeraDemoSection />
      <TrustSection />
      <section className="section">
        <div className="container">
          <CTABand
            title="Find the leaks in your organizational memory."
            copy="Start with the manual Memory OS, then book a focused call when you want to talk through the automated capture and review loop."
          />
        </div>
      </section>
    </main>
  );
}
