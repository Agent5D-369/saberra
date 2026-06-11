"use client";

import { useState } from "react";
import { formspreeForms } from "@/lib/site";

const roles = [
  "Memory Architecture Steward",
  "Client Memory Steward",
  "Ecosystem Bridge Steward"
];

export function JobApplicationForm({ defaultRole }: { defaultRole?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch(formspreeForms.jobApplication, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json().catch(() => ({}));
        setError((json as { error?: string }).error || "Something went wrong. Please email us directly.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="job-form-success">
        <div className="job-form-success-icon">&#10003;</div>
        <h3>Application received.</h3>
        <p>
          We review every application carefully. If there is a fit, we will reach out within two weeks to start a
          conversation about the role, the work, and whether the compensation model makes sense for your situation.
        </p>
      </div>
    );
  }

  return (
    <form className="job-form" onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
      <div className="field-row">
        <label className="field">
          <span>Your name</span>
          <input name="name" required placeholder="Full name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required placeholder="you@yourorg.com" />
        </label>
      </div>

      <label className="field">
        <span>Role you are applying for</span>
        <select name="role" required defaultValue={defaultRole || ""}>
          <option value="" disabled>Select a role</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>How you found us</span>
        <input name="how_found" placeholder="Referral, conference, web search, partner network..." />
      </label>

      <label className="field">
        <span>Tell us about your most relevant experience</span>
        <textarea
          name="relevant_experience"
          required
          rows={5}
          placeholder="What work have you done that is most relevant to this role? What tools, clients, or contexts?"
        />
      </label>

      <label className="field">
        <span>Why Saberra, and why this role?</span>
        <textarea
          name="motivation"
          required
          rows={4}
          placeholder="What draws you to institutional memory work? What resonates with how Saberra approaches it?"
        />
      </label>

      <label className="field">
        <span>How you prefer to work</span>
        <textarea
          name="work_style"
          rows={3}
          placeholder="Independent contractor, part-time, project-based? Current commitments or availability?"
        />
      </label>

      <div className="field-row">
        <label className="field file-field">
          <span>Resume or CV</span>
          <input name="resume" type="file" accept=".pdf,.doc,.docx" />
          <small>PDF or Word, up to 10 MB</small>
        </label>
        <label className="field file-field">
          <span>Cover letter (optional)</span>
          <input name="cover_letter" type="file" accept=".pdf,.doc,.docx" />
          <small>PDF or Word, up to 10 MB</small>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Sending..." : "Submit application"}
        </button>
        <p className="form-note">
          We respond to every serious application within two weeks. Compensation is role-share from net collected
          revenue, not salary. We will walk through the model together before anything begins.
        </p>
      </div>
    </form>
  );
}
