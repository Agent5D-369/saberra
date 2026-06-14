import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { CheckCircle, ShieldCheck } from "lucide-react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function CTAButton({ href, children, variant = "primary" }: ButtonProps) {
  return (
    <Link className={`btn btn-${variant}`} href={href}>
      {children}
    </Link>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  children,
  center = false
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`section-header ${center ? "center" : ""}`}>
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function SourceBadge({ label }: { label: string }) {
  return <span className="source-pill">{label}</span>;
}

export function HumanReviewBadge() {
  return (
    <span className="badge">
      <CheckCircle size={14} aria-hidden="true" /> Human reviewed
    </span>
  );
}

export function SourceBackedBadge() {
  return (
    <span className="badge">
      <ShieldCheck size={14} aria-hidden="true" /> Source-backed
    </span>
  );
}

export function SeraPortrait({
  variant = "primary",
  size = "md"
}: {
  variant?: "primary" | "soft" | "environment";
  size?: "sm" | "md" | "lg";
}) {
  const src =
    variant === "environment"
      ? "/sera/sera-laptop-direct.png"
      : variant === "soft"
        ? "/sera/sera-portrait-soft.png"
        : "/sera/sera-portrait-direct.png";
  const dimensions = size === "lg" ? 420 : size === "md" ? 220 : 76;

  return (
    <Image
      className={`sera-portrait sera-portrait-${size}`}
      src={src}
      alt="Sera, Saberra's AI organizational operator"
      width={dimensions}
      height={dimensions}
      priority={size === "lg"}
    />
  );
}

const seraSceneMap = {
  dashboard: {
    src: "/sera/sera-dashboard-presenting.png",
    alt: "Sera presenting an operating intelligence dashboard"
  },
  dashboardWide: {
    src: "/sera/sera-dashboard-wide.png",
    alt: "Sera beside a Saberra dashboard with organizational signals"
  },
  meeting: {
    src: "/sera/sera-meeting-headset.png",
    alt: "Sera listening to a live meeting and organizing notes"
  },
  memory: {
    src: "/sera/sera-memory-network.png",
    alt: "Sera organizing projects, people, tasks, and decisions into memory"
  },
  cards: {
    src: "/sera/sera-memory-cards.png",
    alt: "Sera converting meeting transcripts into memory cards"
  },
  timeline: {
    src: "/sera/sera-timeline-planning.png",
    alt: "Sera planning work across a weekly operating timeline"
  },
  workflow: {
    src: "/sera/sera-workflow-board.png",
    alt: "Sera arranging workflow records on a visual board"
  },
  chat: {
    src: "/sera/sera-chat-laptop.png",
    alt: "Sera answering from reviewed memory on a laptop"
  },
  operator: {
    src: "/sera/sera-laptop-direct.png",
    alt: "Sera seated at a laptop as an AI organizational operator"
  }
} as const;

export type SeraSceneVariant = keyof typeof seraSceneMap;

export function SeraScene({
  variant,
  className = "",
  priority = false
}: {
  variant: SeraSceneVariant;
  className?: string;
  priority?: boolean;
}) {
  const scene = seraSceneMap[variant];

  return (
    <div className={`sera-scene sera-scene-${variant} ${className}`}>
      <Image
        src={scene.src}
        alt={scene.alt}
        width={1280}
        height={1280}
        priority={priority}
      />
    </div>
  );
}

export function CTABand({
  title,
  copy,
  primary = "Open the demo hub",
  primaryHref = "/notion-template",
  secondary = "Schedule a walkthrough",
  secondaryHref = "/demo"
}: {
  title: string;
  copy: string;
  primary?: string;
  primaryHref?: string;
  secondary?: string;
  secondaryHref?: string;
}) {
  return (
    <div className="cta-band">
      <h2 className="serif" style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 1 }}>
        {title}
      </h2>
      <p style={{ maxWidth: 720, color: "#d7e0e2" }}>{copy}</p>
      <div className="cta-row">
        <CTAButton href={primaryHref}>{primary}</CTAButton>
        <CTAButton href={secondaryHref} variant="secondary">
          {secondary}
        </CTAButton>
      </div>
    </div>
  );
}
