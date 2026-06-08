import type { Metadata } from "next";
import { CTABand } from "@/components/UI";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Saberra privacy policy covering website forms, memory deployment data, client-owned workspaces, human review, service providers, and privacy choices.",
  alternates: { canonical: "/privacy" }
};

const effectiveDate = "June 8, 2026";

export default function PrivacyPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Privacy Policy</div>
          <h1>Your organizational memory should stay yours.</h1>
          <p>
            This policy explains what Saberra collects through this website, what may be processed during a Saberra
            deployment, and how we handle data in client-controlled tools such as Google Workspace, Notion, Railway, and
            AI provider accounts.
          </p>
          <p className="trust-line">Effective date: {effectiveDate}</p>
        </div>
      </section>

      <section className="section tight">
        <div className="container category-seo-grid">
          <aside className="card category-index" aria-label="Privacy policy sections">
            <a href="#scope">Scope</a>
            <a href="#collect">What we collect</a>
            <a href="#use">How we use information</a>
            <a href="#deployment">Deployment data</a>
            <a href="#sharing">Sharing</a>
            <a href="#rights">Your choices</a>
            <a href="#security">Security</a>
            <a href="#contact">Contact</a>
          </aside>

          <article className="category-article">
            <section id="scope">
              <h2>Scope</h2>
              <p>
                This Privacy Policy applies to Saberra.com, the Organizational Memory Audit, the manual Memory OS
                request form, demo and referral forms, founding access forms, and related communications with Saberra.
                It also explains how Saberra approaches information processed during a done-for-you deployment.
              </p>
              <p>
                This policy does not replace a signed services agreement, data processing addendum, statement of work,
                or security addendum. If a signed agreement says something different, the signed agreement controls for
                that customer relationship.
              </p>
            </section>

            <section id="collect">
              <h2>Information we collect</h2>
              <p>We collect information in a few practical ways.</p>
              <div className="grid-2">
                <article className="card">
                  <h3>Information you submit</h3>
                  <p>
                    This includes name, work email, organization, organization type, team size, current tools, Memory
                    Admin candidate, demo context, audit responses, and anything else you choose to send through a form
                    or email.
                  </p>
                </article>
                <article className="card">
                  <h3>Website and device information</h3>
                  <p>
                    Hosting, security, and form tools may process basic technical information such as IP address, browser
                    type, device information, pages requested, referral URL, timestamps, and spam-prevention signals.
                  </p>
                </article>
                <article className="card">
                  <h3>Communications</h3>
                  <p>
                    If you email us, book a call, request a resource, or respond to an outreach message, we may keep the
                    contents of that communication and related contact details.
                  </p>
                </article>
                <article className="card">
                  <h3>Deployment information</h3>
                  <p>
                    During a Saberra deployment, we may process meeting outputs, emailed transcripts, source emails,
                    decisions, tasks, risks, roles, policies, review records, and source links as needed to configure and
                    operate the memory workflow.
                  </p>
                </article>
              </div>
            </section>

            <section id="use">
              <h2>How we use information</h2>
              <p>We use information to provide, improve, secure, and communicate about Saberra. For example, we may use it to:</p>
              <ul className="list">
                <li>Send the requested Memory OS resource or respond to a demo, referral, or founding access request.</li>
                <li>Score or display Organizational Memory Audit results.</li>
                <li>Evaluate whether Saberra is a fit for your tools, team size, and memory review capacity.</li>
                <li>Configure capture inboxes, review queues, Notion records, source links, and Sera answer workflows.</li>
                <li>Provide onboarding, support, maintenance, troubleshooting, and security monitoring.</li>
                <li>Send operational updates, follow-up emails, and relevant resources.</li>
                <li>Comply with legal obligations and protect Saberra, clients, users, and the public.</li>
              </ul>
              <p>
                We do not sell personal information. We do not use client organizational memory to train a general public
                AI model.
              </p>
            </section>

            <section id="deployment">
              <h2>How deployment data is handled</h2>
              <p>
                Saberra is designed around client-controlled tools. The standard deployment uses Google Workspace, native
                Google Meet capture, a dedicated inbox, Notion, an AI provider account, Railway, and human review.
                Meeting transcripts or summaries from other meeting platforms may be processed when they are emailed
                into the dedicated capture inbox.
              </p>
              <p>
                Client memory records live in the client&apos;s Notion workspace by default. Custom deployments may use
                Postgres or other systems of record when scoped in writing. Saberra may need access to configure,
                maintain, troubleshoot, or support the workflow, but the goal is that the organizational record remains
                inspectable by the client.
              </p>
              <p>
                AI extraction creates candidate records. Human review happens before those records become trusted memory.
                Sera answers from reviewed organizational records with source context.
              </p>
            </section>

            <section id="sharing">
              <h2>How we share information</h2>
              <p>We share information only as needed for the purposes described in this policy.</p>
              <ul className="list">
                <li>
                  <strong>Service providers:</strong> We use providers such as website hosting, Formspree, email,
                  scheduling, Google Workspace, Notion, AI provider accounts, Railway, analytics or security tools, and
                  similar operational services.
                </li>
                <li>
                  <strong>Client-directed tools:</strong> During deployment, data may flow through accounts and systems
                  the client provides or authorizes.
                </li>
                <li>
                  <strong>Professional advisors:</strong> We may share information with legal, accounting, security, or
                  business advisors under appropriate confidentiality expectations.
                </li>
                <li>
                  <strong>Legal and safety reasons:</strong> We may disclose information if required by law, legal
                  process, security investigation, or to protect rights, safety, and property.
                </li>
                <li>
                  <strong>Business transfers:</strong> If Saberra is involved in a merger, acquisition, financing, or
                  sale of assets, information may be transferred as part of that transaction, subject to appropriate
                  protections.
                </li>
              </ul>
            </section>

            <section id="cookies">
              <h2>Cookies and analytics</h2>
              <p>
                Saberra.com may use basic cookies, logs, and similar technologies for site operation, security,
                spam-prevention, analytics, and performance. Third-party services embedded in or linked from the site may
                also use their own cookies or tracking technologies according to their own policies.
              </p>
              <p>
                You can usually control cookies through your browser settings. Blocking some cookies may affect form
                submissions, security checks, or site functionality.
              </p>
            </section>

            <section id="retention">
              <h2>Retention</h2>
              <p>
                We keep information for as long as reasonably needed for the purposes described in this policy, including
                providing services, responding to requests, maintaining business records, resolving disputes, improving
                security, and complying with legal obligations.
              </p>
              <p>
                Client deployment data retention may depend on the client&apos;s own Notion workspace, Google Workspace,
                Railway project, AI provider account, and any signed agreement or deletion request.
              </p>
            </section>

            <section id="rights">
              <h2>Your choices and privacy rights</h2>
              <p>
                Depending on where you live, you may have rights to request access, correction, deletion, portability,
                restriction, or objection regarding personal information. You may also have the right to opt out of
                certain sharing or marketing communications.
              </p>
              <p>
                To make a request, contact <a className="text-link" href="mailto:privacy@saberra.com">privacy@saberra.com</a>.
                We may need to verify your identity and your authority to act on behalf of an organization before
                responding. If your information is controlled by a Saberra client, we may direct the request to that
                client.
              </p>
              <p>
                We do not knowingly sell or share personal information as those terms are commonly used in U.S. consumer
                privacy laws. If that changes, we will update this policy and provide any required choices.
              </p>
            </section>

            <section id="children">
              <h2>Children</h2>
              <p>
                Saberra is designed for business and organizational use. It is not directed to children under 13, and we
                do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section id="international">
              <h2>International visitors</h2>
              <p>
                Saberra is operated from the United States. If you access the site or services from outside the United
                States, your information may be processed in the United States or other countries where our service
                providers operate.
              </p>
            </section>

            <section id="security">
              <h2>Security</h2>
              <p>
                We use reasonable administrative, technical, and organizational safeguards appropriate to the nature of
                the information we process. No system can be guaranteed perfectly secure. Clients are responsible for
                securing their own Google Workspace, Notion, Railway, AI provider, email, and related accounts.
              </p>
            </section>

            <section id="changes">
              <h2>Changes to this policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The updated version will be posted on this page with
                a new effective date. If changes are material, we may provide additional notice where appropriate.
              </p>
            </section>

            <section id="contact">
              <h2>Contact</h2>
              <p>
                Questions or privacy requests can be sent to{" "}
                <a className="text-link" href="mailto:privacy@saberra.com">privacy@saberra.com</a>.
              </p>
            </section>
          </article>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <CTABand
            title="Trust should be inspectable."
            copy="Saberra is built around reviewed records, clear sources, and client-owned workspaces."
            primary="View Security"
            primaryHref="/security"
            secondary="Read Terms"
            secondaryHref="/terms"
          />
        </div>
      </section>
    </main>
  );
}
