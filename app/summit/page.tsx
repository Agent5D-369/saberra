import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Database,
  FileSearch,
  Mail,
  MessageSquareText,
  Sparkles,
  UsersRound
} from "lucide-react";
import { siteUrl } from "@/lib/site";

const summitTitle = "June 11 AI Epidemic / Building for Life Summit";
const summitDescription =
  "A fast Saberra overview for the June 11 AI Epidemic / Building for Life event: how Sera turns conversations into human-reviewed organizational memory.";
const summitUrl = `${siteUrl}/summit/`;
const ogImageUrl = `${siteUrl}/og.png`;

export const metadata: Metadata = {
  title: summitTitle,
  description: summitDescription,
  alternates: { canonical: "/summit" },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: `${summitTitle} | Saberra`,
    description: summitDescription,
    url: summitUrl,
    siteName: "Saberra",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        secureUrl: ogImageUrl,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "Ask Sera what your organization already knows."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${summitTitle} | Saberra`,
    description: summitDescription,
    images: [ogImageUrl]
  }
};

const ctaHref = "/notion-template";
const ctaLabel = "Open the demo hub";

const memoryTypes = ["Decisions", "Tasks", "Roles", "Risks", "Policies", "People", "Projects", "Sources"];

const audienceRows = [
  ["Founders", "stop being the only archive"],
  ["Nonprofits", "preserve program and partner context"],
  ["Self-managing teams", "make roles, decisions, and governance visible"],
  ["Consultancies", "keep client memory from living in one senior person"]
];

function SummitCTA({ className = "" }: { className?: string }) {
  return (
    <Link className={`btn btn-primary summit-cta ${className}`} href={ctaHref}>
      {ctaLabel} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

function ConversationToMemoryVisual() {
  return (
    <div className="summit-visual" aria-label="Saberra turns event conversations into reviewed memory">
      <div className="summit-visual-panel">
        <div className="summit-mini-title">
          <MessageSquareText size={16} aria-hidden="true" /> Conversations
        </div>
        <div className="summit-fragments">
          <span>meeting notes</span>
          <span>email thread</span>
          <span>verbal decision</span>
          <span>follow-up</span>
        </div>
      </div>
      <div className="summit-sera-core">
        <Sparkles size={26} aria-hidden="true" />
        <strong>Meet Sera</strong>
        <span>AI drafts. Humans approve.</span>
      </div>
      <div className="summit-visual-panel summit-visual-panel-light">
        <div className="summit-mini-title">
          <Database size={16} aria-hidden="true" /> Living Memory Hub
        </div>
        <div className="summit-memory-grid">
          {memoryTypes.map((item) => (
            <span key={item}>
              <CheckCircle size={13} aria-hidden="true" /> {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SummitPage() {
  return (
    <main className="summit-page">
      <section className="summit-hero">
        <div className="container summit-hero-grid">
          <div className="summit-hero-copy">
            <div className="summit-event-line">AI Epidemic / Building for Life · June 11</div>
            <h1>Turn event conversations into living organizational memory.</h1>
            <p>
              Saberra gives your organization Sera: an AI secretary that listens to meetings and email, drafts the
              operating record, and routes it through human review before anyone treats it as trusted memory.
            </p>
            <div className="summit-proof-line">
              <span>
                <ClipboardCheck size={16} aria-hidden="true" /> Human-reviewed
              </span>
              <span>
                <FileSearch size={16} aria-hidden="true" /> Source-backed
              </span>
            </div>
            <SummitCTA />
          </div>
          <ConversationToMemoryVisual />
        </div>
      </section>

      <section className="section tight summit-minute">
        <div className="container summit-minute-grid">
          <div>
            <h2 className="serif">Saberra in under a minute.</h2>
            <p>
              Most teams do not have an intelligence problem. They have a memory problem. The important parts of the
              work are said in meetings, buried in email, half-copied into Notion, or held in one person&apos;s head.
            </p>
          </div>
          <div className="summit-steps" aria-label="Three step explanation">
            <article>
              <Mail size={22} aria-hidden="true" />
              <h3>Capture what already happened.</h3>
              <p>Meetings, transcripts, and important email context flow into one reviewable intake path.</p>
            </article>
            <article>
              <Sparkles size={22} aria-hidden="true" />
              <h3>Sera structures the signal.</h3>
              <p>She drafts decisions, tasks, risks, roles, policies, people, projects, and source records.</p>
            </article>
            <article>
              <ClipboardCheck size={22} aria-hidden="true" />
              <h3>People approve the memory.</h3>
              <p>Only reviewed records become the trusted base Sera can answer from later.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section tight summit-fit">
        <div className="container summit-fit-grid">
          <div>
            <h2 className="serif">Built for teams where context loss is expensive.</h2>
          </div>
          <div className="summit-audience-list">
            {audienceRows.map(([group, copy]) => (
              <div className="summit-audience-row" key={group}>
                <UsersRound size={18} aria-hidden="true" />
                <strong>{group}</strong>
                <span>{copy}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight summit-final">
        <div className="container">
          <div className="summit-final-band">
            <h2 className="serif">Want to inspect the system instead of hear another pitch?</h2>
            <p>Open the demo hub and see the kind of reviewed memory Sera creates.</p>
            <SummitCTA className="summit-final-button" />
          </div>
        </div>
      </section>
    </main>
  );
}
