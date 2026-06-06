import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { navItems } from "@/lib/site";

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link className="brand" href="/">
          <span className="mark">S</span>
          <span>Saberra</span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-primary" href="/audit">
          Take the Memory Audit <ArrowRight size={16} aria-hidden="true" />
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
            <span className="mark">S</span>
            <span>Saberra</span>
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
          <Link href="/for-self-managing-teams">Self-managing teams</Link>
          <Link href="/for-nonprofits">Nonprofits</Link>
          <Link href="/for-consultancies">Consultancies</Link>
        </div>
        <div>
          <strong>Trust</strong>
          <Link href="/audit">Memory Audit</Link>
          <Link href="/notion-template">Notion Template</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/security">Security</Link>
        </div>
      </div>
    </footer>
  );
}
