import Image from "next/image";

type EditorialVisualProps = {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  copy: string;
};

export function EditorialVisual({ src, alt, eyebrow, title, copy }: EditorialVisualProps) {
  return (
    <figure className="editorial-visual">
      <Image src={src} alt={alt} width={1400} height={920} />
      <figcaption>
        <span className="eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        <p>{copy}</p>
      </figcaption>
    </figure>
  );
}

export function EditorialStoryStrip() {
  const visuals = [
    {
      src: "/editorial-category-map.svg",
      alt: "A category map showing why notes are not the same as institutional memory infrastructure.",
      eyebrow: "Category clarity",
      title: "Position the problem before the product.",
      copy: "Cold visitors need to see why summaries, search, and knowledge bases do not close the memory loop."
    },
    {
      src: "/editorial-memory-architecture.svg",
      alt: "A Saberra architecture visual showing scattered output becoming reviewed institutional memory.",
      eyebrow: "Mechanism",
      title: "Show the path from output to trusted memory.",
      copy: "The strongest proof is not a promise. It is a clear route from meeting output to reviewed records."
    },
    {
      src: "/editorial-audit-diagnosis.svg",
      alt: "An Organizational Memory Audit diagnosis visual showing leakage scores and risk bands.",
      eyebrow: "Action",
      title: "Give the buyer a useful first step.",
      copy: "The audit makes the invisible cost of memory loss visible before the sales conversation starts."
    }
  ];

  return (
    <section className="section tight">
      <div className="container">
        <div className="editorial-strip">
          {visuals.map((visual) => (
            <EditorialVisual key={visual.title} {...visual} />
          ))}
        </div>
      </div>
    </section>
  );
}
