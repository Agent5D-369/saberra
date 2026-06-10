# Reality Feasibility Canon

This system is feasible as an MVP if these realities are accepted.

## Feasible

- `roots@amora.cr` can receive CC, BCC, and forwarded emails.
- `roots@amora.cr` can receive Google Meet asset notifications if invited to a meeting or forwarded the asset emails.
- A Railway worker can poll Gmail and process messages.
- The worker can parse Google Meet notification emails.
- The worker can create/update Notion records using the Notion API.
- The worker can call Claude API for structured extraction.
- The worker can check Google Drive/Docs access.
- The worker can send access request emails.
- The worker can retry failed assets.
- The system can be designed as a reusable product core.

## Conditional

- Roots can process a Google Meet recording/transcript/notes only if it has the link and permission to access the underlying file.
- Forwarded email gives Roots a link, not guaranteed file access.
- Google Meet recordings may arrive later than notes/transcripts.
- Gemini notes and transcripts depend on Google Workspace subscription/settings.
- Notion can serve as structured backend, but is not a full enterprise audit ledger unless the plan supports required audit/history features.
- Claude Team can be a prompt interface, but not a background automation engine.
- MCP is future-facing and optional, not required for MVP.

## Not Feasible / Do Not Promise

- Do not promise Roots can see all meetings unless invited/shared/forwarded.
- Do not promise automatic access to every recording.
- Do not promise automatic transcription of all videos without added service/cost.
- Do not promise automatic canon updates.
- Do not promise Notion relations are infinite.
- Do not promise Claude Team alone can run background automations.
- Do not promise WhatsApp ingestion unless a separate approved pathway is designed.

## Required Feasibility Check Before Build

Claude Code must confirm:

- Repo exists or must be created.
- Runtime choice.
- Railway access.
- Google Cloud OAuth project exists.
- Gmail API is enabled.
- Drive API is enabled.
- Docs API is enabled.
- Calendar API is enabled if needed.
- OAuth credentials are available for Roots.
- Notion integration token exists.
- Notion integration has access to needed databases/pages.
- Anthropic API key exists.
- Database IDs are known or need to be created.
- Postgres availability on Railway.
- Gmail labels exist or should be created by setup script.
- Staff capture policy accepted.
