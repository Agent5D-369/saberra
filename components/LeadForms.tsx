"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  submitLabel,
  formNote
}: {
  action: string;
  name: string;
  redirectPath: string;
  children: ReactNode;
  submitLabel: string;
  formNote?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("submitting");

    try {
      const response = await fetch(action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error("Form submission failed.");
      }

      router.push(redirectPath);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="lead-form card" action={action} method="POST" onSubmit={handleSubmit}>
      <HiddenFields name={name} redirectPath={redirectPath} />
      {children}
      <button className="btn btn-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : submitLabel}
      </button>
      {status === "error" ? (
        <p className="form-error" role="alert">
          The form did not submit. You can still continue to the next page, or reach Saberra directly at the contact
          below.
        </p>
      ) : null}
      <p className="form-note">
        {formNote ?? "No automatic signup. No instant access claim. Your details go directly to the Saberra founder, privately, and we respond within two business days."}
      </p>
    </form>
  );
}

export function NotionTemplateGateForm() {
  return (
    <FormShell
      action={formspreeForms.notionTemplate}
      name="Living Memory Hub Demo"
      redirectPath="/template-thank-you"
      submitLabel="Show me the demo database instructions"
      formNote="You will receive access instructions on the next page immediately."
    >
      <div className="form-grid">
        <TextField field={{ label: "Work email", name: "email", type: "email", required: true, placeholder: "you@organization.org" }} />
        <SegmentField />
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
    </FormShell>
  );
}

export function DemoRequestForm() {
  return (
    <FormShell
      action={formspreeForms.demoRequest}
      name="30-Minute Call Request"
      redirectPath="/demo-thank-you"
      submitLabel="Continue to scheduling"
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
        <span>What chaos should we map first?</span>
        <textarea name="demo_context" placeholder="Tell us about a specific decision that disappeared, a role transition that went badly, or a handoff that cost your team real time. We will use your real scenario in the call." />
      </label>
      <p className="form-note">Most calls are 30 minutes and focused on your specific workflow, not a generic product tour.</p>
    </FormShell>
  );
}

export function FoundingAccessForm() {
  return (
    <FormShell
      action={formspreeForms.foundingAccess}
      name="Founding Memory Partner Application"
      redirectPath="/founding-thank-you"
      submitLabel="Submit my application"
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
          <span>Human reviewer candidate</span>
          <input name="memory_admin" placeholder="Who could own review?" />
        </label>
      </div>
      <label className="field">
        <span>What is the most expensive memory problem you have right now?</span>
        <textarea name="why_now" required placeholder="Describe what is leaking: decisions, roles, context, key-person dependency, onboarding drag. The more specific, the better we can assess fit." />
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
      <h2 className="serif">Your demo hub is ready.</h2>
      <p>
        Open the demo database first. It includes sample records so you can see how the Living Memory Hub is meant to
        work before you make your own copy.
      </p>
      <p>
        In Notion, use the duplicate control in the top-right of the shared page. Choose your own workspace. Notion will
        copy the hub and its linked databases into your account.
      </p>
      <p>
        Want a clean version with no demo data? Duplicate the copied hub inside your own workspace, then delete the
        example records from the second copy. Keep the original demo copy as a reference while you set up your clean hub.
      </p>
      <div className="cta-row">
        {hasTemplate ? (
          <Link className="btn btn-primary" href={notionTemplateUrl}>
            Open the demo database
          </Link>
        ) : (
          <span className="btn btn-secondary">Notion duplicate link pending</span>
        )}
        <CTAButton href="/demo" variant="secondary">
          Schedule a walkthrough
        </CTAButton>
      </div>
    </article>
  );
}
