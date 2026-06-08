import type { Metadata } from "next";
import { CTABand } from "@/components/UI";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Saberra terms of service covering website use, demo requests, Memory OS resources, deployments, client tools, AI outputs, and acceptable use.",
  alternates: { canonical: "/terms" }
};

const effectiveDate = "June 8, 2026";

export default function TermsPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Terms of Service</div>
          <h1>Terms for using Saberra.com and Saberra services.</h1>
          <p>
            These terms explain the rules for using this website, requesting resources, booking calls, and working with
            Saberra on a done-for-you institutional memory deployment.
          </p>
          <p className="trust-line">Effective date: {effectiveDate}</p>
        </div>
      </section>

      <section className="section tight">
        <div className="container category-seo-grid">
          <aside className="card category-index" aria-label="Terms sections">
            <a href="#acceptance">Acceptance</a>
            <a href="#site">Website use</a>
            <a href="#resources">Resources</a>
            <a href="#services">Services</a>
            <a href="#client-data">Client data</a>
            <a href="#ai">AI and Sera</a>
            <a href="#payment">Payment</a>
            <a href="#liability">Liability</a>
            <a href="#contact">Contact</a>
          </aside>

          <article className="category-article">
            <section id="acceptance">
              <h2>Acceptance of these terms</h2>
              <p>
                These Terms of Service apply to your use of Saberra.com, the Organizational Memory Audit, the manual
                Memory OS request, demo and referral forms, founding access forms, and any other website features,
                content, or communications that link to these terms.
              </p>
              <p>
                By using the site or requesting Saberra resources or services, you agree to these terms. If you are using
                Saberra on behalf of an organization, you represent that you have authority to act for that organization.
              </p>
              <p>
                A signed statement of work, services agreement, data processing addendum, or other written agreement may
                add to or override parts of these terms for a specific customer engagement.
              </p>
            </section>

            <section id="site">
              <h2>Website use</h2>
              <p>
                You may use Saberra.com for lawful business evaluation, resource requests, demo requests, referrals, and
                related communications. You may not use the site to:
              </p>
              <ul className="list">
                <li>Break the law or violate someone else&apos;s rights.</li>
                <li>Submit false, misleading, confidential, or unauthorized information.</li>
                <li>Interfere with site security, forms, hosting, or availability.</li>
                <li>Scrape, copy, or republish site content in a way that harms Saberra or misrepresents the source.</li>
                <li>Use Saberra marks, logos, or visuals without permission.</li>
              </ul>
            </section>

            <section id="resources">
              <h2>Free resources and templates</h2>
              <p>
                Saberra may provide free resources such as the Organizational Memory Audit, articles, diagrams, prompts,
                and the manual Institutional Memory OS for Notion. These resources are provided for evaluation and
                educational purposes.
              </p>
              <p>
                The manual Memory OS is not the full Saberra system. It does not include automated email routing,
                meeting capture, AI extraction, human review operations, source traceability automation, weekly pulse, or
                Sera retrieval unless those services are separately configured.
              </p>
              <p>
                You may use free resources inside your organization, but you may not resell, repackage, remove Saberra
                attribution from, or present them as your own commercial product without written permission.
              </p>
            </section>

            <section id="services">
              <h2>Saberra services</h2>
              <p>
                Saberra is currently delivered as a guided, done-for-you setup, not instant self-serve software. A
                deployment may include memory audit, source mapping, dedicated inbox setup, Notion memory backend
                configuration, review workflow design, Sera answer workflow, onboarding, and support.
              </p>
              <p>
                Scope, fees, timelines, deliverables, access requirements, support, cancellation, and payment terms may
                be described in a separate written agreement or invoice. If no separate agreement applies, Saberra may
                decline, pause, or stop work if required access, cooperation, payment, or review ownership is not
                provided.
              </p>
            </section>

            <section id="client-tools">
              <h2>Client tools and accounts</h2>
              <p>
                The standard deployment uses Google Workspace, native Google Meet capture, a dedicated inbox, Notion, an
                AI provider account, Railway, and related client-authorized tools. Meeting transcripts or summaries from
                other platforms may be captured when they are emailed into the dedicated capture inbox.
              </p>
              <p>
                You are responsible for obtaining, maintaining, securing, paying for, and authorizing use of the tools
                and accounts your organization provides. Saberra is not responsible for outages, data loss, permission
                changes, pricing changes, policy changes, or security issues caused by third-party tools or client
                account administration.
              </p>
            </section>

            <section id="client-data">
              <h2>Client data and memory records</h2>
              <p>
                As between Saberra and the client, the client retains ownership of its organizational records, source
                materials, meeting outputs, email context, Notion records, review decisions, and similar client-provided
                content.
              </p>
              <p>
                The client grants Saberra permission to access, process, configure, copy, transform, and route client
                data as reasonably necessary to provide the requested services, support, troubleshooting, security,
                maintenance, and related communications.
              </p>
              <p>
                Clients are responsible for ensuring they have the rights and permissions needed to provide meeting
                transcripts, emails, participant information, employee or contractor data, and other records to Saberra.
              </p>
            </section>

            <section id="ai">
              <h2>AI extraction and Sera answers</h2>
              <p>
                Saberra uses AI to help create candidate records and support Sera answers from reviewed organizational
                memory. AI extraction can make mistakes. Sera can be incomplete or wrong if the underlying record is
                incomplete, inaccurate, or not yet reviewed.
              </p>
              <p>
                Saberra does not replace human judgment. Human review is required before candidate records become trusted
                memory. Sera answers should be checked against cited sources before making important legal, financial,
                employment, governance, safety, or operational decisions.
              </p>
            </section>

            <section id="confidentiality">
              <h2>Confidentiality</h2>
              <p>
                Saberra may receive confidential organizational information during evaluation or deployment. We will use
                reasonable care to protect confidential information and use it only to provide services, support the
                relationship, comply with law, or as otherwise authorized.
              </p>
              <p>
                Confidentiality obligations may be expanded in a signed agreement. Do not submit information you are not
                authorized to share.
              </p>
            </section>

            <section id="payment">
              <h2>Fees and payment</h2>
              <p>
                Pricing shown on the site is for early guidance and may change. Actual fees, setup costs, recurring
                charges, payment schedule, taxes, expenses, and renewal terms should be confirmed in writing before a
                deployment begins.
              </p>
              <p>
                Unless otherwise agreed in writing, fees are non-refundable once work has begun. Late payments may result
                in paused work or suspended support.
              </p>
            </section>

            <section id="intellectual-property">
              <h2>Intellectual property</h2>
              <p>
                Saberra owns the Saberra name, site content, brand assets, design system, prompts, workflows, software,
                diagrams, documentation, templates, and other materials we create, except for client data and materials
                expressly owned by others.
              </p>
              <p>
                During a deployment, the client receives a limited right to use delivered configurations, documentation,
                and templates for its internal operations, subject to any signed agreement. This does not transfer
                ownership of Saberra&apos;s underlying methods, software, brand, or reusable materials.
              </p>
            </section>

            <section id="third-parties">
              <h2>Third-party services</h2>
              <p>
                Saberra depends on third-party services and client-authorized tools. Those services are governed by their
                own terms and policies. Saberra is not responsible for third-party services, but we will use reasonable
                care when configuring workflows that depend on them.
              </p>
            </section>

            <section id="disclaimers">
              <h2>Disclaimers</h2>
              <p>
                The site, free resources, audit, templates, and services are provided on an &quot;as is&quot; and
                &quot;as available&quot; basis unless a signed agreement says otherwise. Saberra does not guarantee
                perfect extraction, uninterrupted service, error-free Sera answers, complete records, or that every
                decision, task, risk, role, or policy will be captured.
              </p>
              <p>
                Saberra is not legal, financial, tax, employment, security, or governance advice. You are responsible for
                decisions made using Saberra outputs.
              </p>
            </section>

            <section id="liability">
              <h2>Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, Saberra will not be liable for indirect, incidental, special,
                consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost data, business
                interruption, or loss of goodwill.
              </p>
              <p>
                To the maximum extent permitted by law, Saberra&apos;s total liability related to the site, resources, or
                services will not exceed the amounts paid to Saberra for the specific service giving rise to the claim in
                the three months before the claim, or one hundred dollars if no paid service is involved.
              </p>
            </section>

            <section id="termination">
              <h2>Termination</h2>
              <p>
                We may suspend or terminate access to the site, resources, or services if you violate these terms,
                create security risk, fail to provide required access or payment, or use Saberra in a way that could harm
                Saberra, clients, users, or third parties.
              </p>
            </section>

            <section id="governing-law">
              <h2>Governing law</h2>
              <p>
                Unless a signed agreement says otherwise, these terms are governed by the laws of the United States and
                the state where Saberra principally operates, without regard to conflict-of-law rules. Any dispute should
                first be raised in good faith by contacting Saberra.
              </p>
            </section>

            <section id="changes">
              <h2>Changes to these terms</h2>
              <p>
                We may update these terms from time to time. The updated version will be posted on this page with a new
                effective date. Continued use of the site or services after updates means you accept the updated terms.
              </p>
            </section>

            <section id="contact">
              <h2>Contact</h2>
              <p>
                Questions about these terms can be sent to{" "}
                <a className="text-link" href="mailto:legal@saberra.com">legal@saberra.com</a>.
              </p>
            </section>
          </article>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <CTABand
            title="Need to evaluate fit and trust?"
            copy="Review the privacy policy and security page, then book a focused call when you want to discuss tools, review ownership, and deployment boundaries."
            primary="Read Privacy Policy"
            primaryHref="/privacy"
            secondary="View Security"
            secondaryHref="/security"
          />
        </div>
      </section>
    </main>
  );
}
