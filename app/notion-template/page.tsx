import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Download, Users } from "lucide-react";
import { DemoRequestForm, NotionTemplateGateForm, WebinarWaitlistForm } from "@/components/LeadForms";

export const metadata: Metadata = {
  title: "Open the Demo Hub | Saberra",
  description:
    "Three ways to see Saberra in action: explore the Notion template yourself, join a live webinar, or book a focused team demo.",
  alternates: { canonical: "/notion-template" }
};

export default function DemoHubPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Demo hub</div>
          <h1>See Saberra in action.</h1>
          <p>
            Three ways in. Pick the one that fits where you are right now.
          </p>
        </div>
      </section>

      {/* ── THREE-PATH CHOOSER ─────────────────────────────────── */}
      <section className="section tight">
        <div className="container demo-hub-paths">

          {/* Path 1 — Notion template */}
          <div className="demo-hub-card" id="notion-template">
            <div className="demo-hub-card-header">
              <span className="demo-hub-icon"><Download size={22} aria-hidden="true" /></span>
              <div>
                <div className="demo-hub-label">Fastest</div>
                <h2 className="serif">Explore the template yourself.</h2>
              </div>
            </div>
            <p>
              Duplicate the Saberra Living Memory Hub into your own Notion workspace and see the full
              decision, task, risk, role, policy, meeting, and source structure before anything is configured.
            </p>
            <ul className="demo-hub-checklist">
              <li>Instant access on the next page</li>
              <li>Full database with sample records</li>
              <li>Duplicate into your workspace in one click</li>
            </ul>
            <NotionTemplateGateForm />
          </div>

          {/* Path 2 — Webinar */}
          <div className="demo-hub-card" id="webinar">
            <div className="demo-hub-card-header">
              <span className="demo-hub-icon"><CalendarCheck size={22} aria-hidden="true" /></span>
              <div>
                <div className="demo-hub-label">Next session</div>
                <h2 className="serif">Join a live webinar demo.</h2>
              </div>
            </div>
            <p>
              Watch Sera process a real organization&apos;s context in a small-group session. See how meetings and
              email become reviewed decisions, owned tasks, and answers your team can query. Q&amp;A included.
            </p>
            <ul className="demo-hub-checklist">
              <li>Small group, real workflow walkthrough</li>
              <li>Live Q&amp;A with the Saberra team</li>
              <li>Email confirmation when next date is set</li>
            </ul>
            <WebinarWaitlistForm />
          </div>

          {/* Path 3 — Team demo */}
          <div className="demo-hub-card demo-hub-card-featured" id="team-demo">
            <div className="demo-hub-card-header">
              <span className="demo-hub-icon"><Users size={22} aria-hidden="true" /></span>
              <div>
                <div className="demo-hub-label">Teams only</div>
                <h2 className="serif">Book a focused team demo.</h2>
              </div>
            </div>
            <p>
              Bring a real scenario: a decision that disappeared, a handoff that went wrong, a role transition
              that cost your team weeks. We map your actual operating patterns through Saberra and show you
              exactly what the record would have looked like.
            </p>
            <ul className="demo-hub-checklist">
              <li>30 minutes, your real workflow</li>
              <li>Not a generic tour</li>
              <li>For teams of 3 or more</li>
            </ul>
            <DemoRequestForm />
          </div>

        </div>
      </section>

      {/* ── BOTTOM NUDGE ──────────────────────────────────────── */}
      <section className="section tight">
        <div className="container" style={{ textAlign: "center", maxWidth: 560 }}>
          <p style={{ color: "#9bb5ba", fontSize: "0.95rem" }}>
            Not sure which fits? Start with the Notion template. It takes 2 minutes and you can book a team demo after.
          </p>
          <div className="cta-row" style={{ justifyContent: "center", marginTop: 18 }}>
            <Link className="btn btn-secondary" href="#notion-template">
              Explore the template <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
