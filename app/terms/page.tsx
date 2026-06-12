import type { Metadata } from "next";
import Link from "next/link";
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
            <a href="#client-tools">Client tools</a>
            <a href="#client-data">Client data</a>
            <a href="#ai">AI and Sera</a>
            <a href="#acceptable-use">Acceptable use</a>
            <a href="#payment">Payment and billing</a>
            <a href="#sla">Service levels</a>
            <a href="#offboarding">Cancellation and offboarding</a>
            <a href="#data-retention">Data retention</a>
            <a href="#governing-purpose">Governing purpose clause</a>
            <a href="#liability">Liability</a>
            <a href="#confidentiality">Confidentiality</a>
            <a href="#ip">Intellectual property</a>
            <a href="#third-parties">Third-party services</a>
            <a href="#data-processing">Data processing (GDPR / CCPA)</a>
            <a href="#disclaimers">Disclaimers</a>
            <a href="#governing-law">Governing law</a>
            <a href="#changes">Changes</a>
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

            <section id="acceptable-use">
              <h2>Acceptable use</h2>
              <p>
                The Saberra capture inbox, Sera processing pipeline, and all related services must only be used for
                content the client has the legal right to process. Specifically:
              </p>
              <ul className="list">
                <li>The capture inbox must only receive meetings, emails, and documents the client owns or has been
                    authorized to process. Forwarding third-party communications without the original sender&apos;s
                    consent may violate applicable privacy laws (including GDPR, CCPA, and equivalents). That
                    compliance obligation rests entirely with the client.</li>
                <li>Clients must not route content containing the personal data of individuals who have not consented
                    to AI processing into the Saberra pipeline unless a lawful basis exists under applicable law.</li>
                <li>Clients must not use Saberra to process content on behalf of third parties without written
                    authorization from those third parties.</li>
                <li>Sensitive categories of data (health information, financial account details, legal matter records,
                    personnel files, biometric data) should not be routed through the capture inbox unless the client
                    has implemented its own access controls and governance safeguards within its Notion backend.</li>
                <li>Clients must not attempt to circumvent, reverse-engineer, or interfere with Sera&apos;s extraction
                    logic, system health monitors, or queue infrastructure.</li>
                <li>The Saberra system must not be used to surveil individuals without their knowledge, create records
                    designed to deceive, or generate fabricated organizational history.</li>
              </ul>
              <p>
                Saberra reserves the right to suspend processing if we have reasonable grounds to believe the capture
                inbox is receiving content that violates this policy.
              </p>
            </section>

            <section id="payment">
              <h2>Payment and billing</h2>
              <p>
                <strong>Setup fees.</strong> Setup fees are invoiced at the start of the deployment or per a schedule
                in the written agreement. Unless otherwise agreed in writing, setup fees are due within 7 days of
                invoice. Work begins only after the setup invoice is paid or an explicit written exception is made.
              </p>
              <p>
                <strong>Monthly recurring fees.</strong> Monthly fees are invoiced in advance on the first day of each
                monthly period. Payment is due within 7 days of invoice. Saberra may suspend active support and Sera
                polling if payment is more than 14 days overdue. Saberra may terminate the engagement if payment is
                more than 30 days overdue after written notice.
              </p>
              <p>
                <strong>Refund policy.</strong> Setup fees are non-refundable once a deployment has begun. If Saberra
                fails to complete a deployment milestone through its own fault, a pro-rated credit may be applied
                toward future services at Saberra&apos;s discretion. Monthly fees are non-refundable for periods
                already delivered. If Saberra terminates a client&apos;s engagement without cause mid-month, a
                pro-rated refund for the unused portion of that month will be issued within 30 days.
              </p>
              <p>
                <strong>Late fees.</strong> Overdue invoices accrue interest at 1.5% per month (18% per year), or
                the maximum rate permitted by applicable law, whichever is lower, beginning 14 days after the invoice
                due date.
              </p>
              <p>
                <strong>Price changes.</strong> Saberra will provide at least 30 days&apos; written notice before
                increasing the monthly recurring fee for an active deployment. Price changes take effect at the start
                of the next monthly billing period after the notice period expires. Setup fees quoted in a signed
                agreement are not subject to increase for the scope covered by that agreement.
              </p>
              <p>
                <strong>Taxes.</strong> All fees are exclusive of applicable taxes, levies, or duties. The client is
                responsible for paying all taxes applicable to its purchase of Saberra services, excluding taxes on
                Saberra&apos;s own income.
              </p>

            </section>

            <section id="sla">
              <h2>Service levels</h2>
              <p>
                Saberra targets the following service levels for active paid deployments. These targets do not apply
                to free resources, trial periods, or suspended accounts.
              </p>
              <ul className="list">
                <li><strong>Sera processing cycle:</strong> Sera polls the capture inbox on a 3-minute cycle during
                    normal operation. Most emails are processed within 5 minutes of arrival. Processing may be delayed
                    by third-party service degradation (Railway, Google, the AI provider), which is outside
                    Saberra&apos;s control.</li>
                <li><strong>System availability target:</strong> Saberra targets 99% uptime per calendar month for
                    the Sera processing pipeline. Scheduled maintenance windows (announced at least 24 hours in
                    advance) and outages caused by third-party services are excluded from availability
                    calculations.</li>
                <li><strong>Support response times:</strong>
                  <ul className="list" style={{ marginTop: 8 }}>
                    <li>P1 (pipeline stopped more than 2 hours): response within 4 business hours.</li>
                    <li>P2 (major function degraded): response within 1 business day.</li>
                    <li>P3 (non-critical questions, configuration): response within 2 business days.</li>
                  </ul>
                </li>
                <li><strong>SLA remedy:</strong> If Saberra fails the 99% target through its own fault, the client
                    may request a pro-rated credit equal to the number of affected days at the monthly rate, applied
                    to the next invoice. Credits are the sole remedy for SLA failures.</li>
              </ul>
            </section>

            <section id="offboarding">
              <h2>Cancellation and offboarding</h2>
              <p>
                <strong>How to cancel.</strong> Either party may cancel by providing at least 30 days&apos; written
                notice. The cancellation takes effect at the end of the current monthly billing period after the
                notice period expires.
              </p>
              <p>
                <strong>Client data ownership.</strong> The client retains full ownership of all records in its own
                Notion workspace, Gmail, and Google Drive. Saberra does not hold, transfer, or retain the
                client&apos;s organizational records.
              </p>
              <p>
                <strong>Transition period.</strong> Saberra will maintain the active Railway deployment and Sera
                polling for 30 days after the effective cancellation date. During the Transition Period, the client
                should: export any Notion data it wishes to preserve, redirect or deactivate the capture inbox
                forwarding rule, remove Sera from standing meeting invites, and download any documentation it
                wishes to retain.
              </p>
              <p>
                <strong>Decommission.</strong> At the end of the Transition Period, Saberra will decommission the
                Railway project, revoke provisioned credentials, and delete cached processing data in
                Saberra-controlled systems.
              </p>
              <p>
                <strong>Termination for cause.</strong> Saberra may terminate immediately if the client materially
                breaches these terms and fails to cure within 10 days of written notice. No refund applies in
                such cases.
              </p>
            </section>

            <section id="data-retention">
              <h2>Data retention and destruction</h2>
              <p>
                All organizational records processed through Saberra are stored in the client&apos;s own accounts.
                Saberra does not maintain a separate copy. On Saberra&apos;s systems: temporary processing
                artifacts are deleted within 24 hours of successful processing; system logs are retained for 30
                days; deployment configuration is deleted within 30 days of decommission; billing records are
                retained for 7 years as required for financial compliance. Clients may request written confirmation
                of deletion within 30 days of decommission.
              </p>
            </section>

            <section id="governing-purpose">
              <h2>Governing purpose and AI advisory clause</h2>
              <p>
                Sera identifies and drafts candidate records for human review. These are proposals, not authoritative
                statements. Nothing becomes trusted organizational memory until a designated human reviewer approves
                it. Clients using the Governing Purpose Score or Collapse Health Monitor features acknowledge that
                these outputs are advisory only and do not constitute legal, financial, governance, employment, or
                therapeutic advice. They are diagnostic signals, not diagnoses.
              </p>
              <p>
                Saberra is an operational memory tool, not a governance system. Having records in Saberra does not
                create legal documentation, establish binding precedent, or substitute for formal governance
                requirements under applicable law or your organization&apos;s bylaws.
              </p>
            </section>

            <section id="liability">
              <h2>Limitation of liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Saberra will not be liable for indirect,
                incidental, special, consequential, exemplary, or punitive damages, including lost profits, lost
                revenue, lost data, business interruption, or damages arising from reliance on AI-extracted records
                that were not reviewed by a human before use.
              </p>
              <p>
                Saberra processes information and creates draft records for human review. All final decisions rest
                with the client&apos;s designated reviewers. Saberra is not liable for decisions made based on
                AI-extracted records that were not reviewed and approved, or for organizational outcomes resulting
                from failure to review records in a timely manner.
              </p>
              <p>
                Saberra&apos;s total aggregate liability will not exceed the total fees paid in the three calendar
                months preceding the event giving rise to the claim, or $100 if no paid service is involved.
              </p>
            </section>

            <section id="confidentiality">
              <h2>Confidentiality</h2>
              <p>
                Saberra will use reasonable care to protect confidential organizational information received during
                evaluation or deployment, and will use it only to provide services, support the relationship, or
                comply with law. Saberra will not disclose a client&apos;s confidential information to third
                parties except to sub-processors operating under appropriate confidentiality obligations.
              </p>
            </section>

            <section id="ip">
              <h2>Intellectual property</h2>
              <p>
                Saberra owns the Saberra name, site content, brand assets, design system, prompts, workflows,
                software, and other materials we create. During a deployment, the client receives a limited,
                non-exclusive, non-transferable right to use delivered configurations, documentation, and templates
                for its own internal operations. This does not transfer ownership of Saberra&apos;s underlying
                methods, software, brand, or reusable materials.
              </p>
            </section>

            <section id="third-parties">
              <h2>Third-party services</h2>
              <p>
                Saberra deployments depend on third-party services including Google Workspace, Anthropic (or other
                AI providers), Notion, Railway, and Formspree. These services are governed by their own terms and
                privacy policies. Saberra is not responsible for third-party outages, policy changes, pricing
                changes, data loss events, or security incidents outside Saberra&apos;s control.
              </p>
            </section>

            <section id="data-processing">
              <h2>Data processing, GDPR, and CCPA</h2>
              <p>
                In processing personal data on behalf of clients, Saberra acts as a data processor (or service
                provider under CCPA) and the client acts as the data controller (or business). Saberra processes
                personal data only on documented client instructions and only as necessary to provide the services.
              </p>
              <p>
                <strong>GDPR clients (EU/EEA).</strong> Clients subject to GDPR may request a Data Processing
                Addendum (DPA) covering Article 28 obligations at{" "}
                <a className="text-link" href="mailto:legal@saberra.com">legal@saberra.com</a>.
              </p>
              <p>
                <strong>CCPA clients (California).</strong> Saberra operates as a Service Provider and does not
                sell or share personal information received from clients. Saberra uses personal information only
                to perform contracted services, prevent fraud, and comply with legal obligations.
              </p>
              <p>
                <strong>Sub-processors.</strong> A current list is available on request at{" "}
                <a className="text-link" href="mailto:legal@saberra.com">legal@saberra.com</a>. Saberra will
                provide 30 days&apos; advance notice of material sub-processor changes.
              </p>
            </section>

            <section id="disclaimers">
              <h2>Disclaimers</h2>
              <p>
                The site, free resources, audit, templates, and services are provided on an &quot;as is&quot; and
                &quot;as available&quot; basis unless a signed agreement says otherwise. Saberra does not guarantee
                perfect extraction, uninterrupted service, error-free Sera answers, or complete records. Saberra is
                not legal, financial, tax, employment, security, or governance advice. You are responsible for
                decisions made using Saberra outputs.
              </p>
            </section>

            <section id="governing-law">
              <h2>Governing law and disputes</h2>
              <p>
                Unless a signed agreement specifies otherwise, these terms are governed by the laws of the State of
                Delaware, United States, without regard to conflict-of-law rules. Before initiating any formal
                dispute process, each party agrees to attempt informal resolution by contacting{" "}
                <a className="text-link" href="mailto:legal@saberra.com">legal@saberra.com</a> and negotiating in
                good faith for at least 30 days. If informal resolution fails, disputes will be resolved by binding
                individual arbitration administered by the AAA under its Commercial Arbitration Rules. Class actions
                are not permitted.
              </p>
            </section>

            <section id="changes">
              <h2>Changes to these terms</h2>
              <p>
                For active paid clients, Saberra will provide at least 30 days&apos; written notice of material
                changes before they take effect. Continued use after the notice period constitutes acceptance. If
                you disagree with a material change, you may cancel before it takes effect under the cancellation
                terms above with no cancellation fees.
              </p>
            </section>

            <section id="contact">
              <h2>Contact</h2>
              <p>
                Legal questions, DPA requests, and data deletion requests:{" "}
                <a className="text-link" href="mailto:legal@saberra.com">legal@saberra.com</a>
              </p>
              <p>
                Support:{" "}
                <a className="text-link" href="mailto:support@saberra.com">support@saberra.com</a>
              </p>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
