# Living Memory Hub Content Routing Policy

**Policy Ref:** GOV-001  
**Policy Area:** Governing Purpose  
**Status:** Active  
**Review Cadence:** Annual  
**Effective Date:** 2026-05-27

---

## Purpose

This policy defines what content should and should not be routed through the Living Memory Hub (roots@amora.cr), and how the worker handles content that falls outside scope. It protects the organization from inadvertent capture of sensitive, legally privileged, or personally harmful information in Notion databases.

---

## What the Hub captures

The following email types are in scope and should flow through roots@amora.cr:

- Google Meet recordings, transcripts, and AI-generated notes
- Operational emails about projects, decisions, governance, and organizational direction
- Forwarded threads containing institutional knowledge, process documentation, or team coordination
- Best practices, how-to guides, and organizational knowledge worth preserving in the Knowledge Base
- Action items, commitments, and decisions made in organizational contexts

---

## What must NOT be routed through the Hub

The following categories must never be sent to roots@amora.cr:

**1. Legally privileged communications**
Any communication with or about legal counsel that carries attorney-client privilege. When in doubt, do not forward. If you are unsure whether a communication is privileged, ask legal counsel before forwarding.

**2. Personal health information**
Medical records, diagnoses, treatment details, or any health information about any individual, regardless of whether they are a member, staff, or external party.

**3. Personal financial account data**
Bank account numbers, credit card numbers, personal financial statements, or any credential that could enable financial fraud.

**4. Credentials and access tokens**
Passwords, API keys, OAuth tokens, MFA backup codes, or any form of system credential. These must be stored in a dedicated secrets manager.

**5. HR disciplinary proceedings**
Formal complaints, disciplinary records, termination proceedings, performance improvement plans, or any HR matter that carries legal or personal risk if disclosed.

**6. Information about minors**
Any identifiable information about individuals under 18 years of age, including children of community members.

**7. Content explicitly marked confidential by another party**
Emails or documents received from external parties that are explicitly marked "confidential" or "not for distribution" must not be forwarded without that party's consent.

---

## Worker behavior for sensitive content

The worker applies the following logic for all ingested content:

- Any content classified as Sensitive or Restricted is routed to the Sensitive Review queue for human review before any further processing.
- The worker never publishes, approves, or applies canon changes. It creates Draft/Pending/Candidate records only.
- Content that matches sensitive indicators (flagged by Claude extraction) is held in Sensitive Review until a designated reviewer approves or dismisses it.

---

## Admin controls

**Exclusion label:** To prevent a specific email from being processed, apply the Gmail label `lm-exclude` to the email before or after forwarding. The worker will skip any email carrying this label.

**Sensitive flag override:** Admins can manually flag any Notion record as Restricted in the Confidentiality Level field to restrict visibility.

**Manual removal:** If sensitive content is accidentally captured, admins should:
1. Delete the Notion record immediately
2. Archive or delete the source email from the roots@amora.cr mailbox
3. Notify affected parties if legally required

---

## Scope and authority

This policy is owned by the Governance and Coordination circle. Questions about whether specific content is in scope should be directed to the circle lead or legal counsel.

Changes to this policy require a Canon Change Request with status Pending Review and must be approved before taking effect.

---

## For the worker and AI systems

This document is authoritative for content routing decisions. When the worker or any AI assistant (including Team Claude) is uncertain about whether content should be routed through the Living Memory Hub:

1. Default to NOT routing the content.
2. Flag the uncertainty to the admin via the Sensitive Review queue.
3. Do not attempt to classify legally privileged content -- route it to Sensitive Review immediately.

The cost of under-capturing is lower than the cost of capturing privileged or harmful content.
