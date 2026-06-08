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
      alt: "Visual comparison of meeting notes, search, wikis, and institutional memory systems.",
      eyebrow: "Memory gap",
      title: "Notes capture moments. Memory preserves continuity.",
      copy: "Meeting summaries, chat search, and wikis can still leave teams asking what was decided, who owns it, and where the source lives."
    },
    {
      src: "/editorial-memory-architecture.svg",
      alt: "Saberra workflow from meeting output and email to reviewed organizational memory.",
      eyebrow: "Trusted path",
      title: "Every useful answer starts with a reviewed record.",
      copy: "Saberra turns meeting output, emails, tasks, risks, roles, and policies into structured records before Sera answers from them."
    },
    {
      src: "/editorial-audit-diagnosis.svg",
      alt: "Organizational Memory Audit report showing decision, context, task, and role memory risks.",
      eyebrow: "First step",
      title: "Find the leaks before you buy another tool.",
      copy: "The Organizational Memory Audit shows where decisions, context, tasks, and role history are already falling out of reach."
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
