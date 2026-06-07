import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { navItems } from "@/lib/site";

function BrandLogo({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <Image
      className="brand-logo"
      src={variant === "light" ? "/saberra-logo-dark-web.png" : "/saberra-logo-light-web.png"}
      alt="Saberra"
      width={520}
      height={130}
    />
  );
}

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link className="brand" href="/">
          <BrandLogo />
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-primary" href="/notion-template">
          Get the manual Memory OS <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/">
            <BrandLogo />
          </Link>
          <p>Institutional memory for teams that cannot afford to forget.</p>
        </div>
        <div>
          <strong>Product</strong>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/sera">Sera</Link>
          <Link href="/pricing">Pricing</Link>
        </div>
        <div>
          <strong>Teams</strong>
          <Link href="/teal">Teal organizations</Link>
          <Link href="/nonprofit">Nonprofits</Link>
          <Link href="/consultancy">Consultancies</Link>
        </div>
        <div>
          <strong>Trust</strong>
          <Link href="/audit">Memory Audit</Link>
          <Link href="/notion-template">Notion Template</Link>
          <Link href="/founding-access">Founding Access</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/security">Security</Link>
        </div>
        <div>
          <strong>Category</strong>
          <Link href="/institutional-memory-system">Institutional Memory System</Link>
          <Link href="/institutional-memory-infrastructure">Institutional Memory Infrastructure</Link>
          <Link href="/resources/meeting-notes-are-not-memory">Meeting Notes Are Not Memory</Link>
        </div>
      </div>
    </footer>
  );
}
