import Link from "next/link";
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

export function CTABand({
  title,
  copy,
  primary = "Get the free Notion template",
  primaryHref = "/notion-template",
  secondary = "Book a 30-minute call",
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
