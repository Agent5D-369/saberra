import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { formspreeForms, notionTemplateUrl, siteUrl } from "@/lib/site";
import { CTAButton } from "@/components/UI";

type Field = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  placeholder?: string;
};

const commonFields: Field[] = [
  { label: "Work email", name: "email", type: "email", required: true, placeholder: "you@organization.org" },
  { label: "Name", name: "name", required: true, placeholder: "Your name" },
  { label: "Organization", name: "organization", required: true, placeholder: "Organization name" }
];

const organizationTypes = [
  "Self-managing or governance-driven team",
  "Nonprofit or social enterprise",
  "Consultancy or agency",
  "Founder-led growing company",
  "Other"
];

function HiddenFields({ name, redirectPath }: { name: string; redirectPath: string }) {
  return (
    <>
      <input type="hidden" name="_subject" value={`Saberra: ${name}`} />
      <input type="hidden" name="_next" value={`${siteUrl}${redirectPath}`} />
      <input type="text" name="_gotcha" className="bot-field" tabIndex={-1} autoComplete="off" />
    </>
  );
}

function TextField({ field }: { field: Field }) {
  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        name={field.name}
        type={field.type ?? "text"}
        required={field.required}
        placeholder={field.placeholder}
      />
    </label>
  );
}

function SegmentField() {
  return (
    <label className="field">
      <span>Organization type</span>
      <select name="organization_type" required defaultValue="">
        <option value="" disabled>
          Select one
        </option>
        {organizationTypes.map((item) => (
          <option value={item} key={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormShell({
  action,
  name,
  redirectPath,
  children,
  submitLabel
}: {
  action: string;
  name: string;
  redirectPath: string;
  children: ReactNode;
  submitLabel: string;
}) {
  return (
    <form className="lead-form card" action={action} method="POST">
      <HiddenFields name={name} redirectPath={redirectPath} />
      {children}
      <button className="btn btn-primary" type="submit">
        {submitLabel}
      </button>
      <p className="form-note">
        No self-serve signup. No automatic access claim. We use this information to send the requested resource or
        respond to your request.
      </p>
    </form>
  );
}

export function NotionTemplateGateForm() {
  return (
    <FormShell
      action={formspreeForms.notionTemplate}
      name="Institutional Memory OS for Notion"
      redirectPath="/template-thank-you"
      submitLabel="Send me the Memory OS"
    >
      <div className="form-grid">
        {commonFields.map((field) => (
          <TextField field={field} key={field.name} />
        ))}
        <SegmentField />
        <label className="field">
          <span>Team size</span>
          <select name="team_size" required defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            <option>1 to 14</option>
            <option>15 to 30</option>
            <option>31 to 100</option>
            <option>101 to 200</option>
            <option>More than 200</option>
          </select>
        </label>
        <label className="field">
          <span>Current tools</span>
          <select name="current_tools" required defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            <option>Notion and Google Workspace</option>
            <option>Notion, not Google Workspace</option>
            <option>Google Workspace, not Notion</option>
            <option>Neither yet</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Biggest memory pain</span>
        <textarea name="memory_pain" placeholder="What keeps getting lost, re-asked, or re-decided?" />
      </label>
    </FormShell>
  );
}

export function DemoRequestForm() {
  return (
    <FormShell
      action={formspreeForms.demoRequest}
      name="30-Minute Call Request"
      redirectPath="/demo-thank-you"
      submitLabel="Request a 30-minute call"
    >
      <div className="form-grid">
        {commonFields.map((field) => (
          <TextField field={field} key={field.name} />
        ))}
        <SegmentField />
        <label className="field">
          <span>Team size</span>
          <input name="team_size" placeholder="Example: 42" />
        </label>
        <label className="field">
          <span>Current stack</span>
          <input name="current_stack" placeholder="Google Workspace, Notion, other tools" />
        </label>
      </div>
      <label className="field">
        <span>What should Saberra help you remember?</span>
        <textarea name="demo_context" placeholder="Tell us about the decisions, risks, roles, or context your team cannot reliably find." />
      </label>
      <p className="form-note">Most calls are 30 minutes and focused on fit, current tools, and memory review capacity.</p>
    </FormShell>
  );
}

export function FoundingAccessForm() {
  return (
    <FormShell
      action={formspreeForms.foundingAccess}
      name="Founder-Led Memory Deployment"
      redirectPath="/founding-thank-you"
      submitLabel="Submit fit details"
    >
      <div className="form-grid">
        {commonFields.map((field) => (
          <TextField field={field} key={field.name} />
        ))}
        <SegmentField />
        <label className="field">
          <span>Team size</span>
          <input name="team_size" required placeholder="Example: 75" />
        </label>
        <label className="field">
          <span>Memory Admin candidate</span>
          <input name="memory_admin" placeholder="Who could own review?" />
        </label>
      </div>
      <label className="field">
        <span>Why now?</span>
        <textarea name="why_now" required placeholder="What memory loss pain is urgent enough to solve now?" />
      </label>
    </FormShell>
  );
}

export function TemplateDeliveryCard() {
  const hasTemplate = notionTemplateUrl.startsWith("https://");

  return (
    <article className="card light">
      <Image
        className="brand-logo brand-logo-dark"
        src="/saberra-logo-dark-web.png"
        alt="Saberra"
        width={520}
        height={130}
      />
      <h2 className="serif">Your manual memory OS is ready.</h2>
      <p>
        The template gives you the structure: 20 Notion databases, suggested views, and example records for decisions,
        risks, roles, tasks, meetings, policies, review queues, source records, and organizational context.
      </p>
      <p>
        Saberra adds the missing infrastructure: automatic capture, review routing, source traceability, weekly pulse,
        and Sera answering from the reviewed record.
      </p>
      <p>
        If your team manually maintains this for even one week, you will feel exactly why the full system exists.
      </p>
      <div className="cta-row">
        {hasTemplate ? (
          <Link className="btn btn-primary" href={notionTemplateUrl}>
            Duplicate the Memory OS
          </Link>
        ) : (
          <span className="btn btn-secondary">Notion duplicate link pending</span>
        )}
        <CTAButton href="/demo" variant="secondary">
          Book a 30-minute call
        </CTAButton>
      </div>
    </article>
  );
}
